# EventKnit Server

The backend API for the EventKnit platform, built with Node.js, Express, TypeScript, and Prisma (PostgreSQL).

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 5
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Caching/Queues**: Redis 7 + BullMQ
- **Authentication**: JWT (JSON Web Tokens)
- **Payment Processing**: Paystack, Stripe
- **Email**: Nodemailer
- **SMS**: Twilio
- **File Storage**: Cloudinary, MinIO
- **Real-time**: Socket.IO

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Docker** & **Docker Compose** (for PostgreSQL and Redis)
- **Git**

---

## Quick Start

### 1. Clone and Install

```bash
cd server
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env.development
```

Edit `.env.development` with your actual values. Key variables:

```env
# Database (PostgreSQL via Docker)
DATABASE_URL="postgresql://eventknit:eventknit123@localhost:5432/eventknit?schema=public"
POSTGRES_USER=eventknit
POSTGRES_PASSWORD=eventknit123
POSTGRES_DB=eventknit

# JWT (generate with: openssl rand -base64 64)
JWT_SECRET=your-jwt-secret-key-min-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-characters-long

# Frontend URL
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
EMAIL_FROM=noreply@eventknit.com
```

### 3. Start Database (Docker)

**Start PostgreSQL using Docker Compose:**

```bash
docker compose --env-file .env.development up -d postgres
```

Verify it's running:

```bash
docker ps | grep eventknit-postgres
```

**Start Redis (optional, for caching/queues):**

```bash
docker compose --env-file .env.development up -d redis
```

### 4. Database Setup (Prisma)

Generate Prisma client and run migrations:

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

### 5. Seed Database (Optional)

Populate the database with initial test data:

```bash
# Full seed (users, roles, permissions)
npm run prisma:seed

# Or seed specific data
npm run seed:test-users    # Create test users
npm run seed:events        # Create sample events
npm run seed:dummy-data    # Create comprehensive test data
```

### 6. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3001`.

### 7. Access API Documentation

Once the server is running, access the interactive API documentation at:

```
http://localhost:3001/api-docs
```

The Swagger UI provides:
- 📚 Complete API reference with all endpoints
- 🔍 Interactive testing interface
- 🔐 Built-in authentication support
- 📝 Request/response examples
- ✅ Schema validation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed usage guide.

---

## 🐳 Docker Commands

### Starting Services

| Command | Description |
|---------|-------------|
| `docker compose --env-file .env.development up -d postgres` | Start PostgreSQL only |
| `docker compose --env-file .env.development up -d redis` | Start Redis only |
| `docker compose --env-file .env.development up -d postgres redis` | Start PostgreSQL and Redis |
| `docker compose --env-file .env.development up -d` | Start all services |
| `docker compose --env-file .env.development --profile dev up -d` | Start all + PgAdmin |

### Managing Services

| Command | Description |
|---------|-------------|
| `docker compose --env-file .env.development down` | Stop all services |
| `docker compose --env-file .env.development restart postgres` | Restart PostgreSQL |
| `docker compose --env-file .env.development logs postgres -f` | View PostgreSQL logs |
| `docker compose --env-file .env.development logs redis -f` | View Redis logs |

### Container Management

```bash
# Check running containers
docker ps | grep eventknit

# Stop specific containers
docker stop eventknit-postgres
docker stop eventknit-redis

# Remove containers (keeps data in volumes)
docker rm eventknit-postgres
docker rm eventknit-redis

# Remove volumes (⚠️ DELETES ALL DATA)
docker volume rm eventknit_postgres_data
docker volume rm eventknit_redis_data
```

### Database Connection Testing

```bash
# Test PostgreSQL connection
docker exec -it eventknit-postgres psql -U eventknit -d eventknit -c "SELECT version();"

# Connect to PostgreSQL shell
docker exec -it eventknit-postgres psql -U eventknit -d eventknit

# Test Redis connection
docker exec -it eventknit-redis redis-cli -a SecureRedisPassword123! ping
```

