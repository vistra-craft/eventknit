# EventKnit Ticketing System Implementation Summary

## Overview

This document summarizes the implementation of a comprehensive ticketing system similar to Eventbrite with role-based access control, user management, and event management capabilities.

## ✅ Completed Features

### 1. Database Schema Updates

**New Models:**

- `Event` - Events with creator and organizer relationships
- `Ticket` - Ticket types for events
- `TicketPurchase` - Ticket purchase records

**Updated Models:**

- `User` - Added `managedBy` field for organization relationships (Option A approach)
- Added relationships for events, tickets, and purchases

**Key Features:**

- Support for both attendee-created and organizer-managed events
- Flexible ticket pricing (FREE, PAID, DONATION)
- Purchase tracking with payment information
- Soft deletes for all entities

### 2. Role-Based Access Control

**Privilege System (`src/utils/privileges.ts`):**

- Role hierarchy definition
- Permission checking functions:
  - `canCreateRole()` - Check if user can create users with specific role
  - `canModifyUser()` - Check if user can modify another user
  - `canDeleteUser()` - Check if user can delete another user
  - `canManageEvent()` - Check if user can manage an event
  - `canCreateEvent()` - Check if user can create events

**Role Permissions:**

**SUPERADMIN:**

- ✅ Can create/update/delete any user (including SUPERADMIN)
- ✅ Full system access
- ✅ Can manage all events

**ADMIN_STAFF:**

- ✅ Can create/update/delete users (except SUPERADMIN)
- ✅ Full system access (except SUPERADMIN management)
- ✅ Can manage all events

**ORGANIZER:**

- ✅ Can create/update/delete ORGANIZER_STAFF and ORGANIZER_TELLER
- ✅ Can create and manage events
- ✅ Can purchase tickets for other events

**ATTENDEE:**

- ✅ Can create events (when permitted)
- ✅ Can purchase tickets
- ✅ Can update own profile (except email)

### 3. Admin User Management

**Service (`src/services/admin.service.ts`):**

- `createUser()` - Create users with role-based permissions
- `updateUser()` - Update users with permission checks
- `deleteUser()` - Soft delete users
- `getUsers()` - List users with filters
- `getUserById()` - Get user details
- `forcePasswordReset()` - Admin password reset

**Routes (`src/routes/admin.routes.ts`):**

- `POST /api/v1/admin/users` - Create user
- `GET /api/v1/admin/users` - List users
- `GET /api/v1/admin/users/:id` - Get user
- `PUT /api/v1/admin/users/:id` - Update user
- `DELETE /api/v1/admin/users/:id` - Delete user
- `POST /api/v1/admin/users/:id/password` - Force password reset

**Authorization:** Requires ADMIN_STAFF or higher role

### 4. Organizer Staff Management

**Service (`src/services/organizer.service.ts`):**

- `createStaff()` - Create ORGANIZER_STAFF or ORGANIZER_TELLER
- `getStaff()` - List all staff for an organizer
- `getStaffById()` - Get staff details
- `updateStaff()` - Update staff member
- `deleteStaff()` - Soft delete staff
- `deactivateStaff()` - Deactivate staff (set status to INACTIVE)

**Routes (`src/routes/organizer.routes.ts`):**

- `POST /api/v1/organizer/staff` - Create staff
- `GET /api/v1/organizer/staff` - List staff
- `GET /api/v1/organizer/staff/:id` - Get staff
- `PUT /api/v1/organizer/staff/:id` - Update staff
- `DELETE /api/v1/organizer/staff/:id` - Delete staff
- `POST /api/v1/organizer/staff/:id/deactivate` - Deactivate staff

**Authorization:** Requires ORGANIZER, ADMIN_STAFF, or SUPERADMIN role

### 5. Event Management

**Service (`src/services/event.service.ts`):**

- `createEvent()` - Create events (any authenticated user)
- `updateEvent()` - Update events (creator, organizer, or admin)
- `getEventById()` - Get event with tickets
- `getEvents()` - List events with filters
- `deleteEvent()` - Soft delete events

**Routes (`src/routes/event.routes.ts`):**

- `GET /api/v1/events` - List events (public)
- `GET /api/v1/events/:id` - Get event (public)
- `POST /api/v1/events` - Create event (authenticated)
- `PUT /api/v1/events/:id` - Update event (authenticated, authorized)
- `DELETE /api/v1/events/:id` - Delete event (authenticated, authorized)

**Features:**

- Events can be created by attendees or organizers
- Organizers can be assigned to events
- Support for DRAFT, PUBLISHED, CANCELLED, COMPLETED statuses
- Automatic slug generation from title
- Public/private event visibility

### 6. Email Immutability

