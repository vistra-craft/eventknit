# Database Configuration Guide - Localhost vs Docker

This guide explains how to configure the database connection for both localhost development and Docker environments.

## Option 1: Using DB_HOST (Recommended)

The easiest way to switch between localhost and Docker is using the `DB_HOST` environment variable.

### For Localhost Development

In `server/.env.development`:

```env
DB_HOST=localhost
POSTGRES_USER=eventknit
POSTGRES_PASSWORD=Somepass123!
POSTGRES_DB=eventknit
POSTGRES_PORT=5432
```

This will automatically construct: `postgresql://eventknit:Somepass123!@localhost:5432/eventknit?schema=public`

### For Docker

In `server/.env.development`:

```env
DB_HOST=postgres
POSTGRES_USER=eventknit
POSTGRES_PASSWORD=Somepass123!
POSTGRES_DB=eventknit
POSTGRES_PORT=5432
```

This will automatically construct: `postgresql://eventknit:Somepass123!@postgres:5432/eventknit?schema=public`

## Option 2: Using Full DATABASE_URL

You can also set the full `DATABASE_URL` directly:

### For Localhost Development

```env
DATABASE_URL="postgresql://eventknit:Somepass123!@localhost:5432/eventknit?schema=public"
```

### For Docker

```env
DATABASE_URL="postgresql://eventknit:Somepass123!@postgres:5432/eventknit?schema=public"
```

## Quick Setup Commands

### Start PostgreSQL for Localhost Development

Using Docker Compose (recommended):

```bash
cd server
docker compose up -d postgres
```

Or using Docker directly:

```bash
docker run -d \
  -p 5432:5432 \
  -e POSTGRES_USER=eventknit \
  -e POSTGRES_PASSWORD=Somepass123! \
  -e POSTGRES_DB=eventknit \
  --name eventknit-postgres \
  postgres:16-alpine
```

### Switch Between Modes

**To switch to localhost mode:**

```bash
# Edit .env.development and set:
DB_HOST=localhost
# Or uncomment the localhost DATABASE_URL line
```

**To switch to Docker mode:**

```bash
# Edit .env.development and set:
DB_HOST=postgres
# Or uncomment the Docker DATABASE_URL line
```

**Then restart your backend server:**

```bash
npm run dev
```

## Verification

After starting PostgreSQL, verify the connection:

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Test connection
psql -h localhost -U eventknit -d eventknit
# Password: Somepass123!
```

## Troubleshooting

### "Connection refused" error

- Ensure PostgreSQL is running: `docker ps | grep postgres`
- Check `DB_HOST` matches your setup (localhost vs postgres)
- Verify credentials match your PostgreSQL setup

### "Access denied" error

- Check that `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` match your PostgreSQL setup
- Ensure the database exists: `docker exec -it eventknit-postgres psql -U eventknit -c "\l"`

### Running migrations

```bash
cd server
npm run prisma:generate
npm run prisma:migrate
```








