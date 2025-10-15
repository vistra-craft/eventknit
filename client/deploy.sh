#!/bin/bash

# EventKnit Client Deployment Script
# This script handles client deployment separately from server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

show_usage() {
    echo "EventKnit Client Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND] [ENVIRONMENT]"
    echo ""
    echo "Commands:"
    echo "  dev       - Start development server"
    echo "  build     - Build for production"
    echo "  preview   - Preview production build"
    echo "  docker    - Build and run with Docker"
    echo "  deploy    - Deploy to production"
    echo ""
    echo "Environments:"
    echo "  development  - Development with hot reload"
    echo "  staging      - Staging build"
    echo "  production   - Production build"
    echo ""
    echo "Examples:"
    echo "  $0 dev development"
    echo "  $0 build production"
    echo "  $0 docker production"
}

# Function to check if environment file exists
check_env_file() {
    local env=$1
    if [ ! -f ".env.${env}" ]; then
        print_warning "Environment file .env.${env} not found, using defaults"
        return 1
    fi
    return 0
}

# Function to start development server
start_dev() {
    local env=$1
    print_status "Starting EventKnit Client in ${env} environment..."
    
    if check_env_file $env; then
        cp ".env.${env}" .env
    fi
    
    npm run dev
}

# Function to build for production
build_prod() {
    local env=$1
    print_status "Building EventKnit Client for ${env} environment..."
    
    if check_env_file $env; then
        cp ".env.${env}" .env
    fi
    
    npm run build
    print_success "Build completed! Files are in ./dist/"
}

# Function to preview production build
preview_build() {
    print_status "Starting preview server..."
    npm run preview
}

# Function to build and run with Docker
docker_deploy() {
    local env=$1
    print_status "Building and running EventKnit Client with Docker..."
    
    if check_env_file $env; then
        cp ".env.${env}" .env
    fi
    
    # Build the Docker image
    docker build -t eventknit-client:${env} .
    
    # Run the container
    docker run -d \
        --name eventknit-client-${env} \
        -p 3000:3000 \
        --env-file .env \
        eventknit-client:${env}
    
    print_success "Client running at http://localhost:3000"
}

# Function to deploy to production
deploy_prod() {
    local env=${1:-production}
    print_status "Deploying EventKnit Client to ${env}..."
    
    # Build for production
    build_prod $env
    
    # Here you would typically:
    # 1. Upload to CDN
    # 2. Deploy to static hosting (Vercel, Netlify, etc.)
    # 3. Update DNS records
    
    print_success "Deployment completed!"
    print_status "Next steps:"
    print_status "1. Upload ./dist/ to your hosting provider"
    print_status "2. Configure CDN if needed"
    print_status "3. Update DNS records"
}

# Main script logic
case "${1:-help}" in
    "dev")
        start_dev "${2:-development}"
        ;;
    "build")
        build_prod "${2:-production}"
        ;;
    "preview")
        preview_build
        ;;
    "docker")
        docker_deploy "${2:-production}"
        ;;
    "deploy")
        deploy_prod "${2:-production}"
        ;;
    "help"|*)
        show_usage
        ;;
esac
