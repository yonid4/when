"""
Service for managing busy slots from Google Calendar.
"""

from ..models.busy_slot import BusySlot
from ..utils.supabase_client import get_supabase
from datetime import datetime, timedelta, timezone
from typing import List, Optional


class BusySlotService:
    """Service for managing busy slots."""
    
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
    
    def get_participants_busy_slots(self, participant_ids: List[str], start_date: datetime, end_date: datetime) -> List[dict]:
        """Get busy slots for multiple participants within a date range."""
        try:
            result = (
                self.supabase.table("busy_slots")
                .select("*, profile:user_id(*)")
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
    
    def calculate_free_slots(self, participant_ids: List[str], start_date: datetime, end_date: datetime, 
                           meeting_duration_minutes: Optional[int], start_hour: int, 
                           end_hour: int) -> List[dict]:
        """
        Calculate free time slots where all participants are available.
        
        Args:
            participant_ids: List of user IDs
            start_date: Start of the date range to check
            end_date: End of the date range to check
            meeting_duration_minutes: Required meeting duration (from database, can be None)
            start_hour: Start of working hours (from database, e.g., 9 for 9:00)
            end_hour: End of working hours (from database, e.g., 17 for 17:00)
        
        Returns:
            List of free slots where all participants are available
        """
        if not participant_ids:
            return []
        
        # Get all busy slots for participants
        busy_slots = self.get_participants_busy_slots(participant_ids, start_date, end_date)
        
        # Group busy slots by user
        user_busy_slots = {}
        for slot in busy_slots:
            user_id = slot["user_id"]
            if user_id not in user_busy_slots:
                user_busy_slots[user_id] = []
            user_busy_slots[user_id].append({
                "start": datetime.fromisoformat(slot["start_time_utc"].replace('Z', '+00:00')),
                "end": datetime.fromisoformat(slot["end_time_utc"].replace('Z', '+00:00'))
            })
        
        # Generate free slots
        free_slots = []
        current_date = start_date.date()
        end_date_only = end_date.date()
        
        while current_date <= end_date_only:
            # Define working hours for this day (make timezone-aware to match busy slots)
            day_start = datetime.combine(current_date, datetime.min.time().replace(hour=start_hour)).replace(tzinfo=timezone.utc)
            day_end = datetime.combine(current_date, datetime.min.time().replace(hour=end_hour)).replace(tzinfo=timezone.utc)
            
            # Find free slots for this day
            day_free_slots = self._find_free_slots_for_day(
                day_start, day_end, user_busy_slots, participant_ids, meeting_duration_minutes
            )
            free_slots.extend(day_free_slots)
            
            current_date += timedelta(days=1)
        
        return free_slots
    
    def _find_free_slots_for_day(self, day_start: datetime, day_end: datetime, 
                                user_busy_slots: dict, participant_ids: List[str], 
                                meeting_duration_minutes: int) -> List[dict]:
        """Find free slots for a single day."""
        # Collect all busy intervals for this day
        all_busy_intervals = []
        
        for user_id in participant_ids:
            if user_id in user_busy_slots:
                for slot in user_busy_slots[user_id]:
                    # Only include slots that overlap with this day
                    if slot["start"] < day_end and slot["end"] > day_start:
                        interval_start = max(slot["start"], day_start)
                        interval_end = min(slot["end"], day_end)
                        all_busy_intervals.append((interval_start, interval_end))
        
        # Sort and merge overlapping intervals
        if not all_busy_intervals:
            # No one is busy, entire day is free
            return [{
                "start_time_utc": day_start.isoformat(),
                "end_time_utc": day_end.isoformat(),
                "duration_minutes": int((day_end - day_start).total_seconds() / 60)
            }]
        
        all_busy_intervals.sort(key=lambda x: x[0])
        merged_intervals = self._merge_intervals(all_busy_intervals)
        
        # Find free slots between busy intervals
        free_slots = []
        current_time = day_start
        
        for busy_start, busy_end in merged_intervals:
            if current_time < busy_start:
                # There's a free slot before this busy period
                duration = int((busy_start - current_time).total_seconds() / 60)
                if duration >= meeting_duration_minutes:
                    free_slots.append({
                        "start_time_utc": current_time.isoformat(),
                        "end_time_utc": busy_start.isoformat(),
                        "duration_minutes": duration
                    })
            current_time = max(current_time, busy_end)
        
        # Check for free time after the last busy period
        if current_time < day_end:
            duration = int((day_end - current_time).total_seconds() / 60)
            if duration >= meeting_duration_minutes:
                free_slots.append({
                    "start_time_utc": current_time.isoformat(),
                    "end_time_utc": day_end.isoformat(),
                    "duration_minutes": duration
                })
        
        return free_slots
    
    def _merge_intervals(self, intervals: List[tuple]) -> List[tuple]:
        """Merge overlapping time intervals."""
        if not intervals:
            return []
        
        merged = []
        prev_start, prev_end = intervals[0]
        
        for i in range(1, len(intervals)):
            curr_start, curr_end = intervals[i]
            
            if prev_end >= curr_start:
                # Overlapping intervals - merge them
                prev_end = max(prev_end, curr_end)
            else:
                # Non-overlapping - add previous interval and start new one
                merged.append((prev_start, prev_end))
                prev_start, prev_end = curr_start, curr_end
        
        # Add the last interval
        merged.append((prev_start, prev_end))
        
        return merged
