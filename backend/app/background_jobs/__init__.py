"""
Background jobs initialization.
"""

# from flask import current_app
# from apscheduler.schedulers.background import BackgroundScheduler
# from apscheduler.triggers.interval import IntervalTrigger
# from .calendar_sync import sync_calendars

# def init_background_jobs(app):
#     """Initialize background jobs."""
#     scheduler = BackgroundScheduler()
    
#     # Add calendar sync job
#     scheduler.add_job(
#         func=sync_calendars,
#         trigger=IntervalTrigger(minutes=15),
#         id="calendar_sync",
#         name="Sync user calendars with Google Calendar",
#         replace_existing=True
#     )
    
#     # Start the scheduler
#     scheduler.start()
    
#     # Store scheduler in app context
#     app.scheduler = scheduler
