import { NotificationService } from '../src/services/notification.service';
import { NotificationPreferenceService } from '../src/services/notification-preference.service';
import { prisma } from '../src/config/database';
import {
  UserRole,
  UserStatus,
  EventStatus,
  NotificationType,
  NotificationPriority,
  DeliveryStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { cleanupTestData } from './test-helpers';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('NotificationService', () => {
  let dbConnected = false;
  let organizerId: string;
  let attendeeId: string;
  let eventId: string;
  let registrationId: string;

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

    // Clear all tables using comprehensive cleanup helper
    try {
      await prisma.$transaction(async (tx) => {
        await cleanupTestData(tx);
      });
    } catch (error) {
      // If cleanup fails, log but continue - might be due to missing tables
      logger.warn('Cleanup warning:', error);
    }

    // Create test organizer (use upsert to handle existing users)
    const organizerPassword = await hashPassword('password123');
    const organizer = await prisma.user.upsert({
      where: { email: 'organizer@test.com' },
      update: {
        password: organizerPassword,
        firstName: 'Organizer',
        lastName: 'Test',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
      create: {
        email: 'organizer@test.com',
        password: organizerPassword,
        firstName: 'Organizer',
        lastName: 'Test',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    organizerId = organizer.id;

    // Create test attendee (use upsert to handle existing users)
    const attendeePassword = await hashPassword('password123');
    const attendee = await prisma.user.upsert({
      where: { email: 'attendee@test.com' },
      update: {
        password: attendeePassword,
        firstName: 'Attendee',
        lastName: 'Test',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
      create: {
        email: 'attendee@test.com',
        password: attendeePassword,
        firstName: 'Attendee',
        lastName: 'Test',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    attendeeId = attendee.id;

    // Create test event
    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'Test Description',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
        venue: 'Test Venue',
        location: 'Test Location',
        organizerId,
        status: EventStatus.APPROVED,
        isFree: true,
        capacity: 100,
        availableSlots: 100,
      },
    });
    eventId = event.id;

    // Create test registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        attendeeId,
        quantity: 1,
        totalAmount: 0,
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
      },
    });
    registrationId = registration.id;
  });

  describe('sendNotification', () => {
    it('should create and send a notification', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      const notification = await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Test Notification',
        message: 'This is a test notification',
        priority: NotificationPriority.MEDIUM,
      });

      expect(notification).toBeDefined();
      expect(notification.id).toBeDefined();
      expect(notification.userId).toBe(attendeeId);
      expect(notification.type).toBe(NotificationType.SYSTEM_ANNOUNCEMENT);
      expect(notification.title).toBe('Test Notification');
      expect(notification.message).toBe('This is a test notification');
      expect(notification.priority).toBe(NotificationPriority.MEDIUM);
      expect(notification.isRead).toBe(false);

      // Verify notification was created in database
      const dbNotification = await prisma.notification.findUnique({
        where: { id: notification.id },
      });
      expect(dbNotification).toBeDefined();
    });

    it('should respect user notification preferences', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      // Disable email notifications for attendee
      await NotificationPreferenceService.updatePreferences(attendeeId, {
        emailEnabled: false,
      });

      const notification = await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Test Notification',
        message: 'This should not be sent via email',
        priority: NotificationPriority.MEDIUM,
      });

      expect(notification).toBeDefined();

      // Check that email was not sent (status should be FAILED or null)
      const dbNotification = await prisma.notification.findUnique({
        where: { id: notification.id },
      });
      expect(dbNotification?.emailStatus).not.toBe(DeliveryStatus.SENT);
    });

    it('should handle event-related notifications', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      const notification = await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.EVENT_UPDATE,
        title: 'Event Updated',
        message: 'The event has been updated',
        priority: NotificationPriority.MEDIUM,
        eventId,
      });

      expect(notification).toBeDefined();
      expect(notification.eventId).toBe(eventId);
    });

    it('should handle registration-related notifications', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      const notification = await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.REGISTRATION_CONFIRMED,
        title: 'Registration Confirmed',
        message: 'Your registration has been confirmed',
        priority: NotificationPriority.MEDIUM,
        eventId,
        registrationId,
      });

      expect(notification).toBeDefined();
      expect(notification.eventId).toBe(eventId);
      expect(notification.registrationId).toBe(registrationId);
    });
  });

  describe('sendEventNotification', () => {
    it('should send notification to all event attendees', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      await NotificationService.sendEventNotification(
        eventId,
        NotificationType.EVENT_UPDATE,
        'Event Updated',
        'The event details have been updated',
        'attendees',
        undefined,
        NotificationPriority.MEDIUM,
      );

      // Check that notification was created for attendee
      const notifications = await prisma.notification.findMany({
        where: {
          eventId,
          userId: attendeeId,
          type: NotificationType.EVENT_UPDATE,
        },
      });

      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should send notification to event organizer', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      await NotificationService.sendEventNotification(
        eventId,
        NotificationType.EVENT_APPROVED,
        'Event Approved',
        'Your event has been approved',
        'organizer',
        undefined,
        NotificationPriority.MEDIUM,
      );

      // Check that notification was created for organizer
      const notifications = await prisma.notification.findMany({
        where: {
          eventId,
          userId: organizerId,
          type: NotificationType.EVENT_APPROVED,
        },
      });

      expect(notifications.length).toBeGreaterThan(0);
    });
  });

  describe('getUserNotifications', () => {
    it('should retrieve user notifications', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      // Create some notifications
      await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Notification 1',
        message: 'First notification',
        priority: NotificationPriority.MEDIUM,
      });

      await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Notification 2',
        message: 'Second notification',
        priority: NotificationPriority.HIGH,
      });

      const notifications = await NotificationService.getUserNotifications(attendeeId, {
        limit: 10,
        offset: 0,
      });

      expect(notifications.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter notifications by read status', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      // Create notifications
      const notification1 = await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Unread Notification',
        message: 'This is unread',
        priority: NotificationPriority.MEDIUM,
      });

      await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Another Notification',
        message: 'This is also unread',
        priority: NotificationPriority.MEDIUM,
      });

      // Mark one as read
      await NotificationService.markAsRead(notification1.id, attendeeId);

      // Get unread notifications
      const unreadNotifications = await NotificationService.getUserNotifications(attendeeId, {
        limit: 10,
        offset: 0,
        isRead: false,
      });

      expect(unreadNotifications.every((n) => !n.isRead)).toBe(true);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      const notification = await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Test Notification',
        message: 'This is a test',
        priority: NotificationPriority.MEDIUM,
      });

      await NotificationService.markAsRead(notification.id, attendeeId);

      const updated = await prisma.notification.findUnique({
        where: { id: notification.id },
      });

      expect(updated?.isRead).toBe(true);
      expect(updated?.readAt).toBeDefined();
    });

    it('should not mark notification as read if user does not own it', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      const notification = await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Test Notification',
        message: 'This is a test',
        priority: NotificationPriority.MEDIUM,
      });

      // Try to mark as read with different user
      await expect(
        NotificationService.markAsRead(notification.id, organizerId),
      ).rejects.toThrow();

      const updated = await prisma.notification.findUnique({
        where: { id: notification.id },
      });

      expect(updated?.isRead).toBe(false);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      // Create multiple notifications
      await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Notification 1',
        message: 'First',
        priority: NotificationPriority.MEDIUM,
      });

      await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Notification 2',
        message: 'Second',
        priority: NotificationPriority.MEDIUM,
      });

      await NotificationService.markAllAsRead(attendeeId);

      const notifications = await prisma.notification.findMany({
        where: { userId: attendeeId },
      });

      expect(notifications.every((n) => n.isRead)).toBe(true);
    });
  });

  describe('getUnreadCount', () => {
    it('should return correct unread count', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      // Create notifications
      await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Notification 1',
        message: 'First',
        priority: NotificationPriority.MEDIUM,
      });

      const notification2 = await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Notification 2',
        message: 'Second',
        priority: NotificationPriority.MEDIUM,
      });

      // Mark one as read
      await NotificationService.markAsRead(notification2.id, attendeeId);

      const unreadCount = await NotificationService.getUnreadCount(attendeeId);

      expect(unreadCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      const notification = await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Test Notification',
        message: 'This will be deleted',
        priority: NotificationPriority.MEDIUM,
      });

      await NotificationService.deleteNotification(notification.id, attendeeId);

      const deleted = await prisma.notification.findUnique({
        where: { id: notification.id },
      });

      expect(deleted).toBeNull();
    });

    it('should not delete notification if user does not own it', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      const notification = await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Test Notification',
        message: 'This should not be deleted',
        priority: NotificationPriority.MEDIUM,
      });

      // Try to delete with different user
      await expect(
        NotificationService.deleteNotification(notification.id, organizerId),
      ).rejects.toThrow();

      const notDeleted = await prisma.notification.findUnique({
        where: { id: notification.id },
      });

      expect(notDeleted).toBeDefined();
    });
  });
});

