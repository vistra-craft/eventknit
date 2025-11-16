# EventKnit Workplan: Workstation & Role-Based Access

## Overview

This workplan covers two major feature sets:

1. **Workstation System**: Complete ticket scanning with re-entry, real-time sync, and mobile support
2. **Frontend Role-Based Access**: UI permission enforcement for admin dashboard

## Current Implementation Status

### Role-Based Access: Backend ✅ | Frontend ⚠️

**Backend Status: FULLY IMPLEMENTED**

- ✅ Permission validation functions exist (`utils/privileges.ts`)
- ✅ `validateRoleCreation()` - Enforces role creation permissions
- ✅ `validateUserModification()` - Enforces user modification permissions
- ✅ `validateUserDeletion()` - Enforces user deletion permissions
- ✅ Used in `AdminService.createUser()` and `AdminService.updateUser()`
- ✅ Role hierarchy enforced (SUPERADMIN > ADMIN_STAFF > ORGANIZER > etc.)

**Frontend Status: PARTIALLY IMPLEMENTED**

- ✅ Role filtering and display works
- ✅ Role-based data fetching works
- ❌ **Missing**: UI permission checks (all admins see all actions)
- ❌ **Missing**: Conditional rendering based on permissions
- ❌ **Missing**: UserRolesPage connected to backend (currently mock data)
- ❌ **Missing**: Action-level permission checks (Edit/Delete/Suspend buttons)

**Gaps to Address:**

1. `StaffManagementContent.tsx` - Shows all actions to all admins
2. `OrganizersContent.tsx` - Shows all actions to all admins
3. `UserRolesPage.tsx` - Mock data, not connected to backend
4. No permission hooks for frontend components
5. No conditional rendering based on `canModifyUser()` checks

**This workplan addresses these gaps in Phase 5.**

### Admin Account Creation for Organizers: Backend ✅ | Frontend ✅ | Email Notification ⚠️

**Backend Status: FULLY IMPLEMENTED**

- ✅ `AdminService.createUser()` - Admins can create organizer accounts on their behalf
- ✅ Route: `POST /api/v1/admin/users` (requires `ADMIN_STAFF` or higher role)
- ✅ Permission validation: `ADMIN_STAFF` can create `ORGANIZER` accounts (enforced via `validateRoleCreation()`)
- ✅ Account creation includes:
  - Required fields: email, password, firstName, lastName
  - Organizer-specific: organizationName, businessEmail (required for ORGANIZER role)
  - Account status: Defaults to `ACTIVE` (auto-approved)
  - Audit logging: All account creations are logged with admin ID
- ✅ Validation: Prevents duplicate emails, enforces role requirements

**Frontend Status: FULLY IMPLEMENTED**

- ✅ `CreateOrganizerModal.tsx` - Modal component for creating organizers
- ✅ `CreateOrganizerPage.tsx` - Full page for creating organizers
- ✅ Form validation: All required fields validated before submission
- ✅ UI includes: First name, last name, email, password, phone, organization name, business email
- ✅ Success/error handling with toast notifications

**Email Notification Status: NOT IMPLEMENTED**

- ❌ **Missing**: Welcome email sent to newly created organizer accounts
- ❌ **Missing**: Password setup invitation email
- ❌ **Missing**: Account credentials notification email

**Gap to Address:**

When admins create organizer accounts on behalf of users, no email notification is currently sent. This means:

1. The organizer may not know their account exists
2. The organizer may not know their login credentials
3. The organizer may not know they need to log in

**Recommendation:** Add email notification functionality to `AdminService.createUser()` to send:

- Welcome email with account details
- Password setup link (or temporary password with forced reset)
- Login instructions

---

## Phase 1: Foundation & Database Schema (Week 1)

**Priority: CRITICAL** | **Dependencies: None**

### 1.1 Database Schema Updates

**Estimated Time: 2-3 days**

#### Tasks:

- [ ] Add scan-related fields to `EventRegistration` model
  - `ticketStatus` (enum: ACTIVE, DEACTIVATED, EXPIRED, CANCELLED)
  - `checkedInAt`, `checkedInBy`, `checkedOutAt`, `checkedOutBy`
  - `reEntryCount`, `lastScanFacility`, `isCurrentlyInside`
- [ ] Add scan configuration to `Event` model

  - `allowReEntry` (Boolean, default: false)
  - `requireCheckOut` (Boolean, default: false)
  - `maxReEntries` (Int, nullable)
  - `scanSettings` (Json, nullable for future extensibility)

- [ ] Create `TicketScan` model

  - Core fields: id, registrationId, eventId, scanType, scannedBy, scannedAt
  - Facility tracking: facility, deviceId, deviceType
  - Validation: isValid, errorCode, errorMessage
  - Re-entry: isReEntry, previousScanId
  - Metadata: ipAddress, userAgent, location (GPS)

- [ ] Create enums

  - `TicketStatus`: ACTIVE, DEACTIVATED, EXPIRED, CANCELLED
  - `ScanType`: CHECK_IN, CHECK_OUT, MANUAL_CHECK_IN, MANUAL_CHECK_OUT

- [ ] Add indexes for performance

  - TicketScan: registrationId, eventId, scannedAt, scannedBy, facility
  - EventRegistration: ticketStatus, checkedInAt, isCurrentlyInside

- [ ] Create and run Prisma migration
- [ ] Update Prisma client

**Deliverables:**

- Updated `schema.prisma`
- Migration file
- Database schema documentation

---

## Phase 2: Backend Core Services (Week 1-2)

**Priority: CRITICAL** | **Dependencies: Phase 1**

### 2.1 Cryptographic Security Implementation

**Estimated Time: 2-3 days**

#### Tasks:

- [ ] Create `TicketSecurityService` class

  - Centralized cryptographic operations
  - Signature generation and verification
  - Secret key management

- [ ] Implement signature generation

  - Algorithm: HMAC-SHA256
  - Secret key: `TICKET_SECRET_KEY` from environment variables
  - Signature format: 16-character hex string (truncated from 64-char hash)
  - Use `crypto.timingSafeEqual()` for verification (prevent timing attacks)

- [ ] Update `TicketService.generateTicketData()`

  - **New QR Code Format**: `registrationId|eventId|email|timestamp|signature`
  - Generate signature: `HMAC-SHA256(payload, SECRET_KEY)`
  - Payload: `registrationId|eventId|email|timestamp`
  - Append signature to payload
  - Example: `abc123|evt456|user@email.com|1234567890|a1b2c3d4e5f6g7h8`

- [ ] Update `TicketService.generateBackupTicketCode()`

  - **Option A (Recommended)**: Increase length to 10 characters
    - Format: `ABCDEFGHJK` (10 chars, excludes 0, O, I, 1, L)
    - More secure against brute force
  - **Option B (Enhanced)**: Add signature to backup code
    - Format: `ABCDEFGH-123456` (8-char code + 6-char signature)
    - Generate: `code + HMAC(code + registrationId, SECRET_KEY).substring(0,6)`
  - Store in database: `backupCode` field

- [ ] Implement signature verification utility

  - `verifyTicketSignature(ticketData: string): boolean`
  - Parse ticket data (QR or backup code format)
  - Extract signature
  - Regenerate signature from payload
  - Compare using `crypto.timingSafeEqual()` (constant-time comparison)
  - Return validation result

- [ ] Add environment variable

  - `TICKET_SECRET_KEY`: Strong random secret (32+ bytes)
  - Document key rotation process
  - Add to `.env.example`

- [ ] Update ticket email template
  - Include note about signature verification
  - Display backup code with security note

**Code Format Specifications:**

```
QR Code Format (with signature):
registrationId|eventId|email|timestamp|signature

Example:
abc123-def456-ghi789|evt001|user@example.com|1704067200000|a1b2c3d4e5f6g7h8

Backup Code Format (Option A - Simple):
ABCDEFGHJK (10 characters)

Backup Code Format (Option B - Enhanced):
ABCDEFGH-123456 (8-char code + 6-char signature)
```

**Deliverables:**

- `services/ticket-security.service.ts`
- Updated `TicketService` with signature support
- Environment variable documentation
- Security testing for signature verification

### 2.1.1 Update Existing TicketService Integration

**Estimated Time: 1 day** | **Dependencies: 2.1**

#### Tasks:

- [ ] Update `TicketService.generateTicketData()`

  - Integrate `TicketSecurityService.generateSignature()`
  - Change format from: `registrationId|eventId|email|timestamp`
  - To: `registrationId|eventId|email|timestamp|signature`
  - Maintain backward compatibility during migration period

- [ ] Update `TicketService.generateBackupTicketCode()`

  - Increase length to 10 characters (Option A)
  - OR implement signed backup codes (Option B)
  - Update all existing ticket generation calls

- [ ] Update `TicketService.sendTicketEmail()`

  - QR codes now include signatures
  - Backup codes are longer/more secure
  - Email template shows signature verification note

- [ ] Update `TicketService.generateTicketPDF()`

  - PDF includes signed QR codes
  - Updated backup code format
  - Signature verification instructions

- [ ] Migration strategy for existing tickets
  - Old tickets (without signatures) should still work during transition
  - Add flag to detect old vs new ticket format
  - Gradually phase out old format

**Deliverables:**

- Updated `TicketService` methods
- Migration plan for existing tickets
- Backward compatibility handling

### 2.2 Workstation Service - Core Scanning

**Estimated Time: 3-4 days**

#### Tasks:

- [ ] Create `WorkstationService` class
- [ ] Implement `validateTicket(code, eventId)`

  - **Support BOTH QR codes AND backup codes**
  - **QR Code Parsing**:
    - Format: `registrationId|eventId|email|timestamp|signature`
    - Extract registrationId from QR code
    - Verify signature using `TicketSecurityService.verifyTicketSignature()`
    - If signature invalid → return error: `INVALID_SIGNATURE`
  - **Backup Code Parsing**:
    - Format: 10-character code OR `code-signature` format
    - Search database: `EventRegistration.findUnique({ where: { backupCode: code } })`
    - If Option B: Verify signature portion
    - If not found → return error: `INVALID_TICKET`
  - **Common Validation** (after code parsing):
    - Validate registration exists and is CONFIRMED
    - Check ticket status (not EXPIRED, not CANCELLED)
    - Check event status (APPROVED, not completed)
    - Verify eventId matches (prevent cross-event ticket use)
    - Return validation result with error codes

- [ ] Implement `scanTicket(code, eventId, scannedBy, facility, deviceId)`

  - **Accept both QR code and backup code**
  - Detect code type (QR has `|` separators, backup code is shorter)
  - Acquire distributed lock for registration
  - Validate ticket (reuse validateTicket - includes signature verification)
  - Check if already scanned (prevent double scan)
  - Update EventRegistration:
    - Set `checkedInAt`, `checkedInBy`
    - Set `ticketStatus=DEACTIVATED`
    - Set `isCurrentlyInside=true`
    - Set `lastScanFacility=facility`
  - Create TicketScan record
    - Store code type (QR_CODE or BACKUP_CODE)
    - Store signature verification status
  - Release lock
  - Return scan result with ticket info

- [ ] Implement `checkOut(registrationId, scannedBy, facility)`

  - Validate ticket is currently inside (isCurrentlyInside=true)
  - Update EventRegistration:
    - Set `checkedOutAt`, `checkedOutBy`
    - Set `isCurrentlyInside=false`
    - Set `ticketStatus=ACTIVE` (for re-entry)
  - Create TicketScan record (type: CHECK_OUT)
  - **Optional**: Regenerate signature for re-entry (if implementing signature refresh)
  - Return result

- [ ] Implement error handling
  - Error codes:
    - `ALREADY_SCANNED` - Ticket already checked in
    - `INVALID_TICKET` - Ticket not found
    - `INVALID_SIGNATURE` - Signature verification failed
    - `RESTRICTED` - Ticket restricted
    - `EXPIRED` - Ticket expired
    - `WRONG_EVENT` - Ticket for different event
    - `NOT_CHECKED_IN` - Cannot check out (not checked in)
    - `SIGNATURE_MISMATCH` - Cryptographic signature invalid
  - User-friendly error messages
  - Log errors for analytics
  - Log signature verification failures (security monitoring)

**Scanning Flow:**

```
1. Receive code (QR or backup)
2. Detect code type:
   - QR: Contains "|" separators → Parse QR format
   - Backup: Short alphanumeric → Search by backupCode
3. Verify signature (if applicable)
4. Validate registration exists
5. Check ticket/event status
6. Perform scan operation
```

**Deliverables:**

- `services/workstation.service.ts`
- Unit tests for core scanning logic (QR and backup codes)
- Signature verification tests
- Error handling documentation
- Code format documentation

### 2.3 Workstation Service - Re-entry Support

**Estimated Time: 2-3 days**

#### Tasks:

- [ ] Implement `getEventScanConfig(eventId)`

  - Fetch event scan configuration
  - Return allowReEntry, requireCheckOut, maxReEntries

- [ ] Enhance `scanTicket()` for re-entry

  - Check if ticket is ACTIVE (re-entry scenario)
  - **Verify signature on re-entry** (prevent replay attacks)
  - Validate re-entry count against maxReEntries
  - Check if requireCheckOut is true and ticket was checked out
  - Increment reEntryCount
  - Link to previous scan (previousScanId)
  - **Optional**: Regenerate signature with updated timestamp for re-entry

- [ ] Enhance `checkOut()` validation

  - Verify allowReEntry is enabled
  - Check if currently inside (isCurrentlyInside=true)
  - **Regenerate ticket signature** (refresh for re-entry security)
    - New signature includes re-entry count
    - Prevents use of old signatures

- [ ] Implement re-entry validation logic
  - Track re-entry count
  - Enforce maxReEntries limit
  - Validate check-out requirement
  - **Signature refresh on check-out** (security enhancement)

**Deliverables:**

- Updated `WorkstationService` with re-entry support
- Re-entry validation tests
- Signature refresh implementation

### 2.4 Workstation Service - Manual Operations

**Estimated Time: 2 days**

#### Tasks:

- [ ] Implement `searchAttendees(searchTerm, eventId)`

  - Search by: name, email, phone, backupCode, registrationId
  - Return matching registrations with current status
  - Limit results (pagination)
  - **Include signature verification status** in results (if available)

- [ ] Implement `manualCheckIn(searchTerm, eventId, scannedBy, facility)`

  - Find registration by search term
  - **Verify ticket signature** (if QR code was provided in search)
  - Validate same as scanTicket (includes signature verification)
  - Perform check-in (reuse scanTicket logic)
  - Mark as manual (scanType: MANUAL_CHECK_IN)
  - **Log signature verification status** for audit

- [ ] Implement `manualCheckOut(searchTerm, eventId, scannedBy, facility)`
  - Find registration by search term
  - Validate currently inside
  - Perform check-out (reuse checkOut logic)
  - Mark as manual (scanType: MANUAL_CHECK_OUT)
  - **Regenerate signature** (if implementing signature refresh)

**Deliverables:**

- Manual operation methods
- Search functionality with signature support
- Manual operation tests
- Audit logging for manual operations

### 2.5 Distributed Locking & Concurrency

**Estimated Time: 1-2 days**

#### Tasks:

- [ ] Implement lock service (Redis or database-based)

  - `acquireLock(key, ttl)`
  - `releaseLock(key)`
  - `extendLock(key, ttl)`

- [ ] Integrate locks into scan operations

  - Lock key: `scan:${registrationId}:${eventId}`
  - Lock TTL: 5 seconds
  - Handle lock acquisition failures

- [ ] Add retry logic for lock failures
- [ ] Test concurrent scan scenarios

**Deliverables:**

- Lock service implementation
- Integration with scan operations
- Concurrency tests

---

## Phase 3: Backend API Endpoints (Week 2-3)

**Priority: CRITICAL** | **Dependencies: Phase 2**

### 3.1 Core Scanning APIs

**Estimated Time: 2-3 days**

#### Tasks:

- [ ] Create `workstation.routes.ts`
- [ ] Implement `POST /api/v1/workstation/scan`

  - Validate authentication (requireMinRole: TELLER or ADMIN_STAFF)
  - Validate request body:
    - `code` (string, required) - **Accepts BOTH QR code OR backup code**
    - `eventId` (string, required)
    - `facility?` (string, optional)
    - `deviceId?` (string, optional)
  - **Auto-detect code type**:
    - If code contains `|` → QR code format
    - Else → Backup code format
  - Call `WorkstationService.scanTicket(code, eventId, ...)`
  - **Include signature verification status** in response
  - Return scan result with ticket info
  - **Error responses**:
    - `INVALID_SIGNATURE` - Signature verification failed
    - `INVALID_TICKET` - Ticket not found
    - `ALREADY_SCANNED` - Already checked in

- [ ] Implement `POST /api/v1/workstation/scan-out`

  - Validate authentication
  - Validate request body:
    - `code` (string, required) - **Accepts BOTH QR code OR backup code**
    - `eventId` (string, required)
    - `facility?` (string, optional)
  - **Auto-detect code type** (same as scan endpoint)
  - Call `WorkstationService.checkOut(code, eventId, ...)`
  - Return result with updated signature (if signature refresh enabled)

- [ ] Implement `GET /api/v1/workstation/tickets/:ticketId`

  - Get ticket details
  - Include scan history
  - Return current status
  - **Include signature verification status** in response

- [ ] Add request validation middleware
  - Validate code format (QR or backup code)
  - Validate eventId format
- [ ] Add error handling middleware
  - Map error codes to HTTP status codes
  - Include signature verification errors
- [ ] Add rate limiting (prevent abuse)
  - Per-user rate limits
  - Per-IP rate limits for scanning endpoints

**API Request/Response Examples:**

```typescript
// POST /api/v1/workstation/scan
Request:
{
  "code": "abc123|evt456|user@email.com|1234567890|a1b2c3d4e5f6g7h8", // QR code
  "eventId": "evt456",
  "facility": "Main Entrance",
  "deviceId": "scanner-001"
}

// OR with backup code:
Request:
{
  "code": "ABCDEFGHJK", // Backup code (10 chars)
  "eventId": "evt456",
  "facility": "Main Entrance"
}

Response:
{
  "success": true,
  "data": {
    "scanId": "scan-123",
    "registrationId": "abc123",
    "attendeeName": "John Doe",
    "ticketType": "VIP",
    "scanType": "CHECK_IN",
    "facility": "Main Entrance",
    "scannedAt": "2024-01-15T10:30:00Z",
    "signatureValid": true, // Signature verification status
    "codeType": "QR_CODE" // or "BACKUP_CODE"
  }
}

Error Response:
{
  "success": false,
  "error": {
    "code": "INVALID_SIGNATURE",
    "message": "Ticket signature verification failed. This ticket may be counterfeit.",
    "details": {
      "codeType": "QR_CODE",
      "registrationId": "abc123"
    }
  }
}
```

**Deliverables:**

- `routes/workstation.routes.ts`
- `controllers/workstation.controller.ts`
- API documentation with code format examples
- Postman/API collection
- Request/response examples

