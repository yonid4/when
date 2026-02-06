"""
Route blueprints for the When API.
"""

from .auth import auth_bp
from .availability import availability_bp
from .busy_slots import busy_slots_bp
from .events import event_bp
from .preferences import preferences_bp

blueprints = [
    auth_bp,
    availability_bp,
    event_bp,
    preferences_bp,
    busy_slots_bp,
]