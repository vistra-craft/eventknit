# Guest Checkout with Account Creation - Implementation Proposal

## Overview

This document outlines the implementation of a guest checkout flow where users can purchase/register for events without being logged in, with automatic or optional account creation.

---

## Current State

### Existing Flows

1. **Authenticated Registration** (`registerForEvent`)

   - Requires user to be logged in
   - Uses `attendeeId` from authenticated session
   - Route: `POST /api/v1/events/:eventId/register`

2. **Invitation-Based Registration** (`registerViaInvitation`)
   - Public (no auth required)
   - Already creates accounts with temporary passwords
   - Route: `POST /api/v1/invitations/:token/register`
   - ✅ **Already implements Option C (temp password)**

---

## Proposed Solution: Guest Checkout

### Three Account Creation Strategies

#### Option A: Auto-Create Account (Recommended for UX)

**Flow:**

1. Guest enters email, firstName, lastName, phoneNumber (optional)
2. System checks if user exists:
   - If exists: Use existing account (login required or send magic link)
   - If new: Create account automatically with:
     - Email verified: `true` (trusted from checkout)
     - Status: `ACTIVE`
     - Role: `ATTENDEE`
     - Password: `null` (passwordless account)
3. Complete event registration
4. Send welcome email with:
   - Event confirmation
   - Option to set password (link to password setup)
   - Option to login via Email OAuth

**Pros:**

- ✅ Seamless UX - no friction
- ✅ Users can set password later
- ✅ Can login via Email OAuth immediately

**Cons:**

- ⚠️ Creates accounts users might not want
- ⚠️ Requires password setup flow later

---

#### Option B: Send Registration Link (Recommended for Control)

**Flow:**

1. Guest enters email, firstName, lastName, phoneNumber (optional)
2. System checks if user exists:
   - If exists: Send login link (if no password) or require login
   - If new: Create pending account or just store email
3. Complete event registration (temporary/pending)
4. Send email with:
   - Event confirmation
   - Registration link to complete account setup
   - Link expires in 7 days
5. User clicks link → completes registration → account activated

**Pros:**

- ✅ User has control
- ✅ Doesn't create unwanted accounts
- ✅ Clear separation of checkout and account creation

**Cons:**

- ⚠️ Extra step for users
- ⚠️ Requires link expiration handling
- ⚠️ Registration might be incomplete if link not clicked

---

#### Option C: Temporary Password (Already Implemented)

**Flow:**

1. Guest enters email, firstName, lastName, phoneNumber (optional)
2. System creates account with random temporary password
3. Complete event registration
4. Send welcome email with:
   - Event confirmation
   - Temporary password
   - Link to reset password (required on first login)

**Pros:**

- ✅ Account exists immediately
- ✅ Can login with email/password
- ✅ Already implemented in invitation flow

**Cons:**

- ⚠️ Users might not see/use temporary password
- ⚠️ Security concern if password is weak
- ⚠️ Requires password reset on first login

---

## Recommended Hybrid Approach

**Combine Option A + Option B:**

1. **Auto-create account** (Option A) for seamless UX
2. **Send welcome email** with:
   - Event confirmation
   - "Set Password" link (if they want traditional login)
   - "Continue with Email" option (passwordless login)
3. **Account status:**
   - `isEmailVerified: true` (email confirmed from checkout)
   - `password: null` (passwordless by default)
   - `status: ACTIVE` (can use immediately)

**Why this works:**

- ✅ Best UX (no friction)
- ✅ Users can choose login method later
- ✅ Email is verified (from checkout)
- ✅ Can add password anytime

---

## Implementation Plan

### Phase 1: Guest Checkout Endpoint

**New Route:** `POST /api/v1/events/:eventId/register-guest`

**Request Body:**

```typescript
{
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  ticketType?: string;
  quantity?: number;
  registrationData?: Record<string, unknown>;
  accountCreationStrategy?: 'auto' | 'link' | 'temp-password'; // Optional, defaults to 'auto'
}
```

**Response:**

