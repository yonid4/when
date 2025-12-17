# When - Event Coordination App

A full-stack application for coordinating events and managing availability across multiple calendars. Built with React, Flask, and Supabase.

## 🎉 Recent Updates (December 2024)

### Major New Features
- **🤖 AI-Powered Time Proposals**: Integrated Google Gemini AI to intelligently suggest optimal meeting times based on participant availability, preferences, and constraints
- **✨ Redesigned UI**: Beautiful new landing page, dashboard, and event creation wizard with smooth animations and modern design
- **📋 Preferred Time Slots**: Users can now mark their preferred times for events, which AI considers when generating proposals
- **🔔 Notifications System**: Real-time in-app notifications for event updates, invitations, and finalization
- **📨 Event Invitations**: Comprehensive invitation system with RSVP tracking and status management
- **🎯 Event Finalization**: Coordinators can finalize events to specific time slots with participant confirmation
- **⏱️ Continuous Timeline UI**: New time slot display component for visualizing availability across time ranges

### Technical Improvements
- **Enhanced Authentication**: Refactored backend decorators to pass user IDs more efficiently
- **Smart Proposal Caching**: AI proposals are cached and automatically invalidated when event data changes
- **Background Jobs**: Added proposal regeneration job for keeping suggestions up-to-date
- **Differential Calendar Sync**: Optimized Google Calendar synchronization with dynamic time windows
- **Custom Calendar Views**: Implemented custom month view with better participant visualization
- **Comprehensive API Service**: New `apiService.js` consolidates all API calls with consistent error handling
- **New React Hooks**: `useApiCall` hook for standardized API call patterns with loading states

### Database Enhancements
- New `proposed_times` table for AI proposal caching
- New `preferred_slots` table for user time preferences
- New `notifications` table for in-app notifications
- New `event_invitations` table for invitation tracking
- Added proposal tracking fields to `events` table

## 🌟 Features

### Core Scheduling
- **Smart Event Scheduling**: Create events with flexible time ranges and find optimal scheduling slots
- **AI-Powered Time Proposals**: Gemini AI intelligently suggests optimal meeting times based on participant availability, busy slots, and preferences
- **Preferred Time Slots**: Participants can mark their preferred times for events, which AI considers when generating proposals
- **Interactive Calendar Views**: Multiple calendar views (month, week, day) with dynamic time ranges and custom continuous timeline UI
- **Google Calendar Integration**: OAuth-based authentication and automatic differential busy time synchronization
- **Event Finalization**: Coordinators can finalize events to a specific time slot with participant confirmation

### Collaboration & Communication
- **Real-time Collaboration**: Live updates for event changes and participant availability via Supabase subscriptions
- **Event Invitations System**: Send, track, and manage event invitations with RSVP status
- **In-App Notifications**: Real-time notifications for event updates, invitations, and finalization
- **Event Sharing**: Join events via unique 12-character UIDs
- **Participant Management**: Track attendees, their availability, and preferences

### User Experience
- **Modern Redesigned UI**: Beautiful new landing page, dashboard, and event creation wizard with smooth animations
- **Multi-Step Event Creation**: Intuitive wizard-based event creation (Basics → When → Who → Where → Review)
- **Busy Time Management**: Automatic detection, caching, and merging of busy slots from Google Calendar
- **Cross-timezone Support**: Handle participants from different time zones with proper conversion
- **User Preferences**: Set and manage scheduling preferences and timezone settings
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## 🏗️ Tech Stack

### Frontend
- **React 18** with functional components and hooks
- **Chakra UI** for modern, accessible component library
- **React Router** for client-side routing
- **React Big Calendar** for interactive calendar views
- **Supabase Client** for real-time database and authentication
- **date-fns** for date/time manipulation and timezone handling
- **Axios** for API requests
- **Framer Motion** for smooth animations

