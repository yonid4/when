# When - Event Coordination App

A full-stack application for coordinating events and managing availability across multiple calendars. Built with React, Flask, and Supabase.

## 🌟 Features

- **Smart Event Scheduling**: Create events with flexible time ranges and find optimal scheduling slots
- **Interactive Calendar Views**: Multiple calendar views (month, week, day) with dynamic time ranges
- **Google Calendar Integration**: OAuth-based authentication and automatic busy time synchronization
- **Real-time Collaboration**: Live updates for event changes and participant availability
- **Busy Time Management**: Automatic detection and merging of busy slots from Google Calendar
- **User Preferences**: Set and manage scheduling preferences for events
- **Event Sharing**: Join events via unique 12-character UIDs
- **Cross-timezone Support**: Handle participants from different time zones with proper conversion
- **Modern UI/UX**: Responsive design with Chakra UI components and custom styling

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
- **APScheduler** for background job processing
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
│   │   │   └── profile.py
│   │   ├── routes/           # API route blueprints
│   │   │   ├── auth.py       # Authentication endpoints
│   │   │   ├── events.py     # Event management
│   │   │   ├── availability.py
│   │   │   ├── busy_slots.py # Busy time management
│   │   │   ├── preferences.py # User preferences
│   │   │   ├── google_calendar.py # Google Calendar integration
│   │   │   └── users.py
│   │   ├── services/         # Business logic layer
│   │   │   ├── auth.py
│   │   │   ├── busy_slots.py
│   │   │   ├── events.py
│   │   │   ├── google_calendar.py
│   │   │   ├── preference.py
│   │   │   └── users.py
│   │   ├── utils/            # Utility functions
│   │   │   ├── auth.py
│   │   │   ├── decorators.py
│   │   │   ├── supabase_client.py
│   │   │   ├── timezone.py
│   │   │   └── validators.py
│   │   └── background_jobs/  # Scheduled tasks
│   ├── tests/                # Test suite
│   ├── run.py               # Application entry point
│   └── requirements.txt     # Python dependencies
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── auth/       # Authentication components
│   │   │   ├── calendar/   # Calendar views and interactions
│   │   │   ├── events/     # Event management components
│   │   │   └── common/     # Shared UI components
│   │   ├── pages/          # Route-level components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── EventPage.jsx
│   │   │   └── Login.jsx
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API communication layer
│   │   ├── context/        # React context providers
│   │   ├── styles/         # CSS and styling
│   │   └── utils/          # Frontend utilities
│   └── package.json        # Node.js dependencies
├── shared/                 # Shared type definitions and constants
│   ├── types/              # TypeScript type definitions
│   └── constants/          # Shared constants
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
- `events` - Event details and configuration
- `event_participants` - Many-to-many relationship between users and events
- `busy_slots` - User busy times from Google Calendar integration
- `preferences` - User scheduling preferences and event preferences

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

#### Availability
- `POST /api/availability/<event_id>` - Add user availability
- `GET /api/availability/<event_id>` - Get event availability
- `PUT /api/availability/<event_id>` - Update availability

#### Busy Slots
- `POST /api/busy_slots/<event_id>` - Add busy slots for an event
- `GET /api/busy_slots/<event_id>` - Get all busy slots for an event
- `GET /api/busy_slots/user/<user_id>` - Get user's busy slots
- `DELETE /api/busy_slots/<event_id>/<user_id>` - Delete user's busy slots
- `POST /api/busy_slots/sync/<user_id>` - Sync Google Calendar busy times
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

- **Google Calendar API** - For seamless calendar integration
- **Supabase** - For real-time database and authentication
- **Chakra UI** - For beautiful and accessible React components
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

## 📞 Support

For support and questions:
- Open an issue in the repository
- Check existing documentation in the `docs/` directory
- Review the API documentation for endpoint details
- See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for Docker-specific help
