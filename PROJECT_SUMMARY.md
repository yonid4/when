# Project Summary: When — Event Coordination App

> This document summarizes the current state of the "When" application for use as a reference when redesigning/rebuilding it from scratch.

---

## 1. What the App Does

**When** is a full-stack event coordination platform that helps groups find optimal meeting times. Key capabilities:

- Create events with a flexible time window and invite participants
- Sync real calendars (Google Calendar, Microsoft Outlook) to pull in busy times
- Use AI (Google Gemini) to propose the best time slots based on everyone's availability
- Let participants mark preferred times
- Coordinator finalizes a time, which creates a real calendar event with invites on Google Calendar or Microsoft Teams
- Real-time collaboration via Supabase subscriptions
- In-app notification inbox (event finalized, invited, deleted, etc.)
- RSVP tracking (going / maybe / not going)
- Timezone support (all times stored in UTC, displayed in local timezone)

---

## 2. Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Chakra UI | v2 (2.8.2) | Component library / design system |
| React Router | 6.20.0 | Client-side routing |
| React Big Calendar | 1.19.4 | Calendar visualization |
| date-fns / date-fns-tz | 2.30.0 | Date & timezone utilities |
| Framer Motion | 10.16.16 | Animations |
| Supabase JS Client | 2.39.0 | Database, auth & real-time |
| Axios | 1.6.2 | HTTP client |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python / Flask | 3.1.2 | API server |
| Flask-JWT-Extended | 4.6.0 | JWT authentication |
| Flask-CORS | — | CORS handling |
| Pydantic | — | Data validation / models |
| Google API Client | 2.184.0 | Google Calendar API |
| google-generativeai | 0.3.2 | Gemini AI (time proposals) |
| MSAL | 1.28.0 | Microsoft OAuth |
| APScheduler | 3.10.4 | Background jobs (calendar sync) |
| Supabase Python | 2.22.0 | Database client |

### Database & Infrastructure
| Technology | Purpose |
|---|---|
| Supabase (PostgreSQL) | Database + auth + real-time subscriptions |
| Row Level Security (RLS) | Authorization at DB level |
| Docker + Docker Compose | Containerization |
| Gunicorn (4 workers) | Production WSGI server |
| Nginx | Reverse proxy, static file serving, HTTPS |
| Let's Encrypt | SSL certificates |

---

## 3. Project Structure

```
when/
├── backend/
│   ├── app/
│   │   ├── __init__.py            # Flask app factory
│   │   ├── config.py              # Environment configs
│   │   ├── routes/                # 14 Flask blueprint modules (one per feature)
│   │   ├── services/              # 13 business logic service classes
│   │   ├── models/                # 12 Pydantic data models
│   │   ├── background_jobs/       # APScheduler: calendar sync, proposal caching
│   │   └── utils/
│   │       ├── supabase_client.py # Supabase initialization
│   │       └── decorators.py      # @require_auth decorator
│   ├── run.py                     # Production entry point
│   ├── run_locally.py             # Local dev entry point
│   ├── server.py                  # LEGACY — old SQLAlchemy models, unused
│   ├── requirements.txt
│   └── tests/                     # Pytest unit tests
│
├── frontend/
│   └── src/
│       ├── App.jsx                # Route definitions
│       ├── pages/                 # 6 page components
│       │   ├── Landing.jsx        # Home / login
│       │   ├── Dashboard.jsx      # Event list
│       │   ├── EventPage.jsx      # Event detail & coordination (main page)
│       │   ├── EventCreate.jsx    # Create event wizard
│       │   ├── Settings.jsx       # Calendar accounts & preferences
│       │   └── PrivacyPolicy.jsx
│       ├── components/            # Reusable components (organized by feature)
│       │   ├── auth/
│       │   ├── calendar/
│       │   ├── event/
│       │   ├── common/
│       │   ├── landing/
│       │   ├── notifications/
│       │   ├── settings/
│       │   └── skeletons/
│       ├── services/              # API wrappers + auth + Supabase client
│       ├── hooks/                 # 9 custom React hooks
│       ├── utils/                 # Date helpers, calendar event utils
│       ├── constants/
│       ├── styles/                # Design system tokens (colors, shadows)
│       └── theme/                 # Chakra UI theme overrides
│
├── migrations/                    # Numbered SQL migration files (000–011)
├── .env.example
├── docker-compose.yml             # Production Docker config
├── docker-compose.local.yml       # Local Docker config (HTTP)
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-commands.sh             # Helper: start/stop/logs/rebuild
└── scripts/                       # Deployment scripts
```

