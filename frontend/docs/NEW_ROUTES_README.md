# When App - New UI Routes Documentation

This document describes the newly created redesigned UI pages for the When application.

## 📍 Available Routes

### 1. **Landing Page** - `/landing`
**File:** `src/pages/Landing.jsx`

A beautiful marketing/welcome page featuring:
- Hero section with tagline: "Find the perfect time, together"
- Four key value propositions (Lightning Fast, Smart Coordination, Timezone Magic, Stay Updated)
- Three feature showcase sections with alternating layouts
- Call-to-action sections
- Responsive footer
- Smooth scroll animations

**Key Features:**
- Full-width gradient hero
- Social proof with avatars
- Animated sections on scroll
- Feature cards with hover effects
- Responsive design

---

### 2. **Dashboard** - `/dashboard_temp`
**File:** `src/pages/DashboardTemp.jsx`

Modern dashboard home screen with:
- Top navigation bar with logo, menu items, notifications, and user avatar
- Welcome section with current date
- Large "Create New Event" CTA button
- Quick stats cards (4 metrics)
- Pending invitations section with Accept/Maybe/Decline actions
- Upcoming events grid (responsive: 1/2/3 columns)
- Event cards with hover effects and quick actions

**Key Features:**
- Card-based layout with shadows
- Real-time RSVP tracking visualization
- Guest avatars with AvatarGroup
- Event type badges and icons
- Smooth animations with Framer Motion
- Empty states for no events

---

### 3. **Event Details** - `/event_temp/:eventId`
**File:** `src/pages/EventTemp.jsx`

Beautiful event details page with:
- Hero section with event title, date, time, location
- Large RSVP buttons (Going/Maybe/Can't Make It)
- RSVP statistics with visual progress bar
- Time voting section (if multiple time options exist)
- Event details card with description, duration, attachments
- Comments/Discussion section with add comment functionality
- Sidebar with:
  - Quick actions (Copy Link, Email, Add to Calendar, Edit)
  - Participants list
  - Event metadata

**Key Features:**
- Two-column layout (main content + sidebar)
- Interactive time option voting
- Real-time RSVP visualization
- Comment system with timestamps
- File attachments display
- Responsive design

**Example URLs:**
- `/event_temp/evt_001` - Team Standup
- `/event_temp/evt_002` - Product Planning Workshop
- `/event_temp/evt_004` - Birthday Party

---

### 4. **Event Creation** - `/event/create`
**File:** `src/pages/EventCreate.jsx`

Multi-step wizard for creating events:

**Step 1: Basics**
- Event title (required)
- Event type selector (Meeting, Social, Birthday, Other)
- Description (optional)

**Step 2: When**
- Scheduling mode: Single time OR Find best time (multiple options)
- Date and time pickers
- Duration selector (15min to 3hrs + custom)
- Visual time slot selection for "Find best time" mode

**Step 3: Who**
- Guest search with autocomplete
- Added guests shown as chips with avatars
- Guest permissions:
  - Can invite others toggle
  - Show guest list toggle

**Step 4: Where**
- Virtual event toggle
- Video call link input (for virtual)
- Location input with map preview placeholder (for in-person)
- "No location needed" option

**Step 5: Review**
- Summary of all sections
- Edit buttons for each section
- "Send Invitations" button
- "Save as Draft" option

**Key Features:**
- Progress indicator at top
- Step-by-step navigation
- Form validation
- Auto-save drafts capability
- Smooth animations between steps
- Preview before sending

---

## 🎨 Design System

### Files Created:
1. **`src/styles/designSystem.js`** - Centralized design tokens including:
   - Colors (primary, secondary, accent, status colors)
   - Spacing scale
   - Border radius values
   - Shadows
   - Typography settings
   - Breakpoints
   - Transitions
   - Gradients
   - Animation presets

2. **`src/utils/mockData.js`** - Mock data for UI testing including:
   - 8 mock users with avatars
   - 7 mock events (various types and statuses)
   - 3 mock invitations
   - Comments/activity data
   - Current user data
   - Dashboard statistics
   - Helper functions for filtering/querying data

---

## 🚀 Getting Started

### Access the New Pages:

1. **Start the development server:**
   ```bash
   cd frontend
   npm start
   ```

2. **Navigate to the new routes:**
   - Landing: http://localhost:3000/landing
   - Dashboard: http://localhost:3000/dashboard_temp
   - Event Details: http://localhost:3000/event_temp/evt_001
   - Create Event: http://localhost:3000/event/create

### Flow Through the App:

**Recommended Testing Flow:**
1. Start at `/landing` → Click "Get Started"
2. Goes to `/dashboard_temp` → View upcoming events and invitations
3. Click any event card → Goes to `/event_temp/:eventId`
4. Click "Create New Event" → Goes to `/event/create`
5. Complete the wizard → Returns to event details page

---

## 🎯 Key Technologies Used

- **Chakra UI** - Component library
- **Framer Motion** - Animations
- **React Router** - Navigation
- **React Icons** (Feather Icons) - Icon library

---

## 📱 Responsive Design

All pages are fully responsive with breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px  
- Desktop: > 1024px

---

## 🔄 Differences from Current Pages

These new pages exist **alongside** the current application:
- Current landing: `/`
- Current dashboard: `/dashboard`
- Current event page: `/events/:eventUid`

New pages use different routes:
- New landing: `/landing`
- New dashboard: `/dashboard_temp`
- New event page: `/event_temp/:eventId`
- New create: `/event/create`

This allows for easy comparison and testing without affecting the existing application.

---

## ✨ Design Highlights

1. **Modern Aesthetic:**
   - Gradient backgrounds
   - Smooth shadows and hover effects
   - Card-based layouts
   - Ample white space

2. **Smooth Animations:**
   - Fade-in on page load
   - Slide-up on scroll (landing page)
   - Hover animations on cards
   - Smooth transitions between wizard steps

3. **Visual Hierarchy:**
   - Clear typography scale
   - Prominent CTAs
   - Color-coded badges and icons
   - Intuitive navigation

4. **User Experience:**
   - Loading states
   - Empty states with illustrations/icons
   - Form validation with friendly errors
   - Toast notifications for actions
   - Keyboard navigation support

---

## 🎨 Color Scheme

- **Primary:** Purple (#7C3AED) - Main brand color
- **Secondary:** Green (#10B981) - Success, confirmations
- **Accent:** Amber (#F59E0B) - Highlights, warnings
- **Info:** Blue (#3B82F6) - Informational elements

---

## 📝 Notes

- All mock data is stored in `src/utils/mockData.js`
- No API integration yet - pages use mock data
- Design system tokens can be imported: `import { colors, gradients } from '../styles/designSystem'`
- Pages follow Chakra UI conventions and theming
- All pages support both light and dark mode (Chakra default)

---

## 🔜 Next Steps

To integrate with your backend:
1. Replace mock data imports with actual API calls
2. Connect RSVP actions to your event service
3. Implement real-time updates with Supabase subscriptions
4. Add authentication checks to routes
5. Implement actual calendar syncing
6. Add real map integration for locations

---

**Created:** November 27, 2025  
**Status:** Ready for testing and feedback

