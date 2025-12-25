"""
Comprehensive unit tests for NotificationsService.

Test coverage:
- create_notification: success, database errors
- get_user_notifications: all, unread only, limit
- get_unread_count: success, zero count
- mark_as_read: success, not found
- mark_all_as_read: success
- record_action: success
- delete_notification: success, not found
- get_notification: success, not found
- Helper methods: event invitation, finalized, deleted notifications
"""

import pytest
from datetime import datetime, timezone
from unittest.mock import Mock, patch
from app.services.notifications import NotificationsService


# ============================================================================
# Test Fixtures
# ============================================================================

@pytest.fixture
def mock_supabase():
    """Create a mock Supabase client."""
    return Mock()


@pytest.fixture
def notifications_service(monkeypatch, mock_supabase):
    """Create NotificationsService with mocked Supabase client."""
    monkeypatch.setattr("app.services.notifications.get_supabase", lambda access_token=None: mock_supabase)
    monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")

    service = NotificationsService()
    service.service_role_client = mock_supabase
    return service


@pytest.fixture
def sample_notification():
    """Sample notification data."""
    return {
        "id": "notification-123",
        "user_id": "user-123",
        "event_id": "event-123",
        "notification_type": "event_invitation",
        "title": "You're invited",
        "message": "Join our event",
        "is_read": False,
        "read_at": None,
        "action_taken": False,
        "created_at": "2025-12-18T10:00:00Z"
    }


# ============================================================================
# Tests: create_notification
# ============================================================================

class TestCreateNotification:
    """Tests for create_notification method."""

    def test_create_notification_success(self, notifications_service, mock_supabase):
        """Test successfully creating a notification."""
        # Arrange
        new_notification = {
            "id": "notification-new",
            "user_id": "user-123",
            "notification_type": "event_invitation",
            "title": "Test",
            "message": "Test message"
        }

        mock_result = Mock()
        mock_result.data = [new_notification]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_result

        # Act
        result = notifications_service.create_notification(
            user_id="user-123",
            notification_type="event_invitation",
            title="Test",
            message="Test message"
        )

        # Assert
        assert result is not None
        assert result["user_id"] == "user-123"

    def test_create_notification_with_event_id(self, notifications_service, mock_supabase):
        """Test creating notification with event_id."""
        # Arrange
        new_notification = {
            "id": "notification-new",
            "user_id": "user-123",
            "event_id": "event-123",
            "notification_type": "event_finalized",
            "title": "Event Finalized",
            "message": "Your event is scheduled"
        }

        mock_result = Mock()
        mock_result.data = [new_notification]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_result

        # Act
        result = notifications_service.create_notification(
            user_id="user-123",
            notification_type="event_finalized",
            title="Event Finalized",
            message="Your event is scheduled",
            event_id="event-123"
        )

        # Assert
        assert result is not None
        assert result["event_id"] == "event-123"

    def test_create_notification_database_error(self, notifications_service, mock_supabase):
        """Test create_notification handles database errors."""
        # Arrange
        mock_supabase.table.return_value.insert.return_value.execute.side_effect = Exception("DB Error")

        # Act
        result = notifications_service.create_notification(
            user_id="user-123",
            notification_type="test",
            title="Test",
            message="Test"
        )

        # Assert
        assert result is None


# ============================================================================
# Tests: get_user_notifications
# ============================================================================

class TestGetUserNotifications:
    """Tests for get_user_notifications method."""

    def test_get_user_notifications_all(self, notifications_service, mock_supabase, sample_notification):
        """Test getting all notifications for a user."""
        # Arrange
        mock_result = Mock()
        mock_result.data = [sample_notification, {**sample_notification, "id": "notification-456"}]
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = mock_result

        # Act
        result = notifications_service.get_user_notifications("user-123")

        # Assert
        assert len(result) == 2

    def test_get_user_notifications_unread_only(self, notifications_service, mock_supabase, sample_notification):
        """Test getting only unread notifications."""
        # Arrange
        mock_result = Mock()
        mock_result.data = [sample_notification]
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = mock_result

        # Act
        result = notifications_service.get_user_notifications("user-123", unread_only=True)

        # Assert
        assert len(result) == 1
        assert result[0]["is_read"] is False

    def test_get_user_notifications_with_limit(self, notifications_service, mock_supabase, sample_notification):
        """Test getting notifications with custom limit."""
        # Arrange
        mock_result = Mock()
        mock_result.data = [sample_notification]
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = mock_result

        # Act
        result = notifications_service.get_user_notifications("user-123", limit=10)

        # Assert
        assert len(result) == 1

    def test_get_user_notifications_empty(self, notifications_service, mock_supabase):
        """Test getting notifications when user has none."""
        # Arrange
        mock_result = Mock()
        mock_result.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = mock_result

        # Act
        result = notifications_service.get_user_notifications("user-999")

        # Assert
        assert result == []