### 3.2 Manual Operation APIs

**Estimated Time: 1-2 days**

#### Tasks:

- [ ] Implement `POST /api/v1/workstation/manual-check-in`

  - Validate authentication (higher permission: ADMIN_STAFF+)
  - Validate request body:
    - `searchTerm` (string, required) - name, email, phone, backupCode, or registrationId
    - `eventId` (string, required)
    - `facility?` (string, optional)
    - `code?` (string, optional) - **QR code or backup code for signature verification**
  - Call `WorkstationService.manualCheckIn()`
  - **If code provided**: Verify signature before manual check-in
  - Return result with signature verification status
  - **Log manual operation** with signature status for audit

- [ ] Implement `POST /api/v1/workstation/manual-check-out`

  - Similar to manual-check-in
  - Validate request body: `searchTerm`, `eventId`, `facility?`, `code?`
  - **If code provided**: Verify signature
  - Return result

- [ ] Implement `GET /api/v1/workstation/search`
  - Query params:
    - `q` (string, required) - search term
    - `eventId?` (string, optional)
    - `code?` (string, optional) - **QR or backup code for signature verification**
  - Call `WorkstationService.searchAttendees()`
  - **If code provided**: Verify signature and include status in results
  - Return paginated results with signature verification status

**Deliverables:**

- Manual operation endpoints with signature support
- Search endpoint with signature verification
- Permission checks
- Audit logging for manual operations

### 3.3 Configuration & Query APIs

**Estimated Time: 1-2 days**

#### Tasks:

- [ ] Implement `GET /api/v1/workstation/events/:eventId`

  - Get event with scan configuration
  - Include current scan statistics

- [ ] Implement `GET /api/v1/workstation/events/:eventId/attendees`

  - Get attendees with scan status
  - Filter by: status, facility, search term
  - Pagination support

- [ ] Implement `GET /api/v1/workstation/events/:eventId/scans`

  - Get scan history for event
  - Filter by: date range, facility, scanType, scannedBy
  - Pagination support

- [ ] Implement `GET /api/v1/workstation/events/:eventId/config`

  - Get scan configuration

- [ ] Implement `PUT /api/v1/workstation/events/:eventId/config`
  - Update scan configuration (ADMIN_STAFF+ only)
  - Validate configuration values

**Deliverables:**

- Configuration endpoints
- Query endpoints with filtering
- API documentation updates

---

## Phase 4: Real-Time Synchronization (Week 3)

**Priority: HIGH** | **Dependencies: Phase 3**

### 4.1 WebSocket Infrastructure

**Estimated Time: 2-3 days**

#### Tasks:

- [ ] Set up WebSocket server (Socket.io or native WebSocket)
- [ ] Implement connection management

  - Authentication on connection
  - Room-based subscriptions (by eventId)
  - Connection cleanup

- [ ] Implement scan event broadcasting

  - Emit scan events to event room
  - Include: scanId, registrationId, scanType, facility, timestamp
  - Include ticket status updates

- [ ] Implement client reconnection handling
- [ ] Add connection status tracking

**Deliverables:**

- WebSocket server setup
- Event broadcasting system
- Connection management

### 4.2 Real-Time API Integration

**Estimated Time: 1-2 days**

#### Tasks:

- [ ] Integrate WebSocket into scan endpoints

  - Emit events after successful scans
  - Broadcast to all connected clients for event

- [ ] Implement `GET /api/v1/workstation/events/:eventId/scans/stream`

  - WebSocket endpoint documentation
  - Connection authentication

- [ ] Add real-time statistics updates
  - Current attendees count
  - Scans per hour
  - Facility usage

**Deliverables:**

- Real-time scan updates
- Statistics streaming
- WebSocket API documentation

---

## Phase 5: Frontend Permission System (Week 3-4)

**Priority: HIGH** | **Dependencies: None (can parallel with Phase 4)**

### 5.1 Permission Hooks & Utilities

**Estimated Time: 1-2 days**

#### Tasks:

- [ ] Create `hooks/usePermissions.ts`

  - Import privilege functions from backend types/utils
  - Create React hooks: `useCanCreateRole()`, `useCanModifyUser()`, `useCanDeleteUser()`
  - Cache permission checks
  - Handle loading states

- [ ] Create `lib/permissions.ts` (shared utilities)

  - Client-side permission checking functions
  - Type-safe role checking
  - Permission matrix helpers

- [ ] Create `types/permissions.ts`
  - Permission types
  - Role permission interfaces

**Deliverables:**

- Permission hooks
- Permission utilities
- Type definitions

### 5.2 Staff Management Permission Integration

**Estimated Time: 1 day**

#### Tasks:

- [ ] Update `StaffManagementContent.tsx`

  - Import `usePermissions` hook
  - Conditionally render Edit button (check canModifyUser)
  - Conditionally render Delete/Suspend buttons
  - Hide role dropdown options user can't create
  - Show permission-denied tooltips

- [ ] Update `StaffDetailsPage.tsx` and `StaffEditPage.tsx`
  - Check permissions before allowing edits
  - Show read-only mode if no permission
  - Disable role changes if no permission

**Deliverables:**

- Updated staff management components
- Permission-based UI rendering

### 5.3 Organizer Management Permission Integration

**Estimated Time: 1 day**

#### Tasks:

- [ ] Update `OrganizersContent.tsx`

  - Add permission checks for actions
  - Conditionally render Edit/Suspend buttons
  - Show appropriate messages

- [ ] Update `OrganizerDetailsPage.tsx` and `OrganizerEditPage.tsx`
  - Permission checks
  - Read-only mode for restricted users

**Deliverables:**

- Updated organizer management components

### 5.3.1 Email Notifications for Admin-Created Accounts

**Estimated Time: 2-3 days** | **Priority: MEDIUM**

#### Tasks:

- [ ] Add email notification to `AdminService.createUser()`

  - Send welcome email when admin creates organizer account
  - Include account details (email, organization name)
  - Include login instructions
  - Option A: Send temporary password with forced reset on first login
  - Option B: Send password setup link (invitation token)
  - Include admin contact information for support

- [ ] Create email template for admin-created accounts

  - Welcome message
  - Account credentials (if temporary password used)
  - Login URL
  - Security best practices
  - Support contact information

- [ ] Update `EmailService` (if needed)

  - Add method: `sendAdminCreatedAccountEmail()`
  - Integrate with existing email service infrastructure

- [ ] Add configuration option

  - Allow admins to choose: send email immediately or send invitation link
  - Add checkbox in `CreateOrganizerModal` and `CreateOrganizerPage`

**Deliverables:**

- Email notification functionality
- Email template for admin-created accounts
- Updated admin UI with email notification options
- Documentation for email notification feature

**Note:** This addresses the gap identified in "Current Implementation Status" section where admin-created accounts don't notify the new organizer.

### 5.4 User Roles Page Integration

**Estimated Time: 2-3 days**

#### Tasks:

- [ ] Create backend API endpoints for role management

  - `GET /api/v1/admin/roles` - Get all roles (mock data for now)
  - `POST /api/v1/admin/roles` - Create custom role (future)
  - `PUT /api/v1/admin/roles/:id` - Update role (future)
  - `DELETE /api/v1/admin/roles/:id` - Delete role (future)

- [ ] Update `UserRolesPage.tsx`

  - Replace mock data with API calls
  - Add loading states
  - Add error handling
  - Integrate permission checks
  - Show only roles user can manage

- [ ] Add role permission editing UI
  - Permission matrix
  - Save functionality (if backend supports)

**Deliverables:**

- Connected UserRolesPage
- Role management APIs (basic)
- Permission-based role editing

---

## Phase 6: Frontend Workstation Integration (Week 4-5)

**Priority: CRITICAL** | **Dependencies: Phase 3, Phase 5**

### 6.1 Workstation API Client

**Estimated Time: 1 day**

#### Tasks:

- [ ] Create `lib/workstation-api.ts`

  - `scanTicket(code, eventId, facility, deviceId)` - **Accepts QR or backup code**
  - `scanOut(code, eventId, facility)` - **Accepts QR or backup code**
  - `manualCheckIn(searchTerm, eventId, facility, code?)` - **Optional code for signature verification**
  - `manualCheckOut(searchTerm, eventId, facility, code?)` - **Optional code for signature verification**
  - `searchAttendees(searchTerm, eventId, code?)` - **Optional code for signature verification**
  - `getEventScans(eventId, filters)`
  - `getEventConfig(eventId)`
  - `updateEventConfig(eventId, config)`

- [ ] Add error handling
  - Handle `INVALID_SIGNATURE` errors
  - Display security warnings
- [ ] Add TypeScript types
  - `ScanRequest` - code (string), eventId, facility, deviceId
  - `ScanResponse` - includes signatureValid, codeType
  - `CodeType` enum: 'QR_CODE' | 'BACKUP_CODE'
- [ ] Add request/response interceptors
  - Log signature verification failures
  - Handle signature errors gracefully

**Deliverables:**

- Workstation API client with dual code support
- Type definitions including signature status
- Error handling for signature verification

### 6.2 Enhanced QR Scanner Component

**Estimated Time: 3-4 days**

#### Tasks:

- [ ] Update `WorkstationScanner.tsx`

  - Replace mock data with API calls
  - Integrate real QR code scanning library (html5-qrcode or jsQR)
  - **Support BOTH QR code and backup code scanning**
  - **QR Code Scanning**:
    - Use camera to scan QR codes
    - Parse QR code format: `registrationId|eventId|email|timestamp|signature`
    - Display signature verification status
  - **Backup Code Scanning**:
    - Manual input field for backup codes (10 characters)
    - Auto-format: uppercase, remove spaces
    - Validate format before sending to API
  - **Code Type Detection**:
    - Auto-detect if scanned/entered code is QR or backup
    - Show appropriate UI based on code type
  - Implement check-in/check-out toggle
  - Add error handling with specific error messages:
    - `INVALID_SIGNATURE` - Show security warning
    - `INVALID_TICKET` - Show not found message
    - `ALREADY_SCANNED` - Show already checked in message
  - Add success/error sound effects
  - Add visual feedback (green/red flash)
  - **Display signature verification status** in scan results
  - Real-time scan result updates

- [ ] Add manual search modal

  - Search by name/email/phone/backup code/registrationId
  - **Optional QR code input** for signature verification
  - Display search results with signature status
  - Select and check in/out
  - Show signature verification warning if invalid

- [ ] Add facility selection persistence
- [ ] Add device ID generation/storage
- [ ] Add offline mode support (local storage + sync queue)
  - **Store signature verification status** in offline queue
  - Sync signature status when online

**Code Format Handling:**

```typescript
// QR Code Detection
const isQRCode = (code: string): boolean => {
  return code.includes("|") && code.split("|").length >= 5;
};

// Backup Code Validation
const isValidBackupCode = (code: string): boolean => {
  // Option A: 10 characters, alphanumeric
  return /^[A-Z0-9]{10}$/.test(code.toUpperCase());
  // Option B: 8-char code + 6-char signature
  // return /^[A-Z0-9]{8}-[A-Z0-9]{6}$/.test(code.toUpperCase());
};
```

**Deliverables:**

- Functional QR scanner with QR and backup code support
- Manual search functionality with signature verification
- Error handling with security warnings
- Code format validation

### 6.3 Workstation Overview & Event Dashboard

**Estimated Time: 2-3 days**

#### Tasks:

- [ ] Update `WorkstationOverview.tsx`

  - Replace mock events with API calls
  - Fetch real event data
  - Show real statistics
  - Add loading/error states

- [ ] Update `WorkstationEventDashboard.tsx`

  - Fetch real event data
  - Fetch real attendees with scan status
  - Show real-time statistics
  - Add real-time updates (WebSocket)

- [ ] Update `WorkstationEvents.tsx`
  - Real event data
  - Real attendee lists
  - Real facility data

**Deliverables:**

- Connected workstation pages
- Real-time data updates

### 6.4 Scan History & Analytics

**Estimated Time: 2 days**

#### Tasks:

- [ ] Update `WorkstationHistory.tsx`

  - Replace mock data with API calls
  - Implement filtering (facility, status, date range)
  - Add pagination
  - Add export functionality
  - Real-time updates

- [ ] Add analytics dashboard
  - Scans over time chart
  - Peak hours visualization
  - Facility usage statistics
  - Re-entry statistics
  - Error rate tracking

**Deliverables:**

- Functional scan history
- Analytics dashboard

---

## Phase 7: Event Configuration UI (Week 5)

**Priority: MEDIUM** | **Dependencies: Phase 3, Phase 6**

### 7.1 Event Scan Settings

**Estimated Time: 2 days**

#### Tasks:

- [ ] Add scan settings section to `EventManagement.tsx` (organizer)
- [ ] Create scan settings form

  - Allow re-entry toggle
  - Require check-out toggle
  - Max re-entries input
  - Save functionality

- [ ] Add scan settings to admin event management
- [ ] Add validation for settings
- [ ] Show current configuration

**Deliverables:**

- Event scan configuration UI
- Settings persistence

### 7.2 Ticket Type Scan Settings

**Estimated Time: 1-2 days**

#### Tasks:

- [ ] Add ticket type scan settings
  - Override event defaults per ticket type
  - UI in ticket type configuration
  - Save/update functionality

**Deliverables:**

- Ticket type scan settings

---

## Phase 8: Mobile Optimization & Offline Support (Week 6)

**Priority: MEDIUM** | **Dependencies: Phase 6**

### 8.1 Mobile Scanner Optimization

**Estimated Time: 2-3 days**

#### Tasks:

- [ ] Optimize scanner for mobile devices

  - Responsive camera view
  - Touch-friendly controls
  - Mobile-specific UI adjustments
  - Performance optimization

- [ ] Add barcode support (beyond QR)

  - Code128, Code39 support
  - Barcode scanning library integration

- [ ] Add camera permission handling
  - Request permissions
  - Handle denied permissions
  - Fallback to manual entry

**Deliverables:**

- Mobile-optimized scanner
- Barcode support

### 8.2 Offline Mode

**Estimated Time: 2-3 days**

#### Tasks:

- [ ] Implement offline scan storage

  - LocalStorage/IndexedDB for scan queue
  - Queue management
  - Conflict detection

- [ ] Implement sync mechanism

  - Detect online/offline status
  - Sync queue when online
  - Handle sync conflicts
  - Show sync status

- [ ] Add offline indicator
- [ ] Add sync progress UI

**Deliverables:**

- Offline scanning capability
- Sync mechanism
- Conflict resolution

---

## Phase 9: Testing & Quality Assurance (Week 6-7)

**Priority: HIGH** | **Dependencies: All previous phases**

### 9.1 Backend Testing

**Estimated Time: 3-4 days**

#### Tasks:

- [ ] Unit tests for TicketSecurityService

  - Signature generation tests
  - Signature verification tests
  - Timing attack prevention tests
  - Invalid signature handling tests

- [ ] Unit tests for WorkstationService

  - Scan ticket tests (QR and backup codes)
  - Signature verification tests
  - Re-entry tests
  - Error handling tests
  - Manual operation tests
  - Code type detection tests

- [ ] Integration tests for API endpoints

  - Scan endpoint tests (QR and backup codes)
  - Signature verification integration tests
  - Invalid signature rejection tests
  - Permission tests
  - Error scenario tests
  - Code format validation tests

- [ ] Concurrency tests

  - Simultaneous scan tests
  - Lock mechanism tests

- [ ] Load testing
  - High-volume scan scenarios
  - Real-time sync load

**Deliverables:**

- Comprehensive test suite
- Test coverage report

### 9.2 Frontend Testing

**Estimated Time: 2-3 days**

#### Tasks:

- [ ] Component tests

  - Scanner component tests
  - Permission hook tests
  - Workstation page tests

- [ ] Integration tests

  - End-to-end scan flow
  - Permission enforcement tests

- [ ] Manual testing checklist
  - All scan scenarios
  - Permission scenarios
  - Error scenarios
  - Mobile testing

**Deliverables:**

- Frontend test suite
- Testing documentation

---

## Phase 10: Documentation & Deployment (Week 7)

**Priority: MEDIUM** | **Dependencies: Phase 9**

### 10.1 Documentation

**Estimated Time: 2 days**

#### Tasks:

- [ ] API documentation

  - Workstation API endpoints
  - Request/response examples
  - Error codes documentation
  - **Code format specifications** (QR and backup codes)
  - **Signature verification documentation**

- [ ] User documentation

  - Scanner usage guide
  - Re-entry configuration guide
  - Troubleshooting guide
  - **Ticket security information** (signature verification)

- [ ] Developer documentation
  - Architecture overview
  - Database schema documentation
  - Permission system documentation
  - **Cryptographic security documentation**
    - Signature generation/verification
    - Code format specifications
    - Security best practices
    - Key management procedures

**Deliverables:**

- Complete documentation
- API reference

### 10.2 Deployment Preparation

**Estimated Time: 1-2 days**

#### Tasks:

- [ ] Database migration scripts
- [ ] Environment variable documentation
  - **`TICKET_SECRET_KEY`** - Required for signature generation
  - Key generation instructions
  - Key rotation procedures
- [ ] Deployment checklist
  - Verify `TICKET_SECRET_KEY` is set
  - Test signature generation/verification
  - Verify backward compatibility (if migrating)
- [ ] Rollback plan
  - How to disable signature verification (if needed)
  - Migration rollback procedures
- [ ] Monitoring setup
  - Scan rate monitoring
  - Error rate alerts
  - **Signature verification failure alerts** (security monitoring)
  - Performance metrics
  - **Counterfeit ticket detection** (invalid signature rate)

**Deliverables:**

- Deployment documentation
- Monitoring setup

---

## Summary

### Timeline: 7 weeks

- **Week 1**: Foundation & Core Services
- **Week 2**: Backend APIs & Real-time Setup
- **Week 3**: Real-time Sync & Frontend Permissions
- **Week 4**: Frontend Workstation Integration
- **Week 5**: Configuration UI & Mobile Optimization
- **Week 6**: Mobile/Offline & Testing
- **Week 7**: Documentation & Deployment

### Critical Path

1. Database Schema (Phase 1) → Core Services (Phase 2) → APIs (Phase 3) → Frontend Integration (Phase 6)
2. Permissions (Phase 5) can run parallel with Phases 2-4

### Risk Mitigation

- **Concurrency Issues**: Implement distributed locking early (Phase 2.4)
- **Performance**: Load testing in Phase 9
- **Mobile Compatibility**: Early mobile testing in Phase 8
- **Permission Gaps**: Frontend permission checks in Phase 5 before workstation UI

### Success Metrics

- ✅ Zero double-scans (concurrency handled)
- ✅ <100ms scan response time
- ✅ 100% permission enforcement in UI
- ✅ Offline mode sync success rate >99%
- ✅ Mobile scanner works on iOS/Android
- ✅ Real-time updates <1s latency
- ✅ **100% signature verification on all scans**
- ✅ **Zero counterfeit tickets accepted**
- ✅ **Signature verification <10ms overhead**

