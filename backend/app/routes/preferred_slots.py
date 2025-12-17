"""
Preferred slots routes for managing user preferred time slots for events.
"""

from flask import Blueprint, request, jsonify
from ..utils.decorators import require_auth
from ..services.preferred_slots import PreferredSlotService
from ..services.events import EventsService

preferred_slots_bp = Blueprint("preferred_slots", __name__, url_prefix="/api/events")


@preferred_slots_bp.route("/<string:event_id>/preferred-slots", methods=["POST"])
@require_auth
def add_preferred_slot(event_id, user_id):
    """
    Add a preferred time slot for an event.
    Handles overlap with existing slots intelligently by merging them.
    Requires authentication.
    
    Request body:
    {
        "start_time_utc": "2025-11-10T22:00:00Z",
        "end_time_utc": "2025-11-10T23:30:00Z"
    }
    """

    access_token = getattr(request, "access_token", None)
    data = request.get_json()

    # Validate input
    if not data or not data.get("start_time_utc") or not data.get("end_time_utc"):
        return jsonify({
            "error": "Missing required fields",
            "message": "start_time_utc and end_time_utc are required"
        }), 400

    try:
        # Initialize services
        preferred_slots_service = PreferredSlotService(access_token)
        events_service = EventsService(access_token)

        # Verify event exists (try UID first, then database ID)
        event = events_service.get_event_by_uid(event_id)
        if not event:
            event = events_service.get_event(event_id)
        
        if not event:
            return jsonify({
                "error": "Event not found",
                "message": f"No event found with id {event_id}"
            }), 404

        # Use the database ID for operations
        db_event_id = event["id"]

        # Verify user is a participant
        if not preferred_slots_service.is_user_event_participant(user_id, db_event_id):
            return jsonify({
                "error": "Not authorized",
                "message": "You must be a participant of this event to add preferred slots"
            }), 403

        # Check if event is finalized
        if event.get("status") == "finalized":
            return jsonify({
                "error": "Event finalized",
                "message": "Cannot add preferred slots to a finalized event"
            }), 400

        # Validate slot data
        if not preferred_slots_service.validate_slot_data(data):
            return jsonify({
                "error": "Invalid slot data",
                "message": "Slot data validation failed. Check that start_time is before end_time."
            }), 400

        # Add the preferred slot (no overlap handling - keep slots separate)
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

        # Mark proposals as stale for background regeneration
        try:
            from ..services.time_proposal import TimeProposalService
            time_proposal_service = TimeProposalService(access_token)
            time_proposal_service.mark_proposals_stale(db_event_id)
            print(f"[PREFERRED_SLOTS] Marked proposals as stale for event {db_event_id} after adding preferred slot")
        except Exception as stale_error:
            print(f"[PREFERRED_SLOTS] Warning: Failed to mark proposals as stale: {str(stale_error)}")
            # Don't fail the request if marking as stale fails

        return jsonify(slot), 201

    except Exception as e:
        return jsonify({
            "error": "Failed to add preferred slot",
            "message": str(e)
        }), 400


@preferred_slots_bp.route("/<string:event_id>/preferred-slots", methods=["GET"])
@require_auth
def get_preferred_slots(event_id, user_id):
    """
    Get all preferred slots for an event.
    Includes user information for each slot.
    Requires authentication.
    """

    access_token = getattr(request, "access_token", None)

    try:
        # Initialize services
        preferred_slots_service = PreferredSlotService(access_token)
        events_service = EventsService(access_token)

        # Verify event exists (try UID first, then database ID)
        event = events_service.get_event_by_uid(event_id)
        if not event:
            event = events_service.get_event(event_id)
        
        if not event:
            return jsonify({
                "error": "Event not found",
                "message": f"No event found with id {event_id}"
            }), 404

        # Use the database ID for operations
        db_event_id = event["id"]

        # Verify user is a participant
        if not preferred_slots_service.is_user_event_participant(user_id, db_event_id):
            return jsonify({
                "error": "Not authorized",
                "message": "You must be a participant of this event to view preferred slots"
            }), 403

        # Get all slots for the event
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
    """
    Delete a specific preferred slot.
    Users can only delete their own slots.
    Requires authentication.
    """

    access_token = getattr(request, "access_token", None)

    try:
        # Initialize services
        preferred_slots_service = PreferredSlotService(access_token)
        events_service = EventsService(access_token)

        # Verify event exists (try UID first, then database ID)
        event = events_service.get_event_by_uid(event_id)
        if not event:
            event = events_service.get_event(event_id)
        
        if not event:
            return jsonify({
                "error": "Event not found",
                "message": f"No event found with id {event_id}"
            }), 404

        # Use the database ID for operations
        db_event_id = event["id"]

        # Get the slot
        slot = preferred_slots_service.get_slot_by_id(slot_id)
        if not slot:
            return jsonify({
                "error": "Slot not found",
                "message": f"No preferred slot found with id {slot_id}"
            }), 404

        # Verify ownership (RLS will also enforce this, but we check here for better error messages)
        if slot["user_id"] != user_id:
            return jsonify({
                "error": "Not authorized",
                "message": "You can only delete your own preferred slots"
            }), 403

        # Verify slot belongs to this event
        if slot["event_id"] != db_event_id:
            return jsonify({
                "error": "Invalid request",
                "message": "This slot does not belong to the specified event"
            }), 400

        # Delete the slot
        success = preferred_slots_service.delete_slot(slot_id)
        if not success:
            return jsonify({
                "error": "Failed to delete slot",
                "message": "Could not delete preferred slot"
            }), 400

        # Mark proposals as stale for background regeneration
        try:
            from ..services.time_proposal import TimeProposalService
            time_proposal_service = TimeProposalService(access_token)
            time_proposal_service.mark_proposals_stale(db_event_id)
            print(f"[PREFERRED_SLOTS] Marked proposals as stale for event {db_event_id} after deleting preferred slot")
        except Exception as stale_error:
            print(f"[PREFERRED_SLOTS] Warning: Failed to mark proposals as stale: {str(stale_error)}")
            # Don't fail the request if marking as stale fails

        return jsonify({"message": "Slot deleted successfully"}), 200

    except Exception as e:
        return jsonify({
            "error": "Failed to delete preferred slot",
            "message": str(e)
        }), 400


