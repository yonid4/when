-- Create user_event_preferences table
-- This table stores user preferences for specific events and time slots

CREATE TABLE IF NOT EXISTS user_event_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    availability_slot_id UUID REFERENCES availability_slots(id) ON DELETE SET NULL,
    preferred_start_time_utc TIMESTAMP WITH TIME ZONE,
    preferred_end_time_utc TIMESTAMP WITH TIME ZONE,
    preference_strength INTEGER CHECK (preference_strength >= 1 AND preference_strength <= 3),  -- 1 (low), 2 (medium), 3 (high)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_event_preferences_event_id ON user_event_preferences(event_id);
CREATE INDEX IF NOT EXISTS idx_user_event_preferences_user_id ON user_event_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_event_preferences_availability_slot_id ON user_event_preferences(availability_slot_id);
CREATE INDEX IF NOT EXISTS idx_user_event_preferences_preference_strength ON user_event_preferences(preference_strength);

-- Add constraint to ensure end_time is after start_time when both are provided
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_preference_time_order' 
        AND table_name = 'user_event_preferences'
    ) THEN
        ALTER TABLE user_event_preferences 
        ADD CONSTRAINT check_preference_time_order 
        CHECK (
            preferred_start_time_utc IS NULL OR 
            preferred_end_time_utc IS NULL OR 
            preferred_end_time_utc > preferred_start_time_utc
        );
    END IF;
END $$;

-- Add business logic constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_preference_duration_minimum' 
        AND table_name = 'user_event_preferences'
    ) THEN
        ALTER TABLE user_event_preferences 
        ADD CONSTRAINT check_preference_duration_minimum 
        CHECK (
            preferred_start_time_utc IS NULL OR 
            preferred_end_time_utc IS NULL OR 
            EXTRACT(EPOCH FROM (preferred_end_time_utc - preferred_start_time_utc)) >= 900 -- Minimum 15 minutes
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_preference_duration_maximum' 
        AND table_name = 'user_event_preferences'
    ) THEN
        ALTER TABLE user_event_preferences 
        ADD CONSTRAINT check_preference_duration_maximum 
        CHECK (
            preferred_start_time_utc IS NULL OR 
            preferred_end_time_utc IS NULL OR 
            EXTRACT(EPOCH FROM (preferred_end_time_utc - preferred_start_time_utc)) <= 86400 -- Maximum 24 hours
        );
    END IF;
END $$;

-- Note: User participant validation and availability slot validation 
-- are enforced via triggers instead of CHECK constraints due to subquery limitation

-- Add trigger to automatically update updated_at timestamp
CREATE TRIGGER update_user_event_preferences_updated_at 
    BEFORE UPDATE ON user_event_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to prevent duplicate preferences for the same user/event combination
CREATE OR REPLACE FUNCTION check_duplicate_preference()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM user_event_preferences 
        WHERE event_id = NEW.event_id 
        AND user_id = NEW.user_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
        RAISE EXCEPTION 'User already has preferences for this event';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER prevent_duplicate_preferences
    BEFORE INSERT ON user_event_preferences
    FOR EACH ROW
    EXECUTE FUNCTION check_duplicate_preference();

-- Add trigger to ensure user is a participant in the event
CREATE OR REPLACE FUNCTION check_user_is_participant()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM event_participants 
        WHERE event_participants.event_id = NEW.event_id 
        AND event_participants.user_id = NEW.user_id
    ) THEN
        RAISE EXCEPTION 'User must be a participant in the event to set preferences';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_user_is_participant
    BEFORE INSERT OR UPDATE ON user_event_preferences
    FOR EACH ROW
    EXECUTE FUNCTION check_user_is_participant();

-- Add trigger to ensure availability_slot_id belongs to the same event
CREATE OR REPLACE FUNCTION check_availability_slot_event_match()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.availability_slot_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM availability_slots 
        WHERE availability_slots.id = NEW.availability_slot_id 
        AND availability_slots.event_id = NEW.event_id
    ) THEN
        RAISE EXCEPTION 'Availability slot must belong to the same event';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_availability_slot_event_match
    BEFORE INSERT OR UPDATE ON user_event_preferences
    FOR EACH ROW
    EXECUTE FUNCTION check_availability_slot_event_match();

-- Add comments for documentation
COMMENT ON TABLE user_event_preferences IS 'User preferences for specific events and time slots';
COMMENT ON COLUMN user_event_preferences.id IS 'Unique identifier for the preference';
COMMENT ON COLUMN user_event_preferences.event_id IS 'ID of the event';
COMMENT ON COLUMN user_event_preferences.user_id IS 'ID of the user';
COMMENT ON COLUMN user_event_preferences.availability_slot_id IS 'ID of the availability slot (optional)';
COMMENT ON COLUMN user_event_preferences.preferred_start_time_utc IS 'Preferred start time in UTC (optional)';
COMMENT ON COLUMN user_event_preferences.preferred_end_time_utc IS 'Preferred end time in UTC (optional)';
COMMENT ON COLUMN user_event_preferences.preference_strength IS 'Strength of preference (1=low, 2=medium, 3=high)';
COMMENT ON COLUMN user_event_preferences.created_at IS 'Timestamp when preference was created';
COMMENT ON COLUMN user_event_preferences.updated_at IS 'Timestamp when preference was last updated';
