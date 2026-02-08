"""User profile model for storing user information."""
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class Profile(BaseModel):
    """Profile model for Supabase."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: Optional[str] = Field(default=None)
    avatar_url: Optional[str] = Field(default=None)
    google_auth_token: Optional[Dict[str, Any]] = Field(default=None)
    microsoft_auth_token: Optional[Dict[str, Any]] = Field(default=None)
    google_calendar_id: Optional[str] = Field(default=None)
    timezone: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    email_address: str = Field(default=None)

    def __repr__(self) -> str:
        return f'<Profile {self.full_name}>'

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for Supabase operations."""
        return {
            "id": self.id,
            "full_name": self.full_name,
            "avatar_url": self.avatar_url,
            "google_auth_token": self.google_auth_token,
            "microsoft_auth_token": self.microsoft_auth_token,
            "google_calendar_id": self.google_calendar_id,
            "timezone": self.timezone,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "email_address": self.email_address,
        }
