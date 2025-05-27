"""
User model for storing user information.
"""

from app import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    name = db.Column(db.String(128), nullable=False)
    google_id = db.Column(db.String(128), nullable=True, unique=True)
    timezone = db.Column(db.String(128), default='UTC')
    avatar_url = db.Column(db.String(512), nullable=True)  # Google profile picture
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    google_tokens = db.relationship('GoogleToken', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    coordinated_events = db.relationship('Event', backref='coordinator', lazy='dynamic')
    participated_events = db.relationship('EventParticipant', backref='participant', lazy='dynamic')
    calendar_syncs = db.relationship('CalendarSync', backref='user', lazy='dynamic', cascade='all, delete-orphan')

class GoogleToken(db.Model):
    __tablename__ = 'google_tokens'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    access_token = db.Column(db.Text, nullable=False)  # Encrypted
    refresh_token = db.Column(db.Text, nullable=True)  # Encrypted
    token_expires_at = db.Column(db.DateTime, nullable=True)
    scope = db.Column(db.String(512), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CalendarSync(db.Model):
    __tablename__ = 'calendar_syncs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    calendar_id = db.Column(db.String(256), nullable=False)  # Google Calendar ID
    last_sync_at = db.Column(db.DateTime, nullable=True)
    sync_token = db.Column(db.String(512), nullable=True)  # For incremental sync
    is_primary = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)