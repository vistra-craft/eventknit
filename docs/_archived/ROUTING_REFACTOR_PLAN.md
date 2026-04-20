# EventKnit Routing Architecture Refactor - Implementation Plan

## Executive Summary

**Goal:** Refactor EventKnit's 200+ flat routes into a scalable, maintainable architecture following the proven pattern from smart-purchase/ecommerce-frontend.

**Impact:** Zero breaking changes, 100% backward compatibility, ~90% reduction in App.tsx size.

**Timeline:** Phased implementation with rollback capability at each step.

---

## Current State Analysis

### What We Have (App.tsx - 395 lines)

```typescript
// Current: 200+ routes defined directly in App.tsx
<Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
<Route path="/admin/events" element={<ProtectedRoute><AdminAllEventsPage /></ProtectedRoute>} />
<Route path="/admin/events/pending" element={<ProtectedRoute><AdminPendingApprovalPage /></ProtectedRoute>} />
// ... 197+ more routes
```

**Issues:**
1. ❌ All 60+ page components imported at top of App.tsx (no code splitting)
2. ❌ Single 395-line file, hard to navigate
3. ❌ No route grouping or organization
4. ❌ Duplicate `ProtectedRoute` wrapper on every route
5. ❌ No lazy loading (entire app loads upfront)

### Route Breakdown by Domain

**Public Routes (12):**
- `/`, `/about`, `/careers`, `/privacy-policy`, `/terms-of-service`, etc.
- Event public pages: `/event/:id`, `/event/:id/register`, `/event/:id/payment`
- Forms: `/forms/:type/:templateId`, `/feedback/:token`

**Auth Routes (10):**
- `/auth/signin`, `/auth/signup`, `/auth/register`
- `/auth/register/organizer`, `/auth/register/attendee`
- `/auth/forgot-password`, `/auth/reset-password`
- `/auth/magic-link/verify`, `/auth/create-account`

**User Routes (5 main):**
- `/user/dashboard` (with 30+ section query params)
- `/user/event/:id`, `/user/tickets/:registrationId`
- `/user/profile`, `/user/notification-preferences`

**Organizer Routes (~60):**
- Dashboard: `/organizer/dashboard`, `/organizer/onboarding`
- Events: `/organizer/events/*` (16 routes)
- Analytics: `/organizer/analytics/*` (5 routes)
- Team: `/organizer/team/*` (1 route)
- Settings: `/organizer/settings/*` (5 routes)
- Attendees: `/organizer/attendees/*` (3 routes)
- Marketing: `/organizer/marketing/*` (1 route)
- Others: verification, kyc, subscription, venues, templates, drafts, collaboration

**Admin Routes (~120):**
- Dashboard: `/admin/dashboard`
- Events: `/admin/events/*` (9 routes)
- Users: `/admin/users/*` (10 routes)
- Staff Performance: `/admin/staff-performance/*` (2 routes)
- System: `/admin/system/*` (6 routes)
- Marketing: `/admin/marketing/*` (9 routes)
- Communications: `/admin/communications`, `/admin/notification-settings`
- Support: `/admin/support`, `/admin/feedback`
- Branding: `/admin/white-label`, `/admin/custom-domains`
- Analytics: `/admin/analytics/*` (5 routes)
- Financial: `/admin/financial/*` (2 routes)
- Service Point: `/admin/service-point/*` (8 routes)
- Tickets: `/admin/tickets/*` (4 routes)
- Moderation: `/admin/moderation`
- Settings: `/admin/settings`, `/admin/profile`

---

## Reference Architecture (Smart Purchase Pattern)

### App.tsx Structure (30 lines)
```typescript
<Routes>
  <Route path="/auth/*" element={<AuthLayout />} />
  <Route path="/admin/*" element={<AdminLayout />} />
  <Route path="/*" element={<GuestLayout />} />
</Routes>
```

### routes/index.ts Structure
```typescript
const authRoutes: RouteObject[] = [
  { path: 'login', element: createElement(Login) },
  { path: 'register', element: createElement(Register) },
  { path: '*', element: createElement(NotFound) },
];

const adminRoutes: RouteObject[] = [
  { path: '/dashboard', element: createElement(Dashboard) },
  { path: '/analytics', element: createElement(Analytics) },
  { path: '*', element: createElement(NotFound) },
];

export { authRoutes, adminRoutes, clientRoutes };
```

