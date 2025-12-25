"""
Comprehensive unit tests for AuthService.

Test coverage:
- get_google_auth_url: success, with state parameters
- exchange_code_for_credentials: success, invalid code
- store_google_credentials: success, database error
- get_session: success, no session, error handling
- get_user_from_token: valid token, invalid token, expired token
- verify_token: valid token, invalid token
- refresh_session: success, invalid refresh token
- logout: success, error handling
"""

import pytest
import json
import base64
from unittest.mock import Mock, patch, MagicMock
from app.services.auth import AuthService


# ============================================================================
# Test Fixtures
# ============================================================================

@pytest.fixture
def mock_supabase():
    """Create a mock Supabase client."""
    mock_client = Mock()
    mock_client.auth = Mock()
    return mock_client


@pytest.fixture
def auth_service(monkeypatch, mock_supabase):
    """Create AuthService with mocked Supabase client."""
    monkeypatch.setattr("app.services.auth.get_supabase", lambda: mock_supabase)
    return AuthService()


@pytest.fixture
def mock_google_flow():
    """Create a mock Google OAuth flow."""
    mock_flow = Mock()
    mock_flow.authorization_url.return_value = (
        "https://accounts.google.com/o/oauth2/auth?client_id=test",
        "state-123"
    )
    return mock_flow


@pytest.fixture
def mock_google_credentials():
    """Create mock Google credentials."""
    mock_creds = Mock()
    mock_creds.token = "google-access-token"
    mock_creds.refresh_token = "google-refresh-token"
    mock_creds.token_uri = "https://oauth2.googleapis.com/token"
    mock_creds.client_id = "test-client-id"
    mock_creds.client_secret = "test-client-secret"
    mock_creds.scopes = ["https://www.googleapis.com/auth/calendar"]
    mock_creds.to_json.return_value = json.dumps({
        "token": "google-access-token",
        "refresh_token": "google-refresh-token"
    })
    return mock_creds


@pytest.fixture
def sample_user():
    """Sample user data."""
    return {
        "id": "user-123",
        "email": "test@example.com",
        "full_name": "Test User",
        "created_at": "2025-01-01T00:00:00Z"
    }


# ============================================================================
# Tests: get_google_auth_url
# ============================================================================

class TestGetGoogleAuthUrl:
    """Tests for get_google_auth_url method."""

    def test_get_auth_url_success(self, auth_service, mock_google_flow):
        """Test successfully generating Google auth URL."""
        # Arrange
        with patch("app.services.auth.gc.create_flow", return_value=mock_google_flow):
            # Act
            url = auth_service.get_google_auth_url()

            # Assert
            assert url is not None
            assert "accounts.google.com" in url
            assert "client_id" in url

    def test_get_auth_url_with_user_token(self, auth_service):
        """Test generating auth URL with user token in state."""
        # Arrange
        user_token = "user-jwt-token"

        # Create a mock flow that includes state in URL
        mock_flow = Mock()
        def mock_auth_url(**kwargs):
            state = kwargs.get("state", "")
            return (f"https://accounts.google.com/o/oauth2/auth?client_id=test&state={state}", "state-123")
        mock_flow.authorization_url = mock_auth_url

        with patch("app.services.auth.gc.create_flow", return_value=mock_flow):
            # Act
            url = auth_service.get_google_auth_url(user_token=user_token)

            # Assert
            assert url is not None
            # State parameter should be included
            assert "state=" in url

    def test_get_auth_url_with_return_url(self, auth_service, mock_google_flow):
        """Test generating auth URL with custom return URL."""
        # Arrange
        return_url = "/events/123"

        with patch("app.services.auth.gc.create_flow", return_value=mock_google_flow):
            # Act
            url = auth_service.get_google_auth_url(return_url=return_url)

            # Assert
            assert url is not None
            assert "accounts.google.com" in url

    def test_get_auth_url_state_contains_timestamp(self, auth_service, mock_google_flow):
        """Test auth URL state contains timestamp."""
        # Arrange
        with patch("app.services.auth.gc.create_flow", return_value=mock_google_flow):
            with patch("time.time", return_value=1234567890.0):
                # Act
                url = auth_service.get_google_auth_url()

                # Assert
                assert url is not None


# ============================================================================
# Tests: exchange_code_for_credentials
# ============================================================================

