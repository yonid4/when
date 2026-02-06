"""Service for managing event invitations."""

import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from supabase import create_client

from ..utils.supabase_client import get_supabase


class InvitationsService:
    """Service for invitation operations."""

    def __init__(self):
        self.supabase = get_supabase()

        supabase_url = os.getenv('SUPABASE_URL')
        supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

        if supabase_url and supabase_service_key:
            self.service_role_client = create_client(supabase_url, supabase_service_key)
        else:
            self.service_role_client = self.supabase

    def get_invitation(self, event_id: str, invitee_id: str) -> Optional[Dict[str, Any]]:
        """Get invitation for a specific event and invitee."""
        response = (
            self.service_role_client.table("event_invitations")
            .select("*")
            .eq("event_id", event_id)
            .eq("invitee_id", invitee_id)
            .execute()
        )

        return response.data[0] if response.data else None
    
    def create_invitation(
        self,
        event_id: str,
        inviter_id: str,
        invitee_id: str,
        invitee_email: str
    ) -> Dict[str, Any]:
        """Create a new invitation."""
        now = datetime.now(timezone.utc).isoformat()
        invitation_data = {
            "event_id": event_id,
            "inviter_id": inviter_id,
            "invitee_id": invitee_id,
            "invitee_email": invitee_email,
            "status": "pending",
            "created_at": now,
            "updated_at": now
        }

        response = (
            self.service_role_client.table("event_invitations")
            .insert(invitation_data)
            .execute()
        )

        return response.data[0]

    def update_invitation_status(self, invitation_id: str, status: str) -> Optional[Dict[str, Any]]:
        """Update invitation status."""
        update_data = {
            "status": status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

        response = (
            self.service_role_client.table("event_invitations")
            .update(update_data)
            .eq("id", invitation_id)
            .execute()
        )

        return response.data[0] if response.data else None

    def get_event_invitations(self, event_id: str) -> List[Dict[str, Any]]:
        """Get all invitations for an event."""
        response = (
            self.service_role_client.table("event_invitations")
            .select("*")
            .eq("event_id", event_id)
            .order("created_at", desc=True)
            .execute()
        )

        return response.data or []

    def get_user_invitations(self, user_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all invitations for a user with optional status filter."""
        query = (
            self.service_role_client.table("event_invitations")
            .select("*")
            .eq("invitee_id", user_id)
        )

        if status:
            query = query.eq("status", status)

        response = query.order("created_at", desc=True).execute()

        return response.data or []

