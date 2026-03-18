/**
 * Seating Configuration Service Tests
 *
 * Integration tests for seating configuration, validation, and management.
 * Seeds real database records and verifies service behaviour end-to-end.
 */

import { randomUUID } from 'crypto';
import { SeatingConfigurationService } from '../src/services/seating-configuration.service.js';
import { prisma } from '../src/config/database.js';
import {
  AppError,
  NotFoundError,
  ValidationError,
} from '../src/utils/errors.js';
import { EventStatus, SeatingType, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { cleanupTestData } from './test-helpers.js';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('SeatingConfigurationService', () => {
  let dbConnected = false;
  let testEventId = '';
  let testTicketTypeId = '';

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

    await prisma.$transaction(async (tx) => {
      await cleanupTestData(tx);
    });

    // Create organizer user
    const organizerPassword = await hashPassword('Organizer123!@$');
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@seatingtest.com',
        password: organizerPassword,
        firstName: 'Seating',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Seating Test Org',
      },
    });

    // Generate a stable ticket type id
    testTicketTypeId = randomUUID();

    // Create event with ticketTypes JSON containing at least one ticket type
    const event = await prisma.event.create({
      data: {
        title: 'Seating Config Test Event',
        description: 'Integration test event for seating configuration',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Test Venue',
        organizerId: organizer.id,
        status: EventStatus.APPROVED,
        isFree: true,
        hasSeatingMap: false,
        seatMapRequired: false,
        ticketTypes: [
          {
            id: testTicketTypeId,
            name: 'General Admission',
            price: 0,
            quantity: 100,
          },
        ],
      },
    });
    testEventId = event.id;

    // Create a seat map for the event (needed by validateSeatingConfiguration)
    await prisma.seatMap.create({
      data: {
        eventId: testEventId,
        name: 'Main Hall',
        layout: { sections: [] },
        isActive: true,
      },
    });
  });

  describe('configureSeating', () => {
    it('should configure CUSTOMER_SELECTS seating for event', async () => {
      if (!dbConnected) return;

      const config = {
        eventId: testEventId,
        hasSeatingMap: true,
        seatingType: SeatingType.CUSTOMER_SELECTS,
        seatMapRequired: true,
      };

      await expect(
        SeatingConfigurationService.configureSeating(config),
      ).resolves.not.toThrow();

      const event = await prisma.event.findUnique({
        where: { id: testEventId },
        select: { hasSeatingMap: true, seatingType: true, seatMapRequired: true },
      });

      expect(event?.hasSeatingMap).toBe(true);
      expect(event?.seatingType).toBe(SeatingType.CUSTOMER_SELECTS);
      expect(event?.seatMapRequired).toBe(true);
    });

    it('should configure ORGANIZER_ASSIGNS seating for event', async () => {
      if (!dbConnected) return;

      const config = {
        eventId: testEventId,
        hasSeatingMap: true,
        seatingType: SeatingType.ORGANIZER_ASSIGNS,
        seatMapRequired: false,
      };

      await expect(
        SeatingConfigurationService.configureSeating(config),
      ).resolves.not.toThrow();

      const event = await prisma.event.findUnique({
        where: { id: testEventId },
        select: { seatingType: true },
      });

      expect(event?.seatingType).toBe(SeatingType.ORGANIZER_ASSIGNS);
    });

    it('should configure HYBRID seating for event', async () => {
      if (!dbConnected) return;

      const config = {
        eventId: testEventId,
        hasSeatingMap: true,
        seatingType: SeatingType.HYBRID,
        seatMapRequired: false,
      };

      await expect(
        SeatingConfigurationService.configureSeating(config),
      ).resolves.not.toThrow();

      const event = await prisma.event.findUnique({
        where: { id: testEventId },
        select: { seatingType: true },
      });

      expect(event?.seatingType).toBe(SeatingType.HYBRID);
    });

    it('should disable seating if hasSeatingMap is false', async () => {
      if (!dbConnected) return;

      const config = {
        eventId: testEventId,
        hasSeatingMap: false,
        seatingType: SeatingType.ORGANIZER_ASSIGNS, // Should be ignored
        seatMapRequired: false,
      };

      await expect(
        SeatingConfigurationService.configureSeating(config),
      ).resolves.not.toThrow();

      const event = await prisma.event.findUnique({
        where: { id: testEventId },
        select: { hasSeatingMap: true },
      });

      expect(event?.hasSeatingMap).toBe(false);
    });

    it('should throw ValidationError for missing event ID', async () => {
      if (!dbConnected) return;

      const config = {
        eventId: '',
        hasSeatingMap: true,
        seatingType: SeatingType.CUSTOMER_SELECTS,
        seatMapRequired: true,
      };

      await expect(
        SeatingConfigurationService.configureSeating(config),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid seating type', async () => {
      if (!dbConnected) return;

      const config = {
        eventId: testEventId,
        hasSeatingMap: true,
        seatingType: 'INVALID_TYPE' as any,
        seatMapRequired: true,
      };

      await expect(
        SeatingConfigurationService.configureSeating(config),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError for non-existent event', async () => {
      if (!dbConnected) return;

      const config = {
        eventId: 'non-existent-event',
        hasSeatingMap: true,
        seatingType: SeatingType.CUSTOMER_SELECTS,
        seatMapRequired: true,
      };

      await expect(
        SeatingConfigurationService.configureSeating(config),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('configureTicketTypeSeating', () => {
    it('should configure seating for specific ticket type', async () => {
      if (!dbConnected) return;

      const config = {
        ticketTypeId: testTicketTypeId,
        seatingType: SeatingType.CUSTOMER_SELECTS,
        allowedSections: ['VIP', 'PREMIUM'],
        allowedSeatTypes: ['standard', 'accessible'],
      };

      await expect(
        SeatingConfigurationService.configureTicketTypeSeating(config),
      ).resolves.not.toThrow();

      // Verify the seatingConfig was written into the ticket type JSON
      const event = await prisma.event.findUnique({
        where: { id: testEventId },
        select: { ticketTypes: true },
      });

      const ticketTypes = event?.ticketTypes as Array<Record<string, unknown>>;
      const updatedTicket = ticketTypes.find((tt) => tt['id'] === testTicketTypeId);
      expect(updatedTicket).toBeDefined();
      expect(updatedTicket?.seatingConfig).toBeDefined();
    });

    it('should support reserved seats for VIP tickets', async () => {
      if (!dbConnected) return;

      const config = {
        ticketTypeId: testTicketTypeId,
        seatingType: SeatingType.ORGANIZER_ASSIGNS,
        reservedSeats: ['SEAT-001', 'SEAT-002', 'SEAT-003'],
      };

      await expect(
        SeatingConfigurationService.configureTicketTypeSeating(config),
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError for missing ticket type ID', async () => {
      if (!dbConnected) return;

      const config = {
        ticketTypeId: '',
        seatingType: SeatingType.CUSTOMER_SELECTS,
      };

      await expect(
        SeatingConfigurationService.configureTicketTypeSeating(config),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError for non-existent ticket type', async () => {
      if (!dbConnected) return;

      const config = {
        ticketTypeId: 'non-existent',
        seatingType: SeatingType.CUSTOMER_SELECTS,
      };

      await expect(
        SeatingConfigurationService.configureTicketTypeSeating(config),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('validateSeatingConfiguration', () => {
    it('should validate valid CUSTOMER_SELECTS configuration with seat map and seats', async () => {
      if (!dbConnected) return;

      // Configure event with CUSTOMER_SELECTS and seat map
      const config = {
        eventId: testEventId,
        hasSeatingMap: true,
        seatingType: SeatingType.CUSTOMER_SELECTS,
        seatMapRequired: true,
      };

      await SeatingConfigurationService.configureSeating(config);

      // Add at least one seat to the seat map so validation passes
      const seatMap = await prisma.seatMap.findUnique({
        where: { eventId: testEventId },
      });
      await prisma.seat.create({
        data: {
          seatMapId: seatMap!.id,
          seatIdentifier: 'A1',
          rowLabel: 'A',
          seatLabel: '1',
        },
      });

      const result =
        await SeatingConfigurationService.validateSeatingConfiguration(testEventId);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should return error for CUSTOMER_SELECTS with seat map but no seats', async () => {
      if (!dbConnected) return;

      // Configure with seat map required
      const config = {
        eventId: testEventId,
        hasSeatingMap: true,
        seatingType: SeatingType.CUSTOMER_SELECTS,
        seatMapRequired: true,
      };

      await SeatingConfigurationService.configureSeating(config);
      // Seat map exists (created in beforeEach) but has no seats

      const result =
        await SeatingConfigurationService.validateSeatingConfiguration(testEventId);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('seat');
    });

    it('should validate ORGANIZER_ASSIGNS without seat map', async () => {
      if (!dbConnected) return;

      // Remove the seat map so we test without one
      await prisma.seatMap.deleteMany({ where: { eventId: testEventId } });

      const config = {
        eventId: testEventId,
        hasSeatingMap: true,
        seatingType: SeatingType.ORGANIZER_ASSIGNS,
        seatMapRequired: false,
      };

      await SeatingConfigurationService.configureSeating(config);

      const result =
        await SeatingConfigurationService.validateSeatingConfiguration(testEventId);

      // Should be valid without seat map for organizer assigns
      expect(result.errors.length).toBe(0);
    });

    it('should throw NotFoundError for non-existent event', async () => {
      if (!dbConnected) return;

      await expect(
        SeatingConfigurationService.validateSeatingConfiguration(
          'non-existent-event',
        ),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getSeatingConfiguration', () => {
    it('should retrieve seating configuration for event', async () => {
      if (!dbConnected) return;

      const config = {
        eventId: testEventId,
        hasSeatingMap: true,
        seatingType: SeatingType.CUSTOMER_SELECTS,
        seatMapRequired: true,
      };

      await SeatingConfigurationService.configureSeating(config);

      const retrieved =
        await SeatingConfigurationService.getSeatingConfiguration(testEventId);

      expect(retrieved.eventId).toBe(testEventId);
      expect(retrieved.hasSeatingMap).toBe(true);
      expect(retrieved.seatingType).toBe(SeatingType.CUSTOMER_SELECTS);
      expect(retrieved.seatMapRequired).toBe(true);
    });

    it('should throw NotFoundError for non-existent event', async () => {
      if (!dbConnected) return;

      await expect(
        SeatingConfigurationService.getSeatingConfiguration('non-existent-event'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('isSeatingRequired', () => {
    it('should return true if seating is required', async () => {
      if (!dbConnected) return;

      const config = {
        eventId: testEventId,
        hasSeatingMap: true,
        seatingType: SeatingType.CUSTOMER_SELECTS,
        seatMapRequired: true,
      };

      await SeatingConfigurationService.configureSeating(config);

      const required =
        await SeatingConfigurationService.isSeatingRequired(testEventId);

      expect(required).toBe(true);
    });

    it('should return false if seating is not required', async () => {
      if (!dbConnected) return;

      const config = {
        eventId: testEventId,
        hasSeatingMap: false,
        seatingType: SeatingType.ORGANIZER_ASSIGNS,
        seatMapRequired: false,
      };

      await SeatingConfigurationService.configureSeating(config);

      const required =
        await SeatingConfigurationService.isSeatingRequired(testEventId);

      expect(required).toBe(false);
    });

    it('should throw AppError for non-existent event', async () => {
      if (!dbConnected) return;

      // The service's isSeatingRequired catch block swallows all errors
      // (including NotFoundError) and re-throws as AppError(500, 'CHECK_FAILED')
      await expect(
        SeatingConfigurationService.isSeatingRequired('non-existent-event'),
      ).rejects.toThrow(AppError);
    });
  });
});
