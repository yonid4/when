import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from supabase import create_client

from ..models.event import Event
from ..models.event_participant import EventParticipant
from ..utils.supabase_client import get_supabase


class EventsService:
    """Service for managing events."""

    VALID_EVENT_TYPES = ['meeting', 'social', 'birthday', 'other']
    VALID_PARTICIPANT_STATUSES = ["pending", "accepted", "declined"]
    VALID_RSVP_STATUSES = ["going", "maybe", "not_going"]
    VALID_EVENT_STATUSES = ["planning", "confirmed", "cancelled"]
    MAX_DURATION_MINUTES = 1440

    def __init__(self, access_token: Optional[str] = None):
        self.supabase = get_supabase(access_token)

        supabase_url = os.getenv('SUPABASE_URL')
        supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

        if supabase_url and supabase_service_key:
            self.service_role_client = create_client(supabase_url, supabase_service_key)
        else:
            self.service_role_client = self.supabase
    
    def create_event(self, event_data: dict) -> Optional[dict]:
        """Create an event."""
        try:
            if not self.validate_event_data(event_data):
                return None

            result = self.supabase.table("events").insert(event_data).execute()

            if not result.data:
                print("Error: No data returned from event creation")
                return None

            return result.data[0]
        except Exception as e:
            print(f"Failed to create event: {str(e)}")
            return None

    def validate_event_data(self, event_data: dict) -> bool:
        """Validate event data for creation."""
        required_fields = ['name', 'coordinator_id', 'duration_minutes']

        for field in required_fields:
            if field not in event_data or not event_data[field]:
                print(f"Missing required field: {field}")
                return False

        duration = event_data.get('duration_minutes')
        if not isinstance(duration, int) or duration <= 0 or duration > self.MAX_DURATION_MINUTES:
            print("Invalid duration: must be positive integer <= 1440 minutes")
            return False

        if not event_data.get('earliest_datetime_utc') or not event_data.get('latest_datetime_utc'):
            print("Missing required fields: earliest_datetime_utc and latest_datetime_utc")
            return False

        try:
            earliest = datetime.fromisoformat(event_data['earliest_datetime_utc'])
            latest = datetime.fromisoformat(event_data['latest_datetime_utc'])
            if earliest > latest:
                print("Invalid datetime range: earliest_datetime_utc must be before latest_datetime_utc")
                return False
        except (ValueError, TypeError) as e:
            print(f"Invalid datetime format: {e}")
            return False

        event_type = event_data.get('event_type')
        if event_type and event_type not in self.VALID_EVENT_TYPES:
            print(f"Invalid event_type: {event_type}. Must be one of: {', '.join(self.VALID_EVENT_TYPES)}")
            return False

        video_call_link = event_data.get('video_call_link')
        if video_call_link and not video_call_link.startswith(('http://', 'https://')):
            print("Invalid video_call_link: must start with http:// or https://")
            return False

        return True

    def validate_participant_status(self, status: str) -> bool:
        """Validate participant invitation status."""
        return status in self.VALID_PARTICIPANT_STATUSES

    def validate_rsvp_status(self, rsvp_status: str) -> bool:
        """Validate participant RSVP status."""
        return rsvp_status in self.VALID_RSVP_STATUSES

    def get_user_events(self, user_id: str) -> List[dict]:
        """Get all events for a user with role information."""
        try:
            coordinator_result = (
                self.service_role_client.table("events")
                .select("*")
                .eq("coordinator_id", user_id)
                .execute()
            )

            participant_result = (
                self.service_role_client.table("event_participants")
                .select("event_id")
                .eq("user_id", user_id)
                .execute()
            )

            coordinator_events = coordinator_result.data or []
            for event in coordinator_events:
                event["role"] = "coordinator"

            participant_events = []
            if participant_result.data:
                event_ids = [p["event_id"] for p in participant_result.data]
                participant_events_result = (
                    self.service_role_client.table("events")
                    .select("*")
                    .in_("id", event_ids)
                    .execute()
                )
                participant_events = participant_events_result.data or []

                coordinator_ids = {event["id"] for event in coordinator_events}
                for event in participant_events:
                    if event["id"] not in coordinator_ids:
                        event["role"] = "participant"

            all_events = {event["id"]: event for event in coordinator_events}
            for event in participant_events:
                if event["id"] not in all_events:
                    all_events[event["id"]] = event

            return list(all_events.values())
        except Exception as e:
            print(f"Failed to get user events: {str(e)}")
            return []

    def add_participant(self, event_id: str, user_id: str, status: Optional[str] = None, rsvp_status: Optional[str] = None) -> Optional[dict]:
        """Add a participant to an event."""
        try:
            if not event_id or not user_id:
                print("Event ID and User ID are required")
                return None

            event = self.get_event(event_id)
            if not event:
                print(f"Event {event_id} not found")
                return None

            existing = (
                self.service_role_client.table("event_participants")
                .select("*")
                .eq("event_id", event_id)
                .eq("user_id", user_id)
                .execute()
            )

            if existing.data:
                return existing.data[0]
            
            result = (
                self.service_role_client.table("event_participants")
                .insert({"event_id": event_id, "user_id": user_id, "status": status, "rsvp_status": rsvp_status})
                .execute()
            )

            if not result.data:
                print("Error: No data returned from participant addition")
                return None

            return result.data[0]
        except Exception as e:
            print(f"Failed to add participant: {str(e)}")
            return None

    def update_participant_status(self, event_id: str, user_id: str, status: str) -> Optional[dict]:
        """Update a participant's invitation status."""
        try:
            if not self.validate_participant_status(status):
                print("Invalid status")
                return None

            rsvp_status = "going" if status == "accepted" else None

            result = (
                self.service_role_client.table("event_participants")
                .update({"status": status, "rsvp_status": rsvp_status})
                .eq("event_id", event_id)
                .eq("user_id", user_id)
                .execute()
            )

            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Failed to update participant status: {str(e)}")
            return None

    def update_participant_rsvp_status(self, event_uid: str, user_id: str, rsvp_status: str) -> Optional[dict]:
        """Update a participant's RSVP status."""
        try:
            if not self.validate_rsvp_status(rsvp_status):
                print(f"Invalid RSVP status: {rsvp_status}")
                return None

            event = self.get_event_by_uid(event_uid)
            if not event:
                print(f"Event not found with UID: {event_uid}")
                return None

            result = (
                self.service_role_client.table("event_participants")
                .update({"rsvp_status": rsvp_status})
                .eq("event_id", event["id"])
                .eq("user_id", user_id)
                .execute()
            )

            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Failed to update participant RSVP status: {str(e)}")
            return None

    def get_event(self, event_id: str) -> Optional[dict]:
        """Get an event by its ID."""
        try:
            result = (
                self.service_role_client.table("events")
                .select("*")
                .eq("id", event_id)
                .execute()
            )

            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Failed to get event: {str(e)}")
            return None

    def get_event_by_uid(self, event_uid: str) -> Optional[dict]:
        """Get an event by UID."""
        try:
            result = (
                self.service_role_client.table("events")
                .select("*")
                .eq("uid", event_uid)
                .execute()
            )

            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Failed to get event by UID: {str(e)}")
            return None

    def get_event_participants(self, event_id: str) -> List[dict]:
        """Get participants of an event with their profile information."""
        try:
            event = self.get_event_by_uid(event_id)
            if not event:
                print(f"Event with UID {event_id} not found")
                return []

            participants_result = (
                self.service_role_client.table("event_participants")
                .select("*")
                .eq("event_id", event["id"])
                .execute()
            )

            if not participants_result.data:
                return []

            user_ids = [p["user_id"] for p in participants_result.data]

            profiles_result = (
                self.service_role_client.table("profiles")
                .select("*")
                .in_("id", user_ids)
                .execute()
            )

            profiles_map = {profile["id"]: profile for profile in profiles_result.data or []}

            participants = []
            for participant in participants_result.data:
                profile = profiles_map.get(participant["user_id"], {})
                participants.append({
                    "id": participant["user_id"],
                    "user_id": participant["user_id"],
                    "event_id": participant["event_id"],
                    "status": participant["status"],
                    "rsvp_status": participant.get("rsvp_status"),
                    "can_invite": participant.get("can_invite", False),
                    "name": profile.get("full_name", ""),
                    "email": profile.get("email_address", ""),
                    "avatar_url": profile.get("avatar_url"),
                    "created_at": participant.get("joined_at", participant.get("created_at", ""))
                })

            return participants
        except Exception as e:
            print(f"Failed to get event participants: {str(e)}")
            return []

    def remove_participant(self, event_id: str, user_id: str) -> bool:
        """Remove a participant from an event."""
        try:
            event = self.get_event(event_id)
            if not event:
                print("Event not found")
                return False

            if event.get('coordinator_id') == user_id:
                print("Cannot remove event coordinator")
                return False

            if not self.is_user_participant(event_id, user_id):
                print("User is not a participant in this event")
                return False

            self.service_role_client.table("event_participants").delete().eq(
                "event_id", event_id
            ).eq("user_id", user_id).execute()

            self.cleanup_participant_data(event_id, user_id)

            return True
        except Exception as e:
            print(f"Failed to remove participant: {str(e)}")
            return False

    def cleanup_participant_data(self, event_id: str, user_id: str) -> bool:
        """Clean up availability and preferences when participant is removed."""
        try:
            self.service_role_client.table("availability").delete().eq(
                "event_id", event_id
            ).eq("user_id", user_id).execute()

            self.service_role_client.table("preferences").delete().eq(
                "event_id", event_id
            ).eq("user_id", user_id).execute()

            return True
        except Exception as e:
            print(f"Error cleaning up participant data: {str(e)}")
            return False

    def update_event(self, event_id: str, event_data: dict) -> Optional[dict]:
        """Update an event with validation."""
        event_type = event_data.get('event_type')
        if event_type is not None and event_type not in self.VALID_EVENT_TYPES:
            raise ValueError(f"event_type must be one of: {', '.join(self.VALID_EVENT_TYPES)}")

        video_call_link = event_data.get('video_call_link')
        if video_call_link and not video_call_link.startswith(('http://', 'https://')):
            raise ValueError("video_call_link must start with http:// or https://")

        duration = event_data.get('duration_minutes')
        if duration is not None:
            if not isinstance(duration, int) or duration <= 0 or duration > self.MAX_DURATION_MINUTES:
                raise ValueError("duration_minutes must be a positive integer <= 1440")

        try:
            result = (
                self.supabase.table("events")
                .update(event_data)
                .eq("id", event_id)
                .execute()
            )

            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Failed to update event: {str(e)}")
            raise

    def delete_event(self, event_id: str) -> bool:
        """Delete an event."""
        try:
            self.supabase.table("events").delete().eq("id", event_id).execute()
            return True
        except Exception as e:
            print(f"Failed to delete event: {str(e)}")
            return False

    def check_user_permission(self, event_id: str, user_id: str, action: str) -> bool:
        """Check if the user has permission to perform an action on the event."""
        try:
            event = self.get_event(event_id)
            if not event:
                return False

            if user_id == event.get('coordinator_id'):
                return True

            if action == "view":
                participants = self.get_event_participants(event_id)
                return any(p['user_id'] == user_id for p in participants)

            if action in ["edit", "delete"]:
                return False

            return False
        except Exception as e:
            print(f"Error checking permission: {str(e)}")
            return False

    def is_user_participant(self, event_id: str, user_id: str) -> bool:
        """Check if user is a participant in the event."""
        try:
            result = (
                self.service_role_client.table("event_participants")
                .select("user_id")
                .eq("event_id", event_id)
                .eq("user_id", user_id)
                .execute()
            )

            return bool(result.data)
        except Exception as e:
            print(f"Error checking participant status: {str(e)}")
            return False

    def get_participant_count(self, event_id: str) -> int:
        """Get the number of participants in an event."""
        try:
            result = (
                self.service_role_client.table("event_participants")
                .select("id", count="exact")
                .eq("event_id", event_id)
                .execute()
            )

            return result.count or 0
        except Exception as e:
            print(f"Error getting participant count: {str(e)}")
            return 0

    def get_events_by_status(self, status: str) -> List[dict]:
        """Get all events with a specific status."""
        try:
            result = (
                self.service_role_client.table("events")
                .select("*")
                .eq("status", status)
                .execute()
            )

            return result.data or []
        except Exception as e:
            print(f"Failed to get events by status: {str(e)}")
            return []

    def update_event_status(self, event_id: str, status: str) -> bool:
        """Update event status with validation."""
        if status not in self.VALID_EVENT_STATUSES:
            print(f"Invalid event status: {status}")
            return False

        try:
            self.supabase.table("events").update({"status": status}).eq("id", event_id).execute()
            return True
        except Exception as e:
            print(f"Failed to update event status: {str(e)}")
            return False

    def get_event_with_participants(self, event_id: str) -> Optional[dict]:
        """Get an event and include its participants."""
        try:
            event = self.get_event(event_id)
            if not event:
                return None

            event["participants"] = self.get_event_participants(event_id)
            return event
        except Exception as e:
            print(f"Failed to get event with participants: {str(e)}")
            return None