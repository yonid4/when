"""
Google Calendar service for handling OAuth and calendar operations.
"""

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from flask import current_app, url_for, request
import json
from typing import Dict, Any, Optional

SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    # "https://www.googleapis.com/auth/calendar.events"
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
        return flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
            redirect_uri=current_app.config["GOOGLE_REDIRECT_URI"]
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
        return flow.credentials
    except Exception as e:
        raise ValueError(f"Failed to get credentials: {str(e)}")

def get_calendar_service(credentials: Credentials):
    """
    Create a Google Calendar API service instance.
    
    Args:
        credentials (Credentials): Google API credentials
        
    Returns:
        Resource: Google Calendar API service
    """
    return build("calendar", "v3", credentials=credentials)

def store_credentials(user_id: str, credentials: Credentials) -> None:
    """
    Store user's Google credentials securely.
    
    Args:
        user_id (str): User's ID
        credentials (Credentials): Google API credentials
    """
    from ..utils.supabase_client import get_supabase
    
    supabase = get_supabase()
    
    # Convert credentials to dict for storage
    creds_dict = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": credentials.scopes
    }
    
    # Update user profile with credentials
    supabase.table("profiles").update({
        "google_auth_token": creds_dict
    }).eq("id", user_id).execute()

def get_stored_credentials(user_id: str) -> Optional[Credentials]:
    """
    Retrieve stored Google credentials for a user.
    
    Args:
        user_id (str): User's ID
        
    Returns:
        Optional[Credentials]: Stored credentials if found, None otherwise
    """
    from ..utils.supabase_client import get_supabase
    
    supabase = get_supabase()
    
    # Get user profile with stored credentials
    response = supabase.table("profiles").select("google_auth_token").eq("id", user_id).execute()
    
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
