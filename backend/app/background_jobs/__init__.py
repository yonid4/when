"""
Background jobs initialization.
"""

from flask import current_app
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
import logging

scheduler = BackgroundScheduler()

def init_background_jobs(app):
    """Initialize APScheduler for background jobs."""
    if not scheduler.running:
        scheduler.start()
        app.scheduler = scheduler
        logging.info("[SCHEDULER] Background job scheduler started")
    
    # Shutdown scheduler when app context ends
    import atexit
    atexit.register(lambda: scheduler.shutdown())

from .calendar_sync import sync_user_calendar_job

__all__ = ['init_background_jobs', 'sync_user_calendar_job']
