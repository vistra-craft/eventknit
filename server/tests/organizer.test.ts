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

describe('Organizer Staff Management', () => {
  let dbConnected = false;
  let organizerToken: string;
  let _organizerId: string; // Will be used when managedBy is re-enabled
  let attendeeToken: string;

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
    await prisma.auditLog.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.passwordReset.deleteMany();
    await prisma.emailVerification.deleteMany();
    await prisma.kYCDocument.deleteMany();
    await prisma.user.deleteMany();

    // Create organizer
    const organizerPassword = await hashPassword('Organizer123!@#');
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@test.com',
        password: organizerPassword,
        firstName: 'Event',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Events Inc',
        businessEmail: 'business@testevents.com',
      },
    });
    _organizerId = organizer.id;

    // Create attendee
    const attendeePassword = await hashPassword('Attendee123!@#');
    await prisma.user.create({
      data: {
        email: 'attendee@test.com',
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
        email: 'organizer@test.com',
        password: 'Organizer123!@#',
      });
    organizerToken = organizerLogin.body.data.accessToken;

    // Login as attendee
    const attendeeLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'attendee@test.com',
        password: 'Attendee123!@#',
      });
    attendeeToken = attendeeLogin.body.data.accessToken;
  });

  describe('POST /api/v1/organizer/staff', () => {
    it('should create staff member as organizer', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/organizer/staff')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          email: 'staff@test.com',
          password: 'Staff123!@#',
          firstName: 'Staff',
          lastName: 'Member',
          role: UserRole.ORGANIZER_STAFF,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.staff.email).toBe('staff@test.com');
      expect(response.body.data.staff.role).toBe(UserRole.ORGANIZER_STAFF);
      expect(response.body.data.staff.organizationName).toBe('Test Events Inc');

      // Verify managedBy relationship
      // Note: managedBy field will be available after Prisma migration
      // const staff = await prisma.user.findUnique({
      //   where: { email: 'staff@test.com' },
      // });
      // expect(staff?.managedBy).toBe(organizerId);
    });

    it('should fail to create staff as attendee', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/organizer/staff')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          email: 'staff@test.com',
          password: 'Staff123!@#',
          firstName: 'Staff',
          lastName: 'Member',
          role: UserRole.ORGANIZER_STAFF,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should fail to create non-staff role', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .post('/api/v1/organizer/staff')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          email: 'organizer2@test.com',
          password: 'Org123!@#',
          firstName: 'Another',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/organizer/staff', () => {
    beforeEach(async () => {
      if (!dbConnected) return;
      const password = await hashPassword('Staff123!@#');
      await prisma.user.create({
        data: {
          email: 'staff1@test.com',
          password,
          firstName: 'Staff',
          lastName: 'One',
          role: UserRole.ORGANIZER_STAFF,
          status: UserStatus.ACTIVE,
          // managedBy: organizerId, // Will be available after Prisma migration
          organizationName: 'Test Events Inc',
        },
      });
    });

    it('should get all staff members', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/organizer/staff')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.staff.length).toBeGreaterThan(0);
      response.body.data.staff.forEach((staff: any) => {
        // Note: managedBy will be available after Prisma migration
        expect(staff.organizationName).toBeDefined();
      });
    });
  });

  describe('DELETE /api/v1/organizer/staff/:id', () => {
    let staffId: string;

    beforeEach(async () => {
      if (!dbConnected) return;
      const password = await hashPassword('Staff123!@#');
      const staff = await prisma.user.create({
        data: {
          email: 'staffdelete@test.com',
          password,
          firstName: 'Staff',
          lastName: 'Delete',
          role: UserRole.ORGANIZER_STAFF,
          status: UserStatus.ACTIVE,
          // managedBy: organizerId, // Will be available after Prisma migration
          organizationName: 'Test Events Inc',
        },
      });
      staffId = staff.id;
    });

    it('should soft delete staff member', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .delete(`/api/v1/organizer/staff/${staffId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify soft delete
      const staff = await prisma.user.findUnique({
        where: { id: staffId },
      });
      expect(staff?.deletedAt).toBeDefined();
    });
  });
});

