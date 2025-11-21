"""
Notification model for managing user notifications.
"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
import uuid


class Notification(BaseModel):
    """Notification model for Supabase."""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = Field(...)  # UUID of the user who receives this notification
    event_id: Optional[str] = Field(default=None)  # UUID of related event (can be null)
    notification_type: str = Field(...)  # 'event_invitation', 'event_finalized', etc.
    title: str = Field(...)
    message: str = Field(...)
    is_read: bool = Field(default=False)
    action_taken: bool = Field(default=False)
    action_type: Optional[str] = Field(default=None)  # 'accept', 'decline', null
    metadata: Dict[str, Any] = Field(default_factory=dict)  # Additional context
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = Field(default=None)
    action_at: Optional[datetime] = Field(default=None)

    class Config:
        """Pydantic configuration."""
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    def __repr__(self):
        return f'<Notification {self.notification_type} for user {self.user_id}>'

    def to_dict(self) -> dict:
        """Convert to dictionary for Supabase operations."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "event_id": self.event_id,
            "notification_type": self.notification_type,
            "title": self.title,
            "message": self.message,
            "is_read": self.is_read,
            "action_taken": self.action_taken,
            "action_type": self.action_type,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
            "read_at": self.read_at.isoformat() if self.read_at else None,
            "action_at": self.action_at.isoformat() if self.action_at else None,
        }


