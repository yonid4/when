"""
Busy slots routes for managing user busy time slots.
"""

from datetime import datetime

from flask import Blueprint, request, jsonify

from ..models.busy_slot import BusySlot
from ..services.busy_slots import BusySlotService
from ..services.events import EventsService
from ..utils.decorators import require_auth

busy_slots_bp = Blueprint("busy_slots", __name__, url_prefix="/api/busy_slots")
busy_slots_service = BusySlotService()


def _get_events_service() -> EventsService:
    """Get EventsService with access token from request."""
    return EventsService(getattr(request, "access_token", None))


def _get_event_date_range(event: dict) -> tuple[datetime, datetime]:
    """Extract start and end datetime from event's UTC timestamps."""
    earliest_utc = event["earliest_datetime_utc"].replace('Z', '+00:00')
    latest_utc = event["latest_datetime_utc"].replace('Z', '+00:00')
    return datetime.fromisoformat(earliest_utc), datetime.fromisoformat(latest_utc)


def _get_event_or_error(event_id: str):
    """Get event by ID or return error response tuple."""
    events_service = _get_events_service()
    event = events_service.get_event(event_id)

    if not event:
        return None, (jsonify({
            'error': 'Event not found',
            'message': f'No event found with id {event_id}'
        }), 404)

    return event, None


def _get_event_by_uid_or_id(event_id: str):
    """Get event by UID first, then fallback to ID."""
    events_service = _get_events_service()

    event = events_service.get_event_by_uid(event_id)
    if not event:
        event = events_service.get_event(event_id)

    if not event:
        return None, (jsonify({
            'error': 'Event not found',
            'message': f'No event found with uid or id {event_id}'
        }), 404)

    return event, None


@busy_slots_bp.route('/<string:event_id>', methods=['POST'])
@require_auth
def add_busy_slots(event_id, user_id):
    """Add busy slots for an event."""
    data = request.get_json()
    slots = data.get("slots", [])

    try:
        busy_slots = []
        for slot in slots:
            busy_slot = BusySlot(
                user_id=user_id,
                start_time_utc=datetime.fromisoformat(slot.get("start_time_utc")),
                end_time_utc=datetime.fromisoformat(slot.get("end_time_utc"))
            )

            result = busy_slots_service.store_busy_slot(busy_slot)
            if result:
                busy_slots.append(result)

        return jsonify(busy_slots), 201

    except Exception as e:
        return jsonify({
            'error': 'Failed to add busy slots',
            'message': str(e)
        }), 400


@busy_slots_bp.route('/<string:event_id>', methods=['GET'])
@require_auth
def get_busy_slots(event_id, user_id):
    """Get all busy slots for an event."""
    try:
        event, error = _get_event_or_error(event_id)
        if error:
            return error

        start_date, latest_date = _get_event_date_range(event)
        slots = busy_slots_service.get_busy_slots(start_date, latest_date)

        return jsonify(slots), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to get busy slots',
            'message': str(e)
        }), 400


@busy_slots_bp.route('/user/<string:target_user_id>', methods=['GET'])
@require_auth
def get_user_busy_slots(target_user_id, user_id):
    """Get a specific user's busy slots for an event."""
    event_id = request.args.get('event_id')
    if not event_id:
        return jsonify({
            'error': 'Missing event_id parameter',
            'message': 'event_id is required to get user busy slots'
        }), 400

    try:
        event, error = _get_event_or_error(event_id)
        if error:
            return error

        start_date, latest_date = _get_event_date_range(event)
        slots = busy_slots_service.get_user_busy_slots(target_user_id, start_date, latest_date)

        return jsonify(slots), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to get user busy slots',
            'message': str(e)
        }), 400


@busy_slots_bp.route('/<string:event_id>/<string:target_user_id>', methods=['DELETE'])
@require_auth
def delete_user_busy_slots(event_id, target_user_id, user_id):
    """Delete all busy slots for a user in an event's date range."""
    try:
        event, error = _get_event_or_error(event_id)
        if error:
            return error

        start_date, latest_date = _get_event_date_range(event)
        busy_slots_service.delete_user_busy_slots_in_range(target_user_id, start_date, latest_date)

        return jsonify({'message': 'Busy slots deleted successfully'}), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to delete busy slots',
            'message': str(e)
        }), 400


@busy_slots_bp.route('/sync/<string:target_user_id>', methods=['POST'])
@require_auth
def sync_user_calendar(target_user_id, user_id):
    """Sync busy slots from user's connected calendars (Google and/or Microsoft)."""
    data = request.get_json() or {}
    start_date_str = data.get('start_date')
    end_date_str = data.get('end_date')

    if not start_date_str or not end_date_str:
        return jsonify({
            'error': 'Missing date parameters',
            'message': 'start_date and end_date are required'
        }), 400

    try:
        start_date = datetime.fromisoformat(start_date_str)
        end_date = datetime.fromisoformat(end_date_str)

        google_success = False
        microsoft_success = False

        try:
            google_success = busy_slots_service.sync_user_google_calendar(target_user_id, start_date, end_date)
        except Exception as e:
            import logging
            logging.warning(f"Google calendar sync failed for user {target_user_id}: {e}")

        try:
            microsoft_success = busy_slots_service.sync_user_microsoft_calendar(target_user_id, start_date, end_date)
        except Exception as e:
            import logging
            logging.warning(f"Microsoft calendar sync failed for user {target_user_id}: {e}")

        if google_success or microsoft_success:
            return jsonify({'message': 'Calendar synced successfully'}), 200
        else:
            return jsonify({
                'error': 'Sync failed',
                'message': 'Could not sync calendar. Check credentials.'
            }), 400

    except Exception as e:
        return jsonify({
            'error': 'Failed to sync calendar',
            'message': str(e)
        }), 400


@busy_slots_bp.route('/event/<string:event_id>/participants', methods=['GET'])
@require_auth
def get_event_participants_busy_slots(event_id, user_id):
    """Get busy slots for all participants of an event."""
    try:
        event, error = _get_event_or_error(event_id)
        if error:
            return error

        start_date, latest_date = _get_event_date_range(event)
        slots = busy_slots_service.get_event_participants_busy_slots(
            event["id"],
            start_date,
            latest_date
        )

        return jsonify(slots), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to get event participants busy slots',
            'message': str(e)
        }), 400


@busy_slots_bp.route('/event/<string:event_id>/merged', methods=['GET'])
@require_auth
def get_merged_busy_slots_for_event(event_id, user_id):
    """
    Get merged busy time slots for all participants of an event.
    Uses PostgreSQL RPC for complex SQL merging logic.
    """
    try:
        event, error = _get_event_by_uid_or_id(event_id)
        if error:
            return error

        start_date, latest_date = _get_event_date_range(event)
        merged_slots = busy_slots_service.get_merged_busy_slots_for_event(
            event["id"],
            start_date,
            latest_date
        )

        return jsonify({
            "event_id": event_id,
            "merged_busy_slots": merged_slots,
            "total_slots": len(merged_slots),
            "date_range": {
                "start_date": start_date.isoformat(),
                "end_date": latest_date.isoformat()
            }
        }), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to get merged busy slots',
            'message': str(e)
        }), 400
