import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { UserRole, UserStatus, EventStatus, RegistrationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { cleanupTestData } from './test-helpers.js';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('Organizer Dashboard - Consent Management API', () => {
  let dbConnected = false;
  let organizerToken: string;
  let organizerId: string;
  let _attendeeToken: string;
  let eventId: string;
  let registrationId: string;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch (_error) {
      console.warn('⚠️  Database not available. Tests will be skipped.');
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

    await cleanupTestData();

    // Create organizer
    const organizerPassword = await hashPassword('Organizer123!@$');
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@consent-test.com',
        password: organizerPassword,
        firstName: 'Event',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Events Inc',
      },
    });
    organizerId = organizer.id;

    // Create attendee
    const attendeePassword = await hashPassword('Attendee123!@$');
    const attendee = await prisma.user.create({
      data: {
        email: 'attendee@consent-test.com',
        password: attendeePassword,
        firstName: 'Test',
        lastName: 'Attendee',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });

    // Create event
    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'Test Description',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Test Location',
        organizerId,
        status: EventStatus.APPROVED,
        isFree: true,
      },
    });
    eventId = event.id;

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        attendeeId: attendee.id,
        status: RegistrationStatus.CONFIRMED,
        totalAmount: 0,
      },
    });
    registrationId = registration.id;

    // Login as organizer
    const organizerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'organizer@consent-test.com',
        password: 'Organizer123!@$',
      });
    organizerToken = organizerLogin.body.data.accessToken;

    // Login as attendee
    const attendeeLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'attendee@consent-test.com',
        password: 'Attendee123!@$',
      });
    _attendeeToken = attendeeLogin.body.data.accessToken;
  });

  describe('GET /api/v1/organizer-dashboard/events/:eventId/consent-stats', () => {
    beforeEach(async () => {
      if (!dbConnected) return;
      const { ConsentService } = await import('../src/services/consent.service.js');

      await ConsentService.createConsent(registrationId, (await prisma.user.findUnique({
        where: { email: 'attendee@consent-test.com' },
      }))!.id, eventId, {
        marketingConsent: true,
      });
    });

    it('should get consent statistics for event', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/organizer-dashboard/events/${eventId}/consent-stats`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalRegistrations).toBeGreaterThanOrEqual(1);
      expect(response.body.data.totalConsents).toBeGreaterThanOrEqual(1);
      expect(response.body.data.marketing).toBeDefined();
    });

    it('should require authentication', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .get(`/api/v1/organizer-dashboard/events/${eventId}/consent-stats`)
        .expect(401);
    });

    it('should fail if organizer does not own event', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const _otherOrg = await prisma.user.create({
        data: {
          email: 'otherorg@consent-test.com',
          password: await hashPassword('Pass123!'),
          firstName: 'Other',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
        },
      });

      const otherOrgLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'otherorg@consent-test.com',
          password: 'Pass123!',
        });
      const otherOrgToken = otherOrgLogin.body.data.accessToken;

      await request(app)
        .get(`/api/v1/organizer-dashboard/events/${eventId}/consent-stats`)
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .expect(404);
    });
  });
});

