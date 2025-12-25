-- Rollback Migration: Restore old date/time columns
-- Purpose: Reverse migration 013 if needed
-- Date: 2025-12-24
--
-- WARNING: This rollback will recreate the old columns and populate them
-- from UTC timestamps. Use this only if you need to revert to the old format.

-- ============================================================================
-- STEP 1: Recreate old date/time columns
-- ============================================================================

RAISE NOTICE 'Recreating old date/time columns...';

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS earliest_date DATE,
  ADD COLUMN IF NOT EXISTS latest_date DATE,
  ADD COLUMN IF NOT EXISTS earliest_hour TIME,
  ADD COLUMN IF NOT EXISTS latest_hour TIME;

RAISE NOTICE '✓ Old columns recreated';

-- ============================================================================
-- STEP 2: Populate old columns from UTC timestamps
-- ============================================================================

RAISE NOTICE 'Populating old columns from UTC timestamps...';

UPDATE events
SET
  earliest_date = earliest_datetime_utc::DATE,
  latest_date = latest_datetime_utc::DATE,
  earliest_hour = earliest_datetime_utc::TIME,
  latest_hour = latest_datetime_utc::TIME
WHERE earliest_datetime_utc IS NOT NULL
  AND latest_datetime_utc IS NOT NULL;

RAISE NOTICE '✓ Old columns populated from UTC data';

-- ============================================================================
-- STEP 3: Remove NOT NULL constraints from UTC columns
-- ============================================================================

RAISE NOTICE 'Removing NOT NULL constraints from UTC columns...';

ALTER TABLE events
  ALTER COLUMN earliest_datetime_utc DROP NOT NULL,
  ALTER COLUMN latest_datetime_utc DROP NOT NULL,
  ALTER COLUMN coordinator_timezone DROP NOT NULL;

RAISE NOTICE '✓ UTC columns are now nullable again';

-- ============================================================================
-- STEP 4: Verification
-- ============================================================================

RAISE NOTICE 'Verifying rollback...';

-- Show all datetime-related columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
  AND column_name IN (
    'earliest_date', 'latest_date', 'earliest_hour', 'latest_hour',
    'earliest_datetime_utc', 'latest_datetime_utc', 'coordinator_timezone'
  )
ORDER BY column_name;

-- Count events with populated old columns
SELECT
  COUNT(*) as total_events,
  COUNT(earliest_date) as has_earliest_date,
  COUNT(latest_date) as has_latest_date,
  COUNT(earliest_hour) as has_earliest_hour,
  COUNT(latest_hour) as has_latest_hour
FROM events;

-- ============================================================================
-- Rollback Complete
-- ============================================================================

RAISE NOTICE '';
RAISE NOTICE '========================================';
RAISE NOTICE 'Rollback completed successfully!';
RAISE NOTICE '========================================';
RAISE NOTICE '';
RAISE NOTICE 'Summary:';
RAISE NOTICE '  ✓ Old date/time columns restored';
RAISE NOTICE '  ✓ Data populated from UTC timestamps';
RAISE NOTICE '  ✓ NOT NULL constraints removed';
RAISE NOTICE '';
RAISE NOTICE 'WARNING: You are now back to the old schema.';
RAISE NOTICE 'The application may not work correctly if the code';
RAISE NOTICE 'has been updated to use only UTC timestamps.';
RAISE NOTICE '';
