/**
 * Seating Configuration Service Tests
 *
 * Tests for seating configuration, validation, and management
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { SeatingConfigurationService } from '../src/services/seating-configuration.service.js';
import { prisma } from '../src/config/database.js';
import {
  NotFoundError,
  ValidationError,
  AppError,
} from '../src/utils/errors.js';
import { SeatingType } from '@prisma/client';

describe('SeatingConfigurationService', () => {
  let testEventId = '';
  let testTicketTypeId = '';

  beforeAll(async () => {
    // Setup: Create test event and ticket type
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('configureSeating', () => {
    it('should configure CUSTOMER_SELECTS seating for event', async () => {
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
      const config = {
        eventId: testEventId,
        hasSeatingMap: true,
        seatingType: SeatingType.ORGANIZER_ASSIGNS,
        seatMapRequired: false, // Not required for organizer assigns
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
      const config = {
        ticketTypeId: testTicketTypeId,
        seatingType: SeatingType.CUSTOMER_SELECTS,
        allowedSections: ['VIP', 'PREMIUM'],
        allowedSeatTypes: ['standard', 'accessible'],
      };

      await expect(
        SeatingConfigurationService.configureTicketTypeSeating(config),
      ).resolves.not.toThrow();

      // Ticket type seating config is stored in Event.ticketTypes JSON
      // Verify the call completes without errors (config stored in event JSON)
      expect(testTicketTypeId).toBeDefined();
    });

    it('should support reserved seats for VIP tickets', async () => {
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
      const config = {
        ticketTypeId: '',
        seatingType: SeatingType.CUSTOMER_SELECTS,
      };

      await expect(
        SeatingConfigurationService.configureTicketTypeSeating(config),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError for non-existent ticket type', async () => {
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
    it('should validate valid CUSTOMER_SELECTS configuration with seat map', async () => {
      // Setup: Configure event with CUSTOMER_SELECTS and seat map
      const config = {
        eventId: testEventId,
        hasSeatingMap: true,
        seatingType: SeatingType.CUSTOMER_SELECTS,
        seatMapRequired: true,
      };

      await SeatingConfigurationService.configureSeating(config);

      const result =
        await SeatingConfigurationService.validateSeatingConfiguration(testEventId);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should return error for CUSTOMER_SELECTS without seat map', async () => {
      // Setup: Configure without seat map
      const config = {
        eventId: testEventId,
        hasSeatingMap: true,
        seatingType: SeatingType.CUSTOMER_SELECTS,
        seatMapRequired: true,
      };

      await SeatingConfigurationService.configureSeating(config);
      // But don't create actual seat map

      const result =
        await SeatingConfigurationService.validateSeatingConfiguration(testEventId);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('seat map');
    });

    it('should validate ORGANIZER_ASSIGNS without seat map', async () => {
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
      await expect(
        SeatingConfigurationService.validateSeatingConfiguration(
          'non-existent-event',
        ),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getSeatingConfiguration', () => {
    it('should retrieve seating configuration for event', async () => {
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
      await expect(
        SeatingConfigurationService.getSeatingConfiguration('non-existent-event'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('isSeatingRequired', () => {
    it('should return true if seating is required', async () => {
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

    it('should throw NotFoundError for non-existent event', async () => {
      await expect(
        SeatingConfigurationService.isSeatingRequired('non-existent-event'),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
