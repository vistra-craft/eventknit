import { prisma } from '../config/database.js';
import { SocialPlatform, Prisma } from '@prisma/client';
import { ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface AnalyticsFilters {
  startDate?: Date | string;
  endDate?: Date | string;
  platform?: SocialPlatform;
  campaignId?: string;
}

export interface CampaignAttribution {
  campaignId: string;
  campaignName?: string;
  supportQueries: number;
  supportCost?: number;
  revenue?: number;
  roi?: number;
}

export class AnalyticsService {
  /**
   * Get unified analytics dashboard data
   */
  static async getUnifiedAnalytics(filters?: AnalyticsFilters) {
    try {
      const where: Prisma.SocialMessageWhereInput = {};
      const postWhere: Prisma.SocialPostWhereInput = {};

      if (filters?.startDate || filters?.endDate) {
        const dateFilter: Prisma.DateTimeFilter = {};
        if (filters.startDate) {
          dateFilter.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          dateFilter.lte = new Date(filters.endDate);
        }
        where.createdAt = dateFilter;
        postWhere.createdAt = dateFilter;
      }

      if (filters?.platform) {
        where.platform = filters.platform;
        postWhere.platform = filters.platform;
      }

      // Get social media metrics
      const [
        totalPosts,
        publishedPosts,
        scheduledPosts,
        _totalMessages,
        _newMessages,
        _resolvedMessages,
        totalAccounts,
        activeAccounts,
      ] = await Promise.all([
        prisma.socialPost.count({ where: postWhere }),
        prisma.socialPost.count({
          where: { ...postWhere, status: 'PUBLISHED' },
        }),
        prisma.socialPost.count({
          where: { ...postWhere, status: 'SCHEDULED' },
        }),
        prisma.socialMessage.count({ where }),
        prisma.socialMessage.count({
          where: { ...where, status: 'NEW' },
        }),
        prisma.socialMessage.count({
          where: { ...where, status: 'RESOLVED' },
        }),
        prisma.socialAccount.count({
          where: filters?.platform ? { platform: filters.platform } : {},
        }),
        prisma.socialAccount.count({
          where: {
            isActive: true,
            ...(filters?.platform ? { platform: filters.platform } : {}),
          },
        }),
      ]);

      // Get post engagement metrics
      const postsWithMetrics = await prisma.socialPost.findMany({
        where: {
          ...postWhere,
          status: 'PUBLISHED',
          metrics: { isNot: null },
        },
        include: {
          metrics: true,
        },
      });

      const totalEngagement = postsWithMetrics.reduce(
        (sum, post) => {
          if (!post.metrics) return sum;
          return {
            likes: sum.likes + post.metrics.likes,
            comments: sum.comments + post.metrics.comments,
            shares: sum.shares + post.metrics.shares,
            views: sum.views + post.metrics.views,
            reach: sum.reach + post.metrics.reach,
            impressions: sum.impressions + post.metrics.impressions,
          };
        },
        { likes: 0, comments: 0, shares: 0, views: 0, reach: 0, impressions: 0 },
      );

      // Get support metrics
      const supportStats = await this.getSupportMetrics(filters);

      // Get platform breakdown
      const platformBreakdown = await this.getPlatformBreakdown(filters);

      return {
        socialMedia: {
          accounts: {
            total: totalAccounts,
            active: activeAccounts,
          },
          posts: {
            total: totalPosts,
            published: publishedPosts,
            scheduled: scheduledPosts,
          },
          engagement: totalEngagement,
          engagementRate:
            totalEngagement.reach > 0
              ? ((totalEngagement.likes + totalEngagement.comments + totalEngagement.shares) /
                  totalEngagement.reach) *
                100
              : 0,
        },
        support: supportStats,
        platformBreakdown,
      };
    } catch (error) {
      logger.error('Failed to get unified analytics:', error);
      throw new ValidationError('Failed to retrieve analytics');
    }
  }

  /**
   * Get support metrics
   */
  static async getSupportMetrics(filters?: AnalyticsFilters) {
    try {
      const where: Prisma.SocialMessageWhereInput = {};

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      if (filters?.platform) {
        where.platform = filters.platform;
      }

      const [
        total,
        newQueries,
        inProgress,
        resolved,
        closed,
        avgResponseTime,
      ] = await Promise.all([
        prisma.socialMessage.count({ where }),
        prisma.socialMessage.count({
          where: { ...where, status: 'NEW' },
        }),
        prisma.socialMessage.count({
          where: { ...where, status: 'IN_PROGRESS' },
        }),
        prisma.socialMessage.count({
          where: { ...where, status: 'RESOLVED' },
        }),
        prisma.socialMessage.count({
          where: { ...where, status: 'CLOSED' },
        }),
        this.calculateAverageResponseTime(where),
      ]);

      return {
        totalQueries: total,
        byStatus: {
          new: newQueries,
          inProgress,
          resolved,
          closed,
        },
        averageResponseTime: avgResponseTime,
        resolutionRate: total > 0 ? (resolved / total) * 100 : 0,
      };
    } catch (error) {
      logger.error('Failed to get support metrics:', error);
      throw new ValidationError('Failed to retrieve support metrics');
    }
  }

  /**
   * Calculate average response time
   */
  private static async calculateAverageResponseTime(
    where: Prisma.SocialMessageWhereInput,
  ): Promise<number> {
    try {
      const resolvedQueries = await prisma.socialMessage.findMany({
        where: {
          ...where,
          status: 'RESOLVED',
          resolvedAt: { not: null },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
        },
      });

      if (resolvedQueries.length === 0) {
        return 0;
      }

      const responseTimes = resolvedQueries
        .map((q) => {
          if (!q.resolvedAt) return null;
          return q.resolvedAt.getTime() - q.createdAt.getTime();
        })
        .filter((t): t is number => t !== null);

      if (responseTimes.length === 0) {
        return 0;
      }

      return responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    } catch (error) {
      logger.error('Failed to calculate average response time:', error);
      return 0;
    }
  }

  /**
   * Get platform breakdown
   */
  static async getPlatformBreakdown(filters?: AnalyticsFilters) {
    try {
      const where: Prisma.SocialPostWhereInput = {};
      const messageWhere: Prisma.SocialMessageWhereInput = {};

      if (filters?.startDate || filters?.endDate) {
        const dateFilter: Prisma.DateTimeFilter = {};
        if (filters.startDate) {
          dateFilter.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          dateFilter.lte = new Date(filters.endDate);
        }
        where.createdAt = dateFilter;
        messageWhere.createdAt = dateFilter;
      }

      const [postsByPlatform, messagesByPlatform, accountsByPlatform] = await Promise.all([
        prisma.socialPost.groupBy({
          by: ['platform'],
          where,
          _count: { id: true },
        }),
        prisma.socialMessage.groupBy({
          by: ['platform'],
          where: messageWhere,
          _count: { id: true },
        }),
        prisma.socialAccount.groupBy({
          by: ['platform'],
          where: filters?.platform ? { platform: filters.platform } : {},
          _count: { id: true },
          _sum: {
            followers: true,
          },
        }),
      ]);

      const platforms = Object.values(SocialPlatform);
      const breakdown = platforms.map((platform) => {
        const posts = postsByPlatform.find((p) => p.platform === platform)?._count.id || 0;
        const messages =
          messagesByPlatform.find((m) => m.platform === platform)?._count.id || 0;
        const accounts =
          accountsByPlatform.find((a) => a.platform === platform)?._count.id || 0;
        const followers =
          accountsByPlatform.find((a) => a.platform === platform)?._sum.followers || 0;

        return {
          platform,
          posts,
          messages,
          accounts,
          followers,
        };
      });

      return breakdown;
    } catch (error) {
      logger.error('Failed to get platform breakdown:', error);
      throw new ValidationError('Failed to retrieve platform breakdown');
    }
  }

  /**
   * Get campaign attribution (link support queries to campaigns)
   */
  static async getCampaignAttribution(filters?: AnalyticsFilters): Promise<CampaignAttribution[]> {
    try {
      const where: Prisma.SocialMessageWhereInput = {};

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      if (filters?.platform) {
        where.platform = filters.platform;
      }

      // Get messages grouped by campaign
      const messagesByCampaign = await prisma.socialMessage.groupBy({
        by: ['campaignId'],
        where: {
          ...where,
          campaignId: { not: null },
        },
        _count: { id: true },
      });

      const attribution: CampaignAttribution[] = [];

      for (const item of messagesByCampaign) {
        if (!item.campaignId) continue;

        // Count support queries for this campaign
        const supportQueries = item._count.id;

        // Calculate support cost (simplified - would need actual cost data)
        // Assuming average cost per query
        const avgCostPerQuery = 5; // $5 per query (placeholder)
        const supportCost = supportQueries * avgCostPerQuery;

        attribution.push({
          campaignId: item.campaignId,
          supportQueries,
          supportCost,
          // Revenue and ROI would come from campaign data (future implementation)
          revenue: 0,
          roi: 0,
        });
      }

      return attribution;
    } catch (error) {
      logger.error('Failed to get campaign attribution:', error);
      throw new ValidationError('Failed to retrieve campaign attribution');
    }
  }

  /**
   * Get customer journey tracking
   */
  static async getCustomerJourney(customerIdentifier: string, filters?: AnalyticsFilters) {
    try {
      // Find all touchpoints for this customer
      // This is a simplified version - in production, you'd need better customer identification
      const where: Prisma.SocialMessageWhereInput = {
        OR: [
          { senderEmail: customerIdentifier },
          { senderHandle: customerIdentifier },
        ],
      };

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      const messages = await prisma.socialMessage.findMany({
        where,
        include: {
          socialPost: {
            select: {
              id: true,
              content: true,
              publishedAt: true,
              campaignId: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      // Group by campaign if available
      const journey = messages.map((msg) => ({
        timestamp: msg.createdAt,
        type: 'support_query',
        platform: msg.platform,
        message: msg.message,
        status: msg.status,
        relatedPost: msg.socialPost
          ? {
            id: msg.socialPost.id,
            content: msg.socialPost.content,
            publishedAt: msg.socialPost.publishedAt,
            campaignId: msg.socialPost.campaignId,
          }
          : null,
        campaignId: msg.campaignId || msg.socialPost?.campaignId || null,
      }));

      return {
        customerIdentifier,
        touchpoints: journey,
        totalTouchpoints: journey.length,
        campaigns: [...new Set(journey.map((j) => j.campaignId).filter(Boolean))],
      };
    } catch (error) {
      logger.error(`Failed to get customer journey for ${customerIdentifier}:`, error);
      throw new ValidationError('Failed to retrieve customer journey');
    }
  }

  /**
   * Get social media ROI
   */
  static async getSocialMediaROI(filters?: AnalyticsFilters) {
    try {
      const where: Prisma.SocialPostWhereInput = {
        status: 'PUBLISHED',
      };

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      if (filters?.platform) {
        where.platform = filters.platform;
      }

      const posts = await prisma.socialPost.findMany({
        where,
        include: {
          metrics: true,
        },
      });

      // Calculate total engagement
      const totalEngagement = posts.reduce(
        (sum, post) => {
          if (!post.metrics) return sum;
          return {
            likes: sum.likes + post.metrics.likes,
            comments: sum.comments + post.metrics.comments,
            shares: sum.shares + post.metrics.shares,
            views: sum.views + post.metrics.views,
            reach: sum.reach + post.metrics.reach,
          };
        },
        { likes: 0, comments: 0, shares: 0, views: 0, reach: 0 },
      );

      // Simplified ROI calculation
      // In production, you'd have actual costs and revenue data
      const estimatedCost = posts.length * 10; // $10 per post (placeholder)
      const estimatedValue = totalEngagement.reach * 0.01; // $0.01 per reach (placeholder)
      const roi = estimatedCost > 0 ? ((estimatedValue - estimatedCost) / estimatedCost) * 100 : 0;

      return {
        totalPosts: posts.length,
        totalEngagement,
        estimatedCost,
        estimatedValue,
        roi,
        engagementRate:
          totalEngagement.reach > 0
            ? ((totalEngagement.likes + totalEngagement.comments + totalEngagement.shares) /
                totalEngagement.reach) *
              100
            : 0,
      };
    } catch (error) {
      logger.error('Failed to get social media ROI:', error);
      throw new ValidationError('Failed to retrieve social media ROI');
    }
  }

  /**
   * Get support efficiency metrics
   */
  static async getSupportEfficiency(filters?: AnalyticsFilters) {
    try {
      const where: Prisma.SocialMessageWhereInput = {};

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      if (filters?.platform) {
        where.platform = filters.platform;
      }

      const [
        totalQueries,
        resolvedQueries,
        avgResponseTime,
        avgResolutionTime,
        queriesByPriority,
      ] = await Promise.all([
        prisma.socialMessage.count({ where }),
        prisma.socialMessage.count({
          where: { ...where, status: 'RESOLVED' },
        }),
        this.calculateAverageResponseTime(where),
        this.calculateAverageResolutionTime(where),
        prisma.socialMessage.groupBy({
          by: ['priority'],
          where,
          _count: { id: true },
        }),
      ]);

      return {
        totalQueries,
        resolvedQueries,
        resolutionRate: totalQueries > 0 ? (resolvedQueries / totalQueries) * 100 : 0,
        averageResponseTime: avgResponseTime,
        averageResolutionTime: avgResolutionTime,
        byPriority: queriesByPriority.reduce(
          (acc, item) => {
            acc[item.priority] = item._count.id;
            return acc;
          },
          {} as Record<string, number>,
        ),
      };
    } catch (error) {
      logger.error('Failed to get support efficiency:', error);
      throw new ValidationError('Failed to retrieve support efficiency metrics');
    }
  }

  /**
   * Calculate average resolution time
   */
  private static async calculateAverageResolutionTime(
    where: Prisma.SocialMessageWhereInput,
  ): Promise<number> {
    try {
      const resolvedQueries = await prisma.socialMessage.findMany({
        where: {
          ...where,
          status: 'RESOLVED',
          resolvedAt: { not: null },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
        },
      });

      if (resolvedQueries.length === 0) {
        return 0;
      }

      const resolutionTimes = resolvedQueries
        .map((q) => {
          if (!q.resolvedAt) return null;
          return q.resolvedAt.getTime() - q.createdAt.getTime();
        })
        .filter((t): t is number => t !== null);

      if (resolutionTimes.length === 0) {
        return 0;
      }

      return resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length;
    } catch (error) {
      logger.error('Failed to calculate average resolution time:', error);
      return 0;
    }
  }

  /**
   * Get user geography analytics from audit logs
   */
  static async getUserGeographyAnalytics(filters?: AnalyticsFilters) {
    try {
      const where: Prisma.AuditLogWhereInput = {};

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      // Get country breakdown
      const countryBreakdown = await prisma.auditLog.groupBy({
        by: ['countryCode', 'country'],
        where: {
          ...where,
          countryCode: { not: null },
        },
        _count: { id: true },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      });

      // Get total unique countries
      const uniqueCountries = await prisma.auditLog.findMany({
        where: {
          ...where,
          countryCode: { not: null },
        },
        select: {
          countryCode: true,
        },
        distinct: ['countryCode'],
      });

      // Get top cities
      const topCities = await prisma.auditLog.groupBy({
        by: ['city', 'countryCode'],
        where: {
          ...where,
          city: { not: null },
        },
        _count: { id: true },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 20,
      });

      // Get login events by country
      const loginEventsByCountry = await prisma.auditLog.groupBy({
        by: ['countryCode', 'action'],
        where: {
          ...where,
          countryCode: { not: null },
          action: {
            in: ['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGIN_ATTEMPT_LOCKED'],
          },
        },
        _count: { id: true },
      });

      return {
        totalUniqueCountries: uniqueCountries.length,
        countryBreakdown: countryBreakdown.map((item) => ({
          countryCode: item.countryCode || 'Unknown',
          country: item.country || 'Unknown',
          count: item._count.id,
        })),
        topCities: topCities.map((item) => ({
          city: item.city || 'Unknown',
          countryCode: item.countryCode || 'Unknown',
          count: item._count.id,
        })),
        loginEventsByCountry: loginEventsByCountry.reduce(
          (acc, item) => {
            const countryCode = item.countryCode || 'Unknown';
            if (!acc[countryCode]) {
              acc[countryCode] = {
                countryCode,
                loginSuccess: 0,
                loginFailure: 0,
                loginLocked: 0,
              };
            }
            if (item.action === 'LOGIN_SUCCESS') {
              acc[countryCode].loginSuccess = item._count.id;
            } else if (item.action === 'LOGIN_FAILURE') {
              acc[countryCode].loginFailure = item._count.id;
            } else if (item.action === 'LOGIN_ATTEMPT_LOCKED') {
              acc[countryCode].loginLocked = item._count.id;
            }
            return acc;
          },
          {} as Record<
            string,
            {
              countryCode: string;
              loginSuccess: number;
              loginFailure: number;
              loginLocked: number;
            }
          >,
        ),
      };
    } catch (error) {
      logger.error('Failed to get user geography analytics:', error);
      throw new ValidationError('Failed to retrieve user geography analytics');
    }
  }

  /**
   * Get security events analytics
   */
  static async getSecurityEventsAnalytics(filters?: AnalyticsFilters) {
    try {
      const where: Prisma.AuditLogWhereInput = {
        action: {
          in: [
            'LOGIN_SUCCESS',
            'LOGIN_FAILURE',
            'LOGIN_ATTEMPT_LOCKED',
            'SUSPICIOUS_ACTIVITY',
            'RATE_LIMIT_EXCEEDED',
            'UNAUTHORIZED_ACCESS',
          ],
        },
      };

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      // Get security events by type
      const eventsByType = await prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { id: true },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      });

      // Get security events by country
      const eventsByCountry = await prisma.auditLog.groupBy({
        by: ['countryCode', 'action'],
        where: {
          ...where,
          countryCode: { not: null },
        },
        _count: { id: true },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      });

      // Get recent suspicious activities
      const recentSuspicious = await prisma.auditLog.findMany({
        where: {
          ...where,
          action: 'SUSPICIOUS_ACTIVITY',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
        select: {
          id: true,
          userId: true,
          action: true,
          ipAddress: true,
          country: true,
          countryCode: true,
          city: true,
          userAgent: true,
          metadata: true,
          createdAt: true,
        },
      });

      return {
        eventsByType: eventsByType.map((item) => ({
          action: item.action,
          count: item._count.id,
        })),
        eventsByCountry: eventsByCountry.reduce(
          (acc, item) => {
            const countryCode = item.countryCode || 'Unknown';
            if (!acc[countryCode]) {
              acc[countryCode] = {};
            }
            acc[countryCode][item.action] = item._count.id;
            return acc;
          },
          {} as Record<string, Record<string, number>>,
        ),
        recentSuspiciousActivities: recentSuspicious,
        totalSecurityEvents: eventsByType.reduce((sum, item) => sum + item._count.id, 0),
      };
    } catch (error) {
      logger.error('Failed to get security events analytics:', error);
      throw new ValidationError('Failed to retrieve security events analytics');
    }
  }

  /**
   * Get user session analytics by country
   */
  static async getUserSessionsAnalytics(filters?: AnalyticsFilters) {
    try {
      const where: Prisma.AuditLogWhereInput = {
        action: 'LOGIN_SUCCESS',
      };

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      // Get sessions by country
      const sessionsByCountry = await prisma.auditLog.groupBy({
        by: ['countryCode', 'country'],
        where: {
          ...where,
          countryCode: { not: null },
        },
        _count: { id: true },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      });

      // Get unique users by country
      const uniqueUsersByCountry = await prisma.auditLog.groupBy({
        by: ['countryCode'],
        where: {
          ...where,
          countryCode: { not: null },
          userId: { not: null },
        },
        _count: {
          userId: true,
        },
      });

      // Get total sessions
      const totalSessions = await prisma.auditLog.count({ where });

      return {
        totalSessions,
        sessionsByCountry: sessionsByCountry.map((item) => ({
          countryCode: item.countryCode || 'Unknown',
          country: item.country || 'Unknown',
          sessionCount: item._count.id,
          uniqueUsers:
            uniqueUsersByCountry.find((u) => u.countryCode === item.countryCode)?._count.userId ||
            0,
        })),
      };
    } catch (error) {
      logger.error('Failed to get user sessions analytics:', error);
      throw new ValidationError('Failed to retrieve user sessions analytics');
    }
  }
}

