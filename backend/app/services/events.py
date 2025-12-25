import os
from ..models.event import Event
from ..models.event_participant import EventParticipant
from ..utils.supabase_client import get_supabase
from supabase import create_client
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple

class EventsService():
    """Service for managing events.

    Important:
    - `coordinator_id` is the authoritative owner; only coordinator can edit/delete
      per `check_user_permission` default policy.
    - `duration_minutes` must be a positive integer (<= 1440) and dates must be ordered.
    - `get_user_events` returns a union of events where the user is coordinator or participant.
    - Event SELECT queries use service role client to bypass RLS recursion issues.
    """
    def __init__(self, access_token: Optional[str] = None):
        self.supabase = get_supabase(access_token)
        # Create service role client for event SELECT queries (bypasses RLS)
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        print(f"[DEBUG] EventsService init: URL={supabase_url}, Key present={bool(supabase_service_key)}")
        
        if supabase_url and supabase_service_key:
            print(f"[DEBUG] Initializing service_role_client with provided key (starts with {supabase_service_key[:5]}...)")
            
            # Check if service key is same as anon key
            anon_key = os.getenv('SUPABASE_ANON_KEY')
            if anon_key and supabase_service_key == anon_key:
                print("[CRITICAL WARNING] SUPABASE_SERVICE_ROLE_KEY matches SUPABASE_ANON_KEY! RLS bypass will NOT work.")
            
            self.service_role_client = create_client(supabase_url, supabase_service_key)
        else:
            print("[DEBUG] Fallback to regular client (service role key missing)")
            # Fallback to regular client if service role key not available
            self.service_role_client = self.supabase
    
    def create_event(self, event_data: dict) -> Optional[dict]:
        """Create an event"""
        print(f"[DEBUG] Creating event with data: {event_data}")

        try:
            if not self.validate_event_data(event_data):
                print("[DEBUG] Event data validation failed")
                return None
            
            print(f"[DEBUG] Inserting event into database...")
            result = (
                self.supabase.table("events")
                .insert(event_data)
                .execute()
            )

            print(f"[DEBUG] Insert result: {result.data}")

            if not result.data:
                print("Error: No data returned from event creation")
                return None

            print(f"[DEBUG] Successfully created event: {result.data[0]}")
            return result.data[0]
        except Exception as e:
            print(f"Failed to create event: {str(e)}")
            return None

    def validate_event_data(self, event_data: dict) -> bool:
        """Validate event data (supports both old and new datetime formats)"""
        required_fields = ['name', 'coordinator_id', 'duration_minutes']

        for field in required_fields:
            if field not in event_data or not event_data[field]:
                print(f"Missing required field: {field}")
                return False

        # Validate duration
        duration = event_data.get('duration_minutes')
        if not isinstance(duration, int) or duration <= 0 or duration > 1440:  # Max 24 hours
            print("Invalid duration: must be positive integer <= 1440 minutes")
            return False

        # Validate UTC datetime range (required)
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

        # Validate event_type if provided
        event_type = event_data.get('event_type')
        if event_type and event_type not in ['meeting', 'social', 'birthday', 'other']:
            print(f"Invalid event_type: {event_type}. Must be one of: meeting, social, birthday, other")
            return False

        # Validate video_call_link if provided (basic URL validation)
        video_call_link = event_data.get('video_call_link')
        if video_call_link:
            if not (video_call_link.startswith('http://') or video_call_link.startswith('https://')):
                print(f"Invalid video_call_link: must start with http:// or https://")
                return False

        return True

    def validate_participant_status(self, status: str) -> bool:
        """Validate participant invitation status"""
        valid_statuses = ["pending", "accepted", "declined"]
        return status in valid_statuses

    def validate_rsvp_status(self, rsvp_status: str) -> bool:
        """Validate participant RSVP status"""
        valid_statuses = ["going", "maybe", "not_going"]
        return rsvp_status in valid_statuses

    def get_user_events(self, user_id: str) -> List[dict]:
        """Get all events for a user with role information"""
        try:
            # Get events where user is coordinator (use service role to bypass RLS)
            coordinator_result = (
                self.service_role_client.table("events")
                .select("*")
                .eq("coordinator_id", user_id)
                .execute()
            )
            
            # Get events where user is participant
            participant_result = (
                self.service_role_client.table("event_participants")
                .select("event_id")
                .eq("user_id", user_id)
                .execute()
            )

            coordinator_events = coordinator_result.data or []
            
            # Add role to coordinator events
            for event in coordinator_events:
                event["role"] = "coordinator"

            if participant_result.data:
                event_ids = [p["event_id"] for p in participant_result.data]
                # Use service role to bypass RLS for event queries
                participant_events_result = (
                    self.service_role_client.table("events")
                    .select("*")
                    .in_("id", event_ids)
                    .execute()
                )
                participant_events = participant_events_result.data or []
                
                # Add role to participant events (only if not already coordinator)
                coordinator_ids = set(event["id"] for event in coordinator_events)
                for event in participant_events:
                    if event["id"] not in coordinator_ids:
                        event["role"] = "participant"
            else:
                participant_events = []

            # Combine events (coordinator events already have role, participant events only if not coordinator)
            all_events = {}
            for event in coordinator_events:
                all_events[event["id"]] = event
            for event in participant_events:
                if event["id"] not in all_events:
                    all_events[event["id"]] = event
                    
            return list(all_events.values())
        except Exception as e:
            print(f"Failed to get user events: {str(e)}")
            return []

    def add_participant(self, event_id: str, user_id: str, status: str = "pending") -> Optional[dict]:
        """Add a participant to an event"""
        try:
            print(f"[DEBUG] Adding participant: event_id={event_id}, user_id={user_id}")
            
            # Input validation
            if not event_id or not user_id:
                print("Event ID and User ID are required")
                return None

            # Check if event exists
            event = self.get_event(event_id)
            if not event:
                print(f"Event {event_id} not found")
                return None

            print(f"[DEBUG] Event found: {event['name']}")

            # Check if user is already a participant
            existing = (
                self.service_role_client.table("event_participants")
                .select("*")
                .eq("event_id", event_id)
                .eq("user_id", user_id)
                .execute()
            )

            print(f"[DEBUG] Existing participants check: {len(existing.data or [])} found")

            if existing.data:
                print("User is already a participant")
                return existing.data[0]  # Return existing participant

            print(f"[DEBUG] Inserting new participant with status={status}...")
            result = (
                self.service_role_client.table("event_participants")
                .insert({"event_id": event_id, "user_id": user_id, "status": status})
                .execute()
            )

            print(f"[DEBUG] Insert result: {result.data}")

            if not result.data:
                print("Error: No data returned from participant addition")
                return None

            print(f"[DEBUG] Successfully added participant: {result.data[0]}")
            return result.data[0]
        except Exception as e:
            print(f"Failed to add participant: {str(e)}")
            return None

    def update_participant_status(self, event_id: str, user_id: str, status: str) -> Optional[dict]:
        """Update a participant's invitation status"""
        try:
            if not self.validate_participant_status(status):
                print("Invalid status")
                return None

            result = (
                self.service_role_client.table("event_participants")
                .update({"status": status})
                .eq("event_id", event_id)
                .eq("user_id", user_id)
                .execute()
            )

            if not result.data:
                print("No participant found to update")
                return None

            return result.data[0]
        except Exception as e:
            print(f"Failed to update participant status: {str(e)}")
            return None

    def update_participant_rsvp_status(self, event_uid: str, user_id: str, rsvp_status: str) -> Optional[dict]:
        """Update a participant's RSVP status (going/maybe/not_going)"""
        try:
            if not self.validate_rsvp_status(rsvp_status):
                print(f"Invalid RSVP status: {rsvp_status}")
                return None

            # Get event by UID to get the event ID
            event = self.get_event_by_uid(event_uid)
            if not event:
                print(f"Event not found with UID: {event_uid}")
                return None

            event_id = event["id"]

            # Update the participant's RSVP status
            result = (
                self.service_role_client.table("event_participants")
                .update({"rsvp_status": rsvp_status})
                .eq("event_id", event_id)
                .eq("user_id", user_id)
                .execute()
            )

            if not result.data:
                print(f"No participant found for event_id={event_id}, user_id={user_id}")
                return None

            return result.data[0]
        except Exception as e:
            print(f"Failed to update participant RSVP status: {str(e)}")
            return None

    def get_event(self, event_id: str) -> Optional[dict]:
        """Get an event by its ID - uses service role to bypass RLS"""
        try:
            result = (
                self.service_role_client.table("events")
                .select("*")
                .eq("id", event_id)
                .execute()
            )

            if not result.data:
                print(f"No event found with id: {event_id}")
                return None

            return result.data[0]
        except Exception as e:
            print(f"Failed to get event: {str(e)}")
            return None

    def get_event_by_uid(self, event_uid: str) -> Optional[dict]:
        """Get an event by UID - uses service role to bypass RLS"""
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
        """Get participants of an event with their profile information"""
        try:
            # First get the event to find the event ID by UID
            event = self.get_event_by_uid(event_id)
            if not event:
                print(f"Event with UID {event_id} not found")
                return []
            
            print(f"Found event with ID: {event['id']}")
            
            # Get participants first
            participants_result = (
                self.service_role_client.table("event_participants")
                .select("*")
                .eq("event_id", event["id"])
                .execute()
            )
            
            print(f"Found {len(participants_result.data or [])} participants")
            
            if not participants_result.data:
                return []

            # Get user IDs
            user_ids = [p["user_id"] for p in participants_result.data]
            
            # Get profiles for these users (use service_role_client for cross-user query)
            profiles_result = (
                self.service_role_client.table("profiles")
                .select("*")
                .in_("id", user_ids)
                .execute()
            )
            
            print(f"Found {len(profiles_result.data or [])} profiles")
            
            # Create a map of user_id to profile
            profiles_map = {profile["id"]: profile for profile in profiles_result.data or []}

            # Transform the data to include profile information
            participants = []
            for participant in participants_result.data:
                profile = profiles_map.get(participant["user_id"], {})
                participants.append({
                    "id": participant["user_id"],
                    "user_id": participant["user_id"],
                    "event_id": participant["event_id"],
                    "status": participant["status"],
                    "rsvp_status": participant.get("rsvp_status"),  # Include RSVP status
                    "can_invite": participant.get("can_invite", False),  # Include invite permission
                    "name": profile.get("full_name", ""),
                    "email": profile.get("email_address", ""),
                    "avatar_url": profile.get("avatar_url"),
                    "created_at": participant.get("joined_at", participant.get("created_at", ""))
                })

            print(f"Returning {len(participants)} participants with profile data")
            return participants
        except Exception as e:
            print(f"Failed to get event participants: {str(e)}")
            return []

    def remove_participant(self, event_id: str, user_id: str) -> bool:
        """
        Remove a participant from an event.

        Args:
            event_id (str): Event ID
            user_id (str): User ID

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Check if event exists
            event = self.get_event(event_id)
            if not event:
                print("Event not found")
                return False

            # Check if user is coordinator (coordinators can't be removed)
            if event.get('coordinator_id') == user_id:
                print("Cannot remove event coordinator")
                return False

            # Check if user is actually a participant
            if not self.is_user_participant(event_id, user_id):
                print("User is not a participant in this event")
                return False

            result = (
                self.service_role_client.table("event_participants")
                .delete()
                .eq("event_id", event_id)
                .eq("user_id", user_id)
                .execute()
            )

            # Clean up related data
            self.cleanup_participant_data(event_id, user_id)
            
            return True
        except Exception as e:
            print(f"Failed to remove participant: {str(e)}")
            return False

    def cleanup_participant_data(self, event_id: str, user_id: str) -> bool:
        """Clean up availability and preferences when participant is removed"""
        try:
            # Remove availability slots (use service_role_client for admin cleanup)
            self.service_role_client.table("availability").delete().eq("event_id", event_id).eq("user_id", user_id).execute()
            # Remove preferences (use service_role_client for admin cleanup)
            self.service_role_client.table("preferences").delete().eq("event_id", event_id).eq("user_id", user_id).execute()

            return True
        except Exception as e:
            print(f"Error cleaning up participant data: {str(e)}")
            return False

    def update_event(self, event_id: str, event_data: dict) -> Optional[dict]:
        """Update an event with validation"""
        try:
            # Validate event_type if provided
            if 'event_type' in event_data and event_data['event_type'] is not None:
                if event_data['event_type'] not in ['meeting', 'social', 'birthday', 'other']:
                    print(f"Invalid event_type: {event_data['event_type']}")
                    raise ValueError("event_type must be one of: meeting, social, birthday, other")

            # Validate video_call_link if provided
            if 'video_call_link' in event_data and event_data['video_call_link']:
                if not (event_data['video_call_link'].startswith('http://') or
                        event_data['video_call_link'].startswith('https://')):
                    print(f"Invalid video_call_link: must be a valid URL")
                    raise ValueError("video_call_link must start with http:// or https://")

            # Validate duration if provided
            if 'duration_minutes' in event_data and event_data['duration_minutes'] is not None:
                duration = event_data['duration_minutes']
                if not isinstance(duration, int) or duration <= 0 or duration > 1440:
                    print(f"Invalid duration: {duration}")
                    raise ValueError("duration_minutes must be a positive integer <= 1440")

            result = (
                self.supabase.table("events")
                .update(event_data)
                .eq("id", event_id)
                .execute()
            )

            if not result.data:
                print("No event found to update")
                return None

            return result.data[0]
        except Exception as e:
            print(f"Failed to update event: {str(e)}")
            raise

    def delete_event(self, event_id: str) -> bool:
        """Delete an event"""
        try:
            result = (
                self.supabase.table("events")
                .delete()
                .eq("id", event_id)
                .execute()
            )

            return True
        except Exception as e:
            print(f"Failed to delete event: {str(e)}")
            return False

    def check_user_permission(self, event_id: str, user_id: str, action: str) -> bool:
        """
        Check if the user has permission to perform an action on the event.

        Args:
            event_id (str): Event ID
            user_id (str): User ID
            action (str): Action type (e.g., "view", "edit", "delete")

        Returns:
            bool: True if permitted, False otherwise
        """
        try:
            event = self.get_event(event_id)
            if not event:
                return False

            # Event coordinator always has full permission
            if user_id == event.get('coordinator_id'):
                return True

            # If action is "view", allow if user is a participant
            if action == "view":
                participants = self.get_event_participants(event_id)
                if any(p['user_id'] == user_id for p in participants):
                    return True

            # If action is "edit" or "delete", restrict to coordinator only (example policy)
            if action in ["edit", "delete"]:
                return False

            # Default: deny permission
            return False
        except Exception as e:
            print(f"Error checking permission: {str(e)}")
            return False


    def is_user_participant(self, event_id: str, user_id: str) -> bool:
        """Check if user is a participant in the event"""
        try:
            result = (
                self.service_role_client.table("event_participants")
                .select("user_id")
                .eq("event_id", event_id)
                .eq("user_id", user_id)
                .execute()
            )

            # Empty result means user is NOT a participant (not an error)
            return bool(result.data)
        except Exception as e:
            print(f"Error checking participant status: {str(e)}")
            return False

    def get_participant_count(self, event_id: str) -> int:
        """Get the number of participants in an event"""
        try:
            result = (
                self.service_role_client.table("event_participants")
                .select("id", count="exact")
                .eq("event_id", event_id)
                .execute()
            )

            # Empty result means 0 participants (not an error)
            return result.count or 0
        except Exception as e:
            print(f"Error getting participant count: {str(e)}")
            return 0

    def get_events_by_status(self, status: str) -> List[dict]:
        """Get all events with a specific status - uses service role to bypass RLS"""
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
        valid_statuses = ["planning", "confirmed", "cancelled"]
        if status not in valid_statuses:
            print(f"Invalid event status: {status}")
            return False

        try:
            (
                self.supabase.table("events")
                .update({"status": status})
                .eq("id", event_id)
                .execute()
            )
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

            participants = self.get_event_participants(event_id)
            event["participants"] = participants
            return event
        except Exception as e:
            print(f"Failed to get event with participants: {str(e)}")
            return None