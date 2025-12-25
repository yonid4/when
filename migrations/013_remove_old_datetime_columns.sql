-- Migration: Remove old date/time columns after UTC migration
-- Purpose: Clean up deprecated datetime fields now that UTC timestamps are in use
-- Date: 2025-12-24
--
-- Prerequisites:
-- - Migration 010: Added UTC timestamp columns
-- - Migration 011: Migrated existing data to UTC
-- - Migration 012: Dropped check_hour_order constraint
-- - All frontend/backend code updated to use UTC timestamps
--
-- This migration:
-- 1. Verifies all events have UTC timestamps (safety check)
-- 2. Makes UTC columns NOT NULL (enforce data integrity)
-- 3. Drops old columns: earliest_date, latest_date, earliest_hour, latest_hour
-- 4. Verifies cleanup was successful

-- ============================================================================
-- STEP 1: Safety Check - Verify all events have UTC timestamps
-- ============================================================================

DO $$
DECLARE
  null_utc_count INTEGER;
  total_events INTEGER;
BEGIN
  -- Count events missing UTC timestamps
  SELECT COUNT(*) INTO null_utc_count
  FROM events
  WHERE earliest_datetime_utc IS NULL OR latest_datetime_utc IS NULL;

  -- Get total event count for reference
  SELECT COUNT(*) INTO total_events FROM events;

  -- Raise error if any events are missing UTC data
  IF null_utc_count > 0 THEN
    RAISE EXCEPTION 'MIGRATION ABORTED: Found % out of % events with NULL UTC timestamps. Run migration 011 first to populate UTC fields.',
      null_utc_count, total_events;
  END IF;

  RAISE NOTICE '✓ Safety check passed: All % events have UTC timestamps', total_events;
END $$;

-- ============================================================================
-- STEP 2: Make UTC columns NOT NULL (enforce data integrity)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Setting NOT NULL constraints on UTC timestamp columns...';
END $$;

ALTER TABLE events
  ALTER COLUMN earliest_datetime_utc SET NOT NULL,
  ALTER COLUMN latest_datetime_utc SET NOT NULL,
  ALTER COLUMN coordinator_timezone SET NOT NULL;

DO $$
BEGIN
  RAISE NOTICE '✓ UTC columns are now required (NOT NULL)';
END $$;

-- ============================================================================
-- STEP 3: Drop old date/time columns
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Dropping old date/time columns...';
END $$;

ALTER TABLE events
  DROP COLUMN IF EXISTS earliest_date,
  DROP COLUMN IF EXISTS latest_date,
  DROP COLUMN IF EXISTS earliest_hour,
  DROP COLUMN IF EXISTS latest_hour;

DO $$
BEGIN
  RAISE NOTICE '✓ Old date/time columns removed';
END $$;

-- ============================================================================
-- STEP 4: Verification - Confirm cleanup
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Verifying migration results...';
END $$;

-- Show remaining datetime-related columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
  AND column_name IN (
    'earliest_date', 'latest_date', 'earliest_hour', 'latest_hour',
    'earliest_datetime_utc', 'latest_datetime_utc', 'coordinator_timezone'
  )
ORDER BY column_name;

-- Expected result:
-- coordinator_timezone    | character varying | NO
-- earliest_datetime_utc   | timestamp with time zone | NO
-- latest_datetime_utc     | timestamp with time zone | NO
--
-- Old columns (earliest_date, latest_date, earliest_hour, latest_hour) should NOT appear

-- ============================================================================
-- STEP 5: Sample data verification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Sample of migrated events:';
END $$;

-- Show a few events to verify UTC timestamps are present
SELECT
  uid,
  name,
  earliest_datetime_utc,
  latest_datetime_utc,
  coordinator_timezone,
  created_at
FROM events
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- Migration Complete
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 013 completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  ✓ All events verified to have UTC timestamps';
  RAISE NOTICE '  ✓ UTC columns set to NOT NULL';
  RAISE NOTICE '  ✓ Old date/time columns dropped';
  RAISE NOTICE '  ✓ Database schema cleanup complete';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Update backend models to remove old datetime fields';
  RAISE NOTICE '  2. Remove old format support from backend routes';
  RAISE NOTICE '  3. Test event creation and editing flows';
  RAISE NOTICE '';
END $$;
