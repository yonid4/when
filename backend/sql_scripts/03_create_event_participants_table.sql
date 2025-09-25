-- Create event_participants table
-- This table manages the relationship between events and users (participants)

CREATE TABLE IF NOT EXISTS event_participants (
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(50),  -- e.g., 'invited', 'accepted', 'declined'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (event_id, user_id)  -- Composite primary key to prevent duplicates
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_status ON event_participants(status);

-- Add data validation constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_status_valid' 
        AND table_name = 'event_participants'
    ) THEN
        ALTER TABLE event_participants 
        ADD CONSTRAINT check_status_valid 
        CHECK (status IS NULL OR status IN ('invited', 'accepted', 'declined', 'maybe'));
    END IF;
END $$;

-- Business logic constraint: prevent coordinator from being a participant
-- (coordinator is already associated with the event via coordinator_id)
-- Note: This is enforced via trigger instead of CHECK constraint due to subquery limitation

-- Add trigger to prevent duplicate participants
CREATE OR REPLACE FUNCTION check_duplicate_participant()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM event_participants 
        WHERE event_id = NEW.event_id 
        AND user_id = NEW.user_id
    ) THEN
        RAISE EXCEPTION 'User is already a participant in this event';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER prevent_duplicate_participants
    BEFORE INSERT ON event_participants
    FOR EACH ROW
    EXECUTE FUNCTION check_duplicate_participant();

-- Add trigger to prevent coordinator from being a participant
CREATE OR REPLACE FUNCTION check_not_coordinator()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM events 
        WHERE events.id = NEW.event_id 
        AND events.coordinator_id = NEW.user_id
    ) THEN
        RAISE EXCEPTION 'Event coordinator cannot be added as a participant';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER prevent_coordinator_participant
    BEFORE INSERT ON event_participants
    FOR EACH ROW
    EXECUTE FUNCTION check_not_coordinator();

-- Note: event_participants doesn't have updated_at column, so no auto-update trigger needed

-- Add comments for documentation
COMMENT ON TABLE event_participants IS 'Junction table managing event participants and their status';
COMMENT ON COLUMN event_participants.event_id IS 'ID of the event';
COMMENT ON COLUMN event_participants.user_id IS 'ID of the user/participant';
COMMENT ON COLUMN event_participants.status IS 'Participant status (invited, accepted, declined)';
COMMENT ON COLUMN event_participants.joined_at IS 'Timestamp when user joined the event';
