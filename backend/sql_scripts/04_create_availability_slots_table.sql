-- Create availability_slots table
-- This table stores time slots when users are available for events

CREATE TABLE IF NOT EXISTS availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    start_time_utc TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time_utc TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_availability_slots_event_id ON availability_slots(event_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_start_time ON availability_slots(start_time_utc);
CREATE INDEX IF NOT EXISTS idx_availability_slots_end_time ON availability_slots(end_time_utc);
CREATE INDEX IF NOT EXISTS idx_availability_slots_time_range ON availability_slots(start_time_utc, end_time_utc);

-- Add constraint to ensure end_time is after start_time
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_availability_time_order' 
        AND table_name = 'availability_slots'
    ) THEN
        ALTER TABLE availability_slots 
        ADD CONSTRAINT check_availability_time_order 
        CHECK (end_time_utc > start_time_utc);
    END IF;
END $$;

-- Add business logic constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_slot_duration_minimum' 
        AND table_name = 'availability_slots'
    ) THEN
        ALTER TABLE availability_slots 
        ADD CONSTRAINT check_slot_duration_minimum 
        CHECK (EXTRACT(EPOCH FROM (end_time_utc - start_time_utc)) >= 900); -- Minimum 15 minutes
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_slot_duration_maximum' 
        AND table_name = 'availability_slots'
    ) THEN
        ALTER TABLE availability_slots 
        ADD CONSTRAINT check_slot_duration_maximum 
        CHECK (EXTRACT(EPOCH FROM (end_time_utc - start_time_utc)) <= 86400); -- Maximum 24 hours
    END IF;
END $$;

-- Add constraint to prevent overlapping availability slots for the same event
CREATE OR REPLACE FUNCTION check_overlapping_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM availability_slots 
        WHERE event_id = NEW.event_id 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND (
            (start_time_utc <= NEW.start_time_utc AND end_time_utc > NEW.start_time_utc) OR
            (start_time_utc < NEW.end_time_utc AND end_time_utc >= NEW.end_time_utc) OR
            (start_time_utc >= NEW.start_time_utc AND end_time_utc <= NEW.end_time_utc)
        )
    ) THEN
        RAISE EXCEPTION 'Availability slot overlaps with existing slot for this event';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER prevent_overlapping_availability
    BEFORE INSERT OR UPDATE ON availability_slots
    FOR EACH ROW
    EXECUTE FUNCTION check_overlapping_availability();

-- Add constraint to ensure availability is not in the past
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_availability_not_past' 
        AND table_name = 'availability_slots'
    ) THEN
        ALTER TABLE availability_slots 
        ADD CONSTRAINT check_availability_not_past 
        CHECK (start_time_utc >= NOW() - INTERVAL '1 hour'); -- Allow 1 hour buffer for timezone issues
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE availability_slots IS 'Time slots when users are available for events';
COMMENT ON COLUMN availability_slots.id IS 'Unique identifier for the availability slot';
COMMENT ON COLUMN availability_slots.event_id IS 'ID of the event this slot belongs to';
COMMENT ON COLUMN availability_slots.start_time_utc IS 'Start time of availability slot in UTC';
COMMENT ON COLUMN availability_slots.end_time_utc IS 'End time of availability slot in UTC';
COMMENT ON COLUMN availability_slots.created_at IS 'Timestamp when availability slot was created';
