# EventKnit Technical Documentation

A comprehensive engineering guide to the EventKnit platform — architecture, design patterns, implementation details, and operational procedures.

**Target Audience:** Software Engineers, System Architects, DevOps Engineers, Technical Leads, New Developers

**Last Updated:** April 2026

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
35. [Attendee Event View Architecture](#35-attendee-event-view-architecture)
36. [Ticket Transfer & Resale Marketplace](#36-ticket-transfer--resale-marketplace)
37. [Distributed Locking & Concurrency Control](#37-distributed-locking--concurrency-control)
38. [Audit Logging & GDPR Compliance](#38-audit-logging--gdpr-compliance)
39. [Granular Permission System](#39-granular-permission-system)
40. [Social Media Integration](#40-social-media-integration)
41. [Attendee Management & Segmentation](#41-attendee-management--segmentation)
42. [Digital Wallet, Credits & Invoicing](#42-digital-wallet-credits--invoicing)
43. [Dynamic Pricing Engine](#43-dynamic-pricing-engine)
44. [Batch Export & Data Operations](#44-batch-export--data-operations)
45. [CI/CD Pipelines & DevOps](#45-cicd-pipelines--devops)
46. [Port Configuration](#46-port-configuration)
47. [Post-Event Survey System](#47-post-event-survey-system)
48. [Financial Data Integrity Standards](#48-financial-data-integrity-standards)
49. [Glossary](#49-glossary)
51. [Company Documents](#51-company-documents)
52. [Forms & Participants](#52-forms--participants)
53. [Appendix](#53-appendix)

---

## Quick Start for New Developers

**Prerequisites:** Node.js 20+, PostgreSQL 16+, Redis 7+, Git

```bash
# 1. Clone and install
git clone <repo-url> && cd eventknit
cd server && npm install && cd ../client && npm install

# 2. Environment
cp server/.env.example server/.env    # Edit with your credentials

# 3. Database
cd server
npx prisma generate                   # Generate type-safe client
npx prisma migrate dev                # Apply migrations

# 4. Run (two terminals)
cd server && npm run dev              # Backend → http://localhost:3010
cd client && npm run dev              # Frontend → http://localhost:5173 (proxies API to 3010)
```

**Key directories to know:**
- `server/src/services/` — All business logic (121 files). Start here to understand any feature.
- `server/src/controllers/` — Thin HTTP handlers (68 files). Call services, format responses.
- `server/prisma/schema.prisma` — Database schema (152 models, 27 enums). The source of truth.
- `client/src/pages/` — Route-level components (250+ pages). Organized by role.
- `client/src/lib/` — API clients (api.ts, auth-api.ts, event-api.ts, etc.).
- `eventknit_mobile/lib/domain/usecases/` — Mobile business logic (73 use cases).

**Architecture in one sentence:** React 19 frontend → Express 5 REST API → Prisma ORM → PostgreSQL, with Redis for caching/queues, Socket.IO for real-time, and a Flutter mobile app using Clean Architecture.

**Related systems in this repo:**
- `eventknit/` — **Primary system** (TypeScript, PostgreSQL, active development)
- `eventknit_mobile/` — **Mobile app** (Flutter/Dart, active development)
- `vf-ticket/` — **Legacy system** (JavaScript, MongoDB, maintenance only — not EventKnit)

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
| **Database** | MongoDB (Mongoose) | 8.19+ | Secondary database (analytics, logs) — *legacy from vf-ticket; EventKnit primary uses PostgreSQL only. `mongodb-memory-server` exists in devDependencies for legacy test compat.* |
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
| **Testing** | Vitest | 4.1+ | Unit and integration testing (Vite-native, ESM support) |
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
app.use('/api/v1/contact', publicContactRouter);                      // public — no auth required
app.use('/api/v1/admin/support/contact-queries', adminContactRouter); // ADMIN+ only
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

### Web Design System & Color Palette

**Brand Palette (April 2026):**

| Role | Colors | Usage |
|------|--------|-------|
| **Primary** | White (`--background`) / Black (`--foreground`) | Base surfaces, text, cards — does the heavy lifting |
| **Accent** | Sky blue (`--primary`, `text-sky-500`) | Primary CTA, links, active states, ambient background glows |
| **Secondary** | Emerald green (`text-emerald-500`) | Success states, validation indicators, security feature highlights |
| **Secondary** | Orange (`text-orange-500`) | Tertiary accent, real-time/urgency feature highlights |

**Usage Principles:**
- White/black carries the layout — clean, high contrast, no background noise
- Sky blue is the **dominant accent** (buttons, links, active indicators, ambient glows)
- Emerald and orange appear as **deliberate color moments** — feature pill icons, success states — never as background paint
- Hardcoded Tailwind colors (`sky-500`, `emerald-500`, `orange-500`) are only used for secondary accent icons; all other colors use CSS variable tokens (`text-primary`, `bg-card`, etc.)

### Auth Pages — Design Language (April 2026)

All auth pages share a unified design system:

**Two-Panel Pages (SignIn, SignUp):**
```
[Left 55% — hidden on mobile]          [Right 45% — full width on mobile]
├── bg-background                       ├── bg-background
├── 2x AmbientGlow (blue only,         ├── Opaque card: bg-card, border-border
│   gentle translate drift)            │   rounded-2xl, shadow-sm
├── Logo                                ├── Logo (mobile only)
├── Headline (text-primary accent)      ├── Animated floating-label inputs
├── Description                         │   with icons (Mail, Lock, User)
└── Feature pills with colored icons    ├── Social OAuth (Google, Apple)
    ├── sky-500 (analytics)            ├── Email/password form
    ├── emerald-500 (security)         ├── Success state animation
    └── orange-500 (real-time)         └── Navigation links
```

**Centered Card Pages (ForgotPassword, ResetPassword):**
```
[Full width — centered]
├── bg-background
├── 2x AmbientGlow (blue, subtle)
├── Opaque card: bg-card, border-border, rounded-2xl, shadow-sm
├── Logo (centered)
├── Animated floating-label inputs
├── Password strength meter (ResetPassword)
└── Success state animation
```

**Shared Components:**
- `AmbientGlow` — soft blue glow, translate-only animation (no scale/rotation), `blur-3xl`
- `AnimatedInput` — floating label with icon, border-2 focus state, `framer-motion` transitions
- Feature pills — `bg-card border-border rounded-full`, each icon gets its own secondary color

**Animation Library:** `framer-motion` v12 — used for page entrance, input focus, success states, hover micro-interactions

**Card Styling (all pages):**
- `bg-card` (opaque, not glass/blur)
- `border-border` (solid, not opacity-reduced)
- `shadow-sm` (subtle, not shadow-2xl)
- `rounded-2xl` (not rounded-3xl)

**Button Styling:**
- Primary CTA: `px-5 py-2.5 rounded-lg font-medium text-sm`
- Social buttons: `px-4 py-2.5 rounded-lg border-border`
- Hover: `scale: 1.01, y: -1` (subtle, not bouncy)

### Legal Pages — Shared Component (April 2026)

All legal pages (Terms, Privacy, Cookies) use a shared `LegalPage` component:

**File:** `client/src/components/legal/LegalPage.tsx`

**Features:**
- Animated hero with accent bar (`scaleX` from left, custom easing `[0.16, 1, 0.3, 1]`)
- Sticky TOC sidebar on desktop (`lg:`) with scroll-tracked active section
- Collapsible dropdown TOC on mobile with `AnimatePresence`
- Staggered content sections via `whileInView` (`delay: index * 0.03s`)
- Supports: paragraphs, bullet lists, subsections, callout notes
- Hash-based deep linking preserved (e.g., `/terms-of-service#refund-policy`)
- Uses `MinimalHeader` + `LegalFooter` layout components

**Content Pages (data-only, delegate rendering to LegalPage):**
- `pages/TermsOfService.tsx` — 16 sections, contact: hello@festhub.events
- `pages/PrivacyPolicy.tsx` — 12 sections, contact: privacy@eventknit.com
- `pages/CookiePolicy.tsx` — 9 sections, contact: privacy@eventknit.com

---

## 5. Mobile Application Architecture

### Clean Architecture (All Roles)

The mobile app uses **Clean Architecture across all user roles** — attendee, organizer, and admin. All API calls go through the Dio interceptor chain for automatic auth token injection, 401 token refresh, and request logging.

```
┌─────────────────────────────────────────────────────────────────┐
│              ALL FEATURES (Attendee, Organizer, Admin)           │
│                   Clean Architecture                             │
│                                                                  │
│  Screen (Get.find<Controller>())                                 │
│    → Controller (injected use cases via constructor)             │
│      → UseCase (single-responsibility operation)                 │
│        → Repository interface (domain layer)                     │
│          → RepositoryImpl (data layer)                           │
│            → ApiClient → DioClient (4 interceptors)              │
│                                   ├── API (Remote)               │
│                                   └── Drift DB (Local/offline)   │
└─────────────────────────────────────────────────────────────────┘
```

**9 Repositories:** Auth, Event, Ticket, Scan, Organizer, Admin, Notification, Attendee, ServicePoint
**73 Use Cases:** Covering auth, events, tickets, organizer, attendee, and notification domains
**DI:** `AppBindings` for app-lifetime singletons + `OrganizerBinding`/`AdminBinding` for route-level controllers

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
├── api/                          # Legacy API files (deprecated — kept for backward compat)
│   ├── endpoints.dart            # Centralized URL management + base URL switching
│   └── *.dart                    # Legacy raw HTTP functions (no external consumers)
├── core/
│   ├── bindings/                # GetX dependency injection
│   │   ├── app_bindings.dart    # App-lifetime: repos, use cases, core controllers
│   │   ├── organizer_binding.dart # Route-level: organizer controllers
│   │   └── admin_binding.dart   # Route-level: admin controllers
│   ├── network/
│   │   ├── dio_client.dart      # Dio setup with 4-interceptor chain
│   │   └── interceptors/       # auth, cookie, refresh, logging
│   ├── services/                # Cross-cutting services
│   │   ├── api_client.dart      # ApiClient wrapper (centralized Dio access)
│   │   ├── device_service.dart  # Device identification (device_info_plus)
│   │   ├── storage_service.dart # Secure + fast storage
│   │   ├── database_service.dart # Drift initialization
│   │   ├── push_notification_service.dart # Firebase Cloud Messaging
│   │   └── ...
│   ├── utils/
│   │   └── error_utils.dart     # handleApiError() — classified exception handling
│   └── constants/               # Design tokens (colors, typography, spacing)
├── controllers/                  # App-lifetime GetX controllers
│   ├── auth_controller.dart     # Auth state (use case injection)
│   ├── events_controller.dart   # Event discovery (use case injection)
│   ├── tickets_controller.dart  # Ticket management (use case injection)
│   ├── notifications_controller.dart # Notifications (use case injection)
│   └── theme_controller.dart    # Dark/light mode
├── data/
│   ├── local/database/
│   │   ├── tables/              # Drift table definitions (7 tables)
│   │   └── daos/                # Data access objects
│   └── repositories/            # 9 repository implementations (ApiClient + Dio)
│       ├── auth_repository_impl.dart
│       ├── event_repository_impl.dart
│       ├── ticket_repository_impl.dart
│       ├── scan_repository_impl.dart
│       ├── organizer_repository_impl.dart
│       ├── admin_repository_impl.dart
│       ├── notification_repository_impl.dart
│       ├── attendee_repository_impl.dart
│       └── service_point_repository_impl.dart
├── domain/
│   ├── entities/                # Freezed entity classes
│   ├── repositories/            # 9 repository interfaces (contracts)
│   ├── usecases/                # 73 use cases
│   │   ├── auth/               # Login, register, OAuth, password
│   │   ├── events/             # Discovery, categories, save/unsave
│   │   ├── tickets/            # Purchase, transfer, cancel, wallet pass
│   │   ├── organizer/          # Dashboard, analytics, attendees, refunds, invitations
│   │   ├── attendee/           # Wallet, interests, invoices, reviews, payments, transfers
│   │   └── notifications/      # Get, mark read, delete
│   └── services/
│       └── offline_sync_service.dart  # Core sync engine (595 lines)
├── models/                       # Domain models by feature
│   ├── admin/                   # Admin dashboard, events, users, analytics
│   ├── organizer/               # Dashboard stats, events, attendees, refunds, promo codes
│   ├── attendee/                # Payments, transfers, invoices, verification
│   └── notification/            # Notification, preferences
├── presentation/                 # UI layer by role
│   ├── admin/                   # Admin dashboard, events, scanner, notifications, profile
│   ├── organizer/               # Organizer dashboard, events, scanner, attendees, profile
│   ├── attendee/                # Checkout, registration, tickets, search, event details
│   ├── auth/                    # Login, signup, forgot password
│   ├── public/                  # Discovery (not logged in)
│   └── shared/                  # Reusable widgets
└── workers/
    └── sync_worker.dart         # Background sync (WorkManager)
```

### Dio Interceptor Chain (order matters)

All API calls go through this chain via `ApiClient` → `DioClient`:

```
Request → CookieTokenInterceptor → AuthInterceptor → RefreshTokenInterceptor → LoggingInterceptor → Server
```

1. **CookieTokenInterceptor** — Extracts `refreshToken` from `Set-Cookie` on auth responses (browsers handle this automatically; Dio does not)
2. **AuthInterceptor** — Adds `Authorization: Bearer <accessToken>` to all requests
3. **RefreshTokenInterceptor** — On 401, queues all pending requests, refreshes token via cookie, retries all queued. On refresh failure → clears storage, navigates to login
4. **LoggingInterceptor** — Debug-mode request/response logging with sensitive data masking

Error handling: All repository implementations catch `ApiException`, `SocketException`, `TimeoutException`, and `FormatException` — returning `Either<Failure, T>` to controllers.

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
- `MANUAL_CHECK_IN` / `MANUAL_CHECK_OUT` — Override by staff (minimum role: TELLER)
- `VOID` — Reversal of a check-in by a supervisor (minimum role: ADMIN); resets `checkedInAt`, `isCurrentlyInside`, and `ticketStatus` to their pre-check-in state while creating an immutable audit record

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
| Use Cases | 90% | Critical (business logic isolation) |
| Controllers | 80% | Critical (auth, scanner, events) |
| Repositories | 80% | High (API integration) |
| Services | 90% | Critical (crypto, offline sync) |
| Widgets | 60% | Medium |

**Common Test Pattern (Clean Architecture):**
```dart
void main() {
  late MockLoginUseCase mockLoginUseCase;
  late AuthController controller;

  setUp(() {
    mockLoginUseCase = MockLoginUseCase();
    // Inject mocked use cases — repository layer is NOT tested here
    controller = AuthController(
      loginUseCase: mockLoginUseCase,
      // ... other use cases
    );
    Get.put(controller);
  });

  tearDown(() => Get.reset());

  test('login success', () async {
    when(() => mockLoginUseCase(email: any(), password: any()))
      .thenAnswer((_) async => Right(LoginResult(...)));
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

### Subscription Models

```prisma
model OrganizerSubscription {
  id              String           @id @default(uuid())
  organizerId     String           @unique
  tier            SubscriptionTier @default(BASIC)
  isActive        Boolean          @default(true)
  billingEmail    String?
  expiresAt       DateTime?        // null for BASIC (no expiry)
  nextBillingDate DateTime?
  canceledAt      DateTime?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

model SubscriptionPayment {
  id                   String           @id @default(uuid())
  organizerId          String
  tier                 SubscriptionTier
  amount               Decimal
  currency             String           @default("KES")
  gateway              String           @default("PAYSTACK")
  gatewayReference     String           @unique  // SUB-<organizerId8>-<timestamp>
  gatewayTransactionId String?
  status               String           @default("PENDING")  // PENDING → SUCCESS | FAILED
  billingEmail         String
  paymentDate          DateTime?
  gatewayMetadata      Json?
  idempotencyKey       String?          @unique
  createdAt            DateTime         @default(now())
  updatedAt            DateTime         @updatedAt
  @@index([organizerId])
  @@index([gatewayReference])
  @@index([status])
}

// Seeded on startup by ensureSuperAdmin.ts; editable by admins via the Subscription Plans page.
model SubscriptionPlan {
  id          String           @id @default(uuid())
  tier        SubscriptionTier @unique
  name        String
  description String?
  price       Decimal          @db.Decimal(10, 2)
  currency    String           @default("KES")
  features    String[]         // Gated feature keys enabled at this tier
  isActive    Boolean          @default(true)
}

// Admin-granted tier overrides (e.g., free trials, promotions).
// Elevates the effective tier without modifying the base subscription.
model SubscriptionOverride {
  id          String           @id @default(uuid())
  organizerId String
  tier        SubscriptionTier
  grantedBy   String           // Admin user ID
  reason      String?
  expiresAt   DateTime?        // null = indefinite
  isActive    Boolean          @default(true)
  createdAt   DateTime         @default(now())
}

enum SubscriptionTier {
  BASIC      // Free — up to 3 events, 7.5% platform fee
  STANDARD   // KES 2,999/mo — 5% fee, 16 gated features
  PREMIUM    // KES 8,999/mo — 3% fee, 36 gated features
  ENTERPRISE // KES 25,000+/mo — negotiated 0% fee, all 45 features
}
```

**Effective tier resolution** (`SubscriptionService.getEffectiveTier`):

1. Load `OrganizerSubscription` — if `expiresAt` is past, fall back to `BASIC`.
2. Find the most-recent active, non-expired `SubscriptionOverride` for the organizer.
3. Return whichever is higher by tier order (`BASIC=0 … ENTERPRISE=3`).

**Feature access** (`SubscriptionService.hasFeatureAccess(organizerId, featureKey)`):

Resolves the effective tier, fetches the matching `SubscriptionPlan` from the DB, and returns `plan.features.includes(featureKey)`. The feature key list is maintained by admins through the Feature Registry UI (stored in `SystemSettings` at key `subscription.featureRegistry`).

**Cancel logic**: only tiers with `plan.price > 0` can be canceled — determined by a DB lookup, not a hardcoded tier name. Cancellation marks `isActive = false` and sets `canceledAt`; the subscription remains accessible until `expiresAt`.

### Financial Models

#### Platform Fee Configuration

The platform fee rate and optional limits are read from `SystemSettings` by `PlatformFeeService.getGlobalFeeConfig()` and cached in memory for 5 minutes. Admins update these via the **Platform Fee Config** page, which stores them as JSON under `finance.feePlans` and syncs the active plan's values into the individual `finance.*` keys.

| SystemSettings key | Type | Description |
|--------------------|------|-------------|
| `finance.platformFeePercentage` | number | Active fee percentage (e.g., `7.5`) |
| `finance.minimumFee` | number | Minimum fee in currency units (0 = disabled) |
| `finance.maximumFee` | number | Maximum fee cap (0 = disabled) |
| `finance.fixedFeePerTicket` | number | Fixed add-on per ticket (0 = disabled; reserved) |
| `finance.feePlans` | JSON | Array of saved fee plan configs |
| `finance.activeFeeplanId` | string | ID of the currently active fee plan |

Activating a fee plan immediately writes its values to the individual `finance.*` keys. Call `PlatformFeeService.invalidateFeeConfigCache()` after any admin update so the next fee calculation picks up the new rate.

```prisma
model PlatformFee {
  id               String    @id @default(cuid())
  feeNumber        String    @unique          // PF-YYYY-NNNNNN
  transactionId    String    @unique          // One fee per payment
  grossAmount      Decimal   @db.Decimal(10,2)
  feePercentage    Decimal   @db.Decimal(5,2)
  feeAmount        Decimal   @db.Decimal(10,2)
  organizerAmount  Decimal   @db.Decimal(10,2)
  currency         String    @default("KES")
  status           String    @default("calculated") // calculated → processing → disbursed
  eventId          String?
  registrationId   String?
  disbursementId   String?
  calculatedAt     DateTime  @default(now())
}

model PlatformExpense {
  id             String               @id @default(cuid())
  category       String
  description    String
  amount         Decimal              @db.Decimal(10,2)
  currency       String               @default("KES")
  status         FinancialEntryStatus @default(PENDING)
  paymentMethod  PaymentMethodType?
  recipient      String?
  reference      String?
  taxAmount      Decimal?             @db.Decimal(10,2)
  taxRate        Decimal?             @db.Decimal(5,2)
  notes          String?              @db.Text
  recordedBy     String?
}

model PlatformIncome {
  id             String               @id @default(cuid())
  category       String               // "Platform Fees", "Subscription", etc.
  description    String
  amount         Decimal              @db.Decimal(10,2)
  currency       String               @default("KES")
  source         String?              // "Ticket Sales", "Manual", etc.
  status         String               @default("pending")
  paymentMethod  String?
  eventId        String?              // Links to Event
  transactionId  String?              // Links to EventPaymentTransaction
  reference      String?
  recordedBy     String?
}

model Wage {
  id            String               @id @default(cuid())
  employeeId    String?
  employeeName  String
  department    String?
  position      String?
  staffType     StaffPayType         @default(PERMANENT)
  grossAmount   Decimal              @db.Decimal(10,2)
  amount        Decimal              @db.Decimal(10,2)  // Net pay
  currency      String               @default("KES")
  hoursWorked   Decimal?             @db.Decimal(8,2)
  hourlyRate    Decimal?             @db.Decimal(10,2)
  overtimeHours Decimal?             @db.Decimal(8,2)
  overtimeRate  Decimal?             @db.Decimal(10,2)
  dailyRate     Decimal?             @db.Decimal(10,2)
  eventDays     Int?
  bonuses       Decimal?             @db.Decimal(10,2)
  deductions    Decimal?             @db.Decimal(10,2)
  payPeriod     String               // e.g., "2026-03"
  payDate       DateTime
  status        FinancialEntryStatus @default(PENDING)
  paymentMethod PaymentMethodType    @default(BANK_TRANSFER)
  reference     String?
  notes         String?              @db.Text
  eventId       String?              // Optional link to Event
  createdBy     String?
  @@index([employeeId, payDate, status, department, eventId, staffType])
}

enum StaffPayType { PERMANENT, CONTRACT, EVENT }
enum FinancialEntryStatus { PENDING, COMPLETED, CANCELLED }
```

### Key Enums

```prisma
enum UserRole {
  SUPERADMIN        // Hierarchy: 10
  ADMIN             // 9
  SUPPORT           // 6
  TELLER            // 5
  ORGANIZER         // 4
  ORGANIZER_ADMIN   // 3
  ORGANIZER_TELLER  // 2
  ATTENDEE          // 1
}

enum EventStatus { PENDING, APPROVED, REJECTED, CANCELLED, COMPLETED }
enum TicketStatus { ACTIVE, DEACTIVATED, EXPIRED, CANCELLED }
enum ScanType { CHECK_IN, CHECK_OUT, MANUAL_CHECK_IN, MANUAL_CHECK_OUT, VOID }

enum ManagedClientType {
  CORPORATE    // Private companies and businesses
  NGO          // Non-governmental / non-profit organizations
  GOVERNMENT   // Government bodies and agencies
  PLATFORM     // EventKnit's own events
  OTHER        // Any other client type
}

enum SupportQueryStatus { NEW, IN_PROGRESS, WAITING, RESOLVED, CLOSED }
enum SupportPriority    { LOW, MEDIUM, HIGH, URGENT }
```

### Contact Query Models

```prisma
// Captures public website contact-form submissions (no platform account required)
model ContactQuery {
  id         String             @id @default(cuid())
  name       String
  email      String
  subject    String
  message    String             @db.Text
  status     SupportQueryStatus @default(NEW)
  priority   SupportPriority    @default(MEDIUM)
  assignedTo String?
  resolvedAt DateTime?
  assignedAgent User?                  @relation("AssignedContactQueries", fields: [assignedTo], references: [id], onDelete: SetNull)
  responses     ContactQueryResponse[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Each reply or internal note on a ContactQuery
model ContactQueryResponse {
  id         String   @id @default(cuid())
  queryId    String
  response   String   @db.Text
  sentBy     String
  isInternal Boolean  @default(false)  // true = internal note, not emailed to sender
  sentAt     DateTime @default(now())
  query ContactQuery @relation(fields: [queryId], references: [id], onDelete: Cascade)
  agent User          @relation("ContactQueryResponses", fields: [sentBy], references: [id])
}
```

**Design note:** `ContactQuery` is intentionally separate from `SocialMessage` because social messages require a `socialAccountId` foreign key (a connected social account must exist). Website contact form submissions have no such dependency — the sender has no platform account.

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
SUPERADMIN (10) → ADMIN (9) → SUPPORT (6) → TELLER (5)
→ ORGANIZER (4) → ORGANIZER_ADMIN (3) → ORGANIZER_TELLER (2) → ATTENDEE (1)
```

`requireMinRole(UserRole.ADMIN)` allows ADMIN, SUPERADMIN but blocks SUPPORT and below.

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
| `scan:event` | `{ scanId, registrationId, eventId, scanType, facility, scannedAt, attendeeName, isReEntry }` | Live check-in feed (web dashboard + mobile) |
| `statistics:update` | `{ eventId, checkedInCount, currentlyInside, reEntryCount, checkOutCount }` | Dashboard counters |
| `registration:new` | `{ eventId, attendeeName, ticketType }` | Organizer notifications |
| `payment:received` | `{ eventId, amount, currency }` | Revenue tracking |

> **Room naming:** Clients join `event:{eventId}` via `socket.emit('join:event', eventId)` and leave via `socket.emit('leave:event', eventId)`. Both `scan:event` and `statistics:update` are emitted to this room after every check-in, check-out, or VOID operation.

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

### 7. Typed Route Params Pattern

`@types/express-serve-static-core` types `req.params` as `{ [key: string]: string | string[] }`, which causes TypeScript errors when passing a param directly to a service method that expects `string`.

**Wrong — suppresses the error with a cast:**
```typescript
static async getById(req: AuthenticatedRequest, ...) {
  const id = req.params.id as string; // cast hides the type mismatch
}
```

**Correct — use the generic on `AuthenticatedRequest`:**
```typescript
type IdParam = { id: string };

static async getById(req: AuthenticatedRequest<IdParam>, ...) {
  await SomeService.getById(req.params.id); // narrowed to string — no cast needed
}
```

`AuthenticatedRequest<P = ParamsDictionary>` is designed for exactly this. Define a named type alias for the params shape at the top of the controller file and apply it to each method that reads `req.params`.

**Tech debt note:** Many existing controllers pre-date this pattern and still use `as string` casts. The rule going forward: apply the generic on any new controller, and clean up existing controllers when a file is already being edited for a real feature — not as standalone churn.

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
| Integration tests | `tests/*.test.ts` | 79 files | Slower |

### Running Tests

```bash
npm test                                              # All tests (vitest)
npx vitest run tests/guest-registration-payment.test.ts  # Single test file
npm run test:coverage                                 # With coverage
npm run test:watch                                    # Watch mode
```

### Vitest Configuration

- **ESM support**: Native TypeScript support via vitest
- **Sequential**: `maxWorkers: 1` (prevents database race conditions)
- **Timeout**: 120 seconds per test
- **Force exit**: Prevents hanging from open handles

### Key Test Files

| Test File | Coverage Area |
|-----------|---------------|
| `guest-registration-payment.test.ts` | Guest registration token issuance, public ticket download, guest payment initialization, payment status, user registered events payment fields |
| `ticket.test.ts` | Ticket CRUD, access control, public view |
| `platform-fee.service.test.ts` | Fee calculation, disbursement linking |
| `auth.test.ts` | Login, registration, token refresh, password reset |

### Mocking Patterns

> **Note:** EventKnit uses **Vitest** (not Jest). The mocking API is `vi.mock()` / `vi.fn()` / `vi.clearAllMocks()`. Some legacy test files may still reference `jest.*` — these work because Vitest provides a Jest-compatible API, but new tests should use the `vi.*` namespace.

**Prisma (vitest-mock-extended):**
```typescript
vi.mock('../../../src/config/database.js', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));
```

**Services (for controller tests):**
```typescript
vi.mock('../../../src/services/white-label.service.js', () => ({
  WhiteLabelService: { getAllBrandings: vi.fn(), ... },
}));
```

### Integration Tests (Real Database)

Some test files (e.g., `organizer-subscription.test.ts`, `subscription.service.test.ts`) run against a real PostgreSQL database:

```typescript
// Pattern: check DB connection, skip gracefully if unavailable
beforeAll(async () => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch (_error) {
    dbConnected = false;
  }
});

// Each test guards with:
if (!dbConnected) { console.log('⏭️  Skipping'); return; }
```

**Key patterns for DB-connected tests:**
- Use `cleanupTestData(tx)` in `beforeEach` inside a transaction for test isolation
- Set transaction timeout to 15000ms: `prisma.$transaction(fn, { timeout: 15000 })`
- Use `.com` domains for test emails (Joi rejects `.test` TLD)
- Seed subscription plans with `upsert` and always set `update` clause to restore state (prevents cross-test contamination)
- Focus on service-layer tests; controller tests only when route-level behavior differs from service behavior

### Architecture Rules

1. **Business logic in Services, not Controllers** — Controllers are thin wrappers
2. **Authorization in middleware, not Controllers** — `requireMinRole()` on routes
3. **Services throw typed errors** — `ValidationError`, `NotFoundError`, `AuthorizationError`
4. **AAA pattern** — Arrange → Act → Assert in every test
5. **Test behavior, not implementation** — Assert outcomes, not internal method calls
6. **ESM import paths** — Always use `.js` extensions in mock paths

### Common Pitfalls

- **Forgetting `vi.clearAllMocks()`** (or `jest.clearAllMocks()` in legacy files) in `beforeEach` → state leaks between tests
- **Hardcoding dates** → use `expect.any(Date)` in object matchers
- **Testing implementation details** → verify outcomes, not Prisma call counts
- **Missing `.js` extension** in mock paths → mock silently fails
- **Using `.test` TLD in emails** → Joi's email validator rejects it; use `.com` domains
- **Default transaction timeout** → `cleanupTestData` with many tables can exceed 5s; set `{ timeout: 15000 }`
- **Upsert with empty `update` clause** → prior test modifications persist; always include full state in `update`

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

**Distributed Processing with Optimistic Locking**
- Multi-instance safe: Unique index on `PaymentWebhookEvent.gatewayEventId` ensures single processing across concurrent instances
- Create-before-process pattern: Record webhook event with distributed constraint check before side effects
- Race condition handling: Second concurrent instance attempting same `gatewayEventId` triggers automatic deduplication
- Eliminates side-effect duplication (emails, notifications) even under high concurrency

**Processing Pipeline:**
1. **Signature verification** — HMAC comparison (reject immediately if invalid)
2. **Distributed idempotency lock** — Record in `PaymentWebhookEvent` with constraint-based synchronization
3. **Re-verify with gateway** — Call `verifyPayment(reference)` to confirm amount
4. **Reference routing** — Check reference prefix to determine payment type:
   - `SUB-*` → Route to `SubscriptionService.handleSubscriptionPaymentSuccess()` (subscription payment)
   - Default → Continue with event payment flow
5. **Amount validation with mismatch detection** — Tolerance of ±0.01 (1 cent/kobo); mismatches trigger alert flow
6. **Status updates** — `CONFIRMED` for success; `AMOUNT_MISMATCH` for discrepancies (enables triage)
7. **Transaction recording** — Full audit trail with all gateway verification data
8. **Platform fee calculation** — Atomic `PlatformFeeService.createPlatformFee()` (also auto-records as `PlatformIncome`)
9. **Invoice generation** — Async, non-blocking
10. **Ticket email** — With QR code and calendar invite
11. **Dual notification** — Real-time alerts to organizer and attendee

### Idempotency (Multi-Layer)

| Layer | Mechanism | Guard |
|-------|-----------|-------|
| Payment Init | `idempotencyKey` (unique index) | `{registrationId}-{amount}-{timestamp}` |
| Webhook | `PaymentWebhookEvent.gatewayEventId` (unique) | Prevents duplicate webhook processing |
| Platform Fee | `PlatformFee.transactionId` (unique) | One fee per transaction |
| Auto-Payout | Query-based dedup | Fees with `status='calculated'` AND `disbursementId=null` |
| Fee Linking | `prisma.$transaction` | Atomic create-and-link prevents double-counting |

**Amount Mismatch Detection & Dual-Notification Flow**
- Webhook validates paid amount vs. expected amount with ±0.01 tolerance
- Mismatch detected: Registration status set to `AMOUNT_MISMATCH` (distinct from `PENDING`, enabling visual triage)
- **Attendee notification** — High-priority alert with amount details, reference, and support contact
- **Organizer notification** — High-priority alert with attendee email, reference, and reconciliation action
- **Audit trail** — All mismatch data logged with difference amount and timestamps for investigation
- **Manual recovery** — Webhook event status persisted; operators can retry or adjust via Bull Board dashboard

### Payment Data Visibility by Role

| Data Field | Admin | Organizer (Standard+) | Attendee |
|------------|-------|----------------------|----------|
| Transaction # / Paystack reference | Yes | No | No |
| Payment amount | Yes | Yes | Yes (ticket view + tickets tab) |
| Payment status | Yes | Yes | Yes (ticket view + tickets tab) |
| Payment method | Yes | Yes | Yes (ticket view) |
| Platform fee breakdown | Yes | No | No |
| Organizer payout amount | Yes | No | No |
| Attendee email/name | Yes | Yes (with tier) | Own only |
| Gateway metadata / risk score | Yes | No | No |

**Attendee payment visibility** is surfaced in two places:
1. **Ticket View Page** — fetches `GET /payments/status/:registrationId` and displays status badge, amount, and method
2. **Tickets Tab (Dashboard)** — `getUserRegisteredEvents` now returns `totalAmount`, `paymentStatus`, `paymentMethod`, `isFree`, and `currency` per registration, shown inline on each ticket card

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

### Platform Finance Architecture

The finance system uses a **unified accounting model** built on four core tables that feed into a single P&L view:

```
┌──────────────────────────────────────────────────────────────┐
│                    Finance Dashboard / P&L                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  INCOME                           EXPENSES                   │
│  ├─ PlatformFee (automatic)       ├─ PlatformExpense         │
│  │  (7.5% per ticket sale)        │  (operating costs)       │
│  └─ PlatformIncome (manual+auto)  └─ Wage                    │
│     (subscriptions, fees, other)     (staff compensation)    │
│                                                              │
│  NET PROFIT = Total Income − Total Expenses                  │
└──────────────────────────────────────────────────────────────┘
```

**Services:**

| Service | Responsibility |
|---------|---------------|
| `PlatformExpenseService` | CRUD for operating expenses (infra, marketing, office) |
| `PlatformIncomeService` | CRUD for income entries (manual + auto-recorded platform fees) |
| `WageService` | CRUD for staff wages with pay type, work details, event linking |
| `PlatformFinanceSummaryService` | Aggregates all 4 tables into a comprehensive P&L summary |
| `PlatformFeeService` | Calculates fees per transaction; auto-records income |
| `AdminFinancialService` | Monthly summary with category breakdowns; financial overview |

**API Routes:**

```
/admin/platform-finance/expenses      → PlatformExpense CRUD
/admin/platform-finance/income        → PlatformIncome CRUD
/admin/platform-finance/wages         → Wage CRUD
/admin/platform-finance/summary       → Comprehensive P&L summary
/admin/financial/monthly-summary      → Monthly P&L with category breakdown
/admin/financial/overview             → Financial overview (date-range)
```

### Staff Pay Types (StaffPayType Enum)

```prisma
enum StaffPayType {
  PERMANENT   // Monthly salaried staff — uses grossAmount, deductions
  CONTRACT    // Fixed-term/hourly — uses hoursWorked, hourlyRate, overtimeHours, overtimeRate
  EVENT       // Per-event staff — uses dailyRate, eventDays; linked to event via eventId
}
```

**Wage Model key fields:**
- `staffType` — determines which work detail fields apply
- `grossAmount` / `amount` — gross pay vs net pay (amount = gross − deductions + bonuses)
- `hoursWorked`, `hourlyRate`, `overtimeHours`, `overtimeRate` — for PERMANENT/CONTRACT
- `dailyRate`, `eventDays` — for EVENT type
- `bonuses`, `deductions` — adjustments
- `eventId` — optional FK to Event (required for EVENT type, optional for others)
- `event` relation — includes `{ id, title }` in API responses

### Auto-Income Recording

When `PlatformFeeService.createPlatformFee()` calculates a fee, it automatically creates a `PlatformIncome` record:

```typescript
// Non-critical — wrapped in try/catch so fee creation never fails
await prisma.platformIncome.create({
  data: {
    category: 'Platform Fees',
    description: `Platform fee from transaction ${feeNumber}`,
    amount: feeAmount,
    source: 'Ticket Sales',
    reference: feeNumber,
    paymentMethod: 'paystack',
    eventId: transaction.eventId,
    transactionId: transactionId,
    status: 'received',
  },
});
```

This ensures platform fee revenue appears in the P&L without manual entry. The `PlatformFinanceSummaryService` also directly aggregates from `PlatformFee` records as a secondary source, so revenue is never missed even if the auto-income write fails.

### Comprehensive P&L Summary

`PlatformFinanceSummaryService.getFinanceSummary()` returns:

```typescript
{
  totalIncome,            // manualIncome + platformFeeRevenue
  totalExpenses,          // operatingExpenses + totalWages
  totalWages,             // Sum of Wage.amount (COMPLETED only)
  netProfit,              // totalIncome − totalExpenses
  expenseCount,           // PlatformExpense records
  incomeCount,            // PlatformIncome records
  wageCount,              // Wage records
  platformFeeRevenue,     // Sum of PlatformFee.feeAmount
  manualIncome,           // Sum of PlatformIncome.amount
  totalGrossRevenue,      // Sum of PlatformFee.grossAmount (total ticket sales)
  totalOrganizerPayouts,  // Sum of PlatformFee.organizerAmount
  platformFeeCount,       // PlatformFee records
}
```

The `AdminFinancialService.getMonthlySummary()` adds category breakdowns (`incomesByCategory`, `expensesByCategory`) with "Platform Fees (Ticket Sales)" and "Staff Wages" as automatic categories.

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

### Subscription Payment System

Subscription payments use the same Paystack gateway infrastructure as event payments but with a distinct flow and reference prefix.

**API Routes:**
```
POST /api/v1/organizer-dashboard/subscription/pay     → Initialize payment
GET  /api/v1/organizer-dashboard/subscription/verify   → Verify after callback
POST /api/v1/organizer-dashboard/subscription/upgrade  → Free tier upgrade (no payment)
POST /api/v1/organizer-dashboard/subscription/cancel   → Cancel paid subscription
```

**Payment Flow:**

```
Organizer selects paid tier + billing email
  → POST /subscription/pay
  → SubscriptionService.initializeSubscriptionPayment()
    → Validates: plan exists, is active, price > 0, is an upgrade
    → Creates SubscriptionPayment record (status: PENDING)
    → Initializes Paystack with reference: SUB-{organizerId}-{timestamp}
    → Returns authorization_url
  → Organizer redirected to Paystack checkout
  → Payment completes
  → Paystack webhook → POST /payments/webhook
    → Reference starts with "SUB-" → routed to SubscriptionService
    → handleSubscriptionPaymentSuccess():
      1. Updates SubscriptionPayment status → SUCCESS
      2. Upserts OrganizerSubscription to new tier
      3. Creates PlatformIncome record (category: "Subscription", status: "received")
  → Frontend callback → GET /subscription/verify?reference=SUB-...
    → Verifies payment status, returns updated subscription
```

**Price-Aware Logic:**

All subscription methods check `plan.price` from the database rather than hardcoding tier names:
```typescript
const isPaid = plan ? Number(plan.price) > 0 : false;
```

This means:
- Upgrading to a $0 tier skips payment entirely
- Upgrading to any tier with price > 0 requires Paystack checkout
- Cancellation is only allowed for tiers with price > 0
- Changing a plan's price in the database automatically changes the flow — no code changes needed

**Idempotency:**
- `SubscriptionPayment.gatewayReference` has a unique index
- `handleSubscriptionPaymentSuccess` checks if status is already `SUCCESS` and skips re-processing
- `idempotencyKey` field available for additional deduplication

**Revenue Recording:**
- Successful subscription payments automatically create a `PlatformIncome` record
- Category: `"Subscription"`, status: `"received"`
- Revenue appears on the admin Finance → Income Statement page

---

## 22. Checkout & Registration System

### Registration Paths

**Path A: Authenticated User**
1. `POST /api/v1/events/:id/register` → Creates registration with QR
2. Free → confirmation page; Paid → payment page

**Path B: Guest Checkout (Silent Auto-Login)**
1. `POST /api/v1/events/:id/register-guest`
2. Backend creates a **passwordless user record** for the email (or finds existing user by email)
3. An `accountInvitationToken` (32-byte hex, hashed in DB, 7-day expiry) is generated and embedded in Email 1
4. Backend issues a JWT access token via `AuthService.generateTokens()` — returned in the response as `accessToken`
5. Response returns `{ registration, user, accessToken }` — user includes `requiresPasswordSetup` flag
6. Frontend calls `setAuthFromGuestResponse()` to silently authenticate the guest in-browser
7. Guest is now a fully authenticated user — all subsequent API calls (payment, ticket view, download) work seamlessly
8. **Existing users as guests:** If the email matches an existing account, the same flow applies — the user is found (not created), issued a token, and can proceed to payment. `isNewUser` is `false` in this case.
9. **Fallback (Option B):** If silent auto-login fails for any reason, `PaymentStep` detects `!isAuthenticated` and falls back to the public endpoint `POST /api/v1/payments/initialize-guest` which verifies ownership via email match — no auth needed
10. Account password setup is optional — attendee can set a password later via the link in their email (`GET /auth/create-account?token=...`)

**Public Endpoints for Unauthenticated Access:**

| Endpoint | Method | Purpose | Verification |
|----------|--------|---------|-------------|
| `/tickets/:id/view` | GET | View ticket without auth | Email query param |
| `/tickets/:id/download-public` | GET | Download ticket PDF without auth | Email query param |
| `/payments/initialize-guest` | POST | Initialize payment without auth | Email + registrationId in body |
| `/payments/verify` | GET | Verify payment callback | Reference param (public) |

### Cart & Inventory Locking

| Feature | Detail |
|---------|--------|
| Timeout | 8 minutes per cart reservation |
| Storage | Session-based (guests), userId-based (authenticated) |
| Statuses | `ACTIVE` → `RESERVED` → `ABANDONED`/`EXPIRED` |
| Cleanup | Background job every 8 minutes |

### Payment Reference Format

| Prefix | Format | Use Case |
|--------|--------|----------|
| `EVT-` | `EVT-{registrationId}-{timestamp}` | Event ticket payment |
| `SUB-` | `SUB-{organizerId}-{timestamp}` | Subscription payment |

The prefix determines how the webhook handler routes the payment for processing.

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
- PDF generation protected with timeout; Puppeteer failures don't block ticket delivery

**Robust Email & PDF Handling**
- Email 1 (confirmation): Structured error handling with detailed logging; attendee can request resend if delivery fails
- Email 2 (ticket): Async background processing with independent retry queue
- BullMQ resilience: Jobs survive queue restarts; exponential backoff prevents gateway hammering
- Queue unavailable fallback: Synchronous PDF generation ensures tickets always delivered
- Audit trail: Both emails tracked independently for support troubleshooting and delivery verification

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
5. Authorization → ADMIN role or higher
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
  timestamp: registration.createdAt, // Deterministic: registration time, not current time
};
// Signed with Ed25519 private key → verifiable with public key
// Public key available at GET /api/v1/auth/public-key
```

**Deterministic QR Code Generation**
- QR payload uses registration creation timestamp (not current time), ensuring identical signature across regenerations
- Allows safe QR resend via email without invalidating previously issued codes
- Backup code provides fallback if QR damaged during transmission (10-char alphanumeric)

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

When connectivity returns, scans are uploaded via the full check-in state machine endpoint:

```dart
// POST /api/v1/offline/sync-scans
// Body: { scans: [{ id, registrationId, qrCode, codeType, signatureValid,
//                   scanType, scannedAt, scannedBy, deviceInfo? }] }
// Response: { successCount: 45, failureCount: 1,
//             results: [{ id, status: 'success'|'failed', errorCode?, errorMessage? }] }

// Sync strategy:
// - Per-scan: CHECK_IN / MANUAL_CHECK_IN → WorkstationService.scanTicket()
//             CHECK_OUT / MANUAL_CHECK_OUT → WorkstationService.checkOut()
// - Full state machine runs on each scan:
//     EventRegistration.checkedInAt, isCurrentlyInside, ticketStatus are updated
//     WebSocket statistics:update is emitted to the event room after each success
// - Per-scan results returned (id + status) — partial failure is normal
// - Failed items retained with errorCode for retry or manual resolution
// - eventId is resolved server-side from registrationId (not trusted from mobile payload)
// - Cleanup: synced scans older than 7 days auto-purged

// Legacy endpoint (checkpoint audit only — does NOT update check-in state):
// POST /api/v1/offline/scans/batch
// Use sync-scans for all new integrations.
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

**Minimum role:** `ADMIN` (via `requireMinRole(UserRole.ADMIN)`)

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
- Route: `admin/managed-events` and `admin/managed-events/create` (ADMIN roles)

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

### Notification Bell & Dropdown (Frontend)

All dashboards (admin, organizer, attendee) include a shared `NotificationBell` component in the header:

```typescript
// client/src/components/NotificationBell.tsx
// Features:
// - Real-time unread count via WebSocket (Socket.IO)
//   - Listens to 'notification:new' (increment) and 'unread:count' (authoritative)
// - Fallback polling every 60 seconds via GET /api/v1/notifications/unread-count
// - Click opens inline dropdown panel (not a page navigation):
//   - Fetches 8 most recent notifications via GET /api/v1/notifications?limit=8
//   - Displays icon (by type), title, message preview, relative timestamp
//   - Unread indicator dot per notification
//   - Mark as read individually (PATCH /notifications/:id/read) or all (PATCH /notifications/read-all)
//   - "View all notifications" footer link → role-aware full page
// - Close on outside click
// - Role-aware navigation for "View all":
//   - Admin roles → /admin/notifications
//   - Organizer roles → /organizer/notifications
//   - Attendee → /user/notifications
```

Used in:
- `AdminHeader.tsx` — replaces the previous hardcoded empty notification placeholder
- `OrganizerHeader.tsx` — already used the shared component
- `UnifiedNavbar.tsx` — added for attendee dashboard (between theme toggle and profile)

### Notification Center Pages

Each role has a dedicated full-page Notification Center:

```typescript
// Admin: client/src/pages/admin/AdminNotificationsCenter.tsx
//   Route: /admin/notifications (ALL_ADMIN_ROLES)
//   Filters: event approvals, security alerts, staff assignments, system announcements

// Organizer: client/src/pages/organizer/OrganizerNotificationsCenter.tsx
//   Route: /organizer/notifications (ALL_ORGANIZER_ROLES)
//   Filters: registrations, capacity milestones, payments, approvals/rejections

// Attendee: client/src/pages/user/NotificationsCenter.tsx
//   Route: /user/notifications
//   Filters: event reminders, updates, registrations, payments, system

// Shared features across all centers:
// - Tabs: All / Unread / Read
// - Filter by NotificationType and NotificationPriority
// - Mark as read (individual via PATCH, bulk via PATCH /read-all)
// - Delete (DELETE /notifications/:id)
// - Priority badges: URGENT (red), HIGH (orange), MEDIUM (primary/50), LOW (secondary)
// - Type-specific emoji icons (⏰ reminders, 💳 payments, 📝 registrations, etc.)
```

### Notification Preference System

```typescript
// Per-user configurable settings (NotificationPreference model):
// - Channel toggles: email (on/off), SMS (on/off), push (on/off), in-app (on/off)
// - Category toggles: eventReminders, eventUpdates, eventCancellations,
//   paymentNotifications, marketingEmails, systemAnnouncements,
//   registrationUpdates, staffNotifications
// - Reminder frequency: 'all' | 'daily_digest' | 'weekly_digest' | 'none'
// - Configurable during onboarding (NotificationsScreen.tsx) or via Settings

// API:
// GET  /api/v1/users/me/notification-preferences
// PUT  /api/v1/users/me/notification-preferences

// Email digest processing: email-digest.job.ts (background job)
```

### Email System

**Template-Based Email Generation:**
- Template CRUD with variable substitution (`{{attendeeName}}`, `{{eventTitle}}`, etc.)
- Preview generation before send
- Multiple SMTP provider support (default: Gmail SMTP / MailTrap for dev)
- Email marketing campaigns with segmentation, scheduling, and open/click tracking
- Admin template management at `/admin/communications` (Email Templates tab)

**Two-Email Model for Ticket Purchase:**
1. **Immediate confirmation** — payment received, ticket being prepared
2. **Ticket delivery** — PDF attachment (Content-ID inline) + QR code + calendar invite (.ics)

**Email Audit Log (`EmailLog` model):**

Every email sent through the email service is persisted to the `EmailLog` table for auditing, debugging, and delivery tracking. The log is written fire-and-forget — a database failure never blocks or delays email delivery.

```typescript
// server/src/services/email.service.ts — saveEmailLog()
// Called after every send attempt (success or failure):
//   - On success: logged immediately after transporter.sendMail()
//   - On failure: logged after all retries are exhausted (final attempt only)
//
// Recorded fields:
//   from, to, cc, bcc    — actual recipients (after MailTrap redirect if active)
//   subject, body, text  — email content (HTML body + optional plaintext)
//   attachments          — metadata only: [{ filename, contentType }], never raw content
//   success              — whether the email was delivered
//   attempts             — total send attempts (1 = first try, >1 = retried)
//   errorMessage         — SMTP error on failure, null on success
//   mailTrapped          — true if MailTrap intercepted and redirected the email
//   originalTo           — if mailTrapped, the intended recipient before redirect

// Database indexes: to (recipient lookup), createdAt (time-range queries), success (failure filtering)
```

Key design decisions:
- **Fire-and-forget:** Wrapped in try/catch — `logger.error` only, never throws (email delivery is the priority)
- **MailTrap awareness:** When MailTrap is active, `to` records the test address while `originalTo` preserves the intended recipient, so dev/staging logs remain traceable
- **No raw attachments stored:** Only filename and content type are persisted to keep the table lean; actual attachment content is transient

### Push Notifications

```typescript
// Web Push API with VAPID keys (push-notification.service.ts):
// - GET  /api/v1/push/vapid-public-key — public key for client subscription
// - POST /api/v1/push/subscribe — register browser push subscription
// - POST /api/v1/push/unsubscribe — unsubscribe specific endpoint
// - GET  /api/v1/push/subscriptions — list user's push subscriptions
// - POST /api/v1/push/test — send test notification
// - POST /api/v1/push/broadcast — admin: broadcast to all users
// - Failure tracking with auto-cleanup of stale subscriptions

// Mobile: Firebase Cloud Messaging (FCM) via mobile-push.service.ts
// - Device registration with platform info (iOS/Android, model, OS version)
// - FCM token validation and refresh
// - MobileDevice model tracks status and usage
```

### Admin Bulk Messaging

```typescript
// Admin Communications Page: client/src/pages/admin/CommunicationsPage.tsx
// Route: /admin/communications (MARKETING_ROLES)
// Sidebar: Operations > Communications > Bulk Messaging

// Backend: /api/v1/admin/communications/bulk-messages
// - POST   / — create bulk message
// - GET    / — list with filters (status, type, audience)
// - GET    /:id — get by ID
// - PUT    /:id — update
// - DELETE /:id — delete
// - POST   /:id/send — send immediately
// - POST   /:id/cancel — cancel scheduled

// BulkMessage model fields:
// - title, content, type (announcement | marketing | system | event_update)
// - targetAudience: ALL | ORGANIZERS | ATTENDEES | STAFF | SPECIFIC_EVENT
// - channels: { email, sms, push, inApp } (each boolean)
// - status: DRAFT → SCHEDULED → SENDING → SENT | CANCELLED
// - Delivery tracking: totalRecipients, sentCount, failedCount
// - Engagement: opens, clicks, unsubscribes
// - Scheduling: scheduledAt, sentAt

// Background job: bulk-message-scheduler.job.ts
```

### Organizer Attendee Messaging

```typescript
// Organizer Communication Page: client/src/pages/organizer/AttendeeCommunication.tsx
// Route: /organizer/attendees/communication (NON_TELLER_ROLES)
// Sidebar: Main > Communications > Attendee Messaging

// Three send functions (organizer-dashboard-api.ts):
// - sendToSegment(segmentId, { subject, content, sendEmail?, sendNotification? })
//   POST /api/v1/organizer-dashboard/segments/:id/send
// - sendToTaggedUsers(tagId, { subject, content, sendEmail?, sendNotification? })
//   POST /api/v1/organizer-dashboard/tags/:id/send
// - sendToEventRegistrations(eventId, { subject, content, sendEmail?, sendNotification? })
//   POST /api/v1/organizer-dashboard/events/:id/send

// Communication history:
// - getCommunicationHistory() → GET /api/v1/organizer-dashboard/communications
// - Shows: subject, recipientType, content, sentCount, failedCount, timestamp
```

### Sidebar Navigation for Communications

```
Admin Sidebar (Operations group):
├── Communications (MessageSquare icon)
│   ├── Notifications → /admin/notifications (admin's own notification inbox)
│   └── Bulk Messaging → /admin/communications (send to platform audiences)

Organizer Sidebar (Main group):
├── Communications (MessageSquare icon)
│   ├── Notifications → /organizer/notifications (organizer's notification inbox)
│   └── Attendee Messaging → /organizer/attendees/communication (send to segments/tags/events)

Attendee (UnifiedNavbar):
├── NotificationBell in header → dropdown panel → "View all" → /user/notifications
└── "Messages" menu item → dispatches 'eventknit:open-chat' (opens ChatPanel)
```

### Sliding Chat Panel (Direct Messaging)

The one-to-one messaging interface is a persistent `Sheet` (shadcn/ui slide-over) mounted at layout level, not as a routed page. This keeps the panel alive across navigation and matches the WhatsApp-style industry pattern.

```typescript
// client/src/components/chat/ChatPanel.tsx
//
// Props:
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   onUnreadCountChange?: (count: number) => void   ← parent badge sync
//
// Three views (internal state):
//   'conversations' — list grouped by partner; unread badge per conversation
//   'chat'          — full thread with a single partner; real-time via WebSocket
//   'compose'       — new message form (recipientEmail, subject, content)
//
// WebSocket (Socket.IO):
//   On mount: connects to VITE_API_URL, emits 'join:notifications'
//   Events listened: 'message:new', 'message:read'
//   Reconnects when activePartner changes
//
// Unread count flow:
//   1. fetchConversations() on mount → sets totalUnread
//   2. fetchConversations() again on open → refreshes
//   3. useEffect fires onUnreadCountChange(totalUnread) on every change
//   4. Layout stores the value in chatUnread state → drives ChatPanelTrigger badge

// Mount points (each layout manages chatOpen + chatUnread independently):
//   AdminLayout    → <ChatPanel onUnreadCountChange={setChatUnread} ... />
//   OrganizerLayout→ <ChatPanel onUnreadCountChange={setChatUnread} ... />
//   UserLayout     → <ChatPanel onUnreadCountChange={setChatUnread} ... />  ← added so it persists across /user/* routes

// Opening the panel from anywhere (no prop-drilling needed):
//   window.dispatchEvent(new CustomEvent('eventknit:open-chat'))
//
// Layouts listen:
//   useEffect(() => {
//     const handler = () => setChatOpen(true);
//     window.addEventListener('eventknit:open-chat', handler);
//     return () => window.removeEventListener('eventknit:open-chat', handler);
//   }, []);
//
// Nav links that trigger it:
//   UnifiedNavbar.tsx  — "Messages" menu item
//   ProfileDropdown.tsx — "Messages" dropdown item

// Floating trigger button:
//   ChatPanelTrigger (same file) — fixed bottom-right button with unread badge
//   Rendered in all three layouts alongside ChatPanel
```

**Why a custom event instead of context/props:** The layouts are at three different tree levels. A window event is the simplest decoupled approach — it avoids threading `openChat` through the entire component hierarchy and works from any depth.

### Real-Time Delivery (WebSocket)

```typescript
// WebSocket events for notifications (websocket.service.ts):
// Client → Server:
//   'join:notifications' — join personal notification room
//   'join:event' — join event-specific room
//   'leave:event' — leave event room
//
// Server → Client:
//   'notification:new' — new notification arrived (bell count increments)
//   'unread:count' — authoritative unread count (replaces client state)
//   'scan:new' — live check-in event feed
//   'statistics:update' — real-time dashboard counters
//   'capacity:alert' — zone capacity warning
//   'staff:metrics' — staff performance metrics
```

---

## 35. Attendee Event View Architecture

### Component Hierarchy

```
DashboardMyEvent.tsx (route: /user/event/:id)
  └─ EventAttendeeView.tsx (main shell — header, tabs, notifications panel)
       ├─ EventHome.tsx          (Home tab)
       ├─ EventAgenda.tsx        (Agenda tab)
       ├─ EventSpeakers.tsx      (Speakers tab)
       ├─ EventExhibitors.tsx    (Exhibitors tab)
       ├─ EventMyEvent.tsx       (My Event tab)
       ├─ EventMyBadge.tsx       (My Badge tab)
       └─ NotificationsPanel     (inline slide-over, not a route)
```

All components live in `client/src/components/event-attendee/`.

### Data Flow

```typescript
// DashboardMyEvent.tsx
// 1. Reads eventId from URL params (useParams)
// 2. Fetches event via getEventById() → full event object from API
// 3. Fetches user's registration info via getUserRegisteredEvents()
// 4. Fetches seat allocation via getTicket(registrationId) → SeatInfo
// 5. Transforms raw API response into strongly-typed EventData via transformEventData()
// 6. Passes { event: EventData, user: User } to EventAttendeeView

// EventData includes location extras for map rendering:
// - coordinates?: { lat: number; lng: number }  — used by EventMap iframe
// - address?: string
// - isOnline?: boolean  — suppresses map when true
// - onlineLink?: string
```

### EventAttendeeView Shell

```typescript
// client/src/components/event-attendee/EventAttendeeView.tsx
// State:
//   activeTab: TabKey ('home' | 'agenda' | 'speakers' | 'exhibitors' | 'my-event' | 'my-badge')
//   isNotificationsOpen: boolean (controls slide-over panel)
//   unreadNotifCount: number (fetched on mount via getNotifications({ isRead: false }))
//
// Tab visibility is data-driven — tabs are hidden when the event lacks that content:
//   agenda → event.agenda?.length > 0
//   speakers → event.speakers?.length > 0
//   exhibitors → event.exhibitors?.length > 0
//   home, my-event, my-badge → always visible
//
// Header icons:
//   Message icon → dispatches 'eventknit:open-chat' to open the sliding ChatPanel
//   Bell icon → opens NotificationsPanel (inline slide-over)
//   "See all" in panel → navigates to /user/notifications (NotificationsCenter)
```

### EventHome (Home Tab)

```typescript
// client/src/components/event-attendee/EventHome.tsx
// Layout: 4-column grid — 1 col sidebar (left), 3 col content (right)
// Sections:
//   Hero — bg-cover image with gradient overlay, title, hashtag, date/time/location
//   Sidebar — profile card (avatar, name, title, company) with "Edit" link
//   CountdownStrip — live countdown (d:h:m:s) or "Happening Now" pulse badge
//   Sponsors — grouped by tier (title → community), logos with links
//   Event Details — date range, timezone note, venue, location, description (RichTextContent)
//   Social Links — icon buttons for twitter, facebook, instagram, linkedin, etc.
//   Venue Map — EventMap component (Google Maps embed via coordinates or text search)
//              — "Get Directions" button opens Google Maps in new tab
//              — Hidden when event.isOnline is true
```

### EventMyEvent (My Event Tab)

```typescript
// client/src/components/event-attendee/EventMyEvent.tsx
// Layout: 3-column grid — 1 col sidebar (left, order-1), 2 col content (right, order-2)
//
// Sidebar:
//   Profile card with registration status chip (emerald)
//   Quick Actions: Add to Calendar (Google Calendar URL), Share (Web Share API),
//     Download Ticket (downloadTicketPDF), All Notifications (→ /user/notifications),
//     Contact Organizer (opens Dialog with subject + message fields → sendMessage API)
//
// Content:
//   Registration banner — emerald gradient bg, "You're Registered" with event status badge
//   Summary cards — date, location, time in rounded boxes
//   Registration Details — ticket type, ID, backup code, date in grid
//   Seat Allocation — seat identifier, section, row in colored boxes
//   Event Details — full date/time/venue/description
//   Event Announcements — notifications filtered by event.id, mark all read, refresh
//
// API calls:
//   getNotifications({ eventId, limit: 20 })
//   markAllAsRead()
//   downloadTicketPDF(registrationId)
//   sendMessage({ recipientId: organizerId, subject, content, eventId })
```

### EventMyBadge (My Badge Tab)

```typescript
// client/src/components/event-attendee/EventMyBadge.tsx
// Fetches: getTicket(registrationId) → TicketData (qrCode, backupCode, ticketType, seat)
// Fallbacks: if ticket API fails, renders badge with data from EventData props
// Error handling: non-blocking muted info bar ("Ticket details unavailable")
//
// Badge card structure:
//   Header — primary bg with event title, date, venue
//   Body (bg-card) — avatar, name, title, company, ticket type badge,
//     seat allocation strip (if assigned), QR code (or placeholder), badge code
//   Footer — event hashtag
//
// Actions: Download (downloadTicketPDF), Print (window.print), Share (navigator.share)
// Dark mode: all colors use theme tokens (bg-card, text-foreground, text-muted-foreground)
// Print styles: @media print hides action buttons, centers badge
```

### Shared Types

```typescript
// Exported from EventAttendeeView.tsx:
interface EventData {
  id: string; title: string; description?: string; fullDescription?: string;
  date: string; endDate?: string; time?: string;
  location: string; venue?: string; address?: string;
  coordinates?: { lat: number; lng: number }; isOnline?: boolean; onlineLink?: string;
  type: string; image?: string; category?: string;
  status?: 'upcoming' | 'ongoing' | 'completed';
  registrationDate?: string; organizer?: string; organizerId?: string;
  speakers?: Speaker[]; sponsors?: Sponsor[]; exhibitors?: Exhibitor[]; agenda?: AgendaItem[];
  socialLinks?: Record<string, string>; hashtag?: string;
  registrationId?: string; ticketType?: string; backupCode?: string; seat?: SeatInfo;
}

interface User { name: string; email: string; initials: string; profileImage?: string; company?: string; title?: string; }
interface SeatInfo { seatIdentifier: string; sectionId?: string; rowLabel?: string; seatLabel?: string; seatType: string; reservationStatus: string; }
```

---

## 36. Ticket Transfer & Resale Marketplace

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

## 37. Distributed Locking & Concurrency Control

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
| **Hard failure on lock miss** | If Redis is unavailable or lock cannot be acquired after retries, the scan is **rejected** with error code `LOCK_FAILED` — the caller must retry. This prevents double check-in at the cost of a retryable error (preferred over silent data corruption). |

### Where Locking is Used

- **Ticket check-in / check-out** — Lock key `scan:{registrationId}:{eventId}`; prevents duplicate check-in across concurrent scanner stations and offline sync uploads
- **Void check-in** — Same lock key; prevents race between a void and a concurrent re-scan
- **Seat reservation** — Prevents two users from reserving the same seat
- **Cart checkout** — Prevents double-processing of the same order
- **Payment processing** — Ensures idempotent payment initialization
- **Ticket inventory** — Atomic decrement of available ticket count
- **Promo code redemption** — Prevents usage count race conditions

---

## 38. Audit Logging & GDPR Compliance

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

## 39. Granular Permission System

### Beyond Simple RBAC

EventKnit implements **fine-grained permissions** on top of role-based access control. While roles (10 levels) provide broad access, permissions enable precise control for staff members.

### Role Hierarchy (Numeric Levels)

```typescript
// privileges.ts
const ROLE_LEVELS = {
  SUPERADMIN: 10,
  ADMIN: 9,
  SUPPORT: 6,
  TELLER: 5,
  ORGANIZER: 4,
  ORGANIZER_ADMIN: 3,
  ORGANIZER_TELLER: 2,
  ATTENDEE: 1,
};

// Privilege checks:
canCreateRole(creatorRole, targetRole)  // Can this role create that role?
canModifyUser(actorRole, targetRole)    // Can this role modify that user?
canManageStaff(role)                    // Can this role manage staff?
canAccessAllEvents(role)               // Cross-event access check
isPlatformAdmin(role)                  // SUPERADMIN | ADMIN
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
// Staff roles (ORGANIZER_ADMIN, ORGANIZER_TELLER): checked against PermissionService effective permissions
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

## 40. Social Media Integration

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

## 41. Attendee Management & Segmentation

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

## 42. Digital Wallet, Credits & Invoicing

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

## 43. Dynamic Pricing Engine

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

## 44. Batch Export & Data Operations

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

## 45. CI/CD Pipelines & DevOps

### GitHub Actions Workflows

**8 workflow files** in `.github/workflows/`:

| Workflow | Trigger | Services | Steps |
|----------|---------|----------|-------|
| `server-ci.yml` | Push/PR to main, development, staging | Postgres 16, Redis 7 (commented out) | Lint → Type-check → Build (tests commented out for faster deploys) |
| `client-ci.yml` | Push/PR to main, development, staging | None | Lint → Type-check → Build (tests commented out for faster deploys) |
| `server-deploy-staging.yml` | Push to `staging` | — | Build → Deploy to staging (tests commented out) |
| `client-deploy-staging.yml` | Push to `staging` | — | Build → Deploy to staging (tests commented out) |
| `server-deploy-production.yml` | Push to `main` | — | Build → Deploy to production (tests commented out) |
| `client-deploy-production.yml` | Push to `main` | — | Build → Deploy to production (tests commented out) |

> **Note:** Test steps across all CI/CD workflows are currently commented out (not deleted) to speed up deployments. Linting, type-checking, and build steps remain active. Tests can be re-enabled by uncommenting the relevant steps in each workflow file.

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

## 46. Port Configuration

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

## 47. Post-Event Survey System

EventKnit provides a **Post-Event Survey System** that allows organizers to design custom surveys for their events, collect structured feedback from attendees, and analyze results. This system is distinct from the existing EventReview (public star ratings) and EventFeedback (platform-level NPS) systems — it gives organizers full control over what questions are asked.

### 47.1 Architecture Overview

The survey system introduces two new Prisma models:

```
EventSurvey ──────── belongs to ──────── Event
     │                                      │
     │ has many                             │ has many
     ▼                                      ▼
SurveyResponse ──── belongs to ──── User (attendee)
     │
     └──── validated against ──── EventRegistration
```

- **EventSurvey** — One survey per event, created by the event organizer or an admin (for managed events). Defines which sections are active and holds custom questions.
- **SurveyResponse** — One response per attendee per survey. Stores all answers (ratings, NPS score, custom question responses, comment).

The survey is only available after an event's `endDate` has passed and the attendee must have a confirmed `EventRegistration` for that event.

### 47.2 Database Schema

**EventSurvey**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String` (cuid) | Primary key |
| `eventId` | `String` (unique) | Foreign key to `Event` |
| `overallRatingEnabled` | `Boolean` | Always `true` — overall star rating is mandatory |
| `npsEnabled` | `Boolean` | Toggle for "How likely to recommend?" (0-10) |
| `categoryRatingsEnabled` | `Boolean` | Toggle for 5 predefined category ratings |
| `customQuestions` | `Json` | Array of up to 5 custom questions |
| `isActive` | `Boolean` | Whether the survey is accepting responses |
| `createdAt` | `DateTime` | Creation timestamp |
| `updatedAt` | `DateTime` | Last update timestamp |

**SurveyResponse**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String` (cuid) | Primary key |
| `surveyId` | `String` | Foreign key to `EventSurvey` |
| `userId` | `String` | Foreign key to `User` (respondent) |
| `overallRating` | `Int` | 1-5 star rating (required) |
| `npsScore` | `Int?` | 0-10 NPS score (if NPS section enabled) |
| `venueRating` | `Int?` | 1-5 (if category ratings enabled) |
| `organizationRating` | `Int?` | 1-5 (if category ratings enabled) |
| `contentRating` | `Int?` | 1-5 (if category ratings enabled) |
| `valueRating` | `Int?` | 1-5 (if category ratings enabled) |
| `communicationRating` | `Int?` | 1-5 (if category ratings enabled) |
| `customAnswers` | `Json` | Answers to custom questions |
| `comment` | `String?` | Free-form comment |
| `createdAt` | `DateTime` | Submission timestamp |

**Unique constraint:** `@@unique([surveyId, userId])` — one response per attendee per survey.

### 47.3 API Endpoints

All endpoints are under `/api/v1/`:

**Backend API Endpoints:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/surveys` | Authenticated | Create survey for an event |
| `PUT` | `/api/v1/surveys/:surveyId` | Authenticated | Update survey configuration |
| `DELETE` | `/api/v1/surveys/:surveyId` | Authenticated | Delete survey (only if zero responses) |
| `GET` | `/api/v1/surveys/event/:eventId` | Authenticated | Get survey config for organizer view |
| `GET` | `/api/v1/surveys/event/:eventId/results` | Authenticated | Get aggregated results with NPS breakdown |
| `GET` | `/api/v1/surveys/event/:eventId/public` | Authenticated | Get survey form for attendee |
| `POST` | `/api/v1/surveys/:surveyId/respond` | Authenticated | Submit survey response |
| `GET` | `/api/v1/admin/surveys` | Admin | List all surveys platform-wide |

**Frontend Routes:**

| Route | Role | Description |
|-------|------|-------------|
| `/events/:eventId/survey` | Public (attendee) | Standalone survey page linked from email |
| `/organizer/event/:eventId/survey` | Organizer | Survey creation, configuration, and results |
| `/admin/events/:eventId/survey` | Admin | Survey management for managed events (reuses organizer component) |

**Authorization (enforced in service layer):**
- `createSurvey`, `updateSurvey`, `deleteSurvey` verify the caller is the event organizer, managed event admin, or a platform admin (SUPERADMIN/ADMIN role)
- Attendees can only view and respond to surveys for events they have a confirmed registration for
- Duplicate submissions are rejected (unique constraint on `surveyId` + `attendeeId`)

**Automatic Trigger:**
- `PostEventSurveyJob` runs hourly, finds events that ended 23–25 hours ago, and sends in-app notifications + emails to all confirmed attendees with a link to `/events/{eventId}/survey`
- Prevents duplicate sends with a 48-hour deduplication window

### 47.4 Survey Structure

A survey has three fixed sections and a custom questions section:

**Fixed Sections:**

1. **Overall Rating** (always enabled)
   - 1-5 star rating
   - Cannot be toggled off

2. **NPS Score** (toggleable via `npsEnabled`)
   - "How likely are you to recommend this event?" (0-10 scale)
   - Used for Net Promoter Score calculation

3. **Category Ratings** (toggleable via `categoryRatingsEnabled`)
   - Five predefined categories, each rated 1-5 stars:
     - Venue & Location
     - Organization & Logistics
     - Content & Programming
     - Value for Money
     - Communication & Updates

**Custom Questions (max 5):**

Stored as JSON array in `customQuestions`. Each question object:

```json
{
  "id": "q1",
  "type": "multiple_choice | text | rating",
  "question": "How did you hear about this event?",
  "options": ["Social media", "Friend", "Email", "Other"],
  "required": true
}
```

| Question Type | Answer Format | Notes |
|--------------|---------------|-------|
| `multiple_choice` | Single selected option string | `options` array required (2-6 choices) |
| `text` | Free-form string | Max 500 characters |
| `rating` | Integer 1-5 | Star rating scale |

### 47.5 NPS Calculation

Net Promoter Score is calculated from all responses where `npsScore` is present:

| Score Range | Category | Description |
|-------------|----------|-------------|
| 9-10 | Promoters | Enthusiastic supporters likely to recommend |
| 7-8 | Passives | Satisfied but not enthusiastic |
| 0-6 | Detractors | Unlikely to recommend, may discourage others |

**Formula:**

```
NPS = ((promoterCount - detractorCount) / totalResponses) * 100
```

**Range:** -100 (all detractors) to +100 (all promoters)

The `/survey/results` endpoint returns the NPS score along with a breakdown of promoter, passive, and detractor counts and percentages.

### 47.6 Results Aggregation

The results endpoint (`GET /organizer/events/:eventId/survey/results`) returns:

- **Response count** — Total submissions and response rate (vs. total registrations)
- **Overall rating** — Average and distribution (count per star)
- **NPS** — Score, breakdown by category (promoters, passives, detractors)
- **Category averages** — Average rating per category (venue, organization, content, value, communication)
- **Custom question summaries** — For multiple choice: option counts; for text: all responses; for rating: average
- **Individual responses** — Paginated list of full responses with respondent info

### 47.7 Relationship to Existing Feedback Systems

EventKnit has three distinct feedback mechanisms:

| System | Purpose | Created By | Scope |
|--------|---------|-----------|-------|
| **EventReview** | Public star ratings and reviews visible on the event page | Attendees (self-initiated) | Public-facing event reputation |
| **EventFeedback** | Platform-level NPS and satisfaction survey | Platform (automated post-event emails) | Platform improvement metrics |
| **EventSurvey** | Custom organizer-designed surveys with structured questions | Organizers (manual creation) | Event-specific insights for organizers |

Key differences:
- **EventReview** is public and attendee-initiated — it appears on the event listing for future attendees to see
- **EventFeedback** is platform-operated — it measures satisfaction with EventKnit itself, not the event
- **EventSurvey** is organizer-controlled — the organizer decides which questions to ask and only they see the results

---

## 48. Financial Data Integrity Standards

This section codifies the standards that govern how EventKnit stores, processes, and protects financial data. Every engineer working on payment-related features must understand and follow these patterns.

### 48.1 Currency Value Storage

All monetary values in EventKnit use `Decimal @db.Decimal(10, 2)`, which maps to PostgreSQL's `NUMERIC(10, 2)` type. This applies to 20+ money fields across the schema, including ticket prices, payment amounts, refund amounts, disbursement totals, platform fees, and credit balances.

**Rules:**
- **Never use `Float` or `Int` for monetary values.** Floating-point arithmetic introduces rounding errors (e.g., `0.1 + 0.2 !== 0.3` in IEEE 754). Integer-cents representations add unnecessary conversion complexity.
- Prisma's `Decimal` type maps to JavaScript `Decimal.js` objects at runtime. These are arbitrary-precision and safe for arithmetic.
- When a monetary value needs to be sent to the frontend or serialized to JSON, convert with `Number()` for display. The two-decimal-place constraint at the database level ensures precision is preserved.
- All arithmetic on monetary values (totals, fee calculations, splits) should be performed using `Decimal.js` methods or at the database level — never with native JavaScript `number` math.

### 48.2 Currency Code Storage (ISO 4217)

All currency code fields are constrained to `@db.VarChar(3)` at the database level, storing standard 3-letter ISO 4217 codes.

**Supported currencies:** KES (default for payments), USD, NGN, EUR, GBP, UGX, TZS.

**Rules:**
- Currency conversion is delegated to the frontend — the backend stores amounts in their original transaction currency. A ticket priced in USD is stored as USD; a ticket priced in KES is stored as KES.
- Joi validation on currency inputs must enforce `Joi.string().length(3).uppercase()` to reject malformed codes before they reach the database.
- The `VarChar(3)` constraint acts as a secondary safety net at the database level, but validation should always catch invalid codes at the application layer first.

### 48.3 ACID Transaction Patterns

All critical financial operations are wrapped in `prisma.$transaction()` to guarantee atomicity. If any step fails, the entire operation rolls back — no partial state is ever persisted.

**Operations that require transactions:**

| Operation | Steps inside transaction |
|-----------|------------------------|
| **Payment success** | Registration status update + capacity adjustment + seat confirmation |
| **Payment failure** | Registration cancellation + capacity restoration + seat release |
| **Ticket transfer** | New registration creation + line item copy + seat transfer + old ticket void |
| **Credit operations** | Balance update + transaction record (always atomic) |
| **Seat reservation** | Row-level locking with `SELECT ... FOR UPDATE` to prevent double-booking |
| **Payment initialization** | Idempotency check + registration lookup (prevents TOCTOU race conditions) |

**Concurrency control strategy:**
- **Low-contention paths** (webhooks, refunds, idempotency checks): Optimistic Concurrency Control — no upfront locks, detect conflicts at write time via unique constraints or precondition checks (see Glossary: *Optimistic Locking*, *Optimistic Concurrency Control*)
- **High-contention paths** (seat reservation during peak sales): Pessimistic locking — `SELECT ... FOR UPDATE` acquires row-level locks before modification (see Glossary: *Pessimistic Locking*)

**Timeout policy:**
- Complex operations (multi-step payment flows, transfers): 30-second timeout
- Simple operations (single-record updates): Prisma default timeout

### 48.4 Double-Charge & Duplicate Payment Protection

EventKnit implements multiple layers of protection against duplicate financial operations:

**Deterministic idempotency keys:**
- Generated as `${registrationId}-${amount}` — no timestamp component, so the same logical request always produces the same key.
- Clients can provide explicit keys for custom deduplication scenarios.
- The `EventPaymentTransaction` model has a `idempotencyKey @unique` constraint, so duplicate payment initializations are caught at the database level with a unique violation error.

**Webhook deduplication:**
- The `PaymentWebhookEvent` model stores a unique `gatewayEventId` for every webhook received.
- Uses optimistic insert: the handler attempts to insert the webhook event, and if a `P2002` unique constraint violation is thrown, the webhook is recognized as a duplicate and skipped.
- This pattern handles concurrent webhook deliveries from payment gateways that retry aggressively.

**Refund double-processing prevention:**
- Refund processing uses `updateMany` with a status precondition (`WHERE status = 'pending'`) as an optimistic lock.
- Only the first request gets `count === 1` and proceeds; the second request gets `count === 0` and fails gracefully without processing the refund again.
- If the refund gateway call fails after the status update, the transaction rolls back, restoring the `pending` status for retry.

**Amount validation:**
- The webhook handler validates that the received payment amount matches the expected amount with a tolerance of ±0.01 (to account for minor gateway rounding).
- Mismatched amounts trigger an alert and the payment is flagged for manual review rather than automatically confirmed.

### 48.5 Audit Trail — Gaps Found & Resolved (March 2026)

This subsection documents the financial integrity gaps discovered during the March 2026 audit and how each was resolved. It serves as a reference for future audits.

#### Currency Value Storage

| Field | Before | After |
|-------|--------|-------|
| `SubscriptionPlan.price` | `Decimal @default(0)` (no precision) | `Decimal @default(0) @db.Decimal(10, 2)` |
| `SubscriptionPayment.amount` | `Decimal` (no precision) | `Decimal @db.Decimal(10, 2)` |

The remaining 20 money fields already had `@db.Decimal(10, 2)`. No fields used `Float` for money.

#### Currency Code Storage

**Gap:** All 20 currency fields were `String` with no length constraint — a value like `"BITCOIN"` would be accepted by the database.

**Fix:** Added `@db.VarChar(3)` to all 20 currency fields, enforcing 3-character ISO 4217 codes at the database level.

#### ACID Transactions

| Operation | Gap | Fix |
|-----------|-----|-----|
| `initializePayment` | Idempotency key lookup and registration fetch were separate queries — two concurrent "Pay" clicks could both pass the check | Wrapped both queries in a single `prisma.$transaction()` |
| `processRefund` | Status check (`status === 'pending'`) and Paystack call were separate — two admins could both trigger duplicate refunds | Replaced with `updateMany WHERE status = 'pending'` (optimistic lock) — only first request gets `count === 1`. Added rollback to `pending` if gateway call fails |

34 other critical operations already used `$transaction` correctly.

#### Double-Charge Protection

**Gap:** The auto-generated idempotency key included `Date.now()`, making every request unique and defeating the purpose of idempotency entirely.

| Before | After |
|--------|-------|
| `${registrationId}-${amount}-${Date.now()}` | `${registrationId}-${amount}` |

Now the same registration + amount always produces the same key, so rapid duplicate clicks return the existing pending/completed payment.

**Already working correctly (no changes needed):**
- Webhook deduplication via `PaymentWebhookEvent.gatewayEventId` unique constraint with optimistic insert
- Amount mismatch detection (±0.01 tolerance)
- `paymentStatus === 'COMPLETED'` early return in webhook handler

---

## 49. Glossary

| Term | Definition |
|------|-----------|
| **Access Token** | Short-lived JWT (15 min) for API authentication |
| **Refresh Token** | Long-lived token (7–30 days) stored in HTTP-only cookie for session persistence |
| **RBAC** | Role-Based Access Control — 8 roles with numeric hierarchy |
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
| **Platform Fee** | 7.5% all-in fee on paid ticket sales (absorbs gateway processing costs); auto-recorded as `PlatformIncome` |
| **StaffPayType** | Enum: `PERMANENT` (monthly salary), `CONTRACT` (hourly/fixed-term), `EVENT` (daily rate × event days) |
| **Auto-Income** | Automatic `PlatformIncome` creation when a platform fee is calculated — ensures fee revenue in P&L without manual entry |
| **Comprehensive P&L** | Summary aggregating `PlatformFee` + `PlatformIncome` + `PlatformExpense` + `Wage` into a unified financial view |
| **Disbursement** | Payout from platform to organizer after grace period |
| **KYC** | Know Your Customer — identity verification required for paid event payouts |
| **White Label** | Customizable branding that replaces EventKnit's identity with the organizer's |
| **Cart Reservation** | 8-minute inventory lock during checkout to prevent overselling |
| **Backup Code** | 10-character alphanumeric fallback for QR code scanning |
| **Deterministic Idempotency Key** | An idempotency key derived from stable business identifiers (e.g., `${registrationId}-${amount}`) rather than transient values like timestamps. Because the same logical request always produces the same key, duplicate requests (e.g., user double-clicking "Pay") are automatically caught by the database unique constraint — the second request finds the existing record and returns it instead of creating a new payment. Contrast with timestamp-based keys (`${id}-${Date.now()}`) which generate a unique key per request and defeat idempotency entirely. |
| **Deterministic QR Code** | QR code payload using fixed registration timestamp (not current time), ensuring identical signatures across regenerations. Prevents invalidation when QR is resent or refreshed post-delivery |
| **Optimistic Locking** | Concurrency control strategy that assumes conflicts are rare and checks for them at write time rather than acquiring locks upfront. EventKnit uses two variants: **(1) Insert-based** — attempt INSERT with unique constraint; catch P2002 violation to detect duplicate (used for webhook dedup via `PaymentWebhookEvent.gatewayEventId`). **(2) Precondition-based** — use `updateMany` with a WHERE condition on the current state; if `count === 0`, another process already changed the state (used for refund processing: `WHERE status = 'pending'`). Both patterns are lock-free and scale across multiple server instances. |
| **Optimistic Concurrency Control (OCC)** | The broader design principle behind optimistic locking. Instead of pessimistic locking (acquire lock → read → write → release), OCC follows: read → compute → write-with-precondition → retry-on-conflict. EventKnit applies OCC throughout its financial operations: payment initialization (deterministic idempotency key), webhook processing (unique gateway event ID), refund processing (status precondition), and seat reservation (row-level `FOR UPDATE` for the pessimistic fallback where contention is high). The choice between optimistic and pessimistic depends on contention: low contention (webhooks, refunds) → optimistic; high contention (seat selection during popular event sales) → pessimistic with `FOR UPDATE`. |
| **Pessimistic Locking** | Concurrency control that acquires exclusive locks before reading/writing. Used in EventKnit for seat reservation (`SELECT ... FOR UPDATE` in `SeatAllocationService.reserveSeats`) where contention is high during popular event ticket sales. Trades throughput for correctness in hot-path scenarios. |
| **Amount Mismatch Detection** | Webhook validation flow that detects payment amount discrepancies vs. expected amount with configurable tolerance (±0.01). Triggers dual-notification (attendee + organizer) and sets registration status to `AMOUNT_MISMATCH` for triage |
| **Webhook Race Condition Prevention** | Multi-instance safe webhook processing via distributed constraint on `PaymentWebhookEvent.gatewayEventId`. Concurrent instances attempting same webhook triggers atomic constraint violation, ensuring single processing and preventing side-effect duplication |
| **Email Resilience** | Dual-email model with independent queue fallback: If BullMQ unavailable, PDF generation handles synchronous fallback; Puppeteer timeouts prevent job hanging; structured error logging enables manual resend |
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

---

## 50. Homepage Event Discovery Architecture

### Overview

The homepage (`client/src/pages/index.tsx`) is the primary event discovery surface. It coordinates three sections — Hero, Popular This Week, and the full Event Grid — through a shared filter state that lives at the page level.

### Filter State Ownership

`SearchFilters` state is owned by `Index` and passed down:

```
Index (owns SearchFilters state)
├── EventSearchFilter   ← reads + writes filters
├── PopularThisWeek     ← receives onSeeAll callback
└── EventGrid           ← reads filters, fetches from API
```

This means any section can trigger a filter change without owning state itself.

### "See All" from Popular This Week

Clicking "See All" on the Popular This Week carousel does **not** navigate to a separate page. It:

1. Sets `dateRange: 'this-week'` on the shared filter state
2. Scrolls to `#search-section` (the EventSearchFilter anchor)

This pre-populates the filter bar and re-fetches the event grid — reusing all existing infrastructure. Implemented via an `onSeeAll` prop passed from `Index` to `PopularThisWeek`.

### Carousel Arrow Navigation

`PopularThisWeek` tracks scroll position via `onScroll` to conditionally show/hide left and right arrow buttons:

- `canScrollLeft` / `canScrollRight` state derived from `scrollLeft`, `scrollWidth`, `clientWidth`
- Arrows fade in on section hover (`group/popular` + `group-hover/popular:opacity-100`)
- Scroll amount = one card width + gap (16px), smooth behavior

### Location & Geographic Discovery

**Current behaviour:** All approved public events are returned with no geographic filter. Client-side filtering accepts a free-text `location` string matched against `event.location` and `event.venue`.

**Design decision — no IP geolocation auto-filter:**

IP geolocation is not used as a default filter for the following reasons:
- IP accuracy in East Africa is inconsistent (mobile data IPs frequently resolve to the wrong city or country)
- Silent auto-filtering frustrates users who cannot see why events are missing
- The platform's initial market (Kenya + East African countries) is compact enough that showing all events is not overwhelming

**Planned implementation — explicit city selector:**

A city/country chip filter will be added to `EventSearchFilter` with preset options matching the platform's primary markets:

```
Nairobi · Mombasa · Kampala · Dar es Salaam · Kigali · Addis Ababa · All Cities
```

Selection is persisted to `localStorage` (`eventknit-location-preference`) so it survives page refreshes. On first visit with no stored preference, all events are shown.

**Optional first-visit hint:** IP geolocation may be used as a *suggestion only* — a dismissible banner ("Showing events near Nairobi — change?") — not as a silent filter. The user retains full control.

---

## 51. Company Documents

### Overview

The Company Documents module provides admin staff with a centralised internal document repository. It supports two storage strategies: direct file uploads to Cloudinary and saved links to external services (Google Docs, Google Sheets, Google Slides, or arbitrary URLs).

### Database Schema

```prisma
enum CompanyDocCategory {
  LEGAL
  FINANCIAL
  HR
  OPERATIONS
  MARKETING
  MEETING_NOTES  // Added: internal meeting minutes and Google Meet/Zoom recordings
  COMPLIANCE
  CONTRACTS
  POLICIES
  OTHER
}

enum CompanyDocType {
  FILE
  GOOGLE_DOC
  GOOGLE_SHEET
  GOOGLE_SLIDES
  EXTERNAL_LINK
}

model CompanyDocument {
  id                 String              @id @default(cuid())
  name               String
  description        String?
  category           CompanyDocCategory
  type               CompanyDocType
  fileUrl            String?
  cloudinaryPublicId String?
  externalUrl        String?
  fileName           String?
  fileSize           Int?
  mimeType           String?
  uploadedById       String
  uploadedBy         User                @relation("UploadedDocuments", fields: [uploadedById], references: [id])
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt

  @@index([category])
  @@index([type])
  @@index([uploadedById])
}
```

### Architecture

Follows the standard Route -> Controller -> Service pattern with auth enforced in middleware:

```
POST /api/v1/admin/company-documents/upload
  authenticate middleware (JWT verification)
  requireMinRole(ADMIN_STAFF) middleware
  uploadSingleDocument middleware (Multer, 25 MB limit)
  CompanyDocumentsController.uploadFile
    CompanyDocumentsService.uploadFile
      cloudinaryService.uploadBuffer (resource_type: 'raw' for non-image, 'image' for images)
      prisma.companyDocument.create
```

### File Upload Implementation

Multer is configured with `memoryStorage()` so files are held in memory as `Buffer` objects and piped directly to Cloudinary without touching disk:

```typescript
// server/src/utils/upload.ts
const documentFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = [
    'image/', 'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml',
    'text/plain', 'text/csv',
  ];
  const ok = allowed.some(prefix => file.mimetype.startsWith(prefix));
  cb(null, ok);
};

export const documentUpload = multer({ storage: multer.memoryStorage(), fileFilter: documentFilter, limits: { fileSize: 25 * 1024 * 1024 } });
export const uploadSingleDocument = documentUpload.single('file');
```

Cloudinary upload uses `resource_type: 'raw'` for non-image files so they are preserved without transcoding:

```typescript
const resourceType = file.mimetype.startsWith('image/') ? 'image' : 'raw';
const result = await cloudinaryService.uploadBuffer(file.buffer, {
  folder: 'eventknit/company-documents',
  resource_type: resourceType,
  public_id: `${Date.now()}-${path.parse(file.originalname).name}`,
});
```

### Service Layer

`CompanyDocumentsService` contains all business logic. Auth is intentionally absent from the service — roles are enforced at the route level via `requireMinRole`.

Key behaviours:

- **`list`**: Builds a Prisma `where` clause from `category`, `type`, and `search` filters. Returns paginated results with `totalPages`.
- **`getById`**: Throws `NotFoundError` if the document does not exist.
- **`createLink`**: Creates a record with `externalUrl` set and no file fields.
- **`uploadFile`**: Uploads to Cloudinary first, then creates the DB record. If Cloudinary fails, no record is created (implicit rollback).
- **`update`**: Throws `ValidationError` if `externalUrl` is being set on a `FILE` type document.
- **`delete`**: Attempts Cloudinary deletion of the stored asset (failure is logged but non-fatal), then deletes the DB record.

### Frontend API Client

```typescript
// client/src/lib/company-documents-api.ts
getCompanyDocuments(params?)        // GET /admin/company-documents with query params
getCompanyDocumentById(id)          // GET /admin/company-documents/:id
createDocumentLink(data)            // POST /admin/company-documents/link
uploadDocumentFile(data)            // POST /admin/company-documents/upload via FormData
updateCompanyDocument(id, data)     // PATCH /admin/company-documents/:id
deleteCompanyDocument(id)           // DELETE /admin/company-documents/:id
```

### Route Registration

```typescript
// server/src/app.ts
app.use('/api/v1/admin/company-documents', companyDocumentsRoutes);

// server/src/routes/company-documents.routes.ts
router.use(authenticate);
router.use(requireMinRole(UserRole.ADMIN_STAFF));
router.get('/',        CompanyDocumentsController.list);
router.get('/:id',     CompanyDocumentsController.getById);
router.post('/link',   CompanyDocumentsController.createLink);
router.post('/upload', uploadSingleDocument, CompanyDocumentsController.uploadFile);
router.patch('/:id',   CompanyDocumentsController.update);
router.delete('/:id',  CompanyDocumentsController.delete);
```

### Testing

Service tests are in `server/tests/company-documents.service.test.ts` (18 tests). All Prisma and Cloudinary calls are mocked. Coverage:

| Suite | Tests |
|-------|-------|
| `list` | Pagination, category filter, type filter, search filter, totalPages calculation |
| `getById` | Returns document, throws NotFoundError |
| `createLink` | Google Doc link, External link |
| `uploadFile` | PDF uses `raw` resource_type, image uses `image` resource_type |
| `update` | Updates metadata, throws NotFoundError, throws ValidationError for FILE + externalUrl |
| `delete` | Cloudinary cleanup called, still deletes DB if Cloudinary fails, throws NotFoundError |

---

## 52. Forms & Participants

### Overview

The Forms & Participants system provides a configurable data-collection engine for organizer and admin use. It has three primary models: `EventForm` (the questionnaire), `FormResponse` (a single submission), and `EventParticipant` (a confirmed event participant). A form response can automatically produce a participant record when approved, removing the need for manual data entry.

### Database Schema

```prisma
enum ParticipantType  { SPEAKER EXHIBITOR SPONSOR VOLUNTEER PERFORMER VENDOR JUDGE STAFF VIP MEDIA CUSTOM }
enum ParticipantStatus { INVITED PENDING UNDER_REVIEW APPROVED REJECTED WAITLISTED CONFIRMED DECLINED }
enum FormPurpose { SPEAKER_APPLICATION EXHIBITOR_APPLICATION SPONSOR_APPLICATION
                   VOLUNTEER_APPLICATION PERFORMER_APPLICATION VENDOR_APPLICATION
                   JUDGE_APPLICATION MEDIA_APPLICATION
                   REGISTRATION FEEDBACK GENERAL_INQUIRY CUSTOM }
enum FormStatus        { DRAFT ACTIVE CLOSED ARCHIVED }
enum FormResponseStatus { SUBMITTED UNDER_REVIEW APPROVED REJECTED WAITLISTED }

model EventParticipant {
  id             String            @id @default(uuid())
  eventId        String
  event          Event             @relation("EventParticipants", ...)
  userId         String?
  user           User?             @relation("UserParticipants", ...)
  type           ParticipantType
  status         ParticipantStatus @default(INVITED)
  name           String
  email          String
  phone          String?
  company        String?
  bio            String?           @db.Text
  website        String?
  linkedin       String?
  twitter        String?
  avatarUrl      String?
  metadata       Json?             // Type-specific extras (speaker topics, sponsor tier, etc.)
  customType     String?
  formResponseId String?           @unique
  formResponse   FormResponse?     @relation("ParticipantFormResponse", ...)
  addedById      String?
  reviewedById   String?
  reviewedAt     DateTime?
  reviewNotes    String?           @db.Text
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt
  // indexes: eventId, userId, type, status, email, createdAt
}

model EventForm {
  id                    String           @id @default(uuid())
  eventId               String?
  event                 Event?           @relation("EventForms", ...)
  createdById           String
  title                 String
  description           String?          @db.Text
  purpose               FormPurpose      @default(CUSTOM)
  customPurpose         String?
  targetParticipantType ParticipantType?
  status                FormStatus       @default(DRAFT)
  questions             Json             @default("[]")  // FormQuestion[]
  shareToken            String           @unique @default(uuid())
  isPublic              Boolean          @default(false)
  allowMultipleResponses Boolean         @default(false)
  maxResponses          Int?
  closesAt              DateTime?
  notifyOnSubmission    Boolean          @default(true)
  notificationEmail     String?
  responses             FormResponse[]   @relation("FormResponses")
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt
  // indexes: eventId, createdById, status, purpose, shareToken
}

model FormResponse {
  id              String             @id @default(uuid())
  formId          String
  form            EventForm          @relation("FormResponses", ...)
  respondentId    String?
  respondent      User?              @relation("UserFormResponses", ...)
  respondentEmail String
  respondentName  String?
  status          FormResponseStatus @default(SUBMITTED)
  answers         Json               @default("{}")  // Record<questionId, value>
  reviewedById    String?
  reviewedAt      DateTime?
  reviewNotes     String?            @db.Text
  participant     EventParticipant?  @relation("ParticipantFormResponse")
  submittedAt     DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  // indexes: formId, respondentId, respondentEmail, status, submittedAt
}
```

### Shared Question Type

The `FormQuestion` type is defined in `server/src/types/form-question.types.ts` and shared by both the Forms system and the Survey system:

```typescript
export type FormQuestionType =
  | 'short_text' | 'long_text' | 'email' | 'phone' | 'number' | 'date' | 'url'
  | 'single_choice' | 'multiple_choice' | 'dropdown'
  | 'rating' | 'scale' | 'file_upload' | 'section_break';

export interface FormQuestion {
  id: string;
  type: FormQuestionType;
  label: string;
  helpText?: string;
  placeholder?: string;
  required: boolean;
  order: number;
  options?: { value: string; label: string }[];    // for choice types
  minValue?: number; maxValue?: number;             // for rating/scale
  minLabel?: string; maxLabel?: string;             // for scale
  acceptedFileTypes?: string[];                     // for file_upload (e.g. ['image/jpeg', 'image/png'])
  maxFileSizeMb?: number;                           // for file_upload (default: no limit)
  sectionTitle?: string; sectionDescription?: string; // for section_break
}
```

Questions are stored as a `Json` array in the database. The order field is used to sort questions on render; it is re-indexed sequentially whenever the form builder moves, adds, or removes a question.

### Architecture

Follows the standard Route -> Controller -> Service pattern. Public endpoints skip the `authenticate` middleware; protected endpoints require `ORGANIZER` role minimum.

```
GET /api/v1/forms/public/:shareToken         (no auth)
POST /api/v1/forms/public/:shareToken/submit (no auth; attaches user if token present)

GET/POST/PATCH/DELETE /api/v1/forms/*
  authenticate middleware
  requireMinRole(ORGANIZER)
  FormController -> FormService -> prisma

GET/POST/PATCH/DELETE /api/v1/events/:eventId/participants/*
  authenticate middleware
  requireMinRole(ORGANIZER)
  ParticipantController -> ParticipantService -> prisma
```

### Service Layer

#### `FormService` (`server/src/services/form.service.ts`)

| Method | Behaviour |
|--------|-----------|
| `listForms(opts)` | Paginated list with optional `status`, `purpose`, `eventId` filters |
| `getFormById(id)` | Throws `NotFoundError` if not found |
| `getFormByShareToken(token)` | Throws `NotFoundError` if token unknown; `ValidationError` if status is not `ACTIVE` or `closesAt` is past |
| `createForm(data, userId)` | Validates event exists if `eventId` provided; requires `customPurpose` when `purpose = CUSTOM` |
| `updateForm(id, data)` | Throws `ValidationError` if form is `ARCHIVED`; serialises `questions` as `InputJsonValue` |
| `deleteForm(id)` | Cascades to responses via DB `onDelete: Cascade` |
| `listResponses(formId, opts)` | Paginated; filterable by `status` |
| `submitResponse(shareToken, data)` | Calls `getFormByShareToken` first (validates active + not closed); enforces `maxResponses` cap; enforces duplicate-email guard when `allowMultipleResponses = false` |
| `reviewResponse(id, status, userId, notes?, createParticipant?)` | Updates status; if `APPROVED` and `createParticipant = true` and `targetParticipantType` is set and no participant record exists yet, auto-creates `EventParticipant` |

#### Built-in Form Templates (`server/src/config/form-templates.config.ts`)

The system ships with thirteen ready-to-use `BuiltInTemplate` objects (name, description, purpose, pre-populated questions). Organizers can browse and instantiate them from the Template Gallery. All person-facing application templates include optional profile photo (`file_upload`) and social URL fields so responses can feed directly into event promotion materials.

| Template | `FormPurpose` | Key fields |
|----------|---------------|------------|
| Event Registration | `REGISTRATION` | Name, email, phone, organisation, job title, dietary requirements, accessibility needs, T&C consent |
| Post-Event Feedback | `FEEDBACK` | Ratings (overall, logistics, venue), open comments, would-attend-again |
| General Survey | `FEEDBACK` | Demographics, topic interests, discovery source, open comments |
| Speaker Application | `SPEAKER_APPLICATION` | Talk title, format, abstract, bio, LinkedIn, website, Twitter/X, **headshot upload**, speaking experience, A/V requirements |
| Exhibitor Application | `EXHIBITOR_APPLICATION` | Company name, contact, website, LinkedIn, Twitter/X, **company logo upload**, description, booth size, required facilities |
| Volunteer Application | `VOLUNTEER_APPLICATION` | Name, contact, age group, preferred roles, T-shirt size, experience, commitment confirmation |
| Sponsor Application | `SPONSOR_APPLICATION` | Company name, contact, title, website, LinkedIn, **logo upload**, preferred tier, budget range, overview, desired branding benefits, products to promote |
| Performer / Artist Application | `PERFORMER_APPLICATION` | Stage name, legal name, performance category, bio, performance description, duration, technical requirements, portfolio/EPK links, booking contact, soundcheck availability |
| Vendor Application | `VENDOR_APPLICATION` | Business name, contact person, vendor category, products/services, stall size, required utilities, business registration, health certificate (food vendors), social link |
| Judge / Reviewer Application | `JUDGE_APPLICATION` | Full name, title, organisation, areas of expertise, bio, judging experience, availability, LinkedIn, conflict-of-interest declaration |
| Media / Press Application | `MEDIA_APPLICATION` | Name, outlet, media type, website, audience reach, intended coverage, equipment, press area request, accreditation, portfolio link |
| Research Survey | `FEEDBACK` | Likert scales, demographic dropdowns, open-ended questions (structured academic format) |
| Event Survey | `FEEDBACK` | Pre/mid-event pulse — discovery source, session interest, primary goal, expectations scale |
| Knowledge Quiz | `CUSTOM` | Placeholder 5-question multiple-choice template; organizer replaces questions with event content |

#### `ParticipantService` (`server/src/services/participant.service.ts`)

| Method | Behaviour |
|--------|-----------|
| `list(eventId, opts)` | Paginated; filterable by `type`, `status`, `search` (name/email/company) |
| `getById(eventId, id)` | Scoped to event; throws `NotFoundError` |
| `create(eventId, data, addedById)` | Verifies event exists; requires `customType` when `type = CUSTOM`; sets initial `status = INVITED` |
| `update(eventId, id, data)` | Validates `customType` not empty if existing type is `CUSTOM` |
| `review(eventId, id, status, userId, notes?)` | Accepts `APPROVED`, `REJECTED`, `WAITLISTED`, `UNDER_REVIEW`, `CONFIRMED`, `DECLINED`; rejects `INVITED`, `PENDING` |
| `delete(eventId, id)` | Hard delete; related `FormResponse.participant` set to null via `SetNull` |

### Auto-Participant Creation

When a `FormResponse` is approved with `createParticipant = true`:

```typescript
if (
  status === FormResponseStatus.APPROVED &&
  createParticipant &&
  response.form.targetParticipantType &&
  response.form.eventId &&
  !response.participant           // idempotency guard
) {
  await prisma.eventParticipant.create({
    data: {
      eventId: response.form.eventId,
      type: response.form.targetParticipantType,
      status: ParticipantStatus.APPROVED,
      name: response.respondentName ?? answers['name'] ?? response.respondentEmail,
      email: response.respondentEmail,
      userId: response.respondentId,
      formResponseId: response.id,
      reviewedById,
      reviewedAt: new Date(),
    },
  });
}
```

The `formResponseId` unique constraint on `EventParticipant` guarantees at most one participant is ever created from a single response, even if the review endpoint is called concurrently.

### Public Form Submission Flow

```
Browser: GET /f/:shareToken
  -> PublicFormPage.tsx
  -> getPublicForm(shareToken)      (GET /api/v1/forms/public/:shareToken)
  <- { form: { title, description, questions, event } }

User fills form and submits:
  -> submitPublicForm(shareToken, { respondentEmail, respondentName, answers })
     (POST /api/v1/forms/public/:shareToken/submit)
  <- { response: { id, submittedAt } }
```

The backend optional-auth middleware on submit attempts to decode a JWT cookie if present. If valid, `respondentId` is set to link the response to an existing user account. If absent or invalid, the auth error is swallowed and the submission proceeds as anonymous.

### Frontend Components

| File | Purpose |
|------|---------|
| `client/src/components/forms/FormBuilder.tsx` | Drag-order question editor used by admin/organizer when creating or editing a form |
| `client/src/components/forms/FormRenderer.tsx` | Renders live form questions for public submission; exports `validateFormAnswers()` |
| `client/src/components/forms/TemplateGallery.tsx` | Grid of all 13 built-in + custom templates with filter pills per purpose; used before form creation |
| `client/src/components/forms/AccentColorPicker.tsx` | 12-preset + custom hex colour picker for form theme accent; stored in `EventForm.theme.accentColor` |
| `client/src/lib/form-api.ts` | All form and response API calls; defines `FormPurpose`, `FormQuestion`, `EventForm` types |
| `client/src/lib/form-template-api.ts` | Template API calls; exports `FORM_PURPOSE_LABELS` map for display names |
| `client/src/lib/participant-api.ts` | All participant CRUD API calls; defines `ParticipantType` and `ParticipantStatus` types |
| `client/src/pages/admin/forms/AdminFormsPage.tsx` | Admin forms list with template gallery on create |
| `client/src/pages/admin/forms/AdminFormDetailPage.tsx` | Edit questions, review responses, accent-colour picker in Settings tab |
| `client/src/pages/public/PublicFormPage.tsx` | Zero-auth public submission page at `/f/:shareToken`; applies `theme.accentColor` to submit button |

### Route Registration

```typescript
// server/src/app.ts
app.use('/api/v1/events/:eventId/participants', participantRoutes);
app.use('/api/v1/forms', formRoutes);

// server/src/routes/form.routes.ts
router.get('/public/:shareToken',         FormController.getPublicForm);     // no auth
router.post('/public/:shareToken/submit', optionalAuth, FormController.submitPublicForm);

router.use(authenticate);
router.use(requireMinRole(UserRole.ORGANIZER));
router.get('/',                                    FormController.listForms);
router.post('/',                                   FormController.createForm);
router.get('/:id',                                 FormController.getFormById);
router.patch('/:id',                               FormController.updateForm);
router.delete('/:id',                              FormController.deleteForm);
router.get('/:id/responses',                       FormController.listResponses);
router.get('/:id/responses/:responseId',           FormController.getResponseById);
router.patch('/:id/responses/:responseId/review',  FormController.reviewResponse);

// server/src/routes/participant.routes.ts  (mergeParams: true)
router.use(authenticate);
router.use(requireMinRole(UserRole.ORGANIZER));
router.get('/',                       ParticipantController.list);
router.post('/',                      ParticipantController.create);
router.get('/:participantId',         ParticipantController.getById);
router.patch('/:participantId',       ParticipantController.update);
router.patch('/:participantId/review', ParticipantController.review);
router.delete('/:participantId',      ParticipantController.delete);
```

### Testing

Unit tests use Vitest with all Prisma calls mocked via `vi.mock('../src/config/database', ...)`.

| File | Tests | Coverage |
|------|-------|---------|
| `tests/participant.service.test.ts` | 22 | list (5), getById (2), create (4), update (3), review (5), delete (2) |
| `tests/form.service.test.ts` | 33 | listForms (5), getFormById (2), getFormByShareToken (4), createForm (4), updateForm (4), deleteForm (2), listResponses (2), submitResponse (4), reviewResponse (6) |

Key scenarios covered:

- Pagination and all filter combinations
- `NotFoundError` on missing resources
- `ValidationError` for CUSTOM type without label, archived form edits, invalid review statuses
- Duplicate-email guard respects `allowMultipleResponses` flag
- `maxResponses` cap enforced before creating response
- `closesAt` expiry check in `getFormByShareToken`
- Auto-participant creation on approval (correct data, idempotency guard, skips when `createParticipant = false`)
- `SUBMITTED` status rejected as a review action

---

## 53. Appendix

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

