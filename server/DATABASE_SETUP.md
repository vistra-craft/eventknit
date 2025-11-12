# PostgreSQL Database Setup

## Quick Start with Docker

### 1. Update your `.env.development` file

Add PostgreSQL configuration to your `.env.development` file:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://eventknit:eventknit123@postgres:5432/eventknit?schema=public"
POSTGRES_USER=eventknit
POSTGRES_PASSWORD=eventknit123
POSTGRES_DB=eventknit
POSTGRES_PORT=5432
```

### 2. Start PostgreSQL with Docker

```bash
# Using the docker manager script (recommended)
./docker-manager.sh dev up

# Or manually with docker compose
docker compose --env-file .env.development up -d postgres

# Or using docker-compose (older versions)
docker-compose --env-file .env.development up -d postgres
```

### 3. Verify PostgreSQL is running

```bash
# Check container status
docker ps | grep postgres

# Test connection
docker exec -it eventknit-postgres psql -U eventknit -d eventknit -c "SELECT version();"
```

### 4. Generate Prisma Client and Run Migrations

```bash
# Generate Prisma client (reads from .env or DATABASE_URL)
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (creates superadmin)
npm run prisma:seed
```

## Environment-Specific Setup

### Development Environment

```bash
# Start all services (server, postgres, redis)
./docker-manager.sh dev up

# Or manually
docker compose --env-file .env.development up -d

# Access PgAdmin (optional, for database management)
# Available at http://localhost:8080
# Email: admin@eventknit.com
# Password: admin
```

**Database URL for local development** (when connecting from outside Docker):

```env
DATABASE_URL="postgresql://eventknit:eventknit123@localhost:5432/eventknit?schema=public"
```

**Database URL for Docker services** (when connecting from within Docker network):

```env
DATABASE_URL="postgresql://eventknit:eventknit123@postgres:5432/eventknit?schema=public"
```

### Staging Environment

```bash
# Update .env.staging with PostgreSQL credentials
./docker-manager.sh staging up
```

### Production Environment

```bash
# Update .env.production with production PostgreSQL credentials
./docker-manager.sh prod up
```

## Docker Compose Services

The `docker-compose.yml` includes:

- **postgres**: PostgreSQL 15 database
- **redis**: Redis for caching
- **pgadmin**: Database management UI (development profile only)
- **eventknit-server**: Your application server

## Accessing the Database

### From within Docker network

- Host: `postgres`
- Port: `5432`
- Database URL: `postgresql://eventknit:eventknit123@postgres:5432/eventknit`

### From local machine

- Host: `localhost`
- Port: `5432` (or `POSTGRES_PORT` from .env)
- Database URL: `postgresql://eventknit:eventknit123@localhost:5432/eventknit`

### Using PgAdmin (Development only)

1. Start services with dev profile:

   ```bash
   docker compose --env-file .env.development --profile dev up -d
   ```

2. Access PgAdmin at: http://localhost:8080
3. Login with credentials from `.env.development`
4. Add server:
   - Host: `postgres` (or `localhost` if connecting externally)
   - Port: `5432`
   - Username: `eventknit`
   - Password: `eventknit123`
   - Database: `eventknit`

## Useful Commands

### View logs

```bash
docker compose --env-file .env.development logs -f postgres
```

### Stop services

```bash
./docker-manager.sh dev down
# Or
docker compose --env-file .env.development down
```

### Reset database (⚠️ Deletes all data)

```bash
docker compose --env-file .env.development down -v
docker compose --env-file .env.development up -d postgres
npm run prisma:migrate
npm run prisma:seed
```

### Backup database

```bash
docker exec eventknit-postgres pg_dump -U eventknit eventknit > backup.sql
```

### Restore database

```bash
docker exec -i eventknit-postgres psql -U eventknit eventknit < backup.sql
```

## Troubleshooting

### Port already in use

If port 5432 is already in use:

1. Change `POSTGRES_PORT` in `.env.development`
2. Update `DATABASE_URL` to use the new port

### Connection refused

- Ensure PostgreSQL container is running: `docker ps | grep postgres`
- Check logs: `docker compose --env-file .env.development logs postgres`
- Verify DATABASE_URL format
- For local connections, use `localhost` instead of `postgres`

### Cannot generate Prisma client

Ensure `DATABASE_URL` is set in your `.env` file or environment:

```bash
export DATABASE_URL="postgresql://eventknit:eventknit123@localhost:5432/eventknit?schema=public"
npm run prisma:generate
```

## Alternative: Local PostgreSQL Installation

If you prefer to install PostgreSQL locally instead of using Docker:

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Create Database and User

```bash
sudo -u postgres psql
CREATE DATABASE eventknit;
CREATE USER eventknit WITH PASSWORD 'eventknit123';
GRANT ALL PRIVILEGES ON DATABASE eventknit TO eventknit;
\q
```

### Update .env.development

```env
DATABASE_URL="postgresql://eventknit:eventknit123@localhost:5432/eventknit?schema=public"
```

Then update `docker-compose.yml` to remove the postgres service or set `RESTART_POLICY=no` to prevent Docker from starting it.
