-- Migration: Create proposed_times table and add tracking fields to events
-- Description: Cache AI-generated time proposals with smart invalidation
-- Date: 2025-12-13

-- Create the proposed_times table
CREATE TABLE IF NOT EXISTS proposed_times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    start_time_utc TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time_utc TIMESTAMP WITH TIME ZONE NOT NULL,
    conflicts INTEGER DEFAULT 0,
    score DOUBLE PRECISION,
    reasoning TEXT,
    rank INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_time_utc > start_time_utc),
    CONSTRAINT valid_rank CHECK (rank >= 0),
    CONSTRAINT unique_event_rank UNIQUE(event_id, rank)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_proposed_times_event ON proposed_times(event_id);
CREATE INDEX IF NOT EXISTS idx_proposed_times_event_rank ON proposed_times(event_id, rank);

-- Add tracking fields to events table
ALTER TABLE events 
    ADD COLUMN IF NOT EXISTS proposals_needs_regeneration BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS proposals_last_generated_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS proposals_generation_version INTEGER DEFAULT 0;

-- Enable Row Level Security
ALTER TABLE proposed_times ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view proposals for events they're part of
CREATE POLICY "Users can view proposals for their events"
    ON proposed_times FOR SELECT
    USING (
        event_id IN (
            SELECT ep.event_id 
            FROM event_participants ep 
            WHERE ep.user_id = auth.uid()
        )
    );

-- Comments for documentation
COMMENT ON TABLE proposed_times IS 'Cached AI-generated time proposals for events';
COMMENT ON COLUMN proposed_times.event_id IS 'Reference to the event';
COMMENT ON COLUMN proposed_times.start_time_utc IS 'Proposed start time in UTC';
COMMENT ON COLUMN proposed_times.end_time_utc IS 'Proposed end time in UTC';
COMMENT ON COLUMN proposed_times.conflicts IS 'Number of participants with conflicts at this time';
COMMENT ON COLUMN proposed_times.score IS 'AI-assigned score (0-100) for this proposal';
COMMENT ON COLUMN proposed_times.reasoning IS 'AI explanation for why this time was suggested';
COMMENT ON COLUMN proposed_times.rank IS 'Ranking of proposal (0=best, 1=second best, etc.)';

COMMENT ON COLUMN events.proposals_needs_regeneration IS 'Flag indicating proposals need to be regenerated';
COMMENT ON COLUMN events.proposals_last_generated_at IS 'Timestamp of last proposal generation';
COMMENT ON COLUMN events.proposals_generation_version IS 'Incremented on each regeneration for cache invalidation';
