"""
Comprehensive unit tests for Google Calendar Service.

Test coverage:
- create_flow: success, missing config
- get_auth_url: success, error handling
- get_credentials_from_code: success, invalid code
- store_credentials: success, no profile
- get_stored_credentials: success, not found
- refresh_credentials_if_needed: expired, not expired
- validate_credentials: valid, expired, refreshable
- get_calendar_service: success, token refresh
- revoke_credentials: success
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from google.oauth2.credentials import Credentials
from app.services import google_calendar as gc


# ============================================================================
# Test Fixtures
# ============================================================================

@pytest.fixture
def mock_supabase():
    """Create a mock Supabase client."""
    return Mock()


@pytest.fixture
def sample_credentials():
    """Sample Google credentials."""
    return Credentials(
        token="test-token",
        refresh_token="test-refresh-token",
        token_uri="https://oauth2.googleapis.com/token",
        client_id="test-client-id",
        client_secret="test-client-secret",
        scopes=gc.SCOPES
    )


# ============================================================================
# Tests: create_flow
# ============================================================================

class TestCreateFlow:
    """Tests for create_flow function."""

    def test_create_flow_success(self, app):
        """Test successfully creating OAuth flow."""
        # Arrange
        with app.app_context():
            with patch("google_auth_oauthlib.flow.Flow.from_client_config") as mock_flow:
                # Act
                gc.create_flow()

                # Assert
                mock_flow.assert_called_once()

    def test_create_flow_missing_config(self, app):
        """Test create_flow fails when config is missing."""
        # Arrange
        with app.app_context():
            # Temporarily remove required config
            old_client_id = app.config.pop("GOOGLE_CLIENT_ID", None)

            # Act & Assert
            with pytest.raises(ValueError, match="not configured"):
                gc.create_flow()

            # Restore config
            if old_client_id:
                app.config["GOOGLE_CLIENT_ID"] = old_client_id


# ============================================================================
# Tests: get_auth_url
# ============================================================================

class TestGetAuthUrl:
    """Tests for get_auth_url function."""

    def test_get_auth_url_success(self, app):
        """Test successfully generating auth URL."""
        # Arrange
        mock_flow = Mock()
        mock_flow.authorization_url.return_value = ("https://accounts.google.com/auth", "state")

        with app.app_context():
            with patch("app.services.google_calendar.create_flow", return_value=mock_flow):
                # Act
                result = gc.get_auth_url()

                # Assert
                assert "accounts.google.com" in result

    def test_get_auth_url_error(self, app):
        """Test get_auth_url handles errors."""
        # Arrange
        with app.app_context():
            with patch("app.services.google_calendar.create_flow", side_effect=Exception("Flow error")):
                # Act & Assert
                with pytest.raises(ValueError, match="Failed to generate auth URL"):
                    gc.get_auth_url()


# ============================================================================
# Tests: get_credentials_from_code
# ============================================================================

class TestGetCredentialsFromCode:
    """Tests for get_credentials_from_code function."""

    def test_get_credentials_from_code_success(self, app, sample_credentials):
        """Test successfully exchanging code for credentials."""
        # Arrange
        mock_flow = Mock()
        mock_flow.credentials = sample_credentials

        with app.app_context():
            with patch("app.services.google_calendar.create_flow", return_value=mock_flow):
                # Act
                result = gc.get_credentials_from_code("test-code")

                # Assert
                assert result is not None
                assert result.token == "test-token"

    def test_get_credentials_from_code_invalid(self, app):
        """Test getting credentials fails with invalid code."""
        # Arrange
        mock_flow = Mock()
        mock_flow.fetch_token.side_effect = Exception("Invalid code")

        with app.app_context():
            with patch("app.services.google_calendar.create_flow", return_value=mock_flow):
                # Act & Assert
                with pytest.raises(ValueError, match="Failed to get credentials"):
                    gc.get_credentials_from_code("invalid-code")


# ============================================================================
# Tests: store_credentials
# ============================================================================

class TestStoreCredentials:
    """Tests for store_credentials function."""

    def test_store_credentials_success(self, mock_supabase, sample_credentials):
        """Test successfully storing credentials."""
        # Arrange
        # Mock profile exists
        check_result = Mock()
        check_result.data = [{"id": "user-123"}]

        # Mock update success
        update_result = Mock()
        update_result.data = [{"id": "user-123"}]

        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = check_result
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = update_result

        with patch("supabase.create_client", return_value=mock_supabase):
            # Act - Should not raise
            gc.store_credentials("user-123", sample_credentials)

    def test_store_credentials_no_profile(self, mock_supabase, sample_credentials):
        """Test storing credentials when profile doesn't exist."""
        # Arrange
        # Mock no profile
        check_result = Mock()
        check_result.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = check_result

        with patch("supabase.create_client", return_value=mock_supabase):
            # Act - Should return without error
            gc.store_credentials("user-999", sample_credentials)


# ============================================================================
# Tests: get_stored_credentials
# ============================================================================

