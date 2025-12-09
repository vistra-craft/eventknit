import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { DiscountType } from '@prisma/client';

export class AdvancedPromoCodeService {
  /**
   * Create promo code variant for A/B testing
   */
  static async createVariant(promoCodeId: string, organizerId: string, data: {
    name: string;
    code: string;
    discountType: DiscountType;
    discountValue: number;
    trafficPercentage?: number;
    isControl?: boolean;
  }) {
    try {
      // Verify promo code belongs to organizer
      const promoCode = await prisma.promoCode.findFirst({
        where: {
          id: promoCodeId,
          organizerId,
        },
      });

      if (!promoCode) {
        throw new NotFoundError('Promo code not found');
      }

      // Check if code already exists
      const existing = await prisma.promoCodeVariant.findUnique({
        where: {
          promoCodeId_code: {
            promoCodeId,
            code: data.code.toUpperCase(),
          },
        },
      });

      if (existing) {
        throw new ValidationError('Variant code already exists');
      }

      const variant = await prisma.promoCodeVariant.create({
        data: {
          promoCodeId,
          name: data.name,
          code: data.code.toUpperCase(),
          discountType: data.discountType,
          discountValue: data.discountValue,
          trafficPercentage: data.trafficPercentage || 50,
          isControl: data.isControl || false,
        },
      });

      return variant;
    } catch (error) {
      logger.error('Error creating promo code variant:', error);
      throw error;
    }
  }

  /**
   * Get promo code performance analytics
   */
  static async getPromoCodeAnalytics(organizerId: string, promoCodeId: string) {
    try {
      const promoCode = await prisma.promoCode.findFirst({
        where: {
          id: promoCodeId,
          organizerId,
        },
        include: {
          redemptions: {
            include: {
              registration: {
                include: {
                  event: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
          },
          variants: true,
        },
      });

      if (!promoCode) {
        throw new NotFoundError('Promo code not found');
      }

      // Calculate analytics
      const totalRedemptions = promoCode.redemptions.length;
      const totalDiscountGiven = promoCode.redemptions.reduce(
        (sum, r) => sum + Number(r.discountAmount),
        0
      );
      const totalRevenue = promoCode.redemptions.reduce(
        (sum, r) => sum + Number(r.finalAmount),
        0
      );

      // Redemptions over time
      const redemptionsByDate = promoCode.redemptions.reduce((acc: any, redemption) => {
        const date = new Date(redemption.redeemedAt).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, count: 0, revenue: 0 };
        }
        acc[date].count++;
        acc[date].revenue += Number(redemption.finalAmount);
        return acc;
      }, {});

      // Redemptions by user
      const redemptionsByUser = promoCode.redemptions.reduce((acc: any, redemption) => {
        if (!acc[redemption.userId]) {
          acc[redemption.userId] = { userId: redemption.userId, count: 0, totalDiscount: 0 };
        }
        acc[redemption.userId].count++;
        acc[redemption.userId].totalDiscount += Number(redemption.discountAmount);
        return acc;
      }, {});

      // Variant performance
      const variantPerformance = promoCode.variants.map(variant => ({
        id: variant.id,
        name: variant.name,
        code: variant.code,
        views: variant.views,
        redemptions: variant.redemptions,
        revenue: Number(variant.revenue),
        conversionRate: variant.views > 0 ? (variant.redemptions / variant.views) * 100 : 0,
      }));

      return {
        promoCode: {
          id: promoCode.id,
          code: promoCode.code,
          usedCount: promoCode.usedCount,
          usageLimit: promoCode.usageLimit,
        },
        summary: {
          totalRedemptions,
          totalDiscountGiven,
          totalRevenue,
          averageDiscount: totalRedemptions > 0 ? totalDiscountGiven / totalRedemptions : 0,
          averageOrderValue: totalRedemptions > 0 ? totalRevenue / totalRedemptions : 0,
          redemptionRate: promoCode.usageLimit
            ? (totalRedemptions / promoCode.usageLimit) * 100
            : null,
        },
        redemptionsByDate: Object.values(redemptionsByDate),
        topUsers: Object.values(redemptionsByUser)
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 10),
        variantPerformance,
      };
    } catch (error) {
      logger.error('Error getting promo code analytics:', error);
      throw error;
    }
  }

  /**
   * Get all promo codes analytics for organizer
   */
  static async getOrganizerPromoCodeAnalytics(organizerId: string, filters?: {
    eventId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const where: any = {
        organizerId,
      };

      if (filters?.eventId) {
        where.eventId = filters.eventId;
      }

      const promoCodes = await prisma.promoCode.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          redemptions: {
            where: {
              redeemedAt: {
                gte: filters?.startDate,
                lte: filters?.endDate,
              },
            },
          },
          _count: {
            select: {
              redemptions: true,
            },
          },
        },
      });

      const analytics = promoCodes.map(pc => {
        const totalDiscount = pc.redemptions.reduce(
          (sum, r) => sum + Number(r.discountAmount),
          0
        );
        const totalRevenue = pc.redemptions.reduce(
          (sum, r) => sum + Number(r.finalAmount),
          0
        );

        return {
          id: pc.id,
          code: pc.code,
          event: pc.event,
          usedCount: pc._count.redemptions,
          usageLimit: pc.usageLimit,
          totalDiscount,
          totalRevenue,
          conversionRate: pc.usageLimit
            ? (pc._count.redemptions / pc.usageLimit) * 100
            : null,
        };
      });

      return {
        promoCodes: analytics,
        total: analytics.length,
        summary: {
          totalPromoCodes: analytics.length,
          totalRedemptions: analytics.reduce((sum, a) => sum + a.usedCount, 0),
          totalDiscountGiven: analytics.reduce((sum, a) => sum + a.totalDiscount, 0),
          totalRevenue: analytics.reduce((sum, a) => sum + a.totalRevenue, 0),
        },
      };
    } catch (error) {
      logger.error('Error getting organizer promo code analytics:', error);
      throw error;
    }
  }

  /**
   * Track promo code view (for analytics)
   */
  static async trackPromoCodeView(promoCodeId: string, variantId?: string) {
    try {
      if (variantId) {
        await prisma.promoCodeVariant.update({
          where: { id: variantId },
          data: {
            views: {
              increment: 1,
            },
          },
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Error tracking promo code view:', error);
      // Don't throw - analytics tracking shouldn't break the flow
      return { success: false };
    }
  }

  /**
   * Track promo code redemption (for analytics)
   */
  static async trackPromoCodeRedemption(
    promoCodeId: string,
    redemptionId: string,
    variantId?: string,
    revenue?: number
  ) {
    try {
      if (variantId) {
        await prisma.promoCodeVariant.update({
          where: { id: variantId },
          data: {
            redemptions: {
              increment: 1,
            },
            revenue: {
              increment: revenue || 0,
            },
          },
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Error tracking promo code redemption:', error);
      // Don't throw - analytics tracking shouldn't break the flow
      return { success: false };
    }
  }
}
