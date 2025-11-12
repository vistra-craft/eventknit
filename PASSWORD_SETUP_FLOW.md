# Password Setup Flow After Guest Checkout

## Complete User Journey

### Step-by-Step Flow

#### 1. **Guest Checkout** (No Password Required)

```
User purchases event ticket
  ↓
Enters: email, firstName, lastName
  ↓
Account auto-created (passwordless)
  ↓
Event registration completed
  ↓
Confirmation email sent
```

**At this point:**

- ✅ Account exists (passwordless)
- ✅ Email verified (from checkout)
- ✅ User can access tickets via email
- ❌ No password set yet

---

#### 2. **Confirmation Email Sent**

```
Email contains:
  - Event confirmation details
  - "Set Password" button/link
  - "Continue with Email" option (passwordless login)
```

**Link format:**

```
https://eventknit.com/auth/password/setup?token=abc123xyz
```

**Token details:**

- Generated when account is created
- Stored in `EmailVerification` table or `PasswordResetToken` table
- Expires in **7 days**
- One-time use (invalidated after password is set)

---

#### 3. **User Clicks "Set Password" Link** (Post-Purchase)

```
User receives email
  ↓
Clicks "Set Password" link
  ↓
Redirected to: /auth/password/setup?token=abc123xyz
  ↓
Password setup page loads
```

**Timing:**

- ✅ **Anytime after purchase** (within 7 days)
- ✅ User is **not logged in** at this point
- ✅ Token validates their identity

---

#### 4. **Password Setup Page** (User Not Logged In)

```
Password Setup Form:
  - Email (pre-filled, read-only)
  - New Password
  - Confirm Password
  - "Set Password" button
```

**User enters password:**

- Validates password requirements
- Confirms password match
- Submits form

---

#### 5. **Password Set Successfully**

```
Password submitted
  ↓
Token validated
  ↓
Password hashed and saved
  ↓
Token invalidated (one-time use)
  ↓
User redirected to login page
  ↓
OR auto-logged in (optional)
```

**After password is set:**

- ✅ Password stored in database
- ✅ User can now login with email/password
- ✅ Can also still use Email OAuth (passwordless)
- ✅ Account fully functional

---

#### 6. **Future Logins**

```
User can login via:
  1. Email + Password (traditional)
  2. Email OAuth (passwordless - code-based)
  3. Facebook OAuth (if linked)
```

**Password is now set:**

- ✅ Traditional login works
- ✅ Passwordless login still works
- ✅ User has both options

---

## Implementation Details

### Backend Endpoints Needed

#### 1. **Generate Password Setup Token** (During Guest Checkout)

```typescript
// In EventService.registerAsGuest()
// After creating account:
const token = await AuthService.generatePasswordSetupToken(user.id);
// Include token in confirmation email
```

#### 2. **Verify Token** (Before showing password form)

```
GET /api/v1/auth/password/setup/verify?token=abc123xyz

Response:
{
  success: true,
  data: {
    email: "user@example.com",
    valid: true,
    expiresAt: "2024-11-14T12:00:00Z"
  }
}
```

#### 3. **Set Password** (Submit password)

```
POST /api/v1/auth/password/setup

Body:
{
  token: "abc123xyz",
  password: "SecurePass123!",
  confirmPassword: "SecurePass123!"
}

Response:
{
  success: true,
  message: "Password set successfully. You can now login."
}
```

---

### Database Schema

#### Option 1: Use Existing `EmailVerification` Table

```prisma
// Add type field to distinguish password setup tokens
model EmailVerification {
  // ... existing fields
  type String? // 'REGISTRATION' | 'PASSWORD_SETUP' | 'EMAIL_VERIFICATION'
}
```

#### Option 2: Create `PasswordSetupToken` Table (Recommended)

```prisma
model PasswordSetupToken {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  usedAt    DateTime?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@index([used])
}
```

---

### Frontend Flow

#### 1. **Confirmation Email Template**

```html
<h1>Your Event Registration is Confirmed!</h1>
<p>Event: [Event Name]</p>
<p>Date: [Event Date]</p>

<div>
  <h2>Set Up Your Account</h2>
  <p>Create a password to access your account and manage your tickets.</p>
  <a href="https://eventknit.com/auth/password/setup?token={{token}}">
    Set Password
  </a>
</div>

<div>
  <p>Or continue using passwordless login:</p>
  <a href="https://eventknit.com/auth/signin"> Continue with Email </a>
</div>
```

#### 2. **Password Setup Page** (`/auth/password/setup`)

```tsx
// Verify token on page load
useEffect(() => {
  const token = new URLSearchParams(window.location.search).get("token");
  if (token) {
    verifyToken(token);
  }
}, []);

// Show form after token verified
<form onSubmit={handleSetPassword}>
  <Input type="email" value={email} disabled />
  <Input type="password" placeholder="New Password" />
  <Input type="password" placeholder="Confirm Password" />
  <Button type="submit">Set Password</Button>
</form>;
```

#### 3. **Success Page**

```tsx
// After password set successfully
<div>
  <h1>Password Set Successfully!</h1>
  <p>You can now login with your email and password.</p>
  <Button onClick={() => navigate("/auth/signin")}>Go to Login</Button>
</div>
```

---

## Timing: When Does User Set Password?

### Answer: **Anytime After Purchase (Within 7 Days)**

**Key Points:**

1. ✅ **Not during checkout** - Password setup is post-purchase
2. ✅ **Not required** - User can continue passwordless
3. ✅ **Optional** - User chooses when to set password
4. ✅ **Email link** - User clicks link from confirmation email
5. ✅ **Token expires** - Link valid for 7 days

---

## User Scenarios

### Scenario 1: User Sets Password Immediately

```
Purchase → Email received → Clicks "Set Password" → Sets password → Can login
```

**Timing:** Within minutes of purchase

### Scenario 2: User Sets Password Later

```
Purchase → Email received → Ignores email → Days later → Clicks link → Sets password
```

**Timing:** Anytime within 7 days

### Scenario 3: User Never Sets Password

```
Purchase → Email received → Never clicks link → Uses Email OAuth forever
```

**Timing:** Never (passwordless forever)

### Scenario 4: Token Expired

```
Purchase → Email received → 8 days later → Clicks link → Token expired
  ↓
User can request new token via "Forgot Password" flow
  OR
User can continue with Email OAuth (passwordless)
```

---

## Alternative: Password Setup During First Login

### Option: Prompt for Password on First Login Attempt

**Flow:**

1. User tries to login with email/password
2. System detects: Account exists but no password
3. Redirects to: `/auth/password/setup?email=user@example.com`
4. User sets password
5. Auto-logged in after password set

**Pros:**

- ✅ User sets password when they need it
- ✅ No email link required
- ✅ Natural flow

**Cons:**

- ⚠️ Requires user to attempt login first
- ⚠️ Less discoverable

---

## Recommended Approach

### **Hybrid: Email Link + First Login Prompt**

**Best of both worlds:**

1. ✅ Send "Set Password" link in confirmation email (proactive)
2. ✅ If user tries to login without password, prompt to set it (reactive)
3. ✅ User can choose either method
4. ✅ Password setup is always available

**Implementation:**

- Email link: Token-based (7 days expiry)
- First login: Email-based (no expiry, always available)

---

## Summary

### When User Sets Password:

- ✅ **After purchase** (not during checkout)
- ✅ **Via email link** (from confirmation email)
- ✅ **Anytime within 7 days** (token expiry)
- ✅ **Optional** (can continue passwordless)
- ✅ **OR on first login attempt** (if they try email/password login)

### Flow:

```
Guest Checkout
  ↓
Account Created (passwordless)
  ↓
Confirmation Email Sent (with "Set Password" link)
  ↓
User Clicks Link (anytime within 7 days)
  ↓
Password Setup Page
  ↓
Password Set
  ↓
Can Login with Email/Password
```

### Key Points:

1. ✅ Password setup is **post-purchase** (not during checkout)
2. ✅ User is **not logged in** when setting password
3. ✅ Token validates identity (no login required)
4. ✅ Password setup is **optional** (passwordless always works)
5. ✅ User can set password **anytime** (via link or first login)

---

## Next Steps

1. **Implement password setup token generation** (during guest checkout)
2. **Create password setup endpoint** (verify token + set password)
3. **Add password setup page** (frontend)
4. **Update confirmation email template** (include "Set Password" link)
5. **Add first login prompt** (optional, for better UX)

