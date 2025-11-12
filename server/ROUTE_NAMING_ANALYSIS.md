# Route Naming Analysis: EventKnit vs Wheela

## Current Route Comparison

| Feature              | EventKnit             | Wheela                         | REST Best Practice                       | Winner        |
| -------------------- | --------------------- | ------------------------------ | ---------------------------------------- | ------------- |
| **Register**         | `/signup`             | `/register`                    | `/register` (noun)                       | ✅ Wheela     |
| **Profile (Get)**    | `/profile`            | `/me`                          | `/me` (idiomatic)                        | ✅ Wheela     |
| **Profile (Update)** | ❌ Missing            | `/profile`                     | `/profile` (resource)                    | ✅ Wheela     |
| **Forgot Password**  | `/forgot-password`    | `/password/reset-request`      | `/password/reset-request` (hierarchical) | ✅ Wheela     |
| **Reset Password**   | `/reset-password`     | `/password/reset-confirm`      | `/password/reset-confirm` (hierarchical) | ✅ Wheela     |
| **Verify Email**     | `/verify-email` (GET) | `/verify-email/confirm` (POST) | `/verify-email/*` (hierarchical)         | ⚠️ Both valid |

## Detailed Analysis

### 1. Register: `/signup` vs `/register`

**EventKnit**: `/signup`

- ✅ Shorter, more casual
- ✅ Common in consumer apps (Twitter, Instagram, GitHub)
- ❌ Not RESTful (verb-based)
- ❌ Less professional/enterprise-friendly

**Wheela**: `/register`

- ✅ RESTful (noun-based)
- ✅ More formal/enterprise-appropriate
- ✅ Consistent with REST principles
- ✅ Better for B2B/enterprise APIs

**Industry Usage**:

- **Consumer apps**: Often use `/signup` (casual)
- **Enterprise/B2B**: Prefer `/register` (formal)
- **API documentation**: Majority use `/register`

**Recommendation**: **Wheela's `/register` is better** for consistency with REST principles and enterprise standards.

---

### 2. Profile: `/profile` vs `/me`

**EventKnit**: `/profile`

- ✅ Explicit resource name
- ✅ Can work for GET/PUT operations
- ❌ Requires `{userId}` for other users' profiles
- ❌ Less idiomatic for "current user"

**Wheela**: `/me`

- ✅ Idiomatic for "current authenticated user" (OAuth 2.0 standard)
- ✅ Used by GitHub, Slack, Twitter APIs
- ✅ Clear separation: `/me` = current user, `/users/{id}` = other users
- ✅ Shorter and more intuitive

**Industry Examples**:

- GitHub: `GET /user` (aliased as `/me` in some docs)
- Slack: `GET /users.identity` (conceptually `/me`)
- Twitter: `GET /account/verify_credentials` (their version)
- OAuth 2.0 spec: Recommends `/me` pattern

**Recommendation**: **Wheela's `/me` is better** - it's an industry standard for "current user" endpoints.

---

### 3. Password Reset: `/forgot-password` vs `/password/reset-request`

**EventKnit**: `/forgot-password`

- ✅ User-friendly, clear intent
- ✅ Common in web forms
- ❌ Not hierarchical
- ❌ Verb-based (less RESTful)
- ❌ Doesn't group related endpoints

**Wheela**: `/password/reset-request`

- ✅ Hierarchical structure (`/password/*` groups all password operations)
- ✅ RESTful (resource-based: `password` resource)
- ✅ Better for API discoverability
- ✅ Consistent with `/password/reset-confirm` and `/password/change`

**Related Routes**:

```
Wheela Structure:
  /password/reset-request    (request reset)
  /password/reset-confirm    (confirm reset)
  /password/change           (authenticated change)

EventKnit Structure:
  /forgot-password          (request reset)
  /reset-password           (confirm reset)
  ❌ Missing: /change-password
```

**Recommendation**: **Wheela's hierarchical structure is superior** - groups related operations logically.

---

### 4. Email Verification

**EventKnit**: `GET /verify-email?token=...`

- ✅ Simple GET request (can be clicked in email)
- ✅ Common pattern for email verification
- ✅ Good UX (single click)

**Wheela**: `POST /verify-email/confirm` with body

- ✅ More secure (POST with CSRF protection)
- ✅ Hierarchical structure
- ✅ Allows for additional verification methods
- ⚠️ Requires two-step process (`/request` + `/confirm`)

**Both are valid**, but serve different use cases:

- **EventKnit**: Better for email click-through verification
- **Wheela**: Better for programmatic/API verification with codes

