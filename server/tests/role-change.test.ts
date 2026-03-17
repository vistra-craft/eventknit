import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { cleanupTestData } from './test-helpers.js';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('Role Change API', () => {
  let dbConnected = false;

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
    await prisma.$transaction(async (tx) => {
      await cleanupTestData(tx);
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Admin: PATCH /api/v1/admin/users/:id/role
  // ──────────────────────────────────────────────────────────────────────
  describe('PATCH /api/v1/admin/users/:id/role', () => {
    let adminToken: string;
    let targetUserId: string;

    beforeEach(async () => {
      if (!dbConnected) return;

      // Create admin
      const hashedPassword = await hashPassword('Admin123!@$');
      await prisma.user.create({
        data: {
          email: 'roleadmin@test.com',
          password: hashedPassword,
          firstName: 'Role',
          lastName: 'Admin',
          role: UserRole.SUPERADMIN,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });
      // Login as admin
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'roleadmin@test.com', password: 'Admin123!@$' })
        .expect(200);
      adminToken = loginResponse.body.data.accessToken;

      // Create target user
      const targetPassword = await hashPassword('Target123!@$');
      const target = await prisma.user.create({
        data: {
          email: 'targetuser@test.com',
          password: targetPassword,
          firstName: 'Target',
          lastName: 'User',
          role: UserRole.SUPPORT,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });
      targetUserId = target.id;
    });

    afterEach(async () => {
      if (!dbConnected) return;
      await prisma.refreshToken.deleteMany({
        where: { user: { email: { in: ['roleadmin@test.com', 'targetuser@test.com'] } } },
      });
      await prisma.user.deleteMany({
        where: { email: { in: ['roleadmin@test.com', 'targetuser@test.com'] } },
      });
    });

    it('should change user role successfully', async () => {
      if (!dbConnected) return;

      const response = await request(app)
        .patch(`/api/v1/admin/users/${targetUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: UserRole.ADMIN })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe(UserRole.ADMIN);
      expect(response.body.message).toContain('ADMIN');

      // Verify role persisted in database
      const user = await prisma.user.findUnique({ where: { id: targetUserId } });
      expect(user?.role).toBe(UserRole.ADMIN);
    });

    it('should revoke all refresh tokens after role change', async () => {
      if (!dbConnected) return;

      // Login as target user first to create a refresh token
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'targetuser@test.com', password: 'Target123!@$' })
        .expect(200);

      // Verify target has an active refresh token
      const tokensBefore = await prisma.refreshToken.findMany({
        where: { userId: targetUserId, revoked: false },
      });
      expect(tokensBefore.length).toBeGreaterThan(0);

      // Change role
      await request(app)
        .patch(`/api/v1/admin/users/${targetUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: UserRole.TELLER })
        .expect(200);

      // All tokens should be revoked
      const tokensAfter = await prisma.refreshToken.findMany({
        where: { userId: targetUserId, revoked: false },
      });
      expect(tokensAfter.length).toBe(0);
    });

    it('should reject same role (no-op)', async () => {
      if (!dbConnected) return;

      await request(app)
        .patch(`/api/v1/admin/users/${targetUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: UserRole.SUPPORT }) // Already SUPPORT
        .expect(400);
    });

    it('should require authentication', async () => {
      if (!dbConnected) return;

      await request(app)
        .patch(`/api/v1/admin/users/${targetUserId}/role`)
        .send({ role: UserRole.ADMIN })
        .expect(401);
    });

    it('should prevent ADMIN from assigning SUPERADMIN role', async () => {
      if (!dbConnected) return;

      // Create a regular ADMIN
      const adminPw = await hashPassword('RegAdmin123!@$');
      const regAdmin = await prisma.user.create({
        data: {
          email: 'regadmin@test.com',
          password: adminPw,
          firstName: 'Regular',
          lastName: 'Admin',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const regLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'regadmin@test.com', password: 'RegAdmin123!@$' })
        .expect(200);

      // Try to promote to SUPERADMIN — should be denied
      await request(app)
        .patch(`/api/v1/admin/users/${targetUserId}/role`)
        .set('Authorization', `Bearer ${regLogin.body.data.accessToken}`)
        .send({ role: UserRole.SUPERADMIN })
        .expect(403);

      // Cleanup
      await prisma.refreshToken.deleteMany({ where: { userId: regAdmin.id } });
      await prisma.user.deleteMany({ where: { email: 'regadmin@test.com' } });
    });

    it('should return 404 for non-existent user', async () => {
      if (!dbConnected) return;

      await request(app)
        .patch('/api/v1/admin/users/00000000-0000-0000-0000-000000000000/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: UserRole.ADMIN })
        .expect(404);
    });

    it('should create audit log entry', async () => {
      if (!dbConnected) return;

      await request(app)
        .patch(`/api/v1/admin/users/${targetUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: UserRole.TELLER })
        .expect(200);

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          entityId: targetUserId,
          entity: 'User',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      const metadata = auditLog?.metadata as Record<string, unknown>;
      expect(metadata?.action).toBe('role_change');
      expect(metadata?.oldRole).toBe(UserRole.SUPPORT);
      expect(metadata?.newRole).toBe(UserRole.TELLER);
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Organizer: PATCH /api/v1/organizer/staff/:id/role
  // ──────────────────────────────────────────────────────────────────────
  describe('PATCH /api/v1/organizer/staff/:id/role', () => {
    let organizerToken: string;
    let organizerId: string;
    let staffId: string;

    beforeEach(async () => {
      if (!dbConnected) return;

      // Create organizer
      const orgPw = await hashPassword('Organizer123!@$');
      const organizer = await prisma.user.create({
        data: {
          email: 'roleorganizer@test.com',
          password: orgPw,
          firstName: 'Role',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          organizationName: 'Role Test Org',
        },
      });
      organizerId = organizer.id;

      // Login as organizer
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'roleorganizer@test.com', password: 'Organizer123!@$' })
        .expect(200);
      organizerToken = loginResponse.body.data.accessToken;

      // Create staff member (ORGANIZER_TELLER)
      const staffPw = await hashPassword('Staff123!@$');
      const staff = await prisma.user.create({
        data: {
          email: 'orgstaff@test.com',
          password: staffPw,
          firstName: 'Staff',
          lastName: 'Member',
          role: UserRole.ORGANIZER_TELLER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          organizationName: 'Role Test Org',
          managedBy: organizerId,
        },
      });
      staffId = staff.id;
    });

    afterEach(async () => {
      if (!dbConnected) return;
      await prisma.refreshToken.deleteMany({
        where: { user: { email: { in: ['roleorganizer@test.com', 'orgstaff@test.com'] } } },
      });
      await prisma.user.deleteMany({
        where: { email: { in: ['roleorganizer@test.com', 'orgstaff@test.com'] } },
      });
    });

    it('should promote staff from ORGANIZER_TELLER to ORGANIZER_ADMIN', async () => {
      if (!dbConnected) return;

      const response = await request(app)
        .patch(`/api/v1/organizer/staff/${staffId}/role`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ role: UserRole.ORGANIZER_ADMIN })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.staff.role).toBe(UserRole.ORGANIZER_ADMIN);

      // Verify in database
      const staff = await prisma.user.findUnique({ where: { id: staffId } });
      expect(staff?.role).toBe(UserRole.ORGANIZER_ADMIN);
    });

    it('should demote staff from ORGANIZER_ADMIN to ORGANIZER_TELLER', async () => {
      if (!dbConnected) return;

      // First promote
      await prisma.user.update({
        where: { id: staffId },
        data: { role: UserRole.ORGANIZER_ADMIN },
      });

      const response = await request(app)
        .patch(`/api/v1/organizer/staff/${staffId}/role`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ role: UserRole.ORGANIZER_TELLER })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.staff.role).toBe(UserRole.ORGANIZER_TELLER);
    });

    it('should reject assigning non-staff roles (e.g. ADMIN)', async () => {
      if (!dbConnected) return;

      await request(app)
        .patch(`/api/v1/organizer/staff/${staffId}/role`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ role: UserRole.ADMIN })
        .expect(403);
    });

    it('should reject changing role to same role', async () => {
      if (!dbConnected) return;

      await request(app)
        .patch(`/api/v1/organizer/staff/${staffId}/role`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ role: UserRole.ORGANIZER_TELLER }) // Already ORGANIZER_TELLER
        .expect(409);
    });

    it('should prevent organizer from changing other org staff', async () => {
      if (!dbConnected) return;

      // Create staff in different org
      const otherStaffPw = await hashPassword('Other123!@$');
      const otherStaff = await prisma.user.create({
        data: {
          email: 'otherorgstaff@test.com',
          password: otherStaffPw,
          firstName: 'Other',
          lastName: 'Staff',
          role: UserRole.ORGANIZER_TELLER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          organizationName: 'Different Org',
        },
      });

      await request(app)
        .patch(`/api/v1/organizer/staff/${otherStaff.id}/role`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ role: UserRole.ORGANIZER_ADMIN })
        .expect(403);

      // Cleanup
      await prisma.user.deleteMany({ where: { email: 'otherorgstaff@test.com' } });
    });

    it('should require authentication', async () => {
      if (!dbConnected) return;

      await request(app)
        .patch(`/api/v1/organizer/staff/${staffId}/role`)
        .send({ role: UserRole.ORGANIZER_ADMIN })
        .expect(401);
    });

    it('should revoke staff sessions after role change', async () => {
      if (!dbConnected) return;

      // Login as staff to create refresh token
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'orgstaff@test.com', password: 'Staff123!@$' })
        .expect(200);

      // Verify token exists
      const tokensBefore = await prisma.refreshToken.count({
        where: { userId: staffId },
      });
      expect(tokensBefore).toBeGreaterThan(0);

      // Change role
      await request(app)
        .patch(`/api/v1/organizer/staff/${staffId}/role`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ role: UserRole.ORGANIZER_ADMIN })
        .expect(200);

      // All tokens should be deleted (organizer service uses deleteMany)
      const tokensAfter = await prisma.refreshToken.count({
        where: { userId: staffId },
      });
      expect(tokensAfter).toBe(0);
    });
  });
});
