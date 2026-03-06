import { ResaleTransferAnalyticsService } from '../../../src/services/resale-transfer-analytics.service.js';
import { prisma } from '../../../src/config/database.js';

jest.mock('../../../src/config/database.js', () => ({
  prisma: {
    event: {
      findFirst: jest.fn(),
    },
    ticketResale: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    ticketTransfer: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

const prismaMock = prisma as unknown as {
  event: { findFirst: jest.Mock };
  ticketResale: {
    aggregate: jest.Mock;
    groupBy: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
  ticketTransfer: {
    count: jest.Mock;
    groupBy: jest.Mock;
    findMany: jest.Mock;
  };
  $queryRaw: jest.Mock;
};

// ─── Shared test data ───

const EVENT_ID = 'event-123';
const ORGANIZER_ID = 'organizer-456';
const MOCK_EVENT = { id: EVENT_ID };

const mockSeller = { id: 'seller-1', firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com' };
const mockBuyer = { id: 'buyer-1', firstName: 'John', lastName: 'Smith', email: 'john@test.com' };

const mockResaleListing = {
  id: 'resale-1',
  status: 'SOLD',
  originalPrice: 100,
  resalePrice: 150,
  currency: 'NGN',
  platformFee: 15,
  sellerPayout: 135,
  listedAt: new Date('2026-01-10'),
  soldAt: new Date('2026-01-15'),
  expiresAt: new Date('2026-02-01'),
  paymentStatus: 'COMPLETED',
  paymentReference: 'PAY-123',
  seller: mockSeller,
  buyer: mockBuyer,
  registration: {
    id: 'reg-1',
    event: { id: EVENT_ID, title: 'Test Event' },
    ticketLineItems: [{ ticketType: 'VIP', quantity: 1 }],
  },
};

const mockTransfer = {
  id: 'transfer-1',
  status: 'ACCEPTED',
  message: 'Enjoy the event!',
  fromUser: mockSeller,
  toUser: mockBuyer,
  toEmail: null,
  createdAt: new Date('2026-01-12'),
  acceptedAt: new Date('2026-01-13'),
  expiresAt: new Date('2026-01-19'),
  registration: {
    id: 'reg-2',
    ticketLineItems: [{ ticketType: 'General', quantity: 1 }],
  },
};

describe('ResaleTransferAnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── getEventResaleStats ───

  describe('getEventResaleStats', () => {
    it('should return resale stats for a valid event owned by organizer', async () => {
      prismaMock.event.findFirst.mockResolvedValue(MOCK_EVENT);
      prismaMock.ticketResale.aggregate.mockResolvedValue({
        _count: 10,
        _sum: { resalePrice: 1500, platformFee: 150, sellerPayout: 1350 },
      });
      prismaMock.ticketResale.groupBy.mockResolvedValue([
        { status: 'LISTED', _count: 3 },
        { status: 'SOLD', _count: 5 },
        { status: 'CANCELLED', _count: 2 },
      ]);

      const result = await ResaleTransferAnalyticsService.getEventResaleStats(EVENT_ID, ORGANIZER_ID);

      expect(result.totalListings).toBe(10);
      expect(result.activeListings).toBe(3);
      expect(result.soldListings).toBe(5);
      expect(result.cancelledListings).toBe(2);
      expect(result.reservedListings).toBe(0);
      expect(result.expiredListings).toBe(0);
      expect(result.totalResaleValue).toBe(1500);
      expect(result.totalPlatformFees).toBe(150);
      expect(result.totalSellerPayouts).toBe(1350);
      expect(prismaMock.event.findFirst).toHaveBeenCalledWith({
        where: { id: EVENT_ID, organizerId: ORGANIZER_ID, deletedAt: null },
        select: { id: true },
      });
    });

    it('should throw when event does not belong to organizer', async () => {
      prismaMock.event.findFirst.mockResolvedValue(null);

      await expect(
        ResaleTransferAnalyticsService.getEventResaleStats(EVENT_ID, 'wrong-organizer'),
      ).rejects.toThrow('Event not found or access denied');
    });

    it('should handle zero resale data gracefully', async () => {
      prismaMock.event.findFirst.mockResolvedValue(MOCK_EVENT);
      prismaMock.ticketResale.aggregate.mockResolvedValue({
        _count: 0,
        _sum: { resalePrice: null, platformFee: null, sellerPayout: null },
      });
      prismaMock.ticketResale.groupBy.mockResolvedValue([]);

      const result = await ResaleTransferAnalyticsService.getEventResaleStats(EVENT_ID, ORGANIZER_ID);

      expect(result.totalListings).toBe(0);
      expect(result.activeListings).toBe(0);
      expect(result.totalResaleValue).toBe(0);
      expect(result.totalPlatformFees).toBe(0);
      expect(result.totalSellerPayouts).toBe(0);
    });
  });

  // ─── getEventResaleListings ───

  describe('getEventResaleListings', () => {
    it('should return paginated resale listings for an event', async () => {
      prismaMock.event.findFirst.mockResolvedValue(MOCK_EVENT);
      prismaMock.ticketResale.findMany.mockResolvedValue([mockResaleListing]);
      prismaMock.ticketResale.count.mockResolvedValue(1);

      const result = await ResaleTransferAnalyticsService.getEventResaleListings(
        EVENT_ID, ORGANIZER_ID, { page: 1, limit: 20 },
      );

      expect(result.listings).toHaveLength(1);
      expect(result.listings[0].id).toBe('resale-1');
      expect(result.listings[0].originalPrice).toBe(100);
      expect(result.listings[0].resalePrice).toBe(150);
      expect(result.listings[0].ticketType).toBe('VIP');
      expect(result.listings[0].seller).toEqual(mockSeller);
      expect(result.listings[0].buyer).toEqual(mockBuyer);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should apply status filter when provided', async () => {
      prismaMock.event.findFirst.mockResolvedValue(MOCK_EVENT);
      prismaMock.ticketResale.findMany.mockResolvedValue([]);
      prismaMock.ticketResale.count.mockResolvedValue(0);

      await ResaleTransferAnalyticsService.getEventResaleListings(
        EVENT_ID, ORGANIZER_ID, { status: 'SOLD' },
      );

      expect(prismaMock.ticketResale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { registration: { eventId: EVENT_ID }, status: 'SOLD' },
        }),
      );
    });

    it('should throw when event not found', async () => {
      prismaMock.event.findFirst.mockResolvedValue(null);

      await expect(
        ResaleTransferAnalyticsService.getEventResaleListings(EVENT_ID, 'wrong-id'),
      ).rejects.toThrow('Event not found or access denied');
    });

    it('should handle listings with no ticket line items', async () => {
      prismaMock.event.findFirst.mockResolvedValue(MOCK_EVENT);
      const listingNoTicket = {
        ...mockResaleListing,
        registration: { id: 'reg-1', ticketLineItems: [] },
      };
      prismaMock.ticketResale.findMany.mockResolvedValue([listingNoTicket]);
      prismaMock.ticketResale.count.mockResolvedValue(1);

      const result = await ResaleTransferAnalyticsService.getEventResaleListings(
        EVENT_ID, ORGANIZER_ID,
      );

      expect(result.listings[0].ticketType).toBe('Unknown');
    });

    it('should calculate totalPages correctly', async () => {
      prismaMock.event.findFirst.mockResolvedValue(MOCK_EVENT);
      prismaMock.ticketResale.findMany.mockResolvedValue([]);
      prismaMock.ticketResale.count.mockResolvedValue(45);

      const result = await ResaleTransferAnalyticsService.getEventResaleListings(
        EVENT_ID, ORGANIZER_ID, { page: 1, limit: 20 },
      );

      expect(result.totalPages).toBe(3);
    });
  });

  // ─── getEventTransferStats ───

  describe('getEventTransferStats', () => {
    it('should return transfer stats for a valid event', async () => {
      prismaMock.event.findFirst.mockResolvedValue(MOCK_EVENT);
      prismaMock.ticketTransfer.count.mockResolvedValue(8);
      prismaMock.ticketTransfer.groupBy.mockResolvedValue([
        { status: 'PENDING', _count: 2 },
        { status: 'ACCEPTED', _count: 4 },
        { status: 'EXPIRED', _count: 2 },
      ]);

      const result = await ResaleTransferAnalyticsService.getEventTransferStats(EVENT_ID, ORGANIZER_ID);

      expect(result.totalTransfers).toBe(8);
      expect(result.pendingTransfers).toBe(2);
      expect(result.acceptedTransfers).toBe(4);
      expect(result.expiredTransfers).toBe(2);
      expect(result.rejectedTransfers).toBe(0);
      expect(result.cancelledTransfers).toBe(0);
    });

    it('should throw when event does not belong to organizer', async () => {
      prismaMock.event.findFirst.mockResolvedValue(null);

      await expect(
        ResaleTransferAnalyticsService.getEventTransferStats(EVENT_ID, 'wrong-id'),
      ).rejects.toThrow('Event not found or access denied');
    });

    it('should handle zero transfers gracefully', async () => {
      prismaMock.event.findFirst.mockResolvedValue(MOCK_EVENT);
      prismaMock.ticketTransfer.count.mockResolvedValue(0);
      prismaMock.ticketTransfer.groupBy.mockResolvedValue([]);

      const result = await ResaleTransferAnalyticsService.getEventTransferStats(EVENT_ID, ORGANIZER_ID);

      expect(result.totalTransfers).toBe(0);
      expect(result.pendingTransfers).toBe(0);
      expect(result.acceptedTransfers).toBe(0);
    });
  });

  // ─── getEventTransferHistory ───

  describe('getEventTransferHistory', () => {
    it('should return paginated transfer history', async () => {
      prismaMock.event.findFirst.mockResolvedValue(MOCK_EVENT);
      prismaMock.ticketTransfer.findMany.mockResolvedValue([mockTransfer]);
      prismaMock.ticketTransfer.count.mockResolvedValue(1);

      const result = await ResaleTransferAnalyticsService.getEventTransferHistory(
        EVENT_ID, ORGANIZER_ID, { page: 1, limit: 20 },
      );

      expect(result.transfers).toHaveLength(1);
      expect(result.transfers[0].id).toBe('transfer-1');
      expect(result.transfers[0].status).toBe('ACCEPTED');
      expect(result.transfers[0].ticketType).toBe('General');
      expect(result.transfers[0].fromUser).toEqual(mockSeller);
      expect(result.transfers[0].toUser).toEqual(mockBuyer);
      expect(result.total).toBe(1);
    });

    it('should apply status filter', async () => {
      prismaMock.event.findFirst.mockResolvedValue(MOCK_EVENT);
      prismaMock.ticketTransfer.findMany.mockResolvedValue([]);
      prismaMock.ticketTransfer.count.mockResolvedValue(0);

      await ResaleTransferAnalyticsService.getEventTransferHistory(
        EVENT_ID, ORGANIZER_ID, { status: 'PENDING' },
      );

      expect(prismaMock.ticketTransfer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { registration: { eventId: EVENT_ID }, status: 'PENDING' },
        }),
      );
    });

    it('should throw when event not found', async () => {
      prismaMock.event.findFirst.mockResolvedValue(null);

      await expect(
        ResaleTransferAnalyticsService.getEventTransferHistory(EVENT_ID, 'wrong-id'),
      ).rejects.toThrow('Event not found or access denied');
    });

    it('should handle transfers with no ticket line items', async () => {
      prismaMock.event.findFirst.mockResolvedValue(MOCK_EVENT);
      const transferNoTicket = {
        ...mockTransfer,
        registration: { id: 'reg-2', ticketLineItems: [] },
      };
      prismaMock.ticketTransfer.findMany.mockResolvedValue([transferNoTicket]);
      prismaMock.ticketTransfer.count.mockResolvedValue(1);

      const result = await ResaleTransferAnalyticsService.getEventTransferHistory(
        EVENT_ID, ORGANIZER_ID,
      );

      expect(result.transfers[0].ticketType).toBe('Unknown');
    });
  });

  // ─── getPlatformResaleStats ───

  describe('getPlatformResaleStats', () => {
    it('should return platform-wide resale stats without date filters', async () => {
      prismaMock.ticketResale.aggregate
        .mockResolvedValueOnce({
          _count: 50,
          _sum: { resalePrice: 7500, platformFee: 750, sellerPayout: 6750 },
        })
        .mockResolvedValueOnce({
          _count: 20,
          _sum: { sellerPayout: 2700 },
        });
      prismaMock.ticketResale.groupBy.mockResolvedValue([
        { status: 'LISTED', _count: 10 },
        { status: 'SOLD', _count: 30 },
        { status: 'CANCELLED', _count: 5 },
        { status: 'EXPIRED', _count: 5 },
      ]);
      prismaMock.$queryRaw.mockResolvedValue([
        { id: 'evt-1', title: 'Concert', resaleCount: 15, totalValue: 3000, totalFees: 300 },
      ]);

      const result = await ResaleTransferAnalyticsService.getPlatformResaleStats();

      expect(result.totalListings).toBe(50);
      expect(result.activeListings).toBe(10);
      expect(result.soldListings).toBe(30);
      expect(result.totalResaleValue).toBe(7500);
      expect(result.totalPlatformFees).toBe(750);
      expect(result.totalSellerPayouts).toBe(6750);
      expect(result.pendingPayouts.count).toBe(20);
      expect(result.pendingPayouts.amount).toBe(2700);
      expect(result.topEvents).toHaveLength(1);
      expect(result.topEvents[0].title).toBe('Concert');
    });

    it('should apply date filters when provided', async () => {
      prismaMock.ticketResale.aggregate.mockResolvedValue({
        _count: 0,
        _sum: { resalePrice: null, platformFee: null, sellerPayout: null },
      });
      prismaMock.ticketResale.groupBy.mockResolvedValue([]);
      prismaMock.$queryRaw.mockResolvedValue([]);

      await ResaleTransferAnalyticsService.getPlatformResaleStats({
        startDate: '2026-01-01',
        endDate: '2026-03-01',
      });

      expect(prismaMock.ticketResale.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { listedAt: { gte: new Date('2026-01-01'), lte: new Date('2026-03-01') } },
        }),
      );
    });

    it('should handle null aggregate sums', async () => {
      prismaMock.ticketResale.aggregate
        .mockResolvedValueOnce({
          _count: 0,
          _sum: { resalePrice: null, platformFee: null, sellerPayout: null },
        })
        .mockResolvedValueOnce({
          _count: 0,
          _sum: { sellerPayout: null },
        });
      prismaMock.ticketResale.groupBy.mockResolvedValue([]);
      prismaMock.$queryRaw.mockResolvedValue([]);

      const result = await ResaleTransferAnalyticsService.getPlatformResaleStats();

      expect(result.totalResaleValue).toBe(0);
      expect(result.totalPlatformFees).toBe(0);
      expect(result.totalSellerPayouts).toBe(0);
      expect(result.pendingPayouts.amount).toBe(0);
    });
  });

  // ─── getPlatformTransferStats ───

  describe('getPlatformTransferStats', () => {
    it('should return platform-wide transfer stats', async () => {
      prismaMock.ticketTransfer.count.mockResolvedValue(100);
      prismaMock.ticketTransfer.groupBy.mockResolvedValue([
        { status: 'PENDING', _count: 10 },
        { status: 'ACCEPTED', _count: 70 },
        { status: 'REJECTED', _count: 5 },
        { status: 'CANCELLED', _count: 10 },
        { status: 'EXPIRED', _count: 5 },
      ]);

      const result = await ResaleTransferAnalyticsService.getPlatformTransferStats();

      expect(result.totalTransfers).toBe(100);
      expect(result.pendingTransfers).toBe(10);
      expect(result.acceptedTransfers).toBe(70);
      expect(result.rejectedTransfers).toBe(5);
      expect(result.cancelledTransfers).toBe(10);
      expect(result.expiredTransfers).toBe(5);
    });

    it('should apply date filters', async () => {
      prismaMock.ticketTransfer.count.mockResolvedValue(0);
      prismaMock.ticketTransfer.groupBy.mockResolvedValue([]);

      await ResaleTransferAnalyticsService.getPlatformTransferStats({
        startDate: '2026-02-01',
      });

      expect(prismaMock.ticketTransfer.count).toHaveBeenCalledWith({
        where: { createdAt: { gte: new Date('2026-02-01') } },
      });
    });
  });

  // ─── getPlatformResaleActivity ───

  describe('getPlatformResaleActivity', () => {
    it('should return paginated resale activity with event info', async () => {
      prismaMock.ticketResale.findMany.mockResolvedValue([mockResaleListing]);
      prismaMock.ticketResale.count.mockResolvedValue(1);

      const result = await ResaleTransferAnalyticsService.getPlatformResaleActivity({
        page: 1, limit: 25,
      });

      expect(result.listings).toHaveLength(1);
      expect(result.listings[0].event).toEqual({ id: EVENT_ID, title: 'Test Event' });
      expect(result.listings[0].seller).toEqual(mockSeller);
      expect(result.listings[0].ticketType).toBe('VIP');
      expect(result.total).toBe(1);
    });

    it('should apply status and eventId filters', async () => {
      prismaMock.ticketResale.findMany.mockResolvedValue([]);
      prismaMock.ticketResale.count.mockResolvedValue(0);

      await ResaleTransferAnalyticsService.getPlatformResaleActivity({
        status: 'SOLD',
        eventId: EVENT_ID,
      });

      expect(prismaMock.ticketResale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'SOLD', registration: { eventId: EVENT_ID } },
        }),
      );
    });

    it('should use default pagination values', async () => {
      prismaMock.ticketResale.findMany.mockResolvedValue([]);
      prismaMock.ticketResale.count.mockResolvedValue(0);

      const result = await ResaleTransferAnalyticsService.getPlatformResaleActivity();

      expect(result.page).toBe(1);
      expect(prismaMock.ticketResale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 25 }),
      );
    });
  });

  // ─── getResalePendingPayouts ───

  describe('getResalePendingPayouts', () => {
    it('should return pending payouts with summary', async () => {
      prismaMock.ticketResale.findMany.mockResolvedValue([mockResaleListing]);
      prismaMock.ticketResale.count.mockResolvedValue(1);
      prismaMock.ticketResale.aggregate.mockResolvedValue({
        _count: 1,
        _sum: { sellerPayout: 135, platformFee: 15 },
      });

      const result = await ResaleTransferAnalyticsService.getResalePendingPayouts();

      expect(result.payouts).toHaveLength(1);
      expect(result.payouts[0].seller).toEqual(mockSeller);
      expect(result.payouts[0].resalePrice).toBe(150);
      expect(result.payouts[0].platformFee).toBe(15);
      expect(result.payouts[0].sellerPayout).toBe(135);
      expect(result.summary.totalPending).toBe(1);
      expect(result.summary.totalPayoutAmount).toBe(135);
      expect(result.summary.totalPlatformFees).toBe(15);
    });

    it('should filter only SOLD + COMPLETED resales', async () => {
      prismaMock.ticketResale.findMany.mockResolvedValue([]);
      prismaMock.ticketResale.count.mockResolvedValue(0);
      prismaMock.ticketResale.aggregate.mockResolvedValue({
        _count: 0,
        _sum: { sellerPayout: null, platformFee: null },
      });

      await ResaleTransferAnalyticsService.getResalePendingPayouts();

      expect(prismaMock.ticketResale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'SOLD', paymentStatus: 'COMPLETED' },
        }),
      );
    });

    it('should handle null platformFee and sellerPayout', async () => {
      const listingNullFees = {
        ...mockResaleListing,
        platformFee: null,
        sellerPayout: null,
      };
      prismaMock.ticketResale.findMany.mockResolvedValue([listingNullFees]);
      prismaMock.ticketResale.count.mockResolvedValue(1);
      prismaMock.ticketResale.aggregate.mockResolvedValue({
        _count: 1,
        _sum: { sellerPayout: null, platformFee: null },
      });

      const result = await ResaleTransferAnalyticsService.getResalePendingPayouts();

      expect(result.payouts[0].platformFee).toBe(0);
      expect(result.payouts[0].sellerPayout).toBe(0);
      expect(result.summary.totalPayoutAmount).toBe(0);
      expect(result.summary.totalPlatformFees).toBe(0);
    });

    it('should handle empty ticket line items in payouts', async () => {
      const listingNoTicket = {
        ...mockResaleListing,
        registration: {
          event: { id: EVENT_ID, title: 'Test Event' },
          ticketLineItems: [],
        },
      };
      prismaMock.ticketResale.findMany.mockResolvedValue([listingNoTicket]);
      prismaMock.ticketResale.count.mockResolvedValue(1);
      prismaMock.ticketResale.aggregate.mockResolvedValue({
        _count: 1,
        _sum: { sellerPayout: 135, platformFee: 15 },
      });

      const result = await ResaleTransferAnalyticsService.getResalePendingPayouts();

      expect(result.payouts[0].ticketType).toBe('Unknown');
    });
  });
});
