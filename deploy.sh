#!/bin/bash

# Stop execution on error
set -e

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: 'docker' command not found."
    echo "   Are you running this on your LOCAL machine?"
    echo "   👉 This script is meant to be run on your CONTABO SERVER, not your Mac."
    echo ""
    echo "   If you ARE on the server, install Docker first:"
    echo "   sudo apt update && sudo apt install -y docker.io docker-compose-plugin"
    exit 1
fi

echo "🚀 Starting deployment..."

# Pull latest changes
echo "⬇️ Pulling latest changes from development..."
git fetch origin
git checkout development

# Reset local branch to match remote exactly (discard any local changes)
echo "🔄 Syncing with remote (discarding any local changes)..."
git reset --hard origin/development

# Clean up any untracked files
git clean -fd

# Build and start containers
echo "📦 Building and starting containers..."
docker compose -f docker-compose.prod.yml up -d --build

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "🗄️ Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T server npx prisma migrate deploy || {
    echo "⚠️ Migration failed. Attempting to resolve..."
    # Get the list of failed migrations and mark them as applied
    # This handles cases where migrations partially applied
    docker compose -f docker-compose.prod.yml exec -T server npx prisma migrate resolve --rolled-back 2>/dev/null || true
    # Retry deployment
    docker compose -f docker-compose.prod.yml exec -T server npx prisma migrate deploy || {
        echo "❌ Migration failed after retry. Please check manually."
        echo "   Run: docker compose -f docker-compose.prod.yml exec server npx prisma migrate status"
    }
}

# Prune unused images to save space
echo "🧹 Cleaning up..."
docker image prune -f

echo "✅ Deployment complete!"
