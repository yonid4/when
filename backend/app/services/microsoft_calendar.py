"""
Microsoft/Outlook Calendar service for handling OAuth and calendar operations.

Notes:
- Uses MSAL (Microsoft Authentication Library) for OAuth2 flows.
- Credentials are stored on the ``profiles`` table under ``microsoft_auth_token``
  and in ``calendar_accounts`` with provider="microsoft".
- Uses requests to call Microsoft Graph API directly.
"""

import logging
import os
import time
from datetime import datetime
from typing import Optional

import requests
from flask import current_app
from msal import ConfidentialClientApplication
from supabase import create_client

from ..utils.supabase_client import get_supabase

SCOPES = ["Calendars.ReadWrite", "User.Read", "offline_access"]
GRAPH_API_BASE = "https://graph.microsoft.com/v1.0"


def _get_service_role_client():
    """Get a Supabase client with service-role privileges, falling back to anon."""
    supabase_url = os.getenv("SUPABASE_URL")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if supabase_url and service_role_key:
        return create_client(supabase_url, service_role_key)
    return get_supabase()


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


def get_auth_url(state: str | None = None) -> str:
    """Generate the Microsoft OAuth2 authorization URL."""
    try:
        msal_app = create_flow()
        redirect_uri = current_app.config.get("MICROSOFT_REDIRECT_URI")
        kwargs = {"scopes": SCOPES, "redirect_uri": redirect_uri}
        if state:
            kwargs["state"] = state
        return msal_app.get_authorization_request_url(**kwargs)
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
    except Exception as e:
        raise ValueError(f"Failed to get credentials: {e}") from e


def store_credentials(user_id: str, credentials: dict, provider_email: str = None) -> None:
    """Store Microsoft credentials in both profiles (legacy) and calendar_accounts."""
    supabase = _get_service_role_client()
    creds_dict = credentials if isinstance(credentials, dict) else {}

    check_response = (
        supabase.table("profiles")
        .select("id, email_address")
        .eq("id", user_id)
        .execute()
    )

    if not check_response.data:
        logging.error(f"No profile found for user {user_id}")
        return

    profile = check_response.data[0]

    try:
        supabase.table("profiles").update({
            "microsoft_auth_token": creds_dict
        }).eq("id", user_id).execute()
    except Exception as e:
        logging.error(f"Failed to store credentials in profiles: {e}")

    try:
        email = provider_email or profile.get("email_address")

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
        logging.debug(f"calendar_accounts storage failed (may not exist yet): {e}")


def get_stored_credentials(user_id: str) -> Optional[dict]:
    """Retrieve stored Microsoft credentials, checking calendar_accounts first, then profiles."""
    supabase = _get_service_role_client()
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
    """Refresh credentials if expired. Returns credentials unchanged if still valid."""
    if not credentials or not credentials.get("refresh_token"):
        return credentials

    if time.time() < credentials.get("expires_at", 0):
        return credentials

    try:
        msal_app = create_flow()
        result = msal_app.acquire_token_by_refresh_token(
            credentials["refresh_token"],
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
        raise ValueError(f"Failed to refresh credentials: {e}") from e


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
    """Refresh credentials, persist them, and return a Graph API request helper."""
    credentials = refresh_credentials_if_needed(credentials)
    store_credentials(user_id, credentials)

    def graph_request(method: str, endpoint: str, **kwargs) -> requests.Response:
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
    """Remove stored Microsoft OAuth credentials (no remote revocation endpoint)."""
    supabase = _get_service_role_client()

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
            "backgroundColor": c.get("hexColor") or "#0078D4",
            "foregroundColor": None,
            "accessRole": "owner" if c.get("canEdit") else "reader",
            "selected": True,
        }
        for c in data.get("value", [])
    ]


def _prepare_microsoft_event(event_data: dict, include_online_meeting: bool = False) -> dict:
    """Convert internal (Google-like) event format to Microsoft Graph API format."""
    start_dt = event_data["start"]["dateTime"]
    end_dt = event_data["end"]["dateTime"]
    tz = event_data["start"].get("timeZone", "UTC")

    # Microsoft Graph expects no trailing Z with explicit timeZone
    if isinstance(start_dt, str) and start_dt.endswith("Z"):
        start_dt = start_dt[:-1]
    if isinstance(end_dt, str) and end_dt.endswith("Z"):
        end_dt = end_dt[:-1]

    ms_event = {
        "subject": event_data.get("summary", ""),
        "body": {
            "contentType": "text",
            "content": event_data.get("description", ""),
        },
        "start": {
            "dateTime": start_dt,
            "timeZone": tz,
        },
        "end": {
            "dateTime": end_dt,
            "timeZone": tz,
        },
        "attendees": [
            {
                "emailAddress": {"address": a["email"], "name": a.get("name", "")},
                "type": "required",
            }
            for a in event_data.get("attendees", [])
        ],
    }

    if include_online_meeting:
        ms_event["isOnlineMeeting"] = True
        ms_event["onlineMeetingProvider"] = "teamsForBusiness"

    return ms_event


def create_calendar_event(
    credentials: dict,
    user_id: str,
    calendar_id: str | None,
    event_data: dict,
    include_online_meeting: bool = False,
) -> dict:
    """Create a calendar event via Microsoft Graph API.

    Returns normalized result: {"id", "htmlLink", "onlineMeetingUrl"}.
    """
    service = get_calendar_service(credentials, user_id)
    ms_event = _prepare_microsoft_event(event_data, include_online_meeting)

    if calendar_id and calendar_id != "primary":
        endpoint = f"/me/calendars/{calendar_id}/events"
    else:
        endpoint = "/me/events"

    response = service["graph_request"]("POST", endpoint, json=ms_event)
    response.raise_for_status()
    created = response.json()

    online_meeting_url = None
    if created.get("onlineMeeting") and created["onlineMeeting"].get("joinUrl"):
        online_meeting_url = created["onlineMeeting"]["joinUrl"]

    return {
        "id": created["id"],
        "htmlLink": created.get("webLink", ""),
        "onlineMeetingUrl": online_meeting_url,
    }


def create_calendar_event_with_retry(
    credentials: dict,
    user_id: str,
    calendar_id: str | None,
    event_data: dict,
    include_online_meeting: bool = False,
    max_retries: int = 3,
) -> dict:
    """Create a calendar event with retry logic for transient errors."""
    for attempt in range(max_retries):
        try:
            return create_calendar_event(
                credentials=credentials,
                user_id=user_id,
                calendar_id=calendar_id,
                event_data=event_data,
                include_online_meeting=include_online_meeting,
            )
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code if e.response is not None else 0

            if status_code == 401:
                raise Exception("Microsoft authentication failed. Please reconnect your calendar.") from e

            is_retryable = status_code in (429, 500, 502, 503, 504)
            if is_retryable and attempt < max_retries - 1:
                time.sleep(2 ** attempt)
                continue

            if status_code == 429:
                raise Exception("Microsoft Calendar API rate limit exceeded. Please try again in a moment.") from e

            raise Exception(f"Failed to create Microsoft calendar event: {e}") from e

        except Exception as e:
            if attempt == max_retries - 1:
                raise Exception(f"Failed to create Microsoft calendar event: {e}") from e
            time.sleep(2 ** attempt)

    raise Exception("Failed to create Microsoft event after maximum retries")
