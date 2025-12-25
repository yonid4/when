# DateTime Conversion Flow - EditEventModal

Complete explanation of how datetime conversion works in EditEventModal.

## Overview

The EditEventModal correctly converts between UTC timestamps (stored in database) and local datetime values (displayed to user). This document explains the complete flow.

---

## Timezone Utility Functions

Located in: `frontend/src/utils/timezoneUtils.js`

### `utcToLocalDatetimeInput(utcDatetimeStr)`

Converts UTC ISO string to local datetime-local input format.

**Input**: `"2025-12-24T19:00:00.000Z"` (UTC)
**Output**: `"2025-12-24T14:00"` (EST, for datetime-local input)

**How it works**:
```javascript
const date = new Date(utcDatetimeStr);
const localIso = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 16);
return localIso;
```

1. Parse UTC string to Date object
2. Adjust for timezone offset to get local time
3. Convert to ISO string and trim to "YYYY-MM-DDTHH:mm" format

---

### `localDatetimeInputToUtc(localDatetimeStr)`

Converts local datetime-local input to UTC ISO string.

**Input**: `"2025-12-24T14:00"` (local EST)
**Output**: `"2025-12-24T19:00:00.000Z"` (UTC)

**How it works**:
```javascript
const date = new Date(localDatetimeStr);
return date.toISOString();
```

1. Parse local datetime string to Date object (browser interprets as local time)
2. Call `.toISOString()` to get proper ISO 8601 format with 'Z' suffix

✅ This is the key function that ensures proper UTC ISO format!

---

## EditEventModal Flow

### 1. Loading Event (UTC → Local)

**File**: `frontend/src/components/event/EditEventModal.jsx` (lines 56-74)

```javascript
useEffect(() => {
  if (event) {
    setFormData({
      name: event.name || "",
      description: event.description || "",
      // Convert UTC timestamps to local datetime-local format
      earliest_datetime_utc: event.earliest_datetime_utc
        ? utcToLocalDatetimeInput(event.earliest_datetime_utc)
        : "",
      latest_datetime_utc: event.latest_datetime_utc
        ? utcToLocalDatetimeInput(event.latest_datetime_utc)
        : "",
      // ...other fields
    });
  }
}, [event]);
```

**Example**:
- Event from database: `earliest_datetime_utc: "2025-12-24T19:00:00.000Z"`
- Converted for form: `earliest_datetime_utc: "2025-12-24T14:00"` (EST)
- Displayed in input: User sees "Dec 24, 2025 2:00 PM" in their local timezone

---

### 2. User Edits Time

The datetime-local input stores the value in format: `"YYYY-MM-DDTHH:mm"`

**Example**: User changes time to 3:00 PM EST
- Form value: `"2025-12-24T15:00"`

---

### 3. Saving (Local → UTC)

**File**: `frontend/src/components/event/EditEventModal.jsx` (lines 153-169)

```javascript
if (formData.earliest_datetime_utc !== originalEarliestLocal) {
  const utcValue = localDatetimeInputToUtc(formData.earliest_datetime_utc);
  console.log(`[EDIT_EVENT] Earliest changed:`);
  console.log(`  Local input: ${formData.earliest_datetime_utc}`);
  console.log(`  Converted UTC: ${utcValue}`);
  console.log(`  UTC type: ${typeof utcValue}, includes Z: ${utcValue?.includes?.('Z')}`);
  updateData.earliest_datetime_utc = utcValue;
}
```

**Example**:
- Form value: `"2025-12-24T15:00"` (local EST)
- Converted to UTC: `"2025-12-24T20:00:00.000Z"`
- Sent to API: `{earliest_datetime_utc: "2025-12-24T20:00:00.000Z"}`

---

## Backend Processing

**File**: `backend/app/routes/events.py` (lines 293-301)

```python
if 'earliest_datetime_utc' in data:
    logging.info("[EVENT] Updating earliest_datetime_utc")
    earliest_datetime_utc = parse_utc_datetime(data.get("earliest_datetime_utc"))
    data['earliest_datetime_utc'] = earliest_datetime_utc.isoformat() if earliest_datetime_utc else None
```

**parse_utc_datetime function** (lines 49-60):
```python
def parse_utc_datetime(datetime_str):
    """Parse ISO format datetime string to datetime object"""
    if not datetime_str:
        return None
    try:
        # Remove 'Z' and add '+00:00' if present
        if datetime_str.endswith('Z'):
            datetime_str = datetime_str[:-1] + '+00:00'
        return datetime.fromisoformat(datetime_str)
    except ValueError as e:
        logging.error(f"[EVENT] Error parsing datetime {datetime_str}: {e}")
        raise ValueError(f"Invalid datetime format: {datetime_str}")
```

