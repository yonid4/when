"""
API endpoint tests for time proposal routes.
Tests AI-powered time proposal generation with authorization checks.
"""

import pytest
from unittest.mock import patch, MagicMock


class TestProposeTimes:
    """Test POST /api/events/<event_uid>/propose-times endpoint."""

    def test_propose_times_success_participant(self, client, auth_headers, sample_event):
        """Test successful proposal retrieval by participant."""
        # Arrange
        event_uid = "abc123xyz456"
        request_data = {"num_suggestions": 5}

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "coordinator_id": "other-user",
            "status": "planning"
        }

        mock_proposals = [
            {
                "start_time": "2025-01-15T10:00:00Z",
                "end_time": "2025-01-15T11:00:00Z",
                "conflicts": 0,
                "preferredCount": 3
            },
            {
                "start_time": "2025-01-15T14:00:00Z",
                "end_time": "2025-01-15T15:00:00Z",
                "conflicts": 1,
                "preferredCount": 2
            }
        ]

        with patch("app.routes.time_proposal.EventsService") as mock_events_service, \
             patch("app.routes.time_proposal.TimeProposalService") as mock_proposal_service:
            # Mock EventsService
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = mock_event
            mock_events_instance.is_user_participant.return_value = True
            mock_events_service.return_value = mock_events_instance

            # Mock TimeProposalService
            mock_proposal_instance = MagicMock()
            mock_proposal_instance.should_regenerate.return_value = {
                "has_proposals": True,
                "needs_regeneration": False,
                "all_expired": False,
                "last_generated_at": "2025-01-15T09:00:00Z"
            }
            mock_proposal_instance.get_cached_proposals.return_value = {
                "proposals": mock_proposals,
                "all_expired": False,
                "total_cached": 2,
                "filtered_count": 2
            }
            mock_proposal_service.return_value = mock_proposal_instance

            # Act
            response = client.post(
                f"/api/events/{event_uid}/propose-times",
                json=request_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert data["success"] is True
            assert data["cached"] is True
            assert len(data["proposals"]) == 2
            assert data["needs_update"] is False
            assert data["all_expired"] is False

    def test_propose_times_success_coordinator(self, client, auth_headers, sample_event):
        """Test successful proposal retrieval by coordinator."""
        # Arrange
        event_uid = "abc123xyz456"
        request_data = {"num_suggestions": 5}

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "coordinator_id": "user-1",  # Same as auth user
            "status": "planning"
        }

        mock_proposals = [
            {
                "start_time": "2025-01-15T10:00:00Z",
                "end_time": "2025-01-15T11:00:00Z",
                "conflicts": 0,
                "preferredCount": 3
            }
        ]

        with patch("app.routes.time_proposal.EventsService") as mock_events_service, \
             patch("app.routes.time_proposal.TimeProposalService") as mock_proposal_service:
            # Mock EventsService
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = mock_event
            mock_events_service.return_value = mock_events_instance

            # Mock TimeProposalService
            mock_proposal_instance = MagicMock()
            mock_proposal_instance.should_regenerate.return_value = {
                "has_proposals": True,
                "needs_regeneration": False,
                "all_expired": False,
                "last_generated_at": "2025-01-15T09:00:00Z"
            }
            mock_proposal_instance.get_cached_proposals.return_value = {
                "proposals": mock_proposals,
                "all_expired": False,
                "total_cached": 1,
                "filtered_count": 1
            }
            mock_proposal_service.return_value = mock_proposal_instance

            # Act
            response = client.post(
                f"/api/events/{event_uid}/propose-times",
                json=request_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert data["success"] is True

    def test_propose_times_force_refresh_coordinator(self, client, auth_headers, sample_event):
        """Test force refresh by coordinator."""
        # Arrange
        event_uid = "abc123xyz456"
        request_data = {"num_suggestions": 5, "force_refresh": True}

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "coordinator_id": "user-1",  # Same as auth user
            "status": "planning"
        }

        mock_proposals = [
            {
                "start_time": "2025-01-15T10:00:00Z",
                "end_time": "2025-01-15T11:00:00Z",
                "conflicts": 0,
                "preferredCount": 3
            }
        ]

        with patch("app.routes.time_proposal.EventsService") as mock_events_service, \
             patch("app.routes.time_proposal.TimeProposalService") as mock_proposal_service:
            # Mock EventsService
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = mock_event
            mock_events_service.return_value = mock_events_instance

            # Mock TimeProposalService
            mock_proposal_instance = MagicMock()
            mock_proposal_instance.should_regenerate.return_value = {
                "has_proposals": True,
                "needs_regeneration": False,
                "all_expired": False,
                "last_generated_at": "2025-01-15T09:00:00Z"
            }
            mock_proposal_instance.regenerate_proposals_immediately.return_value = mock_proposals
            mock_proposal_service.return_value = mock_proposal_instance

            # Act
            response = client.post(
                f"/api/events/{event_uid}/propose-times",
                json=request_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert data["success"] is True
            assert data["cached"] is False
            assert data["needs_update"] is False
            assert data["all_expired"] is False

    def test_propose_times_force_refresh_non_coordinator(self, client, auth_headers, sample_event):
        """Test force refresh by non-coordinator returns 403."""
        # Arrange
        event_uid = "abc123xyz456"
        request_data = {"num_suggestions": 5, "force_refresh": True}

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "coordinator_id": "other-user",  # Different from auth user
            "status": "planning"
        }

        with patch("app.routes.time_proposal.EventsService") as mock_events_service:
            # Mock EventsService
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = mock_event
            mock_events_instance.is_user_participant.return_value = True
            mock_events_service.return_value = mock_events_instance

            # Act
            response = client.post(
                f"/api/events/{event_uid}/propose-times",
                json=request_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 403
            data = response.get_json()
            assert "error" in data
            assert "coordinator" in data["message"].lower()

    def test_propose_times_not_participant(self, client, auth_headers, sample_event):
        """Test proposal retrieval by non-participant returns 403."""
        # Arrange
        event_uid = "abc123xyz456"
        request_data = {"num_suggestions": 5}

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "coordinator_id": "other-user",
            "status": "planning"
        }

        with patch("app.routes.time_proposal.EventsService") as mock_events_service:
            # Mock EventsService
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = mock_event
            mock_events_instance.is_user_participant.return_value = False
            mock_events_service.return_value = mock_events_instance

            # Act
            response = client.post(
                f"/api/events/{event_uid}/propose-times",
                json=request_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 403
            data = response.get_json()
            assert "error" in data
            assert "participant" in data["message"].lower()

    def test_propose_times_event_not_found(self, client, auth_headers):
        """Test proposal retrieval for non-existent event."""
        # Arrange
        event_uid = "nonexistent"
        request_data = {"num_suggestions": 5}

        with patch("app.routes.time_proposal.EventsService") as mock_events_service:
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = None
            mock_events_service.return_value = mock_events_instance

            # Act
            response = client.post(
                f"/api/events/{event_uid}/propose-times",
                json=request_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 404
            data = response.get_json()
            assert "error" in data
            assert "not found" in data["message"].lower()

    def test_propose_times_event_finalized(self, client, auth_headers, sample_event):
        """Test proposal retrieval for finalized event."""
        # Arrange
        event_uid = "abc123xyz456"
        request_data = {"num_suggestions": 5}

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "coordinator_id": "user-1",
            "status": "finalized"
        }

        with patch("app.routes.time_proposal.EventsService") as mock_events_service:
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = mock_event
            mock_events_service.return_value = mock_events_instance

            # Act
            response = client.post(
                f"/api/events/{event_uid}/propose-times",
                json=request_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data
            assert "finalized" in data["message"].lower()

    def test_propose_times_invalid_num_suggestions(self, client, auth_headers, sample_event):
        """Test proposal with invalid num_suggestions parameter."""
        # Arrange
        event_uid = "abc123xyz456"
        request_data = {"num_suggestions": 25}  # Max is 20

        with patch("app.routes.time_proposal.EventsService") as mock_events_service:
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = sample_event
            mock_events_service.return_value = mock_events_instance

            # Act
            response = client.post(
                f"/api/events/{event_uid}/propose-times",
                json=request_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data
            assert "num_suggestions" in data["message"].lower()

    def test_propose_times_no_participants(self, client, auth_headers, sample_event):
        """Test proposal generation with no participants."""
        # Arrange
        event_uid = "abc123xyz456"
        request_data = {"num_suggestions": 5}

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "coordinator_id": "user-1",
            "status": "planning"
        }

        with patch("app.routes.time_proposal.EventsService") as mock_events_service, \
             patch("app.routes.time_proposal.TimeProposalService") as mock_proposal_service:
            # Mock EventsService
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = mock_event
            mock_events_service.return_value = mock_events_instance

            # Mock TimeProposalService to raise error
            mock_proposal_instance = MagicMock()
            mock_proposal_instance.should_regenerate.return_value = {
                "has_proposals": False,
                "needs_regeneration": False,
                "all_expired": False
            }
            # Error message must contain "no participants" to trigger the right error handling
            mock_proposal_instance.propose_times.side_effect = Exception("no participants available")
            mock_proposal_service.return_value = mock_proposal_instance

            # Act
            response = client.post(
                f"/api/events/{event_uid}/propose-times",
                json=request_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data
            assert "participants" in data["message"].lower()

    def test_propose_times_no_availability(self, client, auth_headers, sample_event):
        """Test proposal generation with no available time slots."""
        # Arrange
        event_uid = "abc123xyz456"
        request_data = {"num_suggestions": 5}

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "coordinator_id": "user-1",
            "status": "planning"
        }

        with patch("app.routes.time_proposal.EventsService") as mock_events_service, \
             patch("app.routes.time_proposal.TimeProposalService") as mock_proposal_service:
            # Mock EventsService
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = mock_event
            mock_events_service.return_value = mock_events_instance

            # Mock TimeProposalService to raise error
            mock_proposal_instance = MagicMock()
            mock_proposal_instance.should_regenerate.return_value = {
                "has_proposals": False,
                "needs_regeneration": False,
                "all_expired": False
            }
            mock_proposal_instance.propose_times.side_effect = Exception("No available time slots found")
            mock_proposal_service.return_value = mock_proposal_instance

            # Act
            response = client.post(
                f"/api/events/{event_uid}/propose-times",
                json=request_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data
            assert "availability" in data["message"].lower()

    def test_propose_times_rate_limit(self, client, auth_headers, sample_event):
        """Test proposal generation with rate limit error."""
        # Arrange
        event_uid = "abc123xyz456"
        request_data = {"num_suggestions": 5}

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "coordinator_id": "user-1",
            "status": "planning"
        }

        with patch("app.routes.time_proposal.EventsService") as mock_events_service, \
             patch("app.routes.time_proposal.TimeProposalService") as mock_proposal_service:
            # Mock EventsService
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = mock_event
            mock_events_service.return_value = mock_events_instance

            # Mock TimeProposalService to raise rate limit error
            mock_proposal_instance = MagicMock()
            mock_proposal_instance.should_regenerate.return_value = {
                "has_proposals": False,
                "needs_regeneration": False,
                "all_expired": False
            }
            mock_proposal_instance.propose_times.side_effect = Exception("Rate limit exceeded")
            mock_proposal_service.return_value = mock_proposal_instance

            # Act
            response = client.post(
                f"/api/events/{event_uid}/propose-times",
                json=request_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 429
            data = response.get_json()
            assert "error" in data
            assert "rate limit" in data["message"].lower()

    def test_propose_times_no_auth(self, client):
        """Test propose times without authentication token."""
        # Arrange
        event_uid = "abc123xyz456"
        request_data = {"num_suggestions": 5}

        # Act
        response = client.post(f"/api/events/{event_uid}/propose-times", json=request_data)

        # Assert
        assert response.status_code == 401

    def test_propose_times_all_expired(self, client, auth_headers, sample_event):
        """Test proposal retrieval when all cached proposals are expired."""
        # Arrange
        event_uid = "abc123xyz456"
        request_data = {"num_suggestions": 5}

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "coordinator_id": "user-1",
            "status": "planning"
        }

        with patch("app.routes.time_proposal.EventsService") as mock_events_service, \
             patch("app.routes.time_proposal.TimeProposalService") as mock_proposal_service:
            # Mock EventsService
            mock_events_instance = MagicMock()
            mock_events_instance.get_event_by_uid.return_value = mock_event
            mock_events_service.return_value = mock_events_instance

            # Mock TimeProposalService - all proposals expired
            mock_proposal_instance = MagicMock()
            mock_proposal_instance.should_regenerate.return_value = {
                "has_proposals": True,
                "needs_regeneration": True,
                "all_expired": True,
                "last_generated_at": "2025-01-10T09:00:00Z"
            }
            mock_proposal_service.return_value = mock_proposal_instance

            # Act
            response = client.post(
                f"/api/events/{event_uid}/propose-times",
                json=request_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert data["success"] is True
            assert data["all_expired"] is True
            assert data["needs_update"] is True
            assert "message" in data
            assert "passed" in data["message"].lower()


class TestProposalTestEndpoint:
    """Test GET /api/events/<event_uid>/propose-times/test endpoint."""

    def test_test_endpoint_success(self, client, auth_headers):
        """Test the test endpoint works."""
        # Arrange
        event_uid = "abc123xyz456"

        # Act
        response = client.get(f"/api/events/{event_uid}/propose-times/test", headers=auth_headers)

        # Assert
        assert response.status_code == 200
        data = response.get_json()
        assert "message" in data
        assert data["event_uid"] == event_uid

    def test_test_endpoint_no_auth(self, client):
        """Test test endpoint without authentication token."""
        # Act
        response = client.get("/api/events/abc123/propose-times/test")

        # Assert
        assert response.status_code == 401
