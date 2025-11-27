# EventKnit Server

The backend API for the EventKnit platform, built with Node.js, Express, TypeScript, and Prisma (PostgreSQL).

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Caching/Queues**: Redis (BullMQ)
- **Authentication**: JWT (JSON Web Tokens)
- **Payment Processing**: Paystack
- **Email**: Nodemailer
- **SMS**: Twilio

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **PostgreSQL** (v14 or higher)
- **Redis** (v6 or higher)

## 🚀 Getting Started

### 1. Installation

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `server` directory based on the example below. You **must** configure these variables for the server to function correctly.

```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database (PostgreSQL)
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/eventknit?schema=public"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# CORS Configuration
# Comma-separated list of allowed origins
CORS_ORIGIN="http://localhost:5173,http://localhost:3000"
CORS_CREDENTIALS=true

# Redis (for BullMQ and Caching)
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# Email (SMTP)
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-email-password"
EMAIL_FROM="noreply@eventknit.com"

# Payment (Paystack)
PAYSTACK_SECRET_KEY="sk_test_..."
PAYSTACK_PUBLIC_KEY="pk_test_..."

# SMS (Twilio - Optional)
SMS_ENABLED=false
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
```

### 3. Database Setup

We use **Prisma** to manage the database schema.

1.  **Generate Prisma Client**:
    ```bash
    npm run prisma:generate
    ```

2.  **Run Migrations**:
    This will create the tables in your PostgreSQL database.
    ```bash
    npm run prisma:migrate
    ```

3.  **Seed the Database** (Optional):
    Populate the database with initial test data (users, roles, etc.).
    ```bash
    npm run prisma:seed
    ```

### 4. Running the Server

**Development Mode**:
Starts the server with hot-reloading using `tsx`.
```bash
npm run dev
```

**Production Build**:
Builds the TypeScript code to JavaScript and runs it.
```bash
npm run build
npm start
```

The server will start at `http://localhost:3000` (or the port specified in `.env`).

## 🧪 Testing

Run the test suite using Jest:

```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 🗄️ Database Management

Common Prisma commands:

-   `npx prisma studio`: Open a GUI to view and edit database data.
-   `npx prisma migrate dev`: Create a new migration after changing `schema.prisma`.
-   `npx prisma db push`: Push schema changes to the database without creating a migration (useful for prototyping).
-   `npx prisma generate`: Regenerate the Prisma Client after schema changes.

## 📂 Project Structure

```
server/
├── prisma/              # Database schema and seeds
│   ├── schema.prisma    # Data model definition
│   └── seed.ts          # Seeding script
├── src/
│   ├── config/          # Configuration loading
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware (auth, validation, etc.)
│   ├── models/          # Mongoose models (legacy/if used)
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── tests/               # Unit and integration tests
└── package.json
```

## 🔑 Key Features

-   **Authentication**: Secure user registration and login with JWT.
-   **Role-Based Access Control (RBAC)**: Different permissions for Admins, Organizers, and Attendees.
-   **Event Management**: Create, update, and manage events.
-   **Ticketing**: Generate and validate tickets (QR codes).
-   **Payments**: Integrated with Paystack for secure transactions.
-   **Notifications**: Email and SMS notification system.

## 🛠️ Useful Commands

Here is a collection of useful commands for development and maintenance.

### 🐳 Docker Management

**Start PostgreSQL Database**:
```bash
docker compose --env-file .env.development up -d postgres
```

**Check Running Containers**:
```bash
docker ps | grep eventknit
```

**View PostgreSQL Logs**:
```bash
docker compose --env-file .env.development logs postgres --tail 20 -f
```

**Restart PostgreSQL**:
```bash
docker compose --env-file .env.development restart postgres
```

**Stop Specific Containers**:
```bash
docker stop eventknit-postgres
docker stop eventknit-redis
```

**Test Database Connection**:
```bash
docker exec -it eventknit-postgres psql -U eventknit -d eventknit -c "SELECT version();"
```

### 👥 User Management

**List All Users**:
```bash
npm run list-users
```

**Delete a User (Soft Delete)**:
Sets user status to DEACTIVATED.
```bash
npm run delete-user -- <email>
```

**Delete a User (Hard Delete)**:
Permanently removes user and all related records from the database. Useful for testing.
```bash
npm run delete-user -- <email> --hard
```

**Delete without Confirmation**:
```bash
npm run delete-user -- <email> --hard --force
```

### 🔧 Troubleshooting

**Check for Port Conflicts**:
Check if ports 3000, 5432, or 6379 are in use.
```bash
lsof -i :3000 -i :5432 -i :6379
```

**Install dotenv-cli**:
Required for running scripts with specific env files.
```bash
npm install dotenv-cli --save-dev
```

### 🗄️ Prisma & Database

**Open Database GUI**:
```bash
npm run prisma:studio
```

**Reset Database (Caution)**:
Drops the database and re-seeds it.
```bash
npx prisma migrate reset
```
