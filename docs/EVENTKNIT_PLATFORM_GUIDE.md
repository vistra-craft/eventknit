# EventKnit Platform Guide

**Version:** 2.0
**Last Updated:** March 2026
**Audience:** Stakeholders, Business Teams, Product Managers, Partners

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Overview](#2-platform-overview)
3. [User Roles and Permissions](#3-user-roles-and-permissions)
4. [User Journeys](#4-user-journeys)
   - 4.1 Attendee Journey
   - 4.2 Organizer Journey
   - 4.3 Admin Journey
5. [Event Management](#5-event-management)
6. [Ticketing System](#6-ticketing-system)
7. [Seating and Venue Management](#7-seating-and-venue-management)
8. [Payments and Financial Operations](#8-payments-and-financial-operations)
9. [Check-In and Service Points](#9-check-in-and-service-points)
10. [Badge System](#10-badge-system)
11. [KYC and Verification](#11-kyc-and-verification)
12. [Marketing and Promotions](#12-marketing-and-promotions)
13. [Communications and Notifications](#13-communications-and-notifications)
14. [Analytics and Reporting](#14-analytics-and-reporting)
15. [White-Label and Branding](#15-white-label-and-branding)
16. [Subscription Plans](#16-subscription-plans)
17. [Credits, Vouchers, and Invoicing](#17-credits-vouchers-and-invoicing)
18. [Social Features and Networking](#18-social-features-and-networking)
19. [Event Invitations and Collaboration](#19-event-invitations-and-collaboration)
20. [Support and Help Desk](#20-support-and-help-desk)
21. [Mobile Application](#21-mobile-application)
22. [Platform Feedback](#22-platform-feedback)
23. [Security and Compliance](#23-security-and-compliance)
24. [Integrations and Extensibility](#24-integrations-and-extensibility)
25. [Platform Pages and Legal](#25-platform-pages-and-legal)
26. [Event Categories](#26-event-categories)
27. [Glossary](#27-glossary)

---

## 1. Executive Summary

EventKnit is a comprehensive event management and ticketing platform designed to handle everything from event creation and ticket sales to attendee management, check-ins, and post-event analytics.

The platform serves three core user groups — **Attendees** who discover and register for events, **Organizers** who create and manage events, and **Administrators** who oversee the entire platform — through dedicated dashboards tailored to each role.

EventKnit is available as a **web application** (desktop and mobile browsers) and a **native mobile app** (iOS and Android), with a shared backend powering both.

### Core Capabilities

- Multi-format event support (in-person, virtual, hybrid)
- Advanced ticketing with dynamic pricing, packages, and seat maps
- Secure multi-gateway payment processing (Paystack, Stripe, M-Pesa)
- Real-time check-in with QR scanning, checkpoints, and facility tracking
- Custom badge design and on-demand printing
- KYC-based organizer verification for regulatory compliance
- Multi-channel communications (email, SMS, push notifications)
- White-label branding with custom domains
- Platform-wide analytics and financial reporting

---

## 2. Platform Overview

### Platform Components

| Component | Description | Access |
|-----------|-------------|--------|
| **Web Application** | Full-featured platform for all user roles | Desktop and mobile browsers |
| **Mobile App** | Native attendee experience for iOS and Android | App Store and Google Play |
| **Admin Dashboard** | Platform administration and oversight | Web only (admin roles) |
| **Service Point** | Event-day operations (check-in, badge printing) | Web (tablet-optimized) |

### How It Works

```
Organizer creates event
       |
       v
Admin reviews and approves
       |
       v
Event goes live on platform
       |
       v
Attendees discover, register, and pay
       |
       v
Organizer manages attendees, communications, analytics
       |
       v
Event day: Check-in via QR scan, badge printing, facility tracking
       |
       v
Post-event: Analytics, feedback, payouts to organizer
```

---

## 3. User Roles and Permissions

### Role Hierarchy

```
SUPERADMIN (Platform Owner)
  |
  +-- ADMIN STAFF (Platform Administrators)
  |     +-- MARKETER (Marketing Campaigns)
  |     +-- SUPPORT (Customer Support)
  |     +-- TELLER (Payment and Check-In)
  |
  +-- ORGANIZER (Event Creators)
  |     +-- ORGANIZER STAFF (Event Assistants)
  |     +-- ORGANIZER TELLER (Event Check-In Staff)
  |
  +-- ATTENDEE (Event Participants - Default Role)
```

### Role Descriptions

| Role | Description | Key Capabilities |
|------|-------------|-----------------|
| **Superadmin** | Full platform access | All permissions, system configuration |
| **Admin Staff** | Platform administration | Approve events, manage users, view finances |
| **Marketer** | Marketing operations | Manage campaigns, promotions, social media |
| **Support** | Customer support | Handle tickets, user inquiries |
| **Teller** | Payment and check-in | Process payments, check-in attendees |
| **Organizer** | Event creator | Create events, manage attendees, view revenue |
| **Organizer Staff** | Event assistant | Manage assigned events, limited permissions |
| **Organizer Teller** | Event check-in | Scan tickets, check-in attendees |
| **Attendee** | Event participant | Register for events, manage tickets |

### Account Statuses

| Status | Description |
|--------|-------------|
| Active | Normal account access |
| Suspended | Temporarily restricted (punitive) |
| Deactivated | Account disabled (non-punitive) |

---

## 4. User Journeys

### 4.1 Attendee Journey

#### Account Creation

Attendees can create accounts through multiple methods:

- **Email and Password** — Register with email, verify via 6-digit code, create a password (minimum 8 characters with at least 1 letter and 1 number)
- **Google Sign-In** — One-tap registration using a Google account
- **Facebook Login** — Register via Facebook OAuth
- **Magic Link** — Passwordless login via a secure one-time link sent to email
- **Email OTP** — Login with a 6-digit code sent to email
- **Biometric** (mobile app only) — Fingerprint or Face ID

All new accounts start as Attendees. Users become Organizers after creating and having their first event approved.

#### Event Discovery

Attendees find events through:

- Keyword search by title or description
- Category filters (Music, Tech, Sports, Business, etc.)
- Date and location filters
- Price range filtering
- Featured events on the homepage
- Personalized recommendations based on interests
- Direct links shared by organizers

Each event page displays full details including title, description, date/time, venue with map, ticket types and pricing, speakers, sponsors, exhibitors, and agenda.

#### Registration and Checkout

1. **Select tickets** — Choose ticket type and quantity. If the event has reserved seating, select specific seats from an interactive map.
2. **Apply promo code** (optional) — Enter a discount code manually or have one auto-applied from a URL.
3. **Fill registration form** — Name, email, phone, and any custom fields the organizer has configured. Logged-in users have forms pre-filled from their profile.
4. **Complete payment** — Select from available payment methods (card, bank transfer, USSD, mobile money, Apple Pay, Google Pay, or installment plan). Free events skip this step.
5. **Receive confirmation** — Confirmation email with ticket PDF, QR code, and calendar invite. Ticket appears in the dashboard and digital wallet.

Guest registration is supported — attendees can register without creating an account, using only their email for ticket delivery.

#### Ticket Management

From the Attendee Dashboard, users can:

- View all registered events (upcoming and past)
- Download ticket PDFs
- Display QR code for scanning
- Transfer tickets to another person via email
- List tickets for resale on the marketplace
- Request refunds (subject to organizer policy)
- Add tickets to Apple Wallet or Google Pay
- Access event-specific content (agenda, speakers, exhibitors, networking)

#### Personal Event Feed and Discovery

The platform provides personalized event recommendations powered by:

- Interest preferences set during onboarding or in settings
- Past attendance history and behavior patterns
- Location-based suggestions within a configurable radius
- Saved searches with optional notifications when new matching events are posted

Attendees can also create and share **Event Collections** — curated lists of events (e.g., "Best Tech Events 2026") that other users can follow.

#### Calendar Integration

Attendees can sync registered events to external calendars:

- Google Calendar export
- Outlook calendar export
- Configurable event reminders (minutes before event)

#### During the Event

- View real-time agenda and schedule
- Track session attendance (check in/out of individual sessions)
- Browse speaker directory
- Explore exhibitor booths with details
- Network with other attendees via direct messaging
- Follow other attendees for future event connections
- Receive event updates and announcements
- View personal activity history

#### Post-Event

- Leave detailed reviews with star ratings (1-5 scale)
- Reviews are marked as "verified attendee" for credibility
- Other users can mark reviews as helpful
- View attendance history across all past events
- Access recordings (if available)
- Download certificates (if available)
- Receive personalized recommendations for similar upcoming events

---

### 4.2 Organizer Journey

#### Becoming an Organizer

1. Sign up with an attendee account (or already have one)
2. Create your first event and submit for approval
3. Once approved, the system elevates the account to Organizer

For paid events, organizers must complete KYC verification before funds can be disbursed (see Section 11).

#### Verification Levels

| Level | Requirements | Capabilities |
|-------|--------------|--------------|
| Level 1 — Basic | Email verified | Free events only |
| Level 2 — Identity | Government ID verified | Paid events with limits |
| Level 3 — Full KYC | Business documents verified | Unlimited paid events, payouts |

#### Event Creation

The event creation wizard guides organizers through a multi-step process:

1. **Basic Information** — Title, description, category, tags
2. **Date and Location** — Start/end dates, timezone, venue (physical address or virtual link), hybrid options
3. **Media** — Event banner image, gallery, promotional media
4. **Tickets** — Create ticket types with names, prices, quantities, sales periods, and purchase limits
5. **Agenda** — Sessions, speakers, sponsors, exhibitors
6. **Registration Settings** — Custom form fields, data sharing consent options
7. **Social Links** — Connect social media profiles
8. **Review and Publish** — Preview the event and submit for admin approval

Events are auto-saved as drafts and can be resumed later. Organizers can also create events from templates or duplicate past events.

#### Event Statuses

| Status | Description |
|--------|-------------|
| Draft | Not published, still editing |
| Pending | Submitted, awaiting admin approval |
| Approved | Live and accepting registrations |
| Rejected | Admin declined (with reason provided) |
| Cancelled | Organizer cancelled the event |
| Completed | Event has ended |

#### Event Invitations

Organizers can create invitation links for different participant types:

| Invite Type | Purpose |
|-------------|---------|
| Attendee | General event invitation |
| Speaker | Invite speakers with profile setup |
| Exhibitor | Invite exhibitors with booth information |
| Guest | VIP or complementary guest invitations |

Each invitation has a unique token, configurable expiry, and usage limits (single-use or multi-use). Organizers can track how many invitations have been used.

#### Event Collaboration

Multiple organizers can collaborate on a single event with granular permissions:

- Invite co-organizers by email
- Set permissions per collaborator: edit event, manage attendees, view analytics, publish
- Assign roles (lead organizer, assistant, etc.)
- Activity log tracks all changes made by each collaborator
- Accept/decline collaboration invitations

#### Attendee Management

- View all registrations with attendee details
- Export attendee lists as CSV
- Create attendee segments (by ticket type, registration date, etc.)
- Apply custom tags (with custom colors and descriptions) for organization
- Send targeted communications to segments or tags
- Approve or reject registrations (for invite-only events)
- Import attendees in bulk via CSV/Excel upload (with error reporting and welcome email option)
- Track data sharing consent per attendee (operational, marketing, demographic, analytics)

#### Team Management

Organizers can build event teams:

- Add staff members with specific roles (Organizer Staff or Organizer Teller)
- Assign staff to specific events
- Set granular permissions per role
- Track staff performance metrics
- Manage shift schedules via team calendar

#### Financial Management

- Real-time revenue tracking per event
- Log event expenses and categorize costs (with receipt uploads)
- View profit/loss calculations
- Set financial goals per event with progress tracking
- Monitor payout status and history
- Configure payout preferences (bank details, auto-payout threshold)
- Download financial reports
- View invoices generated for attendees
- Track resale and transfer revenue

#### Subscription Plans

Organizers can subscribe to different tiers for access to premium features:

| Tier | Features |
|------|----------|
| Basic | Standard event creation, basic analytics |
| Standard | Advanced ticketing, segmentation, branding |
| Premium | Full white-label, priority support, advanced analytics, unlimited staff |

Plans can have custom overrides granted by admins (e.g., trial periods, promotional upgrades).

#### Organizer Dashboard Summary

| Section | Features |
|---------|----------|
| Dashboard | Overview, quick stats, recent activity |
| Events | All, upcoming, past, cancelled, drafts, templates |
| Analytics | Event performance, attendee insights, revenue |
| Attendees | Segmentation, tags, communications |
| Team | Staff, roles, calendar, performance |
| Finance | Revenue, expenses, payouts |
| Settings | Profile, branding, domains, subscription |

---

### 4.3 Admin Journey

#### Platform Dashboard

The admin dashboard provides platform-wide visibility:

- Total users, events, and revenue
- User growth metrics and trends
- Pending approvals and flagged content
- System health alerts
- Recent platform activity

#### Event Moderation

1. Organizer submits event for approval
2. Event enters the pending queue
3. Admin reviews event details alongside the organizer's KYC status
4. Admin can approve, reject (with reason), request changes, or recall an already-approved event
5. Organizer receives a notification with the decision
6. Two-way communication thread for back-and-forth on requirements

Admins can also feature events on the homepage.

#### User Management

- View and search all users across roles
- Edit user details and change roles
- Suspend or deactivate accounts
- Force password resets
- View user activity history and audit trails

#### Financial Administration

| Function | Description |
|----------|-------------|
| Payments | View all transactions, search by reference, export reports |
| Disbursements | Schedule and process organizer payouts |
| Refunds | Review and process refund requests |
| Reconciliation | Match gateway transactions against platform records |
| Platform Fees | Configure fee percentages, minimums, and caps |
| Income | Track platform-level revenue by source |
| Expenses | Track platform operational costs |
| Wages | Staff payroll tracking with pay periods and payment methods |
| Resale/Transfer Reports | Secondary market transaction reporting |
| Income Statements | Generate financial statements for reporting periods |

#### Marketing Administration

- Manage platform-wide promo codes
- Create and schedule email campaigns
- Manage social media integrations (Facebook, Instagram, LinkedIn, Twitter)
- Feature events and manage partnerships

#### Subscription Plan Management

Admins manage the organizer subscription plans:

- Create and configure subscription tiers (Basic, Standard, Premium)
- Activate or deactivate plans
- View subscriber counts per plan
- Grant subscription overrides to specific organizers (e.g., free trials, promotional upgrades)
- Set pricing, currency, and feature sets per tier

#### KYC Entity Management

Admins manage the document requirements for each entity type:

- Configure which documents are required vs optional per entity type
- Set validity periods for documents
- Manage the display order and descriptions
- Add new entity types as regulations change

#### System Administration

- System health monitoring (server, database, services)
- Activity logs and audit trails
- Maintenance mode toggle with custom messages and scheduled windows
- Backup management
- Platform configuration settings
- Settings change history with audit trail (who changed what, when, and why)

#### Career Portal Management

- Review career inquiries submitted through the public careers page
- Track inquiry status (new, reviewed, responded)
- Add internal notes per inquiry

#### Admin Dashboard Summary

| Section | Features |
|---------|----------|
| Dashboard | Platform stats, alerts, activity |
| Events | All, pending, featured, moderation |
| Users | Attendees, organizers, staff, roles |
| Finance | Payments, disbursements, refunds, reconciliation |
| Marketing | Campaigns, promotions, social media |
| Analytics | Platform, events, users, revenue |
| Support | Inbox, tickets, responses |
| Service Point | Check-in, badge printing, walk-in registration |
| Subscriptions | Plan management, subscriber tracking |
| KYC | Review submissions, entity management |
| System | Health, logs, backups, maintenance, careers |

---

## 5. Event Management

### Event Lifecycle

```
DRAFT --> PENDING --> APPROVED --> LIVE --> COMPLETED
                 |
                 +--> REJECTED
                 |
                 +--> CANCELLED
```

### Event Types

| Type | Description |
|------|-------------|
| Physical | In-person events at a venue |
| Virtual | Online events with streaming link |
| Hybrid | Combined in-person and virtual |
| Public | Open to anyone |
| Private | Invite-only access |

### Event Settings

| Setting | Description |
|---------|-------------|
| Ticket Transfers | Allow attendees to transfer tickets to others |
| Refund Policy | Days before event that refunds are accepted |
| Re-Entry | Allow attendees to leave and re-enter the venue |
| Max Re-Entries | Limit on number of re-entries per attendee |
| Registration Deadline | Last date to register |
| Visibility | Public, private, or invite-only |

### Event Content

Each event can include:

- Detailed description with rich text formatting
- Banner image and photo gallery
- Session agenda with time slots
- Speaker profiles with bios
- Sponsor logos and tiers
- Exhibitor listings
- FAQs
- Social media links
- Custom registration fields
- Terms and conditions

### Event Sessions and Agenda

Events can have multiple sessions (talks, workshops, panels) with:

- Session title, description, and day assignment
- Start and end times per session
- Dedicated location/room within the venue
- Session capacity limits
- Attendance tracking (attendees can check in/out of individual sessions)
- Session-level analytics

### Event Reporting

Users can report events for review by admins:

- Report categories (inappropriate content, suspected fraud, copyright, etc.)
- Reports include description and submitter IP for audit
- Admin review queue with status tracking and reviewer notes

### Event Duplication and Templates

Organizers can duplicate events to quickly create recurring events — all details are copied with the option to modify dates and ticket configuration. Events can also be saved as templates for future reuse. Templates support:

- Public templates shared with all organizers
- Private templates for personal use
- Versioning and parent-child relationships
- Usage tracking (how many events created from each template)
- Share tokens for distributing templates to specific people

---

## 6. Ticketing System

### Ticket Tiers

EventKnit offers a multi-tiered ticketing system:

#### Basic Tickets (Event Wizard)

Created during event setup. Each ticket type includes:

- Name (e.g., "General Admission", "VIP")
- Price and currency
- Quantity available
- Description
- Sales start and end dates
- Per-user purchase limits

#### Advanced Packages

For more complex needs, organizers can create advanced ticket packages:

| Package Type | Description |
|-------------|-------------|
| VIP | Premium access with exclusive perks |
| Early Bird | Discounted price for early purchasers |
| Group | Bundle pricing for group purchases |
| Donation | Pay-what-you-want or fixed donation |
| Complementary | Free tickets issued to specific recipients |
| Seasonal | Time-limited special pricing |

#### Dynamic Pricing

Automated price adjustments based on configurable rules:

- **Time-based** — Prices increase as the event approaches
- **Quantity-based** — Prices change based on remaining inventory
- **Demand-based** — Automatic adjustments based on sales velocity

### Complementary Ticket Issuance

Organizers can issue complimentary tickets directly:

1. Create a complementary ticket package
2. Enter recipient name and email
3. System sends a claim email with a unique link
4. Recipient clicks the link to claim their ticket
5. Ticket is generated with full QR code and event details

### Ticket Statuses

| Status | Description |
|--------|-------------|
| Active | Valid for event entry |
| Used | Already checked in |
| Cancelled | Cancelled by user or admin |
| Expired | Event has passed |
| Transferred | Transferred to another user |

### Ticket Delivery

Every ticket includes:

- **QR Code** — Unique, digitally signed code for scanning at entry
- **Backup Code** — Alphanumeric fallback for manual check-in
- **PDF** — Downloadable ticket with event details and QR code
- **Email** — Confirmation email with PDF attachment and calendar invite
- **Digital Wallet** — Add to Apple Wallet or Google Pay

### Ticket Transfers

1. Owner initiates transfer and enters recipient's email
2. Recipient receives an email with an accept link (valid for 7 days)
3. Upon acceptance, a new ticket is generated for the recipient and the original is cancelled
4. Both parties are notified

Transfers are only available if the organizer enables them and the event has not yet started.

### Shopping Cart

The platform includes a full shopping cart system:

- Add tickets from multiple events to a single cart
- Cart reservations temporarily lock inventory (configurable timeout)
- Guest carts tracked by session ID and device fingerprint
- Promo codes can be applied per cart item
- Seat selections are held during the cart session
- Abandoned carts are automatically cleaned up by a background job

### Ticket Resale

Attendees can list unwanted tickets for resale on the platform marketplace:

- Set a resale price (subject to organizer-configured limits)
- Platform charges a resale fee on completed sales
- Buyer receives a new ticket; seller's original ticket is cancelled
- Seller payout tracked separately
- Resale and transfer analytics available to admins

### Payment Plans (Installments)

For higher-priced tickets, organizers can enable installment payments:

- Weekly, bi-weekly, or monthly schedules
- Automatic charges on saved payment method
- Reminders before each payment
- Grace period for failed payments
- Ticket activated after full payment

---

## 7. Seating and Venue Management

### Seat Maps

For events with assigned seating, organizers can create custom venue layouts:

- Define sections (Orchestra, Balcony, VIP, etc.)
- Configure rows and seat numbering
- Set pricing per section or individual seat
- Visual seat map editor for layout design

### Attendee Seat Selection

1. Attendee views the interactive seat map on the event page
2. Available, reserved, and sold seats are color-coded
3. Attendee selects desired seats
4. Seats are temporarily reserved (with a configurable timeout)
5. Upon payment, seats are permanently assigned
6. If the timeout expires without payment, seats are released

### Seat Statuses

| Status | Description |
|--------|-------------|
| Available | Open for selection |
| Reserved | Temporarily held during checkout |
| Confirmed | Paid and assigned |
| Blocked | Not available for booking |

### Facility and Zone Management

For large events, organizers can define facility zones to control access:

- Create custom facilities (food stations, merchandise, VIP lounges, activity areas)
- Color-code and icon-label each facility
- Enable or disable check-in/check-out per facility
- Track attendee movement between zones
- Monitor real-time occupancy per zone

---

## 8. Payments and Financial Operations

### Money Flow

```
Attendee pays for ticket
       |
       v
Payment processed by gateway (Paystack, Stripe, or M-Pesa)
       |
       v
Payment confirmed via webhook
       |
       v
Platform fee calculated (7.5% default)
       |
       +---> Platform retains 7.5%
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

### Supported Payment Gateways

| Gateway | Regions | Methods |
|---------|---------|---------|
| **Paystack** | Africa (primary) | Cards, bank transfer, USSD |
| **Stripe** | Global | Cards, Apple Pay, Google Pay |
| **M-Pesa** | Kenya | Mobile money |

### Platform Fee Model

EventKnit charges a **7.5% all-in fee** on every paid ticket transaction. This single percentage absorbs all payment processing costs.

| Comparison | Fee Model | Effective Rate |
|------------|-----------|---------------|
| **EventKnit** | 7.5% all-in | **7.5%** |
| Mookh | 8% all-in | 8% |
| TicketSasa | 10% all-in | 10% |
| Eventbrite | 3.7% + $1.79/ticket + 2.9% processing | 8-12% |

No per-ticket fixed fees. The fee percentage, minimum, and maximum caps are configurable by platform admins.

### Organizer Payouts

After an event ends, funds are held for a **5 business-day grace period** to allow for refund requests and chargeback disputes. After the grace period:

1. System automatically creates a disbursement record
2. Admin reviews and processes the bank transfer
3. Organizer receives funds to their configured bank account
4. Both parties receive confirmation notifications

**Payout eligibility requirements:**
- Event has ended and grace period has passed
- Organizer KYC is approved
- Bank details are configured
- Auto-payout is enabled in organizer preferences
- Payout amount meets the minimum threshold (if set)

### Refunds

Refund policies are configurable per event:

- **Full refund** — Complete amount returned
- **Partial refund** — Portion returned minus processing fees
- **Credit refund** — Credit issued for future events
- Refund deadline in days before the event
- Auto-refund or manual approval by organizer

Flow: Attendee requests refund, system checks eligibility, organizer or admin reviews, funds returned to original payment method, ticket cancelled.

### Invoicing

Every successful payment automatically generates an invoice with:

- Unique sequential invoice number
- Line items with description, quantity, and pricing
- Tax amounts (calculated from configurable tax rates)
- Bill-to information (attendee name and email)
- Downloadable from the attendee dashboard
- Customizable invoice templates for different event types

### Multi-Currency Support

Supported currencies: USD, KES, NGN, GBP, EUR, ZAR, GHS, and others based on gateway support.

---

## 9. Check-In and Service Points

EventKnit provides a comprehensive multi-layered scanning system for event-day operations.

### Workstation (Primary Check-In)

The workstation is the main check-in interface, accessible on any device with a web browser:

- **QR Code Scanning** — Real-time ticket validation via camera
- **Manual Check-In** — Search by name, email, phone, or backup code
- **Check-Out** — Track exits for capacity and re-entry management
- **Re-Entry** — Configurable re-entry limits with validation
- **Real-Time Dashboard** — Live stats showing total checked in, currently inside, scans by type
- **Multi-Station Support** — Multiple workstations operating simultaneously with real-time sync

### Checkpoints

For events with multiple access-controlled areas:

- Create named checkpoints (main entrance, VIP area, backstage, etc.)
- Assign staff to checkpoints with shifts
- Set capacity limits per checkpoint
- Define eligibility rules (e.g., only VIP ticket holders)
- Track scan counts and throughput per checkpoint
- Duplicate checkpoints for quick setup

### Service Point Facilities

Track attendee interactions at various locations within an event:

- Food and beverage stations
- Merchandise booths
- VIP lounges
- Activity areas
- Information desks

Each facility has its own check-in/check-out tracking, color coding, occupancy stats, and peak-time analytics.

### Walk-In Registration

For on-site registrations:

1. Staff enters the attendee's phone number
2. System sends a one-time verification code via SMS
3. Attendee confirms the code
4. Staff enters attendee details
5. Registration is created and badge can be printed immediately

### No-Show and Muster Reports

- **No-Show Report** — Lists all registered attendees who did not check in, with CSV export
- **Emergency Muster Report** — Real-time view of everyone currently inside the venue, with contact details and last-scanned facility, for emergency situations

### Check-In Flow

```
Attendee presents QR code or backup code
       |
       v
Staff scans or searches manually
       |
       v
System validates: ticket status, signature, event, re-entry limits
       |
       v
Check-in recorded with timestamp, scanner, device, facility
       |
       v
All workstations update in real-time
       |
       v
Entry granted or denied with reason
```

---

## 10. Badge System

### Badge Templates

Organizers can design custom badges for their events using a visual template editor:

- Set dimensions (standard presets or custom sizes)
- Choose portrait or landscape orientation
- Add dynamic elements:
  - Attendee name and title
  - Company/organization
  - QR code for scanning
  - Event logo and branding
  - Custom fields from registration data
  - Decorative shapes and colors

### Template Scope

| Scope | Description |
|-------|-------------|
| Platform Default | Available to all organizers |
| Organizer-Specific | Custom templates per organizer |
| Event-Specific | Templates for a specific event |

### Badge Printing

- On-demand printing at check-in workstations
- Bulk badge generation for pre-event preparation
- Print-ready PDF export
- Printer management interface (add, configure, monitor connected printers)
- Server-side print tracking (who printed, when, for which attendee)

### Badge Use Cases

- Conference name badges with QR codes
- VIP badges with special styling
- Staff identification badges
- Speaker and exhibitor badges
- Attendee badges with access-level indicators

---

## 11. KYC and Verification

### Why KYC?

KYC (Know Your Customer) verification is mandatory for organizers who want to host **paid events** and receive disbursements. Free events do not require KYC.

### Verification Levels

| Level | Requirements | Capabilities |
|-------|--------------|--------------|
| Level 1 — Basic | Email verified | Free events only |
| Level 2 — Identity | Government-issued ID | Paid events (with limits) |
| Level 3 — Full KYC | Business documents | Unlimited paid events, payouts |

### Supported Entity Types

EventKnit supports 19+ entity types for KYC, each with specific document requirements:

| Entity Type | Key Documents Required |
|-------------|----------------------|
| **Individual** | National ID, KRA PIN |
| **Sole Proprietor** | National ID, KRA PIN, Certificate of Registration, Bank Statement |
| **Limited Liability Company** | CR12, Certificate of Incorporation, Company KRA PIN, Director IDs, Bank Statement |
| **Limited Liability Partnership** | CR13, Certificate of Registration, Company KRA PIN, Director IDs, Bank Statement |
| **Partnership** | Partnership Deed, Director IDs, Company KRA PIN, Bank Statement |
| **NGO / Non-Profit** | Certificate of Registration, Constitution, Board Minutes, Organization KRA PIN, Bank Statement |
| **Co-operative Society** | Certificate of Registration, Constitution, Board Minutes, Organization KRA PIN, Bank Statement |
| **Church / Religious Org** | Certificate of Registration, Constitution, Board Minutes, Organization KRA PIN, Bank Statement |
| **Private Education Institution** | Certificate of Registration/Incorporation, Ministry of Education License, KRA PIN, Bank Statement |
| **Public Education Institution** | Certificate of Registration, Ministry of Education License, County Authorization |
| **Private Hospital** | Certificate of Registration/Incorporation, Ministry of Health License, KRA PIN, Bank Statement |
| **Public Hospital** | Certificate of Registration, County Health Department Authorization, Bank Statement |
| **Insurance / Reinsurance** | Certificate of Incorporation, IRA License, CR12, Company KRA PIN, Bank Statement |
| **Employment Agency** | Certificate of Incorporation, National Employment Agency License, CR12, Bank Statement |
| **Foreign Company** | Certificate of Compliance, CR12, Director IDs, Company KRA PIN, Bank Statement |
| **Embassy / UN / World Bank** | Accreditation Letter, Authorization Letter, Signatory IDs, Bank Statement |
| **Trust** | Certificate of Incorporation or Trust Deed, Trustee IDs, Organization KRA PIN, Bank Statement |

### Verification Workflow

```
Organizer submits documents
       |
       v
System validates document format and completeness
       |
       v
Admin reviews submission alongside document checklist
       |
       +---> Approve: KYC status set to APPROVED
       |
       +---> Request More Info: Targeted request with specific missing items
       |
       +---> Reject: KYC rejected with detailed reason
       |
       v
Organizer notified via email and in-app notification
       |
       v
Two-way communication thread for back-and-forth
```

The admin sees a document completion progress indicator and a categorized document view (identity, registration, financial, industry-specific) to streamline reviews.

### KYC and Event Approval Integration

When an admin reviews an event for approval, they see the organizer's KYC status alongside the event details. For paid events, the organizer must have approved KYC before the event can be published.

---

## 12. Marketing and Promotions

### Promo Codes

Organizers and admins can create discount codes:

| Setting | Description |
|---------|-------------|
| Code | Unique alphanumeric string (e.g., "EARLYBIRD20") |
| Discount Type | Percentage off or fixed amount off |
| Discount Value | Amount or percentage |
| Max Uses | Total redemption limit |
| Max Uses Per User | Per-user limit |
| Min Order Amount | Minimum purchase required |
| Max Discount | Cap on discount amount |
| Valid Dates | Start and end date range |
| Applicable Tickets | Restrict to specific ticket types |
| Stackable | Whether the code can combine with other discounts |
| Scope | Platform-wide (admin) or event-specific (organizer) |

**Tracking:** Total uses, revenue impact, and conversion rates per code.

### Referral and Affiliate Program

- Register affiliates with unique tracking links
- Track conversions and attribute sales
- Configure commission rates
- Affiliate dashboard with earnings reports

### Email Marketing

- Create email campaigns with templates
- Target by attendee segments or tags
- Schedule sends for optimal delivery
- Track opens, clicks, and conversions

### Social Media Integration

Connect and manage accounts across:
- Facebook
- Instagram
- LinkedIn
- Twitter/X

Features include scheduled posting, content calendar, and engagement tracking.

---

## 13. Communications and Notifications

### Notification Channels

| Channel | Description | Use Case |
|---------|-------------|----------|
| **Email** | Transactional and marketing | Registration confirmations, ticket delivery, campaigns |
| **SMS** | Text message alerts | Event reminders, OTP codes |
| **Push Notification** | Browser and mobile | Real-time updates, reminders |
| **In-App** | Notification center | All activity updates |

### Notification Types

**Transactional (Automatic):**
- Registration confirmation
- Payment receipt
- Ticket delivery (PDF and QR code)
- Refund confirmation
- Transfer notifications
- Event reminders (configurable timing)
- Check-in confirmation
- Payout notifications

**Marketing (Opt-In):**
- Event recommendations based on interests
- Promotional offers
- Newsletter

### Organizer Bulk Messaging

- Send to all attendees for an event
- Send to specific segments or tagged groups
- Schedule messages for future delivery
- Create reusable email templates with variable substitution (attendee name, event name, etc.)
- Multi-channel: email, SMS, or push

### User Preferences

Every user can configure:
- Which channels they receive notifications on
- Which notification types they want
- Do-not-disturb hours

---

## 14. Analytics and Reporting

### Event Analytics (Organizer)

| Metric | Description |
|--------|-------------|
| Registrations | Total and daily trend |
| Revenue | Total, by ticket type, and daily trend |
| Conversion | Event views to registrations |
| Check-Ins | Attendance rate and timing |
| Demographics | Attendee breakdown |
| Referral Sources | How attendees found the event |
| Promo Code Performance | Usage and revenue impact |

### Organizer Analytics

- Revenue summary across all events
- Event-by-event performance comparison
- Attendee insights (demographics, behavior patterns)
- Marketing ROI and campaign effectiveness
- Team performance metrics

### Platform Analytics (Admin)

| Dashboard | Metrics |
|-----------|---------|
| User Growth | Registrations, active users, retention |
| Event Trends | Creation rates, approval rates, categories |
| Financial | Platform revenue, fees collected, payouts processed |
| Geographic | Users and events by location |
| Security | Login attempts, suspicious activity |

### Export Options

- CSV export for spreadsheets
- PDF reports for stakeholders
- Filterable by date range, event, user type, and more

---

## 15. White-Label and Branding

### What is White-Label?

White-labeling allows organizers to replace EventKnit's default branding with their own, creating a seamless experience where attendees see the organizer's brand instead of EventKnit's.

### Branding Options

| Element | Description |
|---------|-------------|
| Logo | Primary and secondary logos |
| Colors | Primary, secondary, accent, background, text colors |
| Fonts | Custom font selection |
| Favicon | Browser tab icon |
| Email Templates | Branded email headers, footers, and colors |
| Event Pages | Branded public event pages |
| Ticket PDFs | Branded ticket design |

### Custom Domains

Organizers can use their own domain (e.g., `events.yourcompany.com`) instead of EventKnit's default:

1. Organizer adds their domain in settings
2. System provides DNS records to configure
3. Domain verified automatically
4. SSL certificate provisioned
5. All event pages served under the custom domain

### Approval Workflow

```
Organizer submits branding assets
       |
       v
Status: PENDING APPROVAL
       |
       v
Admin reviews branding for quality and appropriateness
       |
       +---> Approve: Branding goes live
       +---> Reject: Reason provided, organizer can resubmit
```

---

## 16. Subscription Plans

### Organizer Subscription Tiers

EventKnit offers tiered subscription plans for organizers, unlocking progressively more features:

| Tier | Target | Key Features |
|------|--------|-------------|
| **Basic** | New organizers | Standard event creation, basic analytics, limited staff |
| **Standard** | Growing organizers | Advanced ticketing, attendee segmentation, branding options |
| **Premium** | Enterprise organizers | Full white-label, custom domains, priority support, unlimited staff, advanced analytics |

### Plan Management

- Each plan has configurable pricing, currency, and feature sets
- Plans can be activated or deactivated by admins
- Subscriber counts are tracked per plan
- Subscription overrides allow admins to grant temporary upgrades (e.g., free trials, promotional access)
- Billing cycles with automated renewal reminders

### Subscription Benefits

Subscription tier affects:
- Number of events that can be created
- Number of staff members allowed
- Access to advanced features (dynamic pricing, white-label, etc.)
- Analytics depth and export capabilities
- Support response priority

---

## 17. Credits, Vouchers, and Invoicing

### Credit System

Each user has a credit balance that can be used toward ticket purchases:

- Credits are tracked per user with a running balance
- Credits can be earned through refunds (credit refund option), promotional grants, or voucher redemptions
- Credit transactions are fully logged with descriptions, references, and balance-after tracking
- Credits can have expiry dates

### Voucher System

Admins and organizers can create vouchers — redeemable codes that add credits to a user's balance:

| Setting | Description |
|---------|-------------|
| Code | Unique voucher code |
| Amount | Credit value |
| Currency | Currency of the credit |
| Max Uses | Total redemption limit |
| Valid Dates | Start and end date range |
| Event Scope | Restrict to specific events or platform-wide |

Vouchers differ from promo codes: promo codes reduce a specific transaction price, while vouchers add credits to a user's balance for use on any eligible purchase.

### Invoice System

The platform automatically generates invoices for all paid transactions:

- Unique invoice numbers (sequential)
- Line items with descriptions, quantities, and pricing
- Tax calculation based on configurable tax rates by country/region
- Tax exemptions for eligible entities
- Customizable invoice templates (HTML/CSS-based)
- Attendees can view and download invoices from their dashboard
- Admins can manage invoice templates and set defaults

### Tax Handling

- Tax rates configurable by country, state, and city
- Multiple tax types supported
- Tax exemptions for specific entities or organizations
- Tax amounts displayed separately on invoices

---

## 18. Social Features and Networking

### Direct Messaging

Attendees can communicate with each other through an in-app messaging system:

- Send messages to any platform user
- Thread-based conversations with subject lines
- Read receipts (tracks when messages are read)
- Messages can be linked to specific events or registrations
- Reply threads (parent-child message relationships)
- Delete messages from personal view

### Attendee Networking

For events that enable networking:

- Browse other attendees registered for the same event
- View attendee profiles
- Follow other users to stay connected across events
- Discover similar attendees based on shared interests

### Event Collections

Users can curate shareable lists of events:

- Create named collections with descriptions and cover images
- Add events to collections with personal notes
- Make collections public or private
- Share collections via unique tokens/links
- Other users can follow public collections to get updates
- Track follower counts per collection

### User Following

- Follow other users (organizers or attendees)
- See followed users' new events and activity
- Following relationships are bidirectional tracking (followers/following counts)

### Activity History

The platform tracks user activity for personalization and reference:

- Event registrations and attendance
- Ticket purchases and transfers
- Reviews submitted
- Events shared
- Collections created

---

## 19. Event Invitations and Collaboration

### Event Invitations

Organizers can create invitation links for different participant types:

| Invite Type | Purpose | What Recipient Gets |
|-------------|---------|-------------------|
| Attendee | General event invitation | Registration access |
| Speaker | Invite speakers | Profile setup and agenda placement |
| Exhibitor | Invite exhibitors | Booth information and setup |
| Guest | VIP or complimentary guest | Direct registration |

Each invitation features:
- Unique token-based link
- Configurable expiry date
- Usage limits (single-use or multi-use with max count)
- Tracking of how many times the invitation has been used
- Created-by tracking for audit

### Event Collaboration

Multiple organizers can work together on a single event:

- Invite collaborators by email
- Granular permissions per collaborator:
  - Can edit event details
  - Can manage attendees
  - Can view analytics
  - Can publish/unpublish the event
- Custom roles (lead organizer, assistant, etc.)
- Activity log tracks every change with who made it and when
- Collaboration invitations can be accepted or declined

---

## 20. Support and Help Desk

### Support Inbox

The platform includes a built-in support system:

- Users submit support queries from within the platform
- Queries are categorized by priority (Low, Medium, High, Urgent)
- Admin support staff can view, respond, and resolve queries
- Internal notes for staff collaboration (not visible to users)
- Multi-channel support: in-app messages, email, social media messages
- Response tracking with timestamps

### Social Media Support

Messages received through connected social media accounts (Facebook, Instagram, LinkedIn, Twitter) are centralized in the support inbox:

- View messages from all platforms in one place
- Assign messages to specific support staff
- Track resolution status and response times

---

## 21. Mobile Application

The EventKnit mobile app (iOS and Android) provides a native attendee experience optimized for on-the-go event discovery and management.

### Feature Comparison: Web vs Mobile

| Feature | Web | Mobile App |
|---------|-----|------------|
| Event Discovery and Search | Yes | Yes |
| Event Registration and Checkout | Yes | Yes |
| Ticket Management | Yes | Yes |
| QR Code Display | Yes | Yes (native, optimized) |
| Push Notifications | Browser-based | Native |
| Biometric Login | No | Yes (Fingerprint, Face ID) |
| Offline Ticket Access | No | Yes |
| Camera QR Scanning | Limited | Native camera integration |
| Apple Wallet / Google Pay | Via browser | Native integration |
| Organizer Dashboard | Yes (full) | No |
| Admin Dashboard | Yes (full) | No |
| Service Point / Check-In | Yes | No |

### Mobile-Specific Features

- **Offline Access** — Cached tickets available without internet connection
- **Biometric Security** — Fingerprint and Face ID for quick, secure login
- **Native Notifications** — Push notifications for event reminders, ticket confirmations, updates
- **Deep Linking** — Tap a shared event link to open directly in the app
- **Native Sharing** — Share events using the device's native share sheet
- **Dark Mode** — Full dark mode support matching system preferences

### Mobile App Screens

- Splash screen with branding
- Event discovery and browsing with filters
- Event details with full information
- Saved/bookmarked events
- Ticket list with QR codes
- Profile and settings
- Notification center

---

## 22. Platform Feedback

### Feedback Collection

The platform collects feedback from both attendees and organizers:

- **Post-event emails** — Automated feedback request emails sent after events end, with tokenized links (no login required to respond)
- **In-platform submission** — Logged-in users can submit feedback anytime
- **Token validity** — 7 days from email send

### Net Promoter Score (NPS)

| Score | Category | Description |
|-------|----------|-------------|
| 9-10 | Promoters | Loyal enthusiasts who will keep buying and refer others |
| 7-8 | Passives | Satisfied but unenthusiastic; vulnerable to competition |
| 0-6 | Detractors | Unhappy customers who can damage brand through word-of-mouth |

**NPS = % Promoters - % Detractors** (Range: -100 to +100)

### Feedback Categories (1-5 Rating Scale)

- Event Quality
- Platform Usability
- Registration Process
- Communication Quality

### Additional Data Points

- Would use again (Yes/No)
- Would recommend (Yes/No)
- Improvement areas (multiple choice)
- Free-form comments

### Admin Feedback Dashboard

- View all feedback with filters (by event, user type, score range, date)
- NPS analytics and trends over time
- Category breakdowns and improvement area analysis
- Add internal notes to feedback entries
- Export feedback data

---

## 23. Security and Compliance

### Authentication Security

- **Dual-token system** — Short-lived access tokens (15 minutes) paired with long-lived refresh tokens (7-30 days)
- **"Remember Me"** — Extends session to 30 days when enabled
- **Rate limiting** — 10 login attempts per minute to prevent brute force
- **Account lockout** — Automatic lockout after repeated failed attempts
- **Suspicious activity detection** — Monitors for unusual login patterns

### Data Protection

- All passwords hashed with bcrypt
- Payment data handled by PCI-compliant gateways (never stored on platform)
- GDPR-compliant data export and deletion capabilities
- Consent management per event (operational, marketing, demographic, analytics)
- Audit logging for all sensitive operations

### QR Code Security

- Every QR code is digitally signed to prevent forgery
- Signatures are verified at scan time
- Each code is unique per registration
- Backup codes provide a secondary verification method

### Platform Security

- HTTPS encryption for all traffic
- Security headers (CORS, CSP, HSTS)
- Input validation on all endpoints
- SQL injection and XSS protection
- Webhook signature verification for payment gateways

### GDPR and Data Privacy

- Users can request a full export of their personal data
- Users can request deletion of their account and data
- Data export requests are tracked with tokens and expiry
- Data access audit logs record who accessed attendee data, when, and why
- Consent management per event with four levels:
  - Operational (always required for event management)
  - Marketing communications (opt-in)
  - Demographics data sharing (opt-in, premium feature)
  - Engagement analytics (opt-in, premium feature)

### Emergency Contacts

Users can store emergency contact information (name, phone, email, relationship) for safety during in-person events.

---

## 24. Integrations and Extensibility

### Webhook System

Organizers and third-party systems can subscribe to platform events via webhooks:

- Configure webhook endpoints with custom URLs
- Select which event types to subscribe to (payment success, registration created, ticket transferred, refund processed, etc.)
- Webhook deliveries include digital signatures for verification
- Automatic retry on delivery failure (configurable max retries)
- Delivery tracking with response codes and success/failure counts
- Webhook secret keys for payload verification

### API Key Management

For third-party integrations:

- Generate API keys with specific permission scopes
- Set rate limits per key
- Configure expiry dates
- Track request counts and usage
- Revoke keys at any time

### USSD and SMS Registration

For accessibility in markets where smartphone adoption is limited:

- **USSD Menus** — Users on feature phones can browse events and register through USSD menu flows
- **SMS Registration** — Register for events via SMS with interactive session tracking
- Sessions are tracked with expiry and step-by-step progress
- Supports payment integration via M-Pesa for USSD users

### Calendar Sync

- Sync event registrations to Google Calendar or Outlook
- Configurable reminder timing (minutes before event)
- Track sync status per registration

### Offline Sync (Mobile)

The mobile app supports offline operation:

- Cache event data and tickets for offline access
- Queue actions (registrations, scans) when offline
- Automatically sync queued actions when connectivity is restored

---

## 25. Platform Pages and Legal

### Public Pages

The platform includes public-facing pages accessible without login:

| Page | Description |
|------|-------------|
| Home | Event discovery, featured events, search |
| Event Details | Full event information with registration |
| About | Platform information and mission |
| Careers | Career opportunities and inquiry submission |
| Support | Help resources and contact information |

### Legal Pages

| Page | Description |
|------|-------------|
| Terms of Service | Platform usage terms and conditions |
| Privacy Policy | Data collection, usage, and protection policies |
| Cookie Policy | Cookie usage and consent information |

---

## 26. Event Categories

The platform supports the following event categories:

| Category | Examples |
|----------|---------|
| Music | Concerts, festivals, DJ sets |
| Comedy | Stand-up, improv, sketch shows |
| Sports | Matches, tournaments, fitness events |
| Arts and Culture | Exhibitions, gallery openings, cultural festivals |
| Business and Professional | Conferences, networking, trade shows |
| Education | Workshops, seminars, lectures |
| Technology | Hackathons, product launches, tech talks |
| Food and Drink | Food festivals, wine tastings, cooking classes |
| Health and Wellness | Yoga retreats, wellness workshops, fitness classes |
| Community | Town halls, meetups, community gatherings |
| Film and Media | Screenings, film festivals, media events |
| Science and Innovation | Research conferences, innovation summits |
| Travel and Outdoor | Adventure events, outdoor festivals, tours |
| Family and Kids | Kids events, family festivals, children's workshops |
| Gaming | Esports tournaments, gaming conventions |
| Fashion | Fashion shows, pop-up shops, design events |
| Charity and Causes | Fundraisers, charity galas, awareness events |

---

## 27. Glossary

| Term | Definition |
|------|------------|
| **Attendee** | A user who registers for and attends events |
| **Organizer** | A user who creates and manages events |
| **Admin** | A platform administrator who oversees operations |
| **KYC** | Know Your Customer — identity and business verification process |
| **Disbursement** | Transfer of event revenue from the platform to the organizer |
| **Platform Fee** | Percentage charged by EventKnit on each paid ticket transaction |
| **Grace Period** | Waiting period after an event ends before funds are released to the organizer |
| **Workstation** | A check-in station used by staff to scan tickets at events |
| **Checkpoint** | A controlled access point within an event venue |
| **Facility/Service Point** | A location within an event (food station, VIP area, etc.) tracked by the system |
| **Walk-In** | An attendee who registers on-site at the event rather than in advance |
| **Muster Report** | Emergency report showing all attendees currently inside the venue |
| **White-Label** | Replacing EventKnit's branding with the organizer's own branding |
| **Promo Code** | A discount code that reduces the ticket price |
| **Voucher** | A redeemable code that adds credits to a user's balance |
| **Credit** | Platform currency balance that can be applied toward ticket purchases |
| **Dynamic Pricing** | Automated ticket price adjustments based on time, demand, or inventory |
| **Complementary Ticket** | A free ticket issued directly by the organizer to a specific person |
| **Ticket Transfer** | Moving a ticket from one person to another |
| **Ticket Resale** | An attendee listing their ticket for sale to another user on the platform marketplace |
| **Event Collection** | A curated, shareable list of events created by a user |
| **Subscription Plan** | A paid tier that unlocks premium features for organizers |
| **Webhook** | An automated notification sent to an external system when a platform event occurs |
| **API Key** | A credential for third-party systems to access the EventKnit API |
| **USSD** | Unstructured Supplementary Service Data — a protocol for feature phone menus |
| **NPS** | Net Promoter Score — a measure of customer satisfaction and loyalty (-100 to +100) |
| **OTP** | One-Time Password — a temporary code for verification |
| **GDPR** | General Data Protection Regulation — EU data privacy law |
| **Reconciliation** | Matching payment gateway records against platform records to identify discrepancies |
| **Cart Reservation** | Temporary hold on ticket inventory while a user completes checkout |
| **Seat Map** | A visual layout of venue seating that attendees can interact with to select seats |
| **CR12/CR13** | Kenyan business registration documents listing company directors/partners |
| **KRA PIN** | Kenya Revenue Authority Personal Identification Number (tax ID) |
| **M-Pesa** | A mobile money service widely used in Kenya for digital payments |
| **Paystack** | A payment gateway serving African markets |
| **Stripe** | A global payment processing platform |

---

## Supported Currencies

| Code | Currency |
|------|----------|
| KES | Kenyan Shilling |
| USD | US Dollar |
| NGN | Nigerian Naira |
| GBP | British Pound |
| EUR | Euro |
| ZAR | South African Rand |
| GHS | Ghanaian Cedi |

Additional currencies are supported based on the active payment gateway.

---

## Background Operations

The platform runs several automated background jobs that operate without manual intervention:

| Job | What It Does |
|-----|-------------|
| Event Reminders | Sends email/SMS reminders before events start |
| Auto Payouts | Creates organizer disbursements after the grace period |
| Cart Cleanup | Releases abandoned cart reservations and unlocks inventory |
| Seat Reservation Cleanup | Releases expired seat holds |
| Token Cleanup | Removes expired authentication and verification tokens |
| Post-Event Surveys | Sends feedback request emails after events end |
| Email Digests | Compiles and sends notification digests |
| Social Media Scheduler | Publishes scheduled social media posts |
| Bulk Message Delivery | Processes scheduled bulk messages |
| Pending Event Expiry | Cleans up events stuck in pending status |
| Payment Timeout | Handles stalled payment sessions |
| SMS Session Cleanup | Removes expired SMS/USSD sessions |

---

*This document consolidates and verifies all platform capabilities against the EventKnit codebase (152 database models, 121 services, 68 controllers, 250+ pages). Last verified: March 2026.*
