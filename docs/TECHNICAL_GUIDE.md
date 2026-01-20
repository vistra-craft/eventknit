# EventKnit Technical Documentation

A comprehensive technical guide to the EventKnit platform architecture, design patterns, and implementation details.

## Document Overview

This technical documentation provides an in-depth look at the EventKnit ticketing platform from a developer and architect perspective. It covers the complete technology stack, system architecture, design patterns, database design, and implementation details across all three platform components (Backend, Web Frontend, Mobile App).

**Target Audience:**
- Software Engineers
- System Architects
- DevOps Engineers
- Technical Leads
- New developers onboarding to the project

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Mobile Application Architecture](#mobile-application-architecture)
6. [Database Design](#database-design)
7. [Authentication & Security](#authentication--security)
8. [API Design](#api-design)
9. [Real-Time Communication](#real-time-communication)
10. [State Management](#state-management)
11. [Design Patterns](#design-patterns)
12. [Data Flow](#data-flow)
13. [File Storage](#file-storage)
14. [Background Jobs & Queues](#background-jobs--queues)
15. [Logging & Monitoring](#logging--monitoring)
16. [Testing Strategy](#testing-strategy)
17. [Development Workflow](#development-workflow)
18. [Deployment Architecture](#deployment-architecture)
19. [Performance Optimization](#performance-optimization)
20. [Security Best Practices](#security-best-practices)

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├──────────────┬──────────────┬─────────────────────────────────┤
│  Web Client  │  Mobile App  │      Admin Dashboard             │
│  (React/TS)  │  (Flutter)   │      (React/TS)                 │
└──────┬───────┴──────┬───────┴─────────┬───────────────────────┘
       │              │                  │
       └──────────────┴──────────────────┘
                      │
                      │ HTTPS/WSS
                      │
       ┌──────────────▼──────────────────────┐
       │      API GATEWAY / LOAD BALANCER     │
       │           (NGINX/CloudFlare)         │
       └──────────────┬──────────────────────┘
                      │
       ┌──────────────▼──────────────────────┐
       │         APPLICATION LAYER            │
       │    ┌─────────────────────────┐      │
       │    │  Express.js REST API    │      │
       │    │  (Node.js/TypeScript)   │      │
       │    └───────────┬─────────────┘      │
       │                │                     │
       │    ┌───────────▼─────────────┐      │
       │    │   WebSocket Server      │      │
       │    │     (Socket.IO)         │      │
       │    └─────────────────────────┘      │
       └────────────────┬───────────────────┘
                        │
       ┌────────────────┴───────────────────┐
       │       MIDDLEWARE & SERVICES        │
       ├────────────────────────────────────┤
       │  • Authentication (JWT)            │
       │  • Authorization (RBAC)            │
       │  • Rate Limiting                   │
       │  • Validation                      │
       │  • Error Handling                  │
       │  • Logging (Winston)               │
       └────────────────┬───────────────────┘
                        │
       ┌────────────────┴───────────────────────────────────┐
       │              DATA & STORAGE LAYER                   │
       ├────────────┬──────────────┬──────────────┬─────────┤
       │ PostgreSQL │    Redis     │   Cloudinary │  MinIO  │
       │  (Prisma)  │   (Cache)    │   (Images)   │ (Files) │
       └────────────┴──────────────┴──────────────┴─────────┘
                        │
       ┌────────────────┴───────────────────┐
       │       EXTERNAL SERVICES             │
       ├─────────────────────────────────────┤
       │  • Stripe (Payments)                │
       │  • Paystack (Payments)              │
       │  • Firebase (Push Notifications)    │
       │  • Twilio (SMS)                     │
       │  • Nodemailer (Email)               │
       │  • Google Maps (Location Services)  │
       └─────────────────────────────────────┘
```

### Architecture Patterns

**1. Three-Tier Architecture:**
- **Presentation Layer**: Web (React) + Mobile (Flutter)
- **Application Layer**: Node.js/Express REST API
- **Data Layer**: PostgreSQL + Redis + Cloud Storage

**2. Microservices-Ready:**
- Modular controller-service architecture
- Clear separation of concerns
- Independent scalability per module
- Future-ready for microservices migration

**3. Event-Driven Architecture:**
- WebSocket for real-time updates
- Event emission for cross-module communication
- Background job processing with BullMQ

---

## Technology Stack

### Backend Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Runtime** | Node.js | 20+ | JavaScript runtime |
| **Language** | TypeScript | 5.9+ | Type-safe development |
| **Framework** | Express.js | 5.1+ | Web framework |
| **ORM** | Prisma | 6.18+ | Database toolkit |
| **Database** | PostgreSQL | 14+ | Primary database |
| **Cache** | Redis | 5.8+ | Caching & sessions |
| **Real-Time** | Socket.IO | 4.8+ | WebSocket server |
| **Job Queue** | BullMQ | 5.61+ | Background jobs |
| **Auth** | JWT | 9.0+ | Authentication |
| **Validation** | Joi | 17.13+ | Schema validation |
| **Logging** | Winston | 3.18+ | Application logging |
| **Testing** | Jest | 30.2+ | Unit/integration tests |
| **Payment** | Stripe | 17.7+ | Payment gateway (global) |
| **Payment** | Paystack | 2.0+ | Payment gateway (Africa) |
| **Email** | Nodemailer | 6.9+ | Email service |
| **SMS** | Twilio | 5.10+ | SMS notifications |
| **Storage** | Cloudinary | 2.7+ | Image storage/CDN |
| **Storage** | MinIO | 8.0+ | Object storage |
| **Security** | Helmet | 8.1+ | Security headers |
| **Security** | bcrypt | 6.0+ | Password hashing |

### Frontend Stack (Web)

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | React | 19.1+ | UI library |
| **Language** | TypeScript | 5.8+ | Type safety |
| **Build Tool** | Vite | 7.1+ | Fast build tool |
| **Router** | React Router | 7.9+ | Client-side routing |
| **State** | TanStack Query | 5.90+ | Server state management |
| **Forms** | React Hook Form | 7.70+ | Form management |
| **Validation** | Zod | 4.3+ | Schema validation |
| **UI Library** | Radix UI | Latest | Accessible components |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first CSS |
| **Charts** | Recharts | 3.2+ | Data visualization |
| **Testing** | Vitest | 3.2+ | Unit testing |
| **QR Code** | qrcode | 1.5+ | QR code generation |
| **PDF** | jsPDF | 4.0+ | PDF generation |

### Mobile Stack (Flutter)

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | Flutter | 3.0+ | Cross-platform framework |
| **Language** | Dart | 3.0+ | Programming language |
| **State Management** | GetX | 4.6+ | State & routing |
| **HTTP Client** | Dio | 5.4+ | API requests |
| **Local DB** | Drift (SQLite) | 2.14+ | Local database |
| **Secure Storage** | Flutter Secure Storage | 9.0+ | Encrypted storage |
| **Key-Value** | GetStorage | 2.1+ | Fast key-value store |
| **Code Gen** | Freezed | 2.4+ | Immutable classes |
| **JSON** | json_serializable | 6.7+ | JSON serialization |
| **QR Scanner** | mobile_scanner | 4.0+ | QR code scanning |
| **QR Display** | qr_flutter | 4.1+ | QR code display |
| **WebView** | webview_flutter | 4.4+ | In-app browser |
| **Notifications** | flutter_local_notifications | 18.0+ | Local notifications |
| **Caching** | cached_network_image | 3.3+ | Image caching |
| **UI Utils** | flutter_screenutil | 5.9+ | Responsive design |

### Infrastructure & DevOps

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Container** | Docker | Containerization |
| **Orchestration** | Docker Compose | Local development |
| **Version Control** | Git | Source control |
| **CI/CD** | GitHub Actions | Automation |
| **Linting** | ESLint | Code quality |
| **Formatting** | Prettier | Code formatting |
| **Git Hooks** | Husky | Pre-commit hooks |
| **Monitoring** | Winston Logs | Application monitoring |

---

## Backend Architecture

### Directory Structure

```
server/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.ts      # Prisma client setup
│   │   ├── redis.ts         # Redis client
│   │   ├── cloudinary.ts    # Cloudinary config
│   │   └── index.ts         # Centralized config
│   │
│   ├── controllers/         # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── event.controller.ts
│   │   ├── payment.controller.ts
│   │   ├── workstation.controller.ts
│   │   ├── checkpoint.controller.ts
│   │   ├── facility.controller.ts
│   │   ├── badge-template.controller.ts
│   │   ├── seat-map.controller.ts
│   │   └── ... (47+ controllers)
│   │
│   ├── services/            # Business logic
│   │   ├── auth.service.ts
│   │   ├── event.service.ts
│   │   ├── payment.service.ts
│   │   ├── workstation.service.ts
│   │   ├── checkpoint.service.ts
│   │   ├── email.service.ts
│   │   ├── websocket.service.ts
│   │   └── ... (40+ services)
│   │
│   ├── middleware/          # Express middleware
│   │   ├── auth.middleware.ts       # JWT authentication
│   │   ├── error.middleware.ts      # Error handling
│   │   ├── validate.middleware.ts   # Request validation
│   │   ├── rateLimit.middleware.ts  # Rate limiting
│   │   └── upload.middleware.ts     # File uploads
│   │
│   ├── routes/              # API routes
│   │   ├── auth.routes.ts
│   │   ├── event.routes.ts
│   │   ├── workstation.routes.ts
│   │   ├── checkpoint.routes.ts
│   │   └── ... (40+ route files)
│   │
│   ├── validations/         # Request validation schemas
│   │   ├── auth.validation.ts
│   │   ├── event.validation.ts
│   │   └── ...
│   │
│   ├── utils/               # Utility functions
│   │   ├── logger.ts        # Winston logger
│   │   ├── jwt.ts           # JWT helpers
│   │   ├── errors.ts        # Custom error classes
│   │   ├── email.ts         # Email templates
│   │   └── ...
│   │
│   ├── types/               # TypeScript types
│   │   ├── express.d.ts     # Express type extensions
│   │   └── ...
│   │
│   ├── jobs/                # Background jobs
│   │   ├── email.job.ts     # Email sending
│   │   ├── notification.job.ts
│   │   └── ...
│   │
│   ├── app.ts               # Express app setup
│   └── server.ts            # Server entry point
│
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── migrations/          # Database migrations
│   └── seed.ts              # Database seeding
│
├── tests/                   # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── scripts/                 # Utility scripts
├── logs/                    # Application logs
├── package.json
├── tsconfig.json
└── docker-compose.yml
```

### Layered Architecture

**1. Controller Layer** (`controllers/`)
- Handles HTTP requests/responses
- Request validation
- Delegates to service layer
- Returns formatted responses
- No business logic

**2. Service Layer** (`services/`)
- Contains business logic
- Interacts with database (Prisma)
- Handles external API calls
- Manages transactions
- Reusable across controllers

**3. Data Access Layer** (`Prisma ORM`)
- Database queries
- Type-safe operations
- Migration management
- Connection pooling

**4. Middleware Layer**
- Authentication/Authorization
- Request validation
- Error handling
- Rate limiting
- Security headers

### Design Patterns in Backend

**1. MVC Pattern (Modified)**
```
Request → Route → Controller → Service → Database
                      ↓
                  Response
```

**2. Dependency Injection**
- Services injected into controllers
- Centralized configuration
- Easy testing with mocks

**3. Repository Pattern (via Prisma)**
- Abstraction over database
- Type-safe queries
- Migration management

**4. Middleware Chain**
```typescript
// Example middleware chain
router.post('/events',
  authenticate,              // Auth middleware
  authorize('ORGANIZER'),    // Role check
  validate(eventSchema),     // Validation
  EventController.create     // Controller
);
```

**5. Error Handling Pattern**
```typescript
// Custom error classes
class ValidationError extends Error {}
class AuthenticationError extends Error {}
class AuthorizationError extends Error {}

// Global error handler middleware
app.use(errorHandler);
```

**6. Service Pattern**
```typescript
// Service handles business logic
class EventService {
  static async createEvent(data) {
    // Validation
    // Business logic
    // Database operations
    // Return result
  }
}
```

---

## Frontend Architecture

### Directory Structure

```
client/
├── src/
│   ├── components/          # Reusable components
│   │   ├── ui/              # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── layout/          # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── forms/           # Form components
│   │   └── shared/          # Shared components
│   │
│   ├── pages/               # Page components
│   │   ├── auth/            # Authentication pages
│   │   ├── events/          # Event pages
│   │   ├── organizer/       # Organizer dashboard
│   │   ├── admin/           # Admin dashboard
│   │   ├── attendee/        # Attendee dashboard
│   │   └── ...
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useEvents.ts
│   │   ├── useToast.ts
│   │   └── ...
│   │
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── ...
│   │
│   ├── lib/                 # Libraries & utilities
│   │   ├── api.ts           # API client
│   │   ├── queryClient.ts   # TanStack Query setup
│   │   └── utils.ts         # Helper functions
│   │
│   ├── types/               # TypeScript types
│   │   ├── api.ts           # API types
│   │   ├── models.ts        # Data models
│   │   └── ...
│   │
│   ├── utils/               # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── ...
│   │
│   ├── assets/              # Static assets
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
│
├── public/                  # Public assets
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

### State Management Strategy

**1. Server State (TanStack Query)**
```typescript
// API queries with caching
const { data, isLoading, error } = useQuery({
  queryKey: ['events', eventId],
  queryFn: () => api.events.getById(eventId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Mutations with optimistic updates
const mutation = useMutation({
  mutationFn: api.events.create,
  onSuccess: () => {
    queryClient.invalidateQueries(['events']);
  },
});
```

**2. Client State (React Context + Hooks)**
```typescript
// Authentication context
const AuthContext = createContext<AuthContextType>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
};
```

**3. Form State (React Hook Form)**
```typescript
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(eventSchema),
});
```

### Component Patterns

**1. Compound Components**
```tsx
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>Title</DialogHeader>
    <DialogBody>Content</DialogBody>
  </DialogContent>
</Dialog>
```

**2. Render Props**
```tsx
<DataTable
  data={events}
  render={(row) => <EventRow event={row} />}
/>
```

**3. Custom Hooks**
```typescript
function useEvents(filters) {
  const query = useQuery(/*...*/);
  return {
    events: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
```

### Routing Architecture

```typescript
// React Router v7 setup
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'events', element: <Events /> },
      { path: 'events/:id', element: <EventDetails /> },
      {
        path: 'organizer',
        element: <OrganizerLayout />,
        children: [
          { path: 'dashboard', element: <OrganizerDashboard /> },
          { path: 'events', element: <OrganizerEvents /> },
          { path: 'analytics', element: <Analytics /> },
        ],
      },
    ],
  },
]);
```

---

## Mobile Application Architecture

### Architecture Pattern: MVVM with GetX

```
┌────────────────────────────────────────┐
│            Presentation Layer           │
│  ┌──────────────────────────────────┐  │
│  │         Screens/Views            │  │
│  │    (UI Components - Widgets)     │  │
│  └────────────┬─────────────────────┘  │
└───────────────┼────────────────────────┘
                │
                │ Binds to
                │
┌───────────────▼────────────────────────┐
│          Controller Layer               │
│  ┌──────────────────────────────────┐  │
│  │       GetX Controllers           │  │
│  │    (Business Logic & State)      │  │
│  │                                  │  │
│  │  • AuthController                │  │
│  │  • EventsController              │  │
│  │  • TicketsController             │  │
│  │  • NotificationsController       │  │
│  └────────────┬─────────────────────┘  │
└───────────────┼────────────────────────┘
                │
                │ Uses
                │
┌───────────────▼────────────────────────┐
│            Domain Layer                 │
│  ┌──────────────────────────────────┐  │
│  │         Use Cases                │  │
│  │     (Business Rules)             │  │
│  └────────────┬─────────────────────┘  │
│               │                         │
│  ┌────────────▼─────────────────────┐  │
│  │        Repositories              │  │
│  │    (Data Source Abstraction)     │  │
│  └────────────┬─────────────────────┘  │
└───────────────┼────────────────────────┘
                │
                │ Calls
                │
┌───────────────▼────────────────────────┐
│            Data Layer                   │
│  ┌──────────────┬──────────────────┐   │
│  │  API Client  │  Local Storage   │   │
│  │    (Dio)     │  (Drift/SQLite)  │   │
│  └──────────────┴──────────────────┘   │
└────────────────────────────────────────┘
```

### GetX State Management

```dart
// Controller
class EventsController extends GetxController {
  // Reactive state
  final events = <Event>[].obs;
  final isLoading = false.obs;

  @override
  void onInit() {
    super.onInit();
    fetchEvents();
  }

  Future<void> fetchEvents() async {
    isLoading.value = true;
    try {
      final result = await eventsRepository.getEvents();
      events.value = result;
    } finally {
      isLoading.value = false;
    }
  }
}

// View (automatically rebuilds)
class EventsScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final controller = Get.find<EventsController>();

    return Obx(() => controller.isLoading.value
      ? CircularProgressIndicator()
      : ListView.builder(
          itemCount: controller.events.length,
          itemBuilder: (context, index) {
            return EventCard(event: controller.events[index]);
          },
        )
    );
  }
}
```

### Dependency Injection

```dart
// Bindings
class InitialBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut(() => ApiClient());
    Get.lazyPut(() => AuthController());
    Get.lazyPut(() => EventsController());
    Get.lazyPut(() => TicketsController());
  }
}
```

### Local Database (Drift/SQLite)

```dart
// Database definition
@DriftDatabase(tables: [CachedEvents, CachedTickets])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  Future<List<CachedEvent>> getAllEvents() => select(cachedEvents).get();
  Future insertEvent(CachedEvent event) => into(cachedEvents).insert(event);
}
```

---

## Database Design

### Prisma ORM

EventKnit uses Prisma as the ORM, providing:
- Type-safe database queries
- Automatic migrations
- Schema introspection
- Connection pooling
- Query optimization

### Schema Highlights

**Core Models:**
```prisma
model User {
  id            String      @id @default(uuid())
  email         String      @unique
  password      String?
  firstName     String?
  lastName      String?
  phoneNumber   String?
  role          UserRole    @default(ATTENDEE)
  status        UserStatus  @default(ACTIVE)

  // OAuth
  googleId      String?     @unique
  appleId       String?     @unique
  facebookId    String?     @unique

  // Timestamps
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  events        Event[]
  registrations EventRegistration[]
  tickets       TicketScan[]
}

model Event {
  id              String        @id @default(uuid())
  title           String
  description     String
  startDate       DateTime
  endDate         DateTime?
  location        String
  status          EventStatus   @default(PENDING)

  // Settings
  allowReEntry    Boolean       @default(false)
  requireCheckOut Boolean       @default(false)
  maxReEntries    Int?

  // Relations
  organizer       User          @relation(fields: [organizerId], references: [id])
  organizerId     String
  registrations   EventRegistration[]
  checkpoints     Checkpoint[]
  facilities      Facility[]
  seatMap         SeatMap?
}

model EventRegistration {
  id              String              @id @default(uuid())
  event           Event               @relation(fields: [eventId], references: [id])
  eventId         String
  attendee        User                @relation(fields: [attendeeId], references: [id])
  attendeeId      String

  // Ticket info
  ticketType      String
  ticketStatus    TicketStatus        @default(ACTIVE)
  qrCodeDataUrl   String?
  backupCode      String              @unique

  // Check-in tracking
  checkedInAt     DateTime?
  checkedOutAt    DateTime?
  isCurrentlyInside Boolean           @default(false)
  reEntryCount    Int                 @default(0)

  // Relations
  ticketScans     TicketScan[]
  seatReservations SeatReservation[]
}

model Checkpoint {
  id              String        @id @default(uuid())
  event           Event         @relation(fields: [eventId], references: [id])
  eventId         String
  name            String
  type            CheckpointType
  location        String?
  quota           Int?
  quotaEnforced   Boolean       @default(false)
  eligibilityRules Json?
  activeFrom      DateTime?
  activeTo        DateTime?

  // Relations
  scans           CheckpointScan[]
  staff           CheckpointStaff[]
}

model Facility {
  id              String        @id @default(uuid())
  event           Event         @relation(fields: [eventId], references: [id])
  eventId         String
  name            String
  code            String        @db.VarChar(10)
  description     String?
  icon            String?
  color           String?
  location        String?
  allowCheckIn    Boolean       @default(true)
  allowCheckOut   Boolean       @default(true)
  isActive        Boolean       @default(true)
  sortOrder       Int           @default(0)
}
```

### Enums

```prisma
enum UserRole {
  SUPERADMIN
  ADMIN
  ADMIN_STAFF
  MARKETER
  SUPPORT
  TELLER
  ORGANIZER
  ORGANIZER_STAFF
  ORGANIZER_TELLER
  ATTENDEE
}

enum EventStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
  COMPLETED
}

enum TicketStatus {
  ACTIVE
  DEACTIVATED
  EXPIRED
  CANCELLED
}

enum ScanType {
  CHECK_IN
  CHECK_OUT
  MANUAL_CHECK_IN
  MANUAL_CHECK_OUT
}
```

### Database Relationships

```
User (1) ──── (N) Event
User (1) ──── (N) EventRegistration
Event (1) ──── (N) EventRegistration
Event (1) ──── (N) Checkpoint
Event (1) ──── (N) Facility
Event (1) ──── (1) SeatMap
EventRegistration (1) ──── (N) TicketScan
EventRegistration (1) ──── (N) SeatReservation
Checkpoint (1) ──── (N) CheckpointScan
Checkpoint (1) ──── (N) CheckpointStaff
```

### Indexes & Optimization

```prisma
// Optimized indexes
@@index([email])
@@index([eventId, createdAt])
@@index([eventId, ticketStatus])
@@index([backupCode])
@@index([qrCodeDataUrl])
@@unique([eventId, attendeeId]) // Prevent duplicate registrations
```

---

## Authentication & Security

### JWT-Based Authentication

**Token Structure:**
```typescript
// Access Token (15 minutes)
{
  userId: string;
  email: string;
  role: UserRole;
  type: 'access';
  iat: number;
  exp: number;
}

// Refresh Token (30 days)
{
  userId: string;
  type: 'refresh';
  iat: number;
  exp: number;
}
```

**Token Flow:**
```
1. User logs in
2. Server generates access + refresh tokens
3. Client stores tokens (httpOnly cookies or secure storage)
4. Client sends access token with each request
5. When access token expires:
   - Client sends refresh token
   - Server validates refresh token
   - Server issues new access token
6. When refresh token expires:
   - User must re-authenticate
```

### Password Security

```typescript
// Password hashing with bcrypt
const hashedPassword = await bcrypt.hash(password, 12);

// Password verification
const isValid = await bcrypt.compare(inputPassword, hashedPassword);
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 letter
- At least 1 number
- Hashed with bcrypt (12 rounds)

### OAuth Integration

**Supported Providers:**
1. **Google OAuth 2.0**
   - Library: `apple-signin-auth`
   - Token encryption before storage
   - Profile data extraction

2. **Facebook Login**
   - OAuth flow with Facebook SDK
   - Secure token handling
   - Profile synchronization

3. **Apple Sign In**
   - JWT validation
   - Privacy-first approach

### Role-Based Access Control (RBAC)

```typescript
// Role hierarchy
const roleHierarchy = {
  SUPERADMIN: 10,
  ADMIN: 9,
  ADMIN_STAFF: 8,
  MARKETER: 7,
  SUPPORT: 7,
  TELLER: 6,
  ORGANIZER: 5,
  ORGANIZER_STAFF: 4,
  ORGANIZER_TELLER: 3,
  ATTENDEE: 1,
};

// Authorization middleware
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthorizationError('Insufficient permissions');
    }
    next();
  };
};

// Route protection
router.post('/events',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  EventController.create
);
```

### Security Middleware Stack

```typescript
// Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: true,
  xssFilter: true,
}));

// CORS configuration
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Rate limiting
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many requests, please try again later',
});

app.use('/api/v1/auth', authLimiter);
```

### QR Code Security

```typescript
// QR code generation with signature
const qrData = {
  registrationId: registration.id,
  eventId: event.id,
  timestamp: Date.now(),
  signature: generateSignature({
    registrationId,
    eventId,
    secret: config.qrSecret,
  }),
};

// Validation on scan
const isValid = verifySignature(qrData, config.qrSecret);
```

---

## API Design

### RESTful API Principles

**1. Resource-Based URLs:**
```
GET    /api/v1/events           - List events
GET    /api/v1/events/:id       - Get single event
POST   /api/v1/events           - Create event
PUT    /api/v1/events/:id       - Update event
DELETE /api/v1/events/:id       - Delete event

// Nested resources
GET    /api/v1/events/:eventId/registrations
POST   /api/v1/events/:eventId/checkpoints
```

**2. HTTP Methods:**
- `GET` - Retrieve resources
- `POST` - Create resources
- `PUT/PATCH` - Update resources
- `DELETE` - Delete resources

**3. Status Codes:**
```typescript
200 - OK (success)
201 - Created (resource created)
204 - No Content (success, no response body)
400 - Bad Request (validation error)
401 - Unauthorized (authentication required)
403 - Forbidden (insufficient permissions)
404 - Not Found
409 - Conflict (duplicate resource)
422 - Unprocessable Entity (validation failed)
429 - Too Many Requests (rate limited)
500 - Internal Server Error
```

**4. Response Format:**
```typescript
// Success response
{
  success: true,
  data: {
    // Response data
  },
  metadata: {
    page: 1,
    limit: 20,
    total: 100,
  }
}

// Error response
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input',
    details: {
      field: 'email',
      message: 'Invalid email format'
    }
  }
}
```

### API Versioning

```typescript
// Version prefix in URL
app.use('/api/v1', routes);

// Future versions
app.use('/api/v2', routesV2);
```

### Request Validation

```typescript
import Joi from 'joi';

// Validation schema
const eventSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(5000).required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')),
  location: Joi.string().required(),
  // ...
});

// Middleware
export const validate = (schema: Joi.Schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new ValidationError(error.details[0].message);
    }
    req.body = value;
    next();
  };
};
```

### Pagination & Filtering

```typescript
// Query parameters
GET /api/v1/events?page=1&limit=20&category=music&sortBy=startDate&order=asc

// Implementation
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;
const skip = (page - 1) * limit;

const events = await prisma.event.findMany({
  where: { category: req.query.category },
  skip,
  take: limit,
  orderBy: { [sortBy]: order },
});

// Response with metadata
{
  success: true,
  data: events,
  metadata: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }
}
```

---

## Real-Time Communication

### WebSocket Architecture (Socket.IO)

```typescript
// Server setup
import { Server } from 'socket.io';

const io = new Server(httpServer, {
  cors: {
    origin: config.cors.allowedOrigins,
    credentials: true,
  },
});

// Authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = verifyAccessToken(token);
    socket.data.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

// Event-specific rooms
io.on('connection', (socket) => {
  // Join event room
  socket.on('join-event', (eventId) => {
    socket.join(`event:${eventId}`);
  });

  // Leave event room
  socket.on('leave-event', (eventId) => {
    socket.leave(`event:${eventId}`);
  });
});

// Broadcast scan events
export const websocketService = {
  emitScanEvent(eventId: string, scanData: ScanEventData) {
    io.to(`event:${eventId}`).emit('scan:complete', scanData);
  },

  sendStatisticsUpdate(eventId: string) {
    io.to(`event:${eventId}`).emit('stats:update', {
      checkedInCount,
      currentlyInside,
      // ...
    });
  },
};
```

### Real-Time Use Cases

1. **Scan Events**
   - Broadcast check-in/check-out events
   - Real-time attendance updates
   - Facility usage tracking

2. **Statistics Updates**
   - Live attendee counts
   - Revenue tracking
   - Checkpoint statistics

3. **Notifications**
   - Event updates
   - Transfer notifications
   - System alerts

---

## State Management

### Backend State (In-Memory & Redis)

```typescript
// Redis caching
import Redis from 'ioredis';

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: 0,
});