---

## Cryptographic Security Implementation Summary

### Code Formats

**QR Code Format (with signature):**

```
registrationId|eventId|email|timestamp|signature

Example:
abc123-def456-ghi789|evt001|user@example.com|1704067200000|a1b2c3d4e5f6g7h8

Components:
- registrationId: UUID of registration
- eventId: UUID of event
- email: Attendee email
- timestamp: Unix timestamp (milliseconds)
- signature: 16-char hex HMAC-SHA256 signature
```

**Backup Code Format (Option A - Recommended):**

```
ABCDEFGHJK (10 characters)

Character set: ABCDEFGHJKMNPQRSTUVWXYZ23456789
Excludes: 0, O, I, 1, L (to avoid confusion)
```

**Backup Code Format (Option B - Enhanced):**

```
ABCDEFGH-123456 (8-char code + 6-char signature)

Components:
- Code: 8-character alphanumeric
- Signature: 6-char hex from HMAC(code + registrationId, SECRET_KEY)
```

### Signature Implementation

**Algorithm:** HMAC-SHA256

- Secret key: `TICKET_SECRET_KEY` (32+ bytes from environment)
- Signature length: 16 characters (truncated from 64-char hash)
- Verification: `crypto.timingSafeEqual()` (constant-time comparison)

**Security Features:**

- Prevents ticket forgery
- Prevents replay attacks (timestamp in signature)
- Timing attack resistant
- Works offline (public key not needed)

### Scanning Support

**Dual Code Support:**

- ✅ QR codes: Full signature verification
- ✅ Backup codes: Database lookup + optional signature verification
- ✅ Auto-detection: System detects code type automatically
- ✅ Manual entry: Both formats supported

**Verification Flow:**

1. Receive code (QR or backup)
2. Detect code type
3. Verify signature (if applicable)
4. Validate registration
5. Check ticket/event status
6. Perform scan operation

### Where Signatures Are Used

1. ✅ **Ticket Generation** - All new tickets include signatures
2. ✅ **QR Code Scanning** - Signature verified on every scan
3. ✅ **Backup Code Scanning** - Optional signature verification
4. ✅ **Re-entry** - Signature verified on re-entry
5. ✅ **Manual Operations** - Signature verified if code provided
6. ✅ **Error Handling** - Invalid signatures rejected with security warnings
7. ✅ **Audit Logging** - Signature verification status logged

### Migration Notes

- **Existing tickets**: Old format (without signatures) will be rejected after migration period
- **Backward compatibility**: System detects old vs new format
- **Key rotation**: `TICKET_SECRET_KEY` can be rotated (requires re-issuing tickets)
- **Performance**: Signature verification adds <10ms overhead per scan

---

## Quick Start Checklist

Before starting development:

- [ ] Review and approve workplan
- [ ] Set up development environment
- [ ] Create feature branch: `feature/workstation-system`
- [ ] **Generate `TICKET_SECRET_KEY`** (32+ bytes, store securely)
- [ ] Add `TICKET_SECRET_KEY` to `.env` and `.env.example`
- [ ] Set up Redis for distributed locking (if not exists)
- [ ] Set up WebSocket infrastructure
- [ ] Create project board/tracking system

---

## Key Implementation Notes

### Cryptographic Security (Phase 2.1)

**Critical Implementation Details:**

1. **Signature Generation**:

   ```typescript
   // Use HMAC-SHA256 with secret key
   const signature = crypto
     .createHmac("sha256", SECRET_KEY)
     .update(payload)
     .digest("hex")
     .substring(0, 16); // 16-char signature
   ```

2. **Signature Verification**:

   ```typescript
   // Use timing-safe comparison
   const isValid = crypto.timingSafeEqual(
     Buffer.from(receivedSignature),
     Buffer.from(expectedSignature)
   );
   ```

3. **Code Type Detection**:
   ```typescript
   // QR codes have pipe separators
   const isQRCode = code.includes("|") && code.split("|").length >= 5;
   // Backup codes are shorter, alphanumeric
   const isBackupCode = /^[A-Z0-9]{10}$/.test(code.toUpperCase());
   ```

### Scanning Implementation (Phase 2.2)

**Both QR and Backup Codes Must Be Supported:**

- All scanning endpoints accept `code` parameter (not `qrCode`)
- System auto-detects code type
- Signature verification for QR codes (mandatory)
- Signature verification for backup codes (optional, if Option B)
- Error handling includes `INVALID_SIGNATURE` code

### Migration Strategy

- **Phase 1**: Generate new tickets with signatures
- **Phase 2**: Accept both old and new format (backward compatible)
- **Phase 3**: Reject old format after migration period
- **Timeline**: 30-60 days migration window recommended

---

## Section 2: Marketing, Social Media & Support Restructuring

### Current State Analysis

#### 1. Marketing Section (`/admin/marketing`)

**Components:**

- Overview: Platform-wide marketing metrics
- Campaigns: Multi-channel campaign management (email, social, paid, referral, promotion)
- Social Media: Social media account management, post creation, engagement tracking
- Email Marketing: Email campaign management
- Promotions: Promotional campaign management
- Partnerships: Partnership management

**Current State:**

- ✅ UI structure in place
- ✅ Campaign tracking concepts
- ✅ Metrics display (recipients, open rate, click rate, conversions, revenue)
- ❌ All data is mock
- ❌ No backend APIs
- ❌ No actual integrations

#### 2. Social Media Section (`/admin/marketing/social`)

**Components:**

- Overview: Total followers, engagement, reach, impressions
- Posts: Post management with engagement metrics
- Accounts: Connected social media accounts
- Analytics: Placeholder for detailed analytics

**Current State:**

- ✅ Multi-platform UI (Facebook, Twitter, Instagram, LinkedIn, YouTube)
- ✅ Post status tracking (published, scheduled, draft)
- ✅ Engagement metrics display
- ❌ All data is mock
- ❌ No actual API integrations
- ❌ No real-time data

#### 3. Support Section (`/admin/support`)

**Components:**

- Customer query management from social platforms
- Query assignment to agents
- Response tracking
- Platform breakdown (WhatsApp, Facebook, Instagram, Twitter, LinkedIn, Email, Website)
- Agent management
- Support metrics

**Current State:**

- ✅ Multi-platform support UI
- ✅ Query status workflow (new, in_progress, waiting, resolved, closed)
- ✅ Agent assignment system
- ✅ Priority and category management
- ❌ All data is mock
- ❌ No backend APIs
- ❌ No actual social media API integrations

#### 4. Communications Section (`/admin/communications`)

**Components:**

- Announcements: Platform-wide announcements to users
- Notifications: In-app notifications
- Email Templates: Email template management

**Current State:**

- ✅ Announcement management
- ✅ Notification system
- ✅ Email template editor
- ❌ All data is mock
- ❌ No backend APIs

### Key Observations

**Overlaps & Redundancies:**

1. **Social Media Duplication**: Both Marketing → Social Media and Support handle social platforms
2. **Platform Management**: Social accounts managed in Marketing, but queries come from same platforms in Support
3. **Communication Channels**: Marketing campaigns, Communications announcements, and Support all send messages
4. **Analytics Fragmentation**: Metrics scattered across Marketing, Social Media, and Support

**Missing Connections:**

1. No link between social posts (Marketing) and support queries (Support)
2. No unified view of all customer touchpoints
3. No attribution between marketing campaigns and support volume
4. No integration between email marketing and email templates

### Recommended Restructuring

#### Option A: Unified Customer Engagement Hub (RECOMMENDED)

**Structure:**

```
Marketing & Engagement
├── Overview
│   ├── Unified dashboard (campaigns + social + support metrics)
│   ├── Cross-channel analytics
│   └── ROI attribution
├── Campaigns
│   ├── Multi-channel campaigns (email, social, paid, referral)
│   ├── Campaign performance
│   └── Attribution tracking
├── Social Media
│   ├── Account Management
│   │   ├── Connected accounts (Facebook, Instagram, Twitter, LinkedIn, YouTube)
│   │   ├── Account analytics
│   │   └── Token management
│   ├── Content Management
│   │   ├── Post creation & scheduling
│   │   ├── Content calendar
│   │   ├── Post performance
│   │   └── Content library
│   └── Engagement
│       ├── Comments & mentions
│       ├── Messages & DMs
│       └── Social listening
├── Customer Support
│   ├── Inbox (Unified)
│   │   ├── All queries (social + email + website)
│   │   ├── Smart routing
│   │   └── Priority management
│   ├── Agents
│   │   ├── Agent management
│   │   ├── Performance metrics
│   │   └── Workload distribution
│   └── Analytics
│       ├── Response times
│       ├── Resolution rates
│       └── Customer satisfaction
├── Communications
│   ├── Announcements
│   ├── Notifications
│   └── Email Templates
└── Analytics
    ├── Campaign Performance
    ├── Social Media Analytics
    ├── Support Metrics
    └── Unified Attribution
```

**Benefits:**

- ✅ Single source of truth for all customer touchpoints
- ✅ Unified view of customer journey
- ✅ Better attribution (marketing → support → conversion)
- ✅ Reduced duplication
- ✅ Easier to see relationships between channels

#### Option B: Keep Separate but Integrate

**Structure:**

```
Marketing (Outbound)
├── Campaigns
├── Social Media (Posting & Analytics)
├── Email Marketing
├── Promotions
└── Partnerships

Support (Inbound)
├── Social Media Inbox (Queries from social platforms)
├── Email Support
├── Website Support
├── Agent Management
└── Support Analytics

Communications (Platform-wide)
├── Announcements
├── Notifications
└── Email Templates
```

**Benefits:**

- ✅ Clear separation of concerns
- ✅ Easier to understand for new users
- ✅ Less cognitive load

**Drawbacks:**

- ❌ Duplication of social media management
- ❌ Harder to see full customer journey
- ❌ More navigation required

### Final Recommendation: Option A (Unified Hub)

**Rationale:**

1. **Social Media is Bidirectional**: Same platforms used for marketing (outbound) and support (inbound)
2. **Customer Journey Continuity**: Users interact across channels - need unified view
3. **Attribution Benefits**: Can link support queries to marketing campaigns
4. **Operational Efficiency**: Agents can see marketing context when responding
5. **Industry Standard**: Leading platforms (Intercom, Zendesk, HubSpot) use unified approach

### Implementation Plan

#### Phase 1: Consolidate Social Media (Week 1-2)

**Tasks:**

- [ ] Merge Marketing → Social Media and Support social features
- [ ] Create unified `SocialMediaService`:
  - Account management (OAuth, token refresh)
  - Post creation & scheduling
  - Engagement tracking (likes, comments, shares)
  - Message/query retrieval
  - Unified analytics
- [ ] Create unified Social Media UI:
  - Tabs: Accounts | Posts | Messages | Analytics
  - Messages tab shows support queries from social platforms
  - Posts tab shows marketing posts
  - Analytics shows combined metrics

**Database Schema:**

```prisma
model SocialAccount {
  id            String   @id @default(cuid())
  platform      String
  accountId     String
  accountName   String
  accessToken   String?  // Encrypted
  refreshToken  String?  // Encrypted
  tokenExpiry   DateTime?
  followers     Int      @default(0)
  isActive      Boolean  @default(true)
  connectedAt   DateTime @default(now())
  lastSyncedAt  DateTime?

  posts         SocialPost[]
  messages      SocialMessage[]  // Support queries
  analytics     SocialAnalytics[]
}

model SocialPost {
  id              String   @id @default(cuid())
  socialAccountId String
  platform        String
  postId          String
  content         String?
  mediaUrl        String?
  status          String   // published, scheduled, draft
  publishedAt     DateTime?
  scheduledAt     DateTime?
  campaignId      String?  // Link to marketing campaign

  socialAccount   SocialAccount @relation(fields: [socialAccountId], references: [id])
  campaign        Campaign?     @relation(fields: [campaignId], references: [id])
  metrics         SocialPostMetrics?
}

model SocialMessage {
  id              String   @id @default(cuid())
  socialAccountId String
  platform        String
  messageId       String   // Platform-specific ID
  senderId        String
  senderName      String
  senderHandle    String
  message         String
  messageType     String   // comment, dm, mention
  postId          String?  // If related to a post
  status          String   // new, in_progress, resolved
  priority        String
  category        String
  assignedTo      String?
  createdAt       DateTime @default(now())

  socialAccount   SocialAccount @relation(fields: [socialAccountId], references: [id])
  socialPost       SocialPost?   @relation(fields: [postId], references: [id])
  responses        SupportResponse[]
}
```

#### Phase 2: Integrate Support with Social (Week 3-4)

**Tasks:**

- [ ] Create unified Support Inbox:
  - Shows queries from all channels (social, email, website)
  - Filter by channel, status, priority
  - Link social queries to originating posts
  - Show marketing campaign context
- [ ] Enhance Support Service:
  - Link support queries to marketing campaigns
  - Track which campaigns generate support volume
  - Show social post context when responding
- [ ] Update Support UI:
  - Add "Related Post" section in query view
  - Add "Campaign Context" if query related to campaign
  - Show customer's social engagement history

#### Phase 3: Unified Analytics (Week 5-6)

**Tasks:**

- [ ] Create unified Analytics Dashboard:
  - Campaign performance
  - Social media metrics (posts + engagement)
  - Support metrics (queries + resolution)
  - Cross-channel attribution
- [ ] Implement Attribution Tracking:
  - Link support queries to marketing campaigns
  - Track customer journey: campaign → engagement → query → conversion
  - Calculate support cost per campaign
- [ ] Create Reporting:
  - Campaign ROI (including support costs)
  - Social media ROI
  - Support efficiency metrics
  - Customer satisfaction by channel

#### Phase 4: Communications Integration (Week 7)

**Tasks:**

- [ ] Link Communications to Marketing:
  - Use email templates in email campaigns
  - Link announcements to campaigns
  - Track announcement engagement
- [ ] Unified Messaging:
  - Single interface for all outbound communications
  - Campaign emails, announcements, notifications
  - Template library shared across all channels

### New Navigation Structure

```
Marketing & Engagement
├── Overview (Unified dashboard)
├── Campaigns
│   ├── All Campaigns
│   ├── Email Campaigns
│   ├── Social Campaigns
│   ├── Paid Ads
│   └── Promotions
├── Social Media
│   ├── Accounts (Connection management)
│   ├── Posts (Content creation & scheduling)
│   ├── Messages (Support queries from social)
│   └── Analytics
├── Customer Support
│   ├── Inbox (All channels unified)
│   ├── Agents
│   ├── Knowledge Base
│   └── Analytics
├── Communications
│   ├── Announcements
│   ├── Notifications
│   └── Email Templates
└── Analytics
    ├── Campaign Performance
    ├── Social Media Analytics
    ├── Support Metrics
    └── Attribution & ROI
```

### Key Features to Implement

#### 1. Unified Social Media Management

- **Single interface** for posting and support
- **Bidirectional sync**: Posts create engagement, engagement creates support queries
- **Context linking**: Support queries show related posts
- **Unified analytics**: Combined metrics for posts and messages

#### 2. Campaign-Support Attribution

- **Link support queries to campaigns**: Track which campaigns generate support volume
- **Calculate support cost per campaign**: Include support costs in ROI calculation
- **Campaign optimization**: Identify campaigns that need clarification (high support volume)

#### 3. Customer Journey Tracking

- **Unified customer view**: See all touchpoints (campaigns, social engagement, support queries)
- **Journey analytics**: Track path from campaign → engagement → query → conversion
- **Proactive support**: Identify customers who might need help based on engagement patterns

#### 4. Smart Routing

- **Route social queries to right agent**: Based on query type, campaign, or expertise
- **Auto-assign based on context**: Link queries to campaigns, assign to campaign manager
- **Escalation rules**: Urgent queries from high-value campaigns

### Migration Strategy

#### Step 1: Database Schema Updates

- Add new tables for unified social media
- Migrate existing mock data structures
- Add foreign keys for relationships

#### Step 2: Backend Services

- Create `SocialMediaService` (unified)
- Create `SupportService` (enhanced with social integration)
- Create `CampaignService` (with support attribution)
- Create `AnalyticsService` (unified)

#### Step 3: API Endpoints

- Unified social media APIs
- Enhanced support APIs (with campaign context)
- Unified analytics APIs

#### Step 4: Frontend Refactoring

- Merge Social Media sections
- Enhance Support with social context
- Create unified Analytics dashboard
- Update navigation structure

#### Step 5: Testing & Rollout

- Test unified workflows
- Verify data integrity
- User acceptance testing
- Gradual rollout

### Success Metrics

**Unified System:**

- ✅ Single interface for all social media operations
- ✅ Support queries linked to marketing campaigns
- ✅ Unified customer journey view
- ✅ Reduced navigation clicks (50% reduction)
- ✅ Improved agent efficiency (context available)

**Attribution:**

- ✅ Support costs included in campaign ROI
- ✅ Campaign optimization based on support volume
- ✅ Customer journey analytics available

**Operational:**

- ✅ Faster response times (agents have context)
- ✅ Better campaign performance (learn from support queries)
- ✅ Improved customer satisfaction (proactive support)

### Implementation Timeline

**Total Duration: 7 weeks**

- **Week 1-2**: Consolidate Social Media (merge Marketing + Support social features)
- **Week 3-4**: Integrate Support with Social (unified inbox, campaign context)
- **Week 5-6**: Unified Analytics (dashboard, attribution, reporting)
- **Week 7**: Communications Integration (link to campaigns, unified messaging)

### Dependencies

**Required First:**

1. Social Media API integrations (from Section 1)
2. Campaign management backend
3. Support ticket system backend

**Can Be Parallel:**

- Analytics dashboard development
- Communications integration
- UI refactoring

### Notes

- **Keep Communications separate** but integrate with Marketing
- **Support remains distinct** but enhanced with social context
- **Social Media becomes unified** (marketing + support)
- **Analytics becomes unified** (all channels together)

This restructuring creates a more cohesive system where:

- Marketing teams can see support impact of campaigns
- Support agents have marketing context
- Social media is managed in one place
- Analytics show the full customer journey

---

## Section 3: Staff Management & Event Assignment

### Current State Analysis

#### 1. Staff Management (`/admin/users/staff`)

**What Exists:**

- ✅ Staff listing and viewing (SUPERADMIN, ADMIN_STAFF, MARKETER, SUPPORT, TELLER)
- ✅ Staff creation and editing
- ✅ Staff status management (suspend, activate, deactivate)
- ✅ Role assignment and filtering
- ✅ Search and pagination
- ✅ Staff details view

**What's Missing:**

- ❌ **Event assignment functionality** - Cannot assign staff to events
- ❌ **Role-based staff dashboards** - All staff see full admin dashboard
- ❌ **Permission-based UI filtering** - Staff see all admin features regardless of role
- ❌ **Staff-specific views** - No role-tailored interfaces

#### 2. Staff Account Access

**Current State:**

