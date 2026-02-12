"""Calendar account model for linked calendar provider accounts (Google, Microsoft, etc.)."""
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class CalendarAccount(BaseModel):
    """Represents a user's connected calendar provider account (e.g. one Google account)."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = Field(...)
    provider: str = Field(default="google", max_length=50)
    provider_email: str = Field(..., max_length=255)
    provider_account_id: str = Field(..., max_length=255)
    credentials: Dict[str, Any] = Field(...)
    connected_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    last_synced_at: Optional[datetime] = Field(default=None)

    def __repr__(self) -> str:
        return f"<CalendarAccount {self.provider}:{self.provider_email}>"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for Supabase operations."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "provider": self.provider,
            "provider_email": self.provider_email,
            "provider_account_id": self.provider_account_id,
            "credentials": self.credentials,
            "connected_at": self.connected_at.isoformat() if self.connected_at else None,
            "last_synced_at": self.last_synced_at.isoformat() if self.last_synced_at else None,
        }
