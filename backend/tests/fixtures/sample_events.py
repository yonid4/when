"""
Sample event data fixtures for testing.

This module provides various event states and configurations
matching the Supabase schema.
"""

from datetime import datetime, timedelta


# ============================================================================
# User Fixtures
# ============================================================================

SAMPLE_USERS = {
    "coordinator": {
        "id": "user-coordinator-123",
        "email": "coordinator@example.com",
        "full_name": "Alice Coordinator",
        "avatar_url": "https://example.com/avatars/alice.jpg",
        "timezone": "America/New_York",
        "created_at": "2024-01-01T00:00:00Z"
    },
    "participant_1": {
        "id": "user-participant-456",
        "email": "bob@example.com",
        "full_name": "Bob Participant",
        "avatar_url": "https://example.com/avatars/bob.jpg",
        "timezone": "America/Los_Angeles",
        "created_at": "2024-01-02T00:00:00Z"
    },
    "participant_2": {
        "id": "user-participant-789",
        "email": "charlie@example.com",
        "full_name": "Charlie User",
        "avatar_url": "https://example.com/avatars/charlie.jpg",
        "timezone": "Europe/London",
        "created_at": "2024-01-03T00:00:00Z"
    }
}


# ============================================================================
# Event Fixtures - Various States
# ============================================================================

SAMPLE_EVENTS = {
    "planning": {
        "id": "event-planning-123",
        "uid": "plan12345678",
        "name": "Team Planning Meeting",
        "description": "Quarterly planning session for the team",
        "coordinator_id": SAMPLE_USERS["coordinator"]["id"],
        "earliest_date": "2024-12-20",
        "latest_date": "2024-12-27",
        "earliest_hour": "09:00:00",
        "latest_hour": "17:00:00",
        "duration_minutes": 120,
        "status": "planning",
        "selected_start_time_utc": None,
        "selected_end_time_utc": None,
        "finalized_start_time_utc": None,
        "finalized_end_time_utc": None,
        "google_calendar_event_id": None,
        "google_calendar_html_link": None,
        "finalized_at": None,
        "created_at": "2024-12-18T10:00:00Z",
        "updated_at": "2024-12-18T10:00:00Z"
    },
    "confirmed": {
        "id": "event-confirmed-456",
        "uid": "conf98765432",
        "name": "Product Demo",
        "description": "Demo of new features to stakeholders",
        "coordinator_id": SAMPLE_USERS["coordinator"]["id"],
        "earliest_date": "2024-12-22",
        "latest_date": "2024-12-29",
        "earliest_hour": "10:00:00",
        "latest_hour": "16:00:00",
        "duration_minutes": 60,
        "status": "confirmed",
        "selected_start_time_utc": "2024-12-23T15:00:00Z",
        "selected_end_time_utc": "2024-12-23T16:00:00Z",
        "finalized_start_time_utc": "2024-12-23T15:00:00Z",
        "finalized_end_time_utc": "2024-12-23T16:00:00Z",
        "google_calendar_event_id": "gcal-confirmed-123",
        "google_calendar_html_link": "https://calendar.google.com/event?eid=gcal-confirmed-123",
        "finalized_at": "2024-12-19T14:30:00Z",
        "created_at": "2024-12-18T11:00:00Z",
        "updated_at": "2024-12-19T14:30:00Z"
    },
    "cancelled": {
        "id": "event-cancelled-789",
        "uid": "canc11223344",
        "name": "Cancelled Workshop",
        "description": "This workshop was cancelled due to low attendance",
        "coordinator_id": SAMPLE_USERS["coordinator"]["id"],
        "earliest_date": "2024-12-25",
        "latest_date": "2024-12-31",
        "earliest_hour": "13:00:00",
        "latest_hour": "18:00:00",
        "duration_minutes": 90,
        "status": "cancelled",
        "selected_start_time_utc": None,
        "selected_end_time_utc": None,
        "finalized_start_time_utc": None,
        "finalized_end_time_utc": None,
        "google_calendar_event_id": None,
        "google_calendar_html_link": None,
        "finalized_at": None,
        "created_at": "2024-12-15T09:00:00Z",
        "updated_at": "2024-12-17T16:00:00Z"
    },
    "short_duration": {
        "id": "event-short-111",
        "uid": "short1234567",
        "name": "Quick Sync",
        "description": "Brief 15-minute sync",
        "coordinator_id": SAMPLE_USERS["coordinator"]["id"],
        "earliest_date": "2024-12-20",
        "latest_date": "2024-12-21",
        "earliest_hour": "09:00:00",
        "latest_hour": "12:00:00",
        "duration_minutes": 15,
        "status": "planning",
        "selected_start_time_utc": None,
        "selected_end_time_utc": None,
        "finalized_start_time_utc": None,
        "finalized_end_time_utc": None,
        "google_calendar_event_id": None,
        "google_calendar_html_link": None,
        "finalized_at": None,
        "created_at": "2024-12-18T08:00:00Z",
        "updated_at": "2024-12-18T08:00:00Z"
    },
    "long_duration": {
        "id": "event-long-222",
        "uid": "long87654321",
        "name": "All-Day Workshop",
        "description": "Full-day workshop session",
        "coordinator_id": SAMPLE_USERS["coordinator"]["id"],
        "earliest_date": "2024-12-26",
        "latest_date": "2024-12-28",
        "earliest_hour": "08:00:00",
        "latest_hour": "18:00:00",
        "duration_minutes": 480,  # 8 hours
        "status": "planning",
        "selected_start_time_utc": None,
        "selected_end_time_utc": None,
        "finalized_start_time_utc": None,
        "finalized_end_time_utc": None,
        "google_calendar_event_id": None,
        "google_calendar_html_link": None,
        "finalized_at": None,
        "created_at": "2024-12-18T07:00:00Z",
        "updated_at": "2024-12-18T07:00:00Z"
    }
}


