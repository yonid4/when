"""
Google Calendar service for handling OAuth and calendar operations.

Notes:
- Credentials are stored on the `profiles` table under `google_auth_token`.
- `get_calendar_service` refreshes tokens when expired and persists the fresh token.
- Always handle rate limits and errors at call sites; this module raises on fatal issues.
"""

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from flask import current_app
from typing import Optional
from google.auth.transport.requests import Request

SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid'
]

def create_flow() -> Flow:
    """
    Create a Google OAuth2 flow instance.
    
    Returns:
        Flow: Configured OAuth2 flow instance
    """
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
    """
    Generate the Google OAuth2 authorization URL.
    
    Returns:
        str: Authorization URL
    """
    try:
        flow = create_flow()
        # redirect_uri is already set in the flow, no need to pass it again
        return flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent"
        )[0]
    except Exception as e:
        raise ValueError(f"Failed to generate auth URL: {str(e)}")

def get_credentials_from_code(code: str) -> Credentials:
    """
    Exchange authorization code for credentials.
    
    Args:
        code (str): Authorization code from Google
        
    Returns:
        Credentials: Google API credentials
    """
    try:
        flow = create_flow()
        flow.fetch_token(code=code)

        token_data = flow.credentials.token
        refresh_token = flow.credentials.refresh_token

        # Construct credentials from the token response
        credentials = Credentials(
            token=flow.credentials.token,
            refresh_token=flow.credentials.refresh_token,
            token_uri=current_app.config.get("GOOGLE_TOKEN_URI", "https://oauth2.googleapis.com/token"),
            client_id=current_app.config['GOOGLE_CLIENT_ID'],
            client_secret=current_app.config['GOOGLE_CLIENT_SECRET'],
            scopes=SCOPES
        )
        
        return credentials
    except Exception as e:
        raise ValueError(f"Failed to get credentials: {str(e)}")

def store_credentials(user_id: str, credentials: Credentials) -> None:
    """
    Store user's Google credentials securely.
    Uses service role client to bypass RLS.
    
    Args:
        user_id (str): User's ID
        credentials (Credentials): Google API credentials
    """
    from ..utils.supabase_client import get_supabase
    from supabase import create_client
    import logging
    import os
    
    # Use service role client to bypass RLS
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if supabase_url and supabase_service_key:
        supabase = create_client(supabase_url, supabase_service_key)
    else:
        # Fallback to regular client
        supabase = get_supabase()
    
    if isinstance(credentials, dict):
        # Already a dict
        creds_dict = credentials
    else:
        # Convert credentials to dict for storage
        creds_dict = {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": list(credentials.scopes) if credentials.scopes else []
        }

    logging.debug(f"[DEBUG] Attempting to store credentials for user {user_id}")
    logging.debug(f"[DEBUG] Credentials dict keys: {creds_dict.keys()}")

    # First, check if the profile exists
    check_response = supabase.table("profiles").select("id").eq("id", user_id).execute()
    logging.debug(f"[DEBUG] Profile exists check: {check_response.data}")

    if not check_response.data:
        logging.error(f"[ERROR] No profile found for user {user_id}")
        return
    
    # Update user profile with credentials
    try:
        response = supabase.table("profiles").update({
            "google_auth_token": creds_dict
        }).eq("id", user_id).execute()
        
        logging.debug(f"[DEBUG] Store credentials response: {response}")
        logging.debug(f"[DEBUG] Response data: {response.data}")
        
        if not response.data:
            logging.error(f"[ERROR] Update returned no data for user {user_id}")
    except Exception as e:
        logging.error(f"[ERROR] Failed to store credentials: {e}")
        raise e

def get_stored_credentials(user_id: str) -> Optional[Credentials]:
    """
    Retrieve stored Google credentials for a user.
    Uses service role client to bypass RLS.
    
    Args:
        user_id (str): User's ID
        
    Returns:
        Optional[Credentials]: Stored credentials if found, None otherwise
    """
    from ..utils.supabase_client import get_supabase
    from supabase import create_client
    import os
    
    # Use service role client to bypass RLS
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if supabase_url and supabase_service_key:
        supabase = create_client(supabase_url, supabase_service_key)
    else:
        # Fallback to regular client
        supabase = get_supabase()
    
    # Get user profile with stored credentials
    response = (
        supabase.table("profiles")
        .select("google_auth_token")
        .eq("id", user_id)
        .execute()
    )
    
    if not response.data or not response.data[0].get("google_auth_token"):
        return None
        
    creds_dict = response.data[0]["google_auth_token"]
    
    return Credentials(
        token=creds_dict["token"],
        refresh_token=creds_dict["refresh_token"],
        token_uri=creds_dict["token_uri"],
        client_id=creds_dict["client_id"],
        client_secret=creds_dict["client_secret"],
        scopes=creds_dict["scopes"]
    )

def refresh_credentials_if_needed(credentials: Credentials) -> Credentials:
    """
    Refresh credentials if they are expired and have a refresh token.

    Args:
        credentials (Credentials): User's current Google OAuth credentials.

    Returns:
        Credentials: Valid credentials (refreshed if needed).
    """
    # Checks if credentials are expired or invalid
    if credentials and credentials.expired and credentials.refresh_token:
        try:
            # This does the actual refresh using the refresh token
            credentials.refresh(Request())
        except Exception as e:
            raise ValueError(f"Failed to refresh credentials: {str(e)}")
    return credentials

def validate_credentials(credentials: Credentials) -> bool:
    """
    Validates Google OAuth credentials.
    Checks if credentials are valid or can be refreshed.

    Returns:
        bool: True if credentials are valid or can be refreshed, otherwise False.
    """
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
    """
    Create a Google Calendar API service instance.
    
    Args:
        credentials (Credentials): Google API credentials
        user_id (str): User's ID
    Returns:
        Resource: Google Calendar API service
    """
    credentials = refresh_credentials_if_needed(credentials)
    store_credentials(user_id, credentials)
    return build("calendar", "v3", credentials=credentials)

def revoke_credentials(user_id: str) -> None:
    """
    Revokes the user's stored Google OAuth credentials.

    Args:
        user_id (str): The user's unique ID.
    """
    import requests

    credentials = get_stored_credentials(user_id)
    if credentials and credentials.token:
        revoke_url = "https://oauth2.googleapis.com/revoke"
        try:
            response = requests.post(revoke_url, params={'token': credentials.token})
            response.raise_for_status()
        except Exception:
            pass  # Optionally log or handle revocation errors here
    # Remove credentials from storage
    from ..utils.supabase_client import get_supabase
    supabase = get_supabase()

    supabase.table("profiles").update({
        "google_auth_token": None
    }).eq("id", user_id).execute()

def get_user_calendars(user_id: str) -> list:
    """
    Lists all available calendars for the user.

    Args:
        user_id (str): The user's unique ID.

    Returns:
        list: List of calendar dicts (e.g., with 'id' and 'summary').
    """
    credentials = get_stored_credentials(user_id)
    if not validate_credentials(credentials):
        raise Exception("Invalid Google credentials")
    service = build("calendar", "v3", credentials=credentials)
    calendars = []
    page_token = None
    while True:
        calendar_list = service.calendarList().list(pageToken=page_token).execute()
        items = calendar_list.get('items', [])
        calendars.extend(items)
        page_token = calendar_list.get('nextPageToken')
        if not page_token:
            break
    # Optionally, extract only relevant fields
    return [{"id": c["id"], "summary": c.get("summary"), "primary": c.get("primary", False)} for c in calendars]
