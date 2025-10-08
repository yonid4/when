"""
Legacy BusySlotService tests (old services_simple path) are skipped after refactor.
"""

import pytest

pytest.skip("Skipping legacy services_simple busy slots tests", allow_module_level=True)


@pytest.fixture
def mock_supabase():
    """Mock Supabase client for testing."""
    mock_client = Mock()
    mock_table = Mock()
    mock_rpc = Mock()
    
    mock_client.table.return_value = mock_table
    mock_client.rpc.return_value = mock_rpc
    
    return mock_client, mock_table, mock_rpc


@pytest.fixture
def busy_slot_service(mock_supabase):
    """Create BusySlotService with mocked Supabase client."""
    mock_client, mock_table, mock_rpc = mock_supabase
    with patch("app.services_simple.busy_slots.get_supabase", return_value=mock_client):
        service = BusySlotService()
        service.supabase = mock_client
        return service, mock_table, mock_rpc


@pytest.fixture
def sample_busy_slot():
    """Create a sample BusySlot for testing."""
    return BusySlot(
        user_id="user-123",
        start_time_utc=datetime(2024, 1, 1, 9, 0, 0),
        end_time_utc=datetime(2024, 1, 1, 10, 0, 0),
        google_event_id="google-event-123",
        event_title="Test Meeting"
    )


@pytest.fixture
def sample_busy_slots_data():
    """Sample busy slots data for testing."""
    return [
        {
            "id": "slot-1",
            "user_id": "user-1",
            "start_time_utc": "2024-01-01T09:00:00Z",
            "end_time_utc": "2024-01-01T10:00:00Z",
            "event_title": "Meeting 1"
        },
        {
            "id": "slot-2", 
            "user_id": "user-2",
            "start_time_utc": "2024-01-01T09:30:00Z",
            "end_time_utc": "2024-01-01T10:30:00Z",
            "event_title": "Meeting 2"
        }
    ]


class TestBusySlotServiceBasicOperations:
    """Test basic CRUD operations."""

    def test_get_user_busy_slots_success(self, busy_slot_service, sample_busy_slots_data):
        """Test successful retrieval of user busy slots."""
        service, mock_table, _ = busy_slot_service
        
        # Mock the query chain
        mock_execute = Mock()
        mock_execute.execute.return_value.data = sample_busy_slots_data
        mock_table.select.return_value.eq.return_value.gte.return_value.lte.return_value.order.return_value = mock_execute
        
        start_date = datetime(2024, 1, 1)
        end_date = datetime(2024, 1, 2)
        
        result = service.get_user_busy_slots("user-1", start_date, end_date)
        
        assert result == sample_busy_slots_data
        mock_table.select.assert_called_once_with("*")

    def test_get_user_busy_slots_error(self, busy_slot_service):
        """Test error handling in get_user_busy_slots."""
        service, mock_table, _ = busy_slot_service
        
        # Mock an exception
        mock_table.select.side_effect = Exception("Database error")
        
        start_date = datetime(2024, 1, 1)
        end_date = datetime(2024, 1, 2)
        
        result = service.get_user_busy_slots("user-1", start_date, end_date)
        
        assert result == []

    def test_get_busy_slots_success(self, busy_slot_service, sample_busy_slots_data):
        """Test successful retrieval of all busy slots."""
        service, mock_table, _ = busy_slot_service
        
        # Mock the query chain
        mock_execute = Mock()
        mock_execute.execute.return_value.data = sample_busy_slots_data
        mock_table.select.return_value.gte.return_value.lte.return_value.order.return_value = mock_execute
        
        start_date = datetime(2024, 1, 1)
        end_date = datetime(2024, 1, 2)
        
        result = service.get_busy_slots(start_date, end_date)
        
        assert result == sample_busy_slots_data

    def test_store_busy_slot_success(self, busy_slot_service, sample_busy_slot):
        """Test successful storage of a busy slot."""
        service, mock_table, _ = busy_slot_service
        
        expected_result = {"id": "new-slot-id", "user_id": "user-123"}
        
        # Mock the insert chain
        mock_execute = Mock()
        mock_execute.execute.return_value.data = [expected_result]
        mock_table.insert.return_value = mock_execute
        
        result = service.store_busy_slot(sample_busy_slot)
        
        assert result == expected_result
        mock_table.insert.assert_called_once_with(sample_busy_slot.to_dict())

    def test_store_busy_slot_error(self, busy_slot_service, sample_busy_slot):
        """Test error handling in store_busy_slot."""
        service, mock_table, _ = busy_slot_service
        
        # Mock an exception
        mock_table.insert.side_effect = Exception("Insert error")
        
        result = service.store_busy_slot(sample_busy_slot)
        
        assert result is None