---

## 4. Database Schema

### profiles
User accounts linked to Supabase auth.

| Column | Type | Notes |
|---|---|---|
| id | UUID | FK → auth.users |
| full_name | text | |
| avatar_url | text | |
| email_address | text | unique |
| google_auth_token | JSONB | Legacy OAuth credentials storage |
| microsoft_auth_token | JSONB | Legacy OAuth credentials storage |
| primary_calendar_provider | text | `google` or `microsoft` |
| timezone | text | |
| created_at, updated_at | timestamptz | |

### events
Core event coordination record.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| uid | VARCHAR(12) | Short shareable ID for URLs |
| name, description | text | |
| event_type | enum | `meeting`, `social`, `birthday`, `other` |
| coordinator_id | UUID | FK → profiles |
| earliest_datetime_utc | timestamptz | Start of available window |
| latest_datetime_utc | timestamptz | End of available window |
| duration_minutes | int | Desired event length |
| status | enum | `planning`, `confirmed`, `cancelled` |
| location, video_call_link | text | |
| finalized_start_time_utc | timestamptz | Set when confirmed |
| finalized_end_time_utc | timestamptz | Set when confirmed |
| google_calendar_event_id | text | After finalization |
| microsoft_calendar_event_id | text | After finalization |
| calendar_provider | text | Which provider was used for finalization |
| guests_can_invite | boolean | |
| proposals_needs_regeneration | boolean | Stale flag for AI proposals |
| proposals_last_generated_at | timestamptz | |
| created_at, updated_at, finalized_at | timestamptz | |

### event_participants
Tracks who is part of each event.

| Column | Type | Notes |
|---|---|---|
| event_id, user_id | UUID | Composite PK |
| status | enum | `pending`, `accepted`, `declined` |
| rsvp_status | enum | `going`, `maybe`, `not_going` |
| can_invite | boolean | |
| joined_at | timestamptz | |

### calendar_accounts
OAuth-connected calendar accounts (new model, replaces profile token storage).

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → profiles |
| provider | text | `google` or `microsoft` |
| provider_account_id | text | Account email |
| credentials | JSONB | OAuth tokens |
| created_at, updated_at | timestamptz | |

### calendar_sources
Individual calendars within a connected account.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| account_id | UUID | FK → calendar_accounts |
| calendar_id | text | Provider's calendar ID |
| calendar_name | text | |
| is_enabled | boolean | Whether to sync |
| is_write_calendar | boolean | Default calendar for new events |
| color | text | |

### busy_slots
Synced busy time blocks from calendars.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → auth.users (not profiles — inconsistency) |
| start_time_utc, end_time_utc | timestamptz | |
| provider_event_id | text | |
| calendar_source_id | UUID | FK → calendar_sources |
| last_synced_at | timestamptz | |

### proposed_times
Cached AI-generated time proposals for events.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| event_id | UUID | FK → events |
| start_time_utc, end_time_utc | timestamptz | |
| conflicts | int | Number of participant conflicts |
| reasoning | text | AI explanation |
| rank | int | Unique per event |

### preferred_slots
User-marked preferred times within an event window.

| Column | Type | Notes |
|---|---|---|
| id, event_id, user_id | UUID | |
| start_time_utc, end_time_utc | timestamptz | |

