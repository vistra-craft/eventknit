import { BulkMessageService } from '../src/services/bulk-message.service';
import { prisma } from '../src/config/database';
import {
  UserRole,
  UserStatus,
  EventStatus,
  BulkMessageStatus,
  BulkMessageTargetAudience,
} from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('BulkMessageService', () => {
  let dbConnected = false;
  let organizerId: string;
  let _attendeeId: string;
  let adminId: string;
  let _eventId: string;

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
      await tx.bulkMessage.deleteMany();
      await tx.notification.deleteMany();
      await tx.eventRegistration.deleteMany();
      await tx.event.deleteMany();
      await tx.auditLog.deleteMany();
      await tx.refreshToken.deleteMany();
      await tx.magicLinkToken.deleteMany();
      await tx.passwordReset.deleteMany();
      await tx.emailVerification.deleteMany();
      await tx.kYCDocument.deleteMany();
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
        emailVerifiedAt: new Date(),
      },
    });
    organizerId = organizer.id;

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
    _attendeeId = attendee.id;

    // Create test admin
    const admin = await prisma.user.create({
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
    adminId = admin.id;

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
  });

  describe('createBulkMessage', () => {
    it('should create a bulk message', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      const message = await BulkMessageService.createBulkMessage(
        {
          title: 'Test Bulk Message',
          content: 'This is a test bulk message',
          type: 'announcement',
          targetAudience: BulkMessageTargetAudience.ALL,
        },
        adminId,
      );

      expect(message).toBeDefined();
      expect(message.id).toBeDefined();
      expect(message.title).toBe('Test Bulk Message');
      expect(message.content).toBe('This is a test bulk message');
      expect(message.type).toBe('announcement');
      expect(message.targetAudience).toBe(BulkMessageTargetAudience.ALL);
      expect(message.status).toBe(BulkMessageStatus.DRAFT);
      expect(message.createdBy).toBe(adminId);
      expect(message.totalRecipients).toBeGreaterThanOrEqual(0);
    });

    it('should create scheduled bulk message', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      const message = await BulkMessageService.createBulkMessage(
        {
          title: 'Scheduled Message',
          content: 'This is scheduled',
          type: 'announcement',
          targetAudience: BulkMessageTargetAudience.ALL,
          scheduledAt,
        },
        adminId,
      );

      expect(message.status).toBe(BulkMessageStatus.SCHEDULED);
      expect(message.scheduledAt).toBeDefined();
    });

    it('should validate event exists when targeting specific event', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      await expect(
        BulkMessageService.createBulkMessage(
          {
            title: 'Test',
            content: 'Test',
            type: 'announcement',
            targetAudience: BulkMessageTargetAudience.SPECIFIC_EVENT,
            eventId: 'non-existent-id',
          },
          adminId,
        ),
      ).rejects.toThrow();
    });

    it('should require eventId for specific event target audience', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      await expect(
        BulkMessageService.createBulkMessage(
          {
            title: 'Test',
            content: 'Test',
            type: 'announcement',
            targetAudience: BulkMessageTargetAudience.SPECIFIC_EVENT,
          },
          adminId,
        ),
      ).rejects.toThrow();
    });

    it('should force SMS to be disabled in channels', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      const message = await BulkMessageService.createBulkMessage(
        {
          title: 'Test',
          content: 'Test',
          type: 'announcement',
          targetAudience: BulkMessageTargetAudience.ALL,
          channels: {
            email: true,
            sms: true, // Try to enable SMS
            push: true,
            inApp: true,
          },
        },
        adminId,
      );

      const channels = message.channels as any;
      expect(channels.sms).toBe(false);
    });
  });

  describe('getBulkMessages', () => {
    it('should retrieve bulk messages', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      // Create some bulk messages
      await BulkMessageService.createBulkMessage(
        {
          title: 'Message 1',
          content: 'Content 1',
          type: 'announcement',
          targetAudience: BulkMessageTargetAudience.ALL,
        },
        adminId,
      );

      await BulkMessageService.createBulkMessage(
        {
          title: 'Message 2',
          content: 'Content 2',
          type: 'marketing',
          targetAudience: BulkMessageTargetAudience.ORGANIZERS,
        },
        adminId,
      );

      const messages = await BulkMessageService.getBulkMessages();

      expect(messages.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter messages by status', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      // Create messages with different statuses
      await BulkMessageService.createBulkMessage(
        {
          title: 'Draft Message',
          content: 'Draft',
          type: 'announcement',
          targetAudience: BulkMessageTargetAudience.ALL,
        },
        adminId,
      );

      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await BulkMessageService.createBulkMessage(
        {
          title: 'Scheduled Message',
          content: 'Scheduled',
          type: 'announcement',
          targetAudience: BulkMessageTargetAudience.ALL,
          scheduledAt,
        },
        adminId,
      );

      const draftMessages = await BulkMessageService.getBulkMessages({
        status: BulkMessageStatus.DRAFT,
      });

      expect(draftMessages.every((m) => m.status === BulkMessageStatus.DRAFT)).toBe(true);
    });
  });

  describe('updateBulkMessage', () => {
    it('should update bulk message', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      const message = await BulkMessageService.createBulkMessage(
        {
          title: 'Original Title',
          content: 'Original Content',
          type: 'announcement',
          targetAudience: BulkMessageTargetAudience.ALL,
        },
        adminId,
      );

      const updated = await BulkMessageService.updateBulkMessage(
        message.id,
        {
          title: 'Updated Title',
          content: 'Updated Content',
        },
        adminId,
      );

      expect(updated.title).toBe('Updated Title');
      expect(updated.content).toBe('Updated Content');
    });

    it('should not update sent messages', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      const message = await BulkMessageService.createBulkMessage(
        {
          title: 'Test',
          content: 'Test',
          type: 'announcement',
          targetAudience: BulkMessageTargetAudience.ALL,
        },
        adminId,
      );

      // Mark as sent
      await prisma.bulkMessage.update({
        where: { id: message.id },
        data: { status: BulkMessageStatus.SENT },
      });

      await expect(
        BulkMessageService.updateBulkMessage(
          message.id,
          {
            title: 'Updated',
          },
          adminId,
        ),
      ).rejects.toThrow();
    });
  });

  describe('sendBulkMessage', () => {
    it('should send bulk message to all users', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      const message = await BulkMessageService.createBulkMessage(
        {
          title: 'Test Message',
          content: 'Test Content',
          type: 'announcement',
          targetAudience: BulkMessageTargetAudience.ALL,
        },
        adminId,
      );

      const sent = await BulkMessageService.sendBulkMessage(message.id);

      expect(sent.status).toBe(BulkMessageStatus.SENT);
      expect(sent.sentAt).toBeDefined();
      expect(sent.sentCount).toBeGreaterThanOrEqual(0);
    });

    it('should not send already sent messages', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      const message = await BulkMessageService.createBulkMessage(
        {
          title: 'Test',
          content: 'Test',
          type: 'announcement',
          targetAudience: BulkMessageTargetAudience.ALL,
        },
        adminId,
      );

      // Mark as sent
      await prisma.bulkMessage.update({
        where: { id: message.id },
        data: { status: BulkMessageStatus.SENT },
      });

      await expect(BulkMessageService.sendBulkMessage(message.id)).rejects.toThrow();
    });
  });

  describe('deleteBulkMessage', () => {
    it('should delete bulk message', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      const message = await BulkMessageService.createBulkMessage(
        {
          title: 'Test',
          content: 'Test',
          type: 'announcement',
          targetAudience: BulkMessageTargetAudience.ALL,
        },
        adminId,
      );

      await BulkMessageService.deleteBulkMessage(message.id, adminId);

      const deleted = await prisma.bulkMessage.findUnique({
        where: { id: message.id },
      });

      expect(deleted).toBeNull();
    });

    it('should not delete sent messages', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      const message = await BulkMessageService.createBulkMessage(
        {
          title: 'Test',
          content: 'Test',
          type: 'announcement',
          targetAudience: BulkMessageTargetAudience.ALL,
        },
        adminId,
      );

      // Mark as sent
      await prisma.bulkMessage.update({
        where: { id: message.id },
        data: { status: BulkMessageStatus.SENT },
      });

      await expect(
        BulkMessageService.deleteBulkMessage(message.id, adminId),
      ).rejects.toThrow();
    });
  });
});

