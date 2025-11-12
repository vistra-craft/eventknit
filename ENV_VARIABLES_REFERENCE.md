# Environment Variables Reference

Quick reference for all environment variables needed for deployment.

## Server (Render) Environment Variables

### Required

```bash
# Server Configuration
NODE_ENV=production
PORT=10000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@host:port/database?schema=public

# JWT Secrets (generate strong random strings, min 32 chars)
JWT_SECRET=<generate-strong-random-secret>
JWT_REFRESH_SECRET=<generate-strong-random-secret>

# CORS Configuration
CORS_ORIGIN=https://your-app.netlify.app
CORS_CREDENTIALS=true

# Frontend URL
FRONTEND_URL=https://your-app.netlify.app
```

### Email Configuration

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@eventknit.com
```

### Payment Configuration (Paystack)

```bash
PAYSTACK_SECRET_KEY=sk_live_xxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
```

### Optional (with defaults)

```bash
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=5
GUEST_REGISTRATION_WINDOW_MS=3600000
GUEST_REGISTRATION_MAX=10
GUEST_PAYMENT_WINDOW_MS=3600000
GUEST_PAYMENT_MAX=10

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=30
```

## Client (Netlify) Environment Variables

### Required

```bash
# API Base URL - Your Render server URL
VITE_API_BASE_URL=https://eventknit-server.onrender.com/api/v1

# Frontend URL - Your Netlify URL
VITE_FRONTEND_URL=https://your-app.netlify.app
```

**Important**: 
- All client environment variables must start with `VITE_` prefix
- These are exposed to the browser, so don't put secrets here
- Update after first deployment when you get your actual URLs

## Generating Secrets

### JWT Secrets

```bash
# Linux/Mac
openssl rand -base64 32

# Or use online tool
https://randomkeygen.com/
```

### Gmail App Password

1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate password for "Mail"
5. Use this password in `SMTP_PASSWORD`

## Environment-Specific Values

### Development (Local)

```bash
# Server
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://eventknit:eventknit123@localhost:5432/eventknit

# Client
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_FRONTEND_URL=http://localhost:5173
```

### Staging

```bash
# Server
CORS_ORIGIN=https://staging-app.netlify.app
FRONTEND_URL=https://staging-app.netlify.app

# Client
VITE_API_BASE_URL=https://staging-server.onrender.com/api/v1
VITE_FRONTEND_URL=https://staging-app.netlify.app
```

### Production

```bash
# Server
CORS_ORIGIN=https://your-app.netlify.app
FRONTEND_URL=https://your-app.netlify.app

# Client
VITE_API_BASE_URL=https://your-server.onrender.com/api/v1
VITE_FRONTEND_URL=https://your-app.netlify.app
```

## Quick Setup Script

Save this as `setup-env.sh` and run to generate secrets:

```bash
#!/bin/bash

echo "Generating JWT secrets..."
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
echo ""
echo "Copy these values to your Render environment variables"
```



