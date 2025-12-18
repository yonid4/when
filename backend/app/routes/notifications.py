"""
Routes for notification management.
"""

import os
from flask import Blueprint, request, jsonify
from supabase import create_client
from ..utils.decorators import require_auth
from ..services.notifications import NotificationsService
from ..services.events import EventsService
from ..services.invitations import InvitationsService

notifications_bp = Blueprint("notifications", __name__)

# Create service role client for event queries (bypasses RLS)
def get_service_role_client():
    """Get service role client for bypassing RLS."""
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    if supabase_url and supabase_service_key:
        return create_client(supabase_url, supabase_service_key)
    return None

service_role_client = get_service_role_client()


@notifications_bp.route("/api/notifications", methods=["GET"])
@require_auth
def get_notifications(user_id):
    """
    Get user's notifications.
    
    Query Parameters:
        unread_only: boolean - Only return unread notifications (default: false)
        limit: int - Maximum number of notifications to return (default: 50)
    
    Returns:
        {
            "notifications": [...],
            "unread_count": 0
        }
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
    
    # Verify ownership
    notification = notifications_service.get_notification(notification_id, user_id)
    
    if not notification:
        return jsonify({"error": "Notification not found"}), 404
    
    # Mark as read
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
        {
            "action": "accept" | "decline"
        }
    """
    # Debug logging
    print(f"DEBUG: Action endpoint called for notification {notification_id}")
    print(f"DEBUG: Request method: {request.method}")
    print(f"DEBUG: Authorization header: {request.headers.get('Authorization', 'NOT FOUND')}")
    print(f"DEBUG: User ID from request.user: {getattr(request, 'user', None)}")
    
    print(f"DEBUG: User ID extracted: {user_id}")
    
    data = request.get_json()
    print(f"DEBUG: Request body: {data}")
    
    action = data.get("action")
    
    if action not in ["accept", "decline"]:
        return jsonify({
            "error": "Invalid action",
            "message": "Action must be 'accept' or 'decline'"
        }), 400
    
    notifications_service = NotificationsService()
    
    # Get notification
    print(f"=== DEBUG: Getting notification ===")
    print(f"notification_id: {notification_id}")
    print(f"user_id: {user_id}")
    
    notification = notifications_service.get_notification(notification_id, user_id)
    print(f"Notification retrieved: {notification}")
    
    if not notification:
        print("ERROR: Notification not found")
        return jsonify({"error": "Notification not found"}), 404
    
    print(f"Notification keys: {list(notification.keys())}")
    print(f"Notification event_id: {notification.get('event_id')}")
    print(f"Notification event_id type: {type(notification.get('event_id'))}")
    
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
    invitation_id = notification.get("metadata", {}).get("invitation_id") if notification.get("metadata") else None
    
    print(f"=== DEBUG: Event lookup ===")
    print(f"event_id from notification: {event_id}")
    print(f"event_id type: {type(event_id)}")
    print(f"event_id repr: {repr(event_id)}")
    
    if action == "accept":
        # Add user as participant
        access_token = getattr(request, "access_token", None)
        events_service = EventsService(access_token)
        
        # Check if event exists - try direct query first for debugging (use service role to bypass RLS)
        print(f"Attempting to fetch event with id: {event_id}")
        try:
            if service_role_client:
                # Try direct query using service role client to see what happens
                print(f"Executing direct query: SELECT * FROM events WHERE id = '{event_id}'")
                event_response = service_role_client.table("events").select("*").eq("id", event_id).execute()
                print(f"Event query response type: {type(event_response)}")
                print(f"Event query response.data: {event_response.data}")
                print(f"Event query response.data length: {len(event_response.data) if event_response.data else 0}")
                
                if event_response.data and len(event_response.data) > 0:
                    print(f"Event found via direct query: {event_response.data[0]}")
                    print(f"Event keys: {list(event_response.data[0].keys())}")
                else:
                    print("ERROR: Direct query returned empty - event not found in database")
                    
                    # Try to see if there are any events at all
                    all_events = service_role_client.table("events").select("id, name, uid").limit(5).execute()
                    print(f"Sample events in database: {all_events.data}")
            else:
                print("WARNING: Service role client not available for debug query")
                
        except Exception as e:
            print(f"ERROR in direct query: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
        
        # Now try using the service method
        print(f"Attempting to fetch event using EventsService.get_event()...")
        event = events_service.get_event(event_id)
        print(f"EventsService.get_event() returned: {event}")
        
        if not event:
            print(f"ERROR: EventsService.get_event() returned None")
            return jsonify({
                "error": "Event not found",
                "message": f"This event no longer exists (event_id: {event_id})"
            }), 404
        
        print(f"Event found via service: {event.get('name', 'No name')} (id: {event.get('id')})")
        
        # Add participant (status defaults to "pending", we'll update it to "accepted")
        try:
            # Pass status="accepted" directly to avoid constraint issues with "pending"
            participant = events_service.add_participant(event_id, user_id, status="accepted")
            if not participant:
                return jsonify({
                    "error": "Failed to accept invitation",
                    "message": "Could not add participant to event"
                }), 500
            
            # No need to update status separately anymore
            # events_service.update_participant_status(event_id, user_id, "accepted")
        except Exception as e:
            print(f"Error adding participant: {e}")
            return jsonify({
                "error": "Failed to accept invitation",
                "message": str(e)
            }), 500
        
        # Update invitation status to accepted
        if invitation_id:
            invitations_service = InvitationsService()
            try:
                invitations_service.update_invitation_status(invitation_id, "accepted")
            except Exception as e:
                print(f"Warning: Failed to update invitation status: {e}")
    
    elif action == "decline":
        # Update invitation status to declined
        if invitation_id:
            invitations_service = InvitationsService()
            try:
                invitations_service.update_invitation_status(invitation_id, "declined")
            except Exception as e:
                print(f"Warning: Failed to update invitation status: {e}")
    
    # Record action
    success = notifications_service.record_action(notification_id, user_id, action)

    if not success:
        return jsonify({"error": "Failed to record action"}), 500

    # Get event UID for redirect (if action is accept)
    event_uid = None
    if action == "accept" and event:
        event_uid = event.get("uid")

    return jsonify({
        "success": True,
        "action": action,
        "message": f"Invitation {action}ed successfully",
        "event_uid": event_uid
    }), 200


@notifications_bp.route("/api/notifications/<notification_id>", methods=["DELETE"])
@require_auth
def delete_notification(notification_id, user_id):
    """Delete a notification."""

    
    notifications_service = NotificationsService()
    
    success = notifications_service.delete_notification(notification_id, user_id)
    
    if not success:
        return jsonify({"error": "Notification not found"}), 404
    
    return jsonify({"success": True}), 200

