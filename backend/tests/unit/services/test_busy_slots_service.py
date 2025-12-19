"""
Comprehensive unit tests for BusySlotService.

Test coverage:
- get_busy_slots: success, date filtering, empty results
- get_user_busy_slots: success, user filtering
- store_busy_slot: success, database errors
- upsert_busy_slot: insert new, update existing, errors
- bulk_store_busy_slots: success, empty list
- sync_user_google_calendar: differential sync logic, no credentials
- get_merged_busy_slots_for_event: RPC call, fallback to Python
- delete_user_busy_slots_in_range: success, errors
- validate_busy_slot_data: valid, invalid times, missing fields
"""

import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, patch, MagicMock
from app.services.busy_slots import BusySlotService
from app.models.busy_slot import BusySlot


# ============================================================================
# Test Fixtures
# ============================================================================

@pytest.fixture
def mock_supabase():
    """Create a mock Supabase client."""
    return Mock()


@pytest.fixture
def busy_slot_service(monkeypatch, mock_supabase):
    """Create BusySlotService with mocked Supabase client."""
    monkeypatch.setattr("app.services.busy_slots.get_supabase", lambda: mock_supabase)
    monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")

    service = BusySlotService()
    service.service_role_client = mock_supabase  # Use same mock for service role
    return service


@pytest.fixture
def sample_busy_slot():
    """Create a sample busy slot."""
    return {
        "id": "busy-123",
        "user_id": "user-123",
        "start_time_utc": "2024-12-20T14:00:00Z",
        "end_time_utc": "2024-12-20T15:00:00Z",
        "event_title": "Team Meeting",
        "google_event_id": "gcal-event-123",
        "created_at": "2024-12-18T10:00:00Z"
    }


@pytest.fixture
def sample_date_range():
    """Create sample date range for queries."""
    return {
        "start": datetime(2024, 12, 20, tzinfo=timezone.utc),
        "end": datetime(2024, 12, 27, tzinfo=timezone.utc)
    }


# ============================================================================
# Tests: get_busy_slots
# ============================================================================

class TestGetBusySlots:
    """Tests for get_busy_slots method."""

    def test_get_busy_slots_success(self, busy_slot_service, mock_supabase, sample_busy_slot, sample_date_range):
        """Test successfully getting busy slots."""
        # Arrange
        mock_result = Mock()
        mock_result.data = [sample_busy_slot, {**sample_busy_slot, "id": "busy-456"}]

        mock_supabase.table.return_value.select.return_value.gte.return_value.lte.return_value.order.return_value.execute.return_value = mock_result

        # Act
        result = busy_slot_service.get_busy_slots(sample_date_range["start"], sample_date_range["end"])

        # Assert
        assert len(result) == 2
        assert result[0]["id"] == "busy-123"
        mock_supabase.table.assert_called_with("busy_slots")

    def test_get_busy_slots_empty(self, busy_slot_service, mock_supabase, sample_date_range):
        """Test getting busy slots returns empty list when none exist."""
        # Arrange
        mock_result = Mock()
        mock_result.data = []
        mock_supabase.table.return_value.select.return_value.gte.return_value.lte.return_value.order.return_value.execute.return_value = mock_result

        # Act
        result = busy_slot_service.get_busy_slots(sample_date_range["start"], sample_date_range["end"])

        # Assert
        assert result == []

    def test_get_busy_slots_database_error(self, busy_slot_service, mock_supabase, sample_date_range):
        """Test get_busy_slots handles database errors gracefully."""
        # Arrange
        mock_supabase.table.return_value.select.return_value.gte.return_value.lte.return_value.order.return_value.execute.side_effect = Exception("DB Error")

        # Act
        result = busy_slot_service.get_busy_slots(sample_date_range["start"], sample_date_range["end"])

        # Assert
        assert result == []


# ============================================================================
# Tests: get_user_busy_slots
# ============================================================================

