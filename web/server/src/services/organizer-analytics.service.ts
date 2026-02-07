import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';

export class OrganizerAnalyticsService {
  /**
   * Get advanced event analytics
   */
  static async getEventAnalytics(organizerId: string, eventId: string, timeRange?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          organizerId,
          deletedAt: null,
        },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      const startDate = timeRange?.startDate || new Date(0);
      const endDate = timeRange?.endDate || new Date();

      // Get registrations
      const registrations = await prisma.eventRegistration.findMany({
        where: {
          eventId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          attendee: {
            select: {
              id: true,
              email: true,
            },
          },
          ticketScans: true,
        },
      });

      // Conversion funnel
      const totalViews = 0; // Would need to track event views
      const totalRegistrations = registrations.length;
      const confirmedRegistrations = registrations.filter(r => r.status === 'CONFIRMED').length;
      const checkedIn = registrations.filter(r => r.checkedInAt).length;
      const checkedOut = registrations.filter(r => r.checkedOutAt).length;

      // Traffic sources (would need to track this)
      const trafficSources = {
        direct: 0,
        social: 0,
        email: 0,
        referral: 0,
        organic: 0,
      };

      // Device analytics (would need to track this)
      const deviceBreakdown = {
        desktop: 0,
        mobile: 0,
        tablet: 0,
      };

      // Geographic distribution
      const geographicData = registrations.reduce((acc: any, _reg) => {
        // Would need to extract location from registration data
        return acc;
      }, {});

      // Registration trends over time
      const registrationTrends = this.calculateTrends(registrations, 'createdAt');

