"""Calendar sync background job."""

import logging
import os
from datetime import datetime, timedelta, timezone

from supabase import create_client

from ..services.busy_slots import BusySlotService

SYNC_WINDOW_DAYS = 90


def _get_service_role_client():
    """Get a Supabase client with service-role privileges."""
    supabase_url = os.getenv("SUPABASE_URL")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if supabase_url and service_role_key:
        return create_client(supabase_url, service_role_key)
    return None


def _get_earliest_active_event_date(user_id: str) -> datetime:
    """Find the earliest proposed start date among active (non-finalized) events the user participates in.

    Returns now() if there are no active events or on any error.
    """
    now = datetime.now(timezone.utc)
    try:
        client = _get_service_role_client()
        if not client:
            return now

        # Step 1: Get all event IDs this user participates in
        participants_result = (
            client.table("event_participants")
            .select("event_id")
            .eq("user_id", user_id)
            .execute()
        )
        if not participants_result.data:
            return now

        event_ids = [p["event_id"] for p in participants_result.data]

        # Step 2: Find earliest start date among non-finalized events
        events_result = (
            client.table("events")
            .select("earliest_datetime_utc")
            .in_("id", event_ids)
            .is_("finalized_at", "null")
            .not_.is_("earliest_datetime_utc", "null")
            .order("earliest_datetime_utc", desc=False)
            .limit(1)
            .execute()
        )

        if not events_result.data:
            return now

        earliest = events_result.data[0]["earliest_datetime_utc"]
        earliest_dt = datetime.fromisoformat(earliest.replace("Z", "+00:00"))

        # Use the earlier of the event start and now
        return min(earliest_dt, now)

    except Exception as e:
        logging.warning(f"[SYNC] Could not determine earliest active event date for user {user_id}: {e}")
        return now


def sync_user_calendar_job(user_id: str) -> None:
    """Sync Google and Microsoft calendars over a 90-day window.

    The sync window starts from the earliest active (non-finalized) event
    the user participates in, ensuring busy slot coverage for all relevant
    scheduling windows.
    """
    logging.info(f"[SYNC] Starting calendar sync for user {user_id}")

    start_date = _get_earliest_active_event_date(user_id)
    end_date = datetime.now(timezone.utc) + timedelta(days=SYNC_WINDOW_DAYS)

    logging.info(f"[SYNC] Syncing from {start_date.date()} to {end_date.date()}")

    busy_slot_service = BusySlotService()

    google_result = busy_slot_service.sync_user_google_calendar(user_id, start_date, end_date)
    microsoft_result = busy_slot_service.sync_user_microsoft_calendar(user_id, start_date, end_date)

    for label, result in [("Google", google_result), ("Microsoft", microsoft_result)]:
        if isinstance(result, dict):
            for src in result.get("sources", []):
                logging.info(
                    f"[SYNC] {label} source '{src.get('calendar_name')}': "
                    f"status={src.get('status')}, added={src.get('added')}, "
                    f"deleted={src.get('deleted')}, error={src.get('error')}"
                )

    any_ok = bool(google_result) or bool(microsoft_result)
    if any_ok:
        logging.info(f"[SYNC] Successfully synced calendar for user {user_id}")
    else:
        logging.warning(f"[SYNC] Failed to sync any calendars for user {user_id}")
