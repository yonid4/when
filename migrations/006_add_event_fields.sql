-- Migration: Add Event Type, Location, and Video Call Link
-- Purpose: Extend events table with event categorization and location details
-- Created: 2025-12-21

-- Note: The 'status' column already exists from migration 002 with values
-- ('planning', 'finalized', 'cancelled'). If you need a separate RSVP status,
-- consider using a different column name like 'rsvp_status' or adding it to
-- the event_participants table instead.

-- Add event_type ENUM column
DO $$
BEGIN
  -- Create ENUM type if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type_enum') THEN
    CREATE TYPE event_type_enum AS ENUM ('meeting', 'social', 'birthday', 'other');
  END IF;
END $$;

-- Add new columns to events table
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS event_type event_type_enum,
  ADD COLUMN IF NOT EXISTS video_call_link TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT;

-- Create index for filtering by event_type
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);

-- Comments for documentation
COMMENT ON COLUMN events.event_type IS 'Type of event: meeting, social, birthday, or other';
COMMENT ON COLUMN events.video_call_link IS 'URL for virtual meetings (e.g., Zoom, Google Meet, Teams)';
COMMENT ON COLUMN events.location IS 'Physical location or address for in-person events';

-- Note about status column:
-- The existing 'status' column tracks event workflow state (planning/finalized/cancelled).
-- If you need participant RSVP status ('going', 'maybe', 'not_going'), consider:
-- 1. Adding an 'rsvp_status' column to the 'event_participants' table, OR
-- 2. Creating a separate 'participant_rsvp_status_enum' type with those values
