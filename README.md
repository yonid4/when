# Event Coordination App

A full-stack application for coordinating events and managing availability across multiple calendars. Built with React, Flask, and Supabase.

## 🌟 Features

- **Smart Event Scheduling**: Automatically find the best time slots for all participants
- **Google Calendar Integration**: Seamless sync with Google Calendar
- **Real-time Updates**: Live updates for event changes and availability
- **User Preferences**: Set and manage personal scheduling preferences
- **Cross-timezone Support**: Handle participants from different time zones
- **Background Processing**: Automated calendar sync and availability calculations

## 🏗️ Tech Stack

### Frontend
- React.js
- Supabase Client
- Modern UI Components
- Real-time Subscriptions

### Backend
- Flask (Python)
- RESTful API
- Background Job Processing
- Google Calendar API Integration

### Database
- Supabase (PostgreSQL)
- Real-time Subscriptions
- Authentication

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- Docker and Docker Compose
- Google Cloud Platform Account
- Supabase Account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/merilynk/when.git
cd when 
```

2. Set up the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up the frontend:
```bash
cd frontend
npm install
```

4. Configure environment variables:
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Update the variables with your configuration

5. Start the development servers:
```bash
# Terminal 1 (Backend)
cd backend
flask run

# Terminal 2 (Frontend)
cd frontend
npm start
```

## 📁 Project Structure

```
event-coordination-app/
├── backend/          # Flask API Server
├── frontend/         # React Application
├── shared/           # Shared utilities
├── docs/            # Documentation
└── scripts/         # Deployment scripts
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```
FLASK_APP=run.py
FLASK_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📚 API Documentation

Detailed API documentation can be found in the `docs/api.md` file.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Google Calendar API
- Supabase Team
- React Community
- Flask Community

## 📞 Support

For support, email support@yourdomain.com or open an issue in the repository.
