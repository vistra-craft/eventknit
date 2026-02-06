# Authentication System - Developer Guide

This document provides a comprehensive walkthrough of the EventKnit authentication system, covering JWT tokens, OAuth integration, password security, and the complete auth flow.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [File Structure](#file-structure)
3. [User Roles & Hierarchy](#user-roles--hierarchy)
4. [Token Management](#token-management)
5. [Authentication Flows](#authentication-flows)
6. [Frontend Implementation](#frontend-implementation)
7. [Backend Implementation](#backend-implementation)
8. [Security Features](#security-features)
9. [OAuth Integration](#oauth-integration)
10. [Protected Routes](#protected-routes)
11. [Common Patterns & Best Practices](#common-patterns--best-practices)

---

## Architecture Overview

The authentication system uses JWT (JSON Web Tokens) with a dual-token strategy:

- **Access Token**: Short-lived (15 minutes), stored in localStorage
- **Refresh Token**: Long-lived (7-30 days), stored in HTTP-only cookie

### Key Characteristics

- **Frontend**: React Context + useReducer for global auth state
- **Backend**: Express with Prisma ORM, bcrypt for passwords
- **Tokens**: JWT with separate secrets for access/refresh
- **OAuth**: Google, Apple, and custom Email OAuth (passwordless)
- **Security**: Rate limiting, breach detection, account status management

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
          │    Response     │    │    Cookie       │
          └────────┬────────┘    └────────┬────────┘
                   │                      │
                   └──────────┬───────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │  Frontend receives  │
                   │  stores access token│
                   │  in localStorage    │
                   └─────────────────────┘
```

---

## File Structure

```
eventknit/
├── client/src/
│   ├── types/
│   │   └── auth.ts                    # User, AuthState, UserRole types
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx            # Global auth state provider
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                 # Main auth hook (login, logout, etc.)
│   │   ├── useAuthContext.ts          # Context accessor hook
│   │   └── authReducer.ts             # Auth state reducer
│   │
│   ├── lib/
│   │   ├── api.ts                     # HTTP client with token refresh
│   │   └── auth-api.ts                # Auth-specific API functions
│   │
│   ├── components/
│   │   └── ProtectedRoute.tsx         # Route guard component
│   │
│   └── pages/auth/
│       ├── SignIn.tsx                 # Login page
│       ├── SignUp.tsx                 # Registration page
│       ├── ForgotPassword.tsx         # Password reset request
│       └── ResetPassword.tsx          # Password reset form
│
└── server/src/
    ├── controllers/
    │   └── auth.controller.ts         # HTTP request handlers
    │
    ├── services/
    │   ├── auth.service.ts            # Core auth business logic
    │   └── google-auth.service.ts     # Google OAuth verification
    │
    ├── routes/
    │   └── auth.routes.ts             # Route definitions
    │
    ├── middleware/
    │   └── auth.middleware.ts         # authenticate, authorize middlewares
    │
    ├── utils/
    │   ├── jwt.ts                     # Token generation/verification
    │   └── password.ts                # Hashing, breach checking
    │
    └── prisma/
        └── schema.prisma              # User, RefreshToken, etc. models
```

---

## User Roles & Hierarchy

### Role Definitions

```typescript
// types/auth.ts
enum UserRole {
  // Admin Tier (Platform Staff)
  SUPERADMIN = 'SUPERADMIN',           // Full access, manage all
  ADMIN_STAFF = 'ADMIN_STAFF',         // Admin operations
  MARKETER = 'MARKETER',               // Marketing features
  SUPPORT = 'SUPPORT',                 // Customer support
  TELLER = 'TELLER',                   // Financial operations

  // Organizer Tier (Event Creators)
  ORGANIZER = 'ORGANIZER',             // Full organizer access
  ORGANIZER_STAFF = 'ORGANIZER_STAFF', // Limited organizer access
  ORGANIZER_TELLER = 'ORGANIZER_TELLER', // Organizer financial ops

  // User Tier
  ATTENDEE = 'ATTENDEE',               // Event attendees
}
```

### Role Hierarchy

Used for `requireMinRole()` middleware:

```typescript
// server/src/middleware/auth.middleware.ts
const roleHierarchy: Record<UserRole, number> = {
  SUPERADMIN: 10,
  ADMIN_STAFF: 8,
  MARKETER: 7,
  SUPPORT: 6,
  TELLER: 5,
  ORGANIZER: 4,
  ORGANIZER_STAFF: 3,
  ORGANIZER_TELLER: 2,
  ATTENDEE: 1,
};
```

### Account Status

```typescript
enum UserStatus {
  ACTIVE = 'ACTIVE',           // Full access
  DEACTIVATED = 'DEACTIVATED', // Can auth, restricted actions
  SUSPENDED = 'SUSPENDED',     // Cannot authenticate
}
```

---

## Token Management

### Token Configuration

```typescript
// Environment variables
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
  iat?: number;  // Issued at (auto-added)
  exp?: number;  // Expiration (auto-added)
}
```

### Token Generation

```typescript
// server/src/utils/jwt.ts
import jwt from 'jsonwebtoken';

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn // "15m"
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn // "7d"
  });
};
```

### Token Storage Strategy

| Token | Storage | Accessible By | Duration |
|-------|---------|---------------|----------|
| Access | localStorage | JavaScript | 15 minutes |
| Refresh | HTTP-only cookie | Server only | 7-30 days |

### Frontend Token Management

```typescript
// client/src/lib/api.ts
const ACCESS_TOKEN_KEY = 'accessToken';

export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setAccessToken = (token: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const removeAccessToken = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};
```

### Automatic Token Refresh

```typescript
// client/src/lib/api.ts
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const refreshAccessToken = async (): Promise<string> => {
  if (isRefreshing) {
    // Queue this request while refresh is in progress
    return new Promise((resolve) => {
      refreshQueue.push(resolve);
    });
  }

  isRefreshing = true;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Send HTTP-only cookie
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    const newToken = data.data.accessToken;

    setAccessToken(newToken);

    // Process queued requests
    refreshQueue.forEach(cb => cb(newToken));
    refreshQueue = [];

    return newToken;
  } finally {
    isRefreshing = false;
  }
};
```

---

## Authentication Flows

### 1. Email/Password Login

```
┌──────────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                                │
└──────────────────────────────────────────────────────────────────┘

Frontend (SignIn.tsx)
├── User enters email + password
├── Optional: Check "Remember me"
└── Submit → useAuth().login(email, password, rememberMe)

useAuth Hook
├── dispatch({ type: 'AUTH_START' })
├── authApi.login({ email, password, rememberMe })
└── POST /auth/login

Backend (AuthController)
├── Extract credentials from body
├── AuthService.login(email, password, ipAddress, userAgent)
│   ├── Find user by email
│   ├── Compare password (bcrypt)
│   ├── Check status !== SUSPENDED
│   ├── Reset failed login attempts
│   ├── Generate access + refresh tokens
│   └── Save refresh token to database
├── Set HTTP-only cookie (refreshToken)
└── Return { user, accessToken, expiresIn }

Frontend receives response
├── dispatch({ type: 'AUTH_SUCCESS', payload: user })
├── setAccessToken(accessToken)
├── Determine dashboard route by role
│   ├── ORGANIZER (needs onboarding) → /organizer/onboarding
│   ├── ORGANIZER (complete) → /organizer/dashboard
│   ├── Admin roles → /admin/dashboard
│   └── ATTENDEE → /user/dashboard
└── navigate(dashboardRoute)
```

### 2. Registration (Code Verification)

```
┌──────────────────────────────────────────────────────────────────┐
│                     REGISTRATION FLOW                            │
└──────────────────────────────────────────────────────────────────┘

Step 1: Role Selection
├── User selects ATTENDEE or ORGANIZER
└── Proceed to step 2

Step 2: Email Verification
├── User enters email
├── POST /auth/register-code/request { email, role }
│   ├── Check email not already ACTIVE
│   ├── Generate 6-digit code (10-min expiry)
│   ├── Store in EmailVerification table
│   └── Send code via email
└── Proceed to step 3

Step 3: Complete Profile
├── User enters:
│   ├── Verification code (6 digits)
│   ├── First name, Last name
│   ├── Password (8+ chars, 1 letter, 1 number)
│   └── Accept terms checkbox
├── POST /auth/register-code/verify
│   ├── Validate code and expiry
│   ├── Check password breach (HaveIBeenPwned)
│   ├── Hash password (bcrypt)
│   ├── Create User with role
│   │   └── ORGANIZER: onboardingCompleted = false
│   ├── Mark verification as verified
│   ├── Generate tokens
│   └── Return { user, accessToken }
├── dispatch({ type: 'AUTH_SUCCESS' })
├── setAccessToken()
└── Navigate to dashboard
```

### 3. Password Reset

```
┌──────────────────────────────────────────────────────────────────┐
│                   PASSWORD RESET FLOW                            │
└──────────────────────────────────────────────────────────────────┘

Request Reset (ForgotPassword.tsx)
├── User enters email
├── POST /auth/password/reset-request { email }
│   ├── Find user by email (silent fail if not found)
│   ├── Generate reset token (1-hour expiry)
│   ├── Store in PasswordReset table
│   └── Send email with reset link
└── Show "Check your email" message

Reset Password (ResetPassword.tsx)
├── User clicks link: /auth/reset-password?token=xxx
├── Validate token presence
├── User enters new password + confirm
├── POST /auth/password/reset-confirm { token, password }
│   ├── Find PasswordReset by token
│   ├── Check expiry (1 hour max)
│   ├── Check password breach
│   ├── Hash new password
│   ├── Update user.password
│   ├── Mark token as used
│   └── Optionally revoke all user tokens
├── Show success message
└── Redirect to /auth/signin
```

### 4. Token Refresh

```
┌──────────────────────────────────────────────────────────────────┐
│                    TOKEN REFRESH FLOW                            │
└──────────────────────────────────────────────────────────────────┘

API Request (any protected endpoint)
├── Include Authorization: Bearer {accessToken}
└── Send request

Backend middleware
├── Verify access token
├── Token expired? → Return 401
└── Token valid? → Process request

Frontend catches 401
├── Check if already refreshing
│   └── YES: Queue request
├── POST /auth/refresh (credentials: include)
│   ├── Extract refreshToken from cookie
│   ├── Verify refresh token JWT
│   ├── Find token in DB (not revoked)
│   ├── Check expiry
│   ├── Generate new access token
│   ├── Generate new refresh token
│   ├── Update refresh token in DB
│   └── Return { accessToken }
├── Set new HTTP-only cookie
├── setAccessToken(newToken)
├── Process queued requests
└── Retry original request
```

### 5. Logout

```
┌──────────────────────────────────────────────────────────────────┐
│                       LOGOUT FLOW                                │
│                   (Hybrid Approach)                              │
└──────────────────────────────────────────────────────────────────┘

Frontend (useAuth.logout)
├── removeAccessToken()                  ← SYNC: Clear localStorage
├── localStorage.removeItem('activeViewRole')
├── dispatch({ type: 'AUTH_LOGOUT' })   ← SYNC: Clear state
├── window.dispatchEvent('tokenChange') ← Notify components
├── navigate('/', { replace: true })    ← SYNC: Navigate immediately
└── authApi.logout().catch(...)         ← ASYNC: Fire-and-forget

Backend (optional, may not complete)
├── Extract refreshToken from cookie
├── Revoke token in database
└── Return 200 OK

Note: Logout is INSTANT for user experience.
Server call is best-effort and non-blocking.
```

---

## Frontend Implementation

### Auth Context & Provider

```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Auth Reducer

```typescript
// hooks/authReducer.ts
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case 'AUTH_CLEAR_ERROR':
      return { ...state, error: null, isLoading: false };

    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };

    default:
      return state;
  }
};
```

### useAuth Hook

```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const { state, dispatch } = useAuthContext();
  const navigate = useNavigate();

  const login = async (email: string, password: string, rememberMe = false) => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await authApi.login({ email, password, rememberMe });

      if (response.success && response.data) {
        const { user, accessToken } = response.data;
        dispatch({ type: 'AUTH_SUCCESS', payload: user });
        setAccessToken(accessToken);

        // Navigate based on role and onboarding status
        const dashboardRoute = getDashboardRoute(user.role, user.onboardingCompleted);
        navigate(dashboardRoute, { replace: true });
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: response.message || 'Login failed' });
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: 'An error occurred' });
    }
  };

  const logout = () => {
    // Immediate client-side logout
    removeAccessToken();
    localStorage.removeItem('activeViewRole');
    dispatch({ type: 'AUTH_LOGOUT' });
    window.dispatchEvent(new Event('tokenChange'));
    navigate('/', { replace: true });

    // Fire-and-forget server call
    authApi.logout().catch(() => {});
  };

  const getDashboardRoute = (role: UserRole, onboardingCompleted?: boolean): string => {
    if (role === UserRole.ORGANIZER && !onboardingCompleted) {
      return '/organizer/onboarding';
    }

    const roleRoutes: Record<UserRole, string> = {
      [UserRole.SUPERADMIN]: '/admin/dashboard',
      [UserRole.ADMIN_STAFF]: '/admin/dashboard',
      [UserRole.MARKETER]: '/admin/dashboard',
      [UserRole.SUPPORT]: '/admin/dashboard',
      [UserRole.TELLER]: '/admin/dashboard',
      [UserRole.ORGANIZER]: '/organizer/dashboard',
      [UserRole.ORGANIZER_STAFF]: '/organizer/dashboard',
      [UserRole.ORGANIZER_TELLER]: '/organizer/dashboard',
      [UserRole.ATTENDEE]: '/user/dashboard',
    };

    return roleRoutes[role] || '/';
  };

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login,
    logout,
    register,
    refreshProfile,
    clearError,
    getDashboardRoute,
  };
};
```

### Auth API Client

```typescript
// lib/auth-api.ts
export const authApi = {
  login: async (credentials: LoginCredentials) => {
    return apiPost<AuthResponse>('/auth/login', credentials);
  },

  register: async (data: RegisterData) => {
    return apiPost<AuthResponse>('/auth/register', data);
  },

  requestRegistrationCode: async (email: string, role: UserRole) => {
    return apiPost('/auth/register-code/request', { email, role });
  },

  verifyRegistrationCode: async (data: VerifyCodeData) => {
    return apiPost<AuthResponse>('/auth/register-code/verify', data);
  },

  getProfile: async () => {
    return apiGet<{ user: User }>('/auth/me');
  },

  logout: async () => {
    return apiPost('/auth/logout', {});
  },

  forgotPassword: async (email: string) => {
    return apiPost('/auth/password/reset-request', { email });
  },

  resetPassword: async (token: string, password: string) => {
    return apiPost('/auth/password/reset-confirm', { token, password });
  },

  googleAuth: async (token: string, tokenType: 'id_token' | 'access_token', role?: UserRole) => {
    return apiPost<AuthResponse>('/auth/google', { token, tokenType, role });
  },
};
```

---

## Backend Implementation

### Auth Service

```typescript
// services/auth.service.ts
export class AuthService {
  static async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Check status
    if (user.status === UserStatus.SUSPENDED) {
      throw new AuthenticationError('Account is suspended');
    }

    // Verify password
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      await this.incrementFailedAttempts(user.id);
      throw new AuthenticationError('Invalid credentials');
    }

    // Reset failed attempts on success
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
      },
    });

    // Generate tokens
    const { accessToken, refreshToken, expiresIn } = await this.generateTokens(user);

    // Save refresh token
    await this.saveRefreshToken(user.id, refreshToken);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  static async generateTokens(user: User) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const expiresIn = parseExpiresIn(config.jwt.expiresIn);

    return { accessToken, refreshToken, expiresIn };
  }

  static async refreshToken(
    token: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ accessToken: string; expiresIn: number }> {
    // Verify token
    const payload = verifyRefreshToken(token);

    // Find in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt) {
      throw new AuthenticationError('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new AuthenticationError('Refresh token expired');
    }

    // Generate new tokens
    const newPayload = {
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    };

    const accessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);
    const expiresIn = parseExpiresIn(config.jwt.expiresIn);

    // Update refresh token in DB
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, expiresIn, refreshToken: newRefreshToken };
  }
}
```

### Auth Controller

```typescript
// controllers/auth.controller.ts
export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, rememberMe } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      const result = await AuthService.login(email, password, ipAddress, userAgent);

      // Set HTTP-only cookie
      const cookieMaxAge = rememberMe
        ? 30 * 24 * 60 * 60 * 1000  // 30 days
        : 7 * 24 * 60 * 60 * 1000;  // 7 days

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: cookieMaxAge,
      });

      res.json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        throw new AuthenticationError('No refresh token');
      }

      const result = await AuthService.refreshToken(
        refreshToken,
        req.ip,
        req.get('user-agent')
      );

      // Set new refresh token cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
```

### Auth Middleware

```typescript
// middleware/auth.middleware.ts
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new AuthenticationError('Account suspended');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      status: user.status,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError('Insufficient permissions'));
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verifyAccessToken(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (user && user.status !== UserStatus.SUSPENDED) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role as UserRole,
          status: user.status,
        };
      }
    }

    next();
  } catch {
    // Silently continue without auth
    next();
  }
};
```

### Auth Routes

```typescript
// routes/auth.routes.ts
const router = Router();

// Public routes (rate limited)
router.post('/login', ipAuthRateLimiter, AuthController.login);
router.post('/register', ipAuthRateLimiter, AuthController.register);
router.post('/register-code/request', ipAuthRateLimiter, AuthController.requestRegistrationCode);
router.post('/register-code/verify', ipAuthRateLimiter, AuthController.verifyRegistrationCode);
router.post('/refresh', AuthController.refresh);
router.post('/password/reset-request', ipAuthRateLimiter, AuthController.forgotPassword);
router.post('/password/reset-confirm', AuthController.resetPassword);

// OAuth routes
router.post('/google', ipAuthRateLimiter, AuthController.googleAuth);
router.post('/apple', ipAuthRateLimiter, AuthController.appleAuth);
router.post('/email-oauth/request', ipAuthRateLimiter, AuthController.requestEmailOAuth);
router.post('/email-oauth/verify', ipAuthRateLimiter, AuthController.verifyEmailOAuth);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, upload.single('avatar'), AuthController.updateProfile);
router.post('/password/change', authenticate, AuthController.changePassword);

export default router;
```

---

## Security Features

### 1. Password Security

```typescript
// utils/password.ts
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

// HaveIBeenPwned breach check (k-anonymity)
export const checkPasswordBreach = async (password: string): Promise<number> => {
  const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const text = await response.text();

    const lines = text.split('\n');
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix === suffix) {
        return parseInt(count, 10);
      }
    }
    return 0;
  } catch {
    // Non-blocking: Don't prevent registration if API is down
    return 0;
  }
};
```

### 2. Rate Limiting

```typescript
// middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const ipAuthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts per minute for login
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
  },
});
```

### 3. Cookie Security

```typescript
// Cookie configuration for refresh tokens
res.cookie('refreshToken', token, {
  httpOnly: true,      // JS cannot access (XSS protection)
  secure: true,        // HTTPS only in production
  sameSite: 'strict',  // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

### 4. Token Revocation

```typescript
// Revoke all user tokens (on password change, security concern)
static async revokeAllUserTokens(userId: string, reason?: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  logger.info(`Revoked all tokens for user ${userId}. Reason: ${reason}`);
}
```

### 5. Failed Login Tracking

```typescript
// Track failed login attempts
static async incrementFailedAttempts(userId: string): Promise<void> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: { increment: 1 },
    },
  });

  // Optional: Suspend after too many failures
  if (user.failedLoginAttempts >= 10) {
    await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.SUSPENDED },
    });
    logger.warn(`User ${userId} suspended due to too many failed attempts`);
  }
}
```

---

## OAuth Integration

### Google OAuth

```typescript
// services/google-auth.service.ts
export class GoogleAuthService {
  static async verifyGoogleIdToken(idToken: string): Promise<GoogleUserInfo> {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    if (!response.ok) {
      throw new AuthenticationError('Invalid Google token');
    }

    const data = await response.json();

    return {
      id: data.sub,
      email: data.email,
      name: data.name,
      picture: data.picture,
      emailVerified: data.email_verified === 'true',
    };
  }

