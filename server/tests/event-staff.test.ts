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

describe('Event Staff Management', () => {
  let dbConnected = false;
  let adminToken: string;
  let _superAdminToken: string;
  let organizerToken: string;
  let _adminId: string;
  let _superAdminId: string;
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

    // Clear all tables - cleanupTestData uses TRUNCATE CASCADE which handles FKs
    await prisma.eventStaff.deleteMany().catch(() => {});
    await cleanupTestData();

    // Create test users
    const hashedPassword = await hashPassword('Test123!@$');

    // Create admin (use upsert to handle existing users)
    const admin = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
      create: {
        email: 'admin@test.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    _adminId = admin.id;
    adminToken = generateAccessToken({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
    });

    // Create superadmin (use upsert to handle existing users)
    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@test.com' },
      update: {
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: UserRole.SUPERADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
      create: {
        email: 'superadmin@test.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: UserRole.SUPERADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    _superAdminId = superAdmin.id;
    _superAdminToken = generateAccessToken({
      userId: superAdmin.id,
      email: superAdmin.email,
      role: superAdmin.role,
    });

    // Create organizer (use upsert to handle existing users)
    const organizer = await prisma.user.upsert({
      where: { email: 'organizer@test.com' },
      update: {
        password: hashedPassword,
        firstName: 'Event',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Events Inc',
      },
      create: {
        email: 'organizer@test.com',
        password: hashedPassword,
        firstName: 'Event',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Events Inc',
      },
    });
    organizerId = organizer.id;
    organizerToken = generateAccessToken({
      userId: organizer.id,
      email: organizer.email,
      role: organizer.role,
    });

    // Create admin staff member (use upsert to handle existing users)
    const adminStaff = await prisma.user.upsert({
      where: { email: 'adminstaff@test.com' },
      update: {
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Staff',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
      create: {
        email: 'adminstaff@test.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Staff',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    adminStaffId = adminStaff.id;

    // Create organizer staff member (use upsert to handle existing users)
    const organizerStaff = await prisma.user.upsert({
      where: { email: 'organizerstaff@test.com' },
      update: {
        password: hashedPassword,
        firstName: 'Organizer',
        lastName: 'Staff',
        role: UserRole.ORGANIZER_ADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Events Inc',
      },
      create: {
        email: 'organizerstaff@test.com',
        password: hashedPassword,
        firstName: 'Organizer',
        lastName: 'Staff',
        role: UserRole.ORGANIZER_ADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Events Inc',
      },
    });
    organizerStaffId = organizerStaff.id;

    // Create test event
    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'Test event description',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
        location: 'Test Location',
        venue: 'Test Venue',
        organizerId,
        status: EventStatus.APPROVED,
      },
    });
    eventId = event.id;
  });

  describe('Admin Staff Assignment', () => {
    describe('POST /api/v1/admin/events/:eventId/staff', () => {
      it('should assign admin staff to event', async () => {
        if (!dbConnected) return;

        const response = await request(app)
          .post(`/api/v1/admin/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            staffId: adminStaffId,
            role: 'SCANNER',
            notes: 'Test assignment',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.assignment).toBeDefined();
        expect(response.body.data.assignment.staffId).toBe(adminStaffId);
        expect(response.body.data.assignment.role).toBe('SCANNER');
        expect(response.body.data.assignment.staffType).toBe('ADMIN');
      });

      it('should assign admin staff with shift times', async () => {
        if (!dbConnected) return;

        const shiftStart = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
        const shiftEnd = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000);

        const response = await request(app)
          .post(`/api/v1/admin/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            staffId: adminStaffId,
            role: 'SUPPORT',
            shiftStart: shiftStart.toISOString(),
            shiftEnd: shiftEnd.toISOString(),
            facility: 'Main Gate',
          });

        expect(response.status).toBe(201);
        expect(response.body.data.assignment.shiftStart).toBeDefined();
        expect(response.body.data.assignment.shiftEnd).toBeDefined();
        expect(response.body.data.assignment.facility).toBe('Main Gate');
      });

      it('should reject invalid role', async () => {
        if (!dbConnected) return;

        const response = await request(app)
          .post(`/api/v1/admin/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            staffId: adminStaffId,
            role: 'INVALID_ROLE',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should reject duplicate assignment', async () => {
        if (!dbConnected) return;

        // First assignment
        await request(app)
          .post(`/api/v1/admin/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            staffId: adminStaffId,
            role: 'SCANNER',
          });

        // Duplicate assignment
        const response = await request(app)
          .post(`/api/v1/admin/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            staffId: adminStaffId,
            role: 'SUPPORT',
          });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
      });

      it('should reject invalid shift times', async () => {
        if (!dbConnected) return;

        const shiftStart = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
        const shiftEnd = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 - 1000); // Before start

        const response = await request(app)
          .post(`/api/v1/admin/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            staffId: adminStaffId,
            role: 'SCANNER',
            shiftStart: shiftStart.toISOString(),
            shiftEnd: shiftEnd.toISOString(),
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should require authentication', async () => {
        if (!dbConnected) return;

        const response = await request(app)
          .post(`/api/v1/admin/events/${eventId}/staff`)
          .send({
            staffId: adminStaffId,
            role: 'SCANNER',
          });

        expect(response.status).toBe(401);
      });

      it('should reject non-admin users', async () => {
        if (!dbConnected) return;

        // Create a real attendee user for the test
        const attendee = await prisma.user.create({
          data: {
            email: 'test-attendee@test.com',
            password: 'hashedpassword',
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
          .post(`/api/v1/admin/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${attendeeToken}`)
          .send({
            staffId: adminStaffId,
            role: 'SCANNER',
          });

        expect(response.status).toBe(403);

        // Clean up
        await prisma.user.delete({ where: { id: attendee.id } });
      });
    });

    describe('GET /api/v1/admin/events/:eventId/staff', () => {
      it('should get staff assigned to event', async () => {
        if (!dbConnected) return;

        // Assign staff first
        await request(app)
          .post(`/api/v1/admin/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            staffId: adminStaffId,
            role: 'SCANNER',
          });

        const response = await request(app)
          .get(`/api/v1/admin/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.assignments)).toBe(true);
        expect(response.body.data.assignments.length).toBeGreaterThan(0);
      });

      it('should filter by role', async () => {
        if (!dbConnected) return;

        // Assign multiple staff with different roles
        await request(app)
          .post(`/api/v1/admin/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            staffId: adminStaffId,
            role: 'SCANNER',
          });

        const response = await request(app)
          .get(`/api/v1/admin/events/${eventId}/staff?role=SCANNER`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.assignments.every((a: { role: string }) => a.role === 'SCANNER')).toBe(true);
      });

      it('should filter by staff type', async () => {
        if (!dbConnected) return;

        await request(app)
          .post(`/api/v1/admin/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            staffId: adminStaffId,
            role: 'SCANNER',
          });

        const response = await request(app)
          .get(`/api/v1/admin/events/${eventId}/staff?staffType=ADMIN`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.assignments.every((a: { staffType: string }) => a.staffType === 'ADMIN')).toBe(true);
      });

      it('should filter by active status', async () => {
        if (!dbConnected) return;

        await request(app)
          .post(`/api/v1/admin/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            staffId: adminStaffId,
            role: 'SCANNER',
          });

        const response = await request(app)
          .get(`/api/v1/admin/events/${eventId}/staff?isActive=true`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.assignments.every((a: { isActive: boolean }) => a.isActive === true)).toBe(true);
      });
    });

    describe('GET /api/v1/admin/staff/:staffId/events', () => {
      it('should get events assigned to staff member', async () => {
        if (!dbConnected) return;

        // Assign staff to event
        await request(app)
          .post(`/api/v1/admin/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            staffId: adminStaffId,
            role: 'SCANNER',
          });

        const response = await request(app)
          .get(`/api/v1/admin/staff/${adminStaffId}/events`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.assignments)).toBe(true);
        expect(response.body.data.assignments.length).toBeGreaterThan(0);
      });

      it('should filter by event status', async () => {
        if (!dbConnected) return;

        await request(app)
          .post(`/api/v1/admin/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            staffId: adminStaffId,
            role: 'SCANNER',
          });

        const response = await request(app)
          .get(`/api/v1/admin/staff/${adminStaffId}/events?status=APPROVED`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.assignments.every((a: { event: { status: string } }) => a.event.status === 'APPROVED')).toBe(true);
      });
    });

    describe('PUT /api/v1/admin/events/:eventId/staff/:staffId', () => {
      it('should update staff assignment', async () => {
        if (!dbConnected) return;

        // Assign staff first
        await request(app)
          .post(`/api/v1/admin/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            staffId: adminStaffId,
            role: 'SCANNER',
          });

        const response = await request(app)
          .put(`/api/v1/admin/events/${eventId}/staff/${adminStaffId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            role: 'MANAGER',
            notes: 'Updated notes',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.assignment.role).toBe('MANAGER');
        expect(response.body.data.assignment.notes).toBe('Updated notes');
      });

      it('should update shift times', async () => {
        if (!dbConnected) return;

        await request(app)
          .post(`/api/v1/admin/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            staffId: adminStaffId,
            role: 'SCANNER',
          });

        const shiftStart = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
        const shiftEnd = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000);

        const response = await request(app)
          .put(`/api/v1/admin/events/${eventId}/staff/${adminStaffId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            shiftStart: shiftStart.toISOString(),
            shiftEnd: shiftEnd.toISOString(),
          });

        expect(response.status).toBe(200);
        expect(response.body.data.assignment.shiftStart).toBeDefined();
        expect(response.body.data.assignment.shiftEnd).toBeDefined();
      });

      it('should deactivate staff assignment', async () => {
        if (!dbConnected) return;

        await request(app)
          .post(`/api/v1/admin/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            staffId: adminStaffId,
            role: 'SCANNER',
          });

        const response = await request(app)
          .put(`/api/v1/admin/events/${eventId}/staff/${adminStaffId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            isActive: false,
          });

        expect(response.status).toBe(200);
        expect(response.body.data.assignment.isActive).toBe(false);
      });
    });

    describe('DELETE /api/v1/admin/events/:eventId/staff/:staffId', () => {
      it('should remove staff from event', async () => {
        if (!dbConnected) return;

        // Assign staff first
        await request(app)
          .post(`/api/v1/admin/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            staffId: adminStaffId,
            role: 'SCANNER',
          });

        const response = await request(app)
          .delete(`/api/v1/admin/events/${eventId}/staff/${adminStaffId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Verify staff is removed
        const getResponse = await request(app)
          .get(`/api/v1/admin/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(getResponse.body.data.assignments.find((a: { staffId: string }) => a.staffId === adminStaffId)).toBeUndefined();
      });
    });

    describe('POST /api/v1/admin/events/:eventId/staff/bulk', () => {
      it('should bulk assign staff to event', async () => {
        if (!dbConnected) return;

        // Create additional admin staff
        const staff2 = await prisma.user.create({
          data: {
            email: 'adminstaff2@test.com',
            password: await hashPassword('Test123!@$'),
            firstName: 'Admin',
            lastName: 'Staff2',
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
          },
        });

        const response = await request(app)
          .post(`/api/v1/admin/events/${eventId}/staff/bulk`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            staffIds: [adminStaffId, staff2.id],
            role: 'SUPPORT',
            notes: 'Bulk assignment',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.assignments.length).toBe(2);
      });

      it('should reject empty staff IDs array', async () => {
        if (!dbConnected) return;

        const response = await request(app)
          .post(`/api/v1/admin/events/${eventId}/staff/bulk`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            staffIds: [],
            role: 'SUPPORT',
          });

        expect(response.status).toBe(400);
      });
    });
  });

  describe('Organizer Staff Assignment', () => {
    describe('POST /api/v1/organizer/events/:eventId/staff', () => {
      it('should assign organizer staff to event', async () => {
        if (!dbConnected) return;

        const response = await request(app)
          .post(`/api/v1/organizer/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            staffId: organizerStaffId,
            role: 'SCANNER',
            notes: 'Organizer staff assignment',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.assignment.staffId).toBe(organizerStaffId);
        expect(response.body.data.assignment.role).toBe('SCANNER');
        expect(response.body.data.assignment.staffType).toBe('ORGANIZER_ADMIN');
      });

      it('should reject assigning staff from different organization', async () => {
        if (!dbConnected) return;

        // Create staff from different organization
        const otherStaff = await prisma.user.create({
          data: {
            email: 'otherstaff@test.com',
            password: await hashPassword('Test123!@$'),
            firstName: 'Other',
            lastName: 'Staff',
            role: UserRole.ORGANIZER_ADMIN,
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
            organizationName: 'Other Organization',
          },
        });

        const response = await request(app)
          .post(`/api/v1/organizer/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            staffId: otherStaff.id,
            role: 'SCANNER',
          });

        expect(response.status).toBe(403);
      });

      it('should reject assigning to event not owned by organizer', async () => {
        if (!dbConnected) return;

        // Create another organizer and event (use upsert to handle existing users)
        const otherOrganizer = await prisma.user.upsert({
          where: { email: 'otherorganizer@test.com' },
          update: {
            password: await hashPassword('Test123!@$'),
            firstName: 'Other',
            lastName: 'Organizer',
            role: UserRole.ORGANIZER,
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
            organizationName: 'Other Events Inc',
          },
          create: {
            email: 'otherorganizer@test.com',
            password: await hashPassword('Test123!@$'),
            firstName: 'Other',
            lastName: 'Organizer',
            role: UserRole.ORGANIZER,
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
            organizationName: 'Other Events Inc',
          },
        });

        const otherEvent = await prisma.event.create({
          data: {
            title: 'Other Event',
            description: 'Other event description',
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
            location: 'Other Location',
            venue: 'Other Venue',
            organizerId: otherOrganizer.id,
            status: EventStatus.APPROVED,
          },
        });

        const response = await request(app)
          .post(`/api/v1/organizer/events/${otherEvent.id}/staff`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            staffId: organizerStaffId,
            role: 'SCANNER',
          });

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/v1/organizer/events/:eventId/staff', () => {
      it('should get organizer staff assigned to event', async () => {
        if (!dbConnected) return;

        // Assign staff first
        await request(app)
          .post(`/api/v1/organizer/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            staffId: organizerStaffId,
            role: 'SCANNER',
          });

        const response = await request(app)
          .get(`/api/v1/organizer/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${organizerToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.assignments)).toBe(true);
        expect(response.body.data.assignments.length).toBeGreaterThan(0);
      });
    });

    describe('GET /api/v1/organizer/staff/:staffId/events', () => {
      it('should get events where organizer staff is assigned', async () => {
        if (!dbConnected) return;

        // Assign staff to event
        await request(app)
          .post(`/api/v1/organizer/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            staffId: organizerStaffId,
            role: 'SCANNER',
          });

        const response = await request(app)
          .get(`/api/v1/organizer/staff/${organizerStaffId}/events`)
          .set('Authorization', `Bearer ${organizerToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.assignments)).toBe(true);
      });
    });

    describe('GET /api/v1/organizer/staff/assignments', () => {
      it('should get all staff assignments for organizer events', async () => {
        if (!dbConnected) return;

        // Assign staff to event
        await request(app)
          .post(`/api/v1/organizer/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            staffId: organizerStaffId,
            role: 'SCANNER',
          });

        const response = await request(app)
          .get('/api/v1/organizer/staff/assignments')
          .set('Authorization', `Bearer ${organizerToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.assignments)).toBe(true);
      });

      it('should filter by eventId', async () => {
        if (!dbConnected) return;

        await request(app)
          .post(`/api/v1/organizer/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            staffId: organizerStaffId,
            role: 'SCANNER',
          });

        const response = await request(app)
          .get(`/api/v1/organizer/staff/assignments?eventId=${eventId}`)
          .set('Authorization', `Bearer ${organizerToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.assignments.every((a: { event: { id: string } }) => a.event.id === eventId)).toBe(true);
      });
    });

    describe('PUT /api/v1/organizer/events/:eventId/staff/:staffId', () => {
      it('should update organizer staff assignment', async () => {
        if (!dbConnected) return;

        // Assign staff first
        await request(app)
          .post(`/api/v1/organizer/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            staffId: organizerStaffId,
            role: 'SCANNER',
          });

        const response = await request(app)
          .put(`/api/v1/organizer/events/${eventId}/staff/${organizerStaffId}`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            role: 'MANAGER',
            notes: 'Updated by organizer',
          });

        expect(response.status).toBe(200);
        expect(response.body.data.assignment.role).toBe('MANAGER');
      });
    });

    describe('DELETE /api/v1/organizer/events/:eventId/staff/:staffId', () => {
      it('should remove organizer staff from event', async () => {
        if (!dbConnected) return;

        // Assign staff first
        await request(app)
          .post(`/api/v1/organizer/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            staffId: organizerStaffId,
            role: 'SCANNER',
          });

        const response = await request(app)
          .delete(`/api/v1/organizer/events/${eventId}/staff/${organizerStaffId}`)
          .set('Authorization', `Bearer ${organizerToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Error Cases', () => {
    it('should handle non-existent event', async () => {
      if (!dbConnected) return;

      const response = await request(app)
        .post('/api/v1/admin/events/non-existent-id/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          staffId: adminStaffId,
          role: 'SCANNER',
        });

      expect(response.status).toBe(404);
    });

    it('should handle non-existent staff', async () => {
      if (!dbConnected) return;

      const response = await request(app)
        .post(`/api/v1/admin/events/${eventId}/staff`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          staffId: 'non-existent-id',
          role: 'SCANNER',
        });

      expect(response.status).toBe(404);
    });

    it('should handle inactive staff', async () => {
      if (!dbConnected) return;

      // Create inactive staff
      const inactiveStaff = await prisma.user.create({
        data: {
          email: 'inactive@test.com',
          password: await hashPassword('Test123!@$'),
          firstName: 'Inactive',
          lastName: 'Staff',
          role: UserRole.ADMIN,
          status: UserStatus.SUSPENDED,
          isEmailVerified: true,
        },
      });

      const response = await request(app)
        .post(`/api/v1/admin/events/${eventId}/staff`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          staffId: inactiveStaff.id,
          role: 'SCANNER',
        });

      expect(response.status).toBe(400);
    });
  });
});