### Backend
- **Flask 3.1** (Python) with modular blueprint architecture
- **Flask-JWT-Extended** for JWT token management
- **Flask-CORS** for cross-origin resource sharing
- **Google Calendar API** with OAuth2 authentication flow
- **Google Gemini AI** (`google-generativeai`) for intelligent time proposal generation
- **APScheduler** for background job processing and proposal cache management
- **Python-dateutil** for advanced date/time operations
- **Pydantic** for data validation and serialization
- **Supabase Python Client** for database operations
- **Pytest** for comprehensive testing

### Database & Infrastructure
- **Supabase** (PostgreSQL) for primary database
- **Real-time subscriptions** for live collaboration features
- **Supabase Auth** for user authentication and session management
- **Docker Compose** for containerized development environment

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+** (recommended for optimal compatibility)
- **Node.js 18+** and npm
- **Docker and Docker Compose** (recommended for production deployment)
- **Google Cloud Platform Account** (for Google Calendar API)
- **Google AI Studio Account** (for Gemini AI time proposals)
- **Supabase Account** (for database and authentication)

### Installation

1. **Clone the repository:**
```bash
git clone <your-repository-url>
cd when
```

2. **Set up the backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

3. **Set up the frontend:**
```bash
cd ../frontend
npm install
```

4. **Configure environment variables:**

   **For Docker deployment**, create a `.env` file in the **project root**:
   ```env
   # Flask Configuration
   FLASK_APP=run.py
   FLASK_ENV=production
   FLASK_HOST=0.0.0.0
   FLASK_PORT=5000
   
   # Supabase Configuration (Backend)
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Supabase Configuration (Frontend)
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Google Calendar API
   GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
   
   # Google Gemini AI (for time proposals)
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-pro
   GEMINI_MAX_RETRIES=3
   
   # Security Keys
   SECRET_KEY=your_flask_secret_key
   JWT_SECRET_KEY=your_jwt_secret_key
   ```

   **For local development**, create separate `.env` files:
   - `backend/.env` - Backend environment variables
   - `frontend/.env` - Frontend environment variables (REACT_APP_* only)

5. **Start the application:**

   **Option A: Using Docker (Recommended)**
   ```bash
   # Build and start all services
   docker-compose up --build -d
   
   # View logs
   docker-compose logs -f
   
   # Stop services
   docker-compose down
   ```
   
   The application will be available at:
   - Frontend: http://localhost
   - Backend API: http://localhost:5000 (or via Nginx proxy at http://localhost/api)

   **Option B: Local Development**
   ```bash
   # Terminal 1 (Backend)
   cd backend
   python run_manually.py  # Uses backend/.env
   
   # Terminal 2 (Frontend)
   cd frontend
   npm start  # Uses frontend/.env
   ```
   
   The application will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
