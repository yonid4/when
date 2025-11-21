# Task 2 Quick Reference Card

## 🚀 Quick Test

```bash
# 1. Start backend (ensure Task 1 migration is applied)
cd backend && source venv/bin/activate && python run_locally.py

# 2. Start frontend
cd frontend && npm start

# 3. Test dragging
# - Drag 30+ minutes on same day → Popup appears
# - Confirm → Blue slot persists
# - Click slot → Delete option appears
```

## 🎨 Color Codes

| Type | Color | Use Case |
|------|-------|----------|
| 🔵 Blue (#60A5FA) | Your preferred slots | Own selections |
| 🟣 Purple (#A78BFA) | Others' preferred slots | Other participants |
| 🟢 Green (#34D399) | Coordinator's preferred slots | Coordinator selections |
| 🟢 Dark Green (#10B981) | Finalized event | Task 3 - Final time |
| ⚫ Dark Gray (#2b2b2b) | Busy times | Google Calendar conflicts |

## ✅ Validation Rules

| Rule | Check | Error Message |
|------|-------|---------------|
| Min Duration | ≥ 30 minutes | "Minimum slot duration is 30 minutes" |
| Same Day | Start & end on same day | "Time slots must be within the same day" |
| Not Finalized | Event status ≠ finalized | "Cannot add slots to a finalized event" |

## 🔄 User Flows

### Participant Flow
```
Drag → Validation → Popup → Confirm → API Call → Blue Slot Appears
                  ↓
                Cancel → Popup Closes
```

### Coordinator Flow
```
Drag → Validation → Two-Option Popup
                  ↓
        "Add as my preferred time" → Same as participant (Green slot)
                  ↓
        "Finalize event at this time" → Placeholder toast (Task 3)
                  ↓
                Cancel → Popup Closes
```

### Delete Flow
```
Click Own Slot → Detail Popup → Delete Button → Confirmation Dialog → Delete API → Slot Disappears
```

### View Flow
```
Click Others' Slot → Detail Popup (Read-only) → Close
```

## 📦 Components Created

| File | Purpose |
|------|---------|
| `preferredSlotsService.js` | API calls (GET, POST, DELETE) |
| `ParticipantSlotPopup.jsx` | Confirm adding preferred time |
| `CoordinatorSlotPopup.jsx` | Two options (add/finalize) |
| `SlotDetailPopup.jsx` | View/delete existing slots |

## 🔧 Key Functions

```javascript
// In EventPage.jsx

handleSelectSlot(slotInfo)     // Validates & shows popup
handleSelectEvent(event)       // Shows detail popup for clicks
handleAddPreferredSlot(slotInfo)    // API: Add slot
handleDeletePreferredSlot(slotId)   // API: Delete slot
```

## 🎯 Real-time Features

**Supabase Channel:**
- Table: `preferred_slots`
- Events: INSERT, UPDATE, DELETE
- Filter: `event_id=eq.{eventId}`

**What Syncs:**
- ✅ User A adds slot → User B sees it
- ✅ User A deletes slot → User B sees removal
- ✅ No page refresh needed

## 🧪 Quick Tests

```bash
# Test 1: Valid Drag
Drag 30+ min, same day → Should show popup ✅

# Test 2: Short Duration
Drag < 30 min → Error toast ✅

# Test 3: Overnight
Drag 11 PM to 1 AM next day → Error toast ✅

# Test 4: Add & Persist
Confirm slot → Blue slot appears → Reload page → Still there ✅

# Test 5: Delete
Click blue slot → Delete → Confirm → Slot disappears ✅

# Test 6: Read-only
Click purple slot → No delete button ✅

# Test 7: Real-time
Two browsers → Add in A → Appears in B ✅
```

## 📊 Calendar Event Types

```javascript
// event.type values
"busy"                    // Google Calendar busy times
"preferred-self"          // User's own preferred slots
"preferred-other"         // Other participants' slots
"preferred-coordinator"   // Coordinator's slots
"finalized"              // Final selected time (Task 3)
```

## 🎨 CSS Classes

```css
.busy-time-event              /* Dark gray, 0.6 opacity */
.preferred-self-event         /* Blue, 0.8 opacity */
.preferred-other-event        /* Purple, 0.7 opacity */
.preferred-coordinator-event  /* Green, 0.8 opacity */
.finalized-event             /* Solid green, 1.0 opacity */
.rbc-slot-selection          /* Dashed blue during drag */
```

## 📝 State Variables (EventPage.jsx)

```javascript
// Preferred slots
preferredSlots              // Array of slot objects
preferredSlotsLoading       // Loading state

// Popups
selectedSlot                // Currently selected slot info
showParticipantPopup        // Show/hide participant popup
showCoordinatorPopup        // Show/hide coordinator popup
selectedEvent               // Currently clicked event
showSlotDetailPopup         // Show/hide detail popup

// User
currentUser                 // Current user object (id, name, email)
```

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Popup not appearing | Check console - validation error? |
| Slot not persisting | Verify Task 1 backend running |
| Real-time not working | Check Supabase credentials |
| Wrong colors | Verify CSS imported, check className |
| Coordinator popup not showing | Check `isCoordinator` variable (line 260) |

## ⚙️ Configuration

**Coordinator Detection (EventPage.jsx line 260):**
```javascript
const isCoordinator = true; // TODO: Replace with actual check
// Should be: currentUser.id === eventData.coordinator_id
```

**Real-time Subscription (EventPage.jsx line 411):**
```javascript
useEffect(() => {
  if (!eventData?.id) return;
  
  const channel = supabase
    .channel(`event-${eventData.id}-slots`)
    .on("postgres_changes", { /* ... */ })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [eventData?.id, eventUid]);
```

## 🎁 Bonus Features

- ✨ Hover effects on all slots
- ✨ Smooth transitions (0.2s)
- ✨ Loading indicators during API calls
- ✨ Success/error toasts for all actions
- ✨ Confirmation dialog for deletions
- ✨ Optimistic UI updates

## 📞 Support

- **Full Summary**: See `TASK2_SUMMARY.md`
- **Implementation Details**: See `IMPLEMENTATION_PLAN.md` (Task 2 section)
- **Backend API**: See Task 1 docs for endpoint details

---

**Quick Start:**
1. Run backend + frontend
2. Create/join event
3. Drag on calendar
4. Test all colors
5. Test real-time with two browsers

✅ Task 2 Complete - Ready for Testing!