### Layout Structure
```typescript
const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <Sidebar />
      <main>
        <Routes>
          {adminRoutes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
        </Routes>
        <Outlet />
      </main>
    </div>
  );
};
```

---

## Proposed Architecture for EventKnit

### New Directory Structure

```
client/src/
├── App.tsx (30-40 lines - layout routes only)
├── routes/
│   ├── index.ts (exports all route groups)
│   ├── publicRoutes.tsx
│   ├── authRoutes.tsx
│   ├── userRoutes.tsx
│   ├── organizerRoutes.tsx
│   ├── adminRoutes.tsx
│   └── types.ts (shared route types)
├── layouts/ (EXISTING - keep as is)
│   ├── AdminLayout.tsx (UPDATE: add route rendering)
│   ├── OrganizerLayout.tsx (UPDATE: add route rendering)
│   └── UserLayout.tsx (NEW: extract from UserDashboard)
├── pages/ (EXISTING - no changes)
└── components/ (EXISTING - no changes)
```

### New App.tsx (Target)

```typescript
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { RoleViewProvider } from "./contexts/RoleViewContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "./components/ui/toaster";
import { LoadingSpinner } from "./components/ui/loading-spinner";

// Lazy load layout components
const PublicLayout = lazy(() => import("./layouts/PublicLayout"));
const AuthLayout = lazy(() => import("./layouts/AuthLayout"));
const UserLayout = lazy(() => import("./layouts/UserLayout"));
const OrganizerLayout = lazy(() => import("./layouts/OrganizerLayout"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <RoleViewWrapper>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/auth/*" element={<AuthLayout />} />
                <Route path="/user/*" element={<UserLayout />} />
                <Route path="/organizer/*" element={<OrganizerLayout />} />
                <Route path="/admin/*" element={<AdminLayout />} />
                <Route path="/*" element={<PublicLayout />} />
              </Routes>
            </Suspense>
          </RoleViewWrapper>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
```

---

## Implementation Strategy

### Phase 1: Setup (No Breaking Changes)

**Step 1.1: Create routes directory and files**
```bash
mkdir -p client/src/routes
touch client/src/routes/index.ts
touch client/src/routes/publicRoutes.tsx
touch client/src/routes/authRoutes.tsx
touch client/src/routes/userRoutes.tsx
touch client/src/routes/organizerRoutes.tsx
touch client/src/routes/adminRoutes.tsx
touch client/src/routes/types.ts
```

**Step 1.2: Create route type definitions**
```typescript
// client/src/routes/types.ts
import type { RouteObject } from 'react-router-dom';
import type { UserRole } from '../types/auth';

export interface ProtectedRouteConfig extends RouteObject {
  allowedRoles?: UserRole[];
  requiresAuth?: boolean;
}

export type RouteConfig = RouteObject | ProtectedRouteConfig;
```

**Step 1.3: Migrate routes one domain at a time**
- Start with smallest: authRoutes (10 routes)
- Then publicRoutes (12 routes)
- Then userRoutes (5 routes)
- Then organizerRoutes (~60 routes)
- Finally adminRoutes (~120 routes)

### Phase 2: Auth Routes (Proof of Concept)

**Step 2.1: Create authRoutes.tsx**
```typescript
import { lazy, createElement } from 'react';
import type { RouteConfig } from './types';

// Lazy load auth pages
const SignIn = lazy(() => import('../pages/auth/SignIn'));
const SignUp = lazy(() => import('../pages/auth/SignUp'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const MagicLinkVerify = lazy(() => import('../pages/auth/MagicLinkVerify'));
const CreateAccount = lazy(() => import('../pages/auth/CreateAccount'));
const OrganizerRegistration = lazy(() => import('../pages/auth/OrganizerRegistration'));
const AttendeeRegistration = lazy(() => import('../pages/auth/AttendeeRegistration'));
const NotFound = lazy(() => import('../pages/NotFound'));

export const authRoutes: RouteConfig[] = [
  { path: 'signin', element: createElement(SignIn) },
  { path: 'signup', element: createElement(SignUp) },
  { path: 'register', element: createElement(SignUp) },
  { path: 'register/organizer', element: createElement(OrganizerRegistration) },
  { path: 'register/attendee', element: createElement(AttendeeRegistration) },
  { path: 'forgot-password', element: createElement(ForgotPassword) },
  { path: 'reset-password', element: createElement(ResetPassword) },
  { path: 'magic-link/verify', element: createElement(MagicLinkVerify) },
  { path: 'create-account', element: createElement(CreateAccount) },
  { path: '*', element: createElement(NotFound) },
];
```

