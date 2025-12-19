"""
Comprehensive unit tests for EventsService.

Test coverage:
- create_event: success, validation errors, missing fields
- get_event: success, not found
- update_event: success, not found, validation
- delete_event: success, not found
- list_events: success, empty results, filtering
- add_participant: success, duplicate, invalid event
- remove_participant: success, cannot remove coordinator
- check_user_permission: coordinator, participant, unauthorized
- update_participant_status: success, invalid status
- get_event_participants: success, with profiles
- validate_event_data: valid, invalid duration, invalid dates
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from app.services.events import EventsService
from tests.fixtures.sample_events import (
    SAMPLE_EVENTS,
    SAMPLE_USERS,
    SAMPLE_EVENT_PARTICIPANTS,
    create_valid_event_data,
    create_invalid_event_data
)


# ============================================================================
# Test Fixtures
# ============================================================================

@pytest.fixture
def mock_supabase():
    """Create a mock Supabase client."""
    return Mock()


@pytest.fixture
def events_service(monkeypatch, mock_supabase):
    """Create EventsService with mocked Supabase client."""
    monkeypatch.setattr("app.services.events.get_supabase", lambda access_token=None: mock_supabase)

    # Mock environment variables for service role client
    monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")

    service = EventsService()
    service.service_role_client = mock_supabase  # Use same mock for service role
    return service


# ============================================================================
# Tests: create_event
# ============================================================================

class TestCreateEvent:
    """Tests for create_event method."""

    def test_create_event_success(self, events_service, mock_supabase):
        """Test successful event creation."""
        # Arrange
        event_data = create_valid_event_data()
        expected_event = {**event_data, "id": "event-123", "uid": "abc123def456"}

        mock_result = Mock()
        mock_result.data = [expected_event]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_result

        # Act
        result = events_service.create_event(event_data)

        # Assert
        assert result is not None
        assert result["id"] == "event-123"
        assert result["name"] == event_data["name"]
        mock_supabase.table.assert_called_with("events")

    def test_create_event_missing_name(self, events_service):
        """Test event creation fails with missing name."""
        # Arrange
        event_data = create_invalid_event_data(missing_field="name")

        # Act
        result = events_service.create_event(event_data)

        # Assert
        assert result is None

    def test_create_event_missing_coordinator(self, events_service):
        """Test event creation fails with missing coordinator_id."""
        # Arrange
        event_data = create_invalid_event_data(missing_field="coordinator_id")

        # Act
        result = events_service.create_event(event_data)

        # Assert
        assert result is None

    def test_create_event_missing_duration(self, events_service):
        """Test event creation fails with missing duration."""
        # Arrange
        event_data = create_invalid_event_data(missing_field="duration_minutes")

        # Act
        result = events_service.create_event(event_data)

        # Assert
        assert result is None

    def test_create_event_invalid_duration_zero(self, events_service):
        """Test event creation fails with zero duration."""
        # Arrange
        event_data = create_valid_event_data(duration_minutes=0)

        # Act
        result = events_service.create_event(event_data)

        # Assert
        assert result is None

    def test_create_event_invalid_duration_negative(self, events_service):
        """Test event creation fails with negative duration."""
        # Arrange
        event_data = create_valid_event_data(duration_minutes=-30)

        # Act
        result = events_service.create_event(event_data)

        # Assert
        assert result is None

    def test_create_event_invalid_duration_too_long(self, events_service):
        """Test event creation fails with duration > 24 hours."""
        # Arrange
        event_data = create_valid_event_data(duration_minutes=1500)  # > 1440

        # Act
        result = events_service.create_event(event_data)

        # Assert
        assert result is None

    def test_create_event_invalid_date_range(self, events_service):
        """Test event creation fails when earliest_date > latest_date."""
        # Arrange
        event_data = create_valid_event_data(
            earliest_date="2024-12-25",
            latest_date="2024-12-20"
        )

        # Act
        result = events_service.create_event(event_data)

        # Assert
        assert result is None

    def test_create_event_empty_name(self, events_service):
        """Test event creation fails with empty name."""
        # Arrange
        event_data = create_valid_event_data(name="")

        # Act
        result = events_service.create_event(event_data)

        # Assert
        assert result is None

    def test_create_event_database_error(self, events_service, mock_supabase):
        """Test event creation handles database errors gracefully."""
        # Arrange
        event_data = create_valid_event_data()
        mock_supabase.table.return_value.insert.return_value.execute.side_effect = Exception("DB Error")

        # Act
        result = events_service.create_event(event_data)

        # Assert
        assert result is None


# ============================================================================
# Tests: get_event
# ============================================================================

class TestGetEvent:
    """Tests for get_event method."""

    def test_get_event_success(self, events_service, mock_supabase):
        """Test successfully retrieving an event."""
        # Arrange
        event = SAMPLE_EVENTS["planning"]
        mock_result = Mock()
        mock_result.data = [event]
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_result

        # Act
        result = events_service.get_event(event["id"])

        # Assert
        assert result is not None
        assert result["id"] == event["id"]
        assert result["name"] == event["name"]

    def test_get_event_not_found(self, events_service, mock_supabase):
        """Test get_event returns None when event doesn't exist."""
        # Arrange
        mock_result = Mock()
        mock_result.data = None
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_result

        # Act
        result = events_service.get_event("nonexistent-id")

        # Assert
        assert result is None

    def test_get_event_database_error(self, events_service, mock_supabase):
        """Test get_event handles database errors gracefully."""
        # Arrange
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.side_effect = Exception("DB Error")

        # Act
        result = events_service.get_event("event-123")

        # Assert
        assert result is None


