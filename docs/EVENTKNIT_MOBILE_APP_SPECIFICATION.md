# EventKnit Mobile App Specification

> **Research-Based Mobile Strategy Document**
> Based on analysis of EventKnit's current platform and industry leaders: Eventbrite, Cvent, RSVPify, Ticket Fairy, and other top event management platforms.

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Research Insights](#research-insights)
3. [Mobile-First Principles](#mobile-first-principles)
4. [User Roles & Core Modules](#user-roles--core-modules)
5. [Admin Mobile App](#admin-mobile-app)
6. [Organizer Mobile App](#organizer-mobile-app)
7. [Attendee Mobile App](#attendee-mobile-app)
8. [Technical Requirements](#technical-requirements)
9. [Implementation Phases](#implementation-phases)
10. [Success Metrics](#success-metrics)

---

## Executive Summary

### The Challenge
EventKnit currently has **massive dashboards** with 100+ features across Admin (35+ pages), Organizer (42+ pages), and Attendee (37+ pages) interfaces. This makes the web platform powerful but overwhelming for mobile users who need **quick access to essential features** on the go.

### The Solution
Create **role-specific mobile apps** that focus on **high-frequency, time-sensitive tasks** that users perform in the field:
- **Admin Mobile**: Critical monitoring + ticket scanning at events
- **Organizer Mobile**: Event oversight + attendee check-in + real-time updates
- **Attendee Mobile**: Ticket access + event discovery + networking

### Research Foundation
Analysis of industry leaders reveals that successful mobile event apps prioritize:
1. **Speed**: Quick access to tickets, check-in (600-900 entries/hour per scanner)
2. **Offline Capability**: Critical for poor connectivity at event venues
3. **Real-Time Sync**: Instant updates across multiple devices
4. **Simplicity**: 5-7 core features per role (vs 35+ on desktop)

---

## Research Insights

### What Top Platforms Do on Mobile

#### Eventbrite Mobile Strategy
Eventbrite uses **separate apps** for different user roles:

**Eventbrite Organizer App** ([Source](https://www.eventbrite.com/organizer/features/organizer-check-in-app/)):
- ✅ Real-time ticket sales tracking
- ✅ Fast QR code scanning (600-900 tickets/hour)
- ✅ Live attendance monitoring
- ✅ Order management (reissues, cancellations, refunds)
- ✅ On-site payment acceptance
- ✅ Multi-device real-time syncing
- ✅ Dashboard with dynamic visualizations
- ❌ No full event creation (desktop only)
- ❌ No detailed analytics (desktop only)

**Eventbrite Attendee App**:
- ✅ Ticket storage with QR codes
- ✅ Event discovery and search
- ✅ One-tap check-in
- ✅ Event recommendations
- ❌ No event creation (not needed for attendees)

#### Industry Best Practices ([Sources](https://www.eventdex.com/blog/5-best-event-check-in-apps-for-2023/))

**Critical Mobile Features** (from Cvent, RSVPify, Accelevents):
1. **Offline Mode**: Must work without internet (festival case: 8,000 entries/hour with network overload)
2. **QR Code Scanning**: Industry standard for fast check-in
3. **Badge Printing**: On-site badge generation
4. **Real-Time Analytics**: Live attendance tracking
5. **Multi-Scanner Support**: Coordinate multiple entry points
6. **Fraud Prevention**: Prevent duplicate entries
7. **Manual Fallback**: Name/email lookup when QR fails

**What Stays on Desktop**:
- Complex event creation wizards (6+ tabs)
- Detailed financial reports
- Bulk data imports/exports
- Template customization
- Multi-step approval workflows
- Advanced analytics dashboards

### Key Findings

| Feature Type | Mobile Priority | Reason |
|-------------|-----------------|--------|
| **Ticket Scanning** | 🔴 CRITICAL | Time-sensitive, field operation |
| **Ticket Viewing** | 🔴 CRITICAL | Primary attendee need |
| **Event Discovery** | 🔴 CRITICAL | Mobile users browse on-the-go |
| **Real-Time Alerts** | 🟡 HIGH | Push notifications essential |
| **Quick Event Status** | 🟡 HIGH | Organizers monitor remotely |
| **Basic Order Mgmt** | 🟡 HIGH | Handle issues on-site |
| **Event Creation** | 🟢 LOW | Better on desktop (complex) |
| **Financial Reports** | 🟢 LOW | Better on desktop (detailed) |
| **Template Builder** | 🟢 LOW | Better on desktop (design-heavy) |

---

## Mobile-First Principles

### Design Philosophy

1. **One Primary Action Per Screen**
   - Bad: Dashboard with 20 widgets
   - Good: "Scan Ticket" button takes 60% of screen

2. **Offline-First Architecture**
   - All critical features work without internet
   - Sync when connection available
   - Queue actions for later upload

3. **Speed Over Features**
   - Reduce clicks: 2-3 taps maximum to primary action
   - Eventbrite benchmark: 10-15 tickets/minute per scanner
   - Target: <3 seconds from app open to scanning

4. **Role-Specific Navigation**
   - Admin: Monitor → Scan → Act
   - Organizer: Overview → Check-in → Communicate
   - Attendee: Tickets → Discover → Network

5. **Progressive Disclosure**
   - Show essentials first, details on demand
   - Use bottom sheets/modals for secondary info
   - Keep main screens clean and focused

---

## User Roles & Core Modules

### Role Distribution Analysis

Based on EventKnit's current platform, mobile needs differ significantly:

| Role | Desktop Pages | Mobile Modules Needed | Reduction |
|------|---------------|----------------------|-----------|
| **Admin** | 35+ | 6-8 | 77% reduction |
| **Organizer** | 42+ | 7-10 | 76% reduction |
| **Attendee** | 37+ | 5-7 | 81% reduction |

---

## Admin Mobile App

### Target Users
- Platform administrators
- Event staff (ADMIN, SUPERADMIN roles)
- Service point operators (TELLER role)
- Support staff (SUPPORT role)

### Core Problem Statement
> "I need to monitor the platform health and scan tickets at events without carrying a laptop."

### Essential Modules (6-8 features)

#### 1. 🎫 Ticket Scanner (CRITICAL)
**Why**: Primary field operation, directly generates revenue

**Features**:
- QR code scanning with camera
- Offline mode with queue sync
- Validation feedback (green checkmark / red X)
- Manual lookup fallback (name/email search)
- Ticket type verification
- Duplicate entry prevention
- Scan history log
- Multi-checkpoint support

**Performance Targets**:
- 10-15 scans per minute
- <1 second scan-to-validation time
- 99.9% offline reliability

**UI Priority**:
- Full-screen camera view
- Large scan target area
- Haptic feedback on successful scan
- Audio cues (beep for success, buzz for error)

**Research Justification**:
Eventbrite, Ticket Fairy, and Cvent all make scanning the #1 mobile priority. One festival processed 8,000+ entries/hour using mobile scanners with offline mode. ([Source](https://www.vfairs.com/blog/event-check-in/))

---

#### 2. 📊 Platform Dashboard (HIGH)
**Why**: Real-time monitoring of critical metrics

**Features**:
- Today's stats (active events, total scans, revenue)
- Live event list with status indicators
- Critical alerts/notifications
- Quick event search
- System health status
- Pending approval count (red badge)

**What's Excluded**:
- ❌ Complex charts (desktop only)
- ❌ Historical trends (desktop only)
- ❌ Custom date ranges (desktop only)
- ❌ Export functionality (desktop only)

**UI Priority**:
- Card-based layout
- Pull-to-refresh
- Swipe actions (approve/decline)
- Bottom navigation

---

#### 3. ⚡ Quick Actions (HIGH)
**Why**: Resolve urgent issues on-site

**Features**:
- Approve/decline pending events (swipe actions)
- Refund request handling
- Support ticket triage
- Staff assignment
- Emergency announcements

**What's Excluded**:
- ❌ Bulk operations (desktop only)
- ❌ Detailed editing (desktop only)
- ❌ Complex workflows (desktop only)

---

#### 4. 👥 Attendee Lookup (MEDIUM)
**Why**: Verify registrations, resolve check-in issues

**Features**:
- Search by name, email, or ticket number
- View attendee details
- Ticket status (checked in / not checked in)
- Manual check-in override
- Contact attendee (call/email)

---

#### 5. 🔔 Notifications & Alerts (MEDIUM)
**Why**: Stay informed of critical issues

**Features**:
- Push notifications for:
  - New event submissions
  - Payment issues
  - Support escalations
  - System alerts
- In-app notification center
- Quick action from notification (deep links)

---

#### 6. 📍 Badge Printing (MEDIUM)
**Why**: On-demand badge generation at service points

**Features**:
- Print badges for walk-in attendees
- Reprint lost badges
- Connect to Bluetooth printers
- Badge template selection
- Preview before print

**What's Excluded**:
- ❌ Template design (desktop only)
- ❌ Template editor (desktop only)

---

#### 7. 👤 Profile & Settings (LOW)
**Why**: Basic account management

**Features**:
- View profile
- Notification preferences
- Scanner settings (sound, vibration)
- Logout
- App version info

---

#### 8. 📈 Live Event Monitor (OPTIONAL)
**Why**: Track specific event performance

**Features**:
- Select event to monitor
- Live check-in counter
- Capacity tracker (800/1000 checked in)
- Entry velocity (scans per minute)
- Checkpoint breakdown

---

### Admin App Navigation Structure

```
Bottom Navigation (4 tabs):
├── 🏠 Home (Dashboard)
├── 🎫 Scan (Ticket Scanner)
├── 🔔 Alerts (Notifications)
└── 👤 Profile

From Home, swipe cards to:
├── View Live Events
├── Quick Approve/Decline
├── Search Attendees
└── Print Badges
```

---

## Organizer Mobile App

### Target Users
- Event organizers (ORGANIZER role)
- Organizer staff (ORGANIZER_STAFF role)
- Organizer tellers (ORGANIZER_TELLER role)

### Core Problem Statement
> "I need to manage my event, check in attendees, and communicate updates while I'm at the venue or on the go."

### Essential Modules (7-10 features)

#### 1. 🏠 Event Dashboard (CRITICAL)
**Why**: Quick overview of event health

**Features**:
- **Event Selector**: Switch between events (dropdown)
- **Key Metrics** (cards):
  - Total registrations
  - Tickets sold vs. remaining
  - Revenue (today / total)
  - Check-in count (live)
  - Capacity utilization (% full)
- **Quick Actions**:
  - Start/stop check-in
  - Send update to attendees
  - View ticket sales
- **Upcoming Deadlines**: Next 3 important dates
- **Recent Activity**: Last 5 registrations/check-ins

**What's Excluded**:
- ❌ Detailed analytics (desktop only)
- ❌ Historical trends (desktop only)
- ❌ Revenue breakdowns (desktop only)

**Research Justification**:
Eventbrite Organizer app shows real-time ticket sales and attendance with dynamic dashboard visualization. ([Source](https://www.eventbrite.com/organizer/features/organizer-check-in-app/))

---

#### 2. 🎫 Check-In Scanner (CRITICAL)
**Why**: Primary function at event venue

**Features**:
- QR code scanning
- Offline mode with sync queue
- Ticket type verification (VIP, GA, etc.)
- Manual lookup (name/email)
- Check-in override (special cases)
- Group check-in (scan multiple)
- Check-in history
- Multi-device coordination

**Performance Targets**:
- 10-15 scans per minute
- <1 second validation
- Works 100% offline

**Additional Features**:
- Attendee photo display (verify identity)
- Ticket tier color coding
- Session tracking (workshops, breakouts)
- Access control (VIP areas)

**Research Justification**:
Industry standard shows 600-900 entries/hour per scanner. Offline mode is critical - one festival handled 8,000 entries/hour despite network overload. ([Source](https://www.vfairs.com/blog/event-check-in/))

---

#### 3. 👥 Attendee List (HIGH)
**Why**: Quick access to attendee information

**Features**:
- Search/filter attendees
- View attendee details:
  - Name, email, phone
  - Ticket type
  - Check-in status
  - Registration date
  - Custom fields
- Check-in status toggle
- Contact attendee (call/SMS/email)
- Sort by: name, check-in status, ticket type
- Filter by: checked in, not checked in, ticket type

**What's Excluded**:
- ❌ Bulk messaging (use Communication module)
- ❌ Segmentation (desktop only)
- ❌ Data export (desktop only)
- ❌ Tags management (desktop only)

---

#### 4. 💬 Quick Communication (HIGH)
**Why**: Send urgent updates to attendees

**Features**:
- Send to: All attendees / Checked-in only / Not checked-in
- Message types:
  - Push notification
  - SMS (if phone numbers available)
  - Email
- Pre-defined templates:
  - "Event starting in 15 minutes"
  - "Gate change announcement"
  - "Emergency evacuation"
  - Custom message
- Delivery status (sent / delivered / read)
- Message history (last 10 sent)

**What's Excluded**:
- ❌ Email template builder (desktop only)
- ❌ Scheduled messages (desktop only)
- ❌ Advanced segmentation (desktop only)
- ❌ A/B testing (desktop only)

**Research Justification**:
Real-time communication is essential for event management. Automated updates keep attendees informed and reduce manual work. ([Source](https://www.eventsair.com/blog/best-event-ticketing-software))

---

#### 5. 🎟️ Ticket Sales Monitor (HIGH)
**Why**: Track revenue in real-time

**Features**:
- Sales graph (last 7 days)
- Ticket breakdown by type:
  - General Admission: 150/200 sold
  - VIP: 45/50 sold
  - Early Bird: 100/100 sold (SOLD OUT badge)
- Revenue today vs. total
- Recent orders (last 10)
- Order details view
- Refund request handling

**What's Excluded**:
- ❌ Create new ticket types (desktop only)
- ❌ Pricing changes (desktop only)
- ❌ Detailed financial reports (desktop only)

---

#### 6. 🎤 Event Details (MEDIUM)
**Why**: Quick reference for event info

**Features**:
- Event overview (read-only):
  - Title, description
  - Date, time, location
  - Capacity, pricing
  - Status (DRAFT, PENDING, APPROVED, LIVE)
- Edit basic info:
  - Description
  - Event image
  - Location/venue
  - Start/end time
- QR code for event (attendees can scan to register)
- Share event link

**What's Excluded**:
- ❌ Full event creation (desktop only)
- ❌ Advanced settings (desktop only)
- ❌ Template management (desktop only)
- ❌ Speaker/sponsor management (desktop only)

---

#### 7. 📦 On-Site Sales (MEDIUM)
**Why**: Sell tickets at the door

**Features**:
- Quick ticket purchase flow:
  1. Select ticket type
  2. Enter attendee info (name, email, phone)
  3. Payment (cash / card reader integration)
  4. Generate QR code ticket
  5. Email/SMS ticket to attendee
- Cash drawer tracking
- Card reader integration (Stripe Terminal, Square)
- Print physical ticket
- End-of-day sales report

**Research Justification**:
Eventbrite Organizer app supports "fast, secure on-site payments for tickets and merchandise." ([Source](https://apps.apple.com/us/app/eventbrite-organizer/id368260521))

---

#### 8. 🔔 Notifications (MEDIUM)
**Why**: Stay informed of important updates

**Features**:
- Push notifications for:
  - New registrations
  - Refund requests
  - Event approval/rejection
  - Check-in milestones (50%, 75%, 100%)
  - Payment confirmations
  - Support tickets
- In-app notification center
- Mark as read / unread
- Quick actions from notifications

---

#### 9. ⚙️ Quick Settings (LOW)
**Why**: Adjust event configurations on the fly

**Features**:
- Toggle event visibility (public/private)
- Pause/resume ticket sales
- Update capacity limit
- Enable/disable check-in
- Close event to new registrations

**What's Excluded**:
- ❌ Advanced event settings (desktop only)
- ❌ Integration configs (desktop only)
- ❌ White-label branding (desktop only)

---

#### 10. 🎫 Badge Printing (OPTIONAL)
**Why**: Print badges for walk-ins or replacements

**Features**:
- Connect to Bluetooth printer
- Select badge template
- Print for specific attendee
- Batch print (all checked-in)
- Preview before print

---

### Organizer App Navigation Structure

```
Bottom Navigation (5 tabs):
├── 🏠 Dashboard
├── 🎫 Check-In (Scanner)
├── 👥 Attendees
├── 💬 Messages
└── ⚙️ More
    ├── Ticket Sales
    ├── Event Details
    ├── On-Site Sales
    ├── Badge Printing
    ├── Notifications
    └── Profile/Settings
```

---

## Attendee Mobile App

### Target Users
- Event attendees (USER role)
- Anyone discovering events
- Ticket purchasers

### Core Problem Statement
> "I need to find events I'm interested in, access my tickets quickly, and navigate the event experience - all from my phone."

### Essential Modules (5-7 features)

#### 1. 🎫 My Tickets (CRITICAL)
**Why**: Primary reason users download the app

**Features**:
- **Wallet-Style View**: All tickets in one scrollable list
- **QR Code Display**: Large, scannable QR code
- **Ticket Details**:
  - Event name, date, time
  - Venue/location (with map link)
  - Ticket type (General, VIP, etc.)
  - Order number
  - Attendee name
- **Add to Wallet**: Save to Apple Wallet / Google Pay
- **Ticket Actions**:
  - Share ticket (transfer to friend)
  - Download PDF
  - View event details
  - Get directions
  - Contact organizer
- **Upcoming vs. Past**: Auto-sort by date
- **Offline Access**: Tickets cached locally
- **Check-in Status**: Green checkmark when scanned

**Research Justification**:
Mobile ticketing is the #1 attendee feature. Apps must allow tickets to be saved in Apple/Google wallets and accessed offline. ([Source](https://passkit.com/blog/best-event-ticket-app/))

---

#### 2. 🔍 Event Discovery (CRITICAL)
**Why**: Users browse events on mobile while commuting, in cafes, etc.

**Features**:
- **Search**: By name, keyword, category, location
- **Filters**:
  - Date range (This week / This month / Custom)
  - Location (Near me / City search)
  - Category (Music, Tech, Sports, etc.)
  - Price (Free / Paid / Under $50)
  - Event type (Online / In-person / Hybrid)
- **Browse**:
  - Featured events (curated by admin)
  - Trending events (most popular)
  - Recommended for you (AI-based)
  - Near me (location-based)
  - Categories grid
- **Event Cards**:
  - Image, title, date, location
  - Price range
  - Attendee count
  - Save for later (heart icon)
- **Quick View**: Bottom sheet with details
- **Full Event Page**: Tap to expand

**Research Justification**:
Event discovery is critical for mobile apps. Users expect personalized recommendations and location-based search. ([Source](https://www.eventbrite.com/l/eventbrite-app/))

---

#### 3. 📅 Event Details & Registration (HIGH)
**Why**: Complete the booking flow on mobile

**Features**:
- **Event Overview**:
  - Cover image
  - Title, date, time, location
  - Description
  - Organizer info
  - Capacity availability
- **Ticket Selection**:
  - List ticket types with prices
  - Quantity selector
  - Promo code field
  - Total price calculation
- **Quick Registration**:
  - Autofill from profile
  - Payment method (saved cards)
  - Guest checkout (no account)
  - Apple Pay / Google Pay
- **Add to Calendar**: Sync with device calendar
- **Get Directions**: Open in Maps
- **Share**: Share event with friends

**What's Excluded**:
- ❌ Complex multi-step forms (keep simple)
- ❌ Custom registration fields (collect only essentials)

---

#### 4. 🔔 Notifications & Updates (HIGH)
**Why**: Stay informed about event changes

**Features**:
- **Push Notifications**:
  - Event reminders (24 hours before, 1 hour before)
  - Gate changes / venue updates
  - Organizer announcements
  - Last-minute changes
- **In-App Inbox**: Message history from organizers
- **Notification Preferences**:
  - Event reminders ON/OFF
  - Promotional offers ON/OFF
  - Update frequency

**Research Justification**:
Automated reminders and updates are essential for attendee engagement and reducing no-shows. ([Source](https://www.eventsair.com/blog/best-event-ticketing-software))

---

#### 5. ❤️ Saved Events (MEDIUM)
**Why**: Bookmark interesting events

**Features**:
- List of saved/favorited events
- Remove from saved
- Quick registration from saved
- Notification when ticket sales start
- Share saved list with friends

---

#### 6. 👤 Profile & Settings (MEDIUM)
**Why**: Manage account preferences

**Features**:
- **Profile**:
  - Name, email, phone
  - Profile photo
  - Interests/categories (for recommendations)
  - Location preferences
- **Settings**:
  - Notification preferences
  - Payment methods (saved cards)
  - Language
  - Dark mode toggle
- **Order History**: Past purchases
- **Logout**

---

#### 7. 🎉 Event Experience Hub (OPTIONAL - POST-MVP)
**Why**: Enhance in-event experience

**Features** (for active events):
- **Digital Badge**: Show your attendee badge
- **Event Agenda**: Schedule of sessions/activities
- **Speakers**: List of speakers with bios
- **Exhibitors**: Vendor directory
- **Sponsors**: Sponsor logos and links
- **Networking**:
  - See who else is attending
  - Connect with other attendees
  - Chat/messaging
- **Live Updates**: Real-time announcements
- **Maps**: Venue map with navigation

**What's Excluded** (keep for MVP):
- ❌ This entire module (too complex for MVP)
- Focus on: Ticket access + Event discovery + Registration
- Add Event Experience features in Phase 2

---

### Attendee App Navigation Structure

```
Bottom Navigation (4 tabs):
├── 🎫 Tickets
├── 🔍 Discover
├── ❤️ Saved
└── 👤 Profile

From Discover:
├── Search Events
├── Browse Categories
├── Featured Events
└── Event Details → Register
```

---

## Technical Requirements

### Platform Strategy

#### Recommended: **React Native** (Single Codebase)

**Pros**:
- ✅ One codebase for iOS + Android (reduce development by 50%)
- ✅ Share business logic with existing React web app
- ✅ Leverage existing React Hook Form + Zod validation
- ✅ Fast iteration with hot reload
- ✅ Large ecosystem of libraries
- ✅ Expo for rapid prototyping and OTA updates

**Cons**:
- ❌ Slightly lower performance vs native (negligible for event apps)
- ❌ Some native features require custom bridges

**Alternative: Flutter** (if React Native expertise unavailable)

---

### Core Technical Features

#### 1. **Offline-First Architecture** (CRITICAL)

**Why**: Event venues often have poor connectivity

**Implementation**:
- Local SQLite database for:
  - Tickets (cached for offline access)
  - Attendee list (organizers)
  - Scan queue (pending uploads)
- Sync strategy:
  - Download essential data on app launch
  - Queue write operations when offline
  - Sync when connection restored
  - Conflict resolution (last-write-wins)

**Libraries**:
- WatermelonDB (React Native offline-first DB)
- Redux Persist (state persistence)
- NetInfo (network status detection)

**Research Justification**:
Offline mode is mandatory for check-in apps. One festival successfully processed 8,000 entries/hour with network overload using offline-capable scanners. ([Source](https://www.ticketfairy.com/event-ticketing/ticket-scanning-app))

---

#### 2. **QR Code Scanning** (CRITICAL)

**Implementation**:
- Camera access (iOS / Android permissions)
- QR code library: `react-native-vision-camera` + ML Kit
- Validation logic:
  - Decode QR → extract ticket ID
  - Check local DB → is ticket valid?
  - Mark as scanned → update DB
  - Sync to server when online
- Performance: <1 second scan-to-validation

**Fraud Prevention**:
- Detect duplicate scans (already checked in)
- Validate ticket signature (encrypted QR payload)
- Prevent screenshot scans (optional: NFC validation)

---

#### 3. **Push Notifications** (HIGH)

**Implementation**:
- Firebase Cloud Messaging (FCM) for Android
- Apple Push Notification Service (APNs) for iOS
- React Native Push Notifications library

**Notification Types**:
- Transactional: Ticket confirmation, refunds
- Event reminders: 24 hours, 1 hour before
- Organizer updates: Gate changes, announcements
- Admin alerts: New event submissions, support tickets

---

#### 4. **Real-Time Sync** (HIGH)

**Implementation**:
- WebSocket connection for live updates
- Socket.io or Pusher for real-time events
- Use cases:
  - Live check-in counter (organizers see scans in real-time)
  - Ticket sales updates
  - Multi-device coordination (multiple scanners)

**Fallback**:
- Polling every 30 seconds when WebSocket unavailable

---

#### 5. **Payment Integration** (HIGH)

**Implementation**:
- Stripe SDK for React Native
- Apple Pay / Google Pay integration
- Saved payment methods (tokenized)
- PCI compliance (use Stripe's tokenization, never store card numbers)

**Features**:
- One-tap checkout
- Guest checkout (no account required)
- Promo code validation
- Tax calculation
- Receipt generation

---

#### 6. **Location Services** (MEDIUM)

**Implementation**:
- React Native Geolocation
- Use cases:
  - "Near me" event search
  - Get directions to venue
  - Geofence triggers (notifications when near event)

**Permissions**:
- Request "While Using App" permission (not "Always")
- Explain why location is needed (better event recommendations)

---

#### 7. **Biometric Authentication** (MEDIUM)

**Implementation**:
- Face ID / Touch ID (iOS)
- Fingerprint / Face unlock (Android)
- Use for:
  - Quick login (organizers, admins)
  - Payment confirmation (attendees)

---

#### 8. **Badge Printing** (OPTIONAL)

**Implementation**:
- Bluetooth printer SDK (Star Micronics, Zebra)
- Generate badge from template
- Preview before print
- Print queue management

---

### API Requirements

**New Mobile-Specific Endpoints**:

```
POST /api/mobile/auth/login
POST /api/mobile/auth/biometric-setup
GET  /api/mobile/tickets/:userId (offline-optimized)
POST /api/mobile/scan/validate (offline-queue)
POST /api/mobile/scan/sync (batch upload)
GET  /api/mobile/events/discover (paginated, location-aware)
GET  /api/mobile/events/:id/attendees (organizer)
POST /api/mobile/communication/send (quick message)
GET  /api/mobile/dashboard/admin (lightweight)
GET  /api/mobile/dashboard/organizer/:eventId (lightweight)
```

**Optimization**:
- Compress responses (gzip)
- Paginate lists (20 items per page)
- Use GraphQL for selective field fetching (optional)
- Cache static content (event images, etc.)

---

### Security Requirements

1. **Authentication**:
   - JWT tokens with refresh token rotation
   - Biometric authentication for quick access
   - Auto-logout after 30 days of inactivity

2. **Data Encryption**:
   - Encrypt local SQLite database (SQLCipher)
   - HTTPS for all API calls
   - Certificate pinning (prevent MITM attacks)

3. **QR Code Security**:
   - Encrypted QR payload (not just ticket ID)
   - HMAC signature to prevent tampering
   - Expiry timestamp (ticket valid for 24 hours post-event)

4. **Permissions**:
   - Request only necessary permissions
   - Explain why each permission is needed
   - Graceful degradation if permission denied

---

## Implementation Phases

### Phase 1: MVP (3-4 months)
**Goal**: Launch with core features for all 3 user types

#### Month 1: Foundation
- ✅ Project setup (React Native + Expo)
- ✅ Authentication (JWT + Biometric)
- ✅ Offline database setup (WatermelonDB)
- ✅ API integration layer
- ✅ Basic UI components library

#### Month 2: Attendee App
- ✅ My Tickets screen (with QR codes)
- ✅ Event Discovery (search + browse)
- ✅ Event Details & Registration
- ✅ Payment integration (Stripe)
- ✅ Push notifications
- ✅ Apple Wallet / Google Pay integration

#### Month 3: Organizer + Admin Apps
- ✅ Organizer: Event Dashboard
- ✅ Organizer: Check-In Scanner (with offline mode)
- ✅ Organizer: Attendee List
- ✅ Organizer: Quick Communication
- ✅ Admin: Ticket Scanner
- ✅ Admin: Platform Dashboard
- ✅ Admin: Quick Actions

#### Month 4: Testing + Launch
- ✅ Beta testing with 10 organizers
- ✅ Bug fixes and performance optimization
- ✅ App Store submissions (iOS + Android)
- ✅ Launch marketing

**MVP Features Included**:
- ✅ Admin: Scan + Monitor + Quick Actions
- ✅ Organizer: Dashboard + Check-In + Attendees + Messaging
- ✅ Attendee: Tickets + Discovery + Registration

**What's NOT in MVP**:
- ❌ Badge printing (add in Phase 2)
- ❌ On-site sales (add in Phase 2)
- ❌ Event Experience Hub (add in Phase 3)
- ❌ Advanced analytics (desktop remains primary)
- ❌ Event creation (desktop remains primary)

---

### Phase 2: Enhanced Features (2-3 months post-MVP)

#### Add to Admin App:
- Badge printing integration
- Live Event Monitor (drill-down analytics)
- Advanced attendee search filters

#### Add to Organizer App:
- On-site ticket sales (with card reader)
- Badge printing
- Ticket Sales detailed charts
- Event editing (basic fields)

#### Add to Attendee App:
- Event Experience Hub:
  - Digital badge
  - Event agenda
  - Speakers directory
  - Networking features
- Social features (attendee chat)
- Event reviews and ratings

**Timeline**: 2-3 months after MVP launch

---

### Phase 3: Advanced Features (Ongoing)

#### AI-Powered Features:
- Smart event recommendations (ML-based)
- Fraud detection (duplicate tickets, suspicious patterns)
- Predictive analytics (attendance forecasting)

#### Social & Networking:
- Attendee matching (find people with similar interests)
- Direct messaging between attendees
- Post-event networking

#### Organizer Advanced Tools:
- Live polls during events
- Q&A sessions
- Session feedback collection
- Engagement analytics

**Timeline**: 6+ months post-MVP (based on user feedback)

---

## Success Metrics

### Admin App KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Scan Speed** | 10-15 tickets/minute | Average time per scan |
| **Offline Reliability** | 99.9% uptime | Successful offline scans / total scans |
| **Response Time** | Dashboard loads <2s | Time to interactive |
| **Adoption Rate** | 80% of admins use mobile | Monthly active users / total admins |

---

### Organizer App KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Check-In Speed** | 10-15 attendees/minute | Average time per check-in |
| **Mobile Usage** | 60% of check-ins via mobile | Mobile check-ins / total check-ins |
| **Communication Reach** | 90% message delivery | Messages delivered / sent |
| **Adoption Rate** | 70% of organizers use mobile | Monthly active organizers / total |

---

### Attendee App KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Ticket Access Time** | <3 seconds from app open | Time to QR code display |
| **Conversion Rate** | 15% discovery → registration | Registrations / event views |
| **Retention Rate** | 40% monthly active users | MAU / total downloads |
| **App Store Rating** | 4.5+ stars | iOS + Android average |
| **Offline Ticket Access** | 100% availability | Tickets accessed offline / total |

---

### Platform-Wide KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Mobile vs. Desktop** | 40% of transactions on mobile | Mobile transactions / total |
| **App Downloads** | 10,000 in first 6 months | Total downloads (iOS + Android) |
| **Push Notification CTR** | 20% click-through rate | Clicks / sent notifications |
| **Crash-Free Rate** | 99%+ | Crash-free sessions |

---

## Conclusion

### What Makes This Strategy Successful

1. **Research-Driven**: Based on analysis of Eventbrite, Cvent, RSVPify, and top event platforms
2. **Role-Specific**: 3 separate apps focused on each user's primary needs
3. **Mobile-First**: Prioritizes speed, offline access, and simplicity
4. **Realistic Scope**: 77-81% reduction in features vs. desktop (focus on essentials)
5. **Proven Patterns**: QR scanning, offline mode, real-time sync (industry standards)

### Critical Success Factors

✅ **Offline Mode**: Must work without internet (non-negotiable)
✅ **Scan Speed**: 10-15 tickets/minute (industry benchmark)
✅ **Quick Access**: <3 seconds to primary action (tickets, scanning)
✅ **Role Focus**: Each app does 1 thing exceptionally well
✅ **Real-Time Sync**: Multi-device coordination for organizers

### Next Steps

1. **Validate with Users**: Show this spec to 5 admins, 5 organizers, 5 attendees
2. **Prioritize Features**: Rank features by user feedback
3. **Technical Feasibility**: Assess existing API readiness
4. **Design Mockups**: Create wireframes for MVP screens
5. **Begin Development**: Start with Attendee app (highest impact)

---

## Research Sources

- [Eventbrite Organizer App Features](https://www.eventbrite.com/organizer/features/organizer-check-in-app/)
- [Eventbrite Organizer App - iOS](https://apps.apple.com/us/app/eventbrite-organizer/id368260521)
- [Best Event Check-In Apps 2024 - Eventdex](https://www.eventdex.com/blog/5-best-event-check-in-apps-for-2023/)
- [Event Check-In Apps - vFairs](https://www.vfairs.com/blog/event-check-in/)
- [Best Event Ticket Apps 2025 - PassKit](https://passkit.com/blog/best-event-ticket-app/)
- [Event Ticketing Platform Features](https://www.eventsair.com/blog/best-event-ticketing-software)
- [Top Event Check-In Apps - Dreamcast](https://www.dreamcast.in/blog/event-check-in-apps/)

---

**Document Version**: 1.0
**Last Updated**: January 11, 2026
**Author**: EventKnit Product Team
**Status**: Ready for Review