- ✅ Staff can login (all staff roles redirect to `/admin/dashboard`)
- ✅ Authentication recognizes staff roles (TELLER, MARKETER, SUPPORT, ADMIN_STAFF)
- ✅ Protected routes check for admin roles
- ❌ **No role-specific dashboards** - All staff see same admin dashboard
- ❌ **No permission-based UI** - Staff see all admin features
- ❌ **No role-based navigation** - Same sidebar for all staff

### Required Implementation

#### Phase 1: Event-Staff Assignment (Week 1-2)

**Priority: HIGH** | **Dependencies: None**

##### 1.1 Database Schema

**Estimated Time: 1 day**

**Tasks:**

- [ ] Create `EventStaff` model in Prisma schema:

  ```prisma
  model EventStaff {
    id          String   @id @default(cuid())
    eventId     String
    staffId     String
    role        String   // "SCANNER", "SUPPORT", "MANAGER", "COORDINATOR", "SUPERVISOR"
    assignedAt  DateTime @default(now())
    assignedBy  String   // Admin who assigned
    notes       String?  // Optional notes about assignment
    isActive    Boolean  @default(true)

    event       Event    @relation("EventStaff", fields: [eventId], references: [id], onDelete: Cascade)
    staff       User     @relation("EventStaff", fields: [staffId], references: [id], onDelete: Cascade)

    @@unique([eventId, staffId])
    @@index([eventId])
    @@index([staffId])
    @@index([role])
    @@index([isActive])
  }
  ```

- [ ] Add relation to `Event` model:

  ```prisma
  model Event {
    // ... existing fields
    assignedStaff EventStaff[] @relation("EventStaff")
  }
  ```

- [ ] Add relation to `User` model:

  ```prisma
  model User {
    // ... existing fields
    eventAssignments EventStaff[] @relation("EventStaff")
  }
  ```

- [ ] Create migration
- [ ] Update Prisma client

**Deliverables:**

- Updated Prisma schema
- Database migration
- Updated Prisma client

##### 1.2 Backend Services

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Create `EventStaffService`:

  - `assignStaffToEvent(eventId, staffId, role, assignedBy, notes?)`
  - `getEventStaff(eventId, filters?)`
  - `getStaffEvents(staffId, filters?)`
  - `removeStaffFromEvent(eventId, staffId)`
  - `updateStaffRole(eventId, staffId, newRole)`
  - `getStaffEventCount(staffId)`
  - `getEventStaffCount(eventId)`

- [ ] Validation:

  - Verify staff user exists and has staff role
  - Verify event exists
  - Prevent duplicate assignments
  - Validate role values
  - Check permissions (only admins can assign)

- [ ] Add to `EventService`:
  - Include assigned staff in event details
  - Filter events by assigned staff member

**Deliverables:**

- `services/event-staff.service.ts`
- Unit tests
- Integration with EventService

##### 1.3 API Endpoints

**Estimated Time: 1-2 days**

**Tasks:**

- [ ] Create `event-staff.routes.ts`:

  - `POST /api/v1/admin/events/:eventId/staff`
    - Body: `{ staffId, role, notes? }`
    - Auth: ADMIN_STAFF+ only
  - `GET /api/v1/admin/events/:eventId/staff`
    - Query: `role?`, `isActive?`
    - Auth: ADMIN_STAFF+ or assigned staff
  - `GET /api/v1/admin/staff/:staffId/events`
    - Query: `status?`, `startDate?`, `endDate?`
    - Auth: ADMIN_STAFF+ or own staffId
  - `PUT /api/v1/admin/events/:eventId/staff/:staffId`
    - Body: `{ role?, notes?, isActive? }`
    - Auth: ADMIN_STAFF+ only
  - `DELETE /api/v1/admin/events/:eventId/staff/:staffId`
    - Auth: ADMIN_STAFF+ only

- [ ] Add validation middleware
- [ ] Add error handling
- [ ] Add API documentation

**Deliverables:**

- `routes/event-staff.routes.ts`
- `controllers/event-staff.controller.ts`
- API documentation

##### 1.4 Frontend Implementation

**Estimated Time: 3-4 days**

**Tasks:**

- [ ] Create `EventStaffAssignment.tsx` component:

  - Staff selection dropdown (filter by role)
  - Role selection (SCANNER, SUPPORT, MANAGER, etc.)
  - Notes field
  - Assign button
  - List of assigned staff with remove option

- [ ] Add to Event Details Page:

  - New "Assigned Staff" tab/section
  - Show assigned staff list
  - Add/remove staff interface
  - Staff role badges
  - Assignment history

- [ ] Create `StaffEventsPage.tsx`:

  - Show all events assigned to logged-in staff
  - Filter by status, date range
  - Quick access to event details
  - Assignment details (role, notes)

- [ ] Update Staff Details Page:

  - Show events assigned to staff member
  - Event assignment history
  - Quick assign button

- [ ] Create API client:
  - `assignStaffToEvent(eventId, staffId, role, notes?)`
  - `getEventStaff(eventId)`
  - `getStaffEvents(staffId)`
  - `removeStaffFromEvent(eventId, staffId)`
  - `updateStaffRole(eventId, staffId, role)`

**Deliverables:**

- EventStaffAssignment component
- Updated Event Details page
- Staff Events page
- Updated Staff Details page
- API client functions

**Total Phase 1 Duration: 7-10 days**

#### Phase 2: Role-Based Staff Dashboards (Week 3-4)

**Priority: HIGH** | **Dependencies: Phase 1**

##### 2.1 Permission System Enhancement

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Create `StaffPermissionService`:

  - Define permissions per role:
    - **TELLER**:
      - View assigned events
      - Access workstation scanner
      - View event attendees (assigned events only)
      - No access to admin features
    - **MARKETER**:
      - View marketing campaigns
      - Create/edit campaigns (for assigned events)
      - View social media (assigned events)
      - View analytics (assigned events only)
    - **SUPPORT**:
      - Access support inbox
      - View assigned events
      - Respond to support queries
      - View user accounts (limited)
    - **ADMIN_STAFF**:
      - Full admin access (current behavior)
    - **SUPERADMIN**:
      - Full system access

- [ ] Create permission checking utilities:

  - `canAccessFeature(userRole, feature)`
  - `canAccessEvent(userRole, eventId, userId?)`
  - `canModifyEvent(userRole, eventId)`
  - `getAccessibleEvents(userId, userRole)`

- [ ] Add permission middleware:
  - Check permissions before API access
  - Return appropriate errors

**Deliverables:**

- `services/staff-permission.service.ts`
- `utils/permissions.ts`
- Permission middleware
- Permission tests

##### 2.2 Role-Based Navigation

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Create `StaffSidebar.tsx` component:

  - Different sidebar based on role
  - TELLER: Workstation, My Events, Profile
  - MARKETER: Marketing, Social Media, My Events, Analytics
  - SUPPORT: Support Inbox, My Events, Profile
  - ADMIN_STAFF: Full admin sidebar (current)

- [ ] Update `AdminSidebar.tsx`:

  - Check user role
  - Show/hide menu items based on permissions
  - Redirect staff to role-specific views

- [ ] Create role-based route guards:
  - Protect routes based on role
  - Show appropriate error messages
  - Redirect to accessible dashboard

**Deliverables:**

- StaffSidebar component
- Updated AdminSidebar
- Role-based route guards

##### 2.3 Role-Specific Dashboards

**Estimated Time: 4-5 days**

**Tasks:**

- [ ] Create `TellerDashboard.tsx`:

  - Assigned events list
  - Quick access to scanner
  - Today's events
  - Scan statistics (for assigned events)
  - Upcoming events

- [ ] Create `MarketerDashboard.tsx`:

  - Assigned events list
  - Campaign performance (assigned events)
  - Social media metrics
  - Quick campaign creation
  - Analytics overview (assigned events)

- [ ] Create `SupportDashboard.tsx`:

  - Support inbox overview
  - Assigned events list
  - Recent queries
  - Response time metrics
  - Quick access to support tools

- [ ] Update `AdminDashboard.tsx`:

  - Check user role
  - Redirect to role-specific dashboard
  - Or show role-filtered admin dashboard

- [ ] Create dashboard routing:
  - `/admin/dashboard` → Role-based redirect
  - `/admin/dashboard/teller` → Teller dashboard
  - `/admin/dashboard/marketer` → Marketer dashboard
  - `/admin/dashboard/support` → Support dashboard
  - `/admin/dashboard/admin` → Full admin dashboard

**Deliverables:**

- TellerDashboard component
- MarketerDashboard component
- SupportDashboard component
- Updated AdminDashboard with routing
- Role-based dashboard routing

##### 2.4 Permission-Based UI Filtering

**Estimated Time: 3-4 days**

**Tasks:**

- [ ] Create `usePermissions` hook:

  - `canAccess(feature)`
  - `canAccessEvent(eventId)`
  - `getAccessibleEvents()`
  - `hasRole(role)`

- [ ] Update all admin pages:

  - Filter data based on permissions
  - Hide/show UI elements based on role
  - Show "Access Denied" for restricted features
  - Filter event lists to assigned events only

- [ ] Update API calls:

  - Include permission checks
  - Filter responses server-side
  - Return appropriate errors

- [ ] Add permission indicators:
  - Show role badge
  - Show access level
  - Show assigned events count

**Deliverables:**

- usePermissions hook
- Updated admin pages with permission checks
- Permission-based data filtering
- UI indicators

**Total Phase 2 Duration: 11-15 days**

### Implementation Timeline

**Total Duration: 3-4 weeks**

- **Week 1-2**: Event-Staff Assignment (Database, Backend, Frontend)
- **Week 3-4**: Role-Based Dashboards (Permissions, Navigation, Dashboards, UI Filtering)

### Success Metrics

**Event Assignment:**

- ✅ Staff can be assigned to events
- ✅ Staff can view their assigned events
- ✅ Admins can manage event-staff assignments
- ✅ Assignment history tracked

**Role-Based Access:**

- ✅ Each staff role has appropriate dashboard
- ✅ Staff only see features they can access
- ✅ Staff only see events they're assigned to
- ✅ Permission checks enforced on backend
- ✅ UI adapts based on role

### Dependencies

**Required First:**

1. Staff management system (already exists)
2. Event management system (already exists)
3. Authentication system (already exists)

**Can Be Parallel:**

- Permission system development
- Dashboard UI development
- API endpoint development

### Notes

- **Event assignment is separate from financial matters** - Assignment only tracks which staff work on which events
- **Role-based access is critical** - Prevents staff from accessing unauthorized features
- **Permission system should be flexible** - Easy to add new roles or modify permissions
- **Staff dashboards should be role-appropriate** - Each role sees what they need, nothing more

---

## Section 4: Comprehensive Notification & Communication System

### Current State Analysis

#### 1. Email Service

**What Exists:**

- ✅ Basic `EmailService` with retry logic and exponential backoff
- ✅ Email templates for:
  - Email verification
  - Password reset
  - Magic link login
  - Ticket emails (with QR code)
  - Payment pending emails
  - Account invitation emails

**What's Missing:**

- ❌ **No notification system** - No database models for notifications
- ❌ **No in-app notifications** - No notification center
- ❌ **No push notifications** - No mobile/web push
- ❌ **No SMS notifications** - No text messaging
- ❌ **No notification preferences** - Users can't control what they receive
- ❌ **No notification history** - No record of sent notifications

#### 2. Event-Related Communications

**What Exists:**

- ✅ Ticket emails sent on registration
- ✅ Payment pending emails for paid events

**What's Missing:**

- ❌ **Event status change notifications** - No notifications when event is approved/rejected/cancelled
- ❌ **Event update notifications** - No notifications when event details change
- ❌ **Event reminders** - No automated reminders (24h, 1h before event)
- ❌ **Event cancellation notifications** - No notifications to attendees when event cancelled
- ❌ **Registration deadline reminders** - No reminders before deadline
- ❌ **Waitlist notifications** - No notifications when spots become available
- ❌ **Capacity full notifications** - No notifications when event reaches capacity
- ❌ **Event completion notifications** - No post-event communications

#### 3. Organizer Communications

**What Exists:**

- ✅ Basic email service

**What's Missing:**

- ❌ **Event approval/rejection notifications** - Organizers not notified of status changes
- ❌ **Registration milestone notifications** - No notifications at 50%, 75%, 100% capacity
- ❌ **Payment received notifications** - No notifications when payments come in
- ❌ **Refund notifications** - No notifications when refunds are processed
- ❌ **Event performance summaries** - No post-event analytics emails
- ❌ **Platform announcements** - No way to send announcements to organizers

#### 4. Attendee Communications

**What Exists:**

- ✅ Ticket emails
- ✅ Payment pending emails

**What's Missing:**

- ❌ **Event reminders** - No automated reminders
- ❌ **Event updates** - No notifications when event changes
- ❌ **Cancellation notifications** - No notifications when event cancelled
- ❌ **Refund notifications** - No notifications when refunds processed
- ❌ **Post-event communications** - No thank you emails, feedback requests
- ❌ **Waitlist notifications** - No notifications when spots open

#### 5. Bulk Messaging

**What Exists:**

- ✅ CommunicationsPage UI (mock data only)
  - Announcements (draft, scheduled, sent)
  - In-app notifications
  - Email templates

**What's Missing:**

- ❌ **No backend implementation** - All data is mock
- ❌ **No bulk email to attendees** - Can't message all event attendees
- ❌ **No bulk email to organizers** - Can't message all organizers
- ❌ **No segmented messaging** - Can't target specific user groups
- ❌ **No scheduled messaging** - Can't schedule future messages
- ❌ **No message templates** - No reusable message templates

#### 6. Notification Channels

**What Exists:**

- ✅ Email only

**What's Missing:**

- ❌ **In-app notifications** - No notification center
- ❌ **Push notifications** - No web/mobile push
- ❌ **SMS notifications** - No text messaging
- ❌ **Multi-channel delivery** - Can't send via multiple channels

### Required Implementation

#### Phase 1: Notification System Foundation (Week 1-2)

**Priority: HIGH** | **Dependencies: None**

##### 1.1 Database Schema

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Create `Notification` model:

  ```prisma
  model Notification {
    id            String   @id @default(cuid())
    userId        String
    type          String   // See notification types below
    title         String
    message       String   @db.Text
    data          Json?    // Additional data (eventId, registrationId, etc.)

    // Channels
    channels      Json     // { email: boolean, sms: boolean, push: boolean, inApp: boolean }

    // Delivery Status
    emailStatus   String?  // pending, sent, delivered, failed
    smsStatus     String?  // pending, sent, delivered, failed
    pushStatus    String?  // pending, sent, delivered, failed
    inAppStatus   String?  // pending, sent, delivered, failed

    // Read Status
    isRead        Boolean  @default(false)
    readAt        DateTime?

    // Priority & Expiry
    priority      String   @default("medium") // low, medium, high, urgent
    expiresAt     DateTime?

    // Related Entities
    eventId       String?
    registrationId String?
    relatedUserId String?

    // Metadata
    metadata      Json?
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt

    user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    event         Event?   @relation(fields: [eventId], references: [id], onDelete: SetNull)
    registration  EventRegistration? @relation(fields: [registrationId], references: [id], onDelete: SetNull)

    @@index([userId, isRead])
    @@index([type])
    @@index([eventId])
    @@index([createdAt])
    @@index([expiresAt])
  }
  ```

- [ ] Create `NotificationPreference` model:

  ```prisma
  model NotificationPreference {
    id            String   @id @default(cuid())
    userId        String   @unique

    // Channel Preferences
    emailEnabled  Boolean  @default(true)
    smsEnabled    Boolean  @default(false)
    pushEnabled   Boolean  @default(true)
    inAppEnabled  Boolean  @default(true)

    // Category Preferences
    eventReminders Boolean @default(true)
    eventUpdates   Boolean @default(true)
    eventCancellations Boolean @default(true)
    paymentNotifications Boolean @default(true)
    marketingEmails Boolean @default(true)
    systemAnnouncements Boolean @default(true)
    registrationUpdates Boolean @default(true)

    // Frequency Preferences
    reminderFrequency String @default("all") // all, daily_digest, weekly_digest, none

    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt

    user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  }
  ```

- [ ] Create `BulkMessage` model:

  ```prisma
  model BulkMessage {
    id            String   @id @default(cuid())
    title         String
    content       String   @db.Text
    type          String   // announcement, marketing, system, event_update
    targetAudience String  // all, organizers, attendees, staff, specific_event
    eventId       String?  // If targeting specific event

    // Channels
    channels      Json     // { email: boolean, sms: boolean, push: boolean, inApp: boolean }

    // Status
    status        String   // draft, scheduled, sending, sent, cancelled
    scheduledAt   DateTime?
    sentAt        DateTime?

    // Recipients
    totalRecipients Int    @default(0)
    sentCount      Int     @default(0)
    failedCount    Int     @default(0)

    // Created by
    createdBy     String
    creator       User     @relation(fields: [createdBy], references: [id], onDelete: SetNull)

    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt

    @@index([status, scheduledAt])
    @@index([createdBy])
    @@index([eventId])
  }
  ```

- [ ] Add relations to `User` model:

  ```prisma
  model User {
    // ... existing fields
    notifications Notification[]
    notificationPreference NotificationPreference?
    bulkMessagesCreated BulkMessage[]
  }
  ```

- [ ] Add relations to `Event` model:

  ```prisma
  model Event {
    // ... existing fields
    notifications Notification[]
    bulkMessages BulkMessage[]
  }
  ```

- [ ] Create migrations
- [ ] Update Prisma client

**Deliverables:**

- Updated Prisma schema
- Database migrations
- Updated Prisma client

##### 1.2 Notification Service

**Estimated Time: 3-4 days**

**Tasks:**

- [ ] Create `NotificationService`:

  - `sendNotification(userId, type, title, message, channels?, data?)`
  - `sendBulkNotification(userIds, type, title, message, channels?)`
  - `sendEventNotification(eventId, type, title, message, targetAudience, channels?)`
  - `getUserNotifications(userId, filters?)`
  - `markAsRead(notificationId, userId)`
  - `markAllAsRead(userId)`
  - `deleteNotification(notificationId, userId)`
  - `getUnreadCount(userId)`

