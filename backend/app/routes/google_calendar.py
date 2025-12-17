"""
Google Calendar integration routes.
"""

from flask import Blueprint, request, jsonify
from ..utils.decorators import require_auth
from ..services.google_calendar import get_stored_credentials, get_calendar_service
from ..services.events import EventsService
from ..services.users import UsersService
from ..models.busy_slot import BusySlot
from datetime import datetime, timedelta, timezone

calendar_bp = Blueprint("google_calendar", __name__, url_prefix="/api/calendar")
users_service = UsersService()

@calendar_bp.route('/connection-status', methods=['GET'])
@require_auth
def get_connection_status(user_id):
    """Check if user has connected their Google Calendar."""


    try:
        from ..services.google_calendar import get_stored_credentials
        
        # Check if user has valid Google credentials
        credentials = get_stored_credentials(user_id)
        has_google_auth = credentials is not None
        
        # Get calendar ID if exists
        calendar_id = users_service.get_google_calendar_id(user_id)
        
        return jsonify({
            "connected": has_google_auth,
            "google_calendar_id": calendar_id
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
        from ..utils.supabase_client import get_supabase
        access_token = getattr(request, "access_token", None)
        supabase = get_supabase(access_token)
        
        # Get busy slots from database
        response = supabase.table('busy_slots') \
            .select('*') \
            .eq('user_id', user_id) \
            .order('start_time_utc') \
            .execute()
        
        busy_slots = response.data if response.data else []
        
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
    """Sync user's Google Calendar for the next 90 days."""


    try:
        # Check if user has Google credentials first
        credentials = get_stored_credentials(user_id)
        if not credentials:
            return jsonify({
                'error': 'Google Calendar not connected',
                'message': 'Please connect your Google Calendar first'
            }), 400

        # Use BusySlotService to sync calendar
        from ..services.busy_slots import BusySlotService
        from ..services.events import EventsService
        
        busy_slot_service = BusySlotService()
        events_service = EventsService(access_token=getattr(request, "access_token", None))
        
        # Get all user events to determine sync window
        user_events = events_service.get_user_events(user_id)
        
        # Filter for active events (not cancelled)
        active_events = [e for e in user_events if e.get('status') != 'cancelled']
        
        if not active_events:
            # Fallback to default 90-day window if no active events
            start_date = datetime.now(timezone.utc)
            end_date = start_date + timedelta(days=90)
            print(f"[SYNC] No active events for user {user_id}. Using default 90-day window: {start_date} to {end_date}")
        else:
            # Determine window from active events
            # Start date: Earliest of all earliest_dates
            # End date: Max of (Start + 90 days, Latest of all latest_dates)
            
            # Helper to parse date/datetime to datetime
            def to_datetime(d):
                if isinstance(d, str):
                    return datetime.fromisoformat(d).replace(tzinfo=timezone.utc)
                if isinstance(d, datetime):
                    return d.replace(tzinfo=timezone.utc) if d.tzinfo is None else d
                # If it's a date object, convert to datetime at midnight
                return datetime.combine(d, datetime.min.time()).replace(tzinfo=timezone.utc)

            earliest_dates = []
            latest_dates = []
            
            for e in active_events:
                if e.get('earliest_date'):
                    earliest_dates.append(to_datetime(e['earliest_date']))
                if e.get('latest_date'):
                    latest_dates.append(to_datetime(e['latest_date']))
            
            if earliest_dates:
                start_date = min(earliest_dates)
            else:
                start_date = datetime.now(timezone.utc)
                
            # Calculate minimum end date (start + 90 days)
            min_end_date = start_date + timedelta(days=90)
            
            if latest_dates:
                max_event_date = max(latest_dates)
                end_date = max(min_end_date, max_event_date)
            else:
                end_date = min_end_date
                
            print(f"[SYNC] Dynamic sync window for user {user_id}: {start_date} to {end_date} (based on {len(active_events)} active events)")

        success = busy_slot_service.sync_user_google_calendar(
            user_id,
            start_date,
            end_date
        )
        
        if success:
            # Mark proposals as stale for all user's events
            try:
                from ..services.time_proposal import TimeProposalService
                time_proposal_service = TimeProposalService(getattr(request, "access_token", None))
                
                # Mark all active events as needing proposal regeneration
                for event in active_events:
                    try:
                        time_proposal_service.mark_proposals_stale(event['id'])
                        print(f"[CALENDAR_SYNC] Marked proposals as stale for event {event['id']} after calendar sync")
                    except Exception as event_stale_error:
                        print(f"[CALENDAR_SYNC] Warning: Failed to mark event {event['id']} proposals as stale: {str(event_stale_error)}")
            except Exception as stale_error:
                print(f"[CALENDAR_SYNC] Warning: Failed to mark proposals as stale after sync: {str(stale_error)}")
                # Don't fail the request if marking as stale fails
            
            return jsonify({
                'message': 'Calendar synced successfully'
            }), 200
        else:
            return jsonify({
                'error': 'Sync failed',
                'message': 'Failed to sync Google Calendar'
            }), 500

    except Exception as e:
        return jsonify({
            'error': 'Failed to sync calendar',
            'message': str(e)
        }), 400

@calendar_bp.route('/sync-event/<string:event_uid>', methods=['POST'])
@require_auth
def sync_event_participants(event_uid, user_id):
    """
    Sync Google Calendars for all participants of an event (coordinator only).
    Also triggers proposal regeneration after sync.
    """
    try:
        # Get event by UID
        events_service = EventsService()
        event = events_service.get_event_by_uid(event_uid)

        if not event:
            return jsonify({
                'error': 'Event not found',
                'message': f'Event with UID \'{event_uid}\' not found'
            }), 404

        db_event_id = event["id"]

        # Verify user is coordinator
        is_coordinator = event.get("coordinator_id") == user_id

        if not is_coordinator:
            return jsonify({
                'error': 'Access denied',
                'message': 'Only coordinators can sync calendars for all participants'
            }), 403

        # Check if event is already finalized
        if event.get("status") == "finalized":
            return jsonify({
                'error': 'Event finalized',
                'message': 'Cannot sync calendars for finalized events'
            }), 400

        # Get all event participants (including coordinator)
        from ..utils.supabase_client import get_supabase
        from supabase import create_client
        import os

        supabase_url = os.getenv('SUPABASE_URL')
        supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

        if supabase_url and supabase_service_key:
            supabase = create_client(supabase_url, supabase_service_key)
        else:
            supabase = get_supabase()

        participants_result = supabase.table("event_participants") \
            .select("user_id") \
            .eq("event_id", db_event_id) \
            .execute()

        if not participants_result.data:
            return jsonify({
                'error': 'No participants',
                'message': 'Event has no participants to sync'
            }), 400

        participant_ids = [p["user_id"] for p in participants_result.data]

        # Get participant profiles for better error reporting
        profiles_result = supabase.table("profiles") \
            .select("id, full_name, email_address") \
            .in_("id", participant_ids) \
            .execute()

        profiles_map = {p["id"]: p for p in profiles_result.data} if profiles_result.data else {}

        # Calculate sync window based on event dates
        from datetime import timezone

        def to_datetime(d):
            if isinstance(d, str):
                return datetime.fromisoformat(d).replace(tzinfo=timezone.utc)
            if isinstance(d, datetime):
                return d.replace(tzinfo=timezone.utc) if d.tzinfo is None else d
            return datetime.combine(d, datetime.min.time()).replace(tzinfo=timezone.utc)

        if event.get('earliest_date'):
            start_date = to_datetime(event['earliest_date'])
        else:
            start_date = datetime.now(timezone.utc)

        # Use latest_date or default to earliest + 90 days
        min_end_date = start_date + timedelta(days=90)
        if event.get('latest_date'):
            max_event_date = to_datetime(event['latest_date'])
            end_date = max(min_end_date, max_event_date)
        else:
            end_date = min_end_date

        # Sync calendars for all participants
        from ..services.busy_slots import BusySlotService
        busy_slot_service = BusySlotService()

        sync_results = {
            'total_participants': len(participant_ids),
            'synced': 0,
            'failed': 0,
            'skipped': 0,
            'details': []
        }

        for participant_id in participant_ids:
            # Get participant info for better error messages
            profile = profiles_map.get(participant_id, {})
            participant_name = profile.get("full_name", "Unknown")
            participant_email = profile.get("email_address", "unknown@email.com")

            # Check if participant has Google credentials
            credentials = get_stored_credentials(participant_id)

            if not credentials:
                sync_results['skipped'] += 1
                sync_results['details'].append({
                    'user_id': participant_id,
                    'name': participant_name,
                    'email': participant_email,
                    'status': 'skipped',
                    'reason': 'No Google Calendar connected'
                })
                continue

            # Attempt to sync
            try:
                success = busy_slot_service.sync_user_google_calendar(
                    participant_id,
                    start_date,
                    end_date
                )

                if success:
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
                        'reason': 'Sync returned false'
                    })
            except Exception as participant_error:
                error_message = str(participant_error)

                # Check if this is an invalid_grant error (expired/revoked token)
                if 'invalid_grant' in error_message.lower():
                    reason = 'Google Calendar access expired - user needs to reconnect'
                else:
                    reason = error_message

                sync_results['failed'] += 1
                sync_results['details'].append({
                    'user_id': participant_id,
                    'name': participant_name,
                    'email': participant_email,
                    'status': 'failed',
                    'reason': reason,
                    'needs_reconnect': 'invalid_grant' in error_message.lower()
                })

        # Trigger proposal regeneration if any calendars were synced
        if sync_results['synced'] > 0:
            try:
                from ..services.time_proposal import TimeProposalService
                time_proposal_service = TimeProposalService(getattr(request, "access_token", None))

                # Mark proposals as stale (background job will regenerate)
                time_proposal_service.mark_proposals_stale(db_event_id)
                sync_results['proposals_marked_stale'] = True
            except Exception as stale_error:
                sync_results['proposals_marked_stale'] = False
                sync_results['proposals_error'] = str(stale_error)

        return jsonify({
            'success': True,
            'message': f'Synced {sync_results["synced"]}/{sync_results["total_participants"]} calendars',
            'sync_results': sync_results
        }), 200

    except Exception as e:
        return jsonify({
            'error': 'Failed to sync event calendars',
            'message': str(e)
        }), 500


