#!/bin/bash

# Stop execution on error
set -e

echo "🚀 Starting deployment..."

# Pull latest changes
echo "⬇️ Pulling latest changes from development..."
git fetch origin
git checkout development
git pull origin development

# Build and start containers
echo "📦 Building and starting containers..."
docker compose -f docker-compose.prod.yml up -d --build

# Prune unused images to save space
echo "🧹 Cleaning up..."
docker image prune -f

echo "✅ Deployment complete!"