- [ ] Notification Types Enum:

  ```typescript
  enum NotificationType {
    // Event-related (to attendees)
    EVENT_REMINDER_24H = "event_reminder_24h",
    EVENT_REMINDER_1H = "event_reminder_1h",
    EVENT_UPDATE = "event_update",
    EVENT_CANCELLED = "event_cancelled",
    EVENT_POSTPONED = "event_postponed",
    EVENT_VENUE_CHANGED = "event_venue_changed",
    EVENT_TIME_CHANGED = "event_time_changed",
    REGISTRATION_DEADLINE_REMINDER = "registration_deadline_reminder",
    WAITLIST_AVAILABLE = "waitlist_available",
    CAPACITY_FULL = "capacity_full",
    EVENT_COMPLETED = "event_completed",

    // Event-related (to organizers)
    EVENT_APPROVED = "event_approved",
    EVENT_REJECTED = "event_rejected",
    EVENT_CANCELLED_BY_ADMIN = "event_cancelled_by_admin",
    REGISTRATION_MILESTONE_50 = "registration_milestone_50",
    REGISTRATION_MILESTONE_75 = "registration_milestone_75",
    REGISTRATION_MILESTONE_100 = "registration_milestone_100",
    CAPACITY_REACHED = "capacity_reached",
    PAYMENT_RECEIVED = "payment_received",
    REFUND_PROCESSED = "refund_processed",
    EVENT_PERFORMANCE_SUMMARY = "event_performance_summary",

    // Registration-related
    REGISTRATION_CONFIRMED = "registration_confirmed",
    REGISTRATION_CANCELLED = "registration_cancelled",
    PAYMENT_PENDING = "payment_pending",
    PAYMENT_FAILED = "payment_failed",
    PAYMENT_SUCCESS = "payment_success",
    REFUND_RECEIVED = "refund_received",

    // System notifications
    SYSTEM_ANNOUNCEMENT = "system_announcement",
    PLATFORM_UPDATE = "platform_update",
    MAINTENANCE_SCHEDULED = "maintenance_scheduled",
    SECURITY_ALERT = "security_alert",

    // Marketing
    NEW_EVENT_AVAILABLE = "new_event_available",
    PROMOTION_OFFER = "promotion_offer",
    EARLY_BIRD_REMINDER = "early_bird_reminder",

    // Account-related
    ACCOUNT_VERIFIED = "account_verified",
    PASSWORD_CHANGED = "password_changed",
    LOGIN_ATTEMPT = "login_attempt",
    ACCOUNT_SUSPENDED = "account_suspended",
    ACCOUNT_ACTIVATED = "account_activated",
  }
  ```

- [ ] Channel delivery methods:

  - Email delivery (reuse EmailService)
  - SMS delivery (integrate Twilio or similar)
  - Push notification delivery (integrate FCM/Web Push)
  - In-app notification (store in database)

- [ ] Queue system (BullMQ or similar):
  - Queue notification jobs
  - Retry failed deliveries
  - Rate limiting
  - Priority handling

**Deliverables:**

- `services/notification.service.ts`
- Notification types enum
- Channel delivery methods
- Queue system integration
- Unit tests

##### 1.3 Notification Preferences Service

**Estimated Time: 1-2 days**

**Tasks:**

- [ ] Create `NotificationPreferenceService`:

  - `getUserPreferences(userId)`
  - `updatePreferences(userId, preferences)`
  - `shouldSendNotification(userId, notificationType, channel)`
  - `getDefaultPreferences()` - Return default preferences

- [ ] Preference checking:
  - Check user preferences before sending
  - Respect channel preferences (email, SMS, push, in-app)
  - Respect category preferences (event reminders, updates, etc.)
  - Handle opt-out scenarios

**Deliverables:**

- `services/notification-preference.service.ts`
- Preference validation
- Unit tests

**Total Phase 1 Duration: 6-9 days**

#### Phase 2: Event-Related Automated Notifications (Week 3-4)

**Priority: HIGH** | **Dependencies: Phase 1**

##### 2.1 Event Status Change Notifications

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Event Approval Notification:

  - Trigger when event status changes to APPROVED
  - Send to organizer
  - Include event details and next steps
  - Link to event management dashboard

- [ ] Event Rejection Notification:

  - Trigger when event status changes to REJECTED
  - Send to organizer
  - Include rejection reason
  - Provide feedback for resubmission

- [ ] Event Cancellation Notification:

  - Trigger when event is cancelled
  - Send to organizer (immediate)
  - Send to all registered attendees (bulk)
  - Include cancellation reason
  - Include refund information (if applicable)

- [ ] Event Update Notification:
  - Trigger when event details change after approval
  - Send to all registered attendees
  - Highlight what changed (venue, time, date, etc.)
  - Allow attendees to cancel if needed

**Deliverables:**

- Event status change notification handlers
- Integration with EventService
- Email templates for each notification type
- Tests

##### 2.2 Event Reminder System

**Estimated Time: 3-4 days**

**Tasks:**

- [ ] Create `EventReminderJob`:

  - Scheduled job to check upcoming events
  - Send 24-hour reminders
  - Send 1-hour reminders
  - Respect user preferences

- [ ] Reminder logic:

  - Calculate time until event
  - Check if reminder already sent
  - Check user preferences
  - Send via preferred channels

- [ ] Registration deadline reminders:
  - Send reminders before registration deadline
  - Configurable timing (7 days, 3 days, 1 day before)
  - Only to users who haven't registered

**Deliverables:**

- Event reminder job
- Reminder scheduling system
- Email templates
- Tests

##### 2.3 Registration & Capacity Notifications

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Registration milestone notifications (to organizers):

  - 50% capacity reached
  - 75% capacity reached
  - 100% capacity reached
  - Include current registration count and revenue

- [ ] Capacity full notification (to attendees):

  - When event reaches capacity
  - Offer waitlist option
  - Notify when spots become available

- [ ] Waitlist notifications:
  - Notify when spot becomes available
  - Time-limited offer (e.g., 24 hours to register)
  - Automatic removal from waitlist if not claimed

**Deliverables:**

- Registration milestone tracking
- Capacity monitoring
- Waitlist notification system
- Email templates
- Tests

##### 2.4 Payment & Refund Notifications

**Estimated Time: 2 days**

**Tasks:**

- [ ] Payment received notification (to organizer):

  - Real-time notification when payment received
  - Include attendee details and amount
  - Link to payment details

- [ ] Payment failed notification (to attendee):

  - Notify when payment fails
  - Provide retry instructions
  - Include support contact

- [ ] Refund notifications:
  - Notify organizer when refund processed
  - Notify attendee when refund received
  - Include refund amount and timeline

**Deliverables:**

- Payment notification handlers
- Refund notification handlers
- Integration with PaymentService
- Email templates
- Tests

**Total Phase 2 Duration: 9-12 days**

#### Phase 3: Bulk Messaging System (Week 5-6)

**Priority: MEDIUM** | **Dependencies: Phase 1**

##### 3.1 Bulk Message Service

**Estimated Time: 3-4 days**

**Tasks:**

- [ ] Create `BulkMessageService`:

  - `createBulkMessage(data)`
  - `scheduleBulkMessage(messageId, scheduledAt)`
  - `sendBulkMessage(messageId)`
  - `cancelBulkMessage(messageId)`
  - `getBulkMessageStatus(messageId)`

- [ ] Recipient targeting:

  - All users
  - All organizers
  - All attendees
  - Specific event attendees
  - Specific event organizers
  - Role-based targeting (staff, organizers, attendees)
  - Custom filters (by registration date, event type, etc.)

- [ ] Message processing:
  - Queue-based sending (prevent overload)
  - Batch processing
  - Rate limiting
  - Progress tracking
  - Error handling and retry

**Deliverables:**

- `services/bulk-message.service.ts`
- Recipient targeting logic
- Queue system integration
- Progress tracking
- Tests

##### 3.2 Bulk Message API

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Create `bulk-message.routes.ts`:

  - `POST /api/v1/admin/communications/bulk-messages`
  - `GET /api/v1/admin/communications/bulk-messages`
  - `GET /api/v1/admin/communications/bulk-messages/:id`
  - `PUT /api/v1/admin/communications/bulk-messages/:id`
  - `DELETE /api/v1/admin/communications/bulk-messages/:id`
  - `POST /api/v1/admin/communications/bulk-messages/:id/send`
  - `POST /api/v1/admin/communications/bulk-messages/:id/cancel`

- [ ] Validation:
  - Validate target audience
  - Validate scheduling
  - Validate content
  - Check permissions (ADMIN_STAFF+ only)

**Deliverables:**

- API routes
- Controllers
- Validation middleware
- API documentation

##### 3.3 Frontend Implementation

**Estimated Time: 3-4 days**

**Tasks:**

- [ ] Update `CommunicationsPage.tsx`:

  - Replace mock data with real API calls
  - Implement bulk message creation
  - Implement scheduling
  - Show sending progress
  - Show delivery statistics

- [ ] Create `BulkMessageComposer.tsx`:

  - Message editor (rich text)
  - Audience selection
  - Channel selection
  - Scheduling interface
  - Preview functionality
  - Template selection

- [ ] Create `BulkMessageList.tsx`:

  - List all bulk messages
  - Filter by status, type, date
  - Show delivery statistics
  - Actions (view, edit, cancel, resend)

- [ ] Create API client:
  - `createBulkMessage(data)`
  - `getBulkMessages(filters?)`
  - `getBulkMessage(id)`
  - `updateBulkMessage(id, data)`
  - `sendBulkMessage(id)`
  - `cancelBulkMessage(id)`

**Deliverables:**

- Updated CommunicationsPage
- BulkMessageComposer component
- BulkMessageList component
- API client functions

**Total Phase 3 Duration: 8-11 days**

#### Phase 4: Multi-Channel Notification Delivery (Week 7-8)

**Priority: MEDIUM** | **Dependencies: Phase 1**

##### 4.1 SMS Integration

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Integrate SMS provider (Twilio or similar):

  - Configure API credentials
  - Create SMS service
  - Implement SMS sending
  - Handle delivery status
  - Handle errors and retries

- [ ] SMS templates:

  - Event reminders (short format)
  - Payment notifications
  - Urgent notifications
  - Character limit handling (160 chars)

- [ ] SMS preferences:
  - User opt-in/opt-out
  - Cost considerations
  - Rate limiting

**Deliverables:**

- SMS service integration
- SMS templates
- SMS preference handling
- Tests

##### 4.2 Push Notification Integration

**Estimated Time: 3-4 days**

**Tasks:**

- [ ] Web Push integration:

  - Service worker setup
  - Push subscription management
  - Push notification delivery
  - Browser compatibility

- [ ] Mobile Push integration (for future mobile app):

  - Firebase Cloud Messaging (FCM)
  - APNs (Apple Push Notification service)
  - Device token management
  - Push notification delivery

- [ ] Push notification service:
  - `subscribeUser(userId, subscription)`
  - `unsubscribeUser(userId)`
  - `sendPushNotification(userId, notification)`
  - `sendBulkPushNotification(userIds, notification)`

**Deliverables:**

- Web push integration
- Mobile push integration (foundation)
- Push notification service
- Subscription management
- Tests

##### 4.3 In-App Notification Center

**Estimated Time: 4-5 days**

**Tasks:**

- [ ] Create `NotificationCenter.tsx` component:

  - Notification list (unread first)
  - Notification categories/filters
  - Mark as read functionality
  - Delete notifications
  - Notification actions (link to event, registration, etc.)

- [ ] Real-time updates:

  - WebSocket connection for live notifications
  - Badge count (unread notifications)
  - Toast notifications for new items
  - Sound/vibration (optional)

- [ ] Notification bell icon:

  - Show unread count badge
  - Dropdown with recent notifications
  - Quick actions
  - Link to full notification center

- [ ] API endpoints:
  - `GET /api/v1/notifications` - Get user notifications
  - `PUT /api/v1/notifications/:id/read` - Mark as read
  - `PUT /api/v1/notifications/read-all` - Mark all as read
  - `DELETE /api/v1/notifications/:id` - Delete notification
  - `GET /api/v1/notifications/unread-count` - Get unread count

**Deliverables:**

- NotificationCenter component
- Notification bell/dropdown
- Real-time updates (WebSocket)
- API endpoints
- Tests

**Total Phase 4 Duration: 9-12 days**

#### Phase 5: Notification Preferences UI (Week 9)

**Priority: MEDIUM** | **Dependencies: Phase 1**

##### 5.1 User Preferences Page

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Create `NotificationPreferencesPage.tsx`:

  - Channel preferences (email, SMS, push, in-app)
  - Category preferences (event reminders, updates, marketing, etc.)
  - Frequency preferences (all, daily digest, weekly digest)
  - Save/cancel functionality

- [ ] Organizer preferences:

  - Additional preferences for organizers
  - Registration milestone notifications
  - Payment notifications
  - Event performance summaries

- [ ] API integration:
  - `GET /api/v1/users/me/notification-preferences`
  - `PUT /api/v1/users/me/notification-preferences`

**Deliverables:**

- NotificationPreferencesPage component
- API integration
- User preference management

##### 5.2 Admin Notification Management

**Estimated Time: 2 days**

**Tasks:**

- [ ] Admin notification settings:
  - Default notification preferences
  - System-wide notification settings
  - Notification template management
  - Notification analytics

**Deliverables:**

- Admin notification settings page
- Default preference management

**Total Phase 5 Duration: 4-5 days**

#### Phase 6: Advanced Features & Edge Cases (Week 10)

**Priority: LOW** | **Dependencies: Phase 1-5**

##### 6.1 Post-Event Communications

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Event completion notifications:

  - Thank you email to attendees
  - Thank you email to organizer
  - Feedback request
  - Photo/video sharing links

- [ ] Event performance summary (to organizer):
  - Total attendees
  - Total revenue
  - Attendance rate
  - Top performing ticket types
  - Comparison to previous events

**Deliverables:**

- Post-event notification handlers
- Performance summary generation
- Email templates

##### 6.2 Smart Notifications

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Notification deduplication:

  - Prevent duplicate notifications
  - Merge similar notifications
  - Batch notifications when appropriate

- [ ] Notification timing optimization:

  - Send at optimal times (based on user timezone)
  - Avoid sending during off-hours
  - Respect "do not disturb" hours

- [ ] Notification personalization:
  - Use user's name
  - Include relevant event details
  - Personalized recommendations

**Deliverables:**

- Deduplication logic
- Timing optimization
- Personalization engine

##### 6.3 Notification Analytics

**Estimated Time: 2 days**

**Tasks:**

- [ ] Track notification metrics:

  - Delivery rates by channel
  - Open rates (for emails)
  - Click rates
  - Unsubscribe rates
  - Channel performance comparison

- [ ] Analytics dashboard:
  - Notification performance overview
  - Channel comparison
  - User engagement metrics
  - A/B testing results (if implemented)

**Deliverables:**

- Analytics tracking
- Analytics dashboard
- Reporting

**Total Phase 6 Duration: 6-8 days**

### Notification Types Reference

#### Event-Related (Attendees)

1. **EVENT_REMINDER_24H** - 24 hours before event
2. **EVENT_REMINDER_1H** - 1 hour before event
3. **EVENT_UPDATE** - Event details changed
4. **EVENT_CANCELLED** - Event cancelled
5. **EVENT_POSTPONED** - Event postponed
6. **EVENT_VENUE_CHANGED** - Venue changed
7. **EVENT_TIME_CHANGED** - Time changed
8. **REGISTRATION_DEADLINE_REMINDER** - Before deadline
9. **WAITLIST_AVAILABLE** - Spot available from waitlist
10. **CAPACITY_FULL** - Event reached capacity
11. **EVENT_COMPLETED** - Post-event thank you

#### Event-Related (Organizers)

1. **EVENT_APPROVED** - Event approved by admin
2. **EVENT_REJECTED** - Event rejected by admin
3. **EVENT_CANCELLED_BY_ADMIN** - Admin cancelled event
4. **REGISTRATION_MILESTONE_50** - 50% capacity reached
5. **REGISTRATION_MILESTONE_75** - 75% capacity reached
6. **REGISTRATION_MILESTONE_100** - 100% capacity reached
7. **CAPACITY_REACHED** - Event at capacity
8. **PAYMENT_RECEIVED** - New payment received
9. **REFUND_PROCESSED** - Refund processed
10. **EVENT_PERFORMANCE_SUMMARY** - Post-event analytics

#### Registration-Related

1. **REGISTRATION_CONFIRMED** - Registration confirmed
2. **REGISTRATION_CANCELLED** - Registration cancelled
3. **PAYMENT_PENDING** - Payment pending
4. **PAYMENT_FAILED** - Payment failed
5. **PAYMENT_SUCCESS** - Payment successful
6. **REFUND_RECEIVED** - Refund received

#### System Notifications

1. **SYSTEM_ANNOUNCEMENT** - Platform announcements
2. **PLATFORM_UPDATE** - Platform updates
3. **MAINTENANCE_SCHEDULED** - Scheduled maintenance
4. **SECURITY_ALERT** - Security alerts

#### Marketing

1. **NEW_EVENT_AVAILABLE** - New events matching interests
2. **PROMOTION_OFFER** - Promotional offers
3. **EARLY_BIRD_REMINDER** - Early bird deadline reminder

#### Account-Related

1. **ACCOUNT_VERIFIED** - Account verified
2. **PASSWORD_CHANGED** - Password changed
3. **LOGIN_ATTEMPT** - New login detected
4. **ACCOUNT_SUSPENDED** - Account suspended
5. **ACCOUNT_ACTIVATED** - Account activated

### Implementation Timeline

**Total Duration: 10 weeks**

- **Week 1-2**: Notification System Foundation (Database, Services, Preferences)
- **Week 3-4**: Event-Related Automated Notifications
- **Week 5-6**: Bulk Messaging System
- **Week 7-8**: Multi-Channel Delivery (SMS, Push, In-App)
- **Week 9**: Notification Preferences UI
- **Week 10**: Advanced Features & Edge Cases

### Success Metrics

**Notification Delivery:**

- ✅ 95%+ delivery rate across all channels
- ✅ <5 second delivery time for in-app notifications
- ✅ <1 minute delivery time for email/SMS
- ✅ Zero duplicate notifications

**User Engagement:**

- ✅ 60%+ open rate for event reminders
- ✅ 40%+ open rate for event updates
- ✅ 30%+ click rate for marketing notifications
- ✅ <5% unsubscribe rate

**System Performance:**

- ✅ Handle 10,000+ notifications per hour
- ✅ Queue system processes notifications within SLA
- ✅ Notification preferences respected 100% of the time

### Dependencies

**Required First:**

1. Email service (already exists)
2. Database schema updates
3. Queue system (BullMQ/Redis)

**Can Be Parallel:**

- SMS integration
- Push notification integration
- Frontend notification center
- Bulk messaging UI

### Notes

- **Notification preferences are critical** - Users must be able to control what they receive
- **Multi-channel support** - Not all users prefer email; support SMS, push, in-app
- **Rate limiting essential** - Prevent notification spam
- **Queue system required** - Handle high volume efficiently
- **Template system** - Reusable notification templates
- **Analytics important** - Track what works and what doesn't
- **Edge cases matter** - Handle cancellations, refunds, capacity issues gracefully
- **Real-time updates** - In-app notifications should be instant
- **Bulk messaging** - Essential for event organizers to communicate with attendees

---

## Section 5: Comprehensive Accounting & Financial Management System

### Current State Analysis

#### 1. Frontend Finance Pages

**What Exists:**

- ✅ `FinanceDashboard.tsx` - Overview with income/expense totals (mock data)
- ✅ `IncomeStatementPage.tsx` - Profit & Loss report (mock data)
- ✅ `ExpensesPage.tsx` - Expense listing and management (mock data)
- ✅ `WagesPage.tsx` - Salary/payroll management (mock data)
- ✅ `TransactionsPage.tsx` - Transaction listing (mock data)
- ✅ `IncomePage.tsx` - Income management (exists)
- ✅ Basic UI components for financial data display

