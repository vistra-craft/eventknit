import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { UserRole, UserStatus, EventStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../src/utils/logger';
import { generateAccessToken } from '../src/utils/jwt';

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

    // Clear all tables in correct order to respect foreign keys
    await prisma.$transaction(async (tx) => {
      await tx.eventStaff.deleteMany();
      await tx.featuredEvent.deleteMany();
      await tx.eventRegistration.deleteMany();
      await tx.eventInvitation.deleteMany();
      await tx.ticketTemplate.deleteMany();
      await tx.event.deleteMany();
      await tx.auditLog.deleteMany();
      await tx.refreshToken.deleteMany();
      await tx.magicLinkToken.deleteMany();
      await tx.passwordReset.deleteMany();
      await tx.emailVerification.deleteMany();
      await tx.kYCDocument.deleteMany();
      await tx.user.deleteMany();
    });

    // Create test users
    const hashedPassword = await hashPassword('Test123!@$');

    // Create admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN_STAFF,
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

    // Create superadmin
    const superAdmin = await prisma.user.create({
      data: {
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

    // Create organizer
    const organizer = await prisma.user.create({
      data: {
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

    // Create admin staff member
    const adminStaff = await prisma.user.create({
      data: {
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

    // Create organizer staff member
    const organizerStaff = await prisma.user.create({
      data: {
        email: 'organizerstaff@test.com',
        password: hashedPassword,
        firstName: 'Organizer',
        lastName: 'Staff',
        role: UserRole.ORGANIZER_STAFF,
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
        expect(response.body.data.assignment.staffType).toBe('ADMIN_STAFF');
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

        const attendeeToken = generateAccessToken({
          userId: 'attendee-id',
          email: 'attendee@test.com',
          role: UserRole.ATTENDEE,
        });

        const response = await request(app)
          .post(`/api/v1/admin/events/${eventId}/staff`)
          .set('Authorization', `Bearer ${attendeeToken}`)
          .send({
            staffId: adminStaffId,
            role: 'SCANNER',
          });

        expect(response.status).toBe(403);
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
          .get(`/api/v1/admin/events/${eventId}/staff?staffType=ADMIN_STAFF`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.assignments.every((a: { staffType: string }) => a.staffType === 'ADMIN_STAFF')).toBe(true);
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
          .get(`/api/v1/admin/staff/${adminStaffId}/events?status=PUBLISHED`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.assignments.every((a: { event: { status: string } }) => a.event.status === 'PUBLISHED')).toBe(true);
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
            role: UserRole.ADMIN_STAFF,
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
        expect(response.body.data.assignment.staffType).toBe('ORGANIZER_STAFF');
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
            role: UserRole.ORGANIZER_STAFF,
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

        // Create another organizer and event
        const otherOrganizer = await prisma.user.create({
          data: {
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
          role: UserRole.ADMIN_STAFF,
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

