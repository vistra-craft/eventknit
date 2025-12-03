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

# Prune unused images to save space
echo "🧹 Cleaning up..."
docker image prune -f

echo "✅ Deployment complete!"