**Processing**:
1. Receives: `"2025-12-24T20:00:00.000Z"` (or `.000+00:00`)
2. Converts 'Z' to '+00:00' for Python compatibility
3. Parses to datetime object
4. Stores in PostgreSQL TIMESTAMPTZ column

---

## Complete Example Flow

### Scenario: User in EST edits event time from 2:00 PM to 3:00 PM

#### Step 1: Load Event
```
Database:     "2025-12-24T19:00:00.000Z" (UTC)
        ↓ utcToLocalDatetimeInput()
Form Input:   "2025-12-24T14:00" (EST - shown as 2:00 PM)
```

#### Step 2: User Changes Time
```
User sees:    "Dec 24, 2025 2:00 PM"
User changes: "Dec 24, 2025 3:00 PM"
Form value:   "2025-12-24T15:00"
```

#### Step 3: Save Changes
```
Form Input:   "2025-12-24T15:00" (EST)
        ↓ localDatetimeInputToUtc()
UTC String:   "2025-12-24T20:00:00.000Z"
        ↓ API Call
Backend:      Parses to datetime object
        ↓ Store in DB
Database:     "2025-12-24T20:00:00.000Z" (TIMESTAMPTZ)
```

#### Step 4: Verification
```
Database:     "2025-12-24T20:00:00.000Z"
        ↓ User in PST views event
Display:      "Dec 24, 2025 12:00 PM" (PST)
        ↓ User in EST views event
Display:      "Dec 24, 2025 3:00 PM" (EST)
```

✅ Both users see the **same moment in time**, just in their local timezone!

---

## Debugging

### Console Logs to Check

When saving an event edit, you should see:

```javascript
[EDIT_EVENT] Updating event abc123: {earliest_datetime_utc: "2025-12-24T15:00", ...}
[EDIT_EVENT] User timezone: America/New_York
[EDIT_EVENT] Earliest changed:
  Local input: 2025-12-24T15:00
  Converted UTC: 2025-12-24T20:00:00.000Z
  UTC type: string, includes Z: true
[EDIT_EVENT] Sending update: {earliest_datetime_utc: "2025-12-24T20:00:00.000Z", ...}
```

### Backend Logs

```
[EVENT] Updating earliest_datetime_utc
[EVENT] Parsed datetime: 2025-12-24 20:00:00+00:00
```

---

## Common Issues

### Issue 1: "Z" suffix missing

**Symptom**: Backend receives `"2025-12-24T15:00"` without timezone indicator

**Cause**: Not calling `.toISOString()` on the Date object

**Fix**: Ensure `localDatetimeInputToUtc()` is used (it calls `.toISOString()`)

### Issue 2: Times off by timezone offset

**Symptom**: Times appear 5 hours off (or other offset)

**Cause**: Sending local datetime string directly without UTC conversion

**Fix**: Always convert through `localDatetimeInputToUtc()` before sending to API

### Issue 3: Backend parsing error

**Symptom**: `"Invalid datetime format"` error in backend

**Cause**: Backend can't parse the datetime string

**Solution**: Backend's `parse_utc_datetime()` handles both 'Z' and '+00:00' formats

---

## Format Reference

### ISO 8601 Datetime Formats

| Format | Example | Used By |
|--------|---------|---------|
| UTC with Z | `"2025-12-24T19:00:00.000Z"` | JavaScript `.toISOString()`, Database |
| UTC with offset | `"2025-12-24T19:00:00.000+00:00"` | Python `datetime.isoformat()` |
| datetime-local | `"2025-12-24T14:00"` | HTML5 input type="datetime-local" |
| Local ISO | `"2025-12-24T14:00:00-05:00"` | Full local datetime with timezone |

---

## Summary

The EditEventModal correctly implements UTC ↔ Local timezone conversion:

✅ **Loading**: Converts UTC timestamps to local datetime for display
✅ **Editing**: User edits in their local timezone
✅ **Saving**: Converts local datetime back to UTC ISO string with `.toISOString()`
✅ **Backend**: Parses UTC ISO string and stores in TIMESTAMPTZ column
✅ **Display**: All users see times in their own timezone

The key is the `localDatetimeInputToUtc()` function which ensures `.toISOString()` is called, producing the proper `"YYYY-MM-DDTHH:mm:ss.sssZ"` format that the backend expects.
