-- Migration: Add RSVP Status to Event Participants
-- Purpose: Add separate RSVP status tracking for event participants
-- Created: 2025-12-21

-- Note: The existing 'status' column tracks invitation status ('pending', 'accepted', 'declined').
-- This new 'rsvp_status' column tracks participant attendance intent.

-- Create ENUM type for RSVP status
DO $$
BEGIN
  -- Create ENUM type if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'participant_rsvp_status_enum') THEN
    CREATE TYPE participant_rsvp_status_enum AS ENUM ('going', 'maybe', 'not_going');
  END IF;
END $$;

-- Add rsvp_status column to event_participants table
ALTER TABLE event_participants
  ADD COLUMN IF NOT EXISTS rsvp_status participant_rsvp_status_enum;

-- Create index for filtering by rsvp_status
CREATE INDEX IF NOT EXISTS idx_event_participants_rsvp_status ON event_participants(rsvp_status);

-- Comments for documentation
COMMENT ON COLUMN event_participants.rsvp_status IS 'Participant RSVP status: going, maybe, or not_going (nullable)';

-- Migration notes:
-- - The 'status' column remains for invitation workflow ('pending', 'accepted', 'declined')
-- - The 'rsvp_status' column is for attendance intent after accepting invitation
-- - Example flow: status='pending' -> status='accepted' -> rsvp_status='going'
