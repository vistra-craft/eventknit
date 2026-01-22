# EventKnit Server - Testing Quick Start Guide

Get started with testing the EventKnit server in under 30 minutes.

---

## Prerequisites

1. **Node.js and npm** installed
2. **Dependencies** installed: `npm install`
3. **Test database** configured in `.env.test`
4. **Jest** already configured in `package.json`

---

## Step 1: Verify Test Environment (5 minutes)

### Check existing test setup
```bash
# Run existing tests to verify setup
npm test

# Check test coverage
npm test -- --coverage
```

**Expected Output:** You should see 83 existing test files running. If you encounter errors, check:
- Database connection in `.env.test`
- Prisma schema is up to date: `npx prisma generate`
- All dependencies installed: `npm install`

---

## Step 2: Choose Your Starting Point (2 minutes)

Based on the testing plan, here are recommended starting points:

### Option A: Critical OAuth Services (Recommended for Security)
Start here if authentication is a priority.

**First Test:** `tests/unit/services/oauth/google-auth.service.test.ts`

### Option B: Financial Services (Recommended for Revenue)
Start here if payment features are a priority.

**First Test:** `tests/unit/services/payout-management.service.test.ts`

### Option C: Ticket Features (Recommended for Core Functionality)
Start here if ticketing features are a priority.

**First Test:** `tests/unit/services/ticket-transfer.service.test.ts`

---

## Step 3: Create Your First Test File (10 minutes)

Let's create the Google OAuth service test as an example.

### 3.1: Create the test file

```bash
mkdir -p tests/unit/services/oauth
touch tests/unit/services/oauth/google-auth.service.test.ts
```

### 3.2: Copy the template

Open `TEST_TEMPLATES.md` and copy the "Service Test Template" into your new file.

### 3.3: Customize for Google OAuth

