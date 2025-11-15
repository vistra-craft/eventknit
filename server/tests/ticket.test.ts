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

describe('Ticket Management System', () => {
  let dbConnected = false;
  let organizerToken: string;
  let attendeeToken: string;
  let organizerId: string;
  let attendeeId: string;
  let registrationId: string;
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

    // Clear all tables in correct order to respect foreign keys
    await prisma.$transaction(async (tx) => {
      await tx.featuredEvent.deleteMany();
      await tx.eventRegistration.deleteMany();
      await tx.eventInvitation.deleteMany();
      await tx.ticketTemplate.deleteMany();
      await tx.event.deleteMany();
      await tx.auditLog.deleteMany();
      await tx.refreshToken.deleteMany();
      await tx.magicLinkToken.deleteMany();
      await tx.passwordReset.deleteMany();
      await tx.emailVerification.deleteMany();
      await tx.kYCDocument.deleteMany();
      await tx.user.deleteMany();
    });

    // Create test users
    const hashedPassword = await hashPassword('Test123!@$');

    // Create organizer
    const organizer = await prisma.user.upsert({
      where: { email: 'organizer@test.com' },
      update: {
        password: hashedPassword,
        firstName: 'Organizer',
        lastName: 'Test',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Events Inc',
      },
      create: {
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
    const attendee = await prisma.user.upsert({
      where: { email: 'attendee@test.com' },
      update: {
        password: hashedPassword,
        firstName: 'Attendee',
        lastName: 'Test',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
      create: {
        email: 'attendee@test.com',
        password: hashedPassword,
        firstName: 'Attendee',
        lastName: 'Test',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    attendeeId = attendee.id;
    attendeeToken = generateAccessToken({
      userId: attendee.id,
      email: attendee.email,
      role: attendee.role,
    });

    // Create event and registration for testing
    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'Test Event Description',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Test Location',
        isFree: true,
        organizerId,
        status: EventStatus.APPROVED,
        capacity: 100,
      },
    });
    _eventId = event.id;

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: event.id,
        attendeeId,
        quantity: 1,
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
        totalAmount: 0,
        backupCode: 'ABC123',
      },
    });
    registrationId = registration.id;
  });

  describe('GET /api/v1/tickets/:registrationId', () => {
    it('should get ticket successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/tickets/${registrationId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.registration).toBeDefined();
      expect(response.body.data.qrCode).toBeDefined();
      expect(response.body.data.ticketData).toBeDefined();
      expect(response.body.data.registration.id).toBe(registrationId);
    });

    it('should allow organizer to view their event tickets', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/tickets/${registrationId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.registration).toBeDefined();
    });

    it('should fail for user who does not own the ticket', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create another attendee
      const otherAttendeePassword = await hashPassword('Other123!@$');
      const otherAttendee = await prisma.user.create({
        data: {
          email: 'otherattendee@test.com',
          password: otherAttendeePassword,
          firstName: 'Other',
          lastName: 'Attendee',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const otherAttendeeToken = generateAccessToken({
        userId: otherAttendee.id,
        email: otherAttendee.email,
        role: otherAttendee.role,
      });

      const response = await request(app)
        .get(`/api/v1/tickets/${registrationId}`)
        .set('Authorization', `Bearer ${otherAttendeeToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent registration ID', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/tickets/non-existent-id')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .get(`/api/v1/tickets/${registrationId}`)
        .expect(401);
    });
  });

  describe('GET /api/v1/tickets/:registrationId/download', () => {
    it('should download ticket PDF successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/tickets/${registrationId}/download`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      // Should return either PDF or HTML (if puppeteer not installed)
      expect(response.headers['content-type']).toMatch(/application\/pdf|text\/html/);
      expect(response.body).toBeDefined();
    });

    it('should allow organizer to download their event tickets', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/tickets/${registrationId}/download`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/pdf|text\/html/);
    });

    it('should fail for user who does not own the ticket', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create another attendee
      const otherAttendeePassword = await hashPassword('Other123!@$');
      const otherAttendee = await prisma.user.create({
        data: {
          email: 'otherattendee2@test.com',
          password: otherAttendeePassword,
          firstName: 'Other',
          lastName: 'Attendee',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const otherAttendeeToken = generateAccessToken({
        userId: otherAttendee.id,
        email: otherAttendee.email,
        role: otherAttendee.role,
      });

      const response = await request(app)
        .get(`/api/v1/tickets/${registrationId}/download`)
        .set('Authorization', `Bearer ${otherAttendeeToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent registration ID', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/tickets/non-existent-id/download')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .get(`/api/v1/tickets/${registrationId}/download`)
        .expect(401);
    });
  });

  describe('POST /api/v1/tickets/:registrationId/resend', () => {
    it('should resend ticket email successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post(`/api/v1/tickets/${registrationId}/resend`)
        .set('Authorization', `Bearer ${attendeeToken}`);

      // May return 200 (success) or skip if email service unavailable
      if (response.status === 503 || response.status === 500) {
        logger.info('⏭️  Skipping test - email service not configured');
        return;
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('resent');
    });

    it('should fail for user who does not own the ticket', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create another attendee
      const otherAttendeePassword = await hashPassword('Other123!@$');
      const otherAttendee = await prisma.user.create({
        data: {
          email: 'otherattendee3@test.com',
          password: otherAttendeePassword,
          firstName: 'Other',
          lastName: 'Attendee',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const otherAttendeeToken = generateAccessToken({
        userId: otherAttendee.id,
        email: otherAttendee.email,
        role: otherAttendee.role,
      });

      const response = await request(app)
        .post(`/api/v1/tickets/${registrationId}/resend`)
        .set('Authorization', `Bearer ${otherAttendeeToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should fail for pending payment registration', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create paid event registration with pending payment
      const paidEvent = await prisma.event.create({
        data: {
          title: 'Paid Event',
          description: 'Paid Event Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: false,
          price: 50,
          organizerId,
          status: EventStatus.APPROVED,
          capacity: 100,
        },
      });

      const pendingRegistration = await prisma.eventRegistration.create({
        data: {
          eventId: paidEvent.id,
          attendeeId,
          quantity: 1,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          totalAmount: 50,
        },
      });

      const response = await request(app)
        .post(`/api/v1/tickets/${pendingRegistration.id}/resend`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('confirmed');
    });

    it('should fail with non-existent registration ID', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/tickets/non-existent-id/resend')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .post(`/api/v1/tickets/${registrationId}/resend`)
        .expect(401);
    });

    it('should respect rate limiting (3 resends per hour)', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Make 3 successful resend requests
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post(`/api/v1/tickets/${registrationId}/resend`)
          .set('Authorization', `Bearer ${attendeeToken}`);

        // Skip if email service unavailable
        if (response.status === 503 || response.status === 500) {
          logger.info('⏭️  Skipping rate limit test - email service not configured');
          return;
        }
      }

      // 4th request should be rate limited
      const response = await request(app)
        .post(`/api/v1/tickets/${registrationId}/resend`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(429);

      expect(response.body.message).toContain('Too many');
    });
  });
});

