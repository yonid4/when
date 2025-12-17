"""
Event routes for managing events and event participants.
"""

import os
from flask import Blueprint, request, jsonify
from ..utils.decorators import require_auth
from datetime import datetime
import logging
from supabase import create_client
from ..services.events import EventsService

event_bp = Blueprint("events", __name__, url_prefix="/api/events")

# Create service role client for operations that need to bypass RLS (like event creation)
# This client bypasses Row Level Security policies
def get_service_role_client():
    """Get or create the service role client for bypassing RLS."""
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_service_key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables"
        )
    
    return create_client(supabase_url, supabase_service_key)

# Initialize service role client at module level
try:
    service_role_client = get_service_role_client()
except ValueError as e:
    logging.warning(f"[EVENT] Service role client initialization failed: {e}")
    service_role_client = None

@event_bp.route('/', methods=['POST'])
@require_auth
def create_event(user_id):
    """
    Create a new event.
    Requires authentication.
    """
    data = request.get_json()
    
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
            # Try parsing with seconds first (HH:MM:SS)
            return datetime.strptime(time_str, "%H:%M:%S").time()
        except ValueError as e:
            logging.error(f"[EVENT] Error parsing time {time_str}: {e}")
            raise ValueError(f"Invalid time format: {time_str}")

    try:
        # Validate required fields - only name is truly required
        if not data.get("name"):
            logging.error("[EVENT] Missing required field: name")
            return jsonify({
                'error': 'Validation error',
                'message': 'Missing required field: name'
            }), 400

        # Parse dates and times if provided
        # Use correct database field names: earliest_date, latest_date, earliest_hour, latest_hour
        earliest_date = parse_iso_date(data.get("earliest_date"))
        latest_date = parse_iso_date(data.get("latest_date"))
        earliest_hour = parse_time_str(data.get("earliest_hour"))
        latest_hour = parse_time_str(data.get("latest_hour"))
        
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
            "earliest_date": earliest_date.isoformat() if earliest_date else None,
            "latest_date": latest_date.isoformat() if latest_date else None,
            "earliest_hour": earliest_hour.isoformat() if earliest_hour else None,
            "latest_hour": latest_hour.isoformat() if latest_hour else None,
            "duration_minutes": int(data.get("duration_minutes")) if data.get("duration_minutes") else None,
            "status": "planning"  # Default status
        }
        
        logging.info(f"[EVENT] Inserting event data: {event_data}")
        
        # Validate event data using EventsService
        events_service = EventsService()
        if not events_service.validate_event_data(event_data):
            logging.error("[EVENT] Event data validation failed")
            return jsonify({
                'error': 'Validation error',
                'message': 'Invalid event data'
            }), 400
        
        # Check if service role client is available
        if service_role_client is None:
            logging.error("[EVENT] Service role client not available")
            return jsonify({
                'error': 'Server configuration error',
                'message': 'Service role client not initialized. Check SUPABASE_SERVICE_ROLE_KEY environment variable.'
            }), 500
        
        # Use service role client to insert event (bypasses RLS)
        try:
            logging.info("[EVENT] Inserting event using service role client...")
            result = service_role_client.table('events').insert(event_data).execute()
            
            if not result.data or len(result.data) == 0:
                logging.error("[EVENT] No data returned from event creation")
                return jsonify({
                    'error': 'Failed to create event',
                    'message': 'Event creation returned no data'
                }), 500
            
            event = result.data[0]
            logging.info(f"[EVENT] Successfully created event {event['id']} using service role client")
        except Exception as e:
            logging.error(f"[EVENT] Error creating event: {str(e)}")
            return jsonify({
                'error': 'Failed to create event',
                'message': str(e)
            }), 500

        # Add creator as participant using regular client (with RLS)
        access_token = getattr(request, "access_token", None)
        events_service_with_auth = EventsService(access_token)
        try:
            events_service_with_auth.add_participant(event['id'], user_id)
        except Exception as e:
            logging.warning(f"[EVENT] Failed to add creator as participant: {str(e)}")
            # Don't fail the event creation if participant addition fails

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
def get_user_events(user_id):
    """
    Get all events for the authenticated user (coordinator and participant).
    Requires authentication.
    """
    try:
        access_token = getattr(request, "access_token", None)
        events_service = EventsService(access_token)
        
        events = events_service.get_user_events(user_id)
        
        print(f"[EVENT] Retrieved {len(events)} events for user {user_id}")
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
def get_event(event_id, user_id):
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
def update_event(event_id, user_id):
    """
    Update an event.
    Requires authentication.
    """
    try:
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
def delete_event(event_id, user_id):
    """
    Delete an event.
    Notifies all participants and deletes from Google Calendar if finalized.
    Requires authentication.
    """
    try:
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
        
        # Get all participants before deletion (for notifications)
        # Note: get_event_participants expects UID, but we have ID - need to get event first to get UID
        # Or we can query participants directly using the event ID we already have
        event_uid = event.get('uid') or event_id
        participants = events_service.get_event_participants(event_uid)
        
        # Get coordinator profile for notification message
        from ..utils.supabase_client import get_supabase
        supabase = get_supabase()
        coordinator_response = supabase.table("profiles")\
            .select("*")\
            .eq("id", user_id)\
            .execute()
        coordinator_name = "The coordinator"
        if coordinator_response.data and len(coordinator_response.data) > 0:
            coordinator = coordinator_response.data[0]
            coordinator_name = coordinator.get("full_name") or coordinator.get("email_address", "The coordinator")
        
        # Delete from Google Calendar if finalized
        if event.get("is_finalized") and event.get("google_calendar_event_id"):
            try:
                from ..services.google_calendar import GoogleCalendarService
                google_service = GoogleCalendarService(access_token)
                google_service.delete_event(event["google_calendar_event_id"])
                print(f"[DELETE] Deleted Google Calendar event: {event['google_calendar_event_id']}")
            except Exception as e:
                # Log but don't fail - continue with deletion
                print(f"Warning: Failed to delete Google Calendar event: {e}")
        
        # Delete event from database (cascade will handle related records)
        success = events_service.delete_event(event_id)
        if not success:
            return jsonify({
                'error': 'Failed to delete event',
                'message': 'Event could not be deleted'
            }), 400
        
        # Create notifications for all participants (except coordinator)
        from ..services.notifications import NotificationsService
        notifications_service = NotificationsService()
        
        # Get event title with fallback (events table uses 'name' not 'title')
        event_title = event.get("name") or event.get("title") or "Untitled Event"
        
        for participant in participants:
            if participant["id"] != user_id:
                try:
                    notifications_service.create_event_deleted_notification(
                        user_id=participant["id"],
                        event_id=event_id,
                        event_title=event_title,
                        deleted_by_name=coordinator_name,
                        deleted_by_id=user_id
                    )
                except Exception as e:
                    print(f"Warning: Failed to create notification for {participant['id']}: {e}")
            
        return jsonify({
            'success': True,
            'message': 'Event deleted successfully'
        }), 200

    except Exception as e:
        print(f"Error deleting event: {e}")
        return jsonify({
            'error': 'Failed to delete event',
            'message': str(e)
        }), 400

