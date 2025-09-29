"""
Event participant model for managing event participants.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class EventParticipant(BaseModel):
    """Event participant model for Supabase."""
    
    event_id: str = Field(...)  # UUID of the event
    user_id: str = Field(...)   # UUID of the user
    status: Optional[str] = Field(default=None)  # e.g., 'invited', 'accepted', 'declined'
    joined_at: datetime = Field(default_factory=datetime.utcnow)

    def __repr__(self):
        return f'<EventParticipant event_id={self.event_id} user_id={self.user_id}>'