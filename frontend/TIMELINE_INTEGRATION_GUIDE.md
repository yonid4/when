# Quick Integration Guide - Timeline UI

This guide shows the fastest way to integrate the new continuous timeline UI into your EventPage.

## Files Created

1. **TimeSlotDisplay.jsx** - Main timeline component
   - Path: `frontend/src/components/events/TimeSlotDisplay.jsx`
   
2. **TimeSlotDisplayExample.jsx** - Integration example with view toggle
   - Path: `frontend/src/components/events/TimeSlotDisplayExample.jsx`
   
3. **time-slot-display.css** - Styling and animations
   - Path: `frontend/src/styles/time-slot-display.css`

## Quick Start (5 minutes)

### Step 1: Import the CSS

Add to `EventPage.jsx` (top of file):

```javascript
import "../styles/time-slot-display.css";
```

### Step 2: Import the Component

Add to `EventPage.jsx` imports:

```javascript
import TimeSlotDisplayExample from "../components/events/TimeSlotDisplayExample";
```

### Step 3: Replace Calendar Section

Find the calendar div in `EventPage.jsx` (around line 800):

```javascript
{/* Calendar Section */}
<div className="event-calendar">
  {busySlotsLoading || preferredSlotsLoading ? (
    <div className="flex items-center justify-center h-full">
      <div className="text-lg">Loading calendar...</div>
    </div>
  ) : (
    <TimeSlotDisplayExample
      preferredSlots={preferredSlots}
      eventData={eventData}
    />
  )}
</div>
```

### Step 4: Test

1. Start your frontend: `npm start` (or Docker equivalent)
2. Navigate to an event page
3. You should see the timeline view with toggle button

## Advanced: Standalone Timeline Only

If you want just the timeline without the toggle:

```javascript
import TimeSlotDisplay from "../components/events/TimeSlotDisplay";

// Add state for selected date
const [selectedDate, setSelectedDate] = useState(new Date());

// In render
<TimeSlotDisplay
  slots={preferredSlots}
  date={selectedDate}
  onSlotClick={(block) => {
    console.log('Clicked:', block);
    // Handle click
  }}
  minHour={9}
  maxHour={17}
/>
```

## Troubleshooting

**Issue: Colors not showing**
- Ensure `time-slot-display.css` is imported
- Check browser console for errors

**Issue: Slots not appearing**
- Verify `preferredSlots` data format matches API response
- Check that slots are for the selected date
- Console.log the processed blocks to debug

**Issue: Times incorrect**
- Verify timezone handling in your data
- Check that UTC times are being converted properly

## Next Steps

- Customize colors in `getSlotColor()` function
- Add participant detail modal on click
- Implement drag-to-select for new slots
- Add print/export functionality

## Questions?

Review the full documentation in `walkthrough.md` for detailed explanations of the algorithm, props, and advanced features.
