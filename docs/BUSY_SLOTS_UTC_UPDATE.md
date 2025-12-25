# Busy Slots Routes - UTC Timestamp Update

Summary of changes to update busy_slots routes to use UTC timestamps instead of old date/time columns.

## Overview

After migration 013 removed the old `earliest_date` and `latest_date` columns, all busy_slots routes were failing because they were trying to access these non-existent columns. This update fixes all routes to use the new `earliest_datetime_utc` and `latest_datetime_utc` fields.

---

## Files Modified

### **backend/app/routes/busy_slots.py**

Updated 5 route functions to use UTC timestamps.

---

## Changes Made

### Pattern Replaced (All Routes)

#### Before (Broken):
```python
start_date = datetime.fromisoformat(event["earliest_date"])
latest_date = datetime.fromisoformat(event["latest_date"])
```

#### After (Fixed):
```python
# Extract datetime from UTC timestamps
earliest_utc = event["earliest_datetime_utc"].replace('Z', '+00:00')
latest_utc = event["latest_datetime_utc"].replace('Z', '+00:00')
start_date = datetime.fromisoformat(earliest_utc)
latest_date = datetime.fromisoformat(latest_utc)
```

**Why the `.replace('Z', '+00:00')`?**
- Python's `datetime.fromisoformat()` doesn't recognize 'Z' as UTC
- Need to convert 'Z' to '+00:00' for Python compatibility
- Both formats represent UTC timezone

---

## Updated Routes

### 1. **get_busy_slots** (lines 70-76)

**Route**: `GET /api/busy-slots/<event_id>`

**Purpose**: Get all busy slots for an event

**Changes**:
```python
# OLD (line 70-71)
start_date = datetime.fromisoformat(event["earliest_date"])
latest_date = datetime.fromisoformat(event["latest_date"])

# NEW (lines 70-74)
# Extract datetime from UTC timestamps
earliest_utc = event["earliest_datetime_utc"].replace('Z', '+00:00')
latest_utc = event["latest_datetime_utc"].replace('Z', '+00:00')
start_date = datetime.fromisoformat(earliest_utc)
latest_date = datetime.fromisoformat(latest_utc)
```

---

### 2. **get_user_busy_slots** (lines 112-118)

**Route**: `GET /api/busy-slots/user/<target_user_id>?event_id=<event_id>`

**Purpose**: Get a specific user's busy slots for an event

**Changes**:
```python
# OLD (lines 109-110)
start_date = datetime.fromisoformat(event["earliest_date"])
latest_date = datetime.fromisoformat(event["latest_date"])

# NEW (lines 112-116)
# Extract datetime from UTC timestamps
earliest_utc = event["earliest_datetime_utc"].replace('Z', '+00:00')
latest_utc = event["latest_datetime_utc"].replace('Z', '+00:00')
start_date = datetime.fromisoformat(earliest_utc)
latest_date = datetime.fromisoformat(latest_utc)
```

---

### 3. **delete_user_busy_slots** (lines 146-152)

**Route**: `DELETE /api/busy-slots/<event_id>/<target_user_id>`

**Purpose**: Delete all busy slots for a user in an event

**Changes**:
```python
# OLD (lines 146-147)
start_date = datetime.fromisoformat(event["earliest_date"])
latest_date = datetime.fromisoformat(event["latest_date"])

# NEW (lines 146-150)
# Extract datetime from UTC timestamps
earliest_utc = event["earliest_datetime_utc"].replace('Z', '+00:00')
latest_utc = event["latest_datetime_utc"].replace('Z', '+00:00')
start_date = datetime.fromisoformat(earliest_utc)
latest_date = datetime.fromisoformat(latest_utc)
```

---

### 4. **get_event_participants_busy_slots** (lines 221-232)

**Route**: `GET /api/busy-slots/event/<event_id>/participants`

**Purpose**: Get busy slots for all participants of an event

**Changes**:
```python
# OLD (lines 221-222)
start_date = datetime.fromisoformat(event["earliest_date"])
latest_date = datetime.fromisoformat(event["latest_date"])

# NEW (lines 221-225)
# Extract datetime from UTC timestamps
earliest_utc = event["earliest_datetime_utc"].replace('Z', '+00:00')
latest_utc = event["latest_datetime_utc"].replace('Z', '+00:00')
start_date = datetime.fromisoformat(earliest_utc)
latest_date = datetime.fromisoformat(latest_utc)
```

---

### 5. **get_merged_busy_slots_for_event** (lines 267-278)

**Route**: `GET /api/busy-slots/event/<event_id>/merged`

**Purpose**: Get merged busy time slots for all participants

