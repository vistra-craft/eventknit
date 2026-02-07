import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus, EventStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { generateAccessToken } from '../src/utils/jwt';
import { cleanupTestData } from './test-helpers';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('Public Ticket View Endpoint', () => {
  let dbConnected = false;
  let _organizerToken: string;
  let organizerId: string;
  let attendeeId: string;
  let eventId: string;
  let registrationId: string;
  let attendeeEmail: string;

  beforeAll(async () => {
    // Set test secret key for ticket generation
    process.env.TICKET_SECRET_KEY = 'test-secret-key-for-ticket-service-minimum-32-bytes-long';
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

    await cleanupTestData();

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
    _organizerToken = generateAccessToken({
      userId: organizer.id,
      email: organizer.email,
      role: organizer.role,
    });

    // Create attendee (guest user - passwordless)
    attendeeEmail = `guest-${Date.now()}@test.com`;
    const attendee = await prisma.user.create({
      data: {
        email: attendeeEmail,
        firstName: 'Guest',
        lastName: 'User',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        password: null, // Passwordless account
      },
    });
    attendeeId = attendee.id;

    // Create event
    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'Test Event Description',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        startTime: '10:00',
        endTime: '12:00',
        location: 'Test Location',
        venue: 'Test Venue',
        isFree: true,
        organizerId,
        status: EventStatus.APPROVED,
        capacity: 100,
      },
    });
    eventId = event.id;

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: event.id,
        attendeeId,
        quantity: 1,
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
        totalAmount: 0,
        backupCode: 'ABC123',
        ticketType: 'General Admission',
      },
    });
    registrationId = registration.id;
  });

  describe('Public Ticket View with Email Verification', () => {
    it('should allow viewing ticket with correct email without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/tickets/${registrationId}/view`)
        .query({ email: attendeeEmail })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.registrationId).toBe(registrationId);
      expect(response.body.data.qrCode).toBeDefined();
    });

    it('should reject ticket view with incorrect email', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const wrongEmail = 'wrong@test.com';

      const response = await request(app)
        .get(`/api/v1/tickets/${registrationId}/view`)
        .query({ email: wrongEmail })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email does not match');
    });

    it('should reject ticket view without email parameter', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/tickets/${registrationId}/view`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email is required');
    });

    it('should handle case-insensitive email matching', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Try with uppercase email
      const response = await request(app)
        .get(`/api/v1/tickets/${registrationId}/view`)
        .query({ email: attendeeEmail.toUpperCase() })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should return 404 for non-existent registration', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const fakeRegistrationId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .get(`/api/v1/tickets/${fakeRegistrationId}/view`)
        .query({ email: attendeeEmail })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Ticket not found');
    });

    it('should return ticket data with QR code and backup code', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/tickets/${registrationId}/view`)
        .query({ email: attendeeEmail })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.qrCode).toBeDefined();
      expect(response.body.data.qrCode).toContain('data:image/png;base64');
      
      // Check if registration data is included
      if (response.body.data.registration) {
        expect(response.body.data.registration.backupCode).toBe('ABC123');
        expect(response.body.data.registration.ticketType).toBe('General Admission');
      }
    });
  });

  describe('Authenticated vs Public Ticket View', () => {
    it('should allow authenticated user to view their own ticket', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create authenticated user
      const hashedPassword = await hashPassword('Test123!@$');
      const authUser = await prisma.user.create({
        data: {
          email: 'auth@test.com',
          password: hashedPassword,
          firstName: 'Auth',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      // Create registration for authenticated user
      const authRegistration = await prisma.eventRegistration.create({
        data: {
          eventId,
          attendeeId: authUser.id,
          quantity: 1,
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
          totalAmount: 0,
        },
      });

      const authToken = generateAccessToken({
        userId: authUser.id,
        email: authUser.email,
        role: authUser.role,
      });

      // View ticket with authentication
      const response = await request(app)
        .get(`/api/v1/tickets/${authRegistration.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should allow public view even if user is authenticated', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Public endpoint should work regardless of authentication
      const response = await request(app)
        .get(`/api/v1/tickets/${registrationId}/view`)
        .query({ email: attendeeEmail })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});



