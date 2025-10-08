"""
Busy slots service.

Key behaviors:
- All times are treated as UTC ISO strings when stored/fetched from Supabase.
- Google Calendar sync skips all-day events and upserts by (user_id, google_event_id).
- Merged-busy computation prefers a Supabase RPC; falls back to Python if RPC fails.
"""

from ..models.busy_slot import BusySlot
from ..utils.supabase_client import get_supabase
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple

class BusySlotService():
    """Service for managing busy slots.

    Notes:
    - Use UTC for `start_time_utc` and `end_time_utc` fields end-to-end.
    - Prefer `get_merged_busy_slots_for_event` for aggregated views; it will use
      the database RPC when available for performance and consistency.
    """
    def __init__(self):
        self.supabase = get_supabase()

    def get_user_busy_slots(self, user_id: str, start_date: datetime, end_date: datetime) -> List[dict]:
        """Get busy slots for a user within a date range."""
        try:
            result = (
                self.supabase.table("busy_slots")
                .select("*")
                .eq("user_id", user_id)
                .gte("start_time_utc", start_date.isoformat())
                .lte("end_time_utc", end_date.isoformat())
                .order("start_time_utc")
                .execute()
            )
            return result.data
        except Exception as e:
            print(f"Error getting busy slots for user {user_id}: {str(e)}")
            return []

    def get_busy_slots(self, start_date: datetime, end_date: datetime) -> List[dict]:
        """
        Get all busy slots between the dates start_date and end_date,
        combined and sorted by starting time of busy slots

        Args:
            start_date: datetime
            end_date: datetime
        
        Returns:
            List[dict]: List of busy slots sorted by start time
        """
        try:
            result = (
                self.supabase.table("busy_slots")
                .select("*")
                .gte("start_time_utc", start_date.isoformat())
                .lte("end_time_utc", end_date.isoformat())
                .order("start_time_utc")
                .execute()
            )
            return result.data
        except Exception as e:
            print(f"Error getting busy slots: {str(e)}")
            return []

    def store_busy_slot(self, busy_slot: BusySlot) -> Optional[dict]:
        """Store a single busy slot in the database."""
        try:
            result = (
                self.supabase.table("busy_slots")
                .insert(busy_slot.to_dict())
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error storing busy slot: {str(e)}")
            return None

    def upsert_busy_slot(self, busy_slot: BusySlot) -> Optional[dict]:
        """Upsert a busy slot (update if exists, insert if new)."""
        try:
            # Try to find existing slot with same google_event_id and user_id
            if busy_slot.google_event_id:
                existing = (
                    self.supabase.table("busy_slots")
                    .select("*")
                    .eq("user_id", busy_slot.user_id)
                    .eq("google_event_id", busy_slot.google_event_id)
                    .execute()
                )
                
                if existing.data:
                    # Update existing slot
                    busy_slot.updated_at = datetime.utcnow()
                    result = (
                        self.supabase.table("busy_slots")
                        .update(busy_slot.to_dict())
                        .eq("id", existing.data[0]["id"])
                        .execute()
                    )
                    return result.data[0] if result.data else None
            
            # Insert new slot
            return self.store_busy_slot(busy_slot)
            
        except Exception as e:
            print(f"Error upserting busy slot: {str(e)}")
            return None

    def delete_user_busy_slots_in_range(self, user_id: str, start_date: datetime, end_date: datetime) -> bool:
        """Delete all busy slots for a user within a date range."""
        try:
            (
                self.supabase.table("busy_slots")
                .delete()
                .eq("user_id", user_id)
                .gte("start_time_utc", start_date.isoformat())
                .lte("end_time_utc", end_date.isoformat())
                .execute()
            )
            
            return True
        except Exception as e:
            print(f"Error deleting busy slots for user {user_id}: {str(e)}")
            return False

    def delete_busy_slot(self, busy_slot: BusySlot):
        """Delete a busy slot"""
        try:
            (
                self.supabase.table("busy_slots")
                .delete()
                .eq("google_event_id", busy_slot.google_event_id)
                .execute()
            )

            return True
        except Exception as e:
            print(f"Error deleting busy slot for slot id {busy_slot.id}")
            return False

    def get_participants_busy_slots(self, participant_ids: List[str], start_date: datetime, end_date: datetime) -> List[dict]:
        """Get busy slots for multiple participants within a date range."""
        try:
            result = (
                self.supabase.table("busy_slots")
                .select("*, profiles(*)")
                .in_("user_id", participant_ids)
                .gte("start_time_utc", start_date.isoformat())
                .lte("end_time_utc", end_date.isoformat())
                .order("start_time_utc")
                .execute()
            )
            return result.data
        except Exception as e:
            print(f"Error getting busy slots for participants: {str(e)}")
            return []

    def get_event_participants_busy_slots(self, event_id: str, start_date: datetime, end_date: datetime) -> List[dict]:
        """Get busy slots for all participants of a specific event."""
        try:
            # First get all participants for the event
            participants_result = (
                self.supabase.table("event_participants")
                .select("user_id")
                .eq("event_id", event_id)
                .execute()
            )
            
            if not participants_result.data:
                return []
            
            participant_ids = [p["user_id"] for p in participants_result.data]
            
            # Then get busy slots for all participants
            return self.get_participants_busy_slots(participant_ids, start_date, end_date)
            
        except Exception as e:
            print(f"Error getting busy slots for event participants: {str(e)}")
            return []

    def bulk_store_busy_slots(self, busy_slots: List[BusySlot]) -> List[dict]:
        """Store multiple busy slots efficiently."""
        try:
            slots_data = [slot.to_dict() for slot in busy_slots]
            result = (
                self.supabase.table("busy_slots")
                .insert(slots_data)
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            print(f"Error bulk storing busy slots: {str(e)}")
            return []

    def sync_user_google_calendar(self, user_id: str, start_date: datetime, end_date: datetime) -> bool:
        """Sync busy slots from user's Google Calendar."""
        try:
            from . import google_calendar
            get_stored_credentials = google_calendar.get_stored_credentials
            get_calendar_service = google_calendar.get_calendar_service
            
            # Get user's Google credentials
            credentials = get_stored_credentials(user_id)
            if not credentials:
                print(f"No Google credentials found for user {user_id}")
                return False
            
            # Create Google Calendar service
            service = get_calendar_service(credentials=credentials, user_id=user_id)
            
            # Query Google Calendar for events
            events_result = service.events().list(
                calendarId='primary',
                timeMin=start_date.isoformat(),
                timeMax=end_date.isoformat(),
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            
            # Convert Google events to BusySlot objects
            busy_slots = []
            for event in events:
                try:
                    busy_slot = BusySlot.from_google_event(user_id, event)
                    busy_slots.append(busy_slot)
                except ValueError:
                    # Skip all-day events or invalid events
                    continue
            
            # Store the busy slots using upsert to handle duplicates
            for slot in busy_slots:
                self.upsert_busy_slot(slot)
            
            return True
            
        except Exception as e:
            print(f"Error syncing Google Calendar for user {user_id}: {str(e)}")
            return False

    def delete_user_google_events(self, user_id: str) -> bool:
        """Delete all Google Calendar synced events for a user."""
        try:
            (
                self.supabase.table("busy_slots")
                .delete()
                .eq("user_id", user_id)
                .not_.is_("google_event_id", "null")
                .execute()
            )
            return True
        except Exception as e:
            print(f"Error deleting Google events for user {user_id}: {str(e)}")
            return False

    def get_merged_busy_slots_for_event(self, event_id: str, start_date: datetime, end_date: datetime) -> List[dict]:
        """
        Get merged busy time slots for all participants of an event using PostgreSQL RPC.
        This uses the complex SQL query with window functions via Supabase RPC.
        
        Args:
            event_id: str - The event ID
            start_date: datetime - Start of time window
            end_date: datetime - End of time window
            
        Returns:
            List[dict]: Merged busy time slots with participant counts
            Format: [{"start_time": "ISO_string", "end_time": "ISO_string", "busy_participants_count": int}]
        """
        try:
            result = self.supabase.rpc(
                'get_merged_busy_slots_for_event',
                {
                    'event_uuid': event_id,
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat()
                }
            ).execute()
            
            # Format the response for consistency
            formatted_slots = []
            for slot in result.data:
                formatted_slots.append({
                    "start_time": slot["start_time"],
                    "end_time": slot["end_time"], 
                    "busy_participants_count": slot["busy_participants_count"]
                })
            
            return formatted_slots
            
        except Exception as e:
            print(f"Error calling RPC function for event {event_id}: {str(e)}")
            # Fallback to Python implementation if RPC fails
            return self._get_merged_busy_slots_fallback(event_id, start_date, end_date)

    def _get_merged_busy_slots_fallback(self, event_id: str, start_date: datetime, end_date: datetime) -> List[dict]:
        """
        Fallback method using Python logic if RPC fails.
        This implements the same merging logic in Python.
        """
        try:
            # Get event participants
            participants_result = (
                self.supabase.table("event_participants")
                .select("user_id")
                .eq("event_id", event_id)
                .execute()
            )
            
            if not participants_result.data:
                return []
            
            participant_ids = [p["user_id"] for p in participants_result.data]
            
            # Get busy slots for all participants
            busy_slots_result = (
                self.supabase.table("busy_slots")
                .select("start_time_utc, end_time_utc, user_id")
                .in_("user_id", participant_ids)
                .gte("start_time_utc", start_date.isoformat())
                .lte("end_time_utc", end_date.isoformat())
                .order("start_time_utc")
                .execute()
            )
            
            # Convert to datetime objects
            busy_slots = []
            for slot in busy_slots_result.data:
                busy_slots.append({
                    "start_time_utc": datetime.fromisoformat(slot["start_time_utc"].replace('Z', '+00:00')),
                    "end_time_utc": datetime.fromisoformat(slot["end_time_utc"].replace('Z', '+00:00')),
                    "user_id": slot["user_id"]
                })
            
            return self._merge_overlapping_slots_python(busy_slots)
            
        except Exception as e:
            print(f"Error in fallback method: {str(e)}")
            return []

    def _merge_overlapping_slots_python(self, busy_slots: List[dict]) -> List[dict]:
        """
        Python implementation of the SQL window function logic.
        Merge overlapping busy slots and count participants.
        """
        if not busy_slots:
            return []
        
        # Create start and end events (equivalent to event_points CTE)
        events = []
        for slot in busy_slots:
            events.append({
                "event_time": slot["start_time_utc"],
                "event_type": 1,  # Start event
                "user_id": slot["user_id"]
            })
            events.append({
                "event_time": slot["end_time_utc"],
                "event_type": -1,  # End event
                "user_id": slot["user_id"]
            })
        
        # Sort events chronologically
        events.sort(key=lambda x: (x["event_time"], x["event_type"]))
        
        # Process events to create merged time windows
        merged_slots = []
        active_users = set()
        prev_time = None
        
        for event in events:
            current_time = event["event_time"]
            
            # If we have a previous time and there are active users, create a time window
            if prev_time is not None and prev_time < current_time and active_users:
                merged_slots.append({
                    "start_time": prev_time.isoformat(),
                    "end_time": current_time.isoformat(),
                    "busy_participants_count": len(active_users)
                })
            
            # Update active users based on event type
            if event["event_type"] == 1:  # Start event
                active_users.add(event["user_id"])
            else:  # End event
                active_users.discard(event["user_id"])
            
            prev_time = current_time
        
        return merged_slots

    def validate_busy_slot_data(self, slot_data: dict) -> bool:
        """
        Validate busy slot data.

        Checks if required fields are present and logically consistent.

        Args:
            slot_data (dict): Dictionary representing busy slot data.

        Returns:
            bool: True if valid, False otherwise.
        """
        required_fields = ['user_id', 'start_time_utc', 'end_time_utc']
        
        # Check required fields exist
        for field in required_fields:
            if field not in slot_data:
                print(f"Validation error: Missing field '{field}'")
                return False
        
        # Check times are valid ISO strings and start < end
        try:
            start = datetime.fromisoformat(slot_data['start_time_utc'].replace('Z', '+00:00'))
            end = datetime.fromisoformat(slot_data['end_time_utc'].replace('Z', '+00:00'))
            if start >= end:
                print("Validation error: start_time must be before end_time")
                return False
        except Exception as e:
            print(f"Validation error: Invalid datetime format - {str(e)}")
            return False
        
        return True

    def get_user_calendar_sync_status(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the Google Calendar sync status and last sync time for a user.
        
        Args:
            user_id (str): User's unique ID.
            
        Returns:
            dict or None: Dictionary with 'last_synced_at' (datetime) and 'sync_status' (str) keys,
                        or None if no sync info available.
        """
        supabase = self.supabase
        response = supabase.table("profiles").select("google_calendar_sync").eq("id", user_id).execute()

        if not response.data or not response.data[0].get("google_calendar_sync"):
            return None

        sync_info = response.data[0]["google_calendar_sync"]
        # Convert stored ISO string to datetime
        last_synced_at = None
        if sync_info.get("last_synced_at"):
            try:
                last_synced_at = datetime.fromisoformat(sync_info["last_synced_at"].replace('Z', '+00:00'))
            except Exception:
                last_synced_at = None

        return {
            "last_synced_at": last_synced_at,
            "sync_status": sync_info.get("sync_status"),
            "sync_error": sync_info.get("sync_error")
        }

    def cleanup_old_busy_slots(self, user_id: str, days_old: int) -> int:
        """
        Remove busy slots of a user that end before the earliest ongoing event start time,
        or older than `days_old` if no ongoing events exist.

        Args:
            user_id (str): User ID
            days_old (int): Minimum days of data to keep
        
        Returns:
            int: Number of cleaned-up slots
        """
        supabase = self.supabase
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)

        try:
            # Get participant event IDs first
            participant_events = (
                supabase.table("event_participants")
                .select("event_id")
                .eq("user_id", user_id)
                .execute()
            )

            if participant_events.data:
                event_ids = [p["event_id"] for p in participant_events.data]
                ongoing_events_resp = (
                    supabase.table("events")
                    .select("start_time")
                    .gte("end_time", datetime.utcnow().isoformat())
                    .in_("id", event_ids)
                    .order("start_time", ascending=True)
                    .limit(1)
                    .execute()
                )
            else:
                ongoing_events_resp = None

            ongoing_events = ongoing_events_resp.data if ongoing_events_resp.data else []

            # Step 2: Determine deletion cutoff time
            if ongoing_events:
                min_start_time_str = ongoing_events[0]["start_time"]
                min_start_time = datetime.fromisoformat(min_start_time_str.replace('Z', '+00:00'))
                deletion_cutoff = min_start_time
            else:
                deletion_cutoff = cutoff_date

            # Step 3: Delete busy slots ending before cutoff
            response = (
                supabase.table("busy_slots")
                .delete()
                .eq("user_id", user_id)
                .lt("end_time_utc", deletion_cutoff.isoformat())
                .execute()
            )

            return response.count if response and hasattr(response, 'count') else 0
        
        except Exception as e:
            print(f"Error cleaning up busy slots for user {user_id}: {str(e)}")
            return 0

    def get_busy_slots_summary(self, user_id: str, date_range: Tuple[datetime, datetime]):
    # def get_busy_slots_summary(self, user_id: str, date_range: Tuple[datetime, datetime]) -> Dict[str, Any]:
        """
        Placeholder for generating summary statistics of busy slots.

        Args:
            user_id (str): User's unique identifier.
            date_range (tuple): Start and end datetime or string representing range.

        Returns:
            dict: Summary statistics (e.g., total busy time, count of slots).
        
        Description:
            This function will analyze busy slots within the given date range for the user,
            calculating useful metrics like total duration busy, number of busy slots,
            and possibly availability percentages for scheduling purposes.

            The implementation will depend on app requirements and desired reports.
        """
        pass

