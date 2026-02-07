# EventKnit Checkout System - Technical Documentation

> **Version:** 1.0
> **Date:** February 2026
> **Audience:** Board of Directors, Technical Stakeholders
> **Classification:** Internal

---

## Table of Contents

1. [Executive Overview](#executive-overview)
2. [System Architecture](#system-architecture)
3. [Complete User Journey](#complete-user-journey)
4. [Registration & Payment Flow](#registration--payment-flow)
5. [Email Communication System](#email-communication-system)
6. [Security & Fraud Prevention](#security--fraud-prevention)
7. [Technology Stack](#technology-stack)
8. [High-Demand Event Handling](#high-demand-event-handling)
9. [Data Protection & Compliance](#data-protection--compliance)
10. [System Monitoring](#system-monitoring)

---

## Executive Overview

EventKnit's checkout system provides a complete ticketing solution from event discovery to ticket delivery. The platform processes payments through multiple gateways, generates secure QR-coded tickets, and delivers them via email with digital wallet integration.

### Key Capabilities

| Capability | Description |
|------------|-------------|
| **Multi-Gateway Payments** | Paystack, Stripe, M-Pesa integration |
| **Secure Ticket Generation** | Ed25519 signed QR codes with backup entry codes |
| **Digital Delivery** | PDF tickets, Apple Wallet, Google Wallet |
| **Real-time Inventory** | Atomic inventory management with Redis caching |
| **Fraud Protection** | Rate limiting, bot detection, device fingerprinting |
| **Guest Checkout** | Purchase without account creation |

### Transaction Volume Capacity

| Metric | Capacity |
|--------|----------|
| Concurrent checkouts | Up to 10,000 |
| Transactions per minute | 1,000+ |
| Email delivery rate | 500/minute |
| PDF generation | Async queue processing |

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│   Web Application (React)  │  Mobile App (Flutter)  │  API Consumers    │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            API GATEWAY                                   │
├─────────────────────────────────────────────────────────────────────────┤
│   Rate Limiting  │  Authentication (JWT)  │  Request Validation         │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION LAYER                               │
├─────────────────────────────────────────────────────────────────────────┤
│  Event Service  │  Payment Service  │  Ticket Service  │  Email Service │
│  Cart Service   │  Inventory Service │  PDF Service    │  Notification  │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
┌───────────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐
│      PostgreSQL       │  │      Redis      │  │    External Services    │
│   (Primary Database)  │  │   (Cache/Queue) │  │ Paystack│Stripe│Resend  │
└───────────────────────┘  └─────────────────┘  └─────────────────────────┘
```

### Service Responsibilities

| Service | Responsibility |
|---------|----------------|
| **Event Service** | Event CRUD, registration logic, capacity management |
| **Cart Service** | Shopping cart with 8-minute reservation timer |
| **Payment Service** | Gateway integration, webhook handling, refunds |
| **Inventory Service** | Atomic ticket counters, Redis caching |
| **Ticket Service** | QR generation, email delivery, PDF creation |
| **PDF Service** | Puppeteer-based ticket PDF generation |
| **Email Service** | Resend integration with retry logic |

---

## Complete User Journey

### Journey Overview

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ BROWSE  │───▶│ SELECT  │───▶│  CART   │───▶│   PAY   │───▶│ RECEIVE │
│ Events  │    │ Tickets │    │ Reserve │    │ Process │    │ Ticket  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │              │              │
     ▼              ▼              ▼              ▼              ▼
  Search &      Choose        8-minute       Payment       Email with
  Filter        type &        inventory      gateway       QR + PDF +
  Events        quantity      hold           processing    Calendar
```

### Detailed Step-by-Step Flow

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | User browses events | Events loaded with availability status |
| 2 | User selects event | Event details with ticket types displayed |
| 3 | User chooses tickets | Ticket type, quantity, promo code validation |
| 4 | Cart created | **8-minute timer starts**, inventory temporarily held |
| 5 | User enters details | Attendee information collected |
| 6 | Payment initiated | Gateway redirect (Paystack/Stripe) |
| 7 | Payment processed | Webhook received, registration confirmed |
| 8 | Ticket generated | QR code + PDF created asynchronously |
| 9 | Email delivered | Ticket email with attachments sent |
| 10 | Dashboard updated | Ticket visible in user dashboard |

---

## Registration & Payment Flow

### Flow Diagram

```
                    USER INITIATES REGISTRATION
                              │
                              ▼
              ┌───────────────────────────────┐
              │     Create Cart Reservation    │
              │   (8-minute expiry timer)      │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   Lock Inventory (Atomic)      │
              │   Redis counter decrement      │
              └───────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
              FREE EVENT           PAID EVENT
                    │                   │
                    ▼                   ▼
           ┌────────────────┐   ┌────────────────┐
           │ Create         │   │ Create         │
           │ Registration   │   │ Registration   │
           │ (CONFIRMED)    │   │ (PENDING)      │
           └────────────────┘   └────────────────┘
                    │                   │
                    │                   ▼
                    │           ┌────────────────┐
                    │           │ Payment Email  │
                    │           │ "Payment       │
                    │           │  Pending"      │
                    │           └────────────────┘
                    │                   │
                    │                   ▼
                    │           ┌────────────────┐
                    │           │ Redirect to    │
                    │           │ Payment Gateway│
                    │           └────────────────┘
                    │                   │
                    │                   ▼
                    │           ┌────────────────┐
                    │           │ Gateway        │
                    │           │ Processes      │
                    │           │ Payment        │
                    │           └────────────────┘
                    │                   │
                    │                   ▼
                    │           ┌────────────────┐
                    │           │ Webhook        │
                    │           │ Received       │
                    │           │ (Verified)     │
                    │           └────────────────┘
                    │                   │
                    │          SUCCESS? │ FAILED?
                    │           ┌───────┴───────┐
                    │           ▼               ▼
                    │    Update Status    Release
                    │    (CONFIRMED)      Inventory
                    │           │
                    └───────────┤
                                ▼
              ┌───────────────────────────────┐
              │      Generate QR Code          │
              │   Ed25519 signed ticket data   │
              └───────────────────────────────┘
                                │
                                ▼
              ┌───────────────────────────────┐
              │    Queue PDF Generation        │
              │   (BullMQ async processing)    │
              └───────────────────────────────┘
                                │
                                ▼
              ┌───────────────────────────────┐
              │    Send Ticket Email           │
              │   with QR, PDF, ICS calendar   │
              └───────────────────────────────┘
                                │
                                ▼
              ┌───────────────────────────────┐
              │   Add to Digital Wallet        │
              │   (Apple/Google Wallet)        │
              └───────────────────────────────┘
```

### Cart Reservation System

The cart system prevents inventory conflicts during checkout:

| Feature | Implementation |
|---------|----------------|
| **Timer Duration** | 8 minutes (industry standard) |
| **Inventory Lock** | Serializable database transactions |
| **Expiry Handling** | Cron job releases expired carts every minute |
| **Status Tracking** | ACTIVE → RESERVED → COMPLETED/EXPIRED |

```
Cart States:
─────────────────────────────────────────────────────────
ACTIVE ──▶ User adding items, timer running
           │
           ├──▶ RESERVED ──▶ Payment in progress
           │         │
           │         ├──▶ COMPLETED ──▶ Payment successful
           │         │
           │         └──▶ EXPIRED ──▶ Payment timeout
           │
           └──▶ ABANDONED ──▶ User left checkout
```

### Payment Gateway Integration

| Gateway | Region | Features |
|---------|--------|----------|
| **Paystack** | Africa | Cards, Bank Transfer, USSD, Mobile Money |
| **Stripe** | Global | Cards, Apple Pay, Google Pay |
| **M-Pesa** | East Africa | Mobile Money |

**Webhook Security:**
- Signature verification (HMAC-SHA512)
- Idempotency keys prevent duplicate processing
- Event deduplication via `PaymentWebhookEvent` model

---

## Email Communication System

### Email Types & Triggers

| Email Type | Trigger | Timing | Contents |
|------------|---------|--------|----------|
| **Payment Pending** | Registration created (paid event) | Immediate | Event details, payment instructions |
| **Ticket Confirmation** | Payment successful | Within 30 seconds | QR code, PDF, calendar invite, backup code |
| **Event Reminder (24h)** | Scheduled job | 24 hours before | Event details, directions |
| **Event Reminder (1h)** | Scheduled job | 1 hour before | Quick reminder with QR |
| **Ticket Transfer** | Transfer initiated | Immediate | Transfer details to both parties |

### Ticket Email Contents

The main ticket email includes:

```
┌─────────────────────────────────────────────────────────────┐
│                    TICKET EMAIL CONTENTS                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. HEADER                                                   │
│     "🎉 Registration Confirmed!"                             │
│                                                              │
│  2. EVENT DETAILS                                            │
│     • Event title & image                                    │
│     • Date, time, venue                                      │
│     • Attendee name                                          │
│     • Ticket type & quantity                                 │
│     • Amount paid                                            │
│                                                              │
│  3. TICKET BADGE (embedded)                                  │
│     • Attendee name                                          │
│     • QR code (200x200px)                                    │
│     • Backup entry code                                      │
│                                                              │
│  4. CALENDAR LINKS                                           │
│     • Google Calendar button                                 │
│     • Outlook Calendar button                                │
│     • Download .ics file                                     │
│                                                              │
│  5. ATTACHMENTS                                              │
│     • event.ics (calendar file)                              │
│     • ticket.pdf (printable ticket)                          │
│     • qr-code.png (standalone QR)                            │
│                                                              │
│  6. ACCOUNT SETUP (for guest users)                          │
│     • Link to set password                                   │
│     • Valid for 7 days                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Email Delivery Infrastructure

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Provider** | Resend | Transactional email delivery |
| **Retry Logic** | 3 attempts with exponential backoff | Ensure delivery |
| **Templates** | Inline HTML with responsive design | Cross-client compatibility |
| **Tracking** | `ticketEmailStatus`, `ticketEmailSentAt` | Delivery monitoring |
| **Rate Limit** | 500 emails/minute | Provider compliance |

### Email Status Tracking

```sql
EventRegistration:
  ticketEmailSentAt    DateTime?   -- When email was sent
  ticketEmailStatus    String?     -- SUCCESS, FAILED, PENDING
  ticketEmailError     String?     -- Error message if failed
```

---

## Security & Fraud Prevention

### Multi-Layer Security Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Layer 1: NETWORK                                                        │
│  ├── HTTPS/TLS encryption                                                │
│  ├── Rate limiting (per IP, per user)                                    │
│  └── DDoS protection (Cloudflare)                                        │
│                                                                          │
│  Layer 2: APPLICATION                                                    │
│  ├── JWT authentication with refresh tokens                              │
│  ├── Input validation (Zod schemas)                                      │
│  ├── CSRF protection                                                     │
│  └── SQL injection prevention (Prisma ORM)                               │
│                                                                          │
│  Layer 3: PAYMENT                                                        │
│  ├── PCI-DSS compliant (card data never touches our servers)             │
│  ├── Webhook signature verification                                      │
│  ├── Idempotency keys                                                    │
│  └── Amount mismatch detection                                           │
│                                                                          │
│  Layer 4: TICKET                                                         │
│  ├── Ed25519 digital signatures                                          │
│  ├── Cryptographically secure QR codes                                   │
│  ├── Backup entry codes                                                  │
│  └── Single-scan validation                                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Rate Limiting Configuration

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| **General API** | 100 requests | Per minute |
| **Authentication** | 10 attempts | Per 15 minutes |
| **Payment Initiation** | 5 requests | Per minute |
| **Registration** | 10 requests | Per minute per IP |
| **Webhook Endpoints** | Unlimited | (from trusted IPs) |

### Bot & Fraud Detection

| Mechanism | Implementation |
|-----------|----------------|
| **Device Fingerprinting** | Browser/device identification stored with cart |
| **IP Address Tracking** | Stored with registration for audit |
| **Session Validation** | Cart session cookies with secure flags |
| **Purchase Limits** | Configurable max tickets per user per event |
| **Amount Verification** | Webhook amount compared to registration total |

### QR Code Security

```
QR Code Payload Structure:
─────────────────────────────────────────────────────────────
{
  "registrationId": "uuid",
  "eventId": "uuid",
  "attendeeEmail": "hashed",
  "timestamp": 1234567890,
  "signature": "ed25519_signature"
}

Verification Process:
1. Scan QR code
2. Parse payload
3. Verify Ed25519 signature against public key
4. Check registration exists and is valid
5. Verify not already scanned (single-use)
6. Mark as scanned with timestamp
```

---

## Technology Stack

### Backend Technologies

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Runtime** | Node.js | 20.x | JavaScript runtime |
| **Framework** | Express.js | 4.x | HTTP server |
| **Language** | TypeScript | 5.x | Type safety |
| **Database** | PostgreSQL | 15.x | Primary data store |
| **ORM** | Prisma | 6.x | Database access |
| **Cache** | Redis | 7.x | Inventory counters, sessions |
| **Queue** | BullMQ | 5.x | Async job processing |

### Frontend Technologies

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | React 18 | UI components |
| **Bundler** | Vite | Build tooling |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Components** | shadcn/ui | Component library |
| **State** | TanStack Query | Server state management |

### External Services

| Service | Provider | Purpose |
|---------|----------|---------|
| **Email** | Resend | Transactional email |
| **Payments** | Paystack, Stripe | Payment processing |
| **Storage** | Cloudinary | Image/PDF storage |
| **PDF Generation** | Puppeteer | Server-side PDF rendering |

### Infrastructure

| Component | Technology |
|-----------|------------|
| **Containerization** | Docker |
| **Orchestration** | Docker Compose (dev), Kubernetes (prod) |
| **CI/CD** | GitHub Actions |
| **Monitoring** | Winston logging, custom metrics |

---

## High-Demand Event Handling

### Scalability Features

For high-demand events (10,000+ concurrent users), the system implements:

| Feature | Description |
|---------|-------------|
| **Redis Inventory Counters** | Atomic Lua scripts for inventory operations |
| **Cart Reservation Queue** | Prevents overselling during checkout |
| **Async PDF Generation** | Non-blocking ticket creation |
| **Database Connection Pooling** | Efficient connection management |
| **Webhook Idempotency** | Prevents duplicate processing |

### Redis Atomic Inventory

```lua
-- Atomic inventory decrement (Lua script)
local available = tonumber(redis.call('GET', KEYS[1]) or 0)
local requested = tonumber(ARGV[1])

if available >= requested then
    redis.call('DECRBY', KEYS[1], requested)
    return requested  -- Success
else
    return 0  -- Not enough inventory
end
```

### Capacity Planning

| Metric | Conservative | High-Demand |
|--------|--------------|-------------|
| **Concurrent Users** | 1,000 | 10,000 |
| **Database Connections** | 50 | 200 |
| **Redis Connections** | 100 | 500 |
| **Checkout Throughput** | 100/min | 1,000/min |

---

## Data Protection & Compliance

### GDPR Compliance

| Right | Implementation |
|-------|----------------|
| **Right to Access** | User can view all their data in dashboard |
| **Right to Rectification** | Profile editing available |
| **Right to Erasure** | Account deletion with data anonymization |
| **Right to Data Portability** | JSON export of user data |
| **Consent Management** | `AttendeeConsent` model tracks marketing/analytics consent |

### Data Retention

| Data Type | Retention Period | Reason |
|-----------|------------------|--------|
| **Registration Data** | 7 years | Financial/tax compliance |
| **Payment Transactions** | 7 years | Financial records |
| **Session Data** | 24 hours | Security |
| **Audit Logs** | 2 years | Compliance |
| **Email Logs** | 90 days | Troubleshooting |

### PCI-DSS Compliance

- **Card data never stored** - Tokenization via payment gateways
- **Secure transmission** - TLS 1.3 for all connections
- **Access controls** - Role-based permissions
- **Audit trail** - All admin actions logged

---

## System Monitoring

### Logging Strategy

| Log Level | Usage |
|-----------|-------|
| **ERROR** | Payment failures, system errors |
| **WARN** | Unusual patterns, missing data |
| **INFO** | Registration, payment, email events |
| **DEBUG** | Detailed flow tracing (dev only) |

### Key Metrics Tracked

| Metric | Purpose |
|--------|---------|
| **Registration Success Rate** | System health |
| **Payment Success Rate** | Gateway health |
| **Email Delivery Rate** | Communication health |
| **Cart Abandonment Rate** | UX optimization |
| **Average Checkout Time** | Performance |

### Alerting

| Alert | Trigger | Action |
|-------|---------|--------|
| **Payment Failure Spike** | >10% failure rate | Notify on-call |
| **Email Delivery Failure** | >5% bounce rate | Check configuration |
| **Inventory Discrepancy** | Redis/DB mismatch | Manual reconciliation |
| **Database Connection Pool** | >80% utilized | Scale or investigate |

---

## Summary

EventKnit's checkout system provides a robust, secure, and scalable solution for event ticketing:

1. **Reliable Payment Processing** - Multi-gateway with webhook verification
2. **Secure Tickets** - Ed25519 signed QR codes with backup entry
3. **Comprehensive Delivery** - Email with PDF, calendar, and wallet integration
4. **Fraud Protection** - Rate limiting, fingerprinting, purchase limits
5. **Scalable Architecture** - Redis caching, async processing, connection pooling

The system is designed to handle both small community events and high-demand concerts while maintaining security and user experience standards comparable to industry leaders like Eventbrite and Ticketmaster.

---

*Document Version: 1.0*
*Last Updated: February 2026*
*Author: EventKnit Engineering Team*