**What's Missing:**

- ❌ **No backend implementation** - All data is mock
- ❌ **No database models** - No financial transaction models
- ❌ **No expense categories** - Missing marketing, logistics, company expenses, miscellaneous, sponsorships, donations
- ❌ **No salary/payroll system** - No automated payroll processing
- ❌ **No invoice generation** - Can't generate invoices for expenses/income
- ❌ **No financial reporting** - Missing balance sheet, cash flow statement, trial balance
- ❌ **No budget management** - No budget planning or tracking
- ❌ **No approval workflows** - No expense approval system
- ❌ **No receipt/document management** - Can't attach receipts to expenses
- ❌ **No multi-currency support** - Only USD supported
- ❌ **No tax calculations** - No tax handling
- ❌ **No recurring transactions** - Can't set up recurring expenses/income
- ❌ **No chart of accounts** - No accounting structure
- ❌ **No general ledger** - No double-entry bookkeeping
- ❌ **No financial reconciliation** - No bank reconciliation
- ❌ **No financial analytics** - No advanced financial insights

#### 2. Backend Financial Services

**What Exists:**

- ✅ Basic payment processing (Paystack integration)
- ✅ Event registration payment handling
- ✅ Platform fee calculations

**What's Missing:**

- ❌ **No accounting service** - No financial transaction service
- ❌ **No expense service** - No expense management backend
- ❌ **No payroll service** - No salary processing backend
- ❌ **No invoice service** - No invoice generation backend
- ❌ **No reporting service** - No financial report generation
- ❌ **No budget service** - No budget management backend
- ❌ **No reconciliation service** - No bank reconciliation

#### 3. Database Schema

**What Exists:**

- ✅ `EventRegistration` model (has payment fields)
- ✅ Basic payment status tracking

**What's Missing:**

- ❌ **No FinancialTransaction model** - No transaction records
- ❌ **No Expense model** - No expense records
- ❌ **No Income model** - No income records
- ❌ **No Salary model** - No payroll records
- ❌ **No Invoice model** - No invoice records
- ❌ **No Budget model** - No budget records
- ❌ **No ChartOfAccounts model** - No accounting structure
- ❌ **No GeneralLedger model** - No double-entry bookkeeping
- ❌ **No Receipt model** - No receipt/document storage
- ❌ **No ApprovalWorkflow model** - No approval tracking

### Required Implementation

#### Phase 1: Database Schema & Foundation (Week 1-2)

**Priority: HIGH** | **Dependencies: None**

##### 1.1 Core Financial Models

**Estimated Time: 3-4 days**

**Tasks:**

- [ ] Create `ChartOfAccounts` model:

  ```prisma
  model ChartOfAccounts {
    id            String   @id @default(cuid())
    code          String   @unique // Account code (e.g., "4000", "5000")
    name          String   // Account name
    type          String   // asset, liability, equity, revenue, expense
    category      String?  // Main category
    subCategory   String?  // Sub-category
    parentId      String?  // Parent account (for hierarchy)
    parent        ChartOfAccounts? @relation("AccountHierarchy", fields: [parentId], references: [id], onDelete: SetNull)
    children      ChartOfAccounts[] @relation("AccountHierarchy")
    isActive      Boolean  @default(true)
    description   String?  @db.Text
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt

    transactions  FinancialTransaction[]

    @@index([code])
    @@index([type])
    @@index([category])
  }
  ```

- [ ] Create `FinancialTransaction` model:

  ```prisma
  model FinancialTransaction {
    id            String   @id @default(cuid())
    transactionNumber String @unique // Auto-generated (e.g., "TXN-2024-001")
    type          String   // income, expense, transfer, adjustment
    category      String   // Event Registration, Marketing, Wages, etc.

    // Amounts
    amount        Decimal  @db.Decimal(10, 2)
    currency      String   @default("USD")
    exchangeRate  Decimal? @db.Decimal(10, 6) // For multi-currency

    // Accounting
    debitAccountId String? // For double-entry
    creditAccountId String? // For double-entry
    debitAccount  ChartOfAccounts? @relation("DebitTransactions", fields: [debitAccountId], references: [id])
    creditAccount ChartOfAccounts? @relation("CreditTransactions", fields: [creditAccountId], references: [id])

    // Details
    description   String   @db.Text
    reference     String?  // External reference (invoice #, check #, etc.)
    paymentMethod String  // cash, bank_transfer, credit_card, check, paystack, etc.

    // Related Entities
    eventId       String?
    event         Event?   @relation(fields: [eventId], references: [id], onDelete: SetNull)
    registrationId String?
    registration  EventRegistration? @relation(fields: [registrationId], references: [id], onDelete: SetNull)
    expenseId     String?
    expense       Expense? @relation(fields: [expenseId], references: [id], onDelete: SetNull)
    incomeId      String?
    income        Income? @relation(fields: [incomeId], references: [id], onDelete: SetNull)
    salaryId      String?
    salary        Salary? @relation(fields: [salaryId], references: [id], onDelete: SetNull)
    invoiceId     String?
    invoice       Invoice? @relation(fields: [invoiceId], references: [id], onDelete: SetNull)

    // Status
    status        String   @default("pending") // pending, approved, completed, cancelled, rejected
    approvedBy    String?
    approvedAt    DateTime?
    rejectedBy    String?
    rejectedAt    DateTime?
    rejectionReason String? @db.Text

    // Dates
    transactionDate DateTime
    dueDate       DateTime?
    paidDate      DateTime?

    // Tax
    taxAmount     Decimal? @db.Decimal(10, 2)
    taxRate       Decimal? @db.Decimal(5, 2)
    isTaxIncluded Boolean  @default(false)

    // Recurring
    isRecurring   Boolean  @default(false)
    recurringRule String?  // JSON: { frequency: "monthly", interval: 1, endDate: "..." }
    parentTransactionId String? // For recurring series
    parentTransaction FinancialTransaction? @relation("RecurringTransactions", fields: [parentTransactionId], references: [id])
    recurringTransactions FinancialTransaction[] @relation("RecurringTransactions")

    // Metadata
    metadata      Json?
    notes         String?  @db.Text
    attachments   Receipt[]

    // Audit
    createdBy     String
    creator       User     @relation("TransactionCreator", fields: [createdBy], references: [id], onDelete: SetNull)
    updatedBy     String?
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt

    @@index([type])
    @@index([category])
    @@index([status])
    @@index([transactionDate])
    @@index([eventId])
    @@index([createdBy])
  }
  ```

- [ ] Create `Expense` model:

  ```prisma
  model Expense {
    id            String   @id @default(cuid())
    expenseNumber String   @unique // Auto-generated
    category      String   // Marketing, Logistics, Company Expenses, Miscellaneous, Sponsorships, Donations, Wages, Utilities, etc.
    subCategory   String?  // More specific categorization

    // Amounts
    amount        Decimal  @db.Decimal(10, 2)
    currency      String   @default("USD")
    taxAmount     Decimal? @db.Decimal(10, 2)
    totalAmount   Decimal  @db.Decimal(10, 2) // amount + tax

    // Details
    description   String   @db.Text
    vendor        String?  // Vendor/supplier name
    recipient     String?  // Payment recipient
    paymentMethod String   // cash, bank_transfer, credit_card, check

    // Related Entities
    eventId       String?  // If event-specific
    event         Event?   @relation(fields: [eventId], references: [id], onDelete: SetNull)
    budgetId      String?  // If part of a budget
    budget        Budget?  @relation(fields: [budgetId], references: [id], onDelete: SetNull)

    // Status & Approval
    status        String   @default("pending") // draft, pending, approved, paid, rejected, cancelled
    approvalStatus String  @default("pending") // pending, approved, rejected
    approvedBy    String?
    approvedAt    DateTime?
    rejectedBy    String?
    rejectedAt    DateTime?
    rejectionReason String? @db.Text

    // Dates
    expenseDate   DateTime
    dueDate       DateTime?
    paidDate      DateTime?

    // Recurring
    isRecurring   Boolean  @default(false)
    recurringRule String?  // JSON

    // Documents
    receipts      Receipt[]
    invoiceId     String?  // If linked to an invoice
    invoice       Invoice? @relation(fields: [invoiceId], references: [id], onDelete: SetNull)

    // Metadata
    metadata      Json?
    notes         String?  @db.Text

    // Audit
    createdBy     String
    creator       User     @relation("ExpenseCreator", fields: [createdBy], references: [id], onDelete: SetNull)
    updatedBy     String?
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt

    // Relations
    transactions  FinancialTransaction[]

    @@index([category])
    @@index([status])
    @@index([expenseDate])
    @@index([eventId])
    @@index([createdBy])
  }
  ```

- [ ] Create `Income` model:

  ```prisma
  model Income {
    id            String   @id @default(cuid())
    incomeNumber  String   @unique // Auto-generated
    category      String   // Event Registration, Subscription, Platform Fees, Sponsorships, Donations, Other Income
    subCategory   String?

    // Amounts
    amount        Decimal  @db.Decimal(10, 2)
    currency      String   @default("USD")
    taxAmount     Decimal? @db.Decimal(10, 2)
    totalAmount   Decimal  @db.Decimal(10, 2)

    // Details
    description   String   @db.Text
    source        String?  // Income source
    paymentMethod String

    // Related Entities
    eventId       String?
    event         Event?   @relation(fields: [eventId], references: [id], onDelete: SetNull)
    registrationId String?
    registration  EventRegistration? @relation(fields: [registrationId], references: [id], onDelete: SetNull)

    // Status
    status        String   @default("pending") // pending, received, confirmed, cancelled
    receivedDate  DateTime?

    // Recurring
    isRecurring   Boolean  @default(false)
    recurringRule String?

    // Documents
    invoiceId     String?
    invoice       Invoice? @relation(fields: [invoiceId], references: [id], onDelete: SetNull)

    // Metadata
    metadata      Json?
    notes         String?  @db.Text

    // Audit
    createdBy     String
    creator       User     @relation("IncomeCreator", fields: [createdBy], references: [id], onDelete: SetNull)
    updatedBy     String?
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt

    // Relations
    transactions  FinancialTransaction[]

    @@index([category])
    @@index([status])
    @@index([eventId])
    @@index([createdBy])
  }
  ```

- [ ] Create `Salary` model:

  ```prisma
  model Salary {
    id            String   @id @default(cuid())
    salaryNumber  String   @unique // Auto-generated
    employeeId    String   // User ID of employee
    employee      User     @relation("EmployeeSalaries", fields: [employeeId], references: [id], onDelete: Cascade)

    // Pay Details
    payPeriod     String   // "2024-01-01 to 2024-01-31"
    payDate       DateTime
    payFrequency  String   // monthly, biweekly, weekly, daily

    // Compensation
    baseSalary    Decimal  @db.Decimal(10, 2)
    hoursWorked   Decimal? @db.Decimal(5, 2)
    hourlyRate    Decimal? @db.Decimal(10, 2)
    overtime      Decimal? @db.Decimal(5, 2)
    overtimeRate  Decimal? @db.Decimal(10, 2)
    bonuses       Decimal? @db.Decimal(10, 2)
    allowances    Decimal? @db.Decimal(10, 2)

    // Deductions
    taxDeduction  Decimal? @db.Decimal(10, 2)
    socialSecurity Decimal? @db.Decimal(10, 2)
    healthInsurance Decimal? @db.Decimal(10, 2)
    otherDeductions Decimal? @db.Decimal(10, 2)
    totalDeductions Decimal @db.Decimal(10, 2)

    // Net Pay
    grossPay      Decimal  @db.Decimal(10, 2)
    netPay        Decimal  @db.Decimal(10, 2)

    // Payment
    paymentMethod String   // bank_transfer, check, cash
    bankAccount   String?  // Bank account details
    paymentReference String? // Payment transaction reference

    // Status
    status        String   @default("pending") // draft, pending, approved, paid, cancelled
    approvedBy    String?
    approvedAt    DateTime?
    paidAt        DateTime?

    // Metadata
    notes         String?  @db.Text
    payslipUrl    String?  // Link to generated payslip

    // Audit
    createdBy     String
    creator       User     @relation("SalaryCreator", fields: [createdBy], references: [id], onDelete: SetNull)
    updatedBy     String?
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt

    // Relations
    transactions  FinancialTransaction[]

    @@index([employeeId])
    @@index([payDate])
    @@index([status])
    @@index([createdBy])
  }
  ```

- [ ] Create `Invoice` model:

  ```prisma
  model Invoice {
    id            String   @id @default(cuid())
    invoiceNumber String   @unique // Auto-generated (e.g., "INV-2024-001")
    type          String   // expense, income, salary

    // Parties
    issuerId      String?  // If we're issuing the invoice
    issuer        User?    @relation("InvoiceIssuer", fields: [issuerId], references: [id], onDelete: SetNull)
    recipientId   String?  // If invoice is to us
    recipient     User?    @relation("InvoiceRecipient", fields: [recipientId], references: [id], onDelete: SetNull)
    recipientName String?  // External recipient name
    recipientEmail String?
    recipientAddress String? @db.Text

    // Amounts
    subtotal      Decimal  @db.Decimal(10, 2)
    taxAmount     Decimal? @db.Decimal(10, 2)
    discount      Decimal? @db.Decimal(10, 2)
    totalAmount   Decimal  @db.Decimal(10, 2)
    currency      String   @default("USD")

    // Details
    description   String   @db.Text
    lineItems     Json?    // Array of line items
    terms         String?  @db.Text // Payment terms
    dueDate       DateTime

    // Status
    status        String   @default("draft") // draft, sent, paid, overdue, cancelled
    issuedDate    DateTime?
    paidDate      DateTime?

    // Payment
    paymentMethod String?
    paymentReference String?

    // Related Entities
    expenseId     String?
    expense       Expense? @relation(fields: [expenseId], references: [id], onDelete: SetNull)
    incomeId      String?
    income        Income? @relation(fields: [incomeId], references: [id], onDelete: SetNull)

    // Documents
    pdfUrl        String?  // Generated invoice PDF
    attachments   Receipt[]

    // Metadata
    notes         String?  @db.Text

    // Audit
    createdBy     String
    creator       User     @relation("InvoiceCreator", fields: [createdBy], references: [id], onDelete: SetNull)
    updatedBy     String?
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt

    // Relations
    transactions  FinancialTransaction[]

    @@index([invoiceNumber])
    @@index([status])
    @@index([dueDate])
    @@index([createdBy])
  }
  ```

- [ ] Create `Budget` model:

  ```prisma
  model Budget {
    id            String   @id @default(cuid())
    name          String
    description   String?  @db.Text
    period        String   // "2024-Q1", "2024", "2024-01"
    startDate     DateTime
    endDate       DateTime

    // Budget Amounts
    totalBudget   Decimal  @db.Decimal(10, 2)
    allocatedAmount Decimal @db.Decimal(10, 2) // Sum of category budgets
    spentAmount   Decimal  @db.Decimal(10, 2) // Calculated from expenses
    remainingAmount Decimal @db.Decimal(10, 2) // Calculated

    // Categories
    categories    Json     // { "Marketing": 5000, "Wages": 12000, ... }

    // Related Entities
    eventId       String?  // If event-specific budget
    event         Event?   @relation(fields: [eventId], references: [id], onDelete: SetNull)

    // Status
    status        String   @default("draft") // draft, active, completed, cancelled

    // Metadata
    notes         String?  @db.Text

    // Audit
    createdBy     String
    creator       User     @relation("BudgetCreator", fields: [createdBy], references: [id], onDelete: SetNull)
    updatedBy     String?
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt

    // Relations
    expenses      Expense[]

    @@index([period])
    @@index([eventId])
    @@index([status])
    @@index([createdBy])
  }
  ```

- [ ] Create `Receipt` model:

  ```prisma
  model Receipt {
    id            String   @id @default(cuid())
    filename      String
    originalName  String
    mimeType      String
    size          Int      // Bytes
    url           String   // Storage URL
    thumbnailUrl  String?  // Thumbnail for images

    // Related Entities
    transactionId String?
    transaction   FinancialTransaction? @relation(fields: [transactionId], references: [id], onDelete: Cascade)
    expenseId     String?
    expense       Expense? @relation(fields: [expenseId], references: [id], onDelete: Cascade)
    invoiceId     String?
    invoice       Invoice? @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

    // Metadata
    description   String?  @db.Text
    uploadedBy    String
    uploader     User     @relation(fields: [uploadedBy], references: [id], onDelete: SetNull)
    createdAt     DateTime @default(now())

    @@index([transactionId])
    @@index([expenseId])
    @@index([invoiceId])
  }
  ```

- [ ] Create `GeneralLedger` model (for double-entry bookkeeping):

  ```prisma
  model GeneralLedger {
    id            String   @id @default(cuid())
    entryNumber   String   @unique // Auto-generated
    transactionId String
    transaction   FinancialTransaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)

    // Double Entry
    debitAccountId String
    creditAccountId String
    debitAccount  ChartOfAccounts @relation("DebitEntries", fields: [debitAccountId], references: [id])
    creditAccount ChartOfAccounts @relation("CreditEntries", fields: [creditAccountId], references: [id])

    amount        Decimal  @db.Decimal(10, 2)
    currency      String   @default("USD")

    // Balance
    debitBalance  Decimal  @db.Decimal(10, 2)
    creditBalance Decimal  @db.Decimal(10, 2)

    entryDate     DateTime
    description   String   @db.Text

    createdAt     DateTime @default(now())

    @@index([transactionId])
    @@index([entryDate])
    @@index([debitAccountId])
    @@index([creditAccountId])
  }
  ```

- [ ] Add relations to existing models:

  ```prisma
  model User {
    // ... existing fields
    transactionsCreated FinancialTransaction[] @relation("TransactionCreator")
    expensesCreated Expense[] @relation("ExpenseCreator")
    incomeCreated Income[] @relation("IncomeCreator")
    salariesReceived Salary[] @relation("EmployeeSalaries")
    salariesCreated Salary[] @relation("SalaryCreator")
    invoicesIssued Invoice[] @relation("InvoiceIssuer")
    invoicesReceived Invoice[] @relation("InvoiceRecipient")
    invoicesCreated Invoice[] @relation("InvoiceCreator")
    budgetsCreated Budget[] @relation("BudgetCreator")
    receiptsUploaded Receipt[]
  }

  model Event {
    // ... existing fields
    transactions FinancialTransaction[]
    expenses Expense[]
    income Income[]
    budgets Budget[]
  }

  model EventRegistration {
    // ... existing fields
    transactions FinancialTransaction[]
    income Income[]
  }
  ```

- [ ] Create migrations
- [ ] Update Prisma client

**Deliverables:**

- Complete Prisma schema with all financial models
- Database migrations
- Updated Prisma client
- Seed data for Chart of Accounts