class TestBusySlotServiceAdvancedOperations:
    """Test advanced operations like upsert and bulk operations."""

    def test_upsert_busy_slot_update_existing(self, busy_slot_service, sample_busy_slot):
        """Test upsert when slot already exists."""
        service, mock_table, _ = busy_slot_service
        
        # Mock existing slot found
        existing_data = [{"id": "existing-id", "user_id": "user-123"}]
        mock_select_execute = Mock()
        mock_select_execute.execute.return_value.data = existing_data
        mock_table.select.return_value.eq.return_value.eq.return_value = mock_select_execute
        
        # Mock update
        updated_data = [{"id": "existing-id", "user_id": "user-123", "updated": True}]
        mock_update_execute = Mock()
        mock_update_execute.execute.return_value.data = updated_data
        mock_table.update.return_value.eq.return_value = mock_update_execute
        
        result = service.upsert_busy_slot(sample_busy_slot)
        
        assert result == updated_data[0]
        mock_table.update.assert_called_once()

    def test_upsert_busy_slot_insert_new(self, busy_slot_service, sample_busy_slot):
        """Test upsert when slot doesn't exist."""
        service, mock_table, _ = busy_slot_service
        
        # Mock no existing slot found
        mock_select_execute = Mock()
        mock_select_execute.execute.return_value.data = []
        mock_table.select.return_value.eq.return_value.eq.return_value = mock_select_execute
        
        # Mock insert (store_busy_slot)
        new_data = [{"id": "new-id", "user_id": "user-123"}]
        mock_insert_execute = Mock()
        mock_insert_execute.execute.return_value.data = new_data
        mock_table.insert.return_value = mock_insert_execute
        
        result = service.upsert_busy_slot(sample_busy_slot)
        
        assert result == new_data[0]
        mock_table.insert.assert_called_once()

    def test_bulk_store_busy_slots_success(self, busy_slot_service):
        """Test successful bulk storage of busy slots."""
        service, mock_table, _ = busy_slot_service
        
        # Create multiple busy slots
        busy_slots = [
            BusySlot(
                user_id=f"user-{i}",
                start_time_utc=datetime(2024, 1, 1, 9 + i, 0, 0),
                end_time_utc=datetime(2024, 1, 1, 10 + i, 0, 0)
            )
            for i in range(3)
        ]
        
        expected_result = [{"id": f"slot-{i}"} for i in range(3)]
        
        # Mock bulk insert
        mock_execute = Mock()
        mock_execute.execute.return_value.data = expected_result
        mock_table.insert.return_value = mock_execute
        
        result = service.bulk_store_busy_slots(busy_slots)
        
        assert result == expected_result
        mock_table.insert.assert_called_once()

    def test_delete_user_busy_slots_in_range_success(self, busy_slot_service):
        """Test successful deletion of user busy slots in range."""
        service, mock_table, _ = busy_slot_service
        
        # Mock delete chain
        mock_execute = Mock()
        mock_execute.execute.return_value = Mock()
        mock_table.delete.return_value.eq.return_value.gte.return_value.lte.return_value = mock_execute
        
        start_date = datetime(2024, 1, 1)
        end_date = datetime(2024, 1, 2)
        
        result = service.delete_user_busy_slots_in_range("user-123", start_date, end_date)
        
        assert result is True
        mock_table.delete.assert_called_once()


