-- Table: preferred_slots
-- User-selected preferred time slots for events
-- Depends on: profiles, events

CREATE TABLE IF NOT EXISTS preferred_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    start_time_utc TIMESTAMPTZ NOT NULL,
    end_time_utc TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_time_range CHECK (end_time_utc > start_time_utc),
    CONSTRAINT no_user_overlap UNIQUE (user_id, event_id, start_time_utc, end_time_utc)
);

CREATE INDEX IF NOT EXISTS idx_preferred_slots_user_event ON preferred_slots(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_preferred_slots_event ON preferred_slots(event_id);

ALTER TABLE preferred_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view slots for their events"
    ON preferred_slots FOR SELECT
    USING (event_id IN (SELECT ep.event_id FROM event_participants ep WHERE ep.user_id = auth.uid()));

CREATE POLICY "Users can insert their own slots"
    ON preferred_slots FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own slots"
    ON preferred_slots FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own slots"
    ON preferred_slots FOR DELETE
    USING (auth.uid() = user_id);
