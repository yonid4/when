"""
Event finalization service for creating calendar events (Google and Microsoft).

Handles validating finalization requests, creating calendar events
with retry logic, sending invitations, and updating event status.
"""

import logging
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from supabase import create_client

from ..services import microsoft_calendar
from ..services.google_calendar import get_credentials_from_dict, get_calendar_service, get_stored_credentials
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
        include_google_meet: bool = False,
        include_online_meeting: bool = False,
    ) -> Dict[str, Any]:
        """Finalize an event and create calendar event (Google or Microsoft)."""
        event = self._get_event(event_id)
        if not event:
            raise Exception("Event not found")

        if event["coordinator_id"] != coordinator_id:
            raise Exception("Only coordinator can finalize event")

        if event.get("status") == "finalized":
            raise Exception("Event already finalized")

        # Detect which calendar provider to use
        provider, credentials, calendar_id = self._detect_coordinator_provider(coordinator_id)
        if not provider or not credentials:
            raise Exception("No calendar connected. Please connect your calendar first.")

        # Merge legacy include_google_meet with new include_online_meeting
        wants_online_meeting = include_google_meet or include_online_meeting

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
            include_google_meet=wants_online_meeting,
            event_id=event_id
        )

        try:
            if provider == "microsoft":
                created_event = microsoft_calendar.create_calendar_event_with_retry(
                    credentials=credentials,
                    user_id=coordinator_id,
                    calendar_id=calendar_id,
                    event_data=calendar_event,
                    include_online_meeting=wants_online_meeting,
                )
            else:
                created_event = self._create_google_calendar_event_with_retry(
                    credentials=credentials,
                    coordinator_id=coordinator_id,
                    event_data=calendar_event,
                    include_meet=wants_online_meeting
                )
        except Exception as e:
            raise Exception(f"Failed to create calendar event: {str(e)}")

        calendar_event_id = created_event["id"]
        calendar_html_link = created_event.get("htmlLink", "")
        online_meeting_url = created_event.get("hangoutLink") or created_event.get("onlineMeetingUrl")

        try:
            self._update_event_finalization(
                event_id=event_id,
                start_time_utc=start_time_utc,
                end_time_utc=end_time_utc,
                calendar_event_id=calendar_event_id,
                calendar_html_link=calendar_html_link,
                calendar_provider=provider,
            )
        except Exception as e:
            logging.critical(f"Calendar event created but DB update failed: {e}")
            raise Exception("Event created in calendar but failed to update database. Please contact support.")

        try:
            self._create_finalization_notifications(
                event=event,
                participants=participants,
                coordinator_id=coordinator_id,
                start_time_utc=start_time_utc,
                google_html_link=calendar_html_link
            )
        except Exception as e:
            logging.warning(f"Failed to create finalization notifications: {e}")

        return {
            "success": True,
            "calendar_provider": provider,
            "calendar_event_id": calendar_event_id,
            "html_link": calendar_html_link,
            "online_meeting_url": online_meeting_url,
            # Backward compat
            "provider_event_id": calendar_event_id if provider == "google" else None,
            "meet_link": created_event.get("hangoutLink") if provider == "google" else None,
        }
    
    def _detect_coordinator_provider(self, coordinator_id: str) -> tuple:
        """Detect which calendar provider the coordinator uses.

        Returns (provider, credentials, calendar_id).
        """
        # First: check calendar_accounts for a write calendar preference
        try:
            from ..services.calendar_accounts import CalendarAccountsService
            cas = CalendarAccountsService()

            write_cal = cas.get_write_calendar(coordinator_id)
            if write_cal and write_cal.get("account"):
                account = write_cal["account"]
                if account.get("credentials"):
                    creds = get_credentials_from_dict(account["credentials"]) if account["provider"] == "google" else account["credentials"]
                    return (account["provider"], creds, write_cal.get("calendar_id", "primary"))

            # Fall back to any account with credentials
            accounts = cas.get_user_accounts(coordinator_id)
            for account in accounts:
                if account.get("credentials"):
                    creds = get_credentials_from_dict(account["credentials"]) if account["provider"] == "google" else account["credentials"]
                    return (account["provider"], creds, "primary")
        except Exception as e:
            logging.debug(f"calendar_accounts lookup failed: {e}")

        # Last resort: check legacy credentials
        google_creds = get_stored_credentials(coordinator_id)
        if google_creds:
            return ("google", google_creds, "primary")

        ms_creds = microsoft_calendar.get_stored_credentials(coordinator_id)
        if ms_creds:
            return ("microsoft", ms_creds, "primary")

        return (None, None, None)

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

    def _build_calendar_description(self, event: Dict[str, Any]) -> str:
        """Build a rich description for the calendar event."""
        from ..config import Config
        parts = []
        user_description = (event.get("description") or "").strip()
        if user_description:
            parts.append(user_description)
            parts.append("---")
        event_uid = event.get("uid")
        event_url = f"{Config.FRONTEND_URL.rstrip('/')}/events/{event_uid}" if event_uid else None
        footer_parts = []
        if event_url:
            footer_parts.append(event_url)
        footer_parts.append("Coordinated with When")
        parts.append(" · ".join(footer_parts))
        return "\n\n".join(parts)

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
            "description": self._build_calendar_description(event),
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
        calendar_event_id: str,
        calendar_html_link: str,
        calendar_provider: str = "google",
    ) -> None:
        """Update event with finalization details."""
        update_data = {
            "status": "finalized",
            "finalized_start_time_utc": start_time_utc,
            "finalized_end_time_utc": end_time_utc,
            "calendar_provider": calendar_provider,
            "finalized_at": datetime.now(timezone.utc).isoformat(),
        }

        if calendar_provider == "google":
            update_data["google_calendar_event_id"] = calendar_event_id
            update_data["google_calendar_html_link"] = calendar_html_link
        elif calendar_provider == "microsoft":
            update_data["microsoft_calendar_event_id"] = calendar_event_id
            update_data["microsoft_calendar_html_link"] = calendar_html_link

        response = (
            self.service_role_client.table("events")
            .update(update_data)
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

