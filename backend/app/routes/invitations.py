"""
Routes for event invitation management.
"""
import os
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from typing import List, Dict, Any
from supabase import create_client
from ..utils.decorators import require_auth
from ..services.invitations import InvitationsService
from ..services.notifications import NotificationsService
from ..utils.supabase_client import get_supabase


invitations_bp = Blueprint("invitations", __name__)
invitations_service = InvitationsService()
supabase = get_supabase()

# Create service role client for event queries (bypasses RLS)
def get_service_role_client():
    """Get service role client for bypassing RLS."""
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    if supabase_url and supabase_service_key:
        return create_client(supabase_url, supabase_service_key)
    return None

service_role_client = get_service_role_client()


@invitations_bp.route("/api/events/<event_uid>/invite", methods=["POST"])
@require_auth
def send_invitations(event_uid: str, user_id):
    """
    Send invitations to multiple users for an event.
    
    Body:
        emails: List of email addresses to invite
        
    Returns:
        Results of invitation attempts with success/failure for each
    """

    data = request.get_json()
    
    # Get list of emails to invite
    invitee_emails = data.get("emails", [])
    if not invitee_emails:
        return jsonify({"error": "No emails provided"}), 400
    
    # Get event by UID (use service role to bypass RLS)
    if not service_role_client:
        return jsonify({"error": "Server configuration error"}), 500
    
    event_response = service_role_client.table("events")\
        .select("*")\
        .eq("uid", event_uid)\
        .execute()
    
    if not event_response.data or len(event_response.data) == 0:
        return jsonify({"error": "Event not found"}), 404
    
    event = event_response.data[0]
    
    # Debug: Log event object to see what fields it has
    print(f"DEBUG: Event object keys: {list(event.keys())}")
    print(f"DEBUG: Event object: {event}")
    
    # Get event title with fallback (events table uses 'name' not 'title')
    event_title = event.get("name") or event.get("title") or "Untitled Event"
    
    # Verify user is coordinator
    if event["coordinator_id"] != user_id:
        return jsonify({"error": "Only coordinator can send invitations"}), 403
    
    # Get coordinator profile (use service role to bypass RLS)
    coordinator_response = service_role_client.table("profiles")\
        .select("*")\
        .eq("id", user_id)\
        .execute()
    
    if not coordinator_response.data:
        return jsonify({"error": "Coordinator profile not found"}), 404
    
    coordinator = coordinator_response.data[0]
    coordinator_name = coordinator.get("full_name") or coordinator.get("email_address", "Someone")
    
    results = []
    
    for email in invitee_emails:
        try:
            # Check if user exists with this email (use service role)
            invitee_response = service_role_client.table("profiles")\
                .select("*")\
                .eq("email_address", email)\
                .execute()
            
            if not invitee_response.data or len(invitee_response.data) == 0:
                results.append({
                    "email": email,
                    "status": "error",
                    "message": "User not found with this email"
                })
                continue
            
            invitee = invitee_response.data[0]
            
            # Check if already invited (use service role to bypass RLS)
            existing_invitation_response = service_role_client.table("event_invitations")\
                .select("*")\
                .eq("event_id", event["id"])\
                .eq("invitee_id", invitee["id"])\
                .execute()
            
            existing_invitation = existing_invitation_response.data[0] if existing_invitation_response.data else None
            
            # If already invited and status is pending or accepted, don't re-invite
            if existing_invitation and existing_invitation["status"] in ["pending", "accepted"]:
                results.append({
                    "email": email,
                    "status": "error",
                    "message": f"Already invited (status: {existing_invitation['status']})"
                })
                continue
            
            # Check if already a participant (use service role)
            participant_response = service_role_client.table("event_participants")\
                .select("*")\
                .eq("event_id", event["id"])\
                .eq("user_id", invitee["id"])\
                .execute()
            
            if participant_response.data and len(participant_response.data) > 0:
                results.append({
                    "email": email,
                    "status": "error",
                    "message": "Already a participant"
                })
                continue
            
            # If user declined before, update the existing invitation to pending
            if existing_invitation and existing_invitation["status"] == "declined":
                try:
                    updated_invitation = service_role_client.table("event_invitations")\
                        .update({
                            "status": "pending",
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        })\
                        .eq("id", existing_invitation["id"])\
                        .execute()
                    
                    invitation = updated_invitation.data[0] if updated_invitation.data else existing_invitation
                    
                except Exception as update_error:
                    print(f"Error updating invitation for {email}: {update_error}")
                    results.append({
                        "email": email,
                        "status": "error",
                        "message": f"Failed to update invitation: {str(update_error)}"
                    })
                    continue
            else:
                # Create new invitation (use service role to bypass RLS)
                try:
                    invitation_data = {
                        "event_id": event["id"],
                        "inviter_id": user_id,
                        "invitee_id": invitee["id"],
                        "invitee_email": email,
                        "status": "pending",
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                    
                    invitation_response = service_role_client.table("event_invitations")\
                        .insert(invitation_data)\
                        .execute()
                    
                    invitation = invitation_response.data[0] if invitation_response.data else None
                    if not invitation:
                        raise Exception("No data returned from invitation creation")
                        
                except Exception as create_error:
                    print(f"Error creating invitation for {email}: {create_error}")
                    results.append({
                        "email": email,
                        "status": "error",
                        "message": f"Failed to create invitation: {str(create_error)}"
                    })
                    continue
            
            # Create notification with invitation_id (with error handling)
            try:
                # Create NotificationsService with access token for proper authentication
                access_token = getattr(request, "access_token", None)
                notifications_service = NotificationsService(access_token)
                
                notifications_service.create_event_invitation_notification(
                    user_id=invitee["id"],
                    event_id=event["id"],
                    event_title=event_title,
                    coordinator_id=user_id,
                    coordinator_name=coordinator_name,
                    invitation_id=invitation["id"]
                )
            except Exception as notification_error:
                # Log the error but don't fail the invitation
                print(f"Error creating notification for {email}: {notification_error}")
                print(f"Event data: {event}")
                print(f"Event title used: {event_title}")
                # Continue anyway since invitation was created successfully
            
            results.append({
                "email": email,
                "status": "success",
                "message": "Invitation sent" if not existing_invitation else "Invitation resent",
                "invitation_id": invitation["id"]
            })
            
        except Exception as e:
            print(f"Error inviting {email}: {e}")
            results.append({
                "email": email,
                "status": "error",
                "message": str(e)
            })
    
    return jsonify({
        "results": results,
        "summary": {
            "total": len(invitee_emails),
            "success": len([r for r in results if r["status"] == "success"]),
            "failed": len([r for r in results if r["status"] == "error"])
        }
    }), 200


@invitations_bp.route("/api/events/<event_uid>/invitations", methods=["GET"])
@require_auth
def get_event_invitations(event_uid: str, user_id):
    """
    Get all invitations for an event (coordinator only).
    """

    
    # Get event by UID (use service role to bypass RLS)
    if not service_role_client:
        return jsonify({"error": "Server configuration error"}), 500
    
    event_response = service_role_client.table("events")\
        .select("*")\
        .eq("uid", event_uid)\
        .execute()
    
    if not event_response.data or len(event_response.data) == 0:
        return jsonify({"error": "Event not found"}), 404
    
    event = event_response.data[0]
    
    # Verify user is coordinator
    if event["coordinator_id"] != user_id:
        return jsonify({"error": "Only coordinator can view invitations"}), 403
    
    # Get invitations
    invitations = invitations_service.get_event_invitations(event["id"])
    
    return jsonify({"invitations": invitations}), 200

