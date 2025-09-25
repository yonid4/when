-- Create events table
-- This table stores event information including scheduling constraints and status

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid VARCHAR(12) NOT NULL UNIQUE,  -- 12-character unique identifier for public sharing
    name VARCHAR(255),
    description TEXT,
    coordinator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    earliest_date DATE,
    latest_date DATE,
    earliest_hour TIME,  -- Storing as time without timezone
    latest_hour TIME,     -- Storing as time without timezone
    duration_minutes INTEGER,
    status VARCHAR(50),  -- e.g., 'planning', 'confirmed', 'cancelled'
    selected_start_time_utc TIMESTAMP WITH TIME ZONE,
    selected_end_time_utc TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_uid ON events(uid);
CREATE INDEX IF NOT EXISTS idx_events_coordinator_id ON events(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_earliest_date ON events(earliest_date);
CREATE INDEX IF NOT EXISTS idx_events_latest_date ON events(latest_date);

-- Add data validation constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_uid_format' 
        AND table_name = 'events'
    ) THEN
        ALTER TABLE events 
        ADD CONSTRAINT check_uid_format 
        CHECK (uid ~* '^[A-Za-z0-9]{12}$');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_name_length' 
        AND table_name = 'events'
    ) THEN
        ALTER TABLE events 
        ADD CONSTRAINT check_name_length 
        CHECK (name IS NULL OR (LENGTH(name) >= 1 AND LENGTH(name) <= 255));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_description_length' 
        AND table_name = 'events'
    ) THEN
        ALTER TABLE events 
        ADD CONSTRAINT check_description_length 
        CHECK (description IS NULL OR LENGTH(description) <= 5000);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_duration_positive' 
        AND table_name = 'events'
    ) THEN
        ALTER TABLE events 
        ADD CONSTRAINT check_duration_positive 
        CHECK (duration_minutes IS NULL OR duration_minutes > 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_duration_reasonable' 
        AND table_name = 'events'
    ) THEN
        ALTER TABLE events 
        ADD CONSTRAINT check_duration_reasonable 
        CHECK (duration_minutes IS NULL OR duration_minutes <= 10080); -- Max 1 week
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_status_valid' 
        AND table_name = 'events'
    ) THEN
        ALTER TABLE events 
        ADD CONSTRAINT check_status_valid 
        CHECK (status IS NULL OR status IN ('planning', 'confirmed', 'cancelled', 'completed'));
    END IF;
END $$;

-- Business logic constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_date_order' 
        AND table_name = 'events'
    ) THEN
        ALTER TABLE events 
        ADD CONSTRAINT check_date_order 
        CHECK (
            earliest_date IS NULL OR 
            latest_date IS NULL OR 
            latest_date >= earliest_date
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_hour_order' 
        AND table_name = 'events'
    ) THEN
        ALTER TABLE events 
        ADD CONSTRAINT check_hour_order 
        CHECK (
            earliest_hour IS NULL OR 
            latest_hour IS NULL OR 
            latest_hour >= earliest_hour
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_selected_time_order' 
        AND table_name = 'events'
    ) THEN
        ALTER TABLE events 
        ADD CONSTRAINT check_selected_time_order 
        CHECK (
            selected_start_time_utc IS NULL OR 
            selected_end_time_utc IS NULL OR 
            selected_end_time_utc > selected_start_time_utc
        );
    END IF;
END $$;

-- Add trigger to automatically update updated_at timestamp
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE events IS 'Event information including scheduling constraints and status';
COMMENT ON COLUMN events.id IS 'Unique identifier for the event';
COMMENT ON COLUMN events.uid IS '12-character unique identifier for public sharing';
COMMENT ON COLUMN events.name IS 'Event name';
COMMENT ON COLUMN events.description IS 'Event description';
COMMENT ON COLUMN events.coordinator_id IS 'ID of the user who created/coordinates the event';
COMMENT ON COLUMN events.earliest_date IS 'Earliest possible date for the event';
COMMENT ON COLUMN events.latest_date IS 'Latest possible date for the event';
COMMENT ON COLUMN events.earliest_hour IS 'Earliest possible hour for the event (time only)';
COMMENT ON COLUMN events.latest_hour IS 'Latest possible hour for the event (time only)';
COMMENT ON COLUMN events.duration_minutes IS 'Duration of the event in minutes';
COMMENT ON COLUMN events.status IS 'Current status of the event (planning, confirmed, cancelled)';
COMMENT ON COLUMN events.selected_start_time_utc IS 'Final selected start time in UTC';
COMMENT ON COLUMN events.selected_end_time_utc IS 'Final selected end time in UTC';
COMMENT ON COLUMN events.created_at IS 'Timestamp when event was created';
COMMENT ON COLUMN events.updated_at IS 'Timestamp when event was last updated';