# ============================================================================
# Tests: update_event
# ============================================================================

class TestUpdateEvent:
    """Tests for update_event method."""

    def test_update_event_success(self, events_service, mock_supabase):
        """Test successfully updating an event."""
        # Arrange
        event_id = "event-123"
        update_data = {"name": "Updated Event Name"}
        updated_event = {**SAMPLE_EVENTS["planning"], **update_data}

        mock_result = Mock()
        mock_result.data = [updated_event]
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_result

        # Act
        result = events_service.update_event(event_id, update_data)

        # Assert
        assert result is not None
        assert result["name"] == "Updated Event Name"

    def test_update_event_not_found(self, events_service, mock_supabase):
        """Test update_event returns None when event doesn't exist."""
        # Arrange
        mock_result = Mock()
        mock_result.data = None
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_result

        # Act
        result = events_service.update_event("nonexistent-id", {"name": "New Name"})

        # Assert
        assert result is None

    def test_update_event_description(self, events_service, mock_supabase):
        """Test updating event description."""
        # Arrange
        event_id = "event-123"
        update_data = {"description": "New description"}
        updated_event = {**SAMPLE_EVENTS["planning"], **update_data}

        mock_result = Mock()
        mock_result.data = [updated_event]
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_result

        # Act
        result = events_service.update_event(event_id, update_data)

        # Assert
        assert result is not None
        assert result["description"] == "New description"

    def test_update_event_database_error(self, events_service, mock_supabase):
        """Test update_event handles database errors gracefully."""
        # Arrange
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.side_effect = Exception("DB Error")

        # Act
        result = events_service.update_event("event-123", {"name": "New Name"})

        # Assert
        assert result is None


# ============================================================================
# Tests: delete_event
# ============================================================================

class TestDeleteEvent:
    """Tests for delete_event method."""

    def test_delete_event_success(self, events_service, mock_supabase):
        """Test successfully deleting an event."""
        # Arrange
        mock_result = Mock()
        mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = mock_result

        # Act
        result = events_service.delete_event("event-123")

        # Assert
        assert result is True

    def test_delete_event_database_error(self, events_service, mock_supabase):
        """Test delete_event handles database errors gracefully."""
        # Arrange
        mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.side_effect = Exception("DB Error")

        # Act
        result = events_service.delete_event("event-123")

        # Assert
        assert result is False


# ============================================================================
# Tests: get_user_events
# ============================================================================

