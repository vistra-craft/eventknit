# Role Privileges Design for Directors

## Recommended Approach: 1 Superadmin + 2 Specialized Admin Roles

### Role Structure

1. **SUPERADMIN** (Owner - You)
2. **ADMIN_STAFF** (Dev/Assistant Director)
3. **MARKETER** (Marketing Director)

---

## Privilege Matrix

### SUPERADMIN (Owner) - Full Access

| Capability               | Access  | Notes                                          |
| ------------------------ | ------- | ---------------------------------------------- |
| **User Management**      | ✅ Full | Create/update/delete all users, all roles      |
| **Role Management**      | ✅ Full | Assign any role, including SUPERADMIN          |
| **System Configuration** | ✅ Full | JWT secrets, database, server config           |
| **Security Settings**    | ✅ Full | Password policies, rate limits, security rules |
| **Audit Logs**           | ✅ Full | View all audit logs, system events             |
| **Billing/Payments**     | ✅ Full | Payment settings, subscription management      |
| **Data Management**      | ✅ Full | Export data, backups, database access          |
| **Email Configuration**  | ✅ Full | SMTP settings, email templates                 |
| **KYC Approvals**        | ✅ Full | Approve/reject organizer KYC                   |
| **Event Management**     | ✅ Full | View/edit all events                           |
| **Organizer Management** | ✅ Full | Create/manage organizers, approve accounts     |
| **Staff Management**     | ✅ Full | Manage all staff across all organizers         |
| **Marketing Tools**      | ✅ Full | Campaigns, analytics, reports                  |
| **Support Tools**        | ✅ Full | Ticket management, user support                |
| **Delete Users**         | ✅ Full | Hard delete (with confirmation)                |
| **System Maintenance**   | ✅ Full | Maintenance mode, system updates               |

**Special Privileges:**

- Can create other SUPERADMIN users (but should be used sparingly)
- Can access raw database if needed
- Can modify role hierarchy
- Can override any restriction

---

### ADMIN_STAFF (Dev/Assistant Director) - Technical & Operations

| Capability               | Access                      | Notes                                                                                                      |
| ------------------------ | --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **User Management**      | ✅ Full (except SUPERADMIN) | Create/update/delete users, but cannot create SUPERADMIN                                                   |
| **Role Management**      | ✅ Limited                  | Can assign: ADMIN_STAFF, MARKETER, SUPPORT, TELLER, ORGANIZER, ORGANIZER_STAFF, ORGANIZER_TELLER, ATTENDEE |
| **System Configuration** | ✅ Full                     | JWT secrets, database, server config, technical settings                                                   |
| **Security Settings**    | ✅ Full                     | Password policies, rate limits, security rules                                                             |
| **Audit Logs**           | ✅ Full                     | View all audit logs, system events                                                                         |
| **Billing/Payments**     | ✅ Full                     | Payment settings, subscription management                                                                  |
| **Data Management**      | ✅ Full                     | Export data, backups, database access                                                                      |
| **Email Configuration**  | ✅ Full                     | SMTP settings, email templates                                                                             |
| **KYC Approvals**        | ✅ Full                     | Approve/reject organizer KYC                                                                               |
| **Event Management**     | ✅ Full                     | View/edit all events                                                                                       |
| **Organizer Management** | ✅ Full                     | Create/manage organizers, approve accounts                                                                 |
| **Staff Management**     | ✅ Full                     | Manage all staff across all organizers                                                                     |
| **Marketing Tools**      | ⚠️ View Only                | Can view campaigns/analytics, but not create/edit                                                          |
| **Support Tools**        | ✅ Full                     | Ticket management, user support                                                                            |
| **Delete Users**         | ✅ Soft Delete              | Can soft delete users (not hard delete)                                                                    |
| **System Maintenance**   | ✅ Full                     | Maintenance mode, system updates                                                                           |

**Special Privileges:**

- Can create ADMIN_STAFF users (for additional dev/ops staff)
- Cannot create SUPERADMIN users
- Cannot modify role hierarchy
- Can access technical/admin APIs

**Restrictions:**

- ❌ Cannot create/assign SUPERADMIN role
- ❌ Cannot delete SUPERADMIN users
- ❌ Cannot modify SUPERADMIN accounts
- ❌ Cannot modify critical system settings (if you want to add this layer)

---

### MARKETER (Marketing Director) - Business & Marketing Operations

