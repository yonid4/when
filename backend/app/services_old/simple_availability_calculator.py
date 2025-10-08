"""
Service for calculating available time slots based on busy slots.
This service takes busy slots from multiple users and calculates common available times.
"""

from datetime import datetime, timedelta, time, date
from typing import List, Tuple, Dict, Optional
from .busy_slots_retriever import BusySlotsRetriever


class AvailabilityCalculator:
    """Service for calculating available time slots from busy slots."""
    
    def __init__(self):
        self.busy_slots_retriever = BusySlotsRetriever()
    
    def calculate_available_slots_for_event(self, event_id: str) -> List[dict]:
        """
        Calculate available time slots for all participants of an event.
        
        Args:
            event_id (str): The ID of the event
            
        Returns:
            List[dict]: List of available time slot dictionaries with start_time, end_time, duration
        """
        # TODO: Get event details from database using event_id
        # TODO: Get all participant user IDs for the event
        # TODO: Parse event date range (earliest_date, latest_date)
        # TODO: Get event preferences (duration, working hours)
        # TODO: Call calculate_available_slots_for_users() with participant IDs and event details
        # TODO: Return the calculated available slots

        # Get event details
        event_result = (
            supabase.table("event")
            .select("*")
            .eq("id", event_id)
            .execute()
        )

        if not event_result.data:
            raise ValueError(f"Event with ID {event_id} not found")

        # Get all participant user IDs for the event
        participants_result = (
            supabase.table("event_participant")
            .select("user_id")
            .eq("event_id", event_id)
            .execute()
        )

        participant_user_ids = [p["user_id"] for p in participants_result.data]

        if not participant_user_ids:
            return []

        # Parse event date range
        start_date = datetime.fromisoformat(event["earliest_date"].replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(event["latest_date"].replace('Z', '+00:00'))

        meeting_duration = event.get("default_duration_minutes", 60)
        earliest_hour = event.get("earliest_hour", 7)
        latest_hour = event.get("latest_hour", 17)

        # Calculate available slots for users
        available_slots = self.calculate_available_slots_for_users(
            user_ids=participant_user_ids,
            start_date=start_date,
            end_date=end_date,
            earliest_hour=earliest_hour,
            latest_hour=latest_hour
        )

        return available_slots
    
    def calculate_available_slots_for_users(self, user_ids: List[str], start_date: datetime, 
                                          end_date: datetime, meeting_duration_minutes: int = 60,
                                          earliest_hour: int = 7, latest_hour: int = 17) -> List[dict]:
        """
        Calculate available time slots for a group of users.
        
        Args:
            user_ids (List[str]): List of user IDs to check availability for
            start_date (datetime): Start date for availability calculation
            end_date (datetime): End date for availability calculation
            meeting_duration_minutes (int): Required meeting duration in minutes
            earliest_hour (int): Start of working hours (24-hour format)
            latest_hour (int): End of working hours (24-hour format)
            
        Returns:
            List[dict]: List of available time slots
        """
        # TODO: Get busy slots for all users using busy_slots_retriever.get_multiple_users_busy_slots()
        # TODO: Combine all users' busy slots into one master list
        # TODO: Generate working hours time slots for each day in the date range
        # TODO: Remove busy time slots from working hours to find free slots
        # TODO: Filter free slots by minimum meeting duration
        # TODO: Format results as list of dictionaries with start_time, end_time, duration
        # TODO: Return the list of available slots
        busy_slots_retriever_service = BusySlotsRetriever()

        users_busy_slots = busy_slots_retriever_service.get_multiple_users_busy_slots(
            user_ids=user_ids,
            start_date=start_date,
            end_date=end_date
        )

        # Might do that in the database before sending the busy slots to the memory, so it might save api calls to the database if there are coliding slots
        combined_busy_slots = self.combine_all_users_busy_slots(users_busy_slots=users_busy_slots) 

        free_slots = self.generate_working_hours_slots(
            start_date=start_date,
            end_date=end_date,
            earliest_hour=earliest_hour,
            latest_hour=latest_hour
        )

        removed_busy_time_slots = self.subtract_busy_slots_from_free_slots(
            free_slots=free_slots,
            busy_slots=combined_busy_slots
        )

        # # For now will be filtered and will show all of the slots that are free
        # filtered_slots_by_min_meeting_duration = self.filter_slots_by_duration(
        #     slots=removed_busy_time_slots,
        #     min_duration_minutes=meeting_duration_minutes
        # )

        formatted_slots = self.format_slots_as_dict_list(slots=removed_busy_time_slots)

        return formatted_slots

    def generate_working_hours_slots(self, start_date: datetime, end_date: datetime, 
                                   earliest_hour: int, latest_hour: int) -> Dict[date, List[Tuple[datetime, datetime]]]:
        """
        Generate time slots for working hours across the date range.
        
        Args:
            start_date (datetime): Start date
            end_date (datetime): End date
            earliest_hour (int): Start of working hours (24-hour format)
            latest_hour (int): End of working hours (24-hour format)
            
        Returns:
            Dict[date, List[Tuple[datetime, datetime]]]: Dict of working hours time slots
            by date
        """
        # TODO: Iterate through each day from start_date to end_date
        # TODO: For each day, create a time slot from earliest_hour to latest_hour
        # TODO: Convert working hours to datetime objects for that specific day
        # TODO: Add each day's working hours slot to the result dict
        # TODO: Return the Dict of working hours slots by date
        
        delta = datetime.timedelta(days=1)

        current_date = start_date
        working_hours_slots = {} # Dict of date and time slots {date: [(start_time, end_time)]}
        while current_date <= end_date:
            working_hours_slots[current_date] = [(datetime.combine(current_date, earliest_hour), datetime.combine(current_date, latest_hour))]

            current_date += delta

        return working_hours_slots

    def subtract_busy_slots_from_free_slots(self, free_slots: Dict[date, List[Tuple[datetime, datetime]]], 
                                          busy_slots: Dict[date, List[Tuple[datetime, datetime]]]) -> Dict[date, List[Tuple[datetime, datetime]]]:
        """
        Remove busy time slots from free time slots to calculate actual availability.
        
        Args:
            free_slots (Dict[date, List[Tuple[datetime, datetime]]]): List of initially free time slots
            busy_slots (Dict[date, List[Tuple[datetime, datetime]]]): List of busy time slots to subtract
            by date
        Returns:
            Dict[date, List[Tuple[datetime, datetime]]]: Dict of remaining free time slots
            by date
        """
        # TODO: For each free slot, check if it overlaps with any busy slot
        # TODO: If no overlap, keep the free slot as is
        # TODO: If partial overlap, split the free slot around the busy slot
        # TODO: If complete overlap, remove the free slot entirely
        # TODO: Handle multiple busy slots overlapping with one free slot
        # TODO: Return the list of remaining free slots after subtracting busy slots
        subtracted_free_slots = {}
        
        for date, free_slots in free_slots.items():
            earliest_hour = free_slots[0][0]
            latest_hour = free_slots[0][1]

            today_free_slots = [free_slots] # List of tuples (start_time end_time)

            if busy_slots[date]:
                for busy_slot in busy_slots[date]:
                    busy_slot_start_time = busy_slot[0]
                    busy_slot_end_time = busy_slot[1]

                    if busy_end_time < earliest_hour or busy_slot_start_time > latest_hour: # This busy time slot doesnt effect the day's scheduale so skip
                        continue
                    elif busy_slot_start_time <= earliest_hour and latest_hour <= busy_slot_end_time: # This busy time slot takes the whole day so return an empty list for this date
                        break
                    elif earliest_hour < busy_slot_start_time and busy_slot_end_time < latest_hour: # Busy slot is in the middle of the event hours
                        for i in range(len(today_free_slots)):
                            start, end = today_free_slots[i]
                            if start < busy_slot_start_time and busy_slot_end_time < end:
                                today_free_slots.pop(i)

                                today_free_slots.append((start, busy_slot_start_time))
                                today_free_slots.append((busy_slot_end_time, end))
                                break
                        
                    elif busy_slot_start_time <= earliest_hour and busy_slot_end_time < latest_hour: # Busy slot starts at or before event's earliest hour, but ends at or after the latest hour
                        today_free_slots = [(busy_slot_end_time, end)]
                    else: # Busy slot end at of before event's latest hour, but starts after earliest hour
                        today_free_slots = [(start, busy_slot_end_time)]

                today_free_slots.sort(key=lambda x: x[0])
            
            subtracted_free_slots[date] = today_free_slots

            return subtracted_free_slots
    
    def filter_slots_by_duration(self, slots: List[Tuple[datetime, datetime]], 
                                min_duration_minutes: int) -> List[Tuple[datetime, datetime]]:
        """
        Filter time slots to only include those that meet minimum duration requirement.
        
        Args:
            slots (List[Tuple[datetime, datetime]]): List of time slots to filter
            min_duration_minutes (int): Minimum duration in minutes
            
        Returns:
            List[Tuple[datetime, datetime]]: List of slots that meet duration requirement
        """
        # TODO: Iterate through each slot
        # TODO: Calculate the duration of each slot in minutes
        # TODO: Keep only slots that are >= min_duration_minutes
        # TODO: Return the filtered list of slots
        pass
    
    def combine_all_users_busy_slots(self, users_busy_slots: Dict[str, List[Tuple[datetime, datetime]]]) -> Dict[date, List[Tuple[datetime, datetime]]]:
        """
        Combine busy slots from all users into one master list.
        
        Args:
            users_busy_slots (Dict[str, List[Tuple[datetime, datetime]]]): Dictionary of user busy slots
            by date
            
        Returns:
            Dict[date, List[Tuple[datetime, datetime]]]: Combined and merged list of all busy slots
            by date
        """
        # TODO: Collect all busy slots from all users into one list
        # TODO: Sort the combined list by start time
        # TODO: Merge overlapping intervals using busy_slots_retriever.merge_intervals()
        # TODO: Return the combined and merged busy slots
        all_users_busy_slots = []
        
        for user_id in users_busy_slots:
            all_users_busy_slots.aappend(user_busy_slots[user_id])

        # Sorting list by start time
        all_users_busy_slots.sort(key=lambda x: x[0])

        # Merging slots that oevrlap (if any)
        merged_busy_slots = busy_slots_retriever.merge_intervals(all_users_busy_slots)

        return merged_busy_slots
    
    def format_slots_as_dict_list(self, slots: List[Tuple[datetime, datetime]]) -> List[dict]:
        """
        Format time slots as a list of dictionaries for API response.
        
        Args:
            slots (List[Tuple[datetime, datetime]]): List of time slot tuples
            
        Returns:
            List[dict]: List of formatted slot dictionaries
        """
        # TODO: Convert each (start, end) tuple to a dictionary
        # TODO: Include start_time, end_time, and duration_minutes in each dictionary
        # TODO: Format datetime objects as ISO strings for JSON serialization
        # TODO: Calculate duration in minutes for each slot
        # TODO: Return the list of formatted dictionaries
        pass
    
    def slots_overlap(self, slot1: Tuple[datetime, datetime], slot2: Tuple[datetime, datetime]) -> bool:
        """
        Check if two time slots overlap.
        
        Args:
            slot1 (Tuple[datetime, datetime]): First time slot
            slot2 (Tuple[datetime, datetime]): Second time slot
            
        Returns:
            bool: True if slots overlap, False otherwise
        """
        # TODO: Check if slot1 starts before slot2 ends AND slot2 starts before slot1 ends
        # TODO: Return True if there's any overlap, False otherwise
        pass
