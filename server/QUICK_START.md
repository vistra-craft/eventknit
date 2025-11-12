# Quick Start Guide - EventKnit Auth Server

Complete step-by-step guide to set up PostgreSQL, Prisma, and run the project.

## Prerequisites

- Node.js >= 18.x
- Docker and Docker Compose (recommended) OR PostgreSQL installed locally
- npm or yarn

---

## Step 1: Set Up PostgreSQL

### Option A: Using Docker (Recommended)

#### 1.1 Update `.env.development` file

Copy `.env.example` to `.env.development` if you haven't already:

```bash
cp .env.example .env.development
```

The `.env.development` should have these PostgreSQL variables:

```env
DATABASE_URL="postgresql://eventknit:eventknit123@postgres:5432/eventknit?schema=public"
POSTGRES_USER=eventknit
POSTGRES_PASSWORD=eventknit123
POSTGRES_DB=eventknit
POSTGRES_PORT=5432
```

#### 1.2 Start PostgreSQL with Docker

```bash
# Using docker compose (recommended)
docker compose --env-file .env.development up -d postgres

# Or using the docker manager script
./docker-manager.sh dev up
```

#### 1.3 Verify PostgreSQL is running

```bash
# Check container status
docker ps | grep postgres

# Test connection
docker exec -it eventknit-postgres psql -U eventknit -d eventknit -c "SELECT version();"
```

✅ **Success**: You should see PostgreSQL version information.

---

### Option B: Local PostgreSQL Installation

#### 1.1 Install PostgreSQL

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**

```bash
brew install postgresql
brew services start postgresql
```

#### 1.2 Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql
```

In the PostgreSQL prompt, run:

```sql
-- Create database
CREATE DATABASE eventknit;

-- Create user
CREATE USER eventknit WITH PASSWORD 'eventknit123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE eventknit TO eventknit;

-- Exit
\q
```

#### 1.3 Update `.env.development`

For local connections, use `localhost` instead of `postgres`:

```env
DATABASE_URL="postgresql://eventknit:eventknit123@localhost:5432/eventknit?schema=public"
```

#### 1.4 Verify Connection

```bash
psql -U eventknit -d eventknit -h localhost -c "SELECT version();"
```

✅ **Success**: You should see PostgreSQL version information.

---

## Step 2: Set Up Prisma

### 2.1 Install Dependencies

```bash
npm install
```

### 2.2 Set DATABASE_URL in Environment

Make sure your `.env.development` has the correct `DATABASE_URL`:

**For Docker (from outside Docker network):**

```env
DATABASE_URL="postgresql://eventknit:eventknit123@localhost:5432/eventknit?schema=public"
```

**For Docker (from inside Docker network) or local:**

```env
DATABASE_URL="postgresql://eventknit:eventknit123@localhost:5432/eventknit?schema=public"
```

### 2.3 Generate Prisma Client

```bash
npm run prisma:generate
```

✅ **Success**: You should see "Generated Prisma Client" message.

### 2.4 Run Database Migrations

This creates all the tables in your database:

```bash
npm run prisma:migrate
```

When prompted, enter a migration name (e.g., `init`).

✅ **Success**: You should see "Migration applied successfully".

### 2.5 Verify Database Schema

```bash
# Using Prisma Studio (visual database browser)
npm run prisma:studio
```

This opens a browser at http://localhost:5555 where you can see your database tables.

---

## Step 3: Seed Database (Optional)

Create the superadmin user:

```bash
npm run prisma:seed
```

✅ **Success**: You should see:

```
✅ Superadmin created successfully!
📧 Email: vistracraft@gmail.com
🔑 Password: Somepass123!
```

**⚠️ Important**: Save these credentials! This is your superadmin account.

---

## Step 4: Run the Project

### 4.1 Start the Development Server

```bash
npm run dev
```

✅ **Success**: You should see:

```
🚀 EventKnit Server running on http://0.0.0.0:3001
📊 Environment: development
🔍 Health check: http://localhost:3001/health
📋 API status: http://localhost:3001/api/v1/status
🔐 Auth routes: http://localhost:3001/api/v1/auth
```

### 4.2 Test the Server

Open a new terminal and test the health endpoint:

```bash
curl http://localhost:3001/health
```

You should see a JSON response with server status.

---

## Step 5: Test Authentication (Optional)

### 5.1 Register a New User

```bash
curl -X POST http://localhost:3001/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User",
    "role": "ATTENDEE"
  }'
```

### 5.2 Login

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

You should receive an `accessToken` in the response.

### 5.3 Get Profile (Protected Route)

```bash
# Replace YOUR_ACCESS_TOKEN with the token from login
curl http://localhost:3001/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Common Commands Reference

### Docker Commands

```bash
# Start all services
docker compose --env-file .env.development up -d

# Stop all services
docker compose --env-file .env.development down

# View logs
docker compose --env-file .env.development logs -f

# Restart PostgreSQL
docker compose --env-file .env.development restart postgres
```

### Prisma Commands

```bash
# Generate Prisma Client (after schema changes)
npm run prisma:generate

# Create new migration
npm run prisma:migrate

# View database in browser
npm run prisma:studio

# Seed database
npm run prisma:seed
```

### Development Commands

```bash
# Start dev server
npm run dev

# Run tests
npm test

# Type check
npm run type-check

# Lint code
npm run lint
```

---

## Troubleshooting

### Issue: "Failed to connect to PostgreSQL"

**Solution:**

1. Check if PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   # OR
   sudo systemctl status postgresql
   ```
2. Verify DATABASE_URL in `.env.development`
3. Check PostgreSQL logs:
   ```bash
   docker compose --env-file .env.development logs postgres
   ```

### Issue: "Missing required environment variable: DATABASE_URL"

**Solution:**

1. Make sure `.env.development` exists
2. Verify DATABASE_URL is set:
   ```bash
   grep DATABASE_URL .env.development
   ```
3. Load environment variables:
   ```bash
   export $(cat .env.development | xargs)
   npm run prisma:generate
   ```

### Issue: "Migration failed" or "Relation already exists"

**Solution:**
Reset the database (⚠️ **This deletes all data**):

```bash
# Using Docker
docker compose --env-file .env.development down -v
docker compose --env-file .env.development up -d postgres
npm run prisma:migrate

# Or manually
psql -U eventknit -d eventknit -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run prisma:migrate
```

### Issue: "Port 5432 already in use"

**Solution:**

1. Change `POSTGRES_PORT` in `.env.development` (e.g., `5433`)
2. Update `DATABASE_URL` to use the new port
3. Restart PostgreSQL container

### Issue: Prisma Client not generated

**Solution:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run prisma:generate
```

---

## Next Steps

1. ✅ Database set up
2. ✅ Prisma configured
3. ✅ Server running
4. 📝 Read `AUTH_SETUP.md` for detailed API documentation
5. 📝 Read `IMPLEMENTATION_SUMMARY.md` for architecture overview
6. 🧪 Run tests: `npm test`
7. 📊 Explore database: `npm run prisma:studio`

---

## Summary

After completing all steps, you should have:

- ✅ PostgreSQL database running
- ✅ Prisma client generated
- ✅ Database tables created (migrations applied)
- ✅ Superadmin user created (optional)
- ✅ Development server running on http://localhost:3001
- ✅ Authentication endpoints working

Your authentication system is ready to use! 🎉


