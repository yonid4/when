"""
Authentication routes for user login, logout, and session management.
"""

import base64
import json
import logging
from datetime import datetime, timezone

from flask import Blueprint, request, jsonify, redirect, current_app

from ..services import google_calendar
from ..services.auth import AuthService
from ..services.users import UsersService
from ..utils.decorators import require_auth

logging.basicConfig(level=logging.DEBUG)
logging.getLogger("hpack.hpack").setLevel(logging.WARNING)
logging.getLogger("httpcore.connection").setLevel(logging.WARNING)
logging.getLogger("httpcore.http2").setLevel(logging.WARNING)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
auth_service = AuthService()


def _get_access_token():
    """Get access token from request."""
    return getattr(request, "access_token", None)


def _extract_token_from_header() -> str | None:
    """Extract bearer token from Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    return auth_header.split(" ")[1] if " " in auth_header else None


def _decode_oauth_state(state: str) -> dict:
    """Decode base64 encoded OAuth state."""
    return json.loads(base64.urlsafe_b64decode(state.encode()).decode())


def _get_calendar_timezone(user_id: str, primary_calendar_id: str) -> str:
    """Get timezone from primary calendar."""
    try:
        stored_creds = google_calendar.get_stored_credentials(user_id)
        if stored_creds:
            service = google_calendar.get_calendar_service(stored_creds, user_id)
            calendar_details = service.calendars().get(calendarId=primary_calendar_id).execute()
            return calendar_details.get("timeZone", "UTC")
    except Exception as e:
        logging.warning(f"[AUTH] Could not fetch calendar timezone: {e}")
    return "UTC"


def _get_google_calendar_info(user_id: str) -> tuple[str | None, str]:
    """Get primary calendar ID and timezone from Google."""
    try:
        calendars = google_calendar.get_user_calendars(user_id)
        primary_calendar = next((cal for cal in calendars if cal.get("primary")), None)

        if primary_calendar:
            calendar_id = primary_calendar["id"]
            user_timezone = _get_calendar_timezone(user_id, calendar_id)
            return calendar_id, user_timezone

    except Exception as e:
        logging.error(f"[AUTH] Error fetching Google Calendar info: {e}")

    return None, "UTC"


def _sync_calendar_sources(user_id: str, credentials, google_email: str | None) -> None:
    """Sync calendar sources from provider."""
    try:
        from ..services.calendar_accounts import CalendarAccountsService
        calendar_accounts_service = CalendarAccountsService()

        if google_email:
            account = calendar_accounts_service.ensure_account_exists(
                user_id=user_id,
                provider="google",
                provider_email=google_email,
                credentials={
                    "token": credentials.token,
                    "refresh_token": credentials.refresh_token,
                    "token_uri": credentials.token_uri,
                    "client_id": credentials.client_id,
                    "client_secret": credentials.client_secret,
                    "scopes": list(credentials.scopes) if credentials.scopes else [],
                }
            )

            if account:
                calendar_accounts_service.sync_calendars_from_provider(account["id"])
                logging.info(f"[AUTH] Synced calendar sources for user {user_id}")

    except Exception as e:
        logging.error(f"[AUTH] Failed to sync calendar sources: {e}")


def _schedule_calendar_sync(user_id: str) -> None:
    """Schedule background calendar sync job."""
    try:
        from ..background_jobs.calendar_sync import sync_user_calendar_job

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


def _build_success_html() -> str:
    """Build HTML response for successful OAuth callback."""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Google Calendar Connected</title>
        <style>
            body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            .container {
                text-align: center;
                padding: 2rem;
            }
            .checkmark {
                font-size: 4rem;
                margin-bottom: 1rem;
            }
            h1 {
                margin: 0 0 0.5rem 0;
                font-size: 1.5rem;
            }
            p {
                margin: 0;
                opacity: 0.9;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="checkmark">&#10003;</div>
            <h1>Google Calendar Connected</h1>
            <p>This window will close automatically...</p>
        </div>
        <script>
            setTimeout(function() {
                window.close();
            }, 1500);
        </script>
    </body>
    </html>
    """

@auth_bp.route("/debug/config", methods=["GET"])
def debug_config():
    """Debug route to check configuration (remove in production)."""
    return jsonify({
        "google_client_id": bool(current_app.config.get("GOOGLE_CLIENT_ID")),
        "google_client_secret": bool(current_app.config.get("GOOGLE_CLIENT_SECRET")),
        "google_redirect_uri": current_app.config.get("GOOGLE_REDIRECT_URI"),
        "supabase_url": bool(current_app.config.get("SUPABASE_URL")),
        "supabase_key": bool(current_app.config.get("SUPABASE_ANON_KEY"))
    }), 200


@auth_bp.route("/login", methods=["GET"])
def login_route():
    """Begin Google OAuth login by redirecting to the consent screen."""
    return redirect(auth_service.get_google_auth_url())


@auth_bp.route("/logout", methods=["GET"])
@require_auth
def logout_route(user_id):
    """Log out the current user."""
    token = _extract_token_from_header()
    ok, err = auth_service.logout(token or "")

    if not ok:
        return jsonify({"error": "Logout failed", "message": err or "Unknown error"}), 400

    return jsonify({"message": "Successfully logged out"}), 200