class TestBusySlotServiceParticipantOperations:
    """Test participant-related operations."""

    def test_get_participants_busy_slots_success(self, busy_slot_service, sample_busy_slots_data):
        """Test successful retrieval of participants' busy slots."""
        service, mock_table, _ = busy_slot_service
        
        # Mock the query chain
        mock_execute = Mock()
        mock_execute.execute.return_value.data = sample_busy_slots_data
        mock_table.select.return_value.in_.return_value.gte.return_value.lte.return_value.order.return_value = mock_execute
        
        participant_ids = ["user-1", "user-2"]
        start_date = datetime(2024, 1, 1)
        end_date = datetime(2024, 1, 2)
        
        result = service.get_participants_busy_slots(participant_ids, start_date, end_date)
        
        assert result == sample_busy_slots_data

    def test_get_event_participants_busy_slots_success(self, busy_slot_service, sample_busy_slots_data):
        """Test successful retrieval of event participants' busy slots."""
        service, mock_table, _ = busy_slot_service
        
        # Mock participants query
        participants_data = [{"user_id": "user-1"}, {"user_id": "user-2"}]
        mock_participants_execute = Mock()
        mock_participants_execute.execute.return_value.data = participants_data
        mock_table.select.return_value.eq.return_value = mock_participants_execute
        
        # Mock busy slots query
        mock_busy_slots_execute = Mock()
        mock_busy_slots_execute.execute.return_value.data = sample_busy_slots_data
        
        # We need to handle the chained calls properly
        def mock_table_side_effect(table_name):
            if table_name == "event_participants":
                return mock_table
            elif table_name == "busy_slots":
                mock_busy_table = Mock()
                mock_busy_table.select.return_value.in_.return_value.gte.return_value.lte.return_value.order.return_value = mock_busy_slots_execute
                return mock_busy_table
            return mock_table
        
        service.supabase.table.side_effect = mock_table_side_effect
        
        start_date = datetime(2024, 1, 1)
        end_date = datetime(2024, 1, 2)
        
        result = service.get_event_participants_busy_slots("event-123", start_date, end_date)
        
        assert result == sample_busy_slots_data

    def test_get_event_participants_busy_slots_no_participants(self, busy_slot_service):
        """Test event with no participants."""
        service, mock_table, _ = busy_slot_service
        
        # Mock empty participants
        mock_execute = Mock()
        mock_execute.execute.return_value.data = []
        mock_table.select.return_value.eq.return_value = mock_execute
        
        start_date = datetime(2024, 1, 1)
        end_date = datetime(2024, 1, 2)
        
        result = service.get_event_participants_busy_slots("event-123", start_date, end_date)
        
        assert result == []


class TestBusySlotServiceGoogleCalendarSync:
    """Test Google Calendar synchronization."""

    @patch('app.services_simple.google_calendar.get_stored_credentials')
    @patch('app.services_simple.google_calendar.get_calendar_service')
    def test_sync_user_google_calendar_success(self, mock_get_service, mock_get_creds, busy_slot_service):
        """Test successful Google Calendar sync."""
        service, mock_table, _ = busy_slot_service
        
        # Mock credentials
        mock_creds = Mock()
        mock_get_creds.return_value = mock_creds
        
        # Mock Google Calendar service
        mock_service = Mock()
        mock_events = Mock()
        mock_events.list.return_value.execute.return_value = {
            'items': [
                {
                    'id': 'google-event-1',
                    'summary': 'Test Event',
                    'start': {'dateTime': '2024-01-01T09:00:00Z'},
                    'end': {'dateTime': '2024-01-01T10:00:00Z'}
                }
            ]
        }
        mock_service.events.return_value = mock_events
        mock_get_service.return_value = mock_service
        
        # Mock upsert_busy_slot
        with patch.object(service, 'upsert_busy_slot', return_value={"id": "slot-1"}):
            start_date = datetime(2024, 1, 1)
            end_date = datetime(2024, 1, 2)
            
            result = service.sync_user_google_calendar("user-123", start_date, end_date)
            
            assert result is True

    @patch('app.services_simple.google_calendar.get_stored_credentials')
    def test_sync_user_google_calendar_no_credentials(self, mock_get_creds, busy_slot_service):
        """Test sync with no Google credentials."""
        service, _, _ = busy_slot_service
        
        # Mock no credentials
        mock_get_creds.return_value = None
        
        start_date = datetime(2024, 1, 1)
        end_date = datetime(2024, 1, 2)
        
        result = service.sync_user_google_calendar("user-123", start_date, end_date)
        
        assert result is False

    def test_delete_user_google_events_success(self, busy_slot_service):
        """Test successful deletion of Google events."""
        service, mock_table, _ = busy_slot_service
        
        # Mock delete chain
        mock_execute = Mock()
        mock_execute.execute.return_value = Mock()
        mock_table.delete.return_value.eq.return_value.not_.is_.return_value = mock_execute
        
        result = service.delete_user_google_events("user-123")
        
        assert result is True


