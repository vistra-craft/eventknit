# EventKnit Unified Dashboard — Full Audit & Merge Proposal

> **Goal:** Document everything in the current attendee and organizer dashboards (web + mobile), then propose how to merge them into a unified dual-purpose experience where every user can both attend and organize events.

> **Last Updated:** February 2026
> **Status:** Planning & Implementation Phase

---

## Document Navigation

- [PART 0: Industry Standards & Strategic Rationale](#part-0-industry-standards--strategic-rationale)
- [PART 1: Current State — Web](#part-1-current-state--web)
- [PART 2: Current State — Mobile](#part-2-current-state--mobile)
- [PART 3: Feature Comparison](#part-3-feature-comparison--what-each-dashboard-has)
- [PART 4: Proposed Merge — Mobile](#part-4-proposed-merge--mobile)
- [PART 5: Proposed Merge — Web](#part-5-proposed-merge--web-future-phase)
- [PART 6: Verification (Mobile)](#part-6-verification-mobile)
- [PART 7: Terminology Strategy](#part-7-terminology-strategy)
- [PART 8: Implementation Priorities & Timeline](#part-8-implementation-priorities--timeline)
- [PART 9: Testing & Quality Assurance](#part-9-testing--quality-assurance)
- [APPENDIX: Quick Reference](#appendix-quick-reference)

---

# PART 0: Industry Standards & Strategic Rationale

> **Why This Approach?** Understanding how leading platforms handle dual roles informs our design decisions and validates our strategy.

## Industry Research Summary

### Key Platforms Analyzed (2026)

| Platform | User Model | Key Insight |
|----------|-----------|-------------|
| **Eventbrite** | Organizers manage events, attendees browse | Separate dashboards, team-based permissions |
| **Meetup** | Members → Organizers transition | **75% of organizers started as members** |
| **Ticket Tailor** | Event Creators | Marketing term: "Event Creator" |
| **Universe** | Organizers + Hosts | "Organizer" for account, "Host" for events |

### Critical Industry Trends (2026)

1. **Seamless Role Transitions**
   - Modern platforms make switching from attendee to organizer **effortless**
   - Meetup's 75% stat proves users want both capabilities
   - No platform forces users to "pick a side"

2. **Unified Navigation**
   - Users expect one account, multiple capabilities
   - Context switching should be **instant** (no logout/login)
   - Dashboard adapts to current context

3. **Progressive Disclosure**
   - Attendee features are always visible
   - Organizer features appear when needed
   - No overwhelming "choose your role" screens

4. **Terminology Standards**
   - **"Organizer"** is universal (not "Merchant" or "Creator" in UI)
   - **"Attendee"** is standard (not "Participant" or "Member")
   - **"Event Creator"** used in marketing, not in-app
   - **"Host"** used for individual event management

**Sources:**
- [Eventbrite Multi-User Access](https://www.eventbrite.com/help/en-us/articles/710537/)
- [Meetup 2026 Roadmap](https://www.meetup.com/blog/2026-meetup-roadmap/)
- [How to Choose a Ticketing Platform in 2026](https://creators.tixr.com/post/how-to-choose-a-ticketing-platform)
- [Ticket Tailor vs Eventbrite](https://www.tickettailor.com/eventbrite-alternative)

## Strategic Rationale for Unified Dashboard

### Problem Statement

**Current State Issues:**
- ❌ Users must "switch roles" — feels like two separate accounts
- ❌ Organizers who want to attend events must switch back
- ❌ Discovery friction: attendees don't know they can organize
- ❌ Not aligned with industry standards (Meetup's 75% transition)

**User Journey Friction:**
```
Current: Attendee → "I want to organize" → Find role switcher → Switch role → Lose attendee context
Desired: Attendee → "Create Event" button → Instant organizer mode → Keep attendee access
```

### Solution Benefits

**For Users:**
✅ **Single unified account** — no mental model of "two different users"
✅ **Instant context switching** — browse events while managing your own
✅ **Progressive disclosure** — organizer features appear when you create an event
✅ **Familiar patterns** — matches Eventbrite, Meetup, etc.

**For Business:**
✅ **Increased organizer conversion** — easier to start organizing
✅ **Better retention** — users stay engaged in both roles
✅ **Simplified onboarding** — one dashboard to learn
✅ **Competitive advantage** — matches industry leaders

**For Development:**
✅ **Easier maintenance** — one codebase to update
✅ **Better UX consistency** — shared components
✅ **Simpler state management** — no role-based routing complexity

### Design Principles

**1. Context Over Role**
- Don't ask "What role are you?"
- Ask "What are you trying to do right now?"

**2. Additive, Not Destructive**
- Creating an event adds organizer features
- Doesn't remove attendee features

**3. Spatial Clarity**
- Clear visual distinction between "Events I'm Attending" and "Events I'm Hosting"
- No ambiguity about which context you're in

**4. Industry Alignment**
- Use terminology users already know from Eventbrite/Meetup
- Follow established UX patterns

---

# PART 1: CURRENT STATE — WEB

## 1A. Web Attendee Dashboard (UserLayout)

**Layout:** `client/src/layouts/UserLayout.tsx`
**Sidebar/Nav:** Top navbar (`DashboardNavbar.tsx`) with dropdown (My Events, My Tickets, Saved, Profile)
**Routes:** `client/src/routes/userRoutes.tsx` — 32+ routes under `/user/*`
**Auth:** Requires authentication, role ATTENDEE or any authenticated user

### Pages Inventory (33 total, 31 active)

| # | Page | Route | File | Description |
|---|------|-------|------|-------------|
| 1 | **Dashboard Home** | `/user/dashboard` | `DashboardHome.tsx` | Main view — registered events list, filter (All/Upcoming/Completed), download ticket, share event |
| 2 | **My Event Detail** | `/user/event/:id` | `DashboardMyEvent.tsx` | Full event view with navigation to speakers, agenda, exhibitors, sponsors, attendees, badge |
| 3 | **My Tickets** | `/user/tickets` | `MyTickets.tsx` | All tickets with status filters (All/Upcoming/Past), download PDF, share, QR code |
| 4 | **Ticket View** | `/user/tickets/:registrationId` | `TicketViewPage.tsx` | Single ticket detail — QR code, backup code, download PDF, online link (if applicable) |
| 5 | **Ticket Transfer** | `/user/ticket-transfer` | `TicketTransfer.tsx` | Transfer tickets via email, optional message, transfer history, cancel pending |
| 6 | **Ticket Resale** | `/user/ticket-resale` | `TicketResale.tsx` | Secondary marketplace — browse listings, create own listing, purchase resale tickets |
| 7 | **Saved Events** | `/user/saved` | `SavedEvents.tsx` | Bookmarked events — event cards with remove/navigate actions |
| 8 | **Event Collections** | `/user/collections` | `EventCollections.tsx` | Create/manage custom event playlists — My Collections + Public Collections tabs |
| 9 | **Advanced Search** | `/user/search` | `AdvancedSearch.tsx` | Multi-filter search (category, location, date, price, type), saved searches |
| 10 | **Recommendations** | `/user/recommendations` | `PersonalizedRecommendations.tsx` | AI-powered event recommendations based on history/interests |
| 11 | **Personal Feed** | `/user/feed` | `PersonalEventFeed.tsx` | Curated event feed with relevance scoring, dismiss/customize |
| 12 | **Notifications** | `/user/notifications` | `NotificationsCenter.tsx` | All notifications — filter by type/priority, mark read/unread, delete |
| 13 | **Notification Prefs** | `/user/notification-preferences` | `NotificationPreferencesPage.tsx` | Channel toggles (Email/SMS/Push/In-app), category toggles, quiet hours |
| 14 | **Event Subscriptions** | `/user/subscriptions` | `EventUpdatesSubscription.tsx` | Subscribe to event updates for non-registered events, choose channels |
| 15 | **Personal Analytics** | `/user/analytics` | `PersonalAnalytics.tsx` | Attendance stats — registrations by category, trends, spending, engagement |
| 16 | **Direct Messages** | `/user/messages` | `DirectMessaging.tsx` | DM system — inbox/sent, compose, threads, recipient by email/ID |
| 17 | **Social Networking** | `/user/social` | `SocialNetworking.tsx` | Profile, followers, following — follow/unfollow users |
| 18 | **Attendee Discovery** | `/user/networking` | `AttendeeDiscovery.tsx` | Networking (placeholder — coming soon) |
| 19 | **Interest Management** | `/user/interests` | `InterestManagement.tsx` | Define interests with categories/subcategories/weights for recommendations |
| 20 | **Calendar Integration** | `/user/calendar` | `EventCalendarIntegration.tsx` | Sync to Google/Apple/Outlook calendars, iCal export, reminders |
| 21 | **Digital Wallet** | `/user/wallet` | `DigitalWallet.tsx` | Apple Wallet / Google Pay integration, auto-add, backup/recovery |
| 22 | **Payment Plans** | `/user/payment-plans` | `PaymentPlans.tsx` | Installment payments — active/completed plans, pay installments |
| 23 | **Invoices** | `/user/invoices` | `Invoices.tsx` | Financial invoices — filter, download PDF, view HTML |
| 24 | **User Profile** | `/user/profile` | `UserProfilePage.tsx` | Edit personal info, avatar, password, account info, role switcher |
| 25 | **Speakers** | `/user/speakers` | `DashboardSpeakers.tsx` | Browse event speakers with profiles and session details |
| 26 | **Exhibitors** | `/user/exhibitors` | `DashboardExhibitors.tsx` | Browse exhibitors by sponsor tier, booth info, contact |
| 27 | **Exhibitor Detail** | `/user/exhibitors/:id` | `ExhibitorDetails.tsx` | Full exhibitor profile — products, representatives, messaging |
| 28 | **Sponsors** | `/user/sponsors` | `DashboardSponsors.tsx` | Sponsors grouped by tier (Platinum/Gold/Silver/Bronze) |
| 29 | **Agenda** | `/user/agenda` | `DashboardAgenda.tsx` | Event schedule — timeline, session types, speakers, rooms |
| 30 | **My Badge** | `/user/my-badge` | `DashboardMyBadge.tsx` | Digital badge with QR code, backup code, download |
| 31 | **Attendees** | `/user/attendees` | `DashboardAttendees.tsx` | Other event attendees (placeholder) |
| 32 | **Abstracts/CFP** | *(commented out)* | `DashboardAbstracts.tsx` | Submit papers/abstracts, track status (pending/approved/rejected) |
| 33 | **Event Reviews** | *(commented out)* | `EventReviews.tsx` | Leave/view event reviews with star ratings, pros/cons |

### Feature Categories Summary

| Category | Pages | Key Capabilities |
|----------|-------|-----------------|
| **Dashboard & Events** | 2 | Registered events list, event detail view |
| **Tickets** | 4 | My tickets, individual view, transfer, resale marketplace |
| **Discovery** | 5 | Saved events, collections, advanced search, recommendations, feed |
| **Event Content** | 6 | Speakers, exhibitors, sponsors, agenda, badge, attendees |
| **Social** | 4 | DMs, social networking, attendee discovery, interests |
| **Notifications** | 3 | Center, preferences, event subscriptions |
| **Financial** | 3 | Payment plans, invoices, digital wallet |
| **Profile & Settings** | 1 | Profile edit, avatar, password, role switch |
| **Integration** | 1 | Calendar sync |
| **Analytics** | 1 | Personal attendance stats |

---

## 1B. Web Organizer Dashboard (OrganizerLayout)

**Layout:** `client/src/layouts/OrganizerLayout.tsx`
**Navigation:** Collapsible sidebar (`OrganizerSidebar.tsx`) + top header (`OrganizerHeader.tsx`)
**Routes:** `client/src/routes/organizerRoutes.tsx` — 40+ routes under `/organizer/*`
**Roles:** ORGANIZER, ORGANIZER_STAFF, ORGANIZER_TELLER, SUPERADMIN (tiered access)
**Subscription Tiers:** Basic (free), Standard (free), Premium ($10/mo)

### Sidebar Navigation Structure

```
MAIN
├── Dashboard                    → /organizer/dashboard
├── Events
│   ├── All Events               → /organizer/events
│   ├── Upcoming                 → /organizer/events/upcoming
│   ├── Past Events              → /organizer/events/past
│   ├── Cancelled Events         → /organizer/events/cancelled
│   ├── Create New               → /organizer/events/create
│   ├── Event Templates          → /organizer/events/templates
│   └── Event Drafts             → /organizer/events/drafts
├── Analytics
│   ├── Overview                 → /organizer/analytics
│   ├── Event Performance        → /organizer/analytics/events
│   ├── Attendee Insights        → /organizer/analytics/attendees
│   └── Revenue Reports          → /organizer/analytics/revenue
├── Marketing
│   └── Promo Codes              → /organizer/marketing/promo-codes
└── Finance
    ├── Financial Management     → /organizer/finance
    └── Payouts                  → /organizer/payouts

MANAGEMENT
├── Team
│   ├── Staff Management         → /organizer/team/staff
│   ├── Roles & Permissions
│   └── Team Calendar
├── Settings
│   ├── Profile                  → /organizer/settings/profile
│   ├── Notifications            → /organizer/settings/notifications
│   ├── Security                 → /organizer/settings/security
│   └── Appearance               → /organizer/settings/appearance
├── Subscription                 → /organizer/subscription
└── Verification/KYC             → /organizer/verification, /organizer/kyc
```

### Pages Inventory (36 total)

| # | Area | Page | Route | Description |
|---|------|------|-------|-------------|
| **DASHBOARDS** | | | | |
| 1 | Dashboard | **Main Dashboard** | `/organizer/dashboard` | Role-based routing — redirects to Enhanced, Staff, or Teller dashboard |
| 2 | Dashboard | **Enhanced Dashboard** | (Tier 2+) | Full analytics — recent events, performance insights, deadlines, health scores |
| 3 | Dashboard | **Staff Dashboard** | (ORGANIZER_STAFF) | Assigned events, today's events, upcoming events, performance metrics |
| 4 | Dashboard | **Teller Dashboard** | (ORGANIZER_TELLER) | Assigned events, QR scan statistics (today/week/total) |
| 5 | Dashboard | **Onboarding Wizard** | `/organizer/onboarding` | Multi-step setup — event preferences, process overview, draft saving |
| **EVENTS** | | | | |
| 6 | Events | **All Events** | `/organizer/events` | Search/filter all events by status, pagination (25/page) |
| 7 | Events | **Upcoming Events** | `/organizer/events/upcoming` | Future events with search/pagination |
| 8 | Events | **Past Events** | `/organizer/events/past` | Completed events with attendance stats and revenue |
| 9 | Events | **Cancelled Events** | `/organizer/events/cancelled` | Cancelled events with cancel reasons and refund status |
| 10 | Events | **Create Event** | `/organizer/events/create` | 8-step event creation wizard (basic, date, media, tickets, agenda, registration, social, review) |
| 11 | Events | **Standalone Create** | `/organizer/events/create-standalone` | Same wizard but minimal header — for first-time organizers |
| 12 | Events | **Event Management** | `/organizer/event/:eventId` | Per-event hub — tabs: Overview, Registrations, Communication, Analytics, Team, Settings |
| 13 | Events | **Event Templates** | `/organizer/events/templates` | Pre-built templates (attendee, speaker, exhibitor, sponsor) |
| 14 | Events | **Templates Management** | `/organizer/events/templates-management` | Create/manage custom templates — My Templates + Public Templates |
| 15 | Events | **Event Drafts** | `/organizer/events/drafts` | Draft management — create, edit, schedule, publish, delete |
| 16 | Events | **Event Collaboration** | `/organizer/event/:eventId/collaboration` | Manage collaborators — invite, permissions, activity log |
| **ANALYTICS** | | | | |
| 17 | Analytics | **Overview** | `/organizer/analytics` | High-level metrics — events, attendees, revenue; time range filters; multiple chart types |
| 18 | Analytics | **Event Performance** | `/organizer/analytics/events` | Per-event metrics — attendance rate, satisfaction, engagement, revenue |
| 19 | Analytics | **Attendee Insights** | `/organizer/analytics/attendees` | Demographics — age groups, locations, industries, experience levels |
| 20 | Analytics | **Revenue Reports** | `/organizer/analytics/revenue` | Financial — total/net revenue, payment methods, refunds, growth |
| 21 | Analytics | **Test Analytics** | `/organizer/analytics/test` | Dev/testing page for chart components |
| **ATTENDEE MANAGEMENT** | | | | |
| 22 | Attendees | **Segmentation** | `/organizer/attendees/segmentation` | Create segments with criteria, view members, send targeted messages |
| 23 | Attendees | **Tags** | `/organizer/attendees/tags` | Create color-coded tags, assign to attendees, export tagged groups |
| 24 | Attendees | **Communication** | `/organizer/attendees/communication` | Send messages via segments/tags/events, communication history |
| **TEAM** | | | | |
| 25 | Team | **Staff Management** | `/organizer/team/staff` | Add/edit/delete staff, search/filter, performance analytics, utilization |
| **MARKETING** | | | | |
| 26 | Marketing | **Promo Codes** | `/organizer/marketing/promo-codes` | Create promo codes — percentage/fixed, usage limits, event-specific |
| **FINANCE** | | | | |
| 27 | Finance | **Financial Management** | *(commented out)* | Expenses, financial goals, P&L, tax summary |
| 28 | Finance | **Payout Management** | *(commented out)* | Bank details, auto payout config, disbursement history |
| 29 | Finance | **Affiliate Program** | *(commented out)* | Referral programs — commission setup, tracking |
| **PRICING** | | | | |
| 30 | Pricing | **Dynamic Pricing** | *(via event mgmt)* | Time/demand-based pricing rules, group discounts, loyalty pricing |
| 31 | Pricing | **Advanced Tickets** | *(via event mgmt)* | Packages, bundles, donations, reserved seating |
| **SETTINGS** | | | | |
| 32 | Settings | **Organizer Settings** | `/organizer/settings` | Profile, Notifications, Security, Appearance — 4 tabs |
| **VENUE** | | | | |
| 33 | Venue | **Venue Management** | `/organizer/venues` | Create/edit/delete reusable venues (name, address, capacity, type, amenities) |
| **COMPLIANCE** | | | | |
| 34 | Compliance | **Identity Verification** | `/organizer/verification` | Individual/business verification with document upload |
| 35 | Compliance | **KYC Verification** | `/organizer/kyc` | Multi-step KYC — entity type, directors, documents, review |
| **BILLING** | | | | |
| 36 | Billing | **Subscription** | `/organizer/subscription` | Manage tier (Basic/Standard/Premium), upgrade, cancel, billing email |

### Role-Based Access

| Feature Area | ORGANIZER | ORGANIZER_STAFF | ORGANIZER_TELLER | SUPERADMIN |
|-------------|-----------|-----------------|-------------------|------------|
| Enhanced Dashboard | Tier 2+ | - | - | Yes |
| Staff Dashboard | - | Yes | - | - |
| Teller Dashboard | - | - | Yes | - |
| Event CRUD | Yes | Yes | - | Yes |
| Analytics | Yes | Yes | - | Yes |
| Team Management | Yes | - | - | Yes |
| Finance/Payouts | Yes | - | - | Yes |
| Marketing | Yes | Yes | - | Yes |
| KYC/Verification | Yes | - | - | Yes |
| Subscription | Yes | - | - | Yes |

---

## 1C. How Web Dashboards Are Currently Separated

```
                        ┌──────────────────────┐
                        │     EventKnit Web     │
                        └──────────┬───────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
     ┌────────▼────────┐  ┌───────▼────────┐  ┌────────▼────────┐
     │   UserLayout     │  │ OrganizerLayout│  │   AdminLayout   │
     │   /user/*        │  │ /organizer/*   │  │   /admin/*      │
     │   Top navbar     │  │ Sidebar + Hdr  │  │   Sidebar       │
     │   33 pages       │  │ 36+ pages      │  │   60+ pages     │
     └─────────────────┘  └────────────────┘  └─────────────────┘
```

**Current role switching on web:**
- `RoleViewContext` — temporary view switch (stores in localStorage, doesn't change backend role)
- `RoleSwitcher` component on UserProfile page — permanent role change via backend API
- Profile dropdown has "Switch to Organizer" / "Switch to Attendee" option
- Complete page reload and layout swap when switching

---

# PART 2: CURRENT STATE — MOBILE

## 2A. Mobile Attendee Dashboard (AppLayout)

**Layout:** `lib/screens/layouts/app_layout.dart`
**Pattern:** `PageView` + `NavigationBar` (4 tabs)
**Entry:** Role ATTENDEE → `Get.offAllNamed('/home')`

### Tab Structure

```
Bottom Navigation: 4 tabs
┌────────┬────────┬────────┬─────────┐
│  Home  │ Saved  │Tickets │ Profile │
└────────┴────────┴────────┴─────────┘
```

### Screen-by-Screen Inventory

#### Tab 1: Home (`DashboardScreen`)
**File:** `lib/presentation/attendee/screens/dashboard_screen.dart` (870 lines)
**Controllers:** AuthController, EventsController, TicketsController, SavedEventsController

| Section | Lines | Content |
|---------|-------|---------|
| Welcome Header | ~130-190 | User avatar, "Hello, {name}", greeting message |
| Quick Stats | ~193-250 | 3 cards: Tickets count, Saved count, Upcoming count |
| Quick Actions | ~252-333 | 4 buttons: Scan Ticket (TODO), View Tickets, Discover Events, Saved Events |
| Upcoming Events | ~337-436 | First 3 upcoming events as cards (image, title, date, price) |
| Recent Activity | ~440-500 | Last 5 purchased tickets as activity items |

#### Tab 2: Saved (`SavedEventsScreen`)
**File:** `lib/screens/saved_events_screen.dart`
- Saved events list with infinite scroll
- Pull-to-refresh
- Filter chips
- AuthGuard protection
- Shimmer loading

#### Tab 3: Tickets (`TicketsScreen`)
**File:** `lib/screens/tickets_screen.dart`
- Tab-based: Upcoming vs Past
- QR code display via `qr_flutter`
- Ticket details with status
- Refresh indicator

#### Tab 4: Profile (`ProfileScreen`)
**File:** `lib/screens/profile_screen.dart`
- Profile header (avatar, name, info)
- Account: Edit Profile, Change Password, Notifications, Payment Methods
- Preferences: Language, Dark Mode, Location
- About, Help, Support
- Logout

### Additional Attendee Screens (pushed on top of layout)

| Screen | File | Purpose |
|--------|------|---------|
| **Search** | `attendee/screens/search_screen.dart` | Full-page search with filters, trending, recent |
| **Event Details** | `screens/event_details_screen.dart` | Event hero, description, attendee count, ticket purchase |
| **Checkout** | `attendee/screens/checkout_screen.dart` | Cart, Paystack WebView, attendee info |
| **Registration** | `attendee/screens/registration_screen.dart` | Multi-step form, primary + additional attendees |
| **Payment Success** | `attendee/screens/payment_success_screen.dart` | Confirmation, QR ticket, download/share |
| **Notifications** | `attendee/screens/notifications_screen.dart` | Notification inbox, mark read |
| **Notification Prefs** | `attendee/screens/notification_preferences_screen.dart` | Toggle preferences |

### Controllers (Attendee)
- `AuthController` — login/signup/logout/profile
- `EventsController` — discovery, featured, search
- `TicketsController` — user tickets, upcoming/past
- `SavedEventsController` — bookmarks
- `BottomNavigationController` — tab state
- `NotificationsController` — push notifications

---

## 2B. Mobile Organizer Dashboard (OrganizerLayout)

**Layout:** `lib/presentation/organizer/screens/organizer_layout.dart`
**Pattern:** `IndexedStack` + `NavigationBar` (5 tabs)
**Entry:** Role ORGANIZER → `Get.offAllNamed('/organizer')`

### Tab Structure

```
Bottom Navigation: 5 tabs
┌───────────┬──────────┬──────────┬──────────┬──────┐
│ Dashboard │ Check-In │Attendees │ Messages │ More │
└───────────┴──────────┴──────────┴──────────┴──────┘
```

**Critical design detail:** All organizer screens operate on ONE selected event. The `OrganizerDashboardController` has a `selectedEventId` that all screens read from. The dashboard has an event selector dropdown at the top.

### Screen-by-Screen Inventory

#### Tab 1: Dashboard (`OrganizerDashboardScreen`)
**File:** `lib/presentation/organizer/screens/organizer_dashboard_screen.dart`
**Controller:** OrganizerDashboardController

| Section | Content |
|---------|---------|
| Event Selector | Dropdown to pick which event to manage |
| Key Metrics | 4 cards: Tickets Sold, Revenue ($), Checked In, Pending |
| Check-In Progress | Visual progress bar (% checked in) |
| Quick Actions | Start Check-In, Send Update |
| Recent Activity | Last 5 activities with type icons |

#### Tab 2: Check-In (`CheckInScannerScreen`)
**File:** `lib/presentation/organizer/screens/check_in_scanner_screen.dart`
**Controller:** CheckInScannerController

- QR code scanner via `mobile_scanner` package
- Entry (green) vs Exit (indigo) mode toggle
- Offline scan support with local database caching
- Scan result display (attendee name, ticket type, status)
- 1.5s debounce per scan
- Camera lifecycle management

#### Tab 3: Attendees (`AttendeesScreen`)
**File:** `lib/presentation/organizer/screens/attendees_screen.dart`
**Controller:** AttendeesController

- Filter tabs: All | Checked In | Pending
- Search by name/email
- Attendee list with status badges
- Quick check-in from list (without scanner)
- Attendee detail view with ticket info

#### Tab 4: Messages (`MessagesScreen`)
**File:** `lib/presentation/organizer/screens/messages_screen.dart`
**Controller:** MessagesController

- Quick alert templates: Event Starting (15m), Gate/Location Change, Event Delayed, Emergency
- Custom message composer
- Message scheduling
- Delivery status tracking

#### Tab 5: More (`OrganizerMoreScreen`)
**File:** `lib/presentation/organizer/screens/organizer_layout.dart` (lines 73-273)

| Section | Items |
|---------|-------|
| EVENT MANAGEMENT | Ticket Sales, Event Details, Staff Management |
| NOTIFICATIONS | Notifications |
| ACCOUNT | Profile, Settings |
| SUPPORT | Help & Support, About |
| | Logout button |

### Additional Organizer Screens (pushed on top)

| Screen | File | Purpose |
|--------|------|---------|
| **Ticket Sales** | `organizer/screens/ticket_sales_screen.dart` | Revenue cards, sales trend chart, tickets by type, recent orders |
| **Offline Mode** | `organizer/screens/offline_mode_screen.dart` | Connection status, pending scans queue, sync history |

### Controllers (Organizer)
- `OrganizerLayoutController` — tab navigation state
- `OrganizerDashboardController` — dashboard data, event selection, organizer events list
- `CheckInScannerController` — QR scan logic, offline caching
- `AttendeesController` — attendee list, filtering, search
- `MessagesController` — message sending, history
- `TicketSalesController` — revenue analytics

---

## 2C. Mobile Admin Dashboard (AdminLayout) — Stays Separate

**Layout:** `lib/presentation/admin/screens/admin_layout.dart`
**Tabs:** Dashboard | Events | Scanner | Alerts | Profile (5 tabs)
**13 screens, 12 controllers** — platform management features

This stays unchanged. Admin is a different concern (platform operations, event approval, user management). It is NOT being merged.

---

## 2D. How Mobile Dashboards Are Currently Separated

```
Splash Screen
     │
     ├── role == SUPERADMIN/ADMIN_STAFF
     │         → AdminLayout (5 tabs)
     │
     ├── role == ORGANIZER
     │         → OrganizerLayout (5 tabs)
     │         [LOCKED INTO organizer features only]
     │         [Cannot discover/attend events]
     │
     └── role == ATTENDEE
               → AppLayout (4 tabs)
               [LOCKED INTO attendee features only]
               [Cannot create/manage events]
```

**The problem:** An organizer who wants to attend events must switch roles entirely. An attendee who wants to create an event must switch roles entirely. There's no unified experience.

---

# PART 3: FEATURE COMPARISON — WHAT EACH DASHBOARD HAS

## Mobile Feature Matrix

| Feature | Attendee (AppLayout) | Organizer (OrganizerLayout) | Overlap |
|---------|---------------------|-----------------------------|---------|
| **Event Discovery** | Full (search, featured, trending) | None | Attendee only |
| **Saved/Bookmarked Events** | Dedicated tab | None | Attendee only |
| **View Purchased Tickets** | Dedicated tab (QR codes) | None | Attendee only |
| **User Profile/Settings** | Dedicated tab | Via "More" menu | Both |
| **Notifications** | Push + inbox | Via "More" menu | Both |
| **Event Metrics Dashboard** | None | Dedicated tab (per-event) | Organizer only |
| **QR Check-In Scanner** | None | Dedicated tab | Organizer only |
| **Attendee Management** | None | Dedicated tab (list/filter/search) | Organizer only |
| **Messaging to Attendees** | None | Dedicated tab (alerts/custom) | Organizer only |
| **Ticket Sales Analytics** | None | Via "More" menu | Organizer only |
| **Offline Check-In** | None | With sync queue | Organizer only |
| **Event Creation** | None | None (web only) | Neither |
| **Checkout/Payment** | Paystack WebView | None | Attendee only |

## Web Feature Matrix (Summary)

| Feature Area | Attendee (UserLayout) | Organizer (OrganizerLayout) | Overlap |
|-------------|----------------------|-----------------------------|---------|
| **Event Content** | 6 pages (speakers, agenda, etc.) | (creates content, not views) | Different purpose |
| **Tickets** | 4 pages (view, transfer, resale) | (manages registrations) | Different purpose |
| **Discovery** | 5 pages (search, collections, feed) | None | Attendee only |
| **Social/Networking** | 4 pages | None | Attendee only |
| **Analytics** | 1 page (personal) | 4 pages (event/revenue/attendee) | Different purpose |
| **Notifications** | 3 pages | Settings only | Minimal overlap |
| **Financial** | 3 pages (invoices, wallet, plans) | 3+ pages (payouts, revenue) | Different purpose |
| **Profile** | 1 page | 4-tab settings | Both |
| **Event Management** | None | 11 pages (CRUD, templates, drafts) | Organizer only |
| **Team/Staff** | None | 1 page (staff + analytics) | Organizer only |
| **Marketing** | None | 1 page (promo codes) | Organizer only |
| **Compliance** | None | 2 pages (verification, KYC) | Organizer only |
| **Billing** | None | 1 page (subscription tiers) | Organizer only |

---

# PART 4: PROPOSED MERGE — MOBILE

## Approach: Unified Dual Dashboard

Replace `AppLayout` (attendee) and `OrganizerLayout` (organizer) with a single `UnifiedLayout` that serves both roles. Admin stays separate.

### New Navigation

```
BEFORE:
  ATTENDEE  → AppLayout:       Home | Saved | Tickets | Profile
  ORGANIZER → OrganizerLayout: Dashboard | Check-In | Attendees | Messages | More

AFTER:
  ALL USERS → UnifiedLayout:   Home | My Events | +Create | Tickets | Profile
  ADMIN     → AdminLayout:     (unchanged)
```

### Tab Design

| Tab | Icon | Purpose | Content |
|-----|------|---------|---------|
| **Home** | `dashboard` | Discover events | Modified `DashboardScreen` — role-aware stats/actions + existing discovery |
| **My Events** | `event_note` | Dual hub | 3 sub-tabs: **Attending** / **Organizing** / **Saved** |
| **+ Create** | `add_circle` | Create event | Event creation entry point (or "Become an Organizer" upgrade for attendees) |
| **Tickets** | `confirmation_number` | Your tickets | Reuses existing `TicketsScreen` unchanged |
| **Profile** | `person` | Account | Reuses existing `ProfileScreen` unchanged |

### Where Organizer Tools Live

Organizer features are NOT top-level tabs anymore. They're accessed **per-event** through "My Events > Organizing > tap event":

```
My Events tab
├── Attending (events you're going to)
├── Organizing (events you've created)
│   └── Tap event → EventManagementScreen
│       ├── Overview (metrics, check-in progress)
│       ├── Check-In (QR scanner)
│       ├── Attendees (list, filter, search)
│       ├── Messages (alerts, custom messages)
│       └── Sales (revenue, orders)
└── Saved (bookmarked events)
```

This makes sense because ALL organizer screens are event-specific (they all operate on `OrganizerDashboardController.selectedEventId`). Having them as top-level tabs was wasteful — you always had to select an event first anyway.

---

### Implementation Phases

#### Phase 1: Unified Layout Shell

**NEW:** `lib/screens/layouts/unified_layout.dart`
- 5-tab `NavigationBar` + `PageView` with `NeverScrollableScrollPhysics`
- Center tab (+Create) styled distinctly (primary color, elevated)
- Children: `[DashboardScreen, MyEventsScreen, CreateEventScreen, TicketsScreen, ProfileScreen]`

**MODIFY:** `lib/main.dart` — update routes:
- `/home` → `UnifiedLayout(startingIndex: 0)`
- `/my-events` → `UnifiedLayout(startingIndex: 1)`
- `/create-event` → `UnifiedLayout(startingIndex: 2)`
- `/tickets` → `UnifiedLayout(startingIndex: 3)`
- `/profile` → `UnifiedLayout(startingIndex: 4)`
- `/saved` → redirect to `/my-events` (backward compat)
- `/organizer` → redirect to `/my-events` (backward compat)

**MODIFY:** `lib/screens/splash_screen.dart` — simplified routing:
- Admin roles → `/admin`
- All others → `/home` (no more ORGANIZER vs ATTENDEE branch)

**MODIFY:** `lib/presentation/auth/screens/login_screen.dart` + `signup_screen.dart` — same simplified routing

#### Phase 2: Home Screen — Role-Aware Modifications

**MODIFY:** `lib/presentation/attendee/screens/dashboard_screen.dart`

The current Home screen is attendee-focused. Changes needed:

**Quick Stats (lines 193-250):**
- Keep: Tickets, Saved, Upcoming (all users)
- Add for organizers: "Organizing" card (count of active organized events)
- Use `Wrap` for dynamic card count (3 for attendees, 4 for organizers)

**Quick Actions (lines 252-333):**
- Keep: Discover Events, View Tickets
- Change: "Saved Events" → "My Events" (navigates to tab index 1)
- Change: "Scan Ticket" (TODO) → "Create Event" (navigates to tab index 2)

**No changes needed:** Welcome Header, Upcoming Events section, Recent Activity section, Event Cards

#### Phase 3: My Events Screen (the dual hub)

**NEW:** `lib/screens/my_events_screen.dart`

3 sub-tabs using `TabBar` + `TabBarView`:

| Sub-Tab | Data Source | Content |
|---------|-------------|---------|
| **Attending** | `GET /events/user/registered` (existing endpoint) | Events user is registered for — cards with status |
| **Organizing** | `OrganizerDashboardController.organizerEvents` (existing) | Created events — cards with "X sold / Y checked in" stats |
| **Saved** | `SavedEventsController` (existing) | Reuses `SavedEventsScreen` logic directly |

**NEW:** `lib/controllers/my_events_controller.dart`
- Manages "Attending" tab data via existing API endpoint
- "Organizing" reuses `OrganizerDashboardController`
- "Saved" reuses `SavedEventsController`

**MODIFY:** `lib/core/bindings/app_bindings.dart` — register `MyEventsController`

#### Phase 4: Event Management Screen

**NEW:** `lib/presentation/organizer/screens/event_management_screen.dart`

Full-screen page (pushed on top of UnifiedLayout) with per-event organizer tools:

| Tab | Reuses Existing Screen | Content |
|-----|----------------------|---------|
| Overview | `OrganizerDashboardScreen` | Metrics, check-in progress, activity |
| Check-In | `CheckInScannerScreen` | QR scanner, offline support |
| Attendees | `AttendeesScreen` | List, filter, search, quick check-in |
| Messages | `MessagesScreen` | Quick alerts, custom messages |
| Sales | `TicketSalesScreen` | Revenue, orders, ticket types |

Pre-selects event in `OrganizerDashboardController` on init — all existing organizer screens work without modification.

**MODIFY:** `lib/main.dart` — add `/event-management` route

#### Phase 5: Create Event Tab

**NEW:** `lib/screens/create_event_screen.dart`

Role-dependent behavior:
- **ORGANIZER role:** Event creation interface (web redirect initially, mobile form later)
- **ATTENDEE role:** "Become an Organizer" upgrade prompt → calls `POST /user/role-switch/become-organizer` (existing backend API)

**MODIFY:** `lib/api/endpoints.dart` — add `userBecomeAttendee` endpoint
**MODIFY:** `lib/domain/repositories/auth_repository.dart` — add `becomeOrganizer` method
**MODIFY:** `lib/data/repositories/auth_repository_impl.dart` — implement API call

#### Phase 6: Admin Fix

**MODIFY:** `lib/presentation/admin/screens/admin_layout.dart` (line 233)
- "Switch to User Mode" currently goes to `PublicLayout` (wrong)
- Change to `Get.offAllNamed('/home')` → goes to UnifiedLayout

#### Phase 7: Cleanup

- Remove `/organizer` as standalone entry point (redirect to `/home`)
- Remove organizer-specific route aliases
- `OrganizerLayout` stays in codebase (its child screens are reused) but isn't navigated to directly

---

### Files Summary (Mobile)

| Action | File | Description |
|--------|------|-------------|
| **NEW** | `screens/layouts/unified_layout.dart` | 5-tab unified layout replacing AppLayout + OrganizerLayout |
| **NEW** | `screens/my_events_screen.dart` | Dual hub: Attending / Organizing / Saved sub-tabs |
| **NEW** | `controllers/my_events_controller.dart` | Manages "Attending" events data |
| **NEW** | `presentation/organizer/screens/event_management_screen.dart` | Per-event organizer tools (Overview, Check-In, Attendees, Messages, Sales) |
| **NEW** | `screens/create_event_screen.dart` | Event creation entry + ATTENDEE→ORGANIZER upgrade flow |
| **MODIFY** | `presentation/attendee/screens/dashboard_screen.dart` | Role-aware Quick Stats & Quick Actions for unified Home |
| **MODIFY** | `main.dart` | Update routes for unified layout |
| **MODIFY** | `screens/splash_screen.dart` | Route all non-admin users to unified layout |
| **MODIFY** | `core/bindings/app_bindings.dart` | Register MyEventsController |
| **MODIFY** | `domain/repositories/auth_repository.dart` | Add becomeOrganizer method |
| **MODIFY** | `data/repositories/auth_repository_impl.dart` | Implement becomeOrganizer API call |
| **MODIFY** | `api/endpoints.dart` | Add userBecomeAttendee endpoint |
| **MODIFY** | `presentation/admin/screens/admin_layout.dart` | Fix "Switch to User Mode" → UnifiedLayout |
| **MODIFY** | `presentation/auth/screens/login_screen.dart` | Simplify post-auth routing |
| **MODIFY** | `presentation/auth/screens/signup_screen.dart` | Simplify post-auth routing |

**Reused without modification:**
- `OrganizerDashboardScreen` → EventManagementScreen > Overview tab
- `CheckInScannerScreen` → EventManagementScreen > Check-In tab
- `AttendeesScreen` → EventManagementScreen > Attendees tab
- `MessagesScreen` → EventManagementScreen > Messages tab
- `TicketSalesScreen` → EventManagementScreen > Sales tab
- `TicketsScreen` → Tickets tab (QR codes, upcoming/past)
- `ProfileScreen` → Profile tab (settings, prefs)
- `SavedEventsScreen` logic → MyEventsScreen > Saved sub-tab
- `AdminLayout` → unchanged

---

# PART 5: PROPOSED MERGE — WEB (Future Phase)

> The web merge is a larger effort due to the scale (33 attendee pages + 36+ organizer pages). This section outlines the approach; implementation comes after mobile is done.

## Approach: Unified Layout with Mode Toggle

Instead of separate `/user/*` and `/organizer/*` URL spaces with different layouts, create a single unified layout with a mode toggle:

```
BEFORE:
  /user/*       → UserLayout (top navbar, 33 pages)
  /organizer/*  → OrganizerLayout (sidebar, 36+ pages)

AFTER:
  /dashboard/*  → UnifiedWebLayout
                  ├── Mode: "Attending" → top navbar style, attendee pages
                  └── Mode: "Organizing" → sidebar style, organizer pages
                  Toggle in header — instant switch, no page reload
```

### Key Design Decisions (Web)

1. **Keep both layout styles but under one roof** — attendee content works best with a top navbar (browsing), organizer content works best with a sidebar (deep management). The unified layout adapts its chrome based on which mode you're in.

2. **Shared header** — Logo, search, notifications, profile dropdown always present. Mode toggle (Attending <-> Organizing) prominently visible.

3. **Shared pages stay shared** — Profile, notifications, settings are accessible in both modes without duplication.

4. **URL structure** — Flatten to `/dashboard/events`, `/dashboard/tickets`, `/dashboard/analytics` etc. The URL doesn't encode the role anymore.

5. **Role upgrade inline** — If an attendee clicks the "Organizing" toggle, show the same "Become an Organizer" prompt (existing backend API), then switch seamlessly.

### Web Pages That Stay Attendee-Specific
- Ticket Transfer, Ticket Resale, Digital Wallet, Payment Plans, Invoices
- Event content pages (speakers, agenda, exhibitors, sponsors, badge, attendees)
- Social/networking pages (DMs, social, discovery, interests)
- Collections, feed, recommendations, calendar integration

### Web Pages That Stay Organizer-Specific
- Event CRUD (create, edit, drafts, templates)
- Analytics suite (4 pages)
- Attendee management (segmentation, tags, communication)
- Team/staff management
- Marketing (promo codes)
- Finance (payouts, financial management)
- Venue management
- KYC/verification
- Subscription management

### Web Pages That Merge
- **Dashboard Home** (attendee) + **Enhanced Dashboard** (organizer) → single dashboard with both sections
- **Profile** → shared profile page accessible from both modes
- **Notifications** → shared notifications page

### Implementation Priority (Web)
The web merge is a **Phase 2** effort after mobile is proven. The mobile merge validates the UX pattern and user response before investing in the larger web refactor.

---

# PART 6: VERIFICATION (Mobile)

1. `flutter analyze` — no static analysis errors
2. Login as **ATTENDEE** → lands on unified layout → see Home, My Events, +Create, Tickets, Profile
3. Login as **ORGANIZER** → lands on SAME unified layout (not separate organizer layout)
4. My Events > **Attending** tab → shows events registered for
5. My Events > **Organizing** tab → shows created events with quick stats per event
6. My Events > **Saved** tab → shows saved/bookmarked events
7. Tap organized event → **EventManagementScreen** opens with Overview/Check-In/Attendees/Messages/Sales tabs
8. +Create tab → organizers see create flow, attendees see "Become an Organizer" prompt
9. Login as **ADMIN** → still lands on AdminLayout (unchanged)
10. Admin "Switch to User Mode" → navigates to unified layout (not PublicLayout)

---

# PART 7: Terminology Strategy

> **Critical Decision:** Keep ATTENDEE/ORGANIZER in code, use industry-friendly terms in UI.

## The Strategy

**Code (Backend, Database, API):**
- ✅ Keep `ATTENDEE` and `ORGANIZER` enums
- ✅ Keep route paths (`/user/*`, `/organizer/*`)
- ✅ Keep API response fields (`role: "ORGANIZER"`)

**UI (Web & Mobile):**
- ✏️ Display "Event Organizer" instead of "ORGANIZER"
- ✏️ Display "Attendee" (already correct)
- ✏️ Use "Event Management" instead of "Organizer Dashboard"
- ✏️ Use "My Events" instead of "User Dashboard"
- ✏️ Use "Create Events" CTA instead of "Switch to Organizer"

## Why This Approach?

**Benefits:**
✅ **No database migrations** — UserRole enum stays the same
✅ **No API versioning** — existing endpoints unchanged
✅ **Minimal breaking changes** — backend code stable
✅ **Industry alignment** — UI matches Eventbrite/Meetup
✅ **Easy to iterate** — change UI labels without backend changes
✅ **A/B testing ready** — test different UI terms easily

**Implementation:**
```typescript
// Web: src/constants/roleLabels.ts
export const ROLE_LABELS = {
  ATTENDEE: 'Attendee',
  ORGANIZER: 'Event Organizer',
  ORGANIZER_STAFF: 'Team Member',
  // ...
};

// Mobile: lib/core/constants/role_labels.dart
class RoleLabels {
  static const Map<String, String> primary = {
    'ATTENDEE': 'Attendee',
    'ORGANIZER': 'Event Organizer',
    'ORGANIZER_STAFF': 'Team Member',
  };
}
```

**Detailed Documentation:**
See [TERMINOLOGY_STRATEGY.md](./TERMINOLOGY_STRATEGY.md) for complete implementation guide, code examples, and migration checklist.

---

# PART 7B: Authentication & Onboarding Changes

> **Critical:** The unified dashboard requires significant changes to authentication and onboarding flows.

## Current Authentication Issues

**Problem:** Authentication and onboarding are tightly coupled to the old role-based model:

1. **Signup has role selection** — Users choose ATTENDEE or ORGANIZER during registration
2. **Post-registration routing is role-based** — Different dashboards for different roles
3. **Post-login routing is role-based** — `getDashboardRoute()` splits users
4. **Onboarding is forced for organizers** — Happens immediately after ORGANIZER signup

**Files Affected:**
- `client/src/pages/auth/SignUp.tsx` — 3-step signup with role selection
- `client/src/hooks/useAuth.ts` — `getDashboardRoute()` function
- `client/src/pages/auth/SignIn.tsx` — OAuth callback routing
- `lib/presentation/auth/screens/login_screen.dart` — Mobile login routing

## Required Changes Summary

### 1. Remove Role Selection from Signup

**Before:** Step 1 = Choose "Attend events" or "Organize events"
**After:** Skip role selection, all new users = ATTENDEE

### 2. Update Post-Registration Routing

**Before:**
```typescript
if (role === 'ORGANIZER') navigate('/organizer/dashboard');
else if (role === 'ATTENDEE') navigate('/user/dashboard');
```

**After:**
```typescript
if (isAdmin) navigate('/admin/dashboard');
else navigate('/dashboard');  // Unified dashboard for everyone
```

### 3. Update Post-Login Routing

**Before:** `getDashboardRoute()` returns different paths per role
**After:** All non-admin users go to `/dashboard`

### 4. Defer Onboarding

**Before:** ORGANIZER signup → immediate onboarding wizard
**After:** ATTENDEE → Create first event → onboarding wizard

### 5. Update OAuth Flows

**Before:** Google/Apple signup passes `selectedRole` parameter
**After:** All OAuth signups default to ATTENDEE

## Implementation Impact

**Web Changes:**
- 10 file modifications (auth pages, hooks, routing)
- Remove ~100 lines of role selection UI
- Update 6 routing functions

**Mobile Changes:**
- 2 file modifications (login screen, auth controller)
- Already simpler (no role selection)
- Only routing logic needs updating

**Backend Changes:**
- **NONE required** (role parameter becomes optional, backward compatible)

## Testing Requirements

- [ ] New user signup (all methods) → unified dashboard
- [ ] Existing ATTENDEE login → unified dashboard
- [ ] Existing ORGANIZER login → unified dashboard (no forced onboarding)
- [ ] ADMIN login → admin dashboard (unchanged)
- [ ] Role switching still works
- [ ] Password reset flow unchanged

**Detailed Guide:**
See [AUTHENTICATION_MIGRATION.md](./AUTHENTICATION_MIGRATION.md) for complete step-by-step migration plan, code changes, and testing strategy.

---

# PART 8: Implementation Priorities & Timeline

## Implementation Strategy

**Approach:** Mobile-first, then web. Validate UX on mobile before investing in larger web refactor.

### Phase 1: Mobile App (Weeks 1-7)

**Why Mobile First?**
- ✅ Smaller codebase (easier to refactor)
- ✅ Single state management system (GetX)
- ✅ Faster iteration and testing
- ✅ Proves the unified dashboard concept
- ✅ Users can test on real devices immediately

**Week 1: Foundation**
- [ ] Create `UnifiedLayout` widget (5-tab navigation)
- [ ] Set up `MyEventsController`
- [ ] Create role label constants
- [ ] Update splash screen routing logic

**Week 2: My Events Hub**
- [ ] Build `MyEventsScreen` with 3 sub-tabs
- [ ] Implement Attending tab (reuse existing API)
- [ ] Implement Organizing tab (reuse `OrganizerDashboardController`)
- [ ] Implement Saved tab (reuse `SavedEventsController`)

**Week 3: Home Screen Updates**
- [ ] Modify `DashboardScreen` for role-aware stats
- [ ] Update quick actions (Create Event vs Scan Ticket)
- [ ] Test with both ATTENDEE and ORGANIZER roles

**Week 4: Event Management Screen**
- [ ] Create `EventManagementScreen` container
- [ ] Integrate existing organizer screens as tabs
- [ ] Test navigation from My Events → Event Management

**Week 5: Create Event Tab & Role Upgrade**
- [ ] Build `CreateEventScreen` with role detection
- [ ] Implement "Become an Organizer" flow
- [ ] Add `becomeOrganizer` API integration
- [ ] Test ATTENDEE → ORGANIZER transition

**Week 6: Terminology Migration**
- [ ] Create `RoleLabels` class
- [ ] Update all UI text using labels
- [ ] Update navigation bar labels
- [ ] Update profile screen
- [ ] Update email templates (mobile notifications)

**Week 7: Testing & Refinement**
- [ ] QA testing (both roles)
- [ ] Accessibility testing
- [ ] Performance testing
- [ ] Fix bugs and polish UI
- [ ] Prepare for deployment

### Phase 2: Web Application (Weeks 8-14)

**Week 8-9: Foundation**
- [ ] Create role label constants (`roleLabels.ts`)
- [ ] Update `RoleViewContext` for terminology
- [ ] Plan UnifiedWebLayout structure
- [ ] Design mode toggle component

**Week 10-11: Layout Implementation**
- [ ] Build UnifiedWebLayout shell
- [ ] Implement mode toggle (Attending ↔ Organizing)
- [ ] Migrate shared pages (Profile, Notifications)
- [ ] Update navigation components

**Week 12: Route Consolidation**
- [ ] Create new `/dashboard/*` routes
- [ ] Set up redirects from old routes
- [ ] Update all internal links
- [ ] Test deep linking

**Week 13: Terminology Migration**
- [ ] Update all components with `ROLE_LABELS`
- [ ] Update page titles and headings
- [ ] Update email templates
- [ ] Update documentation

**Week 14: Testing & Launch**
- [ ] Visual regression testing
- [ ] Cross-browser testing
- [ ] User acceptance testing
- [ ] Phased rollout (beta users first)

### Phase 3: Backend Enhancements (Ongoing)

**Capabilities System (Future Enhancement):**
Instead of strict role checks, implement capability flags:

```typescript
// Current (role-based)
if (user.role === 'ORGANIZER') {
  // allow event creation
}

// Future (capability-based)
if (user.capabilities.includes('CREATE_EVENTS')) {
  // allow event creation
}
```

This allows:
- User with ATTENDEE role but organizer capability
- Finer-grained permissions
- Easier white-label customization

**API Versioning (If Needed):**
- Keep existing endpoints for backward compatibility
- Add new `/v2/*` endpoints if role semantics change
- Document migration path for API consumers

---

# PART 9: Testing & Quality Assurance

## Testing Strategy

### 1. Unit Testing

**Backend:**
```bash
# Role-based authorization tests
npm test -- auth.middleware.test.ts
npm test -- permission.service.test.ts

# Ensure ATTENDEE/ORGANIZER logic still works
npm test -- organizer.service.test.ts
```

**Frontend (Web):**
```bash
# Component tests with role labels
npm test -- RoleSwitcher.test.tsx
npm test -- ProfileBadge.test.tsx
npm test -- useAuth.test.tsx
```

**Mobile:**
```bash
flutter test test/unit/role_labels_test.dart
flutter test test/unit/auth_controller_test.dart
```

### 2. Integration Testing

**Mobile:**
```bash
# E2E flow tests
flutter drive --target=test_driver/app.dart

# Test scenarios:
# - Login as ATTENDEE → see unified dashboard
# - Login as ORGANIZER → see unified dashboard with My Events
# - ATTENDEE creates event → becomes ORGANIZER
# - Switch between Attending/Organizing tabs
```

**Web:**
```bash
# Playwright E2E tests
npm run test:e2e

# Test scenarios:
# - Role label display in all contexts
# - Mode toggle functionality
# - Route preservation during mode switch
# - Shared components across modes
```

### 3. User Acceptance Testing (UAT)

**Beta User Groups:**
1. **Pure Attendees** — Never organized before
2. **Pure Organizers** — Rarely attend events
3. **Dual-Role Power Users** — Frequently switch roles
4. **New Users** — First-time platform users

**UAT Criteria:**
- [ ] Users can find event creation easily
- [ ] Role switching is intuitive (no confusion)
- [ ] Terminology is clear and professional
- [ ] No disruption to existing workflows
- [ ] Performance is acceptable

**Feedback Collection:**
- In-app surveys after 7 days
- User interviews (5-10 per group)
- Analytics tracking (feature usage)
- Support ticket monitoring

### 4. Accessibility Testing

**WCAG 2.1 AA Compliance:**
- [ ] Screen reader compatibility (role labels announced correctly)
- [ ] Keyboard navigation (mode toggle accessible)
- [ ] Color contrast (role badges meet 4.5:1 ratio)
- [ ] Focus indicators (clear focus states)

**Testing Tools:**
- axe DevTools (automated scanning)
- NVDA/JAWS screen readers (manual testing)
- Lighthouse accessibility audit

### 5. Performance Testing

**Metrics:**
- [ ] Dashboard load time < 2 seconds
- [ ] Mode switch transition < 300ms
- [ ] Mobile app startup < 3 seconds
- [ ] No memory leaks during role switching

**Tools:**
- Lighthouse (web performance)
- Chrome DevTools (network, memory)
- Flutter DevTools (widget rebuild profiling)

### 6. Regression Testing

**Critical Paths to Test:**
- [ ] Event registration still works
- [ ] Payment flow unaffected
- [ ] QR code generation intact
- [ ] Email notifications sent correctly
- [ ] Analytics tracking accurate
- [ ] Admin dashboard functioning
- [ ] API responses unchanged

**Automated Regression Suite:**
```bash
# Backend API tests
npm run test:api

# Frontend critical path tests
npm run test:regression

# Mobile smoke tests
flutter test test/smoke/
```

### 7. Rollback Plan

**Rollback Triggers:**
- Critical bug affecting core functionality
- User confusion metrics > 20%
- Performance degradation > 30%
- Accessibility violations found in production

**Rollback Procedure:**
1. Revert frontend deployments (web & mobile)
2. Backend remains unchanged (no DB changes made)
3. Restore old routes and layouts
4. Communicate with users about temporary revert

**Rollback Testing:**
- [ ] Prepare rollback branch in Git
- [ ] Test rollback in staging environment
- [ ] Document rollback steps
- [ ] Assign rollback decision authority

---

# APPENDIX: Quick Reference

## A. Terminology Mapping

| Code Value | UI Display (Web) | UI Display (Mobile) | Context |
|------------|------------------|---------------------|---------|
| `ATTENDEE` | Attendee | Attendee | All contexts |
| `ORGANIZER` | Event Organizer | Organizer | Profile, settings |
| `ORGANIZER` | Event Creator | Event Creator | Marketing, first-time prompts |
| `/user/*` | My Events | My Events | Navigation label |
| `/organizer/*` | Event Management | Manage Events | Navigation label |
| "Switch to Organizer" | Create Events | Create Events | CTA button |
| "Switch to Attendee" | Browse Events | Browse Events | CTA button |

## B. File Changes Summary

### Mobile (HIGH PRIORITY)

**New Files:**
- `lib/screens/layouts/unified_layout.dart`
- `lib/screens/my_events_screen.dart`
- `lib/controllers/my_events_controller.dart`
- `lib/presentation/organizer/screens/event_management_screen.dart`
- `lib/screens/create_event_screen.dart`
- `lib/core/constants/role_labels.dart`
- `lib/core/constants/navigation_labels.dart`

**Modified Files (High Impact):**
- `lib/main.dart` — routing changes
- `lib/screens/splash_screen.dart` — simplified role routing
- `lib/presentation/attendee/screens/dashboard_screen.dart` — role-aware stats
- `lib/presentation/auth/screens/login_screen.dart` — routing update

### Web (PHASE 2)

**New Files:**
- `client/src/constants/roleLabels.ts`
- `client/src/constants/navigationLabels.ts`
- `client/src/layouts/UnifiedWebLayout.tsx` (future)
- `client/src/components/ModeToggle.tsx` (future)

**Modified Files (High Impact):**
- `client/src/components/RoleSwitcher.tsx`
- `client/src/components/Navbar.tsx`
- `client/src/components/ProfileBadge.tsx`
- `client/src/pages/auth/SignIn.tsx`
- `client/src/routes/index.tsx`

### Backend (NO CHANGES)

**Unchanged:**
- ✅ `prisma/schema.prisma` — UserRole enum
- ✅ `src/middleware/auth.middleware.ts` — role checks
- ✅ All route definitions
- ✅ All service layer code

## C. Common Pitfalls & Solutions

| Pitfall | Solution |
|---------|----------|
| Hardcoding "ORGANIZER" in UI | Always use `ROLE_LABELS[user.role]` |
| Forgetting to update email templates | Search codebase for "organizer" (case-insensitive) |
| Breaking existing API consumers | Keep all API response fields unchanged |
| Inconsistent terminology across platforms | Use shared constants in both web & mobile |
| Screen reader announces "ORGANIZER" | Ensure ARIA labels use display names |
| Deep links to `/organizer/*` break | Set up redirects to new routes |

## D. Key Decisions Log

| Decision | Rationale | Date |
|----------|-----------|------|
| Keep ATTENDEE/ORGANIZER in code | Avoid breaking changes, stable backend | Feb 2026 |
| Use "Event Organizer" in UI | Industry standard per research | Feb 2026 |
| Mobile-first implementation | Faster validation, smaller scope | Feb 2026 |
| Unified dashboard for both roles | Matches Meetup/Eventbrite patterns | Feb 2026 |

## E. Success Metrics

**Quantitative:**
- [ ] Organizer sign-ups increase by 25% (easier discovery)
- [ ] Role switching actions decrease by 50% (less friction)
- [ ] User session duration increases by 15% (more engagement)
- [ ] Support tickets about role confusion decrease by 40%

**Qualitative:**
- [ ] User surveys show 80%+ satisfaction with terminology
- [ ] Beta testers report "clearer" and "more intuitive" experience
- [ ] No negative feedback about role switching complexity
- [ ] Users successfully create first event without help docs

## F. Related Documentation

- [TERMINOLOGY_STRATEGY.md](./TERMINOLOGY_STRATEGY.md) — Complete terminology implementation guide
- [TECHNICAL_GUIDE.md](./TECHNICAL_GUIDE.md) — Backend technical architecture
- [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) — Auth system and role management
- [PLATFORM_GUIDE.md](./PLATFORM_GUIDE.md) — End-to-end platform features

---

**Document Status:** ✅ READY FOR REVIEW & IMPLEMENTATION

**Next Actions:**
1. ✅ Review and approve Part 0 (Industry Standards)
2. ✅ Review and approve Part 7 (Terminology Strategy)
3. ⬜ Create detailed sprint planning for Phase 1 (Mobile)
4. ⬜ Assign development tasks to team
5. ⬜ Begin Week 1 implementation

**Questions or Concerns?**
- Contact Product Owner for strategy questions
- Contact Tech Lead for implementation questions
- Contact UX Designer for terminology/design questions
