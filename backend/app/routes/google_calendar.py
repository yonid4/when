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
        supabase = get_supabase()
        
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
    

@calendar_bp.route('/sync/<string:event_id>', methods=['POST'])
@require_auth
def sync_calendar(event_id):
    """Sync user's Google Calendar and store busy times in database."""
    user_id = request.user.id

    try:
        # Check if user has Google credentials first
        credentials = get_stored_credentials(user_id)
        if not credentials:
            return jsonify({
                'error': 'Google Calendar not connected',
                'message': 'Please connect your Google Calendar first'
            }), 400

        # Get event details
        access_token = getattr(request, "access_token", None)
        events_service = EventsService(access_token)
        event = events_service.get_event(event_id)
        if not event:
            return jsonify({
                'error': 'Event not found',
                'message': f'No event found with id {event_id}'
            }), 404

        # Check if user is participant in this event
        if not events_service.is_user_participant(event_id, user_id):
            return jsonify({
                'error': 'Access denied',
                'message': 'You are not a participant in this event'
            }), 403

        # Get user's busy times for this event
        busy_times = get_user_busy_times(user_id, event)

        # Store busy times in database
        from ..utils.supabase_client import get_supabase
        supabase = get_supabase()
        
        # # Delete old busy slots for this user and event time range
        # supabase.table('busy_slots').delete().eq('user_id', user_id).execute()

        # Delete old busy slots for this user within the event date range
        start_date = datetime.fromisoformat(event["earliest_date"].replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(event["latest_date"].replace('Z', '+00:00'))

        supabase.table('busy_slots') \
            .delete() \
            .eq('user_id', user_id) \
            .gte('start_time_utc', start_date.isoformat()) \
            .lte('end_time_utc', end_date.isoformat()) \
            .execute()
        
        # Insert new busy slots
        busy_slots_data = []
        for busy_time in busy_times:
            busy_slots_data.append({
                'user_id': user_id,
                'start_time_utc': busy_time['start'].isoformat(),  # Access dict keys
                'end_time_utc': busy_time['end'].isoformat(),
                'google_event_id': busy_time.get('google_event_id'),
                'google_calendar_id': 'primary',
                'event_title': busy_time.get('title'),
                'event_description': busy_time.get('description'),
                'last_synced_at': datetime.now(timezone.utc).isoformat()
            })
        
        if busy_slots_data:
            supabase.table('busy_slots').insert(busy_slots_data).execute()
        
        return jsonify({
            'message': 'Calendar synced successfully',
            'busy_slots_count': len(busy_slots_data)
        }), 200
    except Exception as e:
        return jsonify({
            'error': 'Failed to get busy times',
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
        
        # Parse event date range
        start_date = datetime.fromisoformat(event["earliest_date"].replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(event["latest_date"].replace('Z', '+00:00'))
        
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