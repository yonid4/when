# UTC Timestamp Migration Documentation

## Overview
This document describes the migration from separate date/time columns to proper UTC timestamp columns in the events table.

## Database Migrations

### 1. Migration 010: Add UTC Timestamp Columns
**File**: `migrations/010_add_utc_timestamp_columns.sql`

Adds three new columns to the events table:
- `earliest_datetime_utc` (TIMESTAMPTZ) - Event earliest time in UTC
- `latest_datetime_utc` (TIMESTAMPTZ) - Event latest time in UTC
- `coordinator_timezone` (VARCHAR(50), default 'UTC') - Coordinator's timezone

All columns are nullable initially to allow for data migration.

### 2. Migration 011: Migrate Existing Data
**File**: `migrations/011_migrate_existing_data_to_utc.sql`

Populates the new UTC timestamp columns from existing date/time data:
- Combines `earliest_date` + `earliest_hour` → `earliest_datetime_utc`
- Combines `latest_date` + `latest_hour` → `latest_datetime_utc`
- Assumes existing times are in UTC

Includes verification queries to check migration success.

## Backend Changes

### 1. Event Model Updates
**File**: `backend/app/models/event.py`

Added new fields while keeping old fields for backward compatibility:

```python
# Old datetime fields (kept for backward compatibility during migration)
earliest_date: Optional[date] = Field(default=None)
latest_date: Optional[date] = Field(default=None)
earliest_hour: Optional[time] = Field(default=None)
latest_hour: Optional[time] = Field(default=None)

# New UTC timestamp fields (following finalized_start_time_utc pattern)
earliest_datetime_utc: Optional[datetime] = Field(default=None, description="Earliest event time in UTC")
latest_datetime_utc: Optional[datetime] = Field(default=None, description="Latest event time in UTC")
coordinator_timezone: Optional[str] = Field(default='UTC', description="Coordinator's timezone for display fallback")
```

Updated `to_dict()` method to serialize all fields.

### 2. Event Creation Route
**File**: `backend/app/routes/events.py`

Updated POST `/api/events` endpoint to handle both formats:

**New Format (Preferred)**:
```json
{
  "name": "Team Meeting",
  "earliest_datetime_utc": "2025-12-24T14:00:00Z",
  "latest_datetime_utc": "2025-12-31T18:00:00Z",
  "coordinator_timezone": "America/New_York",
  "duration_minutes": 60
}
```

**Old Format (Backward Compatible)**:
```json
{
  "name": "Team Meeting",
  "earliest_date": "2025-12-24",
  "earliest_hour": "14:00:00",
  "latest_date": "2025-12-31",
  "latest_hour": "18:00:00",
  "duration_minutes": 60
}
```

**How It Works**:
1. If new format (`earliest_datetime_utc`, `latest_datetime_utc`) is provided:
   - Parse UTC timestamps directly
   - Extract date/time components for old fields (backward compatibility)

2. If old format (`earliest_date`, `earliest_hour`) is provided:
   - Parse date and time separately
   - Combine into UTC timestamps for new fields

3. Store coordinator timezone (defaults to 'UTC' if not provided)

4. Save BOTH old and new field values during transition period

### 3. Event Service Validation
**File**: `backend/app/services/events.py`

Updated `validate_event_data()` to support both formats:
- Validates UTC timestamp range if new format is used
- Falls back to date range validation if old format is used
- Ensures earliest < latest in both cases

## Migration Strategy

### Phase 1: Database Schema ✅
- [x] Add new UTC timestamp columns (nullable)
- [x] Migrate existing data to new columns
- [x] Verify data migration

### Phase 2: Backend Support ✅
- [x] Update Event model with new fields
- [x] Update event creation endpoint to handle both formats
- [x] Update validation to support both formats
- [x] Keep old fields populated for backward compatibility

### Phase 3: Frontend Update (Next Steps)
- [ ] Update frontend to send UTC timestamps in new format
- [ ] Send coordinator timezone from browser
- [ ] Test new event creation flow
- [ ] Verify old events still display correctly

### Phase 4: Cleanup (Future)
- [ ] Remove old date/time fields from Event model
- [ ] Remove old format parsing from routes
- [ ] Add NOT NULL constraints to new columns
- [ ] Drop old columns from database

## Benefits

1. **Proper Timezone Handling**: Store all times in UTC, convert to local timezone for display
2. **Simplified Logic**: Single timestamp field instead of separate date + time
3. **Better Validation**: Easier to validate datetime ranges
4. **Follows Best Practices**: Matches existing pattern (`finalized_start_time_utc`)
5. **Backward Compatible**: Supports old format during transition

## Testing

### Test New Format
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Event",
    "earliest_datetime_utc": "2025-12-24T14:00:00Z",
    "latest_datetime_utc": "2025-12-31T18:00:00Z",
    "coordinator_timezone": "America/New_York",
    "duration_minutes": 60
  }'
```

### Test Old Format (Backward Compatibility)
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Event",
    "earliest_date": "2025-12-24",
    "earliest_hour": "14:00:00",
    "latest_date": "2025-12-31",
    "latest_hour": "18:00:00",
    "duration_minutes": 60
  }'
```

Both formats should work and populate all fields correctly.

## Notes

- All times are stored in UTC in the database
- Frontend should use browser's Intl API to convert UTC to local timezone for display
- The `coordinator_timezone` field is for fallback/reference only
- During transition period, both old and new fields are populated
- Follow .aimrules guidelines for timezone handling
