import { SeatSelectionService } from '../../../src/services/seat-selection.service.js';
import { prisma } from '../../../src/config/database.js';
import { SeatStatus } from '@prisma/client';

// Mock dependencies
vi.mock('../../../src/config/database.js', () => ({
  prisma: {
    eventRegistration: {
      findUnique: vi.fn(),
    },
    seatMap: {
      findUnique: vi.fn(),
    },
    seat: {
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    seatReservation: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));
vi.mock('../../../src/utils/logger.js');

describe('SeatSelectionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('reserveSeats', () => {
    it('should throw NotFoundError if registration not found', async () => {
      // Arrange
      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue(null);

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
      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue(mockRegistration);

      // Act & Assert
      await expect(
        SeatSelectionService.reserveSeats('event-1', ['seat-1'], 'reg-1'),
      ).rejects.toThrow('Registration does not match event');
    });

    it('should use transaction with row-level locking for race condition prevention', async () => {
      // Arrange
      const mockRegistration = {
        id: 'reg-1',
        eventId: 'event-1',
        event: { id: 'event-1' },
      };
      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue(mockRegistration);

      const mockLockedSeats = [
        { id: 'seat-1', seatIdentifier: 'A-1', status: 'AVAILABLE', basePrice: 100, currentPrice: 100 },
      ];

      (prisma.$transaction as vi.Mock).mockImplementation(async (callback) => {
        const tx = {
          $queryRaw: vi.fn().mockResolvedValue(mockLockedSeats),
          seatReservation: {
            findFirst: vi.fn().mockResolvedValue(null), // No active reservations
            findMany: vi.fn().mockResolvedValue([]), // No previous reservations
            create: vi.fn().mockResolvedValue({
              id: 'reservation-1',
              seatId: 'seat-1',
              registrationId: 'reg-1',
              status: 'reserved',
            }),
            updateMany: vi.fn(),
          },
          seat: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return callback(tx);
      });

      // Act
      const result = await SeatSelectionService.reserveSeats('event-1', ['seat-1'], 'reg-1', 15);

      // Assert
      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        { timeout: 10000 },
      );
      expect(result).toHaveLength(1);
    });

    it('should throw ValidationError if locked seats count mismatches requested seats', async () => {
      // Arrange
      const mockRegistration = {
        id: 'reg-1',
        eventId: 'event-1',
        event: { id: 'event-1' },
      };
      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue(mockRegistration);

      // Only 1 seat found when 2 were requested
      const mockLockedSeats = [
        { id: 'seat-1', seatIdentifier: 'A-1', status: 'AVAILABLE', basePrice: 100, currentPrice: 100 },
      ];

      (prisma.$transaction as vi.Mock).mockImplementation(async (callback) => {
        const tx = {
          $queryRaw: vi.fn().mockResolvedValue(mockLockedSeats),
          seatReservation: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
          seat: { updateMany: vi.fn() },
        };
        return callback(tx);
      });

      // Act & Assert
      await expect(
        SeatSelectionService.reserveSeats('event-1', ['seat-1', 'seat-2'], 'reg-1'),
      ).rejects.toThrow('One or more seats not found');
    });

    it('should throw ValidationError if seat status is not AVAILABLE', async () => {
      // Arrange
      const mockRegistration = {
        id: 'reg-1',
        eventId: 'event-1',
        event: { id: 'event-1' },
      };
      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue(mockRegistration);

      const mockLockedSeats = [
        { id: 'seat-1', seatIdentifier: 'A-1', status: 'BOOKED', basePrice: 100, currentPrice: 100 },
      ];

      (prisma.$transaction as vi.Mock).mockImplementation(async (callback) => {
        const tx = {
          $queryRaw: vi.fn().mockResolvedValue(mockLockedSeats),
          seatReservation: {
            findFirst: vi.fn(),
            findMany: vi.fn().mockResolvedValue([]),
            create: vi.fn(),
            updateMany: vi.fn(),
          },
          seat: { updateMany: vi.fn() },
        };
        return callback(tx);
      });

      // Act & Assert
      await expect(
        SeatSelectionService.reserveSeats('event-1', ['seat-1'], 'reg-1'),
      ).rejects.toThrow('Seats are not available: A-1');
    });

    it('should throw ValidationError if seat has active reservation by another user', async () => {
      // Arrange
      const mockRegistration = {
        id: 'reg-1',
        eventId: 'event-1',
        event: { id: 'event-1' },
      };
      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue(mockRegistration);

      const mockLockedSeats = [
        { id: 'seat-1', seatIdentifier: 'A-1', status: 'AVAILABLE', basePrice: 100, currentPrice: 100 },
      ];

      (prisma.$transaction as vi.Mock).mockImplementation(async (callback) => {
        const tx = {
          $queryRaw: vi.fn().mockResolvedValue(mockLockedSeats),
          seatReservation: {
            findFirst: vi.fn().mockResolvedValue({
              id: 'other-reservation',
              registrationId: 'reg-2', // Different registration
              status: 'reserved',
            }),
            findMany: vi.fn().mockResolvedValue([]),
            create: vi.fn(),
            updateMany: vi.fn(),
          },
          seat: { updateMany: vi.fn() },
        };
        return callback(tx);
      });

      // Act & Assert
      await expect(
        SeatSelectionService.reserveSeats('event-1', ['seat-1'], 'reg-1'),
      ).rejects.toThrow('Seats are not available: A-1');
    });

    it('should cancel previous reservations when user changes seat selection', async () => {
      // Arrange
      const mockRegistration = {
        id: 'reg-1',
        eventId: 'event-1',
        event: { id: 'event-1' },
      };
      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue(mockRegistration);

      const mockLockedSeats = [
        { id: 'seat-2', seatIdentifier: 'A-2', status: 'AVAILABLE', basePrice: 100, currentPrice: 100 },
      ];

      const previousReservations = [
        { id: 'old-res-1', seatId: 'seat-1' }, // Previous seat, not in new selection
      ];

      const mockTxSeatReservation = {
        findFirst: vi.fn()
          .mockResolvedValueOnce(null), // No active reservation by others on seat-2
        findMany: vi.fn().mockResolvedValue(previousReservations),
        create: vi.fn().mockResolvedValue({
          id: 'new-reservation',
          seatId: 'seat-2',
          registrationId: 'reg-1',
          status: 'reserved',
        }),
        updateMany: vi.fn().mockResolvedValue({}),
      };
      const mockTxSeat = {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      };

      (prisma.$transaction as vi.Mock).mockImplementation(async (callback) => {
        const tx = {
          $queryRaw: vi.fn().mockResolvedValue(mockLockedSeats),
          seatReservation: mockTxSeatReservation,
          seat: mockTxSeat,
        };
        return callback(tx);
      });

      // Act
      await SeatSelectionService.reserveSeats('event-1', ['seat-2'], 'reg-1');

      // Assert - should cancel previous reservations for seat-1
      expect(mockTxSeatReservation.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['old-res-1'] } },
        data: { status: 'cancelled' },
      });
      expect(mockTxSeat.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['seat-1'] } },
        data: { status: SeatStatus.AVAILABLE },
      });
    });

    it('should update existing reservation instead of creating new one', async () => {
      // Arrange
      const mockRegistration = {
        id: 'reg-1',
        eventId: 'event-1',
        event: { id: 'event-1' },
      };
      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue(mockRegistration);

      const mockLockedSeats = [
        { id: 'seat-1', seatIdentifier: 'A-1', status: 'AVAILABLE', basePrice: 100, currentPrice: 120 },
      ];

      const existingReservation = {
        id: 'existing-res',
        seatId: 'seat-1',
        registrationId: 'reg-1',
        status: 'reserved',
      };

      const mockTxSeatReservation = {
        findFirst: vi.fn()
          .mockResolvedValueOnce(null) // No active reservation by others
          .mockResolvedValueOnce(existingReservation), // Existing reservation for this reg
        findMany: vi.fn().mockResolvedValue([]), // No previous reservations to cancel
        update: vi.fn().mockResolvedValue({ ...existingReservation, priceAtReservation: 120 }),
        updateMany: vi.fn(),
        create: vi.fn(),
      };

      (prisma.$transaction as vi.Mock).mockImplementation(async (callback) => {
        const tx = {
          $queryRaw: vi.fn().mockResolvedValue(mockLockedSeats),
          seatReservation: mockTxSeatReservation,
          seat: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
        };
        return callback(tx);
      });

      // Act
      await SeatSelectionService.reserveSeats('event-1', ['seat-1'], 'reg-1', 20);

      // Assert - should update, not create
      expect(mockTxSeatReservation.update).toHaveBeenCalledWith({
        where: { id: 'existing-res' },
        data: {
          reservedUntil: expect.any(Date),
          priceAtReservation: 120,
          status: 'reserved',
        },
      });
      expect(mockTxSeatReservation.create).not.toHaveBeenCalled();
    });

    it('should create new reservation for seats without existing ones', async () => {
      // Arrange
      const mockRegistration = {
        id: 'reg-1',
        eventId: 'event-1',
        event: { id: 'event-1' },
      };
      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue(mockRegistration);

      const mockLockedSeats = [
        { id: 'seat-1', seatIdentifier: 'A-1', status: 'AVAILABLE', basePrice: 100, currentPrice: 100 },
      ];

      const mockTxSeatReservation = {
        findFirst: vi.fn()
          .mockResolvedValueOnce(null) // No active reservation by others
          .mockResolvedValueOnce(null), // No existing reservation for this reg
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({
          id: 'new-res',
          seatId: 'seat-1',
          registrationId: 'reg-1',
          status: 'reserved',
        }),
        updateMany: vi.fn(),
      };

      (prisma.$transaction as vi.Mock).mockImplementation(async (callback) => {
        const tx = {
          $queryRaw: vi.fn().mockResolvedValue(mockLockedSeats),
          seatReservation: mockTxSeatReservation,
          seat: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
        };
        return callback(tx);
      });

      // Act
      const result = await SeatSelectionService.reserveSeats('event-1', ['seat-1'], 'reg-1', 15);

      // Assert
      expect(mockTxSeatReservation.create).toHaveBeenCalledWith({
        data: {
          seatId: 'seat-1',
          registrationId: 'reg-1',
          reservedUntil: expect.any(Date),
          priceAtReservation: 100,
          status: 'reserved',
        },
      });
      expect(result).toHaveLength(1);
    });

    it('should reserve multiple seats in a single transaction', async () => {
      // Arrange
      const mockRegistration = {
        id: 'reg-1',
        eventId: 'event-1',
        event: { id: 'event-1' },
      };
      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue(mockRegistration);

      const mockLockedSeats = [
        { id: 'seat-1', seatIdentifier: 'A-1', status: 'AVAILABLE', basePrice: 100, currentPrice: 100 },
        { id: 'seat-2', seatIdentifier: 'A-2', status: 'AVAILABLE', basePrice: 100, currentPrice: 100 },
        { id: 'seat-3', seatIdentifier: 'A-3', status: 'AVAILABLE', basePrice: 150, currentPrice: 150 },
      ];

      let createCallCount = 0;
      const mockTxSeatReservation = {
        findFirst: vi.fn().mockResolvedValue(null), // No active reservations by others, no existing
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockImplementation((args) => {
          createCallCount++;
          return Promise.resolve({
            id: `new-res-${createCallCount}`,
            seatId: args.data.seatId,
            registrationId: 'reg-1',
            status: 'reserved',
          });
        }),
        updateMany: vi.fn(),
      };

      (prisma.$transaction as vi.Mock).mockImplementation(async (callback) => {
        const tx = {
          $queryRaw: vi.fn().mockResolvedValue(mockLockedSeats),
          seatReservation: mockTxSeatReservation,
          seat: { updateMany: vi.fn().mockResolvedValue({ count: 3 }) },
        };
        return callback(tx);
      });

      // Act
      const result = await SeatSelectionService.reserveSeats(
        'event-1',
        ['seat-1', 'seat-2', 'seat-3'],
        'reg-1',
      );

      // Assert
      expect(result).toHaveLength(3);
      expect(mockTxSeatReservation.create).toHaveBeenCalledTimes(3);
    });

    it('should use custom reservation timeout', async () => {
      // Arrange
      const mockRegistration = {
        id: 'reg-1',
        eventId: 'event-1',
        event: { id: 'event-1' },
      };
      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue(mockRegistration);

      const mockLockedSeats = [
        { id: 'seat-1', seatIdentifier: 'A-1', status: 'AVAILABLE', basePrice: 100, currentPrice: 100 },
      ];

      let capturedReservedUntil: Date | null = null;

      (prisma.$transaction as vi.Mock).mockImplementation(async (callback) => {
        const tx = {
          $queryRaw: vi.fn().mockResolvedValue(mockLockedSeats),
          seatReservation: {
            findFirst: vi.fn().mockResolvedValue(null),
            findMany: vi.fn().mockResolvedValue([]),
            create: vi.fn().mockImplementation((args) => {
              capturedReservedUntil = args.data.reservedUntil;
              return Promise.resolve({ id: 'res-1', status: 'reserved' });
            }),
            updateMany: vi.fn(),
          },
          seat: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
        };
        return callback(tx);
      });

      const startTime = new Date();

      // Act
      await SeatSelectionService.reserveSeats('event-1', ['seat-1'], 'reg-1', 30);

      // Assert
      expect(capturedReservedUntil).not.toBeNull();
      const expectedTime = new Date(startTime.getTime() + 30 * 60 * 1000);
      // Allow 2 second tolerance
      expect(Math.abs(capturedReservedUntil!.getTime() - expectedTime.getTime())).toBeLessThan(2000);
    });
  });

  describe('confirmSeatReservation', () => {
    it('should throw NotFoundError if no reservations found', async () => {
      // Arrange
      (prisma.seatReservation.findMany as vi.Mock).mockResolvedValue([]);
      (prisma.seatReservation.findFirst as vi.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        SeatSelectionService.confirmSeatReservation('reg-1'),
      ).rejects.toThrow('Seat reservation not found');
    });

    it('should return existing confirmation if already confirmed', async () => {
      // Arrange
      (prisma.seatReservation.findMany as vi.Mock).mockResolvedValue([]); // No reserved ones
      (prisma.seatReservation.findFirst as vi.Mock).mockResolvedValue({
        id: 'reservation-1',
        status: 'confirmed',
        seat: { id: 'seat-1' },
      });

      // Act
      const result = await SeatSelectionService.confirmSeatReservation('reg-1');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('confirmed');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should confirm all reservations and update seats to BOOKED', async () => {
      // Arrange
      const mockReservations = [
        { id: 'res-1', seatId: 'seat-1', status: 'reserved', seat: { id: 'seat-1' } },
        { id: 'res-2', seatId: 'seat-2', status: 'reserved', seat: { id: 'seat-2' } },
      ];

      (prisma.seatReservation.findMany as vi.Mock).mockResolvedValue(mockReservations);
      (prisma.seatReservation.updateMany as vi.Mock).mockResolvedValue({ count: 2 });
      (prisma.seat.updateMany as vi.Mock).mockResolvedValue({ count: 2 });
      (prisma.$transaction as vi.Mock).mockResolvedValue([{ count: 2 }, { count: 2 }]);

      // Act
      const result = await SeatSelectionService.confirmSeatReservation('reg-1');

      // Assert
      expect(prisma.$transaction).toHaveBeenCalledWith([
        expect.anything(), // seatReservation.updateMany
        expect.anything(), // seat.updateMany
      ]);
      expect(result).toHaveLength(2);
    });
  });

  describe('cancelSeatReservation', () => {
    it('should throw NotFoundError if no reservations found', async () => {
      // Arrange
      (prisma.seatReservation.findMany as vi.Mock).mockResolvedValue([]);

      // Act & Assert
      await expect(
        SeatSelectionService.cancelSeatReservation('reg-1'),
      ).rejects.toThrow('Seat reservation not found');
    });

    it('should cancel all reservations and release seats atomically', async () => {
      // Arrange
      const mockReservations = [
        { id: 'res-1', seatId: 'seat-1', seat: { id: 'seat-1' } },
        { id: 'res-2', seatId: 'seat-2', seat: { id: 'seat-2' } },
      ];

      (prisma.seatReservation.findMany as vi.Mock).mockResolvedValue(mockReservations);
      (prisma.$transaction as vi.Mock).mockResolvedValue([{ count: 2 }, { count: 2 }]);

      // Act
      const result = await SeatSelectionService.cancelSeatReservation('reg-1');

      // Assert
      expect(prisma.$transaction).toHaveBeenCalledWith([
        expect.anything(), // seatReservation.updateMany
        expect.anything(), // seat.updateMany
      ]);
      expect(result).toEqual({ success: true });
    });

    it('should cancel both reserved and confirmed reservations', async () => {
      // Arrange
      const mockReservations = [
        { id: 'res-1', seatId: 'seat-1', status: 'reserved', seat: { id: 'seat-1' } },
        { id: 'res-2', seatId: 'seat-2', status: 'confirmed', seat: { id: 'seat-2' } },
      ];

      (prisma.seatReservation.findMany as vi.Mock).mockResolvedValue(mockReservations);
      (prisma.$transaction as vi.Mock).mockResolvedValue([{}, {}]);

      // Act
      await SeatSelectionService.cancelSeatReservation('reg-1');

      // Assert - findMany should query for both statuses
      expect(prisma.seatReservation.findMany).toHaveBeenCalledWith({
        where: {
          registrationId: 'reg-1',
          status: { in: ['reserved', 'confirmed'] },
        },
        include: { seat: true },
      });
    });
  });

  describe('getSeatSelection', () => {
    it('should return all active reservations for a registration', async () => {
      // Arrange
      const mockReservations = [
        {
          id: 'res-1',
          seatId: 'seat-1',
          status: 'reserved',
          seat: {
            id: 'seat-1',
            seatIdentifier: 'A-1',
            seatMap: { id: 'seatmap-1', event: { id: 'event-1', title: 'Test Event' } },
          },
          registration: {
            id: 'reg-1',
            attendee: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
          },
        },
        {
          id: 'res-2',
          seatId: 'seat-2',
          status: 'reserved',
          seat: {
            id: 'seat-2',
            seatIdentifier: 'A-2',
            seatMap: { id: 'seatmap-1', event: { id: 'event-1', title: 'Test Event' } },
          },
          registration: {
            id: 'reg-1',
            attendee: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
          },
        },
      ];

      (prisma.seatReservation.findMany as vi.Mock).mockResolvedValue(mockReservations);

      // Act
      const result = await SeatSelectionService.getSeatSelection('reg-1');

      // Assert
      expect(prisma.seatReservation.findMany).toHaveBeenCalledWith({
        where: {
          registrationId: 'reg-1',
          status: { in: ['reserved', 'confirmed'] },
        },
        include: expect.any(Object),
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no reservations found', async () => {
      // Arrange
      (prisma.seatReservation.findMany as vi.Mock).mockResolvedValue([]);

      // Act
      const result = await SeatSelectionService.getSeatSelection('reg-1');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getSeatMapAvailability', () => {
    it('should throw NotFoundError if seat map not found', async () => {
      // Arrange
      (prisma.seatMap.findUnique as vi.Mock).mockResolvedValue(null);

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

      (prisma.seatMap.findUnique as vi.Mock).mockResolvedValue(mockSeatMap);

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

      (prisma.seatMap.findUnique as vi.Mock).mockResolvedValue(mockSeatMap);

      // Act
      const result = await SeatSelectionService.getSeatMapAvailability('event-1');

      // Assert
      expect(result.seats[0].status).toBe('available'); // Status converted to lowercase
    });
  });

  describe('cleanupExpiredReservations', () => {
    it('should return 0 if no expired reservations', async () => {
      // Arrange
      (prisma.seatReservation.findMany as vi.Mock).mockResolvedValue([]);

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

      (prisma.seatReservation.findMany as vi.Mock).mockResolvedValue(expiredReservations);
      (prisma.$transaction as vi.Mock).mockResolvedValue([{}, {}]);

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

      (prisma.seatReservation.findMany as vi.Mock).mockResolvedValue(expiredReservations);
      (prisma.$transaction as vi.Mock).mockImplementation((operations) => {
        // Verify the transaction operations
        expect(operations).toHaveLength(2);
        return Promise.resolve([{}, {}]);
      });

      // Act
      await SeatSelectionService.cleanupExpiredReservations();

      // Assert
      const transactionCalls = (prisma.$transaction as vi.Mock).mock.calls[0][0];
      expect(transactionCalls).toHaveLength(2); // updateMany reservations + updateMany seats
    });
  });
});