class TestGetUserEvents:
    """Tests for get_user_events method."""

    def test_get_user_events_as_coordinator(self, events_service, mock_supabase):
        """Test getting events where user is coordinator."""
        # Arrange
        user_id = SAMPLE_USERS["coordinator"]["id"]
        coordinator_events = [SAMPLE_EVENTS["planning"], SAMPLE_EVENTS["confirmed"]]

        # Mock coordinator events
        coord_result = Mock()
        coord_result.data = coordinator_events

        # Mock participant events (empty)
        part_result = Mock()
        part_result.data = []

        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.side_effect = [
            coord_result,  # Coordinator query
            part_result    # Participant query
        ]

        # Act
        result = events_service.get_user_events(user_id)

        # Assert
        assert len(result) == 2
        assert all(event["role"] == "coordinator" for event in result)

    def test_get_user_events_as_participant(self, events_service, mock_supabase):
        """Test getting events where user is participant."""
        # Arrange
        user_id = SAMPLE_USERS["participant_1"]["id"]

        # Mock coordinator events (empty)
        coord_result = Mock()
        coord_result.data = []

        # Mock participant event_ids
        part_result = Mock()
        part_result.data = [{"event_id": SAMPLE_EVENTS["planning"]["id"]}]

        # Mock participant events
        part_events_result = Mock()
        part_events_result.data = [SAMPLE_EVENTS["planning"]]

        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.side_effect = [
            coord_result,  # Coordinator query
            part_result    # Participant query
        ]
        mock_supabase.table.return_value.select.return_value.in_.return_value.execute.return_value = part_events_result

        # Act
        result = events_service.get_user_events(user_id)

        # Assert
        assert len(result) == 1
        assert result[0]["role"] == "participant"

    def test_get_user_events_no_events(self, events_service, mock_supabase):
        """Test getting events when user has none."""
        # Arrange
        coord_result = Mock()
        coord_result.data = []
        part_result = Mock()
        part_result.data = []

        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.side_effect = [
            coord_result,
            part_result
        ]

        # Act
        result = events_service.get_user_events("user-999")

        # Assert
        assert len(result) == 0

    def test_get_user_events_database_error(self, events_service, mock_supabase):
        """Test get_user_events handles database errors gracefully."""
        # Arrange
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.side_effect = Exception("DB Error")

        # Act
        result = events_service.get_user_events("user-123")

        # Assert
        assert result == []


# ============================================================================
# Tests: add_participant
# ============================================================================

class TestAddParticipant:
    """Tests for add_participant method."""

    def test_add_participant_success(self, events_service, mock_supabase):
        """Test successfully adding a participant."""
        # Arrange
        event_id = SAMPLE_EVENTS["planning"]["id"]
        user_id = SAMPLE_USERS["participant_1"]["id"]

        # Mock get_event to return event
        with patch.object(events_service, "get_event", return_value=SAMPLE_EVENTS["planning"]):
            # Mock existing participants check (empty)
            existing_result = Mock()
            existing_result.data = []

            # Mock insert
            insert_result = Mock()
            insert_result.data = [{
                "id": "participant-new",
                "event_id": event_id,
                "user_id": user_id,
                "status": "pending"
            }]

            # Create mock chain for service_role_client
            mock_table = Mock()
            mock_table.select.return_value.eq.return_value.eq.return_value.execute.return_value = existing_result
            mock_table.insert.return_value.execute.return_value = insert_result
            events_service.service_role_client.table = Mock(return_value=mock_table)

            # Act
            result = events_service.add_participant(event_id, user_id)

            # Assert
            assert result is not None
            assert result["event_id"] == event_id
            assert result["user_id"] == user_id

    def test_add_participant_duplicate(self, events_service, mock_supabase):
        """Test adding duplicate participant returns existing participant."""
        # Arrange
        event_id = SAMPLE_EVENTS["planning"]["id"]
        user_id = SAMPLE_USERS["participant_1"]["id"]
        existing_participant = SAMPLE_EVENT_PARTICIPANTS[0]

        # Mock get_event to return event
        with patch.object(events_service, "get_event", return_value=SAMPLE_EVENTS["planning"]):
            # Mock existing participants check (returns existing)
            existing_result = Mock()
            existing_result.data = [existing_participant]

            # Create mock chain for service_role_client
            mock_table = Mock()
            mock_table.select.return_value.eq.return_value.eq.return_value.execute.return_value = existing_result
            events_service.service_role_client.table = Mock(return_value=mock_table)

            # Act
            result = events_service.add_participant(event_id, user_id)

            # Assert
            assert result is not None
            assert result == existing_participant

    def test_add_participant_event_not_found(self, events_service, mock_supabase):
        """Test add_participant fails when event doesn't exist."""
        # Arrange
        # Mock get_event to return None
        get_event_result = Mock()
        get_event_result.data = None
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = get_event_result

        # Act
        result = events_service.add_participant("nonexistent-event", "user-123")

        # Assert
        assert result is None

    def test_add_participant_missing_event_id(self, events_service):
        """Test add_participant fails with missing event_id."""
        # Act
        result = events_service.add_participant("", "user-123")

        # Assert
        assert result is None

    def test_add_participant_missing_user_id(self, events_service):
        """Test add_participant fails with missing user_id."""
        # Act
        result = events_service.add_participant("event-123", "")

        # Assert
        assert result is None


# ============================================================================
# Tests: remove_participant
# ============================================================================

class TestRemoveParticipant:
    """Tests for remove_participant method."""

    def test_remove_participant_success(self, events_service, mock_supabase):
        """Test successfully removing a participant."""
        # Arrange
        event_id = SAMPLE_EVENTS["planning"]["id"]
        user_id = SAMPLE_USERS["participant_1"]["id"]
        event = SAMPLE_EVENTS["planning"]

        # Mock get_event
        get_event_result = Mock()
        get_event_result.data = [event]

        # Mock is_user_participant
        is_participant_result = Mock()
        is_participant_result.data = [{"user_id": user_id}]

        # Mock delete
        delete_result = Mock()

        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.side_effect = [
            get_event_result,
            is_participant_result
        ]
        mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = delete_result

        # Act
        result = events_service.remove_participant(event_id, user_id)

        # Assert
        assert result is True

    def test_remove_participant_cannot_remove_coordinator(self, events_service, mock_supabase):
        """Test cannot remove event coordinator."""
        # Arrange
        event = SAMPLE_EVENTS["planning"]
        event_id = event["id"]
        coordinator_id = event["coordinator_id"]

        # Mock get_event
        get_event_result = Mock()
        get_event_result.data = [event]
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = get_event_result

        # Act
        result = events_service.remove_participant(event_id, coordinator_id)

        # Assert
        assert result is False

    def test_remove_participant_event_not_found(self, events_service, mock_supabase):
        """Test remove_participant fails when event doesn't exist."""
        # Arrange
        get_event_result = Mock()
        get_event_result.data = None
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = get_event_result

        # Act
        result = events_service.remove_participant("nonexistent-event", "user-123")

        # Assert
        assert result is False

    def test_remove_participant_user_not_participant(self, events_service, mock_supabase):
        """Test remove_participant fails when user is not a participant."""
        # Arrange
        event = SAMPLE_EVENTS["planning"]

        # Mock get_event to return event
        with patch.object(events_service, "get_event", return_value=event):
            # Mock is_user_participant to return False
            with patch.object(events_service, "is_user_participant", return_value=False):
                # Act
                result = events_service.remove_participant(event["id"], "user-999")

                # Assert
                assert result is False


# ============================================================================
# Tests: check_user_permission
# ============================================================================

class TestCheckUserPermission:
    """Tests for check_user_permission method."""

    def test_coordinator_has_full_permission(self, events_service, mock_supabase):
        """Test coordinator has permission for all actions."""
        # Arrange
        event = SAMPLE_EVENTS["planning"]
        coordinator_id = event["coordinator_id"]

        get_event_result = Mock()
        get_event_result.data = [event]
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = get_event_result

        # Act & Assert
        assert events_service.check_user_permission(event["id"], coordinator_id, "view") is True
        assert events_service.check_user_permission(event["id"], coordinator_id, "edit") is True
        assert events_service.check_user_permission(event["id"], coordinator_id, "delete") is True

    def test_participant_can_view(self, events_service, mock_supabase):
        """Test participant can view event."""
        # Arrange
        event = SAMPLE_EVENTS["planning"]
        participant_id = SAMPLE_USERS["participant_1"]["id"]

        # Mock get_event
        with patch.object(events_service, "get_event", return_value=event):
            # Mock get_event_participants
            with patch.object(events_service, "get_event_participants", return_value=[{"user_id": participant_id}]):
                # Act
                result = events_service.check_user_permission(event["id"], participant_id, "view")

                # Assert
                assert result is True

    def test_participant_cannot_edit(self, events_service, mock_supabase):
        """Test participant cannot edit event."""
        # Arrange
        event = SAMPLE_EVENTS["planning"]
        participant_id = SAMPLE_USERS["participant_1"]["id"]

        # Mock get_event
        get_event_result = Mock()
        get_event_result.data = [event]
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = get_event_result

        # Act
        result = events_service.check_user_permission(event["id"], participant_id, "edit")

        # Assert
        assert result is False

    def test_participant_cannot_delete(self, events_service, mock_supabase):
        """Test participant cannot delete event."""
        # Arrange
        event = SAMPLE_EVENTS["planning"]
        participant_id = SAMPLE_USERS["participant_1"]["id"]

        # Mock get_event
        get_event_result = Mock()
        get_event_result.data = [event]
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = get_event_result

        # Act
        result = events_service.check_user_permission(event["id"], participant_id, "delete")

        # Assert
        assert result is False

    def test_non_participant_cannot_view(self, events_service, mock_supabase):
        """Test non-participant cannot view event."""
        # Arrange
        event = SAMPLE_EVENTS["planning"]

        # Mock get_event
        with patch.object(events_service, "get_event", return_value=event):
            # Mock get_event_participants (empty)
            with patch.object(events_service, "get_event_participants", return_value=[]):
                # Act
                result = events_service.check_user_permission(event["id"], "user-999", "view")

                # Assert
                assert result is False