```typescript
{
  success: boolean;
  data: {
    registration: EventRegistration;
    user: {
      id: string;
      email: string;
      isNewUser: boolean;
      requiresPasswordSetup: boolean;
    };
    accountSetupLink?: string; // Only if strategy is 'link'
    temporaryPassword?: string; // Only if strategy is 'temp-password' (send via email, not response)
  };
}
```

---

### Phase 2: Account Creation Logic

**Service Method:** `EventService.registerAsGuest()`

**Flow:**

1. Validate event (exists, approved, not started, capacity available)
2. Extract and validate guest data (email, firstName, lastName)
3. Check if user exists:
   - **If exists:**
     - Check if user has password:
       - If yes: Return error "Please login to continue" or send login link
       - If no: Use account (passwordless)
     - Complete registration with existing account
   - **If new:**
     - Create account based on strategy:
       - `auto`: Create passwordless account (password: null)
       - `link`: Create pending account or store in temporary table
       - `temp-password`: Create with random password (hash it)
4. Complete event registration
5. Send appropriate email based on strategy

---

### Phase 3: Email Templates

**1. Welcome Email (Auto-create)**

- Subject: "Welcome to EventKnit - Your Event Registration Confirmed"
- Content:
  - Event confirmation details
  - "Set Password" button/link
  - "Continue with Email" option
  - Link to view event details

**2. Registration Link Email (Link strategy)**

- Subject: "Complete Your EventKnit Account Setup"
- Content:
  - Event confirmation (pending)
  - "Complete Registration" button/link
  - Link expires in 7 days
  - Event details

**3. Welcome with Temp Password (Temp-password strategy)**

- Subject: "Welcome to EventKnit - Your Account Details"
- Content:
  - Event confirmation
  - Temporary password (clearly marked)
  - "Reset Password" link (required on first login)
  - Security notice about changing password

---

### Phase 4: Password Setup Flow

**New Route:** `POST /api/v1/auth/password/setup`

**For users without passwords (passwordless accounts):**

- Allow setting password for the first time
- Requires email verification token or valid session
- After setup, user can login with email/password

**Flow:**

1. User receives "Set Password" link in email
2. Link contains token (expires in 7 days)
3. User clicks link → redirected to password setup page
4. User sets password
5. Account updated: `password` set, `isEmailVerified: true`
6. User can now login with email/password

---

## Database Changes

### No Schema Changes Required ✅

The existing schema supports:

- `User.password` can be `null` (passwordless accounts)
- `User.isEmailVerified` can be set to `true` from checkout
- `EventRegistration` already supports guest data in `registrationData`

### Optional: Pending Account Table (for Link strategy)

If implementing Option B (link strategy), consider:

```prisma
model PendingAccount {
  id        String   @id @default(uuid())
  email     String   @unique
  firstName String
  lastName  String
  phoneNumber String?
  token     String   @unique // For registration link
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([email])
  @@index([token])
  @@index([expiresAt])
}
```

**Note:** This is optional - can also store in `EmailVerification` table with a special type.

---

## Security Considerations

### 1. Email Verification

- ✅ Email is verified from checkout (user provided it)
- ✅ Set `isEmailVerified: true` for auto-created accounts
- ✅ For link strategy, verify email when link is clicked

### 2. Account Creation

- ✅ Prevent duplicate accounts (check by email)
- ✅ Handle existing accounts gracefully
- ✅ Rate limit guest checkout (prevent spam)

### 3. Password Security

- ✅ Temporary passwords: Use strong random passwords (16+ chars)
- ✅ Password setup links: Expire in 7 days
- ✅ Require password change on first login (if temp password)

### 4. User Status

- ✅ Check for SUSPENDED/DEACTIVATED users
- ✅ Block guest checkout for banned users
- ✅ Allow DEACTIVATED users to register (they can login but actions restricted)

---

## API Endpoints

### 1. Guest Checkout

```
POST /api/v1/events/:eventId/register-guest
```

- Public endpoint (no auth required)
- Creates account if needed
- Completes event registration

### 2. Password Setup (New)

```
POST /api/v1/auth/password/setup
```

