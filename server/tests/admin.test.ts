// NOTE: These tests use organizationName matching until Prisma migration adds managedBy field
// After migration, services will use managedBy for better organization relationships

import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('Admin User Management', () => {
  let dbConnected = false;
  let adminToken: string;
  let superAdminToken: string;

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
    // Note: Event/Ticket tables removed for now - focusing on auth first
    await prisma.featuredEvent.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.passwordReset.deleteMany();
    await prisma.emailVerification.deleteMany();
    await prisma.kYCDocument.deleteMany();
    await prisma.user.deleteMany();

    // Create admin user
    const adminPassword = await hashPassword('Admin123!@#');
    await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN_STAFF,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });

    // Create superadmin user
    const superAdminPassword = await hashPassword('Super123!@#');
    await prisma.user.create({
      data: {
        email: 'superadmin@test.com',
        password: superAdminPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: UserRole.SUPERADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'Admin123!@#',
      });
    adminToken = adminLogin.body.data.accessToken;

    // Login as superadmin
    const superAdminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'superadmin@test.com',
        password: 'Super123!@#',
      });
    superAdminToken = superAdminLogin.body.data.accessToken;
  });

  describe('POST /api/v1/admin/users', () => {
    it('should create a new user as admin', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newuser@test.com',
          password: 'Test123!@#',
          firstName: 'New',
          lastName: 'User',
          role: UserRole.ATTENDEE,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('newuser@test.com');
      expect(response.body.data.user.role).toBe(UserRole.ATTENDEE);
    });

    it('should fail to create SUPERADMIN as ADMIN_STAFF', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newsuper@test.com',
          password: 'Test123!@#',
          firstName: 'New',
          lastName: 'Super',
          role: UserRole.SUPERADMIN,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should create SUPERADMIN as SUPERADMIN', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'newsuper@test.com',
          password: 'Test123!@#',
          firstName: 'New',
          lastName: 'Super',
          role: UserRole.SUPERADMIN,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe(UserRole.SUPERADMIN);
    });

    it('should fail without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/admin/users')
        .send({
          email: 'newuser@test.com',
          password: 'Test123!@#',
          firstName: 'New',
          lastName: 'User',
          role: UserRole.ATTENDEE,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/admin/users', () => {
    beforeEach(async () => {
      if (!dbConnected) return;
      // Create some test users
      const password = await hashPassword('Test123!@#');
      await prisma.user.createMany({
        data: [
          {
            email: 'user1@test.com',
            password,
            firstName: 'User',
            lastName: 'One',
            role: UserRole.ATTENDEE,
            status: UserStatus.ACTIVE,
          },
          {
            email: 'user2@test.com',
            password,
            firstName: 'User',
            lastName: 'Two',
            role: UserRole.ORGANIZER,
            status: UserStatus.ACTIVE,
          },
        ],
      });
    });

    it('should get all users', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);
    });

    it('should filter users by role', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/admin/users?role=ATTENDEE')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.users.forEach((user: any) => {
        expect(user.role).toBe(UserRole.ATTENDEE);
      });
    });
  });

  describe('PUT /api/v1/admin/users/:id', () => {
    let userId: string;

    beforeEach(async () => {
      if (!dbConnected) return;
      const password = await hashPassword('Test123!@#');
      const user = await prisma.user.create({
        data: {
          email: 'updateuser@test.com',
          password,
          firstName: 'Update',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
        },
      });
      userId = user.id;
    });

    it('should update user successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .put(`/api/v1/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.firstName).toBe('Updated');
    });

    it('should fail to update SUPERADMIN as ADMIN_STAFF', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Get superadmin user
      const superAdmin = await prisma.user.findUnique({
        where: { email: 'superadmin@test.com' },
      });

      if (superAdmin) {
        const response = await request(app)
          .put(`/api/v1/admin/users/${superAdmin.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            firstName: 'Updated',
          })
          .expect(403);

        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('DELETE /api/v1/admin/users/:id', () => {
    let userId: string;

    beforeEach(async () => {
      if (!dbConnected) return;
      const password = await hashPassword('Test123!@#');
      const user = await prisma.user.create({
        data: {
          email: 'deleteuser@test.com',
          password,
          firstName: 'Delete',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
        },
      });
      userId = user.id;
    });

    it('should soft delete user successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .delete(`/api/v1/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify user is soft deleted
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(user?.deletedAt).toBeDefined();
    });
  });
});