# ============================================================================
# Event Participant Fixtures
# ============================================================================

SAMPLE_EVENT_PARTICIPANTS = [
    {
        "id": "participant-001",
        "event_id": SAMPLE_EVENTS["planning"]["id"],
        "user_id": SAMPLE_USERS["participant_1"]["id"],
        "status": "accepted",
        "joined_at": "2024-12-18T11:00:00Z",
        "created_at": "2024-12-18T11:00:00Z"
    },
    {
        "id": "participant-002",
        "event_id": SAMPLE_EVENTS["planning"]["id"],
        "user_id": SAMPLE_USERS["participant_2"]["id"],
        "status": "pending",
        "joined_at": "2024-12-18T11:30:00Z",
        "created_at": "2024-12-18T11:30:00Z"
    },
    {
        "id": "participant-003",
        "event_id": SAMPLE_EVENTS["confirmed"]["id"],
        "user_id": SAMPLE_USERS["participant_1"]["id"],
        "status": "accepted",
        "joined_at": "2024-12-18T12:00:00Z",
        "created_at": "2024-12-18T12:00:00Z"
    },
    {
        "id": "participant-004",
        "event_id": SAMPLE_EVENTS["confirmed"]["id"],
        "user_id": SAMPLE_USERS["participant_2"]["id"],
        "status": "accepted",
        "joined_at": "2024-12-18T12:15:00Z",
        "created_at": "2024-12-18T12:15:00Z"
    }
]


# ============================================================================
# Availability Fixtures
# ============================================================================

SAMPLE_AVAILABILITY_SLOTS = [
    {
        "id": "avail-001",
        "event_id": SAMPLE_EVENTS["planning"]["id"],
        "user_id": SAMPLE_USERS["participant_1"]["id"],
        "start_time_utc": "2024-12-20T14:00:00Z",
        "end_time_utc": "2024-12-20T17:00:00Z",
        "created_at": "2024-12-18T13:00:00Z"
    },
    {
        "id": "avail-002",
        "event_id": SAMPLE_EVENTS["planning"]["id"],
        "user_id": SAMPLE_USERS["participant_1"]["id"],
        "start_time_utc": "2024-12-21T09:00:00Z",
        "end_time_utc": "2024-12-21T12:00:00Z",
        "created_at": "2024-12-18T13:00:00Z"
    },
    {
        "id": "avail-003",
        "event_id": SAMPLE_EVENTS["planning"]["id"],
        "user_id": SAMPLE_USERS["participant_2"]["id"],
        "start_time_utc": "2024-12-20T15:00:00Z",
        "end_time_utc": "2024-12-20T18:00:00Z",
        "created_at": "2024-12-18T13:30:00Z"
    }
]


# ============================================================================
# Preference Fixtures
# ============================================================================

SAMPLE_PREFERENCES = [
    {
        "id": "pref-001",
        "event_id": SAMPLE_EVENTS["planning"]["id"],
        "user_id": SAMPLE_USERS["participant_1"]["id"],
        "preferred_start_time_utc": "2024-12-20T14:00:00Z",
        "preferred_end_time_utc": "2024-12-20T16:00:00Z",
        "preference_strength": "strong",
        "created_at": "2024-12-18T14:00:00Z"
    },
    {
        "id": "pref-002",
        "event_id": SAMPLE_EVENTS["planning"]["id"],
        "user_id": SAMPLE_USERS["participant_2"]["id"],
        "preferred_start_time_utc": "2024-12-20T15:00:00Z",
        "preferred_end_time_utc": "2024-12-20T17:00:00Z",
        "preference_strength": "moderate",
        "created_at": "2024-12-18T14:15:00Z"
    }
]


# ============================================================================
# Helper Functions
# ============================================================================

def get_event_by_status(status: str):
    """Get sample event by status."""
    for event in SAMPLE_EVENTS.values():
        if event["status"] == status:
            return event
    return None


def get_participants_for_event(event_id: str):
    """Get all participants for a given event."""
    return [p for p in SAMPLE_EVENT_PARTICIPANTS if p["event_id"] == event_id]


def get_availability_for_event(event_id: str):
    """Get all availability slots for a given event."""
    return [a for a in SAMPLE_AVAILABILITY_SLOTS if a["event_id"] == event_id]


def get_preferences_for_event(event_id: str):
    """Get all preferences for a given event."""
    return [p for p in SAMPLE_PREFERENCES if p["event_id"] == event_id]


def create_valid_event_data(coordinator_id: str = None, **overrides):
    """
    Create valid event data for testing event creation.

    Args:
        coordinator_id: Coordinator user ID
        **overrides: Fields to override in the base event

    Returns:
        Dictionary with valid event data
    """
    base_event = {
        "name": "Test Event",
        "description": "A test event",
        "coordinator_id": coordinator_id or SAMPLE_USERS["coordinator"]["id"],
        "earliest_date": "2024-12-20",
        "latest_date": "2024-12-25",
        "earliest_hour": "09:00:00",
        "latest_hour": "17:00:00",
        "duration_minutes": 60,
        "status": "planning"
    }

    base_event.update(overrides)
    return base_event


def create_invalid_event_data(missing_field: str = None, **overrides):
    """
    Create invalid event data for testing validation.

    Args:
        missing_field: Field to exclude from the event
        **overrides: Fields to override in the base event

    Returns:
        Dictionary with invalid event data
    """
    base_event = {
        "name": "Test Event",
        "coordinator_id": SAMPLE_USERS["coordinator"]["id"],
        "duration_minutes": 60
    }

    if missing_field:
        base_event.pop(missing_field, None)

    base_event.update(overrides)
    return base_event
