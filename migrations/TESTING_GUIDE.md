# Testing Guide for Preferred Slots API

This guide provides instructions for testing the preferred slots functionality.

## Prerequisites

1. Database migration has been run successfully
2. Backend server is running
3. You have a valid authentication token
4. You have created an event and joined as a participant

## API Endpoints to Test

### 1. Add Preferred Slot (POST)

**Endpoint**: `POST /api/events/<event_id>/preferred-slots`

**Headers**:
```
Authorization: Bearer <your_token>
Content-Type: application/json
```

**Body**:
```json
{
  "start_time_utc": "2025-11-10T14:00:00Z",
  "end_time_utc": "2025-11-10T15:30:00Z"
}
```

**Expected Response (201)**:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "event_id": "uuid",
  "start_time_utc": "2025-11-10T14:00:00Z",
  "end_time_utc": "2025-11-10T15:30:00Z",
  "created_at": "2025-11-07T..."
}
```

**Test Scenarios**:
- ✅ Add a new slot with no existing slots
- ✅ Add a slot that overlaps with existing slot (should merge)
- ✅ Add a slot that's completely inside an existing slot (should keep existing)
- ✅ Add a slot that encompasses multiple existing slots (should merge all)
- ❌ Add a slot with end_time before start_time (should return 400)
- ❌ Add a slot without authentication (should return 401)
- ❌ Add a slot to an event you're not participating in (should return 403)
- ❌ Add a slot to a finalized event (should return 400)

### 2. Get All Preferred Slots (GET)

**Endpoint**: `GET /api/events/<event_id>/preferred-slots`

**Headers**:
```
Authorization: Bearer <your_token>
```

**Expected Response (200)**:
```json
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
      "created_at": "2025-11-07T..."
    }
  ]
}
```

**Test Scenarios**:
- ✅ Get all slots for an event with multiple participants
- ✅ Verify user names are included in response
- ❌ Try to get slots without authentication (should return 401)
- ❌ Try to get slots for an event you're not participating in (should return 403)

### 3. Delete Preferred Slot (DELETE)

**Endpoint**: `DELETE /api/events/<event_id>/preferred-slots/<slot_id>`

**Headers**:
```
Authorization: Bearer <your_token>
```

**Expected Response (200)**:
```json
{
  "message": "Slot deleted successfully"
}
```

**Test Scenarios**:
- ✅ Delete your own slot successfully
- ❌ Try to delete another user's slot (should return 403)
- ❌ Try to delete a non-existent slot (should return 404)
- ❌ Try to delete without authentication (should return 401)

## Testing with cURL

### Add a slot
```bash
curl -X POST http://localhost:5000/api/events/YOUR_EVENT_ID/preferred-slots \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "start_time_utc": "2025-11-10T14:00:00Z",
    "end_time_utc": "2025-11-10T15:30:00Z"
  }'
```

### Get all slots
```bash
curl -X GET http://localhost:5000/api/events/YOUR_EVENT_ID/preferred-slots \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Delete a slot
```bash
curl -X DELETE http://localhost:5000/api/events/YOUR_EVENT_ID/preferred-slots/SLOT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing with Postman

1. **Import the collection** (create one with the endpoints above)
2. **Set environment variables**:
   - `base_url`: http://localhost:5000
   - `token`: Your Supabase auth token
   - `event_id`: Your test event ID
3. **Run the collection** and verify all tests pass

## Overlap Testing Scenarios

Test these specific scenarios to verify overlap handling:

### Scenario 1: No Overlap
```
Existing: None
New: 2PM-3PM
Result: 2PM-3PM
```

### Scenario 2: Partial Overlap
```
Existing: 2PM-4PM
New: 3PM-5PM
Result: 2PM-5PM (merged)
```

### Scenario 3: Complete Encompass
```
Existing: 2PM-4PM
New: 1PM-5PM
Result: 1PM-5PM
```

### Scenario 4: New Inside Existing
```
Existing: 1PM-5PM
New: 2PM-3PM
Result: 1PM-5PM (no change)
```

### Scenario 5: Multiple Overlaps
```
Existing: 2PM-3PM, 4PM-5PM
New: 2:30PM-4:30PM
Result: 2PM-5PM (all merged into one)
```

## Database Verification

Check the database directly to verify:

```sql
-- View all preferred slots
SELECT * FROM preferred_slots;

-- View slots with user info
SELECT ps.*, p.full_name, p.email_address 
FROM preferred_slots ps
JOIN profiles p ON ps.user_id = p.id;

-- Verify RLS policies are active
SELECT tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'preferred_slots';

-- Check for overlapping slots (should be none for same user/event)
SELECT ps1.*, ps2.*
FROM preferred_slots ps1
JOIN preferred_slots ps2 
  ON ps1.user_id = ps2.user_id 
  AND ps1.event_id = ps2.event_id
  AND ps1.id < ps2.id
WHERE ps1.start_time_utc < ps2.end_time_utc 
  AND ps1.end_time_utc > ps2.start_time_utc;
```

## Expected Results Summary

✅ **All endpoints should:**
- Require authentication (return 401 without token)
- Enforce participant-only access (return 403 for non-participants)
- Validate input data (return 400 for invalid data)
- Handle overlaps correctly (merge overlapping slots)

✅ **Row Level Security should:**
- Prevent users from viewing slots for events they're not in
- Prevent users from deleting other users' slots
- Allow users to view all slots for their events
- Allow users to delete only their own slots

✅ **Database should:**
- Cascade delete when users or events are deleted
- Enforce time range constraints (end > start)
- Have proper indexes for performance
- Maintain data integrity with foreign keys





