import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus, EventStatus, RegistrationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { generateAccessToken } from '../src/utils/jwt';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('Event Service - Comprehensive Coverage', () => {
  let dbConnected = false;
  let organizerToken: string;
  let attendeeToken: string;
  let adminToken: string;
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
    // adminId stored but not used in these tests
    const _adminId = admin.id;
    adminToken = generateAccessToken({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
    });
  });

  describe('GET /api/v1/events/:id - getEventById', () => {
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

      // Create registrations
      await prisma.eventRegistration.createMany({
        data: [
          {
            eventId: event.id,
            attendeeId,
            quantity: 1,
            status: RegistrationStatus.CONFIRMED,
            totalAmount: 0,
          },
          {
            eventId: event.id,
            attendeeId,
            quantity: 1,
            status: RegistrationStatus.PENDING,
            totalAmount: 0,
          },
        ],
      });

      const response = await request(app)
        .get(`/api/v1/events/${event.id}`)
        .expect(200);

      expect(response.body.data.event._count.registrations).toBe(2);
    });
  });

  describe('PUT /api/v1/events/:id - updateEvent', () => {
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

      // Create another organizer
      const otherOrganizerPassword = await hashPassword('Test123!@#');
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

      // Create 5 registrations
      await prisma.eventRegistration.createMany({
        data: Array.from({ length: 5 }, () => ({
          eventId: event.id,
          attendeeId,
          quantity: 1,
          status: RegistrationStatus.CONFIRMED,
          totalAmount: 0,
        })),
      });

      const response = await request(app)
        .put(`/api/v1/events/${event.id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ capacity: 50 })
        .expect(200);

      // Available slots should be 50 - 5 = 45
      expect(response.body.data.event.availableSlots).toBe(45);
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

  describe('DELETE /api/v1/events/:id - deleteEvent', () => {
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

      // Verify event is soft deleted
      const deletedEvent = await prisma.event.findUnique({
        where: { id: event.id },
      });
      expect(deletedEvent?.deletedAt).not.toBeNull();
    });

    it('should fail if organizer does not own the event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create another organizer
      const otherOrganizerPassword = await hashPassword('Test123!@#');
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

  describe('DELETE /api/v1/events/registrations/:id - cancelRegistration', () => {
    it('should cancel registration successfully', async () => {
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
          capacity: 100,
          availableSlots: 99,
        },
      });

      const registration = await prisma.eventRegistration.create({
        data: {
          eventId: event.id,
          attendeeId,
          quantity: 1,
          status: RegistrationStatus.CONFIRMED,
          totalAmount: 0,
        },
      });

      const response = await request(app)
        .delete(`/api/v1/events/registrations/${registration.id}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify registration is cancelled
      const cancelledRegistration = await prisma.eventRegistration.findUnique({
        where: { id: registration.id },
      });
      expect(cancelledRegistration?.status).toBe(RegistrationStatus.CANCELLED);
      expect(cancelledRegistration?.cancelledAt).not.toBeNull();

      // Verify available slots increased
      const updatedEvent = await prisma.event.findUnique({
        where: { id: event.id },
      });
      expect(updatedEvent?.availableSlots).toBe(100);
    });

    it('should fail if attendee does not own the registration', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create another attendee
      const otherAttendeePassword = await hashPassword('Test123!@#');
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

      const registration = await prisma.eventRegistration.create({
        data: {
          eventId: event.id,
          attendeeId,
          quantity: 1,
          status: RegistrationStatus.CONFIRMED,
          totalAmount: 0,
        },
      });

      const response = await request(app)
        .delete(`/api/v1/events/registrations/${registration.id}`)
        .set('Authorization', `Bearer ${otherAttendeeToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('permission');
    });

    it('should fail if registration is already cancelled', async () => {
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

      const registration = await prisma.eventRegistration.create({
        data: {
          eventId: event.id,
          attendeeId,
          quantity: 1,
          status: RegistrationStatus.CANCELLED,
          totalAmount: 0,
          cancelledAt: new Date(),
        },
      });

      const response = await request(app)
        .delete(`/api/v1/events/registrations/${registration.id}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already cancelled');
    });

    it('should create audit log on cancellation', async () => {
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

      const registration = await prisma.eventRegistration.create({
        data: {
          eventId: event.id,
          attendeeId,
          quantity: 1,
          status: RegistrationStatus.CONFIRMED,
          totalAmount: 0,
        },
      });

      await request(app)
        .delete(`/api/v1/events/registrations/${registration.id}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: attendeeId,
          entity: 'EventRegistration',
          entityId: registration.id,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.action).toBe('TICKET_CANCELLED');
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

      const registration = await prisma.eventRegistration.create({
        data: {
          eventId: event.id,
          attendeeId,
          quantity: 1,
          status: RegistrationStatus.CONFIRMED,
          totalAmount: 0,
        },
      });

      await request(app)
        .delete(`/api/v1/events/registrations/${registration.id}`)
        .expect(401);
    });

    it('should return 404 for non-existent registration', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .delete('/api/v1/events/registrations/non-existent-id')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/events/:id/registrations - getEventRegistrations Edge Cases', () => {
    it('should return empty array for event with no registrations', async () => {
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

      const response = await request(app)
        .get(`/api/v1/events/${event.id}/registrations`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.registrations).toEqual([]);
    });

    it('should fail if organizer does not own the event', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create another organizer
      const otherOrganizerPassword = await hashPassword('Test123!@#');
      const otherOrganizer = await prisma.user.create({
        data: {
          email: 'other3@test.com',
          password: otherOrganizerPassword,
          firstName: 'Other',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          organizationName: 'Other Org',
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
        .get(`/api/v1/events/${event.id}/registrations`)
        .set('Authorization', `Bearer ${otherOrganizerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should allow admin to view any event registrations', async () => {
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

      await prisma.eventRegistration.create({
        data: {
          eventId: event.id,
          attendeeId,
          quantity: 1,
          status: RegistrationStatus.CONFIRMED,
          totalAmount: 0,
        },
      });

      const response = await request(app)
        .get(`/api/v1/events/${event.id}/registrations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.registrations.length).toBe(1);
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
        .get(`/api/v1/events/${event.id}/registrations`)
        .expect(401);
    });
  });
});


