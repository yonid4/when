# UTC Timestamp Migration Guide

Complete guide for migrating from separate date/time columns to UTC timestamps.

## Overview

This migration updates the events table to use proper UTC timestamps instead of separate date and time columns. This ensures correct timezone handling across different users.

---

## Prerequisites

Before starting the migration:

1. ✅ **Backup your database**
   ```bash
   pg_dump your_database > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. ✅ **Ensure all code changes are deployed**
   - Backend supports both old and new formats
   - Frontend converts local time ↔ UTC
   - All tests passing

3. ✅ **Hard refresh browsers**
   - Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
   - Clears cached JavaScript

---

## Migration Steps

### Step 1: Add UTC Timestamp Columns

**File**: `migrations/010_add_utc_timestamp_columns.sql`

```bash
psql -d your_database -f migrations/010_add_utc_timestamp_columns.sql
```

**What it does**:
- Adds `earliest_datetime_utc` (TIMESTAMPTZ)
- Adds `latest_datetime_utc` (TIMESTAMPTZ)
- Adds `coordinator_timezone` (VARCHAR(50), default 'UTC')
- All columns nullable initially

**Expected output**:
```
ALTER TABLE
COMMENT
COMMENT
COMMENT
Migration 010 completed successfully!
```

---

### Step 2: Migrate Existing Data

**File**: `migrations/011_migrate_existing_data_to_utc.sql`

```bash
psql -d your_database -f migrations/011_migrate_existing_data_to_utc.sql
```

**What it does**:
- Converts existing `earliest_date + earliest_hour` → `earliest_datetime_utc`
- Converts existing `latest_date + latest_hour` → `latest_datetime_utc`
- Assumes existing times are in UTC (correct for most cases)

**Expected output**:
```
UPDATE 42
Migration 011 completed successfully!
Migrated events: 42
```

**Verification query**:
```sql
SELECT
  uid,
  earliest_date,
  earliest_hour,
  earliest_datetime_utc,
  coordinator_timezone
FROM events
LIMIT 5;
```

Should show both old and new fields populated.

---

### Step 3: Drop Incompatible Constraint

**File**: `migrations/012_drop_hour_order_constraint.sql`

```bash
psql -d your_database -f migrations/012_drop_hour_order_constraint.sql
```

**What it does**:
- Drops `check_hour_order` constraint
- This constraint fails when UTC times span midnight
- Example: 9am-5pm PST → 5pm-1am UTC (01:00 < 17:00 fails)

**Expected output**:
```
ALTER TABLE
Migration 012 completed successfully!
```

---

### Step 4: Test New Event Creation

**Before proceeding**, test that events can be created with UTC timestamps:

1. **Create a test event in the UI**:
   - Use EventCreate form
   - Check browser console for logs:
     ```javascript
     [EventCreate] User timezone: America/New_York
     [EventCreate] Converted to UTC: 2025-12-25T14:00:00.000Z
     ```

2. **Verify in database**:
   ```sql
   SELECT
     uid,
     name,
     earliest_datetime_utc,
     latest_datetime_utc,
     coordinator_timezone
   FROM events
   ORDER BY created_at DESC
   LIMIT 1;
   ```

3. **View the event**:
   - Open EventPage
   - Check console for timezone conversion logs
   - Verify times display in your local timezone

**If tests pass**, proceed to Step 5. **If tests fail**, stop and investigate.

---

### Step 5: Clean Up Old Columns (Optional)

⚠️ **WARNING**: This step is **irreversible** (without the rollback migration). Only proceed if:
- All events have UTC timestamps
- All code is using UTC fields
- Testing is complete and successful

**File**: `migrations/013_remove_old_datetime_columns.sql`

```bash
psql -d your_database -f migrations/013_remove_old_datetime_columns.sql
```

**What it does**:
- **Safety check**: Verifies all events have UTC timestamps
- Makes UTC columns NOT NULL
- Drops old columns: `earliest_date`, `latest_date`, `earliest_hour`, `latest_hour`

**Expected output**:
```
NOTICE: ✓ Safety check passed: All 42 events have UTC timestamps
NOTICE: ✓ UTC columns are now required (NOT NULL)
NOTICE: ✓ Old date/time columns removed
Migration 013 completed successfully!
```

**If safety check fails**:
```
ERROR: MIGRATION ABORTED: Found 3 out of 42 events with NULL UTC timestamps.
```
→ Run migration 011 again or investigate missing data.

---

## Rollback Instructions

If you need to revert migration 013 (restore old columns):

```bash
psql -d your_database -f migrations/013_remove_old_datetime_columns_ROLLBACK.sql
```

**What it does**:
- Recreates old columns
- Populates them from UTC timestamps
- Removes NOT NULL constraints from UTC columns

⚠️ **Note**: You'll be back to the old schema, which may break if code has been updated.

---

## Verification Checklist

After completing all migrations:

### Database Verification

```sql
-- 1. Check schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
  AND column_name LIKE '%datetime%' OR column_name LIKE '%date' OR column_name LIKE '%hour'
