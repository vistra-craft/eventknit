import { UserDashboardService } from '../src/services/user-dashboard.service';
import { prisma } from '../src/services/user-dashboard.service'; // service uses its own prisma import

// Note: The service instantiates PrismaClient inside; we patch its methods directly.

describe('UserDashboardService', () => {
  const prismaAny: any = prisma;

  beforeEach(() => {
    // Reset mocks on prisma methods used
    prismaAny.eventRegistration = {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    };
    prismaAny.userInterest = {
      findMany: jest.fn(),
    };
    prismaAny.event = {
      findMany: jest.fn(),
    };
    prismaAny.$queryRaw = jest.fn();
  });

  describe('getPersonalizedRecommendations', () => {
    it('returns future approved events matching interests and excludes registered', async () => {
      prismaAny.eventRegistration.findMany.mockResolvedValue([
        { event: { category: 'Music', tags: ['live'], location: 'NYC' } },
      ]);
      prismaAny.userInterest.findMany.mockResolvedValue([{ category: 'Tech', tags: ['ai'] }]);
      prismaAny.event.findMany.mockResolvedValue([{ id: 'evt-1', title: 'Show' }]);

      const recs = await UserDashboardService.getPersonalizedRecommendations('user-1', 5);

      expect(prismaAny.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'APPROVED',
            type: 'PUBLIC',
          }),
          take: 5,
        }),
      );
      expect(recs).toEqual([{ id: 'evt-1', title: 'Show' }]);
    });
  });

  describe('getPersonalAnalytics', () => {
    it('computes analytics aggregates', async () => {
      prismaAny.eventRegistration.count
        .mockResolvedValueOnce(3) // totalEvents
        .mockResolvedValueOnce(1) // completedEvents
        .mockResolvedValueOnce(2); // upcomingEvents

      prismaAny.eventRegistration.aggregate.mockResolvedValue({ _sum: { totalAmount: 150 } });

      prismaAny.eventRegistration.groupBy.mockResolvedValue([
        { eventId: 'evt-1', _count: 2 },
      ]);
      prismaAny.event.findMany.mockResolvedValue([{ id: 'evt-1', category: 'Music' }]);

      prismaAny.$queryRaw.mockResolvedValue([{ month: '2024-01', count: 2n }]);

      prismaAny.eventRegistration.findMany = jest.fn().mockResolvedValue([
        { event: { category: 'Music' } },
        { event: { category: 'Tech' } },
      ]);

      const analytics = await UserDashboardService.getPersonalAnalytics('user-1');

      expect(analytics.overview.totalEvents).toBe(3);
      expect(analytics.overview.completedEvents).toBe(1);
      expect(analytics.overview.upcomingEvents).toBe(2);
      expect(analytics.overview.totalSpent).toBe(150);
      expect(analytics.registrationsByCategory).toEqual([{ category: 'Music', count: 2 }]);
      expect(analytics.registrationsByMonth).toEqual([{ month: '2024-01', count: 2 }]);
      expect(analytics.favoriteCategories).toHaveLength(2);
    });
  });
});