| Capability               | Access                   | Notes                                                                                 |
| ------------------------ | ------------------------ | ------------------------------------------------------------------------------------- |
| **User Management**      | ✅ Limited               | Create/update users with roles: MARKETER, SUPPORT, ORGANIZER, ATTENDEE                |
| **Role Management**      | ✅ Limited               | Can assign: MARKETER, SUPPORT, ORGANIZER, ORGANIZER_STAFF, ORGANIZER_TELLER, ATTENDEE |
| **System Configuration** | ❌ None                  | No access to technical settings                                                       |
| **Security Settings**    | ❌ None                  | No access to security configuration                                                   |
| **Audit Logs**           | ⚠️ Limited               | View audit logs related to marketing, users, events                                   |
| **Billing/Payments**     | ⚠️ View Only             | View payment reports, but cannot modify settings                                      |
| **Data Management**      | ⚠️ Export Only           | Export marketing data, user data (no database access)                                 |
| **Email Configuration**  | ⚠️ Templates Only        | Can edit email templates, but not SMTP settings                                       |
| **KYC Approvals**        | ✅ Full                  | Approve/reject organizer KYC                                                          |
| **Event Management**     | ✅ Full                  | Create/edit/view all events                                                           |
| **Organizer Management** | ✅ Full                  | Create/manage organizers, approve accounts                                            |
| **Staff Management**     | ✅ Full                  | Manage all staff across all organizers                                                |
| **Marketing Tools**      | ✅ Full                  | Campaigns, analytics, reports, email marketing                                        |
| **Support Tools**        | ✅ Full                  | Ticket management, user support                                                       |
| **Delete Users**         | ⚠️ Soft Delete (Limited) | Can soft delete users (except SUPERADMIN, ADMIN_STAFF)                                |
| **System Maintenance**   | ❌ None                  | No access to maintenance mode                                                         |

**Special Privileges:**

- Can create MARKETER users (for marketing team)
- Can create SUPPORT users (for support team)
- Can manage all business-facing operations
- Can access marketing analytics and reports

**Restrictions:**

- ❌ Cannot create/assign SUPERADMIN or ADMIN_STAFF roles
- ❌ Cannot access technical/system configuration
- ❌ Cannot modify security settings
- ❌ Cannot access raw database
- ❌ Cannot delete SUPERADMIN or ADMIN_STAFF users

---

## Detailed Privilege Breakdown

### 1. User Management Privileges

#### SUPERADMIN

- ✅ Create users with **any role** (including SUPERADMIN)
- ✅ Update **any user** (including role changes)
- ✅ Delete **any user** (hard delete available)
- ✅ Force password reset for any user
- ✅ Suspend/activate any user

#### ADMIN_STAFF

- ✅ Create users with roles: ADMIN_STAFF, MARKETER, SUPPORT, TELLER, ORGANIZER, ORGANIZER_STAFF, ORGANIZER_TELLER, ATTENDEE
- ✅ Update users with roles: ADMIN_STAFF, MARKETER, SUPPORT, TELLER, ORGANIZER, ORGANIZER_STAFF, ORGANIZER_TELLER, ATTENDEE
- ❌ Cannot create/update SUPERADMIN users
- ✅ Delete users (soft delete only, except SUPERADMIN)
- ✅ Force password reset (except SUPERADMIN)
- ✅ Suspend/activate users (except SUPERADMIN)

#### MARKETER

- ✅ Create users with roles: MARKETER, SUPPORT, ORGANIZER, ORGANIZER_STAFF, ORGANIZER_TELLER, ATTENDEE
- ✅ Update users with roles: MARKETER, SUPPORT, ORGANIZER, ORGANIZER_STAFF, ORGANIZER_TELLER, ATTENDEE
- ❌ Cannot create/update SUPERADMIN or ADMIN_STAFF users
- ✅ Delete users (soft delete, except SUPERADMIN, ADMIN_STAFF)
- ✅ Force password reset (except SUPERADMIN, ADMIN_STAFF)
- ✅ Suspend/activate users (except SUPERADMIN, ADMIN_STAFF)

---

### 2. System Configuration Privileges

#### SUPERADMIN

- ✅ Full access to all configuration
- ✅ Modify JWT secrets
- ✅ Modify database settings
- ✅ Modify server settings
- ✅ Modify role hierarchy

#### ADMIN_STAFF

- ✅ Full access to all configuration
- ✅ Modify JWT secrets
- ✅ Modify database settings
- ✅ Modify server settings
- ❌ Cannot modify role hierarchy (or can with approval)

#### MARKETER

- ❌ No access to system configuration
- ❌ Cannot modify technical settings

---

### 3. Business Operations Privileges

#### SUPERADMIN

- ✅ Full access to all business operations
- ✅ View all analytics
- ✅ Manage all events
- ✅ Manage all organizers

#### ADMIN_STAFF

- ✅ Full access to all business operations
- ✅ View all analytics
- ✅ Manage all events
- ✅ Manage all organizers

#### MARKETER

- ✅ Full access to business operations
- ✅ View all analytics
- ✅ Manage all events
- ✅ Manage all organizers
- ✅ Create marketing campaigns

---

## Implementation Recommendations

### 1. Role Hierarchy (Current vs Recommended)

**Current Hierarchy:**

```
SUPERADMIN: 9
ADMIN_STAFF: 8
MARKETER: 7
SUPPORT: 6
TELLER: 5
ORGANIZER: 4
ORGANIZER_STAFF: 3
ORGANIZER_TELLER: 2
ATTENDEE: 1
```

**This hierarchy is good!** No changes needed.

