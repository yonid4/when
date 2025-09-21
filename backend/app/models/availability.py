"""
Availability slot model for managing user availability.
"""
from datetime import datetime
from typing import List, Any
from pydantic import BaseModel, Field
import uuid

class AvailabilitySlot(BaseModel):
    """Availability slot model for Supabase."""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str = Field(...)  # UUID of the event
    start_time_utc: datetime = Field(...)
    end_time_utc: datetime = Field(...)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # # Relationship
    # user_preferences = db.relationship('UserEventPreference', backref='availability_slot_info', lazy=True)

    def __repr__(self):
        return f'<AvailabilitySlot {self.start_time_utc} - {self.end_time_utc}>'