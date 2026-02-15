import os
from typing import Any, Dict, List, Optional

from supabase import create_client

from ..utils.email_utils import normalize_email
from ..utils.supabase_client import get_supabase


class UsersService:
    """Service for managing user profiles and related settings."""

    def __init__(self, access_token: Optional[str] = None):
        self.supabase = get_supabase(access_token)

        supabase_url = os.getenv('SUPABASE_URL')
        supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

        if supabase_url and supabase_service_key:
            self.service_role_client = create_client(supabase_url, supabase_service_key)
        else:
            self.service_role_client = self.supabase

    def create_profile(self, user_id: str, profile_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a profile row for a given authenticated user id."""
        try:
            payload = {"id": user_id, **(profile_data or {})}

            result = self.service_role_client.table("profiles").insert(payload).execute()

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

            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Failed to get profile for user {user_id}: {str(e)}")
            return None

    def update_profile(self, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a user's profile with provided fields."""
        try:
            allowed_fields = {"full_name", "avatar_url", "primary_calendar_provider", "timezone"}
            filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}

            if not filtered_updates:
                return self.get_profile(user_id)

            result = (
                self.supabase.table("profiles")
                .update(filtered_updates)
                .eq("id", user_id)
                .execute()
            )

            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Failed to update profile for user {user_id}: {str(e)}")
            return None

    def delete_profile(self, user_id: str) -> bool:
        """Delete a user's profile."""
        try:
            self.supabase.table("profiles").delete().eq("id", user_id).execute()
            return True
        except Exception as e:
            print(f"Failed to delete profile for user {user_id}: {str(e)}")
            return False

    def set_google_credentials(self, user_id: str, credentials: Dict[str, Any]) -> bool:
        """Persist Google OAuth credentials in the user's profile."""
        try:
            self.supabase.table("profiles").update(
                {"google_auth_token": credentials}
            ).eq("id", user_id).execute()
            return True
        except Exception as e:
            print(f"Failed to set Google credentials for user {user_id}: {str(e)}")
            return False

    def get_google_credentials(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve Google OAuth credentials from the user's profile."""
        try:
            result = (
                self.supabase.table("profiles")
                .select("google_auth_token")
                .eq("id", user_id)
                .execute()
            )
            return result.data[0].get("google_auth_token") if result.data else None
        except Exception as e:
            print(f"Failed to get Google credentials for user {user_id}: {str(e)}")
            return None

    def set_timezone(self, user_id: str, timezone: str) -> bool:
        """Update user's timezone on profile."""
        try:
            self.supabase.table("profiles").update(
                {"timezone": timezone}
            ).eq("id", user_id).execute()
            return True
        except Exception as e:
            print(f"Failed to set timezone for user {user_id}: {str(e)}")
            return False

    def get_timezone(self, user_id: str) -> Optional[str]:
        """Fetch user's timezone from profile."""
        try:
            result = (
                self.supabase.table("profiles")
                .select("timezone")
                .eq("id", user_id)
                .execute()
            )
            return result.data[0].get("timezone") if result.data else None
        except Exception as e:
            print(f"Failed to get timezone for user {user_id}: {str(e)}")
            return None

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
        """Ensure a profile exists for the given user id, creating with defaults if needed."""
        profile = self.get_profile(user_id)
        if profile:
            return profile

        return self.create_profile(user_id, defaults or {})

    def search_users(self, email: str) -> List[Dict[str, Any]]:
        """Search users by email using normalized email variants."""
        try:
            normalized = normalize_email(email)

            result = (
                self.supabase.table("profiles")
                .select("id, email_address, full_name, avatar_url")
                .or_(f"email_address.ilike.%{email}%,email_address.ilike.%{normalized}%")
                .limit(10)
                .execute()
            )
            return result.data or []
        except Exception as e:
            print(f"Failed to search users: {str(e)}")
            return []


