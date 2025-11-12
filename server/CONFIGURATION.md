# EventKnit Server Configuration Guide

## Environment Setup

Create the following environment files in the server root directory:

### `.env.development`

```bash
# Development Environment Configuration
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/eventknit-dev
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-development-jwt-secret-key-change-in-production
JWT_REFRESH_SECRET=your-development-refresh-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Encryption Configuration
ENCRYPTION_KEY=your-32-character-encryption-key-dev

# Client Configuration
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:5173
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
```

### `.env.staging`

```bash
# Staging Environment Configuration
NODE_ENV=staging
PORT=3001
HOST=0.0.0.0

# Database Configuration
MONGODB_URI=mongodb://eventknit:password@mongodb:27017/eventknit?authSource=eventknit
REDIS_URL=redis://:password@redis:6379

# JWT Configuration
JWT_SECRET=your-staging-jwt-secret-key
JWT_REFRESH_SECRET=your-staging-refresh-secret-key
JWT_EXPIRES_IN=7d

# Encryption Configuration
ENCRYPTION_KEY=your-32-character-encryption-key-staging

# Client Configuration
CLIENT_URL=https://staging.eventknit.com
SERVER_URL=https://api-staging.eventknit.com
CORS_ORIGIN=https://staging.eventknit.com
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### `.env.production`

```bash
# Production Environment Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database Configuration
MONGODB_URI=mongodb://eventknit:password@mongodb:27017/eventknit?authSource=eventknit
REDIS_URL=redis://:password@redis:6379

# JWT Configuration (USE STRONG SECRETS IN PRODUCTION!)
JWT_SECRET=your-super-secure-jwt-secret-key-for-production
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-for-production
JWT_EXPIRES_IN=7d

# Encryption Configuration (USE STRONG KEY IN PRODUCTION!)
ENCRYPTION_KEY=your-32-character-encryption-key-production

# Client Configuration
CLIENT_URL=https://eventknit.com
SERVER_URL=https://api.eventknit.com
CORS_ORIGIN=https://eventknit.com
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## Running the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Docker Mode

```bash
docker-compose up -d
```

## Environment Variables Reference

### Server Configuration

- `NODE_ENV` - Environment mode: `development`, `staging`, or `production`
- `PORT` - Server port (default: `3001`)
- `HOST` - Server host (default: `0.0.0.0`)

### Database Configuration

- `MONGODB_URI` - MongoDB connection string
  - Development: `mongodb://localhost:27017/eventknit-dev`
  - Staging/Production: `mongodb://username:password@mongodb:27017/eventknit?authSource=eventknit`

### Redis Configuration

- `REDIS_URL` - Redis connection string
  - Development: `redis://localhost:6379`
  - Staging/Production: `redis://:password@redis:6379`
- `REDIS_PASSWORD` - Redis password (optional, can be in URL)

### JWT Configuration

- `JWT_SECRET` - Secret key for JWT token signing (REQUIRED)
- `JWT_REFRESH_SECRET` - Secret key for refresh token signing (REQUIRED)
- `JWT_EXPIRES_IN` - Access token expiration time (default: `7d`)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiration time (default: `7d`)

### Encryption Configuration

- `ENCRYPTION_KEY` - 32-character encryption key for sensitive data

### Client Configuration

- `CLIENT_URL` - Frontend application URL
- `SERVER_URL` - Backend server URL
- `CORS_ORIGIN` - Allowed CORS origin (usually same as CLIENT_URL)
- `CORS_CREDENTIALS` - Enable CORS credentials (default: `true`)

### Rate Limiting

- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds (default: `900000` = 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per window (default: `100`)

### Logging

- `LOG_LEVEL` - Logging level: `debug`, `info`, `warn`, `error` (default: `info`)

## Project Structure

```
src/
├── config/
│   └── database.ts       # MongoDB connection
├── middleware/
│   └── errorHandler.ts   # Error handling middleware
├── routes/
│   ├── auth.ts          # Authentication routes
│   └── health.ts        # Health check routes
├── healthcheck.ts       # Health check script
└── index.ts             # Server entry point
```

## Key Features

1. **Environment-based Configuration**: Loads `.env.{NODE_ENV}` automatically
2. **Security Middleware**: Helmet for security headers
3. **Rate Limiting**: Prevents abuse with configurable limits
4. **CORS Configuration**: Secure cross-origin resource sharing
5. **Error Handling**: Centralized error handling middleware
6. **Health Checks**: Built-in health check endpoints

## Docker Compose Configuration

The server can be run with Docker Compose. The `docker-compose.yml` file supports:

- MongoDB service
- Redis service
- Mongo Express (development only)
- EventKnit server service

Environment variables are loaded from `.env.{environment}` files or can be passed via environment variables in docker-compose.

## CI/CD Pipeline

The server includes GitHub Actions workflows for:

- **CI Pipeline** (`server-ci.yml`): Runs tests, linting, type checking on push/PR
- **Staging Deployment** (`server-deploy-staging.yml`): Deploys to staging on push to `staging` branch
- **Production Deployment** (`server-deploy-production.yml`): Deploys to production on push to `main` branch

## Next Steps

1. Create your route files in `routes/` directory
2. Create your models for database schemas
3. Create your controllers for business logic
4. Create your services for external integrations
5. Add authentication and authorization middleware
6. Implement API endpoints for your features











