"""
Authentication routes for user login, logout, and session management.
"""

from flask import Blueprint, request, jsonify, redirect, current_app
from ..utils.decorators import require_auth
from ..utils.supabase_client import get_supabase
from ..services.auth import AuthService
from ..services.users import UsersService
from ..services import google_calendar
import logging

# Set up basic logging config if not already set
logging.basicConfig(level=logging.DEBUG)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
auth_service = AuthService()

@auth_bp.route("/debug/config", methods=["GET"])
def debug_config():
    """
    Debug route to check configuration (remove in production).
    """
    return jsonify({
        "google_client_id": bool(current_app.config.get("GOOGLE_CLIENT_ID")),
        "google_client_secret": bool(current_app.config.get("GOOGLE_CLIENT_SECRET")),
        "google_redirect_uri": current_app.config.get("GOOGLE_REDIRECT_URI"),
        "supabase_url": bool(current_app.config.get("SUPABASE_URL")),
        "supabase_key": bool(current_app.config.get("SUPABASE_ANON_KEY"))
    }), 200

@auth_bp.route("/login", methods=["GET"])
def login_route():
    """
    Begin Google OAuth login by redirecting to the consent screen.
    """
    auth_url = auth_service.get_google_auth_url()
    return redirect(auth_url)

@auth_bp.route("/logout", methods=["GET"])
@require_auth
def logout_route():
    """
    Log out the current user.
    Requires authentication.
    """
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.split(" ")[1] if " " in auth_header else None
    ok, err = auth_service.logout(token or "")
    if not ok:
        return jsonify({
            "error": "Logout failed",
            "message": err or "Unknown error"
        }), 400
    return jsonify({"message": "Successfully logged out"}), 200

@auth_bp.route("/refresh", methods=["POST"])
def refresh_route():
    """
    Refresh a user's session using their refresh token.
    """
    data = request.get_json() or {}
    refresh_token = data.get("refresh_token")
    if not refresh_token:
        return jsonify({
            "error": "Missing refresh_token",
            "message": "refresh_token is required"
        }), 400
    res, err = auth_service.refresh_session(refresh_token)
    if err:
        return jsonify({
            "error": "Refresh failed",
            "message": err
        }), 400
    return jsonify({"message": "Successfully refreshed session", "session": res}), 200

@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_me():
    """
    Get the current user's information.
    """
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.split(" ")[1] if " " in auth_header else None
    user = auth_service.get_user_from_token(token or "")
    if not user:
        return jsonify({
            "error": "Unauthorized",
            "message": "Invalid or expired token"
        }), 401
    return jsonify(user), 200

@auth_bp.route("/google", methods=["GET"])
def google_auth():
    """
    Initiate Google OAuth flow.
    Redirects to Google's consent screen.
    """
    logging.debug("[DEBUG] Entered /api/auth/google route")
    try:
        # Verify Google OAuth is configured
        if not current_app.config.get("GOOGLE_CLIENT_ID") or not current_app.config.get("GOOGLE_CLIENT_SECRET"):
            logging.error("[ERROR] Google OAuth credentials not configured")
            return jsonify({
                "error": "Configuration error",
                "message": "Google OAuth credentials not configured"
            }), 500

        auth_url = auth_service.get_google_auth_url()
        logging.debug(f"[DEBUG] Generated Google auth_url: {auth_url}")
        logging.debug(f"[DEBUG] Using redirect_uri: {current_app.config['GOOGLE_REDIRECT_URI']}")
        return jsonify({
            "auth_url": auth_url,
            "redirect_uri": current_app.config["GOOGLE_REDIRECT_URI"]
        }), 200
    except ValueError as e:
        logging.error(f"[ERROR] ValueError in /api/auth/google: {e}")
        return jsonify({
            "error": "Configuration error",
            "message": str(e)
        }), 400
    except Exception as e:
        logging.error(f"[ERROR] Exception in /api/auth/google: {e}")
        return jsonify({
            "error": "Server error",
            "message": str(e)
        }), 500

