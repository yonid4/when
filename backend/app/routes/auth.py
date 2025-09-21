"""
Authentication routes for user login, logout, and session management.
"""

from flask import Blueprint, request, jsonify, redirect, url_for, current_app
from ..utils.auth import login, logout, refresh_session, get_current_user
from ..utils.decorators import require_auth
from ..services.google_calendar import get_auth_url, get_credentials_from_code, store_credentials
from ..utils.supabase_client import get_supabase
import logging

# Set up basic logging config if not already set
logging.basicConfig(level=logging.DEBUG)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

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
    Log in a user with Google OAuth.
    Requires authentication.
    """
    auth_url = get_auth_url()
    return redirect(auth_url)

@auth_bp.route("/logout", methods=["GET"])
@require_auth
def logout_route():
    """
    Log out the current user.
    Requires authentication.
    """
    logout()
    return jsonify({
        "message": "Successfully logged out"
    }), 200

@auth_bp.route("/refresh", methods=["POST"])
def refresh_route():
    """
    Refresh a user's session using their refresh token.
    Requires authentication.
    """
    refresh_session()
    return jsonify({
        "message": "Successfully refreshed session"
    }), 200

@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_me():
    """
    Get the current user's information.
    Requires authentication.
    """
    user = get_current_user()
    
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

        auth_url = get_auth_url()
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
        credentials = get_credentials_from_code(code)
        logging.debug(f"[DEBUG] Obtained credentials: {credentials}")
        
        # Get user from session
        supabase = get_supabase()
        session = supabase.auth.get_session()
        if not session:
            return jsonify({
                "error": "Unauthorized",
                "message": "No active session found"
            }), 401
            
        user_id = session.user.id
        
        # Store credentials
        store_credentials(user_id, credentials)
        logging.debug("[DEBUG] Credentials stored successfully")
        
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
