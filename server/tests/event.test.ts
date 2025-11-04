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

describe('Event System', () => {
  let dbConnected = false;
  let organizerToken: string;
  let attendeeToken: string;
  let adminToken: string;
  let organizerId: string;
  let adminId: string;

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
    await prisma.eventRegistration.deleteMany();
    await prisma.event.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.passwordReset.deleteMany();
    await prisma.emailVerification.deleteMany();
    await prisma.kYCDocument.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    const hashedPassword = await hashPassword('Test123!@#');

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
        organizationName: 'Test Events Inc',
      },
    });
    organizerId = organizer.id;
    organizerToken = generateAccessToken({
      userId: organizer.id,
      email: organizer.email,
      role: organizer.role,
    });

    // Create attendee
    const attendee = await prisma.user.create({
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
    attendeeToken = generateAccessToken({
      userId: attendee.id,
      email: attendee.email,
      role: attendee.role,
    });

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
  });

  describe('POST /api/v1/events', () => {
    it('should create a free event successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const eventData = {
        title: 'Test Free Event',
        description: 'This is a test free event',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        location: 'Test Location',
        isFree: true,
      };

      const response = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(eventData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event.title).toBe(eventData.title);
      expect(response.body.data.event.status).toBe(EventStatus.PENDING);
      expect(response.body.data.event.isFree).toBe(true);
    });

    it('should create a paid event successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const eventData = {
        title: 'Test Paid Event',
        description: 'This is a test paid event',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        isFree: false,
        price: 50.00,
      };

      const response = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(eventData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event.title).toBe(eventData.title);
      expect(response.body.data.event.isFree).toBe(false);
      expect(Number(response.body.data.event.price)).toBe(50.00);
    });

    it('should fail to create event without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const eventData = {
        title: 'Test Event',
        description: 'This is a test event',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        isFree: true,
      };

      await request(app)
        .post('/api/v1/events')
        .send(eventData)
        .expect(401);
    });

    it('should fail to create event with invalid data', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const eventData = {
        title: 'AB', // Too short
        description: 'Short', // Too short
        startDate: 'invalid-date',
        location: '',
        isFree: true,
      };

      const response = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(eventData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/events', () => {
    it('should get all events (public)', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create test events
      await prisma.event.create({
        data: {
          title: 'Event 1',
          description: 'Description 1',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location 1',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
        },
      });

      await prisma.event.create({
        data: {
          title: 'Event 2',
          description: 'Description 2',
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          location: 'Location 2',
          isFree: false,
          price: 100,
          organizerId,
          status: EventStatus.APPROVED,
        },
      });

      const response = await request(app)
        .get('/api/v1/events')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter events by status', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      await prisma.event.create({
        data: {
          title: 'Pending Event',
          description: 'Pending Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.PENDING,
        },
      });

      const response = await request(app)
        .get('/api/v1/events?status=PENDING')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events.every((e: any) => e.status === EventStatus.PENDING)).toBe(true);
    });
  });

  describe('POST /api/v1/events/:id/register', () => {
    it('should register for a free event successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create and approve an event
      const event = await prisma.event.create({
        data: {
          title: 'Free Event',
          description: 'Free Event Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
          capacity: 100,
        },
      });

      const response = await request(app)
        .post(`/api/v1/events/${event.id}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({ quantity: 1 })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.registration.status).toBe('CONFIRMED');
    });

    it('should register for a paid event (pending payment)', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create and approve a paid event
      const event = await prisma.event.create({
        data: {
          title: 'Paid Event',
          description: 'Paid Event Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: false,
          price: 50,
          organizerId,
          status: EventStatus.APPROVED,
          capacity: 100,
        },
      });

      const response = await request(app)
        .post(`/api/v1/events/${event.id}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({ quantity: 1 })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.registration.status).toBe('PENDING');
      expect(response.body.data.registration.paymentStatus).toBe('PENDING');
    });

    it('should fail to register for non-approved event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Pending Event',
          description: 'Pending Event Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.PENDING,
        },
      });

      await request(app)
        .post(`/api/v1/events/${event.id}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({ quantity: 1 })
        .expect(400);
    });
  });

  describe('POST /api/v1/events/:id/approve', () => {
    it('should approve an event successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Pending Event',
          description: 'Pending Event Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.PENDING,
        },
      });

      const response = await request(app)
        .post(`/api/v1/events/${event.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event.status).toBe(EventStatus.APPROVED);
      expect(response.body.data.event.approvedBy).toBe(adminId);
    });

    it('should fail to approve event without admin role', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Pending Event',
          description: 'Pending Event Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.PENDING,
        },
      });

      await request(app)
        .post(`/api/v1/events/${event.id}/approve`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(403);
    });
  });

  describe('POST /api/v1/events/:id/reject', () => {
    it('should reject an event successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Pending Event',
          description: 'Pending Event Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.PENDING,
        },
      });

      const response = await request(app)
        .post(`/api/v1/events/${event.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejectionReason: 'Event does not meet our guidelines' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event.status).toBe(EventStatus.REJECTED);
      expect(response.body.data.event.rejectionReason).toBe('Event does not meet our guidelines');
    });
  });
});