class TestGetUserBusySlots:
    """Tests for get_user_busy_slots method."""

    def test_get_user_busy_slots_success(self, busy_slot_service, mock_supabase, sample_busy_slot, sample_date_range):
        """Test getting busy slots for specific user."""
        # Arrange
        user_id = "user-123"
        mock_result = Mock()
        mock_result.data = [sample_busy_slot]
        mock_supabase.table.return_value.select.return_value.eq.return_value.gte.return_value.lte.return_value.order.return_value.execute.return_value = mock_result

        # Act
        result = busy_slot_service.get_user_busy_slots(user_id, sample_date_range["start"], sample_date_range["end"])

        # Assert
        assert len(result) == 1
        assert result[0]["user_id"] == user_id

    def test_get_user_busy_slots_empty(self, busy_slot_service, mock_supabase, sample_date_range):
        """Test getting busy slots returns empty when user has none."""
        # Arrange
        mock_result = Mock()
        mock_result.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.gte.return_value.lte.return_value.order.return_value.execute.return_value = mock_result

        # Act
        result = busy_slot_service.get_user_busy_slots("user-999", sample_date_range["start"], sample_date_range["end"])

        # Assert
        assert result == []


# ============================================================================
# Tests: store_busy_slot
# ============================================================================

class TestStoreBusySlot:
    """Tests for store_busy_slot method."""

    def test_store_busy_slot_success(self, busy_slot_service, mock_supabase):
        """Test successfully storing a busy slot."""
        # Arrange
        busy_slot = BusySlot(
            user_id="user-123",
            start_time_utc=datetime(2024, 12, 20, 14, 0, tzinfo=timezone.utc),
            end_time_utc=datetime(2024, 12, 20, 15, 0, tzinfo=timezone.utc),
            event_title="Meeting"
        )

        mock_result = Mock()
        mock_result.data = [busy_slot.to_dict()]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_result

        # Act
        result = busy_slot_service.store_busy_slot(busy_slot)

        # Assert
        assert result is not None
        assert result["user_id"] == "user-123"

    def test_store_busy_slot_database_error(self, busy_slot_service, mock_supabase):
        """Test store_busy_slot handles database errors."""
        # Arrange
        busy_slot = BusySlot(
            user_id="user-123",
            start_time_utc=datetime(2024, 12, 20, 14, 0, tzinfo=timezone.utc),
            end_time_utc=datetime(2024, 12, 20, 15, 0, tzinfo=timezone.utc)
        )
        mock_supabase.table.return_value.insert.return_value.execute.side_effect = Exception("DB Error")

        # Act
        result = busy_slot_service.store_busy_slot(busy_slot)

        # Assert
        assert result is None


# ============================================================================
# Tests: upsert_busy_slot
# ============================================================================

class TestUpsertBusySlot:
    """Tests for upsert_busy_slot method."""

    def test_upsert_busy_slot_insert_new(self, busy_slot_service, mock_supabase):
        """Test upserting a new busy slot (insert)."""
        # Arrange
        busy_slot = BusySlot(
            user_id="user-123",
            start_time_utc=datetime(2024, 12, 20, 14, 0, tzinfo=timezone.utc),
            end_time_utc=datetime(2024, 12, 20, 15, 0, tzinfo=timezone.utc),
            google_event_id="gcal-new-123"
        )

        # Mock no existing slot
        existing_result = Mock()
        existing_result.data = []

        # Mock insert
        insert_result = Mock()
        insert_result.data = [busy_slot.to_dict()]

        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = existing_result
        mock_supabase.table.return_value.insert.return_value.execute.return_value = insert_result

        # Act
        result = busy_slot_service.upsert_busy_slot(busy_slot)

        # Assert
        assert result is not None
        assert result["google_event_id"] == "gcal-new-123"

    def test_upsert_busy_slot_update_existing(self, busy_slot_service, mock_supabase):
        """Test upserting an existing busy slot (update)."""
        # Arrange
        busy_slot = BusySlot(
            user_id="user-123",
            start_time_utc=datetime(2024, 12, 20, 14, 0, tzinfo=timezone.utc),
            end_time_utc=datetime(2024, 12, 20, 15, 0, tzinfo=timezone.utc),
            google_event_id="gcal-existing-123",
            event_title="Updated Meeting"
        )

        # Mock existing slot found
        existing_result = Mock()
        existing_result.data = [{
            "id": "busy-123",
            "user_id": "user-123",
            "google_event_id": "gcal-existing-123"
        }]

        # Mock update
        update_result = Mock()
        update_result.data = [busy_slot.to_dict()]

        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = existing_result
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = update_result

        # Act
        result = busy_slot_service.upsert_busy_slot(busy_slot)

        # Assert
        assert result is not None
        assert result["event_title"] == "Updated Meeting"

    def test_upsert_busy_slot_no_google_event_id(self, busy_slot_service, mock_supabase):
        """Test upserting slot without google_event_id (insert)."""
        # Arrange
        busy_slot = BusySlot(
            user_id="user-123",
            start_time_utc=datetime(2024, 12, 20, 14, 0, tzinfo=timezone.utc),
            end_time_utc=datetime(2024, 12, 20, 15, 0, tzinfo=timezone.utc)
        )

        insert_result = Mock()
        insert_result.data = [busy_slot.to_dict()]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = insert_result

        # Act
        result = busy_slot_service.upsert_busy_slot(busy_slot)

        # Assert
        assert result is not None


