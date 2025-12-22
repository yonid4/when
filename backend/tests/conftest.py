"""
Pytest configuration and shared fixtures for backend testing.

This module provides:
- Flask test client fixture
- Mock Supabase client with service role key simulation
- Mock Google Calendar API client
- Mock Gemini AI client
- Sample user fixtures with JWT tokens
- Sample event data fixtures
- Mock datetime for consistent test times
"""

import os
import pytest
import jwt
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, MagicMock, patch
from flask import Flask
from typing import Dict, Any, List


# ============================================================================
# Environment Setup
# ============================================================================

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Setup test environment variables before any tests run."""
    os.environ["SUPABASE_URL"] = "https://test.supabase.co"
    os.environ["SUPABASE_ANON_KEY"] = "test-anon-key"
    os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "test-service-role-key"
    os.environ["GOOGLE_CLIENT_ID"] = "test-google-client-id"
    os.environ["GOOGLE_CLIENT_SECRET"] = "test-google-client-secret"
    os.environ["GOOGLE_REDIRECT_URI"] = "http://localhost:5000/api/auth/google/callback"
    os.environ["JWT_SECRET_KEY"] = "test-jwt-secret"
    os.environ["SECRET_KEY"] = "test-secret-key"
    os.environ["FRONTEND_URL"] = "http://localhost:3000"

    yield

    # Cleanup after all tests


# ============================================================================
# Flask Application Fixtures
# ============================================================================

@pytest.fixture
def app():
    """Create and configure a Flask application for testing."""
    from app import create_app

    app = create_app("testing")
    app.config.update({
        "TESTING": True,
        "DEBUG": False,
        "WTF_CSRF_ENABLED": False,
    })

    yield app


@pytest.fixture
def client(app):
    """Flask test client."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Flask test CLI runner."""
    return app.test_cli_runner()


# ============================================================================
# Mock Datetime Fixtures
# ============================================================================

@pytest.fixture
def fixed_datetime():
    """Provide a fixed datetime for consistent testing."""
    return datetime(2024, 12, 18, 12, 0, 0, tzinfo=timezone.utc)


@pytest.fixture
def mock_datetime(fixed_datetime):
    """Mock datetime.now() and datetime.utcnow() for consistent tests."""
    with patch("datetime.datetime") as mock_dt:
        mock_dt.now.return_value = fixed_datetime
        mock_dt.utcnow.return_value = fixed_datetime
        mock_dt.side_effect = lambda *args, **kwargs: datetime(*args, **kwargs)
        yield mock_dt


# ============================================================================
# Sample User Fixtures
# ============================================================================

@pytest.fixture
def sample_user():
    """Sample user data."""
    return {
        "id": "user-123",
        "email": "coordinator@example.com",
        "full_name": "Test Coordinator",
        "avatar_url": "https://example.com/avatar.jpg",
        "created_at": "2024-01-01T00:00:00Z"
    }


@pytest.fixture
def sample_participant():
    """Sample participant user data."""
    return {
        "id": "user-456",
        "email": "participant@example.com",
        "full_name": "Test Participant",
        "avatar_url": "https://example.com/avatar2.jpg",
        "created_at": "2024-01-01T00:00:00Z"
    }