```typescript
// tests/unit/services/oauth/google-auth.service.test.ts

import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { GoogleAuthService } from '../../../../src/services/oauth/google-auth.service.js';
import { AppError } from '../../../../src/utils/errors.js';
import { OAuth2Client } from 'google-auth-library';

// Mock Prisma
jest.mock('../../../../src/config/database.js', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

// Mock Google OAuth2Client
jest.mock('google-auth-library');

describe('GoogleAuthService', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let googleAuthService: GoogleAuthService;
  let mockOAuth2Client: jest.Mocked<OAuth2Client>;

  beforeAll(() => {
    prisma = require('../../../../src/config/database.js').default;
  });

  beforeEach(() => {
    mockReset(prisma);
    jest.clearAllMocks();

    mockOAuth2Client = {
      verifyIdToken: jest.fn(),
    } as any;

    (OAuth2Client as jest.MockedClass<typeof OAuth2Client>).mockImplementation(
      () => mockOAuth2Client
    );

    googleAuthService = new GoogleAuthService();
  });

  describe('verifyGoogleToken', () => {
    it('should verify valid Google ID token successfully', async () => {
      // Arrange
      const mockIdToken = 'valid-google-id-token';
      const mockPayload = {
        sub: 'google-user-123',
        email: 'user@gmail.com',
        email_verified: true,
        name: 'Test User',
        picture: 'https://example.com/photo.jpg',
      };

      mockOAuth2Client.verifyIdToken.mockResolvedValue({
        getPayload: () => mockPayload,
      } as any);

      // Act
      const result = await googleAuthService.verifyGoogleToken(mockIdToken);

      // Assert
      expect(result).toEqual({
        googleId: 'google-user-123',
        email: 'user@gmail.com',
        emailVerified: true,
        name: 'Test User',
        picture: 'https://example.com/photo.jpg',
      });

      expect(mockOAuth2Client.verifyIdToken).toHaveBeenCalledWith({
        idToken: mockIdToken,
        audience: expect.any(String),
      });
    });

    it('should throw error for invalid token', async () => {
      // Arrange
      const mockInvalidToken = 'invalid-token';

      mockOAuth2Client.verifyIdToken.mockRejectedValue(
        new Error('Invalid token')
      );

      // Act & Assert
      await expect(
        googleAuthService.verifyGoogleToken(mockInvalidToken)
      ).rejects.toThrow(AppError);

      await expect(
        googleAuthService.verifyGoogleToken(mockInvalidToken)
      ).rejects.toThrow('Invalid Google token');
    });

    it('should throw error for unverified email', async () => {
      // Arrange
      const mockIdToken = 'valid-token-unverified-email';
      const mockPayload = {
        sub: 'google-user-123',
        email: 'user@gmail.com',
        email_verified: false,
        name: 'Test User',
      };

      mockOAuth2Client.verifyIdToken.mockResolvedValue({
        getPayload: () => mockPayload,
      } as any);

      // Act & Assert
      await expect(
        googleAuthService.verifyGoogleToken(mockIdToken)
      ).rejects.toThrow(AppError);

      await expect(
        googleAuthService.verifyGoogleToken(mockIdToken)
      ).rejects.toThrow('Email not verified');
    });

    it('should handle missing email in payload', async () => {
      // Arrange
      const mockIdToken = 'valid-token-no-email';
      const mockPayload = {
        sub: 'google-user-123',
        name: 'Test User',
      };

      mockOAuth2Client.verifyIdToken.mockResolvedValue({
        getPayload: () => mockPayload,
      } as any);

      // Act & Assert
      await expect(
        googleAuthService.verifyGoogleToken(mockIdToken)
      ).rejects.toThrow(AppError);
    });
  });

  describe('authenticateWithGoogle', () => {
    it('should create new user for first-time Google login', async () => {
      // Arrange
      const mockIdToken = 'valid-google-id-token';
      const mockPayload = {
        sub: 'google-user-123',
        email: 'newuser@gmail.com',
        email_verified: true,
        given_name: 'New',
        family_name: 'User',
        picture: 'https://example.com/photo.jpg',
      };

      mockOAuth2Client.verifyIdToken.mockResolvedValue({
        getPayload: () => mockPayload,
      } as any);

      // User doesn't exist
      prisma.user.findUnique.mockResolvedValue(null);

      // Create new user
      const mockNewUser = {
        id: 'user-new-123',
        email: 'newuser@gmail.com',
        firstName: 'New',
        lastName: 'User',
        googleId: 'google-user-123',
        profilePicture: 'https://example.com/photo.jpg',
        isVerified: true,
        role: 'ATTENDEE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.create.mockResolvedValue(mockNewUser as any);

      // Act
      const result = await googleAuthService.authenticateWithGoogle(mockIdToken);

      // Assert
      expect(result.user).toEqual(mockNewUser);
      expect(result.isNewUser).toBe(true);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'newuser@gmail.com',
          googleId: 'google-user-123',
          firstName: 'New',
          lastName: 'User',
          isVerified: true,
          role: 'ATTENDEE',
        }),
      });
    });

    it('should login existing user with Google account', async () => {
      // Arrange
      const mockIdToken = 'valid-google-id-token';
      const mockPayload = {
        sub: 'google-user-123',
        email: 'existing@gmail.com',
        email_verified: true,
        name: 'Existing User',
      };

      mockOAuth2Client.verifyIdToken.mockResolvedValue({
        getPayload: () => mockPayload,
      } as any);

      const mockExistingUser = {
        id: 'user-existing-123',
        email: 'existing@gmail.com',
        googleId: 'google-user-123',
        firstName: 'Existing',
        lastName: 'User',
        role: 'ATTENDEE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(mockExistingUser as any);

      // Act
      const result = await googleAuthService.authenticateWithGoogle(mockIdToken);

      // Assert
      expect(result.user).toEqual(mockExistingUser);
      expect(result.isNewUser).toBe(false);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should link Google account to existing email user', async () => {
      // Arrange
      const mockIdToken = 'valid-google-id-token';
      const mockPayload = {
        sub: 'google-user-new-123',
        email: 'existing@gmail.com',
        email_verified: true,
        name: 'Existing User',
      };

      mockOAuth2Client.verifyIdToken.mockResolvedValue({
        getPayload: () => mockPayload,
      } as any);

      // User exists but doesn't have googleId
      const mockExistingUser = {
        id: 'user-existing-123',
        email: 'existing@gmail.com',
        googleId: null,
        firstName: 'Existing',
        lastName: 'User',
        role: 'ATTENDEE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(mockExistingUser as any);

      const mockUpdatedUser = {
        ...mockExistingUser,
        googleId: 'google-user-new-123',
      };

      prisma.user.update.mockResolvedValue(mockUpdatedUser as any);

      // Act
      const result = await googleAuthService.authenticateWithGoogle(mockIdToken);

      // Assert
      expect(result.user.googleId).toBe('google-user-new-123');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-existing-123' },
        data: { googleId: 'google-user-new-123' },
      });
    });
  });

  describe('refreshGoogleToken', () => {
    it('should refresh Google access token', async () => {
      // Arrange
      const mockRefreshToken = 'valid-refresh-token';
      const mockNewTokens = {
        access_token: 'new-access-token',
        expires_in: 3600,
      };

      mockOAuth2Client.refreshAccessToken = jest.fn().mockResolvedValue({
        credentials: mockNewTokens,
      } as any);

      // Act
      const result = await googleAuthService.refreshGoogleToken(mockRefreshToken);

      // Assert
      expect(result).toEqual({
        accessToken: 'new-access-token',
        expiresIn: 3600,
      });
    });

    it('should throw error for invalid refresh token', async () => {
      // Arrange
      const mockInvalidRefreshToken = 'invalid-refresh-token';

      mockOAuth2Client.refreshAccessToken = jest
        .fn()
        .mockRejectedValue(new Error('Invalid refresh token'));

      // Act & Assert
      await expect(
        googleAuthService.refreshGoogleToken(mockInvalidRefreshToken)
      ).rejects.toThrow(AppError);
    });
  });
});
```

