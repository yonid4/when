"""Authentication routes for user login, logout, and session management."""
from __future__ import annotations

import base64
import json
import logging
import time as _time
from datetime import datetime, timezone

from flask import Blueprint, request, jsonify, redirect, current_app

from ..services import google_calendar, microsoft_calendar
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


def _get_microsoft_calendar_info(credentials: dict) -> tuple[str | None, str, str | None]:
    """Get primary calendar ID, timezone, and email from Microsoft Graph API."""
    try:
        headers = {
            "Authorization": f"Bearer {credentials['access_token']}",
            "Content-Type": "application/json",
        }

        import requests
        GRAPH_API_BASE = "https://graph.microsoft.com/v1.0"

        # Get Microsoft account email
        me_response = requests.get(f"{GRAPH_API_BASE}/me", headers=headers)
        me_response.raise_for_status()
        me_data = me_response.json()
        microsoft_email = me_data.get("mail") or me_data.get("userPrincipalName")

        # Get default calendar ID
        calendars_response = requests.get(f"{GRAPH_API_BASE}/me/calendars", headers=headers)
        calendars_response.raise_for_status()
        calendars_data = calendars_response.json()
        default_calendar = next(
            (c for c in calendars_data.get("value", []) if c.get("isDefaultCalendar")),
            None
        )
        primary_calendar_id = default_calendar["id"] if default_calendar else None

        # Get user timezone from mailbox settings
        settings_response = requests.get(f"{GRAPH_API_BASE}/me/mailboxSettings", headers=headers)
        settings_response.raise_for_status()
        settings_data = settings_response.json()
        user_timezone = settings_data.get("timeZone", "UTC")

        return primary_calendar_id, user_timezone, microsoft_email

    except Exception as e:
        logging.warning(f"[AUTH] Could not fetch Microsoft calendar info: {e}")
        return None, "UTC", None


def _sync_microsoft_calendar_sources(user_id: str, credentials: dict, microsoft_email: str | None) -> None:
    """Sync calendar sources from Microsoft provider."""
    try:
        from ..services.calendar_accounts import CalendarAccountsService
        calendar_accounts_service = CalendarAccountsService()

        if microsoft_email:
            account = calendar_accounts_service.ensure_account_exists(
                user_id=user_id,
                provider="microsoft",
                provider_email=microsoft_email,
                credentials=credentials,
            )

            if account:
                calendar_accounts_service.sync_calendars_from_provider(account["id"])
                logging.info(f"[AUTH] Synced Microsoft calendar sources for user {user_id}")

    except Exception as e:
        logging.error(f"[AUTH] Failed to sync Microsoft calendar sources: {e}")


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


def _encode_oauth_state(user_token: str | None, return_url: str = "/") -> str:
    """Encode OAuth state as base64 JSON."""
    state_data = {
        "user_token": user_token,
        "return_url": return_url,
        "timestamp": _time.time(),
    }
    return base64.urlsafe_b64encode(json.dumps(state_data).encode()).decode()


