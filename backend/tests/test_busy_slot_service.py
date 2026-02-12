"""
Legacy BusySlotService tests (old import location) are skipped after refactor.
Use tests/services/test_busy_slots_service.py under new service paths instead.
"""

import pytest

pytest.skip("Skipping legacy busy slot service tests", allow_module_level=True)


@pytest.fixture
def mock_supabase():
    """Mock Supabase client for testing."""
    mock_client = Mock()
    mock_table = Mock()
    mock_client.table.return_value = mock_table
    return mock_client, mock_table


@pytest.fixture
def busy_slot_service(mock_supabase):
    """Create BusySlotService with mocked Supabase client."""
    mock_client, mock_table = mock_supabase
    with patch("app.services.busy_slot_service.get_supabase", return_value=mock_client):
        service = BusySlotService()
        service.supabase = mock_client
        return service, mock_table


@pytest.fixture
def sample_busy_slot():
    """Create a sample BusySlot for testing."""
    return BusySlot(
        id="test-id-1",
        user_id="user-123",
        start_time_utc=datetime(2025, 10, 1, 10, 0),
        end_time_utc=datetime(2025, 10, 1, 12, 0),
        provider_event_id="google-event-123",
    )


@pytest.fixture
def sample_busy_slot_data():
    """Sample busy slot data as returned from Supabase."""
    return [
        {
            "id": "test-id-1",
            "user_id": "user-123",
            "start_time_utc": "2025-10-01T10:00:00",
            "end_time_utc": "2025-10-01T12:00:00",
            "provider_event_id": "google-event-123",
        },
        {
            "id": "test-id-2",
            "user_id": "user-123",
            "start_time_utc": "2025-10-01T14:00:00",
            "end_time_utc": "2025-10-01T15:00:00",
            "provider_event_id": "google-event-456",
        }
    ]