@pytest.fixture
def sample_jwt_token(sample_user):
    """Generate a valid JWT token for testing."""
    secret = os.getenv("JWT_SECRET_KEY", "test-jwt-secret")
    payload = {
        "sub": sample_user["id"],
        "email": sample_user["email"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture
def sample_participant_token(sample_participant):
    """Generate a valid JWT token for participant testing."""
    secret = os.getenv("JWT_SECRET_KEY", "test-jwt-secret")
    payload = {
        "sub": sample_participant["id"],
        "email": sample_participant["email"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture
def expired_jwt_token(sample_user):
    """Generate an expired JWT token for testing."""
    secret = os.getenv("JWT_SECRET_KEY", "test-jwt-secret")
    payload = {
        "sub": sample_user["id"],
        "email": sample_user["email"],
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        "iat": datetime.now(timezone.utc) - timedelta(hours=2)
    }
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture
def auth_headers(sample_jwt_token, sample_user):
    """
    Create Authorization headers with a valid JWT token for API testing.
    Also mocks Supabase auth to return the sample user when token is verified.
    """
    with patch("app.utils.decorators.get_supabase") as mock_get_supabase:
        mock_supabase = Mock()
        mock_user_obj = Mock()
        mock_user_obj.id = "user-1"  # Match the sample auth user ID used in tests
        mock_user_obj.email = sample_user["email"]

        mock_user_response = Mock()
        mock_user_response.user = mock_user_obj

        mock_supabase.auth.get_user.return_value = mock_user_response
        mock_get_supabase.return_value = mock_supabase

        yield {"Authorization": f"Bearer {sample_jwt_token}"}


# ============================================================================
# Sample Event Fixtures
# ============================================================================

@pytest.fixture
def sample_event(sample_user):
    """Sample event data."""
    return {
        "id": "event-123",
        "uid": "abc123def456",
        "name": "Test Event",
        "description": "A test event for testing",
        "coordinator_id": sample_user["id"],
        "earliest_date": "2024-12-20T00:00:00+00:00",
        "latest_date": "2024-12-25T23:59:59+00:00",
        "earliest_hour": "09:00:00",
        "latest_hour": "17:00:00",
        "duration_minutes": 60,
        "status": "planning",
        "selected_start_time_utc": None,
        "selected_end_time_utc": None,
        "finalized_start_time_utc": None,
        "finalized_end_time_utc": None,
        "google_calendar_event_id": None,
        "google_calendar_html_link": None,
        "finalized_at": None,
        "created_at": "2024-12-18T12:00:00Z",
        "updated_at": "2024-12-18T12:00:00Z"
    }


@pytest.fixture
def sample_finalized_event(sample_user):
    """Sample finalized event data."""
    return {
        "id": "event-789",
        "uid": "xyz789abc123",
        "name": "Finalized Event",
        "description": "A finalized event",
        "coordinator_id": sample_user["id"],
        "earliest_date": "2024-12-20T00:00:00+00:00",
        "latest_date": "2024-12-25T23:59:59+00:00",
        "earliest_hour": "09:00:00",
        "latest_hour": "17:00:00",
        "duration_minutes": 60,
        "status": "confirmed",
        "selected_start_time_utc": "2024-12-20T14:00:00Z",
        "selected_end_time_utc": "2024-12-20T15:00:00Z",
        "finalized_start_time_utc": "2024-12-20T14:00:00Z",
        "finalized_end_time_utc": "2024-12-20T15:00:00Z",
        "google_calendar_event_id": "gcal-123",
        "google_calendar_html_link": "https://calendar.google.com/event?eid=gcal-123",
        "finalized_at": "2024-12-18T12:00:00Z",
        "created_at": "2024-12-18T12:00:00Z",
        "updated_at": "2024-12-18T12:00:00Z"
    }


@pytest.fixture
def sample_event_participant(sample_user, sample_participant):
    """Sample event participant data."""
    return {
        "id": "participant-123",
        "event_id": "event-123",
        "user_id": sample_participant["id"],
        "status": "accepted",
        "joined_at": "2024-12-18T12:00:00Z",
        "created_at": "2024-12-18T12:00:00Z"
    }


# ============================================================================
# Mock Supabase Client
# ============================================================================

class MockSupabaseTable:
    """Mock Supabase table with chainable query methods."""

    def __init__(self, table_name: str, mock_data: Dict[str, List[Dict]] = None):
        self.table_name = table_name
        self.mock_data = mock_data or {}
        self._select_fields = "*"
        self._filters = []
        self._update_data = None
        self._insert_data = None
        self._count_mode = False

    def select(self, fields: str = "*", count: str = None):
        """Mock select operation."""
        self._select_fields = fields
        if count == "exact":
            self._count_mode = True
        return self

    def insert(self, data):
        """Mock insert operation."""
        self._insert_data = data
        return self

    def update(self, data):
        """Mock update operation."""
        self._update_data = data
        return self

    def delete(self):
        """Mock delete operation."""
        return self

    def eq(self, field: str, value: Any):
        """Mock equality filter."""
        self._filters.append(("eq", field, value))
        return self

    def in_(self, field: str, values: List[Any]):
        """Mock IN filter."""
        self._filters.append(("in", field, values))
        return self

    def execute(self):
        """Mock execute operation."""
        result = Mock()

        # Get mock data for this table
        table_data = self.mock_data.get(self.table_name, [])

        # Apply filters
        filtered_data = table_data
        for filter_type, field, value in self._filters:
            if filter_type == "eq":
                filtered_data = [item for item in filtered_data if item.get(field) == value]
            elif filter_type == "in":
                filtered_data = [item for item in filtered_data if item.get(field) in value]

        # Handle different operations
        if self._insert_data:
            # Simulate insert
            result.data = [self._insert_data]
            result.error = None
        elif self._update_data:
            # Simulate update
            result.data = filtered_data if filtered_data else None
            result.error = None
        elif self._count_mode:
            # Simulate count
            result.data = filtered_data
            result.count = len(filtered_data)
            result.error = None
        else:
            # Simulate select
            result.data = filtered_data if filtered_data else None
            result.error = None

        return result


@pytest.fixture
def mock_supabase_client(sample_event, sample_user, sample_participant):
    """Create a mock Supabase client that simulates service role behavior."""

    # Default mock data
    mock_data = {
        "events": [sample_event],
        "profiles": [sample_user, sample_participant],
        "event_participants": []
    }

    mock_client = Mock()

    # Mock table method to return MockSupabaseTable
    def table(table_name: str):
        return MockSupabaseTable(table_name, mock_data)

    mock_client.table = table

    # Mock auth methods
    mock_client.auth = Mock()
    mock_client.auth.get_user = Mock(return_value=Mock(user=sample_user))
    mock_client.auth.get_session = Mock(return_value={"user": sample_user})
    mock_client.auth.refresh_session = Mock(return_value={"access_token": "new-token"})
    mock_client.auth.sign_out = Mock(return_value=None)

    return mock_client


# ============================================================================
# Mock Google Calendar Client
# ============================================================================

@pytest.fixture
def mock_google_calendar():
    """Mock Google Calendar API client."""
    mock_calendar = Mock()

    # Mock OAuth flow
    mock_flow = Mock()
    mock_flow.authorization_url.return_value = ("https://accounts.google.com/oauth", "state-123")

    # Mock credentials
    mock_credentials = Mock()
    mock_credentials.token = "google-access-token"
    mock_credentials.refresh_token = "google-refresh-token"
    mock_credentials.expired = False
    mock_credentials.to_json.return_value = '{"token": "google-access-token"}'

    # Mock calendar service
    mock_service = Mock()
    mock_events = Mock()

    # Mock event creation
    mock_events.insert.return_value.execute.return_value = {
        "id": "gcal-event-123",
        "htmlLink": "https://calendar.google.com/event?eid=gcal-event-123",
        "summary": "Test Event",
        "start": {"dateTime": "2024-12-20T14:00:00Z"},
        "end": {"dateTime": "2024-12-20T15:00:00Z"}
    }

    # Mock event list
    mock_events.list.return_value.execute.return_value = {
        "items": []
    }

    mock_service.events.return_value = mock_events

    return {
        "flow": mock_flow,
        "credentials": mock_credentials,
        "service": mock_service
    }


# ============================================================================
# Mock Gemini AI Client
# ============================================================================

@pytest.fixture
def mock_gemini_client():
    """Mock Gemini AI client for time proposal generation."""
    mock_gemini = Mock()

    # Mock generate_content response
    mock_response = Mock()
    mock_response.text = """
    Based on the availability data, here are the recommended time slots:

    1. December 20, 2024 at 2:00 PM - 3:00 PM (5 participants available)
    2. December 21, 2024 at 10:00 AM - 11:00 AM (4 participants available)
    3. December 22, 2024 at 3:00 PM - 4:00 PM (4 participants available)
    """

    mock_gemini.generate_content.return_value = mock_response

    return mock_gemini


# ============================================================================
# Mock External Services
# ============================================================================

@pytest.fixture
def mock_get_supabase(mock_supabase_client):
    """Mock the get_supabase function to return our mock client."""
    with patch("app.utils.supabase_client.get_supabase", return_value=mock_supabase_client):
        yield mock_supabase_client


@pytest.fixture
def mock_google_calendar_service(mock_google_calendar):
    """Mock Google Calendar service creation."""
    with patch("app.services.google_calendar.create_flow", return_value=mock_google_calendar["flow"]):
        with patch("app.services.google_calendar.build", return_value=mock_google_calendar["service"]):
            yield mock_google_calendar


# ============================================================================
# Helper Functions
# ============================================================================

def create_mock_supabase_response(data: Any = None, error: Any = None, count: int = None):
    """
    Create a mock Supabase response object.

    Args:
        data: The data to return
        error: The error to return
        count: The count for count queries

    Returns:
        Mock response object matching Supabase response format
    """
    response = Mock()
    response.data = data
    response.error = error
    response.count = count
    return response


def create_auth_header(token: str) -> Dict[str, str]:
    """
    Create an Authorization header dictionary for API requests.

    Args:
        token: JWT token

    Returns:
        Dictionary with Authorization header
    """
    return {"Authorization": f"Bearer {token}"}
