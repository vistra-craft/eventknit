import { OrganizerAnalyticsService } from '../src/services/organizer-analytics.service';
import { NotFoundError } from '../src/utils/errors';
import { prisma } from '../src/config/database';

vi.mock('../src/config/database', () => ({
  prisma: {
    event: { findFirst: vi.fn() },
    eventRegistration: { findMany: vi.fn() },
    eventPaymentTransaction: { findMany: vi.fn() },
    refund: { findMany: vi.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  event: { findFirst: vi.Mock };
  eventRegistration: { findMany: vi.Mock };
  eventPaymentTransaction: { findMany: vi.Mock };
  refund: { findMany: vi.Mock };
};

describe('OrganizerAnalyticsService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getEventAnalytics', () => {
    it('throws when event not found', async () => {
      prismaMock.event.findFirst.mockResolvedValue(null);
      await expect(
        OrganizerAnalyticsService.getEventAnalytics('org-1', 'evt-x'),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('returns basics when event exists', async () => {
      prismaMock.event.findFirst.mockResolvedValue({ id: 'evt-1', title: 'Event' });
      prismaMock.eventRegistration.findMany.mockResolvedValue([
        { status: 'CONFIRMED', checkedInAt: new Date(), checkedOutAt: null },
        { status: 'PENDING', checkedInAt: null, checkedOutAt: null },
      ]);

      const result = await OrganizerAnalyticsService.getEventAnalytics('org-1', 'evt-1');

      expect(result.event.id).toBe('evt-1');
      expect(result.overview.totalRegistrations).toBe(2);
      expect(result.overview.confirmedRegistrations).toBe(1);
      expect(result.overview.checkedIn).toBe(1);
    });
  });

  describe('getRevenueAnalytics', () => {
    it('computes revenue and refunds', async () => {
      prismaMock.eventPaymentTransaction.findMany.mockResolvedValue([
        { amount: 100, platformFee: { feeAmount: 10 } },
        { amount: 50, platformFee: null },
      ]);
      prismaMock.eventRegistration.findMany.mockResolvedValue([
        { ticketLineItems: [{ ticketType: 'GA', quantity: 1, totalPrice: 50 }] },
      ]);
      prismaMock.refund.findMany.mockResolvedValue([{ refundAmount: 20 }]);

      const revenue = await OrganizerAnalyticsService.getRevenueAnalytics('org-1', { eventId: 'evt-1' });

      expect(revenue.summary.totalRevenue).toBe(150);
      expect(revenue.summary.totalPlatformFees).toBe(10);
      expect(revenue.summary.netRevenue).toBe(140);
      expect(revenue.refunds.totalRefunds).toBe(20);
    });
  });
});

