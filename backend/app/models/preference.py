from app import db
from datetime import datetime

class EventUserPreference(db.Model):
    """
    Stores user preferences for specific time slots within an event.
    Users can mark available slots as preferred or not preferred.
    """
    __tablename__ = 'event_user_preferences'
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)  # Stored in UTC
    end_time = db.Column(db.DateTime, nullable=False)    # Stored in UTC
    preference_level = db.Column(db.Enum('preferred', 'neutral', 'not_preferred', name='preference_level'), default='preferred')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref='event_preferences')

    # Unique constraint to prevent duplicate preferences for same time slot
    __table_args__ = (
        db.UniqueConstraint('event_id', 'user_id', 'start_time', 'end_time', name='unique_user_event_preference'),
        db.Index('ix_event_user_preferences_event_time', 'event_id', 'start_time', 'end_time'),
    )

    def __repr__(self):
        return f'<EventUserPreference event_id={self.event_id} user_id={self.user_id} {self.preference_level}>'

class UserGeneralPreference(db.Model):
    """
    Stores general user preferences (timezone, notification settings, etc.)
    """
    __tablename__ = 'user_general_preferences'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    preference_key = db.Column(db.String(64), nullable=False)  # e.g., 'default_timezone', 'email_notifications'
    preference_value = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref='general_preferences')

    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('user_id', 'preference_key', name='unique_user_preference'),
    )