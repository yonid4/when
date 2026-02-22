# When - Event Coordination App

A full-stack application for coordinating events and managing availability across multiple calendars. Built with React, Flask, and Supabase.

**Live at [when-now.com](https://www.when-now.com)**

## Features

- **Smart Event Scheduling** — Create events with flexible time ranges and find optimal slots
- **AI-Powered Time Proposals** — Gemini AI suggests optimal meeting times based on participant availability and preferences
- **Multi-Calendar Integration** — Google Calendar and Microsoft/Outlook Calendar via OAuth
- **Primary Calendar Provider** — Users choose which provider sends invites (Google Meet or Microsoft Teams)
- **Event Finalization** — Coordinators finalize events to a specific time slot with calendar invites
- **Real-time Collaboration** — Live updates via Supabase subscriptions
- **Invitations & Notifications** — In-app notification system with RSVP tracking
- **Preferred Time Slots** — Participants mark preferred times, factored into AI proposals
- **Timezone Support** — All times stored in UTC, displayed in user's local timezone

## Tech Stack

### Frontend
- React 18 + Chakra UI v2
- React Router, React Big Calendar
- date-fns / date-fns-tz for timezone handling
- Framer Motion for animations
- Supabase Client for real-time + auth
- react-icons (Google, Microsoft icons)

### Backend
- Flask 3.1 (Python) with blueprint architecture
- Flask-JWT-Extended for auth
- Google Calendar API + Microsoft Graph API (MSAL)
- Google Gemini AI for time proposals
- APScheduler for background jobs
- Pydantic for validation
- Supabase Python Client

### Database
- Supabase (PostgreSQL)
- Real-time subscriptions
- Row Level Security (RLS)
- Migrations in `/migrations/`

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Google Cloud Platform account (Calendar API + Gemini AI)
- Microsoft Azure app registration (for Outlook Calendar)
- Supabase account

### Installation

```bash
# Clone and set up backend
git clone https://github.com/yonid4/when.git
cd when/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set up frontend
cd ../frontend
npm install
```

### Environment Variables

Copy `.env.example` to `.env` in the project root and fill in:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_REDIRECT_URI`
- `GEMINI_API_KEY`
- `SECRET_KEY`, `JWT_SECRET_KEY`

### Running Locally

```bash
# Terminal 1 — Backend
cd backend
python run_manually.py

# Terminal 2 — Frontend
cd frontend
npm start
```

Frontend: http://localhost:3000 | Backend API: http://localhost:5000

### Running with Docker

```bash
# Local development (HTTP)
docker-compose -f docker-compose.local.yml up --build -d

# Production (HTTPS — requires SSL certs in /etc/letsencrypt/)
docker-compose up --build -d
```

A helper script `docker-commands.sh` provides shortcuts (`start`, `stop`, `logs`, `rebuild`, `shell`, `status`). Use `--local` flag for local config.

## API Endpoints

### Auth
- `GET /api/auth/google` — Initiate Google OAuth
- `GET /api/auth/microsoft` — Initiate Microsoft OAuth
- `GET /api/auth/{provider}/callback` — OAuth callback

### Events
- `GET|POST /api/events` — List / create events
- `GET|PUT|DELETE /api/events/<event_id>` — Event CRUD
- `POST /api/events/<event_uid>/finalize` — Finalize event (coordinator only)

### AI Proposals
- `POST /api/events/<event_uid>/propose-times` — Get AI time suggestions (cached)
- `POST /api/events/<event_uid>/propose-times/refresh` — Force regenerate

### Calendar
- `GET /api/calendar/connection-status` — Check calendar connection
- `POST /api/calendar/sync/<event_id>` — Sync calendar for event

### Availability & Busy Slots
- `POST|GET|PUT /api/availability/<event_id>` — Manage availability
- `GET /api/busy_slots/event/<event_id>/merged` — Merged busy slots

### Invitations & Notifications
- `POST /api/invitations/<event_uid>` — Send invitations
- `PUT /api/invitations/<invitation_id>/respond` — RSVP
- `GET /api/notifications` — User notifications
- `POST /api/notifications/<id>/action` — Handle notification action

### Users & Preferences
- `GET|PUT /api/users/profile` — User profile
- `POST|GET /api/preferences/<event_id>` — Event preferences
- `POST|GET /api/preferred_slots/<event_uid>` — Preferred time slots

## Testing

### Backend
```bash
cd backend
pytest              # Run all tests
pytest -v           # Verbose
pytest --cov=app    # With coverage
```

### Frontend
```bash
cd frontend
npm test                        # Watch mode
npm test -- --watchAll=false    # Single run
npm test -- --coverage          # With coverage
```

## Deployment

### Docker (recommended)
Production uses `docker-compose.yml` with Gunicorn (4 workers) + Nginx (HTTPS). See `scripts/deploy.sh`.

### Manual
1. `cd frontend && npm run build`
2. Deploy backend with Gunicorn
3. Configure Nginx to serve static files and proxy `/api/*`

## Database Migrations

All migrations are in `/migrations/` as numbered SQL files. Run them in order in the Supabase SQL Editor.

Main tables: `profiles`, `events`, `event_participants`, `busy_slots`, `preferences`, `preferred_slots`, `proposed_times`, `notifications`, `event_invitations`, `calendar_accounts`