def _build_success_html(provider: str = "Google Calendar", return_url: str = "/") -> str:
    """Build HTML response for successful OAuth callback."""
    from ..config import Config
    frontend_url = Config.FRONTEND_URL.rstrip("/")
    redirect_url = f"{frontend_url}{return_url}"

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>{provider} Connected</title>
        <style>
            body {{
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }}
            .container {{
                text-align: center;
                padding: 2rem;
            }}
            .checkmark {{
                font-size: 4rem;
                margin-bottom: 1rem;
            }}
            h1 {{
                margin: 0 0 0.5rem 0;
                font-size: 1.5rem;
            }}
            p {{
                margin: 0;
                opacity: 0.9;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="checkmark">&#10003;</div>
            <h1>{provider} Connected</h1>
            <p>This window will close automatically...</p>
        </div>
        <script>
            setTimeout(function() {{
                window.close();
            }}, 1500);
            // Fallback: if window.close() didn't work (not a popup), redirect
            setTimeout(function() {{
                window.location.href = "{redirect_url}";
            }}, 2000);
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
    """Handle Google OAuth callback."""
    code = request.args.get("code")
    state = request.args.get("state")

    if not code:
        return jsonify({"error": "Missing authorization code", "message": "No authorization code provided"}), 400

    try:
        state_data = _decode_oauth_state(state)
        user_token = state_data.get('user_token')
        return_url = state_data.get('return_url', '/')

        credentials = auth_service.exchange_code_for_credentials(code)

        user = auth_service.get_user_from_token(user_token)
        if not user:
            return jsonify({"error": "Invalid user token", "message": "Invalid user token"}), 401

        user_id = user.id
        auth_service.store_google_credentials(user_id, credentials)

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

            google_email = google_calendar_id or user_metadata.get("email")
            _sync_calendar_sources(user_id, credentials, google_email)
            _schedule_calendar_sync(user_id)

        except Exception as e:
            logging.error(f"[AUTH] Error enriching profile with Google data: {e}")

        return _build_success_html(return_url=return_url), 200

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


@auth_bp.route("/microsoft", methods=["GET"])
@require_auth
def microsoft_auth(user_id):
    """Initiate Microsoft OAuth flow."""
    try:
        user_token = _get_access_token()
        return_url = request.args.get("return_url", "/")
        state = _encode_oauth_state(user_token, return_url)
        auth_url = microsoft_calendar.get_auth_url(state=state)

        return jsonify({"auth_url": auth_url}), 200

    except Exception as e:
        logging.error(f"[AUTH] Exception in /api/auth/microsoft: {e}")
        return jsonify({"error": "Server error", "message": str(e)}), 500


@auth_bp.route("/microsoft/callback", methods=["GET"])
def microsoft_callback():
    """Handle Microsoft OAuth callback."""
    code = request.args.get("code")
    state = request.args.get("state")

    if not code:
        return jsonify({"error": "Missing authorization code", "message": "No authorization code provided"}), 400

    try:
        state_data = _decode_oauth_state(state)
        user_token = state_data.get("user_token")
        return_url = state_data.get("return_url", "/")

        credentials = microsoft_calendar.get_credentials_from_code(code)

        user = auth_service.get_user_from_token(user_token)
        if not user:
            return jsonify({"error": "Invalid user token", "message": "Invalid user token"}), 401

        user_id = user.id

        # Get Microsoft account info (email, calendar ID, timezone)
        primary_calendar_id, user_timezone, microsoft_email = _get_microsoft_calendar_info(credentials)

        # Use Microsoft email if available, fall back to Supabase email
        user_metadata = user.user_metadata or {}
        provider_email = microsoft_email or user_metadata.get("email")

        microsoft_calendar.store_credentials(user_id, credentials, provider_email)
        logging.info(f"[AUTH] Stored Microsoft credentials for user {user_id}")

        # Update profile timezone if not already set
        try:
            users_service = UsersService()
            profile = users_service.get_profile(user_id)
            if profile and not profile.get("timezone"):
                users_service.update_profile(user_id, {"timezone": user_timezone})
                logging.info(f"[AUTH] Set timezone for user {user_id} to {user_timezone}")
        except Exception as e:
            logging.warning(f"[AUTH] Could not update timezone: {e}")

        # Sync calendar sources from Microsoft
        _sync_microsoft_calendar_sources(user_id, credentials, provider_email)

        _schedule_calendar_sync(user_id)

        return _build_success_html("Microsoft Calendar", return_url=return_url), 200

    except ValueError as e:
        logging.error(f"[AUTH] ValueError in microsoft/callback: {e}")
        return jsonify({"error": "Authentication failed", "message": str(e)}), 400
    except Exception as e:
        logging.error(f"[AUTH] Exception in microsoft/callback: {e}")
        return jsonify({"error": "Server error", "message": str(e)}), 500


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
