"""
API endpoint tests for busy slots routes.
Tests busy slots management, Google Calendar sync, and merged slots retrieval.
"""

import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime


class TestAddBusySlots:
    """Test POST /api/busy_slots/<event_id> endpoint."""

    def test_add_busy_slots_success(self, client, auth_headers):
        """Test successful addition of busy slots."""
        # Arrange
        event_id = "event-123"
        slots_data = {
            "slots": [
                {
                    "start_time_utc": "2025-01-15T10:00:00+00:00",
                    "end_time_utc": "2025-01-15T11:00:00+00:00"
                },
                {
                    "start_time_utc": "2025-01-15T14:00:00+00:00",
                    "end_time_utc": "2025-01-15T15:00:00+00:00"
                }
            ]
        }

        mock_slots = [
            {"id": "slot-1", "user_id": "user-1", "start_time_utc": "2025-01-15T10:00:00+00:00"},
            {"id": "slot-2", "user_id": "user-1", "start_time_utc": "2025-01-15T14:00:00+00:00"}
        ]

        with patch("app.routes.busy_slots.busy_slots_service") as mock_service:
            mock_service.store_busy_slot.side_effect = mock_slots

            # Act
            response = client.post(
                f"/api/busy_slots/{event_id}",
                json=slots_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 201
            data = response.get_json()
            assert isinstance(data, list)
            assert len(data) == 2

    def test_add_busy_slots_empty_list(self, client, auth_headers):
        """Test adding empty list of busy slots."""
        # Arrange
        event_id = "event-123"
        slots_data = {"slots": []}

        # Act
        response = client.post(
            f"/api/busy_slots/{event_id}",
            json=slots_data,
            headers=auth_headers
        )

        # Assert
        assert response.status_code == 201
        data = response.get_json()
        assert len(data) == 0

    def test_add_busy_slots_no_auth(self, client):
        """Test add busy slots without authentication token."""
        # Arrange
        event_id = "event-123"
        slots_data = {"slots": [{"start_time_utc": "2025-01-15T10:00:00+00:00", "end_time_utc": "2025-01-15T11:00:00+00:00"}]}

        # Act
        response = client.post(f"/api/busy_slots/{event_id}", json=slots_data)

        # Assert
        assert response.status_code == 401


class TestGetBusySlots:
    """Test GET /api/busy_slots/<event_id> endpoint."""

    def test_get_busy_slots_success(self, client, auth_headers, sample_event):
        """Test successful retrieval of busy slots."""
        # Arrange
        event_id = "event-123"

        mock_event = {
            **sample_event,
            "earliest_date": "2025-01-15T00:00:00+00:00",
            "latest_date": "2025-01-20T00:00:00+00:00"
        }

        mock_slots = [
            {"id": "slot-1", "start_time_utc": "2025-01-15T10:00:00+00:00", "end_time_utc": "2025-01-15T11:00:00+00:00"},
            {"id": "slot-2", "start_time_utc": "2025-01-16T14:00:00+00:00", "end_time_utc": "2025-01-16T15:00:00+00:00"}
        ]

        with patch("app.routes.busy_slots.EventsService") as mock_events_service, \
             patch("app.routes.busy_slots.busy_slots_service") as mock_busy_service:
            mock_events_instance = MagicMock()
            mock_events_instance.get_event.return_value = mock_event
            mock_events_service.return_value = mock_events_instance

            mock_busy_service.get_busy_slots.return_value = mock_slots

            # Act
            response = client.get(f"/api/busy_slots/{event_id}", headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert isinstance(data, list)
            assert len(data) == 2

    def test_get_busy_slots_event_not_found(self, client, auth_headers):
        """Test get busy slots for non-existent event."""
        # Arrange
        event_id = "nonexistent"

        with patch("app.routes.busy_slots.EventsService") as mock_events_service:
            mock_events_instance = MagicMock()
            mock_events_instance.get_event.return_value = None
            mock_events_service.return_value = mock_events_instance

            # Act
            response = client.get(f"/api/busy_slots/{event_id}", headers=auth_headers)

            # Assert
            assert response.status_code == 404
            data = response.get_json()
            assert "error" in data

    def test_get_busy_slots_no_auth(self, client):
        """Test get busy slots without authentication token."""
        # Act
        response = client.get("/api/busy_slots/event-123")

        # Assert
        assert response.status_code == 401


class TestGetUserBusySlots:
    """Test GET /api/busy_slots/user/<target_user_id> endpoint."""

    def test_get_user_busy_slots_success(self, client, auth_headers, sample_event):
        """Test successful retrieval of user's busy slots."""
        # Arrange
        target_user_id = "user-2"
        event_id = "event-123"

        mock_event = {
            **sample_event,
            "earliest_date": "2025-01-15T00:00:00+00:00",
            "latest_date": "2025-01-20T00:00:00+00:00"
        }

        mock_slots = [
            {"id": "slot-1", "user_id": target_user_id, "start_time_utc": "2025-01-15T10:00:00+00:00"}
        ]

        with patch("app.routes.busy_slots.EventsService") as mock_events_service, \
             patch("app.routes.busy_slots.busy_slots_service") as mock_busy_service:
            mock_events_instance = MagicMock()
            mock_events_instance.get_event.return_value = mock_event
            mock_events_service.return_value = mock_events_instance

            mock_busy_service.get_user_busy_slots.return_value = mock_slots

            # Act
            response = client.get(
                f"/api/busy_slots/user/{target_user_id}?event_id={event_id}",
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert isinstance(data, list)
            assert len(data) == 1

    def test_get_user_busy_slots_missing_event_id(self, client, auth_headers):
        """Test get user busy slots without event_id parameter."""
        # Arrange
        target_user_id = "user-2"

        # Act
        response = client.get(f"/api/busy_slots/user/{target_user_id}", headers=auth_headers)

        # Assert
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "event_id" in data["message"].lower()

    def test_get_user_busy_slots_no_auth(self, client):
        """Test get user busy slots without authentication token."""
        # Act
        response = client.get("/api/busy_slots/user/user-2?event_id=event-123")

        # Assert
        assert response.status_code == 401


class TestDeleteUserBusySlots:
    """Test DELETE /api/busy_slots/<event_id>/<target_user_id> endpoint."""

    def test_delete_user_busy_slots_success(self, client, auth_headers, sample_event):
        """Test successful deletion of user busy slots."""
        # Arrange
        event_id = "event-123"
        target_user_id = "user-2"

        mock_event = {
            **sample_event,
            "earliest_date": "2025-01-15T00:00:00+00:00",
            "latest_date": "2025-01-20T00:00:00+00:00"
        }

        with patch("app.routes.busy_slots.EventsService") as mock_events_service, \
             patch("app.routes.busy_slots.busy_slots_service") as mock_busy_service:
            mock_events_instance = MagicMock()
            mock_events_instance.get_event.return_value = mock_event
            mock_events_service.return_value = mock_events_instance

            mock_busy_service.delete_user_busy_slots_in_range.return_value = None

            # Act
            response = client.delete(
                f"/api/busy_slots/{event_id}/{target_user_id}",
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert "deleted successfully" in data["message"].lower()

    def test_delete_user_busy_slots_event_not_found(self, client, auth_headers):
        """Test delete user busy slots for non-existent event."""
        # Arrange
        event_id = "nonexistent"
        target_user_id = "user-2"

        with patch("app.routes.busy_slots.EventsService") as mock_events_service:
            mock_events_instance = MagicMock()
            mock_events_instance.get_event.return_value = None
            mock_events_service.return_value = mock_events_instance

            # Act
            response = client.delete(
                f"/api/busy_slots/{event_id}/{target_user_id}",
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 404
            data = response.get_json()
            assert "error" in data

    def test_delete_user_busy_slots_no_auth(self, client):
        """Test delete user busy slots without authentication token."""
        # Act
        response = client.delete("/api/busy_slots/event-123/user-2")

        # Assert
        assert response.status_code == 401


class TestSyncGoogleCalendar:
    """Test POST /api/busy_slots/sync/<target_user_id> endpoint."""

    def test_sync_google_calendar_success(self, client, auth_headers):
        """Test successful Google Calendar sync."""
        # Arrange
        target_user_id = "user-2"
        sync_data = {
            "start_date": "2025-01-15T00:00:00+00:00",
            "end_date": "2025-01-20T00:00:00+00:00"
        }

        with patch("app.routes.busy_slots.busy_slots_service") as mock_service:
            mock_service.sync_user_google_calendar.return_value = True

            # Act
            response = client.post(
                f"/api/busy_slots/sync/{target_user_id}",
                json=sync_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert "synced successfully" in data["message"].lower()

    def test_sync_google_calendar_missing_dates(self, client, auth_headers):
        """Test Google Calendar sync without required dates."""
        # Arrange
        target_user_id = "user-2"
        sync_data = {"start_date": "2025-01-15T00:00:00+00:00"}  # Missing end_date

        # Act
        response = client.post(
            f"/api/busy_slots/sync/{target_user_id}",
            json=sync_data,
            headers=auth_headers
        )

        # Assert
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "date" in data["message"].lower()

    def test_sync_google_calendar_failed(self, client, auth_headers):
        """Test Google Calendar sync failure."""
        # Arrange
        target_user_id = "user-2"
        sync_data = {
            "start_date": "2025-01-15T00:00:00+00:00",
            "end_date": "2025-01-20T00:00:00+00:00"
        }

        with patch("app.routes.busy_slots.busy_slots_service") as mock_service:
            mock_service.sync_user_google_calendar.return_value = False

            # Act
            response = client.post(
                f"/api/busy_slots/sync/{target_user_id}",
                json=sync_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data
            assert "sync" in data["message"].lower()

    def test_sync_google_calendar_no_auth(self, client):
        """Test Google Calendar sync without authentication token."""
        # Arrange
        target_user_id = "user-2"
        sync_data = {
            "start_date": "2025-01-15T00:00:00+00:00",
            "end_date": "2025-01-20T00:00:00+00:00"
        }

        # Act
        response = client.post(f"/api/busy_slots/sync/{target_user_id}", json=sync_data)

        # Assert
        assert response.status_code == 401


class TestGetEventParticipantsBusySlots:
    """Test GET /api/busy_slots/event/<event_id>/participants endpoint."""

    def test_get_participants_busy_slots_success(self, client, auth_headers, sample_event):
        """Test successful retrieval of participants' busy slots."""
        # Arrange
        event_id = "event-123"

        mock_event = {
            **sample_event,
            "earliest_date": "2025-01-15T00:00:00+00:00",
            "latest_date": "2025-01-20T00:00:00+00:00"
        }

        mock_slots = {
            "user-1": [
                {"start_time_utc": "2025-01-15T10:00:00+00:00", "end_time_utc": "2025-01-15T11:00:00+00:00"}
            ],
            "user-2": [
                {"start_time_utc": "2025-01-15T14:00:00+00:00", "end_time_utc": "2025-01-15T15:00:00+00:00"}
            ]
        }

        with patch("app.routes.busy_slots.EventsService") as mock_events_service, \
             patch("app.routes.busy_slots.busy_slots_service") as mock_busy_service:
            mock_events_instance = MagicMock()
            mock_events_instance.get_event.return_value = mock_event
            mock_events_service.return_value = mock_events_instance

            mock_busy_service.get_event_participants_busy_slots.return_value = mock_slots

            # Act
            response = client.get(
                f"/api/busy_slots/event/{event_id}/participants",
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert isinstance(data, dict)
            assert "user-1" in data
            assert "user-2" in data

    def test_get_participants_busy_slots_event_not_found(self, client, auth_headers):
        """Test get participants' busy slots for non-existent event."""
        # Arrange
        event_id = "nonexistent"

        with patch("app.routes.busy_slots.EventsService") as mock_events_service:
            mock_events_instance = MagicMock()
            mock_events_instance.get_event.return_value = None
            mock_events_service.return_value = mock_events_instance

            # Act
            response = client.get(
                f"/api/busy_slots/event/{event_id}/participants",
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 404
            data = response.get_json()
            assert "error" in data

    def test_get_participants_busy_slots_no_auth(self, client):
        """Test get participants' busy slots without authentication token."""
        # Act
        response = client.get("/api/busy_slots/event/event-123/participants")

        # Assert
        assert response.status_code == 401


class TestGetMergedBusySlots:
    """Test GET /api/busy_slots/event/<event_id>/merged endpoint."""

    def test_get_merged_busy_slots_success(self, client, auth_headers, sample_event):
        """Test successful retrieval of merged busy slots."""
        # Arrange
        event_id = "event-123"

        mock_event = {
            **sample_event,
            "uid": "abc123xyz456",
            "earliest_date": "2025-01-15T00:00:00+00:00",
            "latest_date": "2025-01-20T00:00:00+00:00"
        }

        mock_merged_slots = [
            {"start_time_utc": "2025-01-15T10:00:00+00:00", "end_time_utc": "2025-01-15T11:00:00+00:00"},
            {"start_time_utc": "2025-01-15T14:00:00+00:00", "end_time_utc": "2025-01-15T16:00:00+00:00"}
        ]

        with patch("app.routes.busy_slots.EventsService") as mock_events_service, \
             patch("app.routes.busy_slots.busy_slots_service") as mock_busy_service:
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = mock_event
            mock_events_service.return_value = mock_events_instance

            mock_busy_service.get_merged_busy_slots_for_event.return_value = mock_merged_slots

            # Act
            response = client.get(
                f"/api/busy_slots/event/{event_id}/merged",
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert "event_id" in data
            assert "merged_busy_slots" in data
            assert "total_slots" in data
            assert data["total_slots"] == 2
            assert len(data["merged_busy_slots"]) == 2

    def test_get_merged_busy_slots_by_uuid(self, client, auth_headers, sample_event):
        """Test merged busy slots retrieval by UUID fallback."""
        # Arrange
        event_id = "uuid-event-id"

        mock_event = {
            **sample_event,
            "id": event_id,
            "earliest_date": "2025-01-15T00:00:00+00:00",
            "latest_date": "2025-01-20T00:00:00+00:00"
        }

        mock_merged_slots = []

        with patch("app.routes.busy_slots.EventsService") as mock_events_service, \
             patch("app.routes.busy_slots.busy_slots_service") as mock_busy_service:
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = None
            mock_events_instance.get_event.return_value = mock_event
            mock_events_service.return_value = mock_events_instance

            mock_busy_service.get_merged_busy_slots_for_event.return_value = mock_merged_slots

            # Act
            response = client.get(
                f"/api/busy_slots/event/{event_id}/merged",
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert data["total_slots"] == 0

    def test_get_merged_busy_slots_event_not_found(self, client, auth_headers):
        """Test merged busy slots for non-existent event."""
        # Arrange
        event_id = "nonexistent"

        with patch("app.routes.busy_slots.EventsService") as mock_events_service:
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = None
            mock_events_instance.get_event.return_value = None
            mock_events_service.return_value = mock_events_instance

            # Act
            response = client.get(
                f"/api/busy_slots/event/{event_id}/merged",
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 404
            data = response.get_json()
            assert "error" in data
            assert "event" in data["message"].lower() and "found" in data["message"].lower()

    def test_get_merged_busy_slots_no_auth(self, client):
        """Test get merged busy slots without authentication token."""
        # Act
        response = client.get("/api/busy_slots/event/event-123/merged")

        # Assert
        assert response.status_code == 401
