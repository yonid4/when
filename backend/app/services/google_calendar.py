"""
Google Calendar service for handling OAuth and calendar operations.

Notes:
- Credentials are stored on the `profiles` table under `google_auth_token`.
- `get_calendar_service` refreshes tokens when expired and persists the fresh token.
"""

from typing import Optional

from flask import current_app
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid'
]


def create_flow() -> Flow:
    """Create a Google OAuth2 flow instance."""
    if not current_app.config.get("GOOGLE_CLIENT_ID") or not current_app.config.get("GOOGLE_CLIENT_SECRET"):
        raise ValueError("Google OAuth credentials not configured")

    client_config = {
        "web": {
            "client_id": current_app.config["GOOGLE_CLIENT_ID"],
            "client_secret": current_app.config["GOOGLE_CLIENT_SECRET"],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [current_app.config["GOOGLE_REDIRECT_URI"]]
        }
    }

    return Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=current_app.config["GOOGLE_REDIRECT_URI"]
    )


def get_auth_url() -> str:
    """Generate the Google OAuth2 authorization URL."""
    try:
        flow = create_flow()
        return flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent"
        )[0]
    except Exception as e:
        raise ValueError(f"Failed to generate auth URL: {str(e)}")

def get_credentials_from_code(code: str) -> Credentials:
    """Exchange authorization code for credentials."""
    import os
    os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'

    try:
        flow = create_flow()
        flow.fetch_token(code=code)

        actual_scopes = flow.credentials.scopes or SCOPES

        return Credentials(
            token=flow.credentials.token,
            refresh_token=flow.credentials.refresh_token,
            token_uri=current_app.config.get("GOOGLE_TOKEN_URI", "https://oauth2.googleapis.com/token"),
            client_id=current_app.config['GOOGLE_CLIENT_ID'],
            client_secret=current_app.config['GOOGLE_CLIENT_SECRET'],
            scopes=actual_scopes
        )
    except Exception as e:
        raise ValueError(f"Failed to get credentials: {str(e)}")

def store_credentials(user_id: str, credentials: Credentials, provider_email: str = None) -> None:
    """
    Store user's Google credentials securely.

    Stores in both calendar_accounts (new) and profiles.google_auth_token (legacy)
    for backwards compatibility during migration.
    """
    import logging
    import os
    from datetime import datetime

    from supabase import create_client

    from ..utils.supabase_client import get_supabase

    supabase_url = os.getenv('SUPABASE_URL')
    supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if supabase_url and supabase_service_key:
        supabase = create_client(supabase_url, supabase_service_key)
    else:
        supabase = get_supabase()

    if isinstance(credentials, dict):
        creds_dict = credentials
    else:
        creds_dict = {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": list(credentials.scopes) if credentials.scopes else []
        }

    check_response = supabase.table("profiles").select(
        "id, email_address, google_calendar_id"
    ).eq("id", user_id).execute()

    if not check_response.data:
        logging.error(f"[ERROR] No profile found for user {user_id}")
        return

    profile = check_response.data[0]

    try:
        supabase.table("profiles").update({
            "google_auth_token": creds_dict
        }).eq("id", user_id).execute()
    except Exception as e:
        logging.error(f"[ERROR] Failed to store credentials in profiles: {e}")

    try:
        email = provider_email or profile.get("google_calendar_id") or profile.get("email_address")

        if email:
            existing_account = (
                supabase.table("calendar_accounts")
                .select("id")
                .eq("user_id", user_id)
                .eq("provider", "google")
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
                    "provider": "google",
                    "provider_email": email,
                    "provider_account_id": email,
                    "credentials": creds_dict,
                    "connected_at": datetime.utcnow().isoformat(),
                }).execute()
    except Exception as e:
        logging.debug(f"[DEBUG] calendar_accounts storage failed (may not exist yet): {e}")

