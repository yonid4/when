"""
Models package initialization.
"""
from .profile import Profile
from .event import Event
from .event_participant import EventParticipant
from .availability import AvailabilitySlot
from .preference import UserEventPreference

# Optional: You can define __all__ to control what 'from app.models import *' imports
__all__ = [
    'Profile',
    'Event',
    'EventParticipant',
    'AvailabilitySlot',
    'UserEventPreference'
]