when/
├── backend/                    # Flask API Server
│   ├── app/                   # Application package
│   │   ├── __init__.py       # App factory and configuration
│   │   ├── config.py         # Environment configurations
│   │   ├── models/           # Database models (Pydantic/Supabase)
│   │   │   ├── event.py
│   │   │   ├── event_participant.py
│   │   │   ├── busy_slot.py
│   │   │   ├── preference.py
│   │   │   ├── profile.py
│   │   │   ├── proposed_time.py    # AI-generated time proposals
│   │   │   ├── preferred_slot.py   # User preferred time slots
│   │   │   └── notification.py
│   │   ├── routes/           # API route blueprints
│   │   │   ├── auth.py       # Authentication endpoints
│   │   │   ├── events.py     # Event management
│   │   │   ├── availability.py
│   │   │   ├── busy_slots.py # Busy time management
│   │   │   ├── preferences.py # User preferences
│   │   │   ├── preferred_slots.py # Preferred time slots
│   │   │   ├── google_calendar.py # Google Calendar integration
│   │   │   ├── time_proposal.py   # AI time proposals (NEW)
│   │   │   ├── invitations.py     # Event invitations
│   │   │   ├── notifications.py   # In-app notifications
│   │   │   ├── event_finalization.py # Event finalization
│   │   │   └── users.py
│   │   ├── services/         # Business logic layer
│   │   │   ├── auth.py
│   │   │   ├── busy_slots.py
│   │   │   ├── events.py
│   │   │   ├── google_calendar.py
│   │   │   ├── preference.py
│   │   │   ├── preferred_slots.py
│   │   │   ├── time_proposal.py   # AI proposal generation (NEW)
│   │   │   ├── invitations.py
│   │   │   ├── notifications.py
│   │   │   ├── event_finalization.py
│   │   │   └── users.py
│   │   ├── utils/            # Utility functions
│   │   │   ├── auth.py
│   │   │   ├── decorators.py      # Enhanced auth decorators
│   │   │   ├── supabase_client.py
│   │   │   ├── timezone.py
│   │   │   └── validators.py
│   │   └── background_jobs/  # Scheduled tasks
│   │       └── proposal_regeneration.py # Auto-refresh AI proposals
│   ├── tests/                # Test suite
│   ├── run.py               # Application entry point
│   └── requirements.txt     # Python dependencies
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── auth/       # Authentication components
│   │   │   ├── calendar/   # Calendar views and interactions
│   │   │   │   ├── CalendarView.jsx  # Custom month view
│   │   │   │   ├── FinalizationModal.jsx
│   │   │   │   ├── CoordinatorSlotPopup.jsx
│   │   │   │   └── ParticipantSlotPopup.jsx
│   │   │   ├── events/     # Event management components
│   │   │   │   ├── TimeSlotDisplay.jsx # Continuous timeline UI
│   │   │   │   ├── ProposedTimesModal.jsx # AI proposals (NEW)
│   │   │   │   ├── InviteModal.jsx
│   │   │   │   └── DeleteEventModal.jsx
│   │   │   ├── notifications/ # Notification components
│   │   │   │   ├── NotificationBell.jsx
│   │   │   │   └── NotificationItem.jsx
│   │   │   └── common/     # Shared UI components
│   │   ├── pages/          # Route-level components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DashboardTemp.jsx  # New redesigned dashboard
│   │   │   ├── EventPage.jsx
│   │   │   ├── EventTemp.jsx      # New event details page
│   │   │   ├── EventCreate.jsx    # Multi-step creation wizard
│   │   │   ├── Landing.jsx        # New marketing landing page
│   │   │   └── LandingPage.jsx
│   │   ├── hooks/          # Custom React hooks
│   │   │   ├── useApiCall.js      # API call abstraction (NEW)
│   │   │   ├── useAuth.js
│   │   │   ├── useCalendar.js
│   │   │   ├── useAvailability.js
│   │   │   └── useRealtime.js
│   │   ├── services/       # API communication layer
│   │   │   ├── api.js             # Base API client
│   │   │   ├── apiService.js      # Comprehensive API methods (NEW)
│   │   │   ├── eventService.js
│   │   │   ├── calendarService.js
│   │   │   ├── notificationsService.js
│   │   │   ├── preferredSlotsService.js
│   │   │   └── authService.js
│   │   ├── context/        # React context providers
│   │   ├── styles/         # CSS and styling
│   │   │   ├── designSystem.js    # Design tokens (NEW)
│   │   │   ├── time-slot-display.css
│   │   │   └── calendar.css
│   │   └── utils/          # Frontend utilities
│   │       ├── mockData.js        # Mock data for testing (NEW)
│   │       ├── dateUtils.js
│   │       └── timezoneUtils.js
│   └── package.json        # Node.js dependencies
├── shared/                 # Shared type definitions and constants
│   ├── types/              # TypeScript type definitions
│   └── constants/          # Shared constants
├── migrations/             # Database migrations
│   ├── 001_create_preferred_slots_table.sql
│   ├── 002_add_event_finalization_columns.sql
│   ├── 003_create_notifications_table.sql
│   ├── 004_create_event_invitations_table.sql
│   ├── 005_create_proposed_times_table.sql  # AI proposals (NEW)
│   ├── README.md
│   └── TESTING_GUIDE.md
├── docs/                   # Documentation
│   ├── api.md             # API documentation
│   ├── deployment.md      # Deployment guide
│   └── setup.md           # Setup instructions
├── scripts/                # Deployment and utility scripts
│   ├── backup.sh          # Database backup script
│   ├── deploy.sh          # Deployment script
│   └── seed_db.py         # Database seeding
└── docker-compose.yml      # Container orchestration
```

## 🤖 AI-Powered Time Proposals

The application uses **Google Gemini AI** to intelligently suggest optimal meeting times based on:
- Participant busy slots from Google Calendar
- User-marked preferred time slots
- Event constraints (duration, date range, timezone)
- Participant count and availability overlap

### How It Works
1. **Smart Caching**: Proposals are cached and automatically invalidated when event data changes
2. **Background Regeneration**: A background job checks for stale proposals and regenerates them
3. **Coordinator Controls**: Event coordinators can force refresh proposals at any time
4. **Detailed Reasoning**: Each proposal includes AI-generated explanation for why it was suggested

### Configuration
Set the following environment variables:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-pro  # Optional, defaults to gemini-pro
GEMINI_MAX_RETRIES=3     # Optional, defaults to 3
```

Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