  static async verifyGoogleAccessToken(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      throw new AuthenticationError('Invalid Google access token');
    }

    return response.json();
  }
}

// Usage in AuthService
static async googleAuth(
  token: string,
  tokenType: 'id_token' | 'access_token',
  role?: UserRole
): Promise<AuthResponse> {
  // Verify token with Google
  const googleUser = tokenType === 'id_token'
    ? await GoogleAuthService.verifyGoogleIdToken(token)
    : await GoogleAuthService.verifyGoogleAccessToken(token);

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { googleId: googleUser.id },
  });

  if (!user) {
    user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (user) {
      // Link Google to existing account
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleUser.id },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          googleId: googleUser.id,
          firstName: googleUser.name?.split(' ')[0],
          lastName: googleUser.name?.split(' ').slice(1).join(' '),
          avatar: googleUser.picture,
          role: role || UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });
    }
  }

  // Generate tokens
  return this.generateAuthResponse(user);
}
```

### Email OAuth (Passwordless)

```typescript
// Passwordless authentication via email code
static async requestEmailOAuthCode(email: string, role?: UserRole): Promise<void> {
  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store code
  await prisma.emailVerification.create({
    data: {
      email,
      code,
      role,
      expiresAt,
    },
  });

  // Send email
  await emailService.sendVerificationCode(email, code);
}