# ============================================================================
# Tests: update_participant_status
# ============================================================================

class TestUpdateParticipantStatus:
    """Tests for update_participant_status method."""

    def test_update_status_to_accepted(self, events_service, mock_supabase):
        """Test updating participant status to accepted."""
        # Arrange
        event_id = SAMPLE_EVENTS["planning"]["id"]
        user_id = SAMPLE_USERS["participant_1"]["id"]

        mock_result = Mock()
        mock_result.data = [{
            "event_id": event_id,
            "user_id": user_id,
            "status": "accepted"
        }]

        # Create mock chain for service_role_client
        mock_table = Mock()
        mock_table.update.return_value.eq.return_value.eq.return_value.execute.return_value = mock_result
        events_service.service_role_client.table = Mock(return_value=mock_table)

        # Act
        result = events_service.update_participant_status(event_id, user_id, "accepted")

        # Assert
        assert result is not None
        assert result["status"] == "accepted"

    def test_update_status_to_declined(self, events_service, mock_supabase):
        """Test updating participant status to declined."""
        # Arrange
        event_id = SAMPLE_EVENTS["planning"]["id"]
        user_id = SAMPLE_USERS["participant_1"]["id"]

        mock_result = Mock()
        mock_result.data = [{
            "event_id": event_id,
            "user_id": user_id,
            "status": "declined"
        }]

        # Create mock chain for service_role_client
        mock_table = Mock()
        mock_table.update.return_value.eq.return_value.eq.return_value.execute.return_value = mock_result
        events_service.service_role_client.table = Mock(return_value=mock_table)

        # Act
        result = events_service.update_participant_status(event_id, user_id, "declined")

        # Assert
        assert result is not None
        assert result["status"] == "declined"

    def test_update_status_invalid(self, events_service):
        """Test updating to invalid status fails."""
        # Act
        result = events_service.update_participant_status("event-123", "user-123", "invalid-status")

        # Assert
        assert result is None

    def test_update_status_participant_not_found(self, events_service, mock_supabase):
        """Test updating status when participant doesn't exist."""
        # Arrange
        mock_result = Mock()
        mock_result.data = None
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_result

        # Act
        result = events_service.update_participant_status("event-123", "user-999", "accepted")

        # Assert
        assert result is None


# ============================================================================
# Tests: validate_event_data
# ============================================================================

class TestValidateEventData:
    """Tests for validate_event_data method."""

    def test_validate_valid_event_data(self, events_service):
        """Test validation passes for valid event data."""
        # Arrange
        event_data = create_valid_event_data()

        # Act
        result = events_service.validate_event_data(event_data)

        # Assert
        assert result is True

    def test_validate_missing_name(self, events_service):
        """Test validation fails for missing name."""
        # Arrange
        event_data = create_invalid_event_data(missing_field="name")

        # Act
        result = events_service.validate_event_data(event_data)

        # Assert
        assert result is False

    def test_validate_invalid_duration_type(self, events_service):
        """Test validation fails for non-integer duration."""
        # Arrange
        event_data = create_valid_event_data(duration_minutes="60")  # String instead of int

        # Act
        result = events_service.validate_event_data(event_data)

        # Assert
        assert result is False

    def test_validate_duration_boundary_max(self, events_service):
        """Test validation passes for max duration (1440 minutes)."""
        # Arrange
        event_data = create_valid_event_data(duration_minutes=1440)

        # Act
        result = events_service.validate_event_data(event_data)

        # Assert
        assert result is True

    def test_validate_duration_boundary_min(self, events_service):
        """Test validation passes for min duration (1 minute)."""
        # Arrange
        event_data = create_valid_event_data(duration_minutes=1)

        # Act
        result = events_service.validate_event_data(event_data)

        # Assert
        assert result is True
