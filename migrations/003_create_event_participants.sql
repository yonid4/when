-- Table: event_participants
-- Tracks which users have joined which events
-- Composite primary key: (event_id, user_id)
-- Depends on: events, profiles, participant_rsvp_status_enum

CREATE TABLE IF NOT EXISTS event_participants (
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(50),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    rsvp_status participant_rsvp_status_enum,
    can_invite BOOLEAN DEFAULT FALSE,

    PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_participants_can_invite ON event_participants(can_invite);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_rsvp_status ON event_participants(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_event_participants_status ON event_participants(status);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);

ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_participants_delete_policy"
    ON event_participants FOR DELETE
    USING (
        user_id = auth.uid()
        OR event_id IN (SELECT id FROM events WHERE coordinator_id = auth.uid())
    );

CREATE POLICY "event_participants_insert_policy"
    ON event_participants FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        OR event_id IN (SELECT id FROM events WHERE coordinator_id = auth.uid())
    );

CREATE POLICY "event_participants_select_policy"
    ON event_participants FOR SELECT
    USING (
        user_id = auth.uid()
        OR event_id IN (SELECT id FROM events WHERE coordinator_id = auth.uid())
    );

CREATE POLICY "event_participants_update_policy"
    ON event_participants FOR UPDATE
    USING (user_id = auth.uid());