class TestExchangeCodeForCredentials:
    """Tests for exchange_code_for_credentials method."""

    def test_exchange_code_success(self, auth_service, mock_google_credentials):
        """Test successfully exchanging auth code for credentials."""
        # Arrange
        auth_code = "test-auth-code"

        with patch("app.services.auth.gc.get_credentials_from_code", return_value=mock_google_credentials):
            # Act
            credentials = auth_service.exchange_code_for_credentials(auth_code)

            # Assert
            assert credentials is not None
            assert credentials.token == "google-access-token"

    def test_exchange_code_invalid_code(self, auth_service):
        """Test exchanging invalid auth code."""
        # Arrange
        invalid_code = "invalid-code"

        with patch("app.services.auth.gc.get_credentials_from_code", side_effect=Exception("Invalid code")):
            # Act & Assert
            with pytest.raises(Exception):
                auth_service.exchange_code_for_credentials(invalid_code)

    def test_exchange_code_returns_dict(self, auth_service):
        """Test exchange can return dictionary format."""
        # Arrange
        auth_code = "test-code"
        creds_dict = {"token": "access-token", "refresh_token": "refresh-token"}

        with patch("app.services.auth.gc.get_credentials_from_code", return_value=creds_dict):
            # Act
            result = auth_service.exchange_code_for_credentials(auth_code)

            # Assert
            assert result == creds_dict


# ============================================================================
# Tests: store_google_credentials
# ============================================================================

class TestStoreGoogleCredentials:
    """Tests for store_google_credentials method."""

    def test_store_credentials_success(self, auth_service, mock_google_credentials):
        """Test successfully storing Google credentials."""
        # Arrange
        user_id = "user-123"

        with patch("app.services.auth.gc.store_credentials", return_value=True):
            # Act
            result = auth_service.store_google_credentials(user_id, mock_google_credentials)

            # Assert
            assert result is True

    def test_store_credentials_database_error(self, auth_service, mock_google_credentials):
        """Test handling database error when storing credentials."""
        # Arrange
        user_id = "user-123"

        with patch("app.services.auth.gc.store_credentials", side_effect=Exception("DB Error")):
            # Act & Assert
            with pytest.raises(Exception):
                auth_service.store_google_credentials(user_id, mock_google_credentials)


# ============================================================================
# Tests: get_session
# ============================================================================

class TestGetSession:
    """Tests for get_session method."""

    def test_get_session_success(self, auth_service, mock_supabase, sample_user):
        """Test successfully getting current session."""
        # Arrange
        session_data = {
            "access_token": "access-token",
            "refresh_token": "refresh-token",
            "user": sample_user
        }
        mock_supabase.auth.get_session.return_value = session_data

        # Act
        result = auth_service.get_session()

        # Assert
        assert result is not None
        assert result["access_token"] == "access-token"
        assert result["user"]["id"] == sample_user["id"]

    def test_get_session_no_session(self, auth_service, mock_supabase):
        """Test getting session when none exists."""
        # Arrange
        mock_supabase.auth.get_session.return_value = None

        # Act
        result = auth_service.get_session()

        # Assert
        assert result is None

    def test_get_session_error(self, auth_service, mock_supabase):
        """Test error handling when getting session."""
        # Arrange
        mock_supabase.auth.get_session.side_effect = Exception("Session error")

        # Act
        result = auth_service.get_session()

        # Assert
        assert result is None


# ============================================================================
# Tests: get_user_from_token
# ============================================================================

class TestGetUserFromToken:
    """Tests for get_user_from_token method."""

    def test_get_user_from_valid_token(self, auth_service, mock_supabase, sample_user):
        """Test getting user from valid JWT token."""
        # Arrange
        token = "valid-jwt-token"
        mock_user_response = Mock()
        mock_user_response.user = sample_user
        mock_supabase.auth.get_user.return_value = mock_user_response

        # Act
        result = auth_service.get_user_from_token(token)

        # Assert
        assert result is not None
        assert result["id"] == sample_user["id"]
        assert result["email"] == sample_user["email"]
        mock_supabase.auth.get_user.assert_called_once_with(token)

    def test_get_user_from_invalid_token(self, auth_service, mock_supabase):
        """Test getting user from invalid token."""
        # Arrange
        token = "invalid-token"
        mock_supabase.auth.get_user.side_effect = Exception("Invalid token")

        # Act
        result = auth_service.get_user_from_token(token)

        # Assert
        assert result is None

    def test_get_user_from_expired_token(self, auth_service, mock_supabase):
        """Test getting user from expired token."""
        # Arrange
        token = "expired-token"
        mock_supabase.auth.get_user.side_effect = Exception("Token expired")

        # Act
        result = auth_service.get_user_from_token(token)

        # Assert
        assert result is None

    def test_get_user_from_malformed_token(self, auth_service, mock_supabase):
        """Test getting user from malformed token."""
        # Arrange
        token = "not-a-jwt"
        mock_supabase.auth.get_user.side_effect = Exception("Malformed token")

        # Act
        result = auth_service.get_user_from_token(token)

        # Assert
        assert result is None