def get_user_busy_times(user_id, event):
    """Get busy times from a specific user's Google Calendar."""
    # Get stored Google credentials for the user
    credentials = get_stored_credentials(user_id)
    if not credentials:
        # Return empty list if no credentials stored
        return []
    
    try:
        # Create Google Calendar service
        service = get_calendar_service(credentials, user_id)
        
        # Determine sync window dynamically based on active events
        from ..services.events import EventsService
        # Note: request context might not be available if this is called from background job
        # But get_user_busy_times seems to be used in context where we might not have access_token easily
        # However, EventsService uses service_role_client for reading events, so access_token is optional
        events_service = EventsService() 
        
        user_events = events_service.get_user_events(user_id)
        active_events = [e for e in user_events if e.get('status') != 'cancelled']
        
        if not active_events:
            start_date = datetime.now(timezone.utc)
            end_date = start_date + timedelta(days=90)
        else:
            def to_datetime(d):
                if isinstance(d, str):
                    return datetime.fromisoformat(d).replace(tzinfo=timezone.utc)
                if isinstance(d, datetime):
                    return d.replace(tzinfo=timezone.utc) if d.tzinfo is None else d
                return datetime.combine(d, datetime.min.time()).replace(tzinfo=timezone.utc)

            earliest_dates = []
            latest_dates = []
            for e in active_events:
                if e.get('earliest_date'):
                    earliest_dates.append(to_datetime(e['earliest_date']))
                if e.get('latest_date'):
                    latest_dates.append(to_datetime(e['latest_date']))
            
            if earliest_dates:
                start_date = min(earliest_dates)
            else:
                start_date = datetime.now(timezone.utc)
                
            min_end_date = start_date + timedelta(days=90)
            if latest_dates:
                max_event_date = max(latest_dates)
                end_date = max(min_end_date, max_event_date)
            else:
                end_date = min_end_date
        
        # Format times for Google Calendar API (RFC3339 format)
        time_min_str = start_date.isoformat()
        time_max_str = end_date.isoformat()
        
        busy_windows = []  # List of tuples (start_date, end_date) of busy times for this user
        
        # Query primary calendar for events in the date range
        events_result = service.events().list(
            calendarId='primary',  # Use primary calendar
            timeMin=time_min_str,
            timeMax=time_max_str,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        
        # Extract busy times from calendar events
        for calendar_event in events:
            start = calendar_event.get('start', {})
            end = calendar_event.get('end', {})
            
            # Handle both all-day events and timed events
            if 'dateTime' in start and 'dateTime' in end:
                start_dt = datetime.fromisoformat(start['dateTime'].replace('Z', '+00:00'))
                end_dt = datetime.fromisoformat(end['dateTime'].replace('Z', '+00:00'))
                
                busy_windows.append({
                    'start': start_dt,
                    'end': end_dt,
                    'google_event_id': calendar_event.get('id'),
                    'title': calendar_event.get('summary', ''),
                    'description': calendar_event.get('description', '')
                })
            # Skip all-day events for now (they don't conflict with specific times)
        
        # Sort intervals (merging can be handled by consumer or added here later)
        busy_windows.sort(key=lambda x: x['start'])
        return busy_windows
        
    except Exception as e:
        # Log error but return empty list to avoid breaking the flow
        print(f"Error fetching Google Calendar events for user {user_id}: {str(e)}")
        return []