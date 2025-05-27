from app import db
from datetime import datetime

class AvailableSlot(db.Model):
    """
    Represents time slots when ALL participants of an event are available.
    These are calculated intersections of everyone's free time.
    """
    __tablename__ = 'available_slots'
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)  # Stored in UTC
    end_time = db.Column(db.DateTime, nullable=False)    # Stored in UTC
    participant_count = db.Column(db.Integer, nullable=False)  # How many participants are free during this slot
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Index for efficient querying
    __table_args__ = (
        db.Index('ix_available_slots_event_time', 'event_id', 'start_time', 'end_time'),
    )

    def __repr__(self):
        return f'<AvailableSlot event_id={self.event_id} {self.start_time}-{self.end_time}>'

class UserBusySlot(db.Model):
    """
    Stores when individual users are busy (from their Google Calendar).
    This is used to calculate AvailableSlots.
    """
    __tablename__ = 'user_busy_slots'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)  # Which event this relates to
    start_time = db.Column(db.DateTime, nullable=False)  # Stored in UTC
    end_time = db.Column(db.DateTime, nullable=False)    # Stored in UTC
    google_event_id = db.Column(db.String(256), nullable=True)  # Reference to Google Calendar event
    title = db.Column(db.String(256), nullable=True)  # For debugging/display
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Index for efficient querying
    __table_args__ = (
        db.Index('ix_user_busy_slots_user_event_time', 'user_id', 'event_id', 'start_time', 'end_time'),
    )