# Event Service Test Coverage Summary

## Overview

This document summarizes the test coverage for the EventService and related endpoints.

## Test Files

### 1. `event.test.ts`

**Coverage:**

- ✅ `createEvent` - Create free/paid events, validation, authentication
- ✅ `getEvents` - Get all events, filtering by status
- ✅ `registerForEvent` - Register for free/paid events
- ✅ `registerAsGuest` - Guest registration with account creation
- ✅ `approveEvent` - Admin approval of events
- ✅ `rejectEvent` - Admin rejection of events
- ✅ `getUserRegisteredEvents` - Get user's registered events

### 2. `organizer-data-access.test.ts`

**Coverage:**

- ✅ `updateOrganizerDataAccess` - Single event data access update
- ✅ `bulkUpdateOrganizerDataAccess` - Bulk data access update
- ✅ `getEventRegistrations` - Data filtering based on access level (RESTRICTED, STANDARD, FULL)
- ✅ Admin vs Organizer data visibility (transaction IDs hidden from organizers)

### 3. `event-service-comprehensive.test.ts` (NEW)

**Coverage:**

- ✅ `getEventById` - Get event by ID, include organizer info, registration count
- ✅ `updateEvent` - Update event fields, ownership validation, status reset on update
- ✅ `deleteEvent` - Soft delete, ownership validation, audit logging
- ✅ `cancelRegistration` - Cancel registration, update available slots, ownership validation
- ✅ `getEventRegistrations` - Edge cases (empty results, ownership, admin access)

## Service Methods Coverage

| Method                          | Status            | Test File                                                          |
| ------------------------------- | ----------------- | ------------------------------------------------------------------ |
| `createEvent`                   | ✅ Covered        | event.test.ts                                                      |
| `getEvents`                     | ✅ Covered        | event.test.ts                                                      |
| `getEventById`                  | ✅ Covered        | event-service-comprehensive.test.ts                                |
| `updateEvent`                   | ✅ Covered        | event-service-comprehensive.test.ts                                |
| `deleteEvent`                   | ✅ Covered        | event-service-comprehensive.test.ts                                |
| `registerForEvent`              | ✅ Covered        | event.test.ts                                                      |
| `approveEvent`                  | ✅ Covered        | event.test.ts                                                      |
| `rejectEvent`                   | ✅ Covered        | event.test.ts                                                      |
| `updateOrganizerDataAccess`     | ✅ Covered        | organizer-data-access.test.ts                                      |
| `bulkUpdateOrganizerDataAccess` | ✅ Covered        | organizer-data-access.test.ts                                      |
| `getEventRegistrations`         | ✅ Covered        | organizer-data-access.test.ts, event-service-comprehensive.test.ts |
| `cancelRegistration`            | ✅ Covered        | event-service-comprehensive.test.ts                                |
| `getUserRegisteredEvents`       | ✅ Covered        | event.test.ts                                                      |
| `registerViaInvitation`         | ⚠️ Separate Route | invitation.routes.ts (should be in invitation tests)               |
| `registerAsGuest`               | ✅ Covered        | event.test.ts                                                      |

## Test Scenarios Covered

### Authentication & Authorization

- ✅ Unauthenticated requests (401)
- ✅ Unauthorized access (403)
- ✅ Role-based access control (ORGANIZER, ADMIN, ATTENDEE)
- ✅ Ownership validation (organizers can only modify their own events)

### Data Validation

- ✅ Required fields validation
- ✅ Invalid data formats
- ✅ Business rules (e.g., identity verification for paid events)
- ✅ Capacity and available slots management

### Edge Cases

- ✅ Non-existent resources (404)
- ✅ Deleted/soft-deleted resources
- ✅ Already cancelled registrations
- ✅ Events with no registrations
- ✅ Capacity updates with existing registrations

### Audit & Logging

- ✅ Audit log creation for:
  - Event creation
  - Event updates
  - Event deletion
  - Event approval/rejection
  - Registration cancellation
  - Data access level changes

### Data Access Control

- ✅ RESTRICTED access level (summary only)
- ✅ STANDARD access level (attendees + payment summaries, no transaction IDs)
- ✅ FULL access level (all details except transaction IDs)
- ✅ Admin always sees everything including transaction IDs
- ✅ Organizers never see transaction IDs

## Running Tests

```bash
# Run all event tests
npm test -- event.test.ts organizer-data-access.test.ts event-service-comprehensive.test.ts

# Run specific test file
npm test -- event-service-comprehensive.test.ts

# Run with coverage
npm test -- --coverage
```

## Notes

1. **registerViaInvitation**: This method is part of the invitation service routes (`invitation.routes.ts`) and should be tested in invitation-specific test files.

2. **Integration vs Unit Tests**: All tests are integration tests that use a real database connection. They test the full request/response cycle through the Express app.

3. **Test Database**: Tests require a test database connection. If the database is not available, tests are skipped with a warning.

4. **Test Isolation**: Each test runs in a `beforeEach` hook that clears all relevant tables to ensure test isolation.

## Coverage Gaps (if any)

Currently, all EventService methods that are exposed through event routes are covered. The only method not covered in event tests is `registerViaInvitation`, which belongs to the invitation service domain.

