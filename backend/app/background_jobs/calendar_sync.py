"""
Calendar sync background job.
"""

from datetime import datetime, timedelta, timezone
from ..services.busy_slots import BusySlotService
import logging

def sync_user_calendar_job(user_id: str):
    """
    Background job to sync Google Calendar events for a user.
    Syncs a fixed 90-day window from today.
    """
    try:
        logging.info(f"[SYNC] Starting calendar sync for user {user_id}")
        
        busy_slot_service = BusySlotService()
        
        # Fixed 90-day sync window
        start_date = datetime.now(timezone.utc)
        end_date = start_date + timedelta(days=90)
        
        logging.info(f"[SYNC] Syncing from {start_date.date()} to {end_date.date()}")
        
        success = busy_slot_service.sync_user_google_calendar(
            user_id,
            start_date,
            end_date
        )
        
        if success:
            logging.info(f"[SYNC] Successfully synced calendar for user {user_id}")
        else:
            logging.warning(f"[SYNC] Failed to sync calendar for user {user_id}")
            
    except Exception as e:
        logging.error(f"[SYNC] Error syncing calendar for user {user_id}: {e}")

