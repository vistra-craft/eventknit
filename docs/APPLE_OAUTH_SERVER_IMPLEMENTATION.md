# Apple OAuth Server Implementation Guide

**Status:** Client-side complete ✅ | Server-side TODO 📋
**Created:** 2026-01-15
**Related Commit:** `0bd78a7` - Replace Facebook OAuth with Apple Sign In

---

## Overview

This document outlines the server-side implementation needed to complete the Apple Sign In integration. The client-side has been implemented and is ready to use once the backend endpoints are created.

---

## What Was Done (Client-Side)

✅ **Completed:**
- Created `useAppleAuth` hook with Apple JS SDK integration
- Added Apple Sign In type declarations (`apple.d.ts`)
- Replaced Facebook OAuth with Apple in SimpleRegistration page
- Updated `auth-api.ts` with `appleAuth()` function
- Removed Facebook OAuth code (`useFacebookAuth`, `facebook.d.ts`)

**Client sends to server:**
```typescript
{
  authorizationCode: string,  // One-time authorization code from Apple
  idToken: string,             // JWT ID token with user claims
  role: 'ORGANIZER' | 'ATTENDEE',
  user?: {                     // Only present on first sign in
    name?: {
      firstName?: string,
      lastName?: string
    }
  }
}
```

---

## Required Server-Side Changes

### 1. Install Dependencies

```bash
npm install apple-signin-auth
```

**Why:** Official library for verifying Apple ID tokens and exchanging authorization codes.

---

### 2. Environment Variables

Add to `.env`:

```bash
# Apple Sign In Configuration
APPLE_CLIENT_ID=com.yourcompany.eventknit.service  # Service ID from Apple Developer
APPLE_TEAM_ID=ABC123XYZ                            # 10-character Team ID
APPLE_KEY_ID=DEF456UVW                             # Key ID from Apple Developer
APPLE_PRIVATE_KEY_PATH=/path/to/AuthKey_DEF456UVW.p8  # Private key file
```

