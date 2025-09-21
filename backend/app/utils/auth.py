"""
Authentication utilities for Supabase integration.
"""

from flask import request, jsonify, redirect
from typing import Optional, Dict, Any, Tuple
from .supabase_client import get_supabase
from ..services.google_calendar import get_auth_url
import logging

def login() -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    login a user with Google OAuth.
    redirect to the Google OAuth login page.
    get the code from the callback.
    exchange the code for a token.
    store the token in the database.
    return the user data.
    """
    auth_url = get_auth_url()
    return redirect(auth_url)

def logout(access_token: str) -> Tuple[bool, Optional[str]]:
    """
    Log out a user by invalidating their session.
    
    Args:
        access_token (str): The user's access token
        
    Returns:
        Tuple[bool, Optional[str]]: 
            - True if logout successful, False otherwise
            - Error message if logout failed, None otherwise
    """
    try:
        # Get Supabase client
        supabase = get_supabase()
        
        # Sign out the user
        supabase.auth.sign_out(access_token)
        return True, None
    except Exception as e:
        return False, f"Logout failed: {str(e)}"

def refresh_session(refresh_token: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Refresh a user's session using their refresh token.
    
    Args:
        refresh_token (str): The user's refresh token
        
    Returns:
        Tuple[Optional[Dict[str, Any]], Optional[str]]:
            - New session data if refresh successful, None otherwise
            - Error message if refresh failed, None otherwise
    """
    try:
        # Get Supabase client
        supabase = get_supabase()
        
        # Refresh the session
        response = supabase.auth.refresh_session({
            "refresh_token": refresh_token
        })
        
        # Get new session data
        session = response.session
        user = response.user
        
        return {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "user": user
        }, None
        
    except Exception as e:
        return None, f"Session refresh failed: {str(e)}"

def get_user_from_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Get user information from a Supabase JWT token.
    
    Args:
        token (str): The JWT token from Supabase Auth
        
    Returns:
        Optional[Dict[str, Any]]: User information if token is valid, None otherwise
    """
    try:
        # Get Supabase client
        supabase = get_supabase()
        
        # Verify the token and get user info
        user = supabase.auth.get_user(token)
        return user.user
    except Exception as e:
        print(f"Error verifying token: {str(e)}")
        return None

def get_current_user() -> Optional[Dict[str, Any]]:
    """
    Get the current authenticated user from the request.
    
    Returns:
        Optional[Dict[str, Any]]: User information if authenticated, None otherwise
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    token = auth_header.split(" ")[1]
    return get_user_from_token(token)

def verify_token(token: str) -> bool:
    """
    Verify if a Supabase JWT token is valid.
    
    Args:
        token (str): The JWT token to verify
        
    Returns:
        bool: True if token is valid, False otherwise
    """
    try:
        # Attempt to get user info from token
        user = get_user_from_token(token)
        return user is not None
    except Exception:
        return False

def get_user_profile(user_id: str, token: str) -> Optional[Dict[str, Any]]:
    """
    Get a user's profile from the profiles table.
    
    Args:
        user_id (str): The user's ID
        
    Returns:
        Optional[Dict[str, Any]]: Profile information if found, None otherwise
    """
    try:
        supabase = get_supabase(token)
        profile = (
            supabase.table("profiles")
            .select("*")
            .eq("id", user_id)
            .execute()
        )
        if profile.data:
            return profile.data[0]
        return None
    except Exception as e:
        print(f"Error getting user profile: {str(e)}")
        return None

def get_user_with_profile(user_id, token):
    try:
        supabase = get_supabase(token)
        profile = (
            supabase.table("profiles")
            .select("*")
            .eq("id", user_id)
            .execute()
        )
        logging.info(f"Profile: {profile.data}")
        if profile.data:
            return profile.data[0]
        return None
    except Exception as e:
        logging.error(f"Error getting user profile: {str(e)}")
        return None
# def get_user_with_profile(user_id: str) -> Optional[Dict[str, Any]]:
#     """
#     Get a user's information including their profile and email.
    
#     Args:
#         user_id (str): The user's ID
        
#     Returns:
#         Optional[Dict[str, Any]]: Combined user and profile information if found, None otherwise
#     """
#     try:
#         # Get Supabase client
#         supabase = get_supabase()
        
#         # Get user from auth
#         auth_user = supabase.auth.admin.get_user_by_id(user_id)
#         if not auth_user:
#             return None
            
#         # Get profile from database
#         profile = get_user_profile(user_id)
#         if not profile:
#             return None
            
#         # Combine user and profile data
#         user_data = profile.copy()
#         user_data["email"] = auth_user.user.email
        
#         return user_data
#     except Exception as e:
#         print(f"Error getting user with profile: {str(e)}")
#         return None 