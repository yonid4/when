"""
Event model for storing event information.
"""

from app import db
from datetime import datetime, date, time
import uuid

class Event(db.Model):
    __tablename__ = 'events'
    id = db.Column(db.Integer, primary_key=True)
    uid = db.Column(db.String(36), nullable=False, unique=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(128), nullable=False)  
    description = db.Column(db.Text, nullable=True)
    coordinator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Date/Time constraints
    start_date = db.Column(db.Date, nullable=False)  # Should be required
    end_date = db.Column(db.Date, nullable=False)    # Should be required
    earliest_daily_start_time = db.Column(db.Time, nullable=False)  # Should be required
    latest_daily_end_time = db.Column(db.Time, nullable=False)      # Should be required
    duration_minutes = db.Column(db.Integer, nullable=False)  # Renamed for clarity
    
    # Optional constraints
    max_participants = db.Column(db.Integer, nullable=True)  # Renamed for clarity
    
    # Status and settings
    status = db.Column(db.Enum('draft', 'active', 'completed', 'cancelled', name='event_status'), default='draft')
    auto_create_meeting = db.Column(db.Boolean, default=False)  # Renamed from autocreate
    is_finalized = db.Column(db.Boolean, default=False)        # Renamed from finalized
    finalized_start_time = db.Column(db.DateTime, nullable=True)  # When event is finalized
    finalized_end_time = db.Column(db.DateTime, nullable=True)    # When event is finalized
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    availability_last_calculated = db.Column(db.DateTime, nullable=True)  # Track when availability was last calculated

    # Relationships
    participants = db.relationship('EventParticipant', backref='event', lazy='dynamic', cascade='all, delete-orphan')
    available_slots = db.relationship('AvailableSlot', backref='event', lazy='dynamic', cascade='all, delete-orphan')
    user_preferences = db.relationship('EventUserPreference', backref='event', lazy='dynamic', cascade='all, delete-orphan')
    invitation_requests = db.relationship('UserInviteRequest', backref='event', lazy='dynamic', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Event {self.title}>'

class EventParticipant(db.Model):
    __tablename__ = 'event_participants'
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)  # Renamed from created_at
    
    # Unique constraint to prevent duplicate participants
    __table_args__ = (db.UniqueConstraint('event_id', 'user_id', name='unique_event_participant'),)

    def __repr__(self):
        return f'<EventParticipant event_id={self.event_id} user_id={self.user_id}>'

class UserInviteRequest(db.Model):
    __tablename__ = 'user_invite_requests'
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)
    inviting_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  # Who sent the invite
    invited_email = db.Column(db.String(320), nullable=False)
    invited_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Set when user registers
    invitation_token = db.Column(db.String(128), nullable=False, unique=True)  # For invite links
    status = db.Column(db.Enum('pending', 'accepted', 'declined', 'expired', name='invite_status'), default='pending')
    expires_at = db.Column(db.DateTime, nullable=False)  # Invitations should expire
    responded_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    inviting_user = db.relationship('User', foreign_keys=[inviting_user_id], backref='sent_invites')
    invited_user = db.relationship('User', foreign_keys=[invited_user_id], backref='received_invites')