### PgAdmin (Optional Database GUI)

```bash
# Start with dev profile (includes PgAdmin)
docker compose --env-file .env.development --profile dev up -d

# Access at http://localhost:8080
# Login: admin@eventknit.com / admin (or your configured credentials)
```

---

## 📦 Prisma Commands

### Essential Commands

| Command | Description |
|---------|-------------|
| `npm run prisma:generate` | Generate Prisma Client from schema |
| `npm run prisma:migrate` | Create and apply new migration |
| `npm run prisma:studio` | Open Prisma Studio (database GUI at http://localhost:5555) |
| `npm run prisma:seed` | Seed database with initial data |

### Advanced Prisma Commands

```bash
# Create a new migration after schema changes
npx prisma migrate dev --name your_migration_name

# Apply migrations in production
npx prisma migrate deploy

# Push schema changes without migration (prototyping)
npx prisma db push

# Reset database (⚠️ DELETES ALL DATA)
npx prisma migrate reset

# View current migration status
npx prisma migrate status

# Pull schema from existing database
npx prisma db pull

# Format schema file
npx prisma format

# Validate schema
npx prisma validate

# Release migration lock (if stuck)
npm run prisma:release-lock
```

---

## 🧪 Development Commands

### Running the Server

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run dev:watch` | Start with file watching (auto-restart) |
| `npm run build` | Build for production |
| `npm start` | Start production server |

### Code Quality

| Command | Description |
|---------|-------------|
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run type-check` | Run TypeScript type checking |

### Testing

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:run` | Run tests once (CI mode) |

---

## 👥 User Management Scripts

### List Users

```bash
npm run list-users
```

### Delete Users

```bash
# Soft delete (set status to DEACTIVATED)
npm run delete-user -- user@example.com

# Hard delete (permanently remove from database)
npm run delete-user -- user@example.com --hard

# Hard delete without confirmation
npm run delete-user -- user@example.com --hard --force
```

### Verify Test Users

```bash
npm run verify-test-users
```

### Seed Commands

```bash
npm run seed:test-users    # Create test users for all roles
npm run seed:events        # Create sample events
npm run seed:dummy-data    # Create comprehensive test data
```

---

## 🔧 Troubleshooting

### Port Conflicts

```bash
# Check if ports are in use
lsof -i :3001 -i :5432 -i :6379

# Kill process on specific port
kill -9 $(lsof -ti :3001)
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep eventknit-postgres

# View PostgreSQL logs
docker compose --env-file .env.development logs postgres --tail 50

# Restart PostgreSQL
docker compose --env-file .env.development restart postgres

# Reset Prisma migrations (if corrupted)
npx prisma migrate reset --force
```

### Prisma Issues

```bash
# Regenerate Prisma Client
npm run prisma:generate

# Clear Prisma cache
rm -rf node_modules/.prisma
npm run prisma:generate

# Release migration lock
npm run prisma:release-lock

# Check migration status
npx prisma migrate status
```

### Redis Connection Issues

```bash
# Check Redis is running
docker ps | grep eventknit-redis

# Test Redis connection
docker exec -it eventknit-redis redis-cli -a SecureRedisPassword123! ping

# View Redis logs
docker compose --env-file .env.development logs redis --tail 50
```

### Common Errors

| Error | Solution |
|-------|----------|
| `ECONNREFUSED 127.0.0.1:5432` | Start PostgreSQL: `docker compose --env-file .env.development up -d postgres` |
| `P1001: Can't reach database server` | Check DATABASE_URL in .env.development |
| `Migration lock` | Run `npm run prisma:release-lock` |
| `EADDRINUSE` | Kill process on port or change PORT in .env |

---

## 📁 Project Structure

```
server/
├── prisma/
│   ├── migrations/       # Database migrations
│   ├── schema.prisma     # Database schema definition
│   ├── seed.ts           # Main seeding script
│   └── seed-permissions.ts
├── scripts/              # Utility scripts
│   ├── delete-user.js
│   ├── list-users.js
│   ├── seed-test-users.js
│   ├── seed-events.js
│   └── ...
├── src/
│   ├── config/           # Configuration (database, env)
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Express middleware (auth, validation)
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic
│   ├── utils/            # Helper functions (logger, errors, audit)
│   ├── app.ts            # Express app setup
│   └── server.ts         # Entry point
├── tests/                # Test files
├── docker-compose.yml    # Docker services configuration
├── Dockerfile            # Production Docker image
├── .env.example          # Environment template
└── package.json
```

---

## 🔐 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Secret for signing access tokens | 64+ character string |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | 64+ character string |
| `FRONTEND_URL` | Frontend app URL | `http://localhost:5173` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:5173` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `JWT_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `BCRYPT_ROUNDS` | Password hashing rounds | `12` |
| `LOG_LEVEL` | Logging level | `debug` |

### Email Configuration

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `EMAIL_FROM` | Sender email address |

### Payment Configuration

| Variable | Description |
|----------|-------------|
| `PAYSTACK_SECRET_KEY` | Paystack secret key |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key |
| `STRIPE_SECRET_KEY` | Stripe secret key |

### OAuth Configuration

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `FACEBOOK_APP_ID` | Facebook App ID |
| `FACEBOOK_APP_SECRET` | Facebook App secret |

### Docker/Database

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | PostgreSQL username | `eventknit` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `eventknit123` |
| `POSTGRES_DB` | PostgreSQL database name | `eventknit` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `REDIS_PASSWORD` | Redis password | `SecureRedisPassword123!` |

---

## 🚀 Production Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Docker Production Build

```bash
# Build production image
docker build -t eventknit-server .

# Run with docker-compose
docker compose --env-file .env.production up -d
```

---

## 📚 API Endpoints

The API follows RESTful conventions with base path `/api/v1/`.

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### Events
- `GET /api/v1/events` - List events
- `POST /api/v1/events` - Create event
- `GET /api/v1/events/:id` - Get event details
- `PUT /api/v1/events/:id` - Update event
- `DELETE /api/v1/events/:id` - Delete event

### Tickets
- `GET /api/v1/tickets` - List tickets
- `POST /api/v1/tickets/:id/transfer` - Transfer ticket
- `GET /api/v1/tickets/:id/qr` - Get ticket QR code

### Payments
- `POST /api/v1/payments/initialize` - Initialize payment
- `POST /api/v1/payments/verify` - Verify payment
- `POST /api/v1/payments/webhook` - Payment webhook

### Users
- `GET /api/v1/user/me` - Get current user
- `PUT /api/v1/user/me` - Update profile
- `GET /api/v1/user/dashboard/stats` - Get dashboard stats

### Platform Feedback
- `POST /api/v1/feedback` - Submit feedback (authenticated)
- `GET /api/v1/feedback/token/:token` - Validate feedback token
- `POST /api/v1/feedback/token/:token` - Submit feedback via email token

### Admin Feedback
- `GET /api/v1/admin/feedback` - List all feedback
- `GET /api/v1/admin/feedback/analytics` - Get NPS analytics
- `GET /api/v1/admin/feedback/:id` - Get single feedback
- `PATCH /api/v1/admin/feedback/:id/notes` - Add admin notes
- `POST /api/v1/admin/feedback/trigger/:eventId` - Trigger feedback emails
- `GET /api/v1/admin/feedback/event/:eventId` - Get event feedback

For detailed API documentation, see the route files in `src/routes/`.

---

## 🤝 Contributing

1. Create a feature branch from `development`
2. Make your changes
3. Run tests: `npm test`
4. Run linting: `npm run lint:fix`
5. Run type check: `npm run type-check`
6. Submit a pull request

---

## 📄 License

This project is proprietary and confidential.