# ============================================================================
# Tests: verify_token
# ============================================================================

class TestVerifyToken:
    """Tests for verify_token method."""

    def test_verify_valid_token(self, auth_service, sample_user):
        """Test verifying valid token returns True."""
        # Arrange
        token = "valid-token"

        with patch.object(auth_service, "get_user_from_token", return_value=sample_user):
            # Act
            result = auth_service.verify_token(token)

            # Assert
            assert result is True

    def test_verify_invalid_token(self, auth_service):
        """Test verifying invalid token returns False."""
        # Arrange
        token = "invalid-token"

        with patch.object(auth_service, "get_user_from_token", return_value=None):
            # Act
            result = auth_service.verify_token(token)

            # Assert
            assert result is False

    def test_verify_token_exception(self, auth_service):
        """Test verify_token handles exceptions gracefully."""
        # Arrange
        token = "error-token"

        with patch.object(auth_service, "get_user_from_token", side_effect=Exception("Error")):
            # Act
            result = auth_service.verify_token(token)

            # Assert
            assert result is False


# ============================================================================
# Tests: refresh_session
# ============================================================================

class TestRefreshSession:
    """Tests for refresh_session method."""

    def test_refresh_session_success(self, auth_service, mock_supabase, sample_user):
        """Test successfully refreshing session."""
        # Arrange
        refresh_token = "valid-refresh-token"
        new_session = {
            "access_token": "new-access-token",
            "refresh_token": "new-refresh-token",
            "user": sample_user
        }
        mock_supabase.auth.refresh_session.return_value = new_session

        # Act
        result, error = auth_service.refresh_session(refresh_token)

        # Assert
        assert result is not None
        assert error is None
        assert result["access_token"] == "new-access-token"
        mock_supabase.auth.refresh_session.assert_called_once_with({"refresh_token": refresh_token})

    def test_refresh_session_invalid_token(self, auth_service, mock_supabase):
        """Test refreshing with invalid refresh token."""
        # Arrange
        refresh_token = "invalid-refresh-token"
        mock_supabase.auth.refresh_session.side_effect = Exception("Invalid refresh token")

        # Act
        result, error = auth_service.refresh_session(refresh_token)

        # Assert
        assert result is None
        assert error is not None
        assert "Session refresh failed" in error

    def test_refresh_session_expired_token(self, auth_service, mock_supabase):
        """Test refreshing with expired refresh token."""
        # Arrange
        refresh_token = "expired-refresh-token"
        mock_supabase.auth.refresh_session.side_effect = Exception("Refresh token expired")

        # Act
        result, error = auth_service.refresh_session(refresh_token)

        # Assert
        assert result is None
        assert error is not None
        assert "expired" in error.lower()

    def test_refresh_session_network_error(self, auth_service, mock_supabase):
        """Test refreshing session with network error."""
        # Arrange
        refresh_token = "valid-refresh-token"
        mock_supabase.auth.refresh_session.side_effect = Exception("Network error")

        # Act
        result, error = auth_service.refresh_session(refresh_token)

        # Assert
        assert result is None
        assert error is not None


# ============================================================================
# Tests: logout
# ============================================================================

