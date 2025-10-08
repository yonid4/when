# """
# Busy slot model for managing user busy times from Google Calendar.
# """
# from datetime import datetime
# from typing import Optional
# from pydantic import BaseModel, Field, validator
# import uuid

# class BusySlot(BaseModel):
#     """Busy slot model for Supabase representing Google Calendar events."""
    
#     id: str = Field(default_factory=lambda: str(uuid.uuid4()))
#     user_id: str = Field(...)  # UUID of the user who owns this busy slot
#     start_time_utc: datetime = Field(...)
#     end_time_utc: datetime = Field(...)
#     google_event_id: Optional[str] = Field(None, description="Google Calendar event ID")
#     google_calendar_id: Optional[str] = Field(None, description="Google Calendar ID")
#     event_title: Optional[str] = Field(None, description="Title from Google Calendar event")
#     event_description: Optional[str] = Field(None, description="Description from Google Calendar")
#     created_at: datetime = Field(default_factory=datetime.utcnow)
#     updated_at: datetime = Field(default_factory=datetime.utcnow)
#     last_synced_at: datetime = Field(default_factory=datetime.utcnow)

#     @validator('end_time_utc')
#     def end_time_must_be_after_start_time(cls, v, values):
#         """Ensure end time is after start time."""
#         if 'start_time_utc' in values and v <= values['start_time_utc']:
#             raise ValueError('end_time_utc must be after start_time_utc')
#         return v

#     @validator('event_title')
#     def validate_event_title(cls, v):
#         """Ensure event title is not too long."""
#         if v is not None and len(v) > 500:
#             return v[:500]  # Truncate if too long
#         return v

#     class Config:
#         """Pydantic configuration."""
#         json_encoders = {
#             datetime: lambda v: v.isoformat()
#         }

#     def __repr__(self):
#         return f'<BusySlot user_id={self.user_id} {self.start_time_utc} - {self.end_time_utc}>'

#     def overlaps_with(self, other: 'BusySlot') -> bool:
#         """Check if this busy slot overlaps with another busy slot."""
#         return (self.start_time_utc < other.end_time_utc and 
#                 self.end_time_utc > other.start_time_utc)

#     def duration_minutes(self) -> int:
#         """Get duration of this busy slot in minutes."""
#         return int((self.end_time_utc - self.start_time_utc).total_seconds() / 60)

#     def to_dict(self) -> dict:
#         """Convert to dictionary for Supabase operations."""
#         return {
#             "id": self.id,
#             "user_id": self.user_id,
#             "start_time_utc": self.start_time_utc.isoformat(),
#             "end_time_utc": self.end_time_utc.isoformat(),
#             "google_event_id": self.google_event_id,
#             "google_calendar_id": self.google_calendar_id,
#             "event_title": self.event_title,
#             "event_description": self.event_description,
#             "created_at": self.created_at.isoformat(),
#             "updated_at": self.updated_at.isoformat(),
#             "last_synced_at": self.last_synced_at.isoformat()
#         }

#     @classmethod
#     def from_google_event(cls, user_id: str, google_event: dict, google_calendar_id: str = "primary") -> 'BusySlot':
#         """Create a BusySlot from a Google Calendar event."""
#         start = google_event.get('start', {})
#         end = google_event.get('end', {})
        
#         # Parse datetime from Google Calendar format
#         if 'dateTime' in start and 'dateTime' in end:
#             start_dt = datetime.fromisoformat(start['dateTime'].replace('Z', '+00:00'))
#             end_dt = datetime.fromisoformat(end['dateTime'].replace('Z', '+00:00'))
#         else:
#             # Skip all-day events for now
#             raise ValueError("All-day events are not supported for busy slots")
        
#         return cls(
#             user_id=user_id,
#             start_time_utc=start_dt,
#             end_time_utc=end_dt,
#             google_event_id=google_event.get('id'),
#             google_calendar_id=google_calendar_id,
#             event_title=google_event.get('summary', 'Untitled Event'),
#             event_description=google_event.get('description')
#         )