### 3.4: Run your new test

```bash
npm test -- google-auth.service.test.ts
```

**Expected Output:** Your test should run (may fail if service doesn't exist yet, which is expected in TDD).

---

## Step 4: Follow TDD Cycle (Repeat)

### Test-Driven Development Flow

1. **Write the test first** (Red phase)
   ```bash
   npm test -- google-auth.service.test.ts
   ```
   Test should fail ❌

2. **Implement the minimum code** to make it pass (Green phase)
   - Create/update the service file
   - Implement just enough to pass the test

3. **Run the test again**
   ```bash
   npm test -- google-auth.service.test.ts
   ```
   Test should pass ✅

4. **Refactor if needed** (Refactor phase)
   - Clean up code
   - Remove duplication
   - Improve naming

5. **Repeat** for next test case

---

## Step 5: Track Your Progress (Ongoing)

Update `TEST_PROGRESS.md` as you complete tests:

```markdown
### OAuth Authentication Services
- [x] `tests/unit/services/oauth/google-auth.service.test.ts` ← Mark complete
- [ ] `tests/unit/services/oauth/apple-auth.service.test.ts`
- [ ] `tests/unit/services/oauth/facebook-auth.service.test.ts`
```

---

## Common Testing Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test -- google-auth.service.test.ts

# Run tests in watch mode (auto-rerun on changes)
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage

# Run only tests matching a pattern
npm test -- --testNamePattern="should verify valid"

# Run tests for specific directory
npm test -- tests/unit/services/oauth/

# Run tests in verbose mode (detailed output)
npm test -- --verbose

# Run tests with debugging
node --inspect-brk node_modules/.bin/jest --runInBand

# Update snapshots (if using snapshot testing)
npm test -- --updateSnapshot
```

---

## Troubleshooting

### Problem: Tests fail with "Cannot find module"

**Solution:**
```bash
# Regenerate Prisma client
npx prisma generate

# Clear Jest cache
npx jest --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Problem: Database connection errors

**Solution:**
1. Check `.env.test` file exists
2. Verify `DATABASE_URL` is set correctly
3. Run migrations on test database:
   ```bash
   npx dotenv -e .env.test -- npx prisma migrate deploy
   ```

### Problem: Mock errors with Prisma

**Solution:**
Ensure you have `jest-mock-extended` installed:
```bash
npm install --save-dev jest-mock-extended
```

### Problem: TypeScript errors in tests

**Solution:**
1. Check `tsconfig.json` includes test files
2. Install missing type definitions:
   ```bash
   npm install --save-dev @types/jest @types/node
   ```

### Problem: Tests are too slow

**Solution:**
```bash
# Run tests in parallel (default)
npm test -- --maxWorkers=4

# Run specific test file instead of all
npm test -- google-auth.service.test.ts
```

---

## Daily Testing Workflow

### Morning (30 minutes)
1. Pull latest changes: `git pull`
2. Run all tests: `npm test`
3. Review test coverage: `npm test -- --coverage`
4. Choose 1-2 test files from `TEST_PROGRESS.md`

### During Development (Throughout day)
1. Write test for new feature
2. Implement feature
3. Run test: `npm test -- <filename>`
4. Refactor and ensure test still passes

### Evening (15 minutes)
1. Run all tests: `npm test`
2. Update `TEST_PROGRESS.md`
3. Commit completed tests:
   ```bash
   git add tests/
   git commit -m "test: add Google OAuth service tests"
   ```

---

## Next Steps After First Test

Once you complete your first test file, continue with:

1. **Week 1 Focus:** Complete all OAuth service tests
   - Google Auth ✅ (Just completed!)
   - Apple Auth (next)
   - Facebook Auth
   - OAuth Controller

2. **Week 2 Focus:** Financial services
   - Payout management
   - Platform finance

3. **Week 3 Focus:** Ticket features
   - Ticket transfer
   - Ticket resale
   - Digital wallet

Refer to `TESTING_PLAN.md` for the complete roadmap.

---

## Quick Reference: Test File Locations

```
eventknit/server/
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   │   ├── oauth/               ← OAuth tests here
│   │   │   ├── ticket-transfer.service.test.ts
│   │   │   ├── ticket-resale.service.test.ts
│   │   │   └── ...
│   │   ├── controllers/
│   │   │   └── ...
│   │   └── jobs/
│   │       └── ...
│   ├── integration/
│   │   └── ...
│   └── helpers/
│       ├── mocks.ts                 ← Reusable mocks
│       └── factories.ts             ← Test data factories
├── TESTING_PLAN.md                  ← Overall strategy
├── TEST_PROGRESS.md                 ← Track completion
├── TEST_TEMPLATES.md                ← Copy-paste templates
└── TEST_QUICK_START.md             ← This file
```

---

## Success Metrics

After 1 week, you should have:
- ✅ 4-5 new test files created
- ✅ OAuth authentication fully tested
- ✅ Test coverage increased by 5-10%
- ✅ Confidence in your testing workflow

After 1 month, you should have:
- ✅ 20+ new test files created
- ✅ All Phase 1 critical gaps covered
- ✅ Test coverage >70%
- ✅ Automated testing in CI/CD

---

## Getting Help

If you get stuck:
1. Check `TEST_TEMPLATES.md` for examples
2. Look at existing test files for patterns
3. Review Jest documentation: https://jestjs.io/docs/getting-started
4. Check Prisma testing guide: https://www.prisma.io/docs/guides/testing

---

**Ready to start? Create your first test file now!**

```bash
mkdir -p tests/unit/services/oauth
touch tests/unit/services/oauth/google-auth.service.test.ts
code tests/unit/services/oauth/google-auth.service.test.ts
```

Good luck! 🚀
