import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus, EventStatus, DataAccessLevel } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { generateAccessToken } from '../src/utils/jwt';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('Organizer Data Access Control', () => {
  let dbConnected = false;
  let organizerToken: string;
  let adminToken: string;
  let organizerId: string;
  let adminId: string;
  let event1Id: string;
  let event2Id: string;
  let event3Id: string;
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

    // Create test users
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
        isIdentityVerified: true,
        identityVerifiedAt: new Date(),
        verificationLevel: 2,
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
    attendeeId = attendee.id;

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

    // Create test events with different access levels
    const event1 = await prisma.event.create({
      data: {
        title: 'Event 1 - Restricted',
        description: 'Test event with restricted access',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Test Location',
        isFree: false,
        price: 50,
        organizerId,
        status: EventStatus.APPROVED,
        organizerDataAccess: DataAccessLevel.RESTRICTED,
      },
    });
    event1Id = event1.id;

    const event2 = await prisma.event.create({
      data: {
        title: 'Event 2 - Standard',
        description: 'Test event with standard access',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Test Location',
        isFree: false,
        price: 75,
        organizerId,
        status: EventStatus.APPROVED,
        organizerDataAccess: DataAccessLevel.STANDARD,
      },
    });
    event2Id = event2.id;

    const event3 = await prisma.event.create({
      data: {
        title: 'Event 3 - Full',
        description: 'Test event with full access',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Test Location',
        isFree: false,
        price: 100,
        organizerId,
        status: EventStatus.APPROVED,
        organizerDataAccess: DataAccessLevel.FULL,
      },
    });
    event3Id = event3.id;

    // Create registrations with payment data
    await prisma.eventRegistration.createMany({
      data: [
        {
          eventId: event1Id,
          attendeeId,
          quantity: 1,
          totalAmount: 50,
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
          paymentMethod: 'CARD',
          paymentTransactionId: 'txn_123456',
        },
        {
          eventId: event2Id,
          attendeeId,
          quantity: 1,
          totalAmount: 75,
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
          paymentMethod: 'CARD',
          paymentTransactionId: 'txn_789012',
        },
        {
          eventId: event3Id,
          attendeeId,
          quantity: 1,
          totalAmount: 100,
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
          paymentMethod: 'CARD',
          paymentTransactionId: 'txn_345678',
        },
      ],
    });
  });

  describe('PUT /api/v1/events/:id/organizer-data-access', () => {
    it('should update organizer data access level successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .put(`/api/v1/events/${event1Id}/organizer-data-access`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ dataAccessLevel: 'STANDARD' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event.organizerDataAccess).toBe('STANDARD');

      // Verify in database
      const event = await prisma.event.findUnique({
        where: { id: event1Id },
        select: {
          organizerDataAccess: true,
        },
      });
      expect(event?.organizerDataAccess).toBe(DataAccessLevel.STANDARD);
    });

    it('should fail without admin role', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .put(`/api/v1/events/${event1Id}/organizer-data-access`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ dataAccessLevel: 'STANDARD' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .put(`/api/v1/events/${event1Id}/organizer-data-access`)
        .send({ dataAccessLevel: 'STANDARD' })
        .expect(401);
    });

    it('should fail with invalid access level', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .put(`/api/v1/events/${event1Id}/organizer-data-access`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ dataAccessLevel: 'INVALID' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Valid dataAccessLevel is required');
    });

    it('should fail for non-existent event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .put('/api/v1/events/non-existent-id/organizer-data-access')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ dataAccessLevel: 'STANDARD' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should create audit log on update', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .put(`/api/v1/events/${event1Id}/organizer-data-access`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ dataAccessLevel: 'FULL' })
        .expect(200);

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: adminId,
          entity: 'Event',
          entityId: event1Id,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.action).toBe('EVENT_UPDATED');
      const metadata = auditLog?.metadata as Record<string, unknown> | null;
      expect(metadata).toHaveProperty('field', 'organizerDataAccess');
    });
  });

  describe('PUT /api/v1/events/bulk/organizer-data-access', () => {
    it('should bulk update organizer data access level successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .put('/api/v1/events/bulk/organizer-data-access')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          eventIds: [event1Id, event2Id],
          dataAccessLevel: 'FULL',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updatedCount).toBe(2);
      expect(response.body.data.eventIds).toHaveLength(2);

      // Verify in database
      const events = await prisma.event.findMany({
        where: { id: { in: [event1Id, event2Id] } },
        select: {
          id: true,
          organizerDataAccess: true,
        },
      });
      expect(events[0].organizerDataAccess).toBe(DataAccessLevel.FULL);
      expect(events[1].organizerDataAccess).toBe(DataAccessLevel.FULL);
    });

    it('should fail without admin role', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .put('/api/v1/events/bulk/organizer-data-access')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          eventIds: [event1Id, event2Id],
          dataAccessLevel: 'STANDARD',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .put('/api/v1/events/bulk/organizer-data-access')
        .send({
          eventIds: [event1Id, event2Id],
          dataAccessLevel: 'STANDARD',
        })
        .expect(401);
    });

    it('should fail with empty eventIds array', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .put('/api/v1/events/bulk/organizer-data-access')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          eventIds: [],
          dataAccessLevel: 'STANDARD',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('eventIds array is required');
    });

    it('should fail with invalid access level', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .put('/api/v1/events/bulk/organizer-data-access')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          eventIds: [event1Id],
          dataAccessLevel: 'INVALID',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Valid dataAccessLevel is required');
    });

    it('should fail with non-existent event IDs', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .put('/api/v1/events/bulk/organizer-data-access')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          eventIds: [event1Id, 'non-existent-id'],
          dataAccessLevel: 'STANDARD',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Events not found');
      // Error message includes missing IDs: "Events not found: non-existent-id"
    });

    it('should create audit logs for each event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .put('/api/v1/events/bulk/organizer-data-access')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          eventIds: [event1Id, event2Id],
          dataAccessLevel: 'STANDARD',
        })
        .expect(200);

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          userId: adminId,
          entity: 'Event',
          entityId: { in: [event1Id, event2Id] },
        },
        orderBy: { createdAt: 'desc' },
        take: 2,
      });

      expect(auditLogs.length).toBeGreaterThanOrEqual(2);
      auditLogs.forEach(log => {
        const metadata = log.metadata as Record<string, unknown> | null;
        expect(metadata).toHaveProperty('bulkUpdate', true);
        expect(metadata).toHaveProperty('field', 'organizerDataAccess');
      });
    });
  });

  describe('GET /api/v1/events/:id/registrations - Data Access Filtering', () => {
    it('should filter data for RESTRICTED access level', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Get registrations as organizer (should be filtered)
      const response = await request(app)
        .get(`/api/v1/events/${event1Id}/registrations`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const registrations = response.body.data.registrations;
      expect(registrations.length).toBeGreaterThan(0);

      // RESTRICTED: Should not have payment data
      const registration = registrations[0];
      expect(registration).not.toHaveProperty('totalAmount');
      expect(registration).not.toHaveProperty('paymentStatus');
      expect(registration).not.toHaveProperty('paymentMethod');
      expect(registration).not.toHaveProperty('paymentTransactionId');
    });

    it('should include payment summaries for STANDARD access level', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Get registrations as organizer (should be filtered)
      const response = await request(app)
        .get(`/api/v1/events/${event2Id}/registrations`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const registrations = response.body.data.registrations;
      expect(registrations.length).toBeGreaterThan(0);

      // STANDARD: Should have payment data but NO transaction IDs
      const registration = registrations[0];
      expect(registration).toHaveProperty('totalAmount');
      expect(registration).toHaveProperty('paymentStatus');
      expect(registration).toHaveProperty('paymentMethod');
      expect(registration).not.toHaveProperty('paymentTransactionId');
    });

    it('should include all payment details except transaction IDs for FULL access level', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Get registrations as organizer (should be filtered)
      const response = await request(app)
        .get(`/api/v1/events/${event3Id}/registrations`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const registrations = response.body.data.registrations;
      expect(registrations.length).toBeGreaterThan(0);

      // FULL: Should have all payment data but NO transaction IDs
      const registration = registrations[0];
      expect(registration).toHaveProperty('totalAmount');
      expect(registration).toHaveProperty('paymentStatus');
      expect(registration).toHaveProperty('paymentMethod');
      expect(registration).not.toHaveProperty('paymentTransactionId');
    });

    it('should show all data including transaction IDs for admin', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Get registrations as admin (should see everything)
      const response = await request(app)
        .get(`/api/v1/events/${event1Id}/registrations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const registrations = response.body.data.registrations;
      expect(registrations.length).toBeGreaterThan(0);

      // Admin: Should see everything including transaction IDs
      const registration = registrations[0];
      expect(registration).toHaveProperty('totalAmount');
      expect(registration).toHaveProperty('paymentStatus');
      expect(registration).toHaveProperty('paymentMethod');
      expect(registration).toHaveProperty('paymentTransactionId');
    });
  });
});

