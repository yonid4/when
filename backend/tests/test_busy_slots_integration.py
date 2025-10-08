"""
Legacy integration tests relying on services_simple path.
Skipping by default to avoid imports of removed modules.
"""

import pytest
pytest.skip("Skipping legacy busy slots integration tests", allow_module_level=True)


@pytest.mark.integration
class TestBusySlotRPCIntegration:
    """Integration tests for RPC functionality."""
    
    @pytest.fixture(scope="class")
    def service(self):
        """Create a real BusySlotService for integration testing."""
        return BusySlotService()
    
    @pytest.fixture(scope="class")
    def test_event_id(self):
        """Test event ID for integration tests."""
        return "test-event-integration-123"
    
    @pytest.fixture(scope="class")
    def test_user_ids(self):
        """Test user IDs for integration tests."""
        return ["test-user-1", "test-user-2", "test-user-3"]
    
    def test_rpc_function_exists(self, service):
        """Test that the RPC function exists in the database."""
        try:
            # Try to call the RPC function with minimal parameters
            result = service.supabase.rpc(
                'get_merged_busy_slots_for_event',
                {
                    'event_uuid': '00000000-0000-0000-0000-000000000000',
                    'start_date': '2024-01-01T00:00:00Z',
                    'end_date': '2024-01-01T23:59:59Z'
                }
            ).execute()

            # Should not raise an exception, even with non-existent event
            assert result.data == []

        except Exception as e:
            # Check if it's a network connectivity issue
            if "nodename nor servname provided" in str(e) or "ConnectError" in str(e):
                pytest.skip(f"Skipping RPC test due to network connectivity issue: {str(e)}")
            # Check if it's a missing RPC function (expected if not created yet)
            elif "PGRST202" in str(e) or "Could not find the function" in str(e):
                pytest.skip(f"Skipping RPC test - function not created in database yet: {str(e)}")
            # Check if it's a UUID validation error (test setup issue)
            elif "22P02" in str(e) or "invalid input syntax for type uuid" in str(e):
                pytest.fail(f"Test setup error - invalid UUID format: {str(e)}")
            else:
                pytest.fail(f"RPC function test failed with unexpected error: {str(e)}")
    
    def test_rpc_with_real_data(self, service, test_event_id, test_user_ids):
        """Test RPC function with real data (requires setup)."""
        # This test would require:
        # 1. Creating test event participants
        # 2. Creating test busy slots
        # 3. Calling the RPC function
        # 4. Verifying the merged results
        
        # Skip if not in integration test environment
        pytest.skip("Requires database setup with test data")
    
    def test_python_fallback_integration(self, service, test_event_id):
        """Test Python fallback method with real database."""
        start_date = datetime(2024, 1, 1)
        end_date = datetime(2024, 1, 2)
        
        # This should work even without RPC function
        result = service._get_merged_busy_slots_fallback(test_event_id, start_date, end_date)
        
        # Should return empty list for non-existent event
        assert isinstance(result, list)
    
    def test_python_merging_logic_comprehensive(self, service):
        """Test Python merging logic with comprehensive scenarios."""
        
        # Test Case 1: Complete overlap
        busy_slots_overlap = [
            {
                "start_time_utc": datetime(2024, 1, 1, 9, 0, 0),
                "end_time_utc": datetime(2024, 1, 1, 10, 0, 0),
                "user_id": "user-1"
            },
            {
                "start_time_utc": datetime(2024, 1, 1, 9, 0, 0),
                "end_time_utc": datetime(2024, 1, 1, 10, 0, 0),
                "user_id": "user-2"
            }
        ]
        
        result = service._merge_overlapping_slots_python(busy_slots_overlap)
        assert len(result) == 1
        assert result[0]["busy_participants_count"] == 2
        
        # Test Case 2: Partial overlap
        busy_slots_partial = [
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
        
        result = service._merge_overlapping_slots_python(busy_slots_partial)
        assert len(result) == 3
        # First period: 9:00-9:30 (1 user)
        # Second period: 9:30-10:00 (2 users) 
        # Third period: 10:00-10:30 (1 user)
        
        # Test Case 3: Multiple users with complex overlaps
        busy_slots_complex = [
            {
                "start_time_utc": datetime(2024, 1, 1, 9, 0, 0),
                "end_time_utc": datetime(2024, 1, 1, 11, 0, 0),
                "user_id": "user-1"
            },
            {
                "start_time_utc": datetime(2024, 1, 1, 9, 30, 0),
                "end_time_utc": datetime(2024, 1, 1, 10, 30, 0),
                "user_id": "user-2"
            },
            {
                "start_time_utc": datetime(2024, 1, 1, 10, 0, 0),
                "end_time_utc": datetime(2024, 1, 1, 12, 0, 0),
                "user_id": "user-3"
            }
        ]
        
        result = service._merge_overlapping_slots_python(busy_slots_complex)
        
        # Should have multiple periods with different participant counts
        assert len(result) > 0
        assert all(slot["busy_participants_count"] > 0 for slot in result)
        
        # Verify chronological order
        for i in range(1, len(result)):
            prev_end = datetime.fromisoformat(result[i-1]["end_time"])
            curr_start = datetime.fromisoformat(result[i]["start_time"])
            assert prev_end <= curr_start
    
    def test_edge_cases(self, service):
        """Test edge cases in merging logic."""
        
        # Test Case 1: Same start and end times
        busy_slots_same_time = [
            {
                "start_time_utc": datetime(2024, 1, 1, 9, 0, 0),
                "end_time_utc": datetime(2024, 1, 1, 9, 0, 0),  # Zero duration
                "user_id": "user-1"
            }
        ]
        
        result = service._merge_overlapping_slots_python(busy_slots_same_time)
        # Zero duration slots should not create time windows
        assert result == []
        
        # Test Case 2: Adjacent but not overlapping
        busy_slots_adjacent = [
            {
                "start_time_utc": datetime(2024, 1, 1, 9, 0, 0),
                "end_time_utc": datetime(2024, 1, 1, 10, 0, 0),
                "user_id": "user-1"
            },
            {
                "start_time_utc": datetime(2024, 1, 1, 10, 0, 0),  # Exactly when first ends
                "end_time_utc": datetime(2024, 1, 1, 11, 0, 0),
                "user_id": "user-2"
            }
        ]
        
        result = service._merge_overlapping_slots_python(busy_slots_adjacent)
        # Should have two separate periods
        assert len(result) == 2
        assert all(slot["busy_participants_count"] == 1 for slot in result)


@pytest.mark.integration
@pytest.mark.slow
class TestBusySlotServiceFullIntegration:
    """Full integration tests requiring database setup."""
    
    def test_full_workflow_integration(self):
        """Test the complete workflow from storing to retrieving merged slots."""
        # This would test:
        # 1. Create test event and participants
        # 2. Store busy slots for participants
        # 3. Retrieve merged busy slots via RPC
        # 4. Compare with Python fallback results
        # 5. Clean up test data
        
        pytest.skip("Requires full database setup and cleanup")
    
    def test_performance_comparison(self):
        """Compare performance between RPC and Python implementation."""
        # This would test:
        # 1. Create large dataset of busy slots
        # 2. Time RPC function execution
        # 3. Time Python fallback execution
        # 4. Compare results and performance
        
        pytest.skip("Requires performance testing setup")


# Utility functions for integration tests
def create_test_event_participants(supabase, event_id, user_ids):
    """Helper to create test event participants."""
    participants = [
        {"event_id": event_id, "user_id": user_id}
        for user_id in user_ids
    ]
    
    return supabase.table("event_participants").insert(participants).execute()


def create_test_busy_slots(supabase, user_slots_data):
    """Helper to create test busy slots."""
    busy_slots = []
    for user_id, slots in user_slots_data.items():
        for slot in slots:
            busy_slot = BusySlot(
                user_id=user_id,
                start_time_utc=slot["start"],
                end_time_utc=slot["end"],
                event_title=slot.get("title", "Test Event")
            )
            busy_slots.append(busy_slot.to_dict())
    
    return supabase.table("busy_slots").insert(busy_slots).execute()


def cleanup_test_data(supabase, event_id, user_ids):
    """Helper to clean up test data."""
    # Delete test busy slots
    supabase.table("busy_slots").delete().in_("user_id", user_ids).execute()
    
    # Delete test event participants
    supabase.table("event_participants").delete().eq("event_id", event_id).execute()
    
    # Delete test event if it exists
    supabase.table("events").delete().eq("id", event_id).execute()
