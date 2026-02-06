"""Background jobs initialization."""

import atexit
import logging

from apscheduler.schedulers.background import BackgroundScheduler

from .calendar_sync import sync_user_calendar_job

scheduler = BackgroundScheduler()


def init_background_jobs(app):
    """Initialize APScheduler for background jobs."""
    if scheduler.running:
        return

    scheduler.start()
    app.scheduler = scheduler
    logging.info("[SCHEDULER] Background job scheduler started")
    atexit.register(scheduler.shutdown)


__all__ = ["init_background_jobs", "sync_user_calendar_job"]