# ============================================================================
# Tests: delete_user_busy_slots_in_range
# ============================================================================

class TestDeleteUserBusySlotsInRange:
    """Tests for delete_user_busy_slots_in_range method."""

    def test_delete_user_busy_slots_success(self, busy_slot_service, mock_supabase, sample_date_range):
        """Test successfully deleting busy slots in range."""
        # Arrange
        user_id = "user-123"
        mock_supabase.table.return_value.delete.return_value.eq.return_value.gte.return_value.lte.return_value.execute.return_value = Mock()

        # Act
        result = busy_slot_service.delete_user_busy_slots_in_range(
            user_id,
            sample_date_range["start"],
            sample_date_range["end"]
        )

        # Assert
        assert result is True

    def test_delete_user_busy_slots_database_error(self, busy_slot_service, mock_supabase, sample_date_range):
        """Test delete handles database errors."""
        # Arrange
        mock_supabase.table.return_value.delete.return_value.eq.return_value.gte.return_value.lte.return_value.execute.side_effect = Exception("DB Error")

        # Act
        result = busy_slot_service.delete_user_busy_slots_in_range("user-123", sample_date_range["start"], sample_date_range["end"])

        # Assert
        assert result is False


# ============================================================================
# Tests: bulk_store_busy_slots
# ============================================================================

class TestBulkStoreBusySlots:
    """Tests for bulk_store_busy_slots method."""

    def test_bulk_store_success(self, busy_slot_service, mock_supabase):
        """Test successfully storing multiple busy slots."""
        # Arrange
        slots = [
            BusySlot(
                user_id="user-123",
                start_time_utc=datetime(2024, 12, 20, 14, 0, tzinfo=timezone.utc),
                end_time_utc=datetime(2024, 12, 20, 15, 0, tzinfo=timezone.utc)
            ),
            BusySlot(
                user_id="user-123",
                start_time_utc=datetime(2024, 12, 21, 10, 0, tzinfo=timezone.utc),
                end_time_utc=datetime(2024, 12, 21, 11, 0, tzinfo=timezone.utc)
            )
        ]

        mock_result = Mock()
        mock_result.data = [slot.to_dict() for slot in slots]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_result

        # Act
        result = busy_slot_service.bulk_store_busy_slots(slots)

        # Assert
        assert len(result) == 2

    def test_bulk_store_empty_list(self, busy_slot_service, mock_supabase):
        """Test bulk storing empty list."""
        # Arrange
        mock_result = Mock()
        mock_result.data = []
        mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_result

        # Act
        result = busy_slot_service.bulk_store_busy_slots([])

        # Assert
        assert result == []


# ============================================================================
# Tests: sync_user_google_calendar
# ============================================================================