**Step 2.2: Create AuthLayout.tsx**
```typescript
import { Routes, Route, Outlet } from 'react-router-dom';
import { authRoutes } from '../routes/authRoutes';
import { Suspense } from 'react';
import { LoadingSpinner } from '../components/ui/loading-spinner';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {authRoutes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
        </Routes>
        <Outlet />
      </Suspense>
    </div>
  );
};

export default AuthLayout;
```

**Step 2.3: Update App.tsx to use AuthLayout**
```typescript
// Add to App.tsx
import AuthLayout from "./layouts/AuthLayout";

// Replace all /auth/* routes with:
<Route path="/auth/*" element={<AuthLayout />} />
```

**Step 2.4: Test auth routes**
- ✅ Visit `/auth/signin` → Should work
- ✅ Visit `/auth/signup` → Should work
- ✅ Visit `/auth/invalid` → Should show NotFound
- ✅ Check lazy loading in Network tab
- ✅ Test navigation between auth pages

### Phase 3: Public Routes

**Step 3.1: Create publicRoutes.tsx**
```typescript
import { lazy, createElement } from 'react';
import type { RouteConfig } from './types';

const Index = lazy(() => import('../pages/index'));
const About = lazy(() => import('../pages/About'));
const Careers = lazy(() => import('../pages/Careers'));
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('../pages/TermsOfService'));
const CookiePolicy = lazy(() => import('../pages/CookiePolicy'));
const CreateEvent = lazy(() => import('../pages/CreateEvent'));
const CreateEventStepwise = lazy(() => import('../pages/CreateEventStepwise'));
const EventDetails = lazy(() => import('../pages/EventDetails'));
const RegisterEvent = lazy(() => import('../pages/RegisterEvent'));
const Payment = lazy(() => import('../pages/Payment'));
const Confirmation = lazy(() => import('../pages/Confirmation'));
const RegistrationConfirmation = lazy(() => import('../pages/RegistrationConfirmation'));
const PublicEventForm = lazy(() => import('../pages/PublicEventForm'));
const FeedbackPage = lazy(() => import('../pages/FeedbackPage'));
const Support = lazy(() => import('../pages/Support'));
const NotFound = lazy(() => import('../pages/NotFound'));

export const publicRoutes: RouteConfig[] = [
  { path: '/', element: createElement(Index) },
  { path: 'about', element: createElement(About) },
  { path: 'careers', element: createElement(Careers) },
  { path: 'privacy-policy', element: createElement(PrivacyPolicy) },
  { path: 'terms-of-service', element: createElement(TermsOfService) },
  { path: 'cookie-policy', element: createElement(CookiePolicy) },
  { path: 'create-event', element: createElement(CreateEvent) },
  { path: 'create-event-stepwise', element: createElement(CreateEventStepwise) },
  { path: 'event/:id', element: createElement(EventDetails) },
  { path: 'event/:id/register', element: createElement(RegisterEvent) },
  { path: 'event/:id/payment', element: createElement(Payment) },
  { path: 'event/:id/confirmation', element: createElement(Confirmation) },
  { path: 'event/:id/registration-confirmation', element: createElement(RegistrationConfirmation) },
  { path: 'forms/:type/:templateId', element: createElement(PublicEventForm) },
  { path: 'feedback/:token', element: createElement(FeedbackPage) },
  { path: 'support', element: createElement(Support) },
  { path: '*', element: createElement(NotFound) },
];
```

