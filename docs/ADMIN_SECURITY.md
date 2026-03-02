# Admin Panel Security - Domain & IP Whitelisting

## Overview

The EventKnit admin panel now includes **comprehensive security controls** to restrict access based on:
1. **Domain/Origin Whitelisting** - Control which domains can access admin endpoints
2. **IP Address Whitelisting** - Restrict admin access to specific IP addresses or ranges
3. **Subdomain Enforcement** - Optionally require access from specific subdomains (e.g., `admin.eventknit.com`)

This provides **defense-in-depth** security for the admin dashboard beyond just authentication.

---

## 🔒 Security Features

### 1. Domain/Origin Whitelisting

Control which frontend origins can make requests to admin endpoints.

**Supports**:
- ✅ Exact domain matching (`https://admin.eventknit.com`)
- ✅ Multiple origins (configured via environment or database)
- ✅ Wildcard subdomains (`*.eventknit.com`)
- ✅ Localhost auto-allow in development
- ✅ Dynamic updates via API (no restart required)

### 2. IP Address Whitelisting

Restrict admin access to trusted IP addresses.

**Supports**:
- ✅ Single IP addresses (`203.0.113.1`)
- ✅ CIDR notation (`192.168.1.0/24`)
- ✅ Wildcard patterns (`192.168.*`)
- ✅ Multiple IPs/ranges
- ✅ Auto-disabled in development mode
- ✅ Dynamic updates via API

### 3. Subdomain Enforcement (Optional)

Require admin access only from a specific subdomain.

**Example**: Force all admin access through `admin.eventknit.com` only

---

## 📝 Configuration

### Environment Variables

Add these to your `.env.development` file:

```bash
# ========== Admin Security Settings ==========

# Allowed origins for admin panel (comma-separated)
ADMIN_ALLOWED_ORIGINS=https://admin.eventknit.com,https://admin.staging.eventknit.com

# Allowed IP addresses for admin access (comma-separated)
# Supports: regular IPs, CIDR notation, wildcards
ADMIN_ALLOWED_IPS=203.0.113.1,192.168.1.0/24,10.0.*

# Enable IP whitelisting (default: false)
ADMIN_ENABLE_IP_WHITELIST=true

# Allow requests with no origin (mobile apps, curl, etc.)
ADMIN_ALLOW_NO_ORIGIN=false  # Set to true in development only

# Development mode settings
ADMIN_ALLOW_LOCALHOST_IN_DEV=true   # Auto-allow localhost in dev
ADMIN_ALLOW_ALL_IPS_IN_DEV=true      # Disable IP checks in dev

# Subdomain enforcement (optional)
ADMIN_REQUIRE_SUBDOMAIN=true
ADMIN_REQUIRED_SUBDOMAIN=admin.eventknit.com

# Geographic restrictions (future feature)
ADMIN_ENABLE_GEO_RESTRICTION=false
ADMIN_ALLOWED_COUNTRIES=US,KE,GB
```

### Default Configuration

**Development Mode** (NODE_ENV=development):
- ✅ All `localhost:*` origins allowed automatically
- ✅ IP whitelist disabled by default
- ✅ No subdomain enforcement

**Production Mode** (NODE_ENV=production):
- ❌ Only configured origins allowed
- ❌ IP whitelist enforced if enabled
- ✅ Subdomain enforcement recommended

---

## 🚀 Usage

### Quick Start

1. **Environment Configuration** (Static - requires restart):
   ```bash
   # .env.development file
   ADMIN_ALLOWED_ORIGINS=https://admin.mycompany.com
   ADMIN_ENABLE_IP_WHITELIST=true
   ADMIN_ALLOWED_IPS=203.0.113.1,192.168.1.0/24
   ```

2. **Database Configuration** (Dynamic - no restart needed):
   Use the admin security management endpoints (see API section below)

### Priority Order

The middleware checks in this order:
1. **Origin Check** → Must be in allowed origins list
2. **IP Check** → Must be in allowed IPs list (if enabled)
3. **Subdomain Check** → Must match required subdomain (if enabled)
4. **Authentication** → Must have valid JWT token
5. **Authorization** → Must have ADMIN_STAFF role or higher

---

## 🔧 API Endpoints

All endpoints require **SUPERADMIN** role.

### Get All Security Settings

```http
GET /api/v1/admin/security/settings
```

**Response**:
```json
{
  "success": true,
  "data": {
    "allowedOrigins": {
      "origins": ["https://admin.eventknit.com"],
      "lastUpdated": "2026-01-28T12:00:00Z",
      "updatedBy": "user-id"
    },
    "allowedIPs": {
      "ips": ["203.0.113.1", "192.168.1.0/24"],
      "lastUpdated": "2026-01-28T12:00:00Z",
      "updatedBy": "user-id"
    }
  }
}
```

### Manage Allowed Origins

#### Get Allowed Origins
```http
GET /api/v1/admin/security/allowed-origins
```

#### Update Allowed Origins
```http
PUT /api/v1/admin/security/allowed-origins
Content-Type: application/json

{
  "origins": [
    "https://admin.eventknit.com",
    "https://admin.staging.eventknit.com",
    "*.eventknit.com"
  ]
}
```

#### Add Single Origin
```http
POST /api/v1/admin/security/allowed-origins
Content-Type: application/json

{
  "origin": "https://admin.new-domain.com"
}
```

