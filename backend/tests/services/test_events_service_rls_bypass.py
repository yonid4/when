
import pytest
from unittest.mock import MagicMock, patch
from app.services.events import EventsService

def test_add_participant_uses_service_role_client():
    """Test that add_participant uses service_role_client to bypass RLS."""
    
    # Mock the supabase client and service role client
    mock_supabase = MagicMock()
    mock_service_role = MagicMock()
    
    # Mock the create_client function to return our mocks
    with patch('app.services.events.create_client', return_value=mock_service_role):
        with patch('app.services.events.get_supabase', return_value=mock_supabase):
            # Initialize service
            service = EventsService(access_token="fake-token")
            
            # Ensure service_role_client is set to our mock
            service.service_role_client = mock_service_role
            service.supabase = mock_supabase
            
            # Mock get_event to return a valid event
            service.get_event = MagicMock(return_value={"id": "event-123", "name": "Test Event"})
            
            # Mock the existing participant check to return empty (no existing participant)
            mock_service_role.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
            
            # Mock the insert to return success
            mock_service_role.table.return_value.insert.return_value.execute.return_value.data = [{"id": "p1", "user_id": "user-123"}]
            
            # Call add_participant
            result = service.add_participant("event-123", "user-123")
            
            # Verify result
            assert result == {"id": "p1", "user_id": "user-123"}
            
            # Verify service_role_client was used for insert
            # We expect table("event_participants").insert(...)
            mock_service_role.table.assert_any_call("event_participants")
            
            # Verify supabase client was NOT used for insert (it might be used for other things, but not this)
            # Note: We can't easily assert "not called" on everything, but we can check specific calls
            # Ideally we'd check that mock_supabase.table("event_participants") was not called
            
            # Let's check that the insert call happened on service_role_client
            insert_call = mock_service_role.table("event_participants").insert
            assert insert_call.called
            
            # And verify the existing check also used service_role_client
            select_call = mock_service_role.table("event_participants").select
            assert select_call.called

def test_remove_participant_uses_service_role_client():
    """Test that remove_participant uses service_role_client."""
    
    mock_supabase = MagicMock()
    mock_service_role = MagicMock()
    
    with patch('app.services.events.create_client', return_value=mock_service_role):
        with patch('app.services.events.get_supabase', return_value=mock_supabase):
            service = EventsService(access_token="fake-token")
            service.service_role_client = mock_service_role
            service.supabase = mock_supabase
            
            # Mock get_event
            service.get_event = MagicMock(return_value={"id": "event-123", "coordinator_id": "other-user"})
            
            # Mock is_user_participant
            service.is_user_participant = MagicMock(return_value=True)
            
            # Mock cleanup
            service.cleanup_participant_data = MagicMock(return_value=True)
            
            # Call remove_participant
            service.remove_participant("event-123", "user-123")
            
            # Verify service_role_client was used for delete
            mock_service_role.table.assert_any_call("event_participants")
            delete_call = mock_service_role.table("event_participants").delete
            assert delete_call.called