static async verifyEmailOAuthCode(email: string, code: string): Promise<AuthResponse> {
  // Find verification record
  const verification = await prisma.emailVerification.findFirst({
    where: {
      email,
      code,
      verified: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!verification) {
    throw new AuthenticationError('Invalid or expired code');
  }

  // Find or create user
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        role: verification.role || UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
  }

  // Mark verification as used
  await prisma.emailVerification.update({
    where: { id: verification.id },
    data: { verified: true, verifiedAt: new Date() },
  });

  // Generate tokens
  return this.generateAuthResponse(user);
}
```

---

## Protected Routes

### Frontend Route Guard

```tsx
// components/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const dashboardRoute = getDashboardRoute(user.role);
    return <Navigate to={dashboardRoute} replace />;
  }

  // Check organizer onboarding
  if (user?.role === UserRole.ORGANIZER && !user.onboardingCompleted) {
    if (!location.pathname.startsWith('/organizer/onboarding')) {
      return <Navigate to="/organizer/onboarding" replace />;
    }
  }

  return <>{children}</>;
};
```

### Usage in Routes

```tsx
// App.tsx
<Routes>
  {/* Public routes */}
  <Route path="/auth/signin" element={<SignIn />} />
  <Route path="/auth/signup" element={<SignUp />} />

  {/* Protected routes */}
  <Route
    path="/organizer/dashboard"
    element={
      <ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF]}>
        <OrganizerDashboard />
      </ProtectedRoute>
    }
  />

  <Route
    path="/admin/dashboard"
    element={
      <ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}>
        <AdminDashboard />
      </ProtectedRoute>
    }
  />