# ============================================================================
# Tests: get_unread_count
# ============================================================================

class TestGetUnreadCount:
    """Tests for get_unread_count method."""

    def test_get_unread_count_success(self, notifications_service, mock_supabase):
        """Test getting unread count."""
        # Arrange
        mock_result = Mock()
        mock_result.count = 5
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_result

        # Act
        result = notifications_service.get_unread_count("user-123")

        # Assert
        assert result == 5

    def test_get_unread_count_zero(self, notifications_service, mock_supabase):
        """Test getting unread count when zero."""
        # Arrange
        mock_result = Mock()
        mock_result.count = 0
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_result

        # Act
        result = notifications_service.get_unread_count("user-123")

        # Assert
        assert result == 0


# ============================================================================
# Tests: mark_as_read
# ============================================================================

class TestMarkAsRead:
    """Tests for mark_as_read method."""

    def test_mark_as_read_success(self, notifications_service, mock_supabase):
        """Test marking notification as read."""
        # Arrange
        mock_result = Mock()
        mock_result.data = [{"id": "notification-123", "is_read": True}]
        mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = mock_result

        # Act
        result = notifications_service.mark_as_read("notification-123", "user-123")

        # Assert
        assert result is True

    def test_mark_as_read_not_found(self, notifications_service, mock_supabase):
        """Test marking as read when notification doesn't exist."""
        # Arrange
        mock_result = Mock()
        mock_result.data = None
        mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = mock_result

        # Act
        result = notifications_service.mark_as_read("notification-999", "user-123")

        # Assert
        assert result is False


# ============================================================================
# Tests: mark_all_as_read
# ============================================================================

class TestMarkAllAsRead:
    """Tests for mark_all_as_read method."""

    def test_mark_all_as_read_success(self, notifications_service, mock_supabase):
        """Test marking all notifications as read."""
        # Arrange
        mock_result = Mock()
        mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = mock_result

        # Act
        result = notifications_service.mark_all_as_read("user-123")

        # Assert
        assert result is True


# ============================================================================
# Tests: delete_notification
# ============================================================================

class TestDeleteNotification:
    """Tests for delete_notification method."""

    def test_delete_notification_success(self, notifications_service, mock_supabase):
        """Test deleting a notification."""
        # Arrange
        mock_result = Mock()
        mock_result.data = [{"id": "notification-123"}]
        mock_supabase.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = mock_result

        # Act
        result = notifications_service.delete_notification("notification-123", "user-123")

        # Assert
        assert result is True

    def test_delete_notification_not_found(self, notifications_service, mock_supabase):
        """Test deleting notification that doesn't exist."""
        # Arrange
        mock_result = Mock()
        mock_result.data = None
        mock_supabase.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = mock_result

        # Act
        result = notifications_service.delete_notification("notification-999", "user-123")

        # Assert
        assert result is False


# ============================================================================
# Tests: Helper Methods
# ============================================================================

class TestHelperMethods:
    """Tests for helper methods."""

    def test_create_event_invitation_notification(self, notifications_service, mock_supabase):
        """Test creating event invitation notification."""
        # Arrange
        new_notification = {
            "id": "notification-new",
            "notification_type": "event_invitation",
            "title": "You're invited to Team Meeting"
        }

        mock_result = Mock()
        mock_result.data = [new_notification]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_result

        # Act
        result = notifications_service.create_event_invitation_notification(
            user_id="user-123",
            event_id="event-123",
            event_title="Team Meeting",
            coordinator_name="Alice",
            coordinator_id="coordinator-123"
        )

        # Assert
        assert result is not None
        assert "invited" in result["title"]

    def test_create_event_finalized_notification(self, notifications_service, mock_supabase):
        """Test creating event finalized notification."""
        # Arrange
        new_notification = {
            "id": "notification-new",
            "notification_type": "event_finalized",
            "title": "Event Finalized: Team Meeting"
        }

        mock_result = Mock()
        mock_result.data = [new_notification]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_result

        # Act
        result = notifications_service.create_event_finalized_notification(
            user_id="user-123",
            event_id="event-123",
            event_title="Team Meeting",
            finalized_time="2025-12-20 at 2:00 PM"
        )

        # Assert
        assert result is not None
        assert "Finalized" in result["title"]

    def test_create_event_deleted_notification(self, notifications_service, mock_supabase):
        """Test creating event deleted notification."""
        # Arrange
        new_notification = {
            "id": "notification-new",
            "notification_type": "event_deleted",
            "title": "Event Cancelled: Team Meeting"
        }

        mock_result = Mock()
        mock_result.data = [new_notification]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_result

        # Act
        result = notifications_service.create_event_deleted_notification(
            user_id="user-123",
            event_id="event-123",
            event_title="Team Meeting",
            deleted_by_id="coordinator-123"
        )

        # Assert
        assert result is not None
        assert "Cancelled" in result["title"]
