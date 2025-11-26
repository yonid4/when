-- Migration: Create Notifications Table
-- Purpose: Support notification inbox for event invitations, finalization, and deletions
-- Created: 2025-11-15

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  action_taken BOOLEAN DEFAULT FALSE,
  action_type VARCHAR(50), -- 'accept', 'decline', null
  metadata JSONB, -- For additional context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  action_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_event_id ON notifications(event_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can update their own notifications (mark as read, take action)
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy 3: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Policy 4: System can insert notifications (authenticated users only)
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Add check constraint for valid notification types
ALTER TABLE notifications 
  ADD CONSTRAINT valid_notification_type 
  CHECK (notification_type IN (
    'event_invitation',
    'event_finalized',
    'event_deleted',
    'event_time_changed'
  ));

-- Add check constraint for valid action types
ALTER TABLE notifications 
  ADD CONSTRAINT valid_action_type 
  CHECK (action_type IS NULL OR action_type IN ('accept', 'decline'));

-- Comments for documentation
COMMENT ON TABLE notifications IS 'Stores user notifications for events and actions';
COMMENT ON COLUMN notifications.notification_type IS 'Type: event_invitation, event_finalized, event_deleted, event_time_changed';
COMMENT ON COLUMN notifications.action_type IS 'User action: accept, decline, or null';
COMMENT ON COLUMN notifications.metadata IS 'Additional context (coordinator_id, google_calendar_link, etc.)';




