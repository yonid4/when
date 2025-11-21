# Notification Inbox - Quick Reference

**Status**: ✅ COMPLETED | **Date**: November 15, 2025

---

## 🚀 Quick Start

### 1. Run Migration
```sql
-- In Supabase SQL Editor
-- Copy/paste: migrations/003_create_notifications_table.sql
```

### 2. Restart Backend
```bash
cd backend
flask run
```

### 3. Test Flow
1. Finalize an event as coordinator
2. Log in as participant in another browser
3. Check bell icon in header
4. Verify red badge appears
5. Click bell to see notification

---

## 📁 Files Created

### Backend (4 new files)
1. `migrations/003_create_notifications_table.sql` - DB schema
2. `backend/app/models/notification.py` - Pydantic model
3. `backend/app/services/notifications.py` - Service layer (240 lines)
4. `backend/app/routes/notifications.py` - API routes (170 lines)

### Frontend (3 new files)
1. `frontend/src/services/notificationsService.js` - API client (65 lines)
2. `frontend/src/components/notifications/NotificationBell.jsx` - Bell component (175 lines)
3. `frontend/src/components/notifications/NotificationItem.jsx` - Item component (190 lines)

### Modified (4 files)
1. `backend/app/__init__.py` - Registered blueprint
2. `backend/app/models/__init__.py` - Added Notification
3. `backend/app/services/event_finalization.py` - Creates notifications
4. `frontend/src/layout.js` - Integrated bell in header

---

## 🎯 API Endpoints

### Get Notifications
```http
GET /api/notifications?unread_only=false&limit=50
Authorization: Bearer {token}

→ 200 OK
{
  "notifications": [...],
  "unread_count": 3
}
```

### Get Unread Count
```http
GET /api/notifications/unread-count
Authorization: Bearer {token}

→ 200 OK { "unread_count": 3 }
```

### Mark as Read
```http
POST /api/notifications/{id}/read
Authorization: Bearer {token}

→ 200 OK { "success": true }
```

### Mark All as Read
```http
POST /api/notifications/read-all
Authorization: Bearer {token}

→ 200 OK { "success": true }
```

### Handle Action
```http
POST /api/notifications/{id}/action
Authorization: Bearer {token}

{"action": "accept" | "decline"}

→ 200 OK
{
  "success": true,
  "action": "accept",
  "message": "Invitation accepted successfully"
}
```

### Delete Notification
```http
DELETE /api/notifications/{id}
Authorization: Bearer {token}

→ 200 OK { "success": true }
```

---

## 🗄️ Database Schema

### Table: notifications
```sql
id UUID PRIMARY KEY
user_id UUID → profiles(id) CASCADE
event_id UUID → events(id) CASCADE
notification_type VARCHAR(50)
  -- 'event_invitation', 'event_finalized', 
  -- 'event_deleted', 'event_time_changed'
title TEXT
message TEXT
is_read BOOLEAN DEFAULT FALSE
action_taken BOOLEAN DEFAULT FALSE
action_type VARCHAR(50) -- 'accept', 'decline', null
metadata JSONB
created_at TIMESTAMP WITH TIME ZONE
read_at TIMESTAMP WITH TIME ZONE
action_at TIMESTAMP WITH TIME ZONE
```

### Indexes
- `idx_notifications_user_id` ON (user_id)
- `idx_notifications_user_unread` ON (user_id, is_read) WHERE is_read = FALSE
- `idx_notifications_created_at` ON (created_at DESC)
- `idx_notifications_event_id` ON (event_id)

---

## 🎨 UI Components

### NotificationBell
**Location:** Header (right side, left of logout button)
**Props:** `currentUserId`
**Features:**
- 🔔 White bell icon
- 🔴 Red badge (count 1-9, "9+" for 10+)
- 📦 Popover (400px × max 600px)
- ⚡ Real-time updates (Supabase)
- 🔄 Polling fallback (30s)
- ✅ "Mark all read" button
- 💫 Loading spinner
- 📭 Empty state

### NotificationItem
**Features:**
- 📬 Type icon (📬📮✅❌🔄)
- 🎨 Blue bg if unread, white if read
- ⏰ Relative time ("5 min ago")
- 🎯 Accept/Decline buttons (invitations)
- 🔗 Google Calendar link (finalized)
- ✓ Action taken indicator
- ❌ Delete button (X)

---

## 🔔 Notification Types

### Currently Implemented

**Event Finalized** ✅
```javascript
{
  type: "event_finalized",
  title: "Event Finalized: Team Meeting",
  message: "The event 'Team Meeting' has been scheduled...",
  metadata: {
    finalized_time: "Friday, Nov 15, 2025 at 2:00 PM UTC",
    google_calendar_link: "https://calendar.google.com/..."
  }
}
```

**Icon:** ✅  
**Display:** Title, message, time, Google Calendar link  
**Created:** After event finalization  
**Recipients:** All participants except coordinator

### Future Types

- **Event Invitation** 📬 - User invited to event
- **Event Deleted** ❌ - Event cancelled
- **Event Time Changed** 🔄 - Time modified

---

## ⚡ Real-Time Updates