// Cache patterns
export const cacheService = {
  // Cache event data
  async cacheEvent(eventId: string, data: any, ttl = 3600) {
    await redis.setex(`event:${eventId}`, ttl, JSON.stringify(data));
  },

  // Get cached event
  async getCachedEvent(eventId: string) {
    const cached = await redis.get(`event:${eventId}`);
    return cached ? JSON.parse(cached) : null;
  },

  // Invalidate cache
  async invalidateEvent(eventId: string) {
    await redis.del(`event:${eventId}`);
  },
};
```

### Frontend State (TanStack Query)

```typescript
// Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

// Query hooks
export const useEvent = (eventId: string) => {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: () => api.events.getById(eventId),
    enabled: !!eventId,
  });
};

// Mutation hooks with cache updates
export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.events.create,
    onSuccess: (newEvent) => {
      // Update events list cache
      queryClient.setQueryData(['events'], (old) => [
        newEvent,
        ...(old || []),
      ]);
    },
  });
};

// Optimistic updates
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.events.update,
    onMutate: async (updates) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries(['event', updates.id]);

      // Snapshot previous value
      const previous = queryClient.getQueryData(['event', updates.id]);

      // Optimistically update
      queryClient.setQueryData(['event', updates.id], updates);

      return { previous };
    },
    onError: (err, updates, context) => {
      // Rollback on error
      queryClient.setQueryData(['event', updates.id], context.previous);
    },
  });
};
```

### Mobile State (GetX)

```dart
// Reactive state with GetX
class EventsController extends GetxController {
  // Observable state
  final events = <Event>[].obs;
  final isLoading = false.obs;
  final error = Rx<String?>(null);

  // Computed properties
  List<Event> get upcomingEvents =>
      events.where((e) => e.startDate.isAfter(DateTime.now())).toList();

  // Actions
  Future<void> fetchEvents() async {
    isLoading.value = true;
    error.value = null;

    try {
      final result = await eventsRepository.getEvents();
      events.value = result;
    } catch (e) {
      error.value = e.toString();
    } finally {
      isLoading.value = false;
    }
  }

  // Lifecycle
  @override
  void onInit() {
    super.onInit();
    fetchEvents();
  }
}

// View automatically updates
Obx(() {
  if (controller.isLoading.value) {
    return CircularProgressIndicator();
  }

  if (controller.error.value != null) {
    return ErrorWidget(controller.error.value!);
  }

  return EventsList(events: controller.events);
})
```

---

## Design Patterns

### 1. Repository Pattern

```typescript
// Abstract repository interface
interface IEventRepository {
  findById(id: string): Promise<Event | null>;
  findAll(filters?: EventFilters): Promise<Event[]>;
  create(data: CreateEventDTO): Promise<Event>;
  update(id: string, data: UpdateEventDTO): Promise<Event>;
  delete(id: string): Promise<void>;
}

// Concrete implementation
class EventRepository implements IEventRepository {
  async findById(id: string) {
    return prisma.event.findUnique({ where: { id } });
  }

  async findAll(filters) {
    return prisma.event.findMany({
      where: this.buildWhereClause(filters),
    });
  }

  // ...
}
```

### 2. Factory Pattern

```typescript
// Payment gateway factory
class PaymentGatewayFactory {
  static create(provider: 'stripe' | 'paystack') {
    switch (provider) {
      case 'stripe':
        return new StripeGateway();
      case 'paystack':
        return new PaystackGateway();
      default:
        throw new Error('Invalid payment provider');
    }
  }
}

// Usage
const gateway = PaymentGatewayFactory.create('stripe');
await gateway.processPayment(amount, currency);
```

### 3. Strategy Pattern

```typescript
// Email sending strategy
interface IEmailStrategy {
  send(to: string, subject: string, body: string): Promise<void>;
}

class NodemailerStrategy implements IEmailStrategy {
  async send(to, subject, body) {
    // Nodemailer implementation
  }
}

class SendGridStrategy implements IEmailStrategy {
  async send(to, subject, body) {
    // SendGrid implementation
  }
}

// Context
class EmailService {
  constructor(private strategy: IEmailStrategy) {}

  async sendEmail(to, subject, body) {
    return this.strategy.send(to, subject, body);
  }
}
```

### 4. Observer Pattern (Event Emitter)

```typescript
import { EventEmitter } from 'events';

class EventBus extends EventEmitter {
  // Emit event
  emitRegistrationCreated(registration: EventRegistration) {
    this.emit('registration:created', registration);
  }

  // Listen to event
  onRegistrationCreated(handler: (reg: EventRegistration) => void) {
    this.on('registration:created', handler);
  }
}

// Usage
eventBus.onRegistrationCreated(async (registration) => {
  // Send confirmation email
  await emailService.sendConfirmation(registration);

  // Generate QR code
  await qrService.generate(registration);

  // Update analytics
  await analyticsService.trackRegistration(registration);
});
```

### 5. Middleware Pattern

```typescript
// Express middleware chain
app.use(
  helmet(),                    // Security headers
  compression(),               // Response compression
  express.json(),              // Body parsing
  cookieParser(),              // Cookie parsing
  morgan('combined', { stream }), // Request logging
  cors(corsOptions),           // CORS
);

// Route-specific middleware
router.post('/events',
  authenticate,                // Auth check
  authorize('ORGANIZER'),      // Role check
  validate(eventSchema),       // Validation
  checkEventLimits,            // Business logic
  EventController.create       // Controller
);
```

### 6. Decorator Pattern (TypeScript Decorators)

```typescript
// Custom decorators
function Log(target: any, key: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;

  descriptor.value = async function(...args: any[]) {
    logger.info(`Calling ${key} with args:`, args);
    const result = await original.apply(this, args);
    logger.info(`${key} returned:`, result);
    return result;
  };

  return descriptor;
}

// Usage
class EventService {
  @Log
  async createEvent(data: CreateEventDTO) {
    return prisma.event.create({ data });
  }
}
```

### 7. Singleton Pattern

```typescript
// Database connection singleton
class Database {
  private static instance: PrismaClient;

  private constructor() {}

  static getInstance(): PrismaClient {
    if (!Database.instance) {
      Database.instance = new PrismaClient();
    }
    return Database.instance;
  }
}

// Usage
const db = Database.getInstance();
```

---

## Data Flow

### Request-Response Flow

```
┌─────────────┐
│   Client    │
│ (Browser/   │
│  Mobile)    │
└──────┬──────┘
       │ HTTP Request
       │ (JSON)
       │
┌──────▼──────────────────────────────────┐
│         NGINX / Load Balancer            │
│  • SSL Termination                       │
│  • Request Routing                       │
│  • Rate Limiting (Optional)              │
└──────┬──────────────────────────────────┘
       │
┌──────▼──────────────────────────────────┐
│         Express.js Middleware            │
│  1. Helmet (Security Headers)            │
│  2. CORS                                 │
│  3. Body Parser                          │
│  4. Cookie Parser                        │
│  5. Morgan (Request Logging)             │
│  6. Compression                          │
└──────┬──────────────────────────────────┘
       │
┌──────▼──────────────────────────────────┐
│         Route Middleware                 │
│  1. authenticate (JWT verification)      │
│  2. authorize (Role check)               │
│  3. validate (Request validation)        │
│  4. rateLimit (Per-route limits)         │
└──────┬──────────────────────────────────┘
       │
┌──────▼──────────────────────────────────┐
│            Controller                    │
│  • Parse request                         │
│  • Call service layer                    │
│  • Format response                       │
│  • Handle errors                         │
└──────┬──────────────────────────────────┘
       │
┌──────▼──────────────────────────────────┐
│            Service Layer                 │
│  • Business logic                        │
│  • Validation                            │
│  • Transactions                          │
│  • External API calls                    │
└──────┬──────────────────────────────────┘
       │
┌──────▼──────────────────────────────────┐
│         Data Access Layer                │
│  • Prisma ORM queries                    │
│  • Redis cache                           │
│  • File storage                          │
└──────┬──────────────────────────────────┘
       │
┌──────▼──────────────────────────────────┐
│           Database                       │
│  • PostgreSQL (Primary data)             │
│  • Redis (Cache/Sessions)                │
└──────┬──────────────────────────────────┘
       │ Response
       │
┌──────▼──────────────────────────────────┐
│      Format & Send Response              │
│  {                                       │
│    success: true,                        │
│    data: { ... }                         │
│  }                                       │
└──────────────────────────────────────────┘
```

### Event Registration Flow

```
1. User browses events
   ↓
2. Selects event and tickets
   ↓
3. Frontend validates selection
   ↓
4. POST /api/v1/events/:id/register
   ↓
5. Backend validates:
   - User authentication
   - Ticket availability
   - Event status
   - Payment required?
   ↓
6. If payment required:
   - Initialize payment (Stripe/Paystack)
   - Await payment confirmation
   - Webhook receives payment status
   ↓
7. Create registration record
   ↓
8. Generate QR code with signature
   ↓
9. Generate backup code
   ↓
10. Reserve seats (if seat map event)
    ↓
11. Send confirmation email
    - QR code
    - Ticket PDF
    - Calendar invite
    ↓
12. Emit WebSocket event (if organizer watching)
    ↓
13. Return success response
    ↓
14. Frontend redirects to ticket view
```

---

## File Storage

### Multi-Provider Strategy

**1. Cloudinary (Images & Media)**
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// Upload image
export async function uploadImage(file: Express.Multer.File) {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: 'eventknit/events',
    transformation: [
      { width: 1200, height: 630, crop: 'fill' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}
```

**2. MinIO (Documents & Files)**
```typescript
import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: config.minio.endpoint,
  port: config.minio.port,
  useSSL: true,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey,
});

// Upload file
export async function uploadFile(
  bucketName: string,
  fileName: string,
  stream: Readable,
  contentType: string
) {
  await minioClient.putObject(
    bucketName,
    fileName,
    stream,
    { 'Content-Type': contentType }
  );

  return {
    bucket: bucketName,
    fileName,
    url: await minioClient.presignedGetObject(bucketName, fileName),
  };
}
```

### File Upload Middleware

```typescript
import multer from 'multer';

// Memory storage for processing before upload
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Usage
router.post('/events',
  upload.single('image'),
  EventController.create
);
```

---

## Background Jobs & Queues

### BullMQ Job Processing

```typescript
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis({
  host: config.redis.host,
  port: config.redis.port,
});

// Email queue
const emailQueue = new Queue('email', { connection });

// Add job to queue
export async function queueEmail(data: EmailJobData) {
  await emailQueue.add('send-email', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
}

// Worker to process jobs
const emailWorker = new Worker(
  'email',
  async (job) => {
    const { to, subject, body } = job.data;
    await emailService.send(to, subject, body);
  },
  { connection }
);

// Handle events
emailWorker.on('completed', (job) => {
  logger.info(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`Email job ${job.id} failed:`, err);
});
```

### Job Types

1. **Email Jobs**
   - Registration confirmations
   - Password resets
   - Event reminders
   - Marketing emails

2. **Notification Jobs**
   - Push notifications
   - SMS notifications
   - In-app notifications

3. **Analytics Jobs**
   - Daily/weekly reports
   - Data aggregation
   - Statistics computation

4. **Cleanup Jobs**
   - Expired token cleanup
   - Old log deletion
   - Temporary file cleanup

---

## Logging & Monitoring

### Winston Logger Configuration

```typescript
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format (colorized)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

// Create logger
export const logger = winston.createLogger({
  level: config.logging.level || 'info',
  format: logFormat,
  transports: [
    // Console logging
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // Application logs (rotated daily)
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),

    // Error logs (rotated daily)
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
    }),
  ],
});

// HTTP request logging
import morgan from 'morgan';

app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));
```

### Log Levels

```typescript
logger.error('Critical error', { error, context });  // Errors
logger.warn('Warning message', { details });         // Warnings
logger.info('Info message', { data });               // General info
logger.http('HTTP request', { req, res });           // HTTP logs
logger.debug('Debug info', { debug });               // Debug info
```

### Structured Logging

```typescript
// Add context to logs
logger.info('User registered', {
  userId: user.id,
  email: user.email,
  role: user.role,
  timestamp: new Date(),
});

// Error logging with stack trace
try {
  // ...
} catch (error) {
  logger.error('Payment failed', {
    error: error.message,
    stack: error.stack,
    userId: user.id,
    amount,
    currency,
  });
}
```

---

## Testing Strategy

### Backend Testing

**1. Unit Tests (Jest)**
```typescript
// auth.service.test.ts
describe('AuthService', () => {
  describe('register', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = await AuthService.register(userData);

      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    it('should throw error for duplicate email', async () => {
      await expect(
        AuthService.register({ email: 'existing@example.com', ... })
      ).rejects.toThrow('Email already exists');
    });
  });
});
```

**2. Integration Tests**
```typescript
// event.integration.test.ts
describe('Event API', () => {
  let authToken: string;

  beforeAll(async () => {
    // Setup test database
    await setupTestDB();

    // Login and get token
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'organizer@test.com', password: 'password' });

    authToken = response.body.data.accessToken;
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('should create an event', async () => {
    const eventData = {
      title: 'Test Event',
      description: 'Test Description',
      startDate: new Date(),
      location: 'Test Location',
    };

    const response = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send(eventData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe(eventData.title);
  });
});
```

**3. E2E Tests**
```typescript
// registration.e2e.test.ts
describe('Event Registration Flow', () => {
  it('should complete full registration process', async () => {
    // 1. Get event
    const event = await request(app)
      .get('/api/v1/events/test-event-id');

    // 2. Register
    const registration = await request(app)
      .post(`/api/v1/events/${event.body.data.id}/register`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ ticketType: 'General', quantity: 1 });

    // 3. Check email sent
    expect(emailService.send).toHaveBeenCalled();

    // 4. Verify QR code generated
    expect(registration.body.data.qrCodeDataUrl).toBeDefined();
  });
});
```

### Frontend Testing

**1. Component Tests (Vitest + React Testing Library)**
```typescript
// EventCard.test.tsx
describe('EventCard', () => {
  it('renders event information', () => {
    const event = {
      id: '1',
      title: 'Test Event',
      startDate: new Date(),
      location: 'Test Location',
    };

    render(<EventCard event={event} />);

    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('Test Location')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<EventCard event={event} onClick={handleClick} />);

    fireEvent.click(screen.getByTestId('event-card'));

    expect(handleClick).toHaveBeenCalledWith(event);
  });
});
```

**2. Hook Tests**
```typescript
// useAuth.test.ts
describe('useAuth', () => {
  it('returns user when authenticated', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.user).toBeDefined();
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### Mobile Testing

**1. Widget Tests (Flutter)**
```dart
testWidgets('EventCard displays event info', (WidgetTester tester) async {
  final event = Event(
    id: '1',
    title: 'Test Event',
    startDate: DateTime.now(),
  );

  await tester.pumpWidget(
    MaterialApp(
      home: EventCard(event: event),
    ),
  );

  expect(find.text('Test Event'), findsOneWidget);
  expect(find.byType(QrImage), findsOneWidget);
});
```

**2. Unit Tests**
```dart
test('EventsController fetches events', () async {
  final controller = EventsController();

  await controller.fetchEvents();

  expect(controller.events.length, greaterThan(0));
  expect(controller.isLoading.value, false);
});
```

---

## Development Workflow

### Git Workflow

```
main (production)
├── develop (staging)
│   ├── feature/user-auth
│   ├── feature/event-scanning
│   ├── bugfix/payment-issue
│   └── hotfix/critical-bug
```

**Branch Naming:**
- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates

### Commit Convention

```
type(scope): subject

body

footer
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code restructuring
- `test:` - Tests
- `chore:` - Maintenance

**Example:**
```
feat(auth): implement Google OAuth

- Add Google OAuth 2.0 integration
- Store encrypted tokens in database
- Update user model with googleId

Closes #123
```

### Pre-commit Hooks (Husky)

```json
// .husky/pre-commit
#!/bin/sh
npm run lint
npm run type-check
npm run test:run
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:coverage

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run build
      - run: docker build -t eventknit .

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - run: echo "Deploy to production"
```

---

## Deployment Architecture

### Docker Containerization

**Backend Dockerfile:**
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npx prisma generate

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

EXPOSE 3001

CMD ["npm", "start"]
```

**Docker Compose:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: eventknit
      POSTGRES_PASSWORD: password
      POSTGRES_DB: eventknit
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./server
    environment:
      DATABASE_URL: postgresql://eventknit:password@postgres:5432/eventknit
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    ports:
      - "3001:3001"

  frontend:
    build: ./client
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Environment Configuration

```typescript
// config/index.ts
export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001'),

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: '15m',
    refreshExpiry: '30d',
  },

  cors: {
    allowedOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY,
    publicKey: process.env.PAYSTACK_PUBLIC_KEY,
  },
};
```

---

## Performance Optimization

### Database Optimization

**1. Indexes**
```prisma
model EventRegistration {
  // ... fields

  @@index([eventId, ticketStatus])
  @@index([attendeeId, createdAt])
  @@index([backupCode])
  @@index([qrCodeDataUrl])
}
```

**2. Query Optimization**
```typescript
// Use select to limit fields
const events = await prisma.event.findMany({
  select: {
    id: true,
    title: true,
    startDate: true,
    location: true,
  },
});

// Use include for relations
const event = await prisma.event.findUnique({
  where: { id },
  include: {
    registrations: {
      take: 10,
      orderBy: { createdAt: 'desc' },
    },
  },
});

// Use cursor-based pagination for large datasets
const events = await prisma.event.findMany({
  take: 20,
  skip: 1,
  cursor: { id: lastEventId },
});
```

**3. Connection Pooling**
```typescript
// Prisma handles connection pooling automatically
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

### Caching Strategy

**1. Redis Caching**
```typescript
// Cache frequently accessed data
async function getEvent(id: string) {
  // Try cache first
  const cached = await redis.get(`event:${id}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database
  const event = await prisma.event.findUnique({ where: { id } });

  // Cache for 5 minutes
  await redis.setex(`event:${id}`, 300, JSON.stringify(event));

  return event;
}
```

**2. HTTP Caching Headers**
```typescript
// Set cache headers
res.set('Cache-Control', 'public, max-age=300');
res.set('ETag', generateETag(data));
```

### API Optimization

**1. Response Compression**
```typescript
import compression from 'compression';

app.use(compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
}));
```

**2. Pagination**
```typescript
// Always paginate large result sets
const limit = Math.min(parseInt(req.query.limit) || 20, 100);
const page = parseInt(req.query.page) || 1;
const skip = (page - 1) * limit;

const [data, total] = await Promise.all([
  prisma.event.findMany({ skip, take: limit }),
  prisma.event.count(),
]);
```

**3. Batch Operations**
```typescript
// Use transactions for batch operations
await prisma.$transaction([
  prisma.event.create({ data: event1 }),
  prisma.event.create({ data: event2 }),
  prisma.event.create({ data: event3 }),
]);
```

### Frontend Optimization

**1. Code Splitting**
```typescript
// Lazy load routes
const OrganizerDashboard = lazy(() => import('./pages/organizer/Dashboard'));

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/organizer" element={<OrganizerDashboard />} />
  </Routes>
</Suspense>
```

**2. Image Optimization**
```tsx
// Use optimized images
<img
  src={event.imageUrl}
  srcSet={`${event.imageUrl}?w=400 400w, ${event.imageUrl}?w=800 800w`}
  sizes="(max-width: 768px) 400px, 800px"
  loading="lazy"
  alt={event.title}
/>
```

**3. Memoization**
```typescript
// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize components
const EventCard = memo(({ event }) => {
  return <div>{event.title}</div>;
});
```

---

## Security Best Practices

### 1. Input Validation
- Validate all input on both client and server
- Use Joi/Zod for schema validation
- Sanitize user input
- Prevent SQL injection (Prisma handles this)
- Prevent XSS attacks

### 2. Authentication & Authorization
- Use JWT with short expiry times
- Implement refresh token rotation
- Hash passwords with bcrypt (12 rounds)
- Implement rate limiting on auth endpoints
- Use HTTPS only in production

### 3. API Security
- Use Helmet for security headers
- Implement CORS properly
- Rate limit all endpoints
- Validate request origin
- Use API versioning

### 4. Data Protection
- Encrypt sensitive data at rest
- Use SSL/TLS for data in transit
- Store secrets in environment variables
- Never log sensitive information
- Implement proper error handling

### 5. Dependency Management
- Regularly update dependencies
- Use `npm audit` to check for vulnerabilities
- Use lock files (package-lock.json)
- Review dependencies before installation

---

## Appendix

### Environment Variables Template

```env
# Server
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/eventknit

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Paystack
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=

# Email
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Facebook OAuth
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

### Useful Commands

```bash
# Backend
npm run dev              # Start development server
npm run build            # Build for production
npm run test             # Run tests
npm run lint             # Lint code
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio

# Frontend
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run test             # Run tests

# Mobile
flutter run              # Run app
flutter build apk        # Build Android APK
flutter build ios        # Build iOS app
flutter test             # Run tests

# Docker
docker compose up        # Start all services
docker compose down      # Stop all services
docker compose logs      # View logs
```

---

*Last Updated: January 2026*

*Version: 1.0.0*