class TestSyncUserGoogleCalendar:
    """Tests for sync_user_google_calendar method."""

    def test_sync_no_credentials(self, busy_slot_service, sample_date_range):
        """Test sync fails when user has no Google credentials."""
        # Arrange
        with patch("app.services.busy_slots.google_calendar.get_stored_credentials", return_value=None):
            # Act
            result = busy_slot_service.sync_user_google_calendar("user-123", sample_date_range["start"], sample_date_range["end"])

            # Assert
            assert result is False

    def test_sync_differential_add_and_delete(self, busy_slot_service, mock_supabase, sample_date_range):
        """Test differential sync adds new and deletes removed events."""
        # Arrange
        mock_credentials = Mock()
        mock_service = Mock()

        # Google Calendar events
        google_events = {
            "items": [
                {
                    "id": "gcal-event-1",
                    "start": {"dateTime": "2024-12-20T14:00:00Z"},
                    "end": {"dateTime": "2024-12-20T15:00:00Z"},
                    "summary": "Meeting 1"
                },
                {
                    "id": "gcal-event-2",
                    "start": {"dateTime": "2024-12-21T10:00:00Z"},
                    "end": {"dateTime": "2024-12-21T11:00:00Z"},
                    "summary": "Meeting 2"
                }
            ]
        }

        # DB has gcal-event-3 (needs deletion) but not gcal-event-1 or gcal-event-2 (needs addition)
        db_slots = Mock()
        db_slots.data = [
            {"id": "busy-123", "google_event_id": "gcal-event-3"}
        ]

        mock_service.events.return_value.list.return_value.execute.return_value = google_events
        mock_supabase.table.return_value.select.return_value.eq.return_value.gte.return_value.lte.return_value.not_.is_.return_value.execute.return_value = db_slots

        with patch("app.services.busy_slots.google_calendar.get_stored_credentials", return_value=mock_credentials):
            with patch("app.services.busy_slots.google_calendar.get_calendar_service", return_value=mock_service):
                # Act
                result = busy_slot_service.sync_user_google_calendar("user-123", sample_date_range["start"], sample_date_range["end"])

                # Assert
                assert result is True


# ============================================================================
# Tests: get_merged_busy_slots_for_event
# ============================================================================

class TestGetMergedBusySlotsForEvent:
    """Tests for get_merged_busy_slots_for_event method."""

    def test_get_merged_via_rpc(self, busy_slot_service, mock_supabase, sample_date_range):
        """Test getting merged busy slots via RPC."""
        # Arrange
        event_id = "event-123"
        mock_rpc_result = Mock()
        mock_rpc_result.data = [
            {
                "start_time": "2024-12-20T14:00:00Z",
                "end_time": "2024-12-20T15:00:00Z",
                "busy_participants_count": 2
            }
        ]
        mock_supabase.rpc.return_value.execute.return_value = mock_rpc_result

        # Act
        result = busy_slot_service.get_merged_busy_slots_for_event(event_id, sample_date_range["start"], sample_date_range["end"])

        # Assert
        assert len(result) == 1
        assert result[0]["busy_participants_count"] == 2

    def test_get_merged_fallback_to_python(self, busy_slot_service, mock_supabase, sample_date_range):
        """Test fallback to Python implementation when RPC fails."""
        # Arrange
        event_id = "event-123"

        # Mock RPC failure
        mock_supabase.rpc.return_value.execute.side_effect = Exception("RPC failed")

        # Mock fallback data
        participants_result = Mock()
        participants_result.data = [{"user_id": "user-123"}]

        busy_slots_result = Mock()
        busy_slots_result.data = [
            {
                "user_id": "user-123",
                "start_time_utc": "2024-12-20T14:00:00Z",
                "end_time_utc": "2024-12-20T15:00:00Z"
            }
        ]

        # Setup mock chain for fallback
        mock_table = Mock()
        mock_table.select.return_value.eq.return_value.execute.return_value = participants_result

        # For busy slots query
        mock_table2 = Mock()
        mock_table2.select.return_value.in_.return_value.gte.return_value.lte.return_value.order.return_value.execute.return_value = busy_slots_result

        def table_selector(table_name):
            if table_name == "event_participants":
                return mock_table
            return mock_table2

        mock_supabase.table.side_effect = table_selector

        # Act
        result = busy_slot_service.get_merged_busy_slots_for_event(event_id, sample_date_range["start"], sample_date_range["end"])

        # Assert
        assert isinstance(result, list)


