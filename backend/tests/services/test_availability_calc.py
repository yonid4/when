"""
Tests for AvailabilityCalc service.
"""

import pytest

# This legacy module is intentionally skipped per request to not test availability calc
pytest.skip("Skipping availability calc tests", allow_module_level=True)

import pytest
from unittest.mock import Mock, patch
from datetime import datetime
from app.services.availability_calc import AvailabilityCalc


class TestAvailabilityCalc:
    """Test cases for AvailabilityCalc."""

    @patch("app.utils.supabase_client.get_supabase")
    def test_calculate_availability_event_not_found(self, mock_get_supabase):
        """Test error handling when event is not found."""
        # Mock Supabase client
        mock_client = Mock()
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_get_supabase.return_value = mock_client
        
        # Mock empty event result
        event_result = Mock()
        event_result.data = []
        
        mock_table.select.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.execute.return_value = event_result
        
        calc = AvailabilityCalc()
        
        with pytest.raises(ValueError, match="Event with ID nonexistent-event not found"):
            calc.calculate_availability_for_event("nonexistent-event")

    @patch("app.utils.supabase_client.get_supabase")
    def test_calculate_availability_no_participants(self, mock_get_supabase):
        """Test calculating availability when event has no participants."""
        # Mock Supabase client
        mock_client = Mock()
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_get_supabase.return_value = mock_client
        
        # Mock event found but no participants
        event_data = {
            "id": "event-123",
            "name": "Team Meeting",
            "earliest_date": "2025-03-01T00:00:00Z",
            "latest_date": "2025-03-03T00:00:00Z",
            "default_duration_minutes": 60,
            "working_hours_start": 9,
            "working_hours_end": 17
        }
        
        event_result = Mock()
        event_result.data = [event_data]
        
        participants_result = Mock()
        participants_result.data = []
        
        # Set up mock to return different results for different calls
        mock_table.select.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.execute.side_effect = [event_result, participants_result]
        
        calc = AvailabilityCalc()
        result = calc.calculate_availability_for_event("event-123")
        
        # Should return empty list when no participants
        assert result == []

    @patch("app.utils.supabase_client.get_supabase")
    def test_calculate_availability_with_participants(self, mock_get_supabase):
        """Test calculating availability with participants."""
        # Mock Supabase client
        mock_client = Mock()
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_get_supabase.return_value = mock_client
        
        # Mock event data
        event_data = {
            "id": "event-123",
            "name": "Team Meeting",
            "earliest_date": "2025-03-01T00:00:00Z",
            "latest_date": "2025-03-01T00:00:00Z",  # Same day for simplicity
            "default_duration_minutes": 60,
            "working_hours_start": 9,
            "working_hours_end": 17
        }
        
        # Mock participants
        participants_data = [
            {"user_id": "user-1"},
            {"user_id": "user-2"}
        ]
        
        # Mock busy slots
        busy_slots_data = [
            {
                "user_id": "user-1",
                "start_time_utc": "2025-03-01T10:00:00+00:00",
                "end_time_utc": "2025-03-01T12:00:00+00:00"
            }
        ]
        
        event_result = Mock()
        event_result.data = [event_data]
        
        participants_result = Mock()
        participants_result.data = participants_data
        
        busy_slots_result = Mock()
        busy_slots_result.data = busy_slots_data
        
        # Set up mock to return different results for different calls
        mock_table.select.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.in_.return_value = mock_table
        mock_table.gte.return_value = mock_table
        mock_table.lte.return_value = mock_table
        mock_table.order.return_value = mock_table
        mock_table.execute.side_effect = [event_result, participants_result, busy_slots_result]
        
        calc = AvailabilityCalc()
        result = calc.calculate_availability_for_event("event-123")
        
        # Should return a list of free slots
        assert isinstance(result, list)
        # The exact content depends on the busy slot service logic
        # We're mainly testing that the method runs without error

    @patch("app.utils.supabase_client.get_supabase")
    def test_calculate_availability_with_default_values(self, mock_get_supabase):
        """Test calculating availability with default event values."""
        # Mock Supabase client
        mock_client = Mock()
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_get_supabase.return_value = mock_client
        
        # Event data without optional fields
        minimal_event_data = {
            "id": "event-123",
            "name": "Team Meeting",
            "earliest_date": "2025-03-01T00:00:00Z",
            "latest_date": "2025-03-01T00:00:00Z"
            # Missing default_duration_minutes, working_hours_start, working_hours_end
        }
        
        participants_data = [{"user_id": "user-1"}]
        
        event_result = Mock()
        event_result.data = [minimal_event_data]
        
        participants_result = Mock()
        participants_result.data = participants_data
        
        busy_slots_result = Mock()
        busy_slots_result.data = []
        
        mock_table.select.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.in_.return_value = mock_table
        mock_table.gte.return_value = mock_table
        mock_table.lte.return_value = mock_table
        mock_table.order.return_value = mock_table
        mock_table.execute.side_effect = [event_result, participants_result, busy_slots_result]
        
        calc = AvailabilityCalc()
        
        # Should not raise an error and use default values
        result = calc.calculate_availability_for_event("event-123")
        assert isinstance(result, list)

    @patch("app.utils.supabase_client.get_supabase")
    def test_calculate_availability_integration_with_busy_slot_service(self, mock_get_supabase):
        """Test that the method correctly integrates with BusySlotService."""
        # Mock Supabase client
        mock_client = Mock()
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        mock_get_supabase.return_value = mock_client
        
        event_data = {
            "id": "event-123",
            "name": "Team Meeting",
            "earliest_date": "2025-03-01T00:00:00Z",
            "latest_date": "2025-03-03T00:00:00Z",
            "default_duration_minutes": 60,
            "working_hours_start": 9,
            "working_hours_end": 17
        }
        
        participants_data = [
            {"user_id": "user-1"},
            {"user_id": "user-2"}
        ]
        
        event_result = Mock()
        event_result.data = [event_data]
        
        participants_result = Mock()
        participants_result.data = participants_data
        
        busy_slots_result = Mock()
        busy_slots_result.data = []
        
        mock_table.select.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.in_.return_value = mock_table
        mock_table.gte.return_value = mock_table
        mock_table.lte.return_value = mock_table
        mock_table.order.return_value = mock_table
        mock_table.execute.side_effect = [event_result, participants_result, busy_slots_result]
        
        calc = AvailabilityCalc()
        
        # Mock the busy slot service's calculate_free_slots method
        with patch.object(calc.busy_slot_service, 'calculate_free_slots') as mock_calc_free:
            mock_calc_free.return_value = [
                {
                    "start_time_utc": "2025-03-01T09:00:00+00:00",
                    "end_time_utc": "2025-03-01T10:00:00+00:00",
                    "duration_minutes": 60
                }
            ]
            
            result = calc.calculate_availability_for_event("event-123")
            
            # Verify the busy slot service was called with correct parameters
            mock_calc_free.assert_called_once()
            args = mock_calc_free.call_args[0]
            
            # Check participant IDs
            assert args[0] == ["user-1", "user-2"]
            
            # Check duration and working hours
            assert args[3] == 60  # default_duration_minutes
            assert args[4] == 9   # working_hours_start
            assert args[5] == 17  # working_hours_end
            
            # Check result
            assert len(result) == 1
            assert result[0]["duration_minutes"] == 60

    def test_availability_calc_initialization(self):
        """Test that AvailabilityCalc initializes correctly."""
        calc = AvailabilityCalc()
        assert calc.busy_slot_service is not None
        assert hasattr(calc, 'calculate_availability_for_event')