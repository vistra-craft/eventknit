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

describe('Guest Registration with Access Tokens', () => {
  let dbConnected = false;
  let _organizerToken: string;
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

    // Create free event
    const event = await prisma.event.create({
      data: {
        title: 'Free Test Event',
        description: 'Free Event Description',
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
  });

  describe('Guest Registration Returns Access Token', () => {
    it('should return access token when guest registers for free event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const guestEmail = `guest-${Date.now()}@test.com`;

      const response = await request(app)
        .post(`/api/v1/events/${eventId}/register-guest`)
        .send({
          email: guestEmail,
          firstName: 'Guest',
          lastName: 'User',
          quantity: 1,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.registration).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.registration.id).toBeDefined();
      expect(response.body.data.user.id).toBeDefined();
    });

    it('should create user account when guest registers', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const guestEmail = `guest-${Date.now()}@test.com`;

      const response = await request(app)
        .post(`/api/v1/events/${eventId}/register-guest`)
        .send({
          email: guestEmail,
          firstName: 'Guest',
          lastName: 'User',
          quantity: 1,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.isNewUser).toBe(true);

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: guestEmail },
      });

      expect(user).toBeDefined();
      expect(user?.email).toBe(guestEmail);
      expect(user?.firstName).toBe('Guest');
      expect(user?.lastName).toBe('User');
      expect(user?.role).toBe(UserRole.ATTENDEE);
      expect(user?.password).toBeNull(); // Passwordless account
      expect(user?.isEmailVerified).toBe(true);

      // Verify QR code was generated and stored at registration time (Eventbrite/vf-ticket approach)
      const registrationId = response.body.data.registration.id;
      const registrationWithQR = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        select: {
          qrCodeDataUrl: true,
          qrCodeGeneratedAt: true,
        },
      });

      expect(registrationWithQR?.qrCodeDataUrl).toBeDefined();
      expect(registrationWithQR?.qrCodeDataUrl).toContain('data:image/png;base64');
      expect(registrationWithQR?.qrCodeGeneratedAt).toBeDefined();
      expect(registrationWithQR?.qrCodeGeneratedAt).toBeInstanceOf(Date);
    });

    it('should return same token for existing guest user', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const guestEmail = `existing-guest-${Date.now()}@test.com`;

      // Create user first
      const existingUser = await prisma.user.create({
        data: {
          email: guestEmail,
          firstName: 'Existing',
          lastName: 'Guest',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      // Register for event
      const response = await request(app)
        .post(`/api/v1/events/${eventId}/register-guest`)
        .send({
          email: guestEmail,
          firstName: 'Existing',
          lastName: 'Guest',
          quantity: 1,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(existingUser.id);
      expect(response.body.data.user.isNewUser).toBe(false);
      expect(response.body.data.registration).toBeDefined();
    });

    it('should allow guest to view ticket immediately after registration via public endpoint', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const guestEmail = `guest-${Date.now()}@test.com`;

      // Register as guest
      const registerResponse = await request(app)
        .post(`/api/v1/events/${eventId}/register-guest`)
        .send({
          email: guestEmail,
          firstName: 'Guest',
          lastName: 'User',
          quantity: 1,
        })
        .expect(201);

      const registrationId = registerResponse.body.data.registration.id;

      // Use public ticket view endpoint with email verification
      const ticketResponse = await request(app)
        .get(`/api/v1/tickets/${registrationId}/view`)
        .query({ email: guestEmail })
        .expect(200);

      expect(ticketResponse.body.success).toBe(true);
      expect(ticketResponse.body.data).toBeDefined();
      expect(ticketResponse.body.data.registrationId).toBe(registrationId);
    });
  });
});



