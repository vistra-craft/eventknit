# Checkout System

## Overview

The checkout system handles the complete attendee journey — from discovering an event to holding a ticket. It supports free and paid events, guest and authenticated users, multiple payment gateways (Paystack, Stripe, M-Pesa), and post-purchase features like ticket transfers and resale.

This document covers the system from the attendee's perspective, then details the backend architecture that powers it.

---

## Attendee Journey

### 1. Event Discovery

Attendees find events through the public event listing or direct links. Each event page (`/event/:id`) shows event details and a context-aware action button:

| Scenario | Button Label |
|----------|-------------|
| Free event | "Register Free" |
| Paid event (single price) | "Get Tickets - KES 500" |
| Paid event (multiple types) | "Get Tickets - From KES 500" |
| Already registered | "View My Ticket" |

### 2. Ticket Selection

Two registration paths exist:

- **Full-page flow** (`/event/:id/register`) — `RegisterEvent.tsx` (1,356 lines)
- **Modal flow** — `UnifiedRegistrationModal.tsx` with step-by-step wizard (Tickets → Registration → Payment → Confirmation)

Both show available ticket types with:
- Name, description, price
- Badges: VIP, discount %, stock status, time remaining
- Quantity controls (+/- buttons)
- Real-time total calculation

**Promo codes**: Attendees can enter a code manually or have one auto-applied from a URL parameter (`?promo=CODE`). Codes are case-insensitive and show the discount amount when applied.

### 3. Registration Form

After selecting tickets, attendees fill in:

- **Guest users**: First name, last name, email (required), phone (optional)
- **Logged-in users**: Form auto-populates from their profile

If the event has custom registration fields (text, email, tel, textarea, select, radio, checkbox), those appear next.

**Data sharing consent** is collected per-event:
- Operational (always required)
- Marketing communications (optional)
- Demographic data (premium feature)
- Engagement analytics (premium feature)

Terms & conditions checkbox is required.

### 4. Authentication Paths

#### Path A: Logged-in User
1. Calls `registerForEvent(eventId, data)`
2. Creates EventRegistration with QR code
3. For free events → confirmation page
4. For paid events → payment page

#### Path B: Guest Checkout (Auto-Account Creation)
1. Validates email, first name, last name
2. Calls `registerAsGuest(eventId, data)`
3. Backend **automatically creates a user account** linked to the email
4. Response includes:
   - `user.isNewUser: true` — indicates a new account was created
   - `user.requiresPasswordSetup: true` — account has no password yet
   - `accessToken` — the guest is auto-logged-in immediately
5. For free events → confirmation page (with optional password setup)
6. For paid events → payment page

The guest never needs to explicitly register for an account. Purchasing a ticket creates one for them.

### 5. Payment (Paid Events Only)

The payment page (`/event/:id/payment`) shows:
- Ticket breakdown with quantities and prices
- Subtotal, discount (if promo applied), service fee
- Total amount

**Payment flow**:
1. Attendee clicks "Pay"
2. Frontend calls `initializePayment(registrationId)`
3. Backend generates a unique reference (`EVT-{registrationId}-{timestamp}`) and calls the payment gateway
4. **Paystack**: Attendee is redirected to Paystack's hosted checkout page
5. **Stripe**: Attendee is redirected to Stripe Checkout session
6. **M-Pesa**: STK push is sent to the attendee's phone
7. After payment, gateway redirects back to `/event/:id/payment?reference=...`
8. Frontend calls `verifyPayment(reference)` to confirm
9. On success → redirect to confirmation page

**Webhook processing** (server-side):
- Gateway sends webhook to `POST /api/v1/payments/webhook`
- Signature verified (HMAC-SHA512 for Paystack, HMAC-SHA256 for Stripe)
- Idempotency check prevents duplicate processing
- Amount validation with ±1 cent tolerance
- Registration status updated to CONFIRMED
- Platform fee calculated, invoice generated

### 6. Confirmation

**Free events** and **guest registrations** land on `/event/:id/registration-confirmation`:
- Success message with event details
- Quick actions: Add to Calendar, Download Ticket, Share Event
- "View My Ticket" button → `/user/tickets/:registrationId`
- **Password setup card** (guests only): Set a password for future logins, or skip

**Paid events** land on `/confirmation`:
- Order summary (event, tickets, total, payment method)
- Download Tickets button

### 7. What Attendees Receive

**Ticket email** sent immediately after confirmation:
- HTML template with event image
- Event details: date, time, location, online link (if applicable)
- Attendee name and email
- Ticket line items with quantities and prices
- **QR code** as inline PNG (300×300px, error correction level M)
- **Backup code** — 10-character alphanumeric code for manual entry
- **Calendar invite** (ICS file attachment)
- Google Calendar and Outlook Calendar integration links

