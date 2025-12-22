"""
Integration tests for the invitation flow.

Flow tested:
1. Coordinator sends invitation →
2. Invitation notification created →
3. Invitee receives invitation →
4. Invitee accepts/declines →
5. Participant added/removed from event →
6. Event participant list updated
"""

import pytest
from datetime import datetime, timezone
from unittest.mock import Mock, patch, MagicMock
from app.services.invitations import InvitationsService
from app.services.events import EventsService
from app.services.notifications import NotificationsService


class TestInvitationFlow:
    """Integration tests for complete invitation workflow."""

    @pytest.fixture
    def mock_supabase_for_invitations(self):
        """Mock Supabase client with invitation workflow support."""
        mock_client = Mock()

        # Storage
        invitations = []
        notifications = []
        participants = []
        events = [{
            "id": "event-123",
            "uid": "event-uid-123",
            "name": "Team Meeting",
            "coordinator_id": "coordinator-1",
            "status": "planning"
        }]
        profiles = [
            {
                "id": "coordinator-1",
                "email_address": "coordinator@example.com",
                "full_name": "Coordinator User"
            },
            {
                "id": "invitee-1",
                "email_address": "invitee@example.com",
                "full_name": "Invitee User"
            }
        ]

        def table_mock(table_name: str):
            table = Mock()

            if table_name == "event_invitations":
                def insert_mock(data):
                    result = Mock()
                    invitation_data = {
                        **data,
                        "id": f"invitation-{len(invitations) + 1}",
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    }
                    invitations.append(invitation_data)
                    result.execute.return_value.data = [invitation_data]
                    return result

                def select_mock(fields="*"):
                    query = Mock()

                    def eq_mock(field, value):
                        subquery = Mock()
                        filtered = [inv for inv in invitations if inv.get(field) == value]

                        def eq2_mock(field2, value2):
                            subsubquery = Mock()
                            double_filtered = [inv for inv in filtered if inv.get(field2) == value2]

                            def order_mock(field, desc=False):
                                result = Mock()
                                result.execute.return_value.data = double_filtered
                                return result

                            subsubquery.order = order_mock
                            subsubquery.execute.return_value.data = double_filtered
                            return subsubquery

                        def order_mock(field, desc=False):
                            result = Mock()
                            result.execute.return_value.data = filtered
                            return result

                        subquery.eq = eq2_mock
                        subquery.order = order_mock
                        subquery.execute.return_value.data = filtered
                        return subquery

                    query.eq = eq_mock
                    return query

                def update_mock(data):
                    query = Mock()

                    def eq_mock(field, value):
                        result = Mock()
                        # Update matching invitations
                        updated = []
                        for inv in invitations:
                            if inv.get(field) == value:
                                inv.update(data)
                                inv["updated_at"] = datetime.now(timezone.utc).isoformat()
                                updated.append(inv)
                        result.execute.return_value.data = updated
                        return result

                    query.eq = eq_mock
                    return query

                table.insert = insert_mock
                table.select = select_mock
                table.update = update_mock

            elif table_name == "notifications":
                def insert_mock(data):
                    result = Mock()
                    notification_data = {
                        **data,
                        "id": f"notification-{len(notifications) + 1}",
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "is_read": False,
                    }
                    notifications.append(notification_data)
                    result.execute.return_value.data = [notification_data]
                    return result

                def select_mock(fields="*"):
                    query = Mock()

                    def eq_mock(field, value):
                        subquery = Mock()
                        filtered = [n for n in notifications if n.get(field) == value]

                        def eq2_mock(field2, value2):
                            result = Mock()
                            double_filtered = [n for n in filtered if n.get(field2) == value2]
                            result.execute.return_value.data = double_filtered
                            return result

                        def order_mock(field, desc=False):
                            order_result = Mock()
                            sorted_data = sorted(filtered, key=lambda x: x.get(field, ""), reverse=desc)

                            def limit_mock(count):
                                result = Mock()
                                result.execute.return_value.data = sorted_data[:count]
                                return result

                            order_result.limit = limit_mock
                            order_result.execute.return_value.data = sorted_data
                            return order_result

                        def limit_mock(count):
                            result = Mock()
                            result.execute.return_value.data = filtered[:count]
                            return result

                        subquery.eq = eq2_mock
                        subquery.order = order_mock
                        subquery.limit = limit_mock
                        subquery.execute.return_value.data = filtered
                        return subquery

                    query.eq = eq_mock
                    return query

                table.insert = insert_mock
                table.select = select_mock

            elif table_name == "event_participants":
                def insert_mock(data):
                    result = Mock()
                    participant_data = {
                        **data,
                        "id": f"participant-{len(participants) + 1}",
                        "joined_at": datetime.now(timezone.utc).isoformat(),
                    }
                    participants.append(participant_data)
                    result.execute.return_value.data = [participant_data]
                    return result

                def select_mock(fields="*"):
                    query = Mock()

                    def eq_mock(field, value):
                        subquery = Mock()
                        filtered = [p for p in participants if p.get(field) == value]

                        def eq2_mock(field2, value2):
                            result = Mock()
                            double_filtered = [p for p in filtered if p.get(field2) == value2]
                            result.execute.return_value.data = double_filtered
                            return result

                        subquery.eq = eq2_mock
                        subquery.execute.return_value.data = filtered
                        return subquery

                    query.eq = eq_mock
                    return query

                def update_mock(data):
                    query = Mock()

                    def eq_mock(field, value):
                        subquery = Mock()
                        filtered = [p for p in participants if p.get(field) == value]

                        def eq2_mock(field2, value2):
                            result = Mock()
                            # Update matching participants
                            updated = []
                            for p in participants:
                                if p.get(field) == value and p.get(field2) == value2:
                                    p.update(data)
                                    updated.append(p)
                            result.execute.return_value.data = updated
                            return result

                        subquery.eq = eq2_mock
                        return subquery

                    query.eq = eq_mock
                    return query

                table.insert = insert_mock
                table.select = select_mock
                table.update = update_mock

            elif table_name == "events":
                def select_mock(fields="*"):
                    query = Mock()

                    def eq_mock(field, value):
                        result = Mock()
                        filtered = [e for e in events if e.get(field) == value]
                        result.execute.return_value.data = filtered
                        return result

                    query.eq = eq_mock
                    return query

                table.select = select_mock

            elif table_name == "profiles":
                def select_mock(fields="*"):
                    query = Mock()

                    def in_mock(field, values):
                        result = Mock()
                        filtered = [p for p in profiles if p.get(field) in values]
                        result.execute.return_value.data = filtered
                        return result

                    query.in_ = in_mock
                    return query

                table.select = select_mock

            return table

        mock_client.table = table_mock
        return mock_client

    def test_complete_invitation_acceptance_flow(self, mock_supabase_for_invitations):
        """
        Test complete flow from invitation creation to acceptance.

        Steps:
        1. Create invitation
        2. Verify notification is created
        3. Accept invitation
        4. Verify participant is added with 'accepted' status
        """
        # Arrange
        event_id = "event-123"
        coordinator_id = "coordinator-1"
        invitee_id = "invitee-1"
        invitee_email = "invitee@example.com"

        with patch('app.services.invitations.get_supabase', return_value=mock_supabase_for_invitations):
            with patch('app.services.invitations.create_client', return_value=mock_supabase_for_invitations):
                with patch('app.services.notifications.get_supabase', return_value=mock_supabase_for_invitations):
                    with patch('app.services.notifications.create_client', return_value=mock_supabase_for_invitations):
                        with patch('app.services.events.get_supabase', return_value=mock_supabase_for_invitations):
                            with patch('app.services.events.create_client', return_value=mock_supabase_for_invitations):
                                invitations_service = InvitationsService()
                                notifications_service = NotificationsService()
                                events_service = EventsService()

                                # Act - Step 1: Create invitation
                                invitation = invitations_service.create_invitation(
                                    event_id=event_id,
                                    inviter_id=coordinator_id,
                                    invitee_id=invitee_id,
                                    invitee_email=invitee_email
                                )

                                # Assert - Invitation created
                                assert invitation is not None
                                assert invitation["event_id"] == event_id
                                assert invitation["invitee_id"] == invitee_id
                                assert invitation["status"] == "pending"

                                # Act - Step 2: Create notification
                                notification = notifications_service.create_event_invitation_notification(
                                    user_id=invitee_id,
                                    event_id=event_id,
                                    event_title="Team Meeting",
                                    coordinator_name="Coordinator User",
                                    coordinator_id=coordinator_id,
                                    invitation_id=invitation["id"]
                                )

                                # Assert - Notification created
                                assert notification is not None
                                assert notification["user_id"] == invitee_id
                                assert notification["notification_type"] == "event_invitation"
                                assert "Team Meeting" in notification["title"]

                                # Act - Step 3: Accept invitation
                                updated_invitation = invitations_service.update_invitation_status(
                                    invitation_id=invitation["id"],
                                    status="accepted"
                                )

                                # Assert - Invitation updated
                                assert updated_invitation is not None
                                assert updated_invitation["status"] == "accepted"

                                # Act - Step 4: Add as participant
                                participant = events_service.add_participant(
                                    event_id=event_id,
                                    user_id=invitee_id,
                                    status="accepted"
                                )

                                # Assert - Participant added
                                assert participant is not None
                                assert participant["event_id"] == event_id
                                assert participant["user_id"] == invitee_id
                                assert participant["status"] == "accepted"

    def test_invitation_decline_flow(self, mock_supabase_for_invitations):
        """
        Test flow when invitation is declined.

        Steps:
        1. Create invitation
        2. Decline invitation
        3. Verify participant is NOT added to event
        """
        # Arrange
        event_id = "event-123"
        coordinator_id = "coordinator-1"
        invitee_id = "invitee-1"
        invitee_email = "invitee@example.com"

        with patch('app.services.invitations.get_supabase', return_value=mock_supabase_for_invitations):
            with patch('app.services.invitations.create_client', return_value=mock_supabase_for_invitations):
                with patch('app.services.events.get_supabase', return_value=mock_supabase_for_invitations):
                    with patch('app.services.events.create_client', return_value=mock_supabase_for_invitations):
                        invitations_service = InvitationsService()
                        events_service = EventsService()

                        # Act - Create and decline invitation
                        invitation = invitations_service.create_invitation(
                            event_id=event_id,
                            inviter_id=coordinator_id,
                            invitee_id=invitee_id,
                            invitee_email=invitee_email
                        )

                        updated_invitation = invitations_service.update_invitation_status(
                            invitation_id=invitation["id"],
                            status="declined"
                        )

                        # Assert - Invitation declined
                        assert updated_invitation is not None
                        assert updated_invitation["status"] == "declined"

                        # Verify participant not added
                        participants = events_service.get_event_participants("event-uid-123")
                        assert len(participants) == 0

    def test_get_user_invitations(self, mock_supabase_for_invitations):
        """Test retrieving all invitations for a user."""
        # Arrange
        invitee_id = "invitee-1"

        with patch('app.services.invitations.get_supabase', return_value=mock_supabase_for_invitations):
            with patch('app.services.invitations.create_client', return_value=mock_supabase_for_invitations):
                invitations_service = InvitationsService()

                # Create multiple invitations
                inv1 = invitations_service.create_invitation(
                    event_id="event-123",
                    inviter_id="coordinator-1",
                    invitee_id=invitee_id,
                    invitee_email="invitee@example.com"
                )

                inv2 = invitations_service.create_invitation(
                    event_id="event-456",
                    inviter_id="coordinator-1",
                    invitee_id=invitee_id,
                    invitee_email="invitee@example.com"
                )

                # Act - Get user invitations
                user_invitations = invitations_service.get_user_invitations(invitee_id)

                # Assert - Both invitations returned
                assert len(user_invitations) == 2
                assert all(inv["invitee_id"] == invitee_id for inv in user_invitations)

    def test_get_pending_invitations_only(self, mock_supabase_for_invitations):
        """Test filtering invitations by status."""
        # Arrange
        invitee_id = "invitee-1"

        with patch('app.services.invitations.get_supabase', return_value=mock_supabase_for_invitations):
            with patch('app.services.invitations.create_client', return_value=mock_supabase_for_invitations):
                invitations_service = InvitationsService()

                # Create invitations with different statuses
                inv1 = invitations_service.create_invitation(
                    event_id="event-123",
                    inviter_id="coordinator-1",
                    invitee_id=invitee_id,
                    invitee_email="invitee@example.com"
                )

                inv2 = invitations_service.create_invitation(
                    event_id="event-456",
                    inviter_id="coordinator-1",
                    invitee_id=invitee_id,
                    invitee_email="invitee@example.com"
                )

                # Accept one invitation
                invitations_service.update_invitation_status(inv1["id"], "accepted")

                # Act - Get pending invitations only
                pending_invitations = invitations_service.get_user_invitations(
                    invitee_id,
                    status="pending"
                )

                # Assert - Only pending invitation returned
                assert len(pending_invitations) == 1
                assert pending_invitations[0]["status"] == "pending"

    def test_participant_status_update_after_acceptance(self, mock_supabase_for_invitations):
        """Test that participant status can be updated after initial acceptance."""
        # Arrange
        event_id = "event-123"
        invitee_id = "invitee-1"

        with patch('app.services.events.get_supabase', return_value=mock_supabase_for_invitations):
            with patch('app.services.events.create_client', return_value=mock_supabase_for_invitations):
                events_service = EventsService()

                # Add participant
                participant = events_service.add_participant(
                    event_id=event_id,
                    user_id=invitee_id,
                    status="pending"
                )

                # Act - Update status to accepted
                updated_participant = events_service.update_participant_status(
                    event_id=event_id,
                    user_id=invitee_id,
                    status="accepted"
                )

                # Assert - Status updated
                assert updated_participant is not None
                assert updated_participant["status"] == "accepted"

    def test_notification_retrieval_for_invitee(self, mock_supabase_for_invitations):
        """Test that invitee can retrieve their invitation notifications."""
        # Arrange
        invitee_id = "invitee-1"
        event_id = "event-123"

        with patch('app.services.notifications.get_supabase', return_value=mock_supabase_for_invitations):
            with patch('app.services.notifications.create_client', return_value=mock_supabase_for_invitations):
                notifications_service = NotificationsService()

                # Create notification
                notifications_service.create_event_invitation_notification(
                    user_id=invitee_id,
                    event_id=event_id,
                    event_title="Team Meeting",
                    coordinator_name="Coordinator User",
                    coordinator_id="coordinator-1"
                )

                # Act - Get user notifications
                notifications = notifications_service.get_user_notifications(invitee_id)

                # Assert - Notification retrieved
                assert len(notifications) == 1
                assert notifications[0]["user_id"] == invitee_id
                assert notifications[0]["notification_type"] == "event_invitation"
                assert notifications[0]["is_read"] is False
