"""
Event routes for managing events and event participants.
"""

from flask import Blueprint, request, jsonify
from ..utils.decorators import require_auth
from datetime import datetime
import logging
from ..services.events import EventsService

event_bp = Blueprint("events", __name__, url_prefix="/api/events")

@event_bp.route('/', methods=['POST'])
@require_auth
def create_event():
    """
    Create a new event.
    Requires authentication.
    """
    data = request.get_json()
    user_id = request.user.id
    
    # Log the incoming request data
    logging.info(f"[EVENT] Creating event with data: {data}")
    logging.info(f"[EVENT] User ID: {user_id}")

    def parse_iso_date(date_str):
        if not date_str:
            return None
        try:
            # Remove 'Z' and add '+00:00' if present
            if date_str.endswith('Z'):
                date_str = date_str[:-1] + '+00:00'
            return datetime.fromisoformat(date_str).date()
        except ValueError as e:
            logging.error(f"[EVENT] Error parsing date {date_str}: {e}")
            raise ValueError(f"Invalid date format: {date_str}")

    def parse_time_str(time_str):
        if not time_str:
            return None
        try:
            return datetime.strptime(time_str, "%H:%M").time()
        except ValueError as e:
            logging.error(f"[EVENT] Error parsing time {time_str}: {e}")
            raise ValueError(f"Invalid time format: {time_str}")

    try:
        # Validate required fields
        required_fields = ["name", "start_date", "end_date", "earliest_daily_start_time", "latest_daily_end_time", "duration_minutes"]
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            logging.error(f"[EVENT] {error_msg}")
            return jsonify({
                'error': 'Validation error',
                'message': error_msg
            }), 400

        # Parse dates and times
        start_date = parse_iso_date(data.get("start_date"))
        end_date = parse_iso_date(data.get("end_date"))
        earliest_hour = parse_time_str(data.get("earliest_daily_start_time"))
        latest_hour = parse_time_str(data.get("latest_daily_end_time"))
        
        # Generate a 12-character UID for the event
        import string
        import random
        event_uid = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        
        # Create event
        event_data = {
            "uid": event_uid,
            "name": data.get("name"),
            "description": data.get("description"),
            "coordinator_id": user_id,
            "earliest_date": start_date.isoformat() if start_date else None,
            "latest_date": end_date.isoformat() if end_date else None,
            "earliest_hour": earliest_hour.isoformat() if earliest_hour else None,
            "latest_hour": latest_hour.isoformat() if latest_hour else None,
            "duration_minutes": int(data.get("duration_minutes")),  # Convert to integer
            "status": "planning"  # Default status
        }
        
        logging.info(f"[EVENT] Inserting event data: {event_data}")
        
        # Pass the access token to ensure RLS compliance
        access_token = getattr(request, "access_token", None)
        events_service = EventsService(access_token)

        event = events_service.create_event(event_data)

        # Add creator as participant
        events_service.add_participant(event['id'], user_id)

        logging.info(f"[EVENT] Successfully created event {event['id']}")
        return jsonify(event), 201

    except ValueError as e:
        error_msg = str(e)
        logging.error(f"[EVENT] Validation error: {error_msg}")
        return jsonify({
            'error': 'Validation error',
            'message': error_msg
        }), 400
    except Exception as e:
        error_msg = str(e)
        logging.error(f"[EVENT] Failed to create event: {error_msg}")
        return jsonify({
            'error': 'Failed to create event',
            'message': error_msg
        }), 400

@event_bp.route('/', methods=['GET'])
@require_auth
def get_user_events():
    """
    Get all events for the authenticated user (coordinator and participant).
    Requires authentication.
    """
    try:
        user_id = request.user.id
        access_token = getattr(request, "access_token", None)
        events_service = EventsService(access_token)
        
        events = events_service.get_user_events(user_id)
        
        logging.info(f"[EVENT] Retrieved {len(events)} events for user {user_id}")
        return jsonify(events), 200
        
    except Exception as e:
        error_msg = str(e)
        logging.error(f"[EVENT] Failed to get user events: {error_msg}")
        return jsonify({
            'error': 'Failed to get user events',
            'message': error_msg
        }), 400

