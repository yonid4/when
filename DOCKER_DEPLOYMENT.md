# Docker Deployment Guide for "When" Application

This guide explains how to deploy the "When" event coordination application using Docker and Docker Compose.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- `.env` file with required environment variables

## 🏗️ Architecture Overview

The application consists of two services:

1. **Backend (Flask)**: Python Flask API running on Gunicorn (port 5000)
2. **Frontend (React + Nginx)**: React app served by Nginx (port 80)

The services communicate via a Docker bridge network, and Nginx proxies API requests to the backend.

## 🚀 Quick Start

### 1. Create Environment File

Copy the example environment file and fill in your values:

```bash
# Create .env file in the project root
cat > .env << 'EOF'
# Flask Configuration
FLASK_APP=run.py
FLASK_ENV=production
FLASK_HOST=0.0.0.0
FLASK_PORT=5000

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Calendar API
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REDIRECT_URI=http://your-domain.com/api/auth/google/callback

# Security Keys
SECRET_KEY=your_flask_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_key_here

# Frontend (React)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
EOF
```

### 2. Build and Run

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 3. Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **API via Nginx**: http://localhost/api

## 📦 Docker Files Explained

### Dockerfile.backend

**Key Features:**
- Uses `python:3.10-slim` for smaller image size
- Installs Gunicorn as production WSGI server
- Runs as non-root user for security
- Includes health check endpoint
- 4 Gunicorn workers with 120s timeout

**Production Optimizations:**
- Multi-layer caching for faster rebuilds
- No write bytecode files
- Unbuffered output for better logging
- Minimal system dependencies

### Dockerfile.frontend

**Multi-Stage Build:**

**Stage 1 - Builder:**
- Uses `node:18-alpine` to build React app
- Installs production dependencies only
- Runs `npm run build` to create optimized bundle

**Stage 2 - Nginx:**
- Uses `nginx:1.25-alpine` for serving static files
- Custom Nginx config with:
  - API proxy to backend service
  - Gzip compression
  - Static asset caching (1 year)
  - Security headers
  - React Router support (SPA fallback)
- Runs as non-root user
- Includes health check

### docker-compose.yml

**Features:**
- Bridge network for service communication
- Health checks for both services
- Frontend depends on backend health
- Environment variables from `.env` file
- Service restart policies
- Named containers for easier management

## 🔧 Common Commands

### Development

```bash
# Start services
docker-compose up

# Start in detached mode
docker-compose up -d

# Rebuild after code changes
docker-compose up --build

# View logs
docker-compose logs -f [service_name]

# Execute commands in container
docker-compose exec backend bash
docker-compose exec frontend sh
```

### Production

```bash
# Start services in production mode
docker-compose up -d --build

# View resource usage
docker stats

# Scale backend workers (if needed)
docker-compose up -d --scale backend=3
```

### Maintenance

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Remove all containers and images
docker-compose down --rmi all

# Restart a specific service
docker-compose restart backend

# View backend logs
docker-compose logs -f backend
```

## 🔍 Health Checks

Both services include health checks:

**Backend:**
- Endpoint: `/api/auth/debug/config`
- Interval: 30s
- Timeout: 10s
- Start period: 40s

**Frontend:**
- Check: HTTP GET to port 80
- Interval: 30s
- Timeout: 3s
- Start period: 10s

Check health status:
```bash
docker-compose ps
```

## 🔒 Security Best Practices

1. **Non-root users**: Both containers run as non-root users
2. **Environment variables**: Sensitive data in `.env` file (never commit!)
3. **Security headers**: Nginx adds security headers
4. **Network isolation**: Services communicate via internal network
5. **Minimal images**: Use slim/alpine variants

## 🐛 Troubleshooting

### Backend not starting

```bash
# Check logs
docker-compose logs backend

# Common issues:
# - Missing environment variables
# - Database connection issues
# - Port 5000 already in use
```

### Frontend not building

```bash
# Check build logs
docker-compose logs frontend

# Common issues:
# - Node out of memory (increase Docker memory)
# - Missing environment variables
# - Build errors in React code
```

### Services can't communicate

```bash
# Check network
docker network inspect when_when-network

# Ensure both services are on same network
docker-compose ps
```

### Port conflicts

```bash
# Change ports in docker-compose.yml
ports:
  - "8080:80"  # Use 8080 instead of 80
  - "5001:5000"  # Use 5001 instead of 5000
```

## 🚀 Production Deployment

### Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml when

# Check services
docker stack services when
```

### Using Kubernetes

Convert docker-compose.yml to Kubernetes manifests:

```bash
# Using kompose
kompose convert -f docker-compose.yml
```

### Environment-Specific Configurations

Create multiple compose files:

```bash
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    environment:
      - FLASK_ENV=production
  frontend:
    ports:
      - "443:80"  # HTTPS
```

Run with:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📊 Monitoring

### View resource usage

```bash
# Real-time stats
docker stats

# Specific container
docker stats when-backend
```

### Logs management

```bash
# Limit log size in docker-compose.yml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 🔄 CI/CD Integration

### Example GitHub Actions

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and push images
        run: |
          docker-compose build
          docker-compose push
      
      - name: Deploy to server
        run: |
          ssh user@server 'cd /app && docker-compose pull && docker-compose up -d'
```

## 📝 Notes

- The backend runs on Gunicorn with 4 workers (adjust based on CPU cores)
- Frontend build includes all environment variables at build time
- Nginx caches static assets for 1 year
- API requests are proxied from `/api/*` to `backend:5000`
- Both services have automatic restart policies

## 🆘 Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables in `.env`
3. Ensure all required ports are available
4. Check Docker and Docker Compose versions

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [Gunicorn Documentation](https://docs.gunicorn.org/)

