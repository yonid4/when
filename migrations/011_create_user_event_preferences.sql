-- Table: user_event_preferences
-- User preferences for event time slots
-- Depends on: events, profiles

CREATE TABLE IF NOT EXISTS user_event_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    availability_slot_id UUID,
    preferred_start_time_utc TIMESTAMPTZ,
    preferred_end_time_utc TIMESTAMPTZ,
    preference_strength INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_event_preferences_availability_slot_id ON user_event_preferences(availability_slot_id);
CREATE INDEX IF NOT EXISTS idx_user_event_preferences_event_id ON user_event_preferences(event_id);
CREATE INDEX IF NOT EXISTS idx_user_event_preferences_preference_strength ON user_event_preferences(preference_strength);
CREATE INDEX IF NOT EXISTS idx_user_event_preferences_user_id ON user_event_preferences(user_id);

ALTER TABLE user_event_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_authenticated_user_event_preferences"
    ON user_event_preferences FOR ALL
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "user_event_preferences_delete"
    ON user_event_preferences FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "user_event_preferences_delete_own"
    ON user_event_preferences FOR DELETE
    USING (user_id = auth.uid());

CREATE POLICY "user_event_preferences_insert"
    ON user_event_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_event_preferences_insert_own"
    ON user_event_preferences FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM event_participants ep
            WHERE ep.event_id = user_event_preferences.event_id AND ep.user_id = auth.uid()
        )
    );

CREATE POLICY "user_event_preferences_select"
    ON user_event_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "user_event_preferences_update"
    ON user_event_preferences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "user_event_preferences_update_own"
    ON user_event_preferences FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
