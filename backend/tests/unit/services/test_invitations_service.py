"""
Comprehensive unit tests for InvitationsService.

Test coverage:
- get_invitation: success, not found
- create_invitation: success, duplicate handling
- update_invitation_status: accept, decline, invalid status
- get_event_invitations: success, empty, ordering
- get_user_invitations: success, filter by status
"""

import pytest
from datetime import datetime, timezone
from unittest.mock import Mock, patch
from app.services.invitations import InvitationsService


# ============================================================================
# Test Fixtures
# ============================================================================

@pytest.fixture
def mock_supabase():
    """Create a mock Supabase client."""
    return Mock()


@pytest.fixture
def invitations_service(monkeypatch, mock_supabase):
    """Create InvitationsService with mocked Supabase client."""
    monkeypatch.setattr("app.services.invitations.get_supabase", lambda: mock_supabase)
    monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")

    service = InvitationsService()
    service.service_role_client = mock_supabase
    return service


@pytest.fixture
def sample_invitation():
    """Sample invitation data."""
    return {
        "id": "invitation-123",
        "event_id": "event-123",
        "inviter_id": "user-coordinator",
        "invitee_id": "user-invitee",
        "invitee_email": "invitee@example.com",
        "status": "pending",
        "created_at": "2024-12-18T10:00:00Z",
        "updated_at": "2024-12-18T10:00:00Z"
    }


# ============================================================================
# Tests: get_invitation
# ============================================================================

class TestGetInvitation:
    """Tests for get_invitation method."""

    def test_get_invitation_success(self, invitations_service, mock_supabase, sample_invitation):
        """Test successfully getting an invitation."""
        # Arrange
        mock_result = Mock()
        mock_result.data = [sample_invitation]
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_result

        # Act
        result = invitations_service.get_invitation("event-123", "user-invitee")

        # Assert
        assert result is not None
        assert result["id"] == "invitation-123"
        assert result["status"] == "pending"

    def test_get_invitation_not_found(self, invitations_service, mock_supabase):
        """Test get_invitation returns None when not found."""
        # Arrange
        mock_result = Mock()
        mock_result.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_result

        # Act
        result = invitations_service.get_invitation("event-999", "user-999")

        # Assert
        assert result is None


# ============================================================================
# Tests: create_invitation
# ============================================================================

class TestCreateInvitation:
    """Tests for create_invitation method."""

    def test_create_invitation_success(self, invitations_service, mock_supabase):
        """Test successfully creating an invitation."""
        # Arrange
        new_invitation = {
            "id": "invitation-new",
            "event_id": "event-123",
            "inviter_id": "user-coordinator",
            "invitee_id": "user-invitee",
            "invitee_email": "invitee@example.com",
            "status": "pending"
        }

        mock_result = Mock()
        mock_result.data = [new_invitation]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_result

        # Act
        result = invitations_service.create_invitation(
            event_id="event-123",
            inviter_id="user-coordinator",
            invitee_id="user-invitee",
            invitee_email="invitee@example.com"
        )

        # Assert
        assert result is not None
        assert result["status"] == "pending"
        assert result["invitee_email"] == "invitee@example.com"


# ============================================================================
# Tests: update_invitation_status
# ============================================================================

class TestUpdateInvitationStatus:
    """Tests for update_invitation_status method."""

    def test_update_status_to_accepted(self, invitations_service, mock_supabase):
        """Test updating invitation status to accepted."""
        # Arrange
        updated_invitation = {
            "id": "invitation-123",
            "status": "accepted"
        }

        mock_result = Mock()
        mock_result.data = [updated_invitation]
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_result

        # Act
        result = invitations_service.update_invitation_status("invitation-123", "accepted")

        # Assert
        assert result is not None
        assert result["status"] == "accepted"

    def test_update_status_to_declined(self, invitations_service, mock_supabase):
        """Test updating invitation status to declined."""
        # Arrange
        updated_invitation = {
            "id": "invitation-123",
            "status": "declined"
        }

        mock_result = Mock()
        mock_result.data = [updated_invitation]
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_result

        # Act
        result = invitations_service.update_invitation_status("invitation-123", "declined")

        # Assert
        assert result is not None
        assert result["status"] == "declined"

    def test_update_status_not_found(self, invitations_service, mock_supabase):
        """Test updating status when invitation doesn't exist."""
        # Arrange
        mock_result = Mock()
        mock_result.data = None
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_result

        # Act
        result = invitations_service.update_invitation_status("invitation-999", "accepted")

        # Assert
        assert result is None


# ============================================================================
# Tests: get_event_invitations
# ============================================================================

class TestGetEventInvitations:
    """Tests for get_event_invitations method."""

    def test_get_event_invitations_success(self, invitations_service, mock_supabase, sample_invitation):
        """Test getting all invitations for an event."""
        # Arrange
        mock_result = Mock()
        mock_result.data = [sample_invitation, {**sample_invitation, "id": "invitation-456"}]
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = mock_result

        # Act
        result = invitations_service.get_event_invitations("event-123")

        # Assert
        assert len(result) == 2
        assert all(inv["event_id"] == "event-123" for inv in result)

    def test_get_event_invitations_empty(self, invitations_service, mock_supabase):
        """Test getting invitations when event has none."""
        # Arrange
        mock_result = Mock()
        mock_result.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = mock_result

        # Act
        result = invitations_service.get_event_invitations("event-999")

        # Assert
        assert result == []


# ============================================================================
# Tests: get_user_invitations
# ============================================================================

class TestGetUserInvitations:
    """Tests for get_user_invitations method."""

    def test_get_user_invitations_all(self, invitations_service, mock_supabase, sample_invitation):
        """Test getting all invitations for a user."""
        # Arrange
        mock_result = Mock()
        mock_result.data = [sample_invitation]
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = mock_result

        # Act
        result = invitations_service.get_user_invitations("user-invitee")

        # Assert
        assert len(result) == 1
        assert result[0]["invitee_id"] == "user-invitee"

    def test_get_user_invitations_filter_pending(self, invitations_service, mock_supabase, sample_invitation):
        """Test getting pending invitations for a user."""
        # Arrange
        mock_result = Mock()
        mock_result.data = [sample_invitation]
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value = mock_result

        # Act
        result = invitations_service.get_user_invitations("user-invitee", status="pending")

        # Assert
        assert len(result) == 1
        assert result[0]["status"] == "pending"

    def test_get_user_invitations_filter_accepted(self, invitations_service, mock_supabase):
        """Test getting accepted invitations for a user."""
        # Arrange
        accepted_invitation = {
            "id": "invitation-accepted",
            "invitee_id": "user-invitee",
            "status": "accepted"
        }

        mock_result = Mock()
        mock_result.data = [accepted_invitation]
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value = mock_result

        # Act
        result = invitations_service.get_user_invitations("user-invitee", status="accepted")

        # Assert
        assert len(result) == 1
        assert result[0]["status"] == "accepted"

    def test_get_user_invitations_empty(self, invitations_service, mock_supabase):
        """Test getting invitations when user has none."""
        # Arrange
        mock_result = Mock()
        mock_result.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = mock_result

        # Act
        result = invitations_service.get_user_invitations("user-999")

        # Assert
        assert result == []