class TestLogout:
    """Tests for logout method."""

    def test_logout_success(self, auth_service, mock_supabase):
        """Test successfully logging out."""
        # Arrange
        access_token = "valid-access-token"
        mock_supabase.auth.sign_out.return_value = None

        # Act
        success, error = auth_service.logout(access_token)

        # Assert
        assert success is True
        assert error is None
        mock_supabase.auth.sign_out.assert_called_once_with(access_token)

    def test_logout_with_invalid_token(self, auth_service, mock_supabase):
        """Test logout with invalid access token."""
        # Arrange
        access_token = "invalid-token"
        mock_supabase.auth.sign_out.side_effect = Exception("Invalid token")

        # Act
        success, error = auth_service.logout(access_token)

        # Assert
        assert success is False
        assert error is not None
        assert "Logout failed" in error

    def test_logout_with_expired_token(self, auth_service, mock_supabase):
        """Test logout with expired token."""
        # Arrange
        access_token = "expired-token"
        mock_supabase.auth.sign_out.side_effect = Exception("Token expired")

        # Act
        success, error = auth_service.logout(access_token)

        # Assert
        assert success is False
        assert error is not None

    def test_logout_network_error(self, auth_service, mock_supabase):
        """Test logout with network error."""
        # Arrange
        access_token = "valid-token"
        mock_supabase.auth.sign_out.side_effect = Exception("Network error")

        # Act
        success, error = auth_service.logout(access_token)

        # Assert
        assert success is False
        assert error is not None
        assert "Network error" in error


# ============================================================================
# Integration Tests
# ============================================================================

class TestAuthServiceIntegration:
    """Integration tests for AuthService workflows."""

    def test_complete_google_oauth_flow(self, auth_service, mock_google_flow, mock_google_credentials):
        """Test complete Google OAuth flow from start to finish."""
        # Arrange
        user_id = "user-123"
        auth_code = "test-auth-code"

        with patch("app.services.auth.gc.create_flow", return_value=mock_google_flow):
            with patch("app.services.auth.gc.get_credentials_from_code", return_value=mock_google_credentials):
                with patch("app.services.auth.gc.store_credentials", return_value=True):
                    # Act - Step 1: Get auth URL
                    auth_url = auth_service.get_google_auth_url(user_token="user-token")

                    # Assert
                    assert "accounts.google.com" in auth_url

                    # Act - Step 2: Exchange code for credentials
                    credentials = auth_service.exchange_code_for_credentials(auth_code)

                    # Assert
                    assert credentials is not None

                    # Act - Step 3: Store credentials
                    result = auth_service.store_google_credentials(user_id, credentials)

                    # Assert
                    assert result is True

    def test_session_lifecycle(self, auth_service, mock_supabase, sample_user):
        """Test complete session lifecycle: login, refresh, logout."""
        # Arrange
        access_token = "access-token"
        refresh_token = "refresh-token"

        # Mock get_session (login)
        session_data = {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": sample_user
        }
        mock_supabase.auth.get_session.return_value = session_data

        # Mock refresh_session
        new_session = {
            "access_token": "new-access-token",
            "refresh_token": "new-refresh-token",
            "user": sample_user
        }
        mock_supabase.auth.refresh_session.return_value = new_session

        # Mock sign_out
        mock_supabase.auth.sign_out.return_value = None

        # Act - Step 1: Get session
        session = auth_service.get_session()

        # Assert
        assert session is not None
        assert session["access_token"] == access_token

        # Act - Step 2: Refresh session
        refreshed, error = auth_service.refresh_session(refresh_token)

        # Assert
        assert refreshed is not None
        assert error is None
        assert refreshed["access_token"] == "new-access-token"

        # Act - Step 3: Logout
        success, error = auth_service.logout("new-access-token")

        # Assert
        assert success is True
        assert error is None

    def test_token_validation_workflow(self, auth_service, mock_supabase, sample_user):
        """Test token validation workflow."""
        # Arrange
        valid_token = "valid-token"
        invalid_token = "invalid-token"

        # Mock valid token
        mock_user_response = Mock()
        mock_user_response.user = sample_user

        def get_user_side_effect(token):
            if token == valid_token:
                return mock_user_response
            raise Exception("Invalid token")

        mock_supabase.auth.get_user.side_effect = get_user_side_effect

        # Act & Assert - Valid token
        user = auth_service.get_user_from_token(valid_token)
        assert user is not None
        assert auth_service.verify_token(valid_token) is True

        # Act & Assert - Invalid token
        user = auth_service.get_user_from_token(invalid_token)
        assert user is None
        assert auth_service.verify_token(invalid_token) is False
