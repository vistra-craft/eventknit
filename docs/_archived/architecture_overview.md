---
name: EventKnit Architecture Overview
description: Full-stack architecture - routing, layouts, token handling, middleware patterns for the EventKnit event management platform
type: project
---

## Client Architecture

**Routing (React Router v6):**
- Root config in `client/src/App.tsx` with nested routes
- Route files in `client/src/routes/` — authRoutes, userRoutes, organizerRoutes, adminRoutes, publicRoutes
- `ProtectedRoute` — checks auth + role + organizer approval status, redirects by role
- `GuestRoute` — wraps auth pages, redirects authenticated users to their dashboard
- Lazy loading with Suspense + route-aware skeleton loaders

**Provider Hierarchy:** QueryClientProvider → ThemeProvider → AuthProvider → BrowserRouter → RoleViewWrapper

**Layouts (`client/src/layouts/`):**
- `AuthLayout` — two-panel (signin/signup) or centered card (forgot/reset password)
- `PublicLayout` — public pages with UnifiedNavbar
- `UserLayout` — attendee dashboard, UnifiedNavbar, pending organizer banner, DashboardModeProvider
- `OrganizerLayout` — sidebar (264px) + header + main content, responsive mobile overlay
- `AdminLayout` — similar to organizer, brand accent gradient, max-width 1600px, AdminSidebar + AdminHeader

**Token Handling (Client):**
- Access token in localStorage, refresh token in HttpOnly cookie
- `client/src/lib/api.ts` — core apiRequest with 401 → auto-refresh → retry queue
- Global `isRefreshing` flag + `refreshQueue` prevents concurrent refresh storms
- 30s timeout, credentials: 'include' on all requests
- `setLogoutCallback()` triggers logout when refresh fails
- `window.dispatchEvent(new Event('tokenChange'))` for cross-component sync

**Auth State:** React Context + useReducer in `client/src/contexts/AuthContext.tsx`
- Actions: AUTH_START, AUTH_SUCCESS, AUTH_FAILURE, AUTH_LOGOUT, AUTH_CLEAR_ERROR, UPDATE_USER
- `useAuth` hook provides: login, register, logout, loginForModal, refreshProfile, setAuthFromGuestResponse

## Server Architecture

**Entry:** `server/src/server.ts` → `server/src/app.ts`
**Pattern:** Route → Controller → Service → Prisma/DB

**Middleware Stack (app.ts, in order):**
1. Trust proxy → CORS → Helmet → Morgan → Body parsing (10MB, raw body for Stripe) → Global rate limiter → Swagger → Routes → Error handler → 404 handler

**Route Mounting:** 50+ route groups at `/api/v1/*` in app.ts (lines 193-249)

**Auth Middleware (`server/src/middleware/auth.middleware.ts`):**
- `authenticate` — validates Bearer JWT, attaches user to req, blocks SUSPENDED
- `authorize(...roles)` — role check, ADMIN inherits SUPERADMIN
- `requireMinRole(role)` — hierarchy scoring (SUPERADMIN=10 down to ATTENDEE=1)
- `optionalAuth` — attaches user if token present, doesn't fail if absent

**JWT Utils (`server/src/utils/jwt.ts`):**
- `generateAccessToken(payload)` — signs with jwt.secret, default 1h
- `generateRefreshToken(payload)` — signs with jwt.refreshSecret, default 30d
- `verifyAccessToken/verifyRefreshToken` — signature verification

**Auth Service (`server/src/services/auth.service.ts`):**
- `generateTokens(user)` — creates both tokens
- `saveRefreshToken(userId, token, ip, ua, rememberMe)` — stores in DB, rememberMe doubles expiry (capped 90d)
- `login()` — validates credentials, 5 failed attempts = 30min lockout, audit logging
- `refreshToken()` — OWASP replay detection (revoked token → revoke ALL user tokens), token rotation
- `logout()` — marks token revoked with reason "user_logout"

**RefreshToken DB Model:** id, token (unique+indexed), userId (indexed), expiresAt, revoked, revokedAt, revokedReason, ipAddress, userAgent

**Rate Limiting (`server/src/middleware/rateLimiter.middleware.ts`):**
- Global: 100 req/15min/IP
- Auth: 5 failed req/15min/IP
- IP-based auth: 20 req/15min across all accounts
- Guest registration: 5/hour, Guest payment: 10/hour

**Security Layers:** Admin domain/IP whitelisting, permission middleware (requirePermission, requireAnyPermission), SUPERADMIN/ADMIN bypass granular checks

**Why:** Understanding this architecture is essential for making holistic changes without breaking auth flows, middleware ordering, or role-based access.
**How to apply:** Reference when implementing any feature touching routes, auth, layouts, or API endpoints.
