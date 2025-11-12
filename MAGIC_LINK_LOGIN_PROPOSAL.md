# Magic Link Login (Click-to-Login) - Implementation Proposal

## Overview

**Magic Link Login** allows users to click a link in an email and automatically log in without entering a password or code. This is the same pattern used by:

- Facebook (notification emails)
- Slack (magic link login)
- Medium (email login links)
- Many modern platforms

---

## Current State vs. What's Needed

### Currently Implemented:

1. ✅ **Email OAuth** - Code-based (user enters 6-digit code)
2. ✅ **Email Verification** - Token-based (verifies email, doesn't log in)
3. ✅ **Password Reset** - Token-based (resets password, doesn't log in)

### Missing:

1. ❌ **Magic Link Login** - Click link → Auto-login (no password, no code)

---

## How Magic Link Login Works

### Flow:

```
1. User requests magic link login
   ↓
2. System sends email with login link
   ↓
3. User clicks link
   ↓
4. System verifies token
   ↓
5. User automatically logged in (redirected to dashboard)
```

**Key Difference from Email OAuth:**

- Email OAuth: User enters code manually
- Magic Link: User clicks link (automatic)

---

## Implementation for Guest Checkout

### Enhanced Flow with Magic Link Login

#### Option 1: Magic Link for Immediate Access (Recommended)

```
Guest Checkout
  ↓
Account Created (passwordless)
  ↓
Confirmation Email Sent with:
  - Event confirmation
  - "View Your Tickets" magic link (auto-login)
  - "Set Password" link (optional)
  - "Continue with Email" option (code-based)
  ↓
User clicks "View Your Tickets"
  ↓
Automatically logged in → Redirected to tickets page
```

**Benefits:**

- ✅ User can access tickets immediately (no password needed)
- ✅ Seamless experience (like Facebook notifications)
- ✅ Password setup is optional (can do later)

---

#### Option 2: Magic Link for Account Access

```
Guest Checkout
  ↓
Account Created (passwordless)
  ↓
Confirmation Email Sent with:
  - Event confirmation
  - "Access Your Account" magic link (auto-login)
  - "Set Password" link (optional)
  ↓
User clicks "Access Your Account"
  ↓
Automatically logged in → Redirected to dashboard
```

---

## Implementation Details

### Backend Endpoints

#### 1. **Request Magic Link Login**

```
POST /api/v1/auth/magic-link/request

Body:
{
  email: "user@example.com"
}

Response:
{
  success: true,
  message: "Magic link sent to your email"
}
```

**Flow:**

- Check if user exists
- Generate secure token
- Store token in database (with expiry)
- Send email with magic link
- Token expires in 15 minutes (security)

---

#### 2. **Verify Magic Link & Auto-Login**

```
GET /api/v1/auth/magic-link/verify?token=abc123xyz

Response:
{
  success: true,
  data: {
    user: { ... },
    accessToken: "eyJhbGci...",
    refreshToken: "eyJhbGci...",
    expiresIn: 900
  }
}
```

**Flow:**

- Verify token (exists, not expired, not used)
- Get user from token
- Generate JWT tokens
- Mark token as used (one-time use)
- Return tokens + user data
- Frontend sets tokens and redirects

---

### Database Schema

#### Option 1: Use Existing `EmailVerification` Table

```prisma
model EmailVerification {
  // ... existing fields
  type String? // 'REGISTRATION' | 'EMAIL_VERIFICATION' | 'MAGIC_LINK' | 'PASSWORD_SETUP'
  used Boolean @default(false) // For one-time use
  usedAt DateTime?
}
```

#### Option 2: Create `MagicLinkToken` Table (Recommended)

```prisma
model MagicLinkToken {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  usedAt    DateTime?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@index([used])
}
```

**Security Features:**

- ✅ One-time use (token marked as used)
- ✅ Short expiry (15 minutes)
- ✅ IP address tracking (optional)
- ✅ User agent tracking (optional)

---

### Email Template

#### Confirmation Email with Magic Link

```html
<h1>Your Event Registration is Confirmed! 🎉</h1>

<div>
  <h2>Event Details</h2>
  <p><strong>Event:</strong> [Event Name]</p>
  <p><strong>Date:</strong> [Event Date]</p>
  <p><strong>Time:</strong> [Event Time]</p>
</div>

<div>
  <h2>Access Your Tickets</h2>
  <p>Click the link below to view and manage your tickets:</p>
  <a
    href="https://eventknit.com/auth/magic-link/verify?token={{magicLinkToken}}"
    style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;"
  >
    View Your Tickets
  </a>
  <p style="font-size: 12px; color: #666;">
    This link expires in 15 minutes and can only be used once.
  </p>
</div>

<div>
  <h2>Set Up Your Account</h2>
  <p>Create a password to access your account anytime:</p>
  <a
    href="https://eventknit.com/auth/password/setup?token={{passwordSetupToken}}"
  >
    Set Password
  </a>
  <p style="font-size: 12px; color: #666;">
    Or continue using passwordless login (no password needed).
  </p>
</div>

<div>
  <h2>Other Login Options</h2>
  <p>You can also login using:</p>
  <ul>
    <li>
      <a href="https://eventknit.com/auth/signin">Continue with Email</a>
      (code-based)
    </li>
    <li>
      <a href="https://eventknit.com/auth/signin">Continue with Facebook</a>
    </li>
  </ul>
</div>
```

---

### Frontend Implementation

#### 1. **Magic Link Verification Page** (`/auth/magic-link/verify`)

```tsx
const MagicLinkVerify = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { dispatch } = useAuthContext();

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      setError("Invalid magic link");
      setLoading(false);
      return;
    }

    // Verify magic link and auto-login
    verifyMagicLink(token)
      .then((response) => {
        if (response.success && response.data) {
          // Set tokens
          setAccessToken(response.data.accessToken);
          setRefreshToken(response.data.refreshToken);

          // Update auth context
          dispatch({ type: "AUTH_SUCCESS", payload: response.data.user });

          // Redirect to dashboard or tickets page
          const role = response.data.user.role;
          if (role === "ORGANIZER") {
            navigate("/organizer/dashboard");
          } else {
            navigate("/user/tickets"); // Or dashboard
          }
        }
      })
      .catch((err) => {
        setError(err.message || "Invalid or expired magic link");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Logging you in...</div>;
  }

  if (error) {
    return (
      <div>
        <h1>Link Expired or Invalid</h1>
        <p>{error}</p>
        <Button onClick={() => navigate("/auth/signin")}>Go to Login</Button>
        <Button onClick={() => requestNewMagicLink(email)}>
          Request New Link
        </Button>
      </div>
    );
  }

  return null;
};
```

---

#### 2. **API Function**

```typescript
// auth-api.ts
export const verifyMagicLink = async (
  token: string
): Promise<LoginResponse> => {
  return apiGet<LoginResponse>(`/auth/magic-link/verify?token=${token}`);
};

export const requestMagicLink = async (
  email: string
): Promise<ApiResponse<void>> => {
  return apiPost<ApiResponse<void>>("/auth/magic-link/request", { email });
};
```

---

## Complete Guest Checkout Flow with Magic Link

### Enhanced User Journey

```
1. Guest Checkout
   User enters: email, firstName, lastName
   ↓
2. Account Created (passwordless)
   Account status: ACTIVE, isEmailVerified: true
   ↓
3. Confirmation Email Sent
   Contains:
   - Event confirmation
   - "View Your Tickets" magic link (auto-login, 15 min expiry)
   - "Set Password" link (optional, 7 days expiry)
   - "Continue with Email" option (code-based)
   ↓
4a. User Clicks "View Your Tickets" (Magic Link)
   → Automatically logged in
   → Redirected to tickets page
   → Can access account immediately
   ↓
4b. User Clicks "Set Password" (Optional)
   → Password setup page
   → Sets password
   → Can now login with email/password
   ↓
4c. User Uses "Continue with Email" (Optional)
   → Code-based login
   → Enters 6-digit code
   → Logged in
```

---

## Security Considerations

### Magic Link Security

1. **Short Expiry**

   - ✅ Token expires in 15 minutes
   - ✅ Prevents long-lived links

2. **One-Time Use**

   - ✅ Token marked as used after login
   - ✅ Cannot be reused

3. **HTTPS Required**

   - ✅ Links only work over HTTPS
   - ✅ Prevents token interception

4. **Token Strength**

   - ✅ Cryptographically secure random tokens (32+ bytes)
   - ✅ Unpredictable

5. **Rate Limiting**

   - ✅ Limit magic link requests per email/IP
   - ✅ Prevent abuse

6. **IP/User Agent Tracking**
   - ✅ Optional: Track where link was used
   - ✅ Detect suspicious activity

---

## Comparison: All Login Methods

| Method             | User Action    | Auto-Login | Use Case                          |
| ------------------ | -------------- | ---------- | --------------------------------- |
| **Magic Link**     | Click link     | ✅ Yes     | Email notifications, quick access |
| **Email OAuth**    | Enter code     | ❌ No      | When user wants to enter code     |
| **Email/Password** | Enter password | ❌ No      | Traditional login                 |
| **Facebook OAuth** | Click Facebook | ✅ Yes     | Social login                      |

---

## Use Cases for Magic Link

### 1. **Event Confirmation Email**

```
"Your event registration is confirmed! Click here to view your tickets"
→ Magic link → Auto-login → Tickets page
```

### 2. **Password Reset Email**

```
"Click here to reset your password"
→ Magic link → Auto-login → Password reset page
```

### 3. **Account Verification Email**

```
"Click here to verify your email"
→ Magic link → Auto-login → Dashboard
```

### 4. **Event Reminders**

```
"Your event is tomorrow! Click here to view details"
→ Magic link → Auto-login → Event page
```

---

## Implementation Priority

### Phase 1: Core Magic Link (High Priority)

1. ✅ Create `MagicLinkToken` table
2. ✅ Implement `requestMagicLink()` service method
3. ✅ Implement `verifyMagicLink()` service method
4. ✅ Create magic link endpoints
5. ✅ Add to confirmation email

### Phase 2: Integration (High Priority)

1. ✅ Add magic link to guest checkout flow
2. ✅ Create frontend verification page
3. ✅ Update email templates
4. ✅ Add to sign-in page (request magic link option)

### Phase 3: Enhancements (Medium Priority)

1. ⚠️ Add IP/user agent tracking
2. ⚠️ Add rate limiting
3. ⚠️ Add analytics
4. ⚠️ Add magic link to other emails (reminders, etc.)

---

## API Endpoints Summary

### Magic Link Login

```
POST /api/v1/auth/magic-link/request
GET  /api/v1/auth/magic-link/verify?token=...
```

### Password Setup (from guest checkout)

```
GET  /api/v1/auth/password/setup/verify?token=...
POST /api/v1/auth/password/setup
```

### Guest Checkout

```
POST /api/v1/events/:eventId/register-guest
```

---

## Email Template Structure

### Confirmation Email (Guest Checkout)

```html
1. Event Confirmation Details 2. "View Your Tickets" Magic Link (auto-login, 15
min) 3. "Set Password" Link (optional, 7 days) 4. Other Login Options
```

---

## Summary

### What Magic Link Adds:

- ✅ **Click-to-login** functionality (like Facebook)
- ✅ **Automatic login** from email links
- ✅ **Seamless access** to tickets/account
- ✅ **Better UX** than code-based login
- ✅ **Industry standard** (used by major platforms)

### Complete Login Options:

1. **Magic Link** - Click link → Auto-login (new!)
2. **Email OAuth** - Enter code → Login (existing)
3. **Email/Password** - Enter password → Login (existing)
4. **Facebook OAuth** - Click → Login (existing)

### Guest Checkout Flow:

1. Guest checkout → Account created
2. Email sent with:
   - Magic link (auto-login to tickets)
   - Password setup link (optional)
   - Other login options
3. User clicks magic link → Auto-logged in → Access tickets immediately

---

## Next Steps

1. **Implement magic link backend** (token generation, verification)
2. **Add magic link to guest checkout** (include in confirmation email)
3. **Create frontend verification page** (auto-login flow)
4. **Update email templates** (add magic link)
5. **Add to sign-in page** (request magic link option)

**Status:** Ready for implementation
**Estimated Effort:** 1-2 days for core functionality

