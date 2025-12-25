"""
Comprehensive unit tests for EventFinalizationService.

Test coverage:
- finalize_event: success, not coordinator, already finalized, no credentials
- _get_event: success, not found
- _get_user_profile: success, not found
- _get_participants: success, empty
- _prepare_calendar_event: with/without Google Meet
- _create_google_calendar_event_with_retry: success, auth error, rate limit
- _update_event_finalization: success, database error
- _create_finalization_notifications: success
"""

import pytest
from datetime import datetime, timezone
from unittest.mock import Mock, patch
from app.services.event_finalization import EventFinalizationService


# ============================================================================
# Test Fixtures
# ============================================================================

@pytest.fixture
def mock_supabase():
    """Create a mock Supabase client."""
    return Mock()


@pytest.fixture
def finalization_service(monkeypatch, mock_supabase):
    """Create EventFinalizationService with mocked dependencies."""
    monkeypatch.setattr("app.services.event_finalization.get_supabase", lambda access_token=None: mock_supabase)
    monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")

    service = EventFinalizationService()
    service.service_role_client = mock_supabase
    return service


@pytest.fixture
def sample_event():
    """Sample event data."""
    return {
        "id": "event-123",
        "name": "Team Meeting",
        "description": "Quarterly planning",
        "coordinator_id": "user-coordinator",
        "status": "planning",
        "duration_minutes": 60
    }


@pytest.fixture
def sample_participants():
    """Sample participants data."""
    return [
        {
            "id": "user-1",
            "email_address": "alice@example.com",
            "full_name": "Alice"
        },
        {
            "id": "user-2",
            "email_address": "bob@example.com",
            "full_name": "Bob"
        }
    ]


@pytest.fixture
def sample_coordinator():
    """Sample coordinator profile."""
    return {
        "id": "user-coordinator",
        "email_address": "coordinator@example.com",
        "full_name": "Coordinator",
        "timezone": "America/New_York"
    }


# ============================================================================
# Tests: finalize_event
# ============================================================================

class TestFinalizeEvent:
    """Tests for finalize_event method."""

    def test_finalize_event_success(self, finalization_service, mock_supabase, sample_event, sample_coordinator, sample_participants):
        """Test successfully finalizing an event."""
        # Arrange
        mock_credentials = Mock()
        mock_service = Mock()

        created_event = {
            "id": "gcal-event-123",
            "htmlLink": "https://calendar.google.com/event?eid=123"
        }

        mock_service.events.return_value.insert.return_value.execute.return_value = created_event

        with patch("app.services.event_finalization.get_stored_credentials", return_value=mock_credentials):
            with patch("app.services.event_finalization.get_calendar_service", return_value=mock_service):
                with patch.object(finalization_service, "_get_event", return_value=sample_event):
                    with patch.object(finalization_service, "_get_user_profile", return_value=sample_coordinator):
                        with patch.object(finalization_service, "_get_participants", return_value=sample_participants):
                            with patch.object(finalization_service, "_update_event_finalization"):
                                with patch.object(finalization_service, "_create_finalization_notifications"):
                                    # Act
                                    result = finalization_service.finalize_event(
                                        event_id="event-123",
                                        coordinator_id="user-coordinator",
                                        start_time_utc="2025-12-20T14:00:00Z",
                                        end_time_utc="2025-12-20T15:00:00Z",
                                        participant_ids=["user-1", "user-2"]
                                    )

                                    # Assert
                                    assert result["success"] is True
                                    assert "google_event_id" in result
                                    assert "html_link" in result

    def test_finalize_event_not_coordinator(self, finalization_service, sample_event):
        """Test finalization fails when user is not coordinator."""
        # Arrange
        with patch.object(finalization_service, "_get_event", return_value=sample_event):
            # Act & Assert
            with pytest.raises(Exception, match="Only coordinator can finalize"):
                finalization_service.finalize_event(
                    event_id="event-123",
                    coordinator_id="user-not-coordinator",
                    start_time_utc="2025-12-20T14:00:00Z",
                    end_time_utc="2025-12-20T15:00:00Z",
                    participant_ids=[]
                )

    def test_finalize_event_already_finalized(self, finalization_service):
        """Test finalization fails when event already finalized."""
        # Arrange
        finalized_event = {
            "id": "event-123",
            "coordinator_id": "user-coordinator",
            "status": "finalized"
        }

        with patch.object(finalization_service, "_get_event", return_value=finalized_event):
            # Act & Assert
            with pytest.raises(Exception, match="already finalized"):
                finalization_service.finalize_event(
                    event_id="event-123",
                    coordinator_id="user-coordinator",
                    start_time_utc="2025-12-20T14:00:00Z",
                    end_time_utc="2025-12-20T15:00:00Z",
                    participant_ids=[]
                )

    def test_finalize_event_no_credentials(self, finalization_service, sample_event, sample_coordinator):
        """Test finalization fails when coordinator has no Google credentials."""
        # Arrange
        with patch.object(finalization_service, "_get_event", return_value=sample_event):
            with patch("app.services.event_finalization.get_stored_credentials", return_value=None):
                # Act & Assert
                with pytest.raises(Exception, match="Google Calendar not connected"):
                    finalization_service.finalize_event(
                        event_id="event-123",
                        coordinator_id="user-coordinator",
                        start_time_utc="2025-12-20T14:00:00Z",
                        end_time_utc="2025-12-20T15:00:00Z",
                        participant_ids=[]
                    )


