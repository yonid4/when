import pytest
from datetime import datetime, timedelta, time
from app.services.availability_calc import AvailabilityCalc
from app.models import Event, AvailableSlot, UserBusySlot, EventParticipant, User
from app import db

@pytest.fixture
def availability_calc(session):
    return AvailabilityCalc(session)

@pytest.fixture
def sample_event(session):
    """Create a sample event for testing"""
    event = Event(
        id=1,
        start_date=datetime(2024, 3, 1).date(),
        end_date=datetime(2024, 3, 3).date(),
        earliest_daily_start_time=time(9, 0),  # 9 AM
        latest_daily_end_time=time(17, 0),     # 5 PM
        duration_minutes=60
    )
    session.add(event)
    session.commit()
    return event

@pytest.fixture
def sample_users(session):
    """Create sample users for testing"""
    users = [
        User(id=1, email="user1@example.com"),
        User(id=2, email="user2@example.com")
    ]
    for user in users:
        session.add(user)
    session.commit()
    return users

@pytest.fixture
def sample_busy_slots(session, sample_users):
    """Create sample busy slots for testing"""
    slots = [
        UserBusySlot(
            id=1,
            user_id=1,
            start_time=datetime(2024, 3, 1, 10, 0),  # March 1, 10 AM
            end_time=datetime(2024, 3, 1, 12, 0)     # March 1, 12 PM
        ),
        UserBusySlot(
            id=2,
            user_id=2,
            start_time=datetime(2024, 3, 1, 11, 0),  # March 1, 11 AM
            end_time=datetime(2024, 3, 1, 13, 0)     # March 1, 1 PM
        )
    ]
    for slot in slots:
        session.add(slot)
    session.commit()
    return slots

@pytest.fixture
def sample_participants(session, sample_event, sample_users):
    """Create sample event participants"""
    participants = [
        EventParticipant(event_id=1, user_id=1),
        EventParticipant(event_id=1, user_id=2)
    ]
    for participant in participants:
        session.add(participant)
    session.commit()
    return participants

class TestAvailabilityCalc:
    def test_merge_intervals_empty_list(self, availability_calc):
        """Test merging empty list of intervals"""
        result = availability_calc._merge_intervals([])
        assert result == []

    def test_merge_intervals_no_overlap(self, availability_calc):
        """Test merging non-overlapping intervals"""
        intervals = [
            (datetime(2024, 3, 1, 9, 0), datetime(2024, 3, 1, 10, 0)),
            (datetime(2024, 3, 1, 11, 0), datetime(2024, 3, 1, 12, 0))
        ]
        result = availability_calc._merge_intervals(intervals)
        assert result == intervals

    def test_merge_intervals_with_overlap(self, availability_calc):
        """Test merging overlapping intervals"""
        intervals = [
            (datetime(2024, 3, 1, 9, 0), datetime(2024, 3, 1, 11, 0)),
            (datetime(2024, 3, 1, 10, 0), datetime(2024, 3, 1, 12, 0))
        ]
        expected = [(datetime(2024, 3, 1, 9, 0), datetime(2024, 3, 1, 12, 0))]
        result = availability_calc._merge_intervals(intervals)
        assert result == expected

    def test_merge_intervals_with_adjacent(self, availability_calc):
        """Test merging adjacent intervals"""
        intervals = [
            (datetime(2024, 3, 1, 9, 0), datetime(2024, 3, 1, 10, 0)),
            (datetime(2024, 3, 1, 10, 0), datetime(2024, 3, 1, 11, 0))
        ]
        expected = [(datetime(2024, 3, 1, 9, 0), datetime(2024, 3, 1, 11, 0))]
        result = availability_calc._merge_intervals(intervals)
        assert result == expected

    def test_calculate_common_free_slots_no_participants(self, availability_calc, sample_event):
        """Test calculating free slots with no participants"""
        result = availability_calc._calculate_common_free_slots(
            sample_event,
            [],
            []
        )
        assert result == []

    def test_calculate_common_free_slots_no_busy_slots(self, availability_calc, sample_event):
        """Test calculating free slots when no one is busy"""
        result = availability_calc._calculate_common_free_slots(
            sample_event,
            [1, 2],
            []
        )
        # Should return one slot per day within the event's time constraints
        assert len(result) == 3  # 3 days in the event
        for start, end in result:
            assert start.time() == time(9, 0)  # 9 AM
            assert end.time() == time(17, 0)   # 5 PM

    def test_calculate_common_free_slots_with_busy_slots(self, availability_calc, sample_event, sample_busy_slots):
        """Test calculating free slots with some busy periods"""
        result = availability_calc._calculate_common_free_slots(
            sample_event,
            [1, 2],
            sample_busy_slots
        )
        
        # On March 1, there should be two free slots:
        # 1. 9 AM - 10 AM (before first busy slot)
        # 2. 1 PM - 5 PM (after last busy slot)
        # March 2 and 3 should have full day slots
        
        assert len(result) == 5  # 2 slots on March 1, 1 slot each on March 2 and 3
        
        # Verify March 1 slots
        march1_slots = [slot for slot in result if slot[0].date() == datetime(2024, 3, 1).date()]
        assert len(march1_slots) == 2
        assert march1_slots[0][0].time() == time(9, 0)
        assert march1_slots[0][1].time() == time(10, 0)
        assert march1_slots[1][0].time() == time(13, 0)
        assert march1_slots[1][1].time() == time(17, 0)

    def test_calculate_availability_for_event_not_found(self, availability_calc):
        """Test calculating availability for non-existent event"""
        with pytest.raises(ValueError, match="Event with ID 999 not found"):
            availability_calc.calculate_availability_for_event(999)

    def test_calculate_availability_for_event_no_participants(self, availability_calc, sample_event):
        """Test calculating availability for event with no participants"""
        result = availability_calc.calculate_availability_for_event(1)
        assert result == []

    def test_calculate_availability_for_event_with_participants(self, availability_calc, sample_event, sample_busy_slots, sample_participants):
        """Test calculating availability for event with participants and busy slots"""
        result = availability_calc.calculate_availability_for_event(1)
        
        # Verify the result contains the expected number of available slots
        assert len(result) > 0
        for slot in result:
            assert isinstance(slot, AvailableSlot)
            assert slot.event_id == 1
            assert slot.participant_count == 2 