- Public endpoint (requires token)
- Sets password for passwordless accounts
- Token from email link

### 3. Verify Registration Link (If using Option B)

```
GET /api/v1/auth/verify-registration/:token
POST /api/v1/auth/complete-registration/:token
```

- Verify token validity
- Complete account creation
- Activate pending registration

---

## Frontend Changes

### 1. Guest Checkout Form

- Email input
- First name, last name
- Phone number (optional)
- Ticket selection
- Custom registration fields
- Checkbox: "Create account for faster checkout next time" (default: checked)

### 2. Post-Checkout Flow

- Show success message
- Display event confirmation
- If new account: Show "Set Password" option
- If existing account: Show "Login" option
- Email sent confirmation

### 3. Password Setup Page

- New route: `/auth/password/setup?token=...`
- Password and confirm password fields
- Validation
- Submit → redirect to login or dashboard

---

## Migration Strategy

### Step 1: Implement Guest Checkout (Option A - Auto-create)

- Add `registerAsGuest()` method
- Create guest checkout endpoint
- Send welcome email
- Test with new and existing users

### Step 2: Add Password Setup Flow

- Create password setup endpoint
- Add password setup page (frontend)
- Update welcome email with setup link
- Test password setup flow

### Step 3: Optional - Add Link Strategy

- Implement pending account logic
- Add registration link verification
- Update email templates
- Test link expiration

---

## Testing Checklist

### Guest Checkout

- [ ] New user - auto-create account
- [ ] Existing user with password - require login or send link
- [ ] Existing user without password - use account
- [ ] SUSPENDED user - block checkout
- [ ] DEACTIVATED user - allow checkout (actions restricted later)
- [ ] Invalid email - validation error
- [ ] Event sold out - capacity check
- [ ] Event not approved - validation error
- [ ] Registration deadline passed - validation error

### Account Creation

- [ ] Auto-create with passwordless account
- [ ] Email verified automatically
- [ ] Account status: ACTIVE
- [ ] Welcome email sent
- [ ] Password setup link works

### Password Setup

- [ ] Token validation
- [ ] Token expiration (7 days)
- [ ] Password validation
- [ ] Account updated correctly
- [ ] Can login with new password

---

## Recommendations

### ✅ Recommended: Option A (Auto-create) with Password Setup

**Why:**

1. Best user experience (no friction)
2. Email is verified from checkout
3. Users can choose login method later
4. Password setup is optional (can use Email OAuth)

**Implementation Priority:**

1. **High:** Guest checkout with auto-create
2. **High:** Password setup flow
3. **Medium:** Welcome email templates
4. **Low:** Link strategy (Option B) - only if needed

---

## Questions to Consider

1. **Should guest checkout require email verification?**

   - ✅ Recommended: Yes, email is verified from checkout (user provided it)

2. **What happens if user already has account?**

   - ✅ Recommended: Use existing account, but require login or send login link

3. **Should we allow multiple registrations with same email?**

   - ✅ Recommended: Yes, but link to same account

4. **What about payment processing?**

   - Payment can be handled separately after registration
   - Guest checkout creates registration with PENDING payment status
   - Payment completion updates registration status

5. **Should we track guest vs authenticated registrations?**
   - ✅ Recommended: Add field to `EventRegistration`: `isGuestCheckout: boolean`

---

## Next Steps

1. **Review and approve this proposal**
2. **Decide on account creation strategy** (recommend Option A)
3. **Implement guest checkout endpoint**
4. **Add password setup flow**
5. **Create email templates**
6. **Update frontend checkout flow**
7. **Test thoroughly**
8. **Deploy to staging**
9. **Monitor and iterate**

---

## Summary

This proposal provides a comprehensive guest checkout system that:

- ✅ Allows users to purchase/register without login
- ✅ Automatically creates accounts (seamless UX)
- ✅ Provides password setup option (flexibility)
- ✅ Handles existing users gracefully
- ✅ Maintains security best practices
- ✅ Integrates with existing authentication system

**Status:** Ready for implementation
**Estimated Effort:** 2-3 days for core functionality + 1 day for testing

