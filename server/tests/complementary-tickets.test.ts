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

describe('Complementary Tickets', () => {
  let dbConnected = false;
  let organizerToken: string;
  let attendeeToken: string;
  let organizerId: string;
  let attendeeId: string;
  let eventId: string;
  let invitationId: string;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      logger.info('✅ Test database connected');
    } catch (error) {
      logger.warn('⚠️  Database not available. Tests will be skipped.');
      dbConnected = false;
    }
  });

  afterAll(async () => {
    if (dbConnected) {
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    if (!dbConnected) return;

    // Clean up
    await prisma.$transaction(async (tx) => {
      await tx.eventRegistration.deleteMany();
      await tx.eventInvitation.deleteMany();
      await tx.event.deleteMany();
      await tx.user.deleteMany();
    });

    // Create organizer
    const hashedPassword = await hashPassword('Test123!@$');
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
        verificationLevel: 2,
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

    // Create event with complementary ticket
    const event = await prisma.event.create({
      data: {
        title: 'Test Event with Complementary Tickets',
        description: 'Test Description',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Test Location',
        isFree: false,
        price: 100,
        ticketTypes: [
          {
            name: 'Regular Ticket',
            price: 100,
            quantity: 100,
          },
          {
            name: 'Speaker Complimentary',
            price: 0,
            isComplementary: true,
            requiresInvitation: true,
            quantity: 50,
          },
        ],
        organizerId,
        status: EventStatus.APPROVED,
      },
    });
    eventId = event.id;

    // Create invitation for complementary ticket
    const invitation = await prisma.eventInvitation.create({
      data: {
        eventId,
        inviteType: 'GUEST',
        token: 'test-invitation-token',
        isActive: true,
        createdBy: organizerId,
      },
    });
    invitationId = invitation.id;
  });

  describe('Complementary Ticket Registration', () => {
    it('should allow registration with complementary ticket using valid invitation', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post(`/api/v1/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          ticketType: 'Speaker Complimentary',
          quantity: 1,
          invitationId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.registration.ticketType).toBe('Speaker Complimentary');
      expect(Number(response.body.data.registration.totalAmount)).toBe(0);
      expect(response.body.data.registration.status).toBe(RegistrationStatus.CONFIRMED);
    });

    it('should reject registration with complementary ticket without invitation', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post(`/api/v1/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          ticketType: 'Speaker Complimentary',
          quantity: 1,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('requires an invitation');
    });

    it('should reject registration with complementary ticket using invalid invitation', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post(`/api/v1/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          ticketType: 'Speaker Complimentary',
          quantity: 1,
          invitationId: 'invalid-invitation-id',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired invitation');
    });

    it('should reject registration with complementary ticket using inactive invitation', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Deactivate invitation
      await prisma.eventInvitation.update({
        where: { id: invitationId },
        data: { isActive: false },
      });

      const response = await request(app)
        .post(`/api/v1/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          ticketType: 'Speaker Complimentary',
          quantity: 1,
          invitationId,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired invitation');
    });
  });

  describe('Event Creation with Complementary Tickets', () => {
    it('should create event with complementary ticket type', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const eventData = {
        title: 'Event with Complementary',
        description: 'Test Description',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        isFree: false,
        ticketTypes: [
          {
            name: 'Regular',
            price: 100,
            quantity: 100,
          },
          {
            name: 'Media Complimentary',
            price: 0,
            isComplementary: true,
            requiresInvitation: true,
            quantity: 20,
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(eventData)
        .expect(201);

      expect(response.body.success).toBe(true);
      const ticketTypes = response.body.data.event.ticketTypes as Array<{
        name: string;
        price: number;
        isComplementary?: boolean;
      }>;
      const complementaryTicket = ticketTypes.find((t) => t.name === 'Media Complimentary');
      expect(complementaryTicket).toBeDefined();
      expect(complementaryTicket?.price).toBe(0);
      expect(complementaryTicket?.isComplementary).toBe(true);
    });

    it('should reject event creation with complementary ticket that has non-zero price', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const eventData = {
        title: 'Invalid Event',
        description: 'Test Description',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        isFree: false,
        ticketTypes: [
          {
            name: 'Invalid Complimentary',
            price: 50, // Should be 0
            isComplementary: true,
            requiresInvitation: true,
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(eventData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Complementary tickets must have price of 0');
    });
  });
});

