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

describe('Career Inquiry System', () => {
  let dbConnected = false;
  let adminToken: string;
  let adminId: string;

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

    // Clear career inquiries and related tables
    await prisma.$transaction(async (tx) => {
      await tx.careerInquiry.deleteMany();
      await tx.auditLog.deleteMany();
      await tx.refreshToken.deleteMany();
      await tx.magicLinkToken.deleteMany();
      await tx.passwordReset.deleteMany();
      await tx.emailVerification.deleteMany();
      await tx.user.deleteMany();
    });

    // Create admin user
    const hashedPassword = await hashPassword('Admin123!@$');
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Test',
        role: UserRole.SUPERADMIN,
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

  describe('POST /api/v1/careers - Submit Career Inquiry', () => {
    it('should submit a career inquiry successfully', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test: Database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/careers')
        .send({ email: 'candidate@example.com' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('candidate@example.com');

      // Verify inquiry was created in database
      const inquiry = await prisma.careerInquiry.findFirst({
        where: { email: 'candidate@example.com' },
      });
      expect(inquiry).not.toBeNull();
      expect(inquiry?.status).toBe('PENDING');
    });

    it('should reject invalid email format', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test: Database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/careers')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject empty email', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test: Database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/careers')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle duplicate submissions within 24 hours gracefully', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test: Database not connected');
        return;
      }

      // First submission
      await request(app)
        .post('/api/v1/careers')
        .send({ email: 'candidate@example.com' });

      // Second submission (should still return success but not create duplicate)
      const response = await request(app)
        .post('/api/v1/careers')
        .send({ email: 'candidate@example.com' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Verify only one inquiry exists
      const count = await prisma.careerInquiry.count({
        where: { email: 'candidate@example.com' },
      });
      expect(count).toBe(1);
    });

    it('should normalize email to lowercase', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test: Database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/careers')
        .send({ email: 'Candidate@EXAMPLE.com' });

      expect(response.status).toBe(201);

      const inquiry = await prisma.careerInquiry.findFirst({
        where: { email: 'candidate@example.com' },
      });
      expect(inquiry).not.toBeNull();
    });
  });

  describe('GET /api/v1/careers - List Career Inquiries (Admin)', () => {
    beforeEach(async () => {
      if (!dbConnected) return;

      // Create some test inquiries
      await prisma.careerInquiry.createMany({
        data: [
          { email: 'candidate1@example.com', status: 'PENDING' },
          { email: 'candidate2@example.com', status: 'CONTACTED' },
          { email: 'candidate3@example.com', status: 'PENDING' },
        ],
      });
    });

    it('should return all inquiries for admin', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test: Database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/careers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.inquiries.length).toBe(3);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter inquiries by status', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test: Database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/careers')
        .query({ status: 'PENDING' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.inquiries.length).toBe(2);
    });

    it('should support pagination', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test: Database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/careers')
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.inquiries.length).toBe(2);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });

    it('should reject unauthenticated requests', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test: Database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/careers');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/careers/:id - Update Career Inquiry (Admin)', () => {
    let inquiryId: string;

    beforeEach(async () => {
      if (!dbConnected) return;

      const inquiry = await prisma.careerInquiry.create({
        data: { email: 'candidate@example.com', status: 'PENDING' },
      });
      inquiryId = inquiry.id;
    });

    it('should update inquiry status', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test: Database not connected');
        return;
      }

      const response = await request(app)
        .patch(`/api/v1/careers/${inquiryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CONTACTED', notes: 'Reached out via email' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CONTACTED');
      expect(response.body.data.notes).toBe('Reached out via email');
      expect(response.body.data.reviewedBy).toBe(adminId);
    });

    it('should reject invalid status', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test: Database not connected');
        return;
      }

      const response = await request(app)
        .patch(`/api/v1/careers/${inquiryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INVALID_STATUS' });

      expect(response.status).toBe(400);
    });

    it('should reject unauthenticated requests', async () => {
      if (!dbConnected) {
        logger.warn('Skipping test: Database not connected');
        return;
      }

      const response = await request(app)
        .patch(`/api/v1/careers/${inquiryId}`)
        .send({ status: 'CONTACTED' });

      expect(response.status).toBe(401);
    });
  });
});
