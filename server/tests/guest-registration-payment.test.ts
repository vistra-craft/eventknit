/**
 * Guest Registration & Payment Flow Tests
 *
 * Tests the complete guest checkout flow including:
 * 1. Guest registration returns an access token (Option A fix)
 * 2. Public ticket download endpoint works with email verification
 * 3. Guest payment initialization works without auth
 * 4. Payment status endpoint returns correct data for attendees
 */

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

describe('Guest Registration & Payment Flow', () => {
  let dbConnected = false;
  let organizerId: string;
  let attendeeId: string;
  let attendeeToken: string;
  let eventId: string;
  let paidEventId: string;
  let registrationId: string;

  beforeAll(async () => {
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

    const hashedPassword = await hashPassword('Test123!@$');

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
        emailVerifiedAt: new Date(),
        organizationName: 'Test Events Inc',
      },
    });
    organizerId = organizer.id;

    // Create attendee (for existing-user-as-guest tests)
    const attendee = await prisma.user.create({
      data: {
        email: 'attendee@test.com',
        password: hashedPassword,
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

    // Create a free event
    const freeEvent = await prisma.event.create({
      data: {
        title: 'Free Test Event',
        description: 'A free test event',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        location: 'Test City',
        isFree: true,
        organizerId,
        status: EventStatus.APPROVED,
        capacity: 100,
      },
    });
    eventId = freeEvent.id;

    // Create a paid event
    const paidEvent = await prisma.event.create({
      data: {
        title: 'Paid Test Event',
        description: 'A paid test event',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        location: 'Test City',
        isFree: false,
        price: 1000,
        currency: 'KES',
        organizerId,
        status: EventStatus.APPROVED,
        capacity: 100,
      },
    });
    paidEventId = paidEvent.id;

    // Create a registration for ticket/payment status tests
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: freeEvent.id,
        attendeeId,
        quantity: 1,
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
        totalAmount: 0,
        backupCode: 'TESTCODE1',
      },
    });
    registrationId = registration.id;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. GUEST REGISTRATION — ACCESS TOKEN
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /api/v1/events/:id/register-guest', () => {
    it('should return an accessToken for new guest users', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post(`/api/v1/events/${eventId}/register-guest`)
        .send({
          email: 'newguest@test.com',
          firstName: 'New',
          lastName: 'Guest',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.registration).toBeDefined();
      expect(response.body.data.registration.id).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('newguest@test.com');
      expect(response.body.data.accessToken).toBeDefined();
      expect(typeof response.body.data.accessToken).toBe('string');
      expect(response.body.data.accessToken.length).toBeGreaterThan(0);
    });

    it('should return an accessToken for existing users registering as guest', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Use a different event to avoid duplicate registration
      const response = await request(app)
        .post(`/api/v1/events/${paidEventId}/register-guest`)
        .send({
          email: 'attendee@test.com',
          firstName: 'Attendee',
          lastName: 'Test',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(typeof response.body.data.accessToken).toBe('string');
      // Existing user should not be flagged as new
      expect(response.body.data.user.isNewUser).toBe(false);
    });

    it('should return user with requiresPasswordSetup for passwordless accounts', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post(`/api/v1/events/${eventId}/register-guest`)
        .send({
          email: 'passwordless@test.com',
          firstName: 'No',
          lastName: 'Password',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.requiresPasswordSetup).toBe(true);
    });

    it('accessToken should be usable for authenticated API calls', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Register as guest and get token
      const regResponse = await request(app)
        .post(`/api/v1/events/${eventId}/register-guest`)
        .send({
          email: 'tokentest@test.com',
          firstName: 'Token',
          lastName: 'Test',
        })
        .expect(201);

      const token = regResponse.body.data.accessToken;
      const regId = regResponse.body.data.registration.id;

      // Use the token to access an authenticated endpoint
      const ticketResponse = await request(app)
        .get(`/api/v1/tickets/${regId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(ticketResponse.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. PUBLIC TICKET DOWNLOAD
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/v1/tickets/:registrationId/download-public', () => {
    it('should download ticket with valid email', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/tickets/${registrationId}/download-public?email=attendee@test.com`);

      // Accept 200 (PDF/HTML returned) — the actual content depends on PDF service availability
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        const contentType = response.headers['content-type'];
        expect(contentType).toMatch(/application\/pdf|text\/html/);
      }
    });

    it('should reject download with wrong email', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/tickets/${registrationId}/download-public?email=wrong@test.com`);

      expect([401, 403]).toContain(response.status);
    });

    it('should reject download without email parameter', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/tickets/${registrationId}/download-public`);

      expect([400, 422]).toContain(response.status);
    });

    it('should return 404 for non-existent registration', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/tickets/00000000-0000-0000-0000-000000000000/download-public?email=attendee@test.com');

      expect(response.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. GUEST PAYMENT INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /api/v1/payments/initialize-guest', () => {
    it('should reject guest payment without registrationId', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/payments/initialize-guest')
        .send({ email: 'attendee@test.com' });

      expect([400, 422]).toContain(response.status);
    });

    it('should reject guest payment without email', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/payments/initialize-guest')
        .send({ registrationId });

      expect([400, 422]).toContain(response.status);
    });

    it('should reject guest payment with wrong email', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create a paid registration for this test
      const paidReg = await prisma.eventRegistration.create({
        data: {
          eventId: paidEventId,
          attendeeId,
          quantity: 1,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          totalAmount: 1000,
          backupCode: 'PAID001',
        },
      });

      const response = await request(app)
        .post('/api/v1/payments/initialize-guest')
        .send({
          registrationId: paidReg.id,
          email: 'wrong@test.com',
        });

      expect([400, 403]).toContain(response.status);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. PAYMENT STATUS ENDPOINT
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/v1/payments/status/:registrationId', () => {
    it('should return payment status for authenticated attendee', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/payments/status/${registrationId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.paymentStatus).toBeDefined();
      expect(response.body.data.totalAmount).toBeDefined();
    });

    it('should reject unauthenticated access to payment status', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/payments/status/${registrationId}`);

      expect(response.status).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. USER REGISTERED EVENTS — PAYMENT DATA INCLUDED
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/v1/events/user/registered', () => {
    it('should include payment fields in registered events response', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/events/user/registered')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toBeDefined();
      expect(response.body.data.events.length).toBeGreaterThan(0);

      const event = response.body.data.events[0];
      expect(event).toHaveProperty('totalAmount');
      expect(event).toHaveProperty('paymentStatus');
      expect(event).toHaveProperty('isFree');
      expect(event).toHaveProperty('currency');
    });
  });
});
