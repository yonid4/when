"""
Calendar Accounts service for managing multi-calendar support.

Handles:
- Multiple calendar provider accounts per user
- Individual calendar sources within each account
- Credential management with backwards compatibility
- Calendar list syncing from providers
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from ..utils.supabase_client import get_supabase
from supabase import create_client
import os
import logging


class CalendarAccountsService:
    """Service for managing calendar accounts and sources."""

    def __init__(self):
        self.supabase = get_supabase()

        # Initialize service role client for admin operations (bypassing RLS)
        supabase_url = os.getenv("SUPABASE_URL")
        service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if supabase_url and service_role_key:
            self.service_role_client = create_client(supabase_url, service_role_key)
        else:
            logging.warning("[CalendarAccountsService] SUPABASE_SERVICE_ROLE_KEY not found, falling back to anon client")
            self.service_role_client = self.supabase

    # =========================================================================
    # ACCOUNT METHODS
    # =========================================================================

    def get_user_accounts(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all calendar accounts for a user with their sources.

        Args:
            user_id: User's unique ID

        Returns:
            List of accounts with nested sources
        """
        try:
            result = (
                self.service_role_client.table("calendar_accounts")
                .select("*, calendar_sources(*)")
                .eq("user_id", user_id)
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            logging.error(f"Error getting calendar accounts for user {user_id}: {e}")
            return []

    def get_account(self, account_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a single calendar account by ID.

        Args:
            account_id: Account's unique ID

        Returns:
            Account data with sources, or None if not found
        """
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
        """
        Get a calendar account by provider details.

        Args:
            user_id: User's unique ID
            provider: Provider name (e.g., 'google')
            provider_account_id: Account ID from provider

        Returns:
            Account data or None if not found
        """
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
        """
        Create a new calendar account.

        Args:
            user_id: User's unique ID
            provider: Provider name (e.g., 'google')
            provider_email: Email associated with the provider account
            provider_account_id: Unique ID from the provider
            credentials: OAuth credentials as dict

        Returns:
            Created account data or None on failure
        """
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
        """
        Update credentials for an existing account.

        Args:
            account_id: Account's unique ID
            credentials: New OAuth credentials

        Returns:
            Updated account data or None on failure
        """
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
        """
        Delete a calendar account (cascade deletes sources).

        Args:
            account_id: Account's unique ID

        Returns:
            True if deleted successfully
        """
        try:
            # First try to revoke the token
            account = self.get_account(account_id)
            if account and account.get("credentials"):
                try:
                    import requests
                    creds = account["credentials"]
                    if creds.get("token"):
                        revoke_url = "https://oauth2.googleapis.com/revoke"
                        requests.post(revoke_url, params={"token": creds["token"]})
                except Exception as e:
                    logging.warning(f"Failed to revoke token for account {account_id}: {e}")

            # Delete the account (cascade deletes sources)
            self.service_role_client.table("calendar_accounts").delete().eq(
                "id", account_id
            ).execute()
            return True
        except Exception as e:
            logging.error(f"Error deleting calendar account {account_id}: {e}")
            return False

    # =========================================================================
    # SOURCE METHODS
    # =========================================================================

    def get_enabled_sources(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all enabled calendar sources for a user (for syncing busy times).

        Args:
            user_id: User's unique ID

        Returns:
            List of enabled sources with account info
        """
        try:
            # First get all accounts for the user
            accounts = self.get_user_accounts(user_id)
            enabled_sources = []

            for account in accounts:
                sources = account.get("calendar_sources", [])
                for source in sources:
                    if source.get("is_enabled", False):
                        # Include account info with each source
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
        """
        Get the user's write calendar (where events are created).

        Args:
            user_id: User's unique ID

        Returns:
            Write calendar source with account info, or None
        """
        try:
            accounts = self.get_user_accounts(user_id)

            for account in accounts:
                sources = account.get("calendar_sources", [])
                for source in sources:
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

    def update_source(
        self, source_id: str, updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Update a calendar source (e.g., toggle is_enabled).

        Args:
            source_id: Source's unique ID
            updates: Dict of fields to update

        Returns:
            Updated source data or None on failure
        """
        try:
            # Only allow certain fields to be updated
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
        """
        Set a calendar source as the write calendar (unsets others first).

        Args:
            user_id: User's unique ID
            source_id: Source ID to set as write calendar

        Returns:
            True if successful
        """
        try:
            # First, unset all write calendars for this user
            accounts = self.get_user_accounts(user_id)
            for account in accounts:
                sources = account.get("calendar_sources", [])
                for source in sources:
                    if source.get("is_write_calendar", False):
                        self.service_role_client.table("calendar_sources").update(
                            {"is_write_calendar": False, "updated_at": datetime.utcnow().isoformat()}
                        ).eq("id", source["id"]).execute()

            # Set the new write calendar
            self.service_role_client.table("calendar_sources").update(
                {"is_write_calendar": True, "updated_at": datetime.utcnow().isoformat()}
            ).eq("id", source_id).execute()

            return True
        except Exception as e:
            logging.error(f"Error setting write calendar {source_id} for user {user_id}: {e}")
            return False

    def get_source(self, source_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a single calendar source by ID.

        Args:
            source_id: Source's unique ID

        Returns:
            Source data or None
        """
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

    # =========================================================================
    # SYNC METHODS
    # =========================================================================

    def sync_calendars_from_provider(self, account_id: str) -> List[Dict[str, Any]]:
        """
        Fetch calendar list from provider and upsert to calendar_sources.

        Args:
            account_id: Account's unique ID

        Returns:
            List of synced calendar sources
        """
        try:
            from . import google_calendar

            account = self.get_account(account_id)
            if not account:
                logging.error(f"Account {account_id} not found")
                return []

            if account["provider"] != "google":
                logging.warning(f"Provider {account['provider']} not supported for sync")
                return []

            # Get credentials from account
            creds_dict = account["credentials"]
            from google.oauth2.credentials import Credentials

            credentials = Credentials(
                token=creds_dict["token"],
                refresh_token=creds_dict.get("refresh_token"),
                token_uri=creds_dict.get("token_uri", "https://oauth2.googleapis.com/token"),
                client_id=creds_dict.get("client_id"),
                client_secret=creds_dict.get("client_secret"),
                scopes=creds_dict.get("scopes", []),
            )

            # Refresh if needed
            credentials = google_calendar.refresh_credentials_if_needed(credentials)

            # Build calendar service
            from googleapiclient.discovery import build
            service = build("calendar", "v3", credentials=credentials)

            # Fetch calendar list
            calendars = []
            page_token = None
            while True:
                calendar_list = service.calendarList().list(pageToken=page_token).execute()
                items = calendar_list.get("items", [])
                calendars.extend(items)
                page_token = calendar_list.get("nextPageToken")
                if not page_token:
                    break

            # Upsert calendar sources
            synced_sources = []
            for cal in calendars:
                calendar_id = cal["id"]
                calendar_name = cal.get("summary", calendar_id)
                color = cal.get("backgroundColor", "#4285F4")
                is_primary = cal.get("primary", False)

                # Check if source already exists
                existing = (
                    self.service_role_client.table("calendar_sources")
                    .select("*")
                    .eq("account_id", account_id)
                    .eq("calendar_id", calendar_id)
                    .execute()
                )

                if existing.data:
                    # Update existing source (preserve enabled/write settings)
                    source = existing.data[0]
                    self.service_role_client.table("calendar_sources").update({
                        "calendar_name": calendar_name,
                        "color": color,
                        "updated_at": datetime.utcnow().isoformat(),
                    }).eq("id", source["id"]).execute()
                    synced_sources.append(source)
                else:
                    # Create new source
                    # Primary calendar is enabled and set as write calendar by default
                    result = (
                        self.service_role_client.table("calendar_sources")
                        .insert({
                            "account_id": account_id,
                            "calendar_id": calendar_id,
                            "calendar_name": calendar_name,
                            "is_enabled": is_primary,  # Only enable primary by default
                            "is_write_calendar": is_primary,  # Only primary is write calendar by default
                            "color": color,
                        })
                        .execute()
                    )
                    if result.data:
                        synced_sources.append(result.data[0])

            # Update last_synced_at on account
            self.service_role_client.table("calendar_accounts").update({
                "last_synced_at": datetime.utcnow().isoformat()
            }).eq("id", account_id).execute()

            # Store updated credentials if they were refreshed
            self.update_account_credentials(account_id, {
                "token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "token_uri": credentials.token_uri,
                "client_id": credentials.client_id,
                "client_secret": credentials.client_secret,
                "scopes": list(credentials.scopes) if credentials.scopes else [],
            })

            return synced_sources

        except Exception as e:
            logging.error(f"Error syncing calendars from provider for account {account_id}: {e}")
            return []

    # =========================================================================
    # BACKWARDS COMPATIBILITY
    # =========================================================================

    def get_credentials_for_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get credentials for a user (backwards compatible).

        First checks calendar_accounts, then falls back to profiles.google_auth_token.

        Args:
            user_id: User's unique ID

        Returns:
            Credentials dict or None
        """
        try:
            # Try calendar_accounts first
            accounts = self.get_user_accounts(user_id)
            if accounts:
                # Return credentials from the first Google account
                for account in accounts:
                    if account["provider"] == "google" and account.get("credentials"):
                        return account["credentials"]

            # Fall back to profiles.google_auth_token
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
        """
        Ensure a calendar account exists for the user, creating if needed.

        This is used during OAuth callback to create/update the account.

        Args:
            user_id: User's unique ID
            provider: Provider name (e.g., 'google')
            provider_email: Email from provider
            credentials: OAuth credentials

        Returns:
            Account data or None on failure
        """
        try:
            # Check if account exists
            existing = self.get_account_by_provider(user_id, provider, provider_email)

            if existing:
                # Update credentials
                self.update_account_credentials(existing["id"], credentials)
                return self.get_account(existing["id"])
            else:
                # Create new account
                account = self.create_account(
                    user_id=user_id,
                    provider=provider,
                    provider_email=provider_email,
                    provider_account_id=provider_email,
                    credentials=credentials,
                )
                return account

        except Exception as e:
            logging.error(f"Error ensuring account exists: {e}")
            return None
