"""
Event finalization service for creating Google Calendar events.

Handles validating finalization requests, creating Google Calendar events
with retry logic, sending invitations, and updating event status.
"""

import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from supabase import create_client

from ..services.google_calendar import get_calendar_service, get_stored_credentials
from ..utils.supabase_client import get_supabase


class EventFinalizationService:
    """Service for finalizing events with Google Calendar integration."""

    def __init__(self, access_token: Optional[str] = None):
        self.supabase = get_supabase(access_token)

        supabase_url = os.getenv('SUPABASE_URL')
        supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

        if supabase_url and supabase_service_key:
            self.service_role_client = create_client(supabase_url, supabase_service_key)
        else:
            self.service_role_client = self.supabase
    
    def finalize_event(
        self,
        event_id: str,
        coordinator_id: str,
        start_time_utc: str,
        end_time_utc: str,
        participant_ids: List[str],
        include_google_meet: bool = False
    ) -> Dict[str, Any]:
        """Finalize an event and create Google Calendar event."""
        event = self._get_event(event_id)
        if not event:
            raise Exception("Event not found")

        if event["coordinator_id"] != coordinator_id:
            raise Exception("Only coordinator can finalize event")

        if event.get("status") == "finalized":
            raise Exception("Event already finalized")

        credentials = get_stored_credentials(coordinator_id)
        if not credentials:
            raise Exception("Google Calendar not connected. Please connect your calendar first.")

        coordinator = self._get_user_profile(coordinator_id)
        if not coordinator:
            raise Exception("Coordinator profile not found")

        participants = self._get_participants(participant_ids)
        if not participants:
            raise Exception("No valid participants found")

        attendee_emails = [p["email_address"] for p in participants if p.get("email_address")]
        if not attendee_emails:
            raise Exception("No participant emails found")

        calendar_event = self._prepare_calendar_event(
            event=event,
            start_time_utc=start_time_utc,
            end_time_utc=end_time_utc,
            attendee_emails=attendee_emails,
            coordinator_timezone=coordinator.get("timezone", "UTC"),
            include_google_meet=include_google_meet,
            event_id=event_id
        )

        try:
            created_event = self._create_google_calendar_event_with_retry(
                credentials=credentials,
                coordinator_id=coordinator_id,
                event_data=calendar_event,
                include_meet=include_google_meet
            )
        except Exception as e:
            raise Exception(f"Failed to create Google Calendar event: {str(e)}")

        try:
            self._update_event_finalization(
                event_id=event_id,
                start_time_utc=start_time_utc,
                end_time_utc=end_time_utc,
                google_event_id=created_event["id"],
                google_html_link=created_event["htmlLink"]
            )
        except Exception as e:
            print(f"CRITICAL: Google event created but DB update failed: {e}")
            raise Exception("Event created in Google Calendar but failed to update database. Please contact support.")

        try:
            self._create_finalization_notifications(
                event=event,
                participants=participants,
                coordinator_id=coordinator_id,
                start_time_utc=start_time_utc,
                google_html_link=created_event["htmlLink"]
            )
        except Exception as e:
            print(f"Warning: Failed to create finalization notifications: {e}")

        return {
            "success": True,
            "google_event_id": created_event["id"],
            "html_link": created_event["htmlLink"],
            "meet_link": created_event.get("hangoutLink")
        }
    
    def _get_event(self, event_id: str) -> Optional[Dict[str, Any]]:
        """Get event by ID."""
        try:
            response = (
                self.service_role_client.table("events")
                .select("*")
                .eq("id", event_id)
                .execute()
            )
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error getting event: {str(e)}")
            return None

    def _get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile by ID."""
        try:
            response = (
                self.service_role_client.table("profiles")
                .select("*")
                .eq("id", user_id)
                .execute()
            )
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error getting user profile: {str(e)}")
            return None

    def _get_participants(self, participant_ids: List[str]) -> List[Dict[str, Any]]:
        """Get participant profiles by IDs."""
        try:
            response = (
                self.service_role_client.table("profiles")
                .select("id, email_address, full_name")
                .in_("id", participant_ids)
                .execute()
            )
            return response.data or []
        except Exception as e:
            print(f"Error getting participants: {str(e)}")
            return []

    def _prepare_calendar_event(
        self,
        event: Dict[str, Any],
        start_time_utc: str,
        end_time_utc: str,
        attendee_emails: List[str],
        coordinator_timezone: str,
        include_google_meet: bool,
        event_id: str
    ) -> Dict[str, Any]:
        """Prepare Google Calendar event object."""
        calendar_event = {
            "summary": event["name"],
            "description": event.get("description") or "Event made by When.",
            "start": {
                "dateTime": start_time_utc,
                "timeZone": coordinator_timezone
            },
            "end": {
                "dateTime": end_time_utc,
                "timeZone": coordinator_timezone
            },
            "attendees": [{"email": email} for email in attendee_emails],
            "reminders": {"useDefault": True},
            "guestsCanModify": False,
            "guestsCanInviteOthers": False,
            "guestsCanSeeOtherGuests": True
        }

        if include_google_meet:
            calendar_event["conferenceData"] = {
                "createRequest": {
                    "requestId": f"meet-{event_id}-{int(time.time())}",
                    "conferenceSolutionKey": {"type": "hangoutsMeet"}
                }
            }

        return calendar_event
    
    def _create_google_calendar_event_with_retry(
        self,
        credentials,
        coordinator_id: str,
        event_data: Dict[str, Any],
        include_meet: bool = False,
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """Create Google Calendar event with retry logic."""
        service = get_calendar_service(credentials, coordinator_id)

        params = {"sendUpdates": "all"}

        if include_meet:
            params["conferenceDataVersion"] = 1

        for attempt in range(max_retries):
            try:
                return (
                    service.events()
                    .insert(calendarId="primary", body=event_data, **params)
                    .execute()
                )

            except Exception as e:
                error_str = str(e).lower()

                if "401" in error_str or "unauthorized" in error_str:
                    raise Exception("Google authentication failed. Please reconnect your calendar.")

                is_retryable = (
                    "429" in error_str or
                    "rate limit" in error_str or
                    "500" in error_str or
                    "503" in error_str
                )

                if is_retryable and attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue

                if "429" in error_str or "rate limit" in error_str:
                    raise Exception("Google Calendar API rate limit exceeded. Please try again in a moment.")

                if attempt == max_retries - 1:
                    raise Exception(f"Failed to create calendar event: {str(e)}")

                time.sleep(2 ** attempt)

        raise Exception("Failed to create event after maximum retries")
    
    def _update_event_finalization(
        self,
        event_id: str,
        start_time_utc: str,
        end_time_utc: str,
        google_event_id: str,
        google_html_link: str
    ) -> None:
        """Update event with finalization details."""
        response = (
            self.service_role_client.table("events")
            .update({
                "status": "finalized",
                "finalized_start_time_utc": start_time_utc,
                "finalized_end_time_utc": end_time_utc,
                "google_calendar_event_id": google_event_id,
                "google_calendar_html_link": google_html_link,
                "finalized_at": datetime.now(timezone.utc).isoformat()
            })
            .eq("id", event_id)
            .execute()
        )

        if not response.data:
            raise Exception("Failed to update event in database")

    def _create_finalization_notifications(
        self,
        event: Dict[str, Any],
        participants: List[Dict[str, Any]],
        coordinator_id: str,
        start_time_utc: str,
        google_html_link: str
    ) -> None:
        """Create finalization notifications for all participants except coordinator."""
        from ..services.notifications import NotificationsService

        notifications_service = NotificationsService()

        try:
            dt = datetime.fromisoformat(start_time_utc.replace("Z", "+00:00"))
            formatted_time = dt.strftime("%A, %B %d, %Y at %I:%M %p UTC")
        except Exception:
            formatted_time = start_time_utc

        for participant in participants:
            if participant["id"] != coordinator_id:
                notifications_service.create_event_finalized_notification(
                    user_id=participant["id"],
                    event_id=event["id"],
                    event_title=event["name"],
                    finalized_time=formatted_time,
                    google_calendar_link=google_html_link
                )

