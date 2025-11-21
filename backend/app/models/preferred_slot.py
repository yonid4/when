"""
Preferred slot model for managing user-selected preferred time slots for events.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator
import uuid

class PreferredSlot(BaseModel):
    """Preferred slot model for Supabase."""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = Field(...)  # UUID of the user who created this slot
    event_id: str = Field(...)  # UUID of the event this slot belongs to
    start_time_utc: datetime = Field(...)
    end_time_utc: datetime = Field(...)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @validator("end_time_utc")
    def end_time_must_be_after_start_time(cls, v, values):
        """Ensure end time is after start time."""
        if "start_time_utc" in values and v <= values["start_time_utc"]:
            raise ValueError("end_time_utc must be after start_time_utc")
        return v

    class Config:
        """Pydantic configuration."""
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    def __repr__(self):
        return f"<PreferredSlot user_id={self.user_id} event_id={self.event_id} {self.start_time_utc} - {self.end_time_utc}>"

    def overlaps_with(self, other: "PreferredSlot") -> bool:
        """Check if this preferred slot overlaps with another preferred slot."""
        return (self.start_time_utc < other.end_time_utc and 
                self.end_time_utc > other.start_time_utc)

    def duration_minutes(self) -> int:
        """Get duration of this preferred slot in minutes."""
        return int((self.end_time_utc - self.start_time_utc).total_seconds() / 60)

    def to_dict(self) -> dict:
        """Convert to dictionary for Supabase operations."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "event_id": self.event_id,
            "start_time_utc": self.start_time_utc.isoformat(),
            "end_time_utc": self.end_time_utc.isoformat(),
            "created_at": self.created_at.isoformat(),
        }


