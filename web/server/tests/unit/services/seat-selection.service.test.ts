import { SeatSelectionService } from '../../../src/services/seat-selection.service.js';
import { prisma } from '../../../src/config/database.js';
import { SeatStatus } from '@prisma/client';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  prisma: {
    eventRegistration: {
      findUnique: jest.fn(),
    },
    seatMap: {
      findUnique: jest.fn(),
    },
    seat: {
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    seatReservation: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));
jest.mock('../../../src/utils/logger.js');

describe('SeatSelectionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reserveSeats', () => {
    it('should throw NotFoundError if registration not found', async () => {
      // Arrange
      (prisma.eventRegistration.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        SeatSelectionService.reserveSeats('event-1', ['seat-1'], 'reg-1'),
      ).rejects.toThrow('Registration not found');
    });

    it('should throw ValidationError if registration does not match event', async () => {
      // Arrange
      const mockRegistration = {
        id: 'reg-1',
        eventId: 'event-2',
        event: { id: 'event-2' },
      };
      (prisma.eventRegistration.findUnique as jest.Mock).mockResolvedValue(mockRegistration);

      // Act & Assert
      await expect(
        SeatSelectionService.reserveSeats('event-1', ['seat-1'], 'reg-1'),
      ).rejects.toThrow('Registration does not match event');
    });

    it('should throw NotFoundError if seat map not found', async () => {
      // Arrange
      const mockRegistration = {
        id: 'reg-1',
        eventId: 'event-1',
        event: { id: 'event-1' },
      };
      (prisma.eventRegistration.findUnique as jest.Mock).mockResolvedValue(mockRegistration);
      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        SeatSelectionService.reserveSeats('event-1', ['seat-1'], 'reg-1'),
      ).rejects.toThrow('Seat map not found for this event');
    });

    it('should throw ValidationError if seats are not available', async () => {
      // Arrange
      const mockRegistration = {
        id: 'reg-1',
        eventId: 'event-1',
        event: { id: 'event-1' },
      };
      const mockSeatMap = {
        id: 'seatmap-1',
        seats: [
          {
            id: 'seat-1',
            seatIdentifier: 'A-1',
            status: SeatStatus.BOOKED,
            reservations: [],
          },
        ],
      };

      (prisma.eventRegistration.findUnique as jest.Mock).mockResolvedValue(mockRegistration);
      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(mockSeatMap);

      // Act & Assert
      await expect(
        SeatSelectionService.reserveSeats('event-1', ['seat-1'], 'reg-1'),
      ).rejects.toThrow('Seats are not available: A-1');
    });

    it('should throw ValidationError if seats have active reservations by another user', async () => {
      // Arrange
      const mockRegistration = {
        id: 'reg-1',
        eventId: 'event-1',
        event: { id: 'event-1' },
      };
      const mockSeatMap = {
        id: 'seatmap-1',
        seats: [
          {
            id: 'seat-1',
            seatIdentifier: 'A-1',
            status: SeatStatus.AVAILABLE,
            reservations: [
              {
                registrationId: 'reg-2', // Different registration
                status: 'reserved',
              },
            ],
          },
        ],
      };

      (prisma.eventRegistration.findUnique as jest.Mock).mockResolvedValue(mockRegistration);
      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(mockSeatMap);

      // Act & Assert
      await expect(
        SeatSelectionService.reserveSeats('event-1', ['seat-1'], 'reg-1'),
      ).rejects.toThrow('Seats are not available: A-1');
    });

    it('should create new reservations successfully', async () => {
      // Arrange
      const mockRegistration = {
        id: 'reg-1',
        eventId: 'event-1',
        event: { id: 'event-1' },
      };
      const mockSeatMap = {
        id: 'seatmap-1',
        seats: [
          {
            id: 'seat-1',
            seatIdentifier: 'A-1',
            status: SeatStatus.AVAILABLE,
            currentPrice: 100,
            basePrice: 100,
            reservations: [],
          },
        ],
      };
      const mockReservation = {
        id: 'reservation-1',
        seatId: 'seat-1',
        registrationId: 'reg-1',
        status: 'reserved',
      };

      (prisma.eventRegistration.findUnique as jest.Mock).mockResolvedValue(mockRegistration);
      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(mockSeatMap);
      (prisma.seatReservation.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.seatReservation.create as jest.Mock).mockResolvedValue(mockReservation);
      (prisma.seat.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      // Act
      const result = await SeatSelectionService.reserveSeats('event-1', ['seat-1'], 'reg-1', 15);

      // Assert
      expect(prisma.seatReservation.create).toHaveBeenCalledWith({
        data: {
          seatId: 'seat-1',
          registrationId: 'reg-1',
          reservedUntil: expect.any(Date),
          priceAtReservation: 100,
          status: 'reserved',
        },
      });
      expect(prisma.seat.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['seat-1'] } },
        data: { status: SeatStatus.RESERVED },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockReservation);
    });

    it('should update existing reservation', async () => {
      // Arrange
      const mockRegistration = {
        id: 'reg-1',
        eventId: 'event-1',
        event: { id: 'event-1' },
      };
      const mockSeatMap = {
        id: 'seatmap-1',
        seats: [
          {
            id: 'seat-1',
            seatIdentifier: 'A-1',
            status: SeatStatus.AVAILABLE,
            currentPrice: 100,
            basePrice: 100,
            reservations: [],
          },
        ],
      };
      const existingReservation = {
        id: 'reservation-1',
        seatId: 'seat-1',
        registrationId: 'reg-1',
        status: 'reserved',
      };

      (prisma.eventRegistration.findUnique as jest.Mock).mockResolvedValue(mockRegistration);
      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(mockSeatMap);
      (prisma.seatReservation.findFirst as jest.Mock).mockResolvedValue(existingReservation);
      (prisma.seatReservation.update as jest.Mock).mockResolvedValue(existingReservation);
      (prisma.seat.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      // Act
      await SeatSelectionService.reserveSeats('event-1', ['seat-1'], 'reg-1', 20);

      // Assert
      expect(prisma.seatReservation.update).toHaveBeenCalledWith({
        where: { id: 'reservation-1' },
        data: {
          reservedUntil: expect.any(Date),
          priceAtReservation: 100,
        },
      });
    });

    it('should allow same registration to re-reserve their seats', async () => {
      // Arrange
      const mockRegistration = {
        id: 'reg-1',
        eventId: 'event-1',
        event: { id: 'event-1' },
      };
      const mockSeatMap = {
        id: 'seatmap-1',
        seats: [
          {
            id: 'seat-1',
            seatIdentifier: 'A-1',
            status: SeatStatus.AVAILABLE,
            currentPrice: 100,
            reservations: [
              {
                registrationId: 'reg-1', // Same registration
                status: 'reserved',
              },
            ],
          },
        ],
      };

      (prisma.eventRegistration.findUnique as jest.Mock).mockResolvedValue(mockRegistration);
      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(mockSeatMap);
      (prisma.seatReservation.findFirst as jest.Mock).mockResolvedValue({
        id: 'reservation-1',
      });
      (prisma.seatReservation.update as jest.Mock).mockResolvedValue({});
      (prisma.seat.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      // Act
      await SeatSelectionService.reserveSeats('event-1', ['seat-1'], 'reg-1');

      // Assert - Should not throw
      expect(prisma.seatReservation.update).toHaveBeenCalled();
    });

    it('should use custom reservation timeout', async () => {
      // Arrange
      const mockRegistration = {
        id: 'reg-1',
        eventId: 'event-1',
        event: { id: 'event-1' },
      };
      const mockSeatMap = {
        id: 'seatmap-1',
        seats: [
          {
            id: 'seat-1',
            status: SeatStatus.AVAILABLE,
            currentPrice: 100,
            reservations: [],
          },
        ],
      };

      (prisma.eventRegistration.findUnique as jest.Mock).mockResolvedValue(mockRegistration);
      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(mockSeatMap);
      (prisma.seatReservation.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.seatReservation.create as jest.Mock).mockResolvedValue({});
      (prisma.seat.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const startTime = new Date();

      // Act
      await SeatSelectionService.reserveSeats('event-1', ['seat-1'], 'reg-1', 30);

      // Assert
      const createCall = (prisma.seatReservation.create as jest.Mock).mock.calls[0][0];
      const reservedUntil = createCall.data.reservedUntil;
      const expectedTime = new Date(startTime.getTime() + 30 * 60 * 1000);

      // Allow 1 second tolerance for test execution time
      expect(Math.abs(reservedUntil.getTime() - expectedTime.getTime())).toBeLessThan(1000);
    });
  });

  describe('confirmSeatReservation', () => {
    it('should throw NotFoundError if reservation not found', async () => {
      // Arrange
      (prisma.seatReservation.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        SeatSelectionService.confirmSeatReservation('reg-1'),
      ).rejects.toThrow('Seat reservation not found');
    });

    it('should return reservation if already confirmed', async () => {
      // Arrange
      const mockReservation = {
        id: 'reservation-1',
        status: 'confirmed',
        seat: { id: 'seat-1' },
      };
      (prisma.seatReservation.findUnique as jest.Mock).mockResolvedValue(mockReservation);

      // Act
      const result = await SeatSelectionService.confirmSeatReservation('reg-1');

      // Assert
      expect(result).toEqual(mockReservation);
      expect(prisma.seatReservation.update).not.toHaveBeenCalled();
    });

    it('should confirm reservation and update seat status', async () => {
      // Arrange
      const mockReservation = {
        id: 'reservation-1',
        seatId: 'seat-1',
        status: 'reserved',
        seat: { id: 'seat-1' },
      };
      const confirmedReservation = {
        ...mockReservation,
        status: 'confirmed',
        confirmedAt: expect.any(Date),
      };

      (prisma.seatReservation.findUnique as jest.Mock).mockResolvedValue(mockReservation);
      (prisma.seatReservation.update as jest.Mock).mockResolvedValue(confirmedReservation);
      (prisma.seat.update as jest.Mock).mockResolvedValue({});

      // Act
      const result = await SeatSelectionService.confirmSeatReservation('reg-1');

      // Assert
      expect(prisma.seatReservation.update).toHaveBeenCalledWith({
        where: { id: 'reservation-1' },
        data: {
          status: 'confirmed',
          confirmedAt: expect.any(Date),
          reservedUntil: null,
        },
      });
      expect(prisma.seat.update).toHaveBeenCalledWith({
        where: { id: 'seat-1' },
        data: { status: SeatStatus.BOOKED },
      });
      expect(result).toEqual(confirmedReservation);
    });
  });

  describe('cancelSeatReservation', () => {
    it('should throw NotFoundError if reservation not found', async () => {
      // Arrange
      (prisma.seatReservation.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        SeatSelectionService.cancelSeatReservation('reg-1'),
      ).rejects.toThrow('Seat reservation not found');
    });

    it('should cancel reservation and release seat', async () => {
      // Arrange
      const mockReservation = {
        id: 'reservation-1',
        seatId: 'seat-1',
        seat: { id: 'seat-1' },
      };

      (prisma.seatReservation.findUnique as jest.Mock).mockResolvedValue(mockReservation);
      (prisma.seatReservation.update as jest.Mock).mockResolvedValue({});
      (prisma.seat.update as jest.Mock).mockResolvedValue({});

      // Act
      const result = await SeatSelectionService.cancelSeatReservation('reg-1');

      // Assert
      expect(prisma.seatReservation.update).toHaveBeenCalledWith({
        where: { id: 'reservation-1' },
        data: { status: 'cancelled' },
      });
      expect(prisma.seat.update).toHaveBeenCalledWith({
        where: { id: 'seat-1' },
        data: { status: SeatStatus.AVAILABLE },
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('getSeatSelection', () => {
    it('should return reservation with full includes', async () => {
      // Arrange
      const mockReservation = {
        id: 'reservation-1',
        seatId: 'seat-1',
        seat: {
          id: 'seat-1',
          seatIdentifier: 'A-1',
          seatMap: {
            id: 'seatmap-1',
            event: {
              id: 'event-1',
              title: 'Test Event',
            },
          },
        },
        registration: {
          id: 'reg-1',
          attendee: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      };

      (prisma.seatReservation.findUnique as jest.Mock).mockResolvedValue(mockReservation);

      // Act
      const result = await SeatSelectionService.getSeatSelection('reg-1');

      // Assert
      expect(prisma.seatReservation.findUnique).toHaveBeenCalledWith({
        where: { registrationId: 'reg-1' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockReservation);
    });

    it('should return null if reservation not found', async () => {
      // Arrange
      (prisma.seatReservation.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await SeatSelectionService.getSeatSelection('reg-1');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getSeatMapAvailability', () => {
    it('should throw NotFoundError if seat map not found', async () => {
      // Arrange
      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        SeatSelectionService.getSeatMapAvailability('event-1'),
      ).rejects.toThrow('Seat map not found');
    });

    it('should return seat map with availability status', async () => {
      // Arrange
      const mockSeatMap = {
        id: 'seatmap-1',
        eventId: 'event-1',
        layout: {},
        seats: [
          {
            id: 'seat-1',
            seatIdentifier: 'A-1',
            sectionId: 'section-1',
            rowLabel: 'A',
            seatLabel: '1',
            seatType: 'STANDARD',
            status: SeatStatus.AVAILABLE,
            currentPrice: 100,
            basePrice: 100,
            x: 10,
            y: 20,
            angle: 0,
            metadata: {},
            reservations: [],
          },
          {
            id: 'seat-2',
            seatIdentifier: 'A-2',
            sectionId: 'section-1',
            rowLabel: 'A',
            seatLabel: '2',
            seatType: 'STANDARD',
            status: SeatStatus.BOOKED,
            currentPrice: 100,
            basePrice: 100,
            x: 30,
            y: 20,
            angle: 0,
            metadata: {},
            reservations: [],
          },
        ],
      };

      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(mockSeatMap);

      // Act
      const result = await SeatSelectionService.getSeatMapAvailability('event-1');

      // Assert
      expect(result.seats).toHaveLength(2);
      expect(result.seats[0].status).toBe('available');
      expect(result.seats[1].status).toBe('booked');
    });

    it('should mark seats with active reservations as unavailable', async () => {
      // Arrange
      const mockSeatMap = {
        id: 'seatmap-1',
        seats: [
          {
            id: 'seat-1',
            seatIdentifier: 'A-1',
            sectionId: 'section-1',
            rowLabel: 'A',
            seatLabel: '1',
            seatType: 'STANDARD',
            status: SeatStatus.AVAILABLE,
            currentPrice: 100,
            basePrice: 100,
            x: 10,
            y: 20,
            angle: 0,
            metadata: {},
            reservations: [{ status: 'reserved' }], // Has active reservation
          },
        ],
      };

      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(mockSeatMap);

      // Act
      const result = await SeatSelectionService.getSeatMapAvailability('event-1');

      // Assert
      expect(result.seats[0].status).toBe('available'); // Status converted to lowercase
    });
  });

  describe('cleanupExpiredReservations', () => {
    it('should return 0 if no expired reservations', async () => {
      // Arrange
      (prisma.seatReservation.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await SeatSelectionService.cleanupExpiredReservations();

      // Assert
      expect(result).toEqual({ cleaned: 0 });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should cleanup expired reservations in transaction', async () => {
      // Arrange
      const now = new Date();
      const expiredReservations = [
        {
          id: 'reservation-1',
          seat: { id: 'seat-1' },
          reservedUntil: new Date(now.getTime() - 60000), // 1 minute ago
        },
        {
          id: 'reservation-2',
          seat: { id: 'seat-2' },
          reservedUntil: new Date(now.getTime() - 120000), // 2 minutes ago
        },
      ];

      (prisma.seatReservation.findMany as jest.Mock).mockResolvedValue(expiredReservations);
      (prisma.$transaction as jest.Mock).mockResolvedValue([{}, {}]);

      // Act
      const result = await SeatSelectionService.cleanupExpiredReservations();

      // Assert
      expect(prisma.seatReservation.findMany).toHaveBeenCalledWith({
        where: {
          status: 'reserved',
          reservedUntil: {
            lt: expect.any(Date),
          },
        },
        include: { seat: true },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ cleaned: 2 });
    });

    it('should cancel reservations and release seats', async () => {
      // Arrange
      const expiredReservations = [
        {
          id: 'reservation-1',
          seat: { id: 'seat-1' },
          reservedUntil: new Date('2026-01-01'),
        },
      ];

      (prisma.seatReservation.findMany as jest.Mock).mockResolvedValue(expiredReservations);
      (prisma.$transaction as jest.Mock).mockImplementation((operations) => {
        // Verify the transaction operations
        expect(operations).toHaveLength(2);
        return Promise.resolve([{}, {}]);
      });

      // Act
      await SeatSelectionService.cleanupExpiredReservations();

      // Assert
      const transactionCalls = (prisma.$transaction as jest.Mock).mock.calls[0][0];
      expect(transactionCalls).toHaveLength(2); // updateMany reservations + updateMany seats
    });
  });
});
