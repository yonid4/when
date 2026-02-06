"""Event participant model for managing event participants."""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class EventParticipant(BaseModel):
    """Event participant model for Supabase."""

    event_id: str = Field(...)
    user_id: str = Field(...)
    status: Optional[str] = Field(default=None)
    rsvp_status: Optional[Literal['going', 'maybe', 'not_going']] = Field(default=None)
    can_invite: bool = Field(default=False)
    joined_at: datetime = Field(default_factory=datetime.utcnow)

    def __repr__(self) -> str:
        return f'<EventParticipant event_id={self.event_id} user_id={self.user_id}>'

    def to_dict(self) -> dict:
        """Convert to dictionary for Supabase operations."""
        return {
            "event_id": self.event_id,
            "user_id": self.user_id,
            "status": self.status,
            "rsvp_status": self.rsvp_status,
            "can_invite": self.can_invite,
            "joined_at": self.joined_at.isoformat(),
        }