**Step 3.2: Create PublicLayout.tsx**
```typescript
import { Routes, Route, Outlet } from 'react-router-dom';
import { publicRoutes } from '../routes/publicRoutes';
import { Suspense } from 'react';
import { LoadingSpinner } from '../components/ui/loading-spinner';

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {publicRoutes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
        </Routes>
        <Outlet />
      </Suspense>
    </div>
  );
};

export default PublicLayout;
```

### Phase 4: User Routes

**Step 4.1: Create userRoutes.tsx**
```typescript
import { lazy, createElement } from 'react';
import type { RouteConfig } from './types';
import { ProtectedRoute } from '../components/ProtectedRoute';

const UserDashboard = lazy(() => import('../pages/user/UserDashboard'));
const DashboardMyEvent = lazy(() => import('../pages/user/DashboardMyEvent'));
const TicketViewPage = lazy(() => import('../pages/user/TicketViewPage'));
const UserProfilePage = lazy(() => import('../pages/user/UserProfilePage'));
const NotificationPreferencesPage = lazy(() => import('../pages/user/NotificationPreferencesPage'));
const ExhibitorDetails = lazy(() => import('../pages/user/ExhibitorDetails'));

const withProtection = (Component: React.LazyExoticComponent<any>) => {
  return createElement(ProtectedRoute, null, createElement(Component));
};

export const userRoutes: RouteConfig[] = [
  { path: 'dashboard', element: withProtection(UserDashboard) },
  { path: 'event/:id', element: withProtection(DashboardMyEvent) },
  { path: 'tickets/:registrationId', element: withProtection(TicketViewPage) },
  { path: 'profile', element: withProtection(UserProfilePage) },
  { path: 'notification-preferences', element: withProtection(NotificationPreferencesPage) },
];

export const exhibitorRoutes: RouteConfig[] = [
  { path: 'exhibitors/:id', element: createElement(ExhibitorDetails) },
];
```

### Phase 5: Organizer Routes

**Step 5.1: Create organizerRoutes.tsx** (This will be large ~60 routes)
```typescript
import { lazy, createElement } from 'react';
import type { RouteConfig } from './types';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { UserRole } from '../types/auth';

// Dashboard pages
const OrganizerDashboard = lazy(() => import('../pages/organizer/OrganizerDashboard'));
const OnboardingWizard = lazy(() => import('../pages/organizer/OnboardingWizard'));

// Event management pages
const AllEventsPage = lazy(() => import('../pages/organizer/AllEventsPage'));
const UpcomingEventsPage = lazy(() => import('../pages/organizer/UpcomingEventsPage'));
const PastEventsPage = lazy(() => import('../pages/organizer/PastEventsPage'));
// ... etc

const ORGANIZER_ROLES = [UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.ORGANIZER_TELLER, UserRole.SUPERADMIN];
const ORGANIZER_ADMIN_ROLES = [UserRole.ORGANIZER, UserRole.SUPERADMIN];
const ORGANIZER_NON_TELLER_ROLES = [UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.SUPERADMIN];

const withProtection = (Component: React.LazyExoticComponent<any>, roles = ORGANIZER_ROLES) => {
  return createElement(ProtectedRoute, { allowedRoles: roles }, createElement(Component));
};

export const organizerRoutes: RouteConfig[] = [
  // Dashboard
  { path: 'dashboard', element: withProtection(OrganizerDashboard) },
  { path: 'onboarding', element: withProtection(OnboardingWizard, [UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.ORGANIZER_TELLER]) },

  // Events
  { path: 'events', element: withProtection(AllEventsPage) },
  { path: 'events/upcoming', element: withProtection(UpcomingEventsPage) },
  { path: 'events/past', element: withProtection(PastEventsPage) },
  { path: 'events/cancelled', element: withProtection(CancelledEventsPage) },
  { path: 'events/create', element: withProtection(CreateEventPage, ORGANIZER_NON_TELLER_ROLES) },
  { path: 'events/create-standalone', element: withProtection(StandaloneCreateEventPage, ORGANIZER_NON_TELLER_ROLES) },
  { path: 'event/:eventId', element: withProtection(EventManagementPage) },

  // Analytics
  { path: 'analytics', element: withProtection(AnalyticsOverview, ORGANIZER_NON_TELLER_ROLES) },
  { path: 'analytics/events', element: withProtection(EventPerformance, ORGANIZER_NON_TELLER_ROLES) },
  { path: 'analytics/attendees', element: withProtection(AttendeeInsights, ORGANIZER_NON_TELLER_ROLES) },
  { path: 'analytics/revenue', element: withProtection(RevenueReports, ORGANIZER_NON_TELLER_ROLES) },
  { path: 'analytics/test', element: withProtection(TestAnalytics, ORGANIZER_NON_TELLER_ROLES) },

  // ... rest of routes
];
```

