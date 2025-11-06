# Docker Setup Summary - "When" Application

## 📋 What Was Created

This document summarizes the Docker configuration files created for the "When" event coordination application.

## 🗂️ Files Created

### 1. `Dockerfile.backend`
**Purpose:** Containerizes the Flask backend with Gunicorn

**Key Features:**
- Base image: `python:3.10-slim` (lightweight)
- Production WSGI server: Gunicorn with 4 workers
- Security: Runs as non-root user (appuser, UID 1000)
- Health check: Monitors `/api/auth/debug/config` endpoint
- Optimizations:
  - No bytecode files (`PYTHONDONTWRITEBYTECODE=1`)
  - Unbuffered output (`PYTHONUNBUFFERED=1`)
  - Multi-layer caching for faster rebuilds
  - Minimal system dependencies

**Port:** 5000

---

### 2. `Dockerfile.frontend`
**Purpose:** Multi-stage build for React frontend served by Nginx

**Stage 1 - Builder:**
- Base image: `node:18-alpine`
- Installs dependencies and builds React app
- Creates optimized production bundle

**Stage 2 - Production:**
- Base image: `nginx:1.25-alpine`
- Serves static files from build stage
- Custom Nginx configuration includes:
  - API proxy to backend (http://backend:5000)
  - Gzip compression
  - Static asset caching (1 year)
  - Security headers (X-Frame-Options, X-XSS-Protection, etc.)
  - React Router support (SPA fallback)
  - Error handling
- Security: Runs as non-root user
- Health check: HTTP request to port 80

**Port:** 80

---

### 3. `docker-compose.yml`
**Purpose:** Orchestrates both services with networking and health checks

**Services:**

**backend:**
- Container name: `when-backend`
- Port: 5000:5000
- Environment: Loaded from `.env` file
- Health check: Every 30s, checks API endpoint
- Restart policy: `unless-stopped`
- Network: `when-network`

**frontend:**
- Container name: `when-frontend`
- Port: 80:80
- Depends on: backend (waits for healthy status)
- Build args: React environment variables
- Health check: Every 30s, checks HTTP endpoint
- Restart policy: `unless-stopped`
- Network: `when-network`

**Network:**
- Name: `when-network`
- Driver: bridge (default)
- Allows services to communicate by name

---

### 4. `.dockerignore`
**Purpose:** Optimizes build process by excluding unnecessary files

**Excluded:**
- Git files and documentation
- Virtual environments (`venv/`, `node_modules/`)
- Python cache files (`__pycache__/`, `*.pyc`)
- Test files and coverage reports
- IDE configurations
- Environment files (`.env`)
- Build artifacts
- Log files

**Benefit:** Reduces build context size, speeds up builds

---

### 5. `DOCKER_DEPLOYMENT.md`
**Purpose:** Comprehensive deployment guide

**Contents:**
- Architecture overview
- Quick start guide
- Detailed explanation of each Docker file
- Common commands reference
- Production deployment strategies
- Troubleshooting guide
- Security best practices
- CI/CD integration examples
- Monitoring and logging setup

---

### 6. `docker-commands.sh`
**Purpose:** Helper script for common Docker operations

**Available Commands:**
```bash
./docker-commands.sh start          # Build and start services
./docker-commands.sh stop           # Stop all services
./docker-commands.sh restart        # Restart services
./docker-commands.sh logs [service] # View logs
./docker-commands.sh status         # Show service status
./docker-commands.sh clean          # Remove everything
./docker-commands.sh rebuild [svc]  # Rebuild specific service
./docker-commands.sh shell [svc]    # Open shell in container
./docker-commands.sh stats          # Show resource usage
./docker-commands.sh pull           # Pull latest images
./docker-commands.sh help           # Show help
```

**Features:**
- Color-coded output (info, warning, error)
- Interactive confirmations for destructive operations
- Environment file validation
- Error handling

---

## 🚀 Quick Start

### 1. Create Environment File

Create a `.env` file in the project root:

```bash
# Backend
FLASK_APP=run.py
FLASK_ENV=production
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_key
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_key

# Frontend
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_key
```

### 2. Start the Application

**Option A - Using Docker Compose:**
```bash
docker-compose up --build -d
```

**Option B - Using Helper Script:**
```bash
chmod +x docker-commands.sh
./docker-commands.sh start
```

### 3. Access the Application

- **Frontend:** http://localhost
- **Backend API:** http://localhost:5000
- **API via Nginx:** http://localhost/api

### 4. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Using helper script
./docker-commands.sh logs backend
```

### 5. Stop the Application

```bash
docker-compose down

# Or using helper script
./docker-commands.sh stop
```

---

## 🔧 Architecture Details

### Service Communication

```
[User Browser] 
    ↓ (Port 80)
[Nginx - Frontend Container]
    ↓ /api/* requests
    ↓ (Internal: backend:5000)
[Gunicorn - Backend Container]
    ↓
[External: Supabase]
```

### Network Flow

1. User accesses http://localhost
2. Nginx serves React static files
3. React makes API calls to `/api/*`
4. Nginx proxies to `http://backend:5000`
5. Flask backend processes request
6. Backend connects to Supabase

### Security Features

- ✅ Non-root users in containers
- ✅ Environment variables for secrets
- ✅ Security headers in Nginx
- ✅ Network isolation
- ✅ Health checks
- ✅ Restart policies

---

## 📊 Production Considerations

### Resource Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 2GB
- Disk: 5GB

**Recommended:**
- CPU: 4 cores
- RAM: 4GB
- Disk: 10GB

### Scaling

**Horizontal Scaling:**
```bash
# Scale backend
docker-compose up -d --scale backend=3
```

**Vertical Scaling:**
Adjust Gunicorn workers in `Dockerfile.backend`:
```dockerfile
# Formula: (2 * CPU cores) + 1
CMD ["gunicorn", "--workers", "8", ...]
```

### Performance Optimizations

1. **Nginx Caching:** Static assets cached for 1 year
2. **Gzip Compression:** Enabled for text files
3. **Multi-stage Build:** Minimal image size
4. **Health Checks:** Automatic container restart
5. **Connection Pooling:** Managed by Gunicorn

---

## 🐛 Troubleshooting

### Issue: Services not starting

**Solution:**
```bash
# Check logs
docker-compose logs

# Check .env file
cat .env

# Verify port availability
lsof -i :80
lsof -i :5000
```

### Issue: Frontend can't reach backend

**Solution:**
```bash
# Check network
docker network inspect when_when-network

# Verify backend is healthy
docker-compose ps

# Check Nginx proxy config
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf
```

### Issue: Build failing

**Solution:**
```bash
# Clean build
docker-compose down -v --rmi all
docker-compose up --build

# Check Docker resources
docker system df
docker system prune -a  # Clean unused resources
```

---

## 📝 Maintenance

### Regular Tasks

1. **Update base images:**
```bash
docker-compose pull
docker-compose up -d --build
```

2. **Clean unused resources:**
```bash
docker system prune -a --volumes
```

3. **Backup data:**
```bash
docker-compose exec backend python scripts/backup.sh
```

4. **Monitor logs:**
```bash
docker-compose logs --tail=100 -f
```

---

## 🎯 Next Steps

1. ✅ Create `.env` file with your credentials
2. ✅ Run `docker-compose up --build -d`
3. ✅ Test the application at http://localhost
4. ✅ Configure domain and SSL for production
5. ✅ Set up monitoring and alerting
6. ✅ Configure automated backups
7. ✅ Implement CI/CD pipeline

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Gunicorn Documentation](https://docs.gunicorn.org/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [React Deployment](https://create-react-app.dev/docs/deployment/)

---

## ✅ Summary Checklist

- [x] Dockerfile.backend - Flask + Gunicorn
- [x] Dockerfile.frontend - React + Nginx (multi-stage)
- [x] docker-compose.yml - Service orchestration
- [x] .dockerignore - Build optimization
- [x] DOCKER_DEPLOYMENT.md - Detailed guide
- [x] docker-commands.sh - Helper script
- [x] README.md - Updated with Docker section
- [x] Security best practices implemented
- [x] Health checks configured
- [x] Non-root users
- [x] Network isolation
- [x] Environment variable management

---

**All Docker files are ready for production deployment! 🚀**

