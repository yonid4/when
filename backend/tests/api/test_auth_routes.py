"""
API endpoint tests for authentication routes.
Tests Google OAuth flow, session management, and profile enrichment.
"""

import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime


class TestDebugConfig:
    """Test GET /api/auth/debug/config endpoint."""

    def test_debug_config_success(self, client):
        """Test debug configuration endpoint (no auth required)."""
        # Act
        response = client.get("/api/auth/debug/config")

        # Assert
        assert response.status_code == 200
        data = response.get_json()
        assert "supabase_url" in data
        assert "google_client_id" in data
        assert "google_redirect_uri" in data


class TestLogin:
    """Test GET /api/auth/login endpoint."""

    def test_login_redirect(self, client):
        """Test login redirects to Google OAuth."""
        # Arrange
        with patch("app.routes.auth.auth_service.get_google_auth_url") as mock_auth_url:
            mock_auth_url.return_value = "https://accounts.google.com/o/oauth2/auth?client_id=..."

            # Act
            response = client.get("/api/auth/login")

            # Assert
            assert response.status_code == 302
            assert "google.com" in response.location


class TestLogout:
    """Test GET /api/auth/logout endpoint."""

    def test_logout_success(self, client, auth_headers):
        """Test successful logout."""
        # Arrange
        with patch("app.routes.auth.auth_service.logout") as mock_logout:
            mock_logout.return_value = (True, None)

            # Act
            response = client.get("/api/auth/logout", headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert "logged out" in data["message"].lower()

    def test_logout_no_auth(self, client):
        """Test logout without authentication token."""
        # Act
        response = client.get("/api/auth/logout")

        # Assert
        assert response.status_code == 401


class TestRefreshSession:
    """Test POST /api/auth/refresh endpoint."""

    def test_refresh_success(self, client):
        """Test successful session refresh."""
        # Arrange
        refresh_data = {"refresh_token": "valid_refresh_token"}
        mock_session = {
            "access_token": "new_access_token",
            "refresh_token": "new_refresh_token",
            "user": {"id": "user-1", "email": "test@example.com"}
        }

        with patch("app.routes.auth.auth_service.refresh_session") as mock_refresh:
            mock_refresh.return_value = (mock_session, None)

            # Act
            response = client.post("/api/auth/refresh", json=refresh_data)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert "session" in data
            assert data["session"]["access_token"] == "new_access_token"

    def test_refresh_missing_token(self, client):
        """Test refresh without refresh token."""
        # Act
        response = client.post("/api/auth/refresh", json={})

        # Assert
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_refresh_invalid_token(self, client):
        """Test refresh with invalid token."""
        # Arrange
        refresh_data = {"refresh_token": "invalid_token"}

        with patch("app.routes.auth.auth_service.refresh_session") as mock_refresh:
            mock_refresh.return_value = (None, "Invalid refresh token")

            # Act
            response = client.post("/api/auth/refresh", json=refresh_data)

            # Assert
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data


class TestGetCurrentUser:
    """Test GET /api/auth/me endpoint."""

    def test_get_me_success(self, client, auth_headers):
        """Test successful retrieval of current user."""
        # Arrange
        mock_user = {
            "id": "user-1",
            "email": "test@example.com",
            "full_name": "Test User"
        }

        mock_user_obj = MagicMock()
        mock_user_obj.user_metadata = mock_user

        with patch("app.routes.auth.auth_service.get_user_from_token") as mock_get_user:
            mock_get_user.return_value = mock_user_obj

            # Act
            response = client.get("/api/auth/me", headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert data["id"] == "user-1"
            assert data["email"] == "test@example.com"

    def test_get_me_no_auth(self, client):
        """Test get current user without authentication token."""
        # Act
        response = client.get("/api/auth/me")

        # Assert
        assert response.status_code == 401


class TestGoogleAuth:
    """Test GET /api/auth/google endpoint."""

    def test_google_auth_redirect(self, client, auth_headers):
        """Test Google Calendar auth returns auth URL."""
        # Arrange
        with patch("app.routes.auth.auth_service.get_google_auth_url") as mock_auth_url:
            mock_auth_url.return_value = "https://accounts.google.com/o/oauth2/auth?scope=calendar..."

            # Act
            response = client.get("/api/auth/google", headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert "auth_url" in data
            assert "google.com" in data["auth_url"]

    def test_google_auth_no_auth(self, client):
        """Test Google Calendar auth without authentication token."""
        # Act
        response = client.get("/api/auth/google")

        # Assert
        assert response.status_code == 401


class TestGoogleCallback:
    """Test GET /api/auth/google/callback endpoint."""

    def test_google_callback_success(self, client):
        """Test successful Google OAuth callback."""
        # Arrange
        import base64
        import json

        # Create a valid state token
        state_data = {
            "user_token": "valid_user_token",
            "return_url": "/"
        }
        state_token = base64.urlsafe_b64encode(json.dumps(state_data).encode()).decode()

        callback_params = {
            "code": "auth_code_123",
            "state": state_token
        }

        mock_credentials = MagicMock()
        mock_user = MagicMock()
        mock_user.id = "user-1"
        mock_user.user_metadata = {}

        with patch("app.routes.auth.auth_service.exchange_code_for_credentials") as mock_exchange, \
             patch("app.routes.auth.auth_service.get_user_from_token") as mock_get_user, \
             patch("app.routes.auth.auth_service.store_google_credentials") as mock_store, \
             patch("app.routes.auth.google_calendar.get_user_calendars") as mock_calendars, \
             patch("app.routes.auth.UsersService") as mock_users_service:

            mock_exchange.return_value = mock_credentials
            mock_get_user.return_value = mock_user
            mock_calendars.return_value = []

            mock_service_instance = MagicMock()
            mock_service_instance.update_profile.return_value = {"id": "user-1"}
            mock_users_service.return_value = mock_service_instance

            # Act
            response = client.get("/api/auth/google/callback", query_string=callback_params)

            # Assert
            assert response.status_code == 200
            assert b"Google Calendar Connected" in response.data
            assert b"window.close()" in response.data

    def test_google_callback_missing_code(self, client):
        """Test callback without authorization code."""
        # Act
        response = client.get("/api/auth/google/callback")

        # Assert
        assert response.status_code == 400
        assert b"error" in response.data.lower()

    def test_google_callback_error_param(self, client):
        """Test callback with error parameter (still requires code)."""
        # Arrange
        callback_params = {"error": "access_denied"}

        # Act
        response = client.get("/api/auth/google/callback", query_string=callback_params)

        # Assert
        # The route checks for code first, not error, so it returns 400 for missing code
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data


class TestGoogleConnect:
    """Test POST /api/auth/google/connect endpoint."""

    def test_google_connect_success(self, client, auth_headers):
        """Test successful Google Calendar connection."""
        # Arrange
        connect_data = {
            "access_token": "access_token",
            "refresh_token": "refresh_token",
            "expiry": "2025-12-31T23:59:59Z"
        }

        mock_profile = {"id": "user-1", "google_calendar_connected": True}

        with patch("app.routes.auth.UsersService") as mock_users_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_profile.return_value = mock_profile
            mock_users_service.return_value = mock_service_instance

            # Act
            response = client.post("/api/auth/google/connect", json=connect_data, headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert data["message"] == "Google Calendar connected"
            assert "profile" in data

    def test_google_connect_missing_tokens(self, client, auth_headers):
        """Test Google connect endpoint (doesn't validate tokens in request body)."""
        # Arrange
        connect_data = {"access_token": "only_access"}

        mock_profile = {"id": "user-1"}

        with patch("app.routes.auth.UsersService") as mock_users_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_profile.return_value = mock_profile
            mock_users_service.return_value = mock_service_instance

            # Act
            response = client.post("/api/auth/google/connect", json=connect_data, headers=auth_headers)

            # Assert
            # The endpoint doesn't validate tokens from request body, just returns profile
            assert response.status_code == 200
            data = response.get_json()
            assert "profile" in data

    def test_google_connect_no_auth(self, client):
        """Test Google connect without authentication token."""
        # Arrange
        connect_data = {
            "access_token": "access_token",
            "refresh_token": "refresh_token"
        }

        # Act
        response = client.post("/api/auth/google/connect", json=connect_data)

        # Assert
        assert response.status_code == 401


class TestEnrichProfile:
    """Test POST /api/auth/enrich-profile endpoint."""

    def test_enrich_profile_success(self, client, auth_headers):
        """Test successful profile enrichment."""
        # Arrange
        enrich_data = {
            "full_name": "John Doe",
            "timezone": "America/New_York"
        }

        mock_profile = {"id": "user-1", "email": "test@example.com"}
        mock_updated_profile = {"id": "user-1", **enrich_data}

        with patch("app.routes.auth.UsersService") as mock_users_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_profile.return_value = mock_profile
            mock_service_instance.update_profile.return_value = mock_updated_profile
            mock_users_service.return_value = mock_service_instance

            # Act
            response = client.post("/api/auth/enrich-profile", json=enrich_data, headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert "Profile enriched" in data["message"]
            assert data["profile"]["full_name"] == enrich_data["full_name"]

    def test_enrich_profile_empty_data(self, client, auth_headers):
        """Test profile enrichment with empty data."""
        # Arrange
        mock_profile = {"id": "user-1"}
        mock_updated_profile = {"id": "user-1", "avatar_url": None, "google_auth_token": None}

        with patch("app.routes.auth.UsersService") as mock_users_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_profile.return_value = mock_profile
            mock_service_instance.update_profile.return_value = mock_updated_profile
            mock_users_service.return_value = mock_service_instance

            # Act
            response = client.post("/api/auth/enrich-profile", json={}, headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert "Profile enriched" in data["message"]

    def test_enrich_profile_no_auth(self, client):
        """Test enrich profile without authentication token."""
        # Arrange
        enrich_data = {"full_name": "John Doe"}

        # Act
        response = client.post("/api/auth/enrich-profile", json=enrich_data)

        # Assert
        assert response.status_code == 401
