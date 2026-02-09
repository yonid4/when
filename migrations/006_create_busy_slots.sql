-- Table: busy_slots
-- Stores calendar busy times synced from providers
-- Depends on: calendar_sources
-- Note: user_id references auth.users(id), not profiles(id)

CREATE TABLE IF NOT EXISTS busy_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    start_time_utc TIMESTAMPTZ NOT NULL,
    end_time_utc TIMESTAMPTZ NOT NULL,
    google_event_id VARCHAR(255),
    google_calendar_id VARCHAR(255),
    event_title TEXT,
    event_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    calendar_source_id UUID REFERENCES calendar_sources(id) ON DELETE SET NULL,

    CONSTRAINT busy_slots_user_event_calendar_unique UNIQUE (user_id, google_event_id, google_calendar_id)
);

CREATE INDEX IF NOT EXISTS idx_busy_slots_calendar_source ON busy_slots(calendar_source_id);
CREATE INDEX IF NOT EXISTS idx_busy_slots_google_event ON busy_slots(google_event_id) WHERE google_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_busy_slots_last_synced ON busy_slots(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_busy_slots_time_range ON busy_slots(start_time_utc, end_time_utc);
CREATE INDEX IF NOT EXISTS idx_busy_slots_user_id ON busy_slots(user_id);
CREATE INDEX IF NOT EXISTS idx_busy_slots_user_time ON busy_slots(user_id, start_time_utc, end_time_utc);
CREATE INDEX IF NOT EXISTS idx_busy_slots_user_calendar ON busy_slots(user_id, google_calendar_id);

ALTER TABLE busy_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can delete their own busy slots"
    ON busy_slots FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own busy slots"
    ON busy_slots FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own busy slots"
    ON busy_slots FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own busy slots"
    ON busy_slots FOR SELECT
    USING (auth.uid() = user_id);
