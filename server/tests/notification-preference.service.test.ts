import { NotificationPreferenceService } from '../src/services/notification-preference.service';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('NotificationPreferenceService', () => {
  let dbConnected = false;
  let userId: string;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      logger.info('✅ Test database connected');
    } catch (error) {
      logger.warn('⚠️  Database not available. Tests will be skipped.');
      logger.warn(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      dbConnected = false;
    }
  });

  afterAll(async () => {
    if (dbConnected) {
      try {
        await prisma.$disconnect();
      } catch {
        // Ignore disconnection errors
      }
    }
  });

  beforeEach(async () => {
    if (!dbConnected) return;

    // Clear all tables
    await prisma.$transaction(async (tx) => {
      await tx.notificationPreference.deleteMany();
      await tx.notification.deleteMany();
      await tx.user.deleteMany();
    });

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'user@test.com',
        password: await hashPassword('password123'),
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    userId = user.id;
  });

  describe('getUserPreferences', () => {
    it('should return default preferences if none exist', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      const preferences = await NotificationPreferenceService.getUserPreferences(userId);

      expect(preferences).toBeDefined();
      expect(preferences.emailEnabled).toBe(true);
      expect(preferences.smsEnabled).toBe(false); // SMS is disabled
      expect(preferences.pushEnabled).toBe(true);
      expect(preferences.inAppEnabled).toBe(true);
      expect(preferences.eventReminders).toBe(true);
    });

    it('should return existing preferences', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      // Create preferences
      await prisma.notificationPreference.create({
        data: {
          userId,
          emailEnabled: false,
          smsEnabled: false,
          pushEnabled: false,
          inAppEnabled: true,
          eventReminders: false,
          eventUpdates: true,
          eventCancellations: true,
          paymentNotifications: false,
          marketingEmails: false,
          systemAnnouncements: true,
          registrationUpdates: false,
          staffNotifications: false,
          reminderFrequency: 'daily_digest',
        },
      });

      const preferences = await NotificationPreferenceService.getUserPreferences(userId);

      expect(preferences.emailEnabled).toBe(false);
      expect(preferences.pushEnabled).toBe(false);
      expect(preferences.inAppEnabled).toBe(true);
      expect(preferences.eventReminders).toBe(false);
      expect(preferences.reminderFrequency).toBe('daily_digest');
    });

    it('should ensure SMS is always disabled', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      // Try to create preferences with SMS enabled (should be forced to false)
      await prisma.notificationPreference.create({
        data: {
          userId,
          emailEnabled: true,
          smsEnabled: true, // Try to enable SMS
          pushEnabled: true,
          inAppEnabled: true,
          eventReminders: true,
          eventUpdates: true,
          eventCancellations: true,
          paymentNotifications: true,
          marketingEmails: true,
          systemAnnouncements: true,
          registrationUpdates: true,
          staffNotifications: true,
          reminderFrequency: 'all',
        },
      });

      const preferences = await NotificationPreferenceService.getUserPreferences(userId);

      // SMS should be disabled even if we tried to enable it
      expect(preferences.smsEnabled).toBe(false);
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      const updated = await NotificationPreferenceService.updatePreferences(userId, {
        emailEnabled: false,
        pushEnabled: false,
        eventReminders: false,
        reminderFrequency: 'weekly_digest',
      });

      expect(updated.emailEnabled).toBe(false);
      expect(updated.pushEnabled).toBe(false);
      expect(updated.eventReminders).toBe(false);
      expect(updated.reminderFrequency).toBe('weekly_digest');
      expect(updated.smsEnabled).toBe(false); // SMS should always be false
    });

    it('should create preferences if they do not exist', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      const updated = await NotificationPreferenceService.updatePreferences(userId, {
        emailEnabled: false,
      });

      expect(updated).toBeDefined();
      expect(updated.userId).toBe(userId);
    });

    it('should force SMS to be disabled even if provided', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      const updated = await NotificationPreferenceService.updatePreferences(userId, {
        smsEnabled: true, // Try to enable SMS
      });

      expect(updated.smsEnabled).toBe(false);
    });
  });

  describe('shouldSendNotification', () => {
    it('should return true if channel and category are enabled', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      // Create preferences with email enabled
      await prisma.notificationPreference.create({
        data: {
          userId,
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          inAppEnabled: true,
          eventReminders: true,
          eventUpdates: true,
          eventCancellations: true,
          paymentNotifications: true,
          marketingEmails: true,
          systemAnnouncements: true,
          registrationUpdates: true,
          staffNotifications: true,
          reminderFrequency: 'all',
        },
      });

      const shouldSend = await NotificationPreferenceService.shouldSendNotification(
        userId,
        'EVENT_REMINDER_24H' as any,
        'email',
      );

      expect(shouldSend).toBe(true);
    });

    it('should return false if channel is disabled', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      // Create preferences with email disabled
      await prisma.notificationPreference.create({
        data: {
          userId,
          emailEnabled: false,
          smsEnabled: false,
          pushEnabled: true,
          inAppEnabled: true,
          eventReminders: true,
          eventUpdates: true,
          eventCancellations: true,
          paymentNotifications: true,
          marketingEmails: true,
          systemAnnouncements: true,
          registrationUpdates: true,
          staffNotifications: true,
          reminderFrequency: 'all',
        },
      });

      const shouldSend = await NotificationPreferenceService.shouldSendNotification(
        userId,
        'EVENT_REMINDER_24H' as any,
        'email',
      );

      expect(shouldSend).toBe(false);
    });

    it('should return false for SMS channel (always disabled)', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      // Even if SMS is somehow enabled in DB, it should return false
      await prisma.notificationPreference.create({
        data: {
          userId,
          emailEnabled: true,
          smsEnabled: true, // Try to enable
          pushEnabled: true,
          inAppEnabled: true,
          eventReminders: true,
          eventUpdates: true,
          eventCancellations: true,
          paymentNotifications: true,
          marketingEmails: true,
          systemAnnouncements: true,
          registrationUpdates: true,
          staffNotifications: true,
          reminderFrequency: 'all',
        },
      });

      const shouldSend = await NotificationPreferenceService.shouldSendNotification(
        userId,
        'SYSTEM_ANNOUNCEMENT' as any,
        'sms',
      );

      expect(shouldSend).toBe(false);
    });

    it('should return false if category is disabled', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      // Create preferences with event reminders disabled
      await prisma.notificationPreference.create({
        data: {
          userId,
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          inAppEnabled: true,
          eventReminders: false, // Disabled
          eventUpdates: true,
          eventCancellations: true,
          paymentNotifications: true,
          marketingEmails: true,
          systemAnnouncements: true,
          registrationUpdates: true,
          staffNotifications: true,
          reminderFrequency: 'all',
        },
      });

      const shouldSend = await NotificationPreferenceService.shouldSendNotification(
        userId,
        'EVENT_REMINDER_24H' as any,
        'email',
      );

      expect(shouldSend).toBe(false);
    });
  });

  describe('getDefaultPreferences', () => {
    it('should return default preferences', () => {
      const defaults = NotificationPreferenceService.getDefaultPreferences();

      expect(defaults.emailEnabled).toBe(true);
      expect(defaults.smsEnabled).toBe(false);
      expect(defaults.pushEnabled).toBe(true);
      expect(defaults.inAppEnabled).toBe(true);
      expect(defaults.eventReminders).toBe(true);
      expect(defaults.eventUpdates).toBe(true);
      expect(defaults.eventCancellations).toBe(true);
      expect(defaults.paymentNotifications).toBe(true);
      expect(defaults.marketingEmails).toBe(true);
      expect(defaults.systemAnnouncements).toBe(true);
      expect(defaults.registrationUpdates).toBe(true);
      expect(defaults.staffNotifications).toBe(true);
      expect(defaults.reminderFrequency).toBe('all');
    });
  });
});




