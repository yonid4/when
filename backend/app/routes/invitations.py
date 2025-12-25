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
from ..utils.email_utils import get_email_variants


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

    print(f"[INVITE] Starting invitation process for event UID: {event_uid}")
    print(f"[INVITE] Coordinator user ID: {user_id}")

    data = request.get_json()
    print(f"[INVITE] Request data: {data}")

    # Get list of emails to invite
    invitee_emails = data.get("emails", [])
    if not invitee_emails:
        print("[INVITE] ERROR: No emails provided")
        return jsonify({"error": "No emails provided"}), 400

    print(f"[INVITE] Inviting {len(invitee_emails)} users: {invitee_emails}")

    # Get event by UID (use service role to bypass RLS)
    if not service_role_client:
        print("[INVITE] ERROR: Service role client not available")
        return jsonify({"error": "Server configuration error"}), 500

    event_response = service_role_client.table("events")\
        .select("*")\
        .eq("uid", event_uid)\
        .execute()

    if not event_response.data or len(event_response.data) == 0:
        print(f"[INVITE] ERROR: Event not found with UID: {event_uid}")
        return jsonify({"error": "Event not found"}), 404

    event = event_response.data[0]

    print(f"[INVITE] Found event: ID={event['id']}, Name={event.get('name')}")
    print(f"[INVITE] Event coordinator_id: {event['coordinator_id']}")
    
    # Get event title with fallback (events table uses 'name' not 'title')
    event_title = event.get("name") or event.get("title") or "Untitled Event"
    print(f"[INVITE] Event title: {event_title}")

    # Verify user is coordinator OR has can_invite permission
    is_coordinator = event["coordinator_id"] == user_id

    if not is_coordinator:
        # Check if user is a participant with can_invite permission
        print(f"[INVITE] User {user_id} is not coordinator, checking can_invite permission")
        participant_response = service_role_client.table("event_participants")\
            .select("can_invite")\
            .eq("event_id", event["id"])\
            .eq("user_id", user_id)\
            .execute()

        if not participant_response.data or len(participant_response.data) == 0:
            print(f"[INVITE] ERROR: User {user_id} is not a participant")
            return jsonify({"error": "You must be a participant to invite others"}), 403

        participant = participant_response.data[0]
        if not participant.get("can_invite"):
            print(f"[INVITE] ERROR: User {user_id} does not have invite permission")
            return jsonify({"error": "You don't have permission to invite users"}), 403

        print(f"[INVITE] Authorization check passed - user has can_invite permission")
    else:
        print(f"[INVITE] Authorization check passed - user is coordinator")
    
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
    success_count = 0
    error_count = 0

    for email in invitee_emails:
        print(f"[INVITE] Processing invitation for: {email}")
        try:
            # Check if user exists with this email (use service role)
            # Get both original and normalized email variants for lookup
            email_variants = get_email_variants(email)
            print(f"[INVITE] Searching for user with email variants: {email_variants}")

            invitee_response = service_role_client.table("profiles")\
                .select("*")\
                .in_("email_address", email_variants)\
                .execute()

            if not invitee_response.data or len(invitee_response.data) == 0:
                print(f"[INVITE] User not found: {email}")
                results.append({
                    "email": email,
                    "status": "error",
                    "message": "User not found with this email"
                })
                error_count += 1
                continue

            invitee = invitee_response.data[0]
            print(f"[INVITE] Found user: {invitee['id']} ({invitee.get('email_address')}) for search: {email}")
            
            # Check if already invited (use service role to bypass RLS)
            existing_invitation_response = service_role_client.table("event_invitations")\
                .select("*")\
                .eq("event_id", event["id"])\
                .eq("invitee_id", invitee["id"])\
                .execute()
            
            existing_invitation = existing_invitation_response.data[0] if existing_invitation_response.data else None
            
            # If already invited and status is pending or accepted, return success (no re-invite needed)
            if existing_invitation and existing_invitation["status"] in ["pending", "accepted"]:
                print(f"[INVITE] User already invited: {email} (status: {existing_invitation['status']})")
                results.append({
                    "email": email,
                    "status": "success",
                    "message": "Invitation already sent",
                    "invitation_id": existing_invitation["id"]
                })
                success_count += 1
                continue
            
            # Check if already a participant (use service role)
            participant_response = service_role_client.table("event_participants")\
                .select("*")\
                .eq("event_id", event["id"])\
                .eq("user_id", invitee["id"])\
                .execute()
            
            if participant_response.data and len(participant_response.data) > 0:
                print(f"[INVITE] User already a participant: {email}")
                results.append({
                    "email": email,
                    "status": "error",
                    "message": "Already a participant"
                })
                error_count += 1
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
            
            print(f"[INVITE] Successfully created invitation for {email}")
            results.append({
                "email": email,
                "status": "success",
                "message": "Invitation sent" if not existing_invitation else "Invitation resent",
                "invitation_id": invitation["id"]
            })
            success_count += 1

        except Exception as e:
            print(f"[INVITE] ERROR inviting {email}: {e}")
            import traceback
            traceback.print_exc()
            results.append({
                "email": email,
                "status": "error",
                "message": str(e)
            })
            error_count += 1

    print(f"[INVITE] Invitation process complete: {success_count} success, {error_count} failed")

    return jsonify({
        "results": results,
        "summary": {
            "total": len(invitee_emails),
            "success": success_count,
            "failed": error_count
        }
    }), 200


