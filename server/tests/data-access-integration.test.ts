import { prisma } from '../src/config/database.js';
import { EventService } from '../src/services/event.service.js';
import { SubscriptionService } from '../src/services/subscription.service.js';
import { ConsentService } from '../src/services/consent.service.js';
import { UserRole, UserStatus, EventStatus, RegistrationStatus, SubscriptionTier } from '@prisma/client';
import bcrypt from 'bcrypt';
import { cleanupTestData } from './test-helpers.js';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('Data Access Integration - Tier-Based Filtering', () => {
  let dbConnected = false;
  let organizerId: string;
  let attendee1Id: string;
  let attendee2Id: string;
  let attendee3Id: string;
  let eventId: string;

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
        email: 'organizer@integration.test',
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
        email: 'attendee1@integration.test',
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
        email: 'attendee2@integration.test',
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
        email: 'attendee3@integration.test',
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

    const registration2 = await prisma.eventRegistration.create({
      data: {
        eventId,
        attendeeId: attendee2Id,
        status: RegistrationStatus.CONFIRMED,
        totalAmount: 0,
      },
    });

    const _registration3 = await prisma.eventRegistration.create({
      data: {
        eventId,
        attendeeId: attendee3Id,
        status: RegistrationStatus.CONFIRMED,
        totalAmount: 0,
      },
    });

    await ConsentService.createConsent(registration1.id, attendee1Id, eventId, {
      marketingConsent: true,
    });

    await ConsentService.createConsent(registration2.id, attendee2Id, eventId, {
      marketingConsent: true,
    });

    // registration3 has no consent record
  });

  describe('EventService.getEventRegistrations with tier filtering', () => {
    it('should filter data for BASIC tier (no PII)', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const registrations = await EventService.getEventRegistrations(
        eventId,
        organizerId,
        UserRole.ORGANIZER,
      );

      expect(registrations.length).toBeGreaterThan(0);
      // BASIC tier should not expose attendee PII
      const hasAttendeeData = registrations.some((r: any) =>
        r.attendee && (r.attendee.email || r.attendee.firstName),
      );
      expect(hasAttendeeData).toBe(false);
    });

    it('should show all attendee data for STANDARD tier', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.STANDARD);

      const registrations = await EventService.getEventRegistrations(
        eventId,
        organizerId,
        UserRole.ORGANIZER,
      );

      // All 3 returned — organizer paid for access to their own event data
      expect(registrations.length).toBe(3);

      expect(registrations[0]).toHaveProperty('attendee');
      expect(registrations[0].attendee).toHaveProperty('email');
      expect(registrations[0].attendee).toHaveProperty('firstName');
    });

    it('should show all attendee data for PREMIUM tier', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.PREMIUM,
          isActive: true,
          billingEmail: 'billing@test.com',
        },
      });

      const registrations = await EventService.getEventRegistrations(
        eventId,
        organizerId,
        UserRole.ORGANIZER,
      );

      expect(registrations.length).toBe(3);
      expect(registrations[0]).toHaveProperty('attendee');
    });
  });
});

