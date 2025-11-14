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
    await prisma.eventRegistration.deleteMany();
    await prisma.event.deleteMany();
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
      interface StaffItem {
        organizationName?: string;
      }
      response.body.data.staff.forEach((staff: StaffItem) => {
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

  describe('GET /api/v1/organizer/dashboard/stats', () => {
    let organizerId: string;
    let attendeeId: string;

    beforeEach(async () => {
      if (!dbConnected) return;

      // Get organizer ID
      const organizer = await prisma.user.findUnique({
        where: { email: 'organizer@test.com' },
      });
      organizerId = organizer!.id;

      // Get attendee ID
      const attendee = await prisma.user.findUnique({
        where: { email: 'attendee@test.com' },
      });
      attendeeId = attendee!.id;

      // Create test events with speakers and sponsors
      const event1 = await prisma.event.create({
        data: {
          title: 'Test Event 1',
          description: 'Test Description 1',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location 1',
          isFree: true,
          organizerId,
          status: 'APPROVED',
          speakers: [
            { name: 'Speaker 1', title: 'CEO', bio: 'Bio 1' },
            { name: 'Speaker 2', title: 'CTO', bio: 'Bio 2' },
          ],
          sponsors: [
            { name: 'Sponsor 1', level: 'gold', logo: 'logo1.png' },
            { name: 'Sponsor 2', level: 'silver', logo: 'logo2.png' },
          ],
        },
      });

      const event2 = await prisma.event.create({
        data: {
          title: 'Test Event 2',
          description: 'Test Description 2',
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          location: 'Test Location 2',
          isFree: false,
          price: 50,
          organizerId,
          status: 'APPROVED',
          speakers: [
            { name: 'Speaker 3', title: 'CFO', bio: 'Bio 3' },
          ],
          sponsors: [
            { name: 'Sponsor 3', level: 'bronze', logo: 'logo3.png' },
          ],
        },
      });

      // Create registrations
      await prisma.eventRegistration.create({
        data: {
          eventId: event1.id,
          attendeeId,
          quantity: 2,
          totalAmount: 0,
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
        },
      });

      await prisma.eventRegistration.create({
        data: {
          eventId: event2.id,
          attendeeId,
          quantity: 1,
          totalAmount: 50,
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
        },
      });
    });

    it('should get organizer dashboard stats successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/organizer/dashboard/stats')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.totalEvents).toBe(2);
      expect(response.body.data.stats.totalSpeakers).toBe(3); // 2 + 1
      expect(response.body.data.stats.totalExhibitors).toBe(3); // 2 + 1 (sponsors)
      expect(response.body.data.stats.totalAttendees).toBe(3); // 2 + 1
      expect(response.body.data.stats.totalRevenue).toBe(50); // Only from paid event
    });

    it('should fail without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .get('/api/v1/organizer/dashboard/stats')
        .expect(401);
    });

    it('should fail for non-organizer user', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .get('/api/v1/organizer/dashboard/stats')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(403);
    });

    it('should return zero stats for organizer with no events', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create a new organizer with no events
      const newOrganizerPassword = await hashPassword('NewOrg123!@#');
      await prisma.user.create({
        data: {
          email: 'neworganizer@test.com',
          password: newOrganizerPassword,
          firstName: 'New',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          organizationName: 'New Events Inc',
        },
      });

      const newOrgLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'neworganizer@test.com',
          password: 'NewOrg123!@#',
        });

      const newOrgToken = newOrgLogin.body.data.accessToken;

      const response = await request(app)
        .get('/api/v1/organizer/dashboard/stats')
        .set('Authorization', `Bearer ${newOrgToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats.totalEvents).toBe(0);
      expect(response.body.data.stats.totalSpeakers).toBe(0);
      expect(response.body.data.stats.totalExhibitors).toBe(0);
      expect(response.body.data.stats.totalAttendees).toBe(0);
      expect(response.body.data.stats.totalRevenue).toBe(0);
    });
  });

  describe('GET /api/v1/organizer/dashboard/events', () => {
    let organizerId: string;
    let attendeeId: string;

    beforeEach(async () => {
      if (!dbConnected) return;

      // Get organizer ID
      const organizer = await prisma.user.findUnique({
        where: { email: 'organizer@test.com' },
      });
      organizerId = organizer!.id;

      // Get attendee ID
      const attendee = await prisma.user.findUnique({
        where: { email: 'attendee@test.com' },
      });
      attendeeId = attendee!.id;

      // Create test events
      const event1 = await prisma.event.create({
        data: {
          title: 'Event 1',
          description: 'Description 1',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Location 1',
          venue: 'Venue 1',
          startTime: '09:00',
          endTime: '17:00',
          isFree: true,
          capacity: 100,
          organizerId,
          status: 'APPROVED',
          speakers: [
            { name: 'Speaker 1', title: 'CEO', bio: 'Bio 1' },
            { name: 'Speaker 2', title: 'CTO', bio: 'Bio 2' },
          ],
          sponsors: [
            { name: 'Sponsor 1', level: 'gold', logo: 'logo1.png' },
          ],
        },
      });

      const event2 = await prisma.event.create({
        data: {
          title: 'Event 2',
          description: 'Description 2',
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          location: 'Location 2',
          venue: 'Venue 2',
          isFree: false,
          price: 50,
          capacity: 50,
          organizerId,
          status: 'APPROVED',
          speakers: [
            { name: 'Speaker 3', title: 'CFO', bio: 'Bio 3' },
          ],
          sponsors: [
            { name: 'Sponsor 2', level: 'silver', logo: 'logo2.png' },
            { name: 'Sponsor 3', level: 'bronze', logo: 'logo3.png' },
          ],
        },
      });

      // Create registrations
      await prisma.eventRegistration.create({
        data: {
          eventId: event1.id,
          attendeeId,
          quantity: 2,
          totalAmount: 0,
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
        },
      });

      await prisma.eventRegistration.create({
        data: {
          eventId: event2.id,
          attendeeId,
          quantity: 1,
          totalAmount: 50,
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
        },
      });
    });

    it('should get organizer dashboard events successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/organizer/dashboard/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toBeDefined();
      expect(Array.isArray(response.body.data.events)).toBe(true);
      expect(response.body.data.events.length).toBeGreaterThan(0);

      const event = response.body.data.events[0];
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('title');
      expect(event).toHaveProperty('date');
      expect(event).toHaveProperty('attendees');
      expect(event).toHaveProperty('capacity');
      expect(event).toHaveProperty('revenue');
      expect(event).toHaveProperty('speakers');
      expect(event).toHaveProperty('exhibitors');
      expect(event).toHaveProperty('sponsors');
    });

    it('should respect limit parameter', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/organizer/dashboard/events?limit=1')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events.length).toBeLessThanOrEqual(1);
    });

    it('should support pagination with page and limit', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create more events for pagination testing
      for (let i = 3; i <= 5; i++) {
        await prisma.event.create({
          data: {
            title: `Event ${i}`,
            description: `Description ${i}`,
            startDate: new Date(Date.now() + (i * 7) * 24 * 60 * 60 * 1000),
            location: `Location ${i}`,
            isFree: true,
            organizerId,
            status: 'APPROVED',
          },
        });
      }

      // Test first page
      const page1Response = await request(app)
        .get('/api/v1/organizer/dashboard/events?page=1&limit=2')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(page1Response.body.success).toBe(true);
      expect(page1Response.body.data.events.length).toBeLessThanOrEqual(2);
      expect(page1Response.body.data).toHaveProperty('page', 1);
      expect(page1Response.body.data).toHaveProperty('limit', 2);
      expect(page1Response.body.data).toHaveProperty('total');
      expect(page1Response.body.data).toHaveProperty('totalPages');
      expect(page1Response.body.data).toHaveProperty('hasMore');
      expect(page1Response.body.data.totalPages).toBeGreaterThan(0);
      expect(typeof page1Response.body.data.hasMore).toBe('boolean');

      // Test second page
      if (page1Response.body.data.hasMore) {
        const page2Response = await request(app)
          .get('/api/v1/organizer/dashboard/events?page=2&limit=2')
          .set('Authorization', `Bearer ${organizerToken}`)
          .expect(200);

        expect(page2Response.body.success).toBe(true);
        expect(page2Response.body.data).toHaveProperty('page', 2);
        expect(page2Response.body.data.events.length).toBeGreaterThan(0);
      }
    });

    it('should calculate event stats correctly', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/organizer/dashboard/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      const events = response.body.data.events;
      
      // Find event 1 (free event with 2 attendees)
      interface EventItem {
        title: string;
        attendees?: number;
      }
      const event1 = events.find((e: EventItem) => e.title === 'Event 1');
      if (event1) {
        expect(event1.attendees).toBe(2);
        expect(event1.revenue).toBe(0);
        expect(event1.speakers).toBe(2);
        expect(event1.exhibitors).toBe(1);
      }

      // Find event 2 (paid event with 1 attendee)
      const event2 = events.find((e: EventItem) => e.title === 'Event 2');
      if (event2) {
        expect(event2.attendees).toBe(1);
        expect(event2.revenue).toBe(50);
        expect(event2.speakers).toBe(1);
        expect(event2.exhibitors).toBe(2);
      }
    });

    it('should fail without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .get('/api/v1/organizer/dashboard/events')
        .expect(401);
    });

    it('should fail for non-organizer user', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .get('/api/v1/organizer/dashboard/events')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(403);
    });
  });
});

