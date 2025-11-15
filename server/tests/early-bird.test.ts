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

describe('Early Bird Tickets', () => {
  let dbConnected = false;
  let organizerToken: string;
  let attendeeToken: string;
  let organizerId: string;
  let attendeeId: string;
  let eventId: string;

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
  });

  describe('Early Bird Availability Windows', () => {
    it('should allow registration during availability window', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const now = new Date();
      const availableFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Yesterday
      const availableUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Next week

      const event = await prisma.event.create({
        data: {
          title: 'Event with Early Bird',
          description: 'Test Description',
          startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: false,
          ticketTypes: [
            {
              name: 'Early Bird',
              price: 99.99,
              originalPrice: 149.99,
              availableFrom: availableFrom.toISOString(),
              availableUntil: availableUntil.toISOString(),
              quantity: 100,
            },
            {
              name: 'Regular',
              price: 149.99,
              quantity: 200,
            },
          ],
          organizerId,
          status: EventStatus.APPROVED,
        },
      });
      eventId = event.id;

      const response = await request(app)
        .post(`/api/v1/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          ticketType: 'Early Bird',
          quantity: 1,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.registration.ticketType).toBe('Early Bird');
    });

    it('should reject registration before availability window', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const now = new Date();
      const availableFrom = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
      const availableUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Next week

      const event = await prisma.event.create({
        data: {
          title: 'Event with Future Early Bird',
          description: 'Test Description',
          startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: false,
          ticketTypes: [
            {
              name: 'Early Bird',
              price: 99.99,
              originalPrice: 149.99,
              availableFrom: availableFrom.toISOString(),
              availableUntil: availableUntil.toISOString(),
              quantity: 100,
            },
          ],
          organizerId,
          status: EventStatus.APPROVED,
        },
      });
      eventId = event.id;

      const response = await request(app)
        .post(`/api/v1/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          ticketType: 'Early Bird',
          quantity: 1,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('available from');
    });

    it('should reject registration after availability window', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const now = new Date();
      const availableFrom = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 2 weeks ago
      const availableUntil = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last week

      const event = await prisma.event.create({
        data: {
          title: 'Event with Expired Early Bird',
          description: 'Test Description',
          startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: false,
          ticketTypes: [
            {
              name: 'Early Bird',
              price: 99.99,
              originalPrice: 149.99,
              availableFrom: availableFrom.toISOString(),
              availableUntil: availableUntil.toISOString(),
              quantity: 100,
            },
          ],
          organizerId,
          status: EventStatus.APPROVED,
        },
      });
      eventId = event.id;

      const response = await request(app)
        .post(`/api/v1/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          ticketType: 'Early Bird',
          quantity: 1,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('sale ended');
    });

    it('should allow registration for regular ticket when early bird is expired', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const now = new Date();
      const availableFrom = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const availableUntil = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const event = await prisma.event.create({
        data: {
          title: 'Event with Expired Early Bird',
          description: 'Test Description',
          startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: false,
          ticketTypes: [
            {
              name: 'Early Bird',
              price: 99.99,
              originalPrice: 149.99,
              availableFrom: availableFrom.toISOString(),
              availableUntil: availableUntil.toISOString(),
              quantity: 100,
            },
            {
              name: 'Regular',
              price: 149.99,
              quantity: 200,
            },
          ],
          organizerId,
          status: EventStatus.APPROVED,
        },
      });
      eventId = event.id;

      const response = await request(app)
        .post(`/api/v1/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          ticketType: 'Regular',
          quantity: 1,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.registration.ticketType).toBe('Regular');
    });
  });

  describe('Event Creation with Early Bird', () => {
    it('should create event with early bird ticket type', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const now = new Date();
      const availableFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const availableUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const eventData = {
        title: 'Event with Early Bird',
        description: 'Test Description',
        startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        isFree: false,
        ticketTypes: [
          {
            name: 'Early Bird',
            price: 99.99,
            originalPrice: 149.99,
            discountLabel: 'Early Bird Special',
            availableFrom: availableFrom.toISOString(),
            availableUntil: availableUntil.toISOString(),
            quantity: 100,
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
        originalPrice?: number;
        availableFrom?: string;
        availableUntil?: string;
      }>;
      const earlyBirdTicket = ticketTypes.find((t) => t.name === 'Early Bird');
      expect(earlyBirdTicket).toBeDefined();
      expect(earlyBirdTicket?.originalPrice).toBe(149.99);
      expect(earlyBirdTicket?.price).toBe(99.99);
      expect(earlyBirdTicket?.availableFrom).toBeDefined();
      expect(earlyBirdTicket?.availableUntil).toBeDefined();
    });
  });
});

