# EventKnit Terminology Strategy

**Document Purpose:** Define the terminology mapping between backend code, database, and user-facing UI to align with industry standards while maintaining code stability.

**Last Updated:** February 2026
**Status:** Planning Phase

---

## Table of Contents

1. [Strategy Overview](#strategy-overview)
2. [Industry Research](#industry-research)
3. [Terminology Mapping](#terminology-mapping)
4. [Implementation Guidelines](#implementation-guidelines)
5. [Code Examples](#code-examples)
6. [Migration Checklist](#migration-checklist)

---

## Strategy Overview

### The Approach: Stable Code, Friendly UI

**Core Principle:** Keep internal role names stable (ATTENDEE, ORGANIZER) while using industry-standard, user-friendly terminology in all user-facing contexts.

**Why This Approach?**

✅ **Minimal Breaking Changes:** No database schema changes, no API versioning issues
✅ **Industry Alignment:** UI matches what users expect from Eventbrite, Meetup, etc.
✅ **Code Stability:** Existing codebase remains functional during migration
✅ **Flexible Evolution:** Easy to adjust UI terms based on user feedback
✅ **Clear Separation:** Backend developers and UX designers can work independently

### Migration Scope

**What Changes:**
- ✏️ All user-facing text (UI labels, buttons, headings, navigation)
- ✏️ Email templates and notifications
- ✏️ Documentation and help content
- ✏️ Marketing materials

**What Stays the Same:**
- ✅ Database schema (UserRole enum)
- ✅ API endpoint paths and parameters
- ✅ Backend service layer code
- ✅ GraphQL/REST response field names
- ✅ TypeScript/Dart type definitions (internal)

---

## Industry Research

### Terminology Analysis (2026)

| Platform | Primary Term | Secondary Terms | Context |
|----------|--------------|-----------------|---------|
| **Eventbrite** | Organizer | Event Creator, Host (for co-hosts) | "Organizer" in main nav, account settings |
| **Meetup** | Organizer | Host (event-level), Co-organizer | "Organizer" for group, "Host" for events |
| **Ticket Tailor** | Event Creator | Organizer | Marketing uses "Event Creator" |
| **Eventcube** | Organizer | Event Manager | Professional focus |
| **Tixr** | Organizer | Promoter | Used interchangeably |
| **Universe** | Organizer | Event Host | "Organizer" primary |

### Key Insights

1. **"Organizer" is universal** — All major platforms use this as primary terminology
2. **"Event Creator" is marketing-friendly** — Appeals to new users, emphasizes creation
3. **"Host" is contextual** — Used for individual event management, not account-level
4. **"Attendee" is standard** — No platform deviates from this term
5. **Role fluidity is key** — Modern platforms make switching between roles seamless

**Sources:**
- [How to Choose a Ticketing Platform in 2026](https://creators.tixr.com/post/how-to-choose-a-ticketing-platform)
- [Eventbrite Alternative - Ticket Tailor](https://www.tickettailor.com/eventbrite-alternative)
- [Meetup 2026 Roadmap](https://www.meetup.com/blog/2026-meetup-roadmap/)
- [Eventbrite Multi-User Access](https://www.eventbrite.com/help/en-us/articles/710537/)

---

## Terminology Mapping

### Role Terminology

| Backend Code | Database Enum | API Response | Web UI (Primary) | Web UI (Secondary) | Mobile UI | Email/Notifications |
|--------------|---------------|--------------|------------------|-------------------|-----------|---------------------|
| `ATTENDEE` | `ATTENDEE` | `"ATTENDEE"` | **Attendee** | Participant, Guest | **Attendee** | Attendee |
| `ORGANIZER` | `ORGANIZER` | `"ORGANIZER"` | **Event Organizer** | Event Creator, Host | **Organizer** | Event Organizer |
| `ORGANIZER_STAFF` | `ORGANIZER_STAFF` | `"ORGANIZER_STAFF"` | **Team Member** | Event Staff | **Team Member** | Team Member |
| `ORGANIZER_TELLER` | `ORGANIZER_TELLER` | `"ORGANIZER_TELLER"` | **Check-in Staff** | Scanner, Teller | **Check-in Staff** | Check-in Staff |

### Dashboard & Navigation Terminology

| Backend/Route | Current UI Label | New UI Label | Rationale |
|---------------|------------------|--------------|-----------|
| `/user/*` | "User Dashboard" / "Attendee Dashboard" | **"My Events"** / **"Dashboard"** | Simpler, less technical |
| `/organizer/*` | "Organizer Dashboard" | **"Event Management"** / **"Manage Events"** | Action-oriented |
| Switch role button | "Switch to Organizer" | **"Create Events"** / **"Become an Organizer"** | Benefit-focused |
| Switch role button | "Switch to Attendee" | **"Browse Events"** / **"Attend Events"** | Benefit-focused |

### Feature-Specific Terminology

| Backend Context | Current Term | New UI Term | Where Used |
|----------------|--------------|-------------|------------|
| Event ownership | "Organizer" | **"Event Host"** / **"Created by"** | Event detail pages |
| Event creation | "Create Organizer Event" | **"Create Event"** | Primary action button |
| Dashboard context | "My Organized Events" | **"Events I'm Hosting"** / **"My Events"** | Navigation, headings |
| Registration context | "Registered Events" | **"Events I'm Attending"** / **"My Tickets"** | User dashboard |
| Team context | "Organizer Team" | **"Event Team"** / **"Team Members"** | Team management pages |
| Analytics context | "Organizer Analytics" | **"Event Insights"** / **"Performance"** | Analytics section |

### Status & Role Display

| Backend Value | UI Display (Web) | UI Display (Mobile) | UI Badge Color |
|---------------|------------------|---------------------|----------------|
| `role: "ATTENDEE"` | "Attendee" | "Attendee" | Blue |
| `role: "ORGANIZER"` | "Event Organizer" | "Organizer" | Purple |
| `role: "ORGANIZER_STAFF"` | "Team Member" | "Team Member" | Teal |
| `role: "ADMIN"` | "Administrator" | "Admin" | Red |

---

## Implementation Guidelines

### 1. Create Translation/Label Files

**Web (React):**

```typescript
// src/constants/roleLabels.ts
import { UserRole } from '@/types/auth';

export const ROLE_LABELS: Record<UserRole, string> = {
  ATTENDEE: 'Attendee',
  ORGANIZER: 'Event Organizer',
  ORGANIZER_STAFF: 'Team Member',
  ORGANIZER_TELLER: 'Check-in Staff',
  ADMIN: 'Administrator',
  ADMIN_STAFF: 'Admin Team Member',
  SUPERADMIN: 'Super Administrator',
  // ... other roles
};

export const ROLE_LABELS_SHORT: Record<UserRole, string> = {
  ATTENDEE: 'Attendee',
  ORGANIZER: 'Organizer',
  ORGANIZER_STAFF: 'Staff',
  ORGANIZER_TELLER: 'Check-in',
  // ... other roles
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ATTENDEE: 'Browse and attend events',
  ORGANIZER: 'Create and manage events',
  ORGANIZER_STAFF: 'Help manage events',
  // ... other roles
};
```

**Mobile (Flutter):**

```dart
// lib/core/constants/role_labels.dart
class RoleLabels {
  static const Map<String, String> primary = {
    'ATTENDEE': 'Attendee',
    'ORGANIZER': 'Event Organizer',
    'ORGANIZER_STAFF': 'Team Member',
    'ORGANIZER_TELLER': 'Check-in Staff',
    'ADMIN': 'Administrator',
  };

  static const Map<String, String> short = {
    'ATTENDEE': 'Attendee',
    'ORGANIZER': 'Organizer',
    'ORGANIZER_STAFF': 'Staff',
    'ORGANIZER_TELLER': 'Check-in',
  };

  static const Map<String, String> descriptions = {
    'ATTENDEE': 'Browse and attend events',
    'ORGANIZER': 'Create and manage events',
    'ORGANIZER_STAFF': 'Help manage events',
  };

  static String getLabel(String role, {bool short = false}) {
    if (short) return RoleLabels.short[role] ?? role;
    return RoleLabels.primary[role] ?? role;
  }
}
```

### 2. Component/Widget Guidelines

**Do ✅**

```typescript
// Web (React)
import { ROLE_LABELS } from '@/constants/roleLabels';

function UserBadge({ user }: { user: User }) {
  return (
    <Badge variant={getRoleVariant(user.role)}>
      {ROLE_LABELS[user.role]}
    </Badge>
  );
}

// Mobile (Flutter)
Text(RoleLabels.getLabel(user.role))
```

**Don't ❌**

```typescript
// Hardcoded role display
<Badge>{user.role}</Badge> // Shows "ORGANIZER"
<Text>ORGANIZER</Text>
```

### 3. Route & Navigation Labels

**Web Routes:**

```typescript
// src/routes/index.tsx
const routes = [
  {
    path: '/organizer/*', // Keep path for backend routing
    element: <OrganizerLayout />,
    handle: {
      crumb: () => 'Event Management', // ✅ User-friendly label
    },
  },
];

// Navigation component
<NavLink to="/organizer/dashboard">
  Manage Events {/* ✅ Not "Organizer Dashboard" */}
</NavLink>
```

**Mobile Navigation:**

```dart
// Bottom navigation
BottomNavigationBarItem(
  icon: Icon(Icons.event),
  label: 'My Events', // ✅ Not "User Dashboard"
)

BottomNavigationBarItem(
  icon: Icon(Icons.dashboard),
  label: 'Manage Events', // ✅ Not "Organizer Dashboard"
)
```

### 4. Email Template Updates

**Before:**
```
Subject: Welcome to EventKnit, Organizer!

Hi {{firstName}},

Your organizer account has been created...
```

**After:**
```
Subject: Welcome to EventKnit - Start Creating Events!

Hi {{firstName}},

You can now create and manage events on EventKnit...
```

### 5. Dynamic Role Switching

**Web:**

```typescript
// src/components/RoleSwitcher.tsx
function RoleSwitcher() {
  const { user } = useAuth();

  return (
    <Button onClick={handleSwitchToOrganizer}>
      {user.role === 'ATTENDEE'
        ? 'Create Events' // ✅ Benefit-focused
        : 'Browse Events' // ✅ Action-oriented
      }
    </Button>
  );
}
```

**Mobile:**

```dart
// lib/presentation/shared/widgets/role_switcher.dart
TextButton(
  onPressed: _handleRoleSwitch,
  child: Text(
    currentRole == UserRole.attendee
      ? 'Create Events'
      : 'Browse Events',
  ),
)
```

---

## Code Examples

### Example 1: User Profile Display

**Backend (unchanged):**
```typescript
// server/src/controllers/user.controller.ts
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    role: true, // Returns "ORGANIZER"
  },
});
return res.json({ success: true, data: { user } });
```

**Frontend (NEW):**
```typescript
// client/src/pages/Profile.tsx
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/constants/roleLabels';

function ProfilePage() {
  const { user } = useAuth();

  return (
    <div>
      <h2>Account Type</h2>
      <div>
        <Badge>{ROLE_LABELS[user.role]}</Badge>
        <p>{ROLE_DESCRIPTIONS[user.role]}</p>
      </div>
    </div>
  );
}
// Displays: "Event Organizer" badge with "Create and manage events" description
```

### Example 2: Navigation Menu

**Web:**

```typescript
// client/src/components/Navbar.tsx
const menuItems = [
  {
    label: user.role === 'ORGANIZER' ? 'Event Management' : 'My Events',
    path: user.role === 'ORGANIZER' ? '/organizer/dashboard' : '/user/dashboard',
    icon: <DashboardIcon />,
  },
  {
    label: 'Browse Events',
    path: '/events',
    icon: <SearchIcon />,
  },
];
```

**Mobile:**

```dart
// lib/presentation/shared/widgets/app_drawer.dart
ListTile(
  leading: Icon(Icons.dashboard),
  title: Text(
    user.role == UserRole.organizer
      ? 'Event Management'
      : 'My Events'
  ),
  onTap: () => Get.toNamed(
    user.role == UserRole.organizer
      ? '/organizer/dashboard'
      : '/user/dashboard'
  ),
)
```

### Example 3: Role-Based Greeting

```typescript
// client/src/pages/Dashboard.tsx
function DashboardGreeting() {
  const { user } = useAuth();

  const greeting = user.role === 'ORGANIZER'
    ? `Welcome back, ${user.firstName}! Ready to manage your events?`
    : `Hi ${user.firstName}! Discover amazing events happening near you.`;

  return <h1>{greeting}</h1>;
}
```

---

## Migration Checklist

### Phase 1: Setup (Week 1)

- [ ] Create `roleLabels.ts` / `role_labels.dart` constants files
- [ ] Create `navigationLabels.ts` / `navigation_labels.dart` for menu items
- [ ] Update TypeScript/Dart types to include display labels
- [ ] Create UI component library with updated terminology
- [ ] Document naming conventions for team

### Phase 2: Web Application (Weeks 2-3)

- [ ] Update all navigation menus and breadcrumbs
- [ ] Update dashboard headers and page titles
- [ ] Replace hardcoded role displays with `ROLE_LABELS`
- [ ] Update role switcher component
- [ ] Update authentication flow messaging
- [ ] Update settings/profile pages
- [ ] Update onboarding wizard
- [ ] Update help text and tooltips
- [ ] Update form field labels
- [ ] Update button text and CTAs

### Phase 3: Mobile Application (Weeks 3-4)

- [ ] Update bottom navigation labels
- [ ] Update drawer menu items
- [ ] Update profile screen
- [ ] Update role switcher widget
- [ ] Update onboarding screens
- [ ] Update dashboard widgets
- [ ] Update notification messages
- [ ] Update error messages

### Phase 4: Communication (Week 4)

- [ ] Update email templates (20+ templates)
- [ ] Update SMS notification templates
- [ ] Update push notification messages
- [ ] Update in-app notification text
- [ ] Update system alerts and toasts
- [ ] Update confirmation dialogs

### Phase 5: Documentation (Week 5)

- [ ] Update user documentation
- [ ] Update help center articles
- [ ] Update API documentation (display examples)
- [ ] Update onboarding guides
- [ ] Update video tutorials (re-record or add captions)
- [ ] Update marketing website copy

### Phase 6: Testing & QA (Week 6)

- [ ] Visual regression testing
- [ ] Accessibility testing (screen reader compatibility)
- [ ] Mobile responsiveness testing
- [ ] Cross-browser testing
- [ ] Internationalization review (if applicable)
- [ ] User acceptance testing with beta users

### Phase 7: Deployment (Week 7)

- [ ] Deploy web application updates
- [ ] Deploy mobile app updates (app store review)
- [ ] Monitor user feedback
- [ ] Track analytics for terminology clarity
- [ ] Prepare rollback plan

---

## Common Patterns Reference

### Pattern 1: Conditional Role Display

```typescript
// Web
const roleDisplayName = user.role === 'ORGANIZER'
  ? 'Event Organizer'
  : user.role === 'ATTENDEE'
  ? 'Attendee'
  : ROLE_LABELS[user.role];

// Better: Always use mapping
const roleDisplayName = ROLE_LABELS[user.role];
```

### Pattern 2: Dashboard Title

```typescript
// Web
const dashboardTitle = user.role === 'ORGANIZER'
  ? 'Event Management Dashboard'
  : 'My Events';
```

### Pattern 3: Navigation Context

```typescript
// Web - Navigation breadcrumbs
const breadcrumbs = [
  { label: 'Home', path: '/' },
  { label: ROLE_LABELS[user.role], path: `/${user.role.toLowerCase()}` },
  { label: 'Dashboard', path: `/${user.role.toLowerCase()}/dashboard` },
];
// Displays: Home > Event Organizer > Dashboard
```

---

## Notes

### Why Not Change Backend Enums?

**Reasons to keep ATTENDEE/ORGANIZER in code:**

1. **Database Stability:** Changing enum values requires complex Prisma migrations
2. **API Contracts:** Breaking changes for mobile apps and integrations
3. **Third-party Dependencies:** External services may rely on these values
4. **Code Clarity:** "ORGANIZER" is semantically clear to developers
5. **Testing:** Existing test fixtures and mocks don't need updates

### Future Considerations

- **Internationalization (i18n):** The label mapping approach makes translation easier
- **White-label:** Different clients can use different terminology (e.g., "Host" vs "Organizer")
- **A/B Testing:** Easy to test different UI terms without backend changes
- **Role Evolution:** New roles can be added without refactoring display logic

---

## Approval & Sign-off

| Stakeholder | Approved | Date | Notes |
|-------------|----------|------|-------|
| Product Owner | ⬜ | | |
| Tech Lead | ⬜ | | |
| UX Designer | ⬜ | | |
| Marketing | ⬜ | | |

---

**Next Steps:**
1. Review and approve this strategy
2. Create detailed implementation plan for each phase
3. Assign tasks to development teams
4. Begin Phase 1 setup
