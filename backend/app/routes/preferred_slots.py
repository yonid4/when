"""
Preferred slots routes for managing user preferred time slots for events.
"""

import logging

from flask import Blueprint, request, jsonify

from ..services.events import EventsService
from ..services.preferred_slots import PreferredSlotService
from ..utils.decorators import require_auth

preferred_slots_bp = Blueprint("preferred_slots", __name__, url_prefix="/api/events")


def _get_access_token():
    """Get access token from request."""
    return getattr(request, "access_token", None)


def _get_event_by_uid_or_id(event_id: str, events_service: EventsService) -> dict | None:
    """Get event by UID first, then fallback to database ID."""
    event = events_service.get_event_by_uid(event_id)
    if not event:
        event = events_service.get_event(event_id)
    return event


def _mark_proposals_stale(event_id: str, access_token) -> None:
    """Mark proposals as stale for background regeneration."""
    try:
        from ..services.time_proposal import TimeProposalService
        time_proposal_service = TimeProposalService(access_token)
        time_proposal_service.mark_proposals_stale(event_id)
        logging.info(f"[PREFERRED_SLOTS] Marked proposals stale for event {event_id}")
    except Exception as e:
        logging.warning(f"[PREFERRED_SLOTS] Failed to mark proposals stale: {e}")


@preferred_slots_bp.route("/<string:event_id>/preferred-slots", methods=["POST"])
@require_auth
def add_preferred_slot(event_id, user_id):
    """Add a preferred time slot for an event."""
    access_token = _get_access_token()
    data = request.get_json()

    if not data or not data.get("start_time_utc") or not data.get("end_time_utc"):
        return jsonify({
            "error": "Missing required fields",
            "message": "start_time_utc and end_time_utc are required"
        }), 400

    try:
        preferred_slots_service = PreferredSlotService(access_token)
        events_service = EventsService(access_token)

        event = _get_event_by_uid_or_id(event_id, events_service)
        if not event:
            return jsonify({
                "error": "Event not found",
                "message": f"No event found with id {event_id}"
            }), 404

        db_event_id = event["id"]

        if not preferred_slots_service.is_user_event_participant(user_id, db_event_id):
            return jsonify({
                "error": "Not authorized",
                "message": "You must be a participant of this event to add preferred slots"
            }), 403

        if event.get("status") == "finalized":
            return jsonify({
                "error": "Event finalized",
                "message": "Cannot add preferred slots to a finalized event"
            }), 400

        if not preferred_slots_service.validate_slot_data(data):
            return jsonify({
                "error": "Invalid slot data",
                "message": "Slot data validation failed. Check that start_time is before end_time."
            }), 400

        slot = preferred_slots_service.insert_slot_simple(
            user_id=user_id,
            event_id=db_event_id,
            start_time=data["start_time_utc"],
            end_time=data["end_time_utc"]
        )

        if not slot:
            return jsonify({
                "error": "Failed to add preferred slot",
                "message": "Could not create preferred slot"
            }), 400

        _mark_proposals_stale(db_event_id, access_token)
        return jsonify(slot), 201

    except Exception as e:
        return jsonify({
            "error": "Failed to add preferred slot",
            "message": str(e)
        }), 400


@preferred_slots_bp.route("/<string:event_id>/preferred-slots", methods=["GET"])
@require_auth
def get_preferred_slots(event_id, user_id):
    """Get all preferred slots for an event."""
    access_token = _get_access_token()

    try:
        preferred_slots_service = PreferredSlotService(access_token)
        events_service = EventsService(access_token)

        event = _get_event_by_uid_or_id(event_id, events_service)
        if not event:
            return jsonify({
                "error": "Event not found",
                "message": f"No event found with id {event_id}"
            }), 404

        db_event_id = event["id"]

        if not preferred_slots_service.is_user_event_participant(user_id, db_event_id):
            return jsonify({
                "error": "Not authorized",
                "message": "You must be a participant of this event to view preferred slots"
            }), 403

        slots = preferred_slots_service.get_slots_for_event(db_event_id)
        return jsonify({"slots": slots}), 200

    except Exception as e:
        return jsonify({
            "error": "Failed to get preferred slots",
            "message": str(e)
        }), 400


@preferred_slots_bp.route("/<string:event_id>/preferred-slots/<string:slot_id>", methods=["DELETE"])
@require_auth
def delete_preferred_slot(event_id, slot_id, user_id):
    """Delete a specific preferred slot. Users can only delete their own slots."""
    access_token = _get_access_token()

    try:
        preferred_slots_service = PreferredSlotService(access_token)
        events_service = EventsService(access_token)

        event = _get_event_by_uid_or_id(event_id, events_service)
        if not event:
            return jsonify({
                "error": "Event not found",
                "message": f"No event found with id {event_id}"
            }), 404

        db_event_id = event["id"]

        if event.get("status") == "finalized":
            return jsonify({
                "error": "Event finalized",
                "message": "Cannot modify preferred slots on a finalized event"
            }), 400

        slot = preferred_slots_service.get_slot_by_id(slot_id)
        if not slot:
            return jsonify({
                "error": "Slot not found",
                "message": f"No preferred slot found with id {slot_id}"
            }), 404

        if slot["user_id"] != user_id:
            return jsonify({
                "error": "Not authorized",
                "message": "You can only delete your own preferred slots"
            }), 403

        if slot["event_id"] != db_event_id:
            return jsonify({
                "error": "Invalid request",
                "message": "This slot does not belong to the specified event"
            }), 400

        success = preferred_slots_service.delete_slot(slot_id)
        if not success:
            return jsonify({
                "error": "Failed to delete slot",
                "message": "Could not delete preferred slot"
            }), 400

        _mark_proposals_stale(db_event_id, access_token)
        return jsonify({"message": "Slot deleted successfully"}), 200

    except Exception as e:
        return jsonify({
            "error": "Failed to delete preferred slot",
            "message": str(e)
        }), 400