@auth_bp.route("/refresh", methods=["POST"])
def refresh_route():
    """Refresh a user's session using their refresh token."""
    data = request.get_json() or {}
    refresh_token = data.get("refresh_token")

    if not refresh_token:
        return jsonify({"error": "Missing refresh_token", "message": "refresh_token is required"}), 400

    res, err = auth_service.refresh_session(refresh_token)
    if err:
        return jsonify({"error": "Refresh failed", "message": err}), 400

    return jsonify({"message": "Successfully refreshed session", "session": res}), 200


@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_me(user_id):
    """Get the current user's information."""
    token = _extract_token_from_header()
    user = auth_service.get_user_from_token(token or "")

    if not user:
        return jsonify({"error": "Unauthorized", "message": "Invalid or expired token"}), 401

    return jsonify(user.user_metadata), 200


@auth_bp.route("/google", methods=["GET"])
@require_auth
def google_auth(user_id):
    """Initiate Google OAuth flow."""
    try:
        user_token = _get_access_token()
        return_url = request.args.get("return_url", "/")
        auth_url = auth_service.get_google_auth_url(user_token, return_url)

        return jsonify({"auth_url": auth_url}), 200

    except Exception as e:
        logging.error(f"[AUTH] Exception in /api/auth/google: {e}")
        return jsonify({"error": "Server error", "message": str(e)}), 500

@auth_bp.route("/google/callback", methods=["GET"])
def google_callback():
    """Handle Google OAuth callback. Exchanges authorization code for credentials and stores them."""
    code = request.args.get("code")
    state = request.args.get("state")

    if not code:
        return jsonify({"error": "Missing authorization code", "message": "No authorization code provided"}), 400

    try:
        state_data = _decode_oauth_state(state)
        user_token = state_data.get('user_token')

        credentials = auth_service.exchange_code_for_credentials(code)

        user = auth_service.get_user_from_token(user_token)
        if not user:
            return jsonify({"error": "Invalid user token", "message": "Invalid user token"}), 401

        user_id = user.id
        auth_service.store_google_credentials(user_id, credentials)

        # Enrich profile with Google data
        try:
            user_metadata = user.user_metadata or {}
            google_calendar_id, user_timezone = _get_google_calendar_info(user_id)

            profile_updates = {
                "avatar_url": user_metadata.get("avatar_url"),
                "google_calendar_id": google_calendar_id,
                "timezone": user_timezone
            }

            users_service = UsersService()
            updated_profile = users_service.update_profile(user_id, profile_updates)

            if updated_profile:
                logging.info(f"[AUTH] Enriched profile for user {user_id} with Google data")

            # Sync calendar sources from provider
            google_email = google_calendar_id or user_metadata.get("email")
            _sync_calendar_sources(user_id, credentials, google_email)

            # Schedule background calendar sync
            _schedule_calendar_sync(user_id)

        except Exception as e:
            logging.error(f"[AUTH] Error enriching profile with Google data: {e}")

        return _build_success_html(), 200

    except ValueError as e:
        logging.error(f"[AUTH] ValueError in google/callback: {e}")
        return jsonify({"error": "Authentication failed", "message": str(e)}), 400
    except Exception as e:
        logging.error(f"[AUTH] Exception in google/callback: {e}")
        return jsonify({"error": "Server error", "message": str(e)}), 500


@auth_bp.route("/google/connect", methods=["POST"])
@require_auth
def connect_google_calendar(user_id):
    """Connect a user's Google Calendar."""
    users_service = UsersService(_get_access_token())
    profile = users_service.get_profile(user_id)
    return jsonify({"message": "Google Calendar connected", "profile": profile}), 200


@auth_bp.route("/enrich-profile", methods=["POST"])
@require_auth
def enrich_profile(user_id):
    """Enrich an existing profile with Google data after Supabase Auth sign-in."""
    try:
        users_service = UsersService(_get_access_token())
        profile = users_service.get_profile(user_id)

        if not profile:
            return jsonify({"error": "Profile not found", "message": "User profile does not exist"}), 404

        if profile.get("google_auth_token"):
            return jsonify({
                "message": "Profile already enriched with Google data",
                "google_calendar_id": profile.get("google_calendar_id")
            }), 200

        user_metadata = request.user.user_metadata or {}

        profile_updates = {
            "avatar_url": user_metadata.get("avatar_url"),
            "google_auth_token": None,
            "google_calendar_id": None,
            "timezone": "UTC"
        }

        updated_profile = users_service.update_profile(user_id, profile_updates)

        if updated_profile:
            return jsonify({"message": "Profile enriched with basic Google data", "profile": updated_profile}), 200

        return jsonify({"error": "Failed to enrich profile", "message": "Could not update profile with Google data"}), 500

    except Exception as e:
        logging.error(f"[AUTH] Error enriching profile: {e}")
        return jsonify({"error": "Failed to enrich profile", "message": str(e)}), 500
