# Payment & Disbursement System

This document covers the full lifecycle of money on the EventKnit platform: how attendees pay for tickets, how the platform calculates its fees, how organizers receive their funds, and how refunds flow back. It serves as both a **technical reference** for engineers and a **stakeholder guide** for understanding the financial operations.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Payment Processing](#2-payment-processing)
3. [Platform Fee Calculation](#3-platform-fee-calculation)
4. [Automatic Post-Event Payouts](#4-automatic-post-event-payouts)
5. [Manual Disbursements (Admin)](#5-manual-disbursements-admin)
6. [Organizer Payout Preferences](#6-organizer-payout-preferences)
7. [Refunds](#7-refunds)
8. [Verification Requirements](#8-verification-requirements)
9. [API Reference](#9-api-reference)
10. [Data Models](#10-data-models)
11. [Technical Guarantees](#11-technical-guarantees)
12. [Configuration](#12-configuration)

---

## 1. System Overview

### Money Flow

```
Attendee pays for ticket
       |
       v
Payment Gateway (Paystack / Stripe)
       |
       v
Webhook confirms payment
       |
       v
Platform Fee calculated (7.5% all-in default)
       |
       +---> Platform keeps 7.5%
       +---> 92.5% held for organizer
              |
              v
        Grace period (5 business days after event ends)
              |
              v
        Auto-disbursement created
              |
              v
        Admin processes bank transfer
              |
              v
        Organizer receives funds
```

### Key Participants

| Role | Actions |
|------|---------|
| **Attendee** | Pays for tickets, can request refunds |
| **Organizer** | Creates events, receives payouts, configures payout preferences |
| **Admin** | Processes disbursements, manages refunds, reconciles payments |
| **System (Cron)** | Auto-creates disbursements after grace period, sends notifications |

### Status Lifecycles

**Payment:** `pending` -> `success` | `failed` | `cancelled` | `AMOUNT_MISMATCH`

**Platform Fee:** `calculated` -> `disbursed` | `refunded`

**Disbursement:** `pending` -> `processing` -> `completed` | `failed` | `cancelled`

**Refund:** `pending` -> `processing` -> `completed` | `failed` | `cancelled`

---

## 2. Payment Processing

### 2.1 Payment Initialization

When an attendee purchases a ticket, the system initializes a payment with the selected gateway.

**Service:** `PaymentService.initializePayment()`
**File:** `server/src/services/payment.service.ts`

**Steps:**
1. Validate the registration exists and is in `PENDING` status
2. Check for existing payments (idempotency — see Section 11)
3. Select gateway (Paystack or Stripe, based on request or default)
4. Generate a unique payment reference: `EVT-{registrationId}-{timestamp}`
5. Call the gateway's `initializePayment()` with amount, currency, email, metadata
6. Return an authorization URL for the attendee to complete payment

**Supported Gateways:**
- **Paystack** — Primary gateway. Supports NGN, GHS, ZAR, USD
- **Stripe** — Secondary. Supports all Stripe-supported currencies
- **PayPal** — Planned, not yet implemented

### 2.2 Webhook Handling

After the attendee completes payment on the gateway's hosted page, the gateway sends a webhook to confirm the transaction.

**Endpoint:** `POST /api/v1/payments/webhook`
**Service:** `PaymentService.handleWebhook()`

**Webhook Signature Verification:**

| Gateway | Algorithm | Key Source |
|---------|-----------|-----------|
| Paystack | HMAC-SHA512 | `config.paystack.secretKey` |
| Stripe | HMAC-SHA256 with timestamp (5-min tolerance) | `config.stripe.webhookSecret` |

**Success Processing Steps:**
1. Verify webhook signature (reject if invalid)
2. Record webhook in `PaymentWebhookEvent` table (idempotency guard)
3. Re-verify payment with gateway using `verifyPayment(reference)`
4. Validate amount (tolerance: **0.01** — 1 cent/kobo for rounding)
5. Validate attendee email matches
6. Create `EventPaymentTransaction` record
7. Update registration status to `CONFIRMED`
8. **Create Platform Fee** via `PlatformFeeService.createPlatformFee(transactionId)`
9. Generate invoice (async, non-blocking)
10. Send ticket confirmation email
11. Notify organizer of payment received

**Amount Mismatch Handling:**
If the paid amount differs from the expected amount by more than 0.01:
- Registration status set to `AMOUNT_MISMATCH`
- Both attendee and organizer notified with details (expected vs. paid amount)
- Payment still logged for auditing purposes

### 2.3 Payment Failure

If a gateway reports `charge.failed`:
- Registration `paymentStatus` set to `FAILED`
- Attendee notified; can retry payment
- Event capacity slots restored

---

## 3. Platform Fee Calculation

Every successful payment triggers automatic platform fee calculation.

**Service:** `PlatformFeeService`
**File:** `server/src/services/platform-fee.service.ts`

### 3.1 Fee Formula

```
feeAmount       = grossAmount * (feePercentage / 100)
organizerAmount = grossAmount - feeAmount
```

**Default fee:** 7.5% of the gross transaction amount (all-in — absorbs payment processing costs).

**Configurable bounds:**
- `minimumFee` — Floor on fee amount (optional)
- `maximumFee` — Cap on fee amount (optional)
- `fixedFeePerTicket` — Reserved for future use (currently 0 / disabled)
- Fee can never exceed the gross amount

**Example:**
| Gross | Fee % | Fee | Organizer |
|-------|-------|-----|-----------|
| KES 10,000 | 7.5% | KES 750 | KES 9,250 |
| KES 500 | 7.5% | KES 37.50 | KES 462.50 |
| KES 1,000 | 7.5% | KES 75 | KES 925 |

### 3.2 Fee Model Rationale

EventKnit uses a **7.5% all-in** fee model — a single percentage that absorbs payment gateway processing costs (Paystack, M-Pesa, Stripe). This is a deliberate cost-leadership strategy for the Kenyan market.

#### Why 7.5% all-in?

**Competitive positioning (Kenya):**

| Platform | Fee Model | Effective Rate |
|----------|-----------|---------------|
| **Mookh** | 8% all-in | 8% |
| **TicketSasa** | 10% all-in | 10% |
| **Eventbrite** | 3.7% + $1.79/ticket + 2.9% processing | ~8-12% on typical tickets |
| **EventKnit** | **7.5% all-in** | **7.5%** |

At 7.5%, EventKnit undercuts Mookh (8%) and TicketSasa (10%) while remaining sustainable. The all-in model matches what Kenyan organizers expect — competitors quote a single number, so should we.

#### Why no per-ticket fixed fee?

1. **Competitor alignment** — Established Kenyan ticketing platforms (Mookh, TicketSasa) do not charge per-ticket fixed fees. Introducing one would make price comparisons harder and create friction during organizer onboarding. Organizers in this market expect a single percentage.

2. **M-Pesa dominance** — ~70% of Kenya's digital payments flow through M-Pesa, which charges merchants ~0.5% (vs 2.9%+ for card payments). This collapses the payment processing cost that would justify a fixed fee in card-heavy markets. The blended processing cost across M-Pesa and card payments is low enough that a percentage-only model remains profitable.

3. **Growth market sensitivity** — The Kenyan events market is dominated by tickets in the KES 200–1,000 range. A fixed fee of even KES 15–20 represents 1.5–10% of a KES 200 ticket, disproportionately punishing the high-volume, low-price segment that drives growth. A pure percentage treats all ticket prices equally and keeps the platform accessible to community events, student events, and grassroots organizers.

#### Future lever

The `fixedFeePerTicket` setting exists in SystemSettings (default: 0) as a reserved lever. If EventKnit expands to card-heavy markets (e.g., South Africa, Nigeria, international) where processing costs are higher, a modest per-ticket fee can be activated without code changes.

#### Configuration

All fee parameters are stored in the `SystemSettings` table and configurable via the admin dashboard at `/admin/finance/platform-fees`:

| Setting Key | Default | Description |
|-------------|---------|-------------|
| `finance.platformFeePercentage` | 7.5 | Global fee percentage (all-in) |
| `finance.minimumFee` | 0 | Minimum fee per transaction (0 = none) |
| `finance.maximumFee` | 0 | Maximum fee cap (0 = unlimited) |
| `finance.fixedFeePerTicket` | 0 | Per-ticket fixed fee (0 = disabled) |

Changes take effect within 5 minutes (in-memory cache TTL). To force immediate effect, restart the server or call `PlatformFeeService.invalidateFeeConfigCache()`.

### 3.3 Fee Record

Each fee record has:
- Unique `feeNumber` (e.g., `PF-2026-000001`)
- Status: `calculated` (waiting for disbursement) or `disbursed` (linked to a disbursement)
- 1:1 relationship with `EventPaymentTransaction`
- Optional link to `OrganizerDisbursement` via `disbursementId`

### 3.4 Idempotency

`createPlatformFee()` checks for an existing fee by `transactionId` (unique index) before creating. If a fee already exists, it returns the existing record. This prevents duplicate fees if a webhook is processed twice.

---

## 4. Automatic Post-Event Payouts

Following the Eventbrite/Humanitix model, organizer payouts are automatically created after a grace period following the event end date.

**Service:** `AutoPayoutJob`
**File:** `server/src/jobs/auto-payout.job.ts`
**Schedule:** Runs every hour (`0 * * * *`)

### 4.1 Grace Period

Funds are held for **5 business days** (Monday-Friday) after the event ends. This protects against:
- Refund requests from attendees
- Chargeback disputes from payment gateways
- Event cancellation or issues discovered post-event

The grace period is configurable via `PAYOUT_GRACE_PERIOD_BUSINESS_DAYS` environment variable.

**Business day calculation** is handled by `server/src/utils/business-days.ts` using Monday-Friday rules (no public holiday calendar — can be enhanced later).

### 4.2 Eligibility Criteria

All of the following must be true for an automatic payout to be created:

| # | Criteria | Check |
|---|----------|-------|
| 1 | Event has ended | `endDate <= cutoffDate` (or `startDate` if no `endDate`) |
| 2 | Event is approved/completed | `status IN (APPROVED, COMPLETED)` |
| 3 | Event is paid | `isFree = false` |
| 4 | Organizer identity verified | `isIdentityVerified = true` |
| 5 | Organizer KYC approved | `kycStatus = 'APPROVED'` |
| 6 | Auto-payout opted in | `PayoutPreference.autoPayoutEnabled = true` |
| 7 | Bank details configured | `bankName`, `accountNumber`, `accountName` all present |
| 8 | Pending fees exist | `PlatformFeeService.getPendingDisbursementFees()` returns > 0 |
| 9 | Above threshold (if set) | `totalAmount >= autoPayoutThreshold` |

### 4.3 Idempotency

The auto-payout job relies on `PlatformFeeService.getPendingDisbursementFees()` returning an empty array when all fees are already linked to disbursements. No separate idempotency method is needed — once fees are atomically linked to a disbursement within a `$transaction`, they will not appear in subsequent queries. This means:
- If the job runs multiple times, it will not create duplicate disbursements
- If the server was down and misses a run, it catches up on the next run (no narrow time-window queries)
- If a previous disbursement `failed`, the fees are unlinked (returned to `calculated` status), making them eligible for the next auto-payout run

### 4.4 Processing Flow

```
AutoPayoutJob.processAutoPayouts()
  |
  +---> Step 1: createAutoPayouts()
  |       |
  |       +---> Find events past grace period
  |       +---> For each event:
  |               +---> Validate organizer eligibility
  |               +---> Get payout preferences
  |               +---> Get pending fees
  |               +---> DisbursementService.createDisbursement(data, null)
  |               +---> Create audit log (DISBURSEMENT_AUTO_CREATED)
  |               +---> Send in-app notification (PAYOUT_INITIATED)
  |               +---> Send email notification
  |
  +---> Step 2: processScheduledDisbursements()
          |
          +---> Find disbursements with scheduledDate <= now
          +---> Log readiness (admin processes manually)
```

### 4.5 Error Isolation

Each event is processed independently within a try/catch. If one event fails (e.g., a database error during fee linking), the job continues processing the remaining events. Expected skip conditions (unverified organizer, no pending fees, etc.) are logged at `debug` level; unexpected errors are logged at `error` level.

### 4.6 Notifications

When a payout is auto-created:
- **In-app:** `PAYOUT_INITIATED` notification with amount, currency, disbursement reference
- **Email:** `sendPayoutInitiatedEmail()` with amount, bank details (masked: `****1234`), reference number

When a payout is completed (by admin):
- **In-app:** `PAYOUT_COMPLETED` notification with amount, payment reference
- **Email:** `sendPayoutCompletedEmail()` with amount, completion date, payment reference

### 4.7 System Kill Switch

Automatic payouts can be disabled globally by setting `AUTO_PAYOUT_ENABLED=false`. The job will skip all processing and log a debug message.

---

## 5. Manual Disbursements (Admin)

Admins retain full control over the disbursement lifecycle and can create, process, and complete disbursements independently of the automatic system.

**Service:** `DisbursementService`
**File:** `server/src/services/disbursement.service.ts`

### 5.1 Create Disbursement

`POST /api/v1/admin/finance/disbursements`

Creates a new disbursement for an organizer's event. Aggregates all pending platform fees (or specific fees by ID) into a single disbursement record.

**Validation:**
- Event must exist and belong to the specified organizer
- Organizer must have identity verification AND KYC approval
- At least one pending (undisbursed) platform fee must exist

**Atomicity:** Fee linking happens within a `prisma.$transaction`:
1. Create `OrganizerDisbursement` record (status: `pending`)
2. Update all included `PlatformFee` records: set `disbursementId` and `status = 'disbursed'`

This ensures fees are never orphaned or double-counted.

### 5.2 Process Disbursement

`POST /api/v1/admin/finance/disbursements/:id/process`

Marks a pending disbursement as `processing`. The admin initiates the actual bank transfer outside the system (or via Paystack Transfer API in future) and records the payment reference.

**Re-validates:** Organizer identity and KYC status (in case it was revoked after disbursement creation).

### 5.3 Complete Disbursement

`POST /api/v1/admin/finance/disbursements/:id/complete`

Marks a disbursement as `completed` with the external payment reference. Triggers organizer notification (in-app + email).

### 5.4 Fail Disbursement

When a bank transfer fails, the admin marks the disbursement as `failed` with a reason. This:
1. Sets the disbursement status to `failed`
2. **Unlinks all platform fees** (sets `disbursementId = null`, `status = 'calculated'`)
3. Fees are returned to the pool and become eligible for the next auto-payout or manual disbursement

### 5.5 Disbursement Numbers

Each disbursement gets a unique number in the format `DISB-{YYYY}-{NNNNNN}`, generated with a 10-attempt uniqueness check.

---

## 6. Organizer Payout Preferences

Organizers configure their payout settings through the dashboard.

**Service:** `PayoutManagementService`
**File:** `server/src/services/payout-management.service.ts`

### 6.1 Settings

| Field | Description | Default |
|-------|-------------|---------|
| `primaryMethod` | Payment method (`bank_transfer`, `paystack_transfer`) | `bank_transfer` |
| `bankName` | Bank name | — |
| `accountName` | Account holder name | — |
| `accountNumber` | Bank account number | — |
| `bankCode` | Bank sort code / routing code | — |
| `autoPayoutEnabled` | Opt into automatic post-event payouts | `false` |
| `autoPayoutThreshold` | Minimum amount before auto-payout triggers | — |
| `autoPayoutSchedule` | Payout frequency preference (`daily`, `weekly`, `monthly`) | — |
| `taxId` | Tax identification number | — |
| `taxCountry` | Tax jurisdiction country | — |

### 6.2 Schedule Payout

Organizers can manually schedule a future payout via `POST /api/v1/organizer-dashboard/payouts/schedule`. The scheduled disbursement is picked up by the `AutoPayoutJob` when `scheduledDate <= now`.

### 6.3 Payout Summary

`GET /api/v1/organizer-dashboard/payouts/summary` returns:

```json
{
  "pending": { "amount": 15000, "count": 3 },
  "scheduled": { "amount": 5000, "count": 1 },
  "totalPaid": 250000,
  "totalDisbursements": 12
}
```

- **pending** — Platform fees calculated but not yet included in any disbursement
- **scheduled** — Disbursements created but not yet completed
- **totalPaid** — All completed disbursements
- **totalDisbursements** — Count of completed disbursements

---

## 7. Refunds

**Service:** `RefundService`
**File:** `server/src/services/refund.service.ts`

### 7.1 Refund Policies

Organizers can set one of five refund policies per event:

| Policy | Behavior |
|--------|----------|
| `no_refunds` | No refunds allowed |
| `full_refund` | 100% refund up to a configurable deadline |
| `partial_refund` | Fixed percentage (default 50%) up to deadline |
| `tiered` | Multiple tiers based on days before event (e.g., 100% at 30 days, 50% at 7 days, 0% at 1 day) |
| `custom` | Text-based policy, manually adjudicated |

### 7.2 Refund Flow

```
Attendee requests refund
       |
       v
Check refund eligibility (policy + deadline)
       |
       v
Create Refund record (status: pending)
       |
       v
Admin reviews and processes via Paystack Refund API
       |
       v
Refund completed → Registration cancelled
       |
       v
Platform fee adjusted (if not yet disbursed)
```

### 7.3 Platform Fee Adjustment

For full refunds, if the associated platform fee has not yet been disbursed (`disbursementId = null`), the fee status is set to `refunded`. This prevents the refunded amount from being included in future disbursements.

If the fee has already been disbursed, the refund amount is tracked in `platformFeeRefund` on the `Refund` record for reconciliation.

### 7.4 Refund Numbers

Format: `REF-{YYYY}-{NNNNNN}`, with uniqueness guarantees.

---

## 8. Verification Requirements

EventKnit follows the **Eventbrite approach**: organizers can create events freely, but must be verified to receive payouts.

### 8.1 Verification Levels

| Level | Requirements | Capabilities |
|-------|-------------|-------------|
| **1** | Email verified | Create free events |
| **2** | Identity verified | Create paid events |
| **3** | Full KYC approved | Receive payouts from ticket sales |

### 8.2 Payout Verification Gates

Both `createDisbursement()` and `processDisbursement()` enforce:

1. **Identity Verification** — `user.isIdentityVerified === true`
2. **KYC Approval** — `user.kycStatus === 'APPROVED'`

If either check fails, a `ValidationError` is thrown with guidance on how to complete verification.

The auto-payout job silently skips unverified organizers (logged at debug level) since they can complete verification at any time — fees remain in `calculated` status until the organizer is eligible.

---

## 9. API Reference

### Payment Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/payments/initialize` | Attendee | Initialize payment for registration |
| POST | `/api/v1/payments/webhook` | None (signature verified) | Gateway webhook callback |

### Admin Finance Endpoints

All require `ADMIN_STAFF` role or higher.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/finance/insights` | Aggregated finance charts (revenue, fees, disbursements) |
| POST | `/api/v1/admin/finance/payments/sync` | Sync payments from Paystack |
| GET | `/api/v1/admin/finance/payments` | List payment transactions |
| GET | `/api/v1/admin/finance/payments/:id` | Get transaction details |
| GET | `/api/v1/admin/finance/platform-fees` | List platform fees |
| GET | `/api/v1/admin/finance/platform-fees/summary` | Fee summary for an event |
| POST | `/api/v1/admin/finance/disbursements` | Create disbursement |
| GET | `/api/v1/admin/finance/disbursements` | List disbursements |
| GET | `/api/v1/admin/finance/disbursements/summary` | Organizer disbursement summary |
| GET | `/api/v1/admin/finance/disbursements/:id` | Get disbursement details |
| POST | `/api/v1/admin/finance/disbursements/:id/process` | Mark as processing |
| POST | `/api/v1/admin/finance/disbursements/:id/complete` | Mark as completed |
| POST | `/api/v1/admin/finance/refunds` | Create refund |
| GET | `/api/v1/admin/finance/refunds` | List refunds |
| GET | `/api/v1/admin/finance/refunds/summary` | Refund summary |
| GET | `/api/v1/admin/finance/refunds/:id` | Get refund details |
| POST | `/api/v1/admin/finance/refunds/:id/process` | Process refund via gateway |
| POST | `/api/v1/admin/finance/refunds/:id/complete` | Mark refund as completed |

### Organizer Payout Endpoints

Require authenticated organizer.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/organizer-dashboard/payouts/preferences` | Get payout settings |
| PUT | `/api/v1/organizer-dashboard/payouts/preferences` | Update payout settings |
| GET | `/api/v1/organizer-dashboard/payouts/history` | Paginated payout history |
| POST | `/api/v1/organizer-dashboard/payouts/schedule` | Schedule a payout |
| GET | `/api/v1/organizer-dashboard/payouts/summary` | Payout summary |

---

## 10. Data Models

### EventPaymentTransaction

Stores every payment transaction from gateways.

| Field | Type | Description |
|-------|------|-------------|
| `transactionNumber` | String (unique) | Platform reference (e.g., `EPT-2026-000001`) |
| `gateway` | String | `PAYSTACK`, `STRIPE`, `PAYPAL` |
| `gatewayReference` | String (unique) | Gateway's reference ID |
| `gatewayAmount` | Decimal | Amount in smallest unit (kobo/cents) |
| `amount` | Decimal | Amount in major currency unit |
| `currency` | String | `NGN`, `USD`, `KES`, etc. |
| `paymentStatus` | String | `pending`, `success`, `failed`, `cancelled` |
| `idempotencyKey` | String (unique, nullable) | Prevents duplicate transactions |

### PlatformFee

One per successful payment. Tracks the platform's cut and the organizer's share.

| Field | Type | Description |
|-------|------|-------------|
| `feeNumber` | String (unique) | Platform fee reference (e.g., `PF-2026-000001`) |
| `transactionId` | String (unique FK) | Link to `EventPaymentTransaction` |
| `grossAmount` | Decimal | Total payment amount |
| `feePercentage` | Decimal | Fee rate applied (default: 7.50) |
| `feeAmount` | Decimal | Platform's fee |
| `organizerAmount` | Decimal | Organizer's share (`gross - fee`) |
| `status` | String | `calculated`, `disbursed`, `refunded` |
| `disbursementId` | String (nullable FK) | Link to `OrganizerDisbursement` |

### OrganizerDisbursement

Aggregates multiple platform fees into a single payout to the organizer.

| Field | Type | Description |
|-------|------|-------------|
| `disbursementNumber` | String (unique) | Reference (e.g., `DISB-2026-000001`) |
| `organizerId` | String (FK) | Organizer receiving funds |
| `eventId` | String (FK) | Source event |
| `totalAmount` | Decimal | Sum of all `organizerAmount` values |
| `paymentMethod` | String | `bank_transfer`, `paystack_transfer` |
| `status` | String | `pending`, `processing`, `completed`, `failed`, `cancelled` |
| `scheduledDate` | DateTime (nullable) | Future processing date |
| `paymentReference` | String (nullable) | External bank transfer reference |
| `createdBy` | String (nullable FK) | Admin ID or `null` for automated payouts |

### PaymentWebhookEvent

Prevents duplicate webhook processing (idempotency table).

| Field | Type | Description |
|-------|------|-------------|
| `gatewayEventId` | String (unique) | Gateway's unique event identifier |
| `gateway` | String | Which gateway sent the webhook |
| `eventType` | String | Webhook event type (e.g., `charge.success`) |
| `payload` | JSON | Full webhook payload |
| `status` | String | `PROCESSED`, `FAILED`, `IGNORED` |

### Refund

Tracks refund requests and their processing.

| Field | Type | Description |
|-------|------|-------------|
| `refundNumber` | String (unique) | Reference (e.g., `REF-2026-000001`) |
| `transactionId` | String (unique FK) | Original payment transaction |
| `refundAmount` | Decimal | Amount to refund |
| `refundType` | String | `full` or `partial` |
| `status` | String | `pending`, `processing`, `completed`, `failed`, `cancelled` |
| `platformFeeRefund` | Decimal (nullable) | Platform fee amount refunded |

---

## 11. Technical Guarantees

### 11.1 Idempotency

The system enforces idempotency at multiple layers to prevent duplicate or lost transactions:

| Layer | Mechanism | How It Works |
|-------|-----------|-------------|
| **Payment Initialization** | `idempotencyKey` (unique index) | Format: `{registrationId}-{amount}-{timestamp}`. If a key already exists, returns the existing transaction instead of creating a new one. States: `ALREADY_PAID` (success exists), `PENDING` (in-progress), or allows retry (on failure). |
| **Webhook Processing** | `PaymentWebhookEvent.gatewayEventId` (unique index) | Every incoming webhook is recorded by its gateway-assigned ID. If a duplicate webhook arrives, it's detected before any payment processing occurs. |
| **Platform Fee Creation** | `PlatformFee.transactionId` (unique index) | One fee per transaction. `createPlatformFee()` checks for existing fee before creating — returns existing if found. |
| **Auto-Payout Deduplication** | `PlatformFeeService.getPendingDisbursementFees()` | Returns only fees with `status = 'calculated'` AND `disbursementId = null`. Once fees are atomically linked to a disbursement within a `$transaction`, they disappear from this query. No separate idempotency table or lock is needed. |
| **Fee Linking Atomicity** | `prisma.$transaction` | Both the disbursement creation and fee linking happen in a single database transaction. If either operation fails, both are rolled back. Fees are never orphaned or double-counted. |

### 11.2 Error Isolation

- **Per-event processing:** The auto-payout job processes each event independently. One failure does not block processing of other events.
- **Non-blocking notifications:** Email and notification failures are caught and logged but do not affect the core financial operation (the disbursement is already created/completed).
- **Graceful degradation:** Database connection errors cause the job to skip the entire run and retry on the next schedule.

### 11.3 Audit Trail

Every financial operation is logged via `createAuditLog()` with:
- User who initiated the action (or organizer ID for automated payouts)
- Action type (e.g., `DISBURSEMENT_CREATED`, `DISBURSEMENT_AUTO_CREATED`, `DISBURSEMENT_PROCESSED`, `DISBURSEMENT_COMPLETED`)
- Entity type and ID
- Metadata including amounts, event details, and `automated: true/false` flag
- IP address and user agent (when available)

### 11.4 Concurrency

The system handles concurrent access through:
- **Database-level unique constraints** on critical fields (`gatewayReference`, `transactionId`, `feeNumber`, `disbursementNumber`)
- **Atomic transactions** (`prisma.$transaction`) for multi-table operations
- **Optimistic concurrency** — if two instances try to disburse the same fees simultaneously, one will find `pendingFees.length === 0` and skip

---

## 12. Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PAYOUT_GRACE_PERIOD_BUSINESS_DAYS` | `5` | Business days after event ends before auto-payout |
| `AUTO_PAYOUT_ENABLED` | `true` | System-wide kill switch for automatic payouts |
| `PAYSTACK_SECRET_KEY` | — | Paystack API secret (for webhook verification + payment) |
| `STRIPE_SECRET_KEY` | — | Stripe API secret |
| `STRIPE_WEBHOOK_SECRET` | — | Stripe webhook signing secret |
| `CLIENT_URL` | `https://eventknit.com` | Frontend URL (used in email notification links) |

### Key Constants

| Constant | Value | File | Purpose |
|----------|-------|------|---------|
| `DEFAULT_FEE_PERCENTAGE` | 7.5 | `platform-fee.service.ts` | Platform fee rate (all-in, absorbs processing) |
| Amount Tolerance | 0.01 | `payment.service.ts` | Allowed rounding difference |
| Stripe Timestamp Tolerance | 300s | `payment.service.ts` | Webhook replay window |
| Auto-Payout Cron | `0 * * * *` | `auto-payout.job.ts` | Runs every hour |

### Scheduled Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `AutoPayoutJob` | Every hour | Creates automatic disbursements for eligible post-event payouts |
| `PaymentTimeoutJob` | Every 5 min | Cancels stale pending payments |

---

## Appendix: Stakeholder FAQ

**Q: When does an organizer get paid?**
A: Automatically, 5 business days after their event ends, provided they have completed KYC verification and configured their bank details with auto-payout enabled.

**Q: Can an organizer get paid before the event ends?**
A: Not automatically. They can schedule a payout via the dashboard, which an admin would then process manually.

**Q: What happens if a refund is requested after the payout?**
A: If the platform fee has already been disbursed, the refund amount is tracked for future reconciliation. If the fee hasn't been disbursed yet, it's marked as `refunded` and excluded from payouts.

**Q: Can admins still create payouts manually?**
A: Yes. The admin finance endpoints (`POST /api/v1/admin/finance/disbursements`) remain fully functional and independent of the automatic system.

**Q: What if the organizer hasn't completed KYC?**
A: Their funds remain on the platform as `calculated` platform fees. The auto-payout job silently skips them. Once they complete KYC and enable auto-payouts, the next job run will pick up all their pending fees.

**Q: What percentage does EventKnit take?**
A: 7.5% all-in by default (absorbs payment processing costs). This is configurable globally via the admin Platform Fee Configuration page or programmatically via `SystemSettings`. See Section 3.2 for the competitive rationale.

**Q: How does the system prevent double payouts?**
A: Through atomic database transactions. When a disbursement is created, the associated platform fees are immediately linked (setting `disbursementId` and `status = 'disbursed'`). Subsequent queries for pending fees will not return these already-linked fees.