**How to get these:**
1. Go to [Apple Developer Console](https://developer.apple.com/account)
2. Create an **App ID** and **Service ID**
3. Create a **Sign in with Apple Key**
4. Download the `.p8` private key file (keep it secure!)
5. Note your Team ID (found in membership section)

---

### 3. Create Apple Auth Service

**File:** `server/src/services/apple.auth.service.ts`

```typescript
import appleSignin from 'apple-signin-auth';
import fs from 'fs';
import path from 'path';

interface AppleAuthConfig {
  clientId: string;
  teamId: string;
  keyId: string;
  privateKeyPath: string;
}

interface AppleTokenResponse {
  sub: string;           // Apple user ID (unique identifier)
  email?: string;        // User's email (may be relay email)
  email_verified?: boolean;
  is_private_email?: boolean;
}

export class AppleAuthService {
  private config: AppleAuthConfig;

  constructor() {
    this.config = {
      clientId: process.env.APPLE_CLIENT_ID!,
      teamId: process.env.APPLE_TEAM_ID!,
      keyId: process.env.APPLE_KEY_ID!,
      privateKeyPath: process.env.APPLE_PRIVATE_KEY_PATH!,
    };

    // Validate config
    if (!this.config.clientId || !this.config.teamId || !this.config.keyId) {
      throw new Error('Missing Apple Sign In configuration');
    }
  }

  /**
   * Verify Apple ID token and return user info
   */
  async verifyIdToken(idToken: string): Promise<AppleTokenResponse> {
    try {
      // Verify the token with Apple's public keys
      const result = await appleSignin.verifyIdToken(idToken, {
        audience: this.config.clientId,
        ignoreExpiration: false,
      });

      return {
        sub: result.sub,
        email: result.email,
        email_verified: result.email_verified === 'true',
        is_private_email: result.is_private_email === 'true',
      };
    } catch (error) {
      throw new Error('Failed to verify Apple ID token');
    }
  }

  /**
   * Exchange authorization code for tokens (optional - use if you need refresh tokens)
   */
  async getAuthToken(authorizationCode: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    id_token: string;
  }> {
    try {
      // Read private key
      const privateKey = fs.readFileSync(
        path.resolve(this.config.privateKeyPath),
        'utf8'
      );

      // Exchange code for tokens
      const response = await appleSignin.getAuthorizationToken(authorizationCode, {
        clientID: this.config.clientId,
        teamID: this.config.teamId,
        keyIdentifier: this.config.keyId,
        privateKey,
      });

      return response;
    } catch (error) {
      throw new Error('Failed to exchange Apple authorization code');
    }
  }
}

export const appleAuthService = new AppleAuthService();
```

---

### 4. Update Auth Routes

**File:** `server/src/routes/auth.routes.ts`

```typescript
// Replace Facebook route with Apple
router.post('/auth/apple', authController.appleAuth);

// Remove Facebook route
// router.post('/auth/facebook', authController.facebookAuth); // DELETE THIS
```

---

### 5. Update Auth Controller

**File:** `server/src/controllers/auth.controller.ts`

Replace `facebookAuth` method with `appleAuth`:

```typescript
import { appleAuthService } from '../services/apple.auth.service';

/**
 * Apple Sign In OAuth
 */
export const appleAuth = async (req: Request, res: Response) => {
  try {
    const { authorizationCode, idToken, role, user } = req.body;

    // Validate required fields
    if (!authorizationCode || !idToken) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code and ID token are required',
      });
    }

    // Verify the ID token with Apple
    const appleUser = await appleAuthService.verifyIdToken(idToken);

    if (!appleUser.sub) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Apple ID token',
      });
    }

    // Check if user already exists with this Apple ID
    let existingUser = await User.findOne({ appleId: appleUser.sub });

    if (existingUser) {
      // User exists - log them in
      const accessToken = generateAccessToken(existingUser);

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: sanitizeUser(existingUser),
          accessToken,
          expiresIn: 3600,
        },
      });
    }

    // New user - check if email exists with different provider
    if (appleUser.email) {
      existingUser = await User.findOne({ email: appleUser.email });

      if (existingUser && !existingUser.appleId) {
        // Link Apple account to existing user
        existingUser.appleId = appleUser.sub;
        await existingUser.save();

        const accessToken = generateAccessToken(existingUser);

        return res.json({
          success: true,
          message: 'Apple account linked successfully',
          data: {
            user: sanitizeUser(existingUser),
            accessToken,
            expiresIn: 3600,
          },
        });
      }
    }

    // Create new user
    const newUser = await User.create({
      email: appleUser.email || `${appleUser.sub}@privaterelay.appleid.com`,
      firstName: user?.name?.firstName || 'User',
      lastName: user?.name?.lastName || '',
      appleId: appleUser.sub,
      role: role || 'ATTENDEE',
      status: 'ACTIVE',
      isEmailVerified: appleUser.email_verified || false,
      hasPassword: false, // OAuth users don't have passwords
    });

    const accessToken = generateAccessToken(newUser);

    return res.json({
      success: true,
      message: 'Registration successful',
      data: {
        user: sanitizeUser(newUser),
        accessToken,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    console.error('Apple auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Apple authentication failed',
    });
  }
};
```

---

### 6. Update User Model

**File:** `server/src/models/user.model.ts`

Add `appleId` field:

```typescript
const userSchema = new Schema({
  // ... existing fields
  googleId: { type: String, sparse: true, unique: true },
  appleId: { type: String, sparse: true, unique: true },  // ADD THIS
  // facebookId: { type: String, sparse: true, unique: true },  // REMOVE THIS
});
```

---

### 7. Update Validation Schema

**File:** `server/src/validations/auth.validations.ts`

Replace Facebook validation with Apple:

```typescript
export const appleAuthSchema = Joi.object({
  authorizationCode: Joi.string().required(),
  idToken: Joi.string().required(),
  role: Joi.string().valid('ATTENDEE', 'ORGANIZER'),
  user: Joi.object({
    name: Joi.object({
      firstName: Joi.string(),
      lastName: Joi.string(),
    }),
  }).optional(),
});

// Remove facebookAuthSchema
```

---

### 8. Database Migration

Run migration to update existing users:

```sql
-- Add appleId column
ALTER TABLE users ADD COLUMN apple_id VARCHAR(255) UNIQUE;

-- Remove facebookId column (optional - can keep for backwards compatibility)
-- ALTER TABLE users DROP COLUMN facebook_id;

-- Create index for faster lookups
CREATE INDEX idx_users_apple_id ON users(apple_id);
```

---

## Testing

### 1. Local Testing

**Set up test credentials:**
1. Create a test Service ID in Apple Developer Console
2. Add `http://localhost:3000` to redirect URIs
3. Add test Apple ID to sandbox testers

**Test flow:**
```bash
# 1. Start server
npm run dev

# 2. Click "Sign in with Apple" on client
# 3. Complete Apple authentication
# 4. Check server logs for token verification
# 5. Verify user created in database with appleId
```

### 2. Production Testing

**Before deploying:**
- [ ] Update Service ID with production domain
- [ ] Store `.p8` private key securely (not in git!)
- [ ] Set all environment variables in production
- [ ] Test token verification with real Apple accounts
- [ ] Verify email relay works (@privaterelay.appleid.com)

---

## Important Notes

### Privacy Features

**Apple's "Hide My Email":**
- Users can choose to hide their real email
- Apple provides a relay email: `abc123@privaterelay.appleid.com`
- Emails sent to relay are forwarded to user's real email
- Your app **never** sees the real email if user chooses to hide it

**Handle accordingly:**
- Don't validate relay emails as "fake"
- Send all emails to the provided address (relay or real)
- Users can revoke access anytime from their Apple ID settings

### Token Verification

**Why verify ID tokens:**
- Prevents token forgery
- Ensures token is intended for your app (audience check)
- Checks expiration and signature validity

**Token lifespan:**
- ID tokens expire after 10 minutes
- Authorization codes are single-use only
- Refresh tokens last 6 months (if requested)

### Security Best Practices

1. **Never commit private key** - Use environment variables
2. **Verify tokens server-side** - Never trust client-only validation
3. **Use HTTPS** - Required for production Apple Sign In
4. **Handle revocation** - Users can revoke access anytime
5. **Link accounts carefully** - Check for existing email before creating duplicate

---

## Troubleshooting

### Common Errors

**"Invalid client"**
- Check `APPLE_CLIENT_ID` matches Service ID in Apple Developer Console
- Verify Service ID is enabled for Sign in with Apple

**"Invalid token"**
- Token may have expired (10-minute lifespan)
- Audience mismatch - ensure clientId matches
- Key ID mismatch - check `APPLE_KEY_ID`

**"Private key error"**
- Path to `.p8` file is incorrect
- File permissions issue
- Private key doesn't match Key ID

**"Authorization code already used"**
- Authorization codes are single-use only
- Generate new code by signing in again

---

## Migration from Facebook

### User Data

**If keeping Facebook users:**
```typescript
// Keep both fields in User model
{
  facebookId: String,  // For existing Facebook users
  appleId: String,     // For new Apple users
}
```

**If migrating fully:**
1. Notify users of change 30 days in advance
2. Offer account linking: Facebook → Apple
3. After deadline, remove `facebookId` field

### Codebase Cleanup

**Files to remove:**
- `useFacebookAuth.ts` (already deleted ✅)
- `facebook.d.ts` (already deleted ✅)
- Server Facebook routes/controllers (after migration complete)

**Environment variables to remove:**
```bash
# VITE_FACEBOOK_APP_ID=...  # DELETE
# FACEBOOK_APP_SECRET=...   # DELETE
```

---

## Checklist

### Server-Side Implementation

- [ ] Install `apple-signin-auth` package
- [ ] Set up Apple Developer account and Service ID
- [ ] Generate and download `.p8` private key
- [ ] Add Apple environment variables to `.env`
- [ ] Create `apple.auth.service.ts`
- [ ] Update `auth.routes.ts` (replace Facebook with Apple)
- [ ] Update `auth.controller.ts` (add `appleAuth` method)
- [ ] Update User model (add `appleId` field)
- [ ] Update validation schemas
- [ ] Run database migration
- [ ] Test locally with sandbox account
- [ ] Deploy to staging and test
- [ ] Deploy to production

### Documentation

- [ ] Update API documentation with Apple endpoint
- [ ] Document environment variables needed
- [ ] Add troubleshooting guide
- [ ] Update user-facing docs (privacy policy, terms of service)

---

## Resources

- [Apple Sign In Overview](https://developer.apple.com/sign-in-with-apple/get-started/)
- [apple-signin-auth npm package](https://www.npmjs.com/package/apple-signin-auth)
- [Apple Developer Console](https://developer.apple.com/account)
- [Apple Sign In REST API](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api)

---

**Next Steps:** Implement server-side changes following this guide, test thoroughly, and deploy!
