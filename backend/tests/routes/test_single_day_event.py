
from unittest.mock import patch
import pytest

def test_create_single_day_event_success(client, auth_headers, mock_authenticated_user):
    """Test that creating an event with the same start and end date succeeds."""
    payload = {
        "name": "Single Day Event",
        "start_date": "2025-01-01T00:00:00Z",
        "end_date": "2025-01-01T00:00:00Z",  # Same day
        "earliest_daily_start_time": "09:00",
        "latest_daily_end_time": "17:00",
        "duration_minutes": 60,
    }
    
    # We need to mock the service role client and the insert operation
    # The EventsService.validate_event_data is what we changed, so we want to make sure it passes
    # But since we are testing the route, we need to mock the database interactions
    
    # Patch the service_role_client object directly in the module
    with patch("app.routes.events.service_role_client") as mock_client:
        mock_client.table.return_value.insert.return_value.execute.return_value.data = [{"id": "e1", "uid": "uid1"}]
        
        # We also need to mock the EventsService.add_participant call which happens after creation
        with patch("app.routes.events.EventsService.add_participant"):
            resp = client.post("/api/events/", json=payload, headers=auth_headers)
            
            # If validation fails, it would return 400. If it passes, it tries to insert.
            # We expect 201 Created
            assert resp.status_code == 201
            assert resp.get_json()["id"] == "e1"
