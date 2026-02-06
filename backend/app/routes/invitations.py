"""
Routes for event invitation management.
"""

import logging
import os
from datetime import datetime, timezone

from flask import Blueprint, request, jsonify
from supabase import create_client

from ..services.invitations import InvitationsService
from ..services.notifications import NotificationsService
from ..utils.decorators import require_auth
from ..utils.email_utils import get_email_variants

invitations_bp = Blueprint("invitations", __name__)
invitations_service = InvitationsService()


def _get_service_role_client():
    """Get service role client for bypassing RLS."""
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    if supabase_url and supabase_service_key:
        return create_client(supabase_url, supabase_service_key)
    return None


service_role_client = _get_service_role_client()


def _get_event_by_uid(event_uid: str) -> dict | None:
    """Get event by UID using service role client."""
    if not service_role_client:
        return None

    response = (
        service_role_client.table("events")
        .select("*")
        .eq("uid", event_uid)
        .execute()
    )
    return response.data[0] if response.data else None


def _check_invite_permission(event: dict, user_id: str) -> tuple[bool, str | None]:
    """Check if user has permission to invite. Returns (has_permission, error_message)."""
    if event["coordinator_id"] == user_id:
        return True, None

    participant_response = (
        service_role_client.table("event_participants")
        .select("can_invite")
        .eq("event_id", event["id"])
        .eq("user_id", user_id)
        .execute()
    )

    if not participant_response.data:
        return False, "You must be a participant to invite others"

    if not participant_response.data[0].get("can_invite"):
        return False, "You don't have permission to invite users"

    return True, None


def _get_coordinator_name(user_id: str) -> str:
    """Get coordinator's display name."""
    response = (
        service_role_client.table("profiles")
        .select("*")
        .eq("id", user_id)
        .execute()
    )

    if not response.data:
        return "Someone"

    coordinator = response.data[0]
    return coordinator.get("full_name") or coordinator.get("email_address", "Someone")


def _process_invitation(email: str, event: dict, user_id: str, coordinator_name: str) -> dict:
    """Process a single invitation and return result."""
    event_id = event["id"]
    event_title = event.get("name") or event.get("title") or "Untitled Event"

    # Find user by email variants
    email_variants = get_email_variants(email)
    invitee_response = (
        service_role_client.table("profiles")
        .select("*")
        .in_("email_address", email_variants)
        .execute()
    )

    if not invitee_response.data:
        return {"email": email, "status": "error", "message": "User not found with this email"}

    invitee = invitee_response.data[0]
    invitee_id = invitee["id"]

    # Check existing invitation
    existing_response = (
        service_role_client.table("event_invitations")
        .select("*")
        .eq("event_id", event_id)
        .eq("invitee_id", invitee_id)
        .execute()
    )
    existing_invitation = existing_response.data[0] if existing_response.data else None

    # Already invited with pending/accepted status
    if existing_invitation and existing_invitation["status"] in ["pending", "accepted"]:
        return {
            "email": email,
            "status": "success",
            "message": "Invitation already sent",
            "invitation_id": existing_invitation["id"]
        }

    # Check if already a participant
    participant_response = (
        service_role_client.table("event_participants")
        .select("*")
        .eq("event_id", event_id)
        .eq("user_id", invitee_id)
        .execute()
    )

    if participant_response.data:
        return {"email": email, "status": "error", "message": "Already a participant"}

    # Update declined invitation or create new one
    now = datetime.now(timezone.utc).isoformat()

    if existing_invitation and existing_invitation["status"] == "declined":
        update_response = (
            service_role_client.table("event_invitations")
            .update({"status": "pending", "updated_at": now})
            .eq("id", existing_invitation["id"])
            .execute()
        )
        invitation = update_response.data[0] if update_response.data else existing_invitation
    else:
        invitation_data = {
            "event_id": event_id,
            "inviter_id": user_id,
            "invitee_id": invitee_id,
            "invitee_email": email,
            "status": "pending",
            "created_at": now,
            "updated_at": now
        }
        insert_response = (
            service_role_client.table("event_invitations")
            .insert(invitation_data)
            .execute()
        )

        if not insert_response.data:
            return {"email": email, "status": "error", "message": "Failed to create invitation"}

        invitation = insert_response.data[0]

    # Create notification
    try:
        access_token = getattr(request, "access_token", None)
        notifications_service = NotificationsService(access_token)
        notifications_service.create_event_invitation_notification(
            user_id=invitee_id,
            event_id=event_id,
            event_title=event_title,
            coordinator_id=user_id,
            coordinator_name=coordinator_name,
            invitation_id=invitation["id"]
        )
    except Exception as e:
        logging.warning(f"[INVITE] Failed to create notification for {email}: {e}")

    return {
        "email": email,
        "status": "success",
        "message": "Invitation sent" if not existing_invitation else "Invitation resent",
        "invitation_id": invitation["id"]
    }


def _send_invitations_impl(event_uid: str, user_id: str, emails: list[str]) -> tuple[dict, int]:
    """Implementation for sending invitations. Returns (response_dict, status_code)."""
    if not emails:
        return {"error": "No emails provided"}, 400

    if not service_role_client:
        return {"error": "Server configuration error"}, 500

    event = _get_event_by_uid(event_uid)
    if not event:
        return {"error": "Event not found"}, 404

    has_permission, error_msg = _check_invite_permission(event, user_id)
    if not has_permission:
        return {"error": error_msg}, 403

    coordinator_name = _get_coordinator_name(user_id)

    results = []
    success_count = 0
    error_count = 0

    for email in emails:
        try:
            result = _process_invitation(email, event, user_id, coordinator_name)
            results.append(result)

            if result["status"] == "success":
                success_count += 1
            else:
                error_count += 1

        except Exception as e:
            logging.error(f"[INVITE] Error inviting {email}: {e}")
            results.append({"email": email, "status": "error", "message": str(e)})
            error_count += 1

    logging.info(f"[INVITE] Complete: {success_count} success, {error_count} failed")

    return {
        "results": results,
        "summary": {
            "total": len(emails),
            "success": success_count,
            "failed": error_count
        }
    }, 200


@invitations_bp.route("/api/events/<event_uid>/invite", methods=["POST"])
@require_auth
def send_invitations(event_uid: str, user_id):
    """Send invitations to multiple users for an event."""
    data = request.get_json()
    emails = data.get("emails", [])
    response, status_code = _send_invitations_impl(event_uid, user_id, emails)
    return jsonify(response), status_code


@invitations_bp.route("/api/events/<event_uid>/invitations", methods=["GET", "POST"])
@require_auth
def handle_event_invitations(event_uid: str, user_id):
    """
    Handle invitations for an event.
    GET: Get all invitations for an event (coordinator only).
    POST: Send invitations to multiple users for an event.
    """
    if request.method == "POST":
        data = request.get_json()
        emails = data.get("emails", [])
        response, status_code = _send_invitations_impl(event_uid, user_id, emails)
        return jsonify(response), status_code

    # GET method
    if not service_role_client:
        return jsonify({"error": "Server configuration error"}), 500

    event = _get_event_by_uid(event_uid)
    if not event:
        return jsonify({"error": "Event not found"}), 404

    if event["coordinator_id"] != user_id:
        return jsonify({"error": "Only coordinator can view invitations"}), 403

    invitations = invitations_service.get_event_invitations(event["id"])
    return jsonify({"invitations": invitations}), 200
