-- Migration: Populate UTC timestamp columns from existing date/time data
-- Purpose: Migrate data from separate date/time columns to new UTC timestamps
-- Date: 2025-12-23

-- Populate UTC timestamps from existing date/time columns
-- Combine date + time and cast to timestamptz (assumes UTC)
UPDATE events
SET
  earliest_datetime_utc = (earliest_date::text || ' ' || earliest_hour::text)::timestamptz,
  latest_datetime_utc = (latest_date::text || ' ' || latest_hour::text)::timestamptz
WHERE earliest_datetime_utc IS NULL OR latest_datetime_utc IS NULL;

-- Verification query: Compare old and new columns side by side
-- This should show both old and new columns to verify migration worked correctly
SELECT
  uid,
  name,
  earliest_date,
  earliest_hour,
  earliest_datetime_utc,
  latest_date,
  latest_hour,
  latest_datetime_utc,
  coordinator_timezone
FROM events
ORDER BY created_at DESC
LIMIT 10;

-- Additional verification: Count rows with NULL values
-- Should return 0 if all data migrated successfully
SELECT
  COUNT(*) as total_events,
  COUNT(earliest_datetime_utc) as populated_earliest,
  COUNT(latest_datetime_utc) as populated_latest,
  COUNT(*) - COUNT(earliest_datetime_utc) as missing_earliest,
  COUNT(*) - COUNT(latest_datetime_utc) as missing_latest
FROM events;

-- Note: This migration assumes existing times are in UTC
-- If events were created with local times, additional timezone conversion may be needed
