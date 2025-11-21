"""
Busy routes for managing user busy slots.
"""

from flask import Blueprint, request, jsonify
from ..utils.decorators import require_auth
from datetime import datetime
from typing import List, Optional
from ..services.busy_slots import BusySlotService
from ..services.events import EventsService
from ..models.busy_slot import BusySlot
from ..utils.supabase_client import get_supabase

busy_slots_bp = Blueprint("busy_slots", __name__, url_prefix="/api/busy_slots")

busy_slots_service = BusySlotService()

@busy_slots_bp.route('/<string:event_id>', methods=['POST'])
@require_auth
def add_busy_slots(event_id):
    """
    Add busy slots for an event.
    Requires authentication.
    """
    user_id = request.user.id
    data = request.get_json()
    slots = data.get("slots", [])

    try:
        # Add busy slots
        busy_slots = []
        for slot in slots:
            # Create BusySlot object
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
def get_busy_slots(event_id):
    """
    Get all busy slots for an event.
    Requires authentication.
    """
    try:
        # Get event details via service
        access_token = getattr(request, "access_token", None)
        events_service = EventsService(access_token)
        event = events_service.get_event(event_id)
        if not event:
            return jsonify({
                'error': 'Event not found',
                'message': f'No event found with id {event_id}'
            }), 404

        start_date = datetime.fromisoformat(event["earliest_date"])
        latest_date = datetime.fromisoformat(event["latest_date"])

        slots = busy_slots_service.get_busy_slots(start_date, latest_date)

        return jsonify(slots), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to get busy slots',
            'message': str(e)
        }), 400

@busy_slots_bp.route('/user/<string:user_id>', methods=['GET'])
@require_auth
def get_user_busy_slots(user_id):
    """
    Get a specific user's busy slots for an event.
    Requires authentication.
    """
    # For user busy slots, we need an event_id parameter from query params
    event_id = request.args.get('event_id')
    if not event_id:
        return jsonify({
            'error': 'Missing event_id parameter',
            'message': 'event_id is required to get user busy slots'
        }), 400

    try:
        # Get event details via service
        access_token = getattr(request, "access_token", None)
        events_service = EventsService(access_token)
        event = events_service.get_event(event_id)
        if not event:
            return jsonify({
                'error': 'Event not found',
                'message': f'No event found with id {event_id}'
            }), 404

        start_date = datetime.fromisoformat(event["earliest_date"])
        latest_date = datetime.fromisoformat(event["latest_date"])

        slots = busy_slots_service.get_user_busy_slots(user_id, start_date, latest_date)

        return jsonify(slots), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to get user busy slots',
            'message': str(e)
        }), 400

@busy_slots_bp.route('/<string:event_id>/<string:user_id>', methods=['DELETE'])
@require_auth
def delete_user_busy_slots(event_id, user_id):
    """
    Delete all busy slots for a user in an event.
    Requires authentication.
    """
    try:
        # Get event details via service
        access_token = getattr(request, "access_token", None)
        events_service = EventsService(access_token)
        event = events_service.get_event(event_id)
        if not event:
            return jsonify({
                'error': 'Event not found',
                'message': f'No event found with id {event_id}'
            }), 404

        start_date = datetime.fromisoformat(event["earliest_date"])
        latest_date = datetime.fromisoformat(event["latest_date"])

        busy_slots_service.delete_user_busy_slots_in_range(user_id, start_date, latest_date)

        return jsonify({
            'message': 'Busy slots deleted successfully'
        }), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to delete busy slots',
            'message': str(e)
        }), 400

@busy_slots_bp.route('/sync/<string:user_id>', methods=['POST'])
@require_auth
def sync_user_google_calendar(user_id):
    """
    Sync busy slots from user's Google Calendar.
    Requires authentication.
    """
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
        
        success = busy_slots_service.sync_user_google_calendar(user_id, start_date, end_date)
        
        if success:
            return jsonify({
                'message': 'Google Calendar synced successfully'
            }), 200
        else:
            return jsonify({
                'error': 'Sync failed',
                'message': 'Could not sync Google Calendar. Check credentials.'
            }), 400

    except Exception as e:
        return jsonify({
            'error': 'Failed to sync Google Calendar',
            'message': str(e)
        }), 400

@busy_slots_bp.route('/event/<string:event_id>/participants', methods=['GET'])
@require_auth
def get_event_participants_busy_slots(event_id):
    """
    Get busy slots for all participants of an event.
    Requires authentication.
    """
    try:
        # Get event details via service
        access_token = getattr(request, "access_token", None)
        events_service = EventsService(access_token)
        event = events_service.get_event(event_id)
        if not event:
            return jsonify({
                'error': 'Event not found',
                'message': f'No event found with id {event_id}'
            }), 404

        start_date = datetime.fromisoformat(event["earliest_date"])
        latest_date = datetime.fromisoformat(event["latest_date"])

        # Use database ID for service call
        slots = busy_slots_service.get_event_participants_busy_slots(
            event["id"],  # Use database ID instead of event_id parameter
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
def get_merged_busy_slots_for_event(event_id):
    """
    Get merged busy time slots for all participants of an event.
    This endpoint uses PostgreSQL RPC for complex SQL merging logic.
    Requires authentication.
    """
    try:
        # Get event details via service (handles UID lookup)
        access_token = getattr(request, "access_token", None)
        events_service = EventsService(access_token)
        
        # Use get_event_by_uid since frontend usually sends UID, but fallback to UUID check
        event = events_service.get_event_by_uid(event_id)
        if not event:
            # Try looking up by UUID if UID lookup failed
            event = events_service.get_event(event_id)
            
        if not event:
            return jsonify({
                'error': 'Event not found',
                'message': f'No event found with uid or id {event_id}'
            }), 404
            
        start_date = datetime.fromisoformat(event["earliest_date"])
        latest_date = datetime.fromisoformat(event["latest_date"])

        # Get merged busy slots using RPC (pass the database ID to service)
        merged_slots = busy_slots_service.get_merged_busy_slots_for_event(
            event["id"],  # Use database ID for service call
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