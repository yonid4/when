"""
Routes for event finalization with Google Calendar integration.
"""

from flask import Blueprint, request, jsonify
from ..utils.decorators import require_auth
from ..services.event_finalization import EventFinalizationService

event_finalization_bp = Blueprint("event_finalization", __name__)


@event_finalization_bp.route("/api/events/<event_uid>/finalize", methods=["POST"])
@require_auth
def finalize_event(event_uid, user_id):
    """
    Finalize an event and create Google Calendar event with invitations.
    
    Request body:
    {
        "start_time_utc": "2025-11-10T22:00:00Z",
        "end_time_utc": "2025-11-10T23:00:00Z",
        "participant_ids": ["uuid1", "uuid2", "uuid3"],
        "include_google_meet": true
    }
    
    Returns:
    {
        "success": true,
        "google_event_id": "...",
        "html_link": "https://calendar.google.com/...",
        "meet_link": "https://meet.google.com/..."
    }
    """
    import sys
    print("🔥🔥🔥 FINALIZE FUNCTION CALLED 🔥🔥🔥", file=sys.stderr, flush=True)
    print(f"Event UID: {event_uid}, User ID: {user_id}", file=sys.stderr, flush=True)

    import traceback

    data = request.get_json()
    
    print(f"[DEBUG] Finalization request received for event: {event_uid}")
    print(f"[DEBUG] User ID: {user_id}")
    
    # Debug logging
    print(f"[DEBUG] Finalization request received for event: {event_uid}")
    print(f"[DEBUG] User ID: {user_id}")
    print(f"[DEBUG] Request data: {data}")
    
    # Validate request data
    required_fields = ["start_time_utc", "end_time_utc", "participant_ids"]
    for field in required_fields:
        if field not in data:
            error_msg = f"Field '{field}' is required"
            print(f"[ERROR] Missing field: {field}")
            print(f"[ERROR] Available fields: {list(data.keys())}")
            return jsonify({
                "error": "Missing required field",
                "message": error_msg
            }), 400
    
    if not data["participant_ids"] or len(data["participant_ids"]) == 0:
        print(f"[ERROR] No participants provided")
        return jsonify({
            "error": "Invalid participants",
            "message": "At least one participant is required"
        }), 400
    
    # Validate time range
    try:
        from datetime import datetime
        start_time = datetime.fromisoformat(data["start_time_utc"].replace("Z", "+00:00"))
        end_time = datetime.fromisoformat(data["end_time_utc"].replace("Z", "+00:00"))
        
        if end_time <= start_time:
            return jsonify({
                "error": "Invalid time range",
                "message": "End time must be after start time"
            }), 400
    except (ValueError, AttributeError) as e:
        print(f"[ERROR] Invalid datetime format: {str(e)}")
        return jsonify({
            "error": "Invalid datetime format",
            "message": "Times must be in ISO format (e.g., '2025-11-10T22:00:00Z')"
        }), 400
    
    # Get event by UID first
    from ..services.events import EventsService
    events_service = EventsService()
    event = events_service.get_event_by_uid(event_uid)
    
    if not event:
        print(f"[ERROR] Event not found: {event_uid}")
        return jsonify({
            "error": "Event not found",
            "message": f"Event with UID '{event_uid}' not found"
        }), 404
    
    db_event_id = event["id"]
    print(f"[DEBUG] Found event ID: {db_event_id}")
    
    # Finalize the event
    finalization_service = EventFinalizationService()
    
    try:
        result = finalization_service.finalize_event(
            event_id=db_event_id,
            coordinator_id=user_id,
            start_time_utc=data["start_time_utc"],
            end_time_utc=data["end_time_utc"],
            participant_ids=data["participant_ids"],
            include_google_meet=data.get("include_google_meet", False)
        )
        
        print(f"[DEBUG] Finalization successful")
        return jsonify(result), 200
    
    except Exception as e:
        error_message = str(e)
        print(f"[ERROR] Finalization exception: {error_message}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        
        # Return user-friendly error messages
        if "not found" in error_message.lower():
            return jsonify({
                "error": "Not found",
                "message": error_message
            }), 404
        
        if "only coordinator" in error_message.lower():
            return jsonify({
                "error": "Unauthorized",
                "message": error_message
            }), 403
        
        if "already finalized" in error_message.lower():
            return jsonify({
                "error": "Already finalized",
                "message": error_message
            }), 400
        
        if "not connected" in error_message.lower() or "authentication" in error_message.lower() or "invalid_grant" in error_message.lower() or "refresh" in error_message.lower():
            return jsonify({
                "error": "Calendar not connected",
                "message": "Your Google Calendar connection has expired. Please log out and log back in to reconnect your calendar.",
                "needs_reconnect": True
            }), 401
        
        # Generic error
        return jsonify({
            "error": "Finalization failed",
            "message": error_message,
            "traceback": traceback.format_exc() if __debug__ else None
        }), 500


@event_finalization_bp.route("/api/events/<event_uid>/finalize/status", methods=["GET"])
@require_auth
def get_finalization_status(event_uid, user_id):
    """
    Get finalization status of an event.
    
    Returns:
    {
        "is_finalized": true,
        "finalized_at": "2025-11-10T22:00:00Z",
        "finalized_start_time_utc": "2025-11-10T22:00:00Z",
        "finalized_end_time_utc": "2025-11-10T23:00:00Z",
        "google_calendar_html_link": "https://calendar.google.com/..."
    }
    """
    from ..services.events import EventsService
    
    events_service = EventsService()
    event = events_service.get_event_by_uid(event_uid)
    
    if not event:
        return jsonify({
            "error": "Event not found",
            "message": f"Event with UID '{event_uid}' not found"
        }), 404
    
    return jsonify({
        "is_finalized": event.get("status") == "finalized",
        "status": event.get("status"),
        "finalized_at": event.get("finalized_at"),
        "finalized_start_time_utc": event.get("finalized_start_time_utc"),
        "finalized_end_time_utc": event.get("finalized_end_time_utc"),
        "google_calendar_html_link": event.get("google_calendar_html_link"),
        "google_calendar_event_id": event.get("google_calendar_event_id")
    }), 200


@event_finalization_bp.route("/api/events/test-finalize", methods=["GET", "POST"])
def test_finalize():
    """Test route to verify blueprint is registered"""
    print("🔥🔥🔥 TEST FINALIZE ROUTE HIT 🔥🔥🔥")
    return jsonify({"message": "Test route works!"}), 200