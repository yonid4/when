"""
Event routes for managing events and event participants.
"""

from flask import Blueprint, request, jsonify
from ..utils.decorators import require_auth
from ..utils.supabase_client import get_supabase
from datetime import datetime
import logging

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

        # Get Supabase client
        supabase = get_supabase()
        
        # Parse dates and times
        start_date = parse_iso_date(data.get("start_date"))
        end_date = parse_iso_date(data.get("end_date"))
        earliest_hour = parse_time_str(data.get("earliest_daily_start_time"))
        latest_hour = parse_time_str(data.get("latest_daily_end_time"))
        
        # Create event
        event_data = {
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
        
        event = (
            supabase.table("events")
            .insert(event_data)
            .execute()
        )

        # Add creator as participant
        event_id = event.data[0]["id"]
        (
            supabase.table("event_participants")
            .insert({
                "event_id": event_id,
                "user_id": user_id,
                "status": "accepted"
            })
            .execute()
        )

        logging.info(f"[EVENT] Successfully created event {event_id}")
        return jsonify(event.data[0]), 201

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

@event_bp.route('/<string:event_id>', methods=['GET'])
@require_auth
def get_event(event_id):
    """
    Get event details.
    Requires authentication.
    """
    try:
        # Get Supabase client
        supabase = get_supabase()
        
        # Get event
        event = (
            supabase.table("events")
            .select("*")
            .eq("id", event_id)
            .execute()
        )

        if not event.data:
            return jsonify({
                'error': 'Event not found',
                'message': f'No event found with id {event_id}'
            }), 404

        # Get participants
        participants = (
            supabase.table("event_participants")
            .select("*, profiles(*)")
            .eq("event_id", event_id)
            .execute()
        )

        event_data = event.data[0]
        event_data["participants"] = participants.data

        return jsonify(event_data), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to get event',
            'message': str(e)
        }), 400

@event_bp.route('/<string:event_id>', methods=['PUT'])
@require_auth
def update_event(event_id):
    # TODO: Check if it will be possible to update an event
    return 201

    # user_id = request.user.id
    # data = request.get_json()

    # try:
    #     # Get Supabase client
    #     supabase = get_supabase()
        
    #     # Check if user is the creator
    #     event = (
    #         supabase.table("events")
    #         .select("creator_id")
    #         .eq("id", event_id)
    #         .execute()
    #     )

    #     if not event.data:
    #         return jsonify({
    #             'error': 'Event not found',
    #             'message': f'No event found with id {event_id}'
    #         }), 404

    #     if event.data[0]["creator_id"] != user_id:
    #         return jsonify({
    #             'error': 'Unauthorized',
    #             'message': 'Only the event creator can update the event'
    #         }), 403

    #     # Update event
    #     updated_event = (
    #         supabase.table("events")
    #         .update({
    #             "name": data.get("name"),
    #             "description": data.get("description"),
    #             "start_time_utc": data.get("start_time_utc"),
    #             "end_time_utc": data.get("end_time_utc"),
    #             "timezone": data.get("timezone"),
    #             "location": data.get("location"),
    #             "is_online": data.get("is_online"),
    #             "meeting_link": data.get("meeting_link"),
    #             "status": data.get("status")
    #         })
    #         .eq("id", event_id)
    #         .execute()
    #     )

    #     return jsonify(updated_event.data[0]), 200

    # except Exception as e:
    #     return jsonify({
    #         'error': 'Failed to update event',
    #         'message': str(e)
    #     }), 400

@event_bp.route('/<string:event_id>', methods=['DELETE'])
@require_auth
def delete_event(event_id):
    """
    Delete an event.
    Only the event creator can delete the event.
    Requires authentication.
    """
    user_id = request.user.id

    try:
        # Get Supabase client
        supabase = get_supabase()
        
        # Check if user is the creator
        event = (
            supabase.table("events")
            .select("creator_id")
            .eq("id", event_id)
            .execute()
        )

        if not event.data:
            return jsonify({
                'error': 'Event not found',
                'message': f'No event found with id {event_id}'
            }), 404

        if event.data[0]["creator_id"] != user_id:
            return jsonify({
                'error': 'Unauthorized',
                'message': 'Only the event creator can delete the event'
            }), 403

        # Delete event (this will cascade delete participants and availability and preferences)
        supabase.table("events").delete().eq("id", event_id).execute()

        return jsonify({
            'message': 'Event deleted successfully'
        }), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to delete event',
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
        # Get Supabase client
        supabase = get_supabase()
        
        # Add participant
        participant = (
            supabase.table("event_participants")
            .insert({
                "event_id": event_id,
                "user_id": participant_id,
                "status": "pending"
            })
            .execute()
        )

        return jsonify(participant.data[0]), 201

    except Exception as e:
        return jsonify({
            'error': 'Failed to add participant',
            'message': str(e)
        }), 400

@event_bp.route('/<string:event_id>/participants/<string:user_id>', methods=['PUT'])
@require_auth
def update_participant_status(event_id, user_id):
    """
    Update a participant's status.
    Requires authentication.
    """
    data = request.get_json()
    status = data.get("status")

    if status not in ["pending", "accepted", "declined"]:
        return jsonify({
            'error': 'Invalid status',
            'message': 'Status must be one of: pending, accepted, declined'
        }), 400

    try:
        # Get Supabase client
        supabase = get_supabase()
        
        # Update participant status
        participant = (
            supabase.table("event_participants")
            .update({
                "status": status
            })
            .eq("event_id", event_id)
            .eq("user_id", user_id)
            .execute()
        )

        return jsonify(participant.data[0]), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to update participant status',
            'message': str(e)
        }), 400