import { SeatMapService, SeatMapLayout, SectionConfig, RowConfig } from '../../../src/services/seat-map.service.js';
import { prisma } from '../../../src/config/database.js';
import { NotFoundError } from '../../../src/utils/errors.js';
import { SeatStatus, SeatType } from '@prisma/client';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  prisma: {
    event: {
      findFirst: jest.fn(),
    },
    venue: {
      findFirst: jest.fn(),
    },
    seatMap: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    seat: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));
jest.mock('../../../src/utils/logger.js');

describe('SeatMapService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockLayout = {
    sections: [
      {
        id: 'section-1',
        rows: [
          {
            id: 'row-1',
            label: 'A',
            seats: [
              { id: 'seat-1', label: '1', price: 100 },
              { id: 'seat-2', label: '2', price: 100 },
            ],
          },
        ],
      },
    ],
  };

  describe('upsertSeatMap', () => {
    it('should throw NotFoundError if event not found', async () => {
      // Arrange
      (prisma.event.findFirst as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        SeatMapService.upsertSeatMap('org-1', {
          eventId: 'event-1',
          layout: mockLayout,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if venue not found', async () => {
      // Arrange
      (prisma.event.findFirst as jest.Mock).mockResolvedValue({ id: 'event-1' });
      (prisma.venue.findFirst as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        SeatMapService.upsertSeatMap('org-1', {
          eventId: 'event-1',
          venueId: 'venue-1',
          layout: mockLayout,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid layout - no sections', async () => {
      // Arrange
      (prisma.event.findFirst as jest.Mock).mockResolvedValue({ id: 'event-1' });

      // Act & Assert
      await expect(
        SeatMapService.upsertSeatMap('org-1', {
          eventId: 'event-1',
          layout: {} as unknown as SeatMapLayout,
        }),
      ).rejects.toThrow('Invalid layout: must have sections array');
    });

    it('should throw ValidationError for invalid section', async () => {
      // Arrange
      (prisma.event.findFirst as jest.Mock).mockResolvedValue({ id: 'event-1' });

      // Act & Assert
      await expect(
        SeatMapService.upsertSeatMap('org-1', {
          eventId: 'event-1',
          layout: {
            sections: [{ id: 'section-1' } as unknown as SectionConfig], // Missing rows
          },
        }),
      ).rejects.toThrow('Invalid section: must have id and rows array');
    });

    it('should throw ValidationError for invalid row', async () => {
      // Arrange
      (prisma.event.findFirst as jest.Mock).mockResolvedValue({ id: 'event-1' });

      // Act & Assert
      await expect(
        SeatMapService.upsertSeatMap('org-1', {
          eventId: 'event-1',
          layout: {
            sections: [
              {
                id: 'section-1',
                rows: [{ id: 'row-1' } as unknown as RowConfig], // Missing seats
              },
            ],
          },
        }),
      ).rejects.toThrow('Invalid row: must have id and seats array');
    });

    it('should throw ValidationError for invalid seat', async () => {
      // Arrange
      (prisma.event.findFirst as jest.Mock).mockResolvedValue({ id: 'event-1' });

      // Act & Assert
      await expect(
        SeatMapService.upsertSeatMap('org-1', {
          eventId: 'event-1',
          layout: {
            sections: [
              {
                id: 'section-1',
                rows: [
                  {
                    id: 'row-1',
                    seats: [{}], // Missing id and label
                  },
                ],
              },
            ],
          },
        }),
      ).rejects.toThrow('Invalid seat: must have id or label');
    });

    it('should create seat map successfully', async () => {
      // Arrange
      const mockSeatMap = {
        id: 'seatmap-1',
        eventId: 'event-1',
        layout: mockLayout,
      };

      (prisma.event.findFirst as jest.Mock).mockResolvedValue({ id: 'event-1' });
      (prisma.seatMap.upsert as jest.Mock).mockResolvedValue(mockSeatMap);
      (prisma.$transaction as jest.Mock).mockResolvedValue([{}, {}, {}]);

      // Act
      const result = await SeatMapService.upsertSeatMap('org-1', {
        eventId: 'event-1',
        name: 'Main Hall',
        layout: mockLayout,
        width: 1000,
        height: 800,
      });

      // Assert
      expect(prisma.seatMap.upsert).toHaveBeenCalledWith({
        where: { eventId: 'event-1' },
        create: {
          eventId: 'event-1',
          venueId: undefined,
          name: 'Main Hall',
          layout: mockLayout,
          pricing: undefined,
          imageUrl: undefined,
          width: 1000,
          height: 800,
        },
        update: {
          venueId: undefined,
          name: 'Main Hall',
          layout: mockLayout,
          pricing: undefined,
          imageUrl: undefined,
          width: 1000,
          height: 800,
        },
      });
      expect(result).toEqual(mockSeatMap);
    });

    it('should generate seats from layout', async () => {
      // Arrange
      const mockSeatMap = { id: 'seatmap-1', eventId: 'event-1' };
      (prisma.event.findFirst as jest.Mock).mockResolvedValue({ id: 'event-1' });
      (prisma.seatMap.upsert as jest.Mock).mockResolvedValue(mockSeatMap);
      (prisma.$transaction as jest.Mock).mockImplementation((operations) => {
        return Promise.resolve(operations.map(() => ({})));
      });

      // Act
      await SeatMapService.upsertSeatMap('org-1', {
        eventId: 'event-1',
        layout: mockLayout,
      });

      // Assert
      expect(prisma.$transaction).toHaveBeenCalled();
      const transactionCalls = (prisma.$transaction as jest.Mock).mock.calls[0][0];
      expect(Array.isArray(transactionCalls)).toBe(true);
      expect(transactionCalls.length).toBeGreaterThan(0); // deleteMany + creates
    });
  });

  describe('getSeatMapByEventId', () => {
    it('should throw NotFoundError if seat map not found', async () => {
      // Arrange
      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        SeatMapService.getSeatMapByEventId('event-1'),
      ).rejects.toThrow('Seat map not found for this event');
    });

    it('should throw ValidationError if organizer access denied', async () => {
      // Arrange
      const mockSeatMap = {
        id: 'seatmap-1',
        event: { id: 'event-1', organizerId: 'org-1' },
      };
      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(mockSeatMap);

      // Act & Assert
      await expect(
        SeatMapService.getSeatMapByEventId('event-1', 'org-2'),
      ).rejects.toThrow('Access denied');
    });

    it('should return seat map with event, venue, and seats', async () => {
      // Arrange
      const mockSeatMap = {
        id: 'seatmap-1',
        eventId: 'event-1',
        event: {
          id: 'event-1',
          title: 'Test Event',
          organizerId: 'org-1',
        },
        venue: { id: 'venue-1', name: 'Main Hall' },
        seats: [
          {
            id: 'seat-1',
            seatIdentifier: 'A-1',
            reservations: [],
          },
        ],
      };

      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(mockSeatMap);

      // Act
      const result = await SeatMapService.getSeatMapByEventId('event-1', 'org-1');

      // Assert
      expect(prisma.seatMap.findUnique).toHaveBeenCalledWith({
        where: { eventId: 'event-1' },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              organizerId: true,
            },
          },
          venue: true,
          seats: expect.any(Object),
        },
      });
      expect(result).toEqual(mockSeatMap);
    });

    it('should return seat map without organizer check when organizerId not provided', async () => {
      // Arrange
      const mockSeatMap = {
        id: 'seatmap-1',
        event: { id: 'event-1', organizerId: 'org-1' },
      };
      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(mockSeatMap);

      // Act
      const result = await SeatMapService.getSeatMapByEventId('event-1');

      // Assert
      expect(result).toEqual(mockSeatMap);
    });
  });

  describe('getAvailableSeats', () => {
    it('should throw NotFoundError if seat map not found', async () => {
      // Arrange
      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        SeatMapService.getAvailableSeats('event-1'),
      ).rejects.toThrow('Seat map not found');
    });

    it('should return available seats without filters', async () => {
      // Arrange
      const mockSeatMap = { id: 'seatmap-1' };
      const mockSeats = [
        {
          id: 'seat-1',
          seatIdentifier: 'A-1',
          status: SeatStatus.AVAILABLE,
          reservations: [],
        },
        {
          id: 'seat-2',
          seatIdentifier: 'A-2',
          status: SeatStatus.AVAILABLE,
          reservations: [],
        },
      ];

      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(mockSeatMap);
      (prisma.seat.findMany as jest.Mock).mockResolvedValue(mockSeats);

      // Act
      const result = await SeatMapService.getAvailableSeats('event-1');

      // Assert
      expect(prisma.seat.findMany).toHaveBeenCalledWith({
        where: {
          seatMapId: 'seatmap-1',
          status: SeatStatus.AVAILABLE,
        },
        include: expect.any(Object),
        orderBy: [
          { sectionId: 'asc' },
          { rowLabel: 'asc' },
          { seatLabel: 'asc' },
        ],
      });
      expect(result).toEqual(mockSeats);
    });

    it('should filter by sectionId', async () => {
      // Arrange
      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue({ id: 'seatmap-1' });
      (prisma.seat.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      await SeatMapService.getAvailableSeats('event-1', { sectionId: 'section-1' });

      // Assert
      expect(prisma.seat.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sectionId: 'section-1',
          }),
        }),
      );
    });

    it('should filter by seatType', async () => {
      // Arrange
      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue({ id: 'seatmap-1' });
      (prisma.seat.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      await SeatMapService.getAvailableSeats('event-1', { seatType: SeatType.VIP });

      // Assert
      expect(prisma.seat.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            seatType: SeatType.VIP,
          }),
        }),
      );
    });

    it('should filter by minPrice', async () => {
      // Arrange
      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue({ id: 'seatmap-1' });
      (prisma.seat.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      await SeatMapService.getAvailableSeats('event-1', { minPrice: 50 });

      // Assert
      expect(prisma.seat.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            currentPrice: { gte: 50 },
          }),
        }),
      );
    });

    it('should filter by maxPrice', async () => {
      // Arrange
      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue({ id: 'seatmap-1' });
      (prisma.seat.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      await SeatMapService.getAvailableSeats('event-1', { maxPrice: 200 });

      // Assert
      expect(prisma.seat.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            currentPrice: { lte: 200 },
          }),
        }),
      );
    });

    it('should filter by price range', async () => {
      // Arrange
      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue({ id: 'seatmap-1' });
      (prisma.seat.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      await SeatMapService.getAvailableSeats('event-1', { minPrice: 50, maxPrice: 200 });

      // Assert
      expect(prisma.seat.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            currentPrice: { gte: 50, lte: 200 },
          }),
        }),
      );
    });

    it('should exclude seats with active reservations', async () => {
      // Arrange
      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue({ id: 'seatmap-1' });
      const mockSeats = [
        {
          id: 'seat-1',
          seatIdentifier: 'A-1',
          status: SeatStatus.AVAILABLE,
          reservations: [],
        },
        {
          id: 'seat-2',
          seatIdentifier: 'A-2',
          status: SeatStatus.AVAILABLE,
          reservations: [{ status: 'reserved' }],
        },
      ];
      (prisma.seat.findMany as jest.Mock).mockResolvedValue(mockSeats);

      // Act
      const result = await SeatMapService.getAvailableSeats('event-1');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('seat-1');
    });
  });

  describe('updateSeatMap', () => {
    it('should update seat map successfully', async () => {
      // Arrange
      const mockSeatMap = {
        id: 'seatmap-1',
        event: { id: 'event-1', organizerId: 'org-1' },
      };

      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(mockSeatMap);
      (prisma.seatMap.update as jest.Mock).mockResolvedValue(mockSeatMap);

      // Act
      const result = await SeatMapService.updateSeatMap('event-1', 'org-1', {
        name: 'Updated Hall',
        imageUrl: 'https://example.com/image.jpg',
        isActive: true,
      });

      // Assert
      expect(prisma.seatMap.update).toHaveBeenCalledWith({
        where: { eventId: 'event-1' },
        data: {
          name: 'Updated Hall',
          imageUrl: 'https://example.com/image.jpg',
          isActive: true,
        },
      });
      expect(result).toEqual(mockSeatMap);
    });

    it('should validate and regenerate seats if layout changed', async () => {
      // Arrange
      const mockSeatMap = {
        id: 'seatmap-1',
        event: { id: 'event-1', organizerId: 'org-1' },
      };

      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(mockSeatMap);
      (prisma.seatMap.update as jest.Mock).mockResolvedValue(mockSeatMap);
      (prisma.$transaction as jest.Mock).mockResolvedValue([{}, {}, {}]);

      // Act
      await SeatMapService.updateSeatMap('event-1', 'org-1', {
        layout: mockLayout,
      });

      // Assert
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid layout on update', async () => {
      // Arrange
      const mockSeatMap = {
        id: 'seatmap-1',
        event: { id: 'event-1', organizerId: 'org-1' },
      };

      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(mockSeatMap);

      // Act & Assert
      await expect(
        SeatMapService.updateSeatMap('event-1', 'org-1', {
          layout: { invalid: true } as unknown as SeatMapLayout,
        }),
      ).rejects.toThrow('Invalid layout: must have sections array');
    });

    it('should verify organizer access before updating', async () => {
      // Arrange
      const mockSeatMap = {
        id: 'seatmap-1',
        event: { id: 'event-1', organizerId: 'org-1' },
      };

      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(mockSeatMap);

      // Act & Assert
      await expect(
        SeatMapService.updateSeatMap('event-1', 'org-2', { name: 'New Name' }),
      ).rejects.toThrow('Access denied');
    });
  });

  describe('deleteSeatMap', () => {
    it('should verify organizer access before deletion', async () => {
      // Arrange
      const mockSeatMap = {
        id: 'seatmap-1',
        event: { id: 'event-1', organizerId: 'org-1' },
      };

      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(mockSeatMap);

      // Act & Assert
      await expect(
        SeatMapService.deleteSeatMap('event-1', 'org-2'),
      ).rejects.toThrow('Access denied');
    });

    it('should delete seat map successfully', async () => {
      // Arrange
      const mockSeatMap = {
        id: 'seatmap-1',
        event: { id: 'event-1', organizerId: 'org-1' },
      };

      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(mockSeatMap);
      (prisma.seatMap.delete as jest.Mock).mockResolvedValue({});

      // Act
      const result = await SeatMapService.deleteSeatMap('event-1', 'org-1');

      // Assert
      expect(prisma.seatMap.delete).toHaveBeenCalledWith({
        where: { eventId: 'event-1' },
      });
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundError if seat map not found', async () => {
      // Arrange
      (prisma.seatMap.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        SeatMapService.deleteSeatMap('event-1', 'org-1'),
      ).rejects.toThrow('Seat map not found for this event');
    });
  });
});