**Changes**:
```python
# OLD (lines 264-265)
start_date = datetime.fromisoformat(event["earliest_date"])
latest_date = datetime.fromisoformat(event["latest_date"])

# NEW (lines 267-271)
# Extract datetime from UTC timestamps
earliest_utc = event["earliest_datetime_utc"].replace('Z', '+00:00')
latest_utc = event["latest_datetime_utc"].replace('Z', '+00:00')
start_date = datetime.fromisoformat(earliest_utc)
latest_date = datetime.fromisoformat(latest_utc)
```

---

## Event Data Structure

### Before (Old Format):
```python
event = {
    "id": "uuid",
    "uid": "abc123",
    "earliest_date": "2025-12-24",      # ❌ Removed
    "latest_date": "2025-12-25",        # ❌ Removed
    "earliest_hour": "09:00:00",        # ❌ Removed
    "latest_hour": "17:00:00"           # ❌ Removed
}
```

### After (UTC Format):
```python
event = {
    "id": "uuid",
    "uid": "abc123",
    "earliest_datetime_utc": "2025-12-24T14:00:00.000Z",  # ✅ UTC timestamp
    "latest_datetime_utc": "2025-12-25T22:00:00.000Z",    # ✅ UTC timestamp
    "coordinator_timezone": "America/New_York"            # ✅ Timezone info
}
```

---

## DateTime Conversion Flow

### Example: Event created in EST timezone

1. **User creates event**: 9:00 AM - 5:00 PM EST on Dec 24, 2025
2. **Frontend converts to UTC**: `2025-12-24T14:00:00.000Z` to `2025-12-24T22:00:00.000Z`
3. **Database stores**: UTC timestamps
4. **Backend retrieves event**: Gets UTC strings
5. **Busy slots routes process**:
   ```python
   # Input from database
   earliest_utc = "2025-12-24T14:00:00.000Z"

   # Convert Z to +00:00 for Python
   earliest_utc = "2025-12-24T14:00:00.000+00:00"

   # Parse to datetime object
   start_date = datetime.fromisoformat(earliest_utc)
   # Result: datetime(2025, 12, 24, 14, 0, 0, tzinfo=timezone.utc)
   ```

6. **Busy slots service uses datetime**: Works with timezone-aware datetime objects

---

## Service Layer

**File**: `backend/app/services/busy_slots.py`

✅ **No changes needed** - The service layer doesn't reference `earliest_date` or `latest_date`. It only receives `start_date` and `latest_date` as datetime objects from the routes.

---

## Testing

### 1. **Test Get Busy Slots**

```bash
curl -X GET http://localhost:5000/api/busy-slots/<event_id> \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Returns busy slots without errors

### 2. **Test Get User Busy Slots**

```bash
curl -X GET "http://localhost:5000/api/busy-slots/user/<user_id>?event_id=<event_id>" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Returns user's busy slots without errors

### 3. **Test Get Merged Busy Slots**

```bash
curl -X GET http://localhost:5000/api/busy-slots/event/<event_uid>/merged \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Returns merged busy slots with correct date range

### 4. **Check Backend Logs**

Look for:
```
[BUSY_SLOTS] Processing event with UTC timestamps
[BUSY_SLOTS] Start date: 2025-12-24 14:00:00+00:00
[BUSY_SLOTS] Latest date: 2025-12-24 22:00:00+00:00
```

---

## Error Handling

### Error: KeyError 'earliest_date'

**Cause**: Route trying to access old column that was dropped

**Solution**: ✅ Fixed by using `earliest_datetime_utc` instead

### Error: datetime.fromisoformat() doesn't recognize 'Z'

**Cause**: Python's `fromisoformat()` doesn't accept 'Z' suffix

**Solution**: ✅ Fixed by replacing 'Z' with '+00:00'

### Error: Event has no UTC timestamps

**Cause**: Old event created before migration

**Solution**: Run migration 011 to populate UTC fields from old data

---

## Compatibility

| Component | Compatibility |
|-----------|---------------|
| **Database** | Requires migration 013 (old columns dropped) |
| **Backend Routes** | ✅ Updated to use UTC timestamps |
| **Backend Services** | ✅ No changes needed (works with datetime objects) |
| **Frontend** | ✅ Already sending/receiving UTC timestamps |

---

## Migration Dependencies

This update requires:
- ✅ Migration 010: Added UTC timestamp columns
- ✅ Migration 011: Migrated existing data to UTC
- ✅ Migration 012: Dropped hour order constraint
- ✅ Migration 013: Dropped old date/time columns

---

## Summary

All 5 busy_slots route functions have been updated to:
- ✅ Use `earliest_datetime_utc` and `latest_datetime_utc`
- ✅ Handle 'Z' suffix in UTC timestamps
- ✅ Convert to timezone-aware datetime objects
- ✅ Maintain backward compatibility with existing service layer

The busy_slots routes now work correctly with the new UTC timestamp schema! 🎉
