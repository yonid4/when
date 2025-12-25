"""
API endpoint tests for event routes.
Tests authentication, authorization, validation, and response formats.
"""

import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime


class TestCreateEvent:
    """Test POST /api/events/ endpoint."""

    def test_create_event_success(self, client, auth_headers, sample_event):
        """Test successful event creation."""
        # Arrange
        event_data = {
            "name": "Team Meeting",
            "description": "Quarterly review",
            "earliest_date": "2025-01-15T00:00:00Z",
            "latest_date": "2025-01-20T00:00:00Z",
            "earliest_hour": "09:00:00",
            "latest_hour": "17:00:00",
            "duration_minutes": 60
        }

        mock_event = {**sample_event, **event_data, "id": "event-123", "uid": "abc123xyz456"}

        with patch("app.routes.events.service_role_client") as mock_service_client, \
             patch("app.routes.events.EventsService") as mock_service:
            mock_insert = MagicMock()
            mock_insert.execute.return_value = MagicMock(data=[mock_event])
            mock_service_client.table.return_value.insert.return_value = mock_insert

            mock_service_instance = MagicMock()
            mock_service_instance.validate_event_data.return_value = True
            mock_service_instance.add_participant.return_value = {"id": "participant-1"}
            mock_service.return_value = mock_service_instance

            # Act
            response = client.post("/api/events/", json=event_data, headers=auth_headers)

            # Assert
            assert response.status_code == 201
            data = response.get_json()
            assert data["name"] == event_data["name"]
            assert data["description"] == event_data["description"]
            assert "uid" in data

    def test_create_event_missing_name(self, client, auth_headers):
        """Test event creation with missing required name field."""
        # Arrange
        event_data = {
            "description": "No name provided",
            "duration_minutes": 60
        }

        # Act
        response = client.post("/api/events/", json=event_data, headers=auth_headers)

        # Assert
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "name" in data["message"].lower()

    def test_create_event_invalid_date_format(self, client, auth_headers):
        """Test event creation with invalid date format."""
        # Arrange
        event_data = {
            "name": "Test Event",
            "earliest_date": "invalid-date",
            "latest_date": "2025-01-20T00:00:00Z"
        }

        # Act
        response = client.post("/api/events/", json=event_data, headers=auth_headers)

        # Assert
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_create_event_validation_failure(self, client, auth_headers):
        """Test event creation when validation fails."""
        # Arrange
        event_data = {
            "name": "Test Event",
            "duration_minutes": 60
        }

        with patch("app.routes.events.service_role_client") as mock_service_client, \
             patch("app.routes.events.EventsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.validate_event_data.return_value = False
            mock_service.return_value = mock_service_instance

            # Act
            response = client.post("/api/events/", json=event_data, headers=auth_headers)

            # Assert
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data
            assert "validation" in data["error"].lower()

    def test_create_event_no_auth(self, client):
        """Test event creation without authentication token."""
        # Arrange
        event_data = {
            "name": "Test Event",
            "duration_minutes": 60
        }

        # Act
        response = client.post("/api/events/", json=event_data)

        # Assert
        assert response.status_code == 401


class TestGetUserEvents:
    """Test GET /api/events/ endpoint."""

    def test_get_user_events_success(self, client, auth_headers, sample_event):
        """Test successful retrieval of user events."""
        # Arrange
        mock_events = [sample_event, {**sample_event, "id": "event-2", "name": "Another Event"}]

        with patch("app.routes.events.EventsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_user_events.return_value = mock_events
            mock_service.return_value = mock_service_instance

            # Act
            response = client.get("/api/events/", headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert isinstance(data, list)
            assert len(data) == 2
            assert data[0]["id"] == sample_event["id"]

    def test_get_user_events_empty(self, client, auth_headers):
        """Test retrieval when user has no events."""
        # Arrange
        with patch("app.routes.events.EventsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_user_events.return_value = []
            mock_service.return_value = mock_service_instance

            # Act
            response = client.get("/api/events/", headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert isinstance(data, list)
            assert len(data) == 0

    def test_get_user_events_no_auth(self, client):
        """Test get user events without authentication token."""
        # Act
        response = client.get("/api/events/")

        # Assert
        assert response.status_code == 401


class TestGetEvent:
    """Test GET /api/events/<event_id> endpoint."""

    def test_get_event_by_uid_success(self, client, auth_headers, sample_event):
        """Test successful event retrieval by UID."""
        # Arrange
        event_uid = "abc123xyz456"

        with patch("app.routes.events.EventsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_event_by_uid.return_value = sample_event
            mock_service.return_value = mock_service_instance

            # Act
            response = client.get(f"/api/events/{event_uid}", headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert data["id"] == sample_event["id"]
            assert data["name"] == sample_event["name"]

    def test_get_event_by_id_success(self, client, auth_headers, sample_event):
        """Test successful event retrieval by ID (fallback)."""
        # Arrange
        event_id = "event-123"

        with patch("app.routes.events.EventsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_event_by_uid.return_value = None
            mock_service_instance.get_event.return_value = sample_event
            mock_service.return_value = mock_service_instance

            # Act
            response = client.get(f"/api/events/{event_id}", headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert data["id"] == sample_event["id"]

    def test_get_event_not_found(self, client, auth_headers):
        """Test event retrieval when event doesn't exist."""
        # Arrange
        event_uid = "nonexistent"

        with patch("app.routes.events.EventsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_event_by_uid.return_value = None
            mock_service_instance.get_event.return_value = None
            mock_service.return_value = mock_service_instance

            # Act
            response = client.get(f"/api/events/{event_uid}", headers=auth_headers)

            # Assert
            assert response.status_code == 404
            data = response.get_json()
            assert "error" in data
            assert "event" in data["message"].lower() and "found" in data["message"].lower()

    def test_get_event_no_auth(self, client):
        """Test get event without authentication token."""
        # Act
        response = client.get("/api/events/abc123")

        # Assert
        assert response.status_code == 401


class TestUpdateEvent:
    """Test PUT /api/events/<event_id> endpoint."""

    def test_update_event_success(self, client, auth_headers, sample_event):
        """Test successful event update."""
        # Arrange
        event_id = "event-123"
        update_data = {
            "name": "Updated Event Name",
            "description": "Updated description"
        }
        updated_event = {**sample_event, **update_data}

        with patch("app.routes.events.EventsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.update_event.return_value = updated_event
            mock_service.return_value = mock_service_instance

            # Act
            response = client.put(f"/api/events/{event_id}", json=update_data, headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert data["name"] == update_data["name"]
            assert data["description"] == update_data["description"]

    def test_update_event_no_auth(self, client):
        """Test update event without authentication token."""
        # Arrange
        event_id = "event-123"
        update_data = {"name": "Updated Name"}

        # Act
        response = client.put(f"/api/events/{event_id}", json=update_data)

        # Assert
        assert response.status_code == 401


class TestDeleteEvent:
    """Test DELETE /api/events/<event_id> endpoint."""

    def test_delete_event_success(self, client, auth_headers, sample_event):
        """Test successful event deletion by coordinator."""
        # Arrange
        event_id = "event-123"
        user_id = "user-1"
        coordinator_event = {**sample_event, "coordinator_id": user_id}

        with patch("app.routes.events.EventsService") as mock_service, \
             patch("app.utils.supabase_client.get_supabase") as mock_supabase, \
             patch("app.services.notifications.NotificationsService"):
            mock_service_instance = MagicMock()
            mock_service_instance.get_event.return_value = coordinator_event
            mock_service_instance.get_event_participants.return_value = []
            mock_service_instance.delete_event.return_value = True
            mock_service.return_value = mock_service_instance

            # Mock supabase for coordinator profile
            mock_supabase_client = MagicMock()
            mock_supabase_client.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{"id": user_id, "full_name": "Test User"}]
            )
            mock_supabase.return_value = mock_supabase_client

            # Act
            response = client.delete(f"/api/events/{event_id}", headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert data["success"] is True
            assert "deleted successfully" in data["message"].lower()

    def test_delete_event_not_coordinator(self, client, auth_headers, sample_event):
        """Test event deletion by non-coordinator returns 403."""
        # Arrange
        event_id = "event-123"
        non_coordinator_event = {**sample_event, "coordinator_id": "other-user"}

        with patch("app.routes.events.EventsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_event.return_value = non_coordinator_event
            mock_service.return_value = mock_service_instance

            # Act
            response = client.delete(f"/api/events/{event_id}", headers=auth_headers)

            # Assert
            assert response.status_code == 403
            data = response.get_json()
            assert "error" in data
            assert "coordinator" in data["message"].lower()

    def test_delete_event_not_found(self, client, auth_headers):
        """Test deletion of non-existent event."""
        # Arrange
        event_id = "nonexistent"

        with patch("app.routes.events.EventsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_event.return_value = None
            mock_service.return_value = mock_service_instance

            # Act
            response = client.delete(f"/api/events/{event_id}", headers=auth_headers)

            # Assert
            assert response.status_code == 404
            data = response.get_json()
            assert "error" in data
            assert "event" in data["message"].lower() and "found" in data["message"].lower()

    def test_delete_event_no_auth(self, client):
        """Test delete event without authentication token."""
        # Act
        response = client.delete("/api/events/event-123")

        # Assert
        assert response.status_code == 401


class TestGetEventParticipants:
    """Test GET /api/events/<event_uid>/participants endpoint."""

    def test_get_participants_success(self, client, auth_headers):
        """Test successful retrieval of event participants."""
        # Arrange
        event_uid = "abc123xyz456"
        mock_participants = [
            {"id": "user-1", "full_name": "Alice", "email_address": "alice@example.com"},
            {"id": "user-2", "full_name": "Bob", "email_address": "bob@example.com"}
        ]

        with patch("app.routes.events.EventsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_event_participants.return_value = mock_participants
            mock_service.return_value = mock_service_instance

            # Act
            response = client.get(f"/api/events/{event_uid}/participants", headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert isinstance(data, list)
            assert len(data) == 2
            assert data[0]["id"] == "user-1"

    def test_get_participants_empty(self, client, auth_headers):
        """Test retrieval when event has no participants."""
        # Arrange
        event_uid = "abc123xyz456"

        with patch("app.routes.events.EventsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_event_participants.return_value = []
            mock_service.return_value = mock_service_instance

            # Act
            response = client.get(f"/api/events/{event_uid}/participants", headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert isinstance(data, list)
            assert len(data) == 0

    def test_get_participants_no_auth(self, client):
        """Test get participants without authentication token."""
        # Act
        response = client.get("/api/events/abc123/participants")

        # Assert
        assert response.status_code == 401


class TestAddParticipant:
    """Test POST /api/events/<event_id>/participants endpoint."""

    def test_add_participant_success(self, client, auth_headers):
        """Test successful participant addition."""
        # Arrange
        event_id = "event-123"
        participant_data = {"user_id": "user-2"}
        mock_participant = {"id": "participant-1", "user_id": "user-2", "event_id": event_id}

        with patch("app.routes.events.EventsService") as mock_service, \
             patch("app.services.time_proposal.TimeProposalService"):
            mock_service_instance = MagicMock()
            mock_service_instance.add_participant.return_value = mock_participant
            mock_service.return_value = mock_service_instance

            # Act
            response = client.post(
                f"/api/events/{event_id}/participants",
                json=participant_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 201
            data = response.get_json()
            assert data["user_id"] == participant_data["user_id"]

    def test_add_participant_already_exists(self, client, auth_headers):
        """Test adding participant who already exists."""
        # Arrange
        event_id = "event-123"
        participant_data = {"user_id": "user-2"}

        with patch("app.routes.events.EventsService") as mock_service, \
             patch("app.services.time_proposal.TimeProposalService"):
            mock_service_instance = MagicMock()
            mock_service_instance.add_participant.return_value = None
            mock_service.return_value = mock_service_instance

            # Act
            response = client.post(
                f"/api/events/{event_id}/participants",
                json=participant_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data

    def test_add_participant_no_auth(self, client):
        """Test add participant without authentication token."""
        # Arrange
        event_id = "event-123"
        participant_data = {"user_id": "user-2"}

        # Act
        response = client.post(f"/api/events/{event_id}/participants", json=participant_data)

        # Assert
        assert response.status_code == 401


class TestRemoveParticipant:
    """Test DELETE /api/events/<event_id>/participants/<participant_id> endpoint."""

    def test_remove_participant_success(self, client, auth_headers):
        """Test successful participant removal."""
        # Arrange
        event_id = "event-123"
        participant_id = "user-2"

        with patch("app.routes.events.EventsService") as mock_service, \
             patch("app.services.time_proposal.TimeProposalService"):
            mock_service_instance = MagicMock()
            mock_service_instance.remove_participant.return_value = True
            mock_service.return_value = mock_service_instance

            # Act
            response = client.delete(
                f"/api/events/{event_id}/participants/{participant_id}",
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert "removed successfully" in data["message"].lower()

    def test_remove_participant_not_found(self, client, auth_headers):
        """Test removing non-existent participant."""
        # Arrange
        event_id = "event-123"
        participant_id = "nonexistent"

        with patch("app.routes.events.EventsService") as mock_service, \
             patch("app.services.time_proposal.TimeProposalService"):
            mock_service_instance = MagicMock()
            mock_service_instance.remove_participant.return_value = False
            mock_service.return_value = mock_service_instance

            # Act
            response = client.delete(
                f"/api/events/{event_id}/participants/{participant_id}",
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data

    def test_remove_participant_no_auth(self, client):
        """Test remove participant without authentication token."""
        # Act
        response = client.delete("/api/events/event-123/participants/user-2")

        # Assert
        assert response.status_code == 401