### event_invitations
Invite tracking (for people not yet in the system).

| Column | Type | Notes |
|---|---|---|
| id, event_id | UUID | |
| inviter_id, invitee_id | UUID | FK → profiles |
| status | enum | `pending`, `accepted`, `declined` |
| email_address | text | |
| sent_at, responded_at | timestamptz | |

### notifications
In-app notification inbox per user.

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id, event_id | UUID | FKs |
| notification_type | text | |
| title, message | text | |
| is_read, action_taken | boolean | |
| action_type | text | |
| metadata | JSONB | |
| created_at, read_at, action_at | timestamptz | |

### user_event_preferences
Per-user, per-event preferences.

| Column | Type | Notes |
|---|---|---|
| event_id, user_id | UUID | Composite PK |
| notifications_enabled | boolean | |

---

## 5. Core Flows

### Authentication Flow
1. User clicks "Login with Google/Microsoft"
2. Frontend redirects to `/api/auth/{provider}`
3. Backend redirects to OAuth provider consent screen
4. Provider redirects back to `/api/auth/{provider}/callback?code=...`
5. Backend exchanges code for tokens, stores in Supabase, creates JWT
6. Frontend stores JWT in localStorage, includes in `Authorization` header

### Calendar Sync Flow
1. User triggers "Sync Calendar" on event page
2. `POST /api/calendar/sync` with event date range
3. Backend fetches busy times from Google/Microsoft API
4. Busy slots upserted into `busy_slots` table
5. AI proposal uses these busy slots

### AI Time Proposal Flow
1. Frontend calls `POST /api/events/{uid}/propose-times`
2. Backend checks cache (`proposed_times` + `proposals_needs_regeneration` flag)
3. If fresh, returns cached proposals
4. If stale: aggregates event data, participants, busy slots, preferred slots
5. Sends formatted prompt to Google Gemini
6. Parses JSON response, stores ranked proposals in `proposed_times`
7. Frontend displays proposals with reasoning

### Event Finalization Flow
1. Coordinator picks a proposed time slot
2. `POST /api/events/{uid}/finalize` with selected time
3. Backend creates calendar event via Google/Microsoft API with all attendees
4. Event `status` set to `confirmed`, finalized times stored
5. Calendar event IDs stored on event record
6. Notifications sent to all participants

---

## 6. API Endpoints Summary

### Auth
- `GET /api/auth/google` — initiate Google OAuth
- `GET /api/auth/microsoft` — initiate Microsoft OAuth
- `GET /api/auth/{provider}/callback` — OAuth callback

### Events
- `POST /api/events` — create event
- `GET /api/events` — list user's events
- `GET /api/events/<uid>` — get event detail
- `PUT /api/events/<uid>` — update event
- `DELETE /api/events/<id>` — delete event

### Participants
- `GET /api/events/<uid>/participants`
- `POST /api/events/<id>/participants`
- `DELETE /api/events/<id>/participants/<participant_id>`
- `PUT /api/events/<uid>/participants/<id>/permissions`
- `PUT /api/events/<uid>/status` — update RSVP

### AI Proposals
- `POST /api/events/<uid>/propose-times` — get proposals (cached)
- `POST /api/events/<uid>/propose-times/refresh` — force regenerate

### Calendar
- `GET /api/calendar/connection-status`
- `POST /api/calendar/sync`
- `POST /api/calendar/sync/<event_id>`

### Busy Slots
- `GET /api/busy_slots/<event_id>`
- `POST /api/busy_slots/<event_id>`
- `GET /api/busy_slots/event/<event_id>/merged`
- `POST /api/busy_slots/sync/<user_id>`

### Preferred Slots
- `POST /api/preferred_slots/<uid>`
- `GET /api/preferred_slots/<uid>`
- `DELETE /api/preferred_slots/<uid>/<slot_id>`

### Finalization
- `POST /api/events/<uid>/finalize`
- `GET /api/events/<uid>/finalize/status`

