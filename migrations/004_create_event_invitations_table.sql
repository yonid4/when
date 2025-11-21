-- Migration: Create event_invitations table
-- Purpose: Track event invitations separately from participants
-- This allows distinguishing between "joined via link" vs "invited by coordinator"

-- Create event_invitations table
CREATE TABLE event_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_event_invitee UNIQUE (event_id, invitee_id)
);

-- Add indexes for performance
CREATE INDEX idx_event_invitations_event ON event_invitations(event_id);
CREATE INDEX idx_event_invitations_invitee ON event_invitations(invitee_id);
CREATE INDEX idx_event_invitations_status ON event_invitations(status);
CREATE INDEX idx_event_invitations_inviter ON event_invitations(inviter_id);

-- Add comment explaining status values
COMMENT ON COLUMN event_invitations.status IS 'Possible values: pending (awaiting response), accepted (joined event), declined (rejected invitation)';

-- Enable Row Level Security
ALTER TABLE event_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see invitations for events they're part of or invited to
CREATE POLICY "Users can view relevant invitations"
  ON event_invitations FOR SELECT
  USING (
    invitee_id = auth.uid() OR
    inviter_id = auth.uid() OR
    event_id IN (
      SELECT event_id FROM event_participants WHERE user_id = auth.uid()
    )
  );

-- Policy: Only coordinators can create invitations
CREATE POLICY "Coordinators can create invitations"
  ON event_invitations FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE coordinator_id = auth.uid()
    )
  );

-- Policy: Users can update their own invitation status
CREATE POLICY "Users can update their invitation status"
  ON event_invitations FOR UPDATE
  USING (invitee_id = auth.uid());

-- Policy: Coordinators can update invitations for their events
CREATE POLICY "Coordinators can update event invitations"
  ON event_invitations FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM events WHERE coordinator_id = auth.uid()
    )
  );

-- Policy: Coordinators can delete invitations for their events
CREATE POLICY "Coordinators can delete event invitations"
  ON event_invitations FOR DELETE
  USING (
    event_id IN (
      SELECT id FROM events WHERE coordinator_id = auth.uid()
    )
  );


