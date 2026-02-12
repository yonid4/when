"""
Calendar integration routes (Google and Microsoft).
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from flask import Blueprint, request, jsonify

from ..services.busy_slots import BusySlotService
from ..services.events import EventsService
from ..services import microsoft_calendar
from ..services.google_calendar import get_stored_credentials, get_calendar_service
from ..services.users import UsersService
from ..utils.decorators import require_auth
from ..utils.supabase_client import get_supabase

calendar_bp = Blueprint("calendar", __name__, url_prefix="/api/calendar")
users_service = UsersService()


def _to_datetime(d) -> datetime:
    """Convert date/datetime/string to timezone-aware datetime."""
    if isinstance(d, str):
        return datetime.fromisoformat(d).replace(tzinfo=timezone.utc)
    if isinstance(d, datetime):
        return d.replace(tzinfo=timezone.utc) if d.tzinfo is None else d
    return datetime.combine(d, datetime.min.time()).replace(tzinfo=timezone.utc)


def _get_sync_window_from_events(events: list) -> tuple[datetime, datetime]:
    """Calculate sync window from active events."""
    active_events = [e for e in events if e.get('status') != 'cancelled']

    if not active_events:
        start_date = datetime.now(timezone.utc)
        return start_date, start_date + timedelta(days=90)

    earliest_dates = [
        _to_datetime(e['earliest_date'])
        for e in active_events if e.get('earliest_date')
    ]
    latest_dates = [
        _to_datetime(e['latest_date'])
        for e in active_events if e.get('latest_date')
    ]

    start_date = min(earliest_dates) if earliest_dates else datetime.now(timezone.utc)
    min_end_date = start_date + timedelta(days=90)

    if latest_dates:
        end_date = max(min_end_date, max(latest_dates))
    else:
        end_date = min_end_date

    return start_date, end_date


@calendar_bp.route('/connection-status', methods=['GET'])
@require_auth
def get_connection_status(user_id):
    """Check if user has connected any calendar provider."""
    try:
        google_credentials = get_stored_credentials(user_id)
        microsoft_credentials = microsoft_calendar.get_stored_credentials(user_id)

        google_connected = google_credentials is not None
        microsoft_connected = microsoft_credentials is not None

        return jsonify({
            "connected": google_connected or microsoft_connected,
            "google_connected": google_connected,
            "microsoft_connected": microsoft_connected,
        }), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to get connection status',
            'message': str(e)
        }), 400


@calendar_bp.route('/busy-times/<string:event_id>', methods=['GET'])
@require_auth
def get_busy_times(event_id, user_id):
    """Get busy time slots from current user's Google Calendar for a specific event."""
    try:
        access_token = getattr(request, "access_token", None)
        supabase = get_supabase(access_token)

        response = (
            supabase.table('busy_slots')
            .select('*')
            .eq('user_id', user_id)
            .order('start_time_utc')
            .execute()
        )

        busy_slots = response.data or []

        return jsonify({
            'busy_slots': busy_slots,
            'count': len(busy_slots)
        }), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to get busy times',
            'message': str(e)
        }), 400
    

@calendar_bp.route('/sync', methods=['POST'])
@require_auth
def sync_calendar(user_id):
    """Sync user's connected calendars (Google and/or Microsoft)."""
    try:
        google_credentials = get_stored_credentials(user_id)
        microsoft_credentials = microsoft_calendar.get_stored_credentials(user_id)

        if not google_credentials and not microsoft_credentials:
            return jsonify({
                'error': 'No calendar connected',
                'message': 'Please connect a calendar first'
            }), 400

        busy_slot_service = BusySlotService()
        access_token = getattr(request, "access_token", None)
        events_service = EventsService(access_token=access_token)

        user_events = events_service.get_user_events(user_id)
        start_date, end_date = _get_sync_window_from_events(user_events)

        active_events = [e for e in user_events if e.get('status') != 'cancelled']
        logging.info(f"[SYNC] Window for user {user_id}: {start_date} to {end_date} ({len(active_events)} active events)")

        any_success = False
        sync_details = []

        if google_credentials:
            try:
                result = busy_slot_service.sync_user_google_calendar(user_id, start_date, end_date)
                if isinstance(result, dict):
                    any_success = True
                    sync_details.extend(result.get("sources", []))
                elif result:
                    any_success = True
            except Exception as e:
                logging.warning(f"[SYNC] Google sync failed for user {user_id}: {e}")

        if microsoft_credentials:
            try:
                result = busy_slot_service.sync_user_microsoft_calendar(user_id, start_date, end_date)
                if isinstance(result, dict):
                    any_success = True
                    sync_details.extend(result.get("sources", []))
                elif result:
                    any_success = True
            except Exception as e:
                logging.warning(f"[SYNC] Microsoft sync failed for user {user_id}: {e}")

        if not any_success:
            return jsonify({
                'error': 'Sync failed',
                'message': 'Failed to sync calendar'
            }), 500

        _mark_proposals_stale_for_events(active_events, access_token)

        response = {'message': 'Calendar synced successfully'}
        if sync_details:
            response['sync_details'] = sync_details
        return jsonify(response), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to sync calendar',
            'message': str(e)
        }), 400


