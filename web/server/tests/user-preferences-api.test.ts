import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger.js';
import { generateAccessToken } from '../src/utils/jwt.js';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('User Preferences API', () => {
  let dbConnected = false;
  let adminToken: string;
  let organizerToken: string;
  let attendeeToken: string;
  let _adminId: string;
  let organizerId: string;
  let _attendeeId: string;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      logger.info('✅ Test database connected');
    } catch (error) {
      logger.warn('⚠️  Database not available. Tests will be skipped.');
      logger.warn(
        `   Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
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

    // Clean up in correct order
    await prisma.$transaction(async (tx) => {
      await tx.userPreferences.deleteMany();
      // Payment reconciliations reference User via required reconciledBy field
      // with onDelete: SetNull, so we must delete them before deleting users
      await tx.paymentReconciliation.deleteMany();
      await tx.user.deleteMany();
    });

    // Create test admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: await hashPassword('password123'),
        firstName: 'Admin',
        lastName: 'Test',
        role: UserRole.ADMIN_STAFF,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    _adminId = admin.id;
    adminToken = generateAccessToken({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
    });

    // Create test organizer
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@test.com',
        password: await hashPassword('password123'),
        firstName: 'Organizer',
        lastName: 'Test',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    organizerId = organizer.id;
    organizerToken = generateAccessToken({
      userId: organizer.id,
      email: organizer.email,
      role: organizer.role,
    });

    // Create test attendee
    const attendee = await prisma.user.create({
      data: {
        email: 'attendee@test.com',
        password: await hashPassword('password123'),
        firstName: 'Attendee',
        lastName: 'Test',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    _attendeeId = attendee.id;
    attendeeToken = generateAccessToken({
      userId: attendee.id,
      email: attendee.email,
      role: attendee.role,
    });
  });

  describe('GET /api/v1/user/me/preferences', () => {
    it('should return default preferences for user without saved preferences', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      const response = await request(app)
        .get('/api/v1/user/me/preferences')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences).toBeDefined();
      expect(response.body.data.preferences.theme).toBe('system');
      expect(response.body.data.preferences.dashboardLayout).toBe('spacious');
      expect(response.body.data.preferences.eventNotifications).toBe(true);
      expect(response.body.data.preferences.userId).toBe(organizerId);
    });

    it('should return saved preferences if they exist', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      // Create preferences
      await prisma.userPreferences.create({
        data: {
          userId: organizerId,
          theme: 'dark',
          dashboardLayout: 'compact',
          eventNotifications: false,
        },
      });

      const response = await request(app)
        .get('/api/v1/user/me/preferences')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.theme).toBe('dark');
      expect(response.body.data.preferences.dashboardLayout).toBe('compact');
      expect(response.body.data.preferences.eventNotifications).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      await request(app).get('/api/v1/user/me/preferences').expect(401);
    });
  });

  describe('PUT /api/v1/user/me/preferences', () => {
    it('should update user preferences', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      const response = await request(app)
        .put('/api/v1/user/me/preferences')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          preferences: {
            theme: 'dark',
            dashboardLayout: 'compact',
            eventNotifications: false,
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.theme).toBe('dark');
      expect(response.body.data.preferences.dashboardLayout).toBe('compact');
      expect(response.body.data.preferences.eventNotifications).toBe(false);
    });

    it('should accept preferences directly in body', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      const response = await request(app)
        .put('/api/v1/user/me/preferences')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          theme: 'light',
          eventReminders: false,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.theme).toBe('light');
      expect(response.body.data.preferences.eventReminders).toBe(false);
    });

    it('should validate preference values', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      const response = await request(app)
        .put('/api/v1/user/me/preferences')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          preferences: {
            theme: 'invalid',
          },
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      await request(app)
        .put('/api/v1/user/me/preferences')
        .send({ preferences: { theme: 'dark' } })
        .expect(401);
    });
  });

  describe('PATCH /api/v1/user/me/preferences/:key', () => {
    it('should update a single preference', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      const response = await request(app)
        .patch('/api/v1/user/me/preferences/theme')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ value: 'dark' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.theme).toBe('dark');
    });

    it('should validate preference value', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      const response = await request(app)
        .patch('/api/v1/user/me/preferences/theme')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ value: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 if value is missing', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      const response = await request(app)
        .patch('/api/v1/user/me/preferences/theme')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/user/me/preferences/reset', () => {
    it('should reset preferences to defaults', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      // Create custom preferences
      await prisma.userPreferences.create({
        data: {
          userId: organizerId,
          theme: 'dark',
          dashboardLayout: 'compact',
          eventNotifications: false,
        },
      });

      const response = await request(app)
        .post('/api/v1/user/me/preferences/reset')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.theme).toBe('system');
      expect(response.body.data.preferences.dashboardLayout).toBe('spacious');
      expect(response.body.data.preferences.eventNotifications).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      await request(app)
        .post('/api/v1/user/me/preferences/reset')
        .expect(401);
    });
  });

  describe('GET /api/v1/user/me/preferences/defaults', () => {
    it('should return default preferences for organizer role', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      const response = await request(app)
        .get('/api/v1/user/me/preferences/defaults')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.theme).toBe('system');
      expect(response.body.data.preferences.eventNotifications).toBe(true);
      expect(response.body.data.preferences.registrationNotifications).toBe(
        true,
      );
    });

    it('should return default preferences for attendee role', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      const response = await request(app)
        .get('/api/v1/user/me/preferences/defaults')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.eventReminders).toBe(true);
      expect(response.body.data.preferences.eventUpdates).toBe(true);
      expect(response.body.data.preferences.promotionalOffers).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      await request(app)
        .get('/api/v1/user/me/preferences/defaults')
        .expect(401);
    });
  });

  describe('Role-based defaults', () => {
    it('should return organizer-specific defaults', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      const response = await request(app)
        .get('/api/v1/user/me/preferences')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.data.preferences.eventNotifications).toBe(true);
      expect(response.body.data.preferences.registrationNotifications).toBe(
        true,
      );
      expect(response.body.data.preferences.paymentNotifications).toBe(true);
    });

    it('should return attendee-specific defaults', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      const response = await request(app)
        .get('/api/v1/user/me/preferences')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.data.preferences.eventReminders).toBe(true);
      expect(response.body.data.preferences.eventUpdates).toBe(true);
      expect(response.body.data.preferences.promotionalOffers).toBe(true);
    });

    it('should return admin-specific defaults', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not available');
        return;
      }

      const response = await request(app)
        .get('/api/v1/user/me/preferences')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.preferences.eventNotifications).toBe(true);
      expect(response.body.data.preferences.registrationNotifications).toBe(
        true,
      );
      expect(response.body.data.preferences.paymentNotifications).toBe(true);
    });
  });
});

