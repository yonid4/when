"""
Microsoft/Outlook Calendar service for handling OAuth and calendar operations.

Notes:
- Uses MSAL (Microsoft Authentication Library) for OAuth2 flows.
- Credentials are stored on the `profiles` table under `microsoft_auth_token`.
- Also stored in `calendar_accounts` with provider="microsoft".
- Uses requests to call Microsoft Graph API directly.
"""

import logging
import time
from typing import Optional

import requests
from flask import current_app
from msal import ConfidentialClientApplication

SCOPES = ["Calendars.ReadWrite", "User.Read", "offline_access"]
GRAPH_API_BASE = "https://graph.microsoft.com/v1.0"


def create_flow() -> ConfidentialClientApplication:
    """Create an MSAL ConfidentialClientApplication instance."""
    client_id = current_app.config.get("MICROSOFT_CLIENT_ID")
    client_secret = current_app.config.get("MICROSOFT_CLIENT_SECRET")
    tenant_id = current_app.config.get("MICROSOFT_TENANT_ID", "common")

    if not client_id or not client_secret:
        raise ValueError("Microsoft OAuth credentials not configured")

    authority = f"https://login.microsoftonline.com/{tenant_id}"

    return ConfidentialClientApplication(
        client_id,
        authority=authority,
        client_credential=client_secret,
    )


def get_auth_url() -> str:
    """Generate the Microsoft OAuth2 authorization URL."""
    try:
        msal_app = create_flow()
        redirect_uri = current_app.config.get("MICROSOFT_REDIRECT_URI")
        auth_url = msal_app.get_authorization_request_url(
            scopes=SCOPES,
            redirect_uri=redirect_uri,
        )
        return auth_url
    except Exception as e:
        raise ValueError(f"Failed to generate auth URL: {str(e)}")


def get_credentials_from_code(code: str) -> dict:
    """Exchange authorization code for credentials."""
    try:
        msal_app = create_flow()
        redirect_uri = current_app.config.get("MICROSOFT_REDIRECT_URI")
        result = msal_app.acquire_token_by_authorization_code(
            code,
            scopes=SCOPES,
            redirect_uri=redirect_uri,
        )

        if "error" in result:
            raise ValueError(
                f"Token acquisition failed: {result.get('error_description', result.get('error'))}"
            )

        return {
            "access_token": result["access_token"],
            "refresh_token": result.get("refresh_token"),
            "expires_at": time.time() + result.get("expires_in", 3600),
            "scope": result.get("scope", ""),
            "token_type": result.get("token_type", "Bearer"),
        }
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Failed to get credentials: {str(e)}")


def store_credentials(user_id: str, credentials: dict, provider_email: str = None) -> None:
    """
    Store user's Microsoft credentials securely.

    Stores in both calendar_accounts (new) and profiles.microsoft_auth_token (legacy)
    for backwards compatibility during migration.
    """
    import os
    from datetime import datetime

    from supabase import create_client

    from ..utils.supabase_client import get_supabase

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if supabase_url and supabase_service_key:
        supabase = create_client(supabase_url, supabase_service_key)
    else:
        supabase = get_supabase()

    creds_dict = credentials if isinstance(credentials, dict) else {}

    check_response = (
        supabase.table("profiles")
        .select("id, email")
        .eq("id", user_id)
        .execute()
    )

    if not check_response.data:
        logging.error(f"[ERROR] No profile found for user {user_id}")
        return

    profile = check_response.data[0]

    try:
        supabase.table("profiles").update({
            "microsoft_auth_token": creds_dict
        }).eq("id", user_id).execute()
    except Exception as e:
        logging.error(f"[ERROR] Failed to store credentials in profiles: {e}")

    try:
        email = provider_email or profile.get("email")

        if email:
            existing_account = (
                supabase.table("calendar_accounts")
                .select("id")
                .eq("user_id", user_id)
                .eq("provider", "microsoft")
                .eq("provider_account_id", email)
                .execute()
            )

            if existing_account.data:
                supabase.table("calendar_accounts").update({
                    "credentials": creds_dict
                }).eq("id", existing_account.data[0]["id"]).execute()
            else:
                supabase.table("calendar_accounts").insert({
                    "user_id": user_id,
                    "provider": "microsoft",
                    "provider_email": email,
                    "provider_account_id": email,
                    "credentials": creds_dict,
                    "connected_at": datetime.utcnow().isoformat(),
                }).execute()
    except Exception as e:
        logging.debug(f"[DEBUG] calendar_accounts storage failed (may not exist yet): {e}")


