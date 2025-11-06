#!/bin/bash
# Docker Commands Quick Reference for "When" Application
# Make this file executable: chmod +x docker-commands.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env exists
check_env() {
    if [ ! -f .env ]; then
        print_error ".env file not found! Please create it before running Docker."
        exit 1
    fi
    print_info ".env file found ✓"
}

# Build and start services
start() {
    print_info "Building and starting services..."
    check_env
    docker-compose up --build -d
    print_info "Services started! Access the app at http://localhost"
}

# Stop services
stop() {
    print_info "Stopping services..."
    docker-compose down
    print_info "Services stopped ✓"
}

# Restart services
restart() {
    print_info "Restarting services..."
    docker-compose restart
    print_info "Services restarted ✓"
}

# View logs
logs() {
    if [ -z "$1" ]; then
        print_info "Showing all logs (Ctrl+C to exit)..."
        docker-compose logs -f
    else
        print_info "Showing logs for $1 (Ctrl+C to exit)..."
        docker-compose logs -f "$1"
    fi
}

# Check service status
status() {
    print_info "Service status:"
    docker-compose ps
    echo ""
    print_info "Health status:"
    docker ps --format "table {{.Names}}\t{{.Status}}"
}

# Clean up everything
clean() {
    print_warning "This will remove all containers, images, and volumes!"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cleaning up..."
        docker-compose down -v --rmi all
        print_info "Cleanup complete ✓"
    else
        print_info "Cleanup cancelled"
    fi
}

# Rebuild a specific service
rebuild() {
    if [ -z "$1" ]; then
        print_error "Please specify a service: backend or frontend"
        exit 1
    fi
    print_info "Rebuilding $1..."
    docker-compose up -d --build "$1"
    print_info "$1 rebuilt ✓"
}

# Execute shell in container
shell() {
    if [ -z "$1" ]; then
        print_error "Please specify a service: backend or frontend"
        exit 1
    fi
    
    if [ "$1" = "backend" ]; then
        print_info "Opening bash shell in backend..."
        docker-compose exec backend bash
    elif [ "$1" = "frontend" ]; then
        print_info "Opening sh shell in frontend..."
        docker-compose exec frontend sh
    else
        print_error "Invalid service. Use: backend or frontend"
        exit 1
    fi
}

# Show resource usage
stats() {
    print_info "Resource usage (Ctrl+C to exit)..."
    docker stats
}

# Pull latest images
pull() {
    print_info "Pulling latest base images..."
    docker-compose pull
    print_info "Pull complete ✓"
}

# Show help
help() {
    cat << EOF
Docker Commands for "When" Application
======================================

Usage: ./docker-commands.sh [command]

Commands:
  start           Build and start all services
  stop            Stop all services
  restart         Restart all services
  logs [service]  View logs (optional: specify backend or frontend)
  status          Show service status and health
  clean           Remove all containers, images, and volumes
  rebuild [svc]   Rebuild a specific service (backend or frontend)
  shell [service] Open shell in container (backend or frontend)
  stats           Show resource usage
  pull            Pull latest base images
  help            Show this help message

Examples:
  ./docker-commands.sh start              # Start all services
  ./docker-commands.sh logs backend       # View backend logs
  ./docker-commands.sh rebuild frontend   # Rebuild only frontend
  ./docker-commands.sh shell backend      # Open shell in backend

Environment Variables:
  Make sure to create a .env file with required variables before running.

EOF
}

# Main command router
case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs "$2"
        ;;
    status)
        status
        ;;
    clean)
        clean
        ;;
    rebuild)
        rebuild "$2"
        ;;
    shell)
        shell "$2"
        ;;
    stats)
        stats
        ;;
    pull)
        pull
        ;;
    help|--help|-h)
        help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        help
        exit 1
        ;;
esac

