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

describe('Pagination Tests', () => {
  let dbConnected = false;
  let organizerToken: string;
  let attendeeToken: string;
  let organizerId: string;
  let attendeeId: string;

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
    await prisma.magicLinkToken.deleteMany();
    await prisma.passwordReset.deleteMany();
    await prisma.emailVerification.deleteMany();
    await prisma.kYCDocument.deleteMany();
    await prisma.user.deleteMany();

    // Create organizer
    const organizerPassword = await hashPassword('Organizer123!@#');
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@test.com',
        password: organizerPassword,
        firstName: 'Event',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Events Inc',
        businessEmail: 'business@testevents.com',
      },
    });
    organizerId = organizer.id;
    organizerToken = generateAccessToken({
      userId: organizer.id,
      email: organizer.email,
      role: organizer.role,
    });

    // Create attendee
    const attendeePassword = await hashPassword('Attendee123!@#');
    const attendee = await prisma.user.create({
      data: {
        email: 'attendee@test.com',
        password: attendeePassword,
        firstName: 'Event',
        lastName: 'Attendee',
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
  });

  describe('GET /api/v1/organizer/events - Pagination', () => {
    beforeEach(async () => {
      if (!dbConnected) return;

      // Create 15 events for pagination testing
      for (let i = 1; i <= 15; i++) {
        await prisma.event.create({
          data: {
            title: `Organizer Event ${i}`,
            description: `Description ${i}`,
            startDate: new Date(Date.now() + (i * 7) * 24 * 60 * 60 * 1000),
            location: `Location ${i}`,
            isFree: true,
            organizerId,
            status: EventStatus.APPROVED,
          },
        });
      }
    });

    it('should support page and limit parameters', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/organizer/events?page=1&limit=5')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events.length).toBeLessThanOrEqual(5);
      expect(response.body.data).toHaveProperty('page', 1);
      expect(response.body.data).toHaveProperty('limit', 5);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('totalPages');
      expect(response.body.data).toHaveProperty('hasMore');
      expect(response.body.data.total).toBeGreaterThanOrEqual(15);
      expect(response.body.data.totalPages).toBeGreaterThanOrEqual(3);
    });

    it('should return different results for different pages', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const page1Response = await request(app)
        .get('/api/v1/organizer/events?page=1&limit=5')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      const page2Response = await request(app)
        .get('/api/v1/organizer/events?page=2&limit=5')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(page1Response.body.success).toBe(true);
      expect(page2Response.body.success).toBe(true);

      // Verify different pages return different events
      const page1Ids = page1Response.body.data.events.map((e: { id: string }) => e.id);
      const page2Ids = page2Response.body.data.events.map((e: { id: string }) => e.id);
      const intersection = page1Ids.filter((id: string) => page2Ids.includes(id));
      expect(intersection.length).toBe(0); // No overlap between pages
    });

    it('should calculate hasMore correctly', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const page1Response = await request(app)
        .get('/api/v1/organizer/events?page=1&limit=5')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(page1Response.body.data.hasMore).toBe(true); // Should have more pages

      const lastPageResponse = await request(app)
        .get(`/api/v1/organizer/events?page=${page1Response.body.data.totalPages}&limit=5`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(lastPageResponse.body.data.hasMore).toBe(false); // Last page should not have more
    });

    it('should support offset for backward compatibility', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const pageResponse = await request(app)
        .get('/api/v1/organizer/events?page=2&limit=5')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      const offsetResponse = await request(app)
        .get('/api/v1/organizer/events?offset=5&limit=5')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      // Both should return the same results (page 2 = offset 5 with limit 5)
      expect(pageResponse.body.data.events.length).toBe(offsetResponse.body.data.events.length);
      const pageIds = pageResponse.body.data.events.map((e: { id: string }) => e.id);
      const offsetIds = offsetResponse.body.data.events.map((e: { id: string }) => e.id);
      expect(pageIds).toEqual(offsetIds);
    });
  });

  describe('GET /api/v1/events - Pagination', () => {
    beforeEach(async () => {
      if (!dbConnected) return;

      // Create 20 events for pagination testing
      for (let i = 1; i <= 20; i++) {
        await prisma.event.create({
          data: {
            title: `Public Event ${i}`,
            description: `Description ${i}`,
            startDate: new Date(Date.now() + (i * 7) * 24 * 60 * 60 * 1000),
            location: `Location ${i}`,
            isFree: true,
            organizerId,
            status: EventStatus.APPROVED,
          },
        });
      }
    });

    it('should support page and limit parameters', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/events?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events.length).toBeLessThanOrEqual(10);
      expect(response.body.data).toHaveProperty('page', 1);
      expect(response.body.data).toHaveProperty('limit', 10);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('totalPages');
      expect(response.body.data.total).toBeGreaterThanOrEqual(20);
      expect(response.body.data.totalPages).toBeGreaterThanOrEqual(2);
    });

    it('should support offset for backward compatibility', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const pageResponse = await request(app)
        .get('/api/v1/events?page=2&limit=10')
        .expect(200);

      const offsetResponse = await request(app)
        .get('/api/v1/events?offset=10&limit=10')
        .expect(200);

      // Both should return the same results
      expect(pageResponse.body.data.events.length).toBe(offsetResponse.body.data.events.length);
    });
  });

  describe('GET /api/v1/events/user/registered - Pagination', () => {
    beforeEach(async () => {
      if (!dbConnected) return;

      // Create 10 events and register attendee for all of them
      for (let i = 1; i <= 10; i++) {
        const event = await prisma.event.create({
          data: {
            title: `Registered Event ${i}`,
            description: `Description ${i}`,
            startDate: new Date(Date.now() + (i * 7) * 24 * 60 * 60 * 1000),
            location: `Location ${i}`,
            isFree: true,
            organizerId,
            status: EventStatus.APPROVED,
          },
        });

        await prisma.eventRegistration.create({
          data: {
            eventId: event.id,
            attendeeId,
            quantity: 1,
            totalAmount: 0,
            status: 'CONFIRMED',
            paymentStatus: 'COMPLETED',
          },
        });
      }
    });

    it('should support page and limit parameters', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/events/user/registered?page=1&limit=5')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events.length).toBeLessThanOrEqual(5);
      expect(response.body.data).toHaveProperty('page', 1);
      expect(response.body.data).toHaveProperty('limit', 5);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('totalPages');
      expect(response.body.data).toHaveProperty('hasMore');
      expect(response.body.data.total).toBeGreaterThanOrEqual(10);
      expect(response.body.data.totalPages).toBeGreaterThanOrEqual(2);
    });

    it('should calculate hasMore correctly', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const page1Response = await request(app)
        .get('/api/v1/events/user/registered?page=1&limit=5')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(page1Response.body.data.hasMore).toBe(true);

      const lastPageResponse = await request(app)
        .get(`/api/v1/events/user/registered?page=${page1Response.body.data.totalPages}&limit=5`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(lastPageResponse.body.data.hasMore).toBe(false);
    });
  });
});

