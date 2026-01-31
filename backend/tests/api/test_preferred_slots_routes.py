"""
API endpoint tests for preferred slots routes.
Tests preferred slot management with authorization and finalization checks.
"""

import pytest
from unittest.mock import patch, MagicMock


class TestAddPreferredSlot:
    """Test POST /api/events/<event_id>/preferred-slots endpoint."""

    def test_add_preferred_slot_success(self, client, auth_headers, sample_event):
        """Test successful preferred slot creation."""
        event_uid = "abc123xyz456"
        request_data = {
            "start_time_utc": "2025-01-15T10:00:00Z",
            "end_time_utc": "2025-01-15T11:00:00Z"
        }

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "id": "event-db-id",
            "status": "planning"
        }

        mock_slot = {
            "id": "slot-123",
            "user_id": "user-1",
            "event_id": "event-db-id",
            "start_time_utc": request_data["start_time_utc"],
            "end_time_utc": request_data["end_time_utc"]
        }

        with patch("app.routes.preferred_slots.EventsService") as mock_events_service, \
             patch("app.routes.preferred_slots.PreferredSlotService") as mock_slot_service:
            # Mock EventsService
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = mock_event
            mock_events_service.return_value = mock_events_instance

            # Mock PreferredSlotService
            mock_slot_instance = MagicMock()
            mock_slot_instance.is_user_event_participant.return_value = True
            mock_slot_instance.validate_slot_data.return_value = True
            mock_slot_instance.insert_slot_simple.return_value = mock_slot
            mock_slot_service.return_value = mock_slot_instance

            # Act
            response = client.post(
                f"/api/events/{event_uid}/preferred-slots",
                json=request_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 201
            data = response.get_json()
            assert data["id"] == "slot-123"

    def test_add_preferred_slot_finalized_event(self, client, auth_headers, sample_event):
        """Test adding preferred slot to finalized event returns 400."""
        event_uid = "abc123xyz456"
        request_data = {
            "start_time_utc": "2025-01-15T10:00:00Z",
            "end_time_utc": "2025-01-15T11:00:00Z"
        }

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "id": "event-db-id",
            "status": "finalized"  # Event is finalized
        }

        with patch("app.routes.preferred_slots.EventsService") as mock_events_service, \
             patch("app.routes.preferred_slots.PreferredSlotService") as mock_slot_service:
            # Mock EventsService
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = mock_event
            mock_events_service.return_value = mock_events_instance

            # Mock PreferredSlotService
            mock_slot_instance = MagicMock()
            mock_slot_instance.is_user_event_participant.return_value = True
            mock_slot_service.return_value = mock_slot_instance

            # Act
            response = client.post(
                f"/api/events/{event_uid}/preferred-slots",
                json=request_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data
            assert "finalized" in data["message"].lower()

    def test_add_preferred_slot_not_participant(self, client, auth_headers, sample_event):
        """Test adding preferred slot when not a participant returns 403."""
        event_uid = "abc123xyz456"
        request_data = {
            "start_time_utc": "2025-01-15T10:00:00Z",
            "end_time_utc": "2025-01-15T11:00:00Z"
        }

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "id": "event-db-id",
            "status": "planning"
        }

        with patch("app.routes.preferred_slots.EventsService") as mock_events_service, \
             patch("app.routes.preferred_slots.PreferredSlotService") as mock_slot_service:
            # Mock EventsService
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = mock_event
            mock_events_service.return_value = mock_events_instance

            # Mock PreferredSlotService - user is NOT a participant
            mock_slot_instance = MagicMock()
            mock_slot_instance.is_user_event_participant.return_value = False
            mock_slot_service.return_value = mock_slot_instance

            # Act
            response = client.post(
                f"/api/events/{event_uid}/preferred-slots",
                json=request_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 403
            data = response.get_json()
            assert "error" in data
            assert "participant" in data["message"].lower()

    def test_add_preferred_slot_no_auth(self, client):
        """Test adding preferred slot without auth returns 401."""
        response = client.post(
            "/api/events/abc123/preferred-slots",
            json={"start_time_utc": "2025-01-15T10:00:00Z", "end_time_utc": "2025-01-15T11:00:00Z"}
        )
        assert response.status_code == 401


class TestDeletePreferredSlot:
    """Test DELETE /api/events/<event_id>/preferred-slots/<slot_id> endpoint."""

    def test_delete_preferred_slot_success(self, client, auth_headers, sample_event):
        """Test successful preferred slot deletion."""
        event_uid = "abc123xyz456"
        slot_id = "slot-123"

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "id": "event-db-id",
            "status": "planning"
        }

        mock_slot = {
            "id": slot_id,
            "user_id": "user-1",  # Same as auth user
            "event_id": "event-db-id",
            "start_time_utc": "2025-01-15T10:00:00Z",
            "end_time_utc": "2025-01-15T11:00:00Z"
        }

        with patch("app.routes.preferred_slots.EventsService") as mock_events_service, \
             patch("app.routes.preferred_slots.PreferredSlotService") as mock_slot_service:
            # Mock EventsService
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = mock_event
            mock_events_service.return_value = mock_events_instance

            # Mock PreferredSlotService
            mock_slot_instance = MagicMock()
            mock_slot_instance.get_slot_by_id.return_value = mock_slot
            mock_slot_instance.delete_slot.return_value = True
            mock_slot_service.return_value = mock_slot_instance

            # Act
            response = client.delete(
                f"/api/events/{event_uid}/preferred-slots/{slot_id}",
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert "deleted" in data["message"].lower()

    def test_delete_preferred_slot_finalized_event(self, client, auth_headers, sample_event):
        """Test deleting preferred slot from finalized event returns 400."""
        event_uid = "abc123xyz456"
        slot_id = "slot-123"

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "id": "event-db-id",
            "status": "finalized"  # Event is finalized
        }

        with patch("app.routes.preferred_slots.EventsService") as mock_events_service, \
             patch("app.routes.preferred_slots.PreferredSlotService") as mock_slot_service:
            # Mock EventsService
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = mock_event
            mock_events_service.return_value = mock_events_instance

            # Mock PreferredSlotService
            mock_slot_instance = MagicMock()
            mock_slot_service.return_value = mock_slot_instance

            # Act
            response = client.delete(
                f"/api/events/{event_uid}/preferred-slots/{slot_id}",
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data
            assert "finalized" in data["message"].lower()

    def test_delete_preferred_slot_not_owner(self, client, auth_headers, sample_event):
        """Test deleting someone else's preferred slot returns 403."""
        event_uid = "abc123xyz456"
        slot_id = "slot-123"

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "id": "event-db-id",
            "status": "planning"
        }

        mock_slot = {
            "id": slot_id,
            "user_id": "other-user",  # Different from auth user
            "event_id": "event-db-id",
            "start_time_utc": "2025-01-15T10:00:00Z",
            "end_time_utc": "2025-01-15T11:00:00Z"
        }

        with patch("app.routes.preferred_slots.EventsService") as mock_events_service, \
             patch("app.routes.preferred_slots.PreferredSlotService") as mock_slot_service:
            # Mock EventsService
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = mock_event
            mock_events_service.return_value = mock_events_instance

            # Mock PreferredSlotService
            mock_slot_instance = MagicMock()
            mock_slot_instance.get_slot_by_id.return_value = mock_slot
            mock_slot_service.return_value = mock_slot_instance

            # Act
            response = client.delete(
                f"/api/events/{event_uid}/preferred-slots/{slot_id}",
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 403
            data = response.get_json()
            assert "error" in data
            assert "own" in data["message"].lower()

    def test_delete_preferred_slot_not_found(self, client, auth_headers, sample_event):
        """Test deleting non-existent preferred slot returns 404."""
        event_uid = "abc123xyz456"
        slot_id = "nonexistent-slot"

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "id": "event-db-id",
            "status": "planning"
        }

        with patch("app.routes.preferred_slots.EventsService") as mock_events_service, \
             patch("app.routes.preferred_slots.PreferredSlotService") as mock_slot_service:
            # Mock EventsService
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = mock_event
            mock_events_service.return_value = mock_events_instance

            # Mock PreferredSlotService - slot not found
            mock_slot_instance = MagicMock()
            mock_slot_instance.get_slot_by_id.return_value = None
            mock_slot_service.return_value = mock_slot_instance

            # Act
            response = client.delete(
                f"/api/events/{event_uid}/preferred-slots/{slot_id}",
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 404
            data = response.get_json()
            assert "error" in data
            assert "slot" in data["message"].lower() and "found" in data["message"].lower()

    def test_delete_preferred_slot_no_auth(self, client):
        """Test deleting preferred slot without auth returns 401."""
        response = client.delete("/api/events/abc123/preferred-slots/slot-123")
        assert response.status_code == 401


class TestGetPreferredSlots:
    """Test GET /api/events/<event_id>/preferred-slots endpoint."""

    def test_get_preferred_slots_success(self, client, auth_headers, sample_event):
        """Test successful preferred slots retrieval."""
        event_uid = "abc123xyz456"

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "id": "event-db-id",
            "status": "planning"
        }

        mock_slots = [
            {
                "id": "slot-1",
                "user_id": "user-1",
                "event_id": "event-db-id",
                "start_time_utc": "2025-01-15T10:00:00Z",
                "end_time_utc": "2025-01-15T11:00:00Z"
            },
            {
                "id": "slot-2",
                "user_id": "user-2",
                "event_id": "event-db-id",
                "start_time_utc": "2025-01-15T14:00:00Z",
                "end_time_utc": "2025-01-15T15:00:00Z"
            }
        ]

        with patch("app.routes.preferred_slots.EventsService") as mock_events_service, \
             patch("app.routes.preferred_slots.PreferredSlotService") as mock_slot_service:
            # Mock EventsService
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = mock_event
            mock_events_service.return_value = mock_events_instance

            # Mock PreferredSlotService
            mock_slot_instance = MagicMock()
            mock_slot_instance.is_user_event_participant.return_value = True
            mock_slot_instance.get_slots_for_event.return_value = mock_slots
            mock_slot_service.return_value = mock_slot_instance

            # Act
            response = client.get(
                f"/api/events/{event_uid}/preferred-slots",
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert "slots" in data
            assert len(data["slots"]) == 2

    def test_get_preferred_slots_finalized_event_allowed(self, client, auth_headers, sample_event):
        """Test that getting preferred slots is allowed for finalized events (read-only)."""
        event_uid = "abc123xyz456"

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "id": "event-db-id",
            "status": "finalized"  # Event is finalized but GET should work
        }

        mock_slots = []

        with patch("app.routes.preferred_slots.EventsService") as mock_events_service, \
             patch("app.routes.preferred_slots.PreferredSlotService") as mock_slot_service:
            # Mock EventsService
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = mock_event
            mock_events_service.return_value = mock_events_instance

            # Mock PreferredSlotService
            mock_slot_instance = MagicMock()
            mock_slot_instance.is_user_event_participant.return_value = True
            mock_slot_instance.get_slots_for_event.return_value = mock_slots
            mock_slot_service.return_value = mock_slot_instance

            # Act
            response = client.get(
                f"/api/events/{event_uid}/preferred-slots",
                headers=auth_headers
            )

            # Assert - GET should still work for finalized events
            assert response.status_code == 200
            data = response.get_json()
            assert "slots" in data

    def test_get_preferred_slots_no_auth(self, client):
        """Test getting preferred slots without auth returns 401."""
        response = client.get("/api/events/abc123/preferred-slots")
        assert response.status_code == 401
