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
def get_connection_status():
    """Check if user has connected their Google Calendar."""
    user_id = request.user.id

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
def get_busy_times(event_id):
    """Get busy time slots from current user's Google Calendar for a specific event."""
    user_id = request.user.id
    
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
def sync_calendar():
    """Sync user's Google Calendar for the next 90 days."""
    user_id = request.user.id

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