"""
Event routes for managing events and event participants.
"""
from __future__ import annotations

import logging
import os
import random
import string
from datetime import datetime

from flask import Blueprint, request, jsonify
from supabase import create_client

from ..services.events import EventsService
from ..services.notifications import NotificationsService
from ..utils.decorators import require_auth
from ..utils.supabase_client import get_supabase

event_bp = Blueprint("events", __name__, url_prefix="/api/events")

VALID_EVENT_TYPES = ['meeting', 'social', 'birthday', 'other']
VALID_RSVP_STATUSES = ["going", "maybe", "not_going"]


def _parse_utc_datetime(datetime_str: str | None) -> datetime | None:
    """Parse ISO format datetime string to datetime object."""
    if not datetime_str:
        return None
    try:
        if datetime_str.endswith('Z'):
            datetime_str = datetime_str[:-1] + '+00:00'
        return datetime.fromisoformat(datetime_str)
    except ValueError as e:
        logging.error(f"[EVENT] Error parsing datetime {datetime_str}: {e}")
        raise ValueError(f"Invalid datetime format: {datetime_str}")


def _get_service_role_client():
    """Get or create the service role client for bypassing RLS."""
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not supabase_url or not supabase_service_key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables"
        )

    return create_client(supabase_url, supabase_service_key)


def _get_events_service() -> EventsService:
    """Get EventsService with access token from request."""
    return EventsService(getattr(request, "access_token", None))


