-- Table: events
-- Core event table for scheduling coordination
-- Depends on: profiles, event_type_enum

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid VARCHAR(12) NOT NULL,
    name VARCHAR(255),
    description TEXT,
    coordinator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    duration_minutes INTEGER,
    status VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    finalized_start_time_utc TIMESTAMPTZ,
    finalized_end_time_utc TIMESTAMPTZ,
    google_calendar_event_id VARCHAR(255),
    google_calendar_html_link TEXT,
    finalized_at TIMESTAMPTZ,
    proposals_needs_regeneration BOOLEAN DEFAULT TRUE,
    proposals_last_generated_at TIMESTAMPTZ,
    proposals_generation_version INTEGER DEFAULT 0,
    event_type event_type_enum,
    video_call_link TEXT,
    location TEXT,
    earliest_datetime_utc TIMESTAMPTZ NOT NULL,
    latest_datetime_utc TIMESTAMPTZ NOT NULL,
    coordinator_timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    microsoft_calendar_event_id TEXT,
    microsoft_calendar_html_link TEXT,
    calendar_provider VARCHAR(50),
    guests_can_invite BOOLEAN DEFAULT FALSE,

    CONSTRAINT events_uid_key UNIQUE (uid)
);

CREATE INDEX IF NOT EXISTS idx_events_coordinator_id ON events(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_uid ON events(uid);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_delete_policy"
    ON events FOR DELETE
    USING (coordinator_id = auth.uid());

CREATE POLICY "events_insert_policy"
    ON events FOR INSERT
    WITH CHECK (coordinator_id = auth.uid());

CREATE POLICY "events_select_policy"
    ON events FOR SELECT
    USING (
        (coordinator_id = auth.uid())
        OR (EXISTS (
            SELECT 1 FROM event_participants ep
            WHERE ep.event_id = events.id AND ep.user_id = auth.uid()
        ))
        OR (EXISTS (
            SELECT 1 FROM event_invitations ei
            WHERE ei.event_id = events.id
              AND ei.invitee_id = auth.uid()
              AND ei.status = 'pending'
        ))
    );

CREATE POLICY "events_update_policy"
    ON events FOR UPDATE
    USING (coordinator_id = auth.uid());
