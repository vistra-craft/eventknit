#!/bin/bash

# Docker Compose Environment Manager for EventKnit Auth Service

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
    echo "Usage: $0 {dev|staging|prod} {up|down|logs|build|restart}"
    echo ""
    echo "Environments:"
    echo "  dev      - Development environment with hot reload"
    echo "  staging  - Staging environment (production-like)"
    echo "  prod     - Production environment"
    echo ""
    echo "Commands:"
    echo "  up       - Start services"
    echo "  down     - Stop services"
    echo "  logs     - Show logs"
    echo "  build    - Build/rebuild services"
    echo "  restart  - Restart services"
    echo ""
    echo "Examples:"
    echo "  $0 dev up"
    echo "  $0 staging logs"
    echo "  $0 prod build"
}

# Function to validate environment
validate_environment() {
    case $1 in
        dev|development)
            ENV_FILE=".env.development"
            ;;
        staging)
            ENV_FILE=".env.staging"
            ;;
        prod|production)
            ENV_FILE=".env.production"
            ;;
        *)
            print_error "Invalid environment: $1"
            show_usage
            exit 1
            ;;
    esac

    if [ ! -f "$ENV_FILE" ]; then
        print_error "Environment file $ENV_FILE not found!"
        exit 1
    fi
}

# Function to validate command
validate_command() {
    case $1 in
        up|down|logs|build|restart)
            ;;
        *)
            print_error "Invalid command: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Function to run docker-compose command
run_docker_compose() {
    local env_file=$1
    local command=$2
    local compose_args=$3

    print_status "Using environment file: $env_file"
    
    case $command in
        up)
            print_status "Starting services..."
            docker-compose --env-file "$env_file" up -d $compose_args
            print_success "Services started successfully!"
            ;;
        down)
            print_status "Stopping services..."
            docker-compose --env-file "$env_file" down $compose_args
            print_success "Services stopped successfully!"
            ;;
        logs)
            print_status "Showing logs..."
            docker-compose --env-file "$env_file" logs -f $compose_args
            ;;
        build)
            print_status "Building services..."
            docker-compose --env-file "$env_file" build $compose_args
            print_success "Services built successfully!"
            ;;
        restart)
            print_status "Restarting services..."
            docker-compose --env-file "$env_file" restart $compose_args
            print_success "Services restarted successfully!"
            ;;
    esac
}

# Main script logic
main() {
    if [ $# -lt 2 ]; then
        show_usage
        exit 1
    fi

    local environment=$1
    local command=$2
    local compose_args=${3:-""}

    validate_environment "$environment"
    validate_command "$command"

    print_status "Managing EventKnit Auth Service"
    print_status "Environment: $environment"
    print_status "Command: $command"

    run_docker_compose "$ENV_FILE" "$command" "$compose_args"
}

# Run main function with all arguments
main "$@"