### Phase 6: Admin Routes

**Step 6.1: Create adminRoutes.tsx** (This will be the largest ~120 routes)
```typescript
// Similar pattern to organizerRoutes.tsx but for admin pages
```

### Phase 7: Update Layouts to Use Routes

**Step 7.1: Update AdminLayout.tsx**
```typescript
import { Routes, Route, Outlet } from 'react-router-dom';
import { adminRoutes } from '../routes/adminRoutes';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { Suspense } from 'react';
import { LoadingSpinner } from '../components/ui/loading-spinner';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ... existing sidebar logic

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="max-w-7xl w-full mx-auto flex flex-1">
        <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
          <div className="lg:fixed lg:w-64 lg:h-screen lg:overflow-hidden">
            <AdminSidebar isOpen={true} onToggle={handleSidebarToggle} isMobile={isMobile} />
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="px-4 sm:px-6 flex-shrink-0">
            <AdminHeader onMenuToggle={isMobile ? handleMobileMenuClick : undefined} />
          </div>

          <main className="flex-1 px-4 sm:px-6 pt-6 pb-6">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {adminRoutes.map((route, index) => (
                  <Route key={index} path={route.path} element={route.element} />
                ))}
              </Routes>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>

      {/* Mobile Sidebar Overlay - keep existing */}
    </div>
  );
};
```

**Step 7.2: Update OrganizerLayout.tsx** (same pattern)

**Step 7.3: Create UserLayout.tsx** (new file - extract from UserDashboard)

### Phase 8: Final App.tsx Update

**Step 8.1: Replace all routes with layout routes**
```typescript
// Remove 200+ individual route definitions
// Replace with 5 layout routes
<Routes>
  <Route path="/auth/*" element={<AuthLayout />} />
  <Route path="/user/*" element={<UserLayout />} />
  <Route path="/organizer/*" element={<OrganizerLayout />} />
  <Route path="/admin/*" element={<AdminLayout />} />
  <Route path="/*" element={<PublicLayout />} />
</Routes>
```

**Step 8.2: Remove all page imports from App.tsx**

**Step 8.3: Add lazy loading for layouts**

---

## Testing Strategy

### Unit Testing
```bash
# Test each route group individually
npm run test -- routes/authRoutes.test.tsx
npm run test -- routes/publicRoutes.test.tsx
npm run test -- routes/userRoutes.test.tsx
npm run test -- routes/organizerRoutes.test.tsx
npm run test -- routes/adminRoutes.test.tsx
```

### Integration Testing

