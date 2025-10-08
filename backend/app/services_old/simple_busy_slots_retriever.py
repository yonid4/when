"""
Service for retrieving busy slots from Google Calendar API.
This service handles fetching busy time slots for users from their Google Calendars.
"""

from datetime import datetime, timedelta, timezone
from typing import List, Tuple, Optional
from ..services.google_calendar import get_stored_credentials, get_calendar_service


class BusySlotsRetriever:
    """Service for retrieving busy time slots from Google Calendar."""

    def __init__(self):
        self.supabase = get_supabase()
    
    def get_merged_busy_slots_for_event(self, event_id: str, start_date: datetime, end_time: datetime) -> Dict[date, List[Tuple[datetime, datetime]]]:
        """
        Retrive merged busy time slots for all users in a specific event

        Args:
            event_id (str): The ID of the event

        Returns:
            Dict[date, List[Tuple[datetime, datetime]]]: Dict of busy time slots by date
        """
        
        try:
            # Get all of the busy time slots between start_date to end_date, combined, merged, and sorted by start_time from Supabase
            result = (
                
            )



        except Exception as e:
            print(f"Error getting busy time slots for event {event_id}: {str(e)}")
            return {}








    def get_user_busy_slots(self, user_id: str, start_date: datetime, end_date: datetime) -> List[Tuple[datetime, datetime]]:
        """
        Retrieve busy time slots for a specific user from their Google Calendar.
        
        Args:
            user_id (str): The ID of the user
            start_date (datetime): Start date for the query range
            end_date (datetime): End date for the query range
            
        Returns:
            List[Tuple[datetime, datetime]]: List of busy time intervals as (start, end) tuples
        """
        # TODO: Get stored Google credentials for the user using get_stored_credentials()
        # TODO: Return empty list if no credentials are found
        # TODO: Create Google Calendar service using get_calendar_service()
        # TODO: Query the primary calendar for events in the date range
        # TODO: Extract busy times from calendar events (handle both timed and all-day events)
        # TODO: Convert event times to datetime objects
        # TODO: Sort and merge overlapping intervals using merge_intervals()
        # TODO: Return the list of busy time slots
        # TODO: Handle exceptions gracefully and return empty list on error
        credentials = get_stored_credentials(user_id)
        if not credentials:
            return []
        
        try:
            google_calendar_service = get_calendar_service(credentials)
        except Exception as e:
            print(f"Error creating Google calendar service: {e}")
            return []

        try:
            events_result = google_calendar_service.events().list(
                calendarId='primary',
                timeMin=self.format_datetime_for_google_api(start_date),
                timeMax=self.format_datetime_for_google_api(end_date),
                singleEvents=True,
                orderBy='startTime'
            ).execute()

            events = events_result.get('items', [])

            busy_slots = []
            for event in events:
                start = event.get('start', {})
                end = event.get('end', {})
                if 'dateTime' in start and 'dateTime' in end:
                    start_dt = self.parse_google_calendar_datetime(start)
                    end_dt = self.parse_google_calendar_datetime(end)
                    if start_dt and end_dt:
                        busy_slots.append((start_dt, end_dt))

            merged_busy_slots = self.merge_intervals(busy_slots)
            return merged_busy_slots
            
        except Exception as e:
            print(f"Error fetching Google Calendar events for user {user_id}: {str(e)}")
            return []
    
    # Will combine all of the users busy slots when retreving them from Supabase
    def get_multiple_users_busy_slots(self, user_ids: List[str], start_date: datetime, end_date: datetime) -> dict:
        """
        Retrieve busy time slots for multiple users from their Google Calendars.
        
        Args:
            user_ids (List[str]): List of user IDs
            start_date (datetime): Start date for the query range
            end_date (datetime): End date for the query range
            
        Returns:
            dict: Dictionary mapping user_id to list of busy time intervals
        """
        # TODO: Iterate through each user_id in the list
        # TODO: Call get_user_busy_slots() for each user
        # TODO: Collect results in a dictionary with user_id as key
        # TODO: Handle cases where some users might not have Google Calendar connected
        # TODO: Return the dictionary of all users' busy slots
        users_busy_slots = {}

        for user_id in user_ids:
            user_busy_slots = self.get_user_busy_slots(user_id=user_id, start_date=start_date, end_date=end_date)

            users_busy_slots[user_id] = user_busy_slots

        return users_busy_slots
    
    # Will be done in when retreving the time slots from Supabase
    def merge_intervals(self, intervals: List[Tuple[datetime, datetime]]) -> List[Tuple[datetime, datetime]]:
        """
        Merge overlapping or adjacent time intervals.
        
        Args:
            intervals (List[Tuple[datetime, datetime]]): List of time intervals to merge
            
        Returns:
            List[Tuple[datetime, datetime]]: List of merged intervals
        """
        # TODO: Return empty list if no intervals provided
        # TODO: Sort intervals by start time
        # TODO: Iterate through sorted intervals and merge overlapping ones
        # TODO: Keep track of current interval being processed
        # TODO: If current interval overlaps with next, merge them
        # TODO: If no overlap, add current interval to result and move to next
        # TODO: Return the list of merged intervals
        
        if not intervals:
            return []

        intervals.sort(key=lambda x: x[0])
        
        merged = []
        prev_start, prev_end = intervals[0]
        
        for i in range(1, len(intervals)):
            curr_start, curr_end = intervals[i]
            
            if prev_end >= curr_start:
                # Overlapping intervals - merge them
                prev_end = max(prev_end, curr_end)
            else:
                # Non-overlapping - add previous interval and start new one
                merged.append((prev_start, prev_end))
                prev_start, prev_end = curr_start, curr_end
        
        # Add the last interval
        merged.append((prev_start, prev_end))
        
        return merged
    
    def format_datetime_for_google_api(self, dt: datetime) -> str:
        """
        Format datetime object for Google Calendar API (RFC3339 format).
        
        Args:
            dt (datetime): Datetime object to format
            
        Returns:
            str: Formatted datetime string for Google API
        """
        # TODO: Convert datetime to RFC3339 format (ISO format with timezone)
        # TODO: Handle timezone information properly
        # TODO: Return formatted string suitable for Google Calendar API

        # If datetime is naive (no timezone info), assume UTC
        if dt.tzinfo is None:
            # Add UTC timezone and format with 'Z' suffix
            dt = dt.replace(tzinfo=timezone.utc)
            return dt.isoformat().replace('+00:00', 'Z')
        else:
            # If datetime already has timezone info, use ISO format
            return dt.isoformat()
        
        
    
    def parse_google_calendar_datetime(self, google_datetime: dict) -> Optional[datetime]:
        """
        Parse datetime from Google Calendar API response.
        
        Args:
            google_datetime (dict): Datetime object from Google Calendar API
            
        Returns:
            Optional[datetime]: Parsed datetime object, None if parsing fails
        """
        # TODO: Check if 'dateTime' field exists (for timed events)
        # TODO: Check if 'date' field exists (for all-day events)
        # TODO: Parse the datetime string and convert to datetime object
        # TODO: Handle timezone information properly
        # TODO: Return None for all-day events or parsing errors
        # TODO: Return parsed datetime object for timed events
        
        if 'dateTime' in google_datetime:
            return datetime.fromisoformat(google_datetime['dateTime'].replace('Z', '+00:00'))
        elif 'date' in google_datetime:
            return datetime.fromisoformat(google_datetime['date'])
        else:
            return None
