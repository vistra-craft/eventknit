# Postman API Testing Guide

This guide will help you set up the database and test APIs in Postman.

## 🚀 Quick Setup Steps

### Step 1: Create Environment File

Create a `.env.development` file in the server root directory:

```bash
cd /home/bk/Dev/VistraCraft/eventknit/server
```

Create `.env.development`:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# Database Configuration (PostgreSQL)
DATABASE_URL="postgresql://eventknit:eventknit123@localhost:5432/eventknit?schema=public"
POSTGRES_USER=eventknit
POSTGRES_PASSWORD=eventknit123
POSTGRES_DB=eventknit
POSTGRES_PORT=5432

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars-required
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars-required
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=30

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=5

# CORS
CORS_ORIGIN=http://localhost:5173
CORS_CREDENTIALS=true
FRONTEND_URL=http://localhost:5173

# Email (Optional for testing - can use fake SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@eventknit.com

# Logging
LOG_LEVEL=info
```

### Step 2: Start PostgreSQL Database

Using Docker (Recommended):

```bash
# Start PostgreSQL container
docker compose --env-file .env.development up -d postgres

# Verify it's running
docker ps | grep postgres

# Check logs if needed
docker compose --env-file .env.development logs postgres
```

**Alternative**: If you have PostgreSQL installed locally, make sure it's running and update `DATABASE_URL` to use `localhost`.

### Step 3: Run Database Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate

# Seed database (creates superadmin user)
npm run prisma:seed
```

**Superadmin credentials** (from seed):

- Email: `vistracraft@gmail.com`
- Password: `Somepass123!`

### Step 4: Start the Server

```bash
# Development mode (with hot reload)
npm run dev

# Or production mode
npm run build
npm start
```

Server will start on: `http://localhost:3001`

You should see:

```
🚀 EventKnit Server running on http://0.0.0.0:3001
📊 Environment: development
🔍 Health check: http://localhost:3001/health
🔐 Auth routes: http://localhost:3001/api/v1/auth
```

## 📮 Postman Setup

### Base URL

Create a Postman Environment Variable:

1. Click **Environments** in Postman
2. Click **+** to create a new environment
3. Name it: `EventKnit Local`
4. Add variable:
   - **Variable**: `base_url`
   - **Initial Value**: `http://localhost:3001`
   - **Current Value**: `http://localhost:3001`
5. Save

Use `{{base_url}}` in your requests.

### API Endpoints

Base path: `{{base_url}}/api/v1/auth`

#### 1. **Health Check**

```
GET {{base_url}}/health
```

#### 2. **Register User**

**Endpoint**: `POST {{base_url}}/api/v1/auth/register` (or `/signup` alias)

**Headers**:

```
Content-Type: application/json
```

**Body** (raw JSON):

```json
{
  "email": "test@example.com",
  "password": "Test123!@#",
  "firstName": "John",
  "lastName": "Doe",
  "role": "ATTENDEE"
}
```

**For Organizer**:

```json
{
  "email": "organizer@example.com",
  "password": "Test123!@#",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "ORGANIZER",
  "organizationName": "My Events Inc",
  "businessEmail": "business@myevents.com"
}
```

**Response** (201):

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ATTENDEE",
      "status": "PENDING_VERIFICATION",
      "isEmailVerified": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

#### 3. **Login**

**Endpoint**: `POST {{base_url}}/api/v1/auth/login`

**Headers**:

```
Content-Type: application/json
```

**Body** (raw JSON):

```json
{
  "email": "test@example.com",
  "password": "Test123!@#"
}
```

**Response** (200):

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 900
  }
}
```

**Note**: The refresh token is also set as an HTTP-only cookie.

#### 4. **Get User Profile** (Protected)

**Endpoint**: `GET {{base_url}}/api/v1/auth/me` (or `/profile` alias)

**Headers**:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Response** (200):

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ATTENDEE",
      "status": "ACTIVE",
      "isEmailVerified": true
    }
  }
}
```