### Invitations
- `POST /api/invitations/<uid>`
- `PUT /api/invitations/<id>/respond`

### Notifications
- `GET /api/notifications`
- `POST /api/notifications/<id>/action`

### Users & Preferences
- `GET/PUT /api/users/profile`
- `GET/POST /api/preferences/<event_id>`

### Calendar Accounts
- `GET /api/calendar_accounts`
- `POST /api/calendar_accounts`
- `DELETE /api/calendar_accounts/<id>`

---

## 7. Environment Variables

```env
# Flask
FLASK_ENV=production
SECRET_KEY=
JWT_SECRET_KEY=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=

# Google (Calendar API + OAuth)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Gemini AI
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

# Microsoft (Outlook/Teams)
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=

# CORS
CORS_ORIGINS=http://localhost:3000
```

---

## 8. Known Issues & Technical Debt

| Issue | Description |
|---|---|
| Legacy server.py | `/backend/server.py` has old SQLAlchemy models (Event, User, UserUnavailability) — unused, can be deleted |
| Dual token storage | Google/Microsoft credentials stored in both `profiles` columns (legacy) and `calendar_accounts` table (new) — migration incomplete |
| User ID inconsistency | `busy_slots.user_id` references `auth.users(id)`, not `profiles(id)` — causes join complexity |
| Deprecated availability model | `/models/availability.py` is empty; `busy_slots` is the replacement |
| Service role bypasses RLS | Several routes use service_role_client which bypasses RLS — route-level authorization must be manually verified |
| Tokens stored unencrypted | OAuth tokens stored as plaintext JSONB in Supabase (not encrypted at rest) |
| CORS fallback hardcoding | CORS has hardcoded fallback origins if env var is missing |

---

## 9. Local Development Setup

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Copy .env.example to .env and fill in credentials
python run_locally.py   # http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm start               # http://localhost:3000 (proxies /api to :5000)

# Database: run SQL migrations in Supabase SQL Editor, files in /migrations/
# Order: 000_* through 011_*
```

### Docker (local)
```bash
docker-compose -f docker-compose.local.yml up --build -d
```

### Tests
```bash
# Backend
cd backend && pytest -v

# Frontend
cd frontend && npm test -- --watchAll=false
```

---

## 10. Design System Notes

- **Component library:** Chakra UI v2 with custom theme overrides in `frontend/src/theme/`
- **Design tokens:** Defined in `frontend/src/styles/designSystem.js` (colors, shadows, component styles)
- **Color scheme:** Supports dark/light mode via `useColorScheme` hook
- **Animation:** Framer Motion for page transitions and UI feedback
- **Calendar display:** React Big Calendar with color-coded overlays for busy slots (red), preferred slots (green), proposed times (blue)
- **Loading states:** Skeleton components in `frontend/src/components/skeletons/`

---

## 11. What Works Well (Keep in Redesign)

- Service layer separation (routes → services → Supabase)
- RLS-first security model via Supabase
- Pydantic data validation on the backend
- AI proposal caching with staleness tracking
- Multi-provider calendar support (Google + Microsoft)
- Short event UIDs for shareable URLs (`/events/abc123xyz`)
- Background jobs for calendar sync (APScheduler)
- Docker + Nginx + Gunicorn production setup

## 12. What to Rethink in Redesign

- Consolidate token storage — use `calendar_accounts` only, remove legacy columns from `profiles`
- Fix `busy_slots.user_id` to reference `profiles` consistently
- Consider encrypting OAuth tokens at rest
- Evaluate replacing APScheduler with Supabase Edge Functions or cron jobs for simpler infra
- Consider Next.js instead of CRA (React) for better SSR, routing, and bundling
- Evaluate tRPC or a typed API layer instead of raw Axios + manual typing
- Add proper error boundary handling and retry logic on the frontend
- Real-time subscriptions are wired up in Supabase but not fully utilized in routes — expand usage
