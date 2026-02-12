"""
Integration tests for event finalization flow.

Flow tested:
1. Coordinator finalizes event time →
2. Google Calendar event created →
3. Participants notified →
4. Event status updated to 'finalized' →
5. Calendar link stored →
6. Invitations sent via Google
"""

import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, patch, MagicMock
from google.oauth2.credentials import Credentials
from app.services.event_finalization import EventFinalizationService
from app.services.notifications import NotificationsService


class TestEventFinalizationFlow:
    """Integration tests for complete event finalization workflow."""

    @pytest.fixture
    def mock_supabase_for_finalization(self):
        """Mock Supabase client for finalization operations."""
        mock_client = Mock()

        # Storage
        events = [{
            "id": "event-123",
            "name": "Team Standup",
            "description": "Weekly standup meeting",
            "coordinator_id": "coordinator-1",
            "status": "planning",
            "duration_minutes": 60,
            "google_calendar_event_id": None,
            "google_calendar_html_link": None,
            "finalized_at": None,
            "finalized_start_time_utc": None,
            "finalized_end_time_utc": None
        }]

        profiles = [
            {
                "id": "coordinator-1",
                "email_address": "coordinator@example.com",
                "full_name": "Coordinator User",
                "timezone": "America/New_York",
                "google_auth_token": {
                    "token": "access-token-123",
                    "refresh_token": "refresh-token-123",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "client_id": "test-client-id",
                    "client_secret": "test-client-secret",
                    "scopes": ["https://www.googleapis.com/auth/calendar"]
                }
            },
            {
                "id": "participant-1",
                "email_address": "participant1@example.com",
                "full_name": "Participant One",
                "timezone": "UTC"
            },
            {
                "id": "participant-2",
                "email_address": "participant2@example.com",
                "full_name": "Participant Two",
                "timezone": "Europe/London"
            }
        ]

        notifications = []

        def table_mock(table_name: str):
            table = Mock()

            if table_name == "events":
                def select_mock(fields="*"):
                    query = Mock()

                    def eq_mock(field, value):
                        result = Mock()
                        filtered = [e for e in events if e.get(field) == value]
                        result.execute.return_value.data = filtered
                        return result

                    query.eq = eq_mock
                    return query

                def update_mock(data):
                    query = Mock()

                    def eq_mock(field, value):
                        result = Mock()
                        for event in events:
                            if event.get(field) == value:
                                event.update(data)
                        result.execute.return_value.data = [e for e in events if e.get(field) == value]
                        return result

                    query.eq = eq_mock
                    return query

                table.select = select_mock
                table.update = update_mock

            elif table_name == "profiles":
                def select_mock(fields="*"):
                    query = Mock()

                    def eq_mock(field, value):
                        result = Mock()
                        filtered = [p for p in profiles if p.get(field) == value]
                        result.execute.return_value.data = filtered
                        return result

                    def in_mock(field, values):
                        result = Mock()
                        filtered = [p for p in profiles if p.get(field) in values]
                        result.execute.return_value.data = filtered
                        return result

                    query.eq = eq_mock
                    query.in_ = in_mock
                    return query

                table.select = select_mock

            elif table_name == "notifications":
                def insert_mock(data):
                    result = Mock()
                    notification_data = {
                        **data,
                        "id": f"notification-{len(notifications) + 1}",
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "is_read": False
                    }
                    notifications.append(notification_data)
                    result.execute.return_value.data = [notification_data]
                    return result

                def select_mock(fields="*"):
                    query = Mock()

                    def eq_mock(field, value):
                        result = Mock()
                        filtered = [n for n in notifications if n.get(field) == value]
                        result.execute.return_value.data = filtered
                        return result

                    def execute_mock():
                        result = Mock()
                        result.data = notifications  # Return all notifications
                        return result

                    query.eq = eq_mock
                    query.execute = execute_mock
                    return query

                table.insert = insert_mock
                table.select = select_mock

            return table

        mock_client.table = table_mock
        return mock_client

    @pytest.fixture
    def mock_google_calendar_service(self):
        """Mock Google Calendar API service for event creation."""
        mock_service = Mock()
        mock_events = Mock()

        # Mock successful event creation
        mock_insert = Mock()
        mock_insert.execute.return_value = {
            "id": "gcal-event-123",
            "htmlLink": "https://calendar.google.com/event?eid=gcal-event-123",
            "summary": "Team Standup",
            "start": {"dateTime": (datetime.now(timezone.utc) + timedelta(days=2, hours=14)).isoformat()},
            "end": {"dateTime": (datetime.now(timezone.utc) + timedelta(days=2, hours=15)).isoformat()},
            "hangoutLink": "https://meet.google.com/abc-defg-hij"
        }

        mock_events.insert.return_value = mock_insert
        mock_service.events.return_value = mock_events

        return mock_service

    @pytest.fixture
    def mock_credentials(self):
        """Mock Google OAuth credentials."""
        mock_creds = Mock(spec=Credentials)
        mock_creds.token = "access-token-123"
        mock_creds.refresh_token = "refresh-token-123"
        mock_creds.expired = False
        mock_creds.valid = True
        mock_creds.token_uri = "https://oauth2.googleapis.com/token"
        mock_creds.client_id = "test-client-id"
        mock_creds.client_secret = "test-client-secret"
        mock_creds.scopes = ["https://www.googleapis.com/auth/calendar"]
        return mock_creds

    def test_complete_finalization_flow(
        self,
        mock_supabase_for_finalization,
        mock_google_calendar_service,
        mock_credentials
    ):
        """
        Test complete event finalization from start to finish.

        Steps:
        1. Finalize event with valid data
        2. Google Calendar event created
        3. Event status updated in database
        4. Participants notified
        5. Calendar link stored
        """
        # Arrange
        event_id = "event-123"
        coordinator_id = "coordinator-1"
        participant_ids = ["participant-1", "participant-2"]
        start_time_utc = (datetime.now(timezone.utc) + timedelta(days=2, hours=14)).isoformat()
        end_time_utc = (datetime.now(timezone.utc) + timedelta(days=2, hours=15)).isoformat()

        with patch('app.services.event_finalization.get_supabase', return_value=mock_supabase_for_finalization):
            with patch('app.services.event_finalization.create_client', return_value=mock_supabase_for_finalization):
                with patch('app.services.event_finalization.get_stored_credentials', return_value=mock_credentials):
                    with patch('app.services.event_finalization.get_calendar_service', return_value=mock_google_calendar_service):
                        with patch('app.services.notifications.get_supabase', return_value=mock_supabase_for_finalization):
                            with patch('app.services.notifications.create_client', return_value=mock_supabase_for_finalization):
                                finalization_service = EventFinalizationService()

                                # Act - Finalize event
                                result = finalization_service.finalize_event(
                                    event_id=event_id,
                                    coordinator_id=coordinator_id,
                                    start_time_utc=start_time_utc,
                                    end_time_utc=end_time_utc,
                                    participant_ids=participant_ids,
                                    include_google_meet=True
                                )

                                # Assert - Result contains Google Calendar data
                                assert result is not None
                                assert result["success"] is True
                                assert result["provider_event_id"] == "gcal-event-123"
                                assert "calendar.google.com" in result["html_link"]
                                assert result["meet_link"] is not None

                                # Assert - Google Calendar event was created
                                mock_google_calendar_service.events().insert.assert_called_once()
                                call_kwargs = mock_google_calendar_service.events().insert.call_args[1]
                                assert call_kwargs["calendarId"] == "primary"
                                assert "sendUpdates" in call_kwargs
                                assert call_kwargs["sendUpdates"] == "all"

                                # Assert - Event updated in database
                                event = mock_supabase_for_finalization.table("events").select("*").eq("id", event_id).execute().data[0]
                                assert event["status"] == "finalized"
                                assert event["provider_event_id"] == "gcal-event-123"
                                assert event["google_calendar_html_link"] is not None
                                assert event["finalized_start_time_utc"] == start_time_utc
                                assert event["finalized_end_time_utc"] == end_time_utc
                                assert event["finalized_at"] is not None

    def test_finalization_fails_for_non_coordinator(self, mock_supabase_for_finalization, mock_credentials):
        """Test that non-coordinators cannot finalize events."""
        # Arrange
        event_id = "event-123"
        non_coordinator_id = "participant-1"  # Not the coordinator
        participant_ids = ["participant-1", "participant-2"]
        start_time_utc = (datetime.now(timezone.utc) + timedelta(days=2, hours=14)).isoformat()
        end_time_utc = (datetime.now(timezone.utc) + timedelta(days=2, hours=15)).isoformat()

        with patch('app.services.event_finalization.get_supabase', return_value=mock_supabase_for_finalization):
            with patch('app.services.event_finalization.create_client', return_value=mock_supabase_for_finalization):
                finalization_service = EventFinalizationService()

                # Act & Assert - Should raise exception
                with pytest.raises(Exception) as exc_info:
                    finalization_service.finalize_event(
                        event_id=event_id,
                        coordinator_id=non_coordinator_id,
                        start_time_utc=start_time_utc,
                        end_time_utc=end_time_utc,
                        participant_ids=participant_ids
                    )

                assert "coordinator" in str(exc_info.value).lower()

    def test_finalization_fails_without_google_credentials(self, mock_supabase_for_finalization):
        """Test that finalization fails if coordinator hasn't connected Google Calendar."""
        # Arrange
        event_id = "event-123"
        coordinator_id = "coordinator-1"
        participant_ids = ["participant-1", "participant-2"]
        start_time_utc = (datetime.now(timezone.utc) + timedelta(days=2, hours=14)).isoformat()
        end_time_utc = (datetime.now(timezone.utc) + timedelta(days=2, hours=15)).isoformat()

        with patch('app.services.event_finalization.get_supabase', return_value=mock_supabase_for_finalization):
            with patch('app.services.event_finalization.create_client', return_value=mock_supabase_for_finalization):
                with patch('app.services.event_finalization.get_stored_credentials', return_value=None):
                    finalization_service = EventFinalizationService()

                    # Act & Assert - Should raise exception
                    with pytest.raises(Exception) as exc_info:
                        finalization_service.finalize_event(
                            event_id=event_id,
                            coordinator_id=coordinator_id,
                            start_time_utc=start_time_utc,
                            end_time_utc=end_time_utc,
                            participant_ids=participant_ids
                        )

                    assert "Google Calendar not connected" in str(exc_info.value)

    def test_participant_notifications_created(
        self,
        mock_supabase_for_finalization,
        mock_google_calendar_service,
        mock_credentials
    ):
        """Test that all participants receive finalization notifications."""
        # Arrange
        event_id = "event-123"
        coordinator_id = "coordinator-1"
        participant_ids = ["participant-1", "participant-2"]
        start_time_utc = (datetime.now(timezone.utc) + timedelta(days=2, hours=14)).isoformat()
        end_time_utc = (datetime.now(timezone.utc) + timedelta(days=2, hours=15)).isoformat()

        with patch('app.services.event_finalization.get_supabase', return_value=mock_supabase_for_finalization):
            with patch('app.services.event_finalization.create_client', return_value=mock_supabase_for_finalization):
                with patch('app.services.event_finalization.get_stored_credentials', return_value=mock_credentials):
                    with patch('app.services.event_finalization.get_calendar_service', return_value=mock_google_calendar_service):
                        with patch('app.services.notifications.get_supabase', return_value=mock_supabase_for_finalization):
                            with patch('app.services.notifications.create_client', return_value=mock_supabase_for_finalization):
                                finalization_service = EventFinalizationService()

                                # Act - Finalize event
                                finalization_service.finalize_event(
                                    event_id=event_id,
                                    coordinator_id=coordinator_id,
                                    start_time_utc=start_time_utc,
                                    end_time_utc=end_time_utc,
                                    participant_ids=participant_ids,
                                    include_google_meet=False
                                )

                                # Assert - Notifications created for participants (not coordinator)
                                notifications = mock_supabase_for_finalization.table("notifications").select("*").execute().data

                                # Should have 2 notifications (for the 2 participants, not coordinator)
                                assert len(notifications) == 2

                                # Verify notification content
                                for notification in notifications:
                                    assert notification["notification_type"] == "event_finalized"
                                    assert notification["user_id"] in participant_ids
                                    assert notification["user_id"] != coordinator_id
                                    assert "Team Standup" in notification["title"]

    def test_google_meet_link_included_when_requested(
        self,
        mock_supabase_for_finalization,
        mock_google_calendar_service,
        mock_credentials
    ):
        """Test that Google Meet link is included when requested."""
        # Arrange
        event_id = "event-123"
        coordinator_id = "coordinator-1"
        participant_ids = ["participant-1", "participant-2"]
        start_time_utc = (datetime.now(timezone.utc) + timedelta(days=2, hours=14)).isoformat()
        end_time_utc = (datetime.now(timezone.utc) + timedelta(days=2, hours=15)).isoformat()

        with patch('app.services.event_finalization.get_supabase', return_value=mock_supabase_for_finalization):
            with patch('app.services.event_finalization.create_client', return_value=mock_supabase_for_finalization):
                with patch('app.services.event_finalization.get_stored_credentials', return_value=mock_credentials):
                    with patch('app.services.event_finalization.get_calendar_service', return_value=mock_google_calendar_service):
                        with patch('app.services.notifications.get_supabase', return_value=mock_supabase_for_finalization):
                            with patch('app.services.notifications.create_client', return_value=mock_supabase_for_finalization):
                                finalization_service = EventFinalizationService()

                                # Act - Finalize with Google Meet
                                result = finalization_service.finalize_event(
                                    event_id=event_id,
                                    coordinator_id=coordinator_id,
                                    start_time_utc=start_time_utc,
                                    end_time_utc=end_time_utc,
                                    participant_ids=participant_ids,
                                    include_google_meet=True
                                )

                                # Assert - Meet link included
                                assert result["meet_link"] is not None
                                assert "meet.google.com" in result["meet_link"]

                                # Assert - conferenceDataVersion parameter was set
                                call_kwargs = mock_google_calendar_service.events().insert.call_args[1]
                                assert "conferenceDataVersion" in call_kwargs
                                assert call_kwargs["conferenceDataVersion"] == 1

    def test_finalization_retry_on_google_api_failure(
        self,
        mock_supabase_for_finalization,
        mock_credentials
    ):
        """Test retry logic when Google Calendar API fails temporarily."""
        # Arrange
        event_id = "event-123"
        coordinator_id = "coordinator-1"
        participant_ids = ["participant-1", "participant-2"]
        start_time_utc = (datetime.now(timezone.utc) + timedelta(days=2, hours=14)).isoformat()
        end_time_utc = (datetime.now(timezone.utc) + timedelta(days=2, hours=15)).isoformat()

        # Mock service that fails once then succeeds
        mock_service = Mock()
        mock_events = Mock()
        mock_insert = Mock()

        # First call fails, second succeeds
        mock_insert.execute.side_effect = [
            Exception("500 Internal Server Error"),
            {
                "id": "gcal-event-123",
                "htmlLink": "https://calendar.google.com/event?eid=gcal-event-123",
                "summary": "Team Standup",
                "start": {"dateTime": start_time_utc},
                "end": {"dateTime": end_time_utc}
            }
        ]

        mock_events.insert.return_value = mock_insert
        mock_service.events.return_value = mock_events

        with patch('app.services.event_finalization.get_supabase', return_value=mock_supabase_for_finalization):
            with patch('app.services.event_finalization.create_client', return_value=mock_supabase_for_finalization):
                with patch('app.services.event_finalization.get_stored_credentials', return_value=mock_credentials):
                    with patch('app.services.event_finalization.get_calendar_service', return_value=mock_service):
                        with patch('app.services.notifications.get_supabase', return_value=mock_supabase_for_finalization):
                            with patch('app.services.notifications.create_client', return_value=mock_supabase_for_finalization):
                                finalization_service = EventFinalizationService()

                                # Act - Finalize (should retry and succeed)
                                result = finalization_service.finalize_event(
                                    event_id=event_id,
                                    coordinator_id=coordinator_id,
                                    start_time_utc=start_time_utc,
                                    end_time_utc=end_time_utc,
                                    participant_ids=participant_ids
                                )

                                # Assert - Eventually succeeded
                                assert result is not None
                                assert result["success"] is True
                                # Called twice (failed once, succeeded once)
                                assert mock_insert.execute.call_count == 2

    def test_already_finalized_event_raises_error(self, mock_supabase_for_finalization):
        """Test that finalizing an already finalized event raises an error."""
        # Arrange
        event_id = "event-123"
        coordinator_id = "coordinator-1"
        participant_ids = ["participant-1", "participant-2"]
        start_time_utc = (datetime.now(timezone.utc) + timedelta(days=2, hours=14)).isoformat()
        end_time_utc = (datetime.now(timezone.utc) + timedelta(days=2, hours=15)).isoformat()

        # Mark event as already finalized
        event = mock_supabase_for_finalization.table("events").select("*").eq("id", event_id).execute().data[0]
        event["status"] = "finalized"

        with patch('app.services.event_finalization.get_supabase', return_value=mock_supabase_for_finalization):
            with patch('app.services.event_finalization.create_client', return_value=mock_supabase_for_finalization):
                finalization_service = EventFinalizationService()

                # Act & Assert - Should raise exception
                with pytest.raises(Exception) as exc_info:
                    finalization_service.finalize_event(
                        event_id=event_id,
                        coordinator_id=coordinator_id,
                        start_time_utc=start_time_utc,
                        end_time_utc=end_time_utc,
                        participant_ids=participant_ids
                    )

                assert "already finalized" in str(exc_info.value).lower()

    def test_email_invitations_sent_to_attendees(
        self,
        mock_supabase_for_finalization,
        mock_google_calendar_service,
        mock_credentials
    ):
        """Test that Google Calendar sends email invitations to all attendees."""
        # Arrange
        event_id = "event-123"
        coordinator_id = "coordinator-1"
        participant_ids = ["participant-1", "participant-2"]
        start_time_utc = (datetime.now(timezone.utc) + timedelta(days=2, hours=14)).isoformat()
        end_time_utc = (datetime.now(timezone.utc) + timedelta(days=2, hours=15)).isoformat()

        with patch('app.services.event_finalization.get_supabase', return_value=mock_supabase_for_finalization):
            with patch('app.services.event_finalization.create_client', return_value=mock_supabase_for_finalization):
                with patch('app.services.event_finalization.get_stored_credentials', return_value=mock_credentials):
                    with patch('app.services.event_finalization.get_calendar_service', return_value=mock_google_calendar_service):
                        with patch('app.services.notifications.get_supabase', return_value=mock_supabase_for_finalization):
                            with patch('app.services.notifications.create_client', return_value=mock_supabase_for_finalization):
                                finalization_service = EventFinalizationService()

                                # Act
                                finalization_service.finalize_event(
                                    event_id=event_id,
                                    coordinator_id=coordinator_id,
                                    start_time_utc=start_time_utc,
                                    end_time_utc=end_time_utc,
                                    participant_ids=participant_ids
                                )

                                # Assert - sendUpdates parameter set to 'all'
                                call_kwargs = mock_google_calendar_service.events().insert.call_args[1]
                                assert "sendUpdates" in call_kwargs
                                assert call_kwargs["sendUpdates"] == "all"

                                # Assert - Attendees included in event body
                                call_body = call_kwargs["body"]
                                assert "attendees" in call_body
                                attendee_emails = [a["email"] for a in call_body["attendees"]]
                                assert "participant1@example.com" in attendee_emails
                                assert "participant2@example.com" in attendee_emails
