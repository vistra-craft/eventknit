# Authentication System — Developer Guide

Unified documentation for the EventKnit authentication system across all platforms (Web, Mobile, Backend).

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [File Structure](#file-structure)
3. [User Roles & Hierarchy](#user-roles--hierarchy)
4. [Token Management](#token-management)
5. [Authentication Flows](#authentication-flows)
6. [OAuth Integration](#oauth-integration)
7. [Client Implementation](#client-implementation)
8. [Backend Implementation](#backend-implementation)
9. [Security Features](#security-features)
10. [API Endpoint Reference](#api-endpoint-reference)
11. [Common Patterns & Best Practices](#common-patterns--best-practices)
12. [Database Models](#database-models)
13. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The authentication system uses JWT (JSON Web Tokens) with a dual-token strategy:

- **Access Token**: Short-lived (15 minutes), returned in JSON response body
- **Refresh Token**: Long-lived (7–30 days), sent as HTTP-only `Set-Cookie` header

All clients (web browser, iOS, Android) share the same backend API. The backend is always the source of truth — clients differ only in how they store tokens and render UI.

### Platform Comparison

| Aspect | Web (React) | Mobile (Flutter) |
|--------|-------------|-------------------|
| **State Management** | React Context + useReducer | GetX (reactive observables) |
| **Access Token Storage** | `localStorage` | `FlutterSecureStorage` (encrypted) |
| **Refresh Token Storage** | HTTP-only cookie (automatic) | Extracted from `Set-Cookie` header via Dio interceptor → `FlutterSecureStorage` |
| **Token Refresh** | Fetch interceptor with request queue | Dio `RefreshTokenInterceptor` with request queue |
| **Google Sign-In** | Popup OAuth flow (access_token or id_token) | Native `google_sign_in` SDK → id_token |
| **Apple Sign-In** | Not supported (web) | Native `sign_in_with_apple` SDK (iOS only) |
| **Route Guards** | `<ProtectedRoute>` component | GetX middleware / manual checks |
| **Offline Auth** | N/A (requires internet) | Cached tokens in `FlutterSecureStorage`; session persists offline |

### Key Characteristics

- **Backend**: Express with Prisma ORM, bcrypt for passwords
- **Tokens**: JWT with separate secrets for access/refresh
- **OAuth**: Google, Apple, and Email OAuth (passwordless)
- **Security**: Rate limiting, breach detection, account status management, token revocation

### Authentication Flow Diagram

```
                                    ┌─────────────────┐
                                    │   User Action   │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
            ┌───────────────┐      ┌─────────────────┐      ┌─────────────────┐
            │  Email/Pass   │      │  OAuth (Google  │      │  Email OAuth    │
            │    Login      │      │   or Apple)     │      │  (Passwordless) │
            └───────┬───────┘      └────────┬────────┘      └────────┬────────┘
                    │                       │                        │
                    └───────────────────────┼────────────────────────┘
                                            │
                                            ▼
                                 ┌─────────────────────┐
                                 │   Backend Auth      │
                                 │   Service           │
                                 └──────────┬──────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
          ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
          │ Generate Access │    │ Generate Refresh│    │ Store Refresh   │
          │     Token       │    │     Token       │    │  Token in DB    │
          └────────┬────────┘    └────────┬────────┘    └─────────────────┘
                   │                      │
                   ▼                      ▼
          ┌─────────────────┐    ┌─────────────────┐
          │  Return in JSON │    │ Set HTTP-only   │
          │  Response Body  │    │  Set-Cookie     │
          └────────┬────────┘    └────────┬────────┘
                   │                      │
                   └──────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              │                               │
              ▼                               ▼
    ┌──────────────────┐            ┌──────────────────┐
    │  Web: Store in   │            │  Mobile: Extract │
    │  localStorage    │            │  from Set-Cookie │
    │  (auto-cookie)   │            │  via interceptor │
    └──────────────────┘            └──────────────────┘
```

---

## File Structure

### Server

```
eventknit/server/src/
├── controllers/
│   └── auth.controller.ts         # HTTP request handlers
├── services/
│   ├── auth.service.ts            # Core auth business logic
│   ├── google-auth.service.ts     # Google OAuth verification
│   └── apple-auth.service.ts      # Apple Sign In verification
├── routes/
│   └── auth.routes.ts             # Route definitions
├── middleware/
│   └── auth.middleware.ts         # authenticate, authorize, optionalAuth
├── validations/
│   └── auth.validations.ts       # Joi request validation schemas
├── utils/
│   ├── jwt.ts                     # Token generation/verification
│   └── password.ts                # Hashing, breach checking
└── prisma/
    └── schema.prisma              # User, RefreshToken, etc. models
```

### Web Client (React)

```
eventknit/client/src/
├── types/
│   └── auth.ts                    # User, AuthState, UserRole types
├── contexts/
│   └── AuthContext.tsx            # Global auth state provider
├── hooks/
│   ├── useAuth.ts                 # Main auth hook (login, logout, etc.)
│   ├── useAuthContext.ts          # Context accessor hook
│   └── authReducer.ts             # Auth state reducer
├── lib/
│   ├── api.ts                     # HTTP client with token refresh
│   └── auth-api.ts                # Auth-specific API functions
├── components/
│   └── ProtectedRoute.tsx         # Route guard component
└── pages/auth/
    ├── SignIn.tsx                 # Login page
    ├── SignUp.tsx                 # Registration page
    ├── ForgotPassword.tsx         # Password reset request
    └── ResetPassword.tsx          # Password reset form
```

### Mobile Client (Flutter)

```
eventknit_mobile/lib/
├── domain/
│   ├── entities/
│   │   └── user.dart              # Freezed User entity + AuthTokens + LoginResult
│   ├── repositories/
│   │   └── auth_repository.dart   # Auth repository interface (abstract)
│   └── usecases/auth/
│       ├── login_usecase.dart
│       ├── register_usecase.dart
│       ├── logout_usecase.dart
│       ├── get_current_user_usecase.dart
│       ├── update_profile_usecase.dart
│       ├── forgot_password_usecase.dart
│       ├── change_password_usecase.dart
│       └── social_auth_usecase.dart   # Google + Apple auth
├── data/repositories/
│   └── auth_repository_impl.dart  # Repository implementation (API calls)
├── controllers/
│   └── auth_controller.dart       # GetX auth state controller
├── core/
│   ├── network/
│   │   ├── dio_client.dart        # Dio HTTP client (singleton)
│   │   └── interceptors/
│   │       ├── auth_interceptor.dart           # Adds Bearer token to requests
│   │       ├── refresh_token_interceptor.dart   # Auto-refresh on 401
│   │       └── cookie_token_interceptor.dart    # Extracts refreshToken from Set-Cookie
│   ├── services/
│   │   ├── api_client.dart        # Thin wrapper around DioClient
│   │   └── storage_service.dart   # FlutterSecureStorage (tokens) + SharedPreferences (prefs)
│   └── bindings/
│       └── app_bindings.dart      # GetX dependency injection
└── presentation/auth/screens/
    ├── login_screen.dart          # Login screen
    ├── signup_screen.dart         # Registration screen
    └── forgot_password_screen.dart
```

---

## User Roles & Hierarchy

### Role Definitions

```typescript
enum UserRole {
  // Admin Tier (Platform Staff)
  SUPERADMIN = 'SUPERADMIN',
  ADMIN_STAFF = 'ADMIN_STAFF',
  MARKETER = 'MARKETER',
  SUPPORT = 'SUPPORT',
  TELLER = 'TELLER',

  // Organizer Tier (Event Creators)
  ORGANIZER = 'ORGANIZER',
  ORGANIZER_STAFF = 'ORGANIZER_STAFF',
  ORGANIZER_TELLER = 'ORGANIZER_TELLER',

  // User Tier
  ATTENDEE = 'ATTENDEE',
}
```

### Role Hierarchy (used by `requireMinRole()` middleware)

```
SUPERADMIN (10) → ADMIN_STAFF (8) → MARKETER (7) → SUPPORT (6) → TELLER (5)
→ ORGANIZER (4) → ORGANIZER_STAFF (3) → ORGANIZER_TELLER (2) → ATTENDEE (1)
```

### Account Status

| Status | Can Login | Can Perform Actions |
|--------|-----------|-------------------|
| `ACTIVE` | Yes | Full access |
| `DEACTIVATED` | Yes | Restricted |
| `SUSPENDED` | No | Blocked |

---

## Token Management

### Configuration

```env
JWT_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Token Payload

```typescript
interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;   // Issued at
  exp?: number;   // Expiration
}
```

### Token Storage by Platform

| Token | Web | Mobile | Duration |
|-------|-----|--------|----------|
| Access | `localStorage` | `FlutterSecureStorage` (AES encrypted) | 15 min |
| Refresh | HTTP-only cookie (browser auto-sends) | `FlutterSecureStorage` (extracted from `Set-Cookie` by `CookieTokenInterceptor`) | 7–30 days |

### Why Mobile Needs a Cookie Interceptor

Browsers automatically store and send `Set-Cookie` headers. Mobile HTTP clients (Dio) do not. The `CookieTokenInterceptor` intercepts responses on auth endpoints (`/auth/login`, `/auth/register`, `/auth/google`, `/auth/apple`) and extracts the `refreshToken` from the `Set-Cookie` header, saving it to encrypted storage.

```dart
// core/network/interceptors/cookie_token_interceptor.dart
class CookieTokenInterceptor extends Interceptor {
  static const _authPaths = ['/auth/login', '/auth/register', '/auth/google', '/auth/apple'];

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    if (_authPaths.any((path) => response.requestOptions.path.contains(path))) {
      _extractAndSaveRefreshToken(response);
    }
    handler.next(response);
  }
}
```

### Automatic Token Refresh

Both platforms implement a request-queuing pattern for concurrent 401 responses:

1. First 401 triggers a refresh request (`POST /auth/refresh`)
2. Subsequent 401s during refresh are queued (not duplicated)
3. On refresh success: all queued requests are retried with the new access token
4. On refresh failure: user is logged out

**Web**: Implemented in `client/src/lib/api.ts` with a `refreshQueue` promise array.
**Mobile**: Implemented in `core/network/interceptors/refresh_token_interceptor.dart` with a Dio `QueuedInterceptor`.

---

## Authentication Flows

### 1. Email/Password Login

**Endpoint**: `POST /auth/login`

```
Client                              Server
  │                                    │
  │  POST /auth/login                  │
  │  { email, password, rememberMe }   │
  │ ──────────────────────────────────►│
  │                                    ├── Find user by email
  │                                    ├── Compare password (bcrypt)
  │                                    ├── Check status ≠ SUSPENDED
  │                                    ├── Reset failed login attempts
  │                                    ├── Generate access + refresh tokens
  │                                    ├── Store refresh token in DB
  │                                    │
  │  200 OK                            │
  │  Set-Cookie: refreshToken=xxx      │
  │  { user, accessToken, expiresIn }  │
  │ ◄──────────────────────────────────│
  │                                    │
  ├── Store access token               │
  ├── Navigate to dashboard            │
```

**Remember Me**: When `rememberMe: true`, the refresh token cookie lasts 30 days instead of 7.

### 2. Registration (Code Verification)

**Endpoints**: `POST /auth/register-code/request` → `POST /auth/register-code/verify`

1. User selects role (ATTENDEE or ORGANIZER) and enters email
2. Server sends 6-digit code (10-minute expiry) to email
3. User enters code + password + name → server creates account, returns tokens

Password requirements: 8+ characters, at least one letter and one number.

### 3. Google Sign-In

**Endpoint**: `POST /auth/google`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | Yes | Google OAuth token |
| `tokenType` | string | No | `id_token` (default) or `access_token` |
| `role` | string | No | `ATTENDEE` (default) or `ORGANIZER` |

**Web flow**: Google popup → receives access_token or id_token → sends to backend.
**Mobile flow**: Native `GoogleSignIn()` SDK → receives id_token → sends to backend.

Server verifies the token with Google, then either logs in an existing user (matched by `googleId` or `email`) or creates a new account.

### 4. Apple Sign-In (Mobile iOS Only)

**Endpoint**: `POST /auth/apple`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `authorizationCode` | string | Yes | Apple authorization code |
| `idToken` | string | Yes | Apple identity token |
| `role` | string | No | `ATTENDEE` (default) or `ORGANIZER` |
| `user.name.firstName` | string | No | Only sent on first authorization |
| `user.name.lastName` | string | No | Only sent on first authorization |

Apple only provides the user's name on the **first** authorization. The backend caches it. Subsequent sign-ins only receive the identity token.

### 5. Email OAuth (Passwordless)

**Endpoints**: `POST /auth/email-oauth/request` → `POST /auth/email-oauth/verify`

Code-based passwordless login. Works for both new and existing users — creates account if new, logs in if existing.

### 6. Magic Link Login

**Endpoints**: `POST /auth/magic-link/request` → `GET /auth/magic-link/verify?token=xxx`

Sends a login link via email. Clicking the link auto-authenticates the user.

### 7. Token Refresh

**Endpoint**: `POST /auth/refresh`

The refresh token is read from the `refreshToken` cookie (not the request body). Returns a new access token and rotates the refresh token.

### 8. Password Reset

**Endpoints**: `POST /auth/password/reset-request` → `POST /auth/password/reset-confirm`

1. User submits email → server sends reset link (1-hour expiry)
2. User clicks link → enters new password → server validates token, hashes password, revokes all refresh tokens

The reset-request endpoint always returns success (doesn't reveal if the email exists).

### 9. Logout

**Endpoint**: `POST /auth/logout` (requires auth)

**Web**: Instant client-side logout (clear localStorage, clear state, navigate). Server call is fire-and-forget.
**Mobile**: `AuthController.logout()` calls backend, clears tokens from `FlutterSecureStorage`, resets state. Caller handles navigation.

---

## OAuth Integration

### Google OAuth

Server-side verification supports two token types:

```typescript
// services/google-auth.service.ts
// ID token: verified via https://oauth2.googleapis.com/tokeninfo?id_token=xxx
// Access token: verified via https://www.googleapis.com/oauth2/v3/userinfo

static async authenticateWithGoogle(token, tokenType, role, ip, ua) {
  const googleUser = tokenType === 'id_token'
    ? await this.verifyGoogleIdToken(token)
    : await this.verifyGoogleAccessToken(token);

  // Find by googleId → find by email → create new user
  // Generate tokens, return auth response
}
```

### Apple Sign In

Server-side verification:

```typescript
// services/apple-auth.service.ts
static async authenticateWithApple(idToken, role, userData, ip, ua) {
  // Verify idToken with Apple's JWKS endpoint
  // Extract email and sub (Apple user ID) from token claims
  // Find by appleId → find by email → create new user
  // Use userData.name on first auth (Apple only sends name once)
}
```

### Native SDK Setup

**Google Sign-In**:
- iOS: Add `GoogleService-Info.plist` from Firebase Console
- Android: Add `google-services.json` from Firebase Console

**Apple Sign-In**:
- iOS only: Add "Sign in with Apple" capability in Xcode → Runner → Signing & Capabilities

---

## Client Implementation

### Web (React)

**Auth state** is managed via React Context with a reducer:

```typescript
// hooks/useAuth.ts — key methods
const useAuth = () => {
  const login = async (email, password, rememberMe) => {
    dispatch({ type: 'AUTH_START' });
    const response = await authApi.login({ email, password, rememberMe });
    if (response.success) {
      dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
      setAccessToken(response.data.accessToken);
      navigate(getDashboardRoute(user.role));
    }
  };

  const logout = () => {
    removeAccessToken();
    dispatch({ type: 'AUTH_LOGOUT' });
    navigate('/', { replace: true });
    authApi.logout().catch(() => {}); // Fire-and-forget
  };
};
```

**Route protection** uses a `<ProtectedRoute>` component:

```tsx
<Route path="/organizer/dashboard" element={
  <ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF]}>
    <OrganizerDashboard />
  </ProtectedRoute>
} />
```

### Mobile (Flutter)

**Auth state** is managed via a GetX `AuthController`:

```dart
// controllers/auth_controller.dart — key pattern
class AuthController extends GetxController {
  final Rx<User?> user = Rx<User?>(null);
  final RxBool isAuthenticated = false.obs;
  final RxBool isLoading = false.obs;
  final RxString error = ''.obs;

  Future<bool> login({required String email, required String password}) async {
    isLoading.value = true;
    error.value = '';
    final result = await _loginUseCase(email: email, password: password);
    final success = result.fold(
      (failure) { error.value = failure.message; return false; },
      (loginResult) { user.value = loginResult.user; isAuthenticated.value = true; return true; },
    );
    isLoading.value = false;
    return success;
  }
}
```

**Social auth** uses native SDKs:

```dart
// Google: Native SDK → id_token → POST /auth/google
Future<bool> googleSignIn() async {
  final googleUser = await GoogleSignIn().signIn();
  final idToken = (await googleUser.authentication).idToken;
  final result = await _socialAuthUseCase.googleAuth(idToken: idToken);
  // Handle result...
}

// Apple: Native SDK → authorizationCode + identityToken → POST /auth/apple
Future<bool> appleSignIn() async {
  final credential = await SignInWithApple.getAppleIDCredential(
    scopes: [AppleIDAuthorizationScopes.email, AppleIDAuthorizationScopes.fullName],
  );
  final result = await _socialAuthUseCase.appleAuth(
    authorizationCode: credential.authorizationCode,
    idToken: credential.identityToken!,
    firstName: credential.givenName,
    lastName: credential.familyName,
  );
  // Handle result...
}
```

**Interceptor chain** (order matters):

```
Request → CookieTokenInterceptor → AuthInterceptor → RefreshTokenInterceptor → LoggingInterceptor → Server
```

1. `CookieTokenInterceptor`: On response, extracts `refreshToken` from `Set-Cookie` on auth endpoints
2. `AuthInterceptor`: Adds `Authorization: Bearer <accessToken>` header to all requests
3. `RefreshTokenInterceptor`: On 401, queues requests, refreshes token, retries. On refresh failure → navigates to login
4. `LoggingInterceptor`: Debug logging

**Role-based routing** on login:

```dart
// login_screen.dart
void _routeBasedOnRole(dynamic user) {
  final role = user.role.value;
  if (role == 'SUPERADMIN' || role == 'ADMIN_STAFF') Get.offAllNamed('/admin');
  else if (role == 'ORGANIZER' || ...) Get.offAllNamed('/organizer');
  else Get.offAllNamed('/home');
}
```

---

## Backend Implementation

### Auth Service

The `AuthService` class contains all core auth business logic:

```typescript
// Key methods
AuthService.login(credentials, ip, userAgent, rememberMe) → { user, accessToken, refreshToken, expiresIn }
AuthService.register(data) → { user, accessToken, refreshToken }
AuthService.requestRegistrationCode(email, role) → void
AuthService.verifyRegistrationCode(email, code, password, firstName, lastName) → { user, accessToken, refreshToken }
AuthService.refreshToken(token, ip, userAgent) → { accessToken, refreshToken, expiresIn }
AuthService.logout(refreshToken) → void
AuthService.forgotPassword(email, ip) → void
AuthService.resetPassword(token, password, ip) → void
AuthService.changePassword(userId, currentPassword, newPassword) → void
AuthService.setPassword(userId, password) → void
AuthService.requestEmailOAuthCode(email, role) → void
AuthService.verifyEmailOAuthCode(email, code, ip, userAgent) → { user, accessToken, refreshToken }
AuthService.requestMagicLink(email) → void
AuthService.verifyMagicLink(token, ip, userAgent) → { user, accessToken, refreshToken }
AuthService.requestEmailChange(userId, newEmail, currentPassword) → void
AuthService.confirmEmailChange(userId, code) → { newEmail }
```

### Auth Controller Response Pattern

All auth endpoints that return tokens follow this pattern:

```typescript
// Set refresh token as HttpOnly cookie (NEVER in response body)
res.cookie('refreshToken', result.refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (30 days if rememberMe)
});

// Return access token and user in response body
res.json({
  success: true,
  data: {
    user: result.user,
    accessToken: result.accessToken,
    expiresIn: result.expiresIn,   // seconds until expiry
  },
});
```

### Auth Middleware

```typescript
// middleware/auth.middleware.ts
authenticate      // Verifies Bearer token, attaches req.user, rejects if invalid
authorize(...roles) // Checks req.user.role is in allowed roles
optionalAuth      // Same as authenticate but continues silently if no token
requireMinRole(role) // Checks req.user.role meets minimum hierarchy level
```

### Validation

All auth endpoints use Joi validation via `validate()` middleware. See `server/src/validations/auth.validations.ts` for exact schemas.

Password regex: `^(?=.*[a-zA-Z])(?=.*\d).{8,128}$` — at least 8 chars, one letter, one number.

---

## Security Features

### Password Security

- **Hashing**: bcrypt with 12 salt rounds
- **Breach checking**: HaveIBeenPwned API with k-anonymity (only SHA-1 prefix sent)
- **Requirements**: 8+ chars, at least one letter, one number

### Rate Limiting

| Limiter | Scope | Limit |
|---------|-------|-------|
| `ipAuthRateLimiter` | All auth routes | 100 requests per 15 min per IP |
| `authRateLimiter` | Login, register, OAuth | 5 attempts per minute |

### Cookie Security

```typescript
{
  httpOnly: true,      // JavaScript cannot access (XSS protection)
  secure: true,        // HTTPS only in production
  sameSite: 'strict',  // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000,
}
```

### Token Revocation

All user refresh tokens are revoked on:
- Password change
- Password reset
- Account suspension
- Manual admin action

```typescript
AuthService.revokeAllUserTokens(userId, reason)
```

### Failed Login Tracking

- Each failed attempt increments `failedLoginAttempts`
- After 10 failures, the account is automatically suspended
- Successful login resets the counter

### Mobile-Specific Security

- **Encrypted token storage**: `FlutterSecureStorage` uses AES encryption backed by Android Keystore / iOS Keychain
- **Token migration**: On first launch after the security upgrade, tokens are migrated from `SharedPreferences` to `FlutterSecureStorage`
- **Certificate pinning**: Planned for production
- **Biometric unlock**: Planned for sensitive operations

### Error Sanitization

The mobile login screen sanitizes auth error messages to avoid leaking whether an email or password was incorrect:

```dart
// If message contains 'password', 'email', 'credential', etc.
// → Returns generic "Invalid email or password"
```

---

## API Endpoint Reference

All endpoints are prefixed with `/api/v1/auth`.

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/login` | Email/password login |
| POST | `/register` | Legacy registration |
| POST | `/signup` | Alias for `/register` |
| POST | `/register-code/request` | Request registration verification code |
| POST | `/register-code/verify` | Verify code and create account |
| POST | `/email-oauth/request` | Request passwordless login code |
| POST | `/email-oauth/verify` | Verify passwordless code |
| POST | `/google` | Google OAuth login/registration |
| POST | `/apple` | Apple Sign In login/registration |
| POST | `/refresh` | Refresh access token (cookie-based) |
| GET | `/verify-email` | Verify email via token link |
| POST | `/verify-email/request` | Request email verification code |
| POST | `/verify-email/confirm` | Confirm email with code |
| POST | `/password/reset-request` | Request password reset |
| POST | `/forgot-password` | Alias for reset-request |
| POST | `/password/reset-confirm` | Reset password with token |
| POST | `/reset-password` | Alias for reset-confirm |
| POST | `/create-account` | Create account from invitation |
| POST | `/resend-invitation` | Resend invitation email |
| POST | `/magic-link/request` | Request magic link login |
| GET | `/magic-link/verify` | Verify magic link token |
| GET | `/public-key` | Get Ed25519 public key for offline ticket verification |

### Protected Endpoints (require `Authorization: Bearer <token>`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/logout` | Logout (revokes refresh token) |
| GET | `/me` | Get current user profile |
| GET | `/profile` | Alias for `/me` |
| PUT | `/profile` | Update profile (multipart/form-data for avatar) |
| POST | `/email/request-change` | Request email change (sends code to new email) |
| POST | `/email/confirm-change` | Confirm email change with code |
| POST | `/password/change` | Change password (requires current password) |
| POST | `/password/setup` | Set password for OAuth/guest users (no existing password) |

### Standard Auth Response (Token-Issuing Endpoints)

Applies to: login, register, register-code/verify, email-oauth/verify, google, apple, create-account, magic-link/verify.

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ATTENDEE",
      "status": "ACTIVE",
      "isEmailVerified": true,
      "hasPassword": true,
      "onboardingCompleted": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

The `refreshToken` is NOT in the response body. It is set as a `Set-Cookie` HTTP header:

```
Set-Cookie: refreshToken=eyJhbGciOiJIUzI1NiIs...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

---

## Common Patterns & Best Practices

### Always Check Auth Before Actions

**Web:**
```typescript
const { isAuthenticated } = useAuth();
if (!isAuthenticated) navigate('/auth/signin');
```

**Mobile:**
```dart
final auth = Get.find<AuthController>();
if (!auth.isLoggedIn) Get.toNamed('/login');
```

### Role-Based UI

**Web:**
```tsx
{user?.role === UserRole.ORGANIZER && <OrganizerFeatures />}
```

**Mobile:**
```dart
if (auth.currentUser?.role == UserRole.ORGANIZER) showOrganizerUI();
```

### Protect Sensitive Backend Operations

```typescript
// Always verify the user owns the resource
if (event.organizerId !== req.user.id) {
  throw new AuthorizationError('You do not own this event');
}
```

---

## Database Models

### User

```prisma
model User {
  id                  String      @id @default(uuid())
  email               String      @unique
  password            String?     // Optional for OAuth users

  firstName           String?
  lastName            String?
  phoneNumber         String?
  avatar              String?

  // OAuth identifiers
  googleId            String?     @unique
  appleId             String?     @unique

  // Account
  role                UserRole    @default(ATTENDEE)
  status              UserStatus  @default(ACTIVE)
  isEmailVerified     Boolean     @default(false)
  emailVerifiedAt     DateTime?

  // Organizer specific
  organizationName    String?
  onboardingCompleted Boolean?

  // Security
  failedLoginAttempts Int         @default(0)
  lastLoginAt         DateTime?

  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  // Relations
  refreshTokens       RefreshToken[]
  emailVerifications  EmailVerification[]
  passwordResets      PasswordReset[]
}
```

### RefreshToken

```prisma
model RefreshToken {
  id        String    @id @default(uuid())
  userId    String
  token     String    @unique
  expiresAt DateTime
  revokedAt DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Supporting Models

```prisma
model EmailVerification {
  id         String    @id @default(uuid())
  email      String
  code       String    // 6-digit code
  role       UserRole?
  verified   Boolean   @default(false)
  expiresAt  DateTime
  verifiedAt DateTime?
  createdAt  DateTime  @default(now())
}

model PasswordReset {
  id        String    @id @default(uuid())
  userId    String
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## Troubleshooting

### Common Issues

**"Token expired" on every request**
- Check `JWT_SECRET` matches between generation and verification
- Verify system clocks are synchronized
- Check `JWT_EXPIRES_IN` format ("15m", not "15")

**Refresh token not working (Web)**
- Ensure `credentials: 'include'` on fetch calls
- Check CORS allows credentials (`Access-Control-Allow-Credentials: true`)
- Verify `sameSite` cookie setting matches your domain setup

**Refresh token not working (Mobile)**
- Verify `CookieTokenInterceptor` is registered in `DioClient` BEFORE `AuthInterceptor`
- Check `Set-Cookie` header is present in auth responses (not stripped by proxy)
- Verify `StorageService` is correctly reading/writing to `FlutterSecureStorage`

**Session lost after 15 minutes (Mobile)**
- The `CookieTokenInterceptor` is likely not extracting the refresh token from `Set-Cookie`
- Check the interceptor chain order in `dio_client.dart`

**Google Sign-In fails on mobile**
- Ensure `GoogleService-Info.plist` (iOS) or `google-services.json` (Android) is configured
- The backend expects `{ token: "...", tokenType: "id_token" }` — not `{ idToken: "..." }`

**Apple Sign-In not showing**
- Apple Sign-In is iOS only — hidden on Android via `Platform.isIOS` check
- Requires "Sign in with Apple" capability in Xcode

**OAuth creates duplicate accounts**
- Check email matching logic: the service looks up by `googleId`/`appleId` first, then by `email`
- If a user registered with email first, OAuth should link the accounts

**"401 Unauthorized" immediately after login (Mobile)**
- Verify `AuthInterceptor` reads the access token from `FlutterSecureStorage` (not the old `SharedPreferences`)
- Check the one-time migration from `SharedPreferences` to `FlutterSecureStorage` ran correctly

**Android emulator cannot reach localhost**
- Use `10.0.2.2` instead of `localhost`, or run `adb reverse tcp:3001 tcp:3001`

### Debug Tips

**Web:**
```typescript
console.log('Access token:', getAccessToken());
console.log('Auth state:', { user, isAuthenticated, isLoading });
```

**Mobile:**
```dart
// Check stored tokens
final storage = StorageService();
print('Access token: ${await storage.getAccessToken()}');
print('Refresh token: ${await storage.getRefreshToken()}');
```

**Server:**
```typescript
console.log('Refresh token cookie:', req.cookies.refreshToken);
console.log('Set-Cookie header:', res.getHeaders()['set-cookie']);
```

---

## Related Documentation

- [Swagger API Docs](http://localhost:3001/api-docs) — Interactive API documentation
- [Auth Security Gaps](../server/docs/AUTH_SECURITY_GAPS.md) — Security audit and fixes
- [Mobile Technical Guide](../../eventknit_mobile/docs/TECHNICAL_GUIDE.md) — Mobile architecture reference

---

*Last updated: February 2026*
