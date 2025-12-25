-- Migration: Add UTC timestamp columns to events table
-- Purpose: Replace separate date/time columns with proper UTC timestamps
-- Following pattern of finalized_start_time_utc column
-- Date: 2025-12-23

-- Add new UTC timestamp columns
ALTER TABLE events
ADD COLUMN earliest_datetime_utc TIMESTAMPTZ,
ADD COLUMN latest_datetime_utc TIMESTAMPTZ,
ADD COLUMN coordinator_timezone VARCHAR(50) DEFAULT 'UTC';

-- Add comments explaining the columns
COMMENT ON COLUMN events.earliest_datetime_utc IS 'Event earliest time in UTC (replaces earliest_date + earliest_hour)';
COMMENT ON COLUMN events.latest_datetime_utc IS 'Event latest time in UTC (replaces latest_date + latest_hour)';
COMMENT ON COLUMN events.coordinator_timezone IS 'Timezone of the event coordinator (for display fallback)';

-- Note: Columns are nullable initially
-- Next steps:
-- 1. Populate data from existing earliest_date/earliest_hour and latest_date/latest_hour
-- 2. Make columns NOT NULL after data migration
-- 3. Consider deprecating old date/time columns in future migration