##### 1.2 Expense Categories Setup

**Estimated Time: 1 day**

**Tasks:**

- [ ] Define expense categories:

  - **Marketing**: Advertising, Social Media, Content Creation, PR, Events
  - **Logistics**: Venue Rental, Catering, Transportation, Equipment Rental, Setup/Breakdown
  - **Company Expenses**: Office Rent, Utilities, Software Licenses, Insurance, Legal Fees
  - **Miscellaneous**: Office Supplies, Travel, Training, Subscriptions, Other
  - **Sponsorships**: Event Sponsorships (received), Sponsorship Payments (paid)
  - **Donations**: Charitable Donations (given), Donations Received
  - **Wages**: Salaries, Bonuses, Contractor Payments, Benefits
  - **Taxes**: Income Tax, Sales Tax, VAT, Other Taxes

- [ ] Create seed script for expense categories
- [ ] Create seed script for Chart of Accounts

**Deliverables:**

- Expense category definitions
- Seed scripts
- Documentation

**Total Phase 1 Duration: 4-5 days**

#### Phase 2: Backend Services (Week 3-5)

**Priority: HIGH** | **Dependencies: Phase 1**

##### 2.1 Financial Transaction Service

**Estimated Time: 3-4 days**

**Tasks:**

- [ ] Create `FinancialTransactionService`:

  - `createTransaction(data)` - Create new transaction
  - `updateTransaction(id, data)` - Update transaction
  - `deleteTransaction(id)` - Delete transaction
  - `approveTransaction(id, approverId)` - Approve transaction
  - `rejectTransaction(id, approverId, reason)` - Reject transaction
  - `getTransaction(id)` - Get single transaction
  - `getTransactions(filters)` - Get filtered transactions
  - `getTransactionSummary(period)` - Get summary by period
  - `processRecurringTransactions()` - Process recurring transactions (scheduled job)

- [ ] Transaction number generation (auto-increment)
- [ ] Double-entry bookkeeping logic
- [ ] General ledger entry creation
- [ ] Transaction validation
- [ ] Approval workflow integration

**Deliverables:**

- `services/financial-transaction.service.ts`
- Transaction validation
- Double-entry logic
- Unit tests

##### 2.2 Expense Service

**Estimated Time: 3-4 days**

**Tasks:**

- [ ] Create `ExpenseService`:

  - `createExpense(data)` - Create new expense
  - `updateExpense(id, data)` - Update expense
  - `deleteExpense(id)` - Delete expense
  - `approveExpense(id, approverId)` - Approve expense
  - `rejectExpense(id, approverId, reason)` - Reject expense
  - `markAsPaid(id, paymentData)` - Mark expense as paid
  - `getExpense(id)` - Get single expense
  - `getExpenses(filters)` - Get filtered expenses
  - `getExpenseSummary(period, category?)` - Get expense summary
  - `attachReceipt(expenseId, file)` - Attach receipt to expense
  - `createRecurringExpense(data)` - Create recurring expense

- [ ] Expense number generation
- [ ] Budget validation (check if expense exceeds budget)
- [ ] Category validation
- [ ] Receipt upload handling
- [ ] Integration with FinancialTransactionService

**Deliverables:**

- `services/expense.service.ts`
- Receipt upload service
- Budget validation
- Unit tests

##### 2.3 Income Service

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Create `IncomeService`:

  - `createIncome(data)` - Create new income
  - `updateIncome(id, data)` - Update income
  - `deleteIncome(id)` - Delete income
  - `markAsReceived(id, receiptData)` - Mark income as received
  - `getIncome(id)` - Get single income
  - `getIncomes(filters)` - Get filtered incomes
  - `getIncomeSummary(period, category?)` - Get income summary
  - `createRecurringIncome(data)` - Create recurring income

- [ ] Income number generation
- [ ] Integration with event registrations
- [ ] Integration with FinancialTransactionService

**Deliverables:**

- `services/income.service.ts`
- Income validation
- Unit tests

##### 2.4 Salary/Payroll Service

**Estimated Time: 4-5 days**

**Tasks:**

- [ ] Create `SalaryService`:

  - `createSalary(data)` - Create salary record
  - `updateSalary(id, data)` - Update salary
  - `deleteSalary(id)` - Delete salary
  - `approveSalary(id, approverId)` - Approve salary
  - `processPayroll(employeeIds, payPeriod)` - Process payroll for employees
  - `calculateSalary(employeeId, payPeriod, hoursWorked?)` - Calculate salary
  - `generatePayslip(salaryId)` - Generate payslip PDF
  - `getSalary(id)` - Get single salary
  - `getSalaries(filters)` - Get filtered salaries
  - `getPayrollSummary(period)` - Get payroll summary
  - `getEmployeeSalaryHistory(employeeId)` - Get employee salary history

- [ ] Salary calculation logic:

  - Gross pay calculation (base + overtime + bonuses)
  - Tax calculation (income tax, social security)
  - Deduction calculation (insurance, other)
  - Net pay calculation

- [ ] Payslip generation (PDF)
- [ ] Integration with FinancialTransactionService
- [ ] Payroll scheduling (recurring salaries)

**Deliverables:**

- `services/salary.service.ts`
- Salary calculation engine
- Payslip generation service
- Unit tests

##### 2.5 Invoice Service

**Estimated Time: 3-4 days**

**Tasks:**

- [ ] Create `InvoiceService`:

  - `createInvoice(data)` - Create new invoice
  - `updateInvoice(id, data)` - Update invoice
  - `deleteInvoice(id)` - Delete invoice
  - `sendInvoice(id, recipientEmail)` - Send invoice via email
  - `markAsPaid(id, paymentData)` - Mark invoice as paid
  - `generateInvoicePDF(id)` - Generate invoice PDF
  - `getInvoice(id)` - Get single invoice
  - `getInvoices(filters)` - Get filtered invoices
  - `getInvoiceSummary(period)` - Get invoice summary

- [ ] Invoice number generation
- [ ] PDF generation (using PDF library)
- [ ] Email integration
- [ ] Line items management
- [ ] Tax calculations

**Deliverables:**

- `services/invoice.service.ts`
- PDF generation service
- Email integration
- Unit tests

##### 2.6 Budget Service

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Create `BudgetService`:

  - `createBudget(data)` - Create new budget
  - `updateBudget(id, data)` - Update budget
  - `deleteBudget(id)` - Delete budget
  - `getBudget(id)` - Get single budget
  - `getBudgets(filters)` - Get filtered budgets
  - `getBudgetStatus(id)` - Get budget status (spent vs allocated)
  - `checkBudgetAvailability(budgetId, amount, category)` - Check if expense fits budget
  - `getBudgetVariance(id)` - Get budget variance report

- [ ] Budget calculation logic
- [ ] Budget tracking (spent vs allocated)
- [ ] Budget alerts (when approaching limit)

**Deliverables:**

- `services/budget.service.ts`
- Budget tracking logic
- Unit tests

##### 2.7 Financial Reporting Service

**Estimated Time: 4-5 days**

**Tasks:**

- [ ] Create `FinancialReportingService`:

  - `generateIncomeStatement(period)` - Generate P&L statement
  - `generateBalanceSheet(date)` - Generate balance sheet
  - `generateCashFlowStatement(period)` - Generate cash flow statement
  - `generateTrialBalance(date)` - Generate trial balance
  - `generateProfitLossReport(period, category?)` - Detailed P&L
  - `generateExpenseReport(period, category?)` - Expense breakdown
  - `generateRevenueReport(period, category?)` - Revenue breakdown
  - `generateBudgetReport(budgetId)` - Budget performance report
  - `generateTaxReport(period)` - Tax report
  - `exportReport(reportType, period, format)` - Export report (PDF, Excel, CSV)

- [ ] Report calculation logic
- [ ] PDF/Excel export functionality
- [ ] Report templates

**Deliverables:**

- `services/financial-reporting.service.ts`
- Report generation logic
- Export functionality
- Unit tests

**Total Phase 2 Duration: 19-24 days**

#### Phase 3: API Endpoints (Week 6-7)

**Priority: HIGH** | **Dependencies: Phase 2**

##### 3.1 Financial Transaction API

**Estimated Time: 2 days**

**Tasks:**

- [ ] Create `financial-transaction.routes.ts`:

  - `POST /api/v1/admin/finance/transactions` - Create transaction
  - `GET /api/v1/admin/finance/transactions` - List transactions
  - `GET /api/v1/admin/finance/transactions/:id` - Get transaction
  - `PUT /api/v1/admin/finance/transactions/:id` - Update transaction
  - `DELETE /api/v1/admin/finance/transactions/:id` - Delete transaction
  - `POST /api/v1/admin/finance/transactions/:id/approve` - Approve transaction
  - `POST /api/v1/admin/finance/transactions/:id/reject` - Reject transaction
  - `GET /api/v1/admin/finance/transactions/summary` - Get summary

- [ ] Validation middleware
- [ ] Permission checks (ADMIN_STAFF+)
- [ ] Controller implementation

##### 3.2 Expense API

**Estimated Time: 2 days**

**Tasks:**

- [ ] Create `expense.routes.ts`:
  - `POST /api/v1/admin/finance/expenses` - Create expense
  - `GET /api/v1/admin/finance/expenses` - List expenses
  - `GET /api/v1/admin/finance/expenses/:id` - Get expense
  - `PUT /api/v1/admin/finance/expenses/:id` - Update expense
  - `DELETE /api/v1/admin/finance/expenses/:id` - Delete expense
  - `POST /api/v1/admin/finance/expenses/:id/approve` - Approve expense
  - `POST /api/v1/admin/finance/expenses/:id/reject` - Reject expense
  - `POST /api/v1/admin/finance/expenses/:id/pay` - Mark as paid
  - `POST /api/v1/admin/finance/expenses/:id/receipts` - Upload receipt
  - `GET /api/v1/admin/finance/expenses/summary` - Get summary

##### 3.3 Income API

**Estimated Time: 1-2 days**

**Tasks:**

- [ ] Create `income.routes.ts`:
  - `POST /api/v1/admin/finance/income` - Create income
  - `GET /api/v1/admin/finance/income` - List income
  - `GET /api/v1/admin/finance/income/:id` - Get income
  - `PUT /api/v1/admin/finance/income/:id` - Update income
  - `DELETE /api/v1/admin/finance/income/:id` - Delete income
  - `POST /api/v1/admin/finance/income/:id/receive` - Mark as received
  - `GET /api/v1/admin/finance/income/summary` - Get summary

##### 3.4 Salary API

**Estimated Time: 2 days**

**Tasks:**

- [ ] Create `salary.routes.ts`:
  - `POST /api/v1/admin/finance/salaries` - Create salary
  - `GET /api/v1/admin/finance/salaries` - List salaries
  - `GET /api/v1/admin/finance/salaries/:id` - Get salary
  - `PUT /api/v1/admin/finance/salaries/:id` - Update salary
  - `DELETE /api/v1/admin/finance/salaries/:id` - Delete salary
  - `POST /api/v1/admin/finance/salaries/:id/approve` - Approve salary
  - `POST /api/v1/admin/finance/salaries/process-payroll` - Process payroll
  - `GET /api/v1/admin/finance/salaries/:id/payslip` - Download payslip
  - `GET /api/v1/admin/finance/salaries/summary` - Get summary

##### 3.5 Invoice API

**Estimated Time: 2 days**

**Tasks:**

- [ ] Create `invoice.routes.ts`:
  - `POST /api/v1/admin/finance/invoices` - Create invoice
  - `GET /api/v1/admin/finance/invoices` - List invoices
  - `GET /api/v1/admin/finance/invoices/:id` - Get invoice
  - `PUT /api/v1/admin/finance/invoices/:id` - Update invoice
  - `DELETE /api/v1/admin/finance/invoices/:id` - Delete invoice
  - `POST /api/v1/admin/finance/invoices/:id/send` - Send invoice
  - `POST /api/v1/admin/finance/invoices/:id/mark-paid` - Mark as paid
  - `GET /api/v1/admin/finance/invoices/:id/pdf` - Download PDF
  - `GET /api/v1/admin/finance/invoices/summary` - Get summary

##### 3.6 Budget API

**Estimated Time: 1-2 days**

**Tasks:**

- [ ] Create `budget.routes.ts`:
  - `POST /api/v1/admin/finance/budgets` - Create budget
  - `GET /api/v1/admin/finance/budgets` - List budgets
  - `GET /api/v1/admin/finance/budgets/:id` - Get budget
  - `PUT /api/v1/admin/finance/budgets/:id` - Update budget
  - `DELETE /api/v1/admin/finance/budgets/:id` - Delete budget
  - `GET /api/v1/admin/finance/budgets/:id/status` - Get budget status
  - `GET /api/v1/admin/finance/budgets/:id/variance` - Get variance report

##### 3.7 Financial Reporting API

**Estimated Time: 2 days**

**Tasks:**

- [ ] Create `financial-reporting.routes.ts`:
  - `GET /api/v1/admin/finance/reports/income-statement` - Income statement
  - `GET /api/v1/admin/finance/reports/balance-sheet` - Balance sheet
  - `GET /api/v1/admin/finance/reports/cash-flow` - Cash flow statement
  - `GET /api/v1/admin/finance/reports/trial-balance` - Trial balance
  - `GET /api/v1/admin/finance/reports/profit-loss` - P&L report
  - `GET /api/v1/admin/finance/reports/expense` - Expense report
  - `GET /api/v1/admin/finance/reports/revenue` - Revenue report
  - `GET /api/v1/admin/finance/reports/budget/:id` - Budget report
  - `GET /api/v1/admin/finance/reports/tax` - Tax report
  - `GET /api/v1/admin/finance/reports/export` - Export report

**Total Phase 3 Duration: 12-14 days**

#### Phase 4: Frontend Implementation (Week 8-10)

**Priority: HIGH** | **Dependencies: Phase 3**

##### 4.1 Update Finance Dashboard

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Replace mock data with real API calls
- [ ] Add real-time financial metrics
- [ ] Add financial charts (revenue, expenses, profit trends)
- [ ] Add quick actions (create expense, create income, etc.)
- [ ] Add recent transactions widget
- [ ] Add budget status widgets

##### 4.2 Expense Management UI

**Estimated Time: 3-4 days**

**Tasks:**

- [ ] Update `ExpensesPage.tsx`:

  - Replace mock data with API calls
  - Add expense creation form
  - Add expense editing
  - Add expense approval workflow UI
  - Add receipt upload functionality
  - Add expense filtering and search
  - Add expense export functionality

- [ ] Create `CreateExpensePage.tsx`:

  - Expense form with all fields
  - Category selection
  - Budget validation display
  - Receipt upload
  - Recurring expense setup

- [ ] Create `ExpenseDetailPage.tsx`:
  - Expense details view
  - Approval workflow
  - Receipt viewing
  - Payment tracking
  - Related transactions

##### 4.3 Income Management UI

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Update `IncomePage.tsx`:

  - Replace mock data with API calls
  - Add income creation form
  - Add income editing
  - Add income filtering

- [ ] Create `CreateIncomePage.tsx`:
  - Income form
  - Category selection
  - Event/registration linking

##### 4.4 Salary/Payroll UI

**Estimated Time: 3-4 days**

**Tasks:**

- [ ] Update `WagesPage.tsx`:

  - Replace mock data with API calls
  - Add salary creation form
  - Add payroll processing UI
  - Add payslip download
  - Add employee salary history

- [ ] Create `ProcessPayrollPage.tsx`:

  - Employee selection
  - Pay period selection
  - Salary calculation preview
  - Bulk payroll processing
  - Payslip generation

- [ ] Create `SalaryDetailPage.tsx`:
  - Salary details
  - Payslip view/download
  - Approval workflow

##### 4.5 Invoice Management UI

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Create `InvoicesPage.tsx`:

  - Invoice listing
  - Invoice creation
  - Invoice status tracking
  - Invoice PDF download
  - Invoice email sending

- [ ] Create `CreateInvoicePage.tsx`:

  - Invoice form
  - Line items management
  - Tax calculations
  - Recipient management

- [ ] Create `InvoiceDetailPage.tsx`:
  - Invoice preview
  - PDF view
  - Payment tracking
  - Send invoice functionality

##### 4.6 Budget Management UI

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Create `BudgetsPage.tsx`:

  - Budget listing
  - Budget creation
  - Budget status display
  - Budget variance visualization

- [ ] Create `CreateBudgetPage.tsx`:

  - Budget form
  - Category allocation
  - Period selection
  - Event linking

- [ ] Create `BudgetDetailPage.tsx`:
  - Budget overview
  - Spent vs allocated visualization
  - Expense breakdown by category
  - Budget alerts

##### 4.7 Financial Reports UI

**Estimated Time: 3-4 days**

**Tasks:**

- [ ] Update `IncomeStatementPage.tsx`:

  - Replace mock data with API calls
  - Add period selection
  - Add export functionality
  - Add chart visualizations

- [ ] Create `BalanceSheetPage.tsx`:

  - Balance sheet display
  - Period selection
  - Export functionality

- [ ] Create `CashFlowPage.tsx`:

  - Cash flow statement
  - Period selection
  - Export functionality

- [ ] Create `ReportsPage.tsx`:
  - Report selection
  - Report parameters
  - Report generation
  - Report export

##### 4.8 Transaction Management UI

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Update `TransactionsPage.tsx`:
  - Replace mock data with API calls
  - Add transaction creation
  - Add transaction filtering
  - Add transaction export
  - Add approval workflow

**Total Phase 4 Duration: 19-24 days**

#### Phase 5: Advanced Features (Week 11-12)

**Priority: MEDIUM** | **Dependencies: Phase 4**

##### 5.1 Multi-Currency Support

**Estimated Time: 3-4 days**

**Tasks:**

- [ ] Currency configuration
- [ ] Exchange rate management
- [ ] Multi-currency transaction handling
- [ ] Currency conversion in reports
- [ ] Currency selection in UI

##### 5.2 Tax Management

**Estimated Time: 3-4 days**

**Tasks:**

- [ ] Tax configuration (rates, types)
- [ ] Tax calculation engine
- [ ] Tax reporting
- [ ] Tax exemption handling
- [ ] Tax invoice generation

##### 5.3 Recurring Transactions

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Recurring transaction setup
- [ ] Recurring transaction scheduler (cron job)
- [ ] Recurring transaction management UI
- [ ] Recurring transaction notifications

##### 5.4 Approval Workflows

**Estimated Time: 3-4 days**

**Tasks:**

- [ ] Approval workflow configuration
- [ ] Multi-level approvals
- [ ] Approval notifications
- [ ] Approval history tracking
- [ ] Approval UI components

##### 5.5 Bank Reconciliation

**Estimated Time: 3-4 days**

**Tasks:**

- [ ] Bank statement import
- [ ] Transaction matching
- [ ] Reconciliation reports
- [ ] Reconciliation UI

##### 5.6 Financial Analytics

**Estimated Time: 3-4 days**

**Tasks:**

