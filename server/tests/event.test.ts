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

describe('Event System', () => {
  let dbConnected = false;
  let organizerToken: string;
  let attendeeToken: string;
  let adminToken: string;
  let organizerId: string;
  let adminId: string;
  let templateId: string;
  let draftId: string;

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
      await cleanupTestData(tx);
    });

    // Create test users
    const hashedPassword = await hashPassword('Test123!@$');

    // Create organizer (verification not required to create events, but used for testing)
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@test.com',
        password: hashedPassword,
        firstName: 'Organizer',
        lastName: 'Test',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        isIdentityVerified: true, // For testing purposes
        identityVerifiedAt: new Date(),
        verificationLevel: 2,
        payoutLimit: null,
        organizationName: 'Test Events Inc',
        onboardingCompleted: true, // Set to true for existing test organizers
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

    it('should create a paid event successfully (Eventbrite approach - no verification required)', async () => {
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

    it('should create paid event without identity verification (Eventbrite approach)', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create organizer without identity verification
      const unverifiedPassword = await hashPassword('Test123!@$');
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
          onboardingCompleted: true,
        },
      });

      const unverifiedToken = generateAccessToken({
        userId: unverifiedOrganizer.id,
        email: unverifiedOrganizer.email,
        role: unverifiedOrganizer.role,
      });

      const eventData = {
        title: 'Test Paid Event (Unverified)',
        description: 'This is a test paid event created without verification',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        isFree: false,
        price: 50.00,
      };

      // Eventbrite approach: Should succeed - verification not required to CREATE events
      const response = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .send(eventData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event.title).toBe(eventData.title);
      expect(response.body.data.event.isFree).toBe(false);
      expect(Number(response.body.data.event.price)).toBe(50.00);
    });

    it('should create paid event without monthly limit restriction (Eventbrite approach)', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create organizer with identity verification but with payout limit
      const limitedPassword = await hashPassword('Test123!@$');
      const limitedOrganizer = await prisma.user.create({
        data: {
          email: 'limited@test.com',
          password: limitedPassword,
          firstName: 'Limited',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          isIdentityVerified: true,
          verificationLevel: 2,
          payoutLimit: 2000, // Has limit
          onboardingCompleted: true,
        },
      });

      const limitedToken = generateAccessToken({
        userId: limitedOrganizer.id,
        email: limitedOrganizer.email,
        role: limitedOrganizer.role,
      });

      // Create multiple events that would exceed the old limit
      const eventData1 = {
        title: 'High Value Event 1',
        description: 'Test event',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        isFree: false,
        price: 1000.00,
        capacity: 10, // Total value: 10,000
      };

      const eventData2 = {
        title: 'High Value Event 2',
        description: 'Test event',
        startDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        isFree: false,
        price: 1500.00,
        capacity: 10, // Total value: 15,000
      };

      // Both should succeed - no monthly limit on event creation
      const response1 = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${limitedToken}`)
        .send(eventData1)
        .expect(201);

      const response2 = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${limitedToken}`)
        .send(eventData2)
        .expect(201);

      expect(response1.body.success).toBe(true);
      expect(response2.body.success).toBe(true);
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

    it('should fail to create event as attendee (only organizers and admins can create events)', async () => {
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

      const response = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send(eventData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only organizers and admins can create events');
    });

    it('should allow admin to create events', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const eventData = {
        title: 'Admin Created Event',
        description: 'This event was created by an admin',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        isFree: true,
      };

      const response = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(eventData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event.title).toBe(eventData.title);
      expect(response.body.data.event.status).toBe(EventStatus.PENDING);
    });
  });

  describe('Event Templates & Drafts (Organizer Dashboard)', () => {
    it('creates a template and uses it', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const createRes = await request(app)
        .post('/api/v1/organizer-dashboard/templates')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'My Template',
          templateData: { title: 'From Template', steps: [] },
          isPublic: true,
        });

      expect(createRes.status).toBe(201);
      templateId = createRes.body.data.template.id;

      const useRes = await request(app)
        .post(`/api/v1/organizer-dashboard/templates/${templateId}/use`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(useRes.status).toBe(200);
      expect(useRes.body.data.templateData.title).toBe('From Template');
    });

    it('creates, updates, and publishes a draft', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Create draft
      const draftRes = await request(app)
        .post('/api/v1/organizer-dashboard/drafts')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          draftData: { title: 'Draft Event', details: {} },
        });

      expect(draftRes.status).toBe(201);
      draftId = draftRes.body.data.draft.id;

      // Update draft
      const updateRes = await request(app)
        .put(`/api/v1/organizer-dashboard/drafts/${draftId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          draftData: { title: 'Draft Event Updated', details: { venue: 'Hall A' } },
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.draft.draftData.title).toBe('Draft Event Updated');

      // Publish draft
      const publishRes = await request(app)
        .post(`/api/v1/organizer-dashboard/drafts/${draftId}/publish`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(publishRes.status).toBe(200);
      expect(publishRes.body.data.draftId).toBe(draftId);
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

      expect(pageResponse.body.data.events.length).toBe(offsetResponse.body.data.events.length);
    });
  });

  describe('GET /api/v1/events/:id - Edge Cases', () => {
    it('should get event by ID successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Test Event',
          description: 'Test Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
        },
      });

      const response = await request(app)
        .get(`/api/v1/events/${event.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event.id).toBe(event.id);
      expect(response.body.data.event.title).toBe('Test Event');
      expect(response.body.data.event.organizer).toBeDefined();
      expect(response.body.data.event._count).toBeDefined();
    });

    it('should return 404 for non-existent event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/events/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should return 404 for deleted event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Deleted Event',
          description: 'Test Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
          deletedAt: new Date(),
        },
      });

      const response = await request(app)
        .get(`/api/v1/events/${event.id}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should include registration count', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Event with Registrations',
          description: 'Test Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
        },
      });

      // Create attendee for registration
      const attendee = await prisma.user.findUnique({
        where: { email: 'attendee@test.com' },
      });

      if (attendee) {
        // Delete any existing registrations first to avoid unique constraint violation
        await prisma.eventRegistration.deleteMany({
          where: { eventId: event.id },
        });
        
        // Create 2 separate registrations (service counts registrations, not quantities)
        // Create a second attendee for the second registration
        const secondAttendeePassword = await hashPassword('Attendee2123!@$');
        const secondAttendee = await prisma.user.upsert({
          where: { email: 'attendee2@test.com' },
          update: {},
          create: {
            email: 'attendee2@test.com',
            password: secondAttendeePassword,
            firstName: 'Event',
            lastName: 'Attendee2',
            role: UserRole.ATTENDEE,
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
          },
        });
        
        await prisma.eventRegistration.createMany({
          data: [
            {
              eventId: event.id,
              attendeeId: attendee.id,
              quantity: 1,
              status: 'CONFIRMED',
              totalAmount: 0,
            },
            {
              eventId: event.id,
              attendeeId: secondAttendee.id,
              quantity: 1,
              status: 'CONFIRMED',
              totalAmount: 0,
            },
          ],
        });
      }

      const response = await request(app)
        .get(`/api/v1/events/${event.id}`)
        .expect(200);

      if (attendee) {
        expect(response.body.data.event._count.registrations).toBe(2);
      }
    });
  });

  describe('PUT /api/v1/events/:id - Edge Cases', () => {
    it('should update event successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Original Title',
          description: 'Original Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Original Location',
          isFree: true,
          organizerId,
          status: EventStatus.PENDING,
        },
      });

      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
        location: 'Updated Location',
      };

      const response = await request(app)
        .put(`/api/v1/events/${event.id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event.title).toBe('Updated Title');
      expect(response.body.data.event.description).toBe('Updated Description');
      expect(response.body.data.event.location).toBe('Updated Location');
    });

    it('should reset status to PENDING when updating approved event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Approved Event',
          description: 'Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
        },
      });

      const response = await request(app)
        .put(`/api/v1/events/${event.id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ title: 'Updated Title' })
        .expect(200);

      expect(response.body.data.event.status).toBe(EventStatus.PENDING);
    });

    it('should fail if organizer does not own the event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const otherOrganizerPassword = await hashPassword('Test123!@$');
      const otherOrganizer = await prisma.user.create({
        data: {
          email: 'other@test.com',
          password: otherOrganizerPassword,
          firstName: 'Other',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          organizationName: 'Other Org',
          onboardingCompleted: true,
        },
      });

      const otherOrganizerToken = generateAccessToken({
        userId: otherOrganizer.id,
        email: otherOrganizer.email,
        role: otherOrganizer.role,
      });

      const event = await prisma.event.create({
        data: {
          title: 'Event',
          description: 'Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.PENDING,
        },
      });

      const response = await request(app)
        .put(`/api/v1/events/${event.id}`)
        .set('Authorization', `Bearer ${otherOrganizerToken}`)
        .send({ title: 'Updated Title' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('permission');
    });

    it('should allow admin to update any event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Event',
          description: 'Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.PENDING,
        },
      });

      const response = await request(app)
        .put(`/api/v1/events/${event.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Updated Title' })
        .expect(200);

      expect(response.body.data.event.title).toBe('Admin Updated Title');
    });

    it('should update capacity and recalculate available slots', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Event',
          description: 'Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.PENDING,
          capacity: 100,
          availableSlots: 100,
        },
      });

      // Create attendee for registration
      const attendee = await prisma.user.findUnique({
        where: { email: 'attendee@test.com' },
      });

      if (attendee) {
        // Delete any existing registrations first to avoid unique constraint violation
        await prisma.eventRegistration.deleteMany({
          where: { eventId: event.id },
        });
        
        // Create 5 separate registrations (service counts registrations, not quantities)
        // Create additional attendees for multiple registrations
        const attendees = [attendee];
        for (let i = 2; i <= 5; i++) {
          const attendeePassword = await hashPassword(`Attendee${i}123!@$`);
          const newAttendee = await prisma.user.upsert({
            where: { email: `attendee${i}@test.com` },
            update: {},
            create: {
              email: `attendee${i}@test.com`,
              password: attendeePassword,
              firstName: 'Event',
              lastName: `Attendee${i}`,
              role: UserRole.ATTENDEE,
              status: UserStatus.ACTIVE,
              isEmailVerified: true,
            },
          });
          attendees.push(newAttendee);
        }
        
        await prisma.eventRegistration.createMany({
          data: attendees.map(a => ({
            eventId: event.id,
            attendeeId: a.id,
            quantity: 1,
            status: 'CONFIRMED',
            totalAmount: 0,
          })),
        });
      }

      const response = await request(app)
        .put(`/api/v1/events/${event.id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ capacity: 50 })
        .expect(200);

      if (attendee) {
        // Available slots should be 50 - 5 registrations = 45
        expect(response.body.data.event.availableSlots).toBe(45);
      }
    });

    it('should create audit log on update', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Event',
          description: 'Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.PENDING,
        },
      });

      await request(app)
        .put(`/api/v1/events/${event.id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ title: 'Updated Title' })
        .expect(200);

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: organizerId,
          entity: 'Event',
          entityId: event.id,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.action).toBe('EVENT_UPDATED');
    });

    it('should fail without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Event',
          description: 'Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.PENDING,
        },
      });

      await request(app)
        .put(`/api/v1/events/${event.id}`)
        .send({ title: 'Updated Title' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/events/:id - Edge Cases', () => {
    it('should soft delete event successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Event to Delete',
          description: 'Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.PENDING,
        },
      });

      const response = await request(app)
        .delete(`/api/v1/events/${event.id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const deletedEvent = await prisma.event.findUnique({
        where: { id: event.id },
      });
      expect(deletedEvent?.deletedAt).not.toBeNull();
    });

    it('should block deletion of approved (published) events and require cancel/unpublish', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const approvedEvent = await prisma.event.create({
        data: {
          title: 'Approved Event',
          description: 'Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
        },
      });

      const response = await request(app)
        .delete(`/api/v1/events/${approvedEvent.id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/cannot be deleted/i);
    });

    it('should fail if organizer does not own the event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const otherOrganizerPassword = await hashPassword('Test123!@$');
      const otherOrganizer = await prisma.user.create({
        data: {
          email: 'other2@test.com',
          password: otherOrganizerPassword,
          firstName: 'Other',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          organizationName: 'Other Org',
          onboardingCompleted: true,
        },
      });

      const otherOrganizerToken = generateAccessToken({
        userId: otherOrganizer.id,
        email: otherOrganizer.email,
        role: otherOrganizer.role,
      });

      const event = await prisma.event.create({
        data: {
          title: 'Event',
          description: 'Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.PENDING,
        },
      });

      const response = await request(app)
        .delete(`/api/v1/events/${event.id}`)
        .set('Authorization', `Bearer ${otherOrganizerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should allow admin to delete any event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Event',
          description: 'Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.PENDING,
        },
      });

      const response = await request(app)
        .delete(`/api/v1/events/${event.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should create audit log on delete', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Event',
          description: 'Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.PENDING,
        },
      });

      await request(app)
        .delete(`/api/v1/events/${event.id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: organizerId,
          entity: 'Event',
          entityId: event.id,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.action).toBe('EVENT_DELETED');
    });

    it('should fail without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Event',
          description: 'Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.PENDING,
        },
      });

      await request(app)
        .delete(`/api/v1/events/${event.id}`)
        .expect(401);
    });

    it('should return 404 for non-existent event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .delete('/api/v1/events/non-existent-id')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Organizer dashboard events visibility', () => {
    it('should include cancelled and unpublished events in organizer dashboard list', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const pendingTitle = `Pending Dashboard Event ${Date.now()}`;
      const cancelledTitle = `Cancelled Dashboard Event ${Date.now()}`;

      await prisma.event.create({
        data: {
          title: pendingTitle,
          description: 'Dashboard pending event',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.PENDING,
        },
      });

      await prisma.event.create({
        data: {
          title: cancelledTitle,
          description: 'Dashboard cancelled event',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.CANCELLED,
        },
      });

      const response = await request(app)
        .get('/api/v1/organizer/dashboard/events?limit=20')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const events = response.body.data?.events || [];

      const pendingEvent = events.find((e: any) => e.title === pendingTitle);
      const cancelledEvent = events.find((e: any) => e.title === cancelledTitle);

      expect(pendingEvent).toBeDefined();
      expect(cancelledEvent).toBeDefined();
      expect(pendingEvent.status).toBe('unpublished');
      expect(cancelledEvent.status).toBe('cancelled');
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

    it('should fail to approve already approved event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Approved Event',
          description: 'Approved Event Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
          approvedBy: adminId,
        },
      });

      const response = await request(app)
        .post(`/api/v1/events/${event.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already approved');
    });

    it('should fail to approve rejected event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Rejected Event',
          description: 'Rejected Event Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.REJECTED,
        },
      });

      const response = await request(app)
        .post(`/api/v1/events/${event.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail to approve non-existent event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/events/non-existent-id/approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
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
        .expect(401);
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

    it('should fail to reject event without admin role', async () => {
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
        .post(`/api/v1/events/${event.id}/reject`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ rejectionReason: 'Test reason' })
        .expect(403);
    });

    it('should fail to reject already rejected event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Rejected Event',
          description: 'Rejected Event Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.REJECTED,
        },
      });

      const response = await request(app)
        .post(`/api/v1/events/${event.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejectionReason: 'Another reason' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail to reject approved event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Approved Event',
          description: 'Approved Event Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
          approvedBy: adminId,
        },
      });

      const response = await request(app)
        .post(`/api/v1/events/${event.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejectionReason: 'Test reason' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail without rejection reason', async () => {
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
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
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
        .post(`/api/v1/events/${event.id}/reject`)
        .send({ rejectionReason: 'Test reason' })
        .expect(401);
    });

    it('should fail with non-existent event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/events/non-existent-id/reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejectionReason: 'Test reason' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/events/:id/cancel', () => {
    it('should cancel event successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Event to Cancel',
          description: 'Event Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
        },
      });

      const response = await request(app)
        .post(`/api/v1/events/${event.id}/cancel`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.event.status).toBe(EventStatus.CANCELLED);
    });

    it('should fail if organizer does not own the event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const otherOrganizerPassword = await hashPassword('Test123!@$');
      const otherOrganizer = await prisma.user.create({
        data: {
          email: 'othercancel@test.com',
          password: otherOrganizerPassword,
          firstName: 'Other',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          organizationName: 'Other Org',
          onboardingCompleted: true,
        },
      });

      const otherOrganizerToken = generateAccessToken({
        userId: otherOrganizer.id,
        email: otherOrganizer.email,
        role: otherOrganizer.role,
      });

      const event = await prisma.event.create({
        data: {
          title: 'Event',
          description: 'Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
        },
      });

      const response = await request(app)
        .post(`/api/v1/events/${event.id}/cancel`)
        .set('Authorization', `Bearer ${otherOrganizerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should fail to cancel already cancelled event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Cancelled Event',
          description: 'Cancelled Event Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.CANCELLED,
        },
      });

      const response = await request(app)
        .post(`/api/v1/events/${event.id}/cancel`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Event',
          description: 'Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
        },
      });

      await request(app)
        .post(`/api/v1/events/${event.id}/cancel`)
        .expect(401);
    });

    it('should fail for non-organizer user', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Event',
          description: 'Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
        },
      });

      await request(app)
        .post(`/api/v1/events/${event.id}/cancel`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(403);
    });

    it('should fail with non-existent event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/events/non-existent-id/cancel')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/events/:id/registrations', () => {
    let eventId: string;
    let attendeeId: string;

    beforeEach(async () => {
      if (!dbConnected) return;

      const organizer = await prisma.user.findUnique({
        where: { email: 'organizer@test.com' },
      });
      if (!organizer) throw new Error('Organizer not found');

      const attendee = await prisma.user.findUnique({
        where: { email: 'attendee@test.com' },
      });
      if (!attendee) throw new Error('Attendee not found');
      attendeeId = attendee.id;

      const event = await prisma.event.create({
        data: {
          title: 'Event with Registrations',
          description: 'Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId: organizer.id,
          status: EventStatus.APPROVED,
        },
      });
      eventId = event.id;

      // Delete any existing registrations first to avoid unique constraint violation
      await prisma.eventRegistration.deleteMany({
        where: { eventId: event.id, attendeeId },
      });
      
      // Create a single registration with quantity 3 (unique constraint: one registration per attendee per event)
      await prisma.eventRegistration.create({
        data: {
          eventId: event.id,
          attendeeId,
          quantity: 3,
          totalAmount: 0,
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
        },
      });
    });

    it('should get event registrations successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/events/${eventId}/registrations`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.registrations).toBeDefined();
      expect(Array.isArray(response.body.data.registrations)).toBe(true);
      expect(response.body.data.registrations.length).toBeGreaterThan(0);
    });

    it('should fail if organizer does not own the event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const otherOrganizerPassword = await hashPassword('Test123!@$');
      const otherOrganizer = await prisma.user.create({
        data: {
          email: 'otherreg@test.com',
          password: otherOrganizerPassword,
          firstName: 'Other',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          organizationName: 'Other Org',
          onboardingCompleted: true,
        },
      });

      const otherOrganizerToken = generateAccessToken({
        userId: otherOrganizer.id,
        email: otherOrganizer.email,
        role: otherOrganizer.role,
      });

      const response = await request(app)
        .get(`/api/v1/events/${eventId}/registrations`)
        .set('Authorization', `Bearer ${otherOrganizerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should fail for non-organizer user', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .get(`/api/v1/events/${eventId}/registrations`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(403);
    });

    it('should fail without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .get(`/api/v1/events/${eventId}/registrations`)
        .expect(401);
    });

    it('should fail with non-existent event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/events/non-existent-id/registrations')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return empty array for event with no registrations', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const event = await prisma.event.create({
        data: {
          title: 'Empty Event',
          description: 'Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location',
          isFree: true,
          organizerId,
          status: EventStatus.APPROVED,
        },
      });

      const response = await request(app)
        .get(`/api/v1/events/${event.id}/registrations`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.registrations).toEqual([]);
    });
  });
});