class TestBusySlotServiceMergedSlots:
    """Test merged busy slots functionality."""

    def test_get_merged_busy_slots_for_event_rpc_success(self, busy_slot_service):
        """Test successful RPC call for merged busy slots."""
        service, _, mock_rpc = busy_slot_service
        
        # Mock RPC response
        rpc_data = [
            {
                "start_time": "2024-01-01T09:00:00Z",
                "end_time": "2024-01-01T10:00:00Z",
                "busy_participants_count": 2
            }
        ]
        mock_rpc.execute.return_value.data = rpc_data
        
        start_date = datetime(2024, 1, 1)
        end_date = datetime(2024, 1, 2)
        
        result = service.get_merged_busy_slots_for_event("event-123", start_date, end_date)
        
        assert result == rpc_data
        service.supabase.rpc.assert_called_once_with(
            'get_merged_busy_slots_for_event',
            {
                'event_uuid': 'event-123',
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            }
        )

    def test_get_merged_busy_slots_for_event_rpc_fallback(self, busy_slot_service):
        """Test fallback when RPC fails."""
        service, mock_table, mock_rpc = busy_slot_service
        
        # Mock RPC failure
        mock_rpc.execute.side_effect = Exception("RPC error")
        
        # Mock fallback method
        with patch.object(service, '_get_merged_busy_slots_fallback', return_value=[]) as mock_fallback:
            start_date = datetime(2024, 1, 1)
            end_date = datetime(2024, 1, 2)
            
            result = service.get_merged_busy_slots_for_event("event-123", start_date, end_date)
            
            assert result == []
            mock_fallback.assert_called_once_with("event-123", start_date, end_date)

    def test_merge_overlapping_slots_python_basic(self, busy_slot_service):
        """Test Python implementation of slot merging."""
        service, _, _ = busy_slot_service
        
        # Sample overlapping busy slots
        busy_slots = [
            {
                "start_time_utc": datetime(2024, 1, 1, 9, 0, 0),
                "end_time_utc": datetime(2024, 1, 1, 10, 0, 0),
                "user_id": "user-1"
            },
            {
                "start_time_utc": datetime(2024, 1, 1, 9, 30, 0),
                "end_time_utc": datetime(2024, 1, 1, 10, 30, 0),
                "user_id": "user-2"
            }
        ]
        
        result = service._merge_overlapping_slots_python(busy_slots)

        # Should have merged overlapping periods
        # Expected: 3 periods - 9:00-9:30 (1 user), 9:30-10:00 (2 users), 10:00-10:30 (1 user)
        assert len(result) == 3
        assert result[0]["busy_participants_count"] == 1  # 9:00-9:30 (user-1 only)
        assert result[1]["busy_participants_count"] == 2  # 9:30-10:00 (both users)
        assert result[2]["busy_participants_count"] == 1  # 10:00-10:30 (user-2 only)

    def test_merge_overlapping_slots_python_empty(self, busy_slot_service):
        """Test Python merging with empty input."""
        service, _, _ = busy_slot_service
        
        result = service._merge_overlapping_slots_python([])
        
        assert result == []

    def test_merge_overlapping_slots_python_no_overlap(self, busy_slot_service):
        """Test Python merging with non-overlapping slots."""
        service, _, _ = busy_slot_service
        
        busy_slots = [
            {
                "start_time_utc": datetime(2024, 1, 1, 9, 0, 0),
                "end_time_utc": datetime(2024, 1, 1, 10, 0, 0),
                "user_id": "user-1"
            },
            {
                "start_time_utc": datetime(2024, 1, 1, 11, 0, 0),
                "end_time_utc": datetime(2024, 1, 1, 12, 0, 0),
                "user_id": "user-2"
            }
        ]
        
        result = service._merge_overlapping_slots_python(busy_slots)
        
        # Should have two separate periods
        assert len(result) == 2
        assert all(slot["busy_participants_count"] == 1 for slot in result)


class TestBusySlotServiceErrorHandling:
    """Test error handling and edge cases."""

    def test_various_methods_with_exceptions(self, busy_slot_service):
        """Test that methods handle exceptions gracefully."""
        service, mock_table, _ = busy_slot_service
        
        # Mock exception for all table operations
        mock_table.select.side_effect = Exception("Database error")
        mock_table.insert.side_effect = Exception("Insert error")
        mock_table.delete.side_effect = Exception("Delete error")
        
        start_date = datetime(2024, 1, 1)
        end_date = datetime(2024, 1, 2)
        
        # All these should return empty/False/None instead of raising
        assert service.get_user_busy_slots("user-1", start_date, end_date) == []
        assert service.get_busy_slots(start_date, end_date) == []
        assert service.get_participants_busy_slots(["user-1"], start_date, end_date) == []
        assert service.delete_user_busy_slots_in_range("user-1", start_date, end_date) is False
        assert service.delete_user_google_events("user-1") is False

    def test_invalid_date_handling(self, busy_slot_service):
        """Test handling of invalid dates."""
        service, mock_table, _ = busy_slot_service
        
        # Mock successful query
        mock_execute = Mock()
        mock_execute.execute.return_value.data = []
        mock_table.select.return_value.eq.return_value.gte.return_value.lte.return_value.order.return_value = mock_execute
        
        # Test with None dates (should not crash)
        result = service.get_user_busy_slots("user-1", None, None)
        
        # Should handle gracefully (might return empty or raise, depending on implementation)
        assert isinstance(result, list)