@event_bp.route('/<string:event_id>', methods=['GET'])
@require_auth
def get_event(event_id):
    """
    Get event details by UID or ID.
    Requires authentication.
    """
    try:
        access_token = getattr(request, "access_token", None)
        events_service = EventsService(access_token)
        # Try to get by UID first (since event_id in URL is actually the UID)
        event = events_service.get_event_by_uid(event_id)
        if not event:
            # Fallback to ID lookup for backward compatibility
            event = events_service.get_event(event_id)
        if not event:
            return jsonify({
                'error': 'Event not found',
                'message': f'No event found with id/uid {event_id}'
            }), 404
        return jsonify(event), 200
    except Exception as e:
        return jsonify({
            'error': 'Failed to get event',
            'message': str(e)
        }), 400

@event_bp.route('/<string:event_id>', methods=['PUT'])
@require_auth
def update_event(event_id):
    """
    Update an event.
    Requires authentication.
    """
    try:
        user_id = request.user.id
        data = request.get_json()
        access_token = getattr(request, "access_token", None)
        events_service = EventsService(access_token)
        event = events_service.update_event(event_id, data)
        return jsonify(event), 200
    except Exception as e:
        return jsonify({
            'error': 'Failed to update event',
            'message': str(e)
        }), 400

@event_bp.route('/<string:event_id>', methods=['DELETE'])
@require_auth
def delete_event(event_id):
    """
    Delete an event.
    Requires authentication.
    """
    try:
        user_id = request.user.id
        access_token = getattr(request, "access_token", None)
        events_service = EventsService(access_token)
        
        # Check if user is coordinator
        event = events_service.get_event(event_id)
        if not event:
            return jsonify({
                'error': 'Event not found',
                'message': f'No event found with id {event_id}'
            }), 404
            
        if event.get('coordinator_id') != user_id:
            return jsonify({
                'error': 'Access denied',
                'message': 'Only the event coordinator can delete the event'
            }), 403
        
        success = events_service.delete_event(event_id)
        if not success:
            return jsonify({
                'error': 'Failed to delete event',
                'message': 'Event could not be deleted'
            }), 400
            
        return jsonify({
            'message': 'Event deleted successfully'
        }), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to delete event',
            'message': str(e)
        }), 400

@event_bp.route('/<string:event_uid>/participants', methods=['GET'])
@require_auth
def get_event_participants(event_uid):
    """
    Get participants of an event by UID.
    Requires authentication.
    """
    try:
        access_token = getattr(request, "access_token", None)
        events_service = EventsService(access_token)
        
        logging.info(f"[EVENT] Getting participants for event UID: {event_uid}")
        participants = events_service.get_event_participants(event_uid)
        logging.info(f"[EVENT] Found {len(participants)} participants")
        
        return jsonify(participants), 200
    except Exception as e:
        logging.error(f"[EVENT] Failed to get participants: {str(e)}")
        return jsonify({
            'error': 'Failed to get participants',
            'message': str(e)
        }), 400

@event_bp.route('/<string:event_id>/participants', methods=['POST'])
@require_auth
def add_participant(event_id):
    """
    Add a participant to an event.
    Requires authentication.
    """
    user_id = request.user.id
    data = request.get_json()
    participant_id = data.get("user_id")

    try:
        access_token = getattr(request, "access_token", None)
        events_service = EventsService(access_token)
        participant = events_service.add_participant(event_id, participant_id)
        if not participant:
            return jsonify({
                'error': 'Failed to add participant',
                'message': 'User may already be a participant or event not found'
            }), 400
        return jsonify(participant), 201

    except Exception as e:
        return jsonify({
            'error': 'Failed to add participant',
            'message': str(e)
        }), 400

@event_bp.route('/<string:event_id>/participants/<string:participant_id>', methods=['DELETE'])
@require_auth
def remove_participant(event_id, participant_id):
    """
    Remove a participant from an event.
    Requires authentication.
    """
    try:
        access_token = getattr(request, "access_token", None)
        events_service = EventsService(access_token)
        success = events_service.remove_participant(event_id, participant_id)
        if not success:
            return jsonify({
                'error': 'Failed to remove participant',
                'message': 'Participant may not exist or event not found'
            }), 400
        return jsonify({
            'message': 'Participant removed successfully'
        }), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to remove participant',
            'message': str(e)
        }), 400