# Postman Token Troubleshooting Guide

## Common Causes of "Invalid or expired token" Error

### 1. **Missing or Incorrect Authorization Header**

**Problem**: Token not sent or header format is wrong.

**Solution**:

1. In Postman, go to the **Authorization** tab
2. Select **Type**: `Bearer Token`
3. Enter your token in the **Token** field (without "Bearer " prefix)

**OR manually set in Headers**:

- **Key**: `Authorization`
- **Value**: `Bearer <your-access-token>`
- **Important**: Must have space between "Bearer" and the token

**Example**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**❌ Wrong**:

```
Authorization: Bearer<no-space>token
Authorization: token  (missing Bearer prefix)
```

### 2. **Token Expired**

**Problem**: Access tokens expire in **15 minutes** by default (`JWT_EXPIRES_IN=15m`).

**Solution**:

1. Get a fresh token by calling the **Login** endpoint again
2. Or use the **Refresh Token** endpoint to get a new access token

**Steps**:

1. Call `POST /api/v1/auth/refresh` with your refresh token
2. Copy the new `accessToken` from response
3. Update the Authorization header in Postman

### 3. **Using Refresh Token Instead of Access Token**

**Problem**: Using the refresh token where an access token is required.

**Solution**: Use the **accessToken** for protected routes, not the refreshToken.

**After Login Response**:

```json
{
  "data": {
    "accessToken": "use-this-for-protected-routes",  ← Use this
    "refreshToken": "use-this-only-for-refresh-endpoint"  ← Don't use this
  }
}
```

### 4. **Token from Different Server/Environment**

**Problem**: Token was generated on a different server or with different JWT_SECRET.

**Solution**:

1. Make sure you're calling the same server that issued the token
2. If server restarted, JWT_SECRET might have changed (in dev mode)
3. Login again to get a new token

### 5. **User Account Not Active**

**Problem**: User status is not ACTIVE or PENDING_VERIFICATION.

**Check**: Verify user status in database or login again (login activates account).

---

## Step-by-Step Fix in Postman

### Step 1: Login and Save Token Automatically

1. Create a **Login** request: `POST {{base_url}}/api/v1/auth/login`

2. Go to **Tests** tab and add this script:

```javascript
if (pm.response.code === 200) {
  const jsonData = pm.response.json();

  // Save access token
  pm.environment.set("access_token", jsonData.data.accessToken);

  // Save refresh token
  pm.environment.set("refresh_token", jsonData.data.refreshToken);

  // Save expiresIn for reference
  pm.environment.set("token_expires_in", jsonData.data.expiresIn);

  console.log("✅ Tokens saved to environment variables");
}
```

3. Run the login request
4. Check that tokens are saved in your environment variables

### Step 2: Use Token in Protected Routes

**Method 1: Using Authorization Tab (Recommended)**

1. Open your protected request (e.g., `GET /api/v1/auth/me`)
2. Go to **Authorization** tab
3. Select **Type**: `Bearer Token`
4. In **Token** field, enter: `{{access_token}}`
5. Send request

**Method 2: Using Headers**

1. Go to **Headers** tab
2. Add header:
   - **Key**: `Authorization`
   - **Value**: `Bearer {{access_token}}`

### Step 3: Auto-Refresh Expired Tokens (Advanced)

Create a **Pre-request Script** for protected endpoints:

```javascript
// Check if token is about to expire (optional - for advanced use)
// For now, just use the token from environment

// If token validation fails, you can auto-refresh:
// This requires implementing token expiry checking
```

**Simple Approach**: Just re-login when you get token errors.

---

## Quick Debug Checklist

### ✅ Verify Token Format

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ✅ Check Token in Environment

1. Click **Environments** in Postman
2. Verify `access_token` variable exists and has a value
3. Make sure you're using the correct environment

### ✅ Test Token Manually

1. Copy token from environment
2. Decode at https://jwt.io (view only, don't submit sensitive tokens)
3. Check `exp` field - if it's in the past, token is expired

### ✅ Verify User Status

Run this query in database:

```sql
SELECT id, email, status, role FROM "User" WHERE email = 'your-email@example.com';
```

Status must be: `ACTIVE` or `PENDING_VERIFICATION`

---

## Complete Working Example

### 1. Login Request

```
POST {{base_url}}/api/v1/auth/login
Headers:
  Content-Type: application/json
Body:
{
  "email": "test@example.com",
  "password": "Test123!@#"
}
```

### 2. Save Tokens (Tests Tab)

```javascript
if (pm.response.code === 200) {
  const jsonData = pm.response.json();
  pm.environment.set("access_token", jsonData.data.accessToken);
  pm.environment.set("refresh_token", jsonData.data.refreshToken);
}
```

### 3. Protected Request (e.g., Get Profile)

```
GET {{base_url}}/api/v1/auth/me
Authorization Tab:
  Type: Bearer Token
  Token: {{access_token}}
```

---

## Common Errors and Solutions

| Error                        | Cause                           | Solution                                   |
| ---------------------------- | ------------------------------- | ------------------------------------------ |
| "No token provided"          | Missing Authorization header    | Add `Authorization: Bearer <token>` header |
| "Invalid or expired token"   | Token expired or invalid        | Re-login or refresh token                  |
| "User not found"             | User deleted from database      | Re-register user                           |
| "User account is not active" | User status is SUSPENDED/BANNED | Check user status, login might activate it |

---

## Testing Token Validity

### Test 1: Decode Token (JWT.io)

1. Go to https://jwt.io
2. Paste your token
3. Check:
   - **exp** (expiration) - should be in the future
   - **userId**, **email**, **role** - should match your user

### Test 2: Test with curl

```bash
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test 3: Check Server Logs

Look for JWT verification errors in server logs:

```bash
tail -f logs/application-*.log
```

---

## Environment Variables Setup

Create these variables in Postman:

| Variable        | Description              | Example Value           |
| --------------- | ------------------------ | ----------------------- |
| `base_url`      | Server URL               | `http://localhost:3001` |
| `access_token`  | Access token from login  | `eyJhbGciOi...`         |
| `refresh_token` | Refresh token from login | `eyJhbGciOi...`         |

---

## Pro Tips

1. **Use Postman Collections**: Save all requests in a collection with shared variables
2. **Auto-save tokens**: Use Tests tab to automatically save tokens after login
3. **Token expiry reminder**: Access tokens expire in 15 minutes, refresh them often
4. **Separate environments**: Use different environments for dev/staging/prod
5. **Clean tokens**: Clear environment variables when switching between users

---

## Still Having Issues?

1. **Check server logs** for detailed error messages
2. **Verify JWT_SECRET** matches between token generation and verification
3. **Test with curl** to isolate Postman-specific issues
4. **Try fresh login** to eliminate token issues
5. **Check database** - user must exist and be active

---

## Quick Fix Script

Add this to your Postman **Collection** level Pre-request Script:

```javascript
// Auto-refresh token if 401 (requires refresh token setup)
pm.sendRequest(
  {
    url: pm.environment.get("base_url") + "/api/v1/auth/refresh",
    method: "POST",
    header: {
      "Content-Type": "application/json",
    },
    body: {
      mode: "raw",
      raw: JSON.stringify({
        refreshToken: pm.environment.get("refresh_token"),
      }),
    },
  },
  function (err, res) {
    if (res && res.code === 200) {
      const jsonData = res.json();
      pm.environment.set("access_token", jsonData.data.accessToken);
      pm.environment.set("refresh_token", jsonData.data.refreshToken);
    }
  }
);
```

**Note**: This is advanced and may cause issues if not configured properly. Start with manual token management first.





