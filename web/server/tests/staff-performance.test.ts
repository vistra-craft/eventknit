import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus, EventStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { generateAccessToken } from '../src/utils/jwt';
import { cleanupTestData } from './test-helpers';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('Staff Performance & Analytics', () => {
  let dbConnected = false;
  let adminToken: string;
  let organizerToken: string;
  let adminId: string;
  let organizerId: string;
  let adminStaffId: string;
  let organizerStaffId: string;
  let eventId: string;

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

    // Clear all tables using comprehensive cleanup helper
    try {
      await prisma.$transaction(async (tx) => {
        await cleanupTestData(tx);
      });
    } catch (error) {
      // If cleanup fails, log but continue - might be due to missing tables
      logger.warn('Cleanup warning:', error);
    }

    // Create test users (use upsert to handle existing users)
    const hashedPassword = await hashPassword('Test123!@$');

    // Create admin (use upsert to handle existing users)
    const admin = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN_STAFF,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
      create: {
        email: 'admin@test.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN_STAFF,
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

    // Create organizer (use upsert to handle existing users)
    const organizer = await prisma.user.upsert({
      where: { email: 'organizer@test.com' },
      update: {
        password: hashedPassword,
        firstName: 'Organizer',
        lastName: 'User',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Org',
        businessEmail: 'business@test.com',
      },
      create: {
        email: 'organizer@test.com',
        password: hashedPassword,
        firstName: 'Organizer',
        lastName: 'User',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Org',
        businessEmail: 'business@test.com',
      },
    });
    organizerId = organizer.id;
    organizerToken = generateAccessToken({
      userId: organizer.id,
      email: organizer.email,
      role: organizer.role,
    });

    // Create admin staff (use upsert to handle existing users)
    const adminStaff = await prisma.user.upsert({
      where: { email: 'adminstaff@test.com' },
      update: {
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Staff',
        role: UserRole.ADMIN_STAFF,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
      create: {
        email: 'adminstaff@test.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Staff',
        role: UserRole.ADMIN_STAFF,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    adminStaffId = adminStaff.id;

    // Create organizer staff (use upsert to handle existing users)
    const organizerStaff = await prisma.user.upsert({
      where: { email: 'organizerstaff@test.com' },
      update: {
        password: hashedPassword,
        firstName: 'Organizer',
        lastName: 'Staff',
        role: UserRole.ORGANIZER_STAFF,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
      create: {
        email: 'organizerstaff@test.com',
        password: hashedPassword,
        firstName: 'Organizer',
        lastName: 'Staff',
        role: UserRole.ORGANIZER_STAFF,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    organizerStaffId = organizerStaff.id;

    // Create test event
    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'Test Description',
        startDate: new Date('2024-12-01T10:00:00Z'),
        endDate: new Date('2024-12-01T18:00:00Z'),
        location: 'Test Location',
        organizerId,
        status: EventStatus.APPROVED,
        capacity: 100,
      },
    });
    eventId = event.id;

    // Create staff assignment
    await prisma.eventStaff.create({
      data: {
        eventId,
        staffId: adminStaffId,
        staffType: 'ADMIN_STAFF' as const,
        role: 'SCANNER' as const,
        assignedBy: adminId,
        assignedAt: new Date('2024-11-01T00:00:00Z'),
        shiftStart: new Date('2024-12-01T09:00:00Z'),
        shiftEnd: new Date('2024-12-01T19:00:00Z'),
      },
    });

    // Create organizer staff assignment
    await prisma.eventStaff.create({
      data: {
        eventId,
        staffId: organizerStaffId,
        staffType: 'ORGANIZER_STAFF' as const,
        role: 'SCANNER' as const,
        assignedBy: organizerId,
        assignedAt: new Date('2024-11-01T00:00:00Z'),
        shiftStart: new Date('2024-12-01T09:00:00Z'),
        shiftEnd: new Date('2024-12-01T19:00:00Z'),
      },
    });
  });

  describe('Admin Staff Performance', () => {
    describe('GET /api/v1/admin/staff-performance/:staffId', () => {
      it('should get staff performance metrics', async () => {
        if (!dbConnected) return;

        const response = await request(app)
          .get(`/api/v1/admin/staff-performance/${adminStaffId}?period=all`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('staffId', adminStaffId);
        expect(response.body.data).toHaveProperty('staffName');
        expect(response.body.data).toHaveProperty('totalScans');
        expect(response.body.data).toHaveProperty('eventsAssigned');
        expect(response.body.data).toHaveProperty('attendanceRate');
      });

      it('should require authentication', async () => {
        if (!dbConnected) return;

        const response = await request(app)
          .get(`/api/v1/admin/staff-performance/${adminStaffId}`);

        expect(response.status).toBe(401);
      });

      it('should reject non-admin users', async () => {
        if (!dbConnected) return;

        // Create a real attendee user for the test
        const attendeePassword = await hashPassword('Test123!@$');
        const attendee = await prisma.user.upsert({
          where: { email: 'test-attendee-staff@test.com' },
          update: {
            password: attendeePassword,
            firstName: 'Test',
            lastName: 'Attendee',
            role: UserRole.ATTENDEE,
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
          },
          create: {
            email: 'test-attendee-staff@test.com',
            password: attendeePassword,
            firstName: 'Test',
            lastName: 'Attendee',
            role: UserRole.ATTENDEE,
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
          },
        });

        const attendeeToken = generateAccessToken({
          userId: attendee.id,
          email: attendee.email,
          role: attendee.role,
        });

        const response = await request(app)
          .get(`/api/v1/admin/staff-performance/${adminStaffId}`)
          .set('Authorization', `Bearer ${attendeeToken}`);

        expect(response.status).toBe(403);

        // Clean up - no longer needed since upsert handles it, but keep for clarity
        // await prisma.user.delete({ where: { id: attendee.id } });
      });
    });

    describe('GET /api/v1/admin/staff-performance/team', () => {
      it('should get team performance metrics', async () => {
        if (!dbConnected) return;

        const response = await request(app)
          .get('/api/v1/admin/staff-performance/team?period=all')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('performances');
        expect(response.body.data).toHaveProperty('count');
        expect(Array.isArray(response.body.data.performances)).toBe(true);
      });

      it('should support limit parameter', async () => {
        if (!dbConnected) return;

        const response = await request(app)
          .get('/api/v1/admin/staff-performance/team?period=all&limit=5')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/v1/admin/staff-performance/team/summary', () => {
      it('should get team performance summary', async () => {
        if (!dbConnected) return;

        const response = await request(app)
          .get('/api/v1/admin/staff-performance/team/summary?period=all')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalStaff');
        expect(response.body.data).toHaveProperty('activeStaff');
        expect(response.body.data).toHaveProperty('totalEvents');
        expect(response.body.data).toHaveProperty('totalScans');
        expect(response.body.data).toHaveProperty('averageScansPerStaff');
        expect(response.body.data).toHaveProperty('averageAttendanceRate');
        expect(response.body.data).toHaveProperty('topPerformers');
      });
    });

    describe('GET /api/v1/admin/staff-performance/:staffId/trends', () => {
      it('should get performance trends', async () => {
        if (!dbConnected) return;

        const response = await request(app)
          .get(`/api/v1/admin/staff-performance/${adminStaffId}/trends?period=month`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });
    });
  });

  describe('Organizer Staff Performance', () => {
    describe('GET /api/v1/organizer/staff-performance/:staffId', () => {
      it('should get organizer staff performance metrics', async () => {
        if (!dbConnected) return;

        const response = await request(app)
          .get(`/api/v1/organizer/staff-performance/${organizerStaffId}?period=all`)
          .set('Authorization', `Bearer ${organizerToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('staffId', organizerStaffId);
      });
    });

    describe('GET /api/v1/organizer/staff-performance/team', () => {
      it('should get organizer team performance', async () => {
        if (!dbConnected) return;

        const response = await request(app)
          .get('/api/v1/organizer/staff-performance/team?period=all')
          .set('Authorization', `Bearer ${organizerToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('performances');
      });
    });

    describe('GET /api/v1/organizer/staff-performance/utilization', () => {
      it('should get staff utilization metrics', async () => {
        if (!dbConnected) return;

        const response = await request(app)
          .get('/api/v1/organizer/staff-performance/utilization?period=month')
          .set('Authorization', `Bearer ${organizerToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalStaff');
        expect(response.body.data).toHaveProperty('activeStaff');
        expect(response.body.data).toHaveProperty('utilizationRate');
        expect(response.body.data).toHaveProperty('averageEventsPerStaff');
        expect(response.body.data).toHaveProperty('averageHoursPerStaff');
        expect(response.body.data).toHaveProperty('underutilizedStaff');
        expect(response.body.data).toHaveProperty('overutilizedStaff');
      });
    });

    describe('GET /api/v1/organizer/staff-performance/coverage', () => {
      it('should get event coverage analysis', async () => {
        if (!dbConnected) return;

        const response = await request(app)
          .get('/api/v1/organizer/staff-performance/coverage?period=month')
          .set('Authorization', `Bearer ${organizerToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalEvents');
        expect(response.body.data).toHaveProperty('eventsWithStaff');
        expect(response.body.data).toHaveProperty('eventsWithoutStaff');
        expect(response.body.data).toHaveProperty('averageStaffPerEvent');
        expect(response.body.data).toHaveProperty('eventsByCoverage');
      });
    });

    describe('GET /api/v1/organizer/staff-performance/availability', () => {
      it('should get staff availability tracking', async () => {
        if (!dbConnected) return;

        const response = await request(app)
          .get('/api/v1/organizer/staff-performance/availability?period=month')
          .set('Authorization', `Bearer ${organizerToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('staffAvailability');
        expect(response.body.data).toHaveProperty('overallAvailability');
        expect(Array.isArray(response.body.data.staffAvailability)).toBe(true);
        expect(response.body.data.overallAvailability).toHaveProperty('totalShifts');
        expect(response.body.data.overallAvailability).toHaveProperty('completedShifts');
        expect(response.body.data.overallAvailability).toHaveProperty('averageAvailabilityRate');
        expect(response.body.data.overallAvailability).toHaveProperty('peakDays');
      });
    });
  });

  describe('Performance Period Validation', () => {
    it('should reject invalid period', async () => {
      if (!dbConnected) return;

      const response = await request(app)
        .get(`/api/v1/admin/staff-performance/${adminStaffId}?period=invalid`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('should accept valid periods', async () => {
      if (!dbConnected) return;

      const periods = ['today', 'week', 'month', 'quarter', 'year', 'all'];
      
      for (const period of periods) {
        const response = await request(app)
          .get(`/api/v1/admin/staff-performance/${adminStaffId}?period=${period}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
      }
    });
  });
});