def _mark_proposals_stale_for_events(events: list, access_token) -> None:
    """Mark proposals as stale for all events after calendar sync."""
    try:
        from ..services.time_proposal import TimeProposalService
        time_proposal_service = TimeProposalService(access_token)

        for event in events:
            try:
                time_proposal_service.mark_proposals_stale(event['id'])
                logging.info(f"[CALENDAR_SYNC] Marked proposals stale for event {event['id']}")
            except Exception as e:
                logging.warning(f"[CALENDAR_SYNC] Failed to mark event {event['id']} stale: {e}")
    except Exception as e:
        logging.warning(f"[CALENDAR_SYNC] Failed to mark proposals stale: {e}")

@calendar_bp.route('/sync-event/<string:event_uid>', methods=['POST'])
@require_auth
def sync_event_participants(event_uid, user_id):
    """
    Sync Google Calendars for all participants of an event (coordinator only).
    Also triggers proposal regeneration after sync.
    """
    try:
        events_service = EventsService()
        event = events_service.get_event_by_uid(event_uid)

        if not event:
            return jsonify({
                'error': 'Event not found',
                'message': f"Event with UID '{event_uid}' not found"
            }), 404

        if event.get("coordinator_id") != user_id:
            return jsonify({
                'error': 'Access denied',
                'message': 'Only coordinators can sync calendars for all participants'
            }), 403

        if event.get("status") == "finalized":
            return jsonify({
                'error': 'Event finalized',
                'message': 'Cannot sync calendars for finalized events'
            }), 400

        db_event_id = event["id"]

        supabase = _get_service_role_client()
        participants_result = (
            supabase.table("event_participants")
            .select("user_id")
            .eq("event_id", db_event_id)
            .execute()
        )

        if not participants_result.data:
            return jsonify({
                'error': 'No participants',
                'message': 'Event has no participants to sync'
            }), 400

        participant_ids = [p["user_id"] for p in participants_result.data]

        profiles_result = (
            supabase.table("profiles")
            .select("id, full_name, email_address")
            .in_("id", participant_ids)
            .execute()
        )
        profiles_map = {p["id"]: p for p in profiles_result.data} if profiles_result.data else {}

        start_date, end_date = _get_event_sync_window(event)
        sync_results = _sync_participants_calendars(participant_ids, profiles_map, start_date, end_date)

        if sync_results['synced'] > 0:
            _mark_event_proposals_stale(db_event_id, sync_results)

        return jsonify({
            'success': True,
            'message': f"Synced {sync_results['synced']}/{sync_results['total_participants']} calendars",
            'sync_results': sync_results
        }), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to sync event calendars',
            'message': str(e)
        }), 500


def _get_service_role_client():
    """Get Supabase client with service role key."""
    import os
    from supabase import create_client

    supabase_url = os.getenv('SUPABASE_URL')
    supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if supabase_url and supabase_service_key:
        return create_client(supabase_url, supabase_service_key)
    return get_supabase()


def _get_event_sync_window(event: dict) -> tuple[datetime, datetime]:
    """Calculate sync window based on event dates."""
    if event.get('earliest_date'):
        start_date = _to_datetime(event['earliest_date'])
    else:
        start_date = datetime.now(timezone.utc)

    min_end_date = start_date + timedelta(days=90)

    if event.get('latest_date'):
        max_event_date = _to_datetime(event['latest_date'])
        end_date = max(min_end_date, max_event_date)
    else:
        end_date = min_end_date

    return start_date, end_date


