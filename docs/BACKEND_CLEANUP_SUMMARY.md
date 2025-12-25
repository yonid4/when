# Backend Cleanup Summary - Old Datetime Fields Removed

Complete summary of backend code changes after removing old datetime columns from the database.

## Overview

After running migration 013 (which drops the old `earliest_date`, `latest_date`, `earliest_hour`, `latest_hour` columns), the backend code has been updated to remove all references to these deprecated fields.

---

## Files Modified

### 1. **backend/app/models/event.py**

#### Changes:
- **Removed old datetime field imports**: No longer importing `date` and `time` types
- **Removed old field definitions**: Deleted `earliest_date`, `latest_date`, `earliest_hour`, `latest_hour`
- **Made UTC fields required**: Changed from `Optional[datetime]` to `datetime` (required)
- **Simplified to_dict() method**: Removed serialization of old fields

#### Before:
```python
from datetime import datetime, date, time

# Old datetime fields (kept for backward compatibility during migration)
earliest_date: Optional[date] = Field(default=None)
latest_date: Optional[date] = Field(default=None)
earliest_hour: Optional[time] = Field(default=None)
latest_hour: Optional[time] = Field(default=None)

# New UTC timestamp fields
earliest_datetime_utc: Optional[datetime] = Field(default=None, ...)
latest_datetime_utc: Optional[datetime] = Field(default=None, ...)
coordinator_timezone: Optional[str] = Field(default='UTC', ...)
```

#### After:
```python
from datetime import datetime

# UTC timestamp fields for event time range
earliest_datetime_utc: datetime = Field(..., description="Earliest event time in UTC")
latest_datetime_utc: datetime = Field(..., description="Latest event time in UTC")
coordinator_timezone: str = Field(default='UTC', description="Coordinator's timezone (IANA format)")
```

#### to_dict() Before:
```python
# Old datetime fields (backward compatibility)
"earliest_date": self.earliest_date.isoformat() if self.earliest_date else None,
"latest_date": self.latest_date.isoformat() if self.latest_date else None,
"earliest_hour": self.earliest_hour.isoformat() if self.earliest_hour else None,
"latest_hour": self.latest_hour.isoformat() if self.latest_hour else None,
# New UTC timestamp fields
"earliest_datetime_utc": self.earliest_datetime_utc.isoformat() if self.earliest_datetime_utc else None,
"latest_datetime_utc": self.latest_datetime_utc.isoformat() if self.latest_datetime_utc else None,
```

#### to_dict() After:
```python
# UTC timestamp fields
"earliest_datetime_utc": self.earliest_datetime_utc.isoformat(),
"latest_datetime_utc": self.latest_datetime_utc.isoformat(),
```

---

### 2. **backend/app/routes/events.py**

#### Changes:
- **Removed old helper functions**: Deleted `parse_iso_date()` and `parse_time_str()`
- **Simplified create_event**: Only accepts UTC timestamps, no old format fallback
- **Simplified update_event**: Only handles UTC timestamp updates
- **Added validation**: Ensures UTC timestamps are provided

#### create_event - Before:
```python
def parse_iso_date(date_str):
    # ... parsing logic

def parse_time_str(time_str):
    # ... parsing logic

# Handle both old and new datetime formats
if 'earliest_datetime_utc' in data and 'latest_datetime_utc' in data:
    # Parse UTC
    # Also populate old fields for backward compatibility
else:
    # Parse old format
    # Convert to UTC timestamps
```

#### create_event - After:
```python
# Parse UTC datetime fields (required)
logging.info("[EVENT] Parsing UTC timestamp fields")
earliest_datetime_utc = parse_utc_datetime(data.get("earliest_datetime_utc"))
latest_datetime_utc = parse_utc_datetime(data.get("latest_datetime_utc"))

# Validate that UTC timestamps are provided
if not earliest_datetime_utc or not latest_datetime_utc:
    return jsonify({'error': 'Validation error', ...}), 400
```

#### update_event - Before:
```python
# Handle both old and new datetime formats
if 'earliest_datetime_utc' in data and 'latest_datetime_utc' in data:
    # Parse UTC timestamps
    # Also populate old fields for backward compatibility
    data['earliest_date'] = earliest_datetime_utc.date().isoformat()
    data['earliest_hour'] = earliest_datetime_utc.time().isoformat()
    # ...
```

#### update_event - After:
```python
# Handle UTC datetime updates if provided
if 'earliest_datetime_utc' in data:
    earliest_datetime_utc = parse_utc_datetime(data.get("earliest_datetime_utc"))
    data['earliest_datetime_utc'] = earliest_datetime_utc.isoformat() if earliest_datetime_utc else None

if 'latest_datetime_utc' in data:
    latest_datetime_utc = parse_utc_datetime(data.get("latest_datetime_utc"))
    data['latest_datetime_utc'] = latest_datetime_utc.isoformat() if latest_datetime_utc else None
```

---

### 3. **backend/app/services/events.py**

#### Changes:
- **Removed old format validation**: Only validates UTC timestamps
- **Made UTC fields required**: Returns False if UTC fields missing

#### validate_event_data - Before:
```python
# Validate date range - support both old and new formats
# New format: earliest_datetime_utc, latest_datetime_utc
if event_data.get('earliest_datetime_utc') and event_data.get('latest_datetime_utc'):
    # Validate UTC format
elif event_data.get('earliest_date') and event_data.get('latest_date'):
    # Validate old format (backward compatibility)
```

