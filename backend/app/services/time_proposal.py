"""
Time proposal service using Gemini AI.

This service aggregates participant availability data (busy slots, preferred slots)
and uses Google's Gemini AI to intelligently suggest optimal meeting times.
"""

import os
import json
import time
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple
from ..utils.supabase_client import get_supabase
from supabase import create_client

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    print("[WARNING] google-generativeai not installed. AI time proposals will not work.")


class TimeProposalService:
    """Service for generating AI-powered time proposals using Gemini."""

    # Minimum buffer time from now for proposed times (in minutes)
    MIN_BUFFER_MINUTES = 45  # 45 minutes minimum from current time

    def __init__(self, access_token: Optional[str] = None):
        self.supabase = get_supabase(access_token)
        
        # Initialize service role client for cross-user queries
        supabase_url = os.getenv("SUPABASE_URL")
        service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if supabase_url and service_role_key:
            self.service_role_client = create_client(supabase_url, service_role_key)
        else:
            print("[WARNING] SUPABASE_SERVICE_ROLE_KEY not found, using regular client")
            self.service_role_client = self.supabase
        
        # Configure Gemini API
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-pro")
        self.max_retries = int(os.getenv("GEMINI_MAX_RETRIES", "3"))
        
        if GENAI_AVAILABLE and self.gemini_api_key:
            genai.configure(api_key=self.gemini_api_key)
            self.model = genai.GenerativeModel(self.gemini_model)
        else:
            self.model = None
            if not self.gemini_api_key:
                print("[WARNING] GEMINI_API_KEY not set. AI proposals will not work.")
    
    def propose_times(self, event_id: str, num_suggestions: int = 5) -> List[Dict[str, Any]]:
        """
        Generate AI-powered time proposals for an event.
        
        Args:
            event_id: Event ID (UUID)
            num_suggestions: Number of time suggestions to generate
            
        Returns:
            List of proposed time slots with reasoning
            
        Raises:
            Exception: If proposal generation fails
        """
        print(f"[TIME_PROPOSAL] Generating {num_suggestions} proposals for event {event_id}")
        
        # Check if Gemini is available
        if not GENAI_AVAILABLE:
            raise Exception("Gemini AI library not installed. Please install google-generativeai.")
        
        if not self.model:
            raise Exception("Gemini API not configured. Please set GEMINI_API_KEY environment variable.")
        
        # 1. Aggregate participant data
        data = self._aggregate_participant_data(event_id)
        
        if not data:
            raise Exception("Failed to aggregate event data")
        
        # Validate we have participants
        if data["participant_count"] == 0:
            raise Exception("Event has no participants")
        
        # 2. Calculate free time windows (for validation/logging)
        free_windows = self._calculate_free_windows(data)
        print(f"[TIME_PROPOSAL] Found {len(free_windows)} free time windows")

        # Store free windows info in data for prompt generation
        data["free_windows"] = free_windows
        data["has_conflict_free_slots"] = len(free_windows) > 0

        # 3. Format prompt for Gemini (AI will find gaps in busy slots)
        prompt = self._format_gemini_prompt(data, num_suggestions)
        
        # 4. Call Gemini API
        response_text = self._call_gemini_api(prompt)
        
        # 5. Parse response
        proposals = self._parse_gemini_response(response_text)
        
        # 6. Validate proposals
        validated_proposals = self._validate_proposed_times(proposals, data)
        
        # 7. Format for frontend
        formatted_proposals = self._format_for_frontend(validated_proposals, data)
        
        print(f"[TIME_PROPOSAL] Successfully generated {len(formatted_proposals)} proposals")
        
        return formatted_proposals
    
    def _aggregate_participant_data(self, event_id: str) -> Optional[Dict[str, Any]]:
        """Aggregate all data needed for time proposals."""
        try:
            # Get event details
            event_result = (
                self.service_role_client.table("events")
                .select("*")
                .eq("id", event_id)
                .execute()
            )
            
            if not event_result.data:
                print(f"[ERROR] Event {event_id} not found")
                return None
            
            event = event_result.data[0]
            
            # Get participants
            participants_result = (
                self.service_role_client.table("event_participants")
                .select("user_id")
                .eq("event_id", event_id)
                .execute()
            )
            
            participant_ids = [p["user_id"] for p in participants_result.data]
            
            if not participant_ids:
                print(f"[ERROR] No participants found for event {event_id}")
                return None
            
            # Get participant profiles (including timezone)
            profiles_result = (
                self.service_role_client.table("profiles")
                .select("id, full_name, email_address, timezone")
                .in_("id", participant_ids)
                .execute()
            )
            
            profiles_map = {p["id"]: p for p in profiles_result.data}
            
            # Get busy slots for all participants
            busy_slots_result = (
                self.service_role_client.table("busy_slots")
                .select("*")
                .in_("user_id", participant_ids)
                .execute()
            )
            
            # Get preferred slots for all participants
            preferred_slots_result = (
                self.service_role_client.table("preferred_slots")
                .select("*")
                .eq("event_id", event_id)
                .execute()
            )
            
            # Organize data by participant
            participants_data = []
            for user_id in participant_ids:
                profile = profiles_map.get(user_id, {})
                user_busy = [s for s in busy_slots_result.data if s["user_id"] == user_id]
                user_preferred = [s for s in preferred_slots_result.data if s["user_id"] == user_id]

                participants_data.append({
                    "user_id": user_id,
                    "name": profile.get("full_name", "Unknown"),
                    "email": profile.get("email_address", ""),
                    "timezone": profile.get("timezone", "UTC"),
                    "busy_slots": user_busy,
                    "preferred_slots": user_preferred
                })
            
            return {
                "event": event,
                "participants": participants_data,
                "participant_count": len(participants_data),
                "all_busy_slots": busy_slots_result.data,
                "all_preferred_slots": preferred_slots_result.data
            }
            
        except Exception as e:
            print(f"[ERROR] Failed to aggregate data: {str(e)}")
            return None
    
    def _calculate_free_windows(self, data: Dict[str, Any]) -> List[Tuple[datetime, datetime]]:
        """
        Calculate time windows when all participants are free.
        
        Returns list of (start_time, end_time) tuples.
        """
        event = data["event"]
        participants = data["participants"]
        all_busy_slots = data["all_busy_slots"]
        
        # Parse event constraints from UTC timestamps
        from datetime import timezone

        # Get UTC datetime bounds from event
        if event.get("earliest_datetime_utc"):
            earliest_datetime = datetime.fromisoformat(event["earliest_datetime_utc"])
            if earliest_datetime.tzinfo is None:
                earliest_datetime = earliest_datetime.replace(tzinfo=timezone.utc)
        else:
            earliest_datetime = datetime.now(timezone.utc)

        if event.get("latest_datetime_utc"):
            latest_datetime = datetime.fromisoformat(event["latest_datetime_utc"])
            if latest_datetime.tzinfo is None:
                latest_datetime = latest_datetime.replace(tzinfo=timezone.utc)
        else:
            latest_datetime = earliest_datetime + timedelta(days=30)

        # Extract date range for iteration
        earliest_date = earliest_datetime.replace(hour=0, minute=0, second=0, microsecond=0)
        latest_date = latest_datetime.replace(hour=23, minute=59, second=59, microsecond=999999)

        # Extract time constraints from UTC timestamps
        earliest_hour_str = earliest_datetime.strftime("%H:%M:%S")
        latest_hour_str = latest_datetime.strftime("%H:%M:%S")
        
        # Duration in minutes
        duration_minutes = event.get("duration_minutes", 60)
        
        # Generate candidate time slots (every 30 minutes within constraints)
        free_windows = []
        current_date = earliest_date
        
        while current_date <= latest_date:
            # Parse time constraints for this day
            earliest_hour_parts = earliest_hour_str.split(":")
            latest_hour_parts = latest_hour_str.split(":")
            
            start_of_day = current_date.replace(
                hour=int(earliest_hour_parts[0]),
                minute=int(earliest_hour_parts[1]),
                second=0,
                microsecond=0
            )
            end_of_day = current_date.replace(
                hour=int(latest_hour_parts[0]),
                minute=int(latest_hour_parts[1]),
                second=0,
                microsecond=0
            )
            
            # Check 30-minute intervals
            current_time = start_of_day
            while current_time + timedelta(minutes=duration_minutes) <= end_of_day:
                slot_end = current_time + timedelta(minutes=duration_minutes)
                
                # Check if this slot conflicts with any participant's busy time
                is_free = True
                for busy_slot in all_busy_slots:
                    busy_start = datetime.fromisoformat(busy_slot["start_time_utc"].replace("Z", "+00:00"))
                    busy_end = datetime.fromisoformat(busy_slot["end_time_utc"].replace("Z", "+00:00"))
                    
                    # Check for overlap
                    if current_time < busy_end and slot_end > busy_start:
                        is_free = False
                        break
                
                if is_free:
                    free_windows.append((current_time, slot_end))
                
                # Move to next 30-minute slot
                current_time += timedelta(minutes=30)
            
            # Move to next day
            current_date += timedelta(days=1)
        
        return free_windows
    
    def _segment_busy_slots_by_participant_count(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Segment busy slots by the number of participants who are busy during each time period.
        
        Returns list of segments with: {start_time, end_time, participant_count}
        """
        all_busy_slots = data["all_busy_slots"]
        
        if not all_busy_slots:
            return []
        
        # Collect all time boundaries
        time_points = set()
        for slot in all_busy_slots:
            start = datetime.fromisoformat(slot["start_time_utc"].replace("Z", "+00:00"))
            end = datetime.fromisoformat(slot["end_time_utc"].replace("Z", "+00:00"))
            time_points.add(start)
            time_points.add(end)
        
        # Sort time points
        sorted_times = sorted(time_points)
        
        # For each interval between consecutive time points, count how many participants are busy
        segments = []
        for i in range(len(sorted_times) - 1):
            interval_start = sorted_times[i]
            interval_end = sorted_times[i + 1]
            
            # Count unique participants busy during this interval (any overlap counts)
            busy_user_ids = set()
            for slot in all_busy_slots:
                slot_start = datetime.fromisoformat(slot["start_time_utc"].replace("Z", "+00:00"))
                slot_end = datetime.fromisoformat(slot["end_time_utc"].replace("Z", "+00:00"))

                # Check if this slot overlaps with the interval
                if slot_start < interval_end and slot_end > interval_start:
                    busy_user_ids.add(slot["user_id"])

            busy_count = len(busy_user_ids)
            
            if busy_count > 0:
                segments.append({
                    "start_time": interval_start,
                    "end_time": interval_end,
                    "participant_count": busy_count
                })
        
        return segments
    
    def _format_gemini_prompt(
        self,
        data: Dict[str, Any],
        num_suggestions: int
    ) -> str:
        """Format a structured prompt for Gemini API."""
        event = data["event"]
        participants = data["participants"]

        # Analyze participant timezones
        timezone_counts = {}
        for p in participants:
            tz = p.get("timezone", "UTC")
            timezone_counts[tz] = timezone_counts.get(tz, 0) + 1

        # Determine primary timezone(s)
        if timezone_counts:
            primary_tz = max(timezone_counts.items(), key=lambda x: x[1])
            timezone_info = f"{primary_tz[0]} ({primary_tz[1]}/{len(participants)} participants)"
            if len(timezone_counts) > 1:
                other_tzs = [f"{tz} ({count})" for tz, count in timezone_counts.items() if tz != primary_tz[0]]
                timezone_info += f", Others: {', '.join(other_tzs)}"
        else:
            timezone_info = "UTC (default)"

        # Get segmented busy slots
        busy_segments = self._segment_busy_slots_by_participant_count(data)

        # Check if there are conflict-free slots
        has_conflict_free = data.get("has_conflict_free_slots", False)
        free_windows_count = len(data.get("free_windows", []))

        # Format datetime ranges for prompt
        earliest_dt = event.get('earliest_datetime_utc', 'N/A')
        latest_dt = event.get('latest_datetime_utc', 'N/A')

        prompt = f"""You are an expert meeting scheduling assistant. Analyze the following data and suggest the best {num_suggestions} meeting times.

EVENT DETAILS:
- Event Name: {event['name']}
- Duration: {event.get('duration_minutes', 60)} minutes
- Date/Time Range: {earliest_dt} to {latest_dt} (UTC)
- Coordinator Timezone: {event.get('coordinator_timezone', 'UTC')}
- Number of Participants: {len(participants)}
- Primary Timezone(s): {timezone_info}
- Conflict-free slots available: {"Yes" if has_conflict_free else "No"} ({free_windows_count} slots found)

PARTICIPANT TIMEZONES:
"""
        # Add individual participant timezone info
        for p in participants:
            prompt += f"- {p.get('name', 'Unknown')}: {p.get('timezone', 'UTC')}\n"

        prompt += "\nBUSY TIME SLOTS (participants with conflicts):\n"
        
        # Add busy slots information
        if busy_segments:
            # Limit to first 30 busy segments to avoid token limits
            for i, segment in enumerate(busy_segments[:30], 1):
                start_str = segment["start_time"].strftime('%Y-%m-%d %H:%M')
                end_str = segment["end_time"].strftime('%H:%M')
                count = segment["participant_count"]
                participant_text = "participant" if count == 1 else "participants"
                prompt += f"{i}. {start_str} to {end_str} UTC - {count} {participant_text} busy\n"
            
            if len(busy_segments) > 30:
                prompt += f"... and {len(busy_segments) - 30} more busy time segments\n"
        else:
            prompt += "No busy time slots - all participants are available during the event time range\n"
        
        prompt += "\n"
        
        # Add preferred slots information
        if data["all_preferred_slots"]:
            prompt += "PARTICIPANT PREFERENCES:\n"
            preference_counts = {}
            for pref in data["all_preferred_slots"]:
                key = f"{pref['start_time_utc']}|{pref['end_time_utc']}"
                preference_counts[key] = preference_counts.get(key, 0) + 1
            
            for key, count in sorted(preference_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
                start_time, end_time = key.split("|")
                start_dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
                prompt += f"- {start_dt.strftime('%Y-%m-%d %H:%M')} UTC: {count}/{len(participants)} participants prefer this time\n"
        
        prompt += f"""
REQUIREMENTS:
1. Suggest EXACTLY {num_suggestions} time slots
2. Prioritize times by availability (best to worst):
   - First priority: Times when ALL participants are free (0 conflicts)
   - Second priority: Times with 1 participant conflict
   - Third priority: Times with 2 participant conflicts
   - And so on...
3. Each suggested time slot must match the exact duration specified above
4. Prefer times that match participant preferences when possible
5. Consider participant timezones - suggest times during business hours (9 AM - 6 PM) in their local time
6. Avoid very early morning or late evening times in participants' local timezones
7. Spread suggestions across different days if possible
8. If no conflict-free times exist, still suggest the best available options but mention conflicts clearly

CONFLICT DEFINITION (IMPORTANT):
- A "conflict" means a UNIQUE participant has a busy slot that overlaps with the proposed time
- Count UNIQUE participants with conflicts, NOT total number of busy events
- Example: If Alice has 3 busy events and Bob has 1 busy event during a time slot, conflicts = 2 (not 4)
- A participant with ANY overlap counts as 1 conflict
- If 2 out of 5 participants are busy during a time slot, conflicts = 2

RESPONSE FORMAT (JSON only, no markdown):
[
  {{
    "start_time_utc": "YYYY-MM-DDTHH:MM:SSZ",
    "end_time_utc": "YYYY-MM-DDTHH:MM:SSZ",
    "conflicts": 0,
    "reasoning": "Brief explanation of why this time is optimal (mention timezone if relevant)"
  }}
]

Return ONLY the JSON array, no other text or markdown formatting.
"""
        
        return prompt
    
    def _call_gemini_api(self, prompt: str) -> str:
        """Call Gemini API with retry logic."""
        for attempt in range(self.max_retries):
            try:
                print(f"[TIME_PROPOSAL] Calling Gemini API (attempt {attempt + 1}/{self.max_retries})")
                
                response = self.model.generate_content(prompt)
                
                if not response or not response.text:
                    raise Exception("Empty response from Gemini API")
                
                return response.text
                
            except Exception as e:
                error_str = str(e).lower()
                
                # Rate limit - wait and retry
                if "quota" in error_str or "rate limit" in error_str:
                    if attempt < self.max_retries - 1:
                        wait_time = 2 ** attempt
                        print(f"[TIME_PROPOSAL] Rate limited, waiting {wait_time}s...")
                        time.sleep(wait_time)
                        continue
                    else:
                        raise Exception("Gemini API rate limit exceeded. Please try again later.")
                
                # Other errors - retry with backoff
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                else:
                    raise Exception(f"Gemini API error: {str(e)}")
        
        raise Exception("Failed to get response from Gemini API after all retries")
    
    def _parse_gemini_response(self, response_text: str) -> List[Dict[str, Any]]:
        """Parse Gemini response into structured proposals."""
        try:
            # Remove markdown code blocks if present
            cleaned_text = response_text.strip()
            if cleaned_text.startswith("```"):
                # Remove first line with ```json or ```
                lines = cleaned_text.split("\n")
                cleaned_text = "\n".join(lines[1:])
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            
            cleaned_text = cleaned_text.strip()
            
            # Parse JSON
            proposals = json.loads(cleaned_text)
            
            if not isinstance(proposals, list):
                raise ValueError("Response is not a list")
            
            return proposals
            
        except json.JSONDecodeError as e:
            print(f"[ERROR] Failed to parse Gemini response: {str(e)}")
            print(f"[ERROR] Response text: {response_text[:500]}")
            raise Exception(f"Failed to parse AI response as JSON: {str(e)}")
        except Exception as e:
            print(f"[ERROR] Error parsing response: {str(e)}")
            raise Exception(f"Failed to process AI response: {str(e)}")
    
    def _calculate_conflicts_for_time(
        self,
        start_time: datetime,
        end_time: datetime,
        all_busy_slots: List[Dict[str, Any]]
    ) -> int:
        """Calculate how many participants have conflicts for a given time slot."""
        conflicting_users = set()
        
        for busy_slot in all_busy_slots:
            busy_start = datetime.fromisoformat(busy_slot["start_time_utc"].replace("Z", "+00:00"))
            busy_end = datetime.fromisoformat(busy_slot["end_time_utc"].replace("Z", "+00:00"))
            
            # Check for overlap
            if start_time < busy_end and end_time > busy_start:
                conflicting_users.add(busy_slot["user_id"])
        
        return len(conflicting_users)
    
    def _validate_proposed_times(
        self,
        proposals: List[Dict[str, Any]],
        data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Validate proposed times against event constraints and busy slots."""
        from datetime import timezone

        event = data["event"]
        all_busy_slots = data["all_busy_slots"]
        validated = []

        # Calculate minimum allowed start time (current time + buffer)
        now_utc = datetime.now(timezone.utc)
        min_start_time = now_utc + timedelta(minutes=self.MIN_BUFFER_MINUTES)

        for proposal in proposals:
            try:
                # Validate required fields (score removed)
                if not all(k in proposal for k in ["start_time_utc", "end_time_utc", "reasoning", "conflicts"]):
                    print(f"[WARNING] Skipping proposal with missing fields: {proposal}")
                    continue

                # Parse times
                start_time = datetime.fromisoformat(proposal["start_time_utc"].replace("Z", "+00:00"))
                end_time = datetime.fromisoformat(proposal["end_time_utc"].replace("Z", "+00:00"))

                # Validate time order
                if start_time >= end_time:
                    print(f"[WARNING] Invalid time order: {proposal}")
                    continue

                # Validate proposal is not too soon (must be at least MIN_BUFFER_MINUTES from now)
                if start_time < min_start_time:
                    print(f"[WARNING] Skipping proposal too close to current time: {start_time.isoformat()} (min: {min_start_time.isoformat()})")
                    continue

                # Validate duration
                duration = (end_time - start_time).total_seconds() / 60
                expected_duration = event.get("duration_minutes", 60)
                if abs(duration - expected_duration) > 5:  # Allow 5 minute tolerance
                    print(f"[WARNING] Duration mismatch: expected {expected_duration}, got {duration}")
                    # Adjust end time to match expected duration
                    end_time = start_time + timedelta(minutes=expected_duration)
                    proposal["end_time_utc"] = end_time.isoformat().replace("+00:00", "Z")

                validated.append(proposal)

            except Exception as e:
                print(f"[WARNING] Failed to validate proposal: {str(e)}")
                continue

        return validated
    
    def _calculate_preferred_count_for_time(
        self,
        start_time: datetime,
        end_time: datetime,
        all_preferred_slots: List[Dict[str, Any]]
    ) -> int:
        """Calculate how many participants have marked this time as preferred."""
        preferring_users = set()

        for pref_slot in all_preferred_slots:
            pref_start = datetime.fromisoformat(pref_slot["start_time_utc"].replace("Z", "+00:00"))
            pref_end = datetime.fromisoformat(pref_slot["end_time_utc"].replace("Z", "+00:00"))

            # Check for overlap - if the proposed time overlaps with preferred slot
            if start_time < pref_end and end_time > pref_start:
                preferring_users.add(pref_slot["user_id"])

        return len(preferring_users)

    def _format_for_frontend(
        self,
        proposals: List[Dict[str, Any]],
        data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Format proposals for frontend consumption."""
        formatted = []
        participant_count = data["participant_count"]
        all_busy_slots = data["all_busy_slots"]
        all_preferred_slots = data.get("all_preferred_slots", [])

        # Track validation metrics for logging
        total_proposals = len(proposals)
        conflict_mismatches = 0
        conflict_mismatch_details = []

        for i, proposal in enumerate(proposals):
            start_time = datetime.fromisoformat(proposal["start_time_utc"].replace("Z", "+00:00"))
            end_time = datetime.fromisoformat(proposal["end_time_utc"].replace("Z", "+00:00"))

            # Get conflicts from AI response, or calculate if not provided
            ai_conflicts = proposal.get("conflicts", 0)

            # Verify AI's conflict count
            actual_conflicts = self._calculate_conflicts_for_time(start_time, end_time, all_busy_slots)

            # Validate conflict count doesn't exceed participant count
            if actual_conflicts > participant_count:
                print(f"[ERROR] Conflict count {actual_conflicts} exceeds participant count {participant_count} - data corruption detected")
                actual_conflicts = participant_count  # Cap at participant count

            if actual_conflicts != ai_conflicts:
                conflict_mismatches += 1
                conflict_mismatch_details.append({
                    "proposal_index": i,
                    "time_slot": f"{start_time.strftime('%Y-%m-%d %H:%M')} UTC",
                    "ai_reported": ai_conflicts,
                    "actual": actual_conflicts,
                    "difference": actual_conflicts - ai_conflicts
                })
                print(f"[AI_VALIDATION] Conflict mismatch for proposal {i}: AI={ai_conflicts}, Actual={actual_conflicts}, Time={start_time.strftime('%Y-%m-%d %H:%M')} UTC")

            conflicts = actual_conflicts  # Always use actual count

            # Calculate availability
            available_count = participant_count - conflicts

            # Calculate preferred count
            preferred_count = self._calculate_preferred_count_for_time(start_time, end_time, all_preferred_slots)

            # Format time display
            time_display = f"{start_time.strftime('%I:%M %p')} - {end_time.strftime('%I:%M %p')}"

            formatted.append({
                "id": f"ai-{i}-{start_time.isoformat()}",
                "date": proposal["start_time_utc"],
                "time": time_display,
                "start_time_utc": proposal["start_time_utc"],
                "end_time_utc": proposal["end_time_utc"],
                "reasoning": proposal.get("reasoning", "AI-generated suggestion"),
                "conflicts": conflicts,
                "availableCount": available_count,
                "preferredCount": preferred_count,
                "totalParticipants": participant_count
            })

        # Log validation summary
        if conflict_mismatches > 0:
            mismatch_rate = (conflict_mismatches / total_proposals * 100) if total_proposals > 0 else 0
            print(f"[AI_VALIDATION_SUMMARY] {conflict_mismatches}/{total_proposals} proposals had conflict count mismatches ({mismatch_rate:.1f}%)")
            print(f"[AI_VALIDATION_SUMMARY] Mismatch details: {conflict_mismatch_details}")
        else:
            print(f"[AI_VALIDATION_SUMMARY] All {total_proposals} proposals passed conflict validation ✓")

        # Sort by conflicts (ascending), then by preferredCount (descending)
        formatted.sort(key=lambda x: (x["conflicts"], -x["preferredCount"]))

        return formatted
    
    # =========================================================================
    # CACHING METHODS
    # =========================================================================
    
    def get_cached_proposals(self, event_id: str) -> Dict[str, Any]:
        """
        Retrieve cached proposals from database, filtering out past proposals.

        Returns: {
            "proposals": List of valid proposals (not in the past),
            "all_expired": True if all cached proposals are past current time,
            "total_cached": Total number of proposals in cache (before filtering),
            "filtered_count": Number of proposals after filtering out past ones
        }

        Returns {"proposals": None, "all_expired": False, "total_cached": 0, "filtered_count": 0}
        if no proposals exist.
        """
        from datetime import timezone

        try:
            # Query proposed_times table ordered by rank
            response = self.service_role_client.table("proposed_times") \
                .select("*") \
                .eq("event_id", event_id) \
                .order("rank") \
                .execute()

            if not response.data:
                print(f"[TIME_PROPOSAL_CACHE] No cached proposals found for event {event_id}")
                return {
                    "proposals": None,
                    "all_expired": False,
                    "total_cached": 0,
                    "filtered_count": 0
                }

            total_cached = len(response.data)
            print(f"[TIME_PROPOSAL_CACHE] Found {total_cached} cached proposals for event {event_id}")

            # Get participant count for formatting
            event_response = self.service_role_client.table("events") \
                .select("id") \
                .eq("id", event_id) \
                .execute()

            if not event_response.data:
                return {
                    "proposals": None,
                    "all_expired": False,
                    "total_cached": 0,
                    "filtered_count": 0
                }

            participants_response = self.service_role_client.table("event_participants") \
                .select("user_id") \
                .eq("event_id", event_id) \
                .execute()

            participant_count = len(participants_response.data) if participants_response.data else 0

            # Get preferred slots to calculate preferredCount
            preferred_slots_response = self.service_role_client.table("preferred_slots") \
                .select("*") \
                .eq("event_id", event_id) \
                .execute()

            all_preferred_slots = preferred_slots_response.data if preferred_slots_response.data else []

            # Current time for filtering past proposals
            now_utc = datetime.now(timezone.utc)

            # Format for frontend, filtering out past proposals
            formatted = []
            filtered_out_count = 0
            for i, proposal in enumerate(response.data):
                start_time = datetime.fromisoformat(proposal["start_time_utc"])
                # Ensure timezone aware for comparison
                if start_time.tzinfo is None:
                    start_time = start_time.replace(tzinfo=timezone.utc)

                # Skip proposals that are in the past
                if start_time < now_utc:
                    filtered_out_count += 1
                    print(f"[TIME_PROPOSAL_CACHE] Filtering out past proposal: {start_time.isoformat()}")
                    continue

                end_time = datetime.fromisoformat(proposal["end_time_utc"])
                if end_time.tzinfo is None:
                    end_time = end_time.replace(tzinfo=timezone.utc)

                conflicts = proposal.get("conflicts", 0)
                available_count = participant_count - conflicts

                # Calculate preferred count
                preferred_count = self._calculate_preferred_count_for_time(start_time, end_time, all_preferred_slots)

                # Format time display
                time_display = f"{start_time.strftime('%I:%M %p')} - {end_time.strftime('%I:%M %p')}"

                formatted.append({
                    "id": f"cached-{i}-{start_time.isoformat()}",
                    "date": proposal["start_time_utc"],
                    "time": time_display,
                    "start_time_utc": proposal["start_time_utc"],
                    "end_time_utc": proposal["end_time_utc"],
                    "reasoning": proposal.get("reasoning", "AI-generated suggestion"),
                    "conflicts": conflicts,
                    "availableCount": available_count,
                    "preferredCount": preferred_count,
                    "totalParticipants": participant_count
                })

            filtered_count = len(formatted)
            all_expired = total_cached > 0 and filtered_count == 0

            if all_expired:
                print(f"[TIME_PROPOSAL_CACHE] All {total_cached} cached proposals are past - regeneration needed")
            elif filtered_out_count > 0:
                print(f"[TIME_PROPOSAL_CACHE] Filtered out {filtered_out_count} past proposals, {filtered_count} remaining")

            return {
                "proposals": formatted if formatted else None,
                "all_expired": all_expired,
                "total_cached": total_cached,
                "filtered_count": filtered_count
            }

        except Exception as e:
            print(f"[TIME_PROPOSAL_CACHE] Error getting cached proposals: {str(e)}")
            return {
                "proposals": None,
                "all_expired": False,
                "total_cached": 0,
                "filtered_count": 0
            }
    
    def save_proposals_to_cache(self, event_id: str, proposals: List[Dict[str, Any]]) -> None:
        """
        Save generated proposals to database.
        Replaces any existing proposals for this event.
        """
        try:
            print(f"[TIME_PROPOSAL_CACHE] Saving {len(proposals)} proposals for event {event_id}")
            
            # Delete existing proposals for this event
            self.service_role_client.table("proposed_times") \
                .delete() \
                .eq("event_id", event_id) \
                .execute()
            
            # Insert new proposals with ranks
            proposals_to_insert = []
            for rank, proposal in enumerate(proposals):
                # Parse times to ensure proper format
                start_time = datetime.fromisoformat(proposal["start_time_utc"].replace("Z", "+00:00"))
                end_time = datetime.fromisoformat(proposal["end_time_utc"].replace("Z", "+00:00"))
                
                proposals_to_insert.append({
                    "event_id": event_id,
                    "start_time_utc": start_time.isoformat(),
                    "end_time_utc": end_time.isoformat(),
                    "conflicts": proposal.get("conflicts", 0),
                    "reasoning": proposal.get("reasoning"),
                    "rank": rank
                })
            
            if proposals_to_insert:
                self.service_role_client.table("proposed_times") \
                    .insert(proposals_to_insert) \
                    .execute()
            
            # Update events table
            self.service_role_client.table("events") \
                .update({
                    "proposals_needs_regeneration": False,
                    "proposals_last_generated_at": datetime.utcnow().isoformat()
                }) \
                .eq("id", event_id) \
                .execute()
            
            print(f"[TIME_PROPOSAL_CACHE] Successfully saved proposals for event {event_id}")
            
        except Exception as e:
            print(f"[TIME_PROPOSAL_CACHE] Error saving proposals: {str(e)}")
            raise
    
    def mark_proposals_stale(self, event_id: str) -> None:
        """
        Mark proposals as needing regeneration (for background job).
        """
        try:
            print(f"[TIME_PROPOSAL_CACHE] Marking proposals as stale for event {event_id}")
            
            self.service_role_client.table("events") \
                .update({"proposals_needs_regeneration": True}) \
                .eq("id", event_id) \
                .execute()
            
            print(f"[TIME_PROPOSAL_CACHE] Marked event {event_id} proposals as stale")
            
        except Exception as e:
            print(f"[TIME_PROPOSAL_CACHE] Error marking proposals as stale: {str(e)}")
            # Don't raise - this is not critical
    
    def regenerate_proposals_immediately(self, event_id: str, num_suggestions: int = 5) -> List[Dict[str, Any]]:
        """
        Force immediate regeneration and save to cache.
        Used for participant join/leave and manual refresh.
        """
        print(f"[TIME_PROPOSAL_CACHE] Force regenerating proposals for event {event_id}")
        
        # Generate fresh proposals
        proposals = self.propose_times(event_id, num_suggestions)
        
        # Save to cache
        self.save_proposals_to_cache(event_id, proposals)
        
        return proposals
    
    def should_regenerate(self, event_id: str) -> Dict[str, Any]:
        """
        Check if proposals need regeneration.
        Returns: {
            "needs_regeneration": bool,
            "has_proposals": bool,
            "all_expired": bool,
            "last_generated_at": datetime or None
        }
        """
        from datetime import timezone

        try:
            # Query events table for flags
            response = self.service_role_client.table("events") \
                .select("proposals_needs_regeneration, proposals_last_generated_at") \
                .eq("id", event_id) \
                .execute()

            if not response.data:
                return {
                    "needs_regeneration": True,
                    "has_proposals": False,
                    "all_expired": False,
                    "last_generated_at": None
                }

            event_data = response.data[0]

            # Check if proposals exist and if they're all expired
            proposals_response = self.service_role_client.table("proposed_times") \
                .select("id, start_time_utc") \
                .eq("event_id", event_id) \
                .execute()

            has_proposals = len(proposals_response.data) > 0 if proposals_response.data else False

            # Check if all proposals are in the past
            all_expired = False
            if has_proposals:
                now_utc = datetime.now(timezone.utc)
                valid_proposals = 0
                for proposal in proposals_response.data:
                    start_time = datetime.fromisoformat(proposal["start_time_utc"])
                    if start_time.tzinfo is None:
                        start_time = start_time.replace(tzinfo=timezone.utc)
                    if start_time >= now_utc:
                        valid_proposals += 1

                all_expired = valid_proposals == 0
                if all_expired:
                    print(f"[TIME_PROPOSAL_CACHE] All proposals for event {event_id} are expired")

            # Needs regeneration if flagged, no proposals, or all expired
            needs_regeneration = (
                event_data.get("proposals_needs_regeneration", True) or
                not has_proposals or
                all_expired
            )

            return {
                "needs_regeneration": needs_regeneration,
                "has_proposals": has_proposals,
                "all_expired": all_expired,
                "last_generated_at": event_data.get("proposals_last_generated_at")
            }

        except Exception as e:
            print(f"[TIME_PROPOSAL_CACHE] Error checking regeneration status: {str(e)}")
            return {
                "needs_regeneration": True,
                "has_proposals": False,
                "all_expired": False,
                "last_generated_at": None
            }