#### Remove Origin
```http
DELETE /api/v1/admin/security/allowed-origins/https%3A%2F%2Fadmin.old-domain.com
```

### Manage Allowed IPs

#### Get Allowed IPs
```http
GET /api/v1/admin/security/allowed-ips
```

#### Update Allowed IPs
```http
PUT /api/v1/admin/security/allowed-ips
Content-Type: application/json

{
  "ips": [
    "203.0.113.1",
    "192.168.1.0/24",
    "10.0.*"
  ]
}
```

#### Add Single IP
```http
POST /api/v1/admin/security/allowed-ips
Content-Type: application/json

{
  "ip": "198.51.100.42"
}
```

#### Remove IP
```http
DELETE /api/v1/admin/security/allowed-ips/203.0.113.1
```

---

## 🧪 Testing

### Test Origin Whitelisting

```bash
# Should succeed (if origin is allowed)
curl -X GET https://api.eventknit.com/api/v1/admin/dashboard/stats \
  -H "Origin: https://admin.eventknit.com" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Should fail with 403
curl -X GET https://api.eventknit.com/api/v1/admin/dashboard/stats \
  -H "Origin: https://malicious-site.com" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test IP Whitelisting

```bash
# From allowed IP - should succeed
curl -X GET https://api.eventknit.com/api/v1/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# From non-allowed IP - should fail with 403
```

---

## 🔍 Error Responses

### Origin Not Allowed
```json
{
  "success": false,
  "error": "Access denied: Origin not allowed for admin access",
  "code": "ADMIN_ORIGIN_DENIED"
}
```

### IP Not Allowed
```json
{
  "success": false,
  "error": "Access denied: IP address not allowed for admin access",
  "code": "ADMIN_IP_DENIED"
}
```

### Subdomain Not Allowed
```json
{
  "success": false,
  "error": "Access denied: Admin access only allowed from admin.eventknit.com",
  "code": "ADMIN_SUBDOMAIN_DENIED"
}
```

---

## 📊 Monitoring & Logging

All security check failures are logged with:
- Origin/Referer header
- Client IP address
- Request path
- Timestamp

**Example log**:
```
WARN: Admin access denied - origin not allowed
{
  "origin": "https://malicious-site.com",
  "clientIP": "203.0.113.42",
  "path": "/api/v1/admin/users"
}
```

---

## 🛡️ Best Practices

### Production Deployment

1. **Always enable origin whitelisting**:
   ```bash
   ADMIN_ALLOWED_ORIGINS=https://admin.yourcompany.com
   ```

2. **Enable IP whitelisting for sensitive operations**:
   ```bash
   ADMIN_ENABLE_IP_WHITELIST=true
   ADMIN_ALLOWED_IPS=your.office.ip,your.vpn.range/24
   ```

3. **Use subdomain enforcement**:
   ```bash
   ADMIN_REQUIRE_SUBDOMAIN=true
   ADMIN_REQUIRED_SUBDOMAIN=admin.yourcompany.com
   ```

4. **Disable development bypass settings**:
   ```bash
   ADMIN_ALLOW_LOCALHOST_IN_DEV=false
   ADMIN_ALLOW_ALL_IPS_IN_DEV=false
   ADMIN_ALLOW_NO_ORIGIN=false
   ```

### Wildcard Usage

**Secure**:
```
*.eventknit.com  # Only subdomains of eventknit.com
```

**Insecure**:
```
*                # DO NOT DO THIS - allows all domains
```

### IP Range Examples

```bash
# Single IP
ADMIN_ALLOWED_IPS=203.0.113.1

# CIDR range
ADMIN_ALLOWED_IPS=192.168.1.0/24

# Wildcard (simple pattern)
ADMIN_ALLOWED_IPS=192.168.*

# Multiple (comma-separated)
ADMIN_ALLOWED_IPS=203.0.113.1,192.168.1.0/24,10.0.*
```

---

## 🔄 Cache & Updates

The middleware caches allowed origins and IPs for **5 minutes** to reduce database queries.

**When to refresh cache**:
- ✅ Automatically refreshed every 5 minutes
- ✅ Automatically refreshed after API updates
- ✅ Manually refresh by restarting the server

**No restart needed** when updating via API endpoints!

---

## 🚨 Emergency Access

If you get locked out:

1. **SSH into the server**
2. **Update environment variables**:
   ```bash
   # Temporarily disable IP whitelist
   export ADMIN_ENABLE_IP_WHITELIST=false

   # Temporarily allow all localhost
   export ADMIN_ALLOW_LOCALHOST_IN_DEV=true
   ```

3. **Restart the server**
4. **Fix the whitelist settings via API**
5. **Re-enable security**

---

## 🔗 Related Documentation

- [Admin Dashboard API](./ADMIN_DASHBOARD.md)
- [Authentication](./AUTHENTICATION.md)
- [Role-Based Access Control](./RBAC.md)

---

## 📝 Changelog

### Version 1.0.0 (2026-01-28)
- ✅ Initial release
- ✅ Domain/origin whitelisting
- ✅ IP address whitelisting
- ✅ Subdomain enforcement
- ✅ Dynamic configuration via API
- ✅ Development mode bypasses
- ✅ Caching for performance
- ✅ Comprehensive logging

---

## 🤝 Support

For issues or questions:
- GitHub Issues: https://github.com/your-repo/issues
- Email: security@eventknit.com
