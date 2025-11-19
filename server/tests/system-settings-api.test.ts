import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { generateAccessToken } from '../src/utils/jwt';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('System Settings API', () => {
  let dbConnected = false;
  let adminToken: string;
  let organizerToken: string;
  let _attendeeToken: string;
  let adminId: string;
  let _organizerId: string;
  let _attendeeId: string;

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

    // Clean up in correct order
    await prisma.$transaction(async (tx) => {
      await tx.settingsHistory.deleteMany();
      await tx.systemSettings.deleteMany();
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
    adminId = admin.id;
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
    _organizerId = organizer.id;
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
    _attendeeToken = generateAccessToken({
      userId: attendee.id,
      email: attendee.email,
      role: attendee.role,
    });
  });

  describe('GET /api/v1/admin/settings', () => {
    it('should get all settings for admin', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      // Create a test setting
      await prisma.systemSettings.create({
        data: {
          key: 'test.setting',
          value: 'test value',
          type: 'string',
          category: 'general',
          createdBy: adminId,
          updatedBy: adminId,
        },
      });

      const response = await request(app)
        .get('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settings).toBeInstanceOf(Array);
      expect(response.body.data.settings.length).toBeGreaterThan(0);
    });

    it('should filter settings by category', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      // Create test settings
      await prisma.systemSettings.createMany({
        data: [
          {
            key: 'test.general',
            value: 'general value',
            type: 'string',
            category: 'general',
            createdBy: adminId,
            updatedBy: adminId,
          },
          {
            key: 'test.users',
            value: 'users value',
            type: 'string',
            category: 'users',
            createdBy: adminId,
            updatedBy: adminId,
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/admin/settings?category=general')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(
        response.body.data.settings.every((s: any) => s.category === 'general'),
      ).toBe(true);
    });

    it('should require authentication', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      await request(app).get('/api/v1/admin/settings').expect(401);
    });

    it('should require admin role', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      await request(app)
        .get('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/admin/settings/:key', () => {
    it('should get a single setting by key', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      await prisma.systemSettings.create({
        data: {
          key: 'test.single',
          value: 'single value',
          type: 'string',
          category: 'general',
          createdBy: adminId,
          updatedBy: adminId,
        },
      });

      const response = await request(app)
        .get('/api/v1/admin/settings/test.single')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.setting.key).toBe('test.single');
      expect(response.body.data.setting.value).toBe('single value');
    });

    it('should return 404 for non-existent setting', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      await request(app)
        .get('/api/v1/admin/settings/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/admin/settings/:key', () => {
    it('should create a new setting', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      const response = await request(app)
        .put('/api/v1/admin/settings/test.create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          value: 'created value',
          type: 'string',
          category: 'general',
          description: 'Test setting',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.setting.key).toBe('test.create');
      expect(response.body.data.setting.value).toBe('created value');
    });

    it('should update an existing setting', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      await prisma.systemSettings.create({
        data: {
          key: 'test.update',
          value: 'old value',
          type: 'string',
          category: 'general',
          createdBy: adminId,
          updatedBy: adminId,
        },
      });

      const response = await request(app)
        .put('/api/v1/admin/settings/test.update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          value: 'new value',
          type: 'string',
          category: 'general',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.setting.value).toBe('new value');
    });

    it('should validate required fields', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      await request(app)
        .put('/api/v1/admin/settings/test.invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          value: 'test',
          // Missing type and category
        })
        .expect(400);
    });

    it('should require admin role', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      await request(app)
        .put('/api/v1/admin/settings/test.unauthorized')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          value: 'test',
          type: 'string',
          category: 'general',
        })
        .expect(403);
    });
  });

  describe('PUT /api/v1/admin/settings (bulk)', () => {
    it('should update multiple settings at once', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      const response = await request(app)
        .put('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          settings: [
            {
              key: 'test.bulk1',
              value: 'value1',
              type: 'string',
              category: 'general',
            },
            {
              key: 'test.bulk2',
              value: 'value2',
              type: 'string',
              category: 'general',
            },
          ],
          changeReason: 'Bulk update test',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settings.length).toBe(2);
    });

    it('should validate settings array', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      await request(app)
        .put('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          settings: [],
        })
        .expect(400);
    });
  });

  describe('DELETE /api/v1/admin/settings/:key', () => {
    it('should delete a setting', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      await prisma.systemSettings.create({
        data: {
          key: 'test.delete',
          value: 'delete me',
          type: 'string',
          category: 'general',
          createdBy: adminId,
          updatedBy: adminId,
        },
      });

      await request(app)
        .delete('/api/v1/admin/settings/test.delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify it's deleted
      const setting = await prisma.systemSettings.findUnique({
        where: { key: 'test.delete' },
      });
      expect(setting).toBeNull();
    });

    it('should return 404 for non-existent setting', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      await request(app)
        .delete('/api/v1/admin/settings/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/admin/settings/:key/history', () => {
    it('should get setting change history', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      // Create and update a setting to generate history
      await prisma.systemSettings.create({
        data: {
          key: 'test.history',
          value: 'initial',
          type: 'string',
          category: 'general',
          createdBy: adminId,
          updatedBy: adminId,
        },
      });

      await prisma.settingsHistory.create({
        data: {
          key: 'test.history',
          oldValue: 'initial',
          newValue: 'updated',
          changedBy: adminId,
          changeReason: 'Test update',
        },
      });

      const response = await request(app)
        .get('/api/v1/admin/settings/test.history/history')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.history).toBeInstanceOf(Array);
      expect(response.body.data.history.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/settings/public', () => {
    it('should get public settings without authentication', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test - database not available');
        return;
      }

      // Create public and private settings
      await prisma.systemSettings.createMany({
        data: [
          {
            key: 'public.setting',
            value: 'public value',
            type: 'string',
            category: 'general',
            isPublic: true,
            createdBy: adminId,
            updatedBy: adminId,
          },
          {
            key: 'private.setting',
            value: 'private value',
            type: 'string',
            category: 'general',
            isPublic: false,
            createdBy: adminId,
            updatedBy: adminId,
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/settings/public')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settings).toHaveProperty('public.setting');
      expect(response.body.data.settings).not.toHaveProperty('private.setting');
    });
  });
});

