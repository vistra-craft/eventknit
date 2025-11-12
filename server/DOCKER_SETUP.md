# Docker Setup Guide

This guide explains how to build and run EventKnit server using Docker.

## Overview

The Docker setup uses a multi-stage build pattern (similar to `wheela`) for optimized production images:

- **Builder Stage**: Installs all dependencies, generates Prisma Client, and compiles TypeScript
- **Production Stage**: Only includes production dependencies and built artifacts

## Prerequisites

- Docker installed and running
- Docker Compose (v2.x recommended: `docker compose`, or legacy `docker-compose`)

## Quick Start

### 1. Build and Start Services

```bash
# Build and start all services (PostgreSQL, Redis, and EventKnit server)
docker compose up --build

# Run in detached mode (background)
docker compose up -d --build

# Start with pgadmin (development profile)
docker compose --profile dev up --build
```

### 2. Check Service Status

```bash
# View running containers
docker compose ps

# View logs
docker compose logs -f eventknit-server

# Check health
docker compose ps  # Shows health status
```

### 3. Stop Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes data)
docker compose down -v
```

## Services

### eventknit-server
- **Port**: 3001
- **Health Check**: `http://localhost:3001/health`
- **Dependencies**: PostgreSQL, Redis
- **Restart Policy**: `unless-stopped`

### postgres
- **Port**: 5432
- **Database**: `eventknit`
- **User**: `eventknit`
- **Health Check**: `pg_isready`
- **Volume**: `postgres_data`

### redis
- **Port**: 6379
- **Health Check**: `redis-cli ping`
- **Volume**: `redis_data`

### pgadmin (Development Only)
- **Port**: 8080
- **Access**: `http://localhost:8080`
- **Email**: `admin@eventknit.com` (default)
- **Profile**: `dev` (only starts with `--profile dev`)

## Environment Variables

Configure services using environment variables or `.env` files:

```bash
# Server Configuration
NODE_ENV=production
PORT=3001

# Database
POSTGRES_USER=eventknit
POSTGRES_PASSWORD=your_password
POSTGRES_DB=eventknit
DATABASE_URL=postgresql://eventknit:password@postgres:5432/eventknit?schema=public

# JWT Secrets
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Redis
REDIS_URL=redis://redis:6379

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_password
```

## Database Migrations

After starting services, run migrations:

```bash
# Execute migrations
docker compose exec eventknit-server npm run prisma:migrate:deploy

# Seed database (optional)
docker compose exec eventknit-server npm run prisma:seed
```

## Development Workflow

### Hot Reload (Not Available in Docker)

Docker runs the production build. For development with hot reload, run locally:

```bash
npm run dev
```

### Accessing Services

```bash
# Execute commands in running container
docker compose exec eventknit-server npm run prisma:studio

# Open shell in container
docker compose exec eventknit-server sh

# View PostgreSQL logs
docker compose logs postgres

# View Redis logs
docker compose logs redis
```

## Troubleshooting

### Build Fails

1. **Prisma Generation Error**: Ensure `scripts/prisma-generate.js` exists and works without DATABASE_URL
   ```bash
   npm run prisma:generate
   ```

2. **TypeScript Errors**: Fix type errors before building
   ```bash
   npm run type-check
   ```

### Container Won't Start

1. **Check Logs**:
   ```bash
   docker compose logs eventknit-server
   ```

2. **Check Health Status**:
   ```bash
   docker compose ps
   ```

3. **Verify Dependencies**: Ensure PostgreSQL and Redis are healthy before server starts

### Database Connection Issues

1. **Verify DATABASE_URL** matches PostgreSQL service name:
   ```
   postgresql://user:password@postgres:5432/database
   ```

2. **Check PostgreSQL Health**:
   ```bash
   docker compose ps postgres
   ```

### Port Conflicts

If ports are already in use:

```bash
# Change ports in docker-compose.yml or use environment variables
POSTGRES_PORT=5433 docker compose up
```

## Production Deployment

1. **Set Production Environment Variables**:
   - Use secrets management (Docker secrets, Kubernetes secrets, etc.)
   - Never commit `.env` files with real credentials

2. **Build Optimized Image**:
   ```bash
   docker build -t eventknit-server:latest .
   ```

3. **Run with Production Settings**:
   ```bash
   NODE_ENV=production docker compose up -d
   ```

## Health Checks

All services have health checks configured:

- **Server**: `GET /health` endpoint (every 30s)
- **PostgreSQL**: `pg_isready` command (every 10s)
- **Redis**: `redis-cli ping` (every 30s)

Services wait for dependencies to be healthy before starting (via `depends_on` conditions).

## Comparison with Wheela

This Docker setup matches `wheela`'s patterns:
- ✅ Multi-stage Dockerfile (builder + production)
- ✅ Proper health checks with `curl`
- ✅ Non-root user for security
- ✅ Service dependencies with health check conditions
- ✅ Volume persistence for data
- ✅ Network isolation
- ✅ `.dockerignore` for build optimization