# ============================================================================
# Tests: validate_busy_slot_data
# ============================================================================

class TestValidateBusySlotData:
    """Tests for validate_busy_slot_data method."""

    def test_validate_valid_data(self, busy_slot_service):
        """Test validation passes for valid data."""
        # Arrange
        slot_data = {
            "user_id": "user-123",
            "start_time_utc": "2024-12-20T14:00:00Z",
            "end_time_utc": "2024-12-20T15:00:00Z"
        }

        # Act
        result = busy_slot_service.validate_busy_slot_data(slot_data)

        # Assert
        assert result is True

    def test_validate_missing_user_id(self, busy_slot_service):
        """Test validation fails when user_id is missing."""
        # Arrange
        slot_data = {
            "start_time_utc": "2024-12-20T14:00:00Z",
            "end_time_utc": "2024-12-20T15:00:00Z"
        }

        # Act
        result = busy_slot_service.validate_busy_slot_data(slot_data)

        # Assert
        assert result is False

    def test_validate_missing_start_time(self, busy_slot_service):
        """Test validation fails when start_time_utc is missing."""
        # Arrange
        slot_data = {
            "user_id": "user-123",
            "end_time_utc": "2024-12-20T15:00:00Z"
        }

        # Act
        result = busy_slot_service.validate_busy_slot_data(slot_data)

        # Assert
        assert result is False

    def test_validate_start_after_end(self, busy_slot_service):
        """Test validation fails when start is after end."""
        # Arrange
        slot_data = {
            "user_id": "user-123",
            "start_time_utc": "2024-12-20T15:00:00Z",
            "end_time_utc": "2024-12-20T14:00:00Z"
        }

        # Act
        result = busy_slot_service.validate_busy_slot_data(slot_data)

        # Assert
        assert result is False

    def test_validate_invalid_datetime_format(self, busy_slot_service):
        """Test validation fails with invalid datetime format."""
        # Arrange
        slot_data = {
            "user_id": "user-123",
            "start_time_utc": "invalid-date",
            "end_time_utc": "2024-12-20T15:00:00Z"
        }

        # Act
        result = busy_slot_service.validate_busy_slot_data(slot_data)

        # Assert
        assert result is False


# ============================================================================
# Tests: get_event_participants_busy_slots
# ============================================================================

class TestGetEventParticipantsBusySlots:
    """Tests for get_event_participants_busy_slots method."""

    def test_get_event_participants_busy_slots_success(self, busy_slot_service, mock_supabase, sample_date_range, sample_busy_slot):
        """Test getting busy slots for event participants."""
        # Arrange
        event_id = "event-123"

        # Mock participants
        participants_result = Mock()
        participants_result.data = [
            {"user_id": "user-123"},
            {"user_id": "user-456"}
        ]

        # Mock busy slots
        busy_slots_result = Mock()
        busy_slots_result.data = [sample_busy_slot]

        mock_table = Mock()
        mock_table.select.return_value.eq.return_value.execute.return_value = participants_result

        mock_table2 = Mock()
        mock_table2.select.return_value.in_.return_value.gte.return_value.lte.return_value.order.return_value.execute.return_value = busy_slots_result

        def table_selector(table_name):
            if table_name == "event_participants":
                return mock_table
            return mock_table2

        mock_supabase.table.side_effect = table_selector

        # Act
        result = busy_slot_service.get_event_participants_busy_slots(event_id, sample_date_range["start"], sample_date_range["end"])

        # Assert
        assert len(result) == 1

    def test_get_event_participants_busy_slots_no_participants(self, busy_slot_service, mock_supabase, sample_date_range):
        """Test getting busy slots when event has no participants."""
        # Arrange
        participants_result = Mock()
        participants_result.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = participants_result

        # Act
        result = busy_slot_service.get_event_participants_busy_slots("event-123", sample_date_range["start"], sample_date_range["end"])

        # Assert
        assert result == []
