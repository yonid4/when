"""Notifications service for managing user notifications."""

import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from supabase import create_client

from ..models.notification import Notification
from ..utils.supabase_client import get_supabase


class NotificationsService:
    """Service for managing notifications."""

    def __init__(self, access_token: Optional[str] = None):
        self.supabase = get_supabase(access_token)

        supabase_url = os.getenv('SUPABASE_URL')
        supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

        if supabase_url and supabase_service_key:
            self.service_role_client = create_client(supabase_url, supabase_service_key)
        else:
            self.service_role_client = self.supabase
    
    def create_notification(
        self,
        user_id: str,
        notification_type: str,
        title: str,
        message: str,
        event_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Create a new notification for a user."""
        try:
            notification = Notification(
                user_id=user_id,
                event_id=event_id,
                notification_type=notification_type,
                title=title,
                message=message,
                metadata=metadata or {}
            )

            result = (
                self.service_role_client.table("notifications")
                .insert(notification.to_dict())
                .execute()
            )

            return result.data[0] if result.data else None

        except Exception as e:
            print(f"Error creating notification: {str(e)}")
            return None

    def get_user_notifications(
        self,
        user_id: str,
        unread_only: bool = False,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get notifications for a user."""
        try:
            query = (
                self.service_role_client.table("notifications")
                .select("*")
                .eq("user_id", user_id)
            )

            if unread_only:
                query = query.eq("is_read", False)

            result = query.order("created_at", desc=True).limit(limit).execute()

            return result.data or []

        except Exception as e:
            print(f"Error getting notifications: {str(e)}")
            return []

    def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications for a user."""
        try:
            result = (
                self.service_role_client.table("notifications")
                .select("id")
                .eq("user_id", user_id)
                .eq("is_read", False)
                .execute()
            )

            return result.count if result.count is not None else 0

        except Exception as e:
            print(f"Error getting unread count: {str(e)}")
            return 0
    
    def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        """Mark a notification as read."""
        try:
            result = (
                self.service_role_client.table("notifications")
                .update({
                    "is_read": True,
                    "read_at": datetime.now(timezone.utc).isoformat()
                })
                .eq("id", notification_id)
                .eq("user_id", user_id)
                .execute()
            )

            return bool(result.data)

        except Exception as e:
            print(f"Error marking notification as read: {str(e)}")
            return False

    def mark_all_as_read(self, user_id: str) -> bool:
        """Mark all unread notifications as read for a user."""
        try:
            self.service_role_client.table("notifications").update({
                "is_read": True,
                "read_at": datetime.now(timezone.utc).isoformat()
            }).eq("user_id", user_id).eq("is_read", False).execute()

            return True

        except Exception as e:
            print(f"Error marking all as read: {str(e)}")
            return False

    def record_action(self, notification_id: str, user_id: str, action_type: str) -> bool:
        """Record user action on a notification."""
        try:
            now = datetime.now(timezone.utc).isoformat()
            result = (
                self.service_role_client.table("notifications")
                .update({
                    "action_taken": True,
                    "action_type": action_type,
                    "action_at": now,
                    "is_read": True,
                    "read_at": now
                })
                .eq("id", notification_id)
                .eq("user_id", user_id)
                .execute()
            )

            return bool(result.data)

        except Exception as e:
            print(f"Error recording action: {str(e)}")
            return False

    def delete_notification(self, notification_id: str, user_id: str) -> bool:
        """Delete a notification."""
        try:
            result = (
                self.service_role_client.table("notifications")
                .delete()
                .eq("id", notification_id)
                .eq("user_id", user_id)
                .execute()
            )

            return bool(result.data)

        except Exception as e:
            print(f"Error deleting notification: {str(e)}")
            return False

    def get_notification(self, notification_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a single notification."""
        try:
            result = (
                self.service_role_client.table("notifications")
                .select("*")
                .eq("id", notification_id)
                .eq("user_id", user_id)
                .execute()
            )

            return result.data[0] if result.data else None

        except Exception as e:
            print(f"Error getting notification: {str(e)}")
            return None

    def create_event_invitation_notification(
        self,
        user_id: str,
        event_id: str,
        event_title: str,
        coordinator_name: str,
        coordinator_id: str,
        invitation_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Create an event invitation notification."""
        metadata = {"coordinator_id": coordinator_id}
        if invitation_id:
            metadata["invitation_id"] = invitation_id
        
        return self.create_notification(
            user_id=user_id,
            event_id=event_id,
            notification_type="event_invitation",
            title=f"You're invited to {event_title}",
            message=f"{coordinator_name} has invited you to join the event '{event_title}'.",
            metadata=metadata
        )
    
    def create_event_finalized_notification(
        self,
        user_id: str,
        event_id: str,
        event_title: str,
        finalized_time: str,
        google_calendar_link: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Create an event finalized notification."""
        return self.create_notification(
            user_id=user_id,
            event_id=event_id,
            notification_type="event_finalized",
            title=f"Event Finalized: {event_title}",
            message=f"The event '{event_title}' has been scheduled for {finalized_time}. Check your Google Calendar for details.",
            metadata={
                "finalized_time": finalized_time,
                "google_calendar_link": google_calendar_link
            }
        )
    
    def create_event_deleted_notification(
        self,
        user_id: str,
        event_id: str,
        event_title: str,
        deleted_by_id: str
    ) -> Optional[Dict[str, Any]]:
        """Create an event deleted notification."""
        return self.create_notification(
            user_id=user_id,
            event_id=event_id,
            notification_type="event_deleted",
            title=f"Event Cancelled: {event_title}",
            message=f"The event '{event_title}' has been cancelled by the coordinator.",
            metadata={"deleted_by": deleted_by_id}
        )