- [ ] Financial dashboard with advanced metrics
- [ ] Trend analysis
- [ ] Forecasting
- [ ] Budget vs actual analysis
- [ ] Profitability analysis
- [ ] Cash flow forecasting

**Total Phase 5 Duration: 17-22 days**

### Implementation Timeline

**Total Duration: 12 weeks**

- **Week 1-2**: Database Schema & Foundation
- **Week 3-5**: Backend Services
- **Week 6-7**: API Endpoints
- **Week 8-10**: Frontend Implementation
- **Week 11-12**: Advanced Features

### Success Metrics

**Financial Accuracy:**

- ✅ 100% transaction accuracy (double-entry bookkeeping)
- ✅ Zero unaccounted transactions
- ✅ All expenses have receipts (where applicable)
- ✅ Budget tracking accuracy within 1%

**System Performance:**

- ✅ Handle 10,000+ transactions per month
- ✅ Report generation within 5 seconds
- ✅ Real-time financial dashboard updates
- ✅ Invoice generation within 2 seconds

**User Experience:**

- ✅ Expense creation in <2 minutes
- ✅ Payroll processing in <10 minutes for 50 employees
- ✅ Report export in <5 seconds
- ✅ 95%+ user satisfaction with financial tools

### Dependencies

**Required First:**

1. Database schema (Phase 1)
2. File storage service (for receipts)
3. PDF generation library
4. Email service (for invoices)

**Can Be Parallel:**

- Frontend UI development
- Report generation
- Multi-currency support
- Tax management

### Notes

- **Double-entry bookkeeping is essential** - Ensures financial accuracy
- **Approval workflows are critical** - Prevents unauthorized spending
- **Receipt management is important** - Required for tax compliance
- **Budget tracking helps control costs** - Real-time budget monitoring
- **Multi-currency support** - Important for international events
- **Tax compliance** - Must handle tax calculations correctly
- **Audit trail** - All financial transactions must be auditable
- **Integration with event system** - Link expenses/income to events
- **Payroll automation** - Reduces manual work
- **Financial reporting** - Essential for decision-making

---

## Section 6: Comprehensive Settings & Preferences System

### Current State Analysis

#### 1. Admin Settings

**What Exists:**

- ✅ `AdminSettingsPage.tsx` - Platform-wide settings UI (mock data)
- ✅ Settings categories:
  - General (site name, URL, timezone, language, date/time format)
  - Users (registration, email verification, default role, session timeout)
  - Notifications (email, SMS, push)
  - Security (password requirements, 2FA, login attempts)
  - Appearance (theme, primary color, logo, favicon)
  - Email (SMTP configuration)
  - API (rate limits, key expiry, webhooks)
  - Maintenance (maintenance mode, message)

**What's Missing:**

- ❌ **No backend implementation** - All data is mock
- ❌ **No database model** - No settings storage
- ❌ **No API endpoints** - No settings API
- ❌ **No theme persistence** - Theme not saved
- ❌ **No settings validation** - No validation logic
- ❌ **No settings history** - No audit trail
- ❌ **No environment-specific settings** - No dev/staging/prod separation

#### 2. Organizer Settings

**What Exists:**

- ✅ `OrganizerSettingsPage.tsx` - User-specific settings UI (partially connected)
- ✅ Settings categories:
  - Profile (name, email, phone, organization, KYC status)
  - Notifications (email, event updates, registrations, payments, marketing)
  - Appearance (theme: light/dark/system, dashboard layout, metrics/charts)
  - Security (2FA, password change, session timeout, login alerts)

**What's Missing:**

- ❌ **No backend for preferences** - Only profile update works
- ❌ **No notification preferences API** - Notifications settings not saved
- ❌ **No appearance preferences API** - Theme/layout not persisted
- ❌ **No security preferences API** - Security settings not saved
- ❌ **No theme system** - Dark/light theme not implemented globally

#### 3. Attendee/User Settings

**What Exists:**

- ❌ **No settings page** - No attendee settings UI
- ❌ **No user preferences** - No way for attendees to manage preferences

**What's Missing:**

- ❌ **No profile settings** - Can't update profile
- ❌ **No notification preferences** - Can't control notifications
- ❌ **No appearance preferences** - Can't set theme
- ❌ **No privacy settings** - Can't control privacy
- ❌ **No account settings** - Can't manage account

#### 4. Theme System

**What Exists:**

- ✅ Theme selector in OrganizerSettingsPage (light/dark/system)
- ✅ Theme state in settings (not persisted)

**What's Missing:**

- ❌ **No global theme implementation** - Theme not applied across app
- ❌ **No theme persistence** - Theme choice not saved
- ❌ **No theme provider** - No React context for theme
- ❌ **No CSS variables** - No dynamic theme switching
- ❌ **No system preference detection** - System theme not detected

### Required Implementation

#### Phase 1: Database Schema & Theme System (Week 1)

**Priority: HIGH** | **Dependencies: None**

##### 1.1 Settings Database Schema

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Create `SystemSettings` model (platform-wide):

  ```prisma
  model SystemSettings {
    id            String   @id @default(cuid())
    key           String   @unique // e.g., "site.name", "email.smtp.host"
    value         String   @db.Text // JSON string for complex values
    type          String   // string, number, boolean, json
    category      String   // general, users, notifications, security, appearance, email, api, maintenance
    description   String?  @db.Text
    isPublic      Boolean  @default(false) // Can be accessed without auth
    isEncrypted   Boolean  @default(false) // Sensitive data (passwords, keys)
    environment   String?  // dev, staging, production (null = all)

    // Audit
    createdBy     String?
    updatedBy     String?
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt

    @@index([key])
    @@index([category])
    @@index([environment])
  }
  ```

- [ ] Create `UserPreferences` model (user-specific):

  ```prisma
  model UserPreferences {
    id            String   @id @default(cuid())
    userId        String   @unique

    // Appearance
    theme         String   @default("system") // light, dark, system
    primaryColor  String?  // Custom primary color
    dashboardLayout String @default("spacious") // compact, spacious
    showMetrics   Boolean  @default(true)
    showCharts    Boolean  @default(true)
    language      String   @default("en")
    timezone      String?
    dateFormat    String   @default("MM/DD/YYYY")
    timeFormat    String   @default("12h") // 12h, 24h

    // Notifications (see Section 4 for NotificationPreference model)
    // This can be merged with NotificationPreference or kept separate

    // Privacy
    profileVisibility String @default("public") // public, private, friends
    showEmail         Boolean @default(false)
    showPhone         Boolean @default(false)
    allowMessages     Boolean @default(true)

    // Account
    sessionTimeout    Int     @default(30) // minutes
    loginAlerts       Boolean @default(true)
    twoFactorAuth     Boolean @default(false)

    // Organizer-specific
    eventNotifications Boolean @default(true)
    registrationNotifications Boolean @default(true)
    paymentNotifications Boolean @default(true)
    marketingEmails    Boolean @default(false)
    weeklyDigest       Boolean @default(true)

    // Attendee-specific
    eventReminders     Boolean @default(true)
    eventUpdates       Boolean @default(true)
    promotionalOffers  Boolean @default(true)

    // Metadata
    metadata      Json?
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt

    user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@index([userId])
  }
  ```

- [ ] Create `SettingsHistory` model (audit trail):

  ```prisma
  model SettingsHistory {
    id            String   @id @default(cuid())
    settingId     String?  // SystemSettings ID (if system setting)
    userId        String?  // User ID (if user preference)
    key           String   // Setting key
    oldValue      String?  @db.Text
    newValue      String   @db.Text
    changedBy     String
    changeReason  String?  @db.Text
    createdAt     DateTime @default(now())

    @@index([settingId])
    @@index([userId])
    @@index([key])
    @@index([createdAt])
  }
  ```

- [ ] Add relation to `User` model:

  ```prisma
  model User {
    // ... existing fields
    preferences UserPreferences?
  }
  ```

- [ ] Create migrations
- [ ] Update Prisma client

**Deliverables:**

- Updated Prisma schema
- Database migrations
- Updated Prisma client

##### 1.2 Theme System Implementation

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Create `ThemeProvider` context:

  - `ThemeContext` with theme state
  - `useTheme()` hook
  - Theme switching logic (light/dark/system)
  - System preference detection
  - Theme persistence (localStorage + database)

- [ ] Create theme CSS variables:

  - Light theme variables
  - Dark theme variables
  - Dynamic theme switching
  - Smooth transitions

- [ ] Update global CSS:

  - CSS custom properties for colors
  - Theme-aware component styles
  - Dark mode styles

- [ ] Create theme toggle component:

  - Theme switcher button
  - Dropdown with light/dark/system options
  - Visual feedback

- [ ] Integrate theme system:
  - Apply theme on app load
  - Persist theme choice
  - Update all components to use theme variables

**Deliverables:**

- `contexts/ThemeContext.tsx`
- `hooks/useTheme.ts`
- `components/ThemeToggle.tsx`
- Updated CSS with theme variables
- Theme integration across app

**Total Phase 1 Duration: 4-6 days**

#### Phase 2: Backend Services (Week 2)

**Priority: HIGH** | **Dependencies: Phase 1**

##### 2.1 System Settings Service

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Create `SystemSettingsService`:

  - `getSetting(key, environment?)` - Get single setting
  - `getSettings(category?, environment?)` - Get multiple settings
  - `setSetting(key, value, userId, reason?)` - Update setting
  - `setSettings(settings, userId, reason?)` - Bulk update
  - `deleteSetting(key, userId)` - Delete setting
  - `getPublicSettings()` - Get public settings
  - `getSettingsHistory(key, limit?)` - Get setting history
  - `validateSetting(key, value)` - Validate setting value

- [ ] Setting validation:

  - Type validation (string, number, boolean, json)
  - Value validation (ranges, formats, enums)
  - Required fields validation

- [ ] Encryption for sensitive settings:

  - Encrypt passwords, API keys, tokens
  - Decrypt when retrieving

- [ ] Environment-specific settings:
  - Support dev/staging/production
  - Fallback to default if env-specific not found

**Deliverables:**

- `services/system-settings.service.ts`
- Setting validation logic
- Encryption/decryption utilities
- Unit tests

##### 2.2 User Preferences Service

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Create `UserPreferencesService`:

  - `getUserPreferences(userId)` - Get user preferences
  - `updatePreferences(userId, preferences)` - Update preferences
  - `updatePreference(userId, key, value)` - Update single preference
  - `resetPreferences(userId)` - Reset to defaults
  - `getDefaultPreferences(role?)` - Get default preferences by role

- [ ] Preference validation:

  - Validate theme values
  - Validate layout options
  - Validate notification preferences
  - Validate privacy settings

- [ ] Role-based defaults:
  - Different defaults for admin, organizer, attendee
  - Merge with user preferences

**Deliverables:**

- `services/user-preferences.service.ts`
- Preference validation
- Default preferences logic
- Unit tests

**Total Phase 2 Duration: 4-6 days**

#### Phase 3: API Endpoints (Week 2-3)

**Priority: HIGH** | **Dependencies: Phase 2**

##### 3.1 System Settings API

**Estimated Time: 2 days**

**Tasks:**

- [ ] Create `system-settings.routes.ts`:

  - `GET /api/v1/admin/settings` - Get all settings (ADMIN_STAFF+)
  - `GET /api/v1/admin/settings/:key` - Get single setting
  - `PUT /api/v1/admin/settings/:key` - Update setting
  - `PUT /api/v1/admin/settings` - Bulk update settings
  - `DELETE /api/v1/admin/settings/:key` - Delete setting
  - `GET /api/v1/admin/settings/:key/history` - Get setting history
  - `GET /api/v1/settings/public` - Get public settings (no auth)

- [ ] Validation middleware
- [ ] Permission checks (ADMIN_STAFF+ for admin settings)
- [ ] Controller implementation

##### 3.2 User Preferences API

**Estimated Time: 2 days**

**Tasks:**

- [ ] Create `user-preferences.routes.ts`:

  - `GET /api/v1/users/me/preferences` - Get current user preferences
  - `PUT /api/v1/users/me/preferences` - Update preferences
  - `PATCH /api/v1/users/me/preferences` - Partial update
  - `POST /api/v1/users/me/preferences/reset` - Reset to defaults
  - `GET /api/v1/users/:id/preferences` - Get user preferences (admin only)

- [ ] Validation middleware
- [ ] Permission checks (own preferences or admin)
- [ ] Controller implementation

**Total Phase 3 Duration: 4 days**

#### Phase 4: Frontend Implementation (Week 3-4)

**Priority: HIGH** | **Dependencies: Phase 3**

##### 4.1 Update Admin Settings Page

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Replace mock data with real API calls
- [ ] Implement settings loading
- [ ] Implement settings saving
- [ ] Add settings validation
- [ ] Add settings history view
- [ ] Add environment selector (if multi-env)
- [ ] Add encryption indicators for sensitive settings
- [ ] Add settings search/filter

##### 4.2 Update Organizer Settings Page

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Connect notification preferences to API
- [ ] Connect appearance preferences to API
- [ ] Connect security preferences to API
- [ ] Implement theme persistence
- [ ] Add real-time theme switching
- [ ] Add preference validation
- [ ] Add reset to defaults functionality

##### 4.3 Create Attendee Settings Page

**Estimated Time: 3-4 days**

**Tasks:**

- [ ] Create `UserSettingsPage.tsx`:

  - Profile settings (name, email, phone, bio, avatar)
  - Notification preferences
  - Appearance preferences (theme, layout)
  - Privacy settings
  - Account settings (password, 2FA, session)
  - Data & privacy (export data, delete account)

- [ ] Create settings components:

  - Profile form
  - Notification preferences form
  - Appearance preferences form
  - Privacy settings form
  - Account security form

- [ ] Integrate with API
- [ ] Add validation
- [ ] Add save/reset functionality

##### 4.4 Theme System Integration

**Estimated Time: 2-3 days**

**Tasks:**

- [ ] Integrate ThemeProvider in app root
- [ ] Add theme toggle to all layouts (admin, organizer, user)
- [ ] Update all components to use theme variables
- [ ] Test theme switching across all pages
- [ ] Add theme persistence
- [ ] Add system preference detection

##### 4.5 Settings Components

**Estimated Time: 2 days**

**Tasks:**

- [ ] Create reusable settings components:
  - `SettingsSection.tsx` - Settings section wrapper
  - `SettingsField.tsx` - Settings field wrapper
  - `ThemeSelector.tsx` - Theme selection component
  - `LanguageSelector.tsx` - Language selection
  - `TimezoneSelector.tsx` - Timezone selection
  - `DateFormatSelector.tsx` - Date format selection

**Total Phase 4 Duration: 11-15 days**

#### Phase 5: Advanced Features (Week 5)

**Priority: MEDIUM** | **Dependencies: Phase 4**

##### 5.1 Settings Import/Export

**Estimated Time: 2 days**

**Tasks:**

- [ ] Export settings to JSON
- [ ] Import settings from JSON
- [ ] Settings backup/restore
- [ ] Settings templates

##### 5.2 Settings Validation & Constraints

**Estimated Time: 2 days**

**Tasks:**

- [ ] Advanced validation rules
- [ ] Setting constraints (min/max, patterns)
- [ ] Dependent settings (if A then B)
- [ ] Settings warnings

##### 5.3 Settings Search & Filter

**Estimated Time: 1 day**

**Tasks:**

- [ ] Search settings by key/description
- [ ] Filter by category
- [ ] Filter by environment
- [ ] Quick settings access

##### 5.4 Settings Notifications

**Estimated Time: 1 day**

**Tasks:**

- [ ] Notify admins of critical setting changes
- [ ] Settings change confirmation
- [ ] Settings change history notifications

**Total Phase 5 Duration: 6 days**

### Settings Categories Reference

#### System Settings (Admin Only)

**General:**

- Site name, description, URL
- Timezone, language
- Date/time format
- Default currency

**Users:**

- Allow registration
- Require email verification
- Default user role
- Session timeout
- Password requirements

**Notifications:**

- Email notifications enabled
- SMS notifications enabled
- Push notifications enabled
- Notification email address

**Security:**

- Password min length
- Require special characters
- Two-factor authentication required
- Max login attempts
- Session security

**Appearance:**

- Default theme (light/dark/system)
- Primary color
- Logo URL
- Favicon URL
- Custom CSS

**Email:**

- SMTP host, port, username, password
- SMTP secure (SSL/TLS)
- From email, from name
- Email templates

**API:**

- API rate limit
- API key expiry
- Webhook URL
- API documentation URL

**Maintenance:**

- Maintenance mode
- Maintenance message
- Allowed IPs (bypass maintenance)

#### User Preferences (All Users)

**Appearance:**

- Theme (light/dark/system)
- Primary color (custom)
- Dashboard layout (compact/spacious)
- Show metrics cards
- Show charts
- Language
- Timezone
- Date format
- Time format

**Notifications:**

- Email notifications
- SMS notifications
- Push notifications
- In-app notifications
- Event reminders
- Event updates
- Registration notifications (organizers)
- Payment notifications (organizers)
- Marketing emails
- Weekly digest

**Privacy:**

- Profile visibility
- Show email
- Show phone
- Allow messages
- Show attendance history

**Account:**

- Session timeout
- Login alerts
- Two-factor authentication
- Password change

**Organizer-Specific:**

- Event notifications
- Registration notifications
- Payment notifications
- Marketing emails
- Weekly digest

**Attendee-Specific:**

- Event reminders
- Event updates
- Promotional offers
- New event notifications

### Implementation Timeline

**Total Duration: 5 weeks**

- **Week 1**: Database Schema & Theme System
- **Week 2**: Backend Services & API Endpoints
- **Week 3-4**: Frontend Implementation
- **Week 5**: Advanced Features

### Success Metrics

**User Experience:**

- ✅ Theme switching <1 second
- ✅ Settings save <2 seconds
- ✅ Settings load <1 second
- ✅ 95%+ user satisfaction with settings

**System Performance:**

- ✅ Settings API response <100ms
- ✅ Theme persistence 100% reliable
- ✅ Settings validation 100% accurate

**Feature Adoption:**

- ✅ 80%+ users customize theme
- ✅ 70%+ users configure notifications
- ✅ 60%+ users update profile settings

### Dependencies

**Required First:**

1. Database schema (Phase 1)
2. Theme system (Phase 1)
3. API endpoints (Phase 3)

**Can Be Parallel:**

- Frontend implementation
- Advanced features
- Settings components

### Notes

- **Theme system is critical** - Must work across all pages and persist
- **Settings must be role-based** - Different settings for admin/organizer/attendee
- **Settings history is important** - Audit trail for compliance
- **Validation is essential** - Prevent invalid settings
- **Encryption for sensitive data** - Passwords, API keys must be encrypted
- **Environment-specific settings** - Support dev/staging/production
- **User preferences should be optional** - Defaults should work well
- **Settings should be searchable** - Easy to find specific settings
- **Settings import/export** - Useful for backup and migration
- **Real-time theme switching** - No page reload required
