"""
Event model for managing events and their participants.
"""
from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, HttpUrl, validator
import uuid

class Event(BaseModel):
    """Event model for Supabase."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    uid: str = Field(..., min_length=12, max_length=12)  # 12-char UID
    name: Optional[str] = Field(default=None)
    description: Optional[str] = Field(default=None)
    coordinator_id: str = Field(...)  # UUID of the coordinator

    # UTC timestamp fields for event time range
    earliest_datetime_utc: datetime = Field(..., description="Earliest event time in UTC")
    latest_datetime_utc: datetime = Field(..., description="Latest event time in UTC")
    coordinator_timezone: str = Field(default='UTC', description="Coordinator's timezone (IANA format)")

    duration_minutes: Optional[int] = Field(default=None)
    status: Optional[str] = Field(default="planning")  # 'planning', 'finalized', 'cancelled'
    selected_start_time_utc: Optional[datetime] = Field(default=None)
    selected_end_time_utc: Optional[datetime] = Field(default=None)

    # Event type and location fields (added in migration 006)
    event_type: Optional[Literal['meeting', 'social', 'birthday', 'other']] = Field(default=None, description="Type of event")
    video_call_link: Optional[str] = Field(default=None, description="URL for virtual meetings")
    location: Optional[str] = Field(default=None, description="Physical location or address")

    # Finalization fields (added for Task 3)
    finalized_start_time_utc: Optional[datetime] = Field(default=None)
    finalized_end_time_utc: Optional[datetime] = Field(default=None)
    google_calendar_event_id: Optional[str] = Field(default=None)
    google_calendar_html_link: Optional[str] = Field(default=None)
    finalized_at: Optional[datetime] = Field(default=None)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @validator('video_call_link')
    def validate_video_call_link(cls, v):
        """Validate that video_call_link is a valid URL if provided."""
        if v is not None and v.strip():
            # Basic URL validation
            if not (v.startswith('http://') or v.startswith('https://')):
                raise ValueError('video_call_link must be a valid URL starting with http:// or https://')
        return v

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
            # UTC timestamp fields
            "earliest_datetime_utc": self.earliest_datetime_utc.isoformat(),
            "latest_datetime_utc": self.latest_datetime_utc.isoformat(),
            "coordinator_timezone": self.coordinator_timezone,
            "duration_minutes": self.duration_minutes,
            "status": self.status,
            "selected_start_time_utc": self.selected_start_time_utc.isoformat() if self.selected_start_time_utc else None,
            "selected_end_time_utc": self.selected_end_time_utc.isoformat() if self.selected_end_time_utc else None,
            "event_type": self.event_type,
            "video_call_link": self.video_call_link,
            "location": self.location,
            "finalized_start_time_utc": self.finalized_start_time_utc.isoformat() if self.finalized_start_time_utc else None,
            "finalized_end_time_utc": self.finalized_end_time_utc.isoformat() if self.finalized_end_time_utc else None,
            "google_calendar_event_id": self.google_calendar_event_id,
            "google_calendar_html_link": self.google_calendar_html_link,
            "finalized_at": self.finalized_at.isoformat() if self.finalized_at else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }