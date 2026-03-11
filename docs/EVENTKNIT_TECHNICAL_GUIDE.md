# EventKnit Technical Documentation

A comprehensive engineering guide to the EventKnit platform — architecture, design patterns, implementation details, and operational procedures.

**Target Audience:** Software Engineers, System Architects, DevOps Engineers, Technical Leads, New Developers

**Last Updated:** March 2026

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Backend Architecture](#3-backend-architecture)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Mobile Application Architecture](#5-mobile-application-architecture)
6. [Database Design](#6-database-design)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [API Design](#8-api-design)
9. [Real-Time Communication](#9-real-time-communication)
10. [State Management](#10-state-management)
11. [Design Patterns](#11-design-patterns)
12. [Data Flow](#12-data-flow)
13. [File Storage](#13-file-storage)
14. [Background Jobs & Queues](#14-background-jobs--queues)
15. [Logging & Monitoring](#15-logging--monitoring)
16. [Testing Strategy](#16-testing-strategy)
17. [Development Workflow](#17-development-workflow)
18. [Deployment & Infrastructure](#18-deployment--infrastructure)
19. [Performance Optimization](#19-performance-optimization)
20. [Security Best Practices](#20-security-best-practices)
21. [Payment & Disbursement System](#21-payment--disbursement-system)
22. [Checkout & Registration System](#22-checkout--registration-system)
23. [White Label & Branding System](#23-white-label--branding-system)
24. [Promo Code Engine](#24-promo-code-engine)
25. [Seat Allocation System](#25-seat-allocation-system)
26. [Event Creation System](#26-event-creation-system)
27. [Admin Panel Security](#27-admin-panel-security)
28. [QR Code & Ticket Security](#28-qr-code--ticket-security)
29. [Case Study: High-Concurrency Ticketing](#29-case-study-high-concurrency-ticketing)
30. [v2.0 Architecture Roadmap](#30-v20-architecture-roadmap)
31. [Offline Sync & Mobile Scanning](#31-offline-sync--mobile-scanning)
32. [Event Day Hub & MICE Operations](#32-event-day-hub--mice-operations)
   - 32.1 Managed Events System
33. [USSD & SMS Channel](#33-ussd--sms-channel)
34. [Unified Messaging & Communication](#34-unified-messaging--communication)
35. [Ticket Transfer & Resale Marketplace](#35-ticket-transfer--resale-marketplace)
36. [Distributed Locking & Concurrency Control](#36-distributed-locking--concurrency-control)
37. [Audit Logging & GDPR Compliance](#37-audit-logging--gdpr-compliance)
38. [Granular Permission System](#38-granular-permission-system)
39. [Social Media Integration](#39-social-media-integration)
40. [Attendee Management & Segmentation](#40-attendee-management--segmentation)
41. [Digital Wallet, Credits & Invoicing](#41-digital-wallet-credits--invoicing)
42. [Dynamic Pricing Engine](#42-dynamic-pricing-engine)
43. [Batch Export & Data Operations](#43-batch-export--data-operations)
44. [CI/CD Pipelines & DevOps](#44-cicd-pipelines--devops)
45. [Port Configuration](#45-port-configuration)
46. [Glossary](#46-glossary)

---

## 1. System Architecture

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
       │  • Validation (Joi)                │
       │  • Error Handling                  │
       │  • Logging (Winston)               │
       └────────────────┬───────────────────┘
                        │
       ┌────────────────┴───────────────────────────────────┐
       │              DATA & STORAGE LAYER                   │
       ├────────────┬──────────────┬──────────────┬─────────┤
       │ PostgreSQL │    Redis     │   Cloudinary │  MinIO  │
       │  (Prisma)  │ (Cache/Jobs) │   (Images)   │ (Files) │
       └────────────┴──────────────┴──────────────┴─────────┘
                        │
       ┌────────────────┴───────────────────┐
       │       EXTERNAL SERVICES             │
       ├─────────────────────────────────────┤
       │  • Stripe (Payments — Global)       │
       │  • Paystack (Payments — Africa)     │
       │  • M-Pesa (Mobile Money — Kenya)    │
       │  • Firebase (Push Notifications)    │
       │  • Twilio (SMS)                     │
       │  • Nodemailer (Email/SMTP)          │
       │  • Google Maps (Location Services)  │
       └─────────────────────────────────────┘
```

### Architecture Patterns

**1. Three-Tier Architecture:**
- **Presentation Layer**: Web (React) + Mobile (Flutter)
- **Application Layer**: Node.js/Express REST API + Socket.IO
- **Data Layer**: PostgreSQL + Redis + Cloud Storage

**2. Modular Monolith (Microservices-Ready):**
- Controller → Service → Data Access separation
- Each domain (auth, events, payments, scanning) has independent modules
- Clear boundaries enable future microservices extraction

**3. Event-Driven Components:**
- WebSocket for real-time scan updates and dashboard statistics
- BullMQ for background job processing (emails, notifications, payouts)
- Event emission for cross-module communication

---

## 2. Technology Stack

### Backend (44 dependencies)

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Runtime** | Node.js | 20+ | JavaScript runtime |
| **Language** | TypeScript | 5.9+ | Type-safe development |
| **Framework** | Express.js | 5.1+ | Web framework |
| **ORM** | Prisma | 6.18+ | Database toolkit with type-safe queries |
| **Database** | PostgreSQL | 16+ (Alpine) | Primary relational database |
| **Database** | MongoDB (Mongoose) | 8.19+ | Secondary database (analytics, logs) |
| **Cache/Queue** | Redis (ioredis) | 5.9+ | Caching, sessions, distributed locking, BullMQ backing store |
| **Real-Time** | Socket.IO | 4.8+ | WebSocket server for live updates |
| **Job Queue** | BullMQ | 5.67+ | Background job processing |
| **Scheduling** | node-cron | 4.2+ | Cron-based scheduled jobs (12 jobs) |
| **Auth** | JWT (jsonwebtoken) | 9.0+ | Dual-token authentication |
| **Auth** | apple-signin-auth | 1.7+ | Apple Sign-In verification |
| **Validation** | Joi | 17.13+ | Request schema validation |
| **Validation** | express-validator | 7.3+ | Additional request validation |
| **Logging** | Winston | 3.18+ | Structured logging with daily rotation |
| **HTTP Logging** | Morgan | 1.10+ | HTTP request/response logging |
| **Testing** | Jest | 30.2+ | Unit and integration testing |
| **Testing** | Supertest | 7.1+ | HTTP endpoint testing |
| **Testing** | mongodb-memory-server | 10.2+ | In-memory MongoDB for tests |
| **Payment** | Stripe SDK | 17.7+ | Global payment gateway |
| **Payment** | Paystack | 2.0+ | African payment gateway |
| **Email** | Nodemailer | 6.9+ | SMTP email service |
| **SMS** | Twilio | 5.10+ | SMS & USSD notifications |
| **Push** | web-push | 3.6+ | Web Push notifications (VAPID) |
| **Push** | firebase-admin | 13.5+ | Firebase Cloud Messaging (FCM) |
| **Storage** | Cloudinary | 2.7+ | Image CDN and transformation |
| **Storage** | MinIO | 8.0+ | S3-compatible object storage |
| **Upload** | Multer | 1.4+ | Multipart file upload handling |
| **Image** | Sharp | 0.34+ | Image resizing, format conversion |
| **PDF** | PdfKit | 0.17+ | Server-side PDF generation (tickets, invoices) |
| **QR Code** | qrcode | 1.5+ | QR code generation (PNG/DataURL) |
| **Excel** | xlsx | 0.18+ | Excel spreadsheet export |
| **YAML** | yamljs | 0.3+ | YAML configuration parsing |
| **Maps** | @googlemaps/google-maps-services-js | 3.4+ | Geocoding, distance calculation |
| **Security** | Helmet | 8.1+ | HTTP security headers |
| **Security** | bcrypt | 6.0+ | Password hashing (12 salt rounds) |
| **Security** | CORS | 2.8+ | Cross-Origin Resource Sharing |
| **Crypto** | Ed25519 | Built-in | Cryptographic ticket signing |
| **Compression** | compression | 1.7+ | gzip/deflate HTTP response compression |
| **Cookies** | cookie-parser | 1.4+ | Cookie parsing middleware |
| **UUID** | uuid | 11.0+ | UUID generation for entities |
| **Config** | dotenv | 17.2+ | Environment variable loading |
| **API Docs** | swagger-ui-express | 5.0+ | Interactive API documentation at `/api-docs` |
| **DB Driver** | pg | 8.16+ | PostgreSQL native driver |
| **Dev Runner** | tsx | 4.21+ | TypeScript execution with watch mode |

### Frontend — Web (70 dependencies)

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | React | 19.1+ | UI library |
| **Language** | TypeScript | 5.8+ | Type safety |
| **Build Tool** | Vite | 7.1+ | Fast HMR and bundling (SWC compiler) |
| **Router** | React Router | 7.9+ | Client-side routing |
| **Server State** | TanStack Query | 5.90+ | Data fetching, caching, mutations |
| **Forms** | React Hook Form | 7.70+ | Form state management |
| **Validation** | Zod | 4.3+ | Schema validation |
| **UI Primitives** | Radix UI | Latest | 15 accessible headless components (dialog, tabs, select, etc.) |
| **Icons** | Lucide React | 0.544+ | SVG icon library |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first CSS framework |
| **CSS Utils** | clsx + tailwind-merge | Latest | Conditional class merging |
| **Variants** | class-variance-authority | 0.7+ | Component variant management |
| **Animations** | Framer Motion | 12.34+ | Declarative animations and transitions |
| **Animations** | tailwindcss-animate | 1.0+ | Tailwind animation utilities |
| **Charts** | Recharts | 3.2+ | Data visualization |
| **Rich Text** | TipTap | 3.19+ | Rich text editor (16 extensions: bold, italic, lists, history, etc.) |
| **Maps** | Leaflet + react-leaflet | 1.9+ / 5.0+ | Interactive venue maps |
| **QR Code** | qrcode | 1.5+ | QR code generation |
| **QR Scanner** | html5-qrcode | 2.3+ | Browser-based QR scanning (camera) |
| **PDF** | jsPDF | 4.1+ | Client-side PDF generation |
| **PDF** | react-to-pdf | 3.1+ | PDF from React components |
| **Screenshot** | html2canvas | 1.4+ | Capture React components as images |
| **Print** | react-to-print | 3.1+ | Browser print dialog for badges/tickets |
| **CSV** | papaparse | 5.5+ | CSV parsing and generation |
| **File Upload** | react-dropzone | 15.0+ | Drag-and-drop file uploads |
| **Drag** | react-draggable | 4.5+ | Draggable UI elements (badge builder) |
| **Resize** | react-resizable | 3.1+ | Resizable panels/elements |
| **Virtualization** | react-window | 2.2+ | Windowed rendering for large lists |
| **WebSocket** | socket.io-client | 4.8+ | Real-time client (scan events, notifications) |
| **Dates** | date-fns | 4.1+ | Date formatting and manipulation |
| **Debounce** | use-debounce | 10.1+ | Debounced input hooks |
| **Sanitization** | DOMPurify | 3.3+ | XSS prevention for rich text rendering |
| **Testing** | Vitest | 3.2+ | Unit testing (Vite-native, NOT Jest) |
| **Testing** | React Testing Library | 16.3+ | Component testing |
| **Testing** | jsdom | 27.0+ | DOM simulation |

### Mobile — Flutter (35 dependencies)

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | Flutter | 3.x | Cross-platform (iOS + Android) |
| **Language** | Dart | >=3.0 <4.0 | Programming language |
| **State** | GetX | 4.6+ | Reactive state, routing, DI |
| **HTTP** | Dio | 5.4+ | HTTP client with interceptors |
| **HTTP** | http | 1.2+ | Lightweight HTTP (secondary) |
| **Local DB** | Drift + drift_flutter | 2.14+ | Type-safe SQLite ORM with offline caching |
| **SQLite** | sqlite3_flutter_libs | 0.5+ | Native SQLite binaries |
| **Secure Storage** | FlutterSecureStorage | 9.0+ | AES-encrypted token storage (Keychain/Keystore) |
| **Fast KV** | GetStorage | 2.1+ | Non-sensitive key-value storage |
| **Preferences** | shared_preferences | 2.2+ | Simple persistent preferences |
| **Code Gen** | Freezed + json_serializable | 2.4+ | Immutable models + JSON serialization |
| **Crypto** | cryptography | 2.7+ | Ed25519 signature verification (offline tickets) |
| **QR Scanner** | mobile_scanner | 4.0+ | Camera-based QR code scanning |
| **QR Render** | qr_flutter | 4.1+ | QR code display in-app |
| **Auth** | google_sign_in | 6.2+ | Google OAuth |
| **Auth** | sign_in_with_apple | 6.1+ | Apple OAuth |
| **Push** | flutter_local_notifications | 18.0+ | Local push notifications |
| **Background** | workmanager | 0.6+ | Periodic background sync (every 15 min) |
| **Connectivity** | connectivity_plus | 5.0+ | Online/offline detection |
| **Location** | geolocator | 14.0+ | GPS positioning |
| **Geocoding** | geocoding | 4.0+ | Reverse geocoding (coordinates → address) |
| **Images** | cached_network_image | 3.3+ | Image caching and loading |
| **Fonts** | google_fonts | 6.1+ | Dynamic font loading (Inter) |
| **Animations** | lottie | 3.1+ | Lottie JSON animations |
| **Loading** | shimmer | 3.0+ | Shimmer loading placeholders |
| **Responsive** | flutter_screenutil | 5.9+ | Responsive sizing across devices |
| **WebView** | webview_flutter | 4.4+ | In-app web pages (payment flows) |
| **URLs** | url_launcher | 6.2+ | Open external URLs/maps/phone |
| **Sharing** | share_plus | 7.2+ | Native share sheet |
| **Dates** | intl | 0.19+ | Date/number formatting, i18n |
| **FP** | dartz | 0.10+ | Functional programming (Either type for error handling) |
| **UUID** | uuid | 4.3+ | UUID generation |
| **Paths** | path_provider + path | 2.1+ | File system path resolution |
| **Icons** | cupertino_icons | 1.0+ | iOS-style icons |
| **Testing** | mocktail + mockito | 1.0+ / 5.4+ | Mocking for unit tests |

### Infrastructure & DevOps

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Container** | Docker | Latest | Multi-stage builds for server + client |
| **Orchestration** | Docker Compose | Latest | Multi-service development (PostgreSQL, Redis, server, client, nginx) |
| **Reverse Proxy** | NGINX | Alpine | SSL termination, WebSocket proxy (86400s timeout), static serving |
| **Database** | PostgreSQL | 16-alpine | With health checks and resource limits |
| **Cache** | Redis | 7.2-alpine | With auth, AOF persistence, maxmemory-policy |
| **Version Control** | Git | Latest | Feature-branch workflow |
| **CI/CD** | GitHub Actions | — | 8 workflows: CI (lint, type-check, test, build) + deploy (staging, production) |
| **Linting** | ESLint | 9.x | Code quality (server + client configs) |
| **Git Hooks** | Husky + lint-staged | 9.1+ | Pre-push: coverage + lint + type-check + build |
| **Log Rotation** | winston-daily-rotate-file | 5.0+ | Daily rotation, 14-day retention, gzip compression |
| **Process Mgmt** | PM2 | — | Production process management |
| **DDoS/WAF** | CloudFlare | — | Production DDoS protection and Web Application Firewall |

---

## 3. Backend Architecture

### Directory Structure

```
server/
├── src/
│   ├── server.ts              # Entry point — starts HTTP + WebSocket
│   ├── app.ts                 # Express app setup, middleware, route mounting
│   ├── config/
│   │   ├── database.ts        # Prisma client singleton
│   │   ├── redis.ts           # Redis client
│   │   ├── cloudinary.ts      # Cloudinary config
│   │   └── index.ts           # Centralized config (env vars)
│   ├── controllers/           # HTTP request handlers (68 files)
│   ├── services/              # Business logic (121 files)
│   ├── routes/                # Route definitions (55 files)
│   ├── middleware/
│   │   ├── auth.middleware.ts       # authenticate, authorize, optionalAuth, requireMinRole
│   │   ├── error.middleware.ts      # Global error handler
│   │   ├── validate.middleware.ts   # Joi validation
│   │   ├── rateLimit.middleware.ts  # Rate limiting
│   │   └── upload.middleware.ts     # Multer file uploads
│   ├── validations/           # Joi request schemas
│   ├── utils/
│   │   ├── logger.ts          # Winston logger
│   │   ├── jwt.ts             # Token generation/verification
│   │   ├── errors.ts          # Custom error classes
│   │   ├── email.ts           # Email templates
│   │   └── business-days.ts   # Business day calculations
│   ├── jobs/                  # BullMQ job definitions (12 jobs)
│   └── types/                 # TypeScript type definitions
├── prisma/
│   ├── schema.prisma          # Database schema (152 models, 27 enums)
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Database seeding
├── tests/
│   ├── unit/services/         # Service unit tests (23 files)
│   ├── unit/controllers/      # Controller unit tests
│   ├── unit/jobs/             # Background job tests (8 files)
│   └── *.test.ts              # Integration tests (78 files)
├── docker-compose.yml
└── package.json
```

### Layered Architecture Pattern

```
Request → Route → Middleware → Controller → Service → Prisma → Database
                                  ↓
                              Response
```

**1. Route Layer** — Path mapping, middleware chain, validation schemas
**2. Controller Layer** — Extract request data, call service, format response. **No business logic.**
**3. Service Layer** — All business logic, validation, database operations, external API calls
**4. Data Access Layer** — Prisma ORM with type-safe queries, connection pooling, migrations

### Middleware Stack (from app.ts)

```typescript
// Applied in order:
1. Helmet          — Security headers (CSP, HSTS, X-Frame-Options, etc.)
2. CORS            — Cross-origin configuration with credentials
3. Morgan          — HTTP request logging (combined format → Winston)
4. Body Parsers    — JSON (limit: varies) + URL-encoded
5. Cookie Parser   — Parse cookies (for refresh token)
6. Compression     — gzip response compression (threshold: 1KB)
7. Global Rate Limiter — Per-IP request throttling
8. Routes          — Domain-specific route handlers
9. Error Handler   — Global error middleware (MUST be last)
```

### Route Mounting (app.ts)

```typescript
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/organizer', organizerRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/promo-codes', promoCodeRoutes);
// ... 55+ route groups total
```

### Custom Error Classes

```typescript
class ValidationError extends Error {}     // 400
class AuthenticationError extends Error {} // 401
class AuthorizationError extends Error {}  // 403
class NotFoundError extends Error {}       // 404
class ConflictError extends Error {}       // 409
```

Services throw typed errors; the global error handler maps them to HTTP status codes automatically.

---

## 4. Frontend Architecture

### Directory Structure

```
client/
├── src/
│   ├── main.tsx               # React entry point
│   ├── App.tsx                # Root component, provider hierarchy
│   ├── pages/                 # Route components (250+ pages)
│   │   ├── auth/              # SignIn, SignUp, ForgotPassword, ResetPassword, MagicLinkVerify
│   │   ├── user/              # Attendee dashboard, tickets, transfers, resale
│   │   ├── organizer/         # Organizer dashboard, event management, analytics
│   │   ├── admin/             # Admin dashboard (events, users, finance, service-point)
│   │   └── ...                # Public pages (Home, EventDetails, Register, Payment)
│   ├── components/
│   │   ├── ui/                # shadcn/ui base components (Radix primitives)
│   │   ├── layout/            # Header, Sidebar, Footer
│   │   ├── event-wizard/      # 8-step event creation wizard components
│   │   ├── event-details/     # UnifiedRegistrationModal, event display
│   │   └── tickets/           # TicketPackageManager, seat maps
│   ├── hooks/                 # Custom hooks (useAuth, useEvents, useGoogleAuth, etc.)
│   ├── contexts/              # AuthContext, ThemeContext
│   ├── lib/                   # API clients (api.ts, auth-api.ts, event-api.ts, payment-api.ts, etc.)
│   ├── types/                 # TypeScript interfaces
│   └── assets/                # Images, fonts
├── vite.config.ts             # Vite config with API proxy
└── tailwind.config.js         # Tailwind with CSS variable tokens
```

### State Management Strategy

| State Type | Tool | Use Case |
|-----------|------|----------|
| **Server State** | TanStack Query | API data fetching, caching (5-min stale time), optimistic updates |
| **Auth State** | React Context + useReducer | User session, tokens, role-based routing |
| **Form State** | React Hook Form + Zod | Form validation, submission |
| **Local State** | useState/useReducer | Component-specific UI state |

### Component Patterns

- **Compound Components**: Dialog, Dropdown, Tabs (Radix UI primitives)
- **Custom Hooks**: Encapsulate business logic (useAuth, useEvents, useGoogleAuth)
- **Protected Routes**: `<ProtectedRoute allowedRoles={[...]}>`
- **Theme System**: CSS variables with `hsl(var(--token))` for dark mode support

### Dark Mode Convention

```tsx
// CORRECT — uses theme tokens
className="bg-card border-border/40"

// WRONG — hardcoded colors break dark mode
className="bg-white dark:bg-gray-800 border-border/50"
```

---

## 5. Mobile Application Architecture

### Hybrid Architecture

The mobile app uses **two architecture patterns** depending on the user role:

```
┌─────────────────────────────────────────────────────────────────┐
│                  ATTENDEE FEATURES                               │
│          Clean Architecture (Full Layers)                        │
│                                                                  │
│  Screen → Controller → UseCase → Repository → DataSource        │
│                                           ├── API (Remote)       │
│                                           └── Drift DB (Local)   │
├─────────────────────────────────────────────────────────────────┤
│             ADMIN / ORGANIZER FEATURES                           │
│          Direct API Pattern (Simplified)                         │
│                                                                  │
│  Screen → Controller → API Client → Server                      │
│  (No UseCases, no Repositories — faster to build)               │
└─────────────────────────────────────────────────────────────────┘
```

**Why hybrid?** Attendee features need offline support (scanning, cached tickets), so Clean Architecture with repositories + local data sources justifies the complexity. Admin/organizer features are always online, so the extra layers add overhead without benefit.

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Flutter 3.x | Cross-platform (iOS + Android) |
| **State Management** | GetX 4.6 | Reactive state, DI, routing |
| **HTTP Client** | Dio 5.4 | Interceptors, retry, timeout |
| **Local Database** | Drift 2.14 (SQLite) | Offline caching, type-safe queries |
| **Secure Storage** | FlutterSecureStorage 9.0 | AES-encrypted token storage |
| **Fast KV Storage** | GetStorage 2.1 | Preferences, theme, non-sensitive data |
| **Cryptography** | cryptography 2.7 | Ed25519 ticket signature verification |
| **QR Scanning** | mobile_scanner 4.0 | Camera-based QR code scanning |
| **QR Generation** | qr_flutter 4.1 | Render QR codes in-app |
| **Background Tasks** | workmanager 0.6 | Periodic offline sync (every 15 min) |
| **Push Notifications** | Firebase Messaging | FCM for Android, APNs for iOS |
| **Connectivity** | connectivity_plus 5.0 | Online/offline detection |
| **Location** | geolocator 14.0 + geocoding 4.0 | GPS + reverse geocoding |
| **Code Generation** | freezed + json_serializable + drift_dev | Immutable models, JSON, DB schemas |

### Project Structure

```
eventknit_mobile/lib/
├── api/                          # API layer (all HTTP calls)
│   ├── endpoints.dart            # Centralized URL management (21KB)
│   ├── auth_api.dart             # Login, register, OAuth
│   ├── events_api.dart           # Event discovery
│   ├── organizer_api.dart        # Organizer features (59KB — largest)
│   ├── admin_api.dart            # Admin operations (26KB)
│   ├── user_dashboard_api.dart   # Attendee dashboard (21KB)
│   ├── tickets_api.dart          # Ticket operations
│   ├── payments_api.dart         # Payment processing
│   ├── transfer_api.dart         # Ticket transfers
│   ├── verification_api.dart     # KYC verification
│   └── ...                       # 15+ API files
├── core/
│   ├── network/
│   │   ├── dio_client.dart       # Dio setup with interceptor chain
│   │   └── interceptors/        # 6 interceptors (auth, cookie, refresh, logging...)
│   ├── services/                # Cross-cutting services
│   │   ├── offline_ticket_service.dart    # Local ticket caching
│   │   ├── ticket_crypto_service.dart     # Ed25519 verification (8.6KB)
│   │   ├── storage_service.dart           # Secure + fast storage
│   │   ├── database_service.dart          # Drift initialization
│   │   ├── location_service.dart          # GPS + geocoding
│   │   ├── notification_service.dart      # Local notifications
│   │   └── push_notification_service.dart # FCM handling
│   └── constants/               # Design tokens (colors, typography, spacing)
├── controllers/                  # GetX controllers (state management)
│   ├── auth_controller.dart      # Auth state (12.7KB)
│   ├── events_controller.dart    # Event discovery (16.3KB)
│   ├── tickets_controller.dart   # Ticket management (9.2KB)
│   ├── theme_controller.dart     # Dark/light mode
│   └── ...
├── data/
│   ├── local/database/
│   │   ├── tables/              # Drift table definitions (7 tables)
│   │   └── daos/                # Data access objects
│   └── repositories/            # Repository implementations (offline + API)
├── domain/
│   ├── entities/                # Business entities
│   ├── repositories/            # Repository interfaces
│   ├── usecases/                # Use case classes
│   └── services/
│       └── offline_sync_service.dart  # Core sync engine (595 lines)
├── presentation/                 # Screens and widgets
│   ├── attendee/                # Attendee-facing screens
│   ├── auth/                    # Login/signup
│   └── shared/                  # Reusable widgets
└── workers/
    └── sync_worker.dart         # Background sync (WorkManager)
```

### Dio Interceptor Chain (order matters)

```
Request → CookieTokenInterceptor → AuthInterceptor → RefreshTokenInterceptor → LoggingInterceptor → Server
```

1. **CookieTokenInterceptor** — Extracts `refreshToken` from `Set-Cookie` on auth responses (browsers handle this automatically; Dio does not)
2. **AuthInterceptor** — Adds `Authorization: Bearer <accessToken>` to all requests
3. **RefreshTokenInterceptor** — On 401, queues all pending requests, refreshes token via cookie, retries all queued. On refresh failure → clears storage, navigates to login
4. **LoggingInterceptor** — Debug-mode request/response logging

### Token Storage

| Token | Storage | Encryption |
|-------|---------|------------|
| Access Token | `FlutterSecureStorage` | AES (Android Keystore / iOS Keychain) |
| Refresh Token | `FlutterSecureStorage` | AES (extracted from `Set-Cookie` by interceptor) |
| Public Key (Ed25519) | `FlutterSecureStorage` | Cached for offline ticket verification |
| Preferences | `GetStorage` | Plain (non-sensitive: theme, locale) |

### Drift Local Database (Offline Storage)

Type-safe SQLite database with 7 tables for offline operations:

```dart
// Table definitions in lib/data/local/database/tables/

@DataClassName('CachedTicket')
class TicketsTable extends Table {
  TextColumn get id => text()();
  TextColumn get eventId => text()();
  TextColumn get eventTitle => text()();
  TextColumn get qrCodeData => text().nullable()();
  TextColumn get status => text()();
  DateTimeColumn get eventDate => dateTime()();
  DateTimeColumn get cachedAt => dateTime()();
}

// 7 tables total:
// tickets_table       — Offline ticket cache with QR data
// offline_scans_table — Pending scans awaiting sync
// sync_logs_table     — Sync operation history
// cached_attendees    — Pre-downloaded attendee roster
// cached_zones        — Facility zones with capacity
// scan_history        — Complete scan log (online + offline)
// service_point_sessions — Walk-in OTP sessions
```

**Cache Management:**
- Automatic cleanup: entries older than 24 hours purged on app start
- Manual clear on logout (all tables truncated)
- DAOs provide typed queries: `EventsDao.getUpcoming()`, `TicketsDao.getByEvent(eventId)`

### Ed25519 Ticket Verification (Offline)

```dart
// ticket_crypto_service.dart (8.6KB)

class TicketCryptoService {
  // 1. Fetch public key from server on app init
  //    GET /api/v1/auth/public-key
  //    Cache in FlutterSecureStorage for offline use

  // 2. Verify ticket locally (no network required):
  Future<VerificationResult> verifyTicket(String qrData) {
    // Supports 3 formats:
    // a) Signed JWT: header.payload.signature → Ed25519 verify
    // b) Legacy HMAC: registrationId|eventId|email|ts|hmac
    // c) Backup code: 10-char alphanumeric → local DB lookup
  }

  // 3. Payload extracted on successful verification:
  // { registrationId, eventId, email, ticketType, issuedAt, expiresAt }
}
```

### Mobile Feature Philosophy

**Guiding principle:** Mobile = field operations (at the venue). Desktop = management & configuration.

**7 Core Mobile Features (from Eventbrite industry research):**
1. QR ticket scanner (600-900 check-ins/hour benchmark)
2. Live event dashboard (real-time stats)
3. Attendee lookup (search by name/email/ticket)
4. Push announcements to attendees
5. Walk-in ticket sales (on-site registration)
6. Sales monitor (real-time revenue)
7. Basic event info editing

**Features reserved for desktop only:**
- Complex event creation (multi-step wizard)
- Email marketing campaigns
- Advanced analytics & charts
- Promo code management
- Financial reports & disbursements
- Staff management & permissions
- Attendee segmentation & tagging

### Ticket Scanning Flow

```
┌────────────┐     ┌──────────────┐     ┌────────────────┐
│  QR Scan   │────▶│  Determine   │────▶│  Online?       │
│  (Camera)  │     │  Format      │     │                │
└────────────┘     └──────────────┘     └───────┬────────┘
                                                │
                                    ┌───────────┴──────────┐
                                    │                      │
                              ┌─────▼─────┐        ┌──────▼──────┐
                              │  ONLINE   │        │  OFFLINE    │
                              │           │        │             │
                              │ POST /api │        │ Ed25519     │
                              │ /check-in │        │ verify local│
                              │           │        │ + queue scan│
                              └─────┬─────┘        └──────┬──────┘
                                    │                      │
                              ┌─────▼─────┐        ┌──────▼──────┐
                              │ Server    │        │ Drift DB    │
                              │ validates │        │ stores scan │
                              │ 12 checks │        │ for sync    │
                              └─────┬─────┘        └──────┬──────┘
                                    │                      │
                              ┌─────▼──────────────────────▼──────┐
                              │  Haptic + Visual Feedback          │
                              │  ✅ Green flash + vibrate          │
                              │  ❌ Red flash + double vibrate     │
                              └───────────────────────────────────┘
```

**Server-Side Validation Chain (12 steps):**
1. Parse QR token format
2. Verify cryptographic signature (Ed25519 or HMAC)
3. Look up registration in database
4. Check registration status (CONFIRMED only)
5. Check event status (APPROVED only)
6. Check event date (not expired)
7. Check ticket type is active
8. Check if already checked in (prevent duplicate)
9. Check re-entry policy (if re-entering)
10. Check max re-entry count
11. Record scan with timestamp + device info
12. Broadcast via WebSocket to all connected devices

**Scan Modes:**
- `CHECK_IN` — Entry scanning (default)
- `CHECK_OUT` — Exit scanning (if event.requireCheckOut = true)
- `MANUAL_CHECK_IN` / `MANUAL_CHECK_OUT` — Override by staff

### Mobile Design System

**Philosophy: "Vibrant Minimalism"** — Bold colors + generous whitespace + glassmorphism + gradients.

**Color Tokens** (`lib/core/constants/`):
```dart
// Brand
static const primary = Color(0xFF1D9BF0);      // Twitter Blue
static const primaryDark = Color(0xFF1A8CD8);

// Gradients
static const primaryGradient = [Color(0xFF1D9BF0), Color(0xFF6C63FF)];
static const sunsetGradient = [Color(0xFFFF6B6B), Color(0xFFFFA07A)];
static const oceanGradient = [Color(0xFF00BCD4), Color(0xFF2196F3)];
static const forestGradient = [Color(0xFF4CAF50), Color(0xFF8BC34A)];

// Semantic
static const success = Color(0xFF4CAF50);
static const error = Color(0xFFF44336);
static const warning = Color(0xFFFFC107);
```

**Typography:** Inter font family, scale from `displayLarge` (48px) to `buttonMedium` (14px)

**Card Variants (6 types):**
1. Primary Elevated — shadow + gradient accent
2. Bordered — border + transparent background
3. Labeled Border — colored top label bar
4. Gradient — full gradient background
5. Glass — glassmorphism with blur
6. Accent Stat — metric display card

**Dark Mode:** OLED-ready true-black base (`Color(0xFF000000)`) with elevated surfaces at `0xFF121212`

### Widget Pattern

```dart
// Default: StatelessWidget + GetX Obx for reactivity
class EventDetailsScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final controller = Get.find<EventsController>();
    return Obx(() => controller.isLoading.value
      ? ShimmerLoader()
      : EventContent(event: controller.selectedEvent.value)
    );
  }
}

// TextEditingController/ScrollController → inside GetX controller (not widget)
class SearchController extends GetxController {
  final searchInput = TextEditingController();
  final scrollController = ScrollController();

  @override
  void onClose() {
    searchInput.dispose();
    scrollController.dispose();
    super.onClose();
  }
}
```

### Background Sync Worker

```dart
// workers/sync_worker.dart
// Uses WorkManager for periodic background sync

void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    // Runs every 15 minutes when:
    // - Device has network connectivity
    // - Battery is not critically low

    // 1. Sync pending offline scans → POST /offline/scans/batch
    // 2. Cleanup synced scans older than 7 days
    // 3. Update sync status timestamp

    // Runs in separate Dart isolate (doesn't block UI)
    // Exponential backoff on failure: 15min → 30min → 60min
    return Future.value(true);
  });
}
```

### Mobile Testing Strategy

**Test Types:**

| Type | Location | Purpose | Tools |
|------|----------|---------|-------|
| Unit Tests | `test/unit/` | Controllers, services, API parsing | `mocktail`, `get_test` |
| Widget Tests | `test/widget/` | UI rendering, interaction | `flutter_test` |
| Integration Tests | `integration_test/` | Full flows (login → scan → sync) | `patrol` / `integration_test` |

**Coverage Targets:**

| Layer | Target | Priority |
|-------|--------|----------|
| Controllers | 80% | Critical (auth, scanner, events) |
| Services | 90% | Critical (crypto, offline sync) |
| API Clients | 70% | High |
| Widgets | 60% | Medium |

**Common GetX Test Pattern:**
```dart
void main() {
  late MockAuthApi mockApi;
  late AuthController controller;

  setUp(() {
    mockApi = MockAuthApi();
    Get.put<AuthApi>(mockApi);
    controller = Get.put(AuthController());
  });

  tearDown(() => Get.reset());

  test('login success', () async {
    when(() => mockApi.login(any(), any()))
      .thenAnswer((_) async => AuthResponse(...));
    await controller.login('test@email.com', 'password');
    expect(controller.isLoggedIn.value, true);
  });
}
```

### Implementation Phases

| Phase | Features | Status |
|-------|----------|--------|
| Phase 1 | Auth, event discovery, ticket viewing | Complete |
| Phase 2 | QR scanning (online + offline), check-in/out | Complete |
| Phase 3 | Organizer dashboard, real-time stats, push notifications | In Progress |
| Phase 4 | Walk-in sales, attendee management, badge printing | Planned |
| Phase 5 | Admin features, analytics, advanced offline | Planned |

### Discovery Features Roadmap

| Feature | Source | Status |
|---------|--------|--------|
| Featured Events | Admin-curated (`/featured-events`) | Live |
| Upcoming Events | Next 14 days, paginated | Live |
| Trending Events | Weighted score (views + registrations + saves) | Phase 2 |
| Promoted/Sponsored Events | Paid boost, impression/click tracking, max slots | Phase 3 |

---

## 6. Database Design

### Overview

- **ORM**: Prisma 6.18+
- **Database**: PostgreSQL 14+
- **Schema**: 152 models, 27 enums
- **Location**: `server/prisma/schema.prisma`

### Core Models

```prisma
model User {
  id                  String      @id @default(uuid())
  email               String      @unique
  password            String?     // Optional for OAuth users
  firstName           String?
  lastName            String?
  phoneNumber         String?
  avatar              String?
  role                UserRole    @default(ATTENDEE)
  status              UserStatus  @default(ACTIVE)
  isEmailVerified     Boolean     @default(false)
  googleId            String?     @unique
  appleId             String?     @unique
  organizationName    String?
  onboardingCompleted Boolean?
  failedLoginAttempts Int         @default(0)
  isIdentityVerified  Boolean     @default(false)
  kycStatus           String?
  lastLoginAt         DateTime?
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt
}

model Event {
  id              String        @id @default(uuid())
  title           String
  description     String
  fullDescription String?       @db.Text
  startDate       DateTime
  endDate         DateTime?
  venue           String?
  location        String
  isOnline        Boolean       @default(false)
  onlineLink      String?
  isFree          Boolean       @default(false)
  price           Decimal?      @db.Decimal(10, 2)
  currency        String?       @default("KES")
  image           String?
  capacity        Int?
  status          EventStatus   @default(PENDING)
  organizerId     String
  allowReEntry    Boolean       @default(false)
  requireCheckOut Boolean       @default(false)
  maxReEntries    Int?

  // Managed Event fields (isManaged: true = platform-operated on behalf of a client)
  isManaged          Boolean            @default(false)
  clientName         String?
  clientType         ManagedClientType?
  clientContactEmail String?
  clientContactPhone String?
  clientContractRef  String?
  managedByAdminId   String?
  managedByAdmin     User?              @relation("AdminManagedEvents", fields: [managedByAdminId], references: [id], onDelete: SetNull)
}

model EventRegistration {
  id              String              @id @default(uuid())
  eventId         String
  attendeeId      String
  status          String              @default("PENDING")
  totalAmount     Decimal?
  paymentStatus   String?
  qrCodeDataUrl   String?
  backupCode      String              @unique
  checkedInAt     DateTime?
  isCurrentlyInside Boolean           @default(false)
  reEntryCount    Int                 @default(0)
  ticketEmailSentAt DateTime?
  @@unique([eventId, attendeeId])     // Prevent duplicate registrations
}
```

### Key Enums

```prisma
enum UserRole {
  SUPERADMIN        // Hierarchy: 10
  ADMIN_STAFF       // 8
  MARKETER          // 7
  SUPPORT           // 6
  TELLER            // 5
  ORGANIZER         // 4
  ORGANIZER_STAFF   // 3
  ORGANIZER_TELLER  // 2
  ATTENDEE          // 1
}

enum EventStatus { PENDING, APPROVED, REJECTED, CANCELLED, COMPLETED }
enum TicketStatus { ACTIVE, DEACTIVATED, EXPIRED, CANCELLED }
enum ScanType { CHECK_IN, CHECK_OUT, MANUAL_CHECK_IN, MANUAL_CHECK_OUT }

enum ManagedClientType {
  CORPORATE    // Private companies and businesses
  NGO          // Non-governmental / non-profit organizations
  GOVERNMENT   // Government bodies and agencies
  PLATFORM     // EventKnit's own events
  OTHER        // Any other client type
}
```

### Index Strategy

```prisma
@@index([email])
@@index([eventId, createdAt])
@@index([eventId, ticketStatus])
@@index([backupCode])
@@unique([eventId, attendeeId])    // Prevent duplicate registrations
@@unique([gatewayReference])       // Payment idempotency
@@unique([transactionId])          // Platform fee uniqueness
```

### Migration Commands

```bash
npx prisma generate              # Generate type-safe client
npx prisma migrate dev --name x  # Create + apply migration
npx prisma migrate deploy        # Apply in production
npx prisma studio                # Database GUI
npx prisma db push               # Push schema without migration
```

---

## 7. Authentication & Authorization

### Dual-Token JWT Strategy

| Token | Lifetime | Storage (Web) | Storage (Mobile) | Delivery |
|-------|----------|---------------|-----------------|----------|
| **Access** | 15 minutes | `localStorage` | `FlutterSecureStorage` (AES) | JSON response body |
| **Refresh** | 7–30 days | HTTP-only cookie (automatic) | `FlutterSecureStorage` (extracted from `Set-Cookie`) | `Set-Cookie` header |

**Why dual tokens?** Access tokens are short-lived (limits damage if stolen). Refresh tokens are long-lived but HTTP-only (JavaScript can't read them — XSS protection). Cookie `sameSite: 'strict'` prevents CSRF.

### Token Payload

```typescript
interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
```

### Authentication Flows

| # | Flow | Endpoint(s) | Notes |
|---|------|------------|-------|
| 1 | Email/Password Login | `POST /auth/login` | `rememberMe` extends refresh to 30 days |
| 2 | Registration (Code) | `POST /auth/register-code/request` → `/verify` | 6-digit code, 10-min expiry |
| 3 | Google OAuth | `POST /auth/google` | Supports `id_token` or `access_token` |
| 4 | Apple Sign-In | `POST /auth/apple` | iOS only; name sent only on first auth |
| 5 | Email OAuth (Passwordless) | `POST /auth/email-oauth/request` → `/verify` | Code-based |
| 6 | Magic Link | `POST /auth/magic-link/request` → `GET /verify` | 64-char token, 15-min expiry, single-use |
| 7 | Token Refresh | `POST /auth/refresh` | Reads cookie, rotates refresh token |
| 8 | Password Reset | `POST /auth/password/reset-request` → `/reset-confirm` | 1-hour expiry, revokes all tokens |

### Automatic Token Refresh (Request Queuing)

Both web and mobile implement a **request-queuing pattern** for concurrent 401 responses:

1. First 401 triggers `POST /auth/refresh`
2. Subsequent 401s during refresh are **queued** (not duplicated)
3. On success: all queued requests retried with the new access token
4. On failure: user is logged out

**Web**: Implemented in `client/src/lib/api.ts` with a `refreshQueue` promise array.
**Mobile**: `RefreshTokenInterceptor` using Dio's `QueuedInterceptor`.

### Auth Middleware

```typescript
authenticate        // Verify Bearer token, attach req.user, reject if invalid
authorize(...roles)  // Check req.user.role is in allowed set
optionalAuth        // Like authenticate but continues silently if no token
requireMinRole(role) // Check req.user.role meets minimum hierarchy level
```

### Security Features

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | bcrypt, 12 salt rounds |
| **Breach Detection** | HaveIBeenPwned API with k-anonymity (only SHA-1 prefix sent) |
| **Password Requirements** | 8+ chars, at least one letter, one number |
| **Rate Limiting (Auth)** | 100 req/15min per IP (all auth), 5 attempts/min (login/register) |
| **Failed Login Tracking** | 10 failures → automatic account suspension |
| **Token Revocation** | On password change, reset, suspension, or admin action |
| **Cookie Security** | `httpOnly`, `secure` (production), `sameSite: 'strict'` |
| **Error Sanitization** | Mobile: generic "Invalid email or password" (never reveals which is wrong) |

### Role Hierarchy

```
SUPERADMIN (10) → ADMIN_STAFF (8) → MARKETER (7) → SUPPORT (6) → TELLER (5)
→ ORGANIZER (4) → ORGANIZER_STAFF (3) → ORGANIZER_TELLER (2) → ATTENDEE (1)
```

`requireMinRole(UserRole.ADMIN_STAFF)` allows ADMIN_STAFF, SUPERADMIN but blocks MARKETER and below.

---

## 8. API Design

### RESTful Conventions

```
GET    /api/v1/events              # List events
GET    /api/v1/events/:id          # Get single event
POST   /api/v1/events              # Create event
PUT    /api/v1/events/:id          # Update event
DELETE /api/v1/events/:id          # Delete event
GET    /api/v1/events/:id/registrations  # Nested resource
```

### Standard Response Format

```json
// Success
{
  "success": true,
  "data": { ... },
  "metadata": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { "field": "email", "message": "Invalid email format" }
  }
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid auth |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 429 | Too Many Requests | Rate limited |
| 500 | Internal Server Error | Unhandled error |

### Request Validation (Joi)

```typescript
const eventSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(5000).required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')),
  location: Joi.string().required(),
});

router.post('/events',
  authenticate,
  authorize('ORGANIZER'),
  validate(eventSchema),
  EventController.create
);
```

### Pagination

```typescript
// Query: GET /api/v1/events?page=2&limit=20&category=music&sortBy=startDate&order=asc
const page = parseInt(req.query.page) || 1;
const limit = Math.min(parseInt(req.query.limit) || 20, 100);  // Cap at 100
const skip = (page - 1) * limit;
```

### API Versioning

All routes prefixed with `/api/v1`. Future versions use `/api/v2` for breaking changes while maintaining backward compatibility.

---

## 9. Real-Time Communication

### WebSocket Architecture (Socket.IO)

```typescript
const io = new Server(httpServer, {
  cors: { origin: config.cors.allowedOrigins, credentials: true },
});

// JWT authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const decoded = verifyAccessToken(token);
  socket.data.userId = decoded.userId;
  next();
});

// Room-based event isolation
socket.on('join-event', (eventId) => socket.join(`event:${eventId}`));
socket.on('leave-event', (eventId) => socket.leave(`event:${eventId}`));
```

### Real-Time Events

| Event | Payload | Use Case |
|-------|---------|----------|
| `scan:complete` | `{ registrationId, scanType, timestamp, checkpoint }` | Live check-in feed |
| `stats:update` | `{ checkedInCount, currentlyInside, reEntryCount }` | Dashboard counters |
| `registration:new` | `{ eventId, attendeeName, ticketType }` | Organizer notifications |
| `payment:received` | `{ eventId, amount, currency }` | Revenue tracking |

### Drift Prevention

Socket.IO handles reconnection automatically with exponential backoff. The server maintains room membership through the connection lifecycle — if a client disconnects and reconnects, it re-joins rooms via the `join-event` handler. Statistics are re-fetched on reconnect to prevent stale data (drift).

---

## 10. State Management

### Backend: Redis Caching

```typescript
const cacheService = {
  async cacheEvent(eventId: string, data: any, ttl = 3600) {
    await redis.setex(`event:${eventId}`, ttl, JSON.stringify(data));
  },
  async getCachedEvent(eventId: string) {
    const cached = await redis.get(`event:${eventId}`);
    return cached ? JSON.parse(cached) : null;
  },
  async invalidateEvent(eventId: string) {
    await redis.del(`event:${eventId}`);
  },
};
```

**Cache TTLs:**
- Event data: 1 hour
- System settings (fee config): 5 minutes
- Admin security settings: 5 minutes

### Frontend: TanStack Query

```typescript
// Query with caching
const { data, isLoading } = useQuery({
  queryKey: ['event', eventId],
  queryFn: () => api.events.getById(eventId),
  staleTime: 5 * 60 * 1000,  // 5 minutes
});

// Mutation with optimistic update
const mutation = useMutation({
  mutationFn: api.events.update,
  onMutate: async (updates) => {
    await queryClient.cancelQueries(['event', updates.id]);
    const previous = queryClient.getQueryData(['event', updates.id]);
    queryClient.setQueryData(['event', updates.id], updates);
    return { previous };
  },
  onError: (err, updates, context) => {
    queryClient.setQueryData(['event', updates.id], context.previous);  // Rollback
  },
});
```

### Mobile: GetX Reactive State

```dart
class EventsController extends GetxController {
  final events = <Event>[].obs;       // Reactive list
  final isLoading = false.obs;        // Reactive boolean

  List<Event> get upcomingEvents =>   // Computed property
      events.where((e) => e.startDate.isAfter(DateTime.now())).toList();

  Future<void> fetchEvents() async {
    isLoading.value = true;
    events.value = await eventsRepository.getEvents();
    isLoading.value = false;
  }
}

// View — automatically rebuilds on state change
Obx(() => controller.isLoading.value
  ? CircularProgressIndicator()
  : ListView.builder(itemCount: controller.events.length, ...)
);
```

---

## 11. Design Patterns

### 1. Factory Pattern — Payment Gateways

```typescript
class PaymentGatewayFactory {
  static create(provider: 'stripe' | 'paystack' | 'mpesa') {
    switch (provider) {
      case 'stripe': return new StripeGateway();
      case 'paystack': return new PaystackGateway();
      case 'mpesa': return new MpesaGateway();
    }
  }
}
```

### 2. Strategy Pattern — Email Providers

```typescript
interface IEmailStrategy {
  send(to: string, subject: string, body: string): Promise<void>;
}
class NodemailerStrategy implements IEmailStrategy { ... }
class SendGridStrategy implements IEmailStrategy { ... }
```

### 3. Observer Pattern — Event Bus

```typescript
eventBus.onRegistrationCreated(async (registration) => {
  await emailService.sendConfirmation(registration);
  await qrService.generate(registration);
  await analyticsService.trackRegistration(registration);
});
```

### 4. Singleton Pattern — Database Connection

```typescript
// Prisma client is instantiated once in config/database.ts
const prisma = new PrismaClient();
export default prisma;
```

### 5. Repository Pattern (via Prisma)

Prisma acts as the repository layer — type-safe queries abstract the database. Services never write raw SQL.

### 6. Middleware Chain Pattern

```typescript
router.post('/events',
  authenticate,              // Auth
  authorize('ORGANIZER'),    // Role
  validate(eventSchema),     // Validation
  checkEventLimits,          // Business rule
  EventController.create     // Handler
);
```

---

## 12. Data Flow

### Request-Response Flow

```
Client → NGINX (SSL, routing) → Express Middleware (helmet, cors, body parser, morgan)
  → Route Middleware (authenticate, authorize, validate, rateLimit)
  → Controller (parse request, call service, format response)
  → Service (business logic, validation, transactions)
  → Prisma ORM → PostgreSQL / Redis
  → Response (JSON)
```

### Event Registration Flow

```
1. User browses events → GET /api/v1/events
2. Selects event + tickets → Frontend validation
3. POST /api/v1/events/:id/register (or /register-guest)
4. Backend validates: auth, ticket availability, event status
5. If paid: initialize payment → redirect to gateway → webhook confirms
6. Create registration record
7. Generate QR code (Ed25519 signed or HMAC-signed)
8. Generate 10-char backup code
9. Reserve seats (if seat map event)
10. Send confirmation email (QR + ICS calendar + backup code)
11. Emit WebSocket event (if organizer watching)
12. Return success → Frontend redirects to ticket view
```

---

## 13. File Storage

### Multi-Provider Strategy

| Provider | Use Case | Features |
|----------|----------|----------|
| **Cloudinary** | Event images, avatars, logos | CDN, auto-transformation, responsive formats |
| **MinIO** | Documents, KYC files, PDFs | S3-compatible, presigned URLs, self-hosted option |

### Upload Middleware

```typescript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});
```

### Cloudinary Transformations

```typescript
const result = await cloudinary.uploader.upload(file.path, {
  folder: 'eventknit/events',
  transformation: [
    { width: 1200, height: 630, crop: 'fill' },
    { quality: 'auto' },
    { fetch_format: 'auto' },
  ],
});
```

---

## 14. Background Jobs & Queues

### BullMQ Architecture

```typescript
import { Queue, Worker } from 'bullmq';

const emailQueue = new Queue('email', { connection: redis });

// Add job with retry
await emailQueue.add('send-email', data, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
});

// Worker
const emailWorker = new Worker('email', async (job) => {
  await emailService.send(job.data.to, job.data.subject, job.data.body);
}, { connection: redis });
```

### Job Types (12 Total)

| Job | Schedule | Purpose | Retry |
|-----|----------|---------|-------|
| Email sending | On demand | Registration confirmations, password resets | 5x exponential (1s→30s cap) |
| Ticket email | On demand | QR code + calendar invite delivery | 5x exponential |
| Auto-payout | Every hour (`0 * * * *`) | Create disbursements post-grace-period | Per-event isolation |
| Payment timeout | Every 5 min | Cancel stale pending payments | N/A |
| Event reminder | Cron | Pre-event reminders to attendees | 3x |
| Notification | On demand | Push/SMS/in-app notifications | 3x |
| Analytics aggregation | Daily | Compute daily stats | 1x |
| Token cleanup | Daily | Delete expired refresh tokens | 1x |
| Cart cleanup | Every 8 min | Expire abandoned cart reservations | N/A |
| Badge PDF generation | On demand | Async badge/ticket PDF creation | 3x |
| KYC document processing | On demand | Process uploaded KYC documents | 2x |
| Webhook retry | On demand | Retry failed outbound webhooks | 5x exponential |

### Ticket PDF Queue (Async Ticket Delivery)

EventKnit uses a dedicated **async queue with BullMQ + Redis** for ticket PDF generation and delivery. This decouples the heavy PDF/email work from the checkout critical path, meaning a spike of 10,000 simultaneous registrations won't crash the server — they all get instant Email 1, then the queue processes tickets at a controlled rate (5 concurrent workers).

#### Architecture

```
Registration checkout
       │
       ├── Instant: Email 1 (booking confirmation) ─── sent synchronously in < 1s
       │
       └── Queue: TicketPdfQueueService.addJob()
                       │
                  BullMQ (Redis-backed)
                       │
              Worker (5 concurrent)
                       │
              ┌────────┴───────────┐
              │                    │
        PDF generated         Uploaded to
        (Puppeteer)           Cloudinary
                                   │
                             Email 2 sent
                         (PDF attachment + QR code)
```

#### Key Properties

| Property | Value |
|----------|-------|
| Queue backend | Redis (BullMQ) |
| Workers | 5 concurrent |
| Retry strategy | Exponential backoff — 3 attempts, 2 s initial delay (doubles each retry) |
| Job persistence | Jobs survive server restarts (stored in Redis) |
| Graceful shutdown | Queue drains before process exits. Tickets in-flight won't be lost. |
| Idempotency | `ticketEmailSentAt` guard — re-processing a job never sends duplicate emails |
| Monitoring | Bull Board dashboard at `/admin/queues` (superadmin only) |

#### Dead Letter Queue (DLQ) Alerting

When a job exhausts all retries, the worker emits a structured critical log entry tagged `[DLQ]`:

```json
{
  "level": "error",
  "message": "[DLQ] PDF job permanently failed after all retries",
  "jobId": "pdf-reg-abc123-1741000000",
  "registrationId": "abc123",
  "attendeeEmail": "user@example.com",
  "attemptsMade": 3,
  "maxAttempts": 3,
  "error": "connect ECONNREFUSED"
}
```

This alert is the signal for the ops team to investigate (e.g. SMTP outage, Redis issue) and manually trigger re-delivery via the `/admin/queues` dashboard or the `retryFailed()` API method.

#### Bull Board Dashboard

Queue health is visible at `/admin/queues` — shows waiting, active, completed, and failed job counts in real-time. Access is restricted to SUPERADMIN role via JWT authentication.

### Error Isolation

Each job processes independently within try/catch. One failure doesn't block the queue. Failed jobs are logged with full context and retried according to backoff configuration.

---

## 15. Logging & Monitoring

### Winston Logger Configuration

```typescript
const logger = winston.createLogger({
  level: config.logging.level || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      level: 'error',
      maxFiles: '30d',
    }),
  ],
});
```

### Log Levels

| Level | Usage |
|-------|-------|
| `error` | Critical failures, unhandled exceptions |
| `warn` | Security events, deprecated usage, expected skip conditions |
| `info` | User actions, payment events, registration events |
| `http` | HTTP request/response via Morgan |
| `debug` | Auto-payout skip reasons, cache operations |

### Structured Logging

```typescript
logger.info('Payment completed', {
  userId: user.id,
  eventId: event.id,
  amount: 5000,
  currency: 'KES',
  gateway: 'paystack',
  transactionNumber: 'EPT-2026-000042',
});
```

### HTTP Request Logging (Morgan → Winston)

```typescript
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));
```

---

## 16. Testing Strategy

### Test Architecture

| Type | Location | Count | Speed |
|------|----------|-------|-------|
| Service unit tests | `tests/unit/services/` | 23 files | Fast (ms) |
| Controller unit tests | `tests/unit/controllers/` | 2 files | Fast |
| Job tests | `tests/unit/jobs/` | 8 files | Fast |
| Integration tests | `tests/*.test.ts` | 78 files | Slower |

### Running Tests

```bash
npm test                                              # All tests
npx jest tests/unit/services/ --no-coverage           # Service tests only
npx jest tests/white-label.service.test.ts -t "should create" --no-coverage  # Single test
npm run test:coverage                                 # With coverage
npm run test:watch                                    # Watch mode
```

### Jest Configuration

- **ESM support**: `ts-jest` with ESM preset, `.js` extension mapping
- **Sequential**: `maxWorkers: 1` (prevents database race conditions)
- **Timeout**: 120 seconds per test
- **Force exit**: Prevents hanging from open handles

### Mocking Patterns

**Prisma (jest-mock-extended):**
```typescript
jest.mock('../../../src/config/database.js', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));
```

**Services (for controller tests):**
```typescript
jest.mock('../../../src/services/white-label.service.js', () => ({
  WhiteLabelService: { getAllBrandings: jest.fn(), ... },
}));
```

### Architecture Rules

1. **Business logic in Services, not Controllers** — Controllers are thin wrappers
2. **Authorization in middleware, not Controllers** — `requireMinRole()` on routes
3. **Services throw typed errors** — `ValidationError`, `NotFoundError`, `AuthorizationError`
4. **AAA pattern** — Arrange → Act → Assert in every test
5. **Test behavior, not implementation** — Assert outcomes, not internal method calls
6. **ESM import paths** — Always use `.js` extensions in mock paths

### Common Pitfalls

- **Forgetting `jest.clearAllMocks()`** in `beforeEach` → state leaks between tests
- **Hardcoding dates** → use `expect.any(Date)` in object matchers
- **Testing implementation details** → verify outcomes, not Prisma call counts
- **Missing `.js` extension** in mock paths → mock silently fails

---

## 17. Development Workflow

### Git Workflow (Feature Branch)

```
main (production)
├── develop (staging)
│   ├── feature/user-auth
│   ├── bugfix/payment-issue
│   ├── hotfix/critical-bug
│   └── refactor/checkout-flow
```

### Commit Convention

```
type(scope): subject

feat(auth): implement Google OAuth
fix(payments): resolve webhook duplicate processing
docs(api): update endpoint reference
refactor(events): extract validation logic
test(auth): add registration flow tests
chore(deps): upgrade Prisma to 6.18
```

### Pre-Commit Hooks (Husky)

```bash
npm run lint        # ESLint
npm run type-check  # TypeScript compiler
npm run test:run    # Quick test suite
```

### Local Development Setup

```bash
# Install dependencies
cd server && npm install && cd ../client && npm install

# Environment variables
cp server/.env.example server/.env  # Edit with credentials

# Database
cd server
npx prisma generate
npx prisma migrate dev

# Start (2 terminals)
cd server && npm run dev    # Backend on port 3010
cd client && npm run dev    # Frontend on port 5173 (proxies to 3010)
```

---

## 18. Deployment & Infrastructure

### Docker

**Backend Dockerfile (multi-stage):**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npx prisma generate

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
EXPOSE 3010
CMD ["npm", "start"]
```

**Docker Compose:**
```yaml
services:
  postgres:
    image: postgres:14
    environment: { POSTGRES_USER: eventknit, POSTGRES_PASSWORD: password, POSTGRES_DB: eventknit }
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6380:6379"]

  backend:
    build: ./server
    environment:
      DATABASE_URL: postgresql://eventknit:password@postgres:5432/eventknit
      REDIS_URL: redis://redis:6379
    depends_on: [postgres, redis]
    ports: ["3010:3010"]

  frontend:
    build: ./client
    ports: ["5173:5173"]
    depends_on: [backend]
```

### Production Architecture

```
Internet → CloudFlare (DDoS, WAF) → NGINX (SSL termination, reverse proxy)
  → Node.js API (port 3010) → PostgreSQL + Redis (not publicly exposed)
```

### Rollback Strategy

```bash
# Application rollback
git revert <commit-hash>
npm run build
# Deploy previous version

# Database rollback (if migration needed)
npx prisma migrate resolve --rolled-back <migration-name>
```

### SSH Access

```bash
ssh user@server -i ~/.ssh/eventknit_key
# Logs
tail -f /app/logs/application-*.log
tail -f /app/logs/error-*.log
# Process management
pm2 status        # Check processes
pm2 restart all   # Restart
pm2 logs          # Stream logs
```

---

## 19. Performance Optimization

### Database

1. **Indexes** on frequently queried fields (see Section 6)
2. **Select fields** — Only fetch needed columns: `prisma.event.findMany({ select: { id: true, title: true } })`
3. **Cursor-based pagination** for large datasets
4. **Connection pooling** — Prisma handles automatically

### API

1. **Response compression** — gzip (threshold: 1KB, level: 6)
2. **Pagination cap** — `Math.min(limit, 100)` prevents unbounded queries
3. **Redis caching** — Event data (1h), system settings (5m)
4. **HTTP cache headers** — `Cache-Control: public, max-age=300` for public endpoints

### Frontend

1. **TanStack Query** — 5-min stale time, deduplication, background refetch
2. **Code splitting** — Vite automatic chunk splitting per route
3. **Image optimization** — Cloudinary auto-format (`f_auto`) and quality (`q_auto`)
4. **Lazy loading** — React.lazy for non-critical dashboard pages

---

## 20. Security Best Practices

### OWASP Top 10 Mitigations

| Threat | Mitigation |
|--------|-----------|
| **Injection** | Prisma parameterized queries (no raw SQL), Joi input validation |
| **Broken Auth** | bcrypt hashing, JWT dual-token, rate limiting, failed login tracking |
| **Sensitive Data** | HTTPS-only, httpOnly cookies, FlutterSecureStorage (AES) |
| **XXE** | JSON-only API (no XML parsing) |
| **Broken Access Control** | RBAC middleware, resource ownership checks in services |
| **Security Misconfiguration** | Helmet headers, CORS whitelist, no default credentials |
| **XSS** | React auto-escaping, CSP headers, httpOnly cookies |
| **Insecure Deserialization** | Joi schema validation on all inputs |
| **Known Vulnerabilities** | npm audit, Dependabot, regular dependency updates |
| **Insufficient Logging** | Winston structured logging, audit trail for all financial operations |

### Security Headers (Helmet)

```typescript
app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: true,
  noSniff: true,
  xssFilter: true,
}));
```

### Rate Limiting Tiers

| Scope | Limit | Window |
|-------|-------|--------|
| Global | Configurable | Per IP |
| Auth (all routes) | 100 requests | 15 minutes |
| Login/Register | 5 attempts | 1 minute |
| Magic link request | Rate-limited | Per user + per IP |
| Payment webhook | No limit | Signature-verified instead |

---

## 21. Payment & Disbursement System

### Money Flow

```
Attendee pays → Payment Gateway (Paystack/Stripe/M-Pesa) → Webhook confirms
  → Platform Fee calculated (7.5% all-in)
  → Platform keeps 7.5%, 92.5% held for organizer
  → Grace period (5 business days after event ends)
  → Auto-disbursement created → Admin processes bank transfer → Organizer paid
```

### Gateway Support

| Gateway | Region | Method | Amount Unit | Webhook Signature |
|---------|--------|--------|-------------|-------------------|
| **Paystack** | Africa | Redirect to hosted page | Kobo (×100) | HMAC-SHA512 |
| **Stripe** | Global | Checkout session redirect | Cents (×100) | HMAC-SHA256 + 5-min timestamp tolerance |
| **M-Pesa** | Kenya | STK push to phone | Main unit | Gateway-specific |

### Webhook Handling

**Endpoint:** `POST /api/v1/payments/webhook`

1. **Signature verification** — HMAC comparison (reject immediately if invalid)
2. **Idempotency check** — Record in `PaymentWebhookEvent` table by `gatewayEventId` (unique index)
3. **Re-verify with gateway** — Call `verifyPayment(reference)` to confirm amount
4. **Amount validation** — Tolerance of ±0.01 (1 cent/kobo for rounding)
5. **Create transaction record** — `EventPaymentTransaction`
6. **Update registration** — Status → `CONFIRMED`
7. **Calculate platform fee** — `PlatformFeeService.createPlatformFee()`
8. **Generate invoice** — Async, non-blocking
9. **Send ticket email** — With QR code and calendar invite
10. **Notify organizer** — Payment received notification

### Idempotency (Multi-Layer)

| Layer | Mechanism | Guard |
|-------|-----------|-------|
| Payment Init | `idempotencyKey` (unique index) | `{registrationId}-{amount}-{timestamp}` |
| Webhook | `PaymentWebhookEvent.gatewayEventId` (unique) | Prevents duplicate webhook processing |
| Platform Fee | `PlatformFee.transactionId` (unique) | One fee per transaction |
| Auto-Payout | Query-based dedup | Fees with `status='calculated'` AND `disbursementId=null` |
| Fee Linking | `prisma.$transaction` | Atomic create-and-link prevents double-counting |

### Race Condition Prevention

- **Database unique constraints** on `gatewayReference`, `transactionId`, `feeNumber`, `disbursementNumber`
- **Atomic transactions** (`prisma.$transaction`) for multi-table operations
- **Optimistic concurrency** — concurrent disbursement attempts: one finds `pendingFees.length === 0` and skips

### Platform Fee Model (7.5% All-In)

```
feeAmount       = grossAmount × (feePercentage / 100)
organizerAmount = grossAmount − feeAmount
```

**Why 7.5% all-in?** Cost-leadership in Kenya: undercuts Mookh (8%), TicketSasa (10%), Eventbrite (~8-12%). M-Pesa dominance (~70% of Kenya digital payments) keeps blended processing costs low enough for a percentage-only model. `fixedFeePerTicket` exists as a reserved lever (default: 0) for card-heavy markets.

### Auto-Payout System

**Schedule:** Every hour (`0 * * * *`)
**Grace period:** 5 business days after event ends (configurable via `PAYOUT_GRACE_PERIOD_BUSINESS_DAYS`)

**Eligibility criteria (ALL must be true):**
1. Event has ended (past grace period)
2. Event approved/completed
3. Event is paid (not free)
4. Organizer identity verified
5. Organizer KYC approved
6. Auto-payout opted in
7. Bank details configured
8. Pending fees exist
9. Above threshold (if set)

**Kill switch:** `AUTO_PAYOUT_ENABLED=false` disables globally.

### Refund Policies

| Policy | Behavior |
|--------|----------|
| `no_refunds` | No refunds allowed |
| `full_refund` | 100% up to configurable deadline |
| `partial_refund` | Fixed percentage (default 50%) |
| `tiered` | Multiple tiers by days before event |
| `custom` | Text-based, manually adjudicated |

---

## 22. Checkout & Registration System

### Registration Paths

**Path A: Authenticated User**
1. `POST /api/v1/events/:id/register` → Creates registration with QR
2. Free → confirmation page; Paid → payment page

**Path B: Guest Checkout (Invitation-Based Account Creation)**
1. `POST /api/v1/events/:id/register-guest`
2. Backend creates a **passwordless user record** for the email — no session is issued
3. An `accountInvitationToken` (32-byte hex, hashed in DB, 7-day expiry) is generated and embedded in Email 1
4. Response returns only `{ registration, user }` — no `accessToken` or `refreshToken`
5. Attendee lands on the confirmation page as a guest (unauthenticated)
6. To activate their account, attendee clicks the link in their email → `GET /auth/create-account?token=...`
7. `POST /api/v1/auth/create-account` verifies token, sets password, activates account, and issues a session
8. Account creation is entirely optional — the registration and ticket are valid regardless

### Cart & Inventory Locking

| Feature | Detail |
|---------|--------|
| Timeout | 8 minutes per cart reservation |
| Storage | Session-based (guests), userId-based (authenticated) |
| Statuses | `ACTIVE` → `RESERVED` → `ABANDONED`/`EXPIRED` |
| Cleanup | Background job every 8 minutes |

### Payment Reference Format

`EVT-{registrationId}-{timestamp}` — unique per payment attempt.

### Post-Payment Email (Two-Email Model)

EventKnit separates booking confirmation from ticket delivery using an async queue with BullMQ + Redis. This is the same model used by Ticketmaster, Eventbrite, and AXS.

**Email 1 — Booking Confirmed (immediate, < 1 s)**
- Sent synchronously inside the registration handler before returning the HTTP response
- Contains: event summary, attendee name, order details, account setup link (for guests)
- Subject: `Registration Confirmed: {Event Title} - EventKnit`
- Never blocked by PDF generation

**Email 2 — Your Ticket (async, usually < 10 s)**
- Triggered by `TicketPdfQueueService.addJob()` immediately after Email 1
- Background worker generates ticket PDF (Puppeteer → Cloudinary upload), then sends email
- Contains: PDF attachment, QR code (300×300 px, error correction M), backup code, ICS calendar invite, Google/Outlook calendar links
- Subject: `Your Ticket for {Event Title} - EventKnit`
- Retry with exponential backoff — 3 attempts, backoff on failure
- Idempotency: guarded by `ticketEmailSentAt` — re-processing a BullMQ job never sends a duplicate email
- Fails gracefully: queue not available → falls back to synchronous PDF generation

**Why not one email?**
Waiting for PDF generation before sending any email increases p99 latency by seconds, worsens failure rates, and blocks the server during high-traffic bursts. Splitting the flow returns instant trust to the user while heavy work continues in the background.

### Ticket Transfer & Resale

- **Transfer:** Attendee sends to recipient email → PENDING → ACCEPTED/REJECTED/EXPIRED
- **Resale:** Marketplace listing with custom price and expiration → direct purchase

---

## 23. White Label & Branding System

### Lifecycle

```
Organizer submits branding → PENDING_APPROVAL (isActive: false)
  → Admin reviews → ACTIVE (isActive: true) or INACTIVE (rejectionReason set)
  → Active branding applied to: event pages, emails, ticket PDFs, custom domains
```

Admin-created branding is **auto-approved** (skips the queue).

### Branding Fields

**Identity:** brandName, tagline, logoUrl, logoLightUrl, logoDarkUrl, faviconUrl, coverImageUrl
**Colors:** primaryColor, secondaryColor, accentColor, backgroundColor, textColor, linkColor (hex only: `#FF5733`)
**Typography:** fontFamily, headingFont
**Email:** emailHeaderImage, emailFooterText, emailSignature (HTML)
**Contact:** supportEmail, supportPhone, websiteUrl, socialLinks (JSON)

### Custom Domain Verification

1. Organizer adds domain → system generates `verificationCode` (UUID)
2. Organizer adds DNS TXT record: `_eventknit-verify.{domain} → {verificationCode}`
3. Organizer adds CNAME: `{domain} → proxy.eventknit.com`
4. Admin triggers verification → `VERIFIED` or `FAILED`

### Branded Email Rendering

`WhiteLabelService.renderBrandedEmail()` wraps standard email HTML with organizer's logo, colors, font, footer, and signature. Falls back to default EventKnit branding if no active branding exists.

---

## 24. Promo Code Engine

### Scope Hierarchy

| Scope | Applies To | Created By |
|-------|-----------|------------|
| `PLATFORM` | Any event | Admin only |
| `ORGANIZER` | All events by an organizer | Organizer |
| `EVENT` | Single event | Organizer/Admin |
| `MULTI_EVENT` | Selected events | Organizer/Admin |

### Discount Types

- **PERCENTAGE**: `discountAmount = totalAmount × (discountValue / 100)`
- **FIXED_AMOUNT**: `discountAmount = discountValue`
- **Cap**: `min(discountAmount, maxDiscount, totalAmount)`

### Tiered Discounts

Dynamic pricing based on usage count:
```json
{
  "isTiered": true,
  "discountTiers": [
    { "minUsage": 0, "maxUsage": 50, "discountValue": 30, "discountType": "PERCENTAGE" },
    { "minUsage": 51, "maxUsage": 150, "discountValue": 20, "discountType": "PERCENTAGE" },
    { "minUsage": 151, "maxUsage": null, "discountValue": 10, "discountType": "PERCENTAGE" }
  ]
}
```

### Validation Pipeline (10 checks)

1. Code exists → 2. Code is active → 3. Within date range → 4. Scope matches event → 5. Ticket type allowed → 6. Min order amount met → 7. Usage limit not reached → 8. User usage limit not reached → 9. First-time user check → 10. Calculate discount

### Auto-Apply via URL

```
https://eventknit.com/events/{eventId}?promo=SUMMER20
```

Code is auto-validated and applied when the user reaches registration.

### Bulk Generation

Generate 1–1000 unique codes with a shared prefix (e.g., `SUMMER-XXXXXX`), all sharing the same discount settings.

---

## 25. Seat Allocation System

### Seating Models

| Model | Use Case | How It Works |
|-------|----------|-------------|
| `CUSTOMER_SELECTS` | Concerts, sports | Attendee picks seat on checkout |
| `ORGANIZER_ASSIGNS` | Theater, premium events | Organizer assigns post-purchase |
| `HYBRID` | Mixed events | Floor = customer-select, VIP = organizer-assigned |

### Features

- Multi-seat allocations per registration (group bookings)
- Ticket type restrictions (VIP sections, tier-based)
- Dynamic section-based pricing
- Race condition protection via database-level row locking
- Named seat assignments for premium events
- Seat handling in transfer/resale workflows

### Race Condition Protection

Seat reservation uses `SELECT ... FOR UPDATE` pattern within `prisma.$transaction` to prevent double-booking. If two users try to reserve the same seat simultaneously, one gets a conflict error.

---

## 26. Event Creation System

### 8-Step Wizard

| Step | Component | Fields |
|------|-----------|--------|
| 1 | BasicInfoStep | Title, organizer, description, category |
| 2 | DateLocationStep | Start/end dates, timezone, venue, online settings |
| 3 | MediaStep | Cover image with focal point selection |
| 4 | TicketsStep | Ticket types, pricing, purchase limits |
| 5 | AgendaBuilderStep | Sessions, speakers, exhibitors, sponsors |
| 6 | RegistrationStep | Custom registration form fields |
| 7 | SocialLinksStep | Social media links, website |
| 8 | ReviewStep | Summary, final validation, submit |

### State Management

Individual `useState` hooks (not React Hook Form) for granular re-renders and simple draft persistence.

### Draft Auto-Save

Drafts saved to `localStorage` every 30 seconds. Restored on mount. Includes all form data, ticket types, speakers, agenda, sponsors, social links, and current step.

### Data Transform

`EventFormData` (form-friendly) → `transformFormDataToAPI()` → `CreateEventData` (API payload) — handles date combining, price parsing, optional field stripping.

---

## 27. Admin Panel Security

### Defense-in-Depth Layers

```
1. Origin Check → Must be in allowed origins list
2. IP Check → Must be in allowed IPs list (if enabled)
3. Subdomain Check → Must match required subdomain (if enabled)
4. Authentication → Valid JWT token
5. Authorization → ADMIN_STAFF role or higher
```

### Features

- **Domain whitelisting**: Exact match, wildcard subdomains (`*.eventknit.com`)
- **IP whitelisting**: Single IP, CIDR notation (`192.168.1.0/24`), wildcard patterns (`192.168.*`)
- **Dynamic updates**: API-managed, no restart required (5-minute cache refresh)
- **Dev mode**: Auto-allow localhost, disable IP checks

### Emergency Access Recovery

```bash
ssh user@server
export ADMIN_ENABLE_IP_WHITELIST=false
pm2 restart all
# Fix whitelist via API, then re-enable
```

---

## 28. QR Code & Ticket Security

### QR Code Generation

Two modes depending on `USE_SIGNED_TICKETS` environment variable:

**Mode 1: Ed25519 Signed JWT (Recommended)**
```typescript
// Offline-verifiable cryptographic tickets
const qrPayload = {
  registrationId,
  eventId,
  email,
  timestamp: Date.now(),
};
// Signed with Ed25519 private key → verifiable with public key
// Public key available at GET /api/v1/auth/public-key
```

**Mode 2: HMAC-Signed String (Legacy)**
```
registrationId|eventId|email|timestamp|HMAC-SHA256-signature
```

### QR Code Parameters

- **Size**: 300×300px
- **Error Correction**: Level M (15% damage tolerance)
- **Format**: Base64-encoded PNG (`qrCodeDataUrl`)

### Backup Code

10-character alphanumeric code generated with `crypto.randomBytes`. Unique index in database. Displayed monospaced on ticket with "Use if QR code doesn't work".

### Ed25519 Key Configuration

The Ed25519 keypair is configured via environment variables. The private key signs tickets at purchase time; the public key verifies them at scan time (and is served at `GET /api/v1/auth/public-key` for the mobile scanner app to cache).

**Development (auto-generated):**

When `NODE_ENV !== 'production'` and no keys are set in env, the server auto-generates a keypair at startup and logs a warning. Tickets issued during development are only verifiable in that process's lifetime.

**Production (required):**

Generate a raw 32-byte Ed25519 keypair and set in `.env`:

```bash
# Generate production keypair (Node.js):
node -e "
  const { generateKeyPairSync } = require('crypto');
  const { privateKey, publicKey } = generateKeyPairSync('ed25519', {
    privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    publicKeyEncoding: { type: 'spki', format: 'der' }
  });
  // Use the raw 32-byte seed for private key, raw 32-byte for public key
  console.log('Check crypto docs for raw Ed25519 hex extraction');
"

# Or using OpenSSL:
openssl genpkey -algorithm ed25519 -out private.pem
openssl pkey -in private.pem -pubout -out public.pem
```

```bash
# .env.development / .env (set explicitly in production)
TICKET_PRIVATE_KEY=<64-char hex string — raw 32-byte private seed>
TICKET_PUBLIC_KEY=<64-char hex string — raw 32-byte public key>
```

**Why Ed25519 over HMAC?**

| | HMAC | Ed25519 |
|--|------|---------|
| Verification requires | Secret key on verifier | Public key only |
| Offline scanning | ❌ Cannot verify without server | ✅ Full offline verification |
| Key exposure risk | Both sign + verify use same secret | Private key never leaves server |
| Algorithm | HMAC-SHA256 | Elliptic curve (compact, fast) |

### Offline Verification

Ed25519 mode enables **offline ticket scanning** — the scanner app downloads the public key once, then verifies ticket signatures locally without network access. Critical for venues with poor connectivity.

---

## 29. Case Study: High-Concurrency Ticketing

*Based on the Mookh/CHAN 2024/2025 incident — 27,000 tickets, 100K+ concurrent users*

### What Went Wrong

- Synchronous processing during checkout
- Real-time database writes under extreme load
- Inventory locking bottlenecks (thundering herd problem)
- No virtual waiting room
- No rate limiting or bot detection
- "Sold out" within minutes due to system crashes, not actual sales

### EventKnit's Mitigations

| Component | EventKnit Implementation |
|-----------|------------------------|
| **Virtual Queue** | Cart reservation system with 8-min timeout controls concurrent checkout |
| **Rate Limiting** | Per-IP and per-route limits via express-rate-limit |
| **Bot Detection** | reCAPTCHA integration planned; rate limiting active |
| **Inventory Control** | Atomic Redis counters + database unique constraints |
| **Async Processing** | BullMQ background jobs for emails, PDFs, notifications |
| **Idempotency** | Multi-layer deduplication (webhooks, payments, fees) |
| **Monitoring** | Winston structured logging, real-time WebSocket stats |

### Recommended Capacity Design

- Cap active checkouts at 5K–10K concurrent
- Use read replicas for event browsing
- Release tickets in waves (not all at once)
- Limit to 1–2 tickets per user initially
- Stress test at 10× expected traffic

---

## 30. v2.0 Architecture Roadmap

### Microservices Migration Path

```
Phase 1: Extract Auth Service (3-4 weeks) — Go for 100K+ req/sec
Phase 2: Extract Scanning Service (4-6 weeks) — Go/Rust for CPU-intensive validation
Phase 3: Extract Payment Service (3-4 weeks) — Separate DB for PCI compliance
Phase 4: Extract remaining services (8-12 weeks)
```

### Event-Driven Architecture

Replace synchronous operations with Kafka/RabbitMQ:
- `payment.completed` → triggers registration, QR generation, email
- Each consumer is independent, retryable, and auditable
- 10× faster API responses (no waiting for downstream tasks)

### CQRS for High-Read Scenarios

Separate write (PostgreSQL) and read (denormalized MongoDB/read replicas) paths for:
- Event browsing
- Dashboard analytics
- Ticket search

### Elasticsearch Integration

Full-text search with fuzzy matching, geo-spatial queries, faceted filtering, auto-complete. Replace current PostgreSQL `ILIKE` queries.

### Observability Stack

Prometheus + Grafana for metrics, distributed tracing, real-time dashboards, circuit breakers, automatic failover.

---

## 31. Offline Sync & Mobile Scanning

> **See also:** Section 5 (Mobile Application Architecture) for Drift database schema, Ed25519 verification, background sync worker, and scanning flow diagrams.

### Architecture Overview

EventKnit supports **fully offline event check-in** — critical for venues with poor connectivity (outdoor festivals, stadium basements, rural locations). The system uses a **local-first architecture** where scans are recorded locally and synced when connectivity returns.

```
┌─────────────────────────────────────────────────┐
│                MOBILE DEVICE                     │
│                                                  │
│  ┌──────────┐    ┌──────────────┐               │
│  │ QR Scan  │───▶│ Ed25519      │               │
│  │ Camera   │    │ Verify Local │               │
│  └──────────┘    └──────┬───────┘               │
│                         │                        │
│              ┌──────────▼───────────┐           │
│              │  Drift SQLite DB     │           │
│              │  ┌─────────────────┐ │           │
│              │  │ offline_scans   │ │           │
│              │  │ cached_attendees│ │           │
│              │  │ cached_zones    │ │           │
│              │  │ scan_history    │ │           │
│              │  │ sync_logs       │ │           │
│              │  └─────────────────┘ │           │
│              └──────────┬───────────┘           │
│                         │                        │
│              ┌──────────▼───────────┐           │
│              │  Background Worker   │           │
│              │  (WorkManager 15min) │           │
│              └──────────┬───────────┘           │
└─────────────────────────┼────────────────────────┘
                          │ When online
              ┌───────────▼──────────┐
              │  POST /offline/      │
              │  scans/batch         │
              └──────────────────────┘
```

### Pre-Event Manifest Sync

Before going offline, the scanner downloads an event manifest:

```dart
// GET /api/v1/offline/events/{eventId}/data
// Downloads:
// - Full attendee roster (names, emails, QR tokens, photos)
// - Facility zones with capacity limits
// - Access restriction rules
// - Ed25519 public key for signature verification
```

**Data cached locally in Drift (type-safe SQLite ORM):**

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `cached_attendees` | Offline attendee lookup | registrationId, name, email, qrToken, ticketType, photoUrl |
| `cached_zones` | Facility capacity & access rules | zoneId, name, capacity, currentCount, restrictions |
| `offline_scans` | Pending scans awaiting sync | id, registrationId, eventId, scanType, timestamp, synced |
| `scan_history` | All scans (online + offline) | scanId, result, method, facilityId |
| `sync_logs` | Sync operation tracking | syncId, status, itemsSynced, errors |
| `service_point_sessions` | Walk-in OTP sessions | sessionId, phone, otpHash, expiresAt |

### Offline Ticket Verification (Ed25519)

Three ticket formats supported, verified locally without network:

**Format 1: Ed25519 Signed JWT (Primary)**
```dart
// Token format: header.payload.signature
// Payload: { registrationId, eventId, email, ticketType, issuedAt, expiresAt }
// Verification:
//   1. Decode base64url payload
//   2. Verify Ed25519 signature against cached public key
//   3. Check expiresAt > now
//   4. Check eventId matches current event
```

**Format 2: HMAC-SHA256 (Legacy)**
```
registrationId|eventId|email|timestamp|hmacSignature
```

**Format 3: Backup Code**
```
10-character alphanumeric code → looked up against cached attendee list
```

### Offline Scan Deduplication

Pre-scan idempotency prevents double-scanning before items enter the queue:

```dart
// Before queuing:
// 1. Check scan_history for same registrationId + eventId in last 5 minutes
// 2. Check offline_scans queue for pending duplicate
// 3. If duplicate found → show "Already Scanned" (not an error)
// 4. If unique → add to offline_scans with UUID
```

### Batch Sync Protocol

When connectivity returns, scans are uploaded in batches:

```dart
// POST /api/v1/offline/scans/batch
// Body: { scans: [{ registrationId, eventId, scanType, scannedAt, deviceId }] }
// Response: { synced: 45, duplicates: 3, failed: 1, errors: [...] }

// Sync strategy:
// - Process one-by-one with 100ms delay (server rate limiting)
// - ALREADY_SCANNED responses treated as success (idempotent)
// - Failed items retained with error message for retry
// - Cleanup: synced scans older than 7 days auto-purged
```

### Background Sync Worker

```dart
// WorkManager configuration:
// - Frequency: Every 15 minutes
// - Constraints: requiresNetworkConnectivity + !requiresBatteryNotLow
// - Execution: Separate isolate (doesn't block UI)
// - Backoff: Exponential (15min → 30min → 60min on failure)
// - Actions: Sync pending scans → cleanup old data → update sync status
```

### Web Frontend Offline Queue

The web client (`client/src/lib/offline-sync.ts`) also supports offline scanning:

- **localStorage-based queue** (max 1,000 items, auto-prune to 500 if storage full)
- Check-in / check-out request queuing
- `getSyncStatus()` → returns online state, queue length, failed count, last sync timestamp
- One-by-one sync with 100ms delay and exponential backoff (max 3 retries)

---

## 32. Event Day Hub & MICE Operations

### Overview

The Event Day Hub (formerly "Service Point") handles on-site event operations — badge printing, walk-in registration, facility tracking, and emergency reporting. Implemented across `workstation.service.ts` (1,429 lines) and the `ServicePoint*` frontend components.

**Naming note:** The system is called "Event Day Hub" in the UI. The route prefix (`/event-day/*`) and sidebar label reflect this. Backend API routes remain under `/api/v1/workstation/*` and service-point paths for backward compatibility.

### Role-Aware Event Filtering (ServicePointEvents.tsx)

Tellers only see events they are assigned to — not all platform events. The event list page uses role-aware fetching:

```typescript
// ServicePointEvents.tsx
const isTeller = user?.role === UserRole.ORGANIZER_TELLER || user?.role === UserRole.TELLER;

useEffect(() => {
  if (isTeller && user?.id) {
    if (user.role === UserRole.ORGANIZER_TELLER) {
      // Fetches organizer staff assignments → extracts assignment.event
      getOrganizerStaffEvents(user.id, { status: 'APPROVED' });
    } else {
      // Fetches admin staff assignments → extracts assignment.event
      getAdminStaffEvents(user.id, { status: 'APPROVED' });
    }
  } else {
    // Admin staff and higher see all approved events
    getEvents({ status: EventStatus.APPROVED, limit: 100 });
  }
}, [user?.id, isTeller]);
```

This ensures a teller assigned to 3 events only sees those 3 — not the full platform catalog.

### Badge Print Tracking

Server-side badge print tracking (not localStorage):

```typescript
// Record a badge print
POST /api/v1/workstation/events/:eventId/badge-prints
Body: { registrationId, printerId?, templateId?, copies: 1 }

// Get all badge prints for an event
GET /api/v1/workstation/events/:eventId/badge-prints
// Returns: printId, attendeeName, templateName, printedAt, printedBy, copies
```

### Badge Template System

Organizer-scoped badge templates with visual element positioning:

```typescript
// Badge template model stores:
// - elements: JSON[] — positioned text/image/qr elements with x,y,width,height
// - organizerId — scopes template to organizer (not global)
// - eventId — optionally scopes to specific event
// - Template operations: create, update, duplicate, preview, print
```

**Content-ID for Inline Email Images:**

Badge and ticket emails use RFC 2387 Content-ID for inline images:

```typescript
// Email with inline image (not attachment):
const mailOptions = {
  attachments: [{
    filename: 'badge.png',
    content: badgeBuffer,
    cid: 'badge-image-001'  // Content-ID
  }],
  html: '<img src="cid:badge-image-001" alt="Your Badge" />'
};
// Image renders inline in email body, not as downloadable attachment
// Supported by all major email clients (Gmail, Outlook, Apple Mail)
```

### Walk-In Registration (3-Step OTP Flow)

For on-site attendees without pre-registration:

```
Step 1: POST /api/v1/events/:eventId/service-point/initiate
        Body: { phone: "+254..." }
        → Sends OTP via SMS, returns sessionId

Step 2: POST /api/v1/events/:eventId/service-point/verify-otp
        Body: { sessionId, otp: "123456" }
        → Verifies OTP, returns verified session token

Step 3: POST /api/v1/events/:eventId/service-point/complete
        Body: { sessionToken, name, email, ticketTypeId }
        → Creates registration, generates QR code, prints badge
```

**Session timeout:** 3 minutes per OTP. Frontend (`WalkInRegistration.tsx`) implements a 3-step wizard with phone input → OTP verification → details form → success.

### No-Show Report

Identifies registered attendees who never checked in:

```typescript
// Implementation: Load all attendees (up to 500), filter by !checkedInAt
// Client-side CSV export columns:
// Name, Email, Phone, Ticket Type, Ticket Status, Registered At
// Access: "No-Shows" tab in ServicePointEventDashboard
```

### Emergency Muster Report

Real-time occupancy report for emergency scenarios:

```typescript
// Shows all attendees where isCurrentlyInside === true
// Available via "Muster Report" button (red border, shield icon) in Quick Actions
// Dialog displays:
//   - Total count of people currently inside
//   - Name, email, ticket type, last scanned facility
// CSV export timestamped to the minute
// Use case: Fire evacuation, security incidents, venue capacity compliance
```

### Facility Zone Management

```typescript
// Zone model: { eventId, code (unique per event), name, capacity, currentCount }
// Bulk assign attendees to zones (by ticket type or individual)
// Real-time occupancy tracking with threshold alerts via WebSocket
// Access restriction rules per zone (VIP, backstage, press, etc.)
```

---

## 32.1 Managed Events System

### Architecture Overview

Managed Events are platform-operated events created by admins on behalf of external clients. The `isManaged` flag on the `Event` model determines creation path and edit rules at runtime. There is no separate model — managed events are regular `Event` records with extra metadata.

**Key invariants:**
- `isManaged: true` → created as `APPROVED` (skips pending queue)
- `isManaged: true` → `organizerId` set to the creating admin's user ID
- `isManaged: true` → `managedByAdminId` records the admin for accountability
- `isManaged: false` → standard organizer event lifecycle

### Backend

**Files:**
- `server/src/controllers/managed-event.controller.ts` — HTTP handlers
- `server/src/services/managed-event.service.ts` — business logic
- Routes mounted in `server/src/routes/admin.routes.ts`

**API Endpoints (all under `/api/v1/admin`):**

```typescript
GET    /managed-events/stats       → { total, active, upcoming, byClientType }
GET    /managed-events             → paginated list (filters: status, clientType, search)
GET    /managed-events/:eventId    → single event with details
POST   /managed-events             → create (auto-APPROVED, isManaged: true)
PUT    /managed-events/:eventId    → update any field
POST   /managed-events/:eventId/cancel  → cancel with reason
```

**Minimum role:** `ADMIN_STAFF` (via `requireMinRole(UserRole.ADMIN_STAFF)`)

**Create payload:**
```typescript
interface CreateManagedEventPayload {
  // Client metadata
  clientName: string;
  clientType: 'CORPORATE' | 'NGO' | 'GOVERNMENT' | 'PLATFORM' | 'OTHER';
  clientContactEmail?: string;
  clientContactPhone?: string;
  clientContractRef?: string;

  // Event details
  title: string;
  description: string;
  category: string;
  location: string;
  venue?: string;
  startDate: string;       // ISO datetime
  endDate?: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  isFree?: boolean;
  price?: number;
  capacity?: number;
  isOnline?: boolean;
  onlineLink?: string;
}
```

**Slug generation:** `${slugify(title)}-${Date.now()}` — ensures uniqueness for same-title events.

### Frontend

**Files:**
- `client/src/lib/managed-events-api.ts` — typed API client
- `client/src/pages/admin/AdminManagedEventsPage.tsx` — list + stats page
- `client/src/pages/admin/AdminManagedEventCreatePage.tsx` — two-step creation wizard
- Route: `admin/managed-events` and `admin/managed-events/create` (ADMIN_STAFF_ROLES)

**Two-step creation wizard:**

```
Step 1 (Client Details):
  - Client Name, Client Type (select), Contact Email, Contact Phone, Contract Reference

Step 2 (Event Details):
  - Title, Description, Category, Location, Venue, Start/End Date+Time, Timezone
  - isFree toggle, Price, Capacity, isOnline toggle, Online Link
```

### Support Mode (Admin Edits on Organizer Events)

Admins viewing organizer-owned events cannot edit directly. The `EventDetailsPage` enforces this:

```typescript
const handleEdit = () => {
  if (!eventData.isManaged && !supportModeActive) {
    setSupportModeTriggeredByEdit(true);  // flag: dialog opened from Edit button
    setSupportModeDialogOpen(true);
    return;  // block navigation until audit session is active
  }
  navigate(`/organizer/events/create?edit=${eventData.id}`);
};
```

- **Managed events** (`isManaged: true`): bypass the gate — navigate directly to edit
- **Organizer events** (`isManaged: false`): require Support Mode activation before editing
- The dialog shows "Activate & Edit Event" (navigates after activation) vs. "Activate Support Mode" (activation only)
- `supportModeTriggeredByEdit` flag distinguishes the two dialog entry points

---

## 33. USSD & SMS Channel

### Overview

EventKnit supports ticket purchasing and event registration via USSD and SMS — enabling access for users without smartphones or internet. This is critical for African markets where USSD penetration far exceeds smartphone adoption.

### USSD Architecture (Africa's Talking)

```
┌──────────┐    ┌───────────────┐    ┌──────────────┐
│ User     │    │ Africa's      │    │ EventKnit    │
│ Phone    │───▶│ Talking API   │───▶│ USSD Handler │
│ (*XXX#)  │    │               │    │              │
└──────────┘    └───────────────┘    └──────────────┘
```

**Multi-Level Menu Navigation:**

```
Level 1: Welcome to EventKnit
  1. Browse Events
  2. My Tickets
  3. Register for Event

Level 2 (Browse Events):
  1. Music Concert - KES 500
  2. Tech Meetup - FREE
  3. Football Match - KES 1000

Level 3 (Selected Event):
  1. Buy Ticket (→ M-Pesa STK Push)
  2. Event Details
  3. Back
```

**Session Management:**
- 3-minute session timeout (USSD standard)
- State persisted in database per session ID
- Multi-step flow across menu levels
- USSD response formatting: `CON` (continue session) / `END` (terminate session)

### Integrated M-Pesa Payment via USSD

For paid events, USSD triggers an M-Pesa STK (SIM Toolkit) push:

```typescript
// Flow:
// 1. User selects "Buy Ticket" via USSD menu
// 2. Server initiates M-Pesa STK Push to user's phone
// 3. User enters M-Pesa PIN on their phone
// 4. M-Pesa webhook confirms payment
// 5. Registration created, SMS confirmation sent
// 6. USSD session ends with "Ticket confirmed" message
```

### SMS Gateway Integration

```typescript
// Provider: Twilio (configurable)
// Features:
// - Outbound SMS: Registration confirmations, OTP codes, event reminders
// - Inbound SMS: Reply-based commands for session management
// - Delivery tracking with status callbacks
// - ussd-sms.service.ts (1,468 lines) handles SMS fallback for USSD-incompatible phones
```

---

## 34. Unified Messaging & Communication

### Multi-Channel Architecture

EventKnit routes messages through the optimal channel based on message type and user preferences:

```typescript
// unified-messaging.service.ts (475 lines)
// Channel selection logic:
//   1. Check user notification preferences (per category)
//   2. Check quiet hours (don't send push at 3 AM)
//   3. Select channel(s): email, SMS, push notification, in-app
//   4. Fallback: if primary channel fails, try next preferred channel

// Channel priority (configurable per user):
// High-priority (payment confirmations): Email + Push + In-app
// Medium (event reminders): Push + In-app
// Low (marketing): Email only (if opted in)
```

### Notification Preference System

```typescript
// Per-user configurable settings:
// - Channel toggles: email (on/off), SMS (on/off), push (on/off), in-app (on/off)
// - Category toggles: 24 notification types each independently configurable
// - Quiet hours: start time → end time (no push/SMS during this window)
// - Digest mode: batch low-priority notifications into daily/weekly digest
```

### Email System

**Template-Based Email Generation:**
- Template CRUD with variable substitution (`{{attendeeName}}`, `{{eventTitle}}`, etc.)
- Preview generation before send
- Multiple SMTP provider support (default: Gmail SMTP)
- Email marketing campaigns with segmentation, scheduling, and open/click tracking

**Two-Email Model for Ticket Purchase:**
1. **Immediate confirmation** — payment received, ticket being prepared
2. **Ticket delivery** — PDF attachment (Content-ID inline) + QR code + calendar invite (.ics)

### Push Notifications

```typescript
// Providers: Firebase Cloud Messaging (FCM) for Android, APNs for iOS
// Features:
// - Device registration management (multiple devices per user)
// - Notification payload formatting (title, body, data, image)
// - Topic-based broadcasting (event updates to all attendees)
// - Silent push for background data sync
```

### Bulk Messaging

```typescript
// Target audience filtering:
// - All attendees of an event
// - Specific ticket types
// - Checked-in vs not checked-in
// - Custom segments (see Section 40)
// Scheduling: Send now or schedule for future delivery
// Status tracking: PENDING → SENDING → SENT → DELIVERED/FAILED
// Error tracking with row-level detail
```

---

## 35. Ticket Transfer & Resale Marketplace

### Ticket Transfer System

Peer-to-peer ticket transfer with approval workflow:

```typescript
// ticket-transfer.service.ts (690 lines)

// Transfer flow:
// 1. Owner initiates transfer → POST /tickets/:id/transfer
//    Body: { recipientEmail, reason? }
// 2. Transfer record created (status: REQUESTED)
// 3. Recipient notified via email
// 4. Recipient accepts/rejects
// 5. On accept:
//    - Registration ownership updated
//    - New QR code generated (old one invalidated)
//    - Both parties notified
//    - Audit log entry created
// 6. On reject: Transfer cancelled, owner retains ticket
```

### Resale Marketplace

Peer-to-peer secondary market for ticket resale:

```typescript
// ticket-resale.service.ts (630 lines)

// Resale flow:
// 1. Seller lists ticket → POST /tickets/:id/resale
//    Body: { askingPrice, description? }
// 2. Listing visible on event page
// 3. Buyer purchases at listed price
// 4. Platform processes payment (same gateway as primary sales)
// 5. Ticket transferred to buyer (new QR code)
// 6. Seller receives payout (minus platform fee)

// Safeguards:
// - Price cap enforcement (prevent scalping — configurable % above face value)
// - Only verified account holders can list
// - One active listing per ticket
// - Listing expires if event starts
```

### Transfer & Resale Analytics

```typescript
// resale-transfer-analytics.service.ts
// Tracks: transfer volume, resale volume, average resale price vs face value
// Used by: organizer analytics dashboard, admin platform analytics
```

---

## 36. Distributed Locking & Concurrency Control

### Redis Distributed Locking

Prevents race conditions in multi-instance deployments using **atomic Lua scripts**:

```typescript
// lock.service.ts

// Lock acquisition (atomic via Lua script):
const LOCK_SCRIPT = `
  if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
    return 1
  end
  return 0
`;

// Lock release (ownership verification via Lua):
const UNLOCK_SCRIPT = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
  end
  return 0
`;

// Usage with automatic acquire/release:
await lockService.withLock('payment:order-123', async () => {
  // Critical section — only one instance executes this
  await processPayment(orderId);
}, {
  ttl: 5000,        // Lock expires after 5 seconds (prevents deadlocks)
  retries: 3,       // Retry acquisition 3 times
  retryDelay: 100,  // 100ms between retries
});
```

### Lock Features

| Feature | Implementation |
|---------|---------------|
| **Atomic operations** | Lua scripts prevent TOCTOU race conditions |
| **Ownership verification** | UUID per lock — only the acquirer can release |
| **TTL auto-expiry** | Prevents deadlocks if holder crashes |
| **Lock extension** | Extend TTL for long-running operations |
| **Retry logic** | Configurable retries with delay |
| **Graceful fallback** | If Redis unavailable, operations proceed without locking (degraded mode) |

### Where Locking is Used

- **Seat reservation** — Prevents two users from reserving the same seat
- **Cart checkout** — Prevents double-processing of the same order
- **Payment processing** — Ensures idempotent payment initialization
- **Ticket inventory** — Atomic decrement of available ticket count
- **Promo code redemption** — Prevents usage count race conditions

---

## 37. Audit Logging & GDPR Compliance

### Audit Logging System

Comprehensive audit trail with **150+ standardized action types** and automatic IP geolocation:

```typescript
// audit.ts utility

// Async audit log creation:
await createAuditLog({
  userId: req.user.id,
  action: AUDIT_ACTIONS.TICKET_PURCHASED,
  resourceType: 'Registration',
  resourceId: registration.id,
  metadata: { eventId, ticketType, amount },
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  // Geolocation auto-detected from IP (optional skip flag)
});
```

**Action Categories (150+ constants):**

| Category | Example Actions |
|----------|----------------|
| **User Management** | USER_CREATED, USER_UPDATED, USER_DELETED, ROLE_CHANGED, PASSWORD_CHANGED |
| **Authentication** | LOGIN_SUCCESS, LOGIN_FAILED, TOKEN_REFRESHED, OAUTH_LOGIN |
| **Staff** | STAFF_CREATED, STAFF_ASSIGNED, STAFF_REMOVED, PERMISSION_UPDATED |
| **Events** | EVENT_CREATED, EVENT_PUBLISHED, EVENT_CANCELLED, EVENT_APPROVED, EVENT_REJECTED |
| **Tickets** | TICKET_PURCHASED, TICKET_CANCELLED, TICKET_REFUNDED, TICKET_TRANSFERRED |
| **Financial** | DISBURSEMENT_CREATED, REFUND_PROCESSED, RECONCILIATION_RUN |
| **Security** | SUSPICIOUS_ACTIVITY, RATE_LIMIT_EXCEEDED, ADMIN_ACCESS_BLOCKED |
| **GDPR** | DATA_EXPORT_REQUESTED, ACCOUNT_DELETED, DATA_ANONYMIZED |
| **Credit** | CREDIT_ADDED, CREDIT_DEDUCTED, VOUCHER_REDEEMED |

### IP Geolocation for Audit

```typescript
// Automatic geolocation detection from IP address:
// - Extracts country, region, city from IP
// - Stored with audit log entry
// - Used for: suspicious login detection, geographic access analysis
// - Optional skip via flag (for internal operations)
```

### GDPR Compliance (gdpr.service.ts)

**Article 20 — Right to Data Portability:**
```typescript
// GET /api/v1/gdpr/export
// Returns structured JSON containing ALL user data:
// - Personal information (profile, extended profile)
// - Event registrations (past and upcoming)
// - Payment transactions
// - Notification history
// - Ticket transfers
// - User preferences
// - Consent records
```

**Right to Erasure (Account Deletion):**
```typescript
// DELETE /api/v1/gdpr/account
// - Anonymizes personal data (replaces with hashed values)
// - Retains financial records (legal requirement)
// - Cancels active registrations
// - Revokes all tokens
// - Sends confirmation email
// - Audit log: DATA_ANONYMIZED
```

**Consent Management:**
```typescript
// consent.service.ts
// - Tracks consent per category (marketing, analytics, third-party sharing)
// - Consent receipts with timestamp and version
// - Consent withdrawal support
// - Audit trail for all consent changes
```

---

## 38. Granular Permission System

### Beyond Simple RBAC

EventKnit implements **fine-grained permissions** on top of role-based access control. While roles (10 levels) provide broad access, permissions enable precise control for staff members.

### Role Hierarchy (Numeric Levels)

```typescript
// privileges.ts
const ROLE_LEVELS = {
  SUPERADMIN: 10,
  ADMIN: 9,
  ADMIN_STAFF: 8,
  MARKETER: 7,
  SUPPORT: 6,
  TELLER: 5,
  ORGANIZER: 4,
  ORGANIZER_STAFF: 3,
  ORGANIZER_TELLER: 2,
  ATTENDEE: 1,
};

// Privilege checks:
canCreateRole(creatorRole, targetRole)  // Can this role create that role?
canModifyUser(actorRole, targetRole)    // Can this role modify that user?
canManageStaff(role)                    // Can this role manage staff?
canAccessAllEvents(role)               // Cross-event access check
isPlatformAdmin(role)                  // SUPERADMIN | ADMIN | ADMIN_STAFF
```

### Permission Middleware

```typescript
// permission.middleware.ts

// Require ALL permissions:
router.get('/reports',
  authenticate,
  requirePermission('VIEW_FINANCIAL_REPORTS'),
  controller.getReports
);

// Require ANY permission:
router.post('/event',
  authenticate,
  requireAnyPermission('CREATE_EVENT', 'MANAGE_EVENTS'),
  controller.createEvent
);

// Bypass: SUPERADMIN, ADMIN, ORGANIZER roles skip permission checks
// Staff roles: checked against PermissionService effective permissions
```

### Permission Inheritance

```typescript
// TeamRolePermission model:
// @@unique([roleId, permissionId])
// Roles can have custom permission sets
// Staff members inherit role permissions + individual overrides
// Effective permission = Role permissions ∪ Individual grants - Individual denials
```

### Data Access Levels

```typescript
// Three tiers of data visibility:
enum DataAccessLevel {
  RESTRICTED,  // Summary only (counts, totals)
  STANDARD,    // Attendee list, no transaction IDs
  FULL,        // Detailed payment info, transaction IDs, PII
}
// Applied per staff role per data category
```

---

## 39. Social Media Integration

### Multi-Platform Publishing

```typescript
// social-media/ directory — pluggable platform architecture
// Supported platforms: Twitter/X, Instagram, LinkedIn

// Platform Manager (singleton):
// - Registers platform implementations
// - Routes publish requests to correct platform
// - Aggregates analytics across platforms
```

### OAuth per Platform

```typescript
// Each platform has dedicated OAuth service (for publishing, NOT authentication):
// - Twitter: OAuth 2.0 with PKCE
// - Instagram: Instagram Graph API
// - LinkedIn: OAuth 2.0 with member permissions

// Note: Instagram requires Facebook Business Account setup but OAuth is via Facebook
// Config (per platform):
// clientId, clientSecret, redirectUri stored in server config
```

### Scheduled Publishing

```typescript
// Social media scheduler (background job, cron-based):
// 1. Organizer creates post with scheduled time
// 2. PostStatus: DRAFT → SCHEDULED → PUBLISHING → PUBLISHED / FAILED
// 3. Background job checks for due posts every minute
// 4. Publishes to all selected platforms simultaneously
// 5. Stores platform-specific post IDs for metrics tracking
```

### Post Analytics

```typescript
// Aggregated metrics across platforms:
// - Impressions, reach, engagement rate
// - Click-through rate (link tracking)
// - Per-post and per-campaign attribution
// - Organizer-level analytics dashboard
```

### Social Webhooks

Inbound webhook handler for platform callbacks (engagement events, delivery confirmations):
```
POST /api/v1/social-webhooks/:platform
// Signature verification per platform
// Event processing: likes, shares, comments, mentions
```

---

## 40. Attendee Management & Segmentation

### Bulk Attendee Import

```typescript
// attendee-import.service.ts
// POST /api/v1/events/:eventId/attendees/import
// Accepts: CSV file upload (via multer, 10MB limit)

// Import pipeline:
// 1. Parse CSV with papaparse
// 2. Validate each row (email format, required fields, duplicates)
// 3. Row-level error tracking (line number + error message)
// 4. Bulk insert valid records
// 5. Return: { imported: 150, skipped: 3, errors: [{row: 5, error: "Invalid email"}] }
```

### Attendee Segmentation

```typescript
// attendee-segmentation.service.ts
// Create segments based on:
// - Demographics (location, age range)
// - Behavior (attendance frequency, spend amount)
// - Ticket type (VIP, early bird, free)
// - Custom tags

// Segment membership: @@unique([segmentId, userId])
// Used for: targeted messaging, marketing campaigns, analytics
```

### Attendee Tagging

```typescript
// attendee-tag.service.ts
// Custom tags per organizer: @@unique([organizerId, name])
// Tag assignment: @@unique([tagId, userId, eventId])
// Use cases: "VIP Guest", "Speaker", "Press", "Sponsor Rep"
// Filter attendees by tag for communication, reports, access control
```

### Attendee Communication

```typescript
// attendee-communication.service.ts
// - Scheduled messaging to segments
// - Auto-follow-ups (post-event thank you, feedback request)
// - Engagement tracking (opened, clicked, responded)
// - Template-based messaging with personalization
```

---

## 41. Digital Wallet, Credits & Invoicing

### Digital Wallet

```typescript
// digital-wallet.service.ts
// - One wallet per user (created on first ticket purchase)
// - Tickets auto-added to wallet after purchase
// - Wallet contains: ticket QR code, event details, seat info
// - Backup/recovery via account email
// - Mobile: rendered as scrollable card stack
```

### Credit System

```typescript
// credit.service.ts
// Platform credit (like store credit):
// - Credit balance per user
// - Add credits: refund-to-credit, promotional grants, voucher redemption
// - Deduct credits: applied at checkout (reduces payment amount)
// - Transaction history: CREDIT_ADDED, CREDIT_DEDUCTED with metadata
// - Balance inquiry: GET /api/v1/credits/balance
```

### Invoice System

```typescript
// invoice.service.ts (25 classes)
// - Auto-generate invoices for ticket purchases
// - Custom invoice templates (invoice-template.service.ts)
// - Fields: buyer info, event info, line items, tax, total, payment status
// - PDF generation via pdfkit
// - Invoice tracking: created → sent → paid → cancelled
```

### Tax Calculation

```typescript
// tax.service.ts
// - Tax rate management per jurisdiction
// - Tax exemption rules
// - Automatic tax calculation at checkout
// - Tax-inclusive vs tax-exclusive pricing modes
// - Tax reporting for organizers
```

---

## 42. Dynamic Pricing Engine

### Rules-Based Pricing

```typescript
// dynamic-pricing.service.ts + DynamicPricingRule model

// Pricing rules applied automatically:
// 1. Early Bird — lower price until X days before event
// 2. Last Minute — surge pricing within 24h of event
// 3. Capacity-Based — price increases as tickets sell (demand curve)
// 4. Time-Based — different prices for different time windows
// 5. Quantity-Based — group discounts for bulk purchases

// Rule evaluation order:
// - Rules sorted by priority
// - First matching rule wins (no stacking by default)
// - Can be combined with promo codes (see Section 24)
```

### Affiliate & Referral Program

```typescript
// affiliate-program.service.ts
// - Create affiliate programs per event or platform-wide
// - Generate unique referral codes per affiliate
// - Track conversions: @@unique([affiliateId, registrationId])
// - Commission calculation (percentage or fixed per sale)
// - Affiliate dashboard: clicks, conversions, earnings
// - Payout integration with disbursement system
```

---

## 43. Batch Export & Data Operations

### Export Capabilities

EventKnit supports bulk data export across multiple modules:

| Export Type | Format | Library | Trigger |
|-------------|--------|---------|---------|
| **Attendee list** | CSV | `papaparse` | Admin/organizer dashboard |
| **Financial reports** | Excel (.xlsx) | `xlsx` | Admin financial dashboard |
| **No-show report** | CSV | Client-side generation | Service Point dashboard |
| **Muster report** | CSV | Client-side generation | Emergency dialog |
| **Badge print log** | CSV | Client-side generation | Service Point print page |
| **Event analytics** | PDF | `jspdf` + `html2canvas` | Analytics dashboard |
| **Ticket PDF** | PDF | `pdfkit` (server) / `react-to-pdf` (client) | Post-purchase |
| **Invoice** | PDF | `pdfkit` | Financial module |
| **GDPR data export** | JSON | Native | GDPR compliance endpoint |

### Client-Side CSV Generation Pattern

```typescript
// Pattern used across Service Point components:
const exportToCSV = (data: Attendee[], filename: string) => {
  const headers = ['Name', 'Email', 'Phone', 'Ticket Type', 'Status', 'Registered At'];
  const rows = data.map(a => [a.name, a.email, a.phone, a.ticketType, a.status, a.registeredAt]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  // Trigger download via hidden <a> element
};
```

### Server-Side Excel Export

```typescript
// Uses xlsx library for complex spreadsheets:
// - Multiple worksheets (summary, details, breakdown)
// - Formatted headers with column widths
// - Date formatting
// - Number formatting (currency, percentages)
// Used for: financial reconciliation reports, platform analytics
```

### Print Operations

```typescript
// react-to-print: Browser print dialog for badges, tickets
// react-to-pdf: PDF generation from React components
// html2canvas: Screenshot React components for PDF embedding
// jsPDF: Client-side PDF generation with layout control
```

---

## 44. CI/CD Pipelines & DevOps

### GitHub Actions Workflows

**8 workflow files** in `.github/workflows/`:

| Workflow | Trigger | Services | Steps |
|----------|---------|----------|-------|
| `server-ci.yml` | Push/PR to main, development, staging | MongoDB 7.0, Redis 7 | Lint → Type-check → Test → Build |
| `client-ci.yml` | Push/PR to main, development, staging | None | Lint → Type-check → Test → Build |
| `server-deploy-staging.yml` | Push to `staging` | — | Build → Deploy to staging |
| `client-deploy-staging.yml` | Push to `staging` | — | Build → Deploy to staging |
| `server-deploy-production.yml` | Push to `main` | — | Build → Deploy to production |
| `client-deploy-production.yml` | Push to `main` | — | Build → Deploy to production |

**CI Configuration Details:**
- Node.js max-old-space-size: 4096 MB (for TypeScript compilation)
- Test coverage artifacts uploaded per run
- Build artifacts preserved for deployment
- GitHub Environments for secret management (staging/production)

### Pre-Push Hooks (Husky)

```bash
# Root package.json → Husky pre-push hook:
# Runs: node server/scripts/prepush-summary.js

# Server pre-push script:
# 1. npm run test -- --coverage
# 2. npm run lint
# 3. npm run type-check
# 4. npm run build
# All must pass before push is allowed

# Client pre-push script:
# 1. npm run lint
# 2. npm run type-check
# 3. npm run test:run
# 4. npm run build
```

### Zero-Downtime Deployment (deploy.sh)

```bash
# deploy.sh (211 lines) — Rolling update strategy:

# 1. Verify Docker available
# 2. Start postgres + redis (persistent — never killed)
# 3. Wait for database health check
# 4. Build new Docker images
# 5. Run Prisma migrations against running database
# 6. Swap containers: docker compose up -d --force-recreate
#    (new containers start before old ones stop)
# 7. Recreate nginx (picks up new upstream)
# 8. Wait for health check: GET /health
# 9. Verify API endpoint responds
# 10. Cleanup: docker image prune -f (remove dangling images)

# Error handling:
# - Prisma migration conflict resolution
# - Color-coded terminal logging (green=success, red=error, yellow=warn)
# - Exit on any step failure
```

### Docker Resource Limits

```yaml
# docker-compose.dev.yml production-ready configuration:
services:
  postgres:
    image: postgres:16-alpine
    deploy:
      resources:
        limits: { cpus: '2.0', memory: 2G }
        reservations: { cpus: '0.5', memory: 512M }
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U eventknit"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7.2-alpine
    command: >
      redis-server --requirepass ${REDIS_PASSWORD}
                   --appendonly yes
                   --maxmemory-policy allkeys-lru
    deploy:
      resources:
        limits: { cpus: '1.0', memory: 512M }

  server:
    deploy:
      resources:
        limits: { cpus: '2.0', memory: 1G }
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
```

### NGINX Reverse Proxy

```nginx
# nginx/nginx.conf
upstream api { server server:3001; }
upstream client { server client:3000; }

server {
    listen 80;
    client_max_body_size 20M;

    # REST API
    location /api { proxy_pass http://api; }

    # WebSocket (Socket.IO) — 24h timeout for persistent connections
    location /socket.io/ {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Frontend (SPA fallback)
    location / {
        proxy_pass http://client;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 45. Port Configuration

### Development Ports

| Service | Port | Config File |
|---------|------|-------------|
| Backend API | `3010` | `server/.env.development` |
| Frontend Web | `5173` | `client/vite.config.ts` |
| PostgreSQL | `5432` | `server/.env.development` |
| Redis | `6380` | `server/.env.development` |
| PgAdmin | `8080` | `server/.env.development` |

### Production Ports

| Service | Port | Notes |
|---------|------|-------|
| Backend API | `80/443` | Behind NGINX reverse proxy |
| Frontend Web | `80/443` | Static files via CDN |
| PostgreSQL | `5432` | Not publicly exposed |
| Redis | `6380` | Not publicly exposed |

### Changing Backend Port

1. Update `server/.env.development`: `PORT=<new_port>`
2. Update `client/vite.config.ts` proxy target
3. Update `eventknit_mobile/lib/api/endpoints.dart`
4. Restart all services

---

## 46. Glossary

| Term | Definition |
|------|-----------|
| **Access Token** | Short-lived JWT (15 min) for API authentication |
| **Refresh Token** | Long-lived token (7–30 days) stored in HTTP-only cookie for session persistence |
| **RBAC** | Role-Based Access Control — 10 roles with numeric hierarchy |
| **Idempotency** | Guarantee that repeated operations produce the same result (critical for payments) |
| **HMAC** | Hash-based Message Authentication Code — used for webhook signature verification |
| **Ed25519** | Elliptic curve cryptographic algorithm used for offline-verifiable ticket signing |
| **BullMQ** | Redis-backed job queue for background processing. EventKnit uses BullMQ for async ticket PDF generation and email delivery |
| **Async Queue** | Background task pipeline that decouples heavy work (PDF generation, email delivery) from the checkout critical path. A spike of 10,000 simultaneous registrations won't crash the server — they all get instant Email 1, then the queue processes tickets at a controlled rate (5 concurrent workers) |
| **Dead Letter Queue (DLQ)** | Virtual destination for jobs that have exhausted all retry attempts. EventKnit logs a structured `[DLQ]` critical alert so ops can investigate and re-trigger delivery via the Bull Board dashboard or `retryFailed()` |
| **Exponential Backoff** | Retry delay strategy where each attempt waits longer than the last (2 s → 4 s → 8 s). Prevents hammering a temporarily-down SMTP server or Redis instance |
| **Graceful Shutdown** | Ordered server stop: queue worker drains in-flight jobs before the process exits. Tickets being generated at the moment of a deploy are not lost |
| **Two-Email Model** | Registration email strategy: Email 1 confirms the booking instantly (< 1 s); Email 2 delivers the ticket PDF and QR code seconds later after async background generation |
| **Idempotency Key** | A unique identifier that prevents duplicate side effects. EventKnit uses `ticketEmailSentAt` as an idempotency guard — retrying a failed BullMQ job never sends a duplicate ticket email |
| **Bull Board** | Web dashboard for BullMQ queues. Mounted at `/admin/queues` (SUPERADMIN only). Shows waiting, active, completed, and failed job counts in real time |
| **Prisma** | Type-safe ORM that generates TypeScript types from the database schema |
| **Socket.IO** | WebSocket library with fallback transports, room-based broadcasting |
| **Grace Period** | 5 business days after event end before automatic organizer payout |
| **Platform Fee** | 7.5% all-in fee on paid ticket sales (absorbs gateway processing costs) |
| **Disbursement** | Payout from platform to organizer after grace period |
| **KYC** | Know Your Customer — identity verification required for paid event payouts |
| **White Label** | Customizable branding that replaces EventKnit's identity with the organizer's |
| **Cart Reservation** | 8-minute inventory lock during checkout to prevent overselling |
| **Backup Code** | 10-character alphanumeric fallback for QR code scanning |
| **Thundering Herd** | When many concurrent requests overwhelm a resource simultaneously |
| **CQRS** | Command Query Responsibility Segregation — separate read/write data paths |
| **Circuit Breaker** | Pattern that fails fast when a dependency is down, preventing cascade failures |
| **Drift** | Flutter local database (SQLite wrapper) for offline data caching |
| **GetX** | Flutter state management, routing, and dependency injection framework |
| **USSD** | Unstructured Supplementary Service Data — text-based protocol for feature phones |
| **STK Push** | SIM Toolkit Push — M-Pesa payment prompt sent directly to user's phone |
| **Content-ID** | RFC 2387 method for embedding inline images in emails (not as attachments) |
| **Lua Script** | Atomic Redis script that executes without interruption — used for distributed locking |
| **TOCTOU** | Time-of-Check-to-Time-of-Use — race condition prevented by atomic Lua scripts |
| **Manifest Sync** | Pre-event download of attendee/zone data for offline scanning |
| **Muster Report** | Emergency occupancy report showing all people currently inside a venue |
| **Data Portability** | GDPR Article 20 right to receive personal data in machine-readable format |
| **WorkManager** | Android/iOS background task scheduler — runs sync every 15 minutes |
| **Isolate** | Dart execution thread — background sync runs in separate isolate to avoid UI blocking |
| **Dynamic Pricing** | Rules-based automatic ticket price adjustment based on demand, time, or capacity |
| **Attendee Segment** | A filtered group of attendees based on demographics, behavior, or custom tags |
| **Affiliate** | User who earns commission for driving ticket sales via referral links |
| **Rolling Update** | Deployment strategy where new containers start before old ones stop — zero downtime |
| **Husky** | Git hooks manager — enforces lint, type-check, test, and build before push |
| **Event Day Hub** | Operational workstation for tellers and check-in staff — role-aware event filtering shows only assigned events |
| **Managed Event** | A platform-operated event (`isManaged: true`) created by an admin on behalf of an external client; auto-approved, no pending queue |
| **Support Mode** | Audited admin editing session required before an admin can modify an organizer-owned event; logs admin identity, timestamp, and reason |
| **ManagedClientType** | Enum categorizing managed event clients: CORPORATE, NGO, GOVERNMENT, PLATFORM, OTHER |
| **MICE** | Meetings, Incentives, Conferences, Exhibitions — category of professional events served by Managed Events feature |

---

*This document consolidates: TECHNICAL_GUIDE.md, TECHNICAL_GUIDE_IMPROVEMENTS.md, AUTHENTICATION_GUIDE.md, AUTHENTICATION_MIGRATION.md, TESTING_GUIDE.md, EVENT_CREATION_GUIDE.md, CHECKOUT_SYSTEM.md, PAYMENT_AND_DISBURSEMENT.md, WHITE_LABEL_BRANDING.md, PROMO_CODES.md, SEAT_ALLOCATION_COMPLETE.md, ADMIN_SECURITY.md, PORT_CONFIG.md, case_study.md, and 8 mobile docs (TECHNICAL_GUIDE.md, TICKET_SCANNING_FLOW.md, DRIFT_SETUP.md, DESIGN_SYSTEM.md, MOBILE_IMPLEMENTATION_GUIDE.md, MOBILE_VS_DESKTOP_FEATURES.md, TESTING_GUIDE.md, TODO_DISCOVERY_FEATURES.md) plus a full codebase audit (121 services, 68 controllers, 55 route files, 151 Prisma models, 250+ pages, Flutter mobile app) into a single comprehensive engineering reference.*