#### validate_event_data - After:
```python
# Validate UTC datetime range (required)
if not event_data.get('earliest_datetime_utc') or not event_data.get('latest_datetime_utc'):
    print("Missing required fields: earliest_datetime_utc and latest_datetime_utc")
    return False

try:
    earliest = datetime.fromisoformat(event_data['earliest_datetime_utc'])
    latest = datetime.fromisoformat(event_data['latest_datetime_utc'])
    if earliest > latest:
        print("Invalid datetime range: earliest_datetime_utc must be before latest_datetime_utc")
        return False
except (ValueError, TypeError) as e:
    print(f"Invalid datetime format: {e}")
    return False
```

---

### 4. **backend/app/services/time_proposal.py**

#### Changes:
- **Updated to use UTC timestamps**: Now reads from `earliest_datetime_utc` and `latest_datetime_utc`
- **Updated AI prompt**: Shows UTC datetime range instead of separate date/time

#### _calculate_free_windows - Before:
```python
# Parse event constraints and ensure timezone-aware (UTC)
if event.get("earliest_date"):
    earliest_date = datetime.fromisoformat(event["earliest_date"])
    # ...

# Parse time constraints (hour:minute:second format)
earliest_hour_str = event.get("earliest_hour", "09:00:00")
latest_hour_str = event.get("latest_hour", "17:00:00")
```

#### _calculate_free_windows - After:
```python
# Parse event constraints from UTC timestamps
if event.get("earliest_datetime_utc"):
    earliest_datetime = datetime.fromisoformat(event["earliest_datetime_utc"])
    # ...

# Extract date range for iteration
earliest_date = earliest_datetime.replace(hour=0, minute=0, second=0, microsecond=0)
latest_date = latest_datetime.replace(hour=23, minute=59, second=59, microsecond=999999)

# Extract time constraints from UTC timestamps
earliest_hour_str = earliest_datetime.strftime("%H:%M:%S")
latest_hour_str = latest_datetime.strftime("%H:%M:%S")
```

#### AI Prompt - Before:
```python
- Date Range: {event.get('earliest_date', 'N/A')} to {event.get('latest_date', 'N/A')}
- Time Range: {event.get('earliest_hour', '09:00')} to {event.get('latest_hour', '17:00')} UTC
```

#### AI Prompt - After:
```python
- Date/Time Range: {earliest_dt} to {latest_dt} (UTC)
- Coordinator Timezone: {event.get('coordinator_timezone', 'UTC')}
```

---

## Impact Summary

| Component | Changes | Impact |
|-----------|---------|--------|
| **Event Model** | Required UTC fields, removed old fields | ✅ Cleaner model, enforces UTC |
| **Event Routes** | Removed old format support | ✅ Simpler code, UTC only |
| **Event Service** | Removed old format validation | ✅ Stronger validation |
| **Time Proposal** | Uses UTC timestamps | ✅ More accurate scheduling |

---

## Breaking Changes

⚠️ **These changes are breaking if migration 013 hasn't been applied:**

1. **Event Model**: `earliest_datetime_utc` and `latest_datetime_utc` are now **required** (not Optional)
2. **Create Event API**: Old format (separate date/time fields) is **no longer accepted**
3. **Update Event API**: Can only update UTC timestamp fields
4. **Event Validation**: Returns error if UTC timestamps are missing

---

## Migration Checklist

Before deploying these code changes:

- [x] Apply migration 010 (add UTC columns)
- [x] Apply migration 011 (migrate existing data)
- [x] Apply migration 012 (drop constraint)
- [ ] **Apply migration 013 (drop old columns)** ← **REQUIRED**
- [ ] Deploy backend code changes
- [ ] Verify all events have UTC timestamps
- [ ] Test event creation
- [ ] Test event editing
- [ ] Monitor logs for errors

---

## Testing

After deploying, verify:

1. **Create Event**:
   ```bash
   curl -X POST http://localhost:5000/api/events \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Event",
       "earliest_datetime_utc": "2025-12-25T14:00:00Z",
       "latest_datetime_utc": "2025-12-25T22:00:00Z",
       "coordinator_timezone": "America/New_York",
       "duration_minutes": 60
     }'
   ```

2. **Update Event**:
   ```bash
   curl -X PATCH http://localhost:5000/api/events/{event_uid} \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "earliest_datetime_utc": "2025-12-25T15:00:00Z",
       "latest_datetime_utc": "2025-12-25T23:00:00Z"
     }'
   ```

3. **Check Logs**:
   - Look for "[EVENT] Parsing UTC timestamp fields"
   - No references to old fields
   - No validation errors

---

## Rollback Plan

If issues occur:

1. **Rollback database**:
   ```bash
   psql -d your_database -f migrations/013_remove_old_datetime_columns_ROLLBACK.sql
   ```

2. **Revert code changes**:
   ```bash
   git revert <commit-hash>
   ```

3. **Redeploy previous version**

---

## Summary

All backend code has been successfully cleaned up to:
- ✅ Only use UTC timestamp fields
- ✅ Enforce required UTC timestamps
- ✅ Remove old format support
- ✅ Simplify validation logic
- ✅ Update AI prompts

The backend is now fully migrated to UTC-only datetime handling! 🎉
