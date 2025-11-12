# Authentication System Comparison: Wheela vs EventKnit

## Executive Summary

The authentication systems in **Wheela** and **EventKnit** have **similar core functionality** but **significant architectural differences**:

- ✅ **Same**: Core auth features (register, login, refresh, password reset, email verification)
- ❌ **Different**: Database (MongoDB vs PostgreSQL), route names, middleware implementation, test structure
- ⚠️ **Gap**: EventKnit has more advanced features (role hierarchy, refresh token storage), Wheela has phone verification

## Detailed Findings

### 1. Database Architecture

| Aspect         | Wheela          | EventKnit         | Status       |
| -------------- | --------------- | ----------------- | ------------ |
| **Database**   | MongoDB         | PostgreSQL        | ⚠️ Different |
| **ORM/ODM**    | Mongoose        | Prisma            | ⚠️ Different |
| **User Model** | Mongoose Schema | Prisma Schema     | ⚠️ Different |
| **Migration**  | No migrations   | Prisma migrations | ⚠️ Different |

**Impact**: Cannot directly share code - needs abstraction or unified interface.

### 2. Authentication Service Comparison

#### Common Features ✅

- User registration
- User login
- Token refresh
- Email verification
- Password reset (forgot/reset)
- Password change (authenticated)

#### Wheela-Specific Features

- **Phone verification** (with SMS codes)
- **Account lockout** with attempt tracking
- **Email verification** with 6-digit codes (stored in user model)
- **Token management** - simple (just JWT verification)

#### EventKnit-Specific Features

- **Refresh token storage** in database (more secure)
- **Role hierarchy** system (superior to simple role check)
- **Organization support** (organizer-specific fields)
- **Token rotation** (revokes old refresh token on refresh)
- **Email verification** with tokens (stored in separate table)

**Key Differences**:

1. **Refresh Token Management**:

   - **Wheela**: Stores refresh tokens only in JWT (stateless)
   - **EventKnit**: Stores refresh tokens in database (stateful) ✅ More secure

2. **Email Verification**:

   - **Wheela**: 6-digit codes stored in user model
   - **EventKnit**: Tokens in separate `EmailVerification` table ✅ Better separation

3. **Account Lockout**:
   - **Wheela**: Built into user model methods
   - **EventKnit**: Explicit lockout fields in database ✅ More transparent

### 3. Route/Endpoint Differences

| Feature             | Wheela Endpoint                            | EventKnit Endpoint                        | Difference   |
| ------------------- | ------------------------------------------ | ----------------------------------------- | ------------ |
| **Register**        | `POST /api/v1/auth/register`               | `POST /api/v1/auth/signup`                | ⚠️ Different |
| **Login**           | `POST /api/v1/auth/login`                  | `POST /api/v1/auth/login`                 | ✅ Same      |
| **Refresh**         | `POST /api/v1/auth/refresh`                | `POST /api/v1/auth/refresh`               | ✅ Same      |
| **Logout**          | `POST /api/v1/auth/logout`                 | `POST /api/v1/auth/logout`                | ✅ Same      |
| **Profile**         | `GET /api/v1/auth/me`                      | `GET /api/v1/auth/profile`                | ⚠️ Different |
| **Verify Email**    | `POST /api/v1/auth/verify-email/confirm`   | `GET /api/v1/auth/verify-email?token=...` | ⚠️ Different |
| **Forgot Password** | `POST /api/v1/auth/password/reset-request` | `POST /api/v1/auth/forgot-password`       | ⚠️ Different |
| **Reset Password**  | `POST /api/v1/auth/password/reset-confirm` | `POST /api/v1/auth/reset-password`        | ⚠️ Different |
| **Phone Verify**    | `POST /api/v1/auth/verify-phone/*`         | ❌ Not implemented                        | ❌ Missing   |
| **Change Password** | `POST /api/v1/auth/password/change`        | ❌ Not implemented                        | ❌ Missing   |
| **Update Profile**  | `PUT /api/v1/auth/profile`                 | ❌ Not implemented                        | ❌ Missing   |

**Impact**: API consumers need different endpoints for each system.

### 4. Controller Implementation

#### Wheela Controller

- ✅ More comprehensive (phone verification, profile updates)
- ✅ Inline validation (email regex, password length)
- ✅ Welcome email on registration
- ❌ Less separation of concerns (validation in controller)

#### EventKnit Controller

- ✅ Uses validation middleware (Joi)
- ✅ Cookie-based refresh tokens
- ✅ Cleaner separation of concerns
- ❌ Missing phone verification
- ❌ Missing profile update
- ❌ Missing change password endpoint

### 5. Middleware Comparison

#### Wheela Middleware (`auth.middleware.ts`)

```typescript
- authenticateToken: Simple JWT verification
- requireRole: Role-based access (array of roles)
- optionalAuth: Optional authentication
```

**Features**:

- Simple and fast (no DB lookup)
- JWT payload contains all needed info
- ⚠️ Doesn't verify user still exists/is active

#### EventKnit Middleware (`auth.middleware.ts`)

```typescript
- authenticate: JWT verification + DB lookup
- authorize: Role-based access
- requireMinRole: Role hierarchy check
- optionalAuth: Optional authentication
```

**Features**:

- ✅ Verifies user exists and is active
- ✅ Role hierarchy system (SUPERADMIN > ADMIN_STAFF > etc.)
- ✅ More secure (checks user status)
- ⚠️ Slower (database query per request)

**Security Comparison**:

- **EventKnit is more secure** - verifies user status in DB
- **Wheela is faster** - no DB lookup, but less secure

### 6. Test Coverage Comparison