def _generate_event_uid() -> str:
    """Generate a 12-character UID for an event."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=12))


def _trigger_proposal_regeneration(event_id: str, access_token, action: str) -> None:
    """Trigger proposal regeneration after participant changes."""
    try:
        from ..services.time_proposal import TimeProposalService
        time_proposal_service = TimeProposalService(access_token)
        time_proposal_service.regenerate_proposals_immediately(event_id)
        logging.info(f"[EVENTS] Triggered proposal regeneration for event {event_id} after {action}")
    except Exception as e:
        logging.warning(f"[EVENTS] Failed to regenerate proposals after {action}: {e}")


# Initialize service role client at module level
try:
    service_role_client = _get_service_role_client()
except ValueError as e:
    logging.warning(f"[EVENT] Service role client initialization failed: {e}")
    service_role_client = None


@event_bp.route('/', methods=['POST'])
@require_auth
def create_event(user_id):
    """Create a new event."""
    data = request.get_json()
    logging.info(f"[EVENT] Creating event for user {user_id}")

    try:
        if not data.get("name"):
            return jsonify({
                'error': 'Validation error',
                'message': 'Missing required field: name'
            }), 400

        earliest_datetime_utc = _parse_utc_datetime(data.get("earliest_datetime_utc"))
        latest_datetime_utc = _parse_utc_datetime(data.get("latest_datetime_utc"))

        if not earliest_datetime_utc or not latest_datetime_utc:
            return jsonify({
                'error': 'Validation error',
                'message': 'earliest_datetime_utc and latest_datetime_utc are required'
            }), 400

        event_type = data.get("event_type")
        if event_type and event_type not in VALID_EVENT_TYPES:
            return jsonify({
                'error': 'Validation error',
                'message': f'event_type must be one of: {", ".join(VALID_EVENT_TYPES)}'
            }), 400

        event_data = {
            "uid": _generate_event_uid(),
            "name": data.get("name"),
            "description": data.get("description"),
            "coordinator_id": user_id,
            "earliest_datetime_utc": earliest_datetime_utc.isoformat(),
            "latest_datetime_utc": latest_datetime_utc.isoformat(),
            "coordinator_timezone": data.get("coordinator_timezone", "UTC"),
            "duration_minutes": int(data.get("duration_minutes")) if data.get("duration_minutes") else None,
            "status": "planning",
            "event_type": event_type,
            "video_call_link": data.get("video_call_link"),
            "location": data.get("location"),
            "guests_can_invite": data.get("guests_can_invite", False)
        }

        events_service = EventsService()
        if not events_service.validate_event_data(event_data):
            return jsonify({
                'error': 'Validation error',
                'message': 'Invalid event data'
            }), 400

        if service_role_client is None:
            return jsonify({
                'error': 'Server configuration error',
                'message': 'Service role client not initialized.'
            }), 500

        result = service_role_client.table('events').insert(event_data).execute()

        if not result.data:
            return jsonify({
                'error': 'Failed to create event',
                'message': 'Event creation returned no data'
            }), 500

        event = result.data[0]
        logging.info(f"[EVENT] Created event {event['id']}")

        # Add creator as participant
        events_service_with_auth = _get_events_service()
        try:
            events_service_with_auth.add_participant(event['id'], user_id, "accepted", "going")
        except Exception as e:
            logging.warning(f"[EVENT] Failed to add creator as participant: {e}")

        return jsonify(event), 201

    except ValueError as e:
        return jsonify({'error': 'Validation error', 'message': str(e)}), 400
    except Exception as e:
        logging.error(f"[EVENT] Failed to create event: {e}")
        return jsonify({'error': 'Failed to create event', 'message': str(e)}), 400


@event_bp.route('/', methods=['GET'])
@require_auth
def get_user_events(user_id):
    """Get all events for the authenticated user (coordinator and participant)."""
    try:
        events_service = _get_events_service()
        events = events_service.get_user_events(user_id)
        logging.info(f"[EVENT] Retrieved {len(events)} events for user {user_id}")
        return jsonify(events), 200

    except Exception as e:
        logging.error(f"[EVENT] Failed to get user events: {e}")
        return jsonify({'error': 'Failed to get user events', 'message': str(e)}), 400


@event_bp.route('/<string:event_id>', methods=['GET'])
@require_auth
def get_event(event_id, user_id):
    """Get event details by UID or ID."""
    try:
        events_service = _get_events_service()

        # Try UID first, then fallback to ID
        event = events_service.get_event_by_uid(event_id)
        if not event:
            event = events_service.get_event(event_id)

        if not event:
            return jsonify({
                'error': 'Event not found',
                'message': f'No event found with id/uid {event_id}'
            }), 404

        response = jsonify(event)
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response, 200

    except Exception as e:
        return jsonify({'error': 'Failed to get event', 'message': str(e)}), 400


@event_bp.route('/<string:event_uid>', methods=['PUT'])
@require_auth
def update_event(event_uid, user_id):
    """Update an event by UID. Only the coordinator can update."""
    try:
        data = request.get_json()
        events_service = _get_events_service()

        event = events_service.get_event_by_uid(event_uid)
        if not event:
            return jsonify({
                'error': 'Event not found',
                'message': f'No event found with UID {event_uid}'
            }), 404

        if event.get('coordinator_id') != user_id:
            return jsonify({
                'error': 'Access denied',
                'message': 'Only the event coordinator can update the event'
            }), 403

        # Parse datetime fields if provided
        if 'earliest_datetime_utc' in data:
            dt = _parse_utc_datetime(data.get("earliest_datetime_utc"))
            data['earliest_datetime_utc'] = dt.isoformat() if dt else None

        if 'latest_datetime_utc' in data:
            dt = _parse_utc_datetime(data.get("latest_datetime_utc"))
            data['latest_datetime_utc'] = dt.isoformat() if dt else None

        updated_event = events_service.update_event(event['id'], data)
        return jsonify(updated_event), 200

    except ValueError as e:
        return jsonify({'error': 'Validation error', 'message': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to update event', 'message': str(e)}), 400


@event_bp.route('/<string:event_id>', methods=['DELETE'])
@require_auth
def delete_event(event_id, user_id):
    """Delete an event. Notifies participants and deletes from Google Calendar if finalized."""
    try:
        access_token = getattr(request, "access_token", None)
        events_service = EventsService(access_token)

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

        event_uid = event.get('uid') or event_id
        participants = events_service.get_event_participants(event_uid)

        # Get coordinator name for notifications
        supabase = get_supabase()
        coordinator_response = (
            supabase.table("profiles")
            .select("*")
            .eq("id", user_id)
            .execute()
        )
        coordinator_name = "The coordinator"
        if coordinator_response.data:
            coordinator = coordinator_response.data[0]
            coordinator_name = coordinator.get("full_name") or coordinator.get("email_address", "The coordinator")

        # Delete from Google Calendar if finalized
        if event.get("is_finalized") and event.get("google_calendar_event_id"):
            try:
                from ..services.google_calendar import GoogleCalendarService
                google_service = GoogleCalendarService(access_token)
                google_service.delete_event(event["google_calendar_event_id"])
            except Exception as e:
                logging.warning(f"[DELETE] Failed to delete Google Calendar event: {e}")

        success = events_service.delete_event(event_id)
        if not success:
            return jsonify({
                'error': 'Failed to delete event',
                'message': 'Event could not be deleted'
            }), 400

        # Notify participants
        notifications_service = NotificationsService()
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
                    logging.warning(f"[DELETE] Failed to notify {participant['id']}: {e}")

        return jsonify({'success': True, 'message': 'Event deleted successfully'}), 200

    except Exception as e:
        logging.error(f"[DELETE] Error deleting event: {e}")
        return jsonify({'error': 'Failed to delete event', 'message': str(e)}), 400


@event_bp.route('/<string:event_uid>/participants', methods=['GET'])
@require_auth
def get_event_participants(event_uid, user_id):
    """Get participants of an event by UID."""
    try:
        events_service = _get_events_service()
        participants = events_service.get_event_participants(event_uid)
        return jsonify(participants), 200

    except Exception as e:
        logging.error(f"[EVENT] Failed to get participants: {e}")
        return jsonify({'error': 'Failed to get participants', 'message': str(e)}), 400


@event_bp.route('/<string:event_id>/participants', methods=['POST'])
@require_auth
def add_participant(event_id, user_id):
    """Add a participant to an event."""
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

        _trigger_proposal_regeneration(event_id, access_token, "adding participant")
        return jsonify(participant), 201

    except Exception as e:
        return jsonify({'error': 'Failed to add participant', 'message': str(e)}), 400


@event_bp.route('/<string:event_id>/participants/<string:participant_id>', methods=['DELETE'])
@require_auth
def remove_participant(event_id, participant_id, user_id):
    """Remove a participant from an event."""
    try:
        access_token = getattr(request, "access_token", None)
        events_service = EventsService(access_token)

        success = events_service.remove_participant(event_id, participant_id)
        if not success:
            return jsonify({
                'error': 'Failed to remove participant',
                'message': 'Participant may not exist or event not found'
            }), 400

        _trigger_proposal_regeneration(event_id, access_token, "removing participant")
        return jsonify({'message': 'Participant removed successfully'}), 200

    except Exception as e:
        return jsonify({'error': 'Failed to remove participant', 'message': str(e)}), 400


@event_bp.route('/<string:event_uid>/participants/<string:participant_id>/permissions', methods=['PUT'])
@require_auth
def update_participant_permissions(event_uid, participant_id, user_id):
    """Update a participant's permissions (e.g., can_invite). Coordinator only."""
    try:
        data = request.get_json()

        if not data or "can_invite" not in data:
            return jsonify({
                'error': 'Validation error',
                'message': 'can_invite field is required'
            }), 400

        can_invite = data.get("can_invite")
        if not isinstance(can_invite, bool):
            return jsonify({
                'error': 'Validation error',
                'message': 'can_invite must be a boolean'
            }), 400

        if not service_role_client:
            return jsonify({"error": "Server configuration error"}), 500

        event_response = (
            service_role_client.table("events")
            .select("*")
            .eq("uid", event_uid)
            .execute()
        )

        if not event_response.data:
            return jsonify({"error": "Event not found"}), 404

        event = event_response.data[0]

        if event["coordinator_id"] != user_id:
            return jsonify({
                'error': 'Authorization error',
                'message': 'Only the event coordinator can update participant permissions'
            }), 403

        update_response = (
            service_role_client.table("event_participants")
            .update({"can_invite": can_invite})
            .eq("event_id", event["id"])
            .eq("user_id", participant_id)
            .execute()
        )

        if not update_response.data:
            return jsonify({
                'error': 'Participant not found',
                'message': 'Participant not found for this event'
            }), 404

        logging.info(f"[EVENTS] Updated can_invite={can_invite} for participant {participant_id}")
        return jsonify({'message': 'Participant permissions updated successfully', 'can_invite': can_invite}), 200

    except Exception as e:
        logging.error(f"[EVENTS] Failed to update participant permissions: {e}")
        return jsonify({'error': 'Failed to update permissions', 'message': str(e)}), 400


@event_bp.route('/<string:event_uid>/status', methods=['PUT'])
@require_auth
def update_rsvp_status(event_uid, user_id):
    """Update the current user's RSVP status for an event."""
    try:
        data = request.get_json()
        rsvp_status = data.get("status")

        if not rsvp_status:
            return jsonify({
                'error': 'Validation error',
                'message': 'Missing required field: status'
            }), 400

        if rsvp_status not in VALID_RSVP_STATUSES:
            return jsonify({
                'error': 'Validation error',
                'message': f'Invalid status. Must be one of: {", ".join(VALID_RSVP_STATUSES)}'
            }), 400

        events_service = _get_events_service()
        participant = events_service.update_participant_rsvp_status(event_uid, user_id, rsvp_status)

        if not participant:
            return jsonify({
                'error': 'Failed to update RSVP status',
                'message': 'Participant not found or not authorized'
            }), 404

        logging.info(f"[EVENT] Updated RSVP status for user {user_id} to {rsvp_status}")
        return jsonify({'message': 'RSVP status updated successfully', 'participant': participant}), 200

    except Exception as e:
        logging.error(f"[EVENT] Failed to update RSVP status: {e}")
        return jsonify({'error': 'Failed to update RSVP status', 'message': str(e)}), 400
