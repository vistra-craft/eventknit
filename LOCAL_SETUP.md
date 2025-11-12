# EventKnit - Local Development Setup Guide

This guide will help you set up and run both the frontend and backend on localhost for testing.

## Prerequisites

- Node.js 20+ installed
- PostgreSQL 16+ (or Docker)
- npm or yarn package manager

## Quick Start

### Option 1: Using the Development Script (Recommended)

1. **Setup environment files:**
   ```bash
   # Copy environment examples
   cp server/.env.development.example server/.env.development
   cp client/.env.development.example client/.env.development
   ```

2. **Start PostgreSQL** (choose one):
   
   **Using Docker Compose:**
   ```bash
   cd server
   docker-compose up -d postgres
   ```
   
   **Or using Docker directly:**
   ```bash
   docker run -d \
     -p 5432:5432 \
     -e POSTGRES_USER=eventknit \
     -e POSTGRES_PASSWORD=eventknit123 \
     -e POSTGRES_DB=eventknit \
     --name eventknit-postgres \
     postgres:16-alpine
   ```

3. **Run database migrations:**
   ```bash
   cd server
   npm install
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **Start both frontend and backend:**
   ```bash
   # From the eventknit root directory
   chmod +x dev.sh
   ./dev.sh
   ```

   Or run separately:
   ```bash
   ./dev.sh server  # Terminal 1: Backend only
   ./dev.sh client  # Terminal 2: Frontend only
   ```

### Option 2: Manual Setup

#### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.development.example .env.development
   ```

4. **Setup database:**
   - Ensure PostgreSQL is running on `localhost:5432`
   - Create a database named `eventknit` (or update DATABASE_URL in .env.development)
   - Run Prisma migrations:
     ```bash
     npm run prisma:generate
     npm run prisma:migrate
     ```

5. **Start the backend server:**
   ```bash
   npm run dev
   ```

   The backend will run on **http://localhost:3000**

#### Frontend Setup

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.development.example .env.development
   ```

4. **Start the frontend development server:**
   ```bash
   npm run dev
   ```

   The frontend will run on **http://localhost:5173**

## Port Configuration

- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:5173
- **PostgreSQL**: localhost:5432

The frontend is configured to connect to the backend at `http://localhost:3000/api/v1` via the `VITE_API_BASE_URL` environment variable.

## Verification

### Check Backend Health

```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "...",
    "uptime": ...,
    "environment": "development"
  }
}
```

### Check API Status

```bash
curl http://localhost:3000/api/v1/status
```

### Check Frontend Connection

1. Open http://localhost:5173 in your browser
2. Open browser DevTools (F12)
3. Check the Network tab - API calls should go to `http://localhost:3000/api/v1`

## Troubleshooting

### Backend won't start

1. **Check PostgreSQL is running:**
   ```bash
   nc -z localhost 5432
   # or
   docker ps | grep postgres
   ```

2. **Check database connection:**
   ```bash
   cd server
   npm run prisma:studio
   ```
   This opens Prisma Studio to verify database connection.

3. **Check environment variables:**
   - Ensure `.env.development` exists in the server directory
   - Verify `DATABASE_URL` is correct

### Frontend can't connect to backend

1. **Verify backend is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Check CORS configuration:**
   - Backend CORS should allow `http://localhost:5173`
   - Check `server/src/config/index.ts` for CORS settings

3. **Check environment variable:**
   - Ensure `client/.env.development` has `VITE_API_BASE_URL=http://localhost:3000/api/v1`
   - Restart the frontend dev server after changing env vars

### Database connection issues

1. **Check PostgreSQL is accessible:**
   ```bash
   psql -h localhost -U eventknit -d eventknit
   # Password: eventknit123
   ```

2. **Reset database (if needed):**
   ```bash
   cd server
   npm run prisma:migrate reset
   ```

3. **Regenerate Prisma Client:**
   ```bash
   cd server
   npm run prisma:generate
   ```

## Testing the Integration

1. **Start both services:**
   ```bash
   ./dev.sh
   ```

2. **Test authentication flow:**
   - Open http://localhost:5173
   - Try registering a new user
   - Try logging in
   - Check browser DevTools Network tab for API calls

3. **Test API endpoints directly:**
   ```bash
   # Register a user
   curl -X POST http://localhost:3000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Test123!@#",
       "firstName": "Test",
       "lastName": "User"
     }'
   ```

## Docker Development (Alternative)

If you prefer using Docker:

```bash
cd server
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Backend API on port 3001 (note: different from local dev)
- Redis on port 6379

**Important:** When using Docker, update `client/.env.development`:
```
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

## Next Steps

- Review the API documentation in `server/README.md`
- Check the frontend components in `client/src/components`
- Run tests: `npm test` in both directories
- Check logs: `server/logs/` directory for backend logs









