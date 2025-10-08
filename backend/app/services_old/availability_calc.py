from ..models.event import Event
from ..models.busy_slot import BusySlot
from ..models.event_participant import EventParticipant
from ..models.preference import UserEventPreference
from .busy_slot_service import BusySlotService
from datetime import datetime, timedelta, time

class AvailabilityCalc:
    def __init__(self):
        self.busy_slot_service = BusySlotService()

    def calculate_availability_for_event(self, event_id: str) -> list[dict]:
        """
        Calculates the common available time slots for all participants
        of a given event using the busy slots from Google Calendar.

        Args:
            event_id: The UUID of the event for which to calculate availability.

        Returns:
            A list of free time slot dictionaries.

        Raises:
            ValueError: If the event with the given ID is not found.
        """
        from ..utils.supabase_client import get_supabase
        supabase = get_supabase()
        
        # Get event details
        event_result = (
            supabase.table("event")
            .select("*")
            .eq("id", event_id)
            .execute()
        )
        
        if not event_result.data:
            raise ValueError(f"Event with ID {event_id} not found")
            
        event = event_result.data[0]

        # Get all participant user IDs for the event
        participants_result = (
            supabase.table("event_participant")
            .select("user_id")
            .eq("event_id", event_id)
            .execute()
        )
        
        participant_user_ids = [p["user_id"] for p in participants_result.data]

        if not participant_user_ids:
            # If there are no participants, return empty list
            return []

        # Parse event date range
        start_date = datetime.fromisoformat(event["earliest_date"].replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(event["latest_date"].replace('Z', '+00:00'))
        
        # Get user preferences for meeting duration and working hours
        meeting_duration = event.get("default_duration_minutes", 60)
        earliest_hour = event.get("earliest_hour", 7)
        latest_hour = event.get("latest_hour", 17)

        # Calculate free slots using the busy slot service
        free_slots = self.busy_slot_service.calculate_free_slots(
            participant_user_ids,
            start_date,
            end_date,
            meeting_duration,
            working_hours_start,
            working_hours_end
        )

        return free_slots