def get_stored_credentials(user_id: str) -> Optional[Credentials]:
    """
    Retrieve stored Google credentials for a user.

    First checks calendar_accounts table (new multi-calendar system),
    then falls back to profiles.google_auth_token (legacy).
    """
    import logging
    import os

    from supabase import create_client

    from ..utils.supabase_client import get_supabase

    supabase_url = os.getenv('SUPABASE_URL')
    supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

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
            .eq("provider", "google")
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
            .select("google_auth_token")
            .eq("id", user_id)
            .execute()
        )

        if not response.data or not response.data[0].get("google_auth_token"):
            return None

        creds_dict = response.data[0]["google_auth_token"]

    if not creds_dict:
        return None

    return get_credentials_from_dict(creds_dict)

def refresh_credentials_if_needed(credentials: Credentials) -> Credentials:
    """Refresh credentials if they are expired and have a refresh token."""
    if credentials and credentials.expired and credentials.refresh_token:
        try:
            credentials.refresh(Request())
        except Exception as e:
            raise ValueError(f"Failed to refresh credentials: {str(e)}")
    return credentials


def validate_credentials(credentials: Credentials) -> bool:
    """Check if credentials are valid or can be refreshed."""
    if not credentials:
        return False
    if credentials.valid:
        return True
    if credentials.expired and credentials.refresh_token:
        try:
            credentials.refresh(Request())
            return credentials.valid
        except Exception:
            return False
    return False


def get_calendar_service(credentials: Credentials, user_id: str):
    """Create a Google Calendar API service instance."""
    credentials = refresh_credentials_if_needed(credentials)
    store_credentials(user_id, credentials)
    return build("calendar", "v3", credentials=credentials)


def revoke_credentials(user_id: str) -> None:
    """Revoke the user's stored Google OAuth credentials."""
    import requests

    from ..utils.supabase_client import get_supabase

    credentials = get_stored_credentials(user_id)
    if credentials and credentials.token:
        revoke_url = "https://oauth2.googleapis.com/revoke"
        try:
            response = requests.post(revoke_url, params={'token': credentials.token})
            response.raise_for_status()
        except Exception:
            pass

    supabase = get_supabase()
    supabase.table("profiles").update({
        "google_auth_token": None
    }).eq("id", user_id).execute()


def get_user_calendars(user_id: str) -> list:
    """List all available calendars for the user."""
    credentials = get_stored_credentials(user_id)
    if not validate_credentials(credentials):
        raise Exception("Invalid Google credentials")

    service = build("calendar", "v3", credentials=credentials)
    calendars = []
    page_token = None

    while True:
        calendar_list = service.calendarList().list(pageToken=page_token).execute()
        calendars.extend(calendar_list.get('items', []))
        page_token = calendar_list.get('nextPageToken')
        if not page_token:
            break

    return [
        {"id": c["id"], "summary": c.get("summary"), "primary": c.get("primary", False)}
        for c in calendars
    ]


def get_user_calendars_list(credentials: Credentials) -> list:
    """List all available calendars using provided credentials."""
    if not validate_credentials(credentials):
        raise Exception("Invalid Google credentials")

    service = build("calendar", "v3", credentials=credentials)
    calendars = []
    page_token = None

    while True:
        calendar_list = service.calendarList().list(pageToken=page_token).execute()
        calendars.extend(calendar_list.get('items', []))
        page_token = calendar_list.get('nextPageToken')
        if not page_token:
            break

    return [
        {
            "id": c["id"],
            "summary": c.get("summary", c["id"]),
            "primary": c.get("primary", False),
            "backgroundColor": c.get("backgroundColor"),
            "foregroundColor": c.get("foregroundColor"),
            "accessRole": c.get("accessRole"),
            "selected": c.get("selected", True),
        }
        for c in calendars
    ]


_NON_API_SCOPES = {"openid", "https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"}

def get_credentials_from_dict(creds_dict: dict) -> Credentials:
    """Create a Credentials object from a dictionary.

    Filters out OpenID/userinfo scopes that cause 'invalid_scope' errors on refresh.
    """
    api_scopes = [s for s in creds_dict.get("scopes", []) if s not in _NON_API_SCOPES] or None

    return Credentials(
        token=creds_dict["token"],
        refresh_token=creds_dict.get("refresh_token"),
        token_uri=creds_dict.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=creds_dict.get("client_id"),
        client_secret=creds_dict.get("client_secret"),
        scopes=api_scopes,
    )