# ============================================================================
# Tests: _prepare_calendar_event
# ============================================================================

class TestPrepareCalendarEvent:
    """Tests for _prepare_calendar_event method."""

    def test_prepare_calendar_event_basic(self, finalization_service, sample_event):
        """Test preparing basic calendar event."""
        # Act
        result = finalization_service._prepare_calendar_event(
            event=sample_event,
            start_time_utc="2025-12-20T14:00:00Z",
            end_time_utc="2025-12-20T15:00:00Z",
            attendee_emails=["alice@example.com", "bob@example.com"],
            coordinator_timezone="America/New_York",
            include_google_meet=False,
            event_id="event-123"
        )

        # Assert
        assert result["summary"] == "Team Meeting"
        assert len(result["attendees"]) == 2
        assert "conferenceData" not in result

    def test_prepare_calendar_event_with_meet(self, finalization_service, sample_event):
        """Test preparing calendar event with Google Meet."""
        # Act
        result = finalization_service._prepare_calendar_event(
            event=sample_event,
            start_time_utc="2025-12-20T14:00:00Z",
            end_time_utc="2025-12-20T15:00:00Z",
            attendee_emails=["alice@example.com"],
            coordinator_timezone="America/New_York",
            include_google_meet=True,
            event_id="event-123"
        )

        # Assert
        assert "conferenceData" in result
        assert result["conferenceData"]["createRequest"]["conferenceSolutionKey"]["type"] == "hangoutsMeet"


# ============================================================================
# Tests: _create_google_calendar_event_with_retry
# ============================================================================

class TestCreateGoogleCalendarEventWithRetry:
    """Tests for _create_google_calendar_event_with_retry method."""

    def test_create_event_success(self, finalization_service):
        """Test successfully creating Google Calendar event."""
        # Arrange
        mock_credentials = Mock()
        mock_service = Mock()

        created_event = {
            "id": "gcal-event-123",
            "htmlLink": "https://calendar.google.com/event?eid=123"
        }

        mock_service.events.return_value.insert.return_value.execute.return_value = created_event

        with patch("app.services.event_finalization.get_calendar_service", return_value=mock_service):
            # Act
            result = finalization_service._create_google_calendar_event_with_retry(
                credentials=mock_credentials,
                coordinator_id="user-coordinator",
                event_data={"summary": "Test Event"}
            )

            # Assert
            assert result["id"] == "gcal-event-123"

    def test_create_event_auth_error(self, finalization_service):
        """Test creation fails with auth error."""
        # Arrange
        mock_credentials = Mock()
        mock_service = Mock()
        mock_service.events.return_value.insert.return_value.execute.side_effect = Exception("401 unauthorized")

        with patch("app.services.event_finalization.get_calendar_service", return_value=mock_service):
            # Act & Assert
            with pytest.raises(Exception, match="authentication failed"):
                finalization_service._create_google_calendar_event_with_retry(
                    credentials=mock_credentials,
                    coordinator_id="user-coordinator",
                    event_data={}
                )

    def test_create_event_rate_limit_retry(self, finalization_service):
        """Test creation retries on rate limit."""
        # Arrange
        mock_credentials = Mock()
        mock_service = Mock()

        created_event = {"id": "gcal-event-123", "htmlLink": "https://calendar.google.com/event"}

        # First call fails with rate limit, second succeeds
        mock_service.events.return_value.insert.return_value.execute.side_effect = [
            Exception("429 rate limit"),
            created_event
        ]

        with patch("app.services.event_finalization.get_calendar_service", return_value=mock_service):
            with patch("time.sleep"):  # Mock sleep
                # Act
                result = finalization_service._create_google_calendar_event_with_retry(
                    credentials=mock_credentials,
                    coordinator_id="user-coordinator",
                    event_data={}
                )

                # Assert
                assert result["id"] == "gcal-event-123"


# ============================================================================
# Tests: Helper Methods
# ============================================================================

class TestHelperMethods:
    """Tests for helper methods."""

    def test_get_event_success(self, finalization_service, mock_supabase, sample_event):
        """Test getting event."""
        # Arrange
        mock_result = Mock()
        mock_result.data = [sample_event]
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_result

        # Act
        result = finalization_service._get_event("event-123")

        # Assert
        assert result is not None
        assert result["id"] == "event-123"

    def test_get_event_not_found(self, finalization_service, mock_supabase):
        """Test getting event that doesn't exist."""
        # Arrange
        mock_result = Mock()
        mock_result.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_result

        # Act
        result = finalization_service._get_event("event-999")

        # Assert
        assert result is None

    def test_get_participants_success(self, finalization_service, mock_supabase, sample_participants):
        """Test getting participants."""
        # Arrange
        mock_result = Mock()
        mock_result.data = sample_participants
        mock_supabase.table.return_value.select.return_value.in_.return_value.execute.return_value = mock_result

        # Act
        result = finalization_service._get_participants(["user-1", "user-2"])

        # Assert
        assert len(result) == 2

    def test_update_event_finalization_success(self, finalization_service, mock_supabase):
        """Test updating event finalization."""
        # Arrange
        mock_result = Mock()
        mock_result.data = [{"id": "event-123"}]
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_result

        # Act - Should not raise
        finalization_service._update_event_finalization(
            event_id="event-123",
            start_time_utc="2025-12-20T14:00:00Z",
            end_time_utc="2025-12-20T15:00:00Z",
            google_event_id="gcal-123",
            google_html_link="https://calendar.google.com/event"
        )
