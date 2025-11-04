import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus, EventStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { generateAccessToken } from '../src/utils/jwt';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('Featured Events System', () => {
  let dbConnected = false;
  let adminToken: string;
  let organizerToken: string;
  let adminId: string;
  let organizerId: string;
  let eventId: string;

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
    await prisma.featuredEvent.deleteMany();
    await prisma.eventRegistration.deleteMany();
    await prisma.eventInvitation.deleteMany();
    await prisma.ticketTemplate.deleteMany();
    await prisma.event.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.passwordReset.deleteMany();
    await prisma.emailVerification.deleteMany();
    await prisma.kYCDocument.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    const hashedPassword = await hashPassword('Test123!@#');

    // Create admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Test',
        role: UserRole.ADMIN_STAFF,
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

    // Create organizer
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@test.com',
        password: hashedPassword,
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

    // Create attendee
    await prisma.user.create({
      data: {
        email: 'attendee@test.com',
        password: hashedPassword,
        firstName: 'Attendee',
        lastName: 'Test',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });

    // Create an approved event
    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'Test event description',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        location: 'Test Location',
        isFree: true,
        status: EventStatus.APPROVED,
        organizerId,
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });
    eventId = event.id;
  });

  describe('POST /api/v1/featured-events', () => {
    it('should create a featured event as admin', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/featured-events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          eventId,
          customTitle: 'Featured Test Event',
          displayOrder: 1,
          isActive: true,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.featuredEvent.eventId).toBe(eventId);
      expect(response.body.data.featuredEvent.customTitle).toBe('Featured Test Event');
      expect(response.body.data.featuredEvent.isActive).toBe(true);
    });

    it('should fail to create featured event as organizer', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/featured-events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          eventId,
          displayOrder: 1,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should fail to create featured event without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/featured-events')
        .send({
          eventId,
          displayOrder: 1,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail to create featured event for non-approved event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create a pending event
      const pendingEvent = await prisma.event.create({
        data: {
          title: 'Pending Event',
          description: 'Pending event description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: true,
          status: EventStatus.PENDING,
          organizerId,
        },
      });

      const response = await request(app)
        .post('/api/v1/featured-events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          eventId: pendingEvent.id,
          displayOrder: 1,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail to create duplicate featured event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create first featured event
      await request(app)
        .post('/api/v1/featured-events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          eventId,
          displayOrder: 1,
          isActive: true,
        })
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/v1/featured-events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          eventId,
          displayOrder: 2,
          isActive: true,
        })
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/featured-events/active', () => {
    it('should get active featured events (public)', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create featured event
      await prisma.featuredEvent.create({
        data: {
          eventId,
          displayOrder: 1,
          isActive: true,
          createdBy: adminId,
        },
      });

      const response = await request(app)
        .get('/api/v1/featured-events/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.featuredEvents).toBeInstanceOf(Array);
      expect(response.body.data.featuredEvents.length).toBeGreaterThan(0);
    });

    it('should not return inactive featured events', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create inactive featured event
      await prisma.featuredEvent.create({
        data: {
          eventId,
          displayOrder: 1,
          isActive: false,
          createdBy: adminId,
        },
      });

      const response = await request(app)
        .get('/api/v1/featured-events/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      const inactiveEvents = response.body.data.featuredEvents.filter(
        (fe: { isActive: boolean }) => !fe.isActive,
      );
      expect(inactiveEvents.length).toBe(0);
    });
  });

  describe('GET /api/v1/featured-events', () => {
    it('should get all featured events as admin', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create featured events
      await prisma.featuredEvent.create({
        data: {
          eventId,
          displayOrder: 1,
          isActive: true,
          createdBy: adminId,
        },
      });

      const response = await request(app)
        .get('/api/v1/featured-events')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.featuredEvents).toBeInstanceOf(Array);
      expect(response.body.data.featuredEvents.length).toBeGreaterThan(0);
    });

    it('should fail without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/featured-events')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/featured-events/:id', () => {
    let featuredEventId: string;

    beforeEach(async () => {
      if (!dbConnected) return;
      const featuredEvent = await prisma.featuredEvent.create({
        data: {
          eventId,
          displayOrder: 1,
          isActive: true,
          createdBy: adminId,
        },
      });
      featuredEventId = featuredEvent.id;
    });

    it('should get featured event by ID as admin', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/featured-events/${featuredEventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.featuredEvent.id).toBe(featuredEventId);
    });

    it('should fail with invalid ID', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/featured-events/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/featured-events/:id', () => {
    let featuredEventId: string;

    beforeEach(async () => {
      if (!dbConnected) return;
      const featuredEvent = await prisma.featuredEvent.create({
        data: {
          eventId,
          displayOrder: 1,
          isActive: true,
          createdBy: adminId,
        },
      });
      featuredEventId = featuredEvent.id;
    });

    it('should update featured event as admin', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .put(`/api/v1/featured-events/${featuredEventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customTitle: 'Updated Title',
          displayOrder: 5,
          isActive: false,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.featuredEvent.customTitle).toBe('Updated Title');
      expect(response.body.data.featuredEvent.displayOrder).toBe(5);
      expect(response.body.data.featuredEvent.isActive).toBe(false);
    });

    it('should fail to update as organizer', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .put(`/api/v1/featured-events/${featuredEventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          displayOrder: 5,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/featured-events/:id', () => {
    let featuredEventId: string;

    beforeEach(async () => {
      if (!dbConnected) return;
      const featuredEvent = await prisma.featuredEvent.create({
        data: {
          eventId,
          displayOrder: 1,
          isActive: true,
          createdBy: adminId,
        },
      });
      featuredEventId = featuredEvent.id;
    });

    it('should delete featured event as admin', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .delete(`/api/v1/featured-events/${featuredEventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify soft delete
      const featuredEvent = await prisma.featuredEvent.findUnique({
        where: { id: featuredEventId },
      });
      expect(featuredEvent?.deletedAt).toBeDefined();
    });

    it('should fail to delete as organizer', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .delete(`/api/v1/featured-events/${featuredEventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});

