-- Migration: Create preferred_slots table
-- Description: Store user-selected preferred time slots for events
-- Date: 2025-11-07

-- Create the preferred_slots table
CREATE TABLE IF NOT EXISTS preferred_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    start_time_utc TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time_utc TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_time_utc > start_time_utc),
    CONSTRAINT no_user_overlap UNIQUE (user_id, event_id, start_time_utc, end_time_utc)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_preferred_slots_user_event ON preferred_slots(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_preferred_slots_event ON preferred_slots(event_id);

-- Enable Row Level Security
ALTER TABLE preferred_slots ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view all slots for events they're part of
CREATE POLICY "Users can view slots for their events"
    ON preferred_slots FOR SELECT
    USING (
        event_id IN (
            SELECT ep.event_id 
            FROM event_participants ep 
            WHERE ep.user_id = auth.uid()
        )
    );

-- Policy 2: Users can insert their own slots
CREATE POLICY "Users can insert their own slots"
    ON preferred_slots FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update only their own slots
CREATE POLICY "Users can update their own slots"
    ON preferred_slots FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy 4: Users can delete only their own slots
CREATE POLICY "Users can delete their own slots"
    ON preferred_slots FOR DELETE
    USING (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE preferred_slots IS 'Stores user-selected preferred time slots for event coordination';
COMMENT ON COLUMN preferred_slots.user_id IS 'Reference to the user who created this preferred slot';
COMMENT ON COLUMN preferred_slots.event_id IS 'Reference to the event this slot belongs to';
COMMENT ON COLUMN preferred_slots.start_time_utc IS 'Start time of the preferred slot in UTC';
COMMENT ON COLUMN preferred_slots.end_time_utc IS 'End time of the preferred slot in UTC';
COMMENT ON CONSTRAINT valid_time_range ON preferred_slots IS 'Ensures end_time is after start_time';

