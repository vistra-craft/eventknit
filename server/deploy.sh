#!/bin/bash

# EventKnit Server Deployment Script
# This script demonstrates how to deploy with different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "EventKnit Server Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND] [ENVIRONMENT]"
    echo ""
    echo "Commands:"
    echo "  dev       - Start development environment"
    echo "  staging   - Start staging environment"
    echo "  prod      - Start production environment"
    echo "  stop      - Stop all services"
    echo "  logs      - Show logs for all services"
    echo "  scale     - Scale server instances"
    echo "  status    - Show service status"
    echo ""
    echo "Environments:"
    echo "  development  - Development with hot reload"
    echo "  staging      - Pre-production testing"
    echo "  production   - Production deployment"
    echo ""
    echo "Examples:"
    echo "  $0 dev development"
    echo "  $0 prod production"
    echo "  $0 scale production 5"
}

# Function to check if environment file exists
check_env_file() {
    local env=$1
    if [ ! -f ".env.${env}" ]; then
        print_error "Environment file .env.${env} not found!"
        print_status "Available environment files:"
        ls -la .env.* 2>/dev/null || echo "No environment files found"
        exit 1
    fi
}

# Function to start services
start_services() {
    local env=$1
    print_status "Starting EventKnit Server in ${env} environment..."
    
    check_env_file $env
    
    # Copy environment file to .env
    cp ".env.${env}" .env
    
    # Start services
    docker-compose up -d
    
    print_success "Services started successfully!"
    print_status "Server: http://localhost:3001"
    print_status "MongoDB: localhost:27017"
    print_status "Redis: localhost:6379"
    
    if [ "$env" = "development" ]; then
        print_status "Mongo Express: http://localhost:8081"
    fi
}

# Function to stop services
stop_services() {
    print_status "Stopping all services..."
    docker-compose down
    print_success "All services stopped!"
}

# Function to show logs
show_logs() {
    print_status "Showing logs for all services..."
    docker-compose logs -f
}

# Function to scale services
scale_services() {
    local env=$1
    local replicas=${2:-2}
    
    print_status "Scaling server to ${replicas} instances in ${env} environment..."
    
    check_env_file $env
    cp ".env.${env}" .env
    
    # Update SERVER_REPLICAS in .env
    sed -i "s/SERVER_REPLICAS=.*/SERVER_REPLICAS=${replicas}/" .env
    
    # Scale the service
    docker-compose up -d --scale eventknit-server=${replicas}
    
    print_success "Scaled to ${replicas} server instances!"
}

# Function to show status
show_status() {
    print_status "Service Status:"
    docker-compose ps
    
    echo ""
    print_status "Resource Usage:"
    docker stats --no-stream $(docker-compose ps -q) 2>/dev/null || echo "No running containers"
}

# Main script logic
case "${1:-help}" in
    "dev")
        start_services "development"
        ;;
    "staging")
        start_services "staging"
        ;;
    "prod")
        start_services "production"
        ;;
    "stop")
        stop_services
        ;;
    "logs")
        show_logs
        ;;
    "scale")
        if [ -z "$2" ] || [ -z "$3" ]; then
            print_error "Usage: $0 scale [environment] [replicas]"
            print_status "Example: $0 scale production 5"
            exit 1
        fi
        scale_services "$2" "$3"
        ;;
    "status")
        show_status
        ;;
    "help"|*)
        show_usage
        ;;
esac
