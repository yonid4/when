"""
Proposed Time model for managing cached AI-generated time proposals.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
import uuid

class ProposedTime(BaseModel):
    """Model for cached AI-generated time proposals."""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str = Field(...)
    start_time_utc: datetime = Field(...)
    end_time_utc: datetime = Field(...)
    conflicts: int = Field(default=0)
    score: Optional[float] = Field(default=None)  # DOUBLE PRECISION in DB, nullable
    reasoning: Optional[str] = Field(default=None)
    rank: int = Field(...)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> dict:
        """Convert to dictionary for Supabase operations."""
        return {
            "id": self.id,
            "event_id": self.event_id,
            "start_time_utc": self.start_time_utc.isoformat(),
            "end_time_utc": self.end_time_utc.isoformat(),
            "conflicts": self.conflicts,
            "score": self.score,
            "reasoning": self.reasoning,
            "rank": self.rank,
            "created_at": self.created_at.isoformat(),
        }
