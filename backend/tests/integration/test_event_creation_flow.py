"""
Integration tests for the event creation flow.

Flow tested:
1. User creates event →
2. System generates UID →
3. Event stored in DB →
4. Creator added as participant →
5. Event retrievable by creator
"""

import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, patch, MagicMock
from app.services.events import EventsService


class TestEventCreationFlow:
    """Integration tests for complete event creation workflow."""

    @pytest.fixture
    def mock_supabase_for_event_creation(self):
        """Mock Supabase client with realistic event creation behavior."""
        mock_client = Mock()

        # Storage for created events and participants
        created_events = []
        created_participants = []

        def table_mock(table_name: str):
            table = Mock()

            if table_name == "events":
                # Mock insert for events
                def insert_mock(data):
                    result = Mock()
                    # Simulate database adding id and timestamps
                    event_data = {
                        **data,
                        "id": f"event-{len(created_events) + 1}",
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }
                    created_events.append(event_data)
                    result.execute.return_value.data = [event_data]
                    return result

                # Mock select for events
                def select_mock(fields="*"):
                    query = Mock()

                    def eq_mock(field, value):
                        result = Mock()
                        # Filter events
                        filtered = [e for e in created_events if e.get(field) == value]
                        result.execute.return_value.data = filtered
                        return result

                    def in_mock(field, values):
                        result = Mock()
                        filtered = [e for e in created_events if e.get(field) in values]
                        result.execute.return_value.data = filtered
                        return result

                    query.eq = eq_mock
                    query.in_ = in_mock
                    return query

                table.insert = insert_mock
                table.select = select_mock

            elif table_name == "event_participants":
                # Mock insert for participants
                def insert_mock(data):
                    result = Mock()
                    participant_data = {
                        **data,
                        "id": f"participant-{len(created_participants) + 1}",
                        "joined_at": datetime.now(timezone.utc).isoformat(),
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    }
                    created_participants.append(participant_data)
                    result.execute.return_value.data = [participant_data]
                    return result

                # Mock select for participants
                def select_mock(fields="*"):
                    query = Mock()

                    def eq_mock(field, value):
                        subquery = Mock()
                        filtered = [p for p in created_participants if p.get(field) == value]

                        def eq2_mock(field2, value2):
                            result = Mock()
                            double_filtered = [p for p in filtered if p.get(field2) == value2]
                            result.execute.return_value.data = double_filtered
                            return result

                        subquery.eq = eq2_mock
                        subquery.execute.return_value.data = filtered
                        return subquery

                    query.eq = eq_mock
                    return query

                table.insert = insert_mock
                table.select = select_mock

            elif table_name == "profiles":
                # Mock select for profiles
                def select_mock(fields="*"):
                    query = Mock()

                    def in_mock(field, values):
                        result = Mock()
                        # Return mock profiles
                        profiles = [{
                            "id": user_id,
                            "full_name": f"User {user_id}",
                            "email_address": f"user{user_id}@example.com",
                            "avatar_url": None
                        } for user_id in values]
                        result.execute.return_value.data = profiles
                        return result

                    query.in_ = in_mock
                    return query

                table.select = select_mock

            return table

        mock_client.table = table_mock
        return mock_client

    def test_complete_event_creation_flow(self, mock_supabase_for_event_creation):
        """
        Test the complete flow from event creation to verification.

        Steps:
        1. Create event with valid data
        2. Verify event is created with generated ID
        3. Verify creator is added as participant
        4. Verify event can be retrieved
        """
        # Arrange
        coordinator_id = "user-123"

        with patch('app.services.events.get_supabase', return_value=mock_supabase_for_event_creation):
            with patch('app.services.events.create_client', return_value=mock_supabase_for_event_creation):
                service = EventsService()

                event_data = {
                    "uid": "test-event-uid-12345",
                    "name": "Team Standup",
                    "description": "Weekly team standup meeting",
                    "coordinator_id": coordinator_id,
                    "duration_minutes": 30,
                    "earliest_date": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
                    "latest_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
                    "earliest_hour": "09:00:00",
                    "latest_hour": "17:00:00",
                    "status": "planning"
                }

                # Act - Create event
                created_event = service.create_event(event_data)

                # Assert - Event was created
                assert created_event is not None
                assert created_event["id"].startswith("event-")
                assert created_event["name"] == "Team Standup"
                assert created_event["coordinator_id"] == coordinator_id
                assert created_event["uid"] == "test-event-uid-12345"
                assert "created_at" in created_event
                assert "updated_at" in created_event

                # Act - Add creator as participant
                participant = service.add_participant(created_event["id"], coordinator_id, "accepted")

                # Assert - Participant was added
                assert participant is not None
                assert participant["event_id"] == created_event["id"]
                assert participant["user_id"] == coordinator_id
                assert participant["status"] == "accepted"

                # Act - Retrieve event
                retrieved_event = service.get_event(created_event["id"])

                # Assert - Event can be retrieved
                assert retrieved_event is not None
                assert retrieved_event["id"] == created_event["id"]
                assert retrieved_event["name"] == "Team Standup"

    def test_event_creation_with_invalid_data_fails(self, mock_supabase_for_event_creation):
        """Test that event creation fails with invalid data."""
        # Arrange
        with patch('app.services.events.get_supabase', return_value=mock_supabase_for_event_creation):
            with patch('app.services.events.create_client', return_value=mock_supabase_for_event_creation):
                service = EventsService()

                # Missing required fields
                invalid_event_data = {
                    "name": "Incomplete Event",
                    # Missing coordinator_id and duration_minutes
                }

                # Act & Assert
                result = service.create_event(invalid_event_data)
                assert result is None

    def test_event_creation_with_invalid_duration_fails(self, mock_supabase_for_event_creation):
        """Test that event creation fails with invalid duration."""
        # Arrange
        with patch('app.services.events.get_supabase', return_value=mock_supabase_for_event_creation):
            with patch('app.services.events.create_client', return_value=mock_supabase_for_event_creation):
                service = EventsService()

                event_data = {
                    "uid": "test-event-uid",
                    "name": "Invalid Duration Event",
                    "coordinator_id": "user-123",
                    "duration_minutes": -30,  # Invalid: negative duration
                }

                # Act & Assert
                result = service.create_event(event_data)
                assert result is None

                # Test duration > 24 hours
                event_data["duration_minutes"] = 1500  # 25 hours
                result = service.create_event(event_data)
                assert result is None

    def test_event_creation_with_invalid_date_range_fails(self, mock_supabase_for_event_creation):
        """Test that event creation fails when earliest_date > latest_date."""
        # Arrange
        with patch('app.services.events.get_supabase', return_value=mock_supabase_for_event_creation):
            with patch('app.services.events.create_client', return_value=mock_supabase_for_event_creation):
                service = EventsService()

                event_data = {
                    "uid": "test-event-uid",
                    "name": "Invalid Date Range Event",
                    "coordinator_id": "user-123",
                    "duration_minutes": 60,
                    "earliest_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
                    "latest_date": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),  # Before earliest
                }

                # Act & Assert
                result = service.create_event(event_data)
                assert result is None

    def test_duplicate_participant_addition_returns_existing(self, mock_supabase_for_event_creation):
        """Test that adding the same participant twice returns existing participant."""
        # Arrange
        coordinator_id = "user-123"

        with patch('app.services.events.get_supabase', return_value=mock_supabase_for_event_creation):
            with patch('app.services.events.create_client', return_value=mock_supabase_for_event_creation):
                service = EventsService()

                event_data = {
                    "uid": "test-event-uid",
                    "name": "Test Event",
                    "coordinator_id": coordinator_id,
                    "duration_minutes": 60,
                }

                # Act - Create event and add participant twice
                event = service.create_event(event_data)
                first_add = service.add_participant(event["id"], coordinator_id, "accepted")
                second_add = service.add_participant(event["id"], coordinator_id, "accepted")

                # Assert - Second add returns existing participant
                assert first_add is not None
                assert second_add is not None
                assert first_add["id"] == second_add["id"]

    def test_get_user_events_returns_coordinator_events(self, mock_supabase_for_event_creation):
        """Test that get_user_events returns events where user is coordinator."""
        # Arrange
        coordinator_id = "user-123"

        with patch('app.services.events.get_supabase', return_value=mock_supabase_for_event_creation):
            with patch('app.services.events.create_client', return_value=mock_supabase_for_event_creation):
                service = EventsService()

                # Create multiple events
                event1_data = {
                    "uid": "event-1",
                    "name": "Event 1",
                    "coordinator_id": coordinator_id,
                    "duration_minutes": 60,
                }
                event2_data = {
                    "uid": "event-2",
                    "name": "Event 2",
                    "coordinator_id": coordinator_id,
                    "duration_minutes": 30,
                }

                event1 = service.create_event(event1_data)
                event2 = service.create_event(event2_data)

                # Act - Get user events
                user_events = service.get_user_events(coordinator_id)

                # Assert - Both events returned with coordinator role
                assert len(user_events) == 2
                assert all(e["role"] == "coordinator" for e in user_events)
                assert any(e["name"] == "Event 1" for e in user_events)
                assert any(e["name"] == "Event 2" for e in user_events)

    def test_event_with_participants_includes_profile_data(self, mock_supabase_for_event_creation):
        """Test that event participants include profile information."""
        # Arrange
        coordinator_id = "user-123"
        participant_id = "user-456"

        with patch('app.services.events.get_supabase', return_value=mock_supabase_for_event_creation):
            with patch('app.services.events.create_client', return_value=mock_supabase_for_event_creation):
                service = EventsService()

                # Create event
                event_data = {
                    "uid": "test-event-uid",
                    "name": "Test Event",
                    "coordinator_id": coordinator_id,
                    "duration_minutes": 60,
                }

                event = service.create_event(event_data)
                service.add_participant(event["id"], coordinator_id, "accepted")
                service.add_participant(event["id"], participant_id, "pending")

                # Act - Get participants
                participants = service.get_event_participants("test-event-uid")

                # Assert - Participants include profile data
                assert len(participants) == 2
                for participant in participants:
                    assert "name" in participant
                    assert "email" in participant
                    assert participant["name"].startswith("User ")
