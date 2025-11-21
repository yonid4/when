"""
Event finalization service for creating Google Calendar events.

This module handles:
- Validating finalization requests
- Creating Google Calendar events with retry logic
- Sending invitations to participants
- Updating event status in database
"""

import requests
import time
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from ..services.google_calendar import get_stored_credentials, get_calendar_service
from ..utils.supabase_client import get_supabase
from supabase import create_client
import os


class EventFinalizationService:
    """Service for finalizing events with Google Calendar integration."""
    
    def __init__(self, access_token: Optional[str] = None):
        self.supabase = get_supabase(access_token)
        
        # Service role client for operations that bypass RLS (cross-user finalization operations)
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if supabase_url and supabase_service_key:
            self.service_role_client = create_client(supabase_url, supabase_service_key)
        else:
            # Fallback to regular client if service role key not available
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
        """
        Finalize an event and create Google Calendar event.
        
        Args:
            event_id: Event ID (UUID)
            coordinator_id: Coordinator user ID (UUID)
            start_time_utc: Start time in ISO format
            end_time_utc: End time in ISO format
            participant_ids: List of participant user IDs
            include_google_meet: Whether to include Google Meet link
            
        Returns:
            Dict with success status, Google event details
            
        Raises:
            Exception: If finalization fails
        """
        # 1. Get event details
        event = self._get_event(event_id)
        if not event:
            raise Exception("Event not found")
        
        # 2. Verify coordinator
        if event["coordinator_id"] != coordinator_id:
            raise Exception("Only coordinator can finalize event")
        
        # 3. Verify not already finalized
        if event.get("status") == "finalized":
            raise Exception("Event already finalized")
        
        # 4. Get coordinator credentials
        credentials = get_stored_credentials(coordinator_id)
        if not credentials:
            raise Exception("Google Calendar not connected. Please connect your calendar first.")
        
        # 5. Get coordinator profile for timezone
        coordinator = self._get_user_profile(coordinator_id)
        if not coordinator:
            raise Exception("Coordinator profile not found")
        
        # 6. Get participant emails
        participants = self._get_participants(participant_ids)
        if not participants:
            raise Exception("No valid participants found")
        
        attendee_emails = [p["email"] for p in participants if p.get("email")]
        if not attendee_emails:
            raise Exception("No participant emails found")
        
        # 7. Prepare Google Calendar event
        calendar_event = self._prepare_calendar_event(
            event=event,
            start_time_utc=start_time_utc,
            end_time_utc=end_time_utc,
            attendee_emails=attendee_emails,
            coordinator_timezone=coordinator.get("timezone", "UTC"),
            include_google_meet=include_google_meet,
            event_id=event_id
        )
        
        # 8. Create Google Calendar event with retry
        try:
            created_event = self._create_google_calendar_event_with_retry(
                credentials=credentials,
                coordinator_id=coordinator_id,
                event_data=calendar_event,
                include_meet=include_google_meet
            )
        except Exception as e:
            raise Exception(f"Failed to create Google Calendar event: {str(e)}")
        
        # 9. Update event in database
        try:
            self._update_event_finalization(
                event_id=event_id,
                start_time_utc=start_time_utc,
                end_time_utc=end_time_utc,
                google_event_id=created_event["id"],
                google_html_link=created_event["htmlLink"]
            )
        except Exception as e:
            # Event was created in Google but DB update failed
            # This is a critical error that needs manual resolution
            print(f"CRITICAL: Google event created but DB update failed: {e}")
            raise Exception("Event created in Google Calendar but failed to update database. Please contact support.")
        
        # 10. Create notifications for participants
        try:
            self._create_finalization_notifications(
                event=event,
                participants=participants,
                coordinator_id=coordinator_id,
                start_time_utc=start_time_utc,
                google_html_link=created_event["htmlLink"]
            )
        except Exception as e:
            # Notifications failed but event was finalized - log but don't fail
            print(f"Warning: Failed to create finalization notifications: {e}")
        
        # 11. Return success
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
                .select("id, email, name")
                .in_("id", participant_ids)
                .execute()
            )
            return response.data if response.data else []
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
        event_description = event.get("description") or "Event made by When."
        
        calendar_event = {
            "summary": event["name"],
            "description": event_description,
            "start": {
                "dateTime": start_time_utc,
                "timeZone": coordinator_timezone
            },
            "end": {
                "dateTime": end_time_utc,
                "timeZone": coordinator_timezone
            },
            "attendees": [{"email": email} for email in attendee_emails],
            "reminders": {
                "useDefault": True
            },
            "guestsCanModify": False,
            "guestsCanInviteOthers": False,
            "guestsCanSeeOtherGuests": True
        }
        
        # Add Google Meet if requested
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
        """
        Create Google Calendar event with retry logic.
        
        Args:
            credentials: Google OAuth credentials
            coordinator_id: User ID for storing refreshed credentials
            event_data: Calendar event data
            include_meet: Whether Google Meet is included
            max_retries: Maximum retry attempts
            
        Returns:
            Created event data from Google Calendar API
            
        Raises:
            Exception: If creation fails after all retries
        """
        # Get calendar service (handles token refresh)
        service = get_calendar_service(credentials, coordinator_id)
        
        # Prepare request parameters
        # CRITICAL: sendUpdates must be a query parameter, NOT in body
        params = {
            "sendUpdates": "all"  # This sends email invitations automatically
        }
        
        # Add conferenceDataVersion if Google Meet requested
        if include_meet:
            params["conferenceDataVersion"] = 1
        
        # Retry up to max_retries times with exponential backoff
        for attempt in range(max_retries):
            try:
                # Create event using Google Calendar API
                created_event = (
                    service.events()
                    .insert(calendarId="primary", body=event_data, **params)
                    .execute()
                )
                
                return created_event
            
            except Exception as e:
                error_str = str(e).lower()
                
                # Authentication error - don't retry
                if "401" in error_str or "unauthorized" in error_str:
                    raise Exception("Google authentication failed. Please reconnect your calendar.")
                
                # Rate limited - wait and retry
                if "429" in error_str or "rate limit" in error_str:
                    if attempt < max_retries - 1:
                        wait_time = 2 ** attempt  # 1s, 2s, 4s
                        time.sleep(wait_time)
                        continue
                    else:
                        raise Exception("Google Calendar API rate limit exceeded. Please try again in a moment.")
                
                # Server error - retry
                if "500" in error_str or "503" in error_str:
                    if attempt < max_retries - 1:
                        time.sleep(2 ** attempt)
                        continue
                    else:
                        raise Exception(f"Google Calendar API error: {str(e)}")
                
                # Other error - don't retry
                if attempt == max_retries - 1:
                    raise Exception(f"Failed to create calendar event: {str(e)}")
                
                # Retry on unknown errors
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
        try:
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
        
        except Exception as e:
            print(f"Error updating event finalization: {str(e)}")
            raise e
    
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
        from datetime import datetime
        
        notifications_service = NotificationsService()
        
        # Format the finalized time nicely
        try:
            dt = datetime.fromisoformat(start_time_utc.replace("Z", "+00:00"))
            formatted_time = dt.strftime("%A, %B %d, %Y at %I:%M %p UTC")
        except:
            formatted_time = start_time_utc
        
        # Create notification for each participant (except coordinator)
        for participant in participants:
            if participant["id"] != coordinator_id:
                notifications_service.create_event_finalized_notification(
                    user_id=participant["id"],
                    event_id=event["id"],
                    event_title=event["name"],
                    finalized_time=formatted_time,
                    google_calendar_link=google_html_link
                )

