"""
API endpoint tests for notification routes.
Tests notification retrieval, actions, and ownership validation.
"""

import pytest
from unittest.mock import patch, MagicMock


class TestGetNotifications:
    """Test GET /api/notifications endpoint."""

    def test_get_notifications_success(self, client, auth_headers):
        """Test successful retrieval of notifications."""
        # Arrange
        mock_notifications = [
            {
                "id": "notif-1",
                "notification_type": "event_invitation",
                "message": "You've been invited",
                "is_read": False
            },
            {
                "id": "notif-2",
                "notification_type": "event_updated",
                "message": "Event updated",
                "is_read": True
            }
        ]

        with patch("app.routes.notifications.NotificationsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_user_notifications.return_value = mock_notifications
            mock_service_instance.get_unread_count.return_value = 1
            mock_service.return_value = mock_service_instance

            # Act
            response = client.get("/api/notifications", headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert "notifications" in data
            assert "unread_count" in data
            assert len(data["notifications"]) == 2
            assert data["unread_count"] == 1

    def test_get_notifications_unread_only(self, client, auth_headers):
        """Test retrieval of unread notifications only."""
        # Arrange
        mock_notifications = [
            {
                "id": "notif-1",
                "notification_type": "event_invitation",
                "message": "You've been invited",
                "is_read": False
            }
        ]

        with patch("app.routes.notifications.NotificationsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_user_notifications.return_value = mock_notifications
            mock_service_instance.get_unread_count.return_value = 1
            mock_service.return_value = mock_service_instance

            # Act
            response = client.get("/api/notifications?unread_only=true", headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert len(data["notifications"]) == 1

    def test_get_notifications_with_limit(self, client, auth_headers):
        """Test retrieval with limit parameter."""
        # Arrange
        mock_notifications = [{"id": f"notif-{i}"} for i in range(10)]

        with patch("app.routes.notifications.NotificationsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_user_notifications.return_value = mock_notifications
            mock_service_instance.get_unread_count.return_value = 10
            mock_service.return_value = mock_service_instance

            # Act
            response = client.get("/api/notifications?limit=10", headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert len(data["notifications"]) == 10

    def test_get_notifications_empty(self, client, auth_headers):
        """Test retrieval when user has no notifications."""
        # Arrange
        with patch("app.routes.notifications.NotificationsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_user_notifications.return_value = []
            mock_service_instance.get_unread_count.return_value = 0
            mock_service.return_value = mock_service_instance

            # Act
            response = client.get("/api/notifications", headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert len(data["notifications"]) == 0
            assert data["unread_count"] == 0

    def test_get_notifications_no_auth(self, client):
        """Test get notifications without authentication token."""
        # Act
        response = client.get("/api/notifications")

        # Assert
        assert response.status_code == 401


class TestGetUnreadCount:
    """Test GET /api/notifications/unread-count endpoint."""

    def test_get_unread_count_success(self, client, auth_headers):
        """Test successful retrieval of unread count."""
        # Arrange
        with patch("app.routes.notifications.NotificationsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_unread_count.return_value = 5
            mock_service.return_value = mock_service_instance

            # Act
            response = client.get("/api/notifications/unread-count", headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert data["unread_count"] == 5

    def test_get_unread_count_zero(self, client, auth_headers):
        """Test unread count when no unread notifications."""
        # Arrange
        with patch("app.routes.notifications.NotificationsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_unread_count.return_value = 0
            mock_service.return_value = mock_service_instance

            # Act
            response = client.get("/api/notifications/unread-count", headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert data["unread_count"] == 0

    def test_get_unread_count_no_auth(self, client):
        """Test get unread count without authentication token."""
        # Act
        response = client.get("/api/notifications/unread-count")

        # Assert
        assert response.status_code == 401


class TestMarkAsRead:
    """Test POST /api/notifications/<notification_id>/read endpoint."""

    def test_mark_as_read_success(self, client, auth_headers):
        """Test successful marking notification as read."""
        # Arrange
        notification_id = "notif-1"
        mock_notification = {
            "id": notification_id,
            "user_id": "user-1",
            "is_read": False
        }

        with patch("app.routes.notifications.NotificationsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_notification.return_value = mock_notification
            mock_service_instance.mark_as_read.return_value = True
            mock_service.return_value = mock_service_instance

            # Act
            response = client.post(f"/api/notifications/{notification_id}/read", headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert data["success"] is True

    def test_mark_as_read_not_found(self, client, auth_headers):
        """Test marking non-existent notification as read."""
        # Arrange
        notification_id = "nonexistent"

        with patch("app.routes.notifications.NotificationsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_notification.return_value = None
            mock_service.return_value = mock_service_instance

            # Act
            response = client.post(f"/api/notifications/{notification_id}/read", headers=auth_headers)

            # Assert
            assert response.status_code == 404
            data = response.get_json()
            assert "error" in data

    def test_mark_as_read_failed(self, client, auth_headers):
        """Test marking as read when operation fails."""
        # Arrange
        notification_id = "notif-1"
        mock_notification = {"id": notification_id}

        with patch("app.routes.notifications.NotificationsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_notification.return_value = mock_notification
            mock_service_instance.mark_as_read.return_value = False
            mock_service.return_value = mock_service_instance

            # Act
            response = client.post(f"/api/notifications/{notification_id}/read", headers=auth_headers)

            # Assert
            assert response.status_code == 500
            data = response.get_json()
            assert "error" in data

    def test_mark_as_read_no_auth(self, client):
        """Test mark as read without authentication token."""
        # Act
        response = client.post("/api/notifications/notif-1/read")

        # Assert
        assert response.status_code == 401


class TestMarkAllAsRead:
    """Test POST /api/notifications/read-all endpoint."""

    def test_mark_all_as_read_success(self, client, auth_headers):
        """Test successful marking all notifications as read."""
        # Arrange
        with patch("app.routes.notifications.NotificationsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.mark_all_as_read.return_value = True
            mock_service.return_value = mock_service_instance

            # Act
            response = client.post("/api/notifications/read-all", headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert data["success"] is True

    def test_mark_all_as_read_failed(self, client, auth_headers):
        """Test mark all as read when operation fails."""
        # Arrange
        with patch("app.routes.notifications.NotificationsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.mark_all_as_read.return_value = False
            mock_service.return_value = mock_service_instance

            # Act
            response = client.post("/api/notifications/read-all", headers=auth_headers)

            # Assert
            assert response.status_code == 500
            data = response.get_json()
            assert "error" in data

    def test_mark_all_as_read_no_auth(self, client):
        """Test mark all as read without authentication token."""
        # Act
        response = client.post("/api/notifications/read-all")

        # Assert
        assert response.status_code == 401


class TestHandleNotificationAction:
    """Test POST /api/notifications/<notification_id>/action endpoint."""

    def test_action_accept_success(self, client, auth_headers, sample_event):
        """Test successful invitation acceptance."""
        # Arrange
        notification_id = "notif-1"
        action_data = {"action": "accept"}

        mock_notification = {
            "id": notification_id,
            "notification_type": "event_invitation",
            "action_taken": False,
            "event_id": "event-123",
            "metadata": {"invitation_id": "inv-1"}
        }

        with patch("app.routes.notifications.NotificationsService") as mock_notif_service, \
             patch("app.routes.notifications.EventsService") as mock_events_service, \
             patch("app.routes.notifications.InvitationsService") as mock_inv_service, \
             patch("app.routes.notifications.service_role_client") as mock_service_client:
            # Mock NotificationsService
            mock_notif_instance = MagicMock()
            mock_notif_instance.get_notification.return_value = mock_notification
            mock_notif_instance.record_action.return_value = True
            mock_notif_service.return_value = mock_notif_instance

            # Mock EventsService
            mock_events_instance = MagicMock()
            mock_events_instance.get_event.return_value = {**sample_event, "uid": "abc123"}
            mock_events_instance.add_participant.return_value = {"id": "participant-1"}
            mock_events_service.return_value = mock_events_instance

            # Mock service role client for event lookup
            mock_service_client.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{**sample_event, "uid": "abc123"}]
            )

            # Mock InvitationsService
            mock_inv_instance = MagicMock()
            mock_inv_instance.update_invitation_status.return_value = True
            mock_inv_service.return_value = mock_inv_instance

            # Act
            response = client.post(
                f"/api/notifications/{notification_id}/action",
                json=action_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert data["success"] is True
            assert data["action"] == "accept"
            assert "event_uid" in data

    def test_action_decline_success(self, client, auth_headers):
        """Test successful invitation decline."""
        # Arrange
        notification_id = "notif-1"
        action_data = {"action": "decline"}

        mock_notification = {
            "id": notification_id,
            "notification_type": "event_invitation",
            "action_taken": False,
            "event_id": "event-123",
            "metadata": {"invitation_id": "inv-1"}
        }

        with patch("app.routes.notifications.NotificationsService") as mock_notif_service, \
             patch("app.routes.notifications.InvitationsService") as mock_inv_service:
            # Mock NotificationsService
            mock_notif_instance = MagicMock()
            mock_notif_instance.get_notification.return_value = mock_notification
            mock_notif_instance.record_action.return_value = True
            mock_notif_service.return_value = mock_notif_instance

            # Mock InvitationsService
            mock_inv_instance = MagicMock()
            mock_inv_instance.update_invitation_status.return_value = True
            mock_inv_service.return_value = mock_inv_instance

            # Act
            response = client.post(
                f"/api/notifications/{notification_id}/action",
                json=action_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert data["success"] is True
            assert data["action"] == "decline"

    def test_action_invalid_action(self, client, auth_headers):
        """Test notification action with invalid action type."""
        # Arrange
        notification_id = "notif-1"
        action_data = {"action": "invalid"}

        # Act
        response = client.post(
            f"/api/notifications/{notification_id}/action",
            json=action_data,
            headers=auth_headers
        )

        # Assert
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "action" in data["message"].lower()

    def test_action_notification_not_found(self, client, auth_headers):
        """Test action on non-existent notification."""
        # Arrange
        notification_id = "nonexistent"
        action_data = {"action": "accept"}

        with patch("app.routes.notifications.NotificationsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_notification.return_value = None
            mock_service.return_value = mock_service_instance

            # Act
            response = client.post(
                f"/api/notifications/{notification_id}/action",
                json=action_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 404
            data = response.get_json()
            assert "error" in data

    def test_action_wrong_notification_type(self, client, auth_headers):
        """Test action on non-invitation notification type."""
        # Arrange
        notification_id = "notif-1"
        action_data = {"action": "accept"}

        mock_notification = {
            "id": notification_id,
            "notification_type": "event_updated",  # Not an invitation
            "action_taken": False
        }

        with patch("app.routes.notifications.NotificationsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_notification.return_value = mock_notification
            mock_service.return_value = mock_service_instance

            # Act
            response = client.post(
                f"/api/notifications/{notification_id}/action",
                json=action_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data
            assert "notification type" in data["message"].lower()

    def test_action_already_taken(self, client, auth_headers):
        """Test action on notification where action already taken."""
        # Arrange
        notification_id = "notif-1"
        action_data = {"action": "accept"}

        mock_notification = {
            "id": notification_id,
            "notification_type": "event_invitation",
            "action_taken": True,
            "action_type": "accept"
        }

        with patch("app.routes.notifications.NotificationsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.get_notification.return_value = mock_notification
            mock_service.return_value = mock_service_instance

            # Act
            response = client.post(
                f"/api/notifications/{notification_id}/action",
                json=action_data,
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 400
            data = response.get_json()
            assert "error" in data
            assert "already" in data["message"].lower()

    def test_action_no_auth(self, client):
        """Test notification action without authentication token."""
        # Arrange
        notification_id = "notif-1"
        action_data = {"action": "accept"}

        # Act
        response = client.post(f"/api/notifications/{notification_id}/action", json=action_data)

        # Assert
        assert response.status_code == 401


class TestDeleteNotification:
    """Test DELETE /api/notifications/<notification_id> endpoint."""

    def test_delete_notification_success(self, client, auth_headers):
        """Test successful notification deletion."""
        # Arrange
        notification_id = "notif-1"

        with patch("app.routes.notifications.NotificationsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.delete_notification.return_value = True
            mock_service.return_value = mock_service_instance

            # Act
            response = client.delete(f"/api/notifications/{notification_id}", headers=auth_headers)

            # Assert
            assert response.status_code == 200
            data = response.get_json()
            assert data["success"] is True

    def test_delete_notification_not_found(self, client, auth_headers):
        """Test deletion of non-existent notification."""
        # Arrange
        notification_id = "nonexistent"

        with patch("app.routes.notifications.NotificationsService") as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.delete_notification.return_value = False
            mock_service.return_value = mock_service_instance

            # Act
            response = client.delete(f"/api/notifications/{notification_id}", headers=auth_headers)

            # Assert
            assert response.status_code == 404
            data = response.get_json()
            assert "error" in data

    def test_delete_notification_no_auth(self, client):
        """Test delete notification without authentication token."""
        # Act
        response = client.delete("/api/notifications/notif-1")

        # Assert
        assert response.status_code == 401