**Implementation:**

- Email cannot be changed in `updateProfile()` endpoint
- Validation added in `auth.controller.ts`
- Returns error if email change is attempted

### 7. Audit Logging

**Service (`src/utils/audit.ts`):**

- `createAuditLog()` - Log all sensitive actions
- Comprehensive audit action constants
- Logs user actions, entity changes, metadata

**Audited Actions:**

- User creation, updates, deletions
- Role changes
- Staff management
- Event creation, updates, deletions
- Password resets
- Status changes

### 8. Organization Relationship

**Implementation:** Option A - `managedBy` field

**Benefits:**

- Clear hierarchical relationship
- Easy to query staff members
- Supports future multi-level organizations
- Type-safe with Prisma relations

**Schema:**

```prisma
managedBy String?  // User ID of organizer/admin
managedByUser User? @relation("ManagedUsers")
managedUsers User[] @relation("ManagedUsers")
```

## 🔄 Next Steps (Pending)

### 1. Ticket Management Service

- Ticket creation for events
- Ticket purchase workflow
- Ticket cancellation/refund
- Payment integration

### 2. Validation Schemas

- Add validation schemas for admin/organizer/event endpoints
- Use existing validation middleware

### 3. Email Invitations

- Invitation system for staff creation
- Email templates for invitations

### 4. Testing

- Unit tests for services
- Integration tests for routes
- Role permission tests

## 📋 API Endpoints Summary

### Admin Endpoints

```
POST   /api/v1/admin/users              - Create user
GET    /api/v1/admin/users              - List users
GET    /api/v1/admin/users/:id          - Get user
PUT    /api/v1/admin/users/:id          - Update user
DELETE /api/v1/admin/users/:id          - Delete user
POST   /api/v1/admin/users/:id/password - Force password reset
```

### Organizer Endpoints

```
POST   /api/v1/organizer/staff              - Create staff
GET    /api/v1/organizer/staff              - List staff
GET    /api/v1/organizer/staff/:id          - Get staff
PUT    /api/v1/organizer/staff/:id          - Update staff
DELETE /api/v1/organizer/staff/:id          - Delete staff
POST   /api/v1/organizer/staff/:id/deactivate - Deactivate staff
```

### Event Endpoints

```
GET    /api/v1/events      - List events (public)
GET    /api/v1/events/:id  - Get event (public)
POST   /api/v1/events      - Create event (authenticated)
PUT    /api/v1/events/:id  - Update event (authenticated, authorized)
DELETE /api/v1/events/:id - Delete event (authenticated, authorized)
```

## 🔐 Security Features

1. **Role-Based Access Control**

   - Comprehensive permission checking
   - Role hierarchy enforcement
   - Superadmin protection

2. **Email Immutability**

   - Email cannot be changed after registration
   - Maintains account integrity

3. **Audit Logging**

   - All sensitive actions logged
   - User tracking for all changes
   - Metadata capture for debugging

4. **Soft Deletes**

   - Data retention for compliance
   - Reversible deletions
   - Audit trail maintenance

5. **Authorization Middleware**
   - Request-level permission checks
   - Role-based route protection

## 📊 Database Migrations Needed

Run the following to apply schema changes:

```bash
npm run prisma:migrate
```

This will create:

- `managedBy` field in User table
- Event table
- Ticket table
- TicketPurchase table
- All necessary indexes and relationships

## 🧪 Testing Recommendations

1. **Role Permission Tests**

   - Test SUPERADMIN can create all roles
   - Test ADMIN_STAFF cannot create SUPERADMIN
   - Test ORGANIZER can only create staff
   - Test ATTENDEE cannot create users

2. **Staff Management Tests**

   - Test organizer can create/update/delete their staff
   - Test organizer cannot manage other organizers' staff
   - Test admin can manage all staff

3. **Event Management Tests**

   - Test attendees can create events
   - Test organizers can manage their events
   - Test admins can manage all events

4. **Email Immutability Tests**
   - Test email cannot be changed in profile update
   - Test error message is clear

## 📝 Notes

- **Organization Relationship:** Using Option A (`managedBy` field) for clear hierarchy
- **Event Creation:** All authenticated users can create events (attendees and organizers)
- **Staff Management:** Organizers can only manage their own staff (enforced via `managedBy`)
- **Soft Deletes:** All deletions are soft deletes to maintain audit trail
- **Audit Logging:** All sensitive actions are logged with user context

## 🚀 Deployment Checklist

- [ ] Run database migrations
- [ ] Generate Prisma client
- [ ] Test all endpoints
- [ ] Verify role permissions
- [ ] Set up audit log monitoring
- [ ] Configure email templates (if needed)
- [ ] Set up backup strategy
