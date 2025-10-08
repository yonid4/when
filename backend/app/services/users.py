from ..utils.supabase_client import get_supabase
from typing import Optional, Dict, Any, List


class UsersService():
    """Service for managing user profiles and related settings.

    Details:
    - Profile rows live in `profiles` and are keyed by Supabase Auth user `id`.
    - Google OAuth credentials are stored verbatim in `google_auth_token` (handled by calendar service).
    - Prefer `ensure_profile` to lazily create a profile with defaults when needed.
    """

    def __init__(self, access_token: Optional[str] = None):
        # Use a user-authenticated client so RLS allows inserts/reads
        self.supabase = get_supabase(access_token)

    # -----------------------------
    # Profile CRUD
    # -----------------------------
    def create_profile(self, user_id: str, profile_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create a profile row for a given authenticated user id.

        Expected keys in profile_data (optional unless enforced via DB constraints):
        - email_address, full_name, avatar_url, google_auth_token, google_calendar_id, timezone
        """
        try:
            payload = {"id": user_id}
            payload.update(profile_data or {})

            result = (
                self.supabase.table("profiles")
                .insert(payload)
                .execute()
            )

            if not result.data:
                print("Error: No data returned from profile creation")
                return None

            return result.data[0]
        except Exception as e:
            print(f"Failed to create profile for user {user_id}: {str(e)}")
            return None

    def get_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a user's profile by id."""
        try:
            result = (
                self.supabase.table("profiles")
                .select("*")
                .eq("id", user_id)
                .execute()
            )

            if not result.data:
                return None

            return result.data[0]
        except Exception as e:
            print(f"Failed to get profile for user {user_id}: {str(e)}")
            return None

    def update_profile(self, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a user's profile with provided fields."""
        try:
            if not updates:
                return self.get_profile(user_id)

            result = (
                self.supabase.table("profiles")
                .update(updates)
                .eq("id", user_id)
                .execute()
            )

            if not result.data:
                print("No profile found to update")
                return None

            return result.data[0]
        except Exception as e:
            print(f"Failed to update profile for user {user_id}: {str(e)}")
            return None

    def delete_profile(self, user_id: str) -> bool:
        """Delete a user's profile. Use with caution."""
        try:
            (
                self.supabase.table("profiles")
                .delete()
                .eq("id", user_id)
                .execute()
            )
            return True
        except Exception as e:
            print(f"Failed to delete profile for user {user_id}: {str(e)}")
            return False

    # -----------------------------
    # Google tokens and calendar helpers
    # -----------------------------
    def set_google_credentials(self, user_id: str, credentials: Dict[str, Any]) -> bool:
        """
        Persist Google OAuth credentials dict in the user's profile under google_auth_token.
        """
        try:
            (
                self.supabase.table("profiles")
                .update({"google_auth_token": credentials})
                .eq("id", user_id)
                .execute()
            )
            return True
        except Exception as e:
            print(f"Failed to set Google credentials for user {user_id}: {str(e)}")
            return False

    def get_google_credentials(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve Google OAuth credentials dict from the user's profile."""
        try:
            result = (
                self.supabase.table("profiles")
                .select("google_auth_token")
                .eq("id", user_id)
                .execute()
            )
            if not result.data:
                return None
            return result.data[0].get("google_auth_token")
        except Exception as e:
            print(f"Failed to get Google credentials for user {user_id}: {str(e)}")
            return None

    def set_google_calendar_id(self, user_id: str, calendar_id: str) -> bool:
        """Persist primary Google calendar id on the user's profile."""
        try:
            (
                self.supabase.table("profiles")
                .update({"google_calendar_id": calendar_id})
                .eq("id", user_id)
                .execute()
            )
            return True
        except Exception as e:
            print(f"Failed to set Google calendar id for user {user_id}: {str(e)}")
            return False

    def get_google_calendar_id(self, user_id: str) -> Optional[str]:
        """Fetch stored Google calendar id from profile."""
        try:
            result = (
                self.supabase.table("profiles")
                .select("google_calendar_id")
                .eq("id", user_id)
                .execute()
            )
            if not result.data:
                return None
            return result.data[0].get("google_calendar_id")
        except Exception as e:
            print(f"Failed to get Google calendar id for user {user_id}: {str(e)}")
            return None

    # -----------------------------
    # Timezone helpers
    # -----------------------------
    def set_timezone(self, user_id: str, timezone: str) -> bool:
        """Update user's timezone on profile."""
        try:
            (
                self.supabase.table("profiles")
                .update({"timezone": timezone})
                .eq("id", user_id)
                .execute()
            )
            return True
        except Exception as e:
            print(f"Failed to set timezone for user {user_id}: {str(e)}")
            return False

    def get_timezone(self, user_id: str) -> Optional[str]:
        """Fetch user's timezone from profile, if set."""
        try:
            result = (
                self.supabase.table("profiles")
                .select("timezone")
                .eq("id", user_id)
                .execute()
            )
            if not result.data:
                return None
            return result.data[0].get("timezone")
        except Exception as e:
            print(f"Failed to get timezone for user {user_id}: {str(e)}")
            return None

    # -----------------------------
    # Listing and ensure helpers
    # -----------------------------
    def list_users(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """List profiles with simple pagination."""
        try:
            result = (
                self.supabase.table("profiles")
                .select("*")
                .range(offset, offset + max(0, limit) - 1)
                .order("created_at")
                .execute()
            )
            return result.data or []
        except Exception as e:
            print(f"Failed to list users: {str(e)}")
            return []

    def ensure_profile(self, user_id: str, defaults: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Ensure a profile exists for the given user id. If not, create with defaults.
        """
        profile = self.get_profile(user_id)
        if profile:
            return profile

        return self.create_profile(user_id, defaults or {})


