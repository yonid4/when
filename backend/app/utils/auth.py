"""
Authentication utilities for Supabase integration.
"""

import logging
from typing import Any, Dict, Optional, Tuple

from flask import redirect, request

from ..services.google_calendar import get_auth_url
from .supabase_client import get_supabase

logger = logging.getLogger(__name__)


def login():
    """Redirect to the Google OAuth login page."""
    return redirect(get_auth_url())

def logout(access_token: str) -> Tuple[bool, Optional[str]]:
    """Log out a user by invalidating their session."""
    try:
        supabase = get_supabase()
        supabase.auth.sign_out(access_token)
        return True, None
    except Exception as e:
        return False, f"Logout failed: {str(e)}"

def refresh_session(refresh_token: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """Refresh a user's session using their refresh token."""
    try:
        supabase = get_supabase()
        response = supabase.auth.refresh_session({"refresh_token": refresh_token})
        session = response.session
        return {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "user": response.user
        }, None
    except Exception as e:
        return None, f"Session refresh failed: {str(e)}"

def get_user_from_token(token: str) -> Optional[Dict[str, Any]]:
    """Get user information from a Supabase JWT token."""
    try:
        supabase = get_supabase()
        user = supabase.auth.get_user(token)
        return user.user
    except Exception as e:
        logger.error(f"Error verifying token: {e}")
        return None

def get_current_user() -> Optional[Dict[str, Any]]:
    """Get the current authenticated user from the request."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    return get_user_from_token(token)

def verify_token(token: str) -> bool:
    """Verify if a Supabase JWT token is valid."""
    return get_user_from_token(token) is not None

def get_user_profile(user_id: str, token: str) -> Optional[Dict[str, Any]]:
    """Get a user's profile from the profiles table."""
    try:
        supabase = get_supabase(token)
        profile = (
            supabase.table("profiles")
            .select("*")
            .eq("id", user_id)
            .execute()
        )
        return profile.data[0] if profile.data else None
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        return None