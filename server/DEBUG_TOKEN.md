# Debug Token Issues

## Step 1: Login Again and Copy Token

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

Copy the `accessToken` from the response.

## Step 2: Decode Token at jwt.io

1. Go to https://jwt.io
2. Paste your token in the "Encoded" section
3. Check the payload:
   - Should have `userId`, `email`, `role`
   - Should NOT have `"type":"refresh"`
   - Check `exp` - should be in the future

## Step 3: Test with curl

```bash
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## Common Issues

### Issue 1: Using Refresh Token

**Symptoms**: Token has `"type":"refresh"` in payload
**Fix**: Use `accessToken` from login, not `refreshToken`

### Issue 2: Token Expired

**Symptoms**: `exp` value is in the past
**Fix**: Login again to get fresh token

### Issue 3: Wrong JWT_SECRET

**Symptoms**: Token decodes but server rejects it
**Fix**: Check `.env.development` has correct `JWT_SECRET`

### Issue 4: Token Format Wrong

**Symptoms**: Header not recognized
**Fix**: Use `Authorization: Bearer <token>` (with space)





