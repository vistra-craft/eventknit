import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { UserRole, UserStatus, SubscriptionTier } from '@prisma/client';
import bcrypt from 'bcrypt';
import { cleanupTestData } from './test-helpers.js';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('Organizer Dashboard - Subscription API', () => {
  let dbConnected = false;
  let organizerToken: string;
  let organizerId: string;
  let attendeeToken: string;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch (error) {
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

    await prisma.$transaction(async (tx) => {
      await cleanupTestData(tx);
    });

    // Create organizer
    const organizerPassword = await hashPassword('Organizer123!@$');
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@subscription.test',
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
    await prisma.user.create({
      data: {
        email: 'attendee@subscription.test',
        password: attendeePassword,
        firstName: 'Event',
        lastName: 'Attendee',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });

    // Login as organizer
    const organizerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'organizer@subscription.test',
        password: 'Organizer123!@$',
      });
    organizerToken = organizerLogin.body.data.accessToken;

    // Login as attendee
    const attendeeLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'attendee@subscription.test',
        password: 'Attendee123!@$',
      });
    attendeeToken = attendeeLogin.body.data.accessToken;
  });

  describe('GET /api/v1/organizer-dashboard/subscription', () => {
    it('should get subscription (creates BASIC by default)', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/organizer-dashboard/subscription')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subscription).toBeDefined();
      expect(response.body.data.subscription.tier).toBe(SubscriptionTier.BASIC);
      expect(response.body.data.subscription.isActive).toBe(true);
    });

    it('should require authentication', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .get('/api/v1/organizer-dashboard/subscription')
        .expect(401);
    });
  });

  describe('POST /api/v1/organizer-dashboard/subscription/upgrade', () => {
    it('should upgrade to STANDARD tier (free)', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/organizer-dashboard/subscription/upgrade')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          tier: SubscriptionTier.STANDARD,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subscription.tier).toBe(SubscriptionTier.STANDARD);
      expect(response.body.data.subscription.billingEmail).toBeNull();
    });

    it('should reject PREMIUM upgrade without billing email', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/organizer-dashboard/subscription/upgrade')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          tier: SubscriptionTier.PREMIUM,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Billing email');
    });

    it('should require authentication', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .post('/api/v1/organizer-dashboard/subscription/upgrade')
        .send({
          tier: SubscriptionTier.STANDARD,
        })
        .expect(401);
    });

    it('should fail for non-organizer users', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .post('/api/v1/organizer-dashboard/subscription/upgrade')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          tier: SubscriptionTier.STANDARD,
        })
        .expect(403);
    });
  });


  describe('POST /api/v1/organizer-dashboard/subscription/cancel', () => {
    beforeEach(async () => {
      if (!dbConnected) return;
      // Create PREMIUM subscription
      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.PREMIUM,
          isActive: true,
          billingEmail: 'billing@test.com',
        },
      });
    });

    it('should cancel Premium subscription', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/organizer-dashboard/subscription/cancel')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subscription.isActive).toBe(false);
      expect(response.body.data.subscription.canceledAt).toBeDefined();
    });

    it('should fail to cancel non-Premium subscription', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Set to STANDARD
      await prisma.organizerSubscription.update({
        where: { organizerId },
        data: { tier: SubscriptionTier.STANDARD },
      });

      await request(app)
        .post('/api/v1/organizer-dashboard/subscription/cancel')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(400);
    });
  });
});

