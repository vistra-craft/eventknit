# EventKnit Platform Guide

A comprehensive guide to all features and user journeys on the EventKnit platform.

## Document Overview

This guide provides an end-to-end walkthrough of the EventKnit ticketing and event management platform. Whether you're an administrator managing the platform, an organizer creating events, or an attendee purchasing tickets, this document covers every aspect of the system.

**What You'll Learn:**

- **Complete User Journeys**: Step-by-step walkthroughs for all user roles (Admin, Organizer, Attendee)
- **Authentication**: All login methods including OAuth, magic links, and OTP
- **Event Management**: From creation to completion, including all organizer tools
- **Ticketing System**: Registration, payment, QR codes, seat reservations, and transfers
- **Advanced Scanning**: Workstations, checkpoints, facilities, and service points
- **KYC & Verification**: Multi-level organizer verification and business onboarding
- **Payment Processing**: Multiple gateways, installment plans, and refunds
- **Badge System**: Custom badge templates and on-demand printing
- **Mobile App**: Native iOS/Android features and capabilities
- **Real-time Features**: WebSocket integration for live updates
- **API Reference**: Complete endpoint documentation for developers

This guide is designed to be read sequentially for a complete understanding, or used as a reference for specific features.

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Attendee Journey (End-to-End)](#attendee-journey)
4. [Organizer Journey (End-to-End)](#organizer-journey)
5. [Admin Journey (End-to-End)](#admin-journey)
6. [Event Management](#event-management)
7. [Ticket System](#ticket-system)
8. [Payment Processing](#payment-processing)
9. [Refunds](#refunds)
10. [Ticket Transfers](#ticket-transfers)
11. [Promotions & Discounts](#promotions--discounts)
12. [Check-In & Scanning](#check-in--scanning)
    - [Workstation Features](#workstation-features)
    - [Advanced Checkpoint System](#advanced-checkpoint-system)
    - [Service Points & Facilities](#service-points--facilities)
    - [Re-Entry Management](#re-entry-management)
    - [Scan Types & Real-Time Updates](#scan-types)
13. [Badge Templates & Printing](#badge-templates--printing)
14. [Seat Maps & Reserved Seating](#seat-maps--reserved-seating)
15. [Digital Wallet](#digital-wallet)
16. [Mobile Application](#mobile-application)
17. [KYC & Verification](#kyc--verification)
18. [Notifications & Communications](#notifications--communications)
19. [Platform Feedback](#platform-feedback)
20. [Analytics & Reporting](#analytics--reporting)
21. [Company Documents](#company-documents)
22. [API Reference](#api-reference)
23. [Platform TODOs](#platform-todos)

---

## Platform Overview

EventKnit is a comprehensive event ticketing and management platform designed to handle everything from event creation and ticket sales to attendee management and check-ins. The platform consists of three main components:

### Platform Architecture

1. **Web Application** (React/TypeScript)
   - Admin dashboard for platform management
   - Organizer portal for event management
   - Public-facing event browsing and registration

2. **Mobile Application** (Flutter/Dart)
   - Attendee-focused mobile experience
   - Event discovery and browsing
   - Digital ticket wallet
   - Push notifications
   - QR code scanning

3. **Backend API** (Node.js/TypeScript/Prisma)
   - RESTful API with comprehensive endpoints
   - Real-time WebSocket support
   - Payment gateway integrations
   - Advanced security features

### Core Capabilities

- **Event Management**: Create, manage, and publish events of any scale
- **Ticketing System**: Multiple ticket types, dynamic pricing, QR codes, seat reservations
- **Payment Processing**: Secure payments via Paystack and Stripe
- **Attendee Management**: Registration, check-in, and engagement
- **Advanced Scanning**: Checkpoints, workstations, service points, and facilities
- **Badge System**: Custom badge templates and printing
- **Analytics**: Real-time insights and reporting
- **Multi-tenant**: Support for multiple organizers with white-label options
- **Real-time Updates**: WebSocket-powered live updates for scanning and events

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

### 1. Account Creation & Authentication

EventKnit provides multiple authentication methods for user convenience and security.

**Registration Options:**
- Email/password registration with verification
- Google OAuth 2.0
- Facebook OAuth
- Magic link (passwordless)

**Email/Password Registration Flow:**
```
1. User clicks "Sign Up"
2. Select role (Attendee or Organizer)
3. Enter email address
4. System sends 6-digit verification code to email
5. User enters verification code
6. Code validated (expires after 10 minutes)
7. User creates password:
   - Minimum 8 characters
   - At least 1 letter
   - At least 1 number
8. User enters first name and last name
9. Account created with:
   - Unique user ID
   - Email verified status
   - Default role assigned
   - Access token generated
   - Refresh token generated
10. User automatically logged in
11. Redirected to dashboard
```

**Social OAuth Registration/Login:**

*Google Sign-In:*
```
1. User clicks "Continue with Google"
2. Google OAuth popup/redirect
3. User selects Google account
4. Google returns user profile:
   - Email
   - Name
   - Profile picture
   - OAuth access token
5. System checks if email exists:
   - If exists: Login user
   - If new: Create account with OAuth data
6. Store encrypted OAuth tokens in database
7. Generate platform access/refresh tokens
8. User logged in
```

*Facebook Login:*
```
1. User clicks "Continue with Facebook"
2. Facebook OAuth flow
3. User authorizes app
4. Facebook returns user profile
5. Same account lookup logic as Google
6. Store encrypted OAuth tokens
7. Generate platform tokens
8. User logged in
```

**Magic Link (Passwordless) Flow:**
```
1. User clicks "Login with Magic Link"
2. Enter email address
3. System generates unique magic link token:
   - Token expires in 1 hour
   - One-time use only
   - Cryptographically secure
4. Email sent with magic link
5. User clicks link
6. System validates token:
   - Checks expiration
   - Verifies email match
   - Ensures not already used
7. If valid:
   - Mark token as used
   - Generate access/refresh tokens
   - Log user in
8. If invalid/expired:
   - Show error message
   - Offer to send new link
```

**Email OTP (One-Time Password) Login:**
```
1. User clicks "Login with Code"
2. Enter email address
3. System sends 6-digit OTP code
4. Code valid for 10 minutes
5. User enters code
6. System validates code
7. If correct: User logged in
8. If incorrect: Show error, allow retry (max 3 attempts)
```

**Login Options (All Methods):**
- Email/password login
- Google Sign-In (One-tap or popup)
- Facebook Login
- Magic link (passwordless email)
- Email verification code (6-digit OTP)
- Biometric (mobile app only)

**Password Reset Flow:**
```
1. User clicks "Forgot password" on login page
2. Enter email address
3. System validates email exists
4. Generate password reset token:
   - Unique token per request
   - Expires in 1 hour
   - One-time use only
5. Send password reset email with link containing token
6. User clicks link
7. System validates token:
   - Check expiration
   - Verify not used
   - Match email
8. If valid: Show reset password form
9. User enters new password:
   - Minimum 8 characters
   - At least 1 letter
   - At least 1 number
10. Password updated in database (hashed with bcrypt)
11. Mark reset token as used
12. Send confirmation email
13. Redirect to login page
14. User logs in with new password
```

**Password Change (Authenticated Users):**
```
1. User navigates to Settings > Security
2. Clicks "Change Password"
3. Enter current password
4. System validates current password
5. Enter new password (with requirements)
6. Confirm new password
7. Password updated
8. All sessions invalidated except current
9. Confirmation email sent
```

**Token Management:**
- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (30 days), used to get new access tokens
- **Token Refresh Flow**:
  ```
  1. Access token expires
  2. Client sends refresh token to /auth/refresh
  3. Server validates refresh token
  4. If valid: Issue new access token
  5. If refresh token near expiry: Issue new refresh token
  6. Return new tokens to client
  ```

**Session Security:**
- Tokens stored securely (httpOnly cookies or secure storage)
- Automatic token refresh before expiration
- Logout invalidates all tokens
- Session tracking by device/IP
- Suspicious activity detection
- Rate limiting on authentication endpoints (10 attempts/minute)

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

### 3. Event Registration & Checkout

EventKnit provides a comprehensive registration and checkout flow with multiple options.

**Complete Registration & Payment Flow:**
```
STEP 1: SELECT TICKETS
1. User views event details page
2. Sees available ticket types:
   - General Admission
   - VIP
   - Early Bird
   - Group tickets
   - Custom types
3. Each ticket type shows:
   - Name and description
   - Price
   - Quantity available
   - Sales period (start/end dates)
   - Purchase limits per user
4. User selects ticket type and quantity
5. System validates:
   - Ticket availability
   - Purchase limits
   - Sales period active
6. If event has seat map:
   - Show interactive seat selection
   - User selects specific seats
   - Seats temporarily reserved (15-minute timeout)
7. Tickets added to cart

STEP 2: APPLY PROMO CODE (Optional)
1. User enters promo code
2. System validates code:
   - Code exists and active
   - Valid date range
   - Usage limits not exceeded
   - User hasn't exceeded per-user limit
   - Minimum order amount met
   - Applicable to selected ticket types
3. If valid:
   - Calculate discount (percentage or fixed)
   - Apply discount to total
   - Show original and discounted price
   - Lock promo code to this order
4. If invalid: Show error message

STEP 3: REGISTRATION FORM
1. If user not logged in:
   - Option to login
   - Option to continue as guest
   - Option to create account
2. Fill attendee information:
   - First name and last name (required)
   - Email address (required)
   - Phone number (required)
   - Additional information (optional)
3. Fill custom registration fields (if any):
   - Text fields
   - Dropdowns
   - Checkboxes
   - File uploads (e.g., dietary restrictions)
4. Accept terms and conditions (required)
5. Marketing consent (optional)
6. Validate all required fields
7. Proceed to payment

STEP 4: PAYMENT
1. Review order summary:
   - Event details
   - Ticket types and quantities
   - Seat numbers (if applicable)
   - Subtotal
   - Discount (if applied)
   - Taxes (if applicable)
   - Platform fees
   - Total amount
2. Select payment method:
   - Credit/Debit Card (Stripe or Paystack)
   - Bank Transfer (Paystack)
   - USSD (Paystack)
   - Apple Pay (Stripe)
   - Google Pay (Stripe)
   - Payment Plan (installments, if available)
3. Enter payment details (if card):
   - Card number
   - Expiry date
   - CVV
   - Cardholder name
   - Billing address
4. Click "Pay Now"
5. Payment gateway processes:
   - Stripe or Paystack
   - 3D Secure authentication (if required)
   - Real-time validation
6. Payment gateway webhook received:
   - Payment status: SUCCESS, FAILED, or PENDING
7. If PAYMENT SUCCESS:
   - Create event registration record
   - Generate unique registration ID
   - Generate QR code with encrypted data:
     - Registration ID
     - Event ID
     - Attendee information
     - Timestamp
     - Digital signature for validation
   - Generate backup alphanumeric code
   - Assign seats (if seat map event)
   - Mark promo code as used
   - Send confirmation email:
     - Registration details
     - QR code image
     - Ticket PDF attachment
     - Event details
     - Calendar invite (.ics file)
   - Send organizer notification
   - Redirect to success page
8. If PAYMENT FAILED:
   - Release reserved seats (if applicable)
   - Show error message
   - Release promo code
   - Offer retry option
9. If PAYMENT PENDING:
   - Create registration with PENDING status
   - Wait for webhook confirmation
   - Send pending payment email
   - Show pending status page

STEP 5: POST-REGISTRATION
1. User views confirmation page
2. Options available:
   - Download ticket PDF
   - Add to calendar
   - Add to Apple Wallet
   - Add to Google Pay
   - Share event with friends
   - View ticket in dashboard
3. Ticket appears in "My Tickets"
4. If guest registration:
   - Option to create account
   - Use email to claim tickets later
```

**Guest Registration:**
```
1. User clicks "Continue as Guest"
2. Email required for ticket delivery
3. No password needed
4. Registration proceeds normally
5. After payment:
   - Ticket sent to email
   - Unique link to view/manage ticket
   - Option to create account to:
     - View all tickets in one place
     - Transfer tickets
     - Request refunds
     - Receive event updates
```

**Payment Plan (Installments):**
```
1. If event supports payment plans:
   - User selects "Pay in Installments"
   - Choose payment schedule:
     - Weekly
     - Bi-weekly
     - Monthly
   - Review installment breakdown:
     - Number of payments
     - Amount per payment
     - Due dates
     - Total amount (may include fees)
2. Make first installment payment
3. Setup auto-payment:
   - Save payment method
   - Authorize recurring charges
   - Set up reminders
4. Receive confirmation
5. Future payments auto-charged
6. Reminders sent before each payment
7. Grace period for failed payments
8. Ticket activated after full payment
```

**Multi-Ticket Registration:**
```
1. User purchases multiple tickets
2. Option to assign tickets:
   - Enter details for each attendee
   - Or assign later
3. Each ticket gets unique:
   - Registration ID
   - QR code
   - Backup code
4. All tickets sent to purchaser email
5. Purchaser can:
   - Transfer individual tickets
   - Download all tickets
   - Manage all tickets
```

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
- QR code scanner (hardware or mobile device)
- Multiple workstation support
- Manual check-in option
- Re-entry tracking
- Multiple stations with facility assignment
- Real-time sync across all stations

**Workstation Features:**
- Scan QR code with instant validation
- Enter backup code manually
- Search attendees by name/email/phone
- View complete attendee details
- Track entry/exit times
- Monitor currently-inside count
- Real-time statistics dashboard
- WebSocket live updates
- Device tracking and logging

**Checkpoint Management:**
- Create multiple checkpoints per event
- Assign staff to checkpoints with shifts
- Set quotas and enforce limits
- Define eligibility rules
- Track scans per checkpoint
- View checkpoint statistics
- Duplicate checkpoints for quick setup
- Monitor real-time checkpoint activity

**Facility/Service Point Management:**
- Create custom service points (food, merch, VIP areas)
- Color-code facilities for easy identification
- Add icons and locations
- Enable/disable check-in or check-out
- View facility usage statistics
- Track peak times
- Reorder facilities for display
- Export facility data

**Staff Operations:**
- Multiple staff members scanning simultaneously
- Staff performance tracking
- Scan speed metrics
- Error rate monitoring
- Shift management
- Staff assignment to specific checkpoints/facilities

**Event-Day Operations:**
1. Staff logs into workstation
2. Selects event to scan
3. Chooses facility/checkpoint (if multiple)
4. Begins scanning:
   - Scan QR codes
   - Manual check-in for issues
   - Handle re-entries
   - Process check-outs
5. Real-time dashboard shows:
   - Total checked in
   - Currently inside
   - Scans by type
   - Facility breakdown
   - Denied entries
6. End of event:
   - View final statistics
   - Export scan reports
   - Download attendee lists

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

EventKnit provides a comprehensive multi-layered scanning system with workstations, checkpoints, and service point facilities.

### Workstation Features

The workstation is the primary scanning interface for event check-in/check-out operations.

**QR Code Scanning:**
- Real-time ticket validation with signature verification
- Instant feedback (success/error)
- Code type detection (QR code, backup code)
- Offline mode support
- Sync when connected
- Device tracking (device ID, type, IP address, user agent)

**Manual Check-In:**
- Search by name, email, or phone number
- Enter backup code
- Admin override capability
- Manual check-out support

**Check-Out Functionality:**
- Scan-out support for exit tracking
- Manual check-out option
- Currently-inside status tracking

### Check-In Flow

```
1. Attendee presents QR code or backup code
2. Staff scans code or searches manually
3. System validates ticket:
   - Verifies ticket status
   - Checks signature validity
   - Validates event and registration
   - Checks re-entry limits (if applicable)
4. Check-in recorded with metadata:
   - Scan time
   - Scanner (staff member)
   - Device information
   - IP address and user agent
   - Facility/service point (if specified)
5. WebSocket event emitted for real-time updates
6. Success/error displayed with attendee details
7. Entry granted or denied
```

### Advanced Checkpoint System

Checkpoints enable sophisticated access control and flow management within events.

**Checkpoint Types:**
- Entry checkpoints (main entrance)
- Service point checkpoints (food, merchandise, etc.)
- Activity checkpoints (specific areas or activities)
- Exit checkpoints

**Checkpoint Features:**
- **Name & Code**: Unique identifier and station code
- **Location**: Physical location within venue
- **Quota Management**: Set capacity limits per checkpoint
- **Quota Enforcement**: Optional strict capacity limits
- **Eligibility Rules**: JSON-based rules for access control
- **Active Period**: Define when checkpoint is operational (activeFrom/activeTo)
- **Staff Assignment**: Assign staff to specific checkpoints with shifts
- **Display Order**: Control checkpoint ordering in interfaces

**Checkpoint Operations:**
- Create and manage multiple checkpoints per event
- Duplicate checkpoints for quick setup
- Real-time scan tracking per checkpoint
- Checkpoint-specific statistics
- Staff performance tracking per checkpoint

**Eligibility Rules:**
Checkpoints can have custom eligibility rules (JSON format) to control access:
- Ticket type restrictions
- Time-based access
- Prerequisite checkpoint scans
- Custom business logic

### Service Points & Facilities

Facilities (also called service points) allow tracking of attendee interactions at various locations within an event.

**Facility Features:**
- **Name & Code**: Unique identifier (code max 10 characters)
- **Description**: Purpose of the facility
- **Icon & Color**: Visual customization for easy identification
- **Location**: Physical location within venue
- **Check-In/Check-Out Capability**: Control what operations are allowed
- **Active Status**: Enable/disable facilities
- **Sort Order**: Control display ordering

**Common Facility Types:**
- Food & Beverage Stations
- Merchandise Booths
- VIP Lounges
- Activity Areas
- Information Desks
- Restroom Areas
- Parking Zones

**Facility Statistics:**
- Total check-ins per facility
- Currently active at facility
- Peak usage times
- Average time spent

**Facility Management:**
- Create default facility for events
- Ensure default facility exists for scanners
- Reorder facilities for better organization
- View facility-specific scan history

### Re-Entry Management

**Event-Level Settings:**
- `allowReEntry`: Enable/disable re-entry (boolean)
- `requireCheckOut`: Mandate check-out before re-entry (boolean)
- `maxReEntries`: Maximum number of re-entries allowed (number or null for unlimited)
- `scanSettings`: Additional JSON configuration

**Re-Entry Tracking:**
- Check-in time and check-out time
- Re-entry count per attendee
- Currently inside status
- Last scan facility/checkpoint
- Full scan history with timestamps

**Re-Entry Validation:**
- Validates attendee hasn't exceeded max re-entries
- Checks if attendee is currently inside (if check-out required)
- Records each re-entry attempt

### Scan Types

The platform supports multiple scan types:
- `CHECK_IN`: Initial entry to event
- `CHECK_OUT`: Exit from event
- `RE_ENTRY`: Re-entry after check-out
- `CHECKPOINT_SCAN`: Scan at specific checkpoint
- `FACILITY_SCAN`: Scan at service point/facility
- `MANUAL_CHECK_IN`: Manual entry by staff
- `MANUAL_CHECK_OUT`: Manual exit by staff

### Real-Time Updates

**WebSocket Integration:**
- Scan events broadcast in real-time
- Event-specific rooms (`event:${eventId}`)
- Real-time statistics updates
- Scanner notifications

**Scan Event Data:**
- Scan ID and registration ID
- Event ID
- Scan type and timestamp
- Facility/checkpoint information
- Attendee name and ticket type
- Re-entry status
- Signature validation result
- Code type (QR or backup)

### Scan Statistics & Reports

**Real-time Metrics:**
- Total checked in (currently inside)
- Total scans by type
- Scans by facility/checkpoint
- Scans by time period
- Re-entries count
- Denied entries

**Scan History:**
- Searchable scan records
- Filter by:
  - Facility/checkpoint
  - Scan type
  - Date range
  - Scanner (staff member)
- Export capabilities
- Pagination support

### Search & Lookup

**Attendee Search:**
- Search by name (first or last)
- Search by email
- Search by phone number
- Search by backup code
- Filter by event
- Real-time results

**Ticket Details:**
- View full registration information
- See attendee profile
- Check scan history (last 10 scans)
- Verify ticket status
- View check-in/check-out status

---

## Badge Templates & Printing

EventKnit provides a comprehensive badge template system for creating custom event badges and name tags.

### Badge Template Features

**Template Configuration:**
- **Name & Description**: Identify and describe the template
- **Dimensions**: Custom width and height (in pixels or mm)
- **Size Presets**: Pre-defined sizes (e.g., 3.5" x 2", 4" x 6")
- **Orientation**: Portrait or Landscape
- **Background Color**: Customize badge background
- **Elements**: JSON-based design elements

**Template Scope:**
- **Platform Default**: Available to all organizers
- **Organizer-Specific**: Custom templates per organizer
- **Event-Specific**: Templates for specific events

**Template Management:**
- Create custom templates
- Update existing templates
- Set default templates
- Activate/deactivate templates
- Search and filter templates
- Duplicate templates for quick setup

**Badge Elements:**
Templates support dynamic elements (stored as JSON):
- Text fields (attendee name, title, company)
- QR codes (registration ID, custom data)
- Images (logos, photos, event branding)
- Shapes and decorative elements
- Custom fields from registration data

**Use Cases:**
- Conference name badges
- VIP badges with special styling
- Staff identification badges
- Speaker badges
- Exhibitor badges
- Attendee badges with QR codes

**Integration:**
- Generate badges from registration data
- Bulk badge generation for events
- Print-ready PDF export
- On-demand badge printing at check-in

---

## Seat Maps & Reserved Seating

EventKnit supports advanced seat mapping and reservation for events with assigned seating.

### Seat Map Features

**Seat Map Configuration:**
- Custom venue layout design
- Section definition
- Row and seat numbering
- Multiple seating tiers (VIP, General, etc.)
- Visual seat map editor

**Seat Map Management (Organizer):**
- Create or update seat map for events
- Define sections with pricing
- Set available seats per section
- Configure seat attributes
- Delete seat maps

**Seat Selection (Attendee):**
- View interactive seat map
- See real-time availability
- Select preferred seats
- Reserve seats temporarily
- Reservation timeout (default: configurable minutes)

### Seat Reservation Flow

```
1. Attendee views event with seat map
2. Browses available seats by section
3. Selects desired seats
4. Seats temporarily reserved (with timeout)
5. Proceeds to payment
6. Upon payment success:
   - Reservation confirmed
   - Seats assigned to registration
   - Seats marked as unavailable
7. If timeout expires without payment:
   - Reservation released
   - Seats become available again
```

### Seat Statuses

| Status | Description |
|--------|-------------|
| AVAILABLE | Seat is free for selection |
| RESERVED | Temporarily held during checkout |
| CONFIRMED | Assigned and paid for |
| BLOCKED | Not available for booking |

### Seat Map Features

**Section Management:**
- Define multiple sections (Orchestra, Balcony, VIP, etc.)
- Set capacity per section
- Price per section or individual seats
- Section-specific attributes

**Real-Time Availability:**
- Live updates of seat availability
- Prevent double-booking
- Handle concurrent reservations
- Release expired reservations

**Queries & Filters:**
- Get available seats by section
- Filter by price range
- Filter by seat attributes
- View seat map with availability overlay

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

## Mobile Application

EventKnit provides a native mobile application (Flutter/Dart) for iOS and Android platforms, offering attendees a seamless mobile experience.

### Mobile App Features

**Authentication:**
- Email/password login
- Google Sign-In integration
- Facebook Login integration
- Biometric authentication (fingerprint, Face ID)
- Secure token management
- Persistent login sessions

**Event Discovery:**
- Browse and search events
- Filter by category, date, location
- Featured events carousel
- Event recommendations
- Bookmark/save events for later
- Share events with others

**Event Details:**
- Full event information
- Interactive venue map
- Event agenda/schedule
- Speaker information
- Ticket types and pricing
- Gallery and media

**Ticket Management:**
- View all registered events
- Access digital tickets
- Display QR codes for scanning
- Download ticket PDFs
- View ticket details (type, status, etc.)
- Manage ticket transfers

**Notifications:**
- Push notifications for:
  - Event reminders
  - Ticket confirmations
  - Event updates
  - Check-in confirmations
  - Transfer notifications
  - Promotional offers
- In-app notification center
- Notification preferences

**Profile & Settings:**
- User profile management
- Payment methods
- Notification settings
- Privacy settings
- Help and support
- App version information

**Mobile-Specific Features:**
- Offline ticket access
- Biometric security
- Native camera for QR scanning
- Deep linking to events
- Share via native sharing
- Dark mode support

### Mobile App Architecture

**State Management:**
- GetX for reactive state management
- Controllers for business logic separation

**Key Controllers:**
- `AuthController`: Authentication and user session
- `EventsController`: Event browsing and management
- `TicketsController`: Ticket viewing and actions
- `NotificationsController`: Notification handling
- `SavedEventsController`: Bookmarked events
- `BottomNavigationController`: Navigation state

**Screens:**
- Splash screen with branding
- Discovery/Browse events
- Event details
- Saved events
- Tickets list
- Profile/Settings

**API Integration:**
- RESTful API client
- Token-based authentication
- Automatic token refresh
- Error handling and retry logic
- Network status monitoring

**Offline Support:**
- Cached event data
- Stored tickets for offline access
- Queue API calls when offline
- Sync when connection restored

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

## Platform Feedback

The platform includes a comprehensive feedback collection system for continuous improvement.

### Feedback Collection

**Automated Email Triggers:**
- Post-event feedback emails sent to attendees
- Post-event feedback emails sent to organizers
- Token-based submission (no login required)
- 7-day token expiry

**Platform Submission:**
- Logged-in users can submit feedback anytime
- Linked to specific events
- Tracks user type (Attendee/Organizer)

### NPS (Net Promoter Score)

**Score Categories:**
| Score | Category | Description |
|-------|----------|-------------|
| 9-10 | Promoters | Loyal enthusiasts |
| 7-8 | Passives | Satisfied but unenthusiastic |
| 0-6 | Detractors | Unhappy customers |

**NPS Calculation:**
```
NPS = % Promoters - % Detractors
```
Range: -100 to +100

### Feedback Metrics

**Category Ratings (1-5 scale):**
- Event Quality
- Platform Usability
- Registration Process
- Communication Quality

**Additional Data:**
- Would use again (Yes/No)
- Would recommend (Yes/No)
- Improvement areas (multiple choice)
- Free-form comments

### Admin Feedback Dashboard

**Features:**
- View all feedback with filters
- NPS analytics and trends
- Category breakdowns
- User type distribution
- Improvement area analysis
- Export capabilities

**Filters:**
- By event
- By user type (Attendee/Organizer)
- By NPS score range
- By date range

### Feedback API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/feedback | Submit feedback (authenticated) |
| GET | /api/v1/feedback/token/:token | Validate feedback token |
| POST | /api/v1/feedback/token/:token | Submit via email token |
| GET | /api/v1/admin/feedback | List all feedback (admin) |
| GET | /api/v1/admin/feedback/analytics | Get NPS analytics (admin) |
| GET | /api/v1/admin/feedback/:id | Get single feedback (admin) |
| PATCH | /api/v1/admin/feedback/:id/notes | Add admin notes (admin) |
| POST | /api/v1/admin/feedback/trigger/:eventId | Trigger feedback emails (admin) |
| GET | /api/v1/admin/feedback/event/:eventId | Get event feedback (admin) |

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

## Company Documents

The Company Documents section gives admin staff a centralised repository for all internal organisational files, whether stored as uploaded files or external links to cloud services.

### Document Types

| Type | Description |
|------|-------------|
| `FILE` | Uploaded binary file (PDF, Word, Excel, PowerPoint, image, CSV) stored on Cloudinary |
| `GOOGLE_DOC` | Link to a Google Docs document |
| `GOOGLE_SHEET` | Link to a Google Sheets spreadsheet |
| `GOOGLE_SLIDES` | Link to a Google Slides presentation |
| `EXTERNAL_LINK` | Any other external URL (e.g. Notion page, SharePoint, Confluence) |

### Document Categories

| Category | Use Case |
|----------|----------|
| Legal | Contracts, NDAs, incorporation documents |
| Financial | Budgets, invoices, financial statements |
| HR | Job descriptions, employment policies, handbooks |
| Operations | SOPs, runbooks, process guides |
| Marketing | Brand assets, campaign briefs, style guides |
| Compliance | Regulatory filings, audit reports, certifications |
| Contracts | Vendor and client agreements |
| Policies | Internal policies, codes of conduct |
| Other | Miscellaneous documents |

### Access Control

Only admin-level users (`ADMIN_STAFF` and above) can access, upload, edit, or delete company documents. All operations are authenticated and authorised via JWT with role enforcement in the API middleware.

### Capabilities

- **Upload files** up to 25 MB. Accepted formats: PDF, Word (.doc/.docx), Excel (.xls/.xlsx), PowerPoint (.ppt/.pptx), images (JPEG/PNG/GIF/WebP), and CSV.
- **Save external links** to Google Docs, Google Sheets, Google Slides, or any URL without uploading a file.
- **Search** documents by name or description.
- **Filter** by category and document type.
- **Edit** document name, description, category, or external URL.
- **Delete** documents. Uploaded files are also removed from Cloudinary storage.
- **Open / Download** documents directly from the dashboard.

### Admin Workflow

1. Navigate to **Company Documents** in the admin sidebar.
2. To upload a file: click **Upload File**, drag-and-drop or select a file, fill in name, category, and optional description, then click **Upload**.
3. To save a link: click **Add Link**, select the link type (Google Doc, Google Sheet, Google Slides, or External Link), paste the URL, fill in name, category, and optional description, then click **Save Link**.
4. Use the search bar and category/type filters to find documents.
5. Click **Open** to open a document in a new tab, or **Download** to download an uploaded file.
6. Click the trash icon and confirm the deletion dialog to remove a document.

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/admin/company-documents | List documents (paginated, filterable) |
| GET | /api/v1/admin/company-documents/:id | Get a single document |
| POST | /api/v1/admin/company-documents/link | Save an external link document |
| POST | /api/v1/admin/company-documents/upload | Upload a file document |
| PATCH | /api/v1/admin/company-documents/:id | Update document metadata |
| DELETE | /api/v1/admin/company-documents/:id | Delete document (and Cloudinary asset) |

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
| POST | /auth/register-code/request | Request registration verification code |
| POST | /auth/register-code/verify | Verify code and complete registration |
| POST | /auth/login | Login with email/password |
| POST | /auth/google | Login/register with Google OAuth |
| POST | /auth/facebook | Login/register with Facebook OAuth |
| POST | /auth/email-oauth/request | Request passwordless login code |
| POST | /auth/email-oauth/verify | Verify code and login |
| POST | /auth/magic-link/request | Request magic link login |
| GET | /auth/magic-link/verify | Verify magic link |
| POST | /auth/password/reset-request | Request password reset |
| POST | /auth/password/reset-confirm | Reset password with token |
| POST | /auth/password/change | Change password (authenticated) |
| POST | /auth/refresh | Refresh access token |
| POST | /auth/logout | Logout |
| GET | /auth/me | Get current user |
| PUT | /auth/profile | Update user profile |

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

#### Workstation & Scanning
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /workstation/scan | Scan ticket (check-in) |
| POST | /workstation/scan-out | Scan out (check-out) |
| POST | /workstation/manual-check-in | Manual check-in by search |
| POST | /workstation/manual-check-out | Manual check-out by search |
| GET | /workstation/search | Search attendees |
| GET | /workstation/tickets/:ticketId | Get ticket details |
| GET | /workstation/events/:eventId | Get event with scan config |
| GET | /workstation/events/:eventId/attendees | Get event attendees with scan status |
| GET | /workstation/events/:eventId/scans | Get scan history for event |
| GET | /workstation/events/:eventId/config | Get event scan configuration |
| PUT | /workstation/events/:eventId/config | Update event scan configuration |

#### Checkpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /checkpoints | Create checkpoint |
| GET | /checkpoints/:checkpointId | Get checkpoint by ID |
| GET | /checkpoints/event/:eventId | Get checkpoints for event |
| PUT | /checkpoints/:checkpointId | Update checkpoint |
| DELETE | /checkpoints/:checkpointId | Delete checkpoint |
| POST | /checkpoints/:checkpointId/duplicate | Duplicate checkpoint |
| POST | /checkpoints/:checkpointId/scan | Scan at checkpoint |
| GET | /checkpoints/:checkpointId/scans | Get checkpoint scans |
| GET | /checkpoints/:checkpointId/stats | Get checkpoint statistics |
| GET | /checkpoints/event/:eventId/summary | Get event checkpoint summary |
| POST | /checkpoints/:checkpointId/staff | Assign staff to checkpoint |
| DELETE | /checkpoints/:checkpointId/staff/:staffId | Remove staff from checkpoint |
| GET | /checkpoints/:checkpointId/staff | Get checkpoint staff |
| GET | /checkpoints/attendee/:registrationId | Get attendee checkpoint status |
| GET | /checkpoints/:checkpointId/eligibility/:registrationId | Check attendee eligibility |

#### Facilities (Service Points)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /events/:eventId/facilities | Create facility |
| GET | /events/:eventId/facilities | Get all facilities for event |
| GET | /events/:eventId/facilities/:id | Get single facility |
| PUT | /events/:eventId/facilities/:id | Update facility |
| DELETE | /events/:eventId/facilities/:id | Delete facility |
| GET | /events/:eventId/facilities/:id/stats | Get facility statistics |
| POST | /events/:eventId/facilities/reorder | Reorder facilities |
| POST | /events/:eventId/facilities/create-default | Create default facility |
| POST | /events/:eventId/facilities/ensure-default | Ensure default facility exists |

#### Badge Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /badge-templates | Create badge template |
| GET | /badge-templates/:id | Get template by ID |
| GET | /badge-templates | Get templates (with filters) |
| PUT | /badge-templates/:id | Update template |
| DELETE | /badge-templates/:id | Delete template |
| POST | /badge-templates/:id/duplicate | Duplicate template |

#### Seat Maps
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /organizer-dashboard/events/:eventId/seat-map | Create/update seat map |
| GET | /organizer-dashboard/events/:eventId/seat-map | Get seat map for event |
| GET | /organizer-dashboard/events/:eventId/seats/available | Get available seats |
| DELETE | /organizer-dashboard/events/:eventId/seat-map | Delete seat map |
| GET | /events/:eventId/seat-map | Get seat map availability (public) |
| POST | /events/:eventId/seats/reserve | Reserve seats |

#### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /analytics/events/:eventId | Get event analytics |
| GET | /analytics/organizer/:organizerId | Get organizer analytics |
| GET | /analytics/platform | Get platform-wide analytics (admin) |

#### Feedback
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /feedback | Submit feedback (authenticated) |
| GET | /feedback/token/:token | Validate feedback token |
| POST | /feedback/token/:token | Submit via email token |
| GET | /admin/feedback | List all feedback (admin) |
| GET | /admin/feedback/analytics | Get NPS analytics (admin) |
| GET | /admin/feedback/:id | Get single feedback (admin) |
| PATCH | /admin/feedback/:id/notes | Add admin notes (admin) |
| POST | /admin/feedback/trigger/:eventId | Trigger feedback emails (admin) |
| GET | /admin/feedback/event/:eventId | Get event feedback (admin) |

#### User Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /user-dashboard/events | Get user's registered events |
| GET | /user-dashboard/tickets | Get user's tickets |
| POST | /user-dashboard/transfers/:registrationId | Initiate ticket transfer |
| POST | /user-dashboard/transfers/accept/:token | Accept ticket transfer |
| POST | /user-dashboard/transfers/:id/cancel | Cancel ticket transfer |
| GET | /user-dashboard/transfers | Get transfer history |

#### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /notifications | Get user notifications |
| PUT | /notifications/:id/read | Mark notification as read |
| PUT | /notifications/read-all | Mark all as read |
| DELETE | /notifications/:id | Delete notification |

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

---

## Platform TODOs

The following items are marked for future implementation or improvement:

### Core Features

| Area | Description | Priority |
|------|-------------|----------|
| Direct Messaging | Send notification to recipient when message received | High |
| Event Details | Check if user is already registered for this event | Medium |
| Saved Events | Replace mock data with actual API call | Medium |
| Saved Events | Implement API call to remove from saved events | Medium |

### Authentication & Security

| Area | Description | Priority |
|------|-------------|----------|
| Social OAuth | Encrypt access tokens stored in database | High |
| Email Entry | Check if email exists in database before proceeding | Medium |

### Payment & Tickets

| Area | Description | Priority |
|------|-------------|----------|
| Payment Step | Complete Paystack integration | High |
| Confirmation Step | Implement ticket download functionality | Medium |
| Confirmation Step | Implement share functionality | Medium |

### Social Media Integration

| Platform | Description | Priority |
|----------|-------------|----------|
| Instagram | Replace placeholders with actual Graph API calls | Medium |
| LinkedIn | Replace placeholders with actual API calls | Medium |
| Facebook | Replace placeholders with actual Graph API calls | Medium |
| Twitter | Replace placeholders with actual API v2 calls | Medium |

### User Experience

| Area | Description | Priority |
|------|-------------|----------|
| Print Preview | Install react-to-pdf package for PDF export | Low |
| Direct Messaging | Implement reply functionality | Medium |
| Organizer Event Grid | Add date filter when backend supports it | Low |

### Event Management

| Area | Description | Priority |
|------|-------------|----------|
| Event Service | Send welcome email with password reset link | Medium |

### Digital Wallet Integration

| Area | Description | Priority |
|------|-------------|----------|
| Apple Wallet | Integrate Apple PassKit with Pass Type ID certificate | High |
| Apple Wallet | Sign .pkpass files with Apple Developer certificate | High |
| Apple Wallet | Generate actual downloadable .pkpass files | High |
| Google Pay | Integrate Google Pay Passes API | High |
| Google Pay | Obtain Google Pay API for Passes credentials | High |
| Google Pay | Generate save-to-wallet links for Google Pay | High |

**Requirements for Apple Wallet:**
- Apple Developer account ($99/year)
- Pass Type ID certificate from Apple Developer portal
- Private key for signing passes
- Server-side pkpass file generation (use `passkit-generator` npm package)

**Requirements for Google Pay:**
- Google Cloud Platform account
- Google Pay API for Passes enabled
- Service account with appropriate permissions
- Issuer ID from Google Pay console

### Admin Features (Mock Data)

| Area | Description | Priority |
|------|-------------|----------|
| System Health | Replace mock system metrics with real monitoring | Medium |
| System Health | Integrate with actual server health endpoints | Medium |
| Moderation | Replace mock reported content with real API | Medium |
| Moderation | Implement content review workflow | Medium |

### Marketing (Backend Required)

| Area | Description | Priority |
|------|-------------|----------|
| Marketing Overview | Build dashboard with campaign stats, ROI metrics | Medium |
| Campaigns | Create campaign management with targeting, scheduling | Medium |
| Campaigns | Implement campaign analytics and performance tracking | Medium |
| Email Marketing | Build email template editor with drag-and-drop | Medium |
| Email Marketing | Implement email scheduling and automation | Medium |
| Email Marketing | Add email analytics (opens, clicks, conversions) | Medium |
| Promotions | Create platform-wide promotions management | Low |
| Promotions | Implement promotion targeting rules | Low |
| Affiliate Program | Build affiliate registration and approval workflow | Low |
| Affiliate Program | Implement affiliate tracking and commission system | Low |
| Affiliate Program | Create affiliate dashboard with earnings reports | Low |
| Partnerships | Build partnership management interface | Low |
| Partnerships | Implement partner revenue sharing configuration | Low |

**Note:** Social Media and Promo Codes are currently active with backend support.

---

*Last updated: January 2026*