      return {
        event: {
          id: event.id,
          title: event.title,
        },
        overview: {
          totalViews,
          totalRegistrations,
          confirmedRegistrations,
          checkedIn,
          checkedOut,
          conversionRate: totalViews > 0 ? (totalRegistrations / totalViews) * 100 : 0,
          checkInRate: confirmedRegistrations > 0 ? (checkedIn / confirmedRegistrations) * 100 : 0,
        },
        funnel: {
          views: totalViews,
          registrations: totalRegistrations,
          confirmed: confirmedRegistrations,
          checkedIn,
          checkedOut,
        },
        trafficSources,
        deviceBreakdown,
        geographicData,
        registrationTrends,
      };
    } catch (error) {
      logger.error('Error getting event analytics:', error);
      throw error;
    }
  }

  /**
   * Get revenue analytics
   */
  static async getRevenueAnalytics(organizerId: string, filters?: {
    eventId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const where: any = {
        event: {
          organizerId,
          deletedAt: null,
        },
        paymentStatus: 'success',
      };

      if (filters?.eventId) {
        where.eventId = filters.eventId;
      }

      if (filters?.startDate || filters?.endDate) {
        where.paymentDate = {};
        if (filters.startDate) {
          where.paymentDate.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.paymentDate.lte = filters.endDate;
        }
      }

      const transactions = await prisma.eventPaymentTransaction.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          platformFee: true,
        },
      });

      // Calculate totals
      const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const totalPlatformFees = transactions.reduce((sum, t) => 
        sum + (t.platformFee ? Number(t.platformFee.feeAmount) : 0), 0);
      const netRevenue = totalRevenue - totalPlatformFees;

      // Revenue by ticket type
      const registrations = await prisma.eventRegistration.findMany({
        where: {
          eventId: filters?.eventId,
          status: 'CONFIRMED',
          paymentStatus: 'success',
        },
        include: {
          ticketLineItems: true,
        },
      });

      const revenueByTicketType = registrations.reduce((acc: any, reg) => {
        reg.ticketLineItems.forEach(item => {
          if (!acc[item.ticketType]) {
            acc[item.ticketType] = {
              ticketType: item.ticketType,
              quantity: 0,
              revenue: 0,
            };
          }
          acc[item.ticketType].quantity += item.quantity;
          acc[item.ticketType].revenue += Number(item.totalPrice);
        });
        return acc;
      }, {});

      // Refund analysis
      const refunds = await prisma.refund.findMany({
        where: {
          transaction: {
            event: {
              organizerId,
            },
          },
          status: 'COMPLETED',
        },
        include: {
          transaction: {
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
      });

      const totalRefunds = refunds.reduce((sum, r) => sum + Number(r.refundAmount ?? 0), 0);
      const refundRate = totalRevenue > 0 ? (totalRefunds / totalRevenue) * 100 : 0;

      // Average order value
      const avgOrderValue = transactions.length > 0 ? totalRevenue / transactions.length : 0;

      // Revenue trends
      const revenueTrends = this.calculateTrends(transactions, 'paymentDate', 'amount');

      // Revenue forecasting (simple linear projection)
      const forecast = this.calculateForecast(transactions);

      return {
        summary: {
          totalRevenue,
          totalPlatformFees,
          netRevenue,
          totalRefunds,
          refundRate,
          avgOrderValue,
          transactionCount: transactions.length,
        },
        revenueByTicketType: Object.values(revenueByTicketType),
        refunds: {
          total: totalRefunds,
          totalRefunds,
          rate: refundRate,
          count: refunds.length,
        },
        trends: revenueTrends,
        forecast,
      };
    } catch (error) {
      logger.error('Error getting revenue analytics:', error);
      throw error;
    }
  }

  /**
   * Get attendee insights
   */
  static async getAttendeeInsights(organizerId: string, eventId?: string) {
    try {
      const where: any = {
        event: {
          organizerId,
          deletedAt: null,
        },
        status: 'CONFIRMED',
      };

      if (eventId) {
        where.eventId = eventId;
      }

      const registrations = await prisma.eventRegistration.findMany({
        where,
        include: {
          attendee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              createdAt: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
            },
          },
        },
      });

      // Demographics (would need more user data)
      const demographics = {
        totalAttendees: registrations.length,
        newAttendees: 0,
        returningAttendees: 0,
      };

      // Repeat attendee identification
      const attendeeEventCount = registrations.reduce((acc: any, reg) => {
        acc[reg.attendeeId] = (acc[reg.attendeeId] || 0) + 1;
        return acc;
      }, {});

      const repeatAttendees = Object.entries(attendeeEventCount)
        .filter(([_reg, count]) => (count as number) > 1)
        .map(([userId]) => userId as string);

      demographics.returningAttendees = repeatAttendees.length;
      demographics.newAttendees = registrations.length - repeatAttendees.length;

      // Engagement scoring (based on check-ins, reviews, etc.)
      const engagementScores = await Promise.all(
        registrations.map(async (reg) => {
          const [reviews, transfers] = await Promise.all([
            prisma.eventReview.count({
              where: {
                userId: reg.attendeeId,
                eventId: reg.eventId,
              },
            }),
            prisma.ticketTransfer.count({
              where: {
                fromUserId: reg.attendeeId,
                registrationId: reg.id,
              },
            }),
          ]);

          let score = 0;
          if (reg.checkedInAt) score += 10;
          if (reg.checkedOutAt) score += 5;
          if (reviews > 0) score += 15;
          if (transfers === 0) score += 5; // Didn't transfer ticket

          return {
            userId: reg.attendeeId,
            score,
            checkedIn: !!reg.checkedInAt,
            reviewed: reviews > 0,
            transferred: transfers > 0,
          };
        }),
      );

      // Attendee feedback aggregation
      const reviews = await prisma.eventReview.findMany({
        where: {
          event: {
            organizerId,
          },
          status: 'APPROVED',
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      const feedbackSummary = {
        totalReviews: reviews.length,
        averageRating: reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0,
        ratingDistribution: {
          5: reviews.filter(r => r.rating === 5).length,
          4: reviews.filter(r => r.rating === 4).length,
          3: reviews.filter(r => r.rating === 3).length,
          2: reviews.filter(r => r.rating === 2).length,
          1: reviews.filter(r => r.rating === 1).length,
        },
      };

      return {
        demographics,
        repeatAttendees: {
          count: repeatAttendees.length,
          percentage: registrations.length > 0
            ? (repeatAttendees.length / registrations.length) * 100
            : 0,
        },
        engagementScores: engagementScores.sort((a, b) => b.score - a.score).slice(0, 50),
        feedbackSummary,
      };
    } catch (error) {
      logger.error('Error getting attendee insights:', error);
      throw error;
    }
  }

  /**
   * Get marketing analytics
   */
  static async getMarketingAnalytics(organizerId: string, eventId?: string) {
    try {
      const where: any = {
        event: {
          organizerId,
          deletedAt: null,
        },
      };

      if (eventId) {
        where.eventId = eventId;
      }

      // Promo code performance
      const promoRedemptions = await prisma.promoCodeRedemption.findMany({
        where: {
          registration: where,
        },
        include: {
          promoCode: {
            select: {
              id: true,
              code: true,
              discountType: true,
              discountValue: true,
            },
          },
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
      });

      const promoPerformance = promoRedemptions.reduce((acc: any, redemption) => {
        const code = redemption.promoCode.code;
        if (!acc[code]) {
          acc[code] = {
            code,
            redemptions: 0,
            totalDiscount: 0,
            revenue: 0,
          };
        }
        acc[code].redemptions++;
        acc[code].totalDiscount += Number(redemption.discountAmount);
        acc[code].revenue += Number(redemption.registration.totalAmount);
        return acc;
      }, {});

      // Event shares
      const eventShares = await prisma.eventShare.findMany({
        where: {
          event: {
            organizerId,
          },
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      const shareAnalytics = eventShares.reduce((acc: any, share) => {
        if (!acc[share.platform]) {
          acc[share.platform] = {
            platform: share.platform,
            shares: 0,
            clicks: 0,
            conversions: 0,
          };
        }
        acc[share.platform].shares++;
        acc[share.platform].clicks += share.clickCount;
        acc[share.platform].conversions += share.conversionCount;
        return acc;
      }, {});

      // Email campaign performance (would need email tracking)
      const emailCampaigns = {
        sent: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
      };

      return {
        promoCodePerformance: Object.values(promoPerformance),
        shareAnalytics: Object.values(shareAnalytics),
        emailCampaigns,
        channelROI: {
          email: 0,
          social: 0,
          promo: 0,
          direct: 0,
        },
      };
    } catch (error) {
      logger.error('Error getting marketing analytics:', error);
      throw error;
    }
  }

  /**
   * Helper: Calculate trends
   */
  private static calculateTrends(data: any[], dateField: string, valueField?: string) {
    const grouped = data.reduce((acc: any, item) => {
      const date = new Date(item[dateField]);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      if (!acc[key]) {
        acc[key] = {
          date: key,
          count: 0,
          value: 0,
        };
      }
      
      acc[key].count++;
      if (valueField) {
        acc[key].value += Number(item[valueField] || 0);
      }
      
      return acc;
    }, {});

    return Object.values(grouped).sort((a: any, b: any) => 
      a.date.localeCompare(b.date),
    );
  }

  /**
   * Helper: Calculate forecast
   */
  private static calculateForecast(transactions: any[]) {
    if (transactions.length < 2) {
      return {
        next30Days: 0,
        next90Days: 0,
        confidence: 'low',
      };
    }

    // Simple linear regression for forecasting
    const sorted = transactions.sort((a, b) => 
      new Date(a.paymentDate || a.createdAt).getTime() - new Date(b.paymentDate || b.createdAt).getTime(),
    );

    const dailyRevenue = this.calculateTrends(sorted, 'paymentDate', 'amount');
    const avgDailyRevenue = dailyRevenue.length > 0
      ? dailyRevenue.reduce((sum: number, d: any) => sum + d.value, 0) / dailyRevenue.length
      : 0;

    return {
      next30Days: avgDailyRevenue * 30,
      next90Days: avgDailyRevenue * 90,
      confidence: transactions.length > 10 ? 'medium' : 'low',
    };
  }
}
