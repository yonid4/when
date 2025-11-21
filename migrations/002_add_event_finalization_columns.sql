-- Migration: Add Event Finalization Columns
-- Purpose: Support event finalization with Google Calendar integration
-- Created: 2025-11-14

-- Add finalization columns to events table
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'planning',
  ADD COLUMN IF NOT EXISTS finalized_start_time_utc TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS finalized_end_time_utc TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS google_calendar_html_link TEXT,
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP WITH TIME ZONE;

-- Create index for filtering by status
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Add check constraint for valid status values (only if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_status'
  ) THEN
    ALTER TABLE events 
      ADD CONSTRAINT valid_status 
      CHECK (status IN ('planning', 'finalized', 'cancelled'));
  END IF;
END $$;

-- Add check constraint for finalized time range (only if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_finalized_time_range'
  ) THEN
    ALTER TABLE events 
      ADD CONSTRAINT valid_finalized_time_range 
      CHECK (
        (status != 'finalized') OR 
        (finalized_end_time_utc > finalized_start_time_utc)
      );
  END IF;
END $$;

-- Comments for documentation
COMMENT ON COLUMN events.status IS 'Event status: planning, finalized, or cancelled';
COMMENT ON COLUMN events.finalized_start_time_utc IS 'Final scheduled start time (UTC) when event is finalized';
COMMENT ON COLUMN events.finalized_end_time_utc IS 'Final scheduled end time (UTC) when event is finalized';
COMMENT ON COLUMN events.google_calendar_event_id IS 'Google Calendar event ID for updates/cancellation';
COMMENT ON COLUMN events.google_calendar_html_link IS 'Direct link to event in Google Calendar';
COMMENT ON COLUMN events.finalized_at IS 'Timestamp when event was finalized';

