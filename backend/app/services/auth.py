import time
from typing import Optional, Dict, Any, Tuple
import json
import base64
from ..utils.supabase_client import get_supabase
from . import google_calendar as gc


class AuthService():
    """Service for auth-related operations and Google OAuth helpers.

    Notes:
    - Delegates Google OAuth flows and credential storage to `services_simple.google_calendar`.
    - Supabase auth client is accessed via `get_supabase()`; callers should pass tokens via headers.
    """

    def __init__(self):
        self.supabase = get_supabase()

    # -----------------------------
    # Google OAuth helpers (delegate to google_calendar service)
    # -----------------------------
    def get_google_auth_url(self, user_token=None, return_url='/') -> str:
        """Return Google OAuth authorization URL with state."""
        # return gc.get_auth_url()
        flow = gc.create_flow()
        
        # Include user token in state for callback
        state_data = {
            'user_token': user_token,
            'return_url': return_url,
            'timestamp': time.time()
        }
        state = base64.urlsafe_b64encode(json.dumps(state_data).encode()).decode()
        
        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent',
            state=state  # Pass the state
        )
        
        return authorization_url

        # auth_url = gc.get_auth_url()
        # return f"{auth_url}&state={state}"


    def exchange_code_for_credentials(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for Google credentials object."""
        return gc.get_credentials_from_code(code)

    def store_google_credentials(self, user_id: str, credentials) -> None:
        """Persist Google credentials in profile."""
        return gc.store_credentials(user_id, credentials)

    # -----------------------------
    # Supabase session helpers
    # -----------------------------
    def get_session(self) -> Optional[Dict[str, Any]]:
        """Get current Supabase auth session if any."""
        try:
            session = self.supabase.auth.get_session()
            return session
        except Exception as e:
            print(f"Error getting session: {str(e)}")
            return None

    def get_user_from_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Get user information for a supplied JWT token."""
        try:
            user = self.supabase.auth.get_user(token)
            return user.user
        except Exception as e:
            print(f"Error verifying token: {str(e)}")
            return None

    def verify_token(self, token: str) -> bool:
        """Return True if token is valid, else False."""
        try:
            return self.get_user_from_token(token) is not None
        except Exception:
            return False

    def refresh_session(self, refresh_token: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        """Refresh a session given a refresh token."""
        try:
            res = self.supabase.auth.refresh_session({"refresh_token": refresh_token})
            return res, None
        except Exception as e:
            return None, f"Session refresh failed: {str(e)}"

    def logout(self, access_token: str) -> Tuple[bool, Optional[str]]:
        """Sign out using an access token."""
        try:
            self.supabase.auth.sign_out(access_token)
            return True, None
        except Exception as e:
            return False, f"Logout failed: {str(e)}"


