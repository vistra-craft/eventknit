# Authentication & Onboarding Migration Guide

**Purpose:** Document all authentication and onboarding flow changes required for the unified dashboard implementation.

**Last Updated:** February 2026
**Status:** Planning Phase

---

## Table of Contents

1. [Current Authentication Flow](#current-authentication-flow)
2. [Impact Analysis](#impact-analysis)
3. [Required Changes](#required-changes)
4. [Implementation Plan](#implementation-plan)
5. [Testing Strategy](#testing-strategy)
6. [Migration Checklist](#migration-checklist)

---

## Current Authentication Flow

### Web Application (Current)

#### **Signup Flow:**
```
Step 1: Role Selection (SignUp.tsx line 224-293)
├── User chooses: "Attend events" (ATTENDEE) or "Organize events" (ORGANIZER)
└── Selected role stored in state

Step 2: Email Entry
├── Enter email
├── Social login (Google/Apple) - passes selectedRole
└── Send verification code - passes selectedRole

Step 3: Account Creation
├── Enter personal info + password
├── Create account with selected role
└── Post-registration routing:
    ├── ORGANIZER → /organizer/onboarding or /organizer/dashboard
    ├── ADMIN roles → /admin/dashboard
    └── ATTENDEE → /user/dashboard
```

**Key Files:**
- `client/src/pages/auth/SignUp.tsx` (lines 19-31, 56-61, 130-141)
- `client/src/pages/auth/AttendeeRegistration.tsx`
- `client/src/pages/auth/OrganizerRegistration.tsx`
- `client/src/lib/auth-api.ts` (requestRegistrationCode line 80-85)

#### **Login Flow:**
```
Login (SignIn.tsx + useAuth.ts)
├── Email/password or OAuth
├── Authenticate
└── Post-login routing (useAuth.ts getDashboardRoute line 19-38):
    ├── ORGANIZER/ORGANIZER_STAFF/ORGANIZER_TELLER → /organizer/dashboard
    ├── Check needsOnboarding → /organizer/onboarding
    ├── ADMIN roles → /admin/dashboard
    └── ATTENDEE → /user/dashboard
```

**Key Routing Functions:**
- `useAuth.ts` - `getDashboardRoute()` function (lines 19-38)
- `SignIn.tsx` - OAuth handlers (lines 112-118, 172-179)
- `SignUp.tsx` - Post-registration routing (lines 130-141)
- `MagicLinkVerify.tsx` - Magic link routing (lines 45-49)

### Mobile Application (Current)

#### **Signup Flow:**
```
Simple Signup (signup_screen.dart)
├── No role selection step
├── Enter: firstName, lastName, email, password
├── Register with default role (ATTENDEE assumed)
└── Post-signup: Get.offAllNamed('/home')
```

**Key Files:**
- `lib/presentation/auth/screens/signup_screen.dart` (lines 50-79)
- `lib/controllers/auth_controller.dart`

#### **Login Flow:**
```
Login (login_screen.dart)
├── Email/password or OAuth
├── Authenticate
└── Post-login routing:
    ├── ORGANIZER → Navigate to /organizer layout
    ├── ADMIN → Navigate to /admin layout
    └── ATTENDEE → Navigate to /home (attendee layout)
```

### Backend API (Current)

**Registration Endpoints:**
- `POST /auth/register-code/request` - accepts `role` parameter (ATTENDEE or ORGANIZER)
- `POST /auth/register-code/verify` - creates user with selected role
- `POST /auth/register` - direct registration with role parameter

**Role is set at account creation and stored in database.**

---

## Impact Analysis

### 🔴 **Critical Changes Required**

1. **Role Selection Step Must Be Removed**
   - Current: Users choose ATTENDEE or ORGANIZER during signup
   - New: All users start as ATTENDEE, can upgrade to ORGANIZER later

2. **Post-Registration Routing Must Change**
   - Current: Different dashboards based on signup role choice
   - New: Everyone goes to unified dashboard

3. **Post-Login Routing Must Change**
   - Current: `getDashboardRoute()` splits users by role
   - New: Everyone goes to unified dashboard (except admins)

4. **Onboarding Flow Must Adapt**
   - Current: ORGANIZER signup → onboarding wizard
   - New: ATTENDEE → create first event → onboarding wizard

### ⚠️ **Medium Impact Changes**

5. **OAuth Flows Must Update**
   - Current: Google/Apple signup passes `selectedRole`
   - New: All OAuth signups default to ATTENDEE

6. **Registration API Calls**
   - Current: `requestRegistrationCode(email, selectedRole)`
   - New: `requestRegistrationCode(email)` - no role param

7. **Mobile Signup Simplification**
   - Current: Already simple (no role selection)
   - New: Only routing needs to change

### ✅ **No Changes Required**

- Backend `UserRole` enum (stays ATTENDEE/ORGANIZER)
- Database schema (no migration needed)
- Role switching API (`/user/role-switch/become-organizer`)
- Admin role handling (unchanged)
- Token management (unchanged)

---

## Required Changes

### Change 1: Remove Role Selection from Signup (Web)

**File:** `client/src/pages/auth/SignUp.tsx`

**Current Code:**
```typescript
// Line 19-20
type SelectedRole = 'ATTENDEE' | 'ORGANIZER';
type Step = 'type' | 'email' | 'verify';

// Line 27
const [step, setStep] = useState<Step>('type');

// Line 31
const [selectedRole, setSelectedRole] = useState<SelectedRole>('ATTENDEE');

// Lines 224-293 - Role selection cards
{step === 'type' && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
    {/* Attendee Card */}
    {/* Organizer Card */}
  </div>
)}
```

**New Code:**
```typescript
// Remove SelectedRole type
type Step = 'email' | 'verify';

// Default to email step
const [step, setStep] = useState<Step>('email');

// Remove selectedRole state entirely
// All users register as ATTENDEE

// Remove role selection UI (lines 224-293)
```

**Changes:**
- Remove `'type'` step completely
- Remove `selectedRole` state
- Remove `handleSelectRole` function
- Remove role selection cards UI
- Update step progress indicator (2 steps instead of 3)

---

### Change 2: Update OAuth Hooks (Web)

**File:** `client/src/pages/auth/SignUp.tsx`

**Current Code:**
```typescript
// Lines 45-54
const { signUpWithGoogle, isLoading: isGoogleLoading } = useGoogleAuth({
  role: selectedRole,  // ❌ Remove this
  onError: (err) => setError(err),
});

const { signInWithApple, isLoading: isAppleLoading } = useAppleAuth({
  role: selectedRole,  // ❌ Remove this
  onError: (err) => setError(err),
});
```

**New Code:**
```typescript
const { signUpWithGoogle, isLoading: isGoogleLoading } = useGoogleAuth({
  // No role param - defaults to ATTENDEE in the hook
  onError: (err) => setError(err),
});

const { signInWithApple, isLoading: isAppleLoading } = useAppleAuth({
  // No role param - defaults to ATTENDEE in the hook
  onError: (err) => setError(err),
});
```

**Also Update:**
- `client/src/hooks/useGoogleAuth.ts` - make `role` optional, default to 'ATTENDEE'
- `client/src/hooks/useAppleAuth.ts` - make `role` optional, default to 'ATTENDEE'

---

### Change 3: Update Registration API Call (Web)

**File:** `client/src/pages/auth/SignUp.tsx`

**Current Code:**
```typescript
// Lines 74-76
try {
  await requestRegistrationCode(email, selectedRole);  // ❌ Remove role param
  setStep('verify');
```

**New Code:**
```typescript
try {
  await requestRegistrationCode(email);  // ✅ No role param
  setStep('verify');
```

**Also Update:**
- `client/src/lib/auth-api.ts` - Update `requestRegistrationCode` signature:
  ```typescript
  export const requestRegistrationCode = async (
    email: string
    // Remove role parameter
  ): Promise<ApiResponse<void>> => {
    return apiPost<ApiResponse<void>>('/auth/register-code/request', { email });
  };
  ```

---

### Change 4: Update Post-Registration Routing (Web)

**File:** `client/src/pages/auth/SignUp.tsx`

**Current Code:**
```typescript
// Lines 130-141
// Route based on role
const role = result.data.user.role;
if (role === 'ORGANIZER' || role === 'ORGANIZER_STAFF' || role === 'ORGANIZER_TELLER') {
  const needsOnboarding = typeof (result.data.user as { onboardingCompleted?: boolean }).onboardingCompleted === 'boolean'
    ? !(result.data.user as { onboardingCompleted?: boolean }).onboardingCompleted
    : true;
  navigate(needsOnboarding ? '/organizer/onboarding' : '/organizer/dashboard');
} else if (role === 'SUPERADMIN' || role === 'ADMIN_STAFF' || role === 'MARKETER' || role === 'SUPPORT' || role === 'TELLER') {
  navigate('/admin/dashboard');
} else {
  navigate('/user/dashboard');
}
```

**New Code:**
```typescript
// Unified routing - all non-admin users go to unified dashboard
const role = result.data.user.role;
if (role === 'SUPERADMIN' || role === 'ADMIN_STAFF' || role === 'MARKETER' || role === 'SUPPORT' || role === 'TELLER') {
  navigate('/admin/dashboard');
} else {
  // All other users (ATTENDEE, ORGANIZER, staff) go to unified dashboard
  navigate('/dashboard');  // Or '/home' - whatever you name the unified route
}
```

---

### Change 5: Update getDashboardRoute Function (Web)

**File:** `client/src/hooks/useAuth.ts`

**Current Code:**
```typescript
// Lines 19-38
const getDashboardRoute = useCallback((role: UserRole): string => {
  switch (role) {
    // Admin roles - redirect to admin dashboard
    case UserRole.SUPERADMIN:
    case UserRole.ADMIN_STAFF:
    case UserRole.MARKETER:
    case UserRole.SUPPORT:
    case UserRole.TELLER:
      return '/admin/dashboard';
    // Organizer roles - redirect to organizer dashboard
    case UserRole.ORGANIZER:
    case UserRole.ORGANIZER_STAFF:
    case UserRole.ORGANIZER_TELLER:
      return '/organizer/dashboard';
    // Attendee role - redirect to user dashboard
    case UserRole.ATTENDEE:
    default:
      return '/user/dashboard';
  }
}, []);
```

**New Code:**
```typescript
const getDashboardRoute = useCallback((role: UserRole): string => {
  switch (role) {
    // Admin roles - redirect to admin dashboard
    case UserRole.SUPERADMIN:
    case UserRole.ADMIN_STAFF:
    case UserRole.MARKETER:
    case UserRole.SUPPORT:
    case UserRole.TELLER:
      return '/admin/dashboard';
    // All other users go to unified dashboard
    case UserRole.ORGANIZER:
    case UserRole.ORGANIZER_STAFF:
    case UserRole.ORGANIZER_TELLER:
    case UserRole.ATTENDEE:
    default:
      return '/dashboard';  // Unified dashboard for everyone
  }
}, []);
```

---

### Change 6: Implement New Unified Onboarding (Web & Mobile)

**Critical Change:** Replace role-based onboarding with preference-based personalization flow.

---

## New Onboarding Flow

**Old Approach (Role-Based):**
```
❌ ORGANIZER signup → Forced onboarding wizard → /organizer/dashboard
❌ ATTENDEE signup → No onboarding → /user/dashboard
```

**New Approach (Preference-Based):**
```
✅ ALL new users → Interactive onboarding → Personalized unified dashboard
✅ Collects preferences (not roles)
✅ Optional but encouraged
✅ Under 90 seconds
```

### Flow Overview

```
Sign Up Complete
     ↓
┌────────────────────────────────────────┐
│ Screen 1: Welcome & Intent             │
│ "What brings you here?"                │
│ ☐ Attend events ☐ Organize events     │
└────────────────────────────────────────┘
     ↓
┌────────────────────────────────────────┐
│ Screen 2-3: Personalized Questions     │
│ • Attendee: Interests + Location       │
│ • Organizer: Event types + Profile     │
└────────────────────────────────────────┘
     ↓
┌────────────────────────────────────────┐
│ Screen 4: Feature Tour (3 slides)      │
│ Animated demos of key features         │
└────────────────────────────────────────┘
     ↓
┌────────────────────────────────────────┐
│ Screen 5: Notification Preferences     │
│ Quick toggle: Email, SMS, Push         │
└────────────────────────────────────────┘
     ↓
Unified Dashboard (Personalized)
```

### Key Features

**1. Preference-Based, Not Role-Based**
- Asks "What brings you here?" not "What role are you?"
- Users can select both "Attend" and "Organize"
- No role lock-in

**2. Interactive & Engaging**
- Visual category bubbles (like Spotify onboarding)
- Lottie animations for feature tour
- Confetti when user selects "both"
- Spring animations on interactions

**3. Quick & Optional**
- 5 screens, under 90 seconds
- "Skip" button always visible (except screen 1)
- Progress saved, can resume later

**4. Data Collection**
```typescript
interface OnboardingPreferences {
  intent: "attend" | "organize" | "both";
  eventInterests?: string[];  // For attendees
  organizerEventTypes?: string[];  // For organizers
  location?: { city, country, coordinates };
  searchRadius?: number;
  notificationPreferences: {
    email, push, sms, newsletter
  };
  // ... more fields
}
```

**5. Immediate Personalization**
- Dashboard shows relevant events based on interests
- Recommendations use location + radius
- Notifications follow user preferences

### Implementation Changes

---

### Change 6A: Update Onboarding Check Logic (Web)

**File:** `client/src/hooks/useAuth.ts`

**Current Code:**
```typescript
// Lines 54-72
// Check if organizer needs onboarding
const role = response.data.user.role;
const isOrganizerRole =
  role === 'ORGANIZER' ||
  role === 'ORGANIZER_STAFF' ||
  role === 'ORGANIZER_TELLER';

const needsOnboarding = isOrganizerRole && (
  !("onboardingCompleted" in response.data.user) ||
  !(response.data.user as { onboardingCompleted?: boolean }).onboardingCompleted
);

if (needsOnboarding) {
  navigate('/organizer/onboarding');
} else {
  // Redirect to appropriate dashboard
  const dashboardRoute = getDashboardRoute(response.data.user.role);
  navigate(dashboardRoute);
}
```

**New Code:**
```typescript
// NEW: Check if user needs personalized onboarding (all new users, not just organizers)
const needsOnboarding = !response.data.user.onboardingCompleted;

if (needsOnboarding) {
  // New unified onboarding for ALL users
  navigate('/onboarding/welcome');
} else {
  // Redirect to appropriate dashboard
  const dashboardRoute = getDashboardRoute(response.data.user.role);
  navigate(dashboardRoute);
}
```

**Important Changes:**
- ❌ Remove: Role-based onboarding check
- ❌ Remove: `/organizer/onboarding` route
- ✅ Add: `/onboarding/welcome` route (new unified onboarding)
- ✅ Add: Check `onboardingCompleted` flag for ALL users

---

### Change 6B: Create New Onboarding Routes (Web)

**File:** `client/src/routes/index.tsx`

**Add New Routes:**
```typescript
// Onboarding routes (accessible only if onboardingCompleted = false)
{
  path: '/onboarding',
  element: <OnboardingLayout />,
  children: [
    { path: 'welcome', element: <WelcomeStep /> },
    { path: 'interests', element: <AttendeeInterestsStep /> },
    { path: 'location', element: <AttendeeLocationStep /> },
    { path: 'organizer-type', element: <OrganizerTypeStep /> },
    { path: 'organizer-profile', element: <OrganizerProfileStep /> },
    { path: 'tour', element: <FeatureTourStep /> },
    { path: 'notifications', element: <NotificationPrefsStep /> },
    { path: 'complete', element: <CompletionStep /> },
  ]
}
```

**Remove Old Routes:**
```typescript
// ❌ DELETE THIS:
{ path: '/organizer/onboarding', element: <OnboardingWizard /> }
```

---

### Change 6C: Update Mobile Onboarding (Mobile)

**File:** `lib/presentation/auth/screens/signup_screen.dart`

**Current Code:**
```dart
// Line 74
Get.offAllNamed('/home');
```

**New Code:**
```dart
// Check if onboarding needed
if (user.onboardingCompleted == false) {
  Get.offAllNamed('/onboarding/welcome');
} else {
  Get.offAllNamed('/home');
}
```

**Add Mobile Onboarding Routes:**
```dart
// lib/main.dart
GetPage(
  name: '/onboarding/welcome',
  page: () => OnboardingWelcomeScreen(),
  transition: Transition.fadeIn,
),
// ... other onboarding screens
```

---

### Change 6D: Update Backend User Model

**File:** `server/prisma/schema.prisma`

**Current Schema:**
```prisma
model User {
  // ... existing fields
  onboardingCompleted Boolean? @default(false)
}
```

**Enhanced Schema:**
```prisma
model User {
  // ... existing fields
  onboardingCompleted    Boolean?  @default(false)
  onboardingCompletedAt  DateTime?
  onboardingSkipped      Boolean?  @default(false)
  onboardingPreferences  Json?     // Store all onboarding data
}
```

**Migration:**
```bash
# Server
npx prisma migrate dev --name add_onboarding_preferences
```

---

### Detailed Onboarding Design

**Complete Interactive Flow Documentation:**
📄 See [ONBOARDING_FLOW_DESIGN.md](./ONBOARDING_FLOW_DESIGN.md) for:
- Screen-by-screen UI mockups
- Interactive elements & animations
- Data collection strategy
- Implementation specs (Web + Mobile)
- Success metrics & A/B testing

**Quick Summary:**
- 🎯 **5 screens** in under 90 seconds
- 🎨 **Visual & interactive** (Lottie animations, confetti, spring transitions)
- 🎯 **Personalized** based on preferences (attend, organize, or both)
- ⏩ **Skippable** (but encouraged)
- 💾 **Progress saved** (can resume later)
- 📊 **Data-driven** (immediate personalization of dashboard)

---

### Change 7: Update OAuth Sign-In Routing (Web)

**Files:**
- `client/src/pages/auth/SignIn.tsx` (lines 112-118, 172-179)
- `client/src/pages/auth/MagicLinkVerify.tsx` (lines 45-49)

**Current Pattern (repeated 3+ times):**
```typescript
if (userRole === 'ORGANIZER' || userRole === 'ORGANIZER_STAFF' || userRole === 'ORGANIZER_TELLER') {
  window.location.href = '/organizer/dashboard';
} else if (userRole === 'SUPERADMIN' || userRole === 'ADMIN_STAFF' || userRole === 'MARKETER' || userRole === 'SUPPORT' || userRole === 'TELLER') {
  window.location.href = '/admin/dashboard';
} else {
  window.location.href = '/user/dashboard';
}
```

**New Pattern:**
```typescript
if (userRole === 'SUPERADMIN' || userRole === 'ADMIN_STAFF' || userRole === 'MARKETER' || userRole === 'SUPPORT' || userRole === 'TELLER') {
  window.location.href = '/admin/dashboard';
} else {
  window.location.href = '/dashboard';  // Unified dashboard
}
```

**Apply to:**
- Google OAuth callback (SignIn.tsx line 112-118)
- Apple OAuth callback (SignIn.tsx line 172-179)
- Magic link verification (MagicLinkVerify.tsx line 45-49)

---

### Change 8: Update Mobile Post-Signup Routing

**File:** `lib/presentation/auth/screens/signup_screen.dart`

**Current Code:**
```dart
// Line 74
Get.offAllNamed('/home');
```

**New Code:**
```dart
// Same - mobile already routes to unified home
Get.offAllNamed('/home');
// No change needed! Mobile was already doing this correctly
```

---

### Change 9: Update Mobile Post-Login Routing

**File:** `lib/presentation/auth/screens/login_screen.dart`

**Current Code:**
```dart
// After successful login
if (user.role == UserRole.organizer) {
  Get.offAllNamed('/organizer');
} else if (user.role == UserRole.admin) {
  Get.offAllNamed('/admin');
} else {
  Get.offAllNamed('/home');
}
```

**New Code:**
```dart
// After successful login
if (user.role == UserRole.admin ||
    user.role == UserRole.superadmin ||
    user.role == UserRole.adminStaff) {
  Get.offAllNamed('/admin');
} else {
  // All non-admin users go to unified home
  Get.offAllNamed('/home');
}
```

---

### Change 10: Update Backend Registration Default (Optional)

**File:** `server/src/services/auth.service.ts`

**Current Behavior:**
- Registration endpoint accepts `role` parameter
- Defaults to ATTENDEE if not provided

**Recommendation:**
```typescript
// In registration endpoint
const userRole = role || 'ATTENDEE';  // Always default to ATTENDEE

// Consider deprecating role parameter entirely
// Force all new registrations to ATTENDEE
```

**Migration Notes:**
- Existing `role` parameter can stay for backward compatibility
- Frontend will simply stop sending it
- Backend continues to work with or without it

---

## Implementation Plan

### Phase 1: Preparation (Week 1)

**Day 1-2: Documentation & Planning**
- [ ] Review all auth-related files
- [ ] Create backup branch
- [ ] Document all routes and their purpose
- [ ] Plan rollout strategy

**Day 3-4: Backend Prep (Optional)**
- [ ] Make backend `role` parameter optional
- [ ] Test registration without role param
- [ ] Deploy backend changes to staging

**Day 5: Testing Setup**
- [ ] Create test accounts (ATTENDEE, ORGANIZER, ADMIN)
- [ ] Document test scenarios
- [ ] Set up automated tests

### Phase 2: Web Application (Week 2)

**Day 1: Remove Role Selection**
- [ ] Update `SignUp.tsx` - remove role selection step
- [ ] Update step indicators (2 steps instead of 3)
- [ ] Remove `selectedRole` state
- [ ] Test signup flow

**Day 2: Update OAuth & APIs**
- [ ] Update `useGoogleAuth` hook
- [ ] Update `useAppleAuth` hook
- [ ] Update `requestRegistrationCode` API call
- [ ] Test OAuth flows

**Day 3: Update Routing**
- [ ] Update `getDashboardRoute` function
- [ ] Update post-registration routing
- [ ] Update post-login routing
- [ ] Update onboarding check (all users, not just organizers)

**Day 4: Update OAuth Callbacks**
- [ ] Update Google OAuth callback routing
- [ ] Update Apple OAuth callback routing
- [ ] Update magic link routing
- [ ] Test all authentication methods

**Day 5: Testing & Bug Fixes**
- [ ] Test email/password signup
- [ ] Test Google OAuth signup
- [ ] Test Apple OAuth signup
- [ ] Test magic link login
- [ ] Test existing user login
- [ ] Fix any issues found

### Phase 3: New Onboarding - Web (Week 3)

**Day 1-2: Setup & Welcome Screen**
- [ ] Create `/onboarding` route structure
- [ ] Build `OnboardingLayout` with progress bar
- [ ] Implement Screen 1 (Welcome & Intent)
- [ ] Add confetti animation for "both" selection
- [ ] Add Framer Motion animations

**Day 3: Attendee Path**
- [ ] Implement Screen 2A (Interest selection with bubbles)
- [ ] Implement Screen 3A (Location picker with map)
- [ ] Add animations and interactions
- [ ] Test data collection & storage

**Day 4: Organizer Path**
- [ ] Implement Screen 2B (Event type selection)
- [ ] Implement Screen 3B (Quick profile)
- [ ] Add validation and auto-save
- [ ] Test data collection

**Day 5: Feature Tour & Notifications**
- [ ] Implement Screen 4 (Feature tour carousel)
- [ ] Create Lottie animations for tour
- [ ] Implement Screen 5 (Notification prefs)
- [ ] Implement Screen 6 (Completion with confetti)
- [ ] Test full flow (both paths)

### Phase 4: New Onboarding - Mobile (Week 3-4)

**Day 1-2: Setup & Welcome Screen**
- [ ] Create `/onboarding/welcome` route
- [ ] Build onboarding layout with progress indicator
- [ ] Implement welcome screen with intent selection
- [ ] Add confetti animation

**Day 3: Attendee & Organizer Paths**
- [ ] Implement interest selection screen
- [ ] Implement location picker
- [ ] Implement event type selection
- [ ] Implement quick profile screen
- [ ] Add animations

**Day 4: Feature Tour & Completion**
- [ ] Implement feature tour with swipe gestures
- [ ] Implement notification preferences
- [ ] Implement completion screen
- [ ] Test full flow on both iOS and Android

**Day 5: Integration Testing**
- [ ] Test web + mobile onboarding together
- [ ] Verify data syncing
- [ ] Test skip functionality
- [ ] Test resume later functionality
- [ ] Final QA pass

### Phase 5: Backend & Testing (Week 4)

**Day 1: Backend Updates**
- [ ] Update User model (add onboardingPreferences JSON field)
- [ ] Create Prisma migration
- [ ] Create onboarding API endpoints:
  - [ ] `POST /api/v1/onboarding/progress`
  - [ ] `POST /api/v1/onboarding/complete`
  - [ ] `POST /api/v1/onboarding/skip`
- [ ] Test API endpoints

**Day 2-3: Integration Testing**
- [ ] Test full auth flow: signup → onboarding → dashboard
- [ ] Test onboarding data collection
- [ ] Test personalization based on preferences
- [ ] Test skip and resume functionality
- [ ] Verify existing user login (no onboarding)

**Day 4-5: UX Testing**
- [ ] Run with beta users (5-10 people)
- [ ] Collect feedback on animations
- [ ] Test completion time (target < 90s)
- [ ] Iterate based on feedback

### Phase 6: Deployment (Week 5)

**Day 1: Staging Deployment**
- [ ] Deploy web changes to staging
- [ ] Deploy mobile build to TestFlight/Internal Testing
- [ ] Run full test suite
- [ ] Fix any critical bugs

**Day 2-3: Beta Testing**
- [ ] Invite beta testers
- [ ] Monitor for issues
- [ ] Gather feedback
- [ ] Make adjustments

**Day 4: Production Deployment**
- [ ] Deploy web to production
- [ ] Submit mobile to app stores
- [ ] Monitor error logs
- [ ] Be ready for hotfixes

**Day 5: Post-Deployment**
- [ ] Monitor analytics
- [ ] Track user flows
- [ ] Address any issues
- [ ] Document learnings

---

## Testing Strategy

### Manual Testing Checklist

#### New User Signup (Web)

- [ ] **Email/Password Signup**
  1. Visit signup page
  2. Verify only 2 steps shown (Email → Verify)
  3. Enter email, receive code
  4. Complete profile, create account
  5. Verify redirected to `/dashboard` (not `/user/dashboard`)
  6. Verify role = ATTENDEE in profile

- [ ] **Google OAuth Signup**
  1. Click "Sign up with Google"
  2. Complete Google OAuth
  3. Verify redirected to `/dashboard`
  4. Verify role = ATTENDEE

- [ ] **Apple OAuth Signup**
  1. Click "Sign up with Apple"
  2. Complete Apple OAuth
  3. Verify redirected to `/dashboard`
  4. Verify role = ATTENDEE

#### Existing User Login (Web)

- [ ] **ATTENDEE Login**
  1. Login with ATTENDEE account
  2. Verify redirected to `/dashboard`
  3. Verify can see "My Events" section
  4. Verify "Create Event" button visible

- [ ] **ORGANIZER Login**
  1. Login with ORGANIZER account
  2. Verify redirected to `/dashboard` (not `/organizer/dashboard`)
  3. Verify can see both attending + organizing sections
  4. Verify no forced onboarding

- [ ] **ADMIN Login**
  1. Login with ADMIN account
  2. Verify redirected to `/admin/dashboard`
  3. Verify admin dashboard unchanged

#### Mobile Testing

- [ ] **Signup Flow**
  1. Sign up via mobile app
  2. Verify redirected to unified home
  3. Verify bottom nav has 5 tabs

- [ ] **ATTENDEE Login**
  1. Login as ATTENDEE
  2. Verify unified home loads
  3. Verify "My Events" tab works

- [ ] **ORGANIZER Login**
  1. Login as ORGANIZER
  2. Verify unified home loads
  3. Verify both attending + organizing visible

### Automated Testing

#### Unit Tests (Web)

```bash
# Test getDashboardRoute function
npm test -- useAuth.test.ts

# Test SignUp component
npm test -- SignUp.test.tsx

# Test OAuth hooks
npm test -- useGoogleAuth.test.tsx
npm test -- useAppleAuth.test.tsx
```

#### Integration Tests (Web)

```bash
# E2E signup flow
npm run test:e2e -- signup.spec.ts

# E2E login flows
npm run test:e2e -- login.spec.ts

# OAuth flows
npm run test:e2e -- oauth.spec.ts
```

#### Mobile Tests

```bash
# Unit tests
flutter test test/auth/

# Integration tests
flutter drive --target=test_driver/auth_flow.dart
```

### Regression Testing

**Critical Paths:**
- [ ] Existing users can still login
- [ ] Admins still go to admin dashboard
- [ ] Role switching still works
- [ ] Password reset flow unchanged
- [ ] Email verification unchanged
- [ ] Token refresh works
- [ ] Logout works

---

## Migration Checklist

### Pre-Migration

- [ ] Back up production database
- [ ] Create rollback plan
- [ ] Set up monitoring/alerting
- [ ] Prepare support team

### Web Changes

- [ ] Update `SignUp.tsx` - remove role selection
- [ ] Update `useAuth.ts` - update `getDashboardRoute`
- [ ] Update `useGoogleAuth.ts` - make role optional
- [ ] Update `useAppleAuth.ts` - make role optional
- [ ] Update `auth-api.ts` - remove role from requestRegistrationCode
- [ ] Update `SignIn.tsx` - update OAuth callback routing
- [ ] Update `MagicLinkVerify.tsx` - update routing
- [ ] Update all hardcoded dashboard routes

### Mobile Changes

- [ ] Update `login_screen.dart` - update post-login routing
- [ ] Update `auth_controller.dart` - update routing logic
- [ ] Test signup flow
- [ ] Test login flow

### Backend Changes (Optional)

- [ ] Make `role` parameter optional in registration endpoints
- [ ] Test backward compatibility
- [ ] Update API documentation

### Testing

- [ ] Run all unit tests
- [ ] Run all integration tests
- [ ] Manual testing on staging
- [ ] Beta user testing
- [ ] Load testing
- [ ] Security audit

### Deployment

- [ ] Deploy backend (if changes made)
- [ ] Deploy web frontend
- [ ] Submit mobile apps
- [ ] Monitor error rates
- [ ] Monitor user flows
- [ ] Be ready for hotfixes

### Post-Deployment

- [ ] Monitor analytics for 48 hours
- [ ] Check support tickets
- [ ] Verify no increase in auth errors
- [ ] Gather user feedback
- [ ] Document any issues

---

## Common Pitfalls & Solutions

| Issue | Solution |
|-------|----------|
| Users expect role selection | Add messaging: "Start as attendee, upgrade anytime" |
| Existing ORGANIZER users confused | Show banner explaining unified dashboard |
| Deep links to `/organizer/*` break | Set up redirects to `/dashboard` |
| Mobile routing conflicts | Ensure `Get.offAllNamed('/home')` goes to UnifiedLayout |
| OAuth returns wrong role | Ensure hooks default to ATTENDEE |
| Onboarding triggered on every login | Remove onboarding check from login flow |

---

## Rollback Plan

If critical issues arise:

1. **Revert Frontend**
   ```bash
   git revert <commit-hash>
   npm run build
   # Deploy previous version
   ```

2. **Backend Stays Unchanged**
   - No database changes, so backend is fine
   - Old frontend can still call backend

3. **Mobile Rollback**
   - Submit new build to app stores
   - Or use rollout percentage (Google Play/TestFlight)

4. **Communication**
   - Notify users of temporary issue
   - Explain when fix will be deployed

---

## Success Metrics

**Quantitative:**
- [ ] 0% increase in auth errors
- [ ] Signup completion rate unchanged or improved
- [ ] Login success rate unchanged
- [ ] Mobile app crash rate unchanged

**Qualitative:**
- [ ] No support tickets about "missing role selection"
- [ ] Users find unified dashboard intuitive
- [ ] No negative feedback about routing changes

---

## Related Documentation

- [UNIFIED_DASHBOARD_PLAN.md](./UNIFIED_DASHBOARD_PLAN.md) - Overall unified dashboard strategy
- [TERMINOLOGY_STRATEGY.md](./TERMINOLOGY_STRATEGY.md) - UI terminology guidelines
- [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) - Current auth system documentation

---

**Status:** ✅ READY FOR REVIEW

**Next Steps:**
1. Review this migration guide with team
2. Estimate effort for each change
3. Create development tasks
4. Begin Phase 1 implementation
