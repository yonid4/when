"""
API endpoint tests for invitation routes.
Tests invitation sending and retrieval with coordinator-only authorization.
"""

import pytest
from unittest.mock import patch, MagicMock


class TestSendInvitations:
    """Test POST /api/events/<event_uid>/invite endpoint."""

    def test_send_invitations_success(self, client, auth_headers, sample_event):
        """Test successful invitation sending by coordinator."""
        # Arrange
        event_uid = "abc123xyz456"
        invitation_data = {"emails": ["alice@example.com", "bob@example.com"]}

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "coordinator_id": "user-1",
            "name": "Team Meeting"
        }

        mock_invitees = [
            {"id": "user-2", "email_address": "alice@example.com", "full_name": "Alice"},
            {"id": "user-3", "email_address": "bob@example.com", "full_name": "Bob"}
        ]

        with patch("app.routes.invitations.service_role_client") as mock_service_client, \
             patch("app.routes.invitations.NotificationsService"):
            # Mock event lookup
            mock_event_response = MagicMock(data=[mock_event])
            mock_service_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_event_response

            # Mock coordinator profile
            mock_coordinator = MagicMock(data=[{"id": "user-1", "full_name": "Coordinator"}])

            # Mock invitee profiles and invitations
            def side_effect_func(*args):
                if args[0] == "events":
                    return MagicMock(select=lambda *a: MagicMock(eq=lambda *a: MagicMock(execute=lambda: mock_event_response)))
                elif args[0] == "profiles":
                    # Return different profiles based on the eq() filter
                    return MagicMock(
                        select=lambda *a: MagicMock(
                            eq=lambda k, v: MagicMock(
                                execute=lambda: mock_coordinator if v == "user-1" else MagicMock(data=[mock_invitees[0] if v == "alice@example.com" else mock_invitees[1]])
                            )
                        )
                    )
                elif args[0] == "event_invitations":
                    return MagicMock(
                        select=lambda *a: MagicMock(eq=lambda *a: MagicMock(eq=lambda *a: MagicMock(execute=lambda: MagicMock(data=[])))),
                        insert=lambda d: MagicMock(execute=lambda: MagicMock(data=[{"id": "inv-1"}]))
                    )
                elif args[0] == "event_participants":
                    return MagicMock(select=lambda *a: MagicMock(eq=lambda *a: MagicMock(eq=lambda *a: MagicMock(execute=lambda: MagicMock(data=[])))))
                return MagicMock()

            mock_service_client.table.side_effect = side_effect_func

            # Act
            response = client.post(
                f"/api/events/{event_uid}/invite",
                json=invitation_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert "results" in data
            assert "summary" in data
            assert data["summary"]["total"] == 2

    def test_send_invitations_not_coordinator(self, client, auth_headers, sample_event):
        """Test invitation sending by non-coordinator returns 403."""
        # Arrange
        event_uid = "abc123xyz456"
        invitation_data = {"emails": ["alice@example.com"]}

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "coordinator_id": "other-user",  # Different from auth user
            "name": "Team Meeting"
        }

        # Import the module to access service_role_client
        import app.routes.invitations as invitations_module

        # Create mock service role client
        mock_service_client = MagicMock()
        mock_event_response = MagicMock(data=[mock_event])
        mock_service_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_event_response

        # Store original and temporarily replace
        original_client = invitations_module.service_role_client
        invitations_module.service_role_client = mock_service_client

        try:
            # Act
            response = client.post(
                f"/api/events/{event_uid}/invite",
                json=invitation_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 403
            data = response.get_json()
            assert "error" in data
            assert "coordinator" in data["error"].lower()
        finally:
            # Restore original
            invitations_module.service_role_client = original_client

    def test_send_invitations_event_not_found(self, client, auth_headers):
        """Test invitation sending for non-existent event."""
        # Arrange
        event_uid = "nonexistent"
        invitation_data = {"emails": ["alice@example.com"]}

        with patch("app.routes.invitations.service_role_client") as mock_service_client:
            mock_service_client.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

            # Act
            response = client.post(
                f"/api/events/{event_uid}/invite",
                json=invitation_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 404
            data = response.get_json()
            assert "error" in data
            assert "found" in data["error"].lower()

    def test_send_invitations_no_emails(self, client, auth_headers):
        """Test invitation sending without emails."""
        # Arrange
        event_uid = "abc123xyz456"
        invitation_data = {"emails": []}

        # Act
        response = client.post(
            f"/api/events/{event_uid}/invite",
            json=invitation_data,
            headers=auth_headers
        )

        # Assert
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_send_invitations_no_auth(self, client):
        """Test send invitations without authentication token."""
        # Arrange
        event_uid = "abc123xyz456"
        invitation_data = {"emails": ["alice@example.com"]}

        # Act
        response = client.post(f"/api/events/{event_uid}/invite", json=invitation_data)

        # Assert
        assert response.status_code == 401


class TestGetEventInvitations:
    """Test GET /api/events/<event_uid>/invitations endpoint."""

    def test_get_invitations_success(self, client, auth_headers, sample_event):
        """Test successful retrieval of invitations by coordinator."""
        # Arrange
        event_uid = "abc123xyz456"

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "coordinator_id": "user-1"
        }

        mock_invitations = [
            {
                "id": "inv-1",
                "invitee_email": "alice@example.com",
                "status": "pending"
            },
            {
                "id": "inv-2",
                "invitee_email": "bob@example.com",
                "status": "accepted"
            }
        ]

        with patch("app.routes.invitations.service_role_client") as mock_service_client, \
             patch("app.routes.invitations.invitations_service") as mock_invitations_service:
            mock_event_response = MagicMock(data=[mock_event])
            mock_service_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_event_response

            mock_invitations_service.get_event_invitations.return_value = mock_invitations

            # Act
            response = client.get(f"/api/events/{event_uid}/invitations", headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert "invitations" in data
            assert len(data["invitations"]) == 2

    def test_get_invitations_not_coordinator(self, client, auth_headers, sample_event):
        """Test get invitations by non-coordinator returns 403."""
        # Arrange
        event_uid = "abc123xyz456"

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "coordinator_id": "other-user"  # Different from auth user
        }

        # Import the module to access service_role_client
        import app.routes.invitations as invitations_module

        # Create mock service role client
        mock_service_client = MagicMock()
        mock_event_response = MagicMock(data=[mock_event])
        mock_service_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_event_response

        # Store original and temporarily replace
        original_client = invitations_module.service_role_client
        invitations_module.service_role_client = mock_service_client

        try:
            # Act
            response = client.get(f"/api/events/{event_uid}/invitations", headers=auth_headers)

            # Assert
            assert response.status_code == 403
            data = response.get_json()
            assert "error" in data
            assert "coordinator" in data["error"].lower()
        finally:
            # Restore original
            invitations_module.service_role_client = original_client

    def test_get_invitations_event_not_found(self, client, auth_headers):
        """Test get invitations for non-existent event."""
        # Arrange
        event_uid = "nonexistent"

        with patch("app.routes.invitations.service_role_client") as mock_service_client:
            mock_service_client.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

            # Act
            response = client.get(f"/api/events/{event_uid}/invitations", headers=auth_headers)

            # Assert
            assert response.status_code == 404
            data = response.get_json()
            assert "error" in data

    def test_get_invitations_no_auth(self, client):
        """Test get invitations without authentication token."""
        # Act
        response = client.get("/api/events/abc123/invitations")

        # Assert
        assert response.status_code == 401


class TestHandleEventInvitationsPost:
    """Test POST /api/events/<event_uid>/invitations endpoint."""

    def test_post_invitations_success(self, client, auth_headers, sample_event):
        """Test successful invitation posting (same as /invite endpoint)."""
        # Arrange
        event_uid = "abc123xyz456"
        invitation_data = {"emails": ["alice@example.com"]}

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "coordinator_id": "user-1",
            "name": "Team Meeting"
        }

        mock_invitee = {"id": "user-2", "email_address": "alice@example.com", "full_name": "Alice"}

        with patch("app.routes.invitations.service_role_client") as mock_service_client, \
             patch("app.routes.invitations.NotificationsService"):
            # Setup mocks similar to send_invitations test
            mock_event_response = MagicMock(data=[mock_event])

            def side_effect_func(*args):
                if args[0] == "events":
                    return MagicMock(select=lambda *a: MagicMock(eq=lambda *a: MagicMock(execute=lambda: mock_event_response)))
                elif args[0] == "profiles":
                    return MagicMock(
                        select=lambda *a: MagicMock(
                            eq=lambda k, v: MagicMock(
                                execute=lambda: MagicMock(data=[{"id": "user-1", "full_name": "Coordinator"}]) if v == "user-1" else MagicMock(data=[mock_invitee])
                            )
                        )
                    )
                elif args[0] == "event_invitations":
                    return MagicMock(
                        select=lambda *a: MagicMock(eq=lambda *a: MagicMock(eq=lambda *a: MagicMock(execute=lambda: MagicMock(data=[])))),
                        insert=lambda d: MagicMock(execute=lambda: MagicMock(data=[{"id": "inv-1"}]))
                    )
                elif args[0] == "event_participants":
                    return MagicMock(select=lambda *a: MagicMock(eq=lambda *a: MagicMock(eq=lambda *a: MagicMock(execute=lambda: MagicMock(data=[])))))
                return MagicMock()

            mock_service_client.table.side_effect = side_effect_func

            # Act
            response = client.post(
                f"/api/events/{event_uid}/invitations",
                json=invitation_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert "results" in data
            assert "summary" in data

    def test_post_invitations_not_coordinator(self, client, auth_headers, sample_event):
        """Test POST invitations by non-coordinator returns 403."""
        # Arrange
        event_uid = "abc123xyz456"
        invitation_data = {"emails": ["alice@example.com"]}

        mock_event = {
            **sample_event,
            "uid": event_uid,
            "coordinator_id": "other-user"
        }

        with patch("app.routes.invitations.service_role_client") as mock_service_client:
            mock_event_response = MagicMock(data=[mock_event])
            mock_service_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_event_response

            # Act
            response = client.post(
                f"/api/events/{event_uid}/invitations",
                json=invitation_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 403
            data = response.get_json()
            assert "error" in data

    def test_post_invitations_no_auth(self, client):
        """Test POST invitations without authentication token."""
        # Arrange
        event_uid = "abc123xyz456"
        invitation_data = {"emails": ["alice@example.com"]}

        # Act
        response = client.post(f"/api/events/{event_uid}/invitations", json=invitation_data)

        # Assert
        assert response.status_code == 401