**Test Cases:**
1. ✅ All existing routes still work (use current route list as test data)
2. ✅ Protected routes redirect to login when not authenticated
3. ✅ Role-based access still works (ORGANIZER can't access /admin)
4. ✅ Navigation state passing still works (location.state)
5. ✅ Query params still work (/user/dashboard?section=tickets)
6. ✅ 404 pages show correctly for invalid routes
7. ✅ Lazy loading works (check Network tab)
8. ✅ Browser back/forward buttons work
9. ✅ Direct URL access works
10. ✅ Redirects work (Tier 0 organizer → event creation)

### Manual Testing Checklist

**Auth Flow:**
- [ ] Login as attendee → redirects to /user/dashboard
- [ ] Login as organizer → redirects to /organizer/dashboard
- [ ] Login as admin → redirects to /admin/dashboard
- [ ] Logout → redirects to /
- [ ] Access protected route while logged out → redirects to /auth/signin

**Navigation:**
- [ ] Navigate between pages within same role
- [ ] Navigate between different role sections (if superadmin)
- [ ] Deep link to specific page works
- [ ] Refresh page maintains state

**Edge Cases:**
- [ ] Invalid route shows NotFound
- [ ] Route with wrong role shows unauthorized or redirects
- [ ] Organizer with Tier 0 → redirects to event creation
- [ ] Organizer with Tier 1 → shows locked dashboard
- [ ] Password reset link with token works
- [ ] Magic link authentication works
- [ ] Event registration flow works end-to-end

---

## Rollback Strategy

### Git Strategy
```bash
# Create feature branch
git checkout -b refactor/route-architecture

# Commit after each phase
git commit -m "Phase 1: Setup routes directory"
git commit -m "Phase 2: Migrate auth routes"
git commit -m "Phase 3: Migrate public routes"
# etc.

# If issues found, rollback to last working phase
git reset --hard HEAD~1
```

### Feature Flag (Optional)
```typescript
// Can add feature flag to switch between old and new routing
const USE_NEW_ROUTING = import.meta.env.VITE_USE_NEW_ROUTING === 'true';

const App = () => {
  return USE_NEW_ROUTING ? <NewRoutingApp /> : <OldRoutingApp />;
};
```

### Deployment Strategy

**Option A: Big Bang (Not Recommended)**
- Deploy all changes at once
- High risk if bugs found

**Option B: Phased Deployment (Recommended)**
1. Deploy Phase 1-2 (auth routes) to staging
2. Test thoroughly
3. Deploy to production
4. Monitor for 24 hours
5. Repeat for each phase

**Option C: Blue-Green Deployment**
- Keep old routing code
- Deploy new routing alongside
- Use feature flag to switch
- Monitor metrics
- Gradually increase traffic to new routing
- Remove old routing after 100% migration

---

## Edge Cases to Handle

### 1. Location State Passing
**Current:** Pages rely on `location.state` for data
```typescript
const successMessage = location.state?.message;
const eventData = location.state?.eventData;
```
**Solution:** Preserved automatically by React Router, no changes needed

### 2. Query Parameters
**Current:** UserDashboard uses `?section=tickets`
```typescript
const searchParams = new URLSearchParams(location.search);
const activeSection = searchParams.get("section") || "home";
```
**Solution:** Preserved automatically, no changes needed

### 3. Dynamic Route Parameters
**Current:** `/event/:id`, `/admin/events/:eventId`
**Solution:** Preserved automatically with `path` property

### 4. Nested Outlet Usage
**Current:** Some layouts may use `<Outlet />` for nested routes
**Solution:** Keep both `<Routes>` and `<Outlet />` in layouts

### 5. ProtectedRoute Component
**Current:** Wraps each protected route individually
**Solution:** Create `withProtection()` helper function in route files

### 6. Role-Based Rendering in Dashboards
**Current:** `AdminDashboard` checks role and renders different components
**Solution:** Keep existing logic, routes only change the routing layer

### 7. Tier-Based Access (Organizer)
**Current:** `OrganizerDashboard` checks tier and redirects/shows different UI
**Solution:** Keep existing logic in dashboard component

### 8. Lazy Loading Page Dependencies
**Current:** Some pages import heavy dependencies (charts, editors)
**Solution:** Lazy load those dependencies within the page component

---

## Performance Impact Analysis

### Before Refactor
- **Initial Bundle:** ~800KB (all routes, all pages loaded)
- **App.tsx:** 395 lines, 60+ imports
- **Route Resolution:** Linear scan through 200+ routes
- **Code Splitting:** None

### After Refactor
- **Initial Bundle:** ~200KB (only App + loaded layout)
- **App.tsx:** 40 lines, 5 imports
- **Route Resolution:** 2-level lookup (layout → page)
- **Code Splitting:** Per layout (5 chunks) + per page (~60 chunks)

### Bundle Size Reduction
```
Layout Chunks:
- PublicLayout.chunk.js: ~50KB (12 public pages)
- AuthLayout.chunk.js: ~40KB (10 auth pages)
- UserLayout.chunk.js: ~80KB (30+ user sections)
- OrganizerLayout.chunk.js: ~200KB (60 organizer pages)
- AdminLayout.chunk.js: ~300KB (120 admin pages)

Total if all loaded: ~670KB (vs 800KB before)
On first visit: ~50-100KB (vs 800KB before)
Savings on first load: ~700KB (87% reduction)
```

---

## Success Criteria

### Must Have (Blocking)
- ✅ All 200+ existing routes work identically
- ✅ No breaking changes to user experience
- ✅ Protected routes still enforce authentication
- ✅ Role-based access still works correctly
- ✅ Navigation state passing still works
- ✅ Zero TypeScript errors
- ✅ Zero runtime errors in console

### Should Have (Important)
- ✅ App.tsx reduced to <50 lines
- ✅ Lazy loading implemented for all layouts
- ✅ Initial bundle reduced by >50%
- ✅ Routes organized by domain in separate files
- ✅ Code splitting working (verify in Network tab)

### Nice to Have (Bonus)
- ✅ Lazy loading per page (not just per layout)
- ✅ Route-level error boundaries
- ✅ Preloading for common routes
- ✅ Route transition animations

---

## Timeline Estimate

**Phase 1 (Setup):** 1 hour
- Create directories and type definitions

**Phase 2 (Auth Routes):** 2 hours
- Migrate 10 auth routes
- Create AuthLayout
- Test thoroughly

**Phase 3 (Public Routes):** 2 hours
- Migrate 12 public routes
- Create PublicLayout
- Test thoroughly

**Phase 4 (User Routes):** 3 hours
- Migrate 5 user routes + sections
- Create UserLayout (new component)
- Handle section-based routing edge case
- Test thoroughly

**Phase 5 (Organizer Routes):** 6 hours
- Migrate ~60 organizer routes
- Update OrganizerLayout
- Test all role variations
- Test tier system

**Phase 6 (Admin Routes):** 8 hours
- Migrate ~120 admin routes
- Update AdminLayout
- Test all role-specific dashboards
- Test service point routes

**Phase 7 (Final Integration):** 2 hours
- Update App.tsx
- Remove old route definitions
- Final testing

**Phase 8 (QA & Bug Fixes):** 4 hours
- Comprehensive testing
- Fix any edge cases
- Performance testing

**Total: 28 hours (3-4 working days)**

---

## Risk Assessment

### High Risk
- ❌ Breaking existing navigation flows
- ❌ Protected routes not working
- ❌ Role checks failing

**Mitigation:**
- Comprehensive test suite
- Phased rollout
- Thorough manual testing
- Rollback plan ready

### Medium Risk
- ⚠️ Lazy loading causing flicker/delays
- ⚠️ Bundle size not reducing as expected
- ⚠️ Missing route edge cases

**Mitigation:**
- Add loading spinners
- Test bundle sizes after each phase
- Create exhaustive route test list

### Low Risk
- ℹ️ TypeScript type issues
- ℹ️ Import path changes
- ℹ️ Lint errors

**Mitigation:**
- Use TypeScript strict mode
- Run linter after each change
- Fix incrementally

---

## Next Steps

1. **Review this plan** - Get stakeholder approval
2. **Create backup branch** - Full snapshot of working code
3. **Start Phase 1** - Setup directory structure
4. **Implement Phase 2** - Auth routes (smallest, safest)
5. **Test Phase 2 thoroughly** - Validate approach
6. **Continue phases** - One at a time with testing
7. **Deploy to staging** - Full QA cycle
8. **Deploy to production** - Phased rollout
9. **Monitor** - Watch for errors, performance issues
10. **Document** - Update onboarding docs with new structure

---

## Questions to Answer Before Starting

1. ✅ Do we want lazy loading per layout or per page? **Per layout initially**
2. ✅ Should we use feature flag for gradual rollout? **Optional, can skip for faster delivery**
3. ✅ Do we need to update documentation? **Yes, after completion**
4. ✅ Should we refactor UserDashboard sections into routes? **Yes, Phase 4**
5. ✅ Do we need performance monitoring in place? **Use existing analytics**

---

## Conclusion

This refactor follows the proven smart-purchase pattern, maintains 100% backward compatibility, and sets up EventKnit for scalable growth. The phased approach allows for safe, incremental progress with rollback capability at each step.

**Ready to proceed when you approve.**