## 🔧 Configuration

### Google Calendar API Setup

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Google Calendar API

2. **Configure OAuth Consent:**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Configure your app information
   - Add test users for development

3. **Create OAuth Credentials:**
   - Go to "APIs & Services" > "Credentials"
   - Create OAuth 2.0 Client ID
   - Set authorized redirect URI: `http://localhost:5000/api/auth/google/callback`

### Supabase Setup

1. **Create a Supabase Project:**
   - Go to [Supabase](https://supabase.com/)
   - Create a new project
   - Note your project URL and anon key

2. **Configure Authentication:**
   - Enable Google OAuth provider in Supabase Auth settings
   - Use the same Google OAuth credentials from step above

### Environment Variables Reference

#### Docker Deployment (Root .env)
```env
# Flask Configuration
FLASK_APP=run.py
FLASK_ENV=production
FLASK_HOST=0.0.0.0
FLASK_PORT=5000

# Supabase Configuration (Backend)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Supabase Configuration (Frontend - for build time)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Calendar API
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Google Gemini AI (for time proposals)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-pro
GEMINI_MAX_RETRIES=3

# Security Keys (generate random strings for production)
SECRET_KEY=your_flask_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_key_here
```

**Important:** 
- Backend needs `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
- Frontend needs `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`
- Do NOT set `REACT_APP_API_BASE_URL` for Docker (uses relative paths via Nginx proxy)

#### Local Development
For local development, create separate `.env` files in `backend/` and `frontend/` directories with the respective variables.

### Database Schema

The application uses Supabase (PostgreSQL) with the following main tables:
- `profiles` - User profile information
- `events` - Event details and configuration with AI proposal tracking
- `event_participants` - Many-to-many relationship between users and events
- `busy_slots` - User busy times from Google Calendar integration
- `preferences` - User scheduling preferences and event preferences
- `preferred_slots` - User-marked preferred time slots for events (NEW)
- `proposed_times` - AI-generated time proposals with caching (NEW)
- `notifications` - In-app notifications for event updates (NEW)
- `event_invitations` - Event invitation tracking and RSVP status (NEW)

**Database Migrations:**
All migrations are located in `/migrations/` with numbered SQL files (001-005)

## 🧪 Testing

### Backend Tests
```bash
cd backend
source venv/bin/activate  # Activate virtual environment
pytest                    # Run all tests
pytest -v                 # Verbose output
pytest --cov=app         # Run with coverage report
```

### Frontend Tests
```bash
cd frontend
npm test                  # Run tests in watch mode
npm test -- --coverage   # Run with coverage report
npm test -- --watchAll=false  # Run once without watch mode
```

### Test Structure
- Backend: Comprehensive unit tests for services, API endpoints, and utilities
- Frontend: Component tests and integration tests
- Test coverage for critical paths like authentication, availability calculation, and event management

## 🚀 Deployment

### Using Docker Compose (Recommended)

The application includes optimized Docker configuration for production deployment:

```bash
# Quick start
docker-compose up --build -d

# Or use the helper script
chmod +x docker-commands.sh
./docker-commands.sh start

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**What's included:**
- `Dockerfile.backend` - Optimized Flask + Gunicorn container (Python 3.10)
- `Dockerfile.frontend` - Multi-stage React + Nginx build
- `docker-compose.yml` - Orchestration with health checks
- `.dockerignore` - Build optimization
- `docker-commands.sh` - Helper script for common operations

**Important Notes:**
- Backend runs on Gunicorn with 4 workers
- Frontend is served by Nginx on port 80
- Nginx proxies `/api/*` requests to the backend
- Environment variables must be in the **root `.env` file**
- Use `run.py` for Docker, `run_manually.py` for local development

For detailed Docker deployment instructions, see [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md).

### Manual Deployment
1. Set environment variables for production
2. Build frontend: `cd frontend && npm run build`
3. Deploy backend with a WSGI server like Gunicorn
4. Configure reverse proxy (nginx) for static files and API routing

For detailed deployment instructions, see [docs/deployment.md](docs/deployment.md).

## 📚 API Documentation

### Main API Endpoints

#### Authentication
- `GET /api/auth/google` - Initiate Google OAuth flow
- `GET /api/auth/google/callback` - Handle OAuth callback
- `POST /api/auth/logout` - Logout user

#### Events
- `GET /api/events` - List user's events
- `POST /api/events` - Create new event
- `GET /api/events/<event_id>` - Get event details
- `PUT /api/events/<event_id>` - Update event
- `DELETE /api/events/<event_id>` - Delete event

#### AI Time Proposals (NEW) 🤖
- `POST /api/events/<event_uid>/propose-times` - Get AI-generated time proposals (cached or generate)
  - Body: `{ "num_suggestions": 5, "force_refresh": false }`
  - Returns cached proposals if available and fresh, otherwise generates new ones
- `POST /api/events/<event_uid>/propose-times/refresh` - Force regenerate proposals (coordinator only)
- `GET /api/events/<event_uid>/propose-times/test` - Test endpoint

#### Preferred Slots (NEW)
- `POST /api/preferred_slots` - Add user's preferred time slots for an event
- `GET /api/preferred_slots/<event_uid>` - Get all preferred slots for an event
- `GET /api/preferred_slots/<event_uid>/user` - Get current user's preferred slots
- `DELETE /api/preferred_slots/<slot_id>` - Delete a preferred slot

#### Event Finalization (NEW)
- `POST /api/events/<event_uid>/finalize` - Finalize event to a specific time (coordinator only)
- `GET /api/events/<event_uid>/finalization-status` - Get finalization status

#### Invitations (NEW)
- `POST /api/invitations/<event_uid>` - Send event invitations
- `GET /api/invitations/<event_uid>` - Get all invitations for an event
- `PUT /api/invitations/<invitation_id>/respond` - Respond to invitation (accept/decline/maybe)

#### Notifications (NEW)
- `GET /api/notifications` - Get user's notifications
- `PUT /api/notifications/<notification_id>/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/<notification_id>` - Delete notification

#### Availability
- `POST /api/availability/<event_id>` - Add user availability
- `GET /api/availability/<event_id>` - Get event availability
- `PUT /api/availability/<event_id>` - Update availability

#### Busy Slots
- `POST /api/busy_slots/<event_id>` - Add busy slots for an event
- `GET /api/busy_slots/<event_id>` - Get all busy slots for an event
- `GET /api/busy_slots/user/<user_id>` - Get user's busy slots
- `DELETE /api/busy_slots/<event_id>/<user_id>` - Delete user's busy slots
- `POST /api/busy_slots/sync/<user_id>` - Sync Google Calendar busy times (differential sync)
- `GET /api/busy_slots/event/<event_id>/participants` - Get all participants' busy slots
- `GET /api/busy_slots/event/<event_id>/merged` - Get merged busy slots for event

#### Preferences
- `POST /api/preferences/<event_id>` - Add user preference for event
- `GET /api/preferences/<event_id>` - Get all preferences for event
- `GET /api/preferences/<event_id>/<user_id>` - Get user's preferences
- `DELETE /api/preferences/<preference_id>` - Delete preference

#### Google Calendar
- `GET /api/calendar/connection-status` - Check Google Calendar connection
- `GET /api/calendar/busy-times/<event_id>` - Get user's busy times
- `POST /api/calendar/sync/<event_id>` - Sync Google Calendar for event

#### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

For detailed API documentation, see `docs/api.md`.

## 🎨 New Redesigned UI

The application includes a **completely redesigned user interface** with modern aesthetics and smooth animations. These new pages are available alongside the existing interface for comparison and testing.

### New Routes

#### Landing Page - `/landing`
Beautiful marketing page with:
- Hero section with gradient background
- Feature showcase with animations
- Value propositions and social proof
- Call-to-action sections

#### Dashboard - `/dashboard_temp`
Modern dashboard featuring:
- Top navigation with notifications and user menu
- Quick stats cards with metrics
- Pending invitations with RSVP actions
- Upcoming events grid with hover effects
- Empty states and loading animations

#### Event Details - `/event_temp/:eventId`
Comprehensive event view with:
- Hero section with event details
- RSVP buttons and statistics
- Time voting section for multiple options
- Comments and discussion area
- Sidebar with participants and quick actions

#### Event Creation - `/event/create`
Multi-step wizard with 5 steps:
1. **Basics**: Title, type, description
2. **When**: Single time or find best time with multiple options
3. **Who**: Guest search and management
4. **Where**: Virtual or in-person location
5. **Review**: Summary before sending invitations

### Design System
- **Centralized tokens** in `src/styles/designSystem.js`
- **Colors**: Purple primary, Green secondary, Amber accent
- **Animations**: Framer Motion for smooth transitions
- **Responsive**: Mobile-first design with breakpoints
- **Mock Data**: Available in `src/utils/mockData.js` for testing

For complete documentation, see `frontend/NEW_ROUTES_README.md`.

## 🔧 Development

### Code Style and Standards
- **Backend**: Follow PEP 8 for Python code style
- **Frontend**: ESLint and Prettier for JavaScript/React
- **Imports**: Local imports first, then external libraries
- **Testing**: Write tests for new features and bug fixes

### Git Workflow
1. Create feature branch from `main`
2. Follow conventional commit messages
3. Ensure tests pass before submitting PR
4. Request code review for all changes

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the coding standards
4. Add tests for new functionality
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** - For intelligent time proposal generation
- **Google Calendar API** - For seamless calendar integration
- **Supabase** - For real-time database and authentication
- **Chakra UI** - For beautiful and accessible React components
- **Framer Motion** - For smooth animations and transitions
- **React Big Calendar** - For interactive calendar views
- **Flask** - For the robust backend framework
- **date-fns** - For reliable date/time operations

## 🐛 Troubleshooting

### Docker Issues

**Frontend shows old cached build:**
```bash
# Force complete rebuild without cache
docker-compose down
docker rmi when-frontend when-backend
docker builder prune -a -f
docker-compose build --no-cache
docker-compose up -d
```

**Environment variables not loading:**
- Ensure `.env` file is in the **project root** (not in backend/ or frontend/)
- Check that all required variables are set (see Environment Variables Reference)
- Backend needs both `SUPABASE_URL` and `SUPABASE_ANON_KEY` (without REACT_APP_ prefix)
- Rebuild after changing `.env`: `docker-compose up --build -d`

**CORS errors:**
- Verify backend CORS settings include `http://localhost` for Docker frontend
- Check Nginx proxy configuration in `Dockerfile.frontend`
- Ensure API calls use `/api/*` paths (not absolute URLs)

**Database connection errors:**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env`
- Check Supabase project is active and credentials are correct
- View backend logs: `docker-compose logs backend`

### Local Development Issues

**Port conflicts:**
- Backend default: 5000 (change with `FLASK_PORT`)
- Frontend default: 3000 (React dev server)
- Docker frontend: 80 (Nginx)

**Module import errors:**
- Backend: Activate virtual environment and install dependencies
- Frontend: Run `npm install` in frontend directory

### AI Time Proposals Issues

**"Gemini AI library not installed" error:**
```bash
cd backend
pip install google-generativeai==0.3.2
```

**"Gemini API not configured" error:**
- Ensure `GEMINI_API_KEY` is set in your `.env` file
- Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Restart backend after adding the key

**No proposals generated / "No available time slots" error:**
- Ensure event has participants
- Check that event date range is in the future
- Verify participants have availability data (busy slots or preferred slots)
- Try adjusting event constraints (date range, duration)

**Slow proposal generation:**
- First generation takes 5-15 seconds (AI processing time)
- Subsequent requests use cached proposals (instant)
- Proposals auto-regenerate in background when data changes

### Migration Issues

**Database schema errors:**
```bash
# Run migrations in order in Supabase SQL Editor
# Located in /migrations/ directory
# Execute files 001 through 005 in sequence
```

**RLS (Row Level Security) errors:**
- Ensure you're using service role key for admin operations
- Check that RLS policies are applied from migration files
- Service role key bypasses RLS for background jobs

## 📞 Support

For support and questions:
- Open an issue in the repository
- Check existing documentation in the `docs/` directory
- Review the API documentation for endpoint details
- See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for Docker-specific help

---

## 📋 Documentation Updates

**Last README Update:** December 13, 2024  
**Previous Update:** November 5, 2024

### What Changed in This Update
This comprehensive update reflects all changes made between November 5 and December 13, 2024:

#### New Features Documented
- ✅ AI-Powered Time Proposals with Google Gemini integration
- ✅ Preferred Time Slots system
- ✅ Event Invitations and RSVP tracking
- ✅ In-app Notifications system
- ✅ Event Finalization workflow
- ✅ Redesigned UI routes (Landing, Dashboard, Event Creation)
- ✅ Continuous Timeline UI component

#### New API Endpoints
- ✅ `/api/events/<event_uid>/propose-times` - AI time proposals
- ✅ `/api/preferred_slots/*` - Preferred time slots management
- ✅ `/api/invitations/*` - Invitation management
- ✅ `/api/notifications/*` - Notification system
- ✅ `/api/events/<event_uid>/finalize` - Event finalization

#### New Files & Components
- ✅ Backend: `time_proposal.py`, `proposal_regeneration.py`, `proposed_time.py`
- ✅ Frontend: `ProposedTimesModal.jsx`, `useApiCall.js`, `apiService.js`
- ✅ Frontend: New pages (Landing, DashboardTemp, EventCreate, EventTemp)
- ✅ Database: Migration 005 for proposed_times table

#### Technical Updates
- ✅ Enhanced authentication decorators
- ✅ Differential Google Calendar sync
- ✅ Smart proposal caching with background regeneration
- ✅ Comprehensive API service consolidation
- ✅ Design system and mock data utilities

For detailed commit history, run: `git log --since="2024-11-05" --oneline`
