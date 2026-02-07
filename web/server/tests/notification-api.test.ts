import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import {
  UserRole,
  UserStatus,
  EventStatus,
  NotificationType,
} from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { generateAccessToken } from '../src/utils/jwt';
import { NotificationService } from '../src/services/notification.service';
import { cleanupTestData } from './test-helpers';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('Notification API', () => {
  let dbConnected = false;
  let attendeeToken: string;
  let organizerToken: string;
  let attendeeId: string;
  let organizerId: string;
  let eventId: string;

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
      await cleanupTestData(tx);
    });

    // Create test attendee
    const attendee = await prisma.user.create({
      data: {
        email: 'attendee@test.com',
        password: await hashPassword('password123'),
        firstName: 'Attendee',
        lastName: 'Test',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    attendeeId = attendee.id;
    attendeeToken = generateAccessToken({
      userId: attendee.id,
      email: attendee.email,
      role: attendee.role,
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
        emailVerifiedAt: new Date(),
      },
    });
    organizerId = organizer.id;
    organizerToken = generateAccessToken({
      userId: organizer.id,
      email: organizer.email,
      role: organizer.role,
    });

    // Create test admin (not used in tests but may be needed for future tests)
    await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: await hashPassword('password123'),
        firstName: 'Admin',
        lastName: 'Test',
        role: UserRole.ADMIN_STAFF,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

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
    eventId = event.id;

    // Create test registration
    await prisma.eventRegistration.create({
      data: {
        eventId,
        attendeeId,
        quantity: 1,
        totalAmount: 0,
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
      },
    });
  });

  describe('GET /api/v1/notifications', () => {
    it('should get user notifications', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create a notification
      await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Test Notification',
        message: 'This is a test notification',
      });

      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveProperty('notifications');
      expect(Array.isArray(response.body.data.notifications)).toBe(true);
      expect(response.body.data.notifications.length).toBeGreaterThan(0);
      expect(response.body.data.notifications[0]).toHaveProperty('id');
      expect(response.body.data.notifications[0]).toHaveProperty('title');
      expect(response.body.data.notifications[0]).toHaveProperty('message');
      expect(response.body.data.notifications[0]).toHaveProperty('type');
      expect(response.body.data.notifications[0]).toHaveProperty('isRead');
    });

    it('should require authentication', async () => {
      if (!dbConnected) return;

      await request(app)
        .get('/api/v1/notifications')
        .expect(401);
    });

    it('should filter notifications by read status', async () => {
      if (!dbConnected) return;

      // Create read and unread notifications
      await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Unread Notification',
        message: 'This is unread',
      });

      const notification2 = await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Read Notification',
        message: 'This is read',
      });

      await NotificationService.markAsRead(notification2.id, attendeeId);

      // Get unread notifications
      const unreadResponse = await request(app)
        .get('/api/v1/notifications?isRead=false')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(unreadResponse.body.success).toBe(true);
      unreadResponse.body.data.notifications.forEach((n: { isRead: boolean }) => {
        expect(n.isRead).toBe(false);
      });

      // Get read notifications
      const readResponse = await request(app)
        .get('/api/v1/notifications?isRead=true')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(readResponse.body.success).toBe(true);
      readResponse.body.data.notifications.forEach((n: { isRead: boolean }) => {
        expect(n.isRead).toBe(true);
      });
    });

    it('should filter notifications by type', async () => {
      if (!dbConnected) return;

      await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'System Notification',
        message: 'System message',
      });

      await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.EVENT_UPDATE,
        title: 'Event Update',
        message: 'Event updated',
        eventId,
      });

      const response = await request(app)
        .get(`/api/v1/notifications?type=${NotificationType.SYSTEM_ANNOUNCEMENT}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.notifications.forEach((n: { type: NotificationType }) => {
        expect(n.type).toBe(NotificationType.SYSTEM_ANNOUNCEMENT);
      });
    });

    it('should support pagination', async () => {
      if (!dbConnected) return;

      // Create multiple notifications
      for (let i = 0; i < 5; i++) {
        await NotificationService.sendNotification({
          userId: attendeeId,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: `Notification ${i}`,
          message: `Message ${i}`,
        });
      }

      const page1 = await request(app)
        .get('/api/v1/notifications?limit=2&offset=0')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      const page2 = await request(app)
        .get('/api/v1/notifications?limit=2&offset=2')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(page1.body.data.notifications.length).toBeLessThanOrEqual(2);
      expect(page2.body.data.notifications.length).toBeLessThanOrEqual(2);

      // Should not have overlapping notifications
      const page1Ids = new Set(page1.body.data.notifications.map((n: { id: string }) => n.id));
      const page2Ids = new Set(page2.body.data.notifications.map((n: { id: string }) => n.id));
      const intersection = [...page1Ids].filter((id) => page2Ids.has(id));
      expect(intersection.length).toBe(0);
    });

    it('should filter by event', async () => {
      if (!dbConnected) return;

      await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.EVENT_UPDATE,
        title: 'Event Update',
        message: 'Event updated',
        eventId,
      });

      await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'System Notification',
        message: 'System message',
      });

      const response = await request(app)
        .get(`/api/v1/notifications?eventId=${eventId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.notifications.forEach((n: { eventId: string | null }) => {
        expect(n.eventId).toBe(eventId);
      });
    });
  });

  describe('GET /api/v1/notifications/unread-count', () => {
    it('should get unread notification count', async () => {
      if (!dbConnected) return;

      // Create unread notifications
      await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Notification 1',
        message: 'Message 1',
      });

      await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Notification 2',
        message: 'Message 2',
      });

      const response = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('count');
      expect(response.body.data.count).toBeGreaterThanOrEqual(2);
    });

    it('should return 0 when no unread notifications', async () => {
      if (!dbConnected) return;

      // Mark all as read
      await NotificationService.markAllAsRead(attendeeId);

      const response = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(0);
    });

    it('should require authentication', async () => {
      if (!dbConnected) return;

      await request(app)
        .get('/api/v1/notifications/unread-count')
        .expect(401);
    });
  });

  describe('PATCH /api/v1/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      if (!dbConnected) return;

      const notification = await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Test Notification',
        message: 'Test message',
      });

      const response = await request(app)
        .patch(`/api/v1/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isRead).toBe(true);
      expect(response.body.data.readAt).toBeDefined();

      // Verify in database
      const dbNotification = await prisma.notification.findUnique({
        where: { id: notification.id },
      });
      expect(dbNotification?.isRead).toBe(true);
    });

    it('should not mark notification as read if user does not own it', async () => {
      if (!dbConnected) return;

      const notification = await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Test Notification',
        message: 'Test message',
      });

      await request(app)
        .patch(`/api/v1/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent notification', async () => {
      if (!dbConnected) return;

      await request(app)
        .patch('/api/v1/notifications/non-existent-id/read')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      if (!dbConnected) return;

      await request(app)
        .patch('/api/v1/notifications/some-id/read')
        .expect(401);
    });
  });

  describe('PATCH /api/v1/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      if (!dbConnected) return;

      // Create multiple unread notifications
      await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Notification 1',
        message: 'Message 1',
      });

      await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Notification 2',
        message: 'Message 2',
      });

      const response = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('count');
      expect(response.body.data.count).toBeGreaterThanOrEqual(2);

      // Verify all are read
      const notifications = await prisma.notification.findMany({
        where: { userId: attendeeId },
      });
      notifications.forEach((n) => {
        expect(n.isRead).toBe(true);
      });
    });

    it('should require authentication', async () => {
      if (!dbConnected) return;

      await request(app)
        .patch('/api/v1/notifications/read-all')
        .expect(401);
    });
  });

  describe('DELETE /api/v1/notifications/:id', () => {
    it('should delete notification', async () => {
      if (!dbConnected) return;

      const notification = await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Test Notification',
        message: 'Test message',
      });

      const response = await request(app)
        .delete(`/api/v1/notifications/${notification.id}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deleted
      const dbNotification = await prisma.notification.findUnique({
        where: { id: notification.id },
      });
      expect(dbNotification).toBeNull();
    });

    it('should not delete notification if user does not own it', async () => {
      if (!dbConnected) return;

      const notification = await NotificationService.sendNotification({
        userId: attendeeId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Test Notification',
        message: 'Test message',
      });

      await request(app)
        .delete(`/api/v1/notifications/${notification.id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent notification', async () => {
      if (!dbConnected) return;

      await request(app)
        .delete('/api/v1/notifications/non-existent-id')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      if (!dbConnected) return;

      await request(app)
        .delete('/api/v1/notifications/some-id')
        .expect(401);
    });
  });

  describe('GET /api/v1/user/me/notification-preferences', () => {
    it('should get user notification preferences', async () => {
      if (!dbConnected) return;

      const response = await request(app)
        .get('/api/v1/user/me/notification-preferences')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('preferences');
      expect(response.body.data.preferences).toHaveProperty('emailEnabled');
      expect(response.body.data.preferences).toHaveProperty('smsEnabled');
      expect(response.body.data.preferences).toHaveProperty('pushEnabled');
      expect(response.body.data.preferences).toHaveProperty('inAppEnabled');
      expect(response.body.data.preferences).toHaveProperty('eventReminders');
      expect(response.body.data.preferences).toHaveProperty('eventUpdates');
    });

    it('should require authentication', async () => {
      if (!dbConnected) return;

      await request(app)
        .get('/api/v1/user/me/notification-preferences')
        .expect(401);
    });
  });

  describe('PUT /api/v1/user/me/notification-preferences', () => {
    it('should update notification preferences', async () => {
      if (!dbConnected) return;

      const response = await request(app)
        .put('/api/v1/user/me/notification-preferences')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          emailEnabled: false,
          eventReminders: false,
          eventUpdates: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.emailEnabled).toBe(false);
      expect(response.body.data.preferences.eventReminders).toBe(false);
      expect(response.body.data.preferences.eventUpdates).toBe(true);

      // Verify in database
      const preferences = await prisma.notificationPreference.findUnique({
        where: { userId: attendeeId },
      });
      expect(preferences?.emailEnabled).toBe(false);
      expect(preferences?.eventReminders).toBe(false);
      expect(preferences?.eventUpdates).toBe(true);
    });

    it('should validate SMS enabling when SMS service is disabled', async () => {
      if (!dbConnected) return;

      // Mock SMS service as disabled
      const { smsService } = await import('../src/services/sms.service.js');
      const originalIsEnabled = smsService.isEnabled;
      (smsService.isEnabled as any) = jest.fn().mockReturnValue(false);

      const response = await request(app)
        .put('/api/v1/user/me/notification-preferences')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          smsEnabled: true,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('SMS notifications are not enabled');

      // Restore original
      (smsService.isEnabled as any) = originalIsEnabled;
    });

    it('should require authentication', async () => {
      if (!dbConnected) return;

      await request(app)
        .put('/api/v1/user/me/notification-preferences')
        .send({ emailEnabled: false })
        .expect(401);
    });
  });
});