def _sync_participants_calendars(
    participant_ids: list,
    profiles_map: dict,
    start_date: datetime,
    end_date: datetime
) -> dict:
    """Sync calendars for all participants (Google and Microsoft) and return results."""
    busy_slot_service = BusySlotService()
    sync_results = {
        'total_participants': len(participant_ids),
        'synced': 0,
        'failed': 0,
        'skipped': 0,
        'details': []
    }

    for participant_id in participant_ids:
        profile = profiles_map.get(participant_id, {})
        participant_name = profile.get("full_name", "Unknown")
        participant_email = profile.get("email_address", "unknown@email.com")

        google_creds = get_stored_credentials(participant_id)
        microsoft_creds = microsoft_calendar.get_stored_credentials(participant_id)

        if not google_creds and not microsoft_creds:
            sync_results['skipped'] += 1
            sync_results['details'].append({
                'user_id': participant_id,
                'name': participant_name,
                'email': participant_email,
                'status': 'skipped',
                'reason': 'No calendar connected'
            })
            continue

        any_success = False

        if google_creds:
            try:
                result = busy_slot_service.sync_user_google_calendar(participant_id, start_date, end_date)
                if isinstance(result, dict) or result:
                    any_success = True
            except Exception as e:
                logging.warning(f"[SYNC] Google sync failed for participant {participant_id}: {e}")

        if microsoft_creds:
            try:
                result = busy_slot_service.sync_user_microsoft_calendar(participant_id, start_date, end_date)
                if isinstance(result, dict) or result:
                    any_success = True
            except Exception as e:
                logging.warning(f"[SYNC] Microsoft sync failed for participant {participant_id}: {e}")

        if any_success:
            sync_results['synced'] += 1
            sync_results['details'].append({
                'user_id': participant_id,
                'name': participant_name,
                'email': participant_email,
                'status': 'success'
            })
        else:
            sync_results['failed'] += 1
            sync_results['details'].append({
                'user_id': participant_id,
                'name': participant_name,
                'email': participant_email,
                'status': 'failed',
                'reason': 'Calendar sync failed - user may need to reconnect'
            })

    return sync_results


def _mark_event_proposals_stale(event_id: str, sync_results: dict) -> None:
    """Mark proposals as stale for an event after sync."""
    try:
        from ..services.time_proposal import TimeProposalService
        time_proposal_service = TimeProposalService(getattr(request, "access_token", None))
        time_proposal_service.mark_proposals_stale(event_id)
        sync_results['proposals_marked_stale'] = True
    except Exception as e:
        sync_results['proposals_marked_stale'] = False
        sync_results['proposals_error'] = str(e)


def get_user_busy_times(user_id, event):
    """Get busy times from a specific user's Google Calendar."""
    credentials = get_stored_credentials(user_id)
    if not credentials:
        return []

    try:
        service = get_calendar_service(credentials, user_id)
        events_service = EventsService()

        user_events = events_service.get_user_events(user_id)
        start_date, end_date = _get_sync_window_from_events(user_events)

        events_result = service.events().list(
            calendarId='primary',
            timeMin=start_date.isoformat(),
            timeMax=end_date.isoformat(),
            singleEvents=True,
            orderBy='startTime'
        ).execute()

        busy_windows = []
        for calendar_event in events_result.get('items', []):
            start = calendar_event.get('start', {})
            end = calendar_event.get('end', {})

            # Only process timed events (skip all-day events)
            if 'dateTime' in start and 'dateTime' in end:
                busy_windows.append({
                    'start': datetime.fromisoformat(start['dateTime'].replace('Z', '+00:00')),
                    'end': datetime.fromisoformat(end['dateTime'].replace('Z', '+00:00')),
                    'provider_event_id': calendar_event.get('id'),
                    'title': calendar_event.get('summary', ''),
                    'description': calendar_event.get('description', '')
                })

        busy_windows.sort(key=lambda x: x['start'])
        return busy_windows

    except Exception as e:
        logging.error(f"Error fetching Google Calendar events for user {user_id}: {e}")
        return []