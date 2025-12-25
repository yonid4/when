-- Migration: Drop hour order check constraint
-- Purpose: Remove constraint that's incompatible with UTC timestamps spanning midnight
-- Date: 2025-12-24
--
-- Background:
-- The check_hour_order constraint (earliest_hour < latest_hour) fails when UTC
-- timestamps span midnight. For example:
-- - User in PST selects 9am-5pm local time
-- - Converts to UTC: 5pm Dec 24 - 1am Dec 25
-- - Constraint fails: 01:00:00 < 17:00:00 is false
--
-- With the new UTC timestamp fields (earliest_datetime_utc, latest_datetime_utc),
-- the full datetime comparison handles midnight crossings correctly.

-- Drop the hour order check constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS check_hour_order;

-- Verify constraint is dropped (for documentation purposes)
-- Run this query separately to confirm:
-- SELECT conname, contype
-- FROM pg_constraint
-- WHERE conrelid = 'events'::regclass
-- AND conname = 'check_hour_order';
-- Expected: 0 rows

-- Note: The application now validates datetime ranges using earliest_datetime_utc
-- and latest_datetime_utc, which properly handles times spanning midnight in UTC.