@event_bp.route('/<string:event_uid>/participants', methods=['GET'])
@require_auth
def get_event_participants(event_uid, user_id):
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
def add_participant(event_id, user_id):
    """
    Add a participant to an event.
    Requires authentication.
    """
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
        
        # Trigger immediate proposal regeneration
        try:
            from ..services.time_proposal import TimeProposalService
            time_proposal_service = TimeProposalService(access_token)
            time_proposal_service.regenerate_proposals_immediately(event_id)
            print(f"[EVENTS] Triggered proposal regeneration for event {event_id} after adding participant")
        except Exception as regen_error:
            print(f"[EVENTS] Warning: Failed to regenerate proposals after adding participant: {str(regen_error)}")
            # Don't fail the request if proposal regeneration fails
        
        return jsonify(participant), 201

    except Exception as e:
        return jsonify({
            'error': 'Failed to add participant',
            'message': str(e)
        }), 400

@event_bp.route('/<string:event_id>/participants/<string:participant_id>', methods=['DELETE'])
@require_auth
def remove_participant(event_id, participant_id, user_id):
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
        
        # Trigger immediate proposal regeneration
        try:
            from ..services.time_proposal import TimeProposalService
            time_proposal_service = TimeProposalService(access_token)
            time_proposal_service.regenerate_proposals_immediately(event_id)
            print(f"[EVENTS] Triggered proposal regeneration for event {event_id} after removing participant")
        except Exception as regen_error:
            print(f"[EVENTS] Warning: Failed to regenerate proposals after removing participant: {str(regen_error)}")
            # Don't fail the request if proposal regeneration fails
        
        return jsonify({
            'message': 'Participant removed successfully'
        }), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to remove participant',
            'message': str(e)
        }), 400