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

    def to_dict(self) -> dict:
        """Convert to dictionary for Supabase operations."""
        return {
            "id": self.id,
            "uid": self.uid,
            "name": self.name,
            "description": self.description,
            "coordinator_id": self.coordinator_id,
            "earliest_date": self.earliest_date.isoformat() if self.earliest_date else None,
            "latest_date": self.latest_date.isoformat() if self.latest_date else None,
            "earliest_hour": self.earliest_hour.isoformat() if self.earliest_hour else None,
            "latest_hour": self.latest_hour.isoformat() if self.latest_hour else None,
            "duration_minutes": self.duration_minutes,
            "status": self.status,
            "selected_start_time_utc": self.selected_start_time_utc.isoformat() if self.selected_start_time_utc else None,
            "selected_end_time_utc": self.selected_end_time_utc.isoformat() if self.selected_end_time_utc else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }