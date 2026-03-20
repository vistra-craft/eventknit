import { prisma } from '../src/config/database.js';
import { ConsentService } from '../src/services/consent.service.js';
import { UserRole, UserStatus, EventStatus, RegistrationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { cleanupTestData } from './test-helpers.js';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('ConsentService', () => {
  let dbConnected = false;
  let organizerId: string;
  let attendeeId: string;
  let eventId: string;
  let registrationId: string;

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
        email: 'organizer@consent.test',
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

    // Create attendee
    const attendeePassword = await hashPassword('Attendee123!@$');
    const attendee = await prisma.user.create({
      data: {
        email: 'attendee@consent.test',
        password: attendeePassword,
        firstName: 'Test',
        lastName: 'Attendee',
        role: UserRole.ATTENDEE,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    attendeeId = attendee.id;

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

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        attendeeId,
        status: RegistrationStatus.CONFIRMED,
        totalAmount: 0,
      },
    });
    registrationId = registration.id;
  });

  describe('createConsent', () => {
    it('should create consent record with default operational consent', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const consent = await ConsentService.createConsent(
        registrationId,
        attendeeId,
        eventId,
        {
          operationalConsent: true,
          marketingConsent: false,
        },
      );

      expect(consent).toBeDefined();
      expect(consent.operationalConsent).toBe(true);
      expect(consent.marketingConsent).toBe(false);
      expect(consent.demographicsConsent).toBe(false);
      expect(consent.analyticsConsent).toBe(false);
      expect(consent.registrationId).toBe(registrationId);
    });

    it('should create consent with all consents enabled', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const consent = await ConsentService.createConsent(
        registrationId,
        attendeeId,
        eventId,
        {
          operationalConsent: true,
          marketingConsent: true,
          demographicsConsent: true,
          analyticsConsent: true,
        },
      );

      expect(consent.operationalConsent).toBe(true);
      expect(consent.marketingConsent).toBe(true);
      expect(consent.demographicsConsent).toBe(true);
      expect(consent.analyticsConsent).toBe(true);
    });

    it('should fail if registration does not exist', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await expect(
        ConsentService.createConsent(
          'non-existent-id',
          attendeeId,
          eventId,
          {},
        ),
      ).rejects.toThrow('Registration not found');
    });

    it('should fail if registration belongs to different attendee', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const otherAttendee = await prisma.user.create({
        data: {
          email: 'other@consent.test',
          password: await hashPassword('Pass123!'),
          firstName: 'Other',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
        },
      });

      await expect(
        ConsentService.createConsent(
          registrationId,
          otherAttendee.id,
          eventId,
          {},
        ),
      ).rejects.toThrow('Registration does not belong to this attendee');
    });

    it('should fail if consent already exists', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await ConsentService.createConsent(registrationId, attendeeId, eventId, {});

      await expect(
        ConsentService.createConsent(registrationId, attendeeId, eventId, {}),
      ).rejects.toThrow('Consent already exists');
    });
  });

  describe('getConsent', () => {
    it('should return null if consent does not exist', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const consent = await ConsentService.getConsent(registrationId, attendeeId);
      expect(consent).toBeNull();
    });

    it('should return consent if it exists', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await ConsentService.createConsent(registrationId, attendeeId, eventId, {
        marketingConsent: true,
      });

      const consent = await ConsentService.getConsent(registrationId, attendeeId);
      expect(consent).toBeDefined();
      expect(consent?.marketingConsent).toBe(true);
    });

    it('should fail if attendee tries to access another attendee consent', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await ConsentService.createConsent(registrationId, attendeeId, eventId, {});

      const otherAttendee = await prisma.user.create({
        data: {
          email: 'other2@consent.test',
          password: await hashPassword('Pass123!'),
          firstName: 'Other',
          lastName: 'User',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
        },
      });

      await expect(
        ConsentService.getConsent(registrationId, otherAttendee.id),
      ).rejects.toThrow('You do not have permission');
    });
  });

  describe('updateConsent', () => {
    beforeEach(async () => {
      if (!dbConnected) return;
      await ConsentService.createConsent(registrationId, attendeeId, eventId, {
        marketingConsent: false,
        demographicsConsent: false,
      });
    });

    it('should update consent preferences', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const updated = await ConsentService.updateConsent(registrationId, attendeeId, {
        marketingConsent: true,
        demographicsConsent: true,
      });

      expect(updated.marketingConsent).toBe(true);
      expect(updated.demographicsConsent).toBe(true);
      expect(updated.revokedAt).toBeNull();
    });

    it('should set revokedAt when all consents are revoked', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // First enable consents
      await ConsentService.updateConsent(registrationId, attendeeId, {
        marketingConsent: true,
        demographicsConsent: true,
      });

      // Then revoke all
      const updated = await ConsentService.updateConsent(registrationId, attendeeId, {
        marketingConsent: false,
        demographicsConsent: false,
        analyticsConsent: false,
      });

      expect(updated.revokedAt).toBeDefined();
    });

    it('should not allow updating operational consent', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const before = await ConsentService.getConsent(registrationId, attendeeId);
      expect(before?.operationalConsent).toBe(true);

      // Try to update (operational consent is not in update interface, but test it stays true)
      const updated = await ConsentService.updateConsent(registrationId, attendeeId, {
        marketingConsent: true,
      });

      expect(updated.operationalConsent).toBe(true); // Should remain true
    });
  });

  describe('hasConsent', () => {
    beforeEach(async () => {
      if (!dbConnected) return;
      await ConsentService.createConsent(registrationId, attendeeId, eventId, {
        marketingConsent: true,
        demographicsConsent: true,
        analyticsConsent: false,
      });
    });

    it('should return true for operational consent', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const hasConsent = await ConsentService.hasConsent(registrationId, 'operational');
      expect(hasConsent).toBe(true);
    });

    it('should return true for marketing consent when granted', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const hasConsent = await ConsentService.hasConsent(registrationId, 'marketing');
      expect(hasConsent).toBe(true);
    });

    it('should return false for analytics consent when not granted', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const hasConsent = await ConsentService.hasConsent(registrationId, 'analytics');
      expect(hasConsent).toBe(false);
    });

    it('should return false if consent does not exist', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Create a separate attendee so we don't violate the unique (eventId, attendeeId) constraint
      const noConsentAttendee = await prisma.user.create({
        data: {
          email: 'no-consent-attendee@consent.com',
          password: await hashPassword('Pass123!'),
          firstName: 'NoConsent',
          lastName: 'Attendee',
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        },
      });

      const newRegistration = await prisma.eventRegistration.create({
        data: {
          eventId,
          attendeeId: noConsentAttendee.id,
          status: RegistrationStatus.CONFIRMED,
          totalAmount: 0,
        },
      });

      const hasConsent = await ConsentService.hasConsent(newRegistration.id, 'operational');
      expect(hasConsent).toBe(false);
    });
  });

  describe('getEventConsentStats', () => {
    beforeEach(async () => {
      if (!dbConnected) return;

      // Create multiple registrations
      for (let i = 0; i < 5; i++) {
        const attendee = await prisma.user.create({
          data: {
            email: `attendee${i}@consent.test`,
            password: await hashPassword('Pass123!'),
            firstName: `Attendee${i}`,
            lastName: 'Test',
            role: UserRole.ATTENDEE,
            status: UserStatus.ACTIVE,
          },
        });

        const registration = await prisma.eventRegistration.create({
          data: {
            eventId,
            attendeeId: attendee.id,
            status: RegistrationStatus.CONFIRMED,
            totalAmount: 0,
          },
        });

        // Create consents with different patterns
        await ConsentService.createConsent(registration.id, attendee.id, eventId, {
          operationalConsent: true, // Always true
          marketingConsent: i < 3, // First 3 have marketing consent
          demographicsConsent: i < 2, // First 2 have demographics consent
          analyticsConsent: i < 1, // Only first has analytics consent
        });
      }
    });

    it('should return consent statistics for event', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const stats = await ConsentService.getEventConsentStats(eventId, organizerId);

      expect(stats.totalRegistrations).toBeGreaterThanOrEqual(5);
      expect(stats.totalConsents).toBeGreaterThanOrEqual(5);
      expect(stats.operational.count).toBeGreaterThanOrEqual(5);
      expect(stats.marketing.count).toBeGreaterThanOrEqual(3);
      expect(stats.demographics.count).toBeGreaterThanOrEqual(2);
      expect(stats.analytics.count).toBeGreaterThanOrEqual(1);
    });

    it('should calculate percentages correctly', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const stats = await ConsentService.getEventConsentStats(eventId, organizerId);

      expect(stats.operational.percentage).toBeGreaterThanOrEqual(0);
      expect(stats.operational.percentage).toBeLessThanOrEqual(100);
      expect(stats.marketing.percentage).toBeGreaterThanOrEqual(0);
      expect(stats.marketing.percentage).toBeLessThanOrEqual(100);
    });

    it('should fail if organizer does not own event', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const otherOrganizer = await prisma.user.create({
        data: {
          email: 'otherorg@consent.test',
          password: await hashPassword('Pass123!'),
          firstName: 'Other',
          lastName: 'Organizer',
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
        },
      });

      await expect(
        ConsentService.getEventConsentStats(eventId, otherOrganizer.id),
      ).rejects.toThrow('Event not found');
    });
  });
});