@invitations_bp.route("/api/events/<event_uid>/invitations", methods=["GET", "POST"])
@require_auth
def handle_event_invitations(event_uid: str, user_id):
    """
    Handle invitations for an event.
    GET: Get all invitations for an event (coordinator only).
    POST: Send invitations to multiple users for an event.
    """
    
    if request.method == "POST":
        # POST: Send invitations
        print(f"[INVITE] Starting invitation process for event UID: {event_uid}")
        print(f"[INVITE] Coordinator user ID: {user_id}")

        data = request.get_json()
        print(f"[INVITE] Request data: {data}")

        # Get list of emails to invite
        invitee_emails = data.get("emails", [])
        if not invitee_emails:
            print("[INVITE] ERROR: No emails provided")
            return jsonify({"error": "No emails provided"}), 400

        print(f"[INVITE] Inviting {len(invitee_emails)} users: {invitee_emails}")

        # Get event by UID (use service role to bypass RLS)
        if not service_role_client:
            print("[INVITE] ERROR: Service role client not available")
            return jsonify({"error": "Server configuration error"}), 500

        event_response = service_role_client.table("events")\
            .select("*")\
            .eq("uid", event_uid)\
            .execute()

        if not event_response.data or len(event_response.data) == 0:
            print(f"[INVITE] ERROR: Event not found with UID: {event_uid}")
            return jsonify({"error": "Event not found"}), 404

        event = event_response.data[0]

        print(f"[INVITE] Found event: ID={event['id']}, Name={event.get('name')}")
        print(f"[INVITE] Event coordinator_id: {event['coordinator_id']}")

        # Get event title with fallback (events table uses 'name' not 'title')
        event_title = event.get("name") or event.get("title") or "Untitled Event"
        print(f"[INVITE] Event title: {event_title}")

        # Verify user is coordinator OR has can_invite permission
        is_coordinator = event["coordinator_id"] == user_id

        if not is_coordinator:
            # Check if user is a participant with can_invite permission
            print(f"[INVITE] User {user_id} is not coordinator, checking can_invite permission")
            participant_response = service_role_client.table("event_participants")\
                .select("can_invite")\
                .eq("event_id", event["id"])\
                .eq("user_id", user_id)\
                .execute()

            if not participant_response.data or len(participant_response.data) == 0:
                print(f"[INVITE] ERROR: User {user_id} is not a participant")
                return jsonify({"error": "You must be a participant to invite others"}), 403

            participant = participant_response.data[0]
            if not participant.get("can_invite"):
                print(f"[INVITE] ERROR: User {user_id} does not have invite permission")
                return jsonify({"error": "You don't have permission to invite users"}), 403

            print(f"[INVITE] Authorization check passed - user has can_invite permission")
        else:
            print(f"[INVITE] Authorization check passed - user is coordinator")

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
        success_count = 0
        error_count = 0
        
        for email in invitee_emails:
            print(f"[INVITE] Processing invitation for: {email}")
            try:
                # Check if user exists with this email (use service role)
                # Get both original and normalized email variants for lookup
                email_variants = get_email_variants(email)
                print(f"[INVITE] Searching for user with email variants: {email_variants}")

                invitee_response = service_role_client.table("profiles")\
                    .select("*")\
                    .in_("email_address", email_variants)\
                    .execute()

                if not invitee_response.data or len(invitee_response.data) == 0:
                    print(f"[INVITE] User not found: {email}")
                    results.append({
                        "email": email,
                        "status": "error",
                        "message": "User not found with this email"
                    })
                    error_count += 1
                    continue

                invitee = invitee_response.data[0]
                print(f"[INVITE] Found user: {invitee['id']} ({invitee.get('email_address')}) for search: {email}")

                # Check if already invited (use service role to bypass RLS)
                existing_invitation_response = service_role_client.table("event_invitations")\
                    .select("*")\
                    .eq("event_id", event["id"])\
                    .eq("invitee_id", invitee["id"])\
                    .execute()

                existing_invitation = existing_invitation_response.data[0] if existing_invitation_response.data else None

                # If already invited and status is pending or accepted, return success (no re-invite needed)
                if existing_invitation and existing_invitation["status"] in ["pending", "accepted"]:
                    print(f"[INVITE] User already invited: {email} (status: {existing_invitation['status']})")
                    results.append({
                        "email": email,
                        "status": "success",
                        "message": "Invitation already sent",
                        "invitation_id": existing_invitation["id"]
                    })
                    success_count += 1
                    continue

                # Check if already a participant (use service role)
                participant_response = service_role_client.table("event_participants")\
                    .select("*")\
                    .eq("event_id", event["id"])\
                    .eq("user_id", invitee["id"])\
                    .execute()

                if participant_response.data and len(participant_response.data) > 0:
                    print(f"[INVITE] User already a participant: {email}")
                    results.append({
                        "email": email,
                        "status": "error",
                        "message": "Already a participant"
                    })
                    error_count += 1
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
                
                print(f"[INVITE] Successfully created invitation for {email}")
                results.append({
                    "email": email,
                    "status": "success",
                    "message": "Invitation sent" if not existing_invitation else "Invitation resent",
                    "invitation_id": invitation["id"]
                })
                success_count += 1

            except Exception as e:
                print(f"[INVITE] ERROR inviting {email}: {e}")
                import traceback
                traceback.print_exc()
                results.append({
                    "email": email,
                    "status": "error",
                    "message": str(e)
                })
                error_count += 1

        print(f"[INVITE] Invitation process complete: {success_count} success, {error_count} failed")

        return jsonify({
            "results": results,
            "summary": {
                "total": len(invitee_emails),
                "success": success_count,
                "failed": error_count
            }
        }), 200
    
    # GET method - existing logic
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

