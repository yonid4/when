"""
User event preference model for managing user preferences for events.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
import uuid

class UserEventPreference(BaseModel):
    """User event preference model for Supabase."""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str = Field(...)  # UUID of the event
    user_id: str = Field(...)   # UUID of the user
    # This can link to a specific pre-calculated slot or allow free-form preference
    availability_slot_id: Optional[str] = Field(default=None)  # UUID of the availability slot
    preferred_start_time_utc: Optional[datetime] = Field(default=None)
    preferred_end_time_utc: Optional[datetime] = Field(default=None)
    preference_strength: Optional[int] = Field(default=None)  # e.g., 1 (low), 2 (medium), 3 (high)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def __repr__(self):
        return f'<UserEventPreference user_id={self.user_id} event_id={self.event_id}>'
    
    def to_dict(self) -> dict:
        """Convert to dictionary for Supabase operations."""
        return {
            "id": self.id,
            "event_id": self.event_id,
            "user_id": self.user_id,
            "availability_slot_id": self.availability_slot_id,
            "preferred_start_time_utc": self.preferred_start_time_utc.isoformat() if self.preferred_start_time_utc else None,
            "preferred_end_time_utc": self.preferred_end_time_utc.isoformat() if self.preferred_end_time_utc else None,
            "preference_strength": self.preference_strength,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }