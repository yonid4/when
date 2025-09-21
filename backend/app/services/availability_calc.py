from ..models.event import Event
from ..models.availability import AvailabilitySlot
from ..models.event_participant import EventParticipant
from ..models.preference import UserEventPreference
from datetime import datetime, timedelta, time

class AvailabilityCalc:
    def calculate_availability_for_event(self, event_id: int) -> list[AvailabilitySlot]:
        """
        Calculates and stores the common available time slots for all participants
        of a given event, considering their busy schedules and the event's constraints.

        Args:
            event_id: The ID of the event for which to calculate availability.

        Returns:
            A list of newly created or updated AvailableSlot objects.

        Raises:
            ValueError: If the event with the given ID is not found.
        """
        event = Event.query.get(event_id)
        if not event:
            raise ValueError(f"Event with ID {event_id} not found")

        # Get all participant user IDs for the event
        # We query EventParticipant directly to ensure we get a list of user_ids.
        # .all() fetches the EventParticipant objects, then we extract user_id.
        participant_user_ids = [
            p.user_id for p in EventParticipant.query.filter_by(event_id=event_id).all()
        ]

        if not participant_user_ids:
            # If there are no participants, there's no common availability.
            # Clear any existing slots and update timestamp.
            AvailabilitySlot.query.filter_by(event_id=event_id).delete()
            event.availability_last_calculated = datetime.utcnow()
            self.db.session.commit()
            return []

        # Fetch all busy slots for the relevant participants.
        # We filter by user_id and also pre-filter by the event's overall date range
        # to reduce the amount of data fetched and processed in memory.
        # We assume UserBusySlot.start_time and .end_time are stored in UTC.
        # time.max and time.min are used to represent the full extent of the start/end dates.
        busy_slots_query = AvailabilitySlot.query.filter(
            AvailabilitySlot.user_id.in_(participant_user_ids),
            AvailabilitySlot.start_time < (datetime.combine(event.end_date, time.max)),
            AvailabilitySlot.end_time > (datetime.combine(event.start_date, time.min))
        ).order_by(AvailabilitySlot.start_time).all() # Order for efficient processing later

        # Calculate the common available slots based on event constraints and busy times
        calculated_slots_tuples = self._calculate_common_free_slots(
            event,
            participant_user_ids,
            busy_slots_query
        )

        # Delete existing AvailableSlots for this event to replace them with the new calculation.
        AvailabilitySlot.query.filter_by(event_id=event_id).delete()
        self.db.session.flush() # Ensure deletions are processed before adding new ones

        # Add the newly calculated available slots to the database session.
        new_available_slots_objects = []
        for slot_start, slot_end in calculated_slots_tuples:
            new_slot = AvailabilitySlot(
                event_id=event.id,
                start_time=slot_start,
                end_time=slot_end,
                participant_count=len(participant_user_ids)
            )
            self.db.session.add(new_slot)
            new_available_slots_objects.append(new_slot)

        # Update the event's timestamp to reflect when availability was last calculated.
        event.availability_last_calculated = datetime.utcnow()

        # Commit all changes to the database (deletions, additions, event update).
        self.db.session.commit()

        return new_available_slots_objects

    def _calculate_common_free_slots(
        self,
        event: Event,
        participant_user_ids: list[int],
        all_busy_slots: list[AvailabilitySlot]
    ) -> list[tuple[datetime, datetime]]:
        """
        Core logic to calculate when all participants are available.
        This method iterates day by day within the event's date range and daily time constraints,
        identifying periods where no participant is busy.

        Args:
            event: The Event object containing date/time constraints (start_date, end_date,
                   earliest_daily_start_time, latest_daily_end_time, duration_minutes).
            participant_user_ids: A list of user IDs participating in the event.
            all_busy_slots: A list of all UserBusySlot objects for the relevant participants
                            within the event's overall date range.

        Returns:
            A list of (start_time, end_time) tuples representing times when all participants are free,
            filtered by the event's required duration. These times are in UTC.
        """
        if not participant_user_ids:
            return []

        # Group busy slots by user for easier and faster lookup during daily processing.
        # Each user's busy slots are sorted by start time.
        busy_periods_by_user = {}
        for user_id in participant_user_ids:
            # Filter busy slots for the current user and sort them.
            user_specific_busy = sorted(
                [(slot.start_time_utc, slot.end_time_utc) for slot in all_busy_slots if slot.user_id == user_id],
                key=lambda x: x[0]
            )
            busy_periods_by_user[user_id] = user_specific_busy

        # This list will accumulate all common free slots found across all days.
        all_common_free_slots_raw = []
        current_date = event.start_date

        # Iterate through each day from the event's start_date to end_date (inclusive).
        while current_date <= event.end_date:
            # 1. Define the daily availability window in UTC.
            # datetime.combine creates a naive datetime object. We assume it represents UTC
            # as per the model's storage convention (start_time, end_time in AvailabilitySlot are UTC).
            day_start_boundary_utc = datetime.combine(current_date, event.earliest_daily_start_time)
            day_end_boundary_utc = datetime.combine(current_date, event.latest_daily_end_time)

            # If the daily window is invalid (e.g., end time is before or same as start time),
            # there's no availability for this day, so skip to the next.
            if day_start_boundary_utc >= day_end_boundary_utc:
                current_date += timedelta(days=1)
                continue

            # 2. Collect and Clip ALL busy slots for THIS specific day from ALL participants.
            # This step gathers all busy intervals that fall within the current day's window.
            todays_all_clipped_busy = []
            for user_id in participant_user_ids:
                for busy_start, busy_end in busy_periods_by_user.get(user_id, []):
                    # Check if the busy slot overlaps with the current day's window.
                    # An overlap occurs if the busy slot starts before the day ends AND
                    # the busy slot ends after the day starts.
                    if busy_start < day_end_boundary_utc and busy_end > day_start_boundary_utc:
                        # Clip the busy slot to fit precisely within the daily window boundaries.
                        clipped_start = max(busy_start, day_start_boundary_utc)
                        clipped_end = min(busy_end, day_end_boundary_utc)
                        # Ensure the clipped slot is still a valid interval (start < end).
                        if clipped_start < clipped_end:
                            todays_all_clipped_busy.append((clipped_start, clipped_end))

            # 3. Merge all overlapping busy slots for the day (from ALL participants).
            # This step is crucial. It consolidates all individual busy periods into
            # a master list of non-overlapping intervals where AT LEAST ONE participant is busy.
            merged_master_busy_for_today = self._merge_intervals(todays_all_clipped_busy)

            # 4. Invert the merged busy slots to find common free slots for the day.
            # We start a pointer at the beginning of the daily window.
            # Any gap between the pointer and the start of a busy slot is a free slot.
            current_pointer = day_start_boundary_utc
            for busy_start, busy_end in merged_master_busy_for_today:
                if busy_start > current_pointer:
                    # If the busy slot starts after the current pointer,
                    # the period from current_pointer to busy_start is free for everyone.
                    all_common_free_slots_raw.append((current_pointer, busy_start))
                # Move the pointer past the end of the current busy period.
                # Use max() to ensure the pointer only moves forward, handling cases
                # where a busy slot might have ended before the current pointer.
                current_pointer = max(current_pointer, busy_end)

            # After processing all busy slots for the day, check if there's a final free slot
            # from the last busy period's end to the end of the daily window.
            if current_pointer < day_end_boundary_utc:
                all_common_free_slots_raw.append((current_pointer, day_end_boundary_utc))

            current_date += timedelta(days=1) # Move to the next day

        # 5. Final processing: Sort, merge (again, for cross-day adjacency if any, or just consistency),
        #    and filter the raw common free slots by the event's required duration.
        
        # Sort all raw free slots collected across all days. This is important
        # before the final merge to ensure correct adjacency handling.
        all_common_free_slots_raw.sort(key=lambda x: x[0])
        
        # Perform a final merge on all common free slots. This handles cases where
        # a free slot from the end of one day might be adjacent to a free slot
        # at the beginning of the next day, if the daily windows allow it.
        # It also ensures the final list is clean and non-overlapping.
        merged_final_free_slots = self._merge_intervals(all_common_free_slots_raw)

        final_common_free_slots_filtered_by_duration = []
        min_duration_td = timedelta(minutes=event.duration_minutes)

        for start_time, end_time in merged_final_free_slots:
            # Only include slots that meet or exceed the event's required duration.
            if (end_time - start_time) >= min_duration_td:
                final_common_free_slots_filtered_by_duration.append((start_time, end_time))

        return final_common_free_slots_filtered_by_duration

    def _merge_intervals(self, intervals: list[tuple[datetime, datetime]]) -> list[tuple[datetime, datetime]]:
        """
        Helper function to merge a list of time intervals that may overlap or be adjacent.
        Assumes the input intervals are already sorted by their start time.

        Args:
            intervals: A list of (start_datetime, end_datetime) tuples.

        Returns:
            A new list of merged, non-overlapping (start_datetime, end_datetime) tuples.
        """
        if not intervals:
            return []

        merged = []
        # Initialize with the first interval
        current_start, current_end = intervals[0]

        # Iterate through the rest of the intervals
        for next_start, next_end in intervals[1:]:
            if next_start <= current_end:
                # If the next interval overlaps or is adjacent to the current merged interval,
                # extend the end time of the current merged interval.
                current_end = max(current_end, next_end)
            else:
                # If there's a gap, the current merged interval is complete.
                # Add it to the result and start a new merged interval.
                merged.append((current_start, current_end))
                current_start, current_end = next_start, next_end

        # Add the last merged interval to the result list.
        merged.append((current_start, current_end))
        return merged