**QR code data** is either:
- **Ed25519 signed JWT** (when `USE_SIGNED_TICKETS=true`) — cryptographically verifiable
- **HMAC-signed string** (legacy) — `registrationId|eventId|email|timestamp|signature`

---

## Attendee Dashboard

After purchasing a ticket, attendees access their dashboard at `/user/dashboard`.

### Dashboard Home

Default landing page showing all registered events with:
- Event thumbnail, title, status (Upcoming/Past)
- Date and location
- Download and share buttons
- Filter tabs: All Events, Upcoming, Past

### My Tickets

Accessed via `/user/dashboard?section=tickets`. Lists all tickets with:
- Event image, title, date, location
- Status badge (Upcoming/Past)
- Ticket ID/QR identifier
- Download PDF and share actions
- Filter tabs: All Tickets, Upcoming, Past

### Ticket Detail View

Individual ticket page at `/user/tickets/:registrationId`:
- Event title with confirmation badge
- **Event details**: Date, time, location
- **Online event link**: Only visible to authenticated ticket holders (hidden from public event pages)
- **Attendee info**: Name, email
- **Ticket type**: If applicable
- **QR code**: Large scannable image with "Present this QR code at the event entrance"
- **Backup code**: Monospaced display with "Use if QR code doesn't work"
- **Registration ID**: Reference number
- Actions: Download PDF, View All Tickets

Authentication handling: Tries authenticated endpoint first, falls back to public endpoint with email verification for guests.

### Ticket Transfer

Attendees can transfer tickets to others at `/user/dashboard?section=ticket-transfer`:
- Only upcoming confirmed tickets are eligible
- Enter recipient's email and optional personal message
- Transfer statuses: PENDING, ACCEPTED, REJECTED, CANCELLED, EXPIRED
- Transfer history with cancel option for pending transfers

### Ticket Resale

Marketplace at `/user/dashboard?section=ticket-resale`:
- **Browse**: View tickets listed by other attendees with original vs resale pricing
- **List**: Set a resale price and optional expiration date
- **Purchase**: Buy resale tickets directly
- **My Listings**: View and manage own listings (cancel if still LISTED)

### Other Dashboard Sections

- **Saved Events** — Bookmarked events
- **Networking** — Connect with other attendees (AttendeeDiscovery)
- **Notifications** — Per-event subscription settings
- **Digital Wallet** — Payment plans, invoices, auto-added tickets
- **Profile** — Account settings at `/user/profile`
- **Notification Preferences** — Email/push settings at `/user/notification-preferences`

---

## Magic Link Authentication

Attendees can log in without a password using magic links.

### Flow

1. Attendee enters their email on the login page
2. `POST /api/v1/auth/magic-link/request` generates a 64-character cryptographic token
3. Token stored in `magicLinkToken` table with 15-minute expiry
4. Email sent with subject "Login to EventKnit" containing a login button
5. Link format: `{frontend_url}/auth/magic-link/verify?token={token}`
6. Attendee clicks the link
7. `GET /api/v1/auth/magic-link/verify?token={token}` validates:
   - Token exists and is not used
   - Token has not expired (15-minute window)
   - Associated user exists and is not suspended
8. Token marked as used (single-use only)
9. IP address and user agent recorded for audit
10. Access token (15 min) and refresh token (7 days) issued
11. Attendee auto-redirected to their dashboard based on role

### Security

- Tokens are `crypto.randomBytes(32).toString('hex')` — cryptographically secure
- Single-use: marked as used after verification
- 15-minute expiry
- Suspended accounts cannot request magic links
- Both endpoints rate-limited (per-user and per-IP)
- Full audit trail: IP, user agent, timestamps

---

## Cart & Reservation

The cart system provides temporary inventory locking:

- **Timeout**: 8 minutes per cart reservation
- **Storage**: Session-based for guests, userId-based for authenticated users
- **Statuses**: ACTIVE → RESERVED → ABANDONED/EXPIRED

### API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/cart` | Get current cart |
| POST | `/api/v1/cart` | Create cart |
| POST | `/api/v1/cart/items` | Add item |
| PATCH | `/api/v1/cart/items/:itemId` | Update quantity |
| DELETE | `/api/v1/cart/items/:itemId` | Remove item |
| POST | `/api/v1/cart/reserve` | Lock inventory |
| DELETE | `/api/v1/cart` | Abandon cart |

---

## Payment Architecture

### Supported Gateways

| Gateway | Region | Method | Amount Unit |
|---------|--------|--------|-------------|
| Paystack | Africa | Redirect to hosted page | Kobo (×100) |
| Stripe | Global | Checkout session redirect | Cents (×100) |
| M-Pesa | Kenya | STK push to phone | Main unit |

### Idempotency

Webhook processing uses the `PaymentWebhookEvent` table to prevent duplicate processing:
- Each webhook event tracked by `gatewayEventId`
- Status transitions: PROCESSING → PROCESSED/FAILED/IGNORED
- Race conditions handled via unique constraint on `gatewayEventId`
- Second attempt returns DUPLICATE status

