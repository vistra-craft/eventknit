# EventKnit Dashboard Architecture
## Event Management, Admin Oversight & On-Site Operations

> **Document Purpose:** Define the roles, responsibilities, and boundaries of each dashboard section — organizer event management, admin oversight, and on-site event operations. This document is the single source of truth for how these three contexts interact.

---

## Table of Contents

1. [Mental Model](#1-mental-model)
2. [Organizer Dashboard — My Events](#2-organizer-dashboard--my-events)
3. [Admin Dashboard — Platform Oversight](#3-admin-dashboard--platform-oversight)
4. [Managed Events — Platform-Run Events](#4-managed-events--platform-run-events)
5. [Event Day Hub — On-Site Operations](#5-event-day-hub--on-site-operations)
6. [Role-Based Access Matrix](#6-role-based-access-matrix)
7. [Naming Decisions](#7-naming-decisions)
8. [What Changes, What Stays](#8-what-changes-what-stays)
9. [Industry Standards Reference](#9-industry-standards-reference)
10. [Open Questions](#10-open-questions)

---

## 1. Mental Model

Three people, three jobs, three dashboards:

```
┌─────────────────────────────────────────────────────────────────────┐
│  ORGANIZER                                                          │
│  "I create and run my own events"                                   │
│  Full event lifecycle — create, publish, sell, manage, analyse      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  ADMIN                                                              │
│  "I oversee the platform and ensure events meet our standards"      │
│  Monitor, approve, moderate — rarely edit, always audit             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  TELLER / ON-SITE STAFF                                             │
│  "I run the event on the day — check people in, print badges"       │
│  Operational tools only — no event configuration access             │
└─────────────────────────────────────────────────────────────────────┘
```

These three jobs correspond to three distinct sections:

| Job | Section | Path |
|-----|---------|------|
| Create & manage events | Organizer Dashboard | `/organizer/*` |
| Oversee & approve platform events | Admin Dashboard | `/admin/events/*` |
| Run events commissioned by EventKnit | Managed Events | `/admin/managed-events/*` |
| Check-in, scanning, printing on-site | Event Day Hub | `/admin/event-day/*` and `/organizer/event-day/*` |

The key principle: **every section has a clear owner and a clear job. Overlap is intentional only in shared operational tools.**

---

## 2. Organizer Dashboard — My Events

### Philosophy

An organizer owns their events completely. No admin should edit an organizer's event without an explicit support request. Organizers should never feel that the platform can silently alter their event.

This mirrors the Shopify merchant model — Shopify staff can view your store for support, but cannot change your products without your request and a logged reason.

### What Organizers Can Do

**Event Lifecycle**
- Create events (wizard or template)
- Save as draft, publish, schedule, recall, cancel, delete
- Clone events and save as templates
- Set event visibility (public, private, unlisted, invite-only)

**Ticketing**
- Create ticket types (free, paid, donation, capacity-limited)
- Advanced packages — group tickets, VIP bundles, early-bird, complementary
- Dynamic pricing rules
- Promo codes and discount management
- Seat map configuration

**Attendee Management**
- View and search all registrations
- Export attendee lists (CSV)
- Manually register or import attendees
- Issue complementary tickets with claim links
- Send targeted communications to attendee segments
- Tag and segment attendees

**Team & Venue**
- Invite staff with role-based permissions (ORGANIZER_STAFF, ORGANIZER_TELLER)
- Define venue details, capacity, and seating sections
- Assign staff to specific event roles

**Analytics & Finance**
- Real-time ticket sales and revenue
- Attendee check-in rate and traffic flow
- Promo code performance
- Payout management and disbursement status

**Payment Visibility — What Organizers See**

Organizer payment visibility is tiered by a `organizerDataAccess` setting per event (`RESTRICTED`, `STANDARD`, `FULL`). This allows platform-level control over how much financial detail an organizer can see — useful for compliance, disputes, or sensitive events.

| Field | RESTRICTED | STANDARD | FULL |
|-------|-----------|----------|------|
| Total revenue (summary card) | ✅ | ✅ | ✅ |
| Total attendee count | ✅ | ✅ | ✅ |
| Per-attendee amount paid | ❌ | ✅ | ✅ |
| Per-attendee payment status (paid/pending/failed) | ❌ | ✅ | ✅ |
| Per-attendee payment method (card/mpesa/etc.) | ❌ | ❌ | ✅ (detail sheet only) |
| Revenue breakdown by ticket type | ❌ | ✅ | ✅ |
| Estimated payout amount | ❌ | ✅ | ✅ |
| Platform fee amount | ❌ | ❌ | ❌ (never — shown as "calculated at payout") |
| Gateway transaction ID | ❌ | ❌ | ❌ (never — admin only) |
| Disbursement/remittance history | ❌ | ❌ | ❌ (shown after payout completes) |

**The rule:** Organizers always see how much money they are owed and per-attendee amounts at STANDARD+. They never see gateway transaction IDs, raw platform fee calculations, or other organizer's data. These are platform-internal fields.

**Event Day Operations**
- Access the Event Day Hub for their own events (check-in, scanning, printing)
- Their tellers (ORGANIZER_TELLER role) access Event Day Hub without dashboard access

### Route Structure

```
/organizer/
├── dashboard                    — overview stats
├── events                       — UnifiedEventsPage (all/upcoming/past/drafts/templates)
│   └── [eventId]/manage         — EventManagement full editor
│       ├── details
│       ├── tickets
│       ├── seating
│       ├── attendees
│       ├── communications
│       └── analytics
├── event-day/                   — on-site operations (see §5)
│   ├── event/:eventId           — event day dashboard
│   ├── scanner                  — QR check-in scanner
│   ├── print                    — badge printing
│   └── history                  — scan audit log
├── analytics/
├── finance/
├── marketing/
└── settings/
```

### Current Status
✅ **Complete and well-structured.** `UnifiedEventsPage` → `EventManagement.tsx` tabs (Details, Tickets, Seating, Attendees, Communications, Analytics) covers the full lifecycle. No changes required to the core organizer event management flow.

---

## 3. Admin Dashboard — Platform Oversight

### Philosophy

Admins are platform stewards, not event managers. Their job is to ensure the platform runs cleanly — events meet standards, organizers are verified, financials are correct, and the system is healthy.

**The default for admins is read-only.** When an admin needs to make a change to an organizer's event, it should be:
1. Explicitly requested by the organizer (via support ticket) OR
2. A platform action (policy violation, legal order, fraud investigation)

In both cases, the action is **logged with a reason, and the organizer is notified.**

This is how Eventbrite, Cvent, and Stripe handle it — platform support can assist, but they cannot silently alter your account.

### What Admins Can Do

**Monitoring (always available, always read-only)**
- View all events across all organizers
- See event status, ticket sales, attendee counts, revenue
- Filter by organizer, date, category, status
- See organizer profile and KYC status alongside their events
- View full event details without an edit form

**Approval & Moderation (gated actions)**
- Approve pending events for publication
- Decline events with a reason (organizer notified)
- Recall published events (with logged reason)
- Feature events on the platform homepage
- Flag events for review
- Suspend or remove events for policy violations

**Organizer Support (support mode — logged)**
- When an organizer raises a support request, admin can enter "Support Mode" on that event
- All changes made in support mode are logged: who changed what, when, and why
- Organizer receives a notification summarising what was changed
- Only fields relevant to the support request should be editable (not free-form edit access)

**Platform-Level Controls**
- KYC review and verification
- User account management
- Financial oversight and reconciliation
- System health and maintenance
- Integration management

### What Admins Cannot Do (without a support request)

- Directly edit an organizer's event title, dates, description, pricing
- Add or remove ticket types from an organizer's event
- Access an organizer's private communications with their attendees
- Modify an organizer's payout details

### Route Structure

```
/admin/
├── events/
│   ├── (index)              — AllEventsPage — full platform event list (read-only)
│   ├── pending              — PendingApprovalPage — approval queue
│   ├── featured             — Featured events management
│   ├── upcoming             — Upcoming events monitor
│   ├── past                 — Historical events
│   ├── declined             — Declined events
│   ├── recalled             — Recalled events
│   └── :eventId             — EventDetailsPage (read-only + approval actions + support mode)
```

### EventDetailsPage — Admin View

The admin event detail page is not an edit form. It is an information dashboard with contextual actions:

```
┌──────────────────────────────────────────────────────────────┐
│  [Event Title]                          Status: Published     │
│  Organizer: Jane Doe · KYC Verified ✓                        │
├──────────────────────────────────────────────────────────────┤
│  OVERVIEW      ATTENDEES      FINANCIALS      ACTIVITY LOG   │
├──────────────────────────────────────────────────────────────┤
│  [Event details displayed in read-only fields]               │
│  [Attendee table — view only]                                │
│  [Financial breakdown]                                       │
│  [Full audit trail of all changes ever made to this event]   │
├──────────────────────────────────────────────────────────────┤
│  ACTIONS                                                     │
│  [Approve] [Decline] [Feature] [Recall] [Contact Organizer]  │
│  [Support Mode ↗] — opens logged edit session                │
└──────────────────────────────────────────────────────────────┘
```

### Payment Visibility — What Admins See

Admins have **full, unrestricted payment visibility** across all events. This is non-negotiable — admins need complete financial data for compliance, fraud detection, dispute resolution, and reconciliation. There is no access tier for admins; they always see everything.

**Payment Summary (per event)**
- Total revenue from all completed payments
- Count of successful, pending, and failed payments
- Payment methods breakdown — how many transactions per method and total per method (card, M-Pesa, bank transfer, etc.)

**Individual Transaction Records**
Every payment made by every attendee is visible to admins as a searchable, filterable table:

| Field | Visible to Admin |
|-------|-----------------|
| Attendee name | ✅ |
| Attendee email | ✅ |
| Ticket type purchased | ✅ |
| Quantity | ✅ |
| Amount paid | ✅ |
| Payment method | ✅ |
| Payment status (completed/pending/failed) | ✅ |
| Gateway transaction ID | ✅ (searchable) |
| Transaction timestamp | ✅ |

**Financial Breakdown**
- Total event gross revenue
- Organizer's share (platform percentage applied)
- Platform fees (the platform's cut, exact amount)
- This is the only view where platform fees are shown as a concrete number

**Remittance & Disbursement History**
- All disbursement records for the event
- Disbursement ID, transaction reference, amount, date, status (completed/pending/failed)
- Organizer's bank details (masked — account number and routing shown partially for verification)

**Refund Details**
- All refund requests and their status
- Original payment linked to each refund

**Why this is correct:** Admins are accountable for the platform's financial integrity. They cannot investigate disputes, detect fraud, or reconcile platform revenue without seeing the full picture. Organizers do not need and should not have gateway-level data — their concern is revenue earned, not transaction infrastructure.

### Current Status
✅ `AllEventsPage`, `PendingApprovalPage`, `EventDetailsPage` are correct in philosophy.
🟡 `EventDetailsPage` may need the "Support Mode" audit layer.
🔴 `EventManagement.tsx` with `isAdminMode` should be removed from `/admin/service-point/event/:id/manage` — that route blurs the line. Admin event editing belongs only in support mode on `EventDetailsPage`.

---

## 4. Managed Events — Platform-Run Events

### Philosophy

Sometimes EventKnit is not just a platform — it acts as the event management company itself. Corporate clients, NGOs, government agencies, or large associations commission EventKnit to plan, set up, and run an event on their behalf. This is called **white-glove service** in the industry.

These events are fundamentally different from organizer events:
- They are owned by the platform, not an organizer
- EventKnit staff have full control (create, edit, publish, manage)
- The "organizer" is the client (external), not a platform user
- After the event, a report may be handed to the client

This should be completely separate from the admin oversight section. Mixing "monitor organizer events" and "manage platform events" in the same interface creates confusion about what role the admin is playing.

### What Managed Events Covers

**Event Setup (full organizer-equivalent access)**
- Create the event with all details
- Set up ticket types, pricing, capacity
- Design and configure seating
- Build registration forms
- Configure communications

**Client Management**
- Record who commissioned the event (client name, contact, contract reference)
- Attach brief/requirements documents
- Track deliverables and milestones

**Team Assignment**
- Assign EventKnit staff as the event team
- Assign a lead manager
- Define staff roles for the event day

**Operations (via Event Day Hub)**
- Full access to scanner, badge printing, walk-in registration
- Staff performance monitoring during the event

**Post-Event**
- Attendee report for the client
- Financial summary and invoice generation
- Event debrief

### Route Structure

```
/admin/managed-events/
├── (index)                  — list of all platform-managed events
├── create                   — new managed event (full wizard)
├── :eventId/
│   ├── overview             — event summary + client details
│   ├── setup                — full event configuration (EventManagement equivalent)
│   │   ├── details
│   │   ├── tickets
│   │   ├── seating
│   │   └── registration
│   ├── team                 — assigned EventKnit staff
│   ├── attendees            — registrations and check-in status
│   ├── communications       — emails, notifications to attendees
│   ├── analytics            — live and post-event metrics
│   └── report               — client-facing post-event report
```

### How This Differs from Admin Event Oversight

| Admin Events (`/admin/events`) | Managed Events (`/admin/managed-events`) |
|-------------------------------|------------------------------------------|
| Organizer owns the event | EventKnit owns the event |
| Admin monitors only | Admin has full edit access |
| Read-only by default | Full CRUD |
| Approval and moderation actions | Full management actions |
| Organizer is a platform user | Client is an external entity |
| Mixed with all platform events | Separate, curated list |

### Current Status
🔴 **Does not exist as a separate section.** Currently, admin-created events and managed events are conflated with the oversight section, and event editing leaks into the Service Point via `isAdminMode`. A dedicated Managed Events section needs to be created.

---

## 5. Event Day Hub — On-Site Operations

### Philosophy

**Renamed from: "Service Point"**

The Event Day Hub is the tool used by staff physically present at the venue on event day. It is an **operational tool, not a management tool.** Think of it as the tablet at the entrance — it scans tickets, prints badges, registers walk-ins, and monitors crowd flow.

It has nothing to do with creating or configuring events. By the time someone opens the Event Day Hub, the event is already configured and published. The job now is to run it smoothly.

### Why "Service Point" Was Confusing

- "Service Point" in retail means a customer support counter — wrong connotation
- It implied a management interface, not an operational one
- Having `EventManagement.tsx` inside it with `isAdminMode` made it feel like event editing belongs here
- New staff couldn't tell if it was for check-in or for managing events

### Why "Event Day Hub"

- "Event Day" immediately signals when this is used — on the day of the event
- "Hub" signals it is the central operational tool for that day
- Clear separation from event management (which happens before event day)
- Familiar to event industry professionals

### Who Uses It

| Role | Access | Scope |
|------|--------|-------|
| ORGANIZER | Their own events | Full operational access |
| ORGANIZER_TELLER | Their assigned events | Scanner + printing only |
| ADMIN_STAFF | All events | Full operational access + monitoring |
| TELLER (admin) | Assigned events | Scanner + printing only |
| SUPERADMIN | All events | Full access |

Organizers and admins access the same underlying operational components — the interface is the same, the data scope differs (organizer sees their events, admin sees all).

### Features

**Check-In & Scanning**
- QR code scanner for ticket validation
- Real-time check-in status updates
- Manual check-in override (with reason logged)
- Multi-device sync (multiple scanners at different entrances)

**Badge Printing**
- On-demand badge generation and printing
- Template selection per event
- Reprint capability
- Server-side print tracking (who printed what and when)

**Walk-In Registration**
- Day-of registration for attendees without pre-booking
- 3-step OTP flow: Phone → Verify → Details → Ticket issued
- Creates a ticket record linked to the event

**Attendee Management (operational)**
- Search attendees by name, ticket ID, phone
- View check-in status, ticket type, seat assignment
- Mark no-shows
- Session/track check-in for multi-session events

**Facility & Capacity**
- Define venue zones and their capacities
- Track real-time occupancy per zone
- Emergency muster report (who is currently inside)
- Bulk zone assignment

**Templates**
- Badge template editor (organizer-scoped or event-scoped)
- Create, preview, and test badge layouts
- Template library per organizer

**Staff Performance**
- Real-time tracking of check-ins processed per staff member
- Speed and accuracy metrics
- Useful for large events with multiple entry points

**Monitoring (admin view)**
- Platform-wide live dashboard across all running events
- Flag events that need attention (queue building, scanner errors)
- Remote assist capability

### Route Structure

```
/organizer/event-day/               — organizer access
├── (index)                         — event selector (organizer's events)
├── event/:eventId/                 — event day dashboard
│   ├── overview                    — live stats (check-ins, queue, capacity)
│   ├── attendees                   — attendee list + check-in status
│   ├── sessions                    — multi-session tracking
│   └── no-shows                    — no-show report + CSV export
├── scanner                         — QR code scanner
├── print                           — badge printing center
├── templates                       — badge template management
├── walk-in                         — on-site registration
├── zones                           — facility zones + occupancy
└── history                         — scan audit log

/admin/event-day/                   — admin access (all events)
├── (index)                         — event selector (all platform events)
├── event/:eventId/                 — same tabs as organizer view + admin monitoring
│   ├── overview
│   ├── attendees
│   ├── sessions
│   ├── no-shows
│   └── live-monitor                — admin-only: platform-wide realtime dashboard
├── scanner
├── print
├── templates
├── walk-in
├── zones
├── printers                        — printer device management
└── history
```

### What Moves OUT of Event Day Hub

The following does NOT belong in Event Day Hub:

- Event creation or editing (belongs in organizer dashboard or managed events)
- Ticket type configuration (belongs in organizer dashboard)
- Attendee communications / email campaigns (belongs in organizer dashboard)
- Financial management or payouts (belongs in organizer finance section)
- Analytics dashboards beyond day-of metrics (belongs in organizer analytics)

### Current Status
✅ The operational features (scanner, printer, walk-in, zones, history, templates) are well-implemented.
🔴 Path should change from `/admin/service-point/*` → `/admin/event-day/*` and `/organizer/service-point/*` → `/organizer/event-day/*`
🔴 `EventManagement.tsx` with `isAdminMode` at `/admin/service-point/event/:id/manage` should be removed
🟡 Organizer access is currently `/organizer/service-point/*` — rename the path

---

## 6. Role-Based Access Matrix

### Event Management Access

| Action | Organizer | Admin (Oversight) | Admin (Support Mode) | Admin (Managed Events) |
|--------|-----------|-------------------|----------------------|------------------------|
| Create event | ✅ Own | ❌ | ❌ | ✅ Platform-owned |
| Edit event details | ✅ Own | ❌ | ✅ Logged + notified | ✅ Platform-owned |
| Edit ticket types | ✅ Own | ❌ | ✅ Logged + notified | ✅ Platform-owned |
| Publish event | ✅ Own | ❌ | ❌ | ✅ Platform-owned |
| Delete event | ✅ Own | ❌ | ❌ | ✅ Platform-owned |
| View event details | ✅ Own | ✅ All (read-only) | ✅ All | ✅ Platform-owned |
| View attendees | ✅ Own | ✅ All (read-only) | ✅ All | ✅ Platform-owned |
| Approve event | ❌ | ✅ | ✅ | ✅ |
| Decline event | ❌ | ✅ | ✅ | ✅ |
| Feature event | ❌ | ✅ | ✅ | ✅ |
| Recall event | ❌ | ✅ | ✅ | ✅ |
| View audit trail | ❌ | ✅ All | ✅ All | ✅ |

### Payment Data Access

This is the most sensitive data boundary. The rule is simple: **admins see everything, organizers see what affects their payout.**

| Payment Field | Organizer (RESTRICTED) | Organizer (STANDARD) | Organizer (FULL) | Admin |
|---------------|------------------------|----------------------|-----------------|-------|
| Total revenue (event summary) | ✅ | ✅ | ✅ | ✅ |
| Total attendee count | ✅ | ✅ | ✅ | ✅ |
| Per-attendee name + email | ✅ | ✅ | ✅ | ✅ |
| Per-attendee amount paid | ❌ | ✅ | ✅ | ✅ |
| Per-attendee payment status | ❌ | ✅ | ✅ | ✅ |
| Per-attendee payment method | ❌ | ❌ | ✅ | ✅ |
| Revenue breakdown by ticket type | ❌ | ✅ | ✅ | ✅ |
| Estimated / actual payout amount | ❌ | ✅ | ✅ | ✅ |
| Platform fee (exact amount) | ❌ | ❌ | ❌ | ✅ |
| Gateway transaction ID | ❌ | ❌ | ❌ | ✅ |
| Payment methods breakdown grid | ❌ | ❌ | ❌ | ✅ |
| Disbursement / remittance history | ❌ | ❌ | ❌ | ✅ |
| Organizer bank details | ❌ | ❌ | ❌ | ✅ (masked) |
| Refund records | ❌ | Limited | Limited | ✅ Full |
| Failed payment details | ❌ | ❌ | ❌ | ✅ |

**Key principle:** The gateway transaction ID is the most sensitive field — it is used for dispute resolution with payment gateways and should never be exposed to organizers. Organizers receive an order reference (internal) not a gateway reference. Admins need the gateway reference for chargebacks, reconciliation, and fraud investigation.

### Event Day Hub Access

| Action | Organizer | ORGANIZER_TELLER | Admin | TELLER (admin) |
|--------|-----------|-----------------|-------|----------------|
| Check-in (scan QR) | ✅ Own events | ✅ Assigned events | ✅ All events | ✅ Assigned events |
| Print badges | ✅ Own | ✅ Assigned | ✅ All | ✅ Assigned |
| Walk-in registration | ✅ Own | ✅ Assigned | ✅ All | ✅ Assigned |
| View attendee list | ✅ Own | ✅ Assigned | ✅ All | ✅ Assigned |
| Manage facility zones | ✅ Own | ❌ | ✅ All | ❌ |
| Badge template editor | ✅ Own | ❌ | ✅ All | ❌ |
| Staff performance view | ✅ Own | ❌ | ✅ All | ❌ |
| Platform live monitor | ❌ | ❌ | ✅ All events | ❌ |
| Printer management | ✅ Own | ❌ | ✅ All | ❌ |

---

## 7. Naming Decisions

### "Service Point" → "Event Day Hub"

| Option | Pros | Cons |
|--------|------|------|
| **Event Day Hub** ✅ | Clear timing (event day), "hub" implies central ops tool | Slightly long |
| On-Site Operations | Descriptive | Clinical, not friendly |
| Check-In Hub | Simple | Undersells badge printing, zones, walk-in features |
| Event Operations | Professional | Overlaps with general event management |
| Service Point | Familiar internally | Wrong industry connotation (retail), confusing |

**Decision: Event Day Hub**

Reasoning: It signals exactly when to use it (event day), communicates that it's a central operational tool, and does not overlap with "event management" terminology. The slight length is acceptable — it becomes "Event Day" colloquially.

### "Admin Events" vs. "Managed Events"

**Admin Events (`/admin/events`)** = The oversight section. Admins monitoring all organizer events. Read-only with moderation actions.

**Managed Events (`/admin/managed-events`)** = EventKnit running events on behalf of clients. Full management access.

These need distinct names and sections because the admin's role is completely different in each:
- In Admin Events, they are a **platform steward**
- In Managed Events, they are an **event organizer**

---

## 8. What Changes, What Stays

### No Changes Required

| Component | Why It Stays |
|-----------|-------------|
| `UnifiedEventsPage.tsx` (organizer) | Correct, complete |
| `EventManagement.tsx` (organizer) | Correct, complete |
| `PendingApprovalPage.tsx` (admin) | Correct philosophy |
| `AllEventsPage.tsx` (admin) | Correct philosophy |
| `EventDetailsPage.tsx` (admin) | Correct — read-only with actions |
| Scanner, print, walk-in, zones components | Correct operational tools |
| Badge template system | Correct, well-implemented |
| Staff performance tracking | Correct |

### Path Renames (no logic changes, just routes)

| Current Path | New Path |
|-------------|----------|
| `/admin/service-point/*` | `/admin/event-day/*` |
| `/organizer/service-point/*` | `/organizer/event-day/*` |
| Sidebar label "Service Point" | "Event Day Hub" |

### Things to Remove

| Item | Why |
|------|-----|
| `/admin/service-point/event/:id/manage` | Event editing does not belong in Event Day Hub |
| `isAdminMode` prop on `EventManagement.tsx` within service point | Admin event editing belongs in Support Mode on `EventDetailsPage` |

### Things to Build

| Item | Priority | Description |
|------|----------|-------------|
| **Managed Events section** (`/admin/managed-events`) | P1 | Full event management for platform-owned events |
| **Support Mode on EventDetailsPage** | P2 | Logged admin edit session, organizer notified |
| **Audit trail on EventDetailsPage** | P2 | Full change history visible to admin |
| **Organizer attribution on AllEventsPage** | P3 | Show organizer name/avatar on each event card |

---

## 9. Industry Standards Reference

### Eventbrite
- Organizers have full event control via dashboard
- Eventbrite staff use a separate internal tool for support — not the organizer dashboard
- Check-in via a dedicated "Organizer" mobile app — separate from the main dashboard
- Admins cannot edit organizer events without a formal support request

### Shopify
- Merchants have full store control
- Shopify staff can view stores for support but require explicit permission to make changes
- All support actions are logged in a "collaborator access" audit trail
- Staff view ≠ merchant view — different interfaces entirely

### Cvent
- Planner dashboard for event creation (organizer equivalent)
- Admin/platform has an oversight console — reporting and compliance, not editing
- "Managed Events" product for events run by Cvent Professional Services
- On-site tools are a separate product ("OnArrival") — equivalent to Event Day Hub
- Clear boundary: the platform never touches a planner's event without a support ticket

### Stripe / Twilio (SaaS with Support Model)
- Customer dashboard for account management
- Support console for platform staff — view-only by default
- "Impersonation" mode for support — fully logged, time-limited, customer notified
- This is the model for EventKnit's "Support Mode" on admin event detail

---

## 10. Open Questions

These require product decisions before implementation:

**Q1: Support Mode Scope**
When an organizer requests admin support on an event, which fields can the admin edit?
- Option A: All fields (full edit access, just logged)
- Option B: Only the fields related to the support request (scoped)
- Option C: Admin can only make recommendations; organizer approves changes

**Q2: Managed Events — Client Accounts**
For platform-managed events (NGO, government, corporate):
- Should the client get a read-only dashboard to monitor their event?
- Should clients be able to request changes via a portal?
- Should the final attendee report be auto-generated and emailed to the client?

**Q3: Organizer Visibility into Support Actions**
When admin edits an organizer's event in support mode:
- Should the organizer see the change in real-time or only after the session ends?
- Should they receive an email summary or an in-app notification?
- Should they be able to revert a support-mode change?

**Q4: Event Day Hub — Shared vs. Separate Routes**
Currently organizer and admin event day paths hit the same components with different data scope.
- Keep as shared components with role-based data filtering (current approach) ✅
- Or build separate components per role?
Recommendation: Keep shared components — simpler to maintain, consistent UX.

**Q5: Rename Timing**
Path renames (`service-point` → `event-day`) can happen independently of new feature builds. Should the rename happen first (quick win) or together with the Managed Events build?
Recommendation: Rename first — it unblocks the mental model for the team immediately.

---

*Last updated: March 2026*
*Authors: EventKnit Engineering*
