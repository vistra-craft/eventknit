import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../src/config/database.js';
import { UserPreferencesService } from '../src/services/user-preferences.service.js';
import { ValidationError, NotFoundError } from '../src/utils/errors.js';
import { UserRole } from '@prisma/client';
import { logger } from '../src/utils/logger.js';

describe('UserPreferencesService', () => {
  let dbConnected = false;
  let testUserId: string;
  let testOrganizerId: string;
  let testAttendeeId: string;

  beforeAll(async () => {
    // Try to connect to the test database
    try {
      await prisma.$connect();
      // Verify connection with a simple query
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      logger.info('✅ Test database connected');
    } catch (error) {
      logger.warn('⚠️  Database not available. Tests will be skipped.');
      logger.warn(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      logger.warn('   Start PostgreSQL with: docker compose --env-file .env.development up -d postgres');
      dbConnected = false;
    }
  });

  afterAll(async () => {
    // Close database connection if it was connected
    if (dbConnected) {
      try {
        await prisma.$disconnect();
      } catch {
        // Ignore disconnection errors
      }
    }
  });

  beforeEach(async () => {
    // Skip setup if database is not connected
    if (!dbConnected) return;
    
    // Create test users with different roles
    const testUser = await prisma.user.create({
      data: {
        email: `test-user-${Date.now()}@example.com`,
        role: UserRole.ADMIN,
      },
    });
    testUserId = testUser.id;

    const testOrganizer = await prisma.user.create({
      data: {
        email: `test-organizer-${Date.now()}@example.com`,
        role: UserRole.ORGANIZER,
        organizationName: 'Test Org',
      },
    });
    testOrganizerId = testOrganizer.id;

    const testAttendee = await prisma.user.create({
      data: {
        email: `test-attendee-${Date.now()}@example.com`,
        role: UserRole.ATTENDEE,
      },
    });
    testAttendeeId = testAttendee.id;
  });

  afterEach(async () => {
    // Skip cleanup if database is not connected
    if (!dbConnected) return;
    
    // Clean up preferences and users
    if (testUserId || testOrganizerId || testAttendeeId) {
      await prisma.userPreferences.deleteMany({
        where: {
          userId: {
            in: [testUserId, testOrganizerId, testAttendeeId].filter(
              (id) => id !== undefined,
            ) as string[],
          },
        },
      });

      await prisma.user.deleteMany({
        where: {
          id: {
            in: [testUserId, testOrganizerId, testAttendeeId].filter(
              (id) => id !== undefined,
            ) as string[],
          },
        },
      });
    }
  });

  describe('getUserPreferences', () => {
    it('should return default preferences for new user', async () => {
      if (!dbConnected) return;
      const preferences = await UserPreferencesService.getUserPreferences(testUserId);

      expect(preferences.theme).toBe('system');
      expect(preferences.dashboardLayout).toBe('spacious');
      expect(preferences.showMetrics).toBe(true);
      expect(preferences.showCharts).toBe(true);
      expect(preferences.language).toBe('en');
      expect(preferences.sessionTimeout).toBe(30);
    });

    it('should return role-specific defaults for organizer', async () => {
      if (!dbConnected) return;
      const preferences = await UserPreferencesService.getUserPreferences(testOrganizerId);

      expect(preferences.eventNotifications).toBe(true);
      expect(preferences.registrationNotifications).toBe(true);
      expect(preferences.paymentNotifications).toBe(true);
      expect(preferences.marketingEmails).toBe(false);
      expect(preferences.weeklyDigest).toBe(true);
    });

    it('should return role-specific defaults for attendee', async () => {
      if (!dbConnected) return;
      const preferences = await UserPreferencesService.getUserPreferences(testAttendeeId);

      expect(preferences.eventReminders).toBe(true);
      expect(preferences.eventUpdates).toBe(true);
      expect(preferences.promotionalOffers).toBe(true);
    });

    it('should throw NotFoundError for non-existent user', async () => {
      if (!dbConnected) return;
      await expect(
        UserPreferencesService.getUserPreferences('non-existent-user-id'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updatePreferences', () => {
    it('should create preferences if they do not exist', async () => {
      if (!dbConnected) return;
      const updated = await UserPreferencesService.updatePreferences(testUserId, {
        theme: 'dark',
        dashboardLayout: 'compact',
      });

      expect(updated.theme).toBe('dark');
      expect(updated.dashboardLayout).toBe('compact');
    });

    it('should update existing preferences', async () => {
      if (!dbConnected) return;
      // Create initial preferences
      await UserPreferencesService.updatePreferences(testUserId, {
        theme: 'light',
      });

      // Update them
      const updated = await UserPreferencesService.updatePreferences(testUserId, {
        theme: 'dark',
      });

      expect(updated.theme).toBe('dark');
    });

    it('should validate theme value', async () => {
      if (!dbConnected) return;
      await expect(
        UserPreferencesService.updatePreferences(testUserId, {
          theme: 'invalid' as any,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should validate dashboard layout', async () => {
      if (!dbConnected) return;
      await expect(
        UserPreferencesService.updatePreferences(testUserId, {
          dashboardLayout: 'invalid' as any,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should validate time format', async () => {
      if (!dbConnected) return;
      await expect(
        UserPreferencesService.updatePreferences(testUserId, {
          timeFormat: 'invalid' as any,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should validate profile visibility', async () => {
      if (!dbConnected) return;
      await expect(
        UserPreferencesService.updatePreferences(testUserId, {
          profileVisibility: 'invalid' as any,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should validate session timeout range', async () => {
      if (!dbConnected) return;
      await expect(
        UserPreferencesService.updatePreferences(testUserId, {
          sessionTimeout: 0,
        }),
      ).rejects.toThrow(ValidationError);

      await expect(
        UserPreferencesService.updatePreferences(testUserId, {
          sessionTimeout: 2000,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should validate primary color format', async () => {
      if (!dbConnected) return;
      await expect(
        UserPreferencesService.updatePreferences(testUserId, {
          primaryColor: 'not-a-color',
        }),
      ).rejects.toThrow(ValidationError);

      // Valid hex color should work
      const updated = await UserPreferencesService.updatePreferences(testUserId, {
        primaryColor: '#FF5733',
      });
      expect(updated.primaryColor).toBe('#FF5733');
    });

    it('should only update provided fields', async () => {
      if (!dbConnected) return;
      // Set initial preferences
      await UserPreferencesService.updatePreferences(testUserId, {
        theme: 'light',
        dashboardLayout: 'spacious',
        showMetrics: true,
      });

      // Update only theme
      const updated = await UserPreferencesService.updatePreferences(testUserId, {
        theme: 'dark',
      });

      expect(updated.theme).toBe('dark');
      expect(updated.dashboardLayout).toBe('spacious'); // Should remain unchanged
      expect(updated.showMetrics).toBe(true); // Should remain unchanged
    });
  });

  describe('updatePreference', () => {
    it('should update a single preference', async () => {
      if (!dbConnected) return;
      const updated = await UserPreferencesService.updatePreference(testUserId, 'theme', 'dark');

      expect(updated.theme).toBe('dark');
    });
  });

  describe('resetPreferences', () => {
    it('should reset preferences to defaults', async () => {
      if (!dbConnected) return;
      // Set custom preferences
      await UserPreferencesService.updatePreferences(testUserId, {
        theme: 'dark',
        dashboardLayout: 'compact',
        sessionTimeout: 60,
      });

      // Reset to defaults
      const reset = await UserPreferencesService.resetPreferences(testUserId);

      // Should have default values
      expect(reset.theme).toBe('system');
      expect(reset.dashboardLayout).toBe('spacious');
      expect(reset.sessionTimeout).toBe(30);
    });

    it('should throw NotFoundError for non-existent user', async () => {
      if (!dbConnected) return;
      await expect(
        UserPreferencesService.resetPreferences('non-existent-user-id'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getDefaultPreferencesForRole', () => {
    it('should return defaults for organizer role', () => {
      const defaults = UserPreferencesService.getDefaultPreferencesForRole(UserRole.ORGANIZER);

      expect(defaults.eventNotifications).toBe(true);
      expect(defaults.registrationNotifications).toBe(true);
      expect(defaults.paymentNotifications).toBe(true);
    });

    it('should return defaults for attendee role', () => {
      const defaults = UserPreferencesService.getDefaultPreferencesForRole(UserRole.ATTENDEE);

      expect(defaults.eventReminders).toBe(true);
      expect(defaults.eventUpdates).toBe(true);
      expect(defaults.promotionalOffers).toBe(true);
    });

    it('should return base defaults for unknown role', () => {
      const defaults = UserPreferencesService.getDefaultPreferencesForRole(undefined);

      expect(defaults.theme).toBe('system');
      expect(defaults.dashboardLayout).toBe('spacious');
      expect(defaults.sessionTimeout).toBe(30);
    });
  });
});

