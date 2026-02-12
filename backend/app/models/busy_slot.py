"""Busy slot model for managing user busy times from calendar providers."""
import re
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, validator


class BusySlot(BaseModel):
    """Represents a calendar event as a busy time slot in Supabase.

    Note: ``provider_event_id`` is used for both
    Google and Microsoft events due to the existing database schema.
    """

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = Field(...)
    start_time_utc: datetime = Field(...)
    end_time_utc: datetime = Field(...)
    provider_event_id: Optional[str] = Field(default=None)
    calendar_source_id: Optional[str] = Field(default=None) # The calendar source ID from the calendar_sources table
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_synced_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    @validator('end_time_utc')
    def end_time_must_be_after_start_time(cls, v, values):
        if 'start_time_utc' in values and v <= values['start_time_utc']:
            raise ValueError('end_time_utc must be after start_time_utc')
        return v

    def __repr__(self) -> str:
        return f'<BusySlot user_id={self.user_id} {self.start_time_utc} - {self.end_time_utc}>'

    def overlaps_with(self, other: 'BusySlot') -> bool:
        return (self.start_time_utc < other.end_time_utc and
                self.end_time_utc > other.start_time_utc)

    def duration_minutes(self) -> int:
        return int((self.end_time_utc - self.start_time_utc).total_seconds() / 60)

    def to_dict(self) -> dict:
        """Convert to dictionary for Supabase operations."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "start_time_utc": self.start_time_utc.isoformat(),
            "end_time_utc": self.end_time_utc.isoformat(),
            "provider_event_id": self.provider_event_id,
            "calendar_source_id": self.calendar_source_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "last_synced_at": self.last_synced_at.isoformat(),
        }
    
    def get_start_time_utc(self) -> datetime:
        """Return start_time_utc as datetime (handles both datetime and ISO string)."""
        if isinstance(self.start_time_utc, datetime):
            return self.start_time_utc
        return datetime.fromisoformat(str(self.start_time_utc).replace("Z", "+00:00"))

    def get_end_time_utc(self) -> datetime:
        """Return end_time_utc as datetime (handles both datetime and ISO string)."""
        if isinstance(self.end_time_utc, datetime):
            return self.end_time_utc
        return datetime.fromisoformat(str(self.end_time_utc).replace("Z", "+00:00"))

    @classmethod
    def from_google_event(
        cls,
        user_id: str,
        google_event: dict,
    ) -> 'BusySlot':
        """Create a BusySlot from a Google Calendar event."""
        start = google_event.get('start', {})
        end = google_event.get('end', {})

        if 'dateTime' not in start or 'dateTime' not in end:
            raise ValueError("All-day events are not supported for busy slots")

        start_dt = datetime.fromisoformat(start['dateTime'].replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(end['dateTime'].replace('Z', '+00:00'))

        return cls(
            user_id=user_id,
            start_time_utc=start_dt,
            end_time_utc=end_dt,
            provider_event_id=google_event.get('id'),
            calendar_source_id=google_event.get('calendar_source_id'),
        )

    @classmethod
    def from_microsoft_event(
        cls,
        user_id: str,
        event: dict,
    ) -> 'BusySlot':
        """Create a BusySlot from a Microsoft Graph calendar event."""
        start_str = event.get('start', {}).get('dateTime')
        end_str = event.get('end', {}).get('dateTime')

        if not start_str or not end_str or 'T' not in start_str:
            raise ValueError("All-day events are not supported for busy slots")

        # Microsoft Graph returns 7 decimal places (e.g. '.0000000');
        # Python fromisoformat supports at most 6, so truncate.
        def _parse_ms_dt(s: str) -> datetime:
            s = re.sub(r'(\.\d{6})\d+', r'\1', s.replace('Z', '+00:00'))
            return datetime.fromisoformat(s)

        start_dt = _parse_ms_dt(start_str)
        end_dt = _parse_ms_dt(end_str)

        return cls(
            user_id=user_id,
            start_time_utc=start_dt,
            end_time_utc=end_dt,
            provider_event_id=event.get('id'),
            calendar_source_id=event.get('calendar_source_id'),
        )