---

## REST API Design Principles Applied

### ✅ Wheela Follows Better REST Principles:

1. **Resource-Based Naming**: `/password/*` groups password operations
2. **Hierarchical Structure**: Related endpoints are nested
3. **Consistent Patterns**: `/verify-email/request`, `/verify-email/confirm`
4. **Idiomatic Endpoints**: `/me` for current user

### ⚠️ EventKnit Has Some Issues:

1. **Verb-Based Routes**: `/signup`, `/forgot-password` (actions, not resources)
2. **Flat Structure**: No grouping of related operations
3. **Inconsistent Naming**: Mix of patterns

---

## Impact Analysis

### 1. API Discoverability

**Wheela Pattern**:

```
/api/v1/auth/
  ├── register              (clear: register user)
  ├── login                 (clear: login)
  ├── me                     (clear: current user)
  ├── profile                (clear: update profile)
  ├── password/
  │   ├── reset-request     (clear: password operations grouped)
  │   ├── reset-confirm
  │   └── change
  └── verify-email/
      ├── request            (clear: email operations grouped)
      └── confirm
```

**EventKnit Pattern**:

```
/api/v1/auth/
  ├── signup               (unclear: is it "sign up"?)
  ├── login                 (clear)
  ├── profile               (unclear: GET or PUT?)
  ├── forgot-password       (scattered)
  ├── reset-password        (not grouped with forgot)
  └── verify-email          (no request/confirm separation)
```

**Winner**: **Wheela** - better organization and discoverability

### 2. Frontend Integration

**EventKnit Routes**:

```javascript
// Scattered, inconsistent
authAPI.signup();
authAPI.forgotPassword();
authAPI.resetPassword();
authAPI.getProfile(); // Not clear if it's "me" or "other user"
```

**Wheela Routes**:

```javascript
// Grouped, hierarchical
authAPI.register();
authAPI.getMe(); // Clear: current user
authAPI.updateProfile(); // Clear: update current user
authAPI.password.requestReset();
authAPI.password.confirmReset();
authAPI.password.change();
```

**Winner**: **Wheela** - clearer API structure for frontend developers

### 3. API Documentation

**Wheela Structure** is easier to document:

```
# Authentication
## User Management
- POST /register
- POST /login
- GET /me
- PUT /profile

## Password Management
- POST /password/reset-request
- POST /password/reset-confirm
- POST /password/change

## Verification
- POST /verify-email/request
- POST /verify-email/confirm
```

**EventKnit Structure** is harder to organize:

```
# Authentication
- POST /signup
- POST /login
- GET /profile
- POST /forgot-password
- POST /reset-password
- GET /verify-email
```

**Winner**: **Wheela** - better documentation structure

---

## Recommendations

### Short-Term Fix (EventKnit)

Add aliases for Wheela compatibility:

```typescript
router.post("/register", AuthController.register); // Alias for /signup
router.get("/me", AuthController.getProfile); // Alias for /profile
router.post("/password/reset-request", AuthController.forgotPassword);
router.post("/password/reset-confirm", AuthController.resetPassword);
```

### Long-Term Fix (EventKnit)

**Adopt Wheela's naming convention**:

1. Change `/signup` → `/register`
2. Change `/profile` (GET) → `/me`
3. Add `/profile` (PUT) for updates
4. Reorganize password routes:
   - `/forgot-password` → `/password/reset-request`
   - `/reset-password` → `/password/reset-confirm`
   - Add `/password/change`
5. Reorganize email verification:
   - Keep `GET /verify-email?token=...` (for email links)
   - Add `POST /verify-email/request` (for code-based)
   - Add `POST /verify-email/confirm` (for code confirmation)

### Migration Strategy

1. **Phase 1**: Add aliases (support both patterns)
2. **Phase 2**: Update documentation (recommend new routes)
3. **Phase 3**: Deprecate old routes (with warnings)
4. **Phase 4**: Remove old routes (after grace period)

---

## Conclusion

**Wheela's route naming is superior** for:

- ✅ REST API best practices
- ✅ API discoverability
- ✅ Hierarchical organization
- ✅ Industry standards (`/me`, resource grouping)

**EventKnit should adopt Wheela's patterns** for better API design, though `/signup` is acceptable for consumer-facing apps.

**The naming inconsistency IS a real problem** because:

1. Frontend developers need to learn two different APIs
2. API documentation is harder to maintain
3. Code sharing between projects is impossible
4. Onboarding new developers is confusing

**Recommendation**: **Standardize on Wheela's naming convention** - it follows REST best practices and industry standards.








