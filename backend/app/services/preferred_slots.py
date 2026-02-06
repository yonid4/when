"""
Preferred slots service.

Key behaviors:
- All times are treated as UTC ISO strings when stored/fetched from Supabase.
- Users can only modify their own slots; coordinators cannot modify others' slots.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from ..models.preferred_slot import PreferredSlot
from ..utils.supabase_client import get_supabase


class PreferredSlotService:
    """Service for managing preferred slots."""

    def __init__(self, access_token: Optional[str] = None):
        self.supabase = get_supabase(access_token)
        self.service_role_client = self.supabase

    def get_slots_for_event(self, event_id: str) -> List[dict]:
        """Get all preferred slots for an event with user information."""
        try:
            result = (
                self.supabase.table("preferred_slots")
                .select("*, profiles(id, full_name, email_address)")
                .eq("event_id", event_id)
                .order("start_time_utc")
                .execute()
            )

            formatted_slots = []
            for slot in result.data:
                profiles = slot.pop("profiles", None)
                slot["user_name"] = profiles.get("full_name") if profiles else "Unknown"
                slot["user_email"] = profiles.get("email_address") if profiles else ""
                formatted_slots.append(slot)

            return formatted_slots
        except Exception as e:
            print(f"Error getting preferred slots for event {event_id}: {str(e)}")
            return []

    def get_user_slots_for_event(self, user_id: str, event_id: str) -> List[dict]:
        """Get all preferred slots for a specific user in an event."""
        try:
            result = (
                self.supabase.table("preferred_slots")
                .select("*")
                .eq("user_id", user_id)
                .eq("event_id", event_id)
                .order("start_time_utc")
                .execute()
            )
            return result.data or []
        except Exception as e:
            print(f"Error getting user slots: {str(e)}")
            return []

    def get_slot_by_id(self, slot_id: str) -> Optional[dict]:
        """Get a specific slot by ID."""
        try:
            result = (
                self.supabase.table("preferred_slots")
                .select("*")
                .eq("id", slot_id)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error getting slot by ID {slot_id}: {str(e)}")
            return None

    def delete_slot(self, slot_id: str) -> bool:
        """Delete a specific slot."""
        try:
            self.supabase.table("preferred_slots").delete().eq("id", slot_id).execute()
            return True
        except Exception as e:
            print(f"Error deleting slot {slot_id}: {str(e)}")
            return False

    def insert_slot_simple(
        self,
        user_id: str,
        event_id: str,
        start_time: str,
        end_time: str
    ) -> Optional[dict]:
        """Insert a new preferred slot without overlap handling."""
        try:
            if not self.is_user_event_participant(user_id, event_id):
                print(f"Authorization failed: User {user_id} is not a participant in event {event_id}")
                return None

            start_dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            end_dt = datetime.fromisoformat(end_time.replace("Z", "+00:00"))

            slot = PreferredSlot(
                user_id=user_id,
                event_id=event_id,
                start_time_utc=start_dt,
                end_time_utc=end_dt
            )

            result = (
                self.service_role_client.table("preferred_slots")
                .insert(slot.to_dict())
                .execute()
            )

            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error inserting slot: {str(e)}")
            return None

    def is_user_event_participant(self, user_id: str, event_id: str) -> bool:
        """Check if a user is a participant of an event."""
        try:
            result = (
                self.service_role_client.table("event_participants")
                .select("user_id")
                .eq("user_id", user_id)
                .eq("event_id", event_id)
                .execute()
            )
            return len(result.data) > 0
        except Exception as e:
            print(f"Error checking participant status: {str(e)}")
            return False

    def validate_slot_data(self, slot_data: dict) -> bool:
        """Validate preferred slot data has required fields and valid times."""
        required_fields = ["start_time_utc", "end_time_utc"]

        for field in required_fields:
            if field not in slot_data:
                print(f"Validation error: Missing field '{field}'")
                return False

        try:
            start = datetime.fromisoformat(slot_data["start_time_utc"].replace("Z", "+00:00"))
            end = datetime.fromisoformat(slot_data["end_time_utc"].replace("Z", "+00:00"))
            if start >= end:
                print("Validation error: start_time must be before end_time")
                return False
        except Exception as e:
            print(f"Validation error: Invalid datetime format - {str(e)}")
            return False

        return True