@auth_bp.route("/google/callback", methods=["GET"])
def google_callback():
    """
    Handle Google OAuth callback.
    Exchanges authorization code for credentials and stores them.
    """
    logging.debug("[DEBUG] Entered /api/auth/google/callback route")
    code = request.args.get("code")
    if not code:
        logging.error("[ERROR] Missing authorization code in callback")
        return jsonify({
            "error": "Missing authorization code",
            "message": "No authorization code provided"
        }), 400

    try:
        logging.debug(f"[DEBUG] Received code: {code}")
        # Get credentials from authorization code
        credentials = auth_service.exchange_code_for_credentials(code)
        logging.debug(f"[DEBUG] Obtained credentials: {credentials}")
        
        # Get user from session
        session = auth_service.get_session()
        if not session:
            return jsonify({
                "error": "Unauthorized",
                "message": "No active session found"
            }), 401
            
        user_id = session.user.id
        
        # Store credentials
        auth_service.store_google_credentials(user_id, credentials)
        logging.debug("[DEBUG] Credentials stored successfully")
        
        # Enrich profile with Google data
        try:
            # Get user metadata from session
            user_metadata = session.user.user_metadata or {}
            
            # Prepare profile updates with Google data
            profile_updates = {
                "avatar_url": user_metadata.get("avatar_url"),
                "google_auth_token": credentials,  # Store the full credentials object
            }
            
            # Get Google Calendar info (primary calendar ID and timezone)
            try:
                # Get user's calendars to find the primary one
                calendars = google_calendar.get_user_calendars(user_id)
                primary_calendar = next((cal for cal in calendars if cal.get("primary")), None)
                
                if primary_calendar:
                    profile_updates["google_calendar_id"] = primary_calendar["id"]
                    logging.info(f"[AUTH] Found primary calendar: {primary_calendar['id']}")
                else:
                    profile_updates["google_calendar_id"] = None
                    logging.warning(f"[AUTH] No primary calendar found for user {user_id}")
                
                # Get timezone from primary calendar
                if primary_calendar:
                    try:
                        # Use the stored credentials to get calendar details
                        stored_creds = google_calendar.get_stored_credentials(user_id)
                        if stored_creds:
                            service = google_calendar.get_calendar_service(stored_creds, user_id)
                            calendar_details = service.calendars().get(calendarId=primary_calendar["id"]).execute()
                            timezone = calendar_details.get("timeZone", "UTC")
                            profile_updates["timezone"] = timezone
                            logging.info(f"[AUTH] Set timezone to: {timezone}")
                        else:
                            profile_updates["timezone"] = "UTC"
                    except Exception as e:
                        logging.warning(f"[AUTH] Could not fetch calendar timezone: {e}")
                        profile_updates["timezone"] = "UTC"
                else:
                    profile_updates["timezone"] = "UTC"
                    
            except Exception as e:
                logging.error(f"[AUTH] Error fetching Google Calendar info: {e}")
                # Fallback to default values
                profile_updates.update({
                    "google_calendar_id": None,
                    "timezone": "UTC"
                })
            
            # Update the profile with Google data
            users_service = UsersService()
            updated_profile = users_service.update_profile(user_id, profile_updates)
            
            if updated_profile:
                logging.info(f"[AUTH] Enriched profile for user {user_id} with Google data")
            else:
                logging.warning(f"[AUTH] Failed to enrich profile for user {user_id}")
                
        except Exception as e:
            logging.error(f"[AUTH] Error enriching profile with Google data: {e}")
            # Don't fail the entire flow if profile update fails
        
        # Redirect to frontend with success
        frontend_url = request.headers.get("Origin", "http://localhost:3000")
        return redirect(f"{frontend_url}/events")
        
    except ValueError as e:
        logging.error(f"[ERROR] ValueError in /api/auth/google/callback: {e}")
        return jsonify({
            "error": "Authentication failed",
            "message": str(e)
        }), 400
    except Exception as e:
        logging.error(f"[ERROR] Exception in /api/auth/google/callback: {e}")
        return jsonify({
            "error": "Server error",
            "message": str(e)
        }), 500

@auth_bp.route("/google/connect", methods=["POST"])
@require_auth
def connect_google_calendar():
    """
    Connect a user's Google Calendar.
    """
    user_id = request.user.id
    users_service = UsersService(getattr(request, "access_token", None))
    profile = users_service.get_profile(user_id)
    return jsonify({
        "message": "Google Calendar connected",
        "profile": profile
    }), 200

@auth_bp.route("/enrich-profile", methods=["POST"])
@require_auth
def enrich_profile():
    """
    Enrich an existing profile with Google data.
    This is called after Supabase Auth sign-in to add Google Calendar data.
    """
    user_id = request.user.id
    
    try:
        # Get user's current profile
        access_token = getattr(request, "access_token", None)
        logging.info(f"[AUTH] Enriching profile for user {user_id}, has token: {bool(access_token)}")
        users_service = UsersService(access_token)
        profile = users_service.get_profile(user_id)
        logging.info(f"[AUTH] Profile fetched: {profile is not None}")
        logging.info(f"[AUTH] Profile data: {profile}")
        
        if not profile:
            return jsonify({
                "error": "Profile not found",
                "message": "User profile does not exist"
            }), 404
            
        # Check if user already has Google credentials
        if profile.get("google_auth_token"):
            return jsonify({
                "message": "Profile already enriched with Google data",
                "google_calendar_id": profile.get("google_calendar_id")
            }), 200
            
        # Get user metadata from the JWT token (we already have the user from the decorator)
        user_metadata = request.user.user_metadata or {}
        
        # For now, just update with basic Google metadata
        # (avatar_url from Google sign-in metadata)
        profile_updates = {
            "avatar_url": user_metadata.get("avatar_url"),
            "google_auth_token": None,  # Will be set when user connects calendar
            "google_calendar_id": None,  # Will be set when user connects calendar  
            "timezone": "UTC"  # Default timezone
        }
        
        # Update the profile
        updated_profile = users_service.update_profile(user_id, profile_updates)
        
        if updated_profile:
            logging.info(f"[AUTH] Enriched profile for user {user_id} with basic Google data")
            return jsonify({
                "message": "Profile enriched with basic Google data",
                "profile": updated_profile
            }), 200
        else:
            return jsonify({
                "error": "Failed to enrich profile",
                "message": "Could not update profile with Google data"
            }), 500
            
    except Exception as e:
        logging.error(f"[AUTH] Error enriching profile: {e}")
        return jsonify({
            "error": "Failed to enrich profile",
            "message": str(e)
        }), 500