### Failure Handling

| Scenario | Action |
|----------|--------|
| Payment failed | Registration → CANCELLED, capacity restored, attendee notified |
| Amount mismatch (>1 cent) | Status → AMOUNT_MISMATCH, both attendee and organizer notified, admin review required |
| Webhook duplicate | Ignored with DUPLICATE status |
| Email send failure | Retry up to 5 times with exponential backoff (1s → 30s cap) |

### Payment Reference Format

`EVT-{registrationId}-{timestamp}` — unique per payment attempt.

---

## API Reference

### Registration Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/v1/events/:id/register` | Required | Register authenticated user |
| POST | `/api/v1/events/:id/register-guest` | None (rate-limited) | Register guest with auto-account creation |

### Payment Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/v1/payments/initialize` | Required | Initialize payment |
| POST | `/api/v1/payments/initialize-guest` | None (rate-limited) | Initialize guest payment |
| GET | `/api/v1/payments/verify` | None | Verify payment by reference |
| POST | `/api/v1/payments/webhook` | None (signature-verified) | Gateway webhook callback |
| GET | `/api/v1/payments/status/:registrationId` | Required | Check payment status |

### Ticket Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/v1/tickets/:registrationId` | Required | Get ticket details |
| GET | `/api/v1/tickets/:registrationId/public` | None (email verified) | Guest ticket access |
| GET | `/api/v1/tickets/:registrationId/download` | Required | Download ticket PDF |
| POST | `/api/v1/tickets/:registrationId/resend` | Required | Resend ticket email |

### Auth (Magic Link)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/v1/auth/magic-link/request` | None (rate-limited) | Request magic link |
| GET | `/api/v1/auth/magic-link/verify` | None | Verify token and auto-login |

---

## Data Models

### EventRegistration

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| eventId | String | Event reference |
| attendeeId | String | User reference |
| status | Enum | PENDING, CONFIRMED, CANCELLED |
| totalAmount | Decimal | Total paid |
| paymentStatus | Enum | PENDING, COMPLETED, FAILED, AMOUNT_MISMATCH |
| qrCodeDataUrl | String | Base64-encoded QR PNG |
| backupCode | String | 10-char alphanumeric fallback |
| ticketEmailSentAt | DateTime | When ticket email was sent |
| ticketEmailStatus | Enum | SUCCESS, FAILED |

### EventPaymentTransaction

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| registrationId | String | Registration reference |
| gateway | Enum | PAYSTACK, STRIPE, MPESA |
| gatewayReference | String | Payment reference |
| transactionNumber | String | Unique transaction ID |
| amount | Decimal | Main currency unit |
| gatewayAmount | Int | Smallest unit (kobo/cents) |
| paymentStatus | String | success, failed |
| idempotencyKey | String | Duplicate prevention |

### CartReservation

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId / sessionId | String | Owner identifier |
| status | Enum | ACTIVE, RESERVED, ABANDONED, EXPIRED |
| expiresAt | DateTime | 8-minute timeout |
| items | CartItem[] | Event, ticket type, quantity, prices |

---

## Key Files

| Component | Path |
|-----------|------|
| Registration page | `client/src/pages/RegisterEvent.tsx` |
| Modal registration | `client/src/components/event-details/UnifiedRegistrationModal.tsx` |
| Payment page | `client/src/pages/Payment.tsx` |
| Confirmation (paid) | `client/src/pages/Confirmation.tsx` |
| Confirmation (free/guest) | `client/src/pages/RegistrationConfirmation.tsx` |
| Ticket view | `client/src/pages/user/TicketViewPage.tsx` |
| Attendee dashboard | `client/src/pages/user/UserDashboard.tsx` |
| My tickets | `client/src/pages/user/MyTickets.tsx` |
| Ticket transfer | `client/src/pages/user/TicketTransfer.tsx` |
| Ticket resale | `client/src/pages/user/TicketResale.tsx` |
| Event API (registration) | `client/src/lib/event-api.ts` |
| Payment API | `client/src/lib/payment-api.ts` |
| Ticket API | `client/src/lib/ticket-api.ts` |
| Auth API (magic link) | `client/src/lib/auth-api.ts` |
| Payment service | `server/src/services/payment.service.ts` |
| Ticket service | `server/src/services/ticket.service.ts` |
| Cart service | `server/src/services/cart.service.ts` |
| Auth service (magic link) | `server/src/services/auth.service.ts` |
| Event service (registration) | `server/src/services/event.service.ts` |
| Email service | `server/src/services/email.service.ts` |
| Paystack gateway | `server/src/services/payment-gateways/paystack-gateway.ts` |
| Stripe gateway | `server/src/services/payment-gateways/stripe-gateway.ts` |
| M-Pesa gateway | `server/src/services/payment-gateways/mpesa-gateway.ts` |
