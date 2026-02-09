# Testing Guide

This document covers how to write, run, and maintain tests for the EventKnit server. It serves as both a practical reference and a set of standards for test quality.

---

## Table of Contents

1. [Test Architecture](#1-test-architecture)
2. [Running Tests](#2-running-tests)
3. [Architecture Rules](#3-architecture-rules)
4. [Software Engineering Principles](#4-software-engineering-principles)
5. [Writing Tests](#5-writing-tests)
6. [Mocking Patterns](#6-mocking-patterns)
7. [Debugging Test Failures](#7-debugging-test-failures)
8. [Common Pitfalls](#8-common-pitfalls)

---

## 1. Test Architecture

### Directory Structure

```
eventknit/server/
├── tests/
│   ├── setup.ts                 # Global setup (NODE_ENV, timeouts)
│   ├── teardown.ts              # Global teardown
│   ├── test-helpers.ts          # Shared utilities
│   ├── unit/
│   │   ├── services/            # Service unit tests (23 files)
│   │   ├── controllers/         # Controller unit tests (2 files)
│   │   ├── jobs/                # Background job tests (8 files)
│   │   └── utils/               # Utility function tests
│   ├── *.test.ts                # Root-level integration/mixed tests (78 files)
│   └── white-label.service.test.ts  # Service tests using root mock pattern
├── jest.config.cjs              # Jest configuration
```

### Test Types

| Type | Location | Purpose | Speed |
|------|----------|---------|-------|
| **Unit tests** | `tests/unit/services/` | Test service logic in isolation with mocked dependencies | Fast (ms) |
| **Controller tests** | `tests/unit/controllers/` | Test request handling, parameter extraction, response shaping | Fast (ms) |
| **Job tests** | `tests/unit/jobs/` | Test background job execution, scheduling, error handling | Fast (ms) |
| **Integration tests** | `tests/*.test.ts` | Test full API flow with supertest + Express app | Slower |

### Jest Configuration

Key settings in `jest.config.cjs`:
- **ESM support**: `ts-jest` with ESM preset, `.js` extension mapping
- **Sequential execution**: `maxWorkers: 1` to avoid database race conditions
- **Timeout**: 120 seconds per test
- **Force exit**: Prevents hanging from open handles

---

## 2. Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx jest tests/white-label.service.test.ts --no-coverage

# Run all unit service tests
npx jest tests/unit/services/ --no-coverage

# Run all job tests
npx jest tests/unit/jobs/ --no-coverage

# Run tests matching a pattern
npx jest --testNamePattern="should create" --no-coverage

# Run with coverage
npm run test:coverage

# Watch mode (re-runs on file changes)
npm run test:watch

# Lightweight runner (CI-friendly)
npm run test:run
```

---

## 3. Architecture Rules

These rules keep the codebase testable, maintainable, and consistent.

### 3.1 Keep Business Logic in Services, Not Controllers

Controllers are thin — they extract request data, call the service, and return the response. All validation, authorization logic, data transformation, and business rules belong in the service layer.

**Why**: Services are easy to unit test with mocked dependencies. Controllers coupled to Express `req`/`res` objects are harder to test and create tight coupling.

```typescript
// BAD: Business logic in controller
static async adminUpsertBranding(req, res) {
  const userRole = req.user?.role;
  if (userRole !== UserRole.SUPERADMIN && userRole !== UserRole.ADMIN_STAFF) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  // ... more logic
}

// GOOD: Controller delegates to service, auth handled by middleware
static async adminUpsertBranding(req, res) {
  const adminId = req.user!.id;
  const organizerId = req.params.organizerId as string;
  const branding = await WhiteLabelService.adminUpsertBranding(
    organizerId, req.body, adminId
  );
  res.json(branding);
}
```

Role-checking belongs in route middleware (`requireMinRole`), not in every controller method.

### 3.2 Keep Authorization in Middleware, Not Controllers

The admin router applies `requireMinRole(UserRole.ADMIN_STAFF)` globally. Individual routes can override with stricter requirements:

```typescript
// GOOD: Route-level auth
router.get('/settings', requireMinRole(UserRole.SUPERADMIN), Controller.getSettings);

// BAD: Duplicating role checks in every controller method
```

### 3.3 Services Should Throw Typed Errors

Use the project's error classes (`ValidationError`, `NotFoundError`, `AuthorizationError`) instead of generic `Error`. This enables:
- Consistent HTTP status codes in error middleware
- Meaningful error messages in API responses
- Testable error conditions

```typescript
// GOOD
throw new NotFoundError('Branding not found');
throw new ValidationError('Invalid color format');

// BAD
throw new Error('Not found');
res.status(404).json({ error: 'Not found' }); // in service
```

### 3.4 Extract Shared Validation

When multiple methods need the same validation, extract it into a private method:

```typescript
// GOOD: Shared validation
private static validateBrandingData(data: CreateBrandingData): void {
  // Color format validation
  // Email format validation
  // URL format validation
}

static async upsertBranding(organizerId: string, data: CreateBrandingData) {
  this.validateBrandingData(data);
  // ...
}

static async adminUpsertBranding(organizerId: string, data: CreateBrandingData, adminId: string) {
  this.validateBrandingData(data);
  // ...
}
```

---

## 4. Software Engineering Principles

### 4.1 SOLID Principles

**Single Responsibility**: Each service handles one domain. `WhiteLabelService` handles branding, not payments.

**Open/Closed**: Extend behavior through new methods, not modifying existing ones. When adding admin branding, we added `adminUpsertBranding` rather than adding admin-mode flags to `upsertBranding`.

**Liskov Substitution**: Error subclasses (`ValidationError`, `NotFoundError`) work wherever `AppError` is expected.

**Interface Segregation**: Services expose only the methods their consumers need. Admin endpoints call admin-specific service methods.

**Dependency Inversion**: Services depend on Prisma's abstract client, not on specific database implementations. Tests mock the Prisma client.

### 4.2 DRY (Don't Repeat Yourself)

- Extract shared validation into reusable methods
- Use test factories for common test data shapes
- Share mock setup in `beforeEach` blocks
- Reuse error classes instead of inline error handling

**In tests**: If you copy-paste mock setup across multiple `describe` blocks, extract it into a shared helper or `beforeEach`.

### 4.3 ACID for Data Operations

When testing service methods that modify data:
- **Atomicity**: Test that partial failures don't leave dirty state (e.g., if domain creation fails after unsetting primary, the old primary should still be set)
- **Consistency**: Test that validation rules are always enforced (e.g., hex colors, valid emails)
- **Isolation**: Each test resets mocks with `mockReset()` — no test depends on another's state
- **Durability**: Test that the service calls `prisma.update`/`prisma.create` with the correct data (verifying the write happened)

### 4.4 Separation of Concerns

| Layer | Responsibility | What to Test |
|-------|---------------|--------------|
| **Route** | Path mapping, middleware chain, validation schemas | Integration tests |
| **Middleware** | Auth, rate limiting, role checking | Middleware-specific tests |
| **Controller** | Extract params, call service, format response | Controller unit tests |
| **Service** | Business logic, validation, data access | Service unit tests |
| **Model (Prisma)** | Schema, relations, constraints | Schema validation tests |

### 4.5 Fail Fast

Services should validate inputs at the start and throw immediately:

```typescript
static async adminUpsertBranding(organizerId: string, data: CreateBrandingData, adminId: string) {
  // Validate early
  this.validateBrandingData(data);

  // Check dependencies exist
  const organizer = await prisma.user.findUnique({ where: { id: organizerId } });
  if (!organizer) throw new NotFoundError('Organizer not found');

  // Proceed with business logic only after all preconditions pass
  return prisma.whiteLabelBranding.upsert({ ... });
}
```

---

## 5. Writing Tests

### 5.1 AAA Pattern (Arrange, Act, Assert)

Every test follows this structure:

```typescript
it('should create branding with ACTIVE status for admin', async () => {
  // Arrange — set up mocks and test data
  const mockOrganizer = { id: 'org-1', role: 'ORGANIZER' };
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockOrganizer);
  (prisma.whiteLabelBranding.upsert as jest.Mock).mockResolvedValue({
    id: 'brand-1',
    status: 'ACTIVE',
    isActive: true,
  });

  // Act — call the method under test
  const result = await WhiteLabelService.adminUpsertBranding('org-1', brandingData, 'admin-1');

  // Assert — verify the outcome
  expect(result.status).toBe('ACTIVE');
  expect(result.isActive).toBe(true);
  expect(prisma.whiteLabelBranding.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      create: expect.objectContaining({ status: 'ACTIVE' }),
    })
  );
});
```

### 5.2 Test Naming

Use descriptive names that describe behavior, not implementation:

```typescript
// GOOD — describes behavior
'should reject branding with invalid hex color'
'should auto-approve branding when created by admin'
'should throw NotFoundError when organizer does not exist'

// BAD — describes implementation
'test upsert method'
'should call prisma.update'
'test 1'
```

### 5.3 What to Test

For each service method, test:

1. **Happy path**: Normal successful execution
2. **Validation errors**: Invalid inputs rejected with correct error type
3. **Not found**: Missing records throw `NotFoundError`
4. **Authorization**: Cross-organizer access denied
5. **Edge cases**: Empty inputs, null values, boundary conditions
6. **Side effects**: Verify the right Prisma methods were called with correct arguments

### 5.4 Test Independence

Each test must be able to run in isolation:

```typescript
beforeEach(() => {
  jest.clearAllMocks();    // Clear call history
  // Or if using jest-mock-extended:
  mockReset(prisma);       // Reset all mock implementations
});
```

Never rely on test execution order. Never share mutable state between tests.

### 5.5 Test Real Behavior

Write tests that validate real behavior, not tests that just pass. When a test fails:

1. Read the **test file** to understand what behavior is expected
2. Read the **implementation file** to understand what actually happens
3. Determine which is wrong — the test expectation or the implementation
4. Fix the root cause, not the symptom

```typescript
// BAD: Test written to match broken implementation
it('should return undefined', async () => {
  const result = await service.getBranding('org-1');
  expect(result).toBeUndefined(); // Is this really correct behavior?
});

// GOOD: Test asserts correct business behavior
it('should create default branding when none exists', async () => {
  prisma.whiteLabelBranding.findUnique.mockResolvedValue(null);
  prisma.whiteLabelBranding.create.mockResolvedValue(defaultBranding);

  const result = await service.getOrCreateBranding('org-1');

  expect(result).toEqual(defaultBranding);
  expect(prisma.whiteLabelBranding.create).toHaveBeenCalledTimes(1);
});
```

---

## 6. Mocking Patterns

### 6.1 Prisma Mocking (jest-mock-extended)

Used in `tests/unit/services/`:

```typescript
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

jest.mock('../../../src/config/database.js', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

let prisma: DeepMockProxy<PrismaClient>;

beforeAll(() => {
  prisma = require('../../../src/config/database.js').default;
});

beforeEach(() => {
  mockReset(prisma);
});
```

### 6.2 Prisma Mocking (jest.fn)

Used in `tests/` root-level tests (simpler pattern):

```typescript
jest.mock('../src/config/database.js', () => ({
  __esModule: true,
  default: {
    whiteLabelBranding: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    customDomain: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));
```

### 6.3 Service Mocking

When testing controllers:

```typescript
jest.mock('../../../src/services/white-label.service.js', () => ({
  WhiteLabelService: {
    getAllBrandings: jest.fn(),
    adminUpsertBranding: jest.fn(),
    // ... only mock methods actually called
  },
}));
```

### 6.4 Module Mocking (Logger, Config, Email)

```typescript
// Logger — suppress console output in tests
jest.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Config
jest.mock('../../../src/config/index.js', () => ({
  config: {
    jwt: { expiresIn: '1h' },
    security: { maxLoginAttempts: 5, lockoutDuration: 15 },
  },
}));

// Email service
jest.mock('../../../src/services/email.service.js', () => ({
  emailService: {
    sendVerificationCode: jest.fn(),
    sendWelcomeEmail: jest.fn(),
  },
}));
```

---

## 7. Debugging Test Failures

### Step-by-Step Process

When a test fails, follow this process:

1. **Read the error message** — Jest shows the expected vs received values
2. **Read the test** — Understand what behavior is being asserted
3. **Read the implementation** — Trace the code path that produces the result
4. **Identify the mismatch** — Is the test wrong, or is the implementation wrong?
5. **Fix the root cause** — Don't adjust tests just to make them pass

### Common Failure Patterns

**Mock not returning expected data:**
```
Expected: { status: 'ACTIVE' }
Received: undefined
```
Fix: Check that the mock is set up before the method call, and the mock path matches the actual import.

**Wrong error type thrown:**
```
Expected: ValidationError
Received: Error
```
Fix: The service likely throws a generic `Error` instead of the project's typed error classes. Fix the service.

**Method called with wrong arguments:**
```
expect(prisma.update).toHaveBeenCalledWith({ where: { id: 'brand-1' } })
Received: { where: { id: 'brand-1', organizerId: 'org-1' } }
```
Fix: The service adds ownership scoping. Update the test to match the actual behavior (which is correct — ownership scoping is a feature, not a bug).

### Running a Single Failing Test

```bash
# Run only the failing test
npx jest tests/white-label.service.test.ts -t "should create branding" --no-coverage

# Run with verbose output
npx jest tests/white-label.service.test.ts --verbose --no-coverage
```

---

## 8. Common Pitfalls

### Pitfall 1: Writing Tests to Pass, Not to Validate

If a test fails, the instinct is to change the test. Resist this. Always check the implementation first. The test might be catching a real bug.

### Pitfall 2: Testing Implementation, Not Behavior

```typescript
// BAD: Tests implementation details
expect(prisma.whiteLabelBranding.upsert).toHaveBeenCalledTimes(1);

// GOOD: Tests behavior (outcome)
expect(result.status).toBe('ACTIVE');
expect(result.approvedBy).toBe('admin-1');
```

Verify Prisma calls only when the **what** matters (e.g., confirming the service actually writes to the database, or checking the exact `where` clause for ownership scoping).

### Pitfall 3: Forgetting to Reset Mocks

```typescript
// Without this, mock state leaks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

If test A sets `prisma.user.findUnique.mockResolvedValue(user)` and test B doesn't reset it, test B inherits test A's mock.

### Pitfall 4: Hardcoding Dates

```typescript
// BAD: Brittle — fails on different days
expect(result.approvedAt).toEqual(new Date('2026-02-09'));

// GOOD: Check it's a date, or check it's recent
expect(result.approvedAt).toBeInstanceOf(Date);
// Or use expect.any(Date) in object matchers
expect(prisma.upsert).toHaveBeenCalledWith(
  expect.objectContaining({
    create: expect.objectContaining({
      approvedAt: expect.any(Date),
    }),
  })
);
```

### Pitfall 5: Overly Broad Assertions

```typescript
// BAD: Passes even if the response contains garbage
expect(result).toBeDefined();

// GOOD: Checks the actual shape and values
expect(result).toEqual(expect.objectContaining({
  id: 'brand-1',
  status: 'ACTIVE',
  isActive: true,
}));
```

### Pitfall 6: Not Testing Error Paths

Every service method that can throw should have tests for each error condition:

```typescript
describe('adminUpsertBranding', () => {
  it('should create branding successfully', async () => { /* ... */ });
  it('should throw NotFoundError when organizer does not exist', async () => { /* ... */ });
  it('should throw ValidationError for invalid hex color', async () => { /* ... */ });
  it('should throw ValidationError for invalid email format', async () => { /* ... */ });
});
```

### Pitfall 7: Ignoring ESM Import Paths

Jest config maps `.js` to `.ts` for ESM. Always use `.js` extensions in mock paths:

```typescript
// GOOD
jest.mock('../../../src/config/database.js', () => ({ ... }));

// BAD — will fail to mock
jest.mock('../../../src/config/database', () => ({ ... }));
jest.mock('../../../src/config/database.ts', () => ({ ... }));
```