### 2. Authorization Middleware Functions

You'll need these middleware functions:

```typescript
// Can create users with specific roles
export const canCreateRole = (
  userRole: UserRole,
  targetRole: UserRole
): boolean => {
  const rules: Record<UserRole, UserRole[]> = {
    SUPERADMIN: [
      /* all roles */
    ],
    ADMIN_STAFF: [
      ADMIN_STAFF,
      MARKETER,
      SUPPORT,
      TELLER,
      ORGANIZER,
      ORGANIZER_STAFF,
      ORGANIZER_TELLER,
      ATTENDEE,
    ],
    MARKETER: [
      MARKETER,
      SUPPORT,
      ORGANIZER,
      ORGANIZER_STAFF,
      ORGANIZER_TELLER,
      ATTENDEE,
    ],
    // ... other roles
  };
  return rules[userRole]?.includes(targetRole) ?? false;
};

// Can modify user
export const canModifyUser = (
  userRole: UserRole,
  targetUserRole: UserRole
): boolean => {
  // SUPERADMIN can modify anyone
  if (userRole === UserRole.SUPERADMIN) return true;

  // ADMIN_STAFF cannot modify SUPERADMIN
  if (
    userRole === UserRole.ADMIN_STAFF &&
    targetUserRole === UserRole.SUPERADMIN
  )
    return false;

  // MARKETER cannot modify SUPERADMIN or ADMIN_STAFF
  if (
    userRole === UserRole.MARKETER &&
    (targetUserRole === UserRole.SUPERADMIN ||
      targetUserRole === UserRole.ADMIN_STAFF)
  )
    return false;

  // Otherwise, check role hierarchy
  return roleHierarchy[userRole] >= roleHierarchy[targetUserRole];
};
```

### 3. Endpoint Authorization

#### Admin Endpoints

```
POST   /api/v1/admin/users
  - Authorization: requireMinRole(ADMIN_STAFF)
  - Check: canCreateRole(user.role, targetRole)

GET    /api/v1/admin/users
  - Authorization: requireMinRole(ADMIN_STAFF)

PUT    /api/v1/admin/users/:id
  - Authorization: requireMinRole(ADMIN_STAFF)
  - Check: canModifyUser(user.role, targetUser.role)

DELETE /api/v1/admin/users/:id
  - Authorization: requireMinRole(ADMIN_STAFF)
  - Check: canDeleteUser(user.role, targetUser.role)
```

---

## Security Considerations

### 1. Superadmin Protection

- **SUPERADMIN users should be protected from:**
  - Deletion by non-SUPERADMIN users
  - Role changes by non-SUPERADMIN users
  - Password resets by non-SUPERADMIN users (unless explicit permission)
  - Status changes to SUSPENDED by non-SUPERADMIN users

### 2. Audit Logging

**All actions should be logged:**

- User creation (who created, what role, when)
- Role changes (who changed, from/to, when)
- User deletions (who deleted, when)
- Password resets (who reset, when)
- Status changes (who changed, from/to, when)

### 3. Two-Factor Authentication

Consider requiring 2FA for:

- SUPERADMIN accounts
- ADMIN_STAFF accounts (optional but recommended)

### 4. Session Management

- SUPERADMIN sessions should be shorter (e.g., 30 minutes)
- ADMIN_STAFF sessions can be longer (e.g., 2 hours)
- MARKETER sessions can be standard (e.g., 8 hours)

---

## Alternative: Enhanced ADMIN_STAFF Role

If you want ADMIN_STAFF to have **almost** the same privileges as SUPERADMIN but with some restrictions:

**Option A: ADMIN_STAFF with SUPERADMIN-like privileges**

- Can do everything SUPERADMIN can do
- Except: Cannot create/modify/delete SUPERADMIN users
- Except: Cannot modify role hierarchy
- Except: Cannot access certain critical system functions

**Option B: Separate ADMIN_STAFF and SUPERADMIN privileges**

- ADMIN_STAFF: Technical operations only
- SUPERADMIN: Business + Technical operations

**Recommendation:** Go with Option A (what I described above) - it's simpler and ADMIN_STAFF can handle most day-to-day operations.

---

## Summary

**Recommended Structure:**

1. **1 SUPERADMIN** (You - Owner)

   - Full access, ultimate control
   - Can create other SUPERADMINs if needed

2. **1 ADMIN_STAFF** (Dev/Assistant Director)

   - Almost full access
   - Cannot create/modify SUPERADMIN
   - Handles technical operations

3. **1 MARKETER** (Marketing Director)
   - Full business operations
   - Limited to business-facing roles
   - No technical system access

**Benefits:**

- ✅ Security: Only 1 SUPERADMIN account
- ✅ Flexibility: ADMIN_STAFF can handle most operations
- ✅ Separation: Clear boundaries between roles
- ✅ Scalability: Easy to add more admins later

**Implementation:**

- Use existing role hierarchy
- Add privilege checking middleware
- Implement role-based restrictions in endpoints
- Add comprehensive audit logging





