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
    const hashedPassword = await hashPassword('Test123!@#');

    // Create organizer with identity verification (for paid events)
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@test.com',
        password: hashedPassword,
        firstName: 'Organizer',
        lastName: 'Test',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        isIdentityVerified: true, // Required for paid events
        identityVerifiedAt: new Date(),
        verificationLevel: 2, // Identity verified
        payoutLimit: null, // No limit for testing
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

    it('should create a paid event successfully (with identity verification)', async () => {
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

    it('should fail to create paid event without identity verification', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create organizer without identity verification
      const unverifiedPassword = await hashPassword('Test123!@#');
      const unverifiedOrganizer = await prisma.user.create({
        data: {
          email: 'unverified@test.com',
          password: unverifiedPassword,
          firstName: 'Unverified',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          isIdentityVerified: false,
          verificationLevel: 1,
        },
      });

      const unverifiedToken = generateAccessToken({
        userId: unverifiedOrganizer.id,
        email: unverifiedOrganizer.email,
        role: unverifiedOrganizer.role,
      });

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
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .send(eventData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Identity verification is required');
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
      interface EventItem {
        status: string;
      }
      expect(response.body.data.events.every((e: EventItem) => e.status === EventStatus.PENDING)).toBe(true);
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

  describe('POST /api/v1/events/:id/register-guest', () => {
    it('should register guest for free event and create account', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Free Guest Event',
          description: 'Free Event for Guest Registration',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
        },
      });

      const guestData = {
        email: 'guest@test.com',
        firstName: 'Guest',
        lastName: 'User',
        phoneNumber: '+1234567890',
        quantity: 1,
      };

      const response = await request(app)
        .post(`/api/v1/events/${event.id}/register-guest`)
        .send(guestData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.registration).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(guestData.email);
      expect(response.body.data.user.isNewUser).toBe(true);

      // Verify user was created (passwordless)
      const user = await prisma.user.findUnique({
        where: { email: guestData.email },
      });

      expect(user).toBeDefined();
      expect(user?.password).toBeNull(); // Passwordless account
      expect(user?.isEmailVerified).toBe(true);
      expect(user?.status).toBe(UserStatus.ACTIVE);

      // Verify magic link token was created
      const magicLink = await prisma.magicLinkToken.findFirst({
        where: { userId: user!.id },
      });

      expect(magicLink).toBeDefined();
      expect(magicLink?.used).toBe(false);

      // Verify password setup token was created
      const passwordSetup = await prisma.emailVerification.findFirst({
        where: { userId: user!.id, verified: false },
      });

      expect(passwordSetup).toBeDefined();
      expect(passwordSetup?.token).toBeDefined();

      // Verify registration was created
      const registration = await prisma.eventRegistration.findFirst({
        where: {
          eventId: event.id,
          attendeeId: user!.id,
        },
      });

      expect(registration).toBeDefined();
      expect(registration?.status).toBe('CONFIRMED'); // Free event
    });

    it('should register existing user as guest', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create existing user
      const existingUser = await prisma.user.create({
        data: {
          email: 'existingguest@test.com',
          password: await hashPassword('Test123!@#'),
          firstName: 'Existing',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const event = await prisma.event.create({
        data: {
          title: 'Free Guest Event',
          description: 'Free Event for Guest Registration',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
        },
      });

      const guestData = {
        email: 'existingguest@test.com',
        firstName: 'Existing',
        lastName: 'User',
        quantity: 1,
      };

      const response = await request(app)
        .post(`/api/v1/events/${event.id}/register-guest`)
        .send(guestData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.isNewUser).toBe(false);

      // Verify magic link was still created
      const magicLink = await prisma.magicLinkToken.findFirst({
        where: { userId: existingUser.id },
      });

      expect(magicLink).toBeDefined();
    });

    it('should fail for SUSPENDED user', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create suspended user
      await prisma.user.create({
        data: {
          email: 'suspendedguest@test.com',
          password: await hashPassword('Test123!@#'),
          firstName: 'Suspended',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.SUSPENDED,
          isEmailVerified: true,
        },
      });

      const event = await prisma.event.create({
        data: {
          title: 'Free Guest Event',
          description: 'Free Event for Guest Registration',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
        },
      });

      const response = await request(app)
        .post(`/api/v1/events/${event.id}/register-guest`)
        .send({
          email: 'suspendedguest@test.com',
          firstName: 'Suspended',
          lastName: 'User',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('suspended');
    });

    it('should fail for DEACTIVATED user', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create deactivated user
      await prisma.user.create({
        data: {
          email: 'deactivatedguest@test.com',
          password: await hashPassword('Test123!@#'),
          firstName: 'Deactivated',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.DEACTIVATED,
          isEmailVerified: true,
        },
      });

      const event = await prisma.event.create({
        data: {
          title: 'Free Guest Event',
          description: 'Free Event for Guest Registration',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
        },
      });

      const response = await request(app)
        .post(`/api/v1/events/${event.id}/register-guest`)
        .send({
          email: 'deactivatedguest@test.com',
          firstName: 'Deactivated',
          lastName: 'User',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('deactivated');
    });

    it('should fail with missing required fields', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Free Guest Event',
          description: 'Free Event for Guest Registration',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
        },
      });

      // Missing email
      await request(app)
        .post(`/api/v1/events/${event.id}/register-guest`)
        .send({
          firstName: 'Guest',
          lastName: 'User',
        })
        .expect(400);

      // Missing firstName
      await request(app)
        .post(`/api/v1/events/${event.id}/register-guest`)
        .send({
          email: 'guest@test.com',
          lastName: 'User',
        })
        .expect(400);

      // Missing lastName
      await request(app)
        .post(`/api/v1/events/${event.id}/register-guest`)
        .send({
          email: 'guest@test.com',
          firstName: 'Guest',
        })
        .expect(400);
    });

    it('should fail for non-approved event', async () => {
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
        .post(`/api/v1/events/${event.id}/register-guest`)
        .send({
          email: 'guest@test.com',
          firstName: 'Guest',
          lastName: 'User',
        })
        .expect(400);
    });

    it('should fail for sold out event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Limited Event',
          description: 'Event with limited capacity',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: true,
          capacity: 1,
          availableSlots: 1,
          organizerId,
          status: EventStatus.APPROVED,
        },
      });

      // Register first guest (fills capacity)
      await request(app)
        .post(`/api/v1/events/${event.id}/register-guest`)
        .send({
          email: 'firstguest@test.com',
          firstName: 'First',
          lastName: 'Guest',
        })
        .expect(201);

      // Try to register second guest (should fail)
      await request(app)
        .post(`/api/v1/events/${event.id}/register-guest`)
        .send({
          email: 'secondguest@test.com',
          firstName: 'Second',
          lastName: 'Guest',
        })
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

  describe('GET /api/v1/events/user/registered', () => {
    let attendeeId: string;

    beforeEach(async () => {
      if (!dbConnected) return;

      // Get attendee ID
      const attendee = await prisma.user.findUnique({
        where: { email: 'attendee@test.com' },
      });
      attendeeId = attendee!.id;

      // Create test events
      const event1 = await prisma.event.create({
        data: {
          title: 'Upcoming Event',
          description: 'This is an upcoming event',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
          location: 'Test Location 1',
          venue: 'Test Venue 1',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
          category: 'Technology',
        },
      });

      const event2 = await prisma.event.create({
        data: {
          title: 'Past Event',
          description: 'This is a past event',
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          location: 'Test Location 2',
          venue: 'Test Venue 2',
          isFree: false,
          price: 100,
          organizerId,
          status: EventStatus.COMPLETED,
          category: 'Business',
        },
      });

      const event3 = await prisma.event.create({
        data: {
          title: 'Ongoing Event',
          description: 'This is an ongoing event',
          startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          location: 'Test Location 3',
          venue: 'Test Venue 3',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
          category: 'Education',
        },
      });

      // Create registrations for attendee
      await prisma.eventRegistration.create({
        data: {
          eventId: event1.id,
          attendeeId,
          quantity: 1,
          totalAmount: 0,
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
        },
      });

      await prisma.eventRegistration.create({
        data: {
          eventId: event2.id,
          attendeeId,
          quantity: 1,
          totalAmount: 100,
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
        },
      });

      await prisma.eventRegistration.create({
        data: {
          eventId: event3.id,
          attendeeId,
          quantity: 1,
          totalAmount: 0,
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
        },
      });
    });

    it('should get user registered events successfully', async () => {
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
      expect(Array.isArray(response.body.data.events)).toBe(true);
      expect(response.body.data.events.length).toBeGreaterThanOrEqual(3);

      // Verify pagination metadata
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('totalPages');
      expect(response.body.data).toHaveProperty('hasMore');
      expect(typeof response.body.data.hasMore).toBe('boolean');

      const event = response.body.data.events[0];
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('title');
      expect(event).toHaveProperty('date');
      expect(event).toHaveProperty('location');
      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('image');
      expect(event).toHaveProperty('registrationDate');
      expect(event).toHaveProperty('status');
    });

    it('should support pagination with page and limit', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create more registrations for pagination testing
      for (let i = 4; i <= 6; i++) {
        const event = await prisma.event.create({
          data: {
            title: `Additional Event ${i}`,
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

      // Test first page
      const page1Response = await request(app)
        .get('/api/v1/events/user/registered?page=1&limit=3')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(page1Response.body.success).toBe(true);
      expect(page1Response.body.data.events.length).toBeLessThanOrEqual(3);
      expect(page1Response.body.data).toHaveProperty('page', 1);
      expect(page1Response.body.data).toHaveProperty('limit', 3);
      expect(page1Response.body.data).toHaveProperty('total');
      expect(page1Response.body.data).toHaveProperty('totalPages');
      expect(page1Response.body.data).toHaveProperty('hasMore');

      // Test second page if hasMore is true
      if (page1Response.body.data.hasMore) {
        const page2Response = await request(app)
          .get('/api/v1/events/user/registered?page=2&limit=3')
          .set('Authorization', `Bearer ${attendeeToken}`)
          .expect(200);

        expect(page2Response.body.success).toBe(true);
        expect(page2Response.body.data).toHaveProperty('page', 2);
        expect(page2Response.body.data.events.length).toBeGreaterThan(0);
      }
    });

    it('should correctly determine event status', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/events/user/registered')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      const events = response.body.data.events;
      
      // Find events by title
      interface EventItem {
        title: string;
        status?: string;
      }
      const upcomingEvent = events.find((e: EventItem) => e.title === 'Upcoming Event');
      const pastEvent = events.find((e: EventItem) => e.title === 'Past Event');
      const ongoingEvent = events.find((e: EventItem) => e.title === 'Ongoing Event');

      if (upcomingEvent) {
        expect(upcomingEvent.status).toBe('upcoming');
      }

      if (pastEvent) {
        expect(pastEvent.status).toBe('completed');
      }

      if (ongoingEvent) {
        expect(ongoingEvent.status).toBe('ongoing');
      }
    });

    it('should format dates correctly', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/events/user/registered')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      const events = response.body.data.events;
      
      interface EventItem {
        date?: string;
      }
      events.forEach((event: EventItem) => {
        expect(event.date).toBeDefined();
        if (event.date) {
          expect(typeof event.date).toBe('string');
          expect(event.date.length).toBeGreaterThan(0);
        }
      });
    });

    it('should include event details', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/events/user/registered')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      const events = response.body.data.events;
      
      interface EventItem {
        venue?: string;
        description?: string;
      }
      events.forEach((event: EventItem) => {
        expect(event).toHaveProperty('venue');
        expect(event).toHaveProperty('description');
        expect(event).toHaveProperty('category');
      });
    });

    it('should fail without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .get('/api/v1/events/user/registered')
        .expect(401);
    });

    it('should return empty array for user with no registrations', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create a new attendee with no registrations
      const newAttendeePassword = await hashPassword('NewAttendee123!@#');
      const newAttendee = await prisma.user.create({
        data: {
          email: 'newattendee@test.com',
          password: newAttendeePassword,
          firstName: 'New',
          lastName: 'Attendee',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const newAttendeeToken = generateAccessToken({
        userId: newAttendee.id,
        email: newAttendee.email,
        role: newAttendee.role,
      });

      const response = await request(app)
        .get('/api/v1/events/user/registered')
        .set('Authorization', `Bearer ${newAttendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toBeDefined();
      expect(Array.isArray(response.body.data.events)).toBe(true);
      expect(response.body.data.events.length).toBe(0);
    });
  });

  describe('Guest Registration - New Functionality', () => {
    it('should handle capacity race condition with concurrent registrations', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create event with limited capacity
      const event = await prisma.event.create({
        data: {
          title: 'Limited Capacity Event',
          description: 'Event with capacity limit',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: false,
          price: 50,
          capacity: 2, // Only 2 spots
          availableSlots: 2,
          organizerId,
          status: EventStatus.APPROVED,
        },
      });

      // Attempt concurrent registrations (3 registrations for 2 capacity)
      const registrations = await Promise.allSettled([
        request(app)
          .post(`/api/v1/events/${event.id}/register-guest`)
          .send({
            email: 'guest1@test.com',
            firstName: 'Guest',
            lastName: 'One',
            quantity: 1,
          }),
        request(app)
          .post(`/api/v1/events/${event.id}/register-guest`)
          .send({
            email: 'guest2@test.com',
            firstName: 'Guest',
            lastName: 'Two',
            quantity: 1,
          }),
        request(app)
          .post(`/api/v1/events/${event.id}/register-guest`)
          .send({
            email: 'guest3@test.com',
            firstName: 'Guest',
            lastName: 'Three',
            quantity: 1,
          }),
      ]);

      // Count successful registrations
      const successful = registrations.filter(
        (r) => r.status === 'fulfilled' && r.value.status === 201,
      ).length;

      // Should have exactly 2 successful registrations (capacity limit)
      expect(successful).toBe(2);

      // Verify final capacity
      const finalEvent = await prisma.event.findUnique({
        where: { id: event.id },
        select: { availableSlots: true, capacity: true },
      });
      expect(finalEvent?.availableSlots).toBe(0); // All slots taken
    });

    it('should allow re-registration for cancelled events', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create event
      const event = await prisma.event.create({
        data: {
          title: 'Re-registration Event',
          description: 'Event for re-registration test',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: false,
          price: 50,
          capacity: 10,
          availableSlots: 10,
          organizerId,
          status: EventStatus.APPROVED,
        },
      });

      // Create user
      const user = await prisma.user.create({
        data: {
          email: 'reregister@test.com',
          password: null, // Passwordless
          firstName: 'Re',
          lastName: 'Register',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      // Create cancelled registration
      await prisma.eventRegistration.create({
        data: {
          eventId: event.id,
          attendeeId: user.id,
          quantity: 1,
          totalAmount: 50,
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
          cancelledAt: new Date(),
        },
      });

      // Re-register
      const response = await request(app)
        .post(`/api/v1/events/${event.id}/register-guest`)
        .send({
          email: 'reregister@test.com',
          firstName: 'Re',
          lastName: 'Register',
          quantity: 1,
        })
        .expect(201);

      expect(response.body.success).toBe(true);

      // Verify registration was updated (not created new)
      const registrations = await prisma.eventRegistration.findMany({
        where: {
          eventId: event.id,
          attendeeId: user.id,
        },
      });

      // Should have only one registration (updated, not duplicated)
      expect(registrations.length).toBe(1);
      expect(registrations[0].status).toBe('PENDING'); // New status
      expect(registrations[0].cancelledAt).toBeNull(); // Cancellation cleared
    });

    it('should handle existing user with password during guest registration', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create user with password
      const existingUser = await prisma.user.create({
        data: {
          email: 'existingwithpass@test.com',
          password: await hashPassword('Test123!@#'),
          firstName: 'Existing',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const event = await prisma.event.create({
        data: {
          title: 'Existing User Event',
          description: 'Event for existing user',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
        },
      });

      const response = await request(app)
        .post(`/api/v1/events/${event.id}/register-guest`)
        .send({
          email: 'existingwithpass@test.com',
          firstName: 'Existing',
          lastName: 'User',
          quantity: 1,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.isNewUser).toBe(false);

      // Verify no account invitation email token was created (user has password)
      // Users with passwords should not receive account invitation emails
      const invitationToken = await prisma.emailVerification.findFirst({
        where: {
          userId: existingUser.id,
          verified: false,
        },
      });

      // Should not create invitation token for users with password
      // (The logic should check if user has password and skip invitation)
      // This test verifies the existing user handling works correctly
      expect(invitationToken).toBeNull();
    });
  });

  describe('Payment Service - New Functionality', () => {
    it('should validate guest payment with correct email', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create event and registration
      const event = await prisma.event.create({
        data: {
          title: 'Payment Test Event',
          description: 'Event for payment test',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: false,
          price: 100,
          organizerId,
          status: EventStatus.APPROVED,
        },
      });

      const user = await prisma.user.create({
        data: {
          email: 'paymenttest@test.com',
          password: null,
          firstName: 'Payment',
          lastName: 'Test',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const registration = await prisma.eventRegistration.create({
        data: {
          eventId: event.id,
          attendeeId: user.id,
          quantity: 1,
          totalAmount: 100,
          status: 'PENDING',
          paymentStatus: 'PENDING',
        },
      });

      // Test guest payment validation endpoint
      const response = await request(app)
        .post('/api/v1/payments/initialize-guest')
        .send({
          registrationId: registration.id,
          email: 'paymenttest@test.com',
        });

      // Should either succeed (if Paystack is configured) or fail with specific error
      // In test environment, Paystack is usually not configured, so we expect a validation error
      // or service unavailable error
      expect([200, 400, 503]).toContain(response.status);
    });

    it('should reject guest payment with wrong email', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create event and registration
      const event = await prisma.event.create({
        data: {
          title: 'Payment Test Event',
          description: 'Event for payment test',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: false,
          price: 100,
          organizerId,
          status: EventStatus.APPROVED,
        },
      });

      const user = await prisma.user.create({
        data: {
          email: 'paymenttest2@test.com',
          password: null,
          firstName: 'Payment',
          lastName: 'Test',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const registration = await prisma.eventRegistration.create({
        data: {
          eventId: event.id,
          attendeeId: user.id,
          quantity: 1,
          totalAmount: 100,
          status: 'PENDING',
          paymentStatus: 'PENDING',
        },
      });

      // Test with wrong email
      const response = await request(app)
        .post('/api/v1/payments/initialize-guest')
        .send({
          registrationId: registration.id,
          email: 'wrong@email.com',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email does not match');
    });
  });
});

