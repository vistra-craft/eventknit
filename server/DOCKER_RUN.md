# Running EventKnit Server with Docker

## Quick Start

### 1. Prerequisites

- Docker installed and running
- Docker Compose v2.x (run `docker compose version` to check)

### 2. Basic Setup

```bash
# Navigate to server directory
cd server

# Start all services (builds images if needed)
docker compose up --build

# Or run in background (detached mode)
docker compose up -d --build
```

This will:

- Build the EventKnit server image
- Start PostgreSQL database
- Start Redis cache
- Start the EventKnit server
- Wait for dependencies to be healthy before starting the server

### 3. Run Database Migrations

After services start, run migrations:

```bash
# Run Prisma migrations
docker compose exec eventknit-server npm run prisma:migrate:deploy

# Seed the database (optional - creates superadmin)
docker compose exec eventknit-server npm run prisma:seed
```

### 4. Verify Services

```bash
# Check service status
docker compose ps

# Check logs
docker compose logs -f eventknit-server

# Test health endpoint
curl http://localhost:3001/health
```

## Service Access

### EventKnit API Server

- **URL**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/health`
- **API Docs**: `http://localhost:3001/api/v1/status`

### PostgreSQL Database

- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `eventknit`
- **User**: `eventknit`
- **Password**: `eventknit123` (default)

### Redis Cache

- **Host**: `localhost`
- **Port**: `6379`
- **Password**: `SecureRedisPassword123!` (default)

### PgAdmin (Development Only)

- **URL**: `http://localhost:8080`
- **Email**: `admin@eventknit.com` (default)
- **Password**: `admin` (default)

To start PgAdmin:

```bash
docker compose --profile dev up -d
```

## Common Commands

### Starting Services

```bash
# Start all services
docker compose up

# Start in background
docker compose up -d

# Start with rebuild
docker compose up --build

# Start specific services only
docker compose up postgres redis
```

### Stopping Services

```bash
# Stop all services (keeps containers)
docker compose stop

# Stop and remove containers
docker compose down

# Stop and remove containers + volumes (⚠️ deletes data)
docker compose down -v
```

### Viewing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f eventknit-server

# Last 100 lines
docker compose logs --tail=100 eventknit-server

# Follow logs with timestamps
docker compose logs -f -t eventknit-server
```

### Database Operations

```bash
# Run migrations
docker compose exec eventknit-server npm run prisma:migrate:deploy

# Generate Prisma Client
docker compose exec eventknit-server npm run prisma:generate

# Open Prisma Studio (database GUI)
docker compose exec eventknit-server npm run prisma:studio
# Then access at http://localhost:5555

# Seed database
docker compose exec eventknit-server npm run prisma:seed

# Access PostgreSQL CLI
docker compose exec postgres psql -U eventknit -d eventknit
```

### Container Management

```bash
# Execute commands in container
docker compose exec eventknit-server sh

# Restart a service
docker compose restart eventknit-server

# View service status
docker compose ps

# Check resource usage
docker stats
```

## Environment Variables

Create a `.env` file (or use `.env.development`) to customize settings:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database
POSTGRES_USER=eventknit
POSTGRES_PASSWORD=your_password_here
POSTGRES_DB=eventknit
DATABASE_URL=postgresql://eventknit:your_password_here@postgres:5432/eventknit?schema=public

# Redis
REDIS_PASSWORD=your_redis_password_here
REDIS_URL=redis://:your_redis_password_here@redis:6379

# JWT Secrets (IMPORTANT: Change in production!)
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@eventknit.com

# CORS
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

Then start services:

```bash
docker compose up
```

## Development Workflow

### 1. First Time Setup

```bash
# 1. Start services
docker compose up -d

# 2. Wait for services to be healthy (check with: docker compose ps)

# 3. Run migrations
docker compose exec eventknit-server npm run prisma:migrate:deploy

# 4. Seed database
docker compose exec eventknit-server npm run prisma:seed

# 5. Check server logs
docker compose logs -f eventknit-server
```

### 2. Making Code Changes

For production builds (current setup), you need to rebuild:

```bash
# Rebuild and restart
docker compose up --build -d

# Or just restart if no code changes
docker compose restart eventknit-server
```

**Note**: For hot reload during development, run locally:

```bash
npm run dev
```

### 3. Database Changes

```bash
# 1. Modify prisma/schema.prisma

# 2. Create migration
docker compose exec eventknit-server npm run prisma:migrate

# 3. Restart server (if needed)
docker compose restart eventknit-server
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker compose logs

# Check if ports are in use
lsof -i :3001  # Server
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Verify Docker is running
docker ps
```

### Database Connection Errors

```bash
# Check PostgreSQL is healthy
docker compose ps postgres

# Check database logs
docker compose logs postgres

# Verify DATABASE_URL in server
docker compose exec eventknit-server env | grep DATABASE_URL
```

### Redis Connection Errors

```bash
# Check Redis password matches
docker compose exec redis redis-cli -a SecureRedisPassword123! ping

# Verify REDIS_URL in server
docker compose exec eventknit-server env | grep REDIS_URL
```

### Build Failures

```bash
# Clean build (no cache)
docker compose build --no-cache

# Check Dockerfile syntax
docker build -t test-image .

# View build logs
docker compose build eventknit-server
```

### Permission Errors

```bash
# Fix log directory permissions
sudo chown -R $USER:$USER ./logs

# Fix container permissions
docker compose exec eventknit-server ls -la /app
```

## Production Deployment

### 1. Set Production Environment

```env
NODE_ENV=production
# Use strong passwords and secrets!
JWT_SECRET=<generate-strong-secret>
JWT_REFRESH_SECRET=<generate-strong-secret>
POSTGRES_PASSWORD=<strong-password>
REDIS_PASSWORD=<strong-password>
```

### 2. Build Production Image

```bash
# Build optimized image
docker compose build

# Tag for registry
docker tag eventknit-server:latest your-registry/eventknit-server:v1.0.0
```

### 3. Deploy

```bash
# Start in production mode
NODE_ENV=production docker compose up -d

# Or use docker-compose.prod.yml if you create one
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Useful Scripts

Create these in `package.json` for convenience:

```json
{
  "scripts": {
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "docker:logs": "docker compose logs -f eventknit-server",
    "docker:migrate": "docker compose exec eventknit-server npm run prisma:migrate:deploy",
    "docker:seed": "docker compose exec eventknit-server npm run prisma:seed",
    "docker:studio": "docker compose exec eventknit-server npm run prisma:studio",
    "docker:rebuild": "docker compose up --build -d",
    "docker:clean": "docker compose down -v && docker system prune -f"
  }
}
```

Then use:

```bash
npm run docker:up
npm run docker:logs
npm run docker:migrate
```

## Health Checks

All services include health checks. Monitor them:

```bash
# View health status
docker compose ps

# Manual health check
curl http://localhost:3001/health

# Check specific service
docker inspect --format='{{.State.Health.Status}}' eventknit-server
```

## Next Steps

1. **API Testing**: Use Postman/Insomnia to test endpoints
2. **Monitoring**: Set up logging and monitoring
3. **Backups**: Configure PostgreSQL backups
4. **SSL**: Add reverse proxy (nginx) for HTTPS
5. **Scaling**: Consider Docker Swarm or Kubernetes for production












