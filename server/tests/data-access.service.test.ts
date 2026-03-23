import { prisma } from '../src/config/database.js';
import { DataAccessService } from '../src/services/data-access.service.js';
import { SubscriptionService } from '../src/services/subscription.service.js';
import { UserRole, UserStatus, EventStatus, RegistrationStatus, SubscriptionTier } from '@prisma/client';
import bcrypt from 'bcrypt';
import { cleanupTestData } from './test-helpers.js';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('DataAccessService', () => {
  let dbConnected = false;
  let organizerId: string;
  let attendee1Id: string;
  let attendee2Id: string;
  let attendee3Id: string;
  let eventId: string;
  let _registration1Id: string;
  let _registration2Id: string;
  let _registration3Id: string;

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

    await cleanupTestData();

    // Create organizer
    const organizerPassword = await hashPassword('Organizer123!@$');
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@dataaccess.test',
        password: organizerPassword,
        firstName: 'Event',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Events Inc',
      },
    });
    organizerId = organizer.id;

    // Create attendees
    const attendee1 = await prisma.user.create({
      data: {
        email: 'attendee1@dataaccess.test',
        password: await hashPassword('Pass123!'),
        firstName: 'Attendee',
        lastName: 'One',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
      },
    });
    attendee1Id = attendee1.id;

    const attendee2 = await prisma.user.create({
      data: {
        email: 'attendee2@dataaccess.test',
        password: await hashPassword('Pass123!'),
        firstName: 'Attendee',
        lastName: 'Two',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
      },
    });
    attendee2Id = attendee2.id;

    const attendee3 = await prisma.user.create({
      data: {
        email: 'attendee3@dataaccess.test',
        password: await hashPassword('Pass123!'),
        firstName: 'Attendee',
        lastName: 'Three',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
      },
    });
    attendee3Id = attendee3.id;

    // Create event
    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'Test Description',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Test Location',
        organizerId,
        status: EventStatus.APPROVED,
        isFree: true,
      },
    });
    eventId = event.id;

    // Create registrations
    const registration1 = await prisma.eventRegistration.create({
      data: {
        eventId,
        attendeeId: attendee1Id,
        status: RegistrationStatus.CONFIRMED,
        totalAmount: 0,
      },
    });
    _registration1Id = registration1.id;

    const registration2 = await prisma.eventRegistration.create({
      data: {
        eventId,
        attendeeId: attendee2Id,
        status: RegistrationStatus.CONFIRMED,
        totalAmount: 0,
      },
    });
    _registration2Id = registration2.id;

    const registration3 = await prisma.eventRegistration.create({
      data: {
        eventId,
        attendeeId: attendee3Id,
        status: RegistrationStatus.CONFIRMED,
        totalAmount: 0,
      },
    });
    _registration3Id = registration3.id;
  });

  describe('filterAttendeeData - BASIC tier', () => {
    it('should return only aggregated data for BASIC tier', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const registrations = await prisma.eventRegistration.findMany({
        where: { eventId },
        include: {
          attendee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      });

      const filtered = await DataAccessService.filterAttendeeData(
        registrations,
        organizerId,
        eventId,
      );

      expect(filtered.length).toBe(registrations.length);
      expect(filtered[0]).not.toHaveProperty('attendee');
      expect(filtered[0]).toHaveProperty('id');
      expect(filtered[0]).toHaveProperty('status');
      expect(filtered[0]).toHaveProperty('ticketType');
    });
  });

  describe('filterAttendeeData - STANDARD tier', () => {
    beforeEach(async () => {
      if (!dbConnected) return;
      await SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.STANDARD);
    });

    it('should return all registrations with attendee data', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const registrations = await prisma.eventRegistration.findMany({
        where: { eventId },
        include: {
          attendee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      });

      const filtered = await DataAccessService.filterAttendeeData(
        registrations,
        organizerId,
        eventId,
      );

      // All 3 returned regardless of consent
      expect(filtered.length).toBe(3);
      expect(filtered[0]).toHaveProperty('attendee');
      expect(filtered[0].attendee).toHaveProperty('firstName');
      expect(filtered[0].attendee).toHaveProperty('email');
      expect(filtered[0]).toHaveProperty('totalAmount');
      expect(filtered[0]).toHaveProperty('paymentStatus');
    });
  });

  describe('filterAttendeeData - PREMIUM tier', () => {
    beforeEach(async () => {
      if (!dbConnected) return;
      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.PREMIUM,
          isActive: true,
          billingEmail: 'billing@test.com',
        },
      });
    });

    it('should return all registrations with attendee data', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const registrations = await prisma.eventRegistration.findMany({
        where: { eventId },
        include: {
          attendee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      });

      const filtered = await DataAccessService.filterAttendeeData(
        registrations,
        organizerId,
        eventId,
      );

      expect(filtered.length).toBe(3);
      expect(filtered[0]).toHaveProperty('attendee');
    });
  });

  describe('logAccess', () => {
    it('should create audit log entry', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await DataAccessService.logAccess({
        organizerId,
        eventId,
        action: 'VIEW',
        dataType: 'ATTENDEE_LIST',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });

      const logs = await prisma.dataAccessAuditLog.findMany({
        where: { organizerId, eventId },
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].action).toBe('VIEW');
      expect(logs[0].dataType).toBe('ATTENDEE_LIST');
    });

    it('should not fail if audit logging fails', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Should not throw even with invalid organizerId (foreign key constraint)
      await expect(
        DataAccessService.logAccess({
          organizerId: '00000000-0000-0000-0000-000000000000',
          action: 'VIEW',
          dataType: 'ATTENDEE_LIST',
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('canAccessData', () => {
    it('should return false for BASIC tier', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const canAccess = await DataAccessService.canAccessData(organizerId, 'attendee_list');
      expect(canAccess).toBe(false);
    });

    it('should return true for STANDARD tier', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.STANDARD);

      const canAccess = await DataAccessService.canAccessData(organizerId, 'attendee_list');
      expect(canAccess).toBe(true);
    });

    it('should return false for demographics on STANDARD tier', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.STANDARD);

      const canAccess = await DataAccessService.canAccessData(organizerId, 'demographics');
      expect(canAccess).toBe(false);
    });
  });

  describe('getAccessibleAttendeeCount', () => {
    it('should return total count for BASIC tier', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const count = await DataAccessService.getAccessibleAttendeeCount(eventId, organizerId);
      expect(count).toBe(3); // All 3 registrations
    });

    it('should return total count for STANDARD tier', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.STANDARD);

      const count = await DataAccessService.getAccessibleAttendeeCount(eventId, organizerId);
      expect(count).toBe(3); // All registrations
    });
  });
});

