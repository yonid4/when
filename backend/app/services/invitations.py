"""
Service for managing event invitations.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from ..utils.supabase_client import get_supabase
from supabase import create_client
import os


class InvitationsService:
    """Service for invitation operations."""
    
    def __init__(self):
        """Initialize the invitations service."""
        self.supabase = get_supabase()
        
        # Service role client for operations that bypass RLS (cross-user invitations)
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if supabase_url and supabase_service_key:
            self.service_role_client = create_client(supabase_url, supabase_service_key)
        else:
            # Fallback to regular client if service role key not available
            self.service_role_client = self.supabase
    
    def get_invitation(self, event_id: str, invitee_id: str) -> Optional[Dict[str, Any]]:
        """
        Get invitation for a specific event and invitee.
        
        Args:
            event_id: UUID of the event
            invitee_id: UUID of the invitee
            
        Returns:
            Invitation dict or None if not found
        """
        response = self.service_role_client.table("event_invitations")\
            .select("*")\
            .eq("event_id", event_id)\
            .eq("invitee_id", invitee_id)\
            .execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    
    def create_invitation(
        self,
        event_id: str,
        inviter_id: str,
        invitee_id: str,
        invitee_email: str
    ) -> Dict[str, Any]:
        """
        Create a new invitation.
        
        Args:
            event_id: UUID of the event
            inviter_id: UUID of the person sending invitation
            invitee_id: UUID of the person being invited
            invitee_email: Email of the person being invited
            
        Returns:
            Created invitation dict
        """
        invitation_data = {
            "event_id": event_id,
            "inviter_id": inviter_id,
            "invitee_id": invitee_id,
            "invitee_email": invitee_email,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        response = self.service_role_client.table("event_invitations")\
            .insert(invitation_data)\
            .execute()
        
        return response.data[0]
    
    def update_invitation_status(
        self,
        invitation_id: str,
        status: str
    ) -> Dict[str, Any]:
        """
        Update invitation status.
        
        Args:
            invitation_id: UUID of the invitation
            status: New status ('accepted', 'declined')
            
        Returns:
            Updated invitation dict
        """
        update_data = {
            "status": status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        response = self.service_role_client.table("event_invitations")\
            .update(update_data)\
            .eq("id", invitation_id)\
            .execute()
        
        return response.data[0] if response.data else None
    
    def get_event_invitations(self, event_id: str) -> List[Dict[str, Any]]:
        """
        Get all invitations for an event.
        
        Args:
            event_id: UUID of the event
            
        Returns:
            List of invitation dicts
        """
        response = self.service_role_client.table("event_invitations")\
            .select("*")\
            .eq("event_id", event_id)\
            .order("created_at", desc=True)\
            .execute()
        
        return response.data if response.data else []
    
    def get_user_invitations(
        self,
        user_id: str,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all invitations for a user.
        
        Args:
            user_id: UUID of the user
            status: Optional status filter ('pending', 'accepted', 'declined')
            
        Returns:
            List of invitation dicts
        """
        query = self.service_role_client.table("event_invitations")\
            .select("*")\
            .eq("invitee_id", user_id)
        
        if status:
            query = query.eq("status", status)
        
        response = query.order("created_at", desc=True).execute()
        
        return response.data if response.data else []

