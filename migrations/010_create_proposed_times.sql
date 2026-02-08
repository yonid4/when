-- Table: proposed_times
-- Cached AI-generated time proposals for events
-- Depends on: events

CREATE TABLE IF NOT EXISTS proposed_times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    start_time_utc TIMESTAMPTZ NOT NULL,
    end_time_utc TIMESTAMPTZ NOT NULL,
    conflicts INTEGER DEFAULT 0,
    reasoning TEXT,
    rank INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_time_range_proposed CHECK (end_time_utc > start_time_utc),
    CONSTRAINT valid_rank CHECK (rank >= 0),
    CONSTRAINT unique_event_rank UNIQUE (event_id, rank)
);

CREATE INDEX IF NOT EXISTS idx_proposed_times_event ON proposed_times(event_id);
CREATE INDEX IF NOT EXISTS idx_proposed_times_event_rank ON proposed_times(event_id, rank);

ALTER TABLE proposed_times ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view proposals for their events"
    ON proposed_times FOR SELECT
    USING (event_id IN (SELECT ep.event_id FROM event_participants ep WHERE ep.user_id = auth.uid()));
