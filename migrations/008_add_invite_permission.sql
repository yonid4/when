-- Migration: Add Invite Permission to Event Participants
-- Purpose: Allow coordinators to grant invite permissions to other participants
-- Created: 2025-12-23

-- Add can_invite column to event_participants table
ALTER TABLE event_participants
  ADD COLUMN IF NOT EXISTS can_invite BOOLEAN DEFAULT FALSE;

-- Create index for filtering by invite permission
CREATE INDEX IF NOT EXISTS idx_event_participants_can_invite ON event_participants(can_invite);

-- Comments for documentation
COMMENT ON COLUMN event_participants.can_invite IS 'Whether this participant can invite other users to the event (default: false, coordinators: true)';

-- Migration notes:
-- - Coordinators should have can_invite set to TRUE when they join as participants
-- - Other participants default to FALSE unless coordinator grants permission
-- - This allows delegation of invitation privileges without making someone a full coordinator