</Routes>
```

---

## Common Patterns & Best Practices

### 1. Always Check Auth State Before Actions

```typescript
const { user, isAuthenticated } = useAuth();

const handleAction = () => {
  if (!isAuthenticated) {
    navigate('/auth/signin');
    return;
  }

  // Proceed with action
};
```

### 2. Handle Token Expiration Gracefully

```typescript
// The API client handles this automatically
// But for manual checks:
const makeAuthenticatedRequest = async () => {
  try {
    const response = await apiGet('/protected-endpoint');
    return response;
  } catch (error) {
    if (error.status === 401) {
      // Token refresh will be attempted automatically
      // If it fails, user will be logged out
    }
    throw error;
  }
};
```

### 3. Protect Sensitive Operations

```typescript
// Backend: Always verify user owns the resource
static async updateEvent(eventId: string, userId: string, data: UpdateEventData) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    throw new NotFoundError('Event not found');
  }

  if (event.organizerId !== userId) {
    throw new AuthorizationError('You do not own this event');
  }

  // Proceed with update
}
```

### 4. Use Role-Based UI

```tsx
const { user } = useAuth();

return (
  <div>
    {user?.role === UserRole.ORGANIZER && (
      <OrganizerFeatures />
    )}

    {[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF].includes(user?.role) && (
      <AdminFeatures />
    )}
  </div>
);
```

### 5. Secure Password Requirements

```typescript
// Frontend validation
const validatePassword = (password: string): string[] => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least one letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return errors;
};
```

---

## Database Models

### User Model

```prisma
model User {
  id                  String      @id @default(uuid())
  email               String      @unique
  password            String?     // Optional for OAuth users
  firstName           String?
  lastName            String?

  // OAuth
  googleId            String?     @unique

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
  avatar              String?

  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  // Relations
  refreshTokens       RefreshToken[]
  emailVerifications  EmailVerification[]
  passwordResets      PasswordReset[]
}
```

### Supporting Models

```prisma
model RefreshToken {
  id        String    @id @default(uuid())
  userId    String
  token     String    @unique
  expiresAt DateTime
  revokedAt DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model EmailVerification {
  id         String    @id @default(uuid())
  email      String
  code       String    // 6-digit code
  role       UserRole?
  verified   Boolean   @default(false)
  expiresAt  DateTime
  verifiedAt DateTime?

  createdAt DateTime @default(now())
}

model PasswordReset {
  id        String    @id @default(uuid())
  userId    String
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## Troubleshooting

### Common Issues

1. **"Token expired" on every request**
   - Check JWT_SECRET matches between token generation and verification
   - Verify system clocks are synchronized
   - Check JWT_EXPIRES_IN format ("15m", not "15")

2. **Refresh token not working**
   - Ensure cookies are being sent (credentials: 'include')
   - Check CORS allows credentials
   - Verify sameSite cookie setting matches your domain setup

3. **OAuth login creates duplicate accounts**
   - Check email matching logic before creating new user
   - Ensure googleId is being stored and checked

4. **User can't login after password reset**
   - Verify password is being hashed on save
   - Check bcrypt salt rounds haven't changed

### Debug Tips

```typescript
// Log auth state changes
useEffect(() => {
  console.log('Auth state:', { user, isAuthenticated, isLoading });
}, [user, isAuthenticated, isLoading]);

// Log token on API requests
console.log('Access token:', getAccessToken());

// Check cookie presence (server-side)
console.log('Refresh token cookie:', req.cookies.refreshToken);
```

---

## Related Documentation

- [Event Creation Guide](./EVENT_CREATION_GUIDE.md) - Event creation system
- [API Documentation](./API.md) - REST API endpoints
- [Database Schema](./DATABASE.md) - Prisma schema reference

---

*Last updated: February 2026*