def get_stored_credentials(user_id: str) -> Optional[dict]:
    """
    Retrieve stored Microsoft credentials for a user.

    First checks calendar_accounts table (new multi-calendar system),
    then falls back to profiles.microsoft_auth_token (legacy).
    """
    import os

    from supabase import create_client

    from ..utils.supabase_client import get_supabase

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if supabase_url and supabase_service_key:
        supabase = create_client(supabase_url, supabase_service_key)
    else:
        supabase = get_supabase()

    creds_dict = None

    try:
        accounts_response = (
            supabase.table("calendar_accounts")
            .select("credentials")
            .eq("user_id", user_id)
            .eq("provider", "microsoft")
            .limit(1)
            .execute()
        )

        if accounts_response.data and accounts_response.data[0].get("credentials"):
            creds_dict = accounts_response.data[0]["credentials"]
    except Exception as e:
        logging.debug(f"calendar_accounts lookup failed (may not exist yet): {e}")

    if not creds_dict:
        response = (
            supabase.table("profiles")
            .select("microsoft_auth_token")
            .eq("id", user_id)
            .execute()
        )

        if not response.data or not response.data[0].get("microsoft_auth_token"):
            return None

        creds_dict = response.data[0]["microsoft_auth_token"]

    return creds_dict or None


def refresh_credentials_if_needed(credentials: dict) -> dict:
    """Refresh credentials if they are expired and have a refresh token."""
    if not credentials:
        return credentials

    expires_at = credentials.get("expires_at", 0)
    if time.time() < expires_at:
        return credentials

    refresh_token = credentials.get("refresh_token")
    if not refresh_token:
        return credentials

    try:
        msal_app = create_flow()
        result = msal_app.acquire_token_by_refresh_token(
            refresh_token,
            scopes=SCOPES,
        )

        if "error" in result:
            raise ValueError(
                f"Token refresh failed: {result.get('error_description', result.get('error'))}"
            )

        credentials["access_token"] = result["access_token"]
        credentials["expires_at"] = time.time() + result.get("expires_in", 3600)
        if result.get("refresh_token"):
            credentials["refresh_token"] = result["refresh_token"]

        return credentials
    except Exception as e:
        raise ValueError(f"Failed to refresh credentials: {str(e)}")


def validate_credentials(credentials: dict) -> bool:
    """Check if credentials are valid or can be refreshed."""
    if not credentials:
        return False

    access_token = credentials.get("access_token")
    if not access_token:
        return False

    expires_at = credentials.get("expires_at", 0)
    if time.time() < expires_at:
        return True

    if credentials.get("refresh_token"):
        try:
            refreshed = refresh_credentials_if_needed(credentials)
            return bool(refreshed and refreshed.get("access_token"))
        except Exception:
            return False

    return False


def get_calendar_service(credentials: dict, user_id: str) -> dict:
    """
    Prepare Microsoft calendar credentials for Graph API calls.

    Refreshes if needed, stores updated creds, and returns
    a dict with access_token and a helper function for API calls.
    """
    credentials = refresh_credentials_if_needed(credentials)
    store_credentials(user_id, credentials)

    def graph_request(method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make an authenticated request to Microsoft Graph API."""
        headers = kwargs.pop("headers", {})
        headers["Authorization"] = f"Bearer {credentials['access_token']}"
        headers.setdefault("Content-Type", "application/json")
        url = f"{GRAPH_API_BASE}{endpoint}"
        return requests.request(method, url, headers=headers, **kwargs)

    return {
        "access_token": credentials["access_token"],
        "graph_request": graph_request,
    }


def revoke_credentials(user_id: str) -> None:
    """
    Remove the user's stored Microsoft OAuth credentials.

    Microsoft doesn't have a simple token revoke endpoint,
    so we just clear the stored tokens.
    """
    from ..utils.supabase_client import get_supabase

    supabase = get_supabase()

    supabase.table("profiles").update({
        "microsoft_auth_token": None
    }).eq("id", user_id).execute()

    try:
        supabase.table("calendar_accounts").delete().eq(
            "user_id", user_id
        ).eq("provider", "microsoft").execute()
    except Exception as e:
        logging.debug(f"calendar_accounts cleanup failed: {e}")


def get_user_calendars(user_id: str) -> list:
    """List all available calendars for the user."""
    credentials = get_stored_credentials(user_id)
    if not validate_credentials(credentials):
        raise Exception("Invalid Microsoft credentials")

    service = get_calendar_service(credentials, user_id)
    response = service["graph_request"]("GET", "/me/calendars")
    response.raise_for_status()
    data = response.json()

    return [
        {
            "id": c["id"],
            "summary": c.get("name"),
            "primary": c.get("isDefaultCalendar", False),
        }
        for c in data.get("value", [])
    ]


def get_user_calendars_list(credentials: dict) -> list:
    """List all available calendars using provided credentials."""
    if not validate_credentials(credentials):
        raise Exception("Invalid Microsoft credentials")

    credentials = refresh_credentials_if_needed(credentials)
    headers = {
        "Authorization": f"Bearer {credentials['access_token']}",
        "Content-Type": "application/json",
    }
    response = requests.get(f"{GRAPH_API_BASE}/me/calendars", headers=headers)
    response.raise_for_status()
    data = response.json()

    return [
        {
            "id": c["id"],
            "summary": c.get("name", c["id"]),
            "primary": c.get("isDefaultCalendar", False),
            "backgroundColor": c.get("hexColor"),
            "foregroundColor": None,
            "accessRole": "owner" if c.get("canEdit") else "reader",
            "selected": True,
        }
        for c in data.get("value", [])
    ]


def get_credentials_from_dict(creds_dict: dict) -> dict:
    """Return credentials dict as-is (Microsoft creds are plain dicts)."""
    return creds_dict
