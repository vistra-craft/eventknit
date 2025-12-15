import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();
export { prisma };

export class UserDashboardService {
  /**
   * Get personalized event recommendations for a user
   */
  static async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10,
  ) {
    try {
      // Get user's past events and interests
      const userRegistrations = await prisma.eventRegistration.findMany({
        where: { attendeeId: userId },
        include: {
          event: {
            select: {
              category: true,
              tags: true,
              location: true,
            },
          },
        },
      });

      const userInterests = await prisma.userInterest.findMany({
        where: { userId },
      });

      // Extract preferences
      const categories = new Set<string>();
      const tags = new Set<string>();
      const locations = new Set<string>();

      userRegistrations.forEach((reg) => {
        if (reg.event.category) categories.add(reg.event.category);
        reg.event.tags?.forEach((tag) => tags.add(tag));
        if (reg.event.location) locations.add(reg.event.location);
      });

      userInterests.forEach((interest) => {
        categories.add(interest.category);
        interest.tags?.forEach((tag) => tags.add(tag));
      });

      // Build recommendation query
      const where: Prisma.EventWhereInput = {
        status: 'APPROVED',
        type: 'PUBLIC',
        deletedAt: null,
        startDate: {
          gte: new Date(), // Only future events
        },
        // Exclude events user already registered for
        registrations: {
          none: {
            attendeeId: userId,
          },
        },
        OR: [
          ...Array.from(categories).map((cat) => ({ category: cat })),
          ...Array.from(tags).map((tag) => ({ tags: { has: tag } })),
          ...Array.from(locations).map((loc) => ({
            location: { contains: loc, mode: 'insensitive' as const },
          })),
        ] as Prisma.EventWhereInput[],
      };

      const recommendations = await prisma.event.findMany({
        where,
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              organizationName: true,
            },
          },
          _count: {
            select: {
              registrations: true,
            },
          },
        },
        orderBy: {
          startDate: 'asc',
        },
        take: limit,
      });

      return recommendations;
    } catch (error) {
      logger.error('Error getting personalized recommendations:', error);
      throw error;
    }
  }

  /**
   * Get user's personal analytics
   */
  static async getPersonalAnalytics(userId: string) {
    try {
      const [
        totalEvents,
        completedEvents,
        upcomingEvents,
        totalSpent,
        registrationsByCategory,
        registrationsByMonth,
        favoriteCategories,
      ] = await Promise.all([
        // Total events registered
        prisma.eventRegistration.count({
          where: { attendeeId: userId },
        }),

        // Completed events
        prisma.eventRegistration.count({
          where: {
            attendeeId: userId,
            event: {
              endDate: {
                lt: new Date(),
              },
            },
          },
        }),

        // Upcoming events
        prisma.eventRegistration.count({
          where: {
            attendeeId: userId,
            event: {
              startDate: {
                gte: new Date(),
              },
            },
          },
        }),

        // Total spent
        prisma.eventRegistration.aggregate({
          where: {
            attendeeId: userId,
            paymentStatus: 'COMPLETED',
          },
          _sum: {
            totalAmount: true,
          },
        }),

        // Registrations by category
        prisma.eventRegistration.groupBy({
          by: ['eventId'],
          where: { attendeeId: userId },
          _count: true,
        }).then(async (groups) => {
          const eventIds = groups.map((g) => g.eventId);
          const events = await prisma.event.findMany({
            where: { id: { in: eventIds } },
            select: { id: true, category: true },
          });

          const categoryMap = new Map<string, number>();
          groups.forEach((group) => {
            const event = events.find((e) => e.id === group.eventId);
            if (event?.category) {
              categoryMap.set(
                event.category,
                (categoryMap.get(event.category) || 0) + group._count,
              );
            }
          });

          return Array.from(categoryMap.entries()).map(([category, count]) => ({
            category,
            count,
          }));
        }),

        // Registrations by month (last 12 months)
        prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
          SELECT 
            TO_CHAR("createdAt", 'YYYY-MM') as month,
            COUNT(*)::int as count
          FROM "EventRegistration"
          WHERE "attendeeId" = ${userId}
            AND "createdAt" >= NOW() - INTERVAL '12 months'
          GROUP BY month
          ORDER BY month ASC
        `,

        // Favorite categories (top 5)
        prisma.eventRegistration.findMany({
          where: { attendeeId: userId },
          include: {
            event: {
              select: { category: true },
            },
          },
        }).then((regs) => {
          const categoryCount = new Map<string, number>();
          regs.forEach((reg) => {
            if (reg.event.category) {
              categoryCount.set(
                reg.event.category,
                (categoryCount.get(reg.event.category) || 0) + 1,
              );
            }
          });

          return Array.from(categoryCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([category, count]) => ({ category, count }));
        }),
      ]);

      return {
        totalEvents,
        completedEvents,
        upcomingEvents,
        totalSpent: totalSpent._sum.totalAmount || 0,
        registrationsByCategory,
        registrationsByMonth: registrationsByMonth.map((m) => ({
          month: m.month,
          count: Number(m.count),
        })),
        favoriteCategories,
        overview: {
          totalEvents,
          completedEvents,
          upcomingEvents,
          totalSpent: totalSpent._sum.totalAmount || 0,
        },
      };
    } catch (error) {
      logger.error('Error getting personal analytics:', error);
      throw error;
    }
  }

  /**
   * Get user's activity history
   */
  static async getActivityHistory(
    userId: string,
    filters?: {
      page?: number;
      limit?: number;
      activityType?: string;
    },
  ) {
    try {
      const limit = filters?.limit || 20;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const where: Prisma.ActivityHistoryWhereInput = {
        userId,
      };

      if (filters?.activityType) {
        where.activityType = filters.activityType;
      }

      const [activities, total] = await Promise.all([
        prisma.activityHistory.findMany({
          where,
          include: {
            event: {
              select: {
                id: true,
                title: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.activityHistory.count({ where }),
      ]);

      return {
        activities,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      };
    } catch (error) {
      logger.error('Error getting activity history:', error);
      throw error;
    }
  }
}
