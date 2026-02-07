"""Calendar sync background job."""

import logging
from datetime import datetime, timedelta, timezone

from ..services.busy_slots import BusySlotService

SYNC_WINDOW_DAYS = 90


def sync_user_calendar_job(user_id: str) -> None:
    """Sync Google and Microsoft calendars over a 90-day window from today."""
    logging.info(f"[SYNC] Starting calendar sync for user {user_id}")

    start_date = datetime.now(timezone.utc)
    end_date = start_date + timedelta(days=SYNC_WINDOW_DAYS)

    logging.info(f"[SYNC] Syncing from {start_date.date()} to {end_date.date()}")

    busy_slot_service = BusySlotService()

    google_ok = busy_slot_service.sync_user_google_calendar(user_id, start_date, end_date)
    microsoft_ok = busy_slot_service.sync_user_microsoft_calendar(user_id, start_date, end_date)

    if google_ok or microsoft_ok:
        logging.info(f"[SYNC] Successfully synced calendar for user {user_id} (google={google_ok}, microsoft={microsoft_ok})")
    else:
        logging.warning(f"[SYNC] Failed to sync any calendars for user {user_id}")

