import request from 'supertest';
import app from '../src/app';
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
import { generateAccessToken } from '../src/utils/jwt';
import { cleanupTestData } from './test-helpers';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('Bulk Message API', () => {
  let dbConnected = false;
  let adminToken: string;
  let organizerToken: string;
  let adminId: string;
  let organizerId: string;
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
      await cleanupTestData(tx);
    });

    // Create test admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: await hashPassword('password123'),
        firstName: 'Admin',
        lastName: 'Test',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    adminId = admin.id;
    adminToken = generateAccessToken({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
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
      },
    });
    organizerId = organizer.id;
    organizerToken = generateAccessToken({
      userId: organizer.id,
      email: organizer.email,
      role: organizer.role,
    });

    // Create test attendee (not used in tests but may be needed for future tests)
    await prisma.user.create({
      data: {
        email: 'attendee@test.com',
        password: await hashPassword('password123'),
        firstName: 'Attendee',
        lastName: 'Test',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });

    // Create test event
    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'Test Description',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Test Location',
        organizerId,
        status: EventStatus.APPROVED,
        isFree: true,
      },
    });
    _eventId = event.id;
  });

  describe('POST /api/v1/admin/communications/bulk-messages', () => {
    it('should create a bulk message', async () => {
      if (!dbConnected) return;

      const messageData = {
        title: 'Test Bulk Message',
        content: 'This is a test bulk message',
        type: 'announcement',
        targetAudience: BulkMessageTargetAudience.ALL,
        channels: {
          email: true,
          sms: false,
          push: false,
          inApp: true,
        },
      };

      const response = await request(app)
        .post('/api/v1/admin/communications/bulk-messages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(messageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toHaveProperty('id');
      expect(response.body.data.message.title).toBe(messageData.title);
      expect(response.body.data.message.status).toBe(BulkMessageStatus.DRAFT);
    });

    it('should require ADMIN+ role', async () => {
      if (!dbConnected) return;

      const messageData = {
        title: 'Test Bulk Message',
        content: 'This is a test bulk message',
        type: 'announcement',
        targetAudience: BulkMessageTargetAudience.ALL,
      };

      await request(app)
        .post('/api/v1/admin/communications/bulk-messages')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(messageData)
        .expect(403);
    });

    it('should require authentication', async () => {
      if (!dbConnected) return;

      await request(app)
        .post('/api/v1/admin/communications/bulk-messages')
        .send({})
        .expect(401);
    });

    it('should validate required fields', async () => {
      if (!dbConnected) return;

      const response = await request(app)
        .post('/api/v1/admin/communications/bulk-messages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/admin/communications/bulk-messages', () => {
    it('should get bulk messages', async () => {
      if (!dbConnected) return;

      // Create a bulk message
      const { BulkMessageService } = await import('../src/services/bulk-message.service.js');
      await BulkMessageService.createBulkMessage(
        {
          title: 'Test Message',
          content: 'Test content',
          type: 'announcement',
          targetAudience: BulkMessageTargetAudience.ALL,
        },
        adminId,
      );

      const response = await request(app)
        .get('/api/v1/admin/communications/bulk-messages')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toBeDefined();
      expect(Array.isArray(response.body.data.messages)).toBe(true);
      expect(response.body.data.messages.length).toBeGreaterThan(0);
    });

    it('should require ADMIN+ role', async () => {
      if (!dbConnected) return;

      // Create a temporary attendee token for this test
      const attendee = await prisma.user.create({
        data: {
          email: 'testattendee@test.com',
          password: await hashPassword('password123'),
          firstName: 'Test',
          lastName: 'Attendee',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });
      const attendeeToken = generateAccessToken({
        userId: attendee.id,
        email: attendee.email,
        role: attendee.role,
      });

      await request(app)
        .get('/api/v1/admin/communications/bulk-messages')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/admin/communications/bulk-messages/:id', () => {
    it('should get bulk message by id', async () => {
      if (!dbConnected) return;

      const { BulkMessageService } = await import('../src/services/bulk-message.service.js');
      const message = await BulkMessageService.createBulkMessage(
        {
          title: 'Test Message',
          content: 'Test content',
          type: 'announcement',
          targetAudience: BulkMessageTargetAudience.ALL,
        },
        adminId,
      );

      const response = await request(app)
        .get(`/api/v1/admin/communications/bulk-messages/${message.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message.id).toBe(message.id);
      expect(response.body.data.message.title).toBe('Test Message');
    });

    it('should return 404 for non-existent message', async () => {
      if (!dbConnected) return;

      await request(app)
        .get('/api/v1/admin/communications/bulk-messages/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/admin/communications/bulk-messages/:id', () => {
    it('should update bulk message', async () => {
      if (!dbConnected) return;

      const { BulkMessageService } = await import('../src/services/bulk-message.service.js');
      const message = await BulkMessageService.createBulkMessage(
        {
          title: 'Original Title',
          content: 'Original content',
          type: 'announcement',
          targetAudience: BulkMessageTargetAudience.ALL,
        },
        adminId,
      );

      const response = await request(app)
        .put(`/api/v1/admin/communications/bulk-messages/${message.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Title',
          content: 'Updated content',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message.title).toBe('Updated Title');
      expect(response.body.data.message.content).toBe('Updated content');
    });
  });

  describe('DELETE /api/v1/admin/communications/bulk-messages/:id', () => {
    it('should delete bulk message', async () => {
      if (!dbConnected) return;

      const { BulkMessageService } = await import('../src/services/bulk-message.service.js');
      const message = await BulkMessageService.createBulkMessage(
        {
          title: 'Test Message',
          content: 'Test content',
          type: 'announcement',
          targetAudience: BulkMessageTargetAudience.ALL,
        },
        adminId,
      );

      const response = await request(app)
        .delete(`/api/v1/admin/communications/bulk-messages/${message.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deleted
      const dbMessage = await prisma.bulkMessage.findUnique({
        where: { id: message.id },
      });
      expect(dbMessage).toBeNull();
    });
  });

  describe('POST /api/v1/admin/communications/bulk-messages/:id/send', () => {
    it('should send bulk message', async () => {
      if (!dbConnected) return;

      const { BulkMessageService } = await import('../src/services/bulk-message.service.js');
      const message = await BulkMessageService.createBulkMessage(
        {
          title: 'Test Message',
          content: 'Test content',
          type: 'announcement',
          targetAudience: BulkMessageTargetAudience.ALL,
        },
        adminId,
      );

      const response = await request(app)
        .post(`/api/v1/admin/communications/bulk-messages/${message.id}/send`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // The service sends synchronously, so status will be SENT after completion
      expect(response.body.data.message.status).toBe(BulkMessageStatus.SENT);
    });
  });

  describe('POST /api/v1/admin/communications/bulk-messages/:id/cancel', () => {
    it('should cancel scheduled bulk message', async () => {
      if (!dbConnected) return;

      const { BulkMessageService } = await import('../src/services/bulk-message.service.js');
      const message = await BulkMessageService.createBulkMessage(
        {
          title: 'Test Message',
          content: 'Test content',
          type: 'announcement',
          targetAudience: BulkMessageTargetAudience.ALL,
        },
        adminId,
      );

      // Schedule it first by updating with scheduledAt
      await BulkMessageService.updateBulkMessage(
        message.id,
        {
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        adminId,
      );

      const response = await request(app)
        .post(`/api/v1/admin/communications/bulk-messages/${message.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message.status).toBe(BulkMessageStatus.CANCELLED);
    });
  });
});

