"""
Authentication routes for user login, logout, and session management.
"""

from flask import Blueprint, request, jsonify, redirect, current_app
from ..utils.decorators import require_auth
from ..utils.supabase_client import get_supabase
from ..services.auth import AuthService
from ..services.users import UsersService
from ..services import google_calendar
from datetime import timezone, timedelta
import logging

# Set up basic logging config if not already set
logging.basicConfig(level=logging.DEBUG)

# Suppress specific noisy HTTP client logs
logging.getLogger("hpack.hpack").setLevel(logging.WARNING)
logging.getLogger("httpcore.connection").setLevel(logging.WARNING)
logging.getLogger("httpcore.http2").setLevel(logging.WARNING)

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
    logging.debug(f"[DEBUG] Token: {token}")
    user = auth_service.get_user_from_token(token or "")
    print(f"[DEBUG] User: {user}")
    if not user:
        return jsonify({
            "error": "Unauthorized",
            "message": "Invalid or expired token"
        }), 401
    return jsonify(user.user_metadata), 200

@auth_bp.route("/google", methods=["GET"])
@require_auth
def google_auth():
    """
    Initiate Google OAuth flow.
    Redirects to Google's consent screen.
    """
    logging.debug("[DEBUG] Entered /api/auth/google route")
    try:
        # # Verify Google OAuth is configured
        # if not current_app.config.get("GOOGLE_CLIENT_ID") or not current_app.config.get("GOOGLE_CLIENT_SECRET"):
        #     logging.error("[ERROR] Google OAuth credentials not configured")
        #     return jsonify({
        #         "error": "Configuration error",
        #         "message": "Google OAuth credentials not configured"
        #     }), 500

        # auth_url = auth_service.get_google_auth_url()
        # logging.debug(f"[DEBUG] Generated Google auth_url: {auth_url}")
        # logging.debug(f"[DEBUG] Using redirect_uri: {current_app.config['GOOGLE_REDIRECT_URI']}")
        # return jsonify({
        #     "auth_url": auth_url,
        #     "redirect_uri": current_app.config["GOOGLE_REDIRECT_URI"]
        # }), 200
        # Get the user's token from the request
        user_token = getattr(request, "access_token", None)

        # Get return URL from query params (where to redirectafter OAuth)
        return_url = request.args.get("return_url", "/")
        
        # Generate auth URL with user token in state
        auth_url = auth_service.get_google_auth_url(user_token, return_url)
        
        return jsonify({
            "auth_url": auth_url
        }), 200
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
    state = request.args.get("state")

    if not code:
        logging.error("[ERROR] Missing authorization code in callback")
        return jsonify({
            "error": "Missing authorization code",
            "message": "No authorization code provided"
        }), 400

    try:
        logging.debug(f"[DEBUG] Received code: {code}")

        # Decode state to get user token
        import json
        import base64
        state_data = json.loads(base64.urlsafe_b64decode(state.encode()).decode())
        user_token = state_data.get('user_token')
        return_url = state_data.get('return_url', '/')  # Add this line
        # logging.debug(f"[DEBUG] User token: {user_token}")

        # Get credentials from authorization code
        credentials = auth_service.exchange_code_for_credentials(code)
        logging.debug(f"[DEBUG] Obtained credentials: {credentials}")
        
        # Get user from token (not session)
        user = auth_service.get_user_from_token(user_token)
        if not user:
            return jsonify({
                "error": "Invalid user token",
                "message": "Invalid user token"
            }), 401
            
        user_id = user.id
        
        # Store credentials
        auth_service.store_google_credentials(user_id, credentials)
        logging.debug("[DEBUG] Credentials stored successfully")
        
        # Enrich profile with Google data
        try:
            # Get user metadata from session
            user_metadata = user.user_metadata or {}
            
            # Prepare profile updates with Google data
            profile_updates = {
                "avatar_url": user_metadata.get("avatar_url"),
                # "google_auth_token": credentials,  # Store the full credentials object
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
                            user_timezone = calendar_details.get("timeZone", "UTC")
                            profile_updates["timezone"] = user_timezone
                            logging.info(f"[AUTH] Set timezone to: {user_timezone}")
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
            
            # Update the profile with Google data (if there are updates)
            if len(profile_updates) > 1:  # More than just avatar_url
                users_service = UsersService()
                updated_profile = users_service.update_profile(user_id, profile_updates)
                
                if updated_profile:
                    logging.info(f"[AUTH] Enriched profile for user {user_id} with Google data")
                else:
                    logging.warning(f"[AUTH] Failed to enrich profile for user {user_id}")

            # Auto-sync Google Calendar on connection
            try:
                from ..background_jobs.calendar_sync import sync_user_calendar_job
                from datetime import datetime
                
                logging.info(f"[AUTH] Scheduling calendar sync job for user {user_id}")
                
                # Schedule job to run immediately
                current_app.scheduler.add_job(
                    id=f'sync_calendar_{user_id}_{int(datetime.now(timezone.utc).timestamp())}',
                    func=sync_user_calendar_job,
                    args=[user_id],
                    trigger='date',
                    run_date=datetime.now(timezone.utc)
                )
                
                logging.info(f"[AUTH] Calendar sync job scheduled for user {user_id}")
                
            except Exception as e:
                logging.error(f"[AUTH] Failed to schedule calendar sync: {e}")
                
        except Exception as e:
            logging.error(f"[AUTH] Error enriching profile with Google data: {e}")
            # Don't fail the entire flow if profile update fails
        
        # Redirect to frontend with success
        frontend_url = request.headers.get("Origin", "http://localhost:3000")
        # return redirect(f"{frontend_url}/events")
        return redirect(f"{frontend_url}{return_url}")
        
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