class TestBusySlotService:
    """Test cases for BusySlotService."""

    def test_get_user_busy_slots_success(self, busy_slot_service, sample_busy_slot_data):
        """Test successfully getting busy slots for a user."""
        service, mock_table = busy_slot_service
        
        # Mock the Supabase query chain
        mock_result = Mock()
        mock_result.data = sample_busy_slot_data
        
        mock_table.select.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.gte.return_value = mock_table
        mock_table.lte.return_value = mock_table
        mock_table.order.return_value = mock_table
        mock_table.execute.return_value = mock_result
        
        start_date = datetime(2025, 10, 1)
        end_date = datetime(2025, 10, 2)
        
        result = service.get_user_busy_slots("user-123", start_date, end_date)
        
        assert len(result) == 2
        assert result[0]["user_id"] == "user-123"
        assert result[0]["start_time_utc"] == "2025-10-01T10:00:00"
        assert result[1]["provider_event_id"] == "google-event-456"
        
        # Verify the query was built correctly
        mock_table.select.assert_called_once_with("*")
        mock_table.eq.assert_called_with("user_id", "user-123")
        mock_table.gte.assert_called_with("start_time_utc", start_date.isoformat())
        mock_table.lte.assert_called_with("end_time_utc", end_date.isoformat())
        mock_table.order.assert_called_with("start_time_utc")

    def test_get_user_busy_slots_error(self, busy_slot_service):
        """Test error handling when getting user busy slots fails."""
        service, mock_table = busy_slot_service
        
        # Mock an exception
        mock_table.select.side_effect = Exception("Database error")
        
        start_date = datetime(2025, 10, 1)
        end_date = datetime(2025, 10, 2)
        
        result = service.get_user_busy_slots("user-123", start_date, end_date)
        
        assert result == []

    def test_get_participants_busy_slots_success(self, busy_slot_service, sample_busy_slot_data):
        """Test successfully getting busy slots for multiple participants."""
        service, mock_table = busy_slot_service
        
        # Mock the Supabase query chain
        mock_result = Mock()
        mock_result.data = sample_busy_slot_data
        
        mock_table.select.return_value = mock_table
        mock_table.in_.return_value = mock_table
        mock_table.gte.return_value = mock_table
        mock_table.lte.return_value = mock_table
        mock_table.order.return_value = mock_table
        mock_table.execute.return_value = mock_result
        
        participant_ids = ["user-123", "user-456"]
        start_date = datetime(2025, 10, 1)
        end_date = datetime(2025, 10, 2)
        
        result = service.get_participants_busy_slots(participant_ids, start_date, end_date)
        
        assert len(result) == 2
        mock_table.select.assert_called_once_with("*, profile:user_id(*)")
        mock_table.in_.assert_called_with("user_id", participant_ids)

    def test_store_busy_slot_success(self, busy_slot_service, sample_busy_slot):
        """Test successfully storing a busy slot."""
        service, mock_table = busy_slot_service
        
        mock_result = Mock()
        mock_result.data = [{"id": "test-id-1", "user_id": "user-123"}]
        
        mock_table.insert.return_value = mock_table
        mock_table.execute.return_value = mock_result
        
        result = service.store_busy_slot(sample_busy_slot)
        
        assert result["id"] == "test-id-1"
        mock_table.insert.assert_called_once_with(sample_busy_slot.to_dict())

    def test_store_busy_slot_error(self, busy_slot_service, sample_busy_slot):
        """Test error handling when storing a busy slot fails."""
        service, mock_table = busy_slot_service
        
        mock_table.insert.side_effect = Exception("Insert failed")
        
        result = service.store_busy_slot(sample_busy_slot)
        
        assert result is None

    def test_delete_user_busy_slots_in_range_success(self, busy_slot_service):
        """Test successfully deleting busy slots in a range."""
        service, mock_table = busy_slot_service
        
        mock_table.delete.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.gte.return_value = mock_table
        mock_table.lte.return_value = mock_table
        mock_table.execute.return_value = Mock()
        
        start_date = datetime(2025, 10, 1)
        end_date = datetime(2025, 10, 2)
        
        result = service.delete_user_busy_slots_in_range("user-123", start_date, end_date)
        
        assert result is True
        mock_table.delete.assert_called_once()
        mock_table.eq.assert_called_with("user_id", "user-123")

    def test_delete_user_busy_slots_in_range_error(self, busy_slot_service):
        """Test error handling when deleting busy slots fails."""
        service, mock_table = busy_slot_service
        
        mock_table.delete.side_effect = Exception("Delete failed")
        
        start_date = datetime(2025, 10, 1)
        end_date = datetime(2025, 10, 2)
        
        result = service.delete_user_busy_slots_in_range("user-123", start_date, end_date)
        
        assert result is False

    def test_upsert_busy_slot_update_existing(self, busy_slot_service, sample_busy_slot):
        """Test upserting a busy slot when it already exists (update case)."""
        service, mock_table = busy_slot_service
        
        # Mock finding existing slot
        existing_result = Mock()
        existing_result.data = [{"id": "existing-id", "user_id": "user-123"}]
        
        # Mock update result
        update_result = Mock()
        update_result.data = [{"id": "existing-id", "user_id": "user-123", "updated": True}]
        
        mock_table.select.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.execute.side_effect = [existing_result, update_result]
        mock_table.update.return_value = mock_table
        
        result = service.upsert_busy_slot(sample_busy_slot)
        
        assert result["updated"] is True
        mock_table.update.assert_called_once()

    def test_upsert_busy_slot_insert_new(self, busy_slot_service, sample_busy_slot):
        """Test upserting a busy slot when it doesn't exist (insert case)."""
        service, mock_table = busy_slot_service
        
        # Mock no existing slot found
        existing_result = Mock()
        existing_result.data = []
        
        # Mock insert result
        insert_result = Mock()
        insert_result.data = [{"id": "new-id", "user_id": "user-123"}]
        
        mock_table.select.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.execute.side_effect = [existing_result, insert_result]
        mock_table.insert.return_value = mock_table
        
        result = service.upsert_busy_slot(sample_busy_slot)
        
        assert result["id"] == "new-id"
        mock_table.insert.assert_called_once()

    def test_calculate_free_slots_no_participants(self, busy_slot_service):
        """Test calculating free slots with no participants."""
        service, mock_table = busy_slot_service
        
        start_date = datetime(2025, 10, 1)
        end_date = datetime(2025, 10, 2)
        
        result = service.calculate_free_slots([], start_date, end_date, 60, 9, 17)
        
        assert result == []

    def test_calculate_free_slots_with_busy_participants(self, busy_slot_service):
        """Test calculating free slots with busy participants."""
        service, mock_table = busy_slot_service
        
        # Mock busy slots data - use format without 'Z' to match service expectations
        busy_slots_data = [
            {
                "user_id": "user-1",
                "start_time_utc": "2025-10-01T10:00:00+00:00",
                "end_time_utc": "2025-10-01T12:00:00+00:00"
            },
            {
                "user_id": "user-2", 
                "start_time_utc": "2025-10-01T14:00:00+00:00",
                "end_time_utc": "2025-10-01T15:00:00+00:00"
            }
        ]
        
        mock_result = Mock()
        mock_result.data = busy_slots_data
        
        mock_table.select.return_value = mock_table
        mock_table.in_.return_value = mock_table
        mock_table.gte.return_value = mock_table
        mock_table.lte.return_value = mock_table
        mock_table.order.return_value = mock_table
        mock_table.execute.return_value = mock_result
        
        participant_ids = ["user-1", "user-2"]
        start_date = datetime(2025, 10, 1)
        end_date = datetime(2025, 10, 1)
        
        result = service.calculate_free_slots(participant_ids, start_date, end_date, 60, 9, 17)
        
        # Should find free slots: 9-10, 12-14, 15-17
        assert len(result) == 3
        
        # Check first free slot (9-10)
        assert result[0]["start_time_utc"] == "2025-10-01T09:00:00+00:00"
        assert result[0]["end_time_utc"] == "2025-10-01T10:00:00+00:00"
        assert result[0]["duration_minutes"] == 60
        
        # Check second free slot (12-14)
        assert result[1]["start_time_utc"] == "2025-10-01T12:00:00+00:00"
        assert result[1]["end_time_utc"] == "2025-10-01T14:00:00+00:00"
        assert result[1]["duration_minutes"] == 120

    def test_calculate_free_slots_no_busy_slots(self, busy_slot_service):
        """Test calculating free slots when no one is busy."""
        service, mock_table = busy_slot_service
        
        # Mock empty busy slots
        mock_result = Mock()
        mock_result.data = []
        
        mock_table.select.return_value = mock_table
        mock_table.in_.return_value = mock_table
        mock_table.gte.return_value = mock_table
        mock_table.lte.return_value = mock_table
        mock_table.order.return_value = mock_table
        mock_table.execute.return_value = mock_result
        
        participant_ids = ["user-1", "user-2"]
        start_date = datetime(2025, 10, 1)
        end_date = datetime(2025, 10, 1)
        
        result = service.calculate_free_slots(participant_ids, start_date, end_date, 60, 9, 17)
        
        # Should find one free slot for the entire day
        assert len(result) == 1
        assert result[0]["start_time_utc"] == "2025-10-01T09:00:00+00:00"
        assert result[0]["end_time_utc"] == "2025-10-01T17:00:00+00:00"
        assert result[0]["duration_minutes"] == 480  # 8 hours

    def test_merge_intervals_overlapping(self, busy_slot_service):
        """Test merging overlapping time intervals."""
        service, mock_table = busy_slot_service
        
        intervals = [
            (datetime(2025, 10, 1, 10, 0), datetime(2025, 10, 1, 12, 0)),
            (datetime(2025, 10, 1, 11, 0), datetime(2025, 10, 1, 13, 0)),
            (datetime(2025, 10, 1, 15, 0), datetime(2025, 10, 1, 16, 0))
        ]
        
        result = service._merge_intervals(intervals)
        
        # Should merge first two intervals, keep third separate
        assert len(result) == 2
        assert result[0] == (datetime(2025, 10, 1, 10, 0), datetime(2025, 10, 1, 13, 0))
        assert result[1] == (datetime(2025, 10, 1, 15, 0), datetime(2025, 10, 1, 16, 0))

    def test_merge_intervals_non_overlapping(self, busy_slot_service):
        """Test merging non-overlapping time intervals."""
        service, mock_table = busy_slot_service
        
        intervals = [
            (datetime(2025, 10, 1, 10, 0), datetime(2025, 10, 1, 11, 0)),
            (datetime(2025, 10, 1, 12, 0), datetime(2025, 10, 1, 13, 0)),
            (datetime(2025, 10, 1, 15, 0), datetime(2025, 10, 1, 16, 0))
        ]
        
        result = service._merge_intervals(intervals)
        
        # Should keep all intervals separate
        assert len(result) == 3
        assert result == intervals

    def test_merge_intervals_empty(self, busy_slot_service):
        """Test merging empty interval list."""
        service, mock_table = busy_slot_service
        
        result = service._merge_intervals([])
        
        assert result == []

    def test_find_free_slots_for_day_with_minimum_duration(self, busy_slot_service):
        """Test finding free slots for a day with minimum duration requirement."""
        service, mock_table = busy_slot_service
        
        day_start = datetime(2025, 10, 1, 9, 0)
        day_end = datetime(2025, 10, 1, 17, 0)
        
        user_busy_slots = {
            "user-1": [
                {"start": datetime(2025, 10, 1, 10, 0), "end": datetime(2025, 10, 1, 10, 30)}
            ]
        }
        
        participant_ids = ["user-1"]
        meeting_duration_minutes = 60
        
        result = service._find_free_slots_for_day(
            day_start, day_end, user_busy_slots, participant_ids, meeting_duration_minutes
        )
        
        # Should find two slots: 9-10 (60 min) and 10:30-17 (390 min)
        assert len(result) == 2
        assert result[0]["duration_minutes"] == 60
        assert result[1]["duration_minutes"] == 390

    def test_find_free_slots_for_day_insufficient_duration(self, busy_slot_service):
        """Test finding free slots when gaps are too small."""
        service, mock_table = busy_slot_service
        
        day_start = datetime(2025, 10, 1, 9, 0)
        day_end = datetime(2025, 10, 1, 17, 0)
        
        user_busy_slots = {
            "user-1": [
                {"start": datetime(2025, 10, 1, 9, 0), "end": datetime(2025, 10, 1, 16, 30)}
            ]
        }
        
        participant_ids = ["user-1"]
        meeting_duration_minutes = 60  # Need 60 minutes but only 30 available
        
        result = service._find_free_slots_for_day(
            day_start, day_end, user_busy_slots, participant_ids, meeting_duration_minutes
        )
        
        # Should find no slots since remaining 30 minutes is less than required 60
        assert len(result) == 0