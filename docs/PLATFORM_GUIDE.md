# EventKnit Platform Guide

A comprehensive guide to all features and user journeys on the EventKnit platform.

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Attendee Journey](#attendee-journey)
4. [Organizer Journey](#organizer-journey)
5. [Admin Journey](#admin-journey)
6. [Event Management](#event-management)
7. [Ticket System](#ticket-system)
8. [Payment Processing](#payment-processing)
9. [Refunds](#refunds)
10. [Ticket Transfers](#ticket-transfers)
11. [Promotions & Discounts](#promotions--discounts)
12. [Check-In & Scanning](#check-in--scanning)
13. [Digital Wallet](#digital-wallet)
14. [KYC & Verification](#kyc--verification)
15. [Notifications & Communications](#notifications--communications)
16. [Analytics & Reporting](#analytics--reporting)
17. [API Reference](#api-reference)

---

## Platform Overview

EventKnit is a comprehensive event ticketing and management platform designed to handle everything from event creation and ticket sales to attendee management and check-ins.

### Core Capabilities

- **Event Management**: Create, manage, and publish events of any scale
- **Ticketing System**: Multiple ticket types, dynamic pricing, QR codes
- **Payment Processing**: Secure payments via Paystack and Stripe
- **Attendee Management**: Registration, check-in, and engagement
- **Analytics**: Real-time insights and reporting
- **Multi-tenant**: Support for multiple organizers with white-label options

---

## User Roles & Permissions

### Role Hierarchy

```
SUPERADMIN
├── ADMIN_STAFF (Platform administrators)
│   ├── MARKETER (Marketing campaigns)
│   ├── SUPPORT (Customer support)
│   └── TELLER (Payment/check-in staff)
└── ORGANIZER (Event creators)
    ├── ORGANIZER_STAFF (Event staff)
    └── ORGANIZER_TELLER (Event check-in staff)

ATTENDEE (Event attendees - default role)
```

### Role Descriptions

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| SUPERADMIN | Full platform access | All permissions |
| ADMIN_STAFF | Platform administration | Approve events, manage users, view finances |
| MARKETER | Marketing operations | Manage campaigns, promotions, social media |
| SUPPORT | Customer support | Handle support tickets, user inquiries |
| TELLER | Payment collection | Process payments, check-in attendees |
| ORGANIZER | Event creator | Create events, manage attendees, view revenue |
| ORGANIZER_STAFF | Event assistant | Manage assigned events, limited permissions |
| ORGANIZER_TELLER | Event check-in | Scan tickets, check-in attendees |
| ATTENDEE | Event attendee | Register for events, manage tickets |

### User Statuses

| Status | Description |
|--------|-------------|
| ACTIVE | Normal account access |
| SUSPENDED | Temporarily restricted (punitive) |
| DEACTIVATED | Account disabled (non-punitive) |

---

## Attendee Journey

### 1. Account Creation

**Registration Options:**
- Email/password registration
- Google OAuth
- Facebook OAuth
- Magic link (passwordless)

**Registration Flow:**
1. Select role (Attendee or Organizer)
2. Enter email address
3. Receive 6-digit verification code
4. Create password (8+ chars, 1 letter, 1 number)
5. Enter first and last name
6. Account created

### 2. Event Discovery

**Browse Events:**
- Search by keyword, category, date, location
- Filter by price range, event type
- View featured events on homepage
- Get personalized recommendations

**Event Details:**
- Title, description, date/time
- Venue with map
- Organizer information
- Ticket types and pricing
- Speakers, sponsors, exhibitors
- Event agenda

### 3. Event Registration

**Registration Flow:**
1. Select ticket type(s) and quantity
2. Apply promo code (optional)
3. Fill registration form
   - Personal information
   - Custom fields (if any)
   - Consent checkboxes
4. Proceed to payment

**Guest Registration:**
- Register without creating an account
- Email required for ticket delivery
- Can create account later to manage tickets

### 4. Ticket Management

**My Tickets Dashboard:**
- View all registered events
- Filter by upcoming/past
- Download tickets as PDF
- View QR code
- Share tickets
- Request refunds (if allowed)

**Ticket Features:**
- Unique QR code per ticket
- Backup code for manual entry
- Email delivery with PDF attachment
- Mobile-friendly display

### 5. Digital Wallet

**Features:**
- Store tickets digitally
- Add to Apple Wallet
- Add to Google Pay
- Auto-add new tickets
- Cloud backup
- View backup codes

### 6. Ticket Transfer

**Transfer Flow:**
1. Select ticket to transfer
2. Enter recipient email
3. Add optional message
4. Confirm transfer
5. Recipient receives email with accept link
6. Recipient accepts transfer
7. New ticket generated for recipient
8. Original ticket cancelled

**Transfer Rules:**
- Only confirmed tickets can be transferred
- Event must allow transfers
- Cannot transfer after event starts
- Transfer expires after 7 days

### 7. Attendee Dashboard Features

| Feature | Description |
|---------|-------------|
| Home | Quick overview, upcoming events |
| My Events | Registered events with details |
| My Tickets | All tickets with actions |
| Digital Wallet | Stored tickets |
| Ticket Transfer | Transfer to others |
| Ticket Resale | Sell unwanted tickets |
| Saved Events | Bookmarked events |
| Notifications | All notifications |
| Profile | Personal information |
| Settings | Account settings |

### 8. Event Experience

**During Event:**
- View event agenda
- Browse speakers directory
- Explore exhibitors
- See sponsors
- Network with attendees
- Direct messaging
- View event updates

### 9. Post-Event

- Leave event reviews
- View attendance history
- Download certificates (if available)
- Access event recordings (if available)

---

## Organizer Journey

### 1. Becoming an Organizer

**Registration:**
1. Sign up with organizer role
2. Complete profile information
3. Complete onboarding wizard
4. Submit for verification (optional but recommended)

**Verification Levels:**
| Level | Requirements | Capabilities |
|-------|--------------|--------------|
| Level 1 | Email verified | Free events only |
| Level 2 | Identity verified | Paid events with limits |
| Level 3 | Full KYC | Unlimited paid events |

### 2. Event Creation

**Create Event Flow:**
1. **Basic Info**: Title, description, category
2. **Date & Time**: Start/end dates, timezone
3. **Location**: Venue, address, online/hybrid
4. **Tickets**: Types, pricing, capacity
5. **Media**: Event image, gallery
6. **Additional**: Speakers, sponsors, agenda, FAQs
7. **Settings**: Registration, refunds, transfers
8. **Review**: Preview and publish

**Event Types:**
- Public: Anyone can register
- Private: Invite-only access
- Hybrid: In-person and virtual

**Event Statuses:**
| Status | Description |
|--------|-------------|
| DRAFT | Not published, still editing |
| PENDING | Awaiting admin approval |
| APPROVED | Live and accepting registrations |
| REJECTED | Admin declined (with reason) |
| CANCELLED | Organizer cancelled |
| COMPLETED | Event has ended |

### 3. Ticket Configuration

**Ticket Types:**
- General Admission
- VIP
- Early Bird
- Group tickets
- Custom ticket types

**Pricing Options:**
- Fixed price
- Free tickets
- Dynamic pricing (time-based, quantity-based)
- Tiered pricing
- Payment plans (installments)

**Ticket Settings:**
- Capacity per ticket type
- Sales start/end dates
- Purchase limits per user
- Transfer allowed (yes/no)
- Refund policy

### 4. Promo Codes

**Create Promo Code:**
- Code string (e.g., "EARLYBIRD20")
- Discount type: Percentage or Fixed amount
- Discount value
- Usage limits (total, per-user)
- Valid date range
- Applicable ticket types
- Minimum order amount

**Tracking:**
- Total uses
- Revenue impact
- Conversion rates

### 5. Attendee Management

**Registration Management:**
- View all registrations
- Export attendee list (CSV)
- Approve/reject registrations
- Bulk actions

**Segmentation:**
- Create attendee segments
- Filter by ticket type, date, etc.
- Target communications

**Tags:**
- Create custom tags
- Tag attendees
- Filter by tags

### 6. Communications

**Bulk Messaging:**
- Email campaigns
- SMS notifications
- Targeted by segment or tag

**Templates:**
- Create email templates
- Reuse for future events

**Scheduling:**
- Schedule messages
- Set delivery time

### 7. Event Analytics

**Dashboard Metrics:**
- Total registrations
- Revenue
- Ticket sales by type
- Daily registration trends
- Conversion rates

**Attendee Insights:**
- Demographics
- Geographic distribution
- Referral sources

**Financial Reports:**
- Revenue breakdown
- Expenses
- Profit/loss

### 8. Team Management

**Staff Roles:**
- Organizer Staff: General event management
- Organizer Teller: Check-in and payments

**Staff Features:**
- Add team members
- Assign to events
- Set permissions
- Track performance

### 9. Check-In Operations

**Workstation Setup:**
- QR code scanner
- Manual check-in option
- Re-entry tracking
- Multiple stations

**Check-In Features:**
- Scan QR code
- Enter backup code
- View attendee details
- Track entry/exit

### 10. Financial Management

**Revenue:**
- Real-time sales tracking
- Payment status monitoring
- Payout history

**Expenses:**
- Log event expenses
- Categorize costs
- Profit/loss calculation

**Disbursements:**
- View pending payouts
- Track completed payouts
- Bank transfer details

### 11. White-Label Options

**Branding:**
- Custom logo
- Color scheme
- Custom domain

**Custom Domain:**
- Add your domain
- SSL certificate
- DNS configuration

### 12. Organizer Dashboard Summary

| Section | Features |
|---------|----------|
| Dashboard | Overview, quick stats, recent activity |
| Events | All, upcoming, past, cancelled, drafts, templates |
| Analytics | Events, attendees, revenue |
| Attendees | Segmentation, tags, communications |
| Team | Staff, roles, calendar, performance |
| Finance | Revenue, expenses, profit/loss |
| Settings | Profile, branding, domains, subscription |

---

## Admin Journey

### 1. Admin Dashboard

**Overview:**
- Platform-wide statistics
- User growth metrics
- Revenue tracking
- Recent activity
- System alerts

### 2. Event Moderation

**Event Approval Workflow:**
1. Organizer submits event
2. Event appears in pending queue
3. Admin reviews event details
4. Approve or reject with reason
5. Organizer notified

**Admin Actions:**
- Approve event
- Reject with reason
- Request changes
- Recall approved event
- Feature event on homepage

### 3. User Management

**User Operations:**
- Create users
- View all users
- Edit user details
- Change user roles
- Suspend/activate accounts
- Force password reset

**User Filtering:**
- By role
- By status
- By registration date
- By activity

### 4. Organizer Management

**Organizer Features:**
- View all organizers
- Verification status
- Event history
- Revenue tracking

**Verification:**
- Review KYC submissions
- Approve/reject verification
- Request additional documents

### 5. Financial Administration

**Finance Dashboard:**
- Platform revenue
- Transaction volume
- Pending payouts
- Platform fees

**Transactions:**
- View all payments
- Search by reference
- Export reports

**Disbursements:**
- Schedule organizer payouts
- Process disbursements
- Track payment status

**Refunds:**
- View refund requests
- Process refunds
- Track refund status

**Reconciliation:**
- Match transactions
- Identify discrepancies
- Auto-fix issues

### 6. Marketing Administration

**Campaigns:**
- Email marketing
- Bulk messaging
- Scheduled sends

**Promotions:**
- Platform-wide promo codes
- Featured events
- Partnerships

**Social Media:**
- Connected accounts
- Scheduled posts
- Engagement tracking

### 7. Support Operations

**Support Inbox:**
- User inquiries
- Ticket management
- Response tracking

**Multi-Channel:**
- Email support
- In-app messages
- Social media messages

### 8. System Administration

**System Health:**
- Server status
- Database health
- Error monitoring

**Logs:**
- Activity logs
- Error logs
- Audit trail

**Maintenance:**
- Maintenance mode
- System updates
- Backup management

### 9. Analytics

**Platform Analytics:**
- User growth
- Event creation trends
- Revenue trends
- Geographic distribution

**Event Analytics:**
- Event performance
- Category breakdown
- Conversion rates

**Security Analytics:**
- Login attempts
- Suspicious activity
- Security events

### 10. Admin Dashboard Summary

| Section | Features |
|---------|----------|
| Dashboard | Platform stats, alerts, activity |
| Events | All, pending, featured, moderation |
| Users | Attendees, organizers, staff, roles |
| Finance | Payments, disbursements, refunds, reconciliation |
| Marketing | Campaigns, promotions, social media |
| Analytics | Platform, events, users, revenue |
| Support | Inbox, tickets, responses |
| System | Health, logs, backups, maintenance |
| Settings | Platform configuration |

---

## Event Management

### Event Lifecycle

```
DRAFT → PENDING → APPROVED → LIVE → COMPLETED
                ↓
            REJECTED
                ↓
            CANCELLED
```

### Event Fields

**Required:**
- Title
- Description
- Start date/time
- Location (venue or online)
- At least one ticket type

**Optional:**
- End date/time
- Event image
- Full description
- Speakers
- Sponsors
- Exhibitors
- Agenda
- FAQs
- Social links
- Custom registration fields

### Event Settings

| Setting | Description |
|---------|-------------|
| `allowTransfers` | Enable ticket transfers |
| `refundSLA` | Days before event for refunds |
| `allowReEntry` | Allow re-entry after check-out |
| `maxReEntries` | Maximum re-entries allowed |
| `registrationDeadline` | Last date to register |
| `visibilityLevel` | Public, Private, Invite-only |

### Event Duplication

Organizers can duplicate events to create recurring events quickly:
- Copies all event details
- Resets ticket sales
- Allows date/time modification
- Copies speakers, sponsors, exhibitors

---

## Ticket System

### Ticket Types

**Standard Ticket Fields:**
- Name (e.g., "VIP", "General Admission")
- Price
- Currency
- Quantity available
- Description
- Sales start/end dates

**Advanced Features:**
- Tiered pricing
- Group discounts
- Early bird pricing
- Dynamic pricing rules

### Ticket Statuses

| Status | Description |
|--------|-------------|
| ACTIVE | Valid for entry |
| USED | Already checked in |
| CANCELLED | Cancelled by user or admin |
| EXPIRED | Event has passed |
| TRANSFERRED | Transferred to another user |

### QR Code Generation

Every ticket includes:
- Unique QR code
- Registration ID encoded
- Backup alphanumeric code
- Valid for scanning at entry

### Ticket Delivery

**Email Delivery:**
- Confirmation email with ticket
- PDF attachment
- QR code inline
- Event details

**Digital Wallet:**
- Apple Wallet pass
- Google Pay pass
- In-app storage

---

## Payment Processing

### Supported Payment Gateways

| Gateway | Regions | Features |
|---------|---------|----------|
| Paystack | Africa | Cards, Bank Transfer, USSD |
| Stripe | Global | Cards, Apple Pay, Google Pay |

### Payment Flow

```
1. User selects tickets
2. Applies promo code (optional)
3. Enters payment details
4. Gateway processes payment
5. Webhook confirms payment
6. Ticket generated and emailed
7. Registration confirmed
```

### Payment Statuses

| Status | Description |
|--------|-------------|
| PENDING | Payment initiated |
| SUCCESS | Payment completed |
| FAILED | Payment failed |
| CANCELLED | User cancelled |
| REFUNDED | Payment refunded |

### Payment Plans

**Installment Options:**
- Weekly payments
- Bi-weekly payments
- Monthly payments
- Custom schedules

**Features:**
- Auto-payment setup
- Reminder notifications
- Grace period
- Overdue handling

### Multi-Currency Support

- USD (US Dollar)
- KES (Kenyan Shilling)
- NGN (Nigerian Naira)
- And more based on gateway support

---

## Refunds

### Refund Policy

**Configurable per Event:**
- Refund deadline (days before event)
- Refund percentage
- Auto-refund option

### Refund Flow

```
1. Attendee requests refund
2. System checks eligibility
3. Organizer reviews (if manual)
4. Refund processed
5. Funds returned to original payment method
6. Ticket cancelled
7. Confirmation email sent
```

### Refund Statuses

| Status | Description |
|--------|-------------|
| PENDING | Awaiting processing |
| PROCESSING | Being processed |
| COMPLETED | Funds returned |
| REJECTED | Refund denied |

### Refund Types

- **Full Refund**: Complete amount returned
- **Partial Refund**: Portion returned (minus fees)
- **Credit Refund**: Credit for future events

---

## Ticket Transfers

### Transfer Flow

```
1. Owner initiates transfer
2. System generates transfer token
3. Recipient receives email with link
4. Recipient accepts transfer
5. New registration created for recipient
6. Original ticket cancelled
7. Both parties notified
```

### Transfer Rules

| Rule | Description |
|------|-------------|
| Event must allow transfers | `allowTransfers = true` |
| Ticket must be confirmed | Status = CONFIRMED |
| Event not started | Before event start date |
| No pending transfer | Only one active transfer per ticket |
| Transfer expiry | 7 days to accept |

### Transfer Notifications

**Email Notifications:**
- Transfer offer to recipient
- Transfer accepted to sender
- Transfer cancelled to other party

### Transfer Statuses

| Status | Description |
|--------|-------------|
| PENDING | Awaiting acceptance |
| ACCEPTED | Transfer completed |
| CANCELLED | Transfer cancelled |
| EXPIRED | Not accepted in time |

---

## Promotions & Discounts

### Promo Code Types

| Type | Description | Example |
|------|-------------|---------|
| Percentage | % off total | 20% OFF |
| Fixed Amount | $ off total | $10 OFF |

### Promo Code Settings

- **Code**: Unique alphanumeric string
- **Discount Type**: Percentage or Fixed
- **Discount Value**: Amount or percentage
- **Max Uses**: Total redemption limit
- **Max Uses Per User**: Per-user limit
- **Min Order Amount**: Minimum purchase
- **Max Discount**: Cap on discount amount
- **Valid From/To**: Date range
- **Applicable Tickets**: Specific ticket types

### Early Bird Pricing

Automatic discounts based on:
- Time until event
- Number of tickets sold
- Purchase date

### Dynamic Pricing

**Pricing Rules:**
- Time-based (prices increase as event approaches)
- Quantity-based (prices change based on availability)
- Demand-based (automatic adjustments)

---

## Check-In & Scanning

### Workstation Features

**QR Code Scanning:**
- Real-time ticket validation
- Instant feedback (success/error)
- Offline mode support
- Sync when connected

**Manual Check-In:**
- Enter backup code
- Search by name/email
- Admin override

### Check-In Flow

```
1. Attendee presents QR code
2. Staff scans code
3. System validates ticket
4. Check-in recorded
5. Success/error displayed
6. Entry granted
```

### Re-Entry Management

**Settings:**
- Allow re-entry: Yes/No
- Max re-entries: Number
- Re-entry window: Time period

**Tracking:**
- Check-in time
- Check-out time
- Re-entry count
- Location/station

### Scan Statistics

Real-time metrics:
- Total checked in
- Checked in by hour
- Re-entries
- Denied entries
- Pending arrivals

---

## Digital Wallet

### Wallet Features

| Feature | Description |
|---------|-------------|
| Store Tickets | Keep all tickets in one place |
| Apple Wallet | Generate .pkpass files |
| Google Pay | Generate wallet passes |
| Auto-Add | Automatically add new tickets |
| Cloud Backup | Backup to user account |
| Backup Codes | View all backup codes |

### Apple Wallet Integration

**Pass Contents:**
- Event name and date
- Venue information
- QR code for scanning
- Ticket type
- Registration details

### Google Pay Integration

**Pass Contents:**
- Event branding
- Event details
- Scannable barcode
- Ticket information

---

## KYC & Verification

### Verification Levels

| Level | Name | Requirements | Capabilities |
|-------|------|--------------|--------------|
| 1 | Basic | Email verified | Free events only |
| 2 | Identity | ID verification | Paid events (limited) |
| 3 | Full KYC | Business verification | Unlimited paid events |

### Identity Verification (Level 2)

**Required Documents:**
- Government-issued ID (Passport, National ID, etc.)
- Selfie for matching

### Business Verification (Level 3)

**Entity Types Supported:**
- Individual
- Sole Proprietor
- Limited Liability Company (LLC)
- Partnership
- Corporation
- Non-Profit Organization
- NGO
- Church/Religious Organization
- School/Educational Institution
- Hospital/Healthcare
- And more (17+ types)

**Required Documents (varies by entity):**

| Document Type | Examples |
|---------------|----------|
| Registration | CR12, CR13, Certificate of Incorporation |
| Financial | Bank Statement, Cancelled Cheque |
| Industry | Ministry Licenses, Professional Membership |
| Organizational | Constitution, Board Minutes |

### Verification Workflow

```
1. Organizer submits documents
2. System validates format
3. Admin reviews submission
4. Approve or request more info
5. Verification level updated
6. Organizer notified
```

---

## Notifications & Communications

### Notification Channels

| Channel | Description |
|---------|-------------|
| Email | Transactional and marketing emails |
| SMS | Text message alerts |
| In-App | Notification center |
| Push | Browser/mobile push |

### Notification Types

**Transactional:**
- Registration confirmation
- Payment receipt
- Ticket delivery
- Refund confirmation
- Transfer notifications
- Event reminders

**Marketing:**
- Event recommendations
- Promotional offers
- Newsletter

### Notification Preferences

Users can configure:
- Channel preferences (email, SMS, etc.)
- Notification types
- Frequency
- Do-not-disturb hours

### Bulk Messaging

**Organizer Features:**
- Send to all attendees
- Send to segments
- Send to tagged users
- Schedule messages

**Templates:**
- Create reusable templates
- Variable substitution
- HTML formatting

---

## Analytics & Reporting

### Event Analytics

| Metric | Description |
|--------|-------------|
| Registrations | Total and by date |
| Revenue | Total and by ticket type |
| Conversion | Views to registrations |
| Check-ins | Attendance rate |
| Demographics | Attendee breakdown |

### Organizer Analytics

| Report | Description |
|--------|-------------|
| Revenue Summary | Total earnings, trends |
| Event Performance | Compare events |
| Attendee Insights | Demographics, behavior |
| Marketing ROI | Campaign effectiveness |

### Admin Analytics

| Dashboard | Metrics |
|-----------|---------|
| Platform | User growth, event creation |
| Financial | Revenue, fees, payouts |
| Geographic | Users by location |
| Security | Login attempts, threats |

### Export Options

- CSV export for spreadsheets
- PDF reports
- API access for integration

---

## API Reference

### Base URL

```
Production: https://api.eventknit.com/api/v1
Development: http://localhost:3001/api/v1
```

### Authentication

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Token Refresh:**
```
POST /auth/refresh
Body: { "refreshToken": "<refresh_token>" }
```

### Key Endpoints

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login |
| POST | /auth/refresh | Refresh token |
| POST | /auth/logout | Logout |
| GET | /auth/me | Get current user |

#### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /events | List events |
| GET | /events/:id | Get event details |
| POST | /events | Create event |
| PUT | /events/:id | Update event |
| DELETE | /events/:id | Delete event |
| POST | /events/:id/register | Register for event |

#### Tickets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /tickets/:id | Get ticket |
| GET | /tickets/:id/download | Download ticket PDF |
| POST | /tickets/:id/resend | Resend ticket email |

#### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /payments/initialize | Start payment |
| GET | /payments/verify | Verify payment |
| POST | /payments/webhook | Payment webhook |

#### Transfers
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /user-dashboard/transfers/:registrationId | Initiate transfer |
| POST | /user-dashboard/transfers/accept/:token | Accept transfer |
| POST | /user-dashboard/transfers/:id/cancel | Cancel transfer |
| GET | /user-dashboard/transfers | Get transfer history |

#### Promo Codes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /promo-codes/validate | Validate code |
| POST | /promo-codes | Create code |
| GET | /promo-codes | List codes |

### Rate Limiting

| Endpoint Type | Limit |
|---------------|-------|
| Authentication | 10/minute |
| General API | 100/minute |
| Scanning | 200/minute |
| Search | 30/minute |

### Webhooks

**Supported Events:**
- `payment.success`
- `payment.failed`
- `registration.created`
- `ticket.transferred`
- `refund.processed`

---

## Appendix

### Event Categories

- Music
- Comedy
- Sports
- Arts & Culture
- Business & Professional
- Education
- Technology
- Food & Drink
- Health & Wellness
- Community
- Film & Media
- Science & Innovation
- Travel & Outdoor
- Family & Kids
- Gaming
- Fashion
- Charity & Causes

### Supported Currencies

| Code | Currency |
|------|----------|
| USD | US Dollar |
| KES | Kenyan Shilling |
| NGN | Nigerian Naira |
| GBP | British Pound |
| EUR | Euro |
| ZAR | South African Rand |

### Date/Time Formats

- Display: `Monday, January 15, 2024 at 2:00 PM`
- API: ISO 8601 (`2024-01-15T14:00:00Z`)

### File Size Limits

| Upload Type | Max Size |
|-------------|----------|
| Event Image | 5 MB |
| KYC Documents | 10 MB |
| Profile Avatar | 2 MB |

---

*Last updated: January 2026*
