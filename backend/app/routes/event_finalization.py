"""
Routes for event finalization with Google Calendar integration.
"""

import logging
import traceback
from datetime import datetime

from flask import Blueprint, request, jsonify

from ..services.event_finalization import EventFinalizationService
from ..services.events import EventsService
from ..utils.decorators import require_auth

event_finalization_bp = Blueprint("event_finalization", __name__)


def _get_error_response(error_message: str) -> tuple:
    """Map error messages to appropriate HTTP responses."""
    error_lower = error_message.lower()

    if "not found" in error_lower:
        return {"error": "Not found", "message": error_message}, 404

    if "only coordinator" in error_lower:
        return {"error": "Unauthorized", "message": error_message}, 403

    if "already finalized" in error_lower:
        return {"error": "Already finalized", "message": error_message}, 400

    calendar_errors = ["not connected", "authentication", "invalid_grant", "refresh"]
    if any(err in error_lower for err in calendar_errors):
        return {
            "error": "Calendar not connected",
            "message": "Your Google Calendar connection has expired. Please log out and log back in to reconnect your calendar.",
            "needs_reconnect": True
        }, 401

    return {
        "error": "Finalization failed",
        "message": error_message,
        "traceback": traceback.format_exc() if __debug__ else None
    }, 500


@event_finalization_bp.route("/api/events/<event_uid>/finalize", methods=["POST"])
@require_auth
def finalize_event(event_uid, user_id):
    """
    Finalize an event and create Google Calendar event with invitations.

    Request body:
        start_time_utc: ISO datetime string
        end_time_utc: ISO datetime string
        participant_ids: list of user UUIDs
        include_google_meet: boolean (optional)

    Returns finalization result with Google Calendar details.
    """
    logging.info(f"[FINALIZE] Request for event {event_uid} by user {user_id}")

    data = request.get_json()

    required_fields = ["start_time_utc", "end_time_utc", "participant_ids"]
    for field in required_fields:
        if field not in data:
            logging.error(f"[FINALIZE] Missing field: {field}")
            return jsonify({
                "error": "Missing required field",
                "message": f"Field '{field}' is required"
            }), 400

    if not data["participant_ids"]:
        return jsonify({
            "error": "Invalid participants",
            "message": "At least one participant is required"
        }), 400

    try:
        start_time = datetime.fromisoformat(data["start_time_utc"].replace("Z", "+00:00"))
        end_time = datetime.fromisoformat(data["end_time_utc"].replace("Z", "+00:00"))

        if end_time <= start_time:
            return jsonify({
                "error": "Invalid time range",
                "message": "End time must be after start time"
            }), 400
    except (ValueError, AttributeError) as e:
        logging.error(f"[FINALIZE] Invalid datetime format: {e}")
        return jsonify({
            "error": "Invalid datetime format",
            "message": "Times must be in ISO format (e.g., '2025-11-10T22:00:00Z')"
        }), 400

    events_service = EventsService()
    event = events_service.get_event_by_uid(event_uid)

    if not event:
        logging.error(f"[FINALIZE] Event not found: {event_uid}")
        return jsonify({
            "error": "Event not found",
            "message": f"Event with UID '{event_uid}' not found"
        }), 404

    db_event_id = event["id"]

    try:
        finalization_service = EventFinalizationService()
        result = finalization_service.finalize_event(
            event_id=db_event_id,
            coordinator_id=user_id,
            start_time_utc=data["start_time_utc"],
            end_time_utc=data["end_time_utc"],
            participant_ids=data["participant_ids"],
            include_google_meet=data.get("include_google_meet", False)
        )

        logging.info(f"[FINALIZE] Success for event {event_uid}")
        return jsonify(result), 200

    except Exception as e:
        error_message = str(e)
        logging.error(f"[FINALIZE] Exception: {error_message}")
        logging.error(f"[FINALIZE] Traceback: {traceback.format_exc()}")

        response, status_code = _get_error_response(error_message)
        return jsonify(response), status_code


@event_finalization_bp.route("/api/events/<event_uid>/finalize/status", methods=["GET"])
@require_auth
def get_finalization_status(event_uid, user_id):
    """Get finalization status of an event."""
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
    """Test route to verify blueprint is registered."""
    return jsonify({"message": "Test route works!"}), 200