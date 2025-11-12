# Authentication System Setup Guide

This document provides instructions for setting up and testing the authentication system for EventKnit.

## Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm or yarn

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the server directory:

```bash
cp .env.example .env
```

Update the following variables:

- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: A random string (minimum 32 characters)
- `JWT_REFRESH_SECRET`: A random string (minimum 32 characters)
- `SMTP_USER` and `SMTP_PASSWORD`: Your email credentials for sending verification emails

### 3. Database Setup

Create your PostgreSQL database:

```bash
createdb eventknit
```

Run migrations:

```bash
npm run prisma:migrate
```

This will create all the necessary tables.

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

### 5. Seed Superadmin (Optional)

Create a superadmin user:

```bash
npm run prisma:seed
```

Save the generated credentials securely!

### 6. Start Development Server

```bash
npm run dev
```

The server will run on `http://localhost:3001`

## API Endpoints

### Public Endpoints

#### POST `/api/v1/auth/signup`

Register a new user (Attendee or Organizer)

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "ATTENDEE"
}
```

For organizers:

```json
{
  "email": "organizer@example.com",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "ORGANIZER",
  "organizationName": "TechEvents Inc",
  "businessEmail": "business@techevents.com"
}
```

#### POST `/api/v1/auth/login`

Login user

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### POST `/api/v1/auth/refresh`

Refresh access token

**Request Body:**

```json
{
  "refreshToken": "your-refresh-token"
}
```

Or use the `refreshToken` cookie (HttpOnly).

#### GET `/api/v1/auth/verify-email?token={token}`

Verify email address

#### POST `/api/v1/auth/forgot-password`

Request password reset

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

#### POST `/api/v1/auth/reset-password`

Reset password with token

**Request Body:**

```json
{
  "token": "reset-token",
  "password": "NewSecurePass123!"
}
```

### Protected Endpoints

All protected endpoints require an `Authorization` header:

```
Authorization: Bearer {accessToken}
```

#### POST `/api/v1/auth/logout`

Logout user (revokes refresh token)

#### GET `/api/v1/auth/profile`

Get current user profile

## User Roles

The system supports the following roles:

- `SUPERADMIN`: Full system access
- `ADMIN_STAFF`: Admin dashboard access
- `MARKETER`: Marketing tools access
- `SUPPORT`: Support tools access
- `TELLER`: Financial operations access
- `ORGANIZER`: Event organizer dashboard
- `ORGANIZER_STAFF`: Organizer team member
- `ORGANIZER_TELLER`: Organizer financial operations
- `ATTENDEE`: Regular user/ticket holder

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate coverage report:

```bash
npm run test:coverage
```

## Security Features

1. **Password Hashing**: Bcrypt with 12 rounds
2. **JWT Tokens**:
   - Access tokens: 15 minutes expiry
   - Refresh tokens: 7 days expiry (HttpOnly cookies)
3. **Rate Limiting**:
   - General: 100 requests per 15 minutes
   - Auth routes: 5 requests per 15 minutes
4. **Account Lockout**: 5 failed login attempts locks account for 30 minutes
5. **Email Verification**: Required for account activation
6. **Token Rotation**: Refresh tokens are rotated on use

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%\*?&)

## Troubleshooting

### Database Connection Error

- Verify PostgreSQL is running
- Check `DATABASE_URL` format: `postgresql://user:password@localhost:5432/dbname`
- Ensure database exists

### Email Not Sending

- Verify SMTP credentials
- For Gmail: Enable 2FA and use an App Password
- Check firewall/network restrictions

### JWT Token Errors

- Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set and at least 32 characters
- Check system time synchronization

## Next Steps

After setting up authentication:

1. Test all endpoints with Postman or cURL
2. Verify email delivery is working
3. Test account lockout mechanism
4. Verify role-based access control
5. Set up KYC workflow for organizers (future implementation)


