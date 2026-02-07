"""Calendar accounts service for managing multi-calendar support."""

import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from supabase import create_client

from ..utils.supabase_client import get_supabase


class CalendarAccountsService:
    """Service for managing calendar accounts and sources."""

    def __init__(self):
        self.supabase = get_supabase()

        supabase_url = os.getenv("SUPABASE_URL")
        service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if supabase_url and service_role_key:
            self.service_role_client = create_client(supabase_url, service_role_key)
        else:
            logging.warning("[CalendarAccountsService] SUPABASE_SERVICE_ROLE_KEY not found")
            self.service_role_client = self.supabase

    def get_user_accounts(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all calendar accounts for a user with their sources."""
        try:
            result = (
                self.service_role_client.table("calendar_accounts")
                .select("*, calendar_sources(*)")
                .eq("user_id", user_id)
                .execute()
            )
            return result.data or []
        except Exception as e:
            logging.error(f"Error getting calendar accounts for user {user_id}: {e}")
            return []

    def get_account(self, account_id: str) -> Optional[Dict[str, Any]]:
        """Get a single calendar account by ID."""
        try:
            result = (
                self.service_role_client.table("calendar_accounts")
                .select("*, calendar_sources(*)")
                .eq("id", account_id)
                .single()
                .execute()
            )
            return result.data
        except Exception as e:
            logging.error(f"Error getting calendar account {account_id}: {e}")
            return None

    def get_account_by_provider(
        self, user_id: str, provider: str, provider_account_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get a calendar account by provider details."""
        try:
            result = (
                self.service_role_client.table("calendar_accounts")
                .select("*")
                .eq("user_id", user_id)
                .eq("provider", provider)
                .eq("provider_account_id", provider_account_id)
                .single()
                .execute()
            )
            return result.data
        except Exception as e:
            logging.debug(f"Account not found for user {user_id}, provider {provider}: {e}")
            return None

    def create_account(
        self,
        user_id: str,
        provider: str,
        provider_email: str,
        provider_account_id: str,
        credentials: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        """Create a new calendar account."""
        try:
            result = (
                self.service_role_client.table("calendar_accounts")
                .insert({
                    "user_id": user_id,
                    "provider": provider,
                    "provider_email": provider_email,
                    "provider_account_id": provider_account_id,
                    "credentials": credentials,
                    "connected_at": datetime.utcnow().isoformat(),
                })
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            logging.error(f"Error creating calendar account: {e}")
            return None

    def update_account_credentials(
        self, account_id: str, credentials: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update credentials for an existing account."""
        try:
            result = (
                self.service_role_client.table("calendar_accounts")
                .update({"credentials": credentials})
                .eq("id", account_id)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            logging.error(f"Error updating account credentials {account_id}: {e}")
            return None

    def delete_account(self, account_id: str) -> bool:
        """Delete a calendar account (cascade deletes sources)."""
        try:
            account = self.get_account(account_id)
            if account and account.get("credentials"):
                self._try_revoke_token(account["credentials"], account_id)

            self.service_role_client.table("calendar_accounts").delete().eq(
                "id", account_id
            ).execute()
            return True
        except Exception as e:
            logging.error(f"Error deleting calendar account {account_id}: {e}")
            return False

    def _try_revoke_token(self, credentials: Dict[str, Any], account_id: str) -> None:
        """Attempt to revoke an OAuth token."""
        try:
            import requests
            if credentials.get("token"):
                revoke_url = "https://oauth2.googleapis.com/revoke"
                requests.post(revoke_url, params={"token": credentials["token"]})
        except Exception as e:
            logging.warning(f"Failed to revoke token for account {account_id}: {e}")

    def get_enabled_sources(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all enabled calendar sources for a user."""
        try:
            accounts = self.get_user_accounts(user_id)
            enabled_sources = []

            for account in accounts:
                for source in account.get("calendar_sources", []):
                    if source.get("is_enabled", False):
                        source["account"] = {
                            "id": account["id"],
                            "provider": account["provider"],
                            "provider_email": account["provider_email"],
                            "credentials": account["credentials"],
                        }
                        enabled_sources.append(source)

            return enabled_sources
        except Exception as e:
            logging.error(f"Error getting enabled sources for user {user_id}: {e}")
            return []

    def get_write_calendar(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get the user's write calendar (where events are created)."""
        try:
            accounts = self.get_user_accounts(user_id)

            for account in accounts:
                for source in account.get("calendar_sources", []):
                    if source.get("is_write_calendar", False):
                        source["account"] = {
                            "id": account["id"],
                            "provider": account["provider"],
                            "provider_email": account["provider_email"],
                            "credentials": account["credentials"],
                        }
                        return source

            return None
        except Exception as e:
            logging.error(f"Error getting write calendar for user {user_id}: {e}")
            return None

    def update_source(self, source_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a calendar source (e.g., toggle is_enabled)."""
        try:
            allowed_fields = {"is_enabled", "is_write_calendar", "calendar_name", "color"}
            filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}

            if not filtered_updates:
                return None

            filtered_updates["updated_at"] = datetime.utcnow().isoformat()

            result = (
                self.service_role_client.table("calendar_sources")
                .update(filtered_updates)
                .eq("id", source_id)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            logging.error(f"Error updating calendar source {source_id}: {e}")
            return None

    def set_write_calendar(self, user_id: str, source_id: str) -> bool:
        """Set a calendar source as the write calendar (unsets others first)."""
        try:
            accounts = self.get_user_accounts(user_id)
            now = datetime.utcnow().isoformat()

            for account in accounts:
                for source in account.get("calendar_sources", []):
                    if source.get("is_write_calendar", False):
                        self.service_role_client.table("calendar_sources").update(
                            {"is_write_calendar": False, "updated_at": now}
                        ).eq("id", source["id"]).execute()

            self.service_role_client.table("calendar_sources").update(
                {"is_write_calendar": True, "updated_at": now}
            ).eq("id", source_id).execute()

            return True
        except Exception as e:
            logging.error(f"Error setting write calendar {source_id} for user {user_id}: {e}")
            return False

    def get_source(self, source_id: str) -> Optional[Dict[str, Any]]:
        """Get a single calendar source by ID."""
        try:
            result = (
                self.service_role_client.table("calendar_sources")
                .select("*, calendar_accounts(*)")
                .eq("id", source_id)
                .single()
                .execute()
            )
            return result.data
        except Exception as e:
            logging.error(f"Error getting calendar source {source_id}: {e}")
            return None

    def sync_calendars_from_provider(self, account_id: str) -> List[Dict[str, Any]]:
        """Fetch calendar list from provider and upsert to calendar_sources."""
        try:
            account = self.get_account(account_id)
            if not account:
                logging.error(f"Account {account_id} not found")
                return []

            provider = account["provider"]

            if provider == "google":
                return self._sync_google_calendars(account_id, account)
            elif provider == "microsoft":
                return self._sync_microsoft_calendars(account_id, account)
            else:
                logging.warning(f"Provider {provider} not supported for sync")
                return []

        except Exception as e:
            logging.error(f"Error syncing calendars from provider for account {account_id}: {e}")
            return []

    def _sync_google_calendars(self, account_id: str, account: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Sync calendars from Google Calendar API."""
        from googleapiclient.discovery import build

        from . import google_calendar

        creds_dict = account["credentials"]
        credentials = google_calendar.get_credentials_from_dict(creds_dict)
        credentials = google_calendar.refresh_credentials_if_needed(credentials)

        service = build("calendar", "v3", credentials=credentials)

        calendars = []
        page_token = None
        while True:
            calendar_list = service.calendarList().list(pageToken=page_token).execute()
            calendars.extend(calendar_list.get("items", []))
            page_token = calendar_list.get("nextPageToken")
            if not page_token:
                break

        synced_sources = []
        for cal in calendars:
            source = self._upsert_calendar_source(account_id, cal)
            if source:
                synced_sources.append(source)

        self.service_role_client.table("calendar_accounts").update({
            "last_synced_at": datetime.utcnow().isoformat()
        }).eq("id", account_id).execute()

        self.update_account_credentials(account_id, {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": list(credentials.scopes) if credentials.scopes else [],
        })

        return synced_sources

    def _sync_microsoft_calendars(self, account_id: str, account: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Sync calendars from Microsoft Graph API."""
        from . import microsoft_calendar

        creds_dict = account["credentials"]
        credentials = microsoft_calendar.refresh_credentials_if_needed(creds_dict)

        calendars = microsoft_calendar.get_user_calendars_list(credentials)

        synced_sources = []
        for cal in calendars:
            source = self._upsert_calendar_source(account_id, cal)
            if source:
                synced_sources.append(source)

        self.service_role_client.table("calendar_accounts").update({
            "last_synced_at": datetime.utcnow().isoformat()
        }).eq("id", account_id).execute()

        self.update_account_credentials(account_id, credentials)

        return synced_sources

    def _upsert_calendar_source(self, account_id: str, cal: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Upsert a single calendar source from provider data."""
        calendar_id = cal["id"]
        calendar_name = cal.get("summary", calendar_id)
        color = cal.get("backgroundColor", "#4285F4")
        is_primary = cal.get("primary", False)

        existing = (
            self.service_role_client.table("calendar_sources")
            .select("*")
            .eq("account_id", account_id)
            .eq("calendar_id", calendar_id)
            .execute()
        )

        if existing.data:
            source = existing.data[0]
            self.service_role_client.table("calendar_sources").update({
                "calendar_name": calendar_name,
                "color": color,
                "updated_at": datetime.utcnow().isoformat(),
            }).eq("id", source["id"]).execute()
            return source

        result = (
            self.service_role_client.table("calendar_sources")
            .insert({
                "account_id": account_id,
                "calendar_id": calendar_id,
                "calendar_name": calendar_name,
                "is_enabled": is_primary,
                "is_write_calendar": is_primary,
                "color": color,
            })
            .execute()
        )
        return result.data[0] if result.data else None

    def get_credentials_for_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get credentials for a user (backwards compatible with profiles table)."""
        try:
            accounts = self.get_user_accounts(user_id)
            for account in accounts:
                if account["provider"] == "google" and account.get("credentials"):
                    return account["credentials"]

            result = (
                self.service_role_client.table("profiles")
                .select("google_auth_token")
                .eq("id", user_id)
                .single()
                .execute()
            )

            if result.data and result.data.get("google_auth_token"):
                return result.data["google_auth_token"]

            return None

        except Exception as e:
            logging.error(f"Error getting credentials for user {user_id}: {e}")
            return None

    def ensure_account_exists(
        self, user_id: str, provider: str, provider_email: str, credentials: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Ensure a calendar account exists for the user, creating if needed."""
        try:
            existing = self.get_account_by_provider(user_id, provider, provider_email)

            if existing:
                self.update_account_credentials(existing["id"], credentials)
                return self.get_account(existing["id"])

            return self.create_account(
                user_id=user_id,
                provider=provider,
                provider_email=provider_email,
                provider_account_id=provider_email,
                credentials=credentials,
            )

        except Exception as e:
            logging.error(f"Error ensuring account exists: {e}")
            return None
