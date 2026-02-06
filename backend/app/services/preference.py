import os
from typing import Any, Dict, List, Optional

from supabase import create_client

from ..utils.supabase_client import get_supabase


class PreferencesService:
    """Service for managing user event preferences."""

    REQUIRED_FIELDS = ["event_id", "user_id", "preferred_start_time_utc", "preferred_end_time_utc"]

    def __init__(self):
        self.supabase = get_supabase()

        supabase_url = os.getenv('SUPABASE_URL')
        supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

        if supabase_url and supabase_service_key:
            self.service_role_client = create_client(supabase_url, supabase_service_key)
        else:
            self.service_role_client = self.supabase

    def validate_preference_data(self, data: Dict[str, Any]) -> bool:
        """Validate that all required fields are present and non-empty."""
        for field in self.REQUIRED_FIELDS:
            if field not in data or data[field] in (None, ""):
                print(f"Missing required field: {field}")
                return False
        return True

    def add_preference(self, preference_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a user preference for an event."""
        try:
            if not self.validate_preference_data(preference_data):
                return None

            result = (
                self.supabase.table("user_event_preferences")
                .insert(preference_data)
                .execute()
            )

            if not result.data:
                print("Error: No data returned from preference creation")
                return None

            return result.data[0]
        except Exception as e:
            print(f"Failed to add preference: {str(e)}")
            return None

    def get_event_preferences(self, event_id: str) -> List[Dict[str, Any]]:
        """Get all preferences for an event with profile information."""
        try:
            result = (
                self.supabase.table("user_event_preferences")
                .select("*, profiles(*)")
                .eq("event_id", event_id)
                .execute()
            )
            return result.data or []
        except Exception as e:
            print(f"Failed to get preferences for event {event_id}: {str(e)}")
            return []

    def get_user_preferences(self, event_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Get a user's preferences for a specific event."""
        try:
            result = (
                self.supabase.table("user_event_preferences")
                .select("*")
                .eq("event_id", event_id)
                .eq("user_id", user_id)
                .execute()
            )
            return result.data or []
        except Exception as e:
            print(f"Failed to get user preferences for event {event_id}: {str(e)}")
            return []

    def delete_preference(self, preference_id: str) -> bool:
        """Delete a specific preference by id."""
        try:
            self.supabase.table("user_event_preferences").delete().eq("id", preference_id).execute()
            return True
        except Exception as e:
            print(f"Failed to delete preference {preference_id}: {str(e)}")
            return False

