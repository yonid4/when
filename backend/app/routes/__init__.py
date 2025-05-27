from flask import Blueprint

from .auth import auth_bp
from .availability import availability_bp
from .calendar import calendar_bp
from .events import events_bp
from .preferences import preferences_bp

blueprints = [auth_bp, availability_bp, calendar_bp, events_bp, preferences_bp]