ORDER BY column_name;

-- Expected (after migration 013):
-- coordinator_timezone    | character varying | NO
-- earliest_datetime_utc   | timestamp with time zone | NO
-- latest_datetime_utc     | timestamp with time zone | NO
-- finalized_start_time_utc| timestamp with time zone | YES
-- selected_start_time_utc | timestamp with time zone | YES
-- selected_end_time_utc   | timestamp with time zone | YES

-- 2. Verify all events have UTC data
SELECT COUNT(*) as total,
       COUNT(earliest_datetime_utc) as has_earliest_utc,
       COUNT(latest_datetime_utc) as has_latest_utc
FROM events;

-- Should show: total = has_earliest_utc = has_latest_utc

-- 3. Sample data check
SELECT uid, name,
       earliest_datetime_utc,
       latest_datetime_utc,
       coordinator_timezone
FROM events
LIMIT 3;
```

### Application Verification

1. **Create new event**:
   - Open EventCreate
   - Fill in details with times in your local timezone
   - Submit
   - Check console logs for UTC conversion
   - Verify event created successfully

2. **View event**:
   - Navigate to event page
   - Verify date range displays in local timezone
   - Check calendar time bounds are correct
   - Console should show `[EventPage] Calendar time bound` logs

3. **Edit event**:
   - Open Edit modal
   - Verify times show in local timezone
   - Change times
   - Save
   - Check console for `[EDIT_EVENT]` conversion logs

4. **Cross-timezone test** (if possible):
   - Use browser DevTools to change timezone:
     ```javascript
     // In Chrome DevTools Console
     // Settings → Sensors → Location → Other → Choose timezone
     ```
   - Reload page
   - Verify times update to new timezone

---

## Timeline Summary

| Migration | Purpose | Reversible? | Safe to skip? |
|-----------|---------|-------------|---------------|
| 010 | Add UTC columns | ✅ Yes | ❌ No |
| 011 | Migrate data | ✅ Yes | ❌ No |
| 012 | Drop constraint | ✅ Yes | ❌ No |
| 013 | Clean up old columns | ⚠️ With rollback | ✅ Yes* |

\* You can keep both old and new columns indefinitely during transition period.

---

## Common Issues

### Issue 1: "UTC fields missing from payload"

**Symptom**: Error in browser console during event creation.

**Cause**: Browser serving cached JavaScript.

**Solution**:
```bash
# Hard refresh browser
Cmd+Shift+R (Mac)
Ctrl+Shift+R (Windows)
```

### Issue 2: "Check constraint check_hour_order violated"

**Symptom**: Database error when creating events with times spanning midnight.

**Cause**: Migration 012 not applied.

**Solution**:
```bash
psql -d your_database -f migrations/012_drop_hour_order_constraint.sql
```

### Issue 3: Times display in UTC instead of local timezone

**Symptom**: Event shows wrong times (off by timezone offset).

**Cause**: Frontend not converting UTC to local.

**Solution**: Check that EventPage is using the new helper functions:
```javascript
formatEventDateTime(event.finalized_start_time_utc, event.coordinator_timezone)
```

### Issue 4: Migration 013 safety check fails

**Symptom**: "Found X events with NULL UTC timestamps"

**Cause**: Some events missing UTC data.

**Solution**:
```sql
-- Find problematic events
SELECT uid, name, earliest_datetime_utc, latest_datetime_utc
FROM events
WHERE earliest_datetime_utc IS NULL OR latest_datetime_utc IS NULL;

-- Manually fix or delete them
-- Then re-run migration 011
```

---

## Support

If you encounter issues:

1. Check the console logs (browser and backend)
2. Verify database state with SQL queries above
3. Review [UTC_TIMESTAMP_MIGRATION.md](./UTC_TIMESTAMP_MIGRATION.md) for implementation details
4. Check recent git commits for code changes

---

## Next Steps After Migration

1. **Monitor application logs** for timezone-related errors
2. **Remove old format support** from backend routes (optional)
3. **Update Event model** to remove old datetime fields (optional)
4. **Deploy to production** using same migration steps
5. **Update API documentation** to reflect UTC timestamp format

---

**Migration Status**: ✅ Complete

All migrations created and ready to apply.
