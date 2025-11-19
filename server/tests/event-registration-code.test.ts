import { EventService } from '../src/services/event.service';
import { prisma } from '../src/config/database';
import {
  UserRole,
  UserStatus,
  EventStatus,
  EventType,
} from '@prisma/client';
import { NotFoundError, AuthorizationError } from '../src/utils/errors';
import { logger } from '../src/utils/logger';
import bcrypt from 'bcrypt';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('EventService - Registration Code', () => {
  let dbConnected = false;
  let organizerId: string;
  let adminId: string;
  let eventId: string;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      logger.info('✅ Test database connected');
    } catch (_error) {
      logger.warn('⚠️  Database not available. Tests will be skipped.');
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

    // Clean up test data
    await prisma.event.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test organizer
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@test.com',
        firstName: 'Organizer',
        lastName: 'Test',
        password: await hashPassword('password123'),
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    organizerId = organizer.id;

    // Create test admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'Test',
        password: await hashPassword('password123'),
        role: UserRole.ADMIN_STAFF,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    adminId = admin.id;
  });

  describe('generateRegistrationCode', () => {
    it('should generate a registration code', () => {
      const code = EventService.generateRegistrationCode();

      expect(code).toBeTruthy();
      expect(code.length).toBeGreaterThanOrEqual(6);
      expect(code.length).toBeLessThanOrEqual(8);
      expect(code).toMatch(/^[A-Z0-9]+$/);
    });

    it('should generate unique codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(EventService.generateRegistrationCode());
      }

      // Should have high uniqueness (at least 95% unique)
      expect(codes.size).toBeGreaterThan(95);
    });

    it('should exclude confusing characters', () => {
      const code = EventService.generateRegistrationCode();

      // Should not contain 0, O, I, 1
      expect(code).not.toMatch(/[0O1I]/);
    });
  });

  describe('generateEventRegistrationCode', () => {
    beforeEach(async () => {
      if (!dbConnected) return;

      // Create test event
      const event = await prisma.event.create({
        data: {
          title: 'Test Event',
          description: 'Test Description',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          isFree: true,
          type: EventType.PUBLIC,
          status: EventStatus.APPROVED,
          organizerId,
        },
      });
      eventId = event.id;
    });

    it('should generate registration code for event', async () => {
      if (!dbConnected) return;

      const code = await EventService.generateEventRegistrationCode(
        eventId,
        organizerId,
        UserRole.ORGANIZER,
      );

      expect(code).toBeTruthy();
      expect(code.length).toBeGreaterThanOrEqual(6);
      expect(code.length).toBeLessThanOrEqual(8);

      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { registrationCode: true },
      });

      expect(event?.registrationCode).toBe(code);
    });

    it('should allow admin to generate code', async () => {
      if (!dbConnected) return;

      const code = await EventService.generateEventRegistrationCode(
        eventId,
        adminId,
        UserRole.ADMIN_STAFF,
      );

      expect(code).toBeTruthy();

      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { registrationCode: true },
      });

      expect(event?.registrationCode).toBe(code);
    });

    it('should reject unauthorized users', async () => {
      if (!dbConnected) return;

      // Create another organizer
      const otherOrganizer = await prisma.user.create({
        data: {
          email: 'other@test.com',
          firstName: 'Other',
          lastName: 'Organizer',
          password: await hashPassword('password123'),
          role: UserRole.ORGANIZER,
          status: UserStatus.ACTIVE,
        },
      });

      await expect(
        EventService.generateEventRegistrationCode(
          eventId,
          otherOrganizer.id,
          UserRole.ORGANIZER,
        ),
      ).rejects.toThrow(AuthorizationError);
    });

    it('should throw error if event not found', async () => {
      if (!dbConnected) return;

      await expect(
        EventService.generateEventRegistrationCode(
          'non-existent-id',
          organizerId,
          UserRole.ORGANIZER,
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it('should generate unique codes even with collisions', async () => {
      if (!dbConnected) return;

      // Create multiple events and generate codes
      const codes = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const event = await prisma.event.create({
          data: {
            title: `Event ${i}`,
            description: 'Test',
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            location: 'Test',
            isFree: true,
            type: EventType.PUBLIC,
            status: EventStatus.APPROVED,
            organizerId,
          },
        });

        const code = await EventService.generateEventRegistrationCode(
          event.id,
          organizerId,
          UserRole.ORGANIZER,
        );
        codes.add(code);
      }

      expect(codes.size).toBe(10); // All codes should be unique
    });
  });

  describe('auto-generate registration code on event creation', () => {
    it('should auto-generate registration code when creating event', async () => {
      if (!dbConnected) return;

      const event = await EventService.createEvent(
        {
          title: 'Auto Code Event',
          description: 'Test',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test',
          isFree: true,
        },
        organizerId,
        UserRole.ORGANIZER,
      );

      expect(event.registrationCode).toBeTruthy();
      expect(event.registrationCode?.length).toBeGreaterThanOrEqual(6);
      expect(event.registrationCode?.length).toBeLessThanOrEqual(8);
    });

    it('should not generate code if generateRegistrationCode is false', async () => {
      if (!dbConnected) return;

      const event = await EventService.createEvent(
        {
          title: 'No Code Event',
          description: 'Test',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test',
          isFree: true,
          generateRegistrationCode: false,
        },
        organizerId,
        UserRole.ORGANIZER,
      );

      expect(event.registrationCode).toBeNull();
    });
  });
});

