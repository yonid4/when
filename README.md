# When - Event Coordination App

A full-stack application for coordinating events and managing availability across multiple calendars. Built with React, Flask, and Supabase.

## 🌟 Features

- **Smart Event Scheduling**: Create events with flexible time ranges and find optimal scheduling slots
- **Interactive Calendar Views**: Multiple calendar views (month, week, day) with dynamic time ranges
- **Google Calendar Integration**: OAuth-based authentication and calendar data sync
- **Real-time Collaboration**: Live updates for event changes and participant availability
- **User Availability Management**: Input and manage personal availability for events
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
- **Flask 3.0** (Python) with modular blueprint architecture
- **Flask-JWT-Extended** for JWT token management
- **Flask-CORS** for cross-origin resource sharing
- **Google Calendar API** with OAuth2 authentication flow
- **APScheduler** for background job processing
- **Python-dateutil** for advanced date/time operations
- **Pytest** for comprehensive testing

### Database & Infrastructure
- **Supabase** (PostgreSQL) for primary database
- **Real-time subscriptions** for live collaboration features
- **Supabase Auth** for user authentication and session management
- **Docker Compose** for containerized development environment

## 🚀 Getting Started

### Prerequisites
- **Python 3.9+** (recommended for optimal compatibility)
- **Node.js 18+** and npm
- **Docker and Docker Compose** (optional, for containerized development)
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

   Create a `.env` file in the `backend` directory:
   ```env
   FLASK_APP=run.py
   FLASK_ENV=development
   FLASK_HOST=0.0.0.0
   FLASK_PORT=5000
   
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Google Calendar API
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
   
   # Security
   SECRET_KEY=your_flask_secret_key
   JWT_SECRET_KEY=your_jwt_secret_key
   ```

   Create a `.env` file in the `frontend` directory:
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_project_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the development servers:**
```bash
# Terminal 1 (Backend)
cd backend
python run.py

# Terminal 2 (Frontend)
cd frontend
npm start
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
│   │   │   ├── availability.py
│   │   │   └── profile.py
│   │   ├── routes/           # API route blueprints
│   │   │   ├── auth.py       # Authentication endpoints
│   │   │   ├── events.py     # Event management
│   │   │   ├── availability.py
│   │   │   └── users.py
│   │   ├── services/         # Business logic layer
│   │   │   ├── google_calendar.py
│   │   │   ├── availability_calc.py
│   │   │   └── auth_service.py
│   │   ├── utils/            # Utility functions
│   │   │   ├── auth.py
│   │   │   ├── supabase_client.py
│   │   │   └── timezone.py
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
├── scripts/                # Deployment and utility scripts
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

#### Backend (.env)
```env
# Flask Configuration
FLASK_APP=run.py
FLASK_ENV=development  # or production
FLASK_HOST=0.0.0.0
FLASK_PORT=5000

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Calendar API
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Security Keys (generate random strings for production)
SECRET_KEY=your_flask_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_key_here
```

#### Frontend (.env)
```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Schema

The application uses Supabase (PostgreSQL) with the following main tables:
- `profiles` - User profile information
- `events` - Event details and configuration
- `event_participants` - Many-to-many relationship between users and events
- `availability_slots` - User availability for specific events
- `preferences` - User scheduling preferences

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
```bash
docker-compose up --build
```

### Manual Deployment
1. Set environment variables for production
2. Build frontend: `cd frontend && npm run build`
3. Deploy backend with a WSGI server like Gunicorn
4. Configure reverse proxy (nginx) for static files and API routing

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

## 📞 Support

For support and questions:
- Open an issue in the repository
- Check existing documentation in the `docs/` directory
- Review the API documentation for endpoint details
