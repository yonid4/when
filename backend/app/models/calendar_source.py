"""Calendar source model for individual calendars within a calendar account."""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CalendarSource(BaseModel):
    """Represents a single calendar (e.g. primary, work) within a calendar account."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    account_id: str = Field(...)
    calendar_id: str = Field(..., max_length=255)
    calendar_name: str = Field(..., max_length=255)
    is_enabled: bool = Field(default=True)
    is_write_calendar: bool = Field(default=False)
    color: Optional[str] = Field(default=None, max_length=20)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<CalendarSource {self.calendar_name} ({self.calendar_id})>"

    def to_dict(self) -> dict:
        """Convert to dictionary for Supabase operations."""
        return {
            "id": self.id,
            "account_id": self.account_id,
            "calendar_id": self.calendar_id,
            "calendar_name": self.calendar_name,
            "is_enabled": self.is_enabled,
            "is_write_calendar": self.is_write_calendar,
            "color": self.color,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
