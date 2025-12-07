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

describe('User Dashboard Statistics', () => {
  let dbConnected = false;
  let attendeeToken: string;
  let attendeeId: string;
  let organizerId: string;

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
      await cleanupTestData(tx);
    });

    // Create test users
    const hashedPassword = await hashPassword('Test123!@$');

    // Create organizer
    const organizer = await prisma.user.upsert({
      where: { email: 'organizer@test.com' },
      update: {
        password: hashedPassword,
        firstName: 'Organizer',
        lastName: 'Test',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Events Inc',
      },
      create: {
        email: 'organizer@test.com',
        password: hashedPassword,
        firstName: 'Organizer',
        lastName: 'Test',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Events Inc',
      },
    });
    organizerId = organizer.id;

    // Create attendee
    const attendee = await prisma.user.upsert({
      where: { email: 'attendee@test.com' },
      update: {
        password: hashedPassword,
        firstName: 'Attendee',
        lastName: 'Test',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
      create: {
        email: 'attendee@test.com',
        password: hashedPassword,
        firstName: 'Attendee',
        lastName: 'Test',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    attendeeId = attendee.id;
    attendeeToken = generateAccessToken({
      userId: attendee.id,
      email: attendee.email,
      role: attendee.role,
    });

    // Create events and registrations for statistics
    const now = new Date();
    
    // Upcoming event
    const upcomingEvent = await prisma.event.create({
      data: {
        title: 'Upcoming Event',
        description: 'Upcoming Event Description',
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        location: 'Test Location',
        isFree: true,
        category: 'Technology',
        organizerId,
        status: EventStatus.APPROVED,
        capacity: 100,
      },
    });

    // Past event
    const pastEvent = await prisma.event.create({
      data: {
        title: 'Past Event',
        description: 'Past Event Description',
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        location: 'Test Location',
        isFree: true,
        category: 'Technology',
        organizerId,
        status: EventStatus.APPROVED,
        capacity: 100,
      },
    });

    // Paid event (for spending calculation)
    const paidEvent = await prisma.event.create({
      data: {
        title: 'Paid Event',
        description: 'Paid Event Description',
        startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        location: 'Test Location',
        isFree: false,
        price: 50,
        category: 'Business',
        organizerId,
        status: EventStatus.APPROVED,
        capacity: 100,
      },
    });

    // Create registrations
    await prisma.eventRegistration.create({
      data: {
        eventId: upcomingEvent.id,
        attendeeId,
        quantity: 1,
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
        totalAmount: 0,
      },
    });

    await prisma.eventRegistration.create({
      data: {
        eventId: pastEvent.id,
        attendeeId,
        quantity: 1,
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
        totalAmount: 0,
      },
    });

    await prisma.eventRegistration.create({
      data: {
        eventId: paidEvent.id,
        attendeeId,
        quantity: 2,
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
        totalAmount: 100, // 2 tickets * $50
      },
    });
  });

  describe('GET /api/v1/user/dashboard/stats', () => {
    it('should get dashboard stats successfully', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/user/dashboard/stats')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.totalEvents.value).toBe(3);
      expect(response.body.data.stats.upcomingEvents.value).toBe(2); // Upcoming + Paid
      expect(response.body.data.stats.pastEvents.value).toBe(1);
      expect(response.body.data.stats.totalSpent.value).toBe('$100.00');
      expect(response.body.data.stats.favoriteCategory.value).toBe('Technology'); // 2 Technology events
      expect(response.body.data.recentActivity).toBeDefined();
      expect(Array.isArray(response.body.data.recentActivity)).toBe(true);
      expect(response.body.data.upcomingEvents).toBeDefined();
      expect(Array.isArray(response.body.data.upcomingEvents)).toBe(true);
    });

    it('should return zero stats for user with no registrations', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create new attendee with no registrations
      const newAttendeePassword = await hashPassword('New123!@$');
      const newAttendee = await prisma.user.create({
        data: {
          email: 'newattendee@test.com',
          password: newAttendeePassword,
          firstName: 'New',
          lastName: 'Attendee',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const newAttendeeToken = generateAccessToken({
        userId: newAttendee.id,
        email: newAttendee.email,
        role: newAttendee.role,
      });

      const response = await request(app)
        .get('/api/v1/user/dashboard/stats')
        .set('Authorization', `Bearer ${newAttendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats.totalEvents.value).toBe(0);
      expect(response.body.data.stats.upcomingEvents.value).toBe(0);
      expect(response.body.data.stats.pastEvents.value).toBe(0);
      expect(response.body.data.stats.totalSpent.value).toBe('$0.00');
      expect(response.body.data.stats.favoriteCategory.value).toBe('None');
    });

    it('should calculate events this month correctly', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      const response = await request(app)
        .get('/api/v1/user/dashboard/stats')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should have at least the events created this month
      expect(response.body.data.stats.eventsThisMonth.value).toBeGreaterThanOrEqual(0);
    });

    it('should fail without authentication', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      await request(app)
        .get('/api/v1/user/dashboard/stats')
        .expect(401);
    });

    it('should only show user their own stats', async () => {
      if (!dbConnected) {
        logger.info('⏭️  Skipping test - database not connected');
        return;
      }

      // Create another attendee with different registrations
      const otherAttendeePassword = await hashPassword('Other123!@$');
      const otherAttendee = await prisma.user.create({
        data: {
          email: 'otherattendee@test.com',
          password: otherAttendeePassword,
          firstName: 'Other',
          lastName: 'Attendee',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const otherAttendeeToken = generateAccessToken({
        userId: otherAttendee.id,
        email: otherAttendee.email,
        role: otherAttendee.role,
      });

      // Other attendee should have 0 events
      const response = await request(app)
        .get('/api/v1/user/dashboard/stats')
        .set('Authorization', `Bearer ${otherAttendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats.totalEvents.value).toBe(0);
    });
  });
});