### Supabase Subscription
```javascript
supabase
  .channel("user-notifications")
  .on("postgres_changes", {
    event: "INSERT|UPDATE|DELETE",
    schema: "public",
    table: "notifications",
    filter: `user_id=eq.${currentUserId}`
  }, () => {
    fetchNotifications();
  })
  .subscribe();
```

**Events Tracked:**
- INSERT - New notification
- UPDATE - Marked as read
- DELETE - Notification deleted

**Behavior:**
- Instant updates (no refresh needed)
- Badge updates automatically
- Notification list refreshes

**Fallback:** Polling every 30 seconds

---

## 🎬 User Workflows

### 1. Receive Notification
1. Event finalized by coordinator
2. Notification created in database
3. Real-time subscription triggers
4. Red badge appears on bell
5. User clicks bell
6. Popover opens with notification
7. User reads notification
8. Clicks "View in Google Calendar"

### 2. Mark as Read
1. Click bell icon
2. Click on notification body
3. Background changes white
4. Badge count decreases
5. Close popover
6. Reopen - still marked as read

### 3. Mark All as Read
1. Click bell (multiple unread)
2. Click "Mark all read" button
3. All notifications turn white
4. Badge disappears

### 4. Delete Notification
1. Click bell icon
2. Hover over notification
3. X button appears on right
4. Click X button
5. Notification removed
6. Badge updates if unread

---

## 🧪 Testing Checklist

### Database
- [ ] Migration runs successfully
- [ ] Notifications table created
- [ ] Indexes created
- [ ] RLS policies active
- [ ] Check constraints working

### Backend
- [ ] GET /api/notifications returns data
- [ ] GET /api/notifications/unread-count works
- [ ] POST mark as read works
- [ ] POST mark all as read works
- [ ] POST action handler works
- [ ] DELETE notification works
- [ ] JWT authentication enforced

### Frontend
- [ ] Bell icon appears in header
- [ ] Badge shows correct count
- [ ] Clicking bell opens popover
- [ ] Notifications display correctly
- [ ] Empty state shows when no notifications
- [ ] Loading state shows during fetch
- [ ] Mark as read changes background
- [ ] Mark all read button works
- [ ] Delete button works
- [ ] Google Calendar link opens

### Integration
- [ ] Finalize event creates notification
- [ ] Notification appears for participants
- [ ] Notification NOT sent to coordinator
- [ ] Real-time update works
- [ ] Badge updates instantly
- [ ] Multiple tabs sync correctly

### Real-Time
- [ ] New notification appears instantly
- [ ] Updates without page refresh
- [ ] Badge updates in real-time
- [ ] Polling works if real-time fails
- [ ] Subscription reconnects on disconnect

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Bell not showing | Check `isAuthenticated` and `currentUserId` |
| Badge not updating | Check Supabase subscription, verify polling |
| Notifications not appearing | Check RLS policies, verify user_id |
| Real-time not working | Check Supabase connection status |
| Link broken | Verify `google_calendar_html_link` in metadata |
| Delete not working | Check RLS policy for DELETE |
| Accept/Decline error | Verify event exists, check participants table |

---

## 📊 Backend Service Methods

### NotificationsService
```python
# CRUD Operations
create_notification(user_id, type, title, message, event_id, metadata)
get_user_notifications(user_id, unread_only, limit)
get_unread_count(user_id)
mark_as_read(notification_id, user_id)
mark_all_as_read(user_id)
record_action(notification_id, user_id, action_type)
delete_notification(notification_id, user_id)
get_notification(notification_id, user_id)

# Helper Methods
create_event_invitation_notification(...)
create_event_finalized_notification(...)
create_event_deleted_notification(...)
```

---

## 🔧 Frontend Service Methods

### notificationsService.js
```javascript
getNotifications(unreadOnly, limit)  // → {notifications, unread_count}
getUnreadCount()                      // → number
markAsRead(notificationId)            // → {success}
markAllAsRead()                       // → {success}
handleNotificationAction(id, action)  // → {success, action, message}
deleteNotification(notificationId)    // → {success}
```

---

## 💡 Pro Tips

1. **Badge Color** - Red for urgency, matches theme
2. **Icon Choice** - Emojis for quick visual recognition
3. **Time Format** - Relative ("5 min ago") for context
4. **Link Style** - Blue underline for Google Calendar
5. **Empty State** - Positive message ("You're all caught up!")
6. **Loading State** - Spinner prevents confusion
7. **Real-Time** - Instant updates improve UX
8. **Polling Fallback** - Ensures reliability
9. **Mark as Read** - Single click on notification body
10. **Delete Confirmation** - No confirmation (undo future feature)

---

## 📚 Documentation References

- Full details: `NOTIFICATIONS_SUMMARY.md`
- Implementation plan: `IMPLEMENTATION_PLAN.md` (Task 3.5)
- Database migration: `migrations/003_create_notifications_table.sql`
- API routes: `backend/app/routes/notifications.py`
- Service layer: `backend/app/services/notifications.py`

---

## ✨ What's Next?

**Task 4**: Auto-Refresh Calendar Data
- Background refresh when users join
- 30-minute caching
- Token expiry handling
- Refresh button for coordinators

---

**Notification Inbox is COMPLETE and ready for testing! 🎉**


