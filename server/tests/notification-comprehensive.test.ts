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
import { smsService } from '../src/services/sms.service';
import { emailService } from '../src/services/email.service';
import { websocketService } from '../src/services/websocket.service';

// Mock dependencies
jest.mock('../src/services/sms.service');
jest.mock('../src/services/email.service');
jest.mock('../src/services/websocket.service');
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('NotificationService - Comprehensive Tests', () => {
  let dbConnected = false;
  let organizerId: string;
  let attendeeId1: string;
  let attendeeId2: string;
  let attendeeId3: string;
  let _eventId: string;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      logger.info('✅ Test database connected');
    } catch (_error) {
      logger.warn('⚠️  Database not available. Tests will be skipped.');
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
      await tx.notification.deleteMany();
      await tx.notificationPreference.deleteMany();
      await tx.eventRegistration.deleteMany();
      await tx.eventStaff.deleteMany();
      await tx.event.deleteMany();
      await tx.user.deleteMany();
    });

    // Create test organizer
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@test.com',
        password: await hashPassword('password123'),
        firstName: 'Organizer',
        lastName: 'Test',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        phoneNumber: '+1234567890',
      },
    });
    organizerId = organizer.id;

    // Create test attendees
    const attendee1 = await prisma.user.create({
      data: {
        email: 'attendee1@test.com',
        password: await hashPassword('password123'),
        firstName: 'Attendee',
        lastName: 'One',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        phoneNumber: '+1234567891',
      },
    });
    attendeeId1 = attendee1.id;

    const attendee2 = await prisma.user.create({
      data: {
        email: 'attendee2@test.com',
        password: await hashPassword('password123'),
        firstName: 'Attendee',
        lastName: 'Two',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        phoneNumber: '+1234567892',
      },
    });
    attendeeId2 = attendee2.id;

    const attendee3 = await prisma.user.create({
      data: {
        email: 'attendee3@test.com',
        password: await hashPassword('password123'),
        firstName: 'Attendee',
        lastName: 'Three',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        phoneNumber: '+1234567893',
      },
    });
    attendeeId3 = attendee3.id;

    // Create test event
    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'Test Description',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        venue: 'Test Venue',
        location: 'Test Location',
        organizerId,
        status: EventStatus.APPROVED,
        isFree: true,
        capacity: 100,
        availableSlots: 100,
      },
    });
    _eventId = event.id;

    // Create test registrations
    await prisma.eventRegistration.create({
      data: {
        eventId: _eventId,
        attendeeId: attendeeId1,
        quantity: 1,
        totalAmount: 0,
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
      },
    });

    await prisma.eventRegistration.create({
      data: {
        eventId: _eventId,
        attendeeId: attendeeId2,
        quantity: 1,
        totalAmount: 0,
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
      },
    });

    // Reset mocks
    jest.clearAllMocks();
    (smsService.isEnabled as jest.Mock).mockReturnValue(true);
    (smsService.sendSMS as jest.Mock).mockResolvedValue({ success: true, messageId: 'SM123' });
    (emailService.sendEmail as jest.Mock).mockResolvedValue({ success: true, messageId: 'EM123' });
    (websocketService.sendNotification as jest.Mock).mockResolvedValue(undefined);
  });

  describe('sendBulkNotification', () => {
    it('should send notifications to multiple users', async () => {
      if (!dbConnected) return;

      const userIds = [attendeeId1, attendeeId2, attendeeId3];

      const result = await NotificationService.sendBulkNotification(
        userIds,
        NotificationType.SYSTEM_ANNOUNCEMENT,
        'Bulk Notification',
        'This is a bulk notification',
        undefined,
        NotificationPriority.MEDIUM,
      );

      expect(result.total).toBe(3);
      expect(result.created).toBe(3);
      expect(result.failed).toBe(0);

      // Verify notifications were created
      const notifications = await prisma.notification.findMany({
        where: {
          userId: { in: userIds },
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
        },
      });

      expect(notifications.length).toBe(3);
    });

    it('should handle partial failures in bulk notification', async () => {
      if (!dbConnected) return;

      // Make one user invalid
      const userIds = [attendeeId1, 'invalid-user-id', attendeeId2];

      const result = await NotificationService.sendBulkNotification(
        userIds,
        NotificationType.SYSTEM_ANNOUNCEMENT,
        'Bulk Notification',
        'This is a bulk notification',
      );

      expect(result.total).toBe(3);
      expect(result.created).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors.length).toBe(1);
    });

    it('should respect user preferences in bulk notification', async () => {
      if (!dbConnected) return;

      // Disable email for one user
      await NotificationPreferenceService.updatePreferences(attendeeId1, {
        emailEnabled: false,
      });

      const userIds = [attendeeId1, attendeeId2];

      const result = await NotificationService.sendBulkNotification(
        userIds,
        NotificationType.SYSTEM_ANNOUNCEMENT,
        'Bulk Notification',
        'This is a bulk notification',
      );

      expect(result.created).toBe(2);

      // Check that email was not sent for attendee1
      const notification1 = await prisma.notification.findFirst({
        where: { userId: attendeeId1 },
      });
      expect(notification1?.emailStatus).not.toBe(DeliveryStatus.SENT);
    });

    it('should handle empty user list', async () => {
      if (!dbConnected) return;

      const result = await NotificationService.sendBulkNotification(
        [],
        NotificationType.SYSTEM_ANNOUNCEMENT,
        'Bulk Notification',
        'This is a bulk notification',
      );

      expect(result.total).toBe(0);
      expect(result.created).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  describe('sendEventNotification - Staff', () => {
    it('should send notification to event staff', async () => {
      if (!dbConnected) return;

      // Create staff member
      const staff = await prisma.user.create({
        data: {
          email: 'staff@test.com',
          password: await hashPassword('password123'),
          firstName: 'Staff',
          lastName: 'Member',
          role: UserRole.ADMIN_STAFF,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      // Assign staff to event
      await prisma.eventStaff.create({
        data: {
          eventId: _eventId,
          staffId: staff.id,
          staffType: 'ADMIN_STAFF',
          role: 'SUPERVISOR',
          isActive: true,
          assignedBy: organizerId,
        },
      });

      await NotificationService.sendEventNotification(
        _eventId,
        NotificationType.EVENT_UPDATE,
        'Event Updated',
        'The event has been updated',
        'staff',
        undefined,
        NotificationPriority.MEDIUM,
      );

      const notifications = await prisma.notification.findMany({
        where: {
          eventId: _eventId,
          userId: staff.id,
          type: NotificationType.EVENT_UPDATE,
        },
      });

      expect(notifications.length).toBeGreaterThan(0);
    });
  });

  describe('Notification Delivery Channels', () => {
    it('should deliver via email when email channel is enabled', async () => {
      if (!dbConnected) return;

      await NotificationService.sendNotification({
        userId: attendeeId1,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Test',
        message: 'Test message',
        channels: { email: true, sms: false, push: false, inApp: false },
      });

      expect(emailService.sendEmail).toHaveBeenCalled();
    });

    it('should deliver via SMS when SMS channel is enabled and service is available', async () => {
      if (!dbConnected) return;

      await NotificationService.sendNotification({
        userId: attendeeId1,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Test',
        message: 'Test message',
        channels: { email: false, sms: true, push: false, inApp: false },
      });

      expect(smsService.sendSMS).toHaveBeenCalled();
    });

    it('should deliver via WebSocket when inApp channel is enabled', async () => {
      if (!dbConnected) return;

      await NotificationService.sendNotification({
        userId: attendeeId1,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Test',
        message: 'Test message',
        channels: { email: false, sms: false, push: false, inApp: true },
      });

      expect(websocketService.sendNotification).toHaveBeenCalled();
    });

    it('should skip SMS when SMS service is disabled', async () => {
      if (!dbConnected) return;

      (smsService.isEnabled as jest.Mock).mockReturnValue(false);

      await NotificationService.sendNotification({
        userId: attendeeId1,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Test',
        message: 'Test message',
        channels: { email: false, sms: true, push: false, inApp: false },
      });

      expect(smsService.sendSMS).not.toHaveBeenCalled();
    });
  });

  describe('Notification Filters', () => {
    beforeEach(async () => {
      if (!dbConnected) return;

      // Create various notifications
      await NotificationService.sendNotification({
        userId: attendeeId1,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'System 1',
        message: 'Message 1',
        priority: NotificationPriority.LOW,
      });

      await NotificationService.sendNotification({
        userId: attendeeId1,
        type: NotificationType.EVENT_UPDATE,
        title: 'Event Update',
        message: 'Message 2',
        priority: NotificationPriority.HIGH,
        eventId: _eventId,
      });

      await NotificationService.sendNotification({
        userId: attendeeId1,
        type: NotificationType.PAYMENT_SUCCESS,
        title: 'Payment',
        message: 'Message 3',
        priority: NotificationPriority.MEDIUM,
      });

      // Mark one as read
      const notifications = await prisma.notification.findMany({
        where: { userId: attendeeId1 },
      });
      if (notifications.length > 0) {
        await NotificationService.markAsRead(notifications[0].id, attendeeId1);
      }
    });

    it('should filter notifications by type', async () => {
      if (!dbConnected) return;

      const notifications = await NotificationService.getUserNotifications(attendeeId1, {
        type: NotificationType.EVENT_UPDATE,
      });

      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe(NotificationType.EVENT_UPDATE);
    });

    it('should filter notifications by read status', async () => {
      if (!dbConnected) return;

      const unreadNotifications = await NotificationService.getUserNotifications(attendeeId1, {
        isRead: false,
      });

      expect(unreadNotifications.length).toBeGreaterThan(0);
      unreadNotifications.forEach((n) => {
        expect(n.isRead).toBe(false);
      });
    });

    it('should filter notifications by priority', async () => {
      if (!dbConnected) return;

      const highPriorityNotifications = await NotificationService.getUserNotifications(attendeeId1, {
        priority: NotificationPriority.HIGH,
      });

      expect(highPriorityNotifications.length).toBeGreaterThan(0);
      highPriorityNotifications.forEach((n) => {
        expect(n.priority).toBe(NotificationPriority.HIGH);
      });
    });

    it('should filter notifications by event', async () => {
      if (!dbConnected) return;

      const eventNotifications = await NotificationService.getUserNotifications(attendeeId1, {
        eventId: _eventId,
      });

      expect(eventNotifications.length).toBeGreaterThan(0);
      eventNotifications.forEach((n) => {
        expect(n.eventId).toBe(_eventId);
      });
    });

    it('should support pagination', async () => {
      if (!dbConnected) return;

      const page1 = await NotificationService.getUserNotifications(attendeeId1, {
        limit: 2,
        offset: 0,
      });

      const page2 = await NotificationService.getUserNotifications(attendeeId1, {
        limit: 2,
        offset: 2,
      });

      expect(page1.length).toBeLessThanOrEqual(2);
      expect(page2.length).toBeLessThanOrEqual(2);
      // Should not have overlapping notifications
      const page1Ids = new Set(page1.map((n) => n.id));
      const page2Ids = new Set(page2.map((n) => n.id));
      const intersection = [...page1Ids].filter((id) => page2Ids.has(id));
      expect(intersection.length).toBe(0);
    });

    it('should filter by date range', async () => {
      if (!dbConnected) return;

      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const endDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      const notifications = await NotificationService.getUserNotifications(attendeeId1, {
        startDate,
        endDate,
      });

      notifications.forEach((n) => {
        expect(n.createdAt.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(n.createdAt.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });
  });

  describe('Notification Expiration', () => {
    it('should create notification with expiration date', async () => {
      if (!dbConnected) return;

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      const notification = await NotificationService.sendNotification({
        userId: attendeeId1,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Expiring Notification',
        message: 'This will expire',
        expiresAt,
      });

      expect(notification.expiresAt).toBeDefined();
      expect(notification.expiresAt?.getTime()).toBe(expiresAt.getTime());
    });
  });

  describe('Notification Data and Metadata', () => {
    it('should store custom data in notification', async () => {
      if (!dbConnected) return;

      const customData = {
        action: 'test',
        value: 123,
        nested: { key: 'value' },
      };

      const notification = await NotificationService.sendNotification({
        userId: attendeeId1,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Test',
        message: 'Test message',
        data: customData,
      });

      const dbNotification = await prisma.notification.findUnique({
        where: { id: notification.id },
      });

      expect(dbNotification?.data).toBeDefined();
      const data = dbNotification?.data as any;
      expect(data.action).toBe('test');
      expect(data.value).toBe(123);
    });

    it('should store metadata in notification', async () => {
      if (!dbConnected) return;

      const metadata = {
        source: 'system',
        version: '1.0',
      };

      const notification = await NotificationService.sendNotification({
        userId: attendeeId1,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Test',
        message: 'Test message',
        metadata,
      });

      const dbNotification = await prisma.notification.findUnique({
        where: { id: notification.id },
      });

      expect(dbNotification?.metadata).toBeDefined();
      const meta = dbNotification?.metadata as any;
      expect(meta.source).toBe('system');
    });
  });

  describe('Error Handling', () => {
    it('should handle user not found error', async () => {
      if (!dbConnected) return;

      await expect(
        NotificationService.sendNotification({
          userId: 'non-existent-user',
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: 'Test',
          message: 'Test message',
        }),
      ).rejects.toThrow('User not found');
    });

    it('should handle event not found in sendEventNotification', async () => {
      if (!dbConnected) return;

      await expect(
        NotificationService.sendEventNotification(
          'non-existent-event',
          NotificationType.EVENT_UPDATE,
          'Test',
          'Test message',
          'attendees',
        ),
      ).rejects.toThrow('Event not found');
    });

    it('should handle notification not found in markAsRead', async () => {
      if (!dbConnected) return;

      await expect(
        NotificationService.markAsRead('non-existent-notification', attendeeId1),
      ).rejects.toThrow('Notification not found');
    });

    it('should handle notification not found in deleteNotification', async () => {
      if (!dbConnected) return;

      await expect(
        NotificationService.deleteNotification('non-existent-notification', attendeeId1),
      ).rejects.toThrow('Notification not found');
    });
  });

  describe('WebSocket Integration', () => {
    it('should send unread count update when marking as read', async () => {
      if (!dbConnected) return;

      const notification = await NotificationService.sendNotification({
        userId: attendeeId1,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Test',
        message: 'Test message',
      });

      await NotificationService.markAsRead(notification.id, attendeeId1);

      expect(websocketService.sendUnreadCountUpdate).toHaveBeenCalled();
    });

    it('should send notification deleted event when deleting', async () => {
      if (!dbConnected) return;

      const notification = await NotificationService.sendNotification({
        userId: attendeeId1,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Test',
        message: 'Test message',
      });

      await NotificationService.deleteNotification(notification.id, attendeeId1);

      expect(websocketService.notifyNotificationDeleted).toHaveBeenCalled();
    });
  });
});