| Aspect            | Wheela                | EventKnit                        |
| ----------------- | --------------------- | -------------------------------- |
| **Test Lines**    | 774 lines             | 663 lines                        |
| **Test Database** | MongoDB Memory Server | PostgreSQL (requires running DB) |
| **Test Count**    | ~28 tests             | ~20 tests                        |
| **Coverage**      | More comprehensive    | Good coverage, fewer features    |

#### Wheela Tests Include:

- ✅ Register (4 tests)
- ✅ Login (4 tests)
- ✅ Refresh token (3 tests)
- ✅ Email verification request (3 tests)
- ✅ Email verification confirm (3 tests)
- ✅ Password reset request (2 tests)
- ✅ Get profile (3 tests)
- ✅ Update profile (8 tests) - **Missing in EventKnit**
- ✅ Change password (5 tests) - **Missing in EventKnit**
- ❌ Phone verification - **Missing in EventKnit**

#### EventKnit Tests Include:

- ✅ Register (4 tests) - includes organizer registration
- ✅ Login (4 tests) - includes account lockout
- ✅ Refresh token (2 tests)
- ✅ Logout (2 tests) - **More comprehensive**
- ✅ Get profile (2 tests)
- ✅ Forgot password (2 tests)
- ✅ Reset password (2 tests)
- ❌ Phone verification - **Missing**
- ❌ Profile update - **Missing**
- ❌ Change password - **Missing**

**Test Database Setup**:

- **Wheela**: Uses `mongodb-memory-server` (automatic, no setup)
- **EventKnit**: Requires PostgreSQL running (manual setup needed)

### 7. Security Features Comparison

| Feature                   | Wheela               | EventKnit               | Winner       |
| ------------------------- | -------------------- | ----------------------- | ------------ |
| **Account Lockout**       | ✅ User model method | ✅ Database fields      | ✅ Tie       |
| **Refresh Token Storage** | ❌ Stateless         | ✅ Database             | ✅ EventKnit |
| **Token Rotation**        | ❌ No                | ✅ Yes                  | ✅ EventKnit |
| **User Status Check**     | ⚠️ In service        | ✅ In middleware        | ✅ EventKnit |
| **Role Hierarchy**        | ❌ Simple array      | ✅ Hierarchical         | ✅ EventKnit |
| **IP/UserAgent Tracking** | ❌ No                | ✅ Yes (refresh tokens) | ✅ EventKnit |

**Overall**: EventKnit has **superior security** architecture.

### 8. Missing Features Analysis

#### In EventKnit (from Wheela):

1. ❌ **Phone Verification** - Full SMS verification flow
2. ❌ **Change Password** - Authenticated password change endpoint
3. ❌ **Profile Update** - PUT endpoint to update user profile
4. ❌ **Test Database Setup** - No in-memory DB option

#### In Wheela (from EventKnit):

1. ❌ **Refresh Token DB Storage** - Stateless tokens only
2. ❌ **Token Rotation** - Old tokens not revoked
3. ❌ **Role Hierarchy** - Simple role matching only
4. ❌ **Organization Support** - No organizer-specific features

## Recommendations

### Option 1: Align EventKnit with Wheela (Add Missing Features)

**Priority**: Medium

Add to EventKnit:

1. Phone verification endpoints
2. Change password endpoint (`POST /api/v1/auth/change-password`)
3. Profile update endpoint (`PUT /api/v1/auth/profile`)

**Effort**: Medium (2-3 days)
**Benefit**: Feature parity

### Option 2: Align Wheela with EventKnit (Security Improvements)

**Priority**: High

Add to Wheela:

1. Refresh token database storage
2. Token rotation
3. Role hierarchy system

**Effort**: Medium-High (3-5 days)
**Benefit**: Better security

### Option 3: Unified Authentication Service (Best Practice)

**Priority**: High (Long-term)

Create a shared authentication library:

- Abstract database layer (Mongoose/Prisma adapter)
- Unified API interface
- Shared security features
- Configurable features per project

**Effort**: High (1-2 weeks)
**Benefit**: Single source of truth, easier maintenance

## Specific Issues Found

### 1. Route Naming Inconsistency

- EventKnit uses `/signup`, Wheela uses `/register`
- EventKnit uses `/profile`, Wheela uses `/me`
- **Impact**: API consumers need different implementations

### 2. Test Infrastructure

- EventKnit requires PostgreSQL running (not isolated)
- Wheela uses in-memory database (better for CI/CD)
- **Impact**: EventKnit tests harder to run in CI

### 3. Validation Approach

- EventKnit uses Joi validation (centralized)
- Wheela has inline validation (scattered)
- **Impact**: EventKnit more maintainable

### 4. Email Verification Method

- Wheela: 6-digit codes (user-friendly)
- EventKnit: Long tokens (more secure, less user-friendly)
- **Impact**: Different UX patterns

## Conclusion

**The systems are functionally similar but architecturally different:**

✅ **Same Core**: Both implement standard authentication flows
⚠️ **Different DB**: MongoDB vs PostgreSQL (cannot share code directly)
⚠️ **Different Routes**: Different endpoint names
✅ **EventKnit Better Security**: Refresh token storage, token rotation, role hierarchy
✅ **Wheela More Features**: Phone verification, profile update, change password

**Recommendation**:

1. **Short-term**: Add missing endpoints to EventKnit (phone verification, change password, profile update)
2. **Medium-term**: Improve Wheela security (refresh token storage, token rotation)
3. **Long-term**: Consider unified auth library if both projects continue to evolve

Both systems work correctly, but they're not interchangeable without modification.












