/**
 * Seat Allocation Service Tests
 *
 * Tests for multi-seat reservations, assignments, and preferences
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { SeatAllocationService } from '../src/services/seat-allocation.service.js';
import { prisma } from '../src/config/database.js';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../src/utils/errors.js';

describe('SeatAllocationService', () => {
  const testEventId = '';
  const testRegistrationId = '';
  const testSeatIds: string[] = [];

  beforeAll(async () => {
    // Setup: Create test event, seats, and registration
    // This would be done via database seeding in real tests
  });

  afterAll(async () => {
    // Cleanup: Remove test data
  });

  beforeEach(async () => {
    // Reset state between tests
  });

  describe('reserveSeats', () => {
    it('should reserve single seat for registration', async () => {
      const data = {
        registrationId: testRegistrationId,
        seatIds: [testSeatIds[0]],
      };

      // Should not throw
      await expect(
        SeatAllocationService.reserveSeats(testEventId, data),
      ).resolves.not.toThrow();

      // Verify reservation created
      const reservation = await prisma.seatReservation.findUnique({
        where: {
          seatId_registrationId: {
            seatId: testSeatIds[0],
            registrationId: testRegistrationId,
          },
        },
      });

      expect(reservation).toBeDefined();
      expect(reservation?.status).toBe('reserved');
      expect(reservation?.registrationId).toBe(testRegistrationId);
    });

    it('should reserve multiple seats for single registration', async () => {
      const data = {
        registrationId: testRegistrationId,
        seatIds: [testSeatIds[0], testSeatIds[1], testSeatIds[2]],
      };

      await expect(
        SeatAllocationService.reserveSeats(testEventId, data),
      ).resolves.not.toThrow();

      // Verify all reservations created
      const reservations = await prisma.seatReservation.findMany({
        where: { registrationId: testRegistrationId },
      });

      expect(reservations.length).toBe(3);
      expect(reservations.every((r) => r.status === 'reserved')).toBe(true);
    });

    it('should throw ValidationError for missing event ID', async () => {
      const data = {
        registrationId: testRegistrationId,
        seatIds: [testSeatIds[0]],
      };

      await expect(
        SeatAllocationService.reserveSeats('', data),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty seat list', async () => {
      const data = {
        registrationId: testRegistrationId,
        seatIds: [],
      };

      await expect(
        SeatAllocationService.reserveSeats(testEventId, data),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError for non-existent registration', async () => {
      const data = {
        registrationId: 'non-existent-id',
        seatIds: [testSeatIds[0]],
      };

      await expect(
        SeatAllocationService.reserveSeats(testEventId, data),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when seat already reserved by another registration', async () => {
      // First reservation
      const data1 = {
        registrationId: testRegistrationId,
        seatIds: [testSeatIds[0]],
      };
      await SeatAllocationService.reserveSeats(testEventId, data1);

      // Try to reserve same seat with different registration
      const data2 = {
        registrationId: 'different-registration-id',
        seatIds: [testSeatIds[0]],
      };

      await expect(
        SeatAllocationService.reserveSeats(testEventId, data2),
      ).rejects.toThrow(ConflictError);
    });

    it('should handle seat with attendee assignment data', async () => {
      const data = {
        registrationId: testRegistrationId,
        seatIds: [testSeatIds[0]],
        attendeeNames: ['John Doe'],
        attendeeEmails: ['john@example.com'],
        ticketLineItemIds: ['line-item-1'],
      };

      await expect(
        SeatAllocationService.reserveSeats(testEventId, data),
      ).resolves.not.toThrow();

      const reservation = await prisma.seatReservation.findUnique({
        where: {
          seatId_registrationId: {
            seatId: testSeatIds[0],
            registrationId: testRegistrationId,
          },
        },
      });

      expect(reservation?.ticketLineItemId).toBe('line-item-1');
    });
  });

  describe('confirmSeatReservations', () => {
    it('should move reserved seats to confirmed', async () => {
      const data = {
        registrationId: testRegistrationId,
        seatIds: [testSeatIds[0]],
      };

      // Reserve first
      await SeatAllocationService.reserveSeats(testEventId, data);

      // Confirm
      await expect(
        SeatAllocationService.confirmSeatReservations(testRegistrationId),
      ).resolves.not.toThrow();

      // Verify status changed
      const reservations = await prisma.seatReservation.findMany({
        where: { registrationId: testRegistrationId },
      });

      expect(reservations.every((r) => r.status === 'confirmed')).toBe(true);
      expect(reservations.every((r) => r.reservedUntil === null)).toBe(true);
    });

    it('should throw NotFoundError for non-existent registration', async () => {
      await expect(
        SeatAllocationService.confirmSeatReservations('non-existent-id'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when no reserved seats found', async () => {
      // Registration exists but has no reserved seats
      await expect(
        SeatAllocationService.confirmSeatReservations(testRegistrationId),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('assignSeat', () => {
    it('should assign seat to registration with attendee info', async () => {
      const data = {
        registrationId: testRegistrationId,
        seatId: testSeatIds[0],
        attendeeName: 'Jane Doe',
        attendeeEmail: 'jane@example.com',
      };

      await expect(
        SeatAllocationService.assignSeat(testEventId, data),
      ).resolves.not.toThrow();

      const reservation = await prisma.seatReservation.findUnique({
        where: {
          seatId_registrationId: {
            seatId: testSeatIds[0],
            registrationId: testRegistrationId,
          },
        },
      });

      expect(reservation?.attendeeName).toBe('Jane Doe');
      expect(reservation?.attendeeEmail).toBe('jane@example.com');
      expect(reservation?.status).toBe('confirmed');
    });

    it('should throw ValidationError for missing attendee info', async () => {
      const data = {
        registrationId: testRegistrationId,
        seatId: testSeatIds[0],
        attendeeName: '',
        attendeeEmail: 'jane@example.com',
      };

      await expect(
        SeatAllocationService.assignSeat(testEventId, data),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError for non-existent seat', async () => {
      const data = {
        registrationId: testRegistrationId,
        seatId: 'non-existent-seat',
        attendeeName: 'Jane Doe',
        attendeeEmail: 'jane@example.com',
      };

      await expect(
        SeatAllocationService.assignSeat(testEventId, data),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('saveSeatPreferences', () => {
    it('should save seat preferences for registration', async () => {
      const preferences = {
        preferredSection: 'VIP',
        proximity: 'front' as const,
        mobilityRequired: true,
        wheelchairAccessible: false,
        specialRequests: 'Need accessible parking',
      };

      await expect(
        SeatAllocationService.saveSeatPreferences(testRegistrationId, preferences),
      ).resolves.not.toThrow();

      const registration = await prisma.eventRegistration.findUnique({
        where: { id: testRegistrationId },
      });

      expect(registration?.additionalData).toHaveProperty('seatPreferences');
    });

    it('should throw NotFoundError for non-existent registration', async () => {
      const preferences = {
        preferredSection: 'VIP',
      };

      await expect(
        SeatAllocationService.saveSeatPreferences('non-existent-id', preferences),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getAvailableSeats', () => {
    it('should return available seats for event', async () => {
      const seats = await SeatAllocationService.getAvailableSeats(testEventId);

      expect(Array.isArray(seats)).toBe(true);
      expect(seats.length).toBeGreaterThan(0);
      expect(seats[0]).toHaveProperty('id');
      expect(seats[0]).toHaveProperty('seatIdentifier');
    });

    it('should filter by section', async () => {
      const seats = await SeatAllocationService.getAvailableSeats(testEventId, {
        sectionId: 'VIP',
      });

      expect(Array.isArray(seats)).toBe(true);
      if (seats.length > 0) {
        expect(seats[0].sectionId).toBe('VIP');
      }
    });

    it('should filter by price range', async () => {
      const seats = await SeatAllocationService.getAvailableSeats(testEventId, {
        minPrice: 50,
        maxPrice: 150,
      });

      expect(Array.isArray(seats)).toBe(true);
      if (seats.length > 0) {
        const price = Number(seats[0].currentPrice);
        expect(price).toBeGreaterThanOrEqual(50);
        expect(price).toBeLessThanOrEqual(150);
      }
    });

    it('should throw AppError for non-existent event', async () => {
      await expect(
        SeatAllocationService.getAvailableSeats('non-existent-event'),
      ).rejects.toThrow();
    });
  });

  describe('getSeatStatistics', () => {
    it('should return seat statistics for event', async () => {
      const stats = await SeatAllocationService.getSeatStatistics(testEventId);

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('available');
      expect(stats).toHaveProperty('reserved');
      expect(stats).toHaveProperty('confirmed');
      expect(stats).toHaveProperty('blocked');

      expect(typeof stats.total).toBe('number');
      expect(typeof stats.available).toBe('number');
      expect(stats.total).toBeGreaterThanOrEqual(0);
    });

    it('should throw NotFoundError for non-existent event', async () => {
      await expect(
        SeatAllocationService.getSeatStatistics('non-existent-event'),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
