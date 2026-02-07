import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export class EventShareService {
  /**
   * Track event share
   */
  static async trackShare(
    eventId: string,
    data: {
      userId?: string;
      platform: string;
      shareUrl?: string;
      referrer?: string;
    },
  ) {
    try {
      const share = await prisma.eventShare.create({
        data: {
          eventId,
          userId: data.userId,
          platform: data.platform,
          shareUrl: data.shareUrl,
          referrer: data.referrer,
        },
      });

      return share;
    } catch (error) {
      logger.error('Error tracking share:', error);
      throw error;
    }
  }

  /**
   * Track share click
   */
  static async trackShareClick(shareId: string) {
    try {
      const share = await prisma.eventShare.update({
        where: { id: shareId },
        data: {
          clickCount: {
            increment: 1,
          },
        },
      });

      return share;
    } catch (error) {
      logger.error('Error tracking share click:', error);
      throw error;
    }
  }

  /**
   * Track conversion from share
   */
  static async trackConversion(shareId: string) {
    try {
      const share = await prisma.eventShare.update({
        where: { id: shareId },
        data: {
          conversionCount: {
            increment: 1,
          },
        },
      });

      return share;
    } catch (error) {
      logger.error('Error tracking conversion:', error);
      throw error;
    }
  }

  /**
   * Get event share analytics
   */
  static async getEventShareAnalytics(eventId: string, userId?: string) {
    try {
      const where: any = { eventId };
      if (userId) {
        where.userId = userId;
      }

      const [shares, totalShares, totalClicks, totalConversions] = await Promise.all([
        prisma.eventShare.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
        prisma.eventShare.count({ where }),
        prisma.eventShare.aggregate({
          where,
          _sum: {
            clickCount: true,
          },
        }),
        prisma.eventShare.aggregate({
          where,
          _sum: {
            conversionCount: true,
          },
        }),
      ]);

      // Group by platform
      const platformStats = shares.reduce((acc: any, share) => {
        if (!acc[share.platform]) {
          acc[share.platform] = {
            platform: share.platform,
            count: 0,
            clicks: 0,
            conversions: 0,
          };
        }
        acc[share.platform].count += 1;
        acc[share.platform].clicks += share.clickCount;
        acc[share.platform].conversions += share.conversionCount;
        return acc;
      }, {});

      return {
        totalShares,
        totalClicks: totalClicks._sum.clickCount || 0,
        totalConversions: totalConversions._sum.conversionCount || 0,
        platformStats: Object.values(platformStats),
        recentShares: shares,
      };
    } catch (error) {
      logger.error('Error getting share analytics:', error);
      throw error;
    }
  }
}