#### 5. **Refresh Access Token**

**Endpoint**: `POST {{base_url}}/api/v1/auth/refresh`

**Headers**:

```
Content-Type: application/json
```

**Body**:

```json
{
  "refreshToken": "<refresh_token_from_login_response>"
}
```

**Response** (200):

```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token...",
    "refreshToken": "new_refresh_token...",
    "expiresIn": 900
  }
}
```

#### 6. **Logout**

**Endpoint**: `POST {{base_url}}/api/v1/auth/logout`

**Headers**:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**:

```json
{
  "refreshToken": "<refresh_token>"
}
```

#### 7. **Forgot Password**

**Endpoint**: `POST {{base_url}}/api/v1/auth/password/reset-request` (or `/forgot-password` alias)

**Headers**:

```
Content-Type: application/json
```

**Body**:

```json
{
  "email": "test@example.com"
}
```

#### 8. **Reset Password**

**Endpoint**: `POST {{base_url}}/api/v1/auth/password/reset-confirm` (or `/reset-password` alias)

**Headers**:

```
Content-Type: application/json
```

**Body**:

```json
{
  "token": "<reset_token_from_email>",
  "password": "NewPassword123!@#"
}
```

### Postman Collection Tips

1. **Save Responses**: After login, save the `accessToken` as an environment variable:

   - Go to Tests tab in Login request
   - Add script:

   ```javascript
   if (pm.response.code === 200) {
     const jsonData = pm.response.json();
     pm.environment.set("access_token", jsonData.data.accessToken);
     pm.environment.set("refresh_token", jsonData.data.refreshToken);
   }
   ```

2. **Use Variables**: Set Authorization header as:

   ```
   Authorization: Bearer {{access_token}}
   ```

3. **Collection Variables**: Create a collection and set collection variables for common values.

## 🔧 Troubleshooting

### Database Connection Issues

1. **Check PostgreSQL is running**:

   ```bash
   docker ps | grep postgres
   ```

2. **Check DATABASE_URL**:

   - For Docker: Use `postgres` as hostname
   - For local: Use `localhost` as hostname

3. **Test connection manually**:
   ```bash
   docker exec -it eventknit-postgres psql -U eventknit -d eventknit -c "SELECT 1;"
   ```

### Server Not Starting

1. **Check if port 3001 is available**:

   ```bash
   lsof -i :3001
   ```

2. **Check environment variables**:

   ```bash
   cat .env.development | grep DATABASE_URL
   ```

3. **Check logs**:

   ```bash
   # Server logs
   npm run dev

   # Or check log files
   tail -f logs/application-*.log
   ```

### API Errors

1. **401 Unauthorized**:

   - Token expired → Use refresh token endpoint
   - Invalid token → Re-login

2. **400 Bad Request**:

   - Check request body format
   - Verify required fields are present

3. **409 Conflict**:
   - User already exists → Use different email

## 📝 Available User Roles

- `SUPERADMIN` - Full system access
- `ADMIN_STAFF` - Administrative staff
- `MARKETER` - Marketing team
- `SUPPORT` - Support staff
- `TELLER` - Ticket teller
- `ORGANIZER` - Event organizer
- `ORGANIZER_STAFF` - Organizer staff
- `ORGANIZER_TELLER` - Organizer teller
- `ATTENDEE` - Event attendee

## 🧪 Quick Test Flow

1. **Register** → Get user account
2. **Login** → Get access & refresh tokens
3. **Get Profile** → Test protected route
4. **Refresh Token** → Get new access token
5. **Logout** → Revoke refresh token

## 💡 Pro Tips

- Use **Postman Environments** to switch between dev/staging/prod
- Set up **Pre-request Scripts** to auto-refresh tokens
- Use **Tests** tab to validate responses automatically
- Export collection and share with your team

Happy Testing! 🎉
