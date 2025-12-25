"""
Event participant model for managing event participants.
"""
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field

class EventParticipant(BaseModel):
    """Event participant model for Supabase."""

    event_id: str = Field(...)  # UUID of the event
    user_id: str = Field(...)   # UUID of the user
    status: Optional[str] = Field(default=None)  # Invitation status: 'pending', 'accepted', 'declined'
    rsvp_status: Optional[Literal['going', 'maybe', 'not_going']] = Field(
        default=None,
        description="Participant RSVP status for attendance intent"
    )
    can_invite: bool = Field(
        default=False,
        description="Whether this participant can invite other users to the event"
    )
    joined_at: datetime = Field(default_factory=datetime.utcnow)

    def __repr__(self):
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