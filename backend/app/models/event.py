"""
Event model for managing events and their participants.
"""
from datetime import datetime, date, time
from typing import Optional, List
from pydantic import BaseModel, Field
import uuid

class Event(BaseModel):
    """Event model for Supabase."""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    uid: str = Field(..., min_length=12, max_length=12)  # 12-char UID
    name: Optional[str] = Field(default=None)
    description: Optional[str] = Field(default=None)
    coordinator_id: str = Field(...)  # UUID of the coordinator
    earliest_date: Optional[date] = Field(default=None)
    latest_date: Optional[date] = Field(default=None)
    earliest_hour: Optional[time] = Field(default=None)  # Storing as time without timezone
    latest_hour: Optional[time] = Field(default=None)    # Storing as time without timezone
    duration_minutes: Optional[int] = Field(default=None)
    status: Optional[str] = Field(default=None)  # e.g., 'planning', 'confirmed', 'cancelled'
    selected_start_time_utc: Optional[datetime] = Field(default=None)
    selected_end_time_utc: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # # Relationships
    # participants = db.relationship('EventParticipant', backref='event', lazy=True, cascade="all, delete-orphan")
    # availability_slots = db.relationship('AvailabilitySlot', backref='event', lazy=True, cascade="all, delete-orphan")
    # user_event_preferences = db.relationship('UserEventPreference', backref='event', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Event {self.name}>'