# EventKnit

EventKnit is a comprehensive event ticketing and management platform. It features a modern React frontend and a robust Node.js/Express backend, designed to handle everything from event creation and ticket sales to attendee management and check-ins.

## Architecture

The project is structured as a monorepo with separate client and server applications:

```
eventknit/
├── client/          # Frontend: React, Vite, TypeScript, Tailwind CSS
└── server/          # Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL
```

- **Frontend**: A responsive Single Page Application (SPA) that provides interfaces for Attendees, Organizers, and Admins.
- **Backend**: A RESTful API that handles business logic, authentication, database interactions, and third-party integrations (Payment, Email, SMS).

---

## Quick Start

To get the entire application running locally, you need to set up both the server and the client.

### Prerequisites

- Node.js (v18+)
- npm (v9+)
- Docker & Docker Compose (for PostgreSQL and Redis)
- Git

---

### 1. Setup Backend

Navigate to the server directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Configure environment variables:

```bash
cp .env.example .env.development
```

Edit `.env.development` with your configuration (see [server/README.md](./server/README.md) for details).

**Start PostgreSQL using Docker:**

```bash
docker compose --env-file .env.development up -d postgres
```

**Start Redis (optional, for caching/queues):**

```bash
docker compose --env-file .env.development up -d redis
```

Setup the database:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Seed with test data (optional):

```bash
npm run prisma:seed
```

Start the server:

```bash
npm run dev
```

---

### 2. Setup Frontend

Open a new terminal and navigate to the client directory:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Start the client:

```bash
npm run dev
```

---

### 3. Access the Application

Open your browser and navigate to:

| Application | URL |
|-------------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Prisma Studio | http://localhost:5555 (run `npm run prisma:studio` in server) |

---

## Essential Commands

### Server Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run prisma:seed` | Seed database with test data |

### Client Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |

### Docker Commands

| Command | Description |
|---------|-------------|
| `docker compose --env-file .env.development up -d postgres` | Start PostgreSQL |
| `docker compose --env-file .env.development up -d redis` | Start Redis |
| `docker compose --env-file .env.development up -d postgres redis` | Start both |
| `docker compose --env-file .env.development down` | Stop all services |

---

## Documentation

For detailed instructions on each part of the stack, please refer to the specific README files:

- [**Client Documentation**](./client/README.md): Frontend setup, architecture, and development guide.
- [**Server Documentation**](./server/README.md): Backend setup, API documentation, database management, and deployment.

---

## Key Features

### For Attendees
- Browse and discover events
- Purchase tickets with secure payment (Paystack/Stripe)
- Digital wallet for ticket storage
- Transfer tickets to other users
- QR code tickets for easy check-in

### For Organizers
- Create and manage events with multi-step form
- Customizable ticket types and pricing
- Real-time analytics dashboard
- Attendee management and check-in
- Revenue tracking and reports

### For Admins
- User management across the platform
- Event moderation and approval
- KYC verification for organizers
- Platform-wide analytics
- Role-based access control
- Platform feedback collection and NPS analytics

---

## Tech Stack

### Frontend
- React 19
- Vite 7
- TypeScript
- Tailwind CSS
- Radix UI
- React Router v7

### Backend
- Node.js
- Express.js 5
- TypeScript
- Prisma ORM
- PostgreSQL 16
- Redis 7 + BullMQ

### Integrations
- Paystack / Stripe (Payments)
- Nodemailer (Email)
- Twilio (SMS)
- Cloudinary / MinIO (File Storage)
- Socket.IO (Real-time)

---

## Contributing

1. Fork the repository
2. Create a feature branch from `development`
3. Make your changes
4. Run tests and linting
5. Submit a pull request

---

## License

This project is proprietary and confidential.
