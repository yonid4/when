# Task 1 Quick Reference Card

## 🚀 Quick Start

```bash
# 1. Run migration in Supabase SQL Editor
# Copy/paste: migrations/001_create_preferred_slots_table.sql

# 2. Test the API
curl -X POST http://localhost:5000/api/events/YOUR_EVENT_ID/preferred-slots \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"start_time_utc":"2025-11-10T14:00:00Z","end_time_utc":"2025-11-10T15:30:00Z"}'
```

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/events/<event_id>/preferred-slots` | ✅ | Add preferred slot |
| GET | `/api/events/<event_id>/preferred-slots` | ✅ | Get all slots |
| DELETE | `/api/events/<event_id>/preferred-slots/<slot_id>` | ✅ | Delete slot |

## 📦 Request/Response Examples

### POST - Add Slot
```json
// Request
{
  "start_time_utc": "2025-11-10T14:00:00Z",
  "end_time_utc": "2025-11-10T15:30:00Z"
}

// Response (201)
{
  "id": "uuid",
  "user_id": "uuid",
  "event_id": "uuid",
  "start_time_utc": "2025-11-10T14:00:00Z",
  "end_time_utc": "2025-11-10T15:30:00Z",
  "created_at": "2025-11-07T10:30:00Z"
}
```

### GET - Get All Slots
```json
// Response (200)
{
  "slots": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "event_id": "uuid",
      "start_time_utc": "2025-11-10T14:00:00Z",
      "end_time_utc": "2025-11-10T15:30:00Z",
      "created_at": "2025-11-07T10:30:00Z"
    }
  ]
}
```

### DELETE - Remove Slot
```json
// Response (200)
{
  "message": "Slot deleted successfully"
}
```

## 🔒 HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | GET, DELETE success |
| 201 | Created | POST success |
| 400 | Bad Request | Invalid data, finalized event |
| 401 | Unauthorized | No/invalid token |
| 403 | Forbidden | Not participant, not owner |
| 404 | Not Found | Event/slot doesn't exist |

## 🎯 Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Missing required fields" | No start/end time | Include both timestamps |
| "Not authorized" | Not event participant | Join event first |
| "Event finalized" | Trying to add to finalized event | Can't modify finalized events |
| "Slot not found" | Invalid slot_id | Check slot exists |
| "You can only delete your own" | Trying to delete others' slots | Only delete your own |

## 🗄️ Database Queries

```sql
-- View all slots
SELECT * FROM preferred_slots;

-- View slots with user info
SELECT ps.*, p.full_name 
FROM preferred_slots ps
JOIN profiles p ON ps.user_id = p.id;

-- Check RLS policies
SELECT policyname FROM pg_policies 
WHERE tablename = 'preferred_slots';

-- Delete all slots for an event (cleanup)
DELETE FROM preferred_slots 
WHERE event_id = 'YOUR_EVENT_UUID';
```

## 🧪 Testing Checklist

- [ ] Migration ran successfully
- [ ] Can add a slot (POST)
- [ ] Can see all slots (GET)
- [ ] Can delete own slot (DELETE)
- [ ] Cannot delete others' slots (403)
- [ ] Overlapping slots merge correctly
- [ ] Invalid times rejected (400)
- [ ] Non-participants blocked (403)

## 🔧 Overlap Scenarios

```
1. No overlap:     [2-3] + [4-5] = [2-3][4-5]
2. Partial:        [2-4] + [3-5] = [2-5]
3. Encompass:      [2-4] + [1-5] = [1-5]
4. Inside:         [1-5] + [2-3] = [1-5]
5. Multiple:       [2-3][4-5] + [2:30-4:30] = [2-5]
```

## 📁 File Locations

```
migrations/
  ├── 001_create_preferred_slots_table.sql   ← Run this first
  ├── README.md                              ← Migration docs
  └── TESTING_GUIDE.md                       ← Detailed tests

backend/app/
  ├── models/preferred_slot.py               ← Data model
  ├── services/preferred_slots.py            ← Business logic
  └── routes/preferred_slots.py              ← API endpoints
```

## 💾 Backup/Rollback

```sql
-- Backup before migration
pg_dump -t preferred_slots > backup.sql

-- Rollback (if needed)
DROP TABLE IF EXISTS preferred_slots CASCADE;
```

## 🐛 Debug Commands

```bash
# Check if table exists
psql> \dt preferred_slots

# View table structure
psql> \d preferred_slots

# Test RLS as user
psql> SET ROLE authenticated;
psql> SELECT * FROM preferred_slots;
```

## ⚡ Performance Notes

- Indexes on `(user_id, event_id)` and `event_id`
- Overlap check: O(n) where n = user's existing slots
- Typical: n < 10, so very fast
- RLS policies add minimal overhead

## 🎨 Frontend Integration (Future)

```javascript
// Example fetch
const response = await fetch(
  `/api/events/${eventId}/preferred-slots`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      start_time_utc: '2025-11-10T14:00:00Z',
      end_time_utc: '2025-11-10T15:30:00Z'
    })
  }
);

const slot = await response.json();
```

## 📞 Support

- **Testing Guide**: See `migrations/TESTING_GUIDE.md`
- **Full Summary**: See `TASK1_SUMMARY.md`
- **Implementation Plan**: See `IMPLEMENTATION_PLAN.md`



