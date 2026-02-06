"""
Routes for notification management.
"""

import logging
import os

from flask import Blueprint, request, jsonify
from supabase import create_client

from ..services.events import EventsService
from ..services.invitations import InvitationsService
from ..services.notifications import NotificationsService
from ..utils.decorators import require_auth

notifications_bp = Blueprint("notifications", __name__)


def _get_service_role_client():
    """Get service role client for bypassing RLS."""
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    if supabase_url and supabase_service_key:
        return create_client(supabase_url, supabase_service_key)
    return None


service_role_client = _get_service_role_client()


@notifications_bp.route("/api/notifications", methods=["GET"])
@require_auth
def get_notifications(user_id):
    """
    Get user's notifications.

    Query Parameters:
        unread_only: boolean - Only return unread notifications (default: false)
        limit: int - Maximum number of notifications to return (default: 50)
    """
    unread_only = request.args.get("unread_only", "false").lower() == "true"
    limit = int(request.args.get("limit", 50))

    notifications_service = NotificationsService()
    notifications = notifications_service.get_user_notifications(
        user_id=user_id,
        unread_only=unread_only,
        limit=limit
    )
    unread_count = notifications_service.get_unread_count(user_id)

    return jsonify({
        "notifications": notifications,
        "unread_count": unread_count
    }), 200


@notifications_bp.route("/api/notifications/unread-count", methods=["GET"])
@require_auth
def get_unread_count(user_id):
    """Get count of unread notifications."""
    notifications_service = NotificationsService()
    unread_count = notifications_service.get_unread_count(user_id)
    return jsonify({"unread_count": unread_count}), 200


@notifications_bp.route("/api/notifications/<notification_id>/read", methods=["POST"])
@require_auth
def mark_as_read(notification_id, user_id):
    """Mark a notification as read."""
    notifications_service = NotificationsService()
    notification = notifications_service.get_notification(notification_id, user_id)

    if not notification:
        return jsonify({"error": "Notification not found"}), 404

    success = notifications_service.mark_as_read(notification_id, user_id)

    if not success:
        return jsonify({"error": "Failed to mark as read"}), 500

    return jsonify({"success": True}), 200


@notifications_bp.route("/api/notifications/read-all", methods=["POST"])
@require_auth
def mark_all_as_read(user_id):
    """Mark all notifications as read for the current user."""
    notifications_service = NotificationsService()
    success = notifications_service.mark_all_as_read(user_id)

    if not success:
        return jsonify({"error": "Failed to mark all as read"}), 500

    return jsonify({"success": True}), 200


@notifications_bp.route("/api/notifications/<notification_id>/action", methods=["POST"])
@require_auth
def handle_notification_action(notification_id, user_id):
    """
    Handle user action on a notification (accept/decline invitation).

    Request body:
        action: "accept" or "decline"
    """
    data = request.get_json()
    action = data.get("action")

    if action not in ["accept", "decline"]:
        return jsonify({
            "error": "Invalid action",
            "message": "Action must be 'accept' or 'decline'"
        }), 400

    notifications_service = NotificationsService()
    notification = notifications_service.get_notification(notification_id, user_id)

    if not notification:
        return jsonify({"error": "Notification not found"}), 404

    if notification["notification_type"] != "event_invitation":
        return jsonify({
            "error": "Invalid notification type",
            "message": "Cannot take action on this notification type"
        }), 400

    if notification["action_taken"]:
        return jsonify({
            "error": "Action already taken",
            "message": f"You already {notification['action_type']}ed this invitation"
        }), 400

    event_id = notification["event_id"]
    metadata = notification.get("metadata") or {}
    invitation_id = metadata.get("invitation_id")

    event = None
    if action == "accept":
        result = _handle_accept_action(event_id, user_id, invitation_id)
        if result.get("error"):
            return jsonify(result), result.get("status_code", 500)
        event = result.get("event")

    elif action == "decline":
        _handle_decline_action(invitation_id)

    success = notifications_service.record_action(notification_id, user_id, action)
    if not success:
        return jsonify({"error": "Failed to record action"}), 500

    event_uid = event.get("uid") if event else None

    return jsonify({
        "success": True,
        "action": action,
        "message": f"Invitation {action}ed successfully",
        "event_uid": event_uid
    }), 200


def _handle_accept_action(event_id: str, user_id: str, invitation_id: str | None) -> dict:
    """Handle accepting an invitation."""
    access_token = getattr(request, "access_token", None)
    events_service = EventsService(access_token)

    event = events_service.get_event(event_id)
    if not event:
        logging.error(f"[NOTIFICATIONS] Event not found: {event_id}")
        return {
            "error": "Event not found",
            "message": f"This event no longer exists (event_id: {event_id})",
            "status_code": 404
        }

    try:
        participant = events_service.add_participant(event_id, user_id, status="accepted")
        if not participant:
            return {
                "error": "Failed to accept invitation",
                "message": "Could not add participant to event",
                "status_code": 500
            }
    except Exception as e:
        logging.error(f"[NOTIFICATIONS] Error adding participant: {e}")
        return {
            "error": "Failed to accept invitation",
            "message": str(e),
            "status_code": 500
        }

    if invitation_id:
        try:
            invitations_service = InvitationsService()
            invitations_service.update_invitation_status(invitation_id, "accepted")
        except Exception as e:
            logging.warning(f"[NOTIFICATIONS] Failed to update invitation status: {e}")

    return {"event": event}


def _handle_decline_action(invitation_id: str | None) -> None:
    """Handle declining an invitation."""
    if invitation_id:
        try:
            invitations_service = InvitationsService()
            invitations_service.update_invitation_status(invitation_id, "declined")
        except Exception as e:
            logging.warning(f"[NOTIFICATIONS] Failed to update invitation status: {e}")


@notifications_bp.route("/api/notifications/<notification_id>", methods=["DELETE"])
@require_auth
def delete_notification(notification_id, user_id):
    """Delete a notification."""
    notifications_service = NotificationsService()
    success = notifications_service.delete_notification(notification_id, user_id)

    if not success:
        return jsonify({"error": "Notification not found"}), 404

    return jsonify({"success": True}), 200
