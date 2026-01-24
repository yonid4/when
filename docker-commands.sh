#!/bin/bash
# Docker Commands Quick Reference for "When" Application
# Make this file executable: chmod +x docker-commands.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default to production compose file
COMPOSE_FILE="docker-compose.yml"
MODE="production"

# Check for --local flag in arguments
for arg in "$@"; do
    if [ "$arg" = "--local" ]; then
        COMPOSE_FILE="docker-compose.local.yml"
        MODE="local"
        break
    fi
done

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

print_mode() {
    echo -e "${BLUE}[MODE]${NC} Running in ${MODE} mode (${COMPOSE_FILE})"
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
    print_mode
    print_info "Building and starting services..."
    check_env
    docker-compose -f "$COMPOSE_FILE" up --build -d
    print_info "Services started! Access the app at http://localhost"
}

# Stop services
stop() {
    print_mode
    print_info "Stopping services..."
    docker-compose -f "$COMPOSE_FILE" down
    print_info "Services stopped ✓"
}

# Restart services
restart() {
    print_mode
    print_info "Restarting services..."
    docker-compose -f "$COMPOSE_FILE" restart
    print_info "Services restarted ✓"
}

# View logs
logs() {
    print_mode
    if [ -z "$1" ] || [ "$1" = "--local" ]; then
        print_info "Showing all logs (Ctrl+C to exit)..."
        docker-compose -f "$COMPOSE_FILE" logs -f
    else
        print_info "Showing logs for $1 (Ctrl+C to exit)..."
        docker-compose -f "$COMPOSE_FILE" logs -f "$1"
    fi
}

# Check service status
status() {
    print_mode
    print_info "Service status:"
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""
    print_info "Health status:"
    docker ps --format "table {{.Names}}\t{{.Status}}"
}

# Clean up everything
clean() {
    print_mode
    print_warning "This will remove all containers, images, and volumes!"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cleaning up..."
        docker-compose -f "$COMPOSE_FILE" down -v --rmi all
        print_info "Cleanup complete ✓"
    else
        print_info "Cleanup cancelled"
    fi
}

# Rebuild a specific service
rebuild() {
    print_mode
    local service="$1"
    if [ "$service" = "--local" ]; then
        service="$2"
    fi
    
    if [ -z "$service" ]; then
        print_error "Please specify a service: backend or frontend"
        exit 1
    fi
    print_info "Rebuilding $service..."
    docker-compose -f "$COMPOSE_FILE" up -d --build "$service"
    print_info "$service rebuilt ✓"
}

# Execute shell in container
shell() {
    print_mode
    local service="$1"
    if [ "$service" = "--local" ]; then
        service="$2"
    fi
    
    if [ -z "$service" ]; then
        print_error "Please specify a service: backend or frontend"
        exit 1
    fi
    
    if [ "$service" = "backend" ]; then
        print_info "Opening bash shell in backend..."
        docker-compose -f "$COMPOSE_FILE" exec backend bash
    elif [ "$service" = "frontend" ]; then
        print_info "Opening sh shell in frontend..."
        docker-compose -f "$COMPOSE_FILE" exec frontend sh
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
    print_mode
    print_info "Pulling latest base images..."
    docker-compose -f "$COMPOSE_FILE" pull
    print_info "Pull complete ✓"
}

# Show help
help() {
    cat << EOF
Docker Commands for "When" Application
======================================

Usage: ./docker-commands.sh [command] [--local]

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

Flags:
  --local         Use local development configuration (HTTP-only, no SSL)
                  Uses docker-compose.local.yml instead of docker-compose.yml

Examples:
  # Production (HTTPS with SSL certificates)
  ./docker-commands.sh start              # Start production services
  ./docker-commands.sh logs backend       # View backend logs
  ./docker-commands.sh rebuild frontend   # Rebuild only frontend
  ./docker-commands.sh shell backend      # Open shell in backend

  # Local Development (HTTP-only, no SSL)
  ./docker-commands.sh start --local              # Start local dev services
  ./docker-commands.sh logs --local               # View all logs (local)
  ./docker-commands.sh logs backend --local       # View backend logs (local)
  ./docker-commands.sh rebuild frontend --local   # Rebuild frontend (local)
  ./docker-commands.sh shell backend --local      # Open shell in backend (local)
  ./docker-commands.sh stop --local               # Stop local services

Environment Variables:
  Make sure to create a .env file with required variables before running.

Configuration Files:
  docker-compose.yml       - Production (HTTPS, SSL certificates required)
  docker-compose.local.yml - Local development (HTTP-only, no SSL)

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