class TestGetStoredCredentials:
    """Tests for get_stored_credentials function."""

    def test_get_stored_credentials_success(self, mock_supabase):
        """Test successfully retrieving stored credentials."""
        # Arrange
        stored_creds = {
            "token": "stored-token",
            "refresh_token": "stored-refresh-token",
            "token_uri": "https://oauth2.googleapis.com/token",
            "client_id": "test-client-id",
            "client_secret": "test-client-secret",
            "scopes": gc.SCOPES
        }

        mock_result = Mock()
        mock_result.data = [{"google_auth_token": stored_creds}]
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_result

        with patch("supabase.create_client", return_value=mock_supabase):
            # Act
            result = gc.get_stored_credentials("user-123")

            # Assert
            assert result is not None
            assert result.token == "stored-token"

    def test_get_stored_credentials_not_found(self, mock_supabase):
        """Test getting credentials when none are stored."""
        # Arrange
        mock_result = Mock()
        mock_result.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_result

        with patch("supabase.create_client", return_value=mock_supabase):
            # Act
            result = gc.get_stored_credentials("user-999")

            # Assert
            assert result is None


# ============================================================================
# Tests: refresh_credentials_if_needed
# ============================================================================

class TestRefreshCredentialsIfNeeded:
    """Tests for refresh_credentials_if_needed function."""

    def test_refresh_expired_credentials(self):
        """Test refreshing expired credentials."""
        # Arrange
        mock_credentials = Mock()
        mock_credentials.expired = True
        mock_credentials.refresh_token = "refresh-token"

        # Act
        result = gc.refresh_credentials_if_needed(mock_credentials)

        # Assert
        mock_credentials.refresh.assert_called_once()
        assert result == mock_credentials

    def test_no_refresh_if_valid(self):
        """Test no refresh when credentials are valid."""
        # Arrange
        mock_credentials = Mock()
        mock_credentials.expired = False
        mock_credentials.valid = True

        # Act
        result = gc.refresh_credentials_if_needed(mock_credentials)

        # Assert
        mock_credentials.refresh.assert_not_called()
        assert result == mock_credentials


# ============================================================================
# Tests: validate_credentials
# ============================================================================

class TestValidateCredentials:
    """Tests for validate_credentials function."""

    def test_validate_valid_credentials(self):
        """Test validation passes for valid credentials."""
        # Arrange
        mock_credentials = Mock()
        mock_credentials.valid = True

        # Act
        result = gc.validate_credentials(mock_credentials)

        # Assert
        assert result is True

    def test_validate_expired_but_refreshable(self):
        """Test validation passes for expired but refreshable credentials."""
        # Arrange
        mock_credentials = Mock()
        mock_credentials.valid = False
        mock_credentials.expired = True
        mock_credentials.refresh_token = "refresh-token"

        def mock_refresh(request):
            mock_credentials.valid = True

        mock_credentials.refresh = mock_refresh

        # Act
        result = gc.validate_credentials(mock_credentials)

        # Assert
        assert result is True

    def test_validate_none_credentials(self):
        """Test validation fails for None credentials."""
        # Act
        result = gc.validate_credentials(None)

        # Assert
        assert result is False


# ============================================================================
# Tests: get_calendar_service
# ============================================================================

class TestGetCalendarService:
    """Tests for get_calendar_service function."""

    def test_get_calendar_service_success(self, sample_credentials):
        """Test successfully creating calendar service."""
        # Arrange
        with patch("app.services.google_calendar.refresh_credentials_if_needed", return_value=sample_credentials):
            with patch("app.services.google_calendar.store_credentials"):
                with patch("app.services.google_calendar.build") as mock_build:
                    # Act
                    result = gc.get_calendar_service(sample_credentials, "user-123")

                    # Assert
                    mock_build.assert_called_once_with("calendar", "v3", credentials=sample_credentials)

    def test_get_calendar_service_refreshes_token(self):
        """Test calendar service refreshes expired token."""
        # Arrange
        mock_credentials = Mock()
        mock_credentials.expired = True
        mock_credentials.refresh_token = "refresh-token"

        refreshed_credentials = Mock()

        with patch("app.services.google_calendar.refresh_credentials_if_needed", return_value=refreshed_credentials) as mock_refresh:
            with patch("app.services.google_calendar.store_credentials") as mock_store:
                with patch("app.services.google_calendar.build"):
                    # Act
                    gc.get_calendar_service(mock_credentials, "user-123")

                    # Assert
                    mock_refresh.assert_called_once()
                    mock_store.assert_called_once()


# ============================================================================
# Tests: revoke_credentials
# ============================================================================

class TestRevokeCredentials:
    """Tests for revoke_credentials function."""

    def test_revoke_credentials_success(self, mock_supabase, sample_credentials):
        """Test successfully revoking credentials."""
        # Arrange
        mock_requests_response = Mock()
        mock_requests_response.status_code = 200

        with patch("app.services.google_calendar.get_stored_credentials", return_value=sample_credentials):
            with patch("requests.post", return_value=mock_requests_response) as mock_post:
                with patch("app.utils.supabase_client.get_supabase", return_value=mock_supabase):
                    # Act
                    gc.revoke_credentials("user-123")

                    # Assert
                    mock_post.assert_called_once()
                    mock_supabase.table.assert_called()

    def test_revoke_credentials_no_credentials(self, mock_supabase):
        """Test revoking when no credentials exist."""
        # Arrange
        with patch("app.services.google_calendar.get_stored_credentials", return_value=None):
            with patch("app.utils.supabase_client.get_supabase", return_value=mock_supabase):
                # Act - Should not raise
                gc.revoke_credentials("user-999")

                # Assert - Update should still be called to clear the field
                mock_supabase.table.assert_called()
