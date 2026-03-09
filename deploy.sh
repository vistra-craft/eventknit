#!/bin/bash

# =============================================================================
# EventKnit Deployment Script
# =============================================================================
# This script is executed by GitHub Actions on the production server.
# It handles building, deploying, and verifying the application.
# =============================================================================

set -e  # Exit on any error
set -o pipefail  # Exit on pipe failures

# Configuration
COMPOSE_FILE="docker-compose.dev.yml"
MAX_HEALTH_WAIT=120  # Maximum seconds to wait for health checks
HEALTH_CHECK_INTERVAL=5  # Seconds between health checks

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "'docker' command not found."
        log_error "This script is meant to be run on the CONTABO SERVER, not your local machine."
        exit 1
    fi
}

# Wait for a container to be healthy
wait_for_healthy() {
    local container=$1
    local max_wait=$2
    local elapsed=0

    log_info "Waiting for $container to be healthy..."

    while [ $elapsed -lt $max_wait ]; do
        local health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "not_found")

        if [ "$health" = "healthy" ]; then
            log_info "$container is healthy!"
            return 0
        elif [ "$health" = "not_found" ]; then
            log_error "Container $container not found"
            return 1
        fi

        sleep $HEALTH_CHECK_INTERVAL
        elapsed=$((elapsed + HEALTH_CHECK_INTERVAL))
        echo -n "."
    done

    echo ""
    log_error "$container did not become healthy within ${max_wait}s"
    log_error "Container logs:"
    docker logs "$container" --tail=50 2>&1
    return 1
}

# Run database migrations with proper error handling
run_migrations() {
    log_info "Running database migrations..."

    # First, check migration status
    local status_output
    status_output=$(docker compose -f "$COMPOSE_FILE" exec -T server npx prisma migrate status 2>&1) || true

    # Check for failed migrations
    if echo "$status_output" | grep -q "failed"; then
        log_warn "Found failed migrations, attempting to resolve..."

        # Extract failed migration names and try to resolve them
        local failed_migrations
        failed_migrations=$(echo "$status_output" | grep -oP '`\K[^`]+(?=` migration)' || true)

        for migration in $failed_migrations; do
            log_info "Attempting to resolve migration: $migration"

            # Try marking as applied first (for partial applications)
            docker compose -f "$COMPOSE_FILE" exec -T server \
                npx prisma migrate resolve --applied "$migration" 2>/dev/null || \
            docker compose -f "$COMPOSE_FILE" exec -T server \
                npx prisma migrate resolve --rolled-back "$migration" 2>/dev/null || true
        done
    fi

    # Now run migrations
    if docker compose -f "$COMPOSE_FILE" exec -T server npx prisma migrate deploy; then
        log_info "Migrations completed successfully!"
        return 0
    else
        log_error "Migration failed. Checking status..."
        docker compose -f "$COMPOSE_FILE" exec -T server npx prisma migrate status
        return 1
    fi
}

# Verify deployment with health checks
verify_deployment() {
    log_info "Verifying deployment..."

    # Check server health via HTTP
    local max_attempts=10
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker compose -f "$COMPOSE_FILE" exec -T server curl -sf http://localhost:3001/health > /dev/null 2>&1; then
            log_info "Server API is responding!"
            return 0
        fi

        attempt=$((attempt + 1))
        sleep 3
    done

    log_error "Server API health check failed after $max_attempts attempts"
    return 1
}

# =============================================================================
# Main Deployment Flow
# =============================================================================

main() {
    log_info "=========================================="
    log_info "Starting EventKnit Deployment"
    log_info "=========================================="

    # Step 1: Verify Docker is available
    check_docker

    # Step 2: Ensure infrastructure (postgres + redis) is running.
    # Do NOT bring them down — this kills data connections and causes the
    # "server refuses to connect" window during every deploy.
    log_info "Ensuring infrastructure is running (postgres + redis)..."
    docker compose -f "$COMPOSE_FILE" up -d postgres redis

    # Step 3: Wait for database to be healthy before doing anything else
    if ! wait_for_healthy "eventknit-postgres" 60; then
        log_error "Database failed to start"
        exit 1
    fi

    # Step 4: Build new application images without stopping the running ones
    log_info "Building new application images..."
    docker compose -f "$COMPOSE_FILE" build --no-cache server client

    # Step 5: Run migrations against the already-running database
    # (Run before swapping containers so the schema is ready when the new server starts)
    if ! run_migrations; then
        log_warn "Migration issues detected, but continuing..."
    fi

    # Step 6: Swap server and client containers with zero-infra downtime
    log_info "Replacing server and client containers..."
    docker compose -f "$COMPOSE_FILE" up -d --no-deps --force-recreate server client

    # Step 7: Recreate nginx so it picks up any config changes
    docker compose -f "$COMPOSE_FILE" up -d --no-deps --force-recreate nginx

    # Step 8: Wait for new server to be healthy
    if ! wait_for_healthy "eventknit-server" "$MAX_HEALTH_WAIT"; then
        log_error "Server failed to start"
        log_error "Attempting to show server logs:"
        docker logs eventknit-server --tail=100
        exit 1
    fi

    # Step 9: Verify the API is reachable
    if ! verify_deployment; then
        log_error "Deployment verification failed!"
        exit 1
    fi

    # Step 10: Cleanup old dangling images
    log_info "Cleaning up unused Docker resources..."
    docker image prune -f
    docker builder prune -f --filter "until=24h" 2>/dev/null || true

    # Step 11: Show final status
    log_info "=========================================="
    log_info "Deployment completed successfully!"
    log_info "=========================================="
    docker compose -f "$COMPOSE_FILE" ps

    log_info ""
    log_info "Health endpoints:"
    log_info "  - Server: http://localhost:3001/health"
    log_info "  - Client: http://localhost:3000/health"
}

# Run main function
main "$@"
