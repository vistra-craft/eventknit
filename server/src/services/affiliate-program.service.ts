import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export class AffiliateProgramService {
  /**
   * Create affiliate program
   */
  static async createProgram(organizerId: string, data: {
    eventId?: string;
    name: string;
    description?: string;
    commissionType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    commissionValue: number;
    minCommission?: number;
    maxCommission?: number;
    cookieDuration?: number;
  }) {
    try {
      if (data.eventId) {
        const event = await prisma.event.findFirst({
          where: {
            id: data.eventId,
            organizerId,
            deletedAt: null,
          },
        });

        if (!event) {
          throw new NotFoundError('Event not found');
        }
      }

      const program = await prisma.affiliateProgram.create({
        data: {
          organizerId,
          eventId: data.eventId,
          name: data.name,
          description: data.description,
          commissionType: data.commissionType,
          commissionValue: data.commissionValue,
          minCommission: data.minCommission,
          maxCommission: data.maxCommission,
          cookieDuration: data.cookieDuration || 30,
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

      return program;
    } catch (error) {
      logger.error('Error creating affiliate program:', error);
      throw error;
    }
  }

  /**
   * Get organizer's affiliate programs
   */
  static async getOrganizerPrograms(organizerId: string, filters?: {
    eventId?: string;
    isActive?: boolean;
  }) {
    try {
      const where: any = {
        organizerId,
      };

      if (filters?.eventId) {
        where.eventId = filters.eventId;
      }

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      const programs = await prisma.affiliateProgram.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          affiliates: {
            select: {
              id: true,
              userId: true,
              affiliateCode: true,
              status: true,
              clicks: true,
              conversions: true,
              totalRevenue: true,
              totalCommission: true,
            },
          },
          _count: {
            select: {
              affiliates: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return programs;
    } catch (error) {
      logger.error('Error getting affiliate programs:', error);
      throw error;
    }
  }

  /**
   * Apply to become an affiliate
   */
  static async applyAsAffiliate(programId: string, userId: string) {
    try {
      const program = await prisma.affiliateProgram.findFirst({
        where: {
          id: programId,
          isActive: true,
        },
      });

      if (!program) {
        throw new NotFoundError('Affiliate program not found or inactive');
      }

      // Check if already an affiliate
      const existing = await prisma.affiliate.findUnique({
        where: {
          programId_userId: {
            programId,
            userId,
          },
        },
      });

      if (existing) {
        throw new ValidationError('You are already an affiliate for this program');
      }

      // Generate unique affiliate code
      const affiliateCode = this.generateAffiliateCode();

      const affiliate = await prisma.affiliate.create({
        data: {
          programId,
          userId,
          affiliateCode,
          status: 'pending',
        },
      });

      return affiliate;
    } catch (error) {
      logger.error('Error applying as affiliate:', error);
      throw error;
    }
  }

  /**
   * Approve affiliate
   */
  static async approveAffiliate(affiliateId: string, organizerId: string, approvedBy: string) {
    try {
      const affiliate = await prisma.affiliate.findFirst({
        where: {
          id: affiliateId,
          program: {
            organizerId,
          },
        },
      });

      if (!affiliate) {
        throw new NotFoundError('Affiliate not found');
      }

      const updated = await prisma.affiliate.update({
        where: { id: affiliateId },
        data: {
          status: 'active',
          approvedAt: new Date(),
          approvedBy,
        },
      });

      return updated;
    } catch (error) {
      logger.error('Error approving affiliate:', error);
      throw error;
    }
  }

  /**
   * Get affiliate dashboard data
   */
  static async getAffiliateDashboard(affiliateId: string, userId: string) {
    try {
      const affiliate = await prisma.affiliate.findFirst({
        where: {
          id: affiliateId,
          userId,
        },
        include: {
          program: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  image: true,
                },
              },
            },
          },
          conversionsList: {
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
            orderBy: { convertedAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!affiliate) {
        throw new NotFoundError('Affiliate not found');
      }

      // Generate affiliate link
      const affiliateLink = `${config.frontend.url}/events?ref=${affiliate.affiliateCode}`;

      return {
        affiliate,
        affiliateLink,
        summary: {
          totalClicks: affiliate.clicks,
          totalConversions: affiliate.conversions,
          totalRevenue: Number(affiliate.totalRevenue),
          totalCommission: Number(affiliate.totalCommission),
          paidCommission: Number(affiliate.paidCommission),
          pendingCommission: Number(affiliate.totalCommission) - Number(affiliate.paidCommission),
          conversionRate: affiliate.clicks > 0 ? (affiliate.conversions / affiliate.clicks) * 100 : 0,
        },
      };
    } catch (error) {
      logger.error('Error getting affiliate dashboard:', error);
      throw error;
    }
  }

  /**
   * Track affiliate click
   */
  static async trackAffiliateClick(affiliateCode: string, _eventId?: string) {
    try {
      const affiliate = await prisma.affiliate.findUnique({
        where: { affiliateCode },
      });

      if (!affiliate || affiliate.status !== 'active') {
        return { success: false };
      }

      await prisma.affiliate.update({
        where: { id: affiliate.id },
        data: {
          clicks: {
            increment: 1,
          },
        },
      });

      return { success: true, affiliateId: affiliate.id };
    } catch (error) {
      logger.error('Error tracking affiliate click:', error);
      return { success: false };
    }
  }

  /**
   * Record affiliate conversion
   */
  static async recordConversion(
    registrationId: string,
    affiliateCode: string,
    revenueAmount: number,
  ) {
    try {
      const affiliate = await prisma.affiliate.findUnique({
        where: { affiliateCode },
        include: {
          program: true,
        },
      });

      if (!affiliate || affiliate.status !== 'active') {
        return { success: false };
      }

      // Check if conversion already exists
      const existing = await prisma.affiliateConversion.findUnique({
        where: {
          affiliateId_registrationId: {
            affiliateId: affiliate.id,
            registrationId,
          },
        },
      });

      if (existing) {
        return { success: false, message: 'Conversion already recorded' };
      }

      // Calculate commission
      let commissionAmount = 0;
      if (affiliate.program.commissionType === 'PERCENTAGE') {
        commissionAmount = (revenueAmount * Number(affiliate.program.commissionValue)) / 100;
      } else {
        commissionAmount = Number(affiliate.program.commissionValue);
      }

      // Apply min/max commission limits
      if (affiliate.program.minCommission && commissionAmount < Number(affiliate.program.minCommission)) {
        commissionAmount = Number(affiliate.program.minCommission);
      }
      if (affiliate.program.maxCommission && commissionAmount > Number(affiliate.program.maxCommission)) {
        commissionAmount = Number(affiliate.program.maxCommission);
      }

      // Create conversion
      await prisma.affiliateConversion.create({
        data: {
          affiliateId: affiliate.id,
          registrationId,
          revenueAmount,
          commissionAmount,
          commissionStatus: 'pending',
        },
      });

      // Update affiliate stats
      await prisma.affiliate.update({
        where: { id: affiliate.id },
        data: {
          conversions: {
            increment: 1,
          },
          totalRevenue: {
            increment: revenueAmount,
          },
          totalCommission: {
            increment: commissionAmount,
          },
        },
      });

      return { success: true, commissionAmount };
    } catch (error) {
      logger.error('Error recording affiliate conversion:', error);
      return { success: false };
    }
  }

  /**
   * Get affiliate conversions
   */
  static async getAffiliateConversions(affiliateId: string, userId: string, filters?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    try {
      const affiliate = await prisma.affiliate.findFirst({
        where: {
          id: affiliateId,
          userId,
        },
      });

      if (!affiliate) {
        throw new NotFoundError('Affiliate not found');
      }

      const limit = filters?.limit || 20;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const where: any = {
        affiliateId,
      };

      if (filters?.status) {
        where.commissionStatus = filters.status;
      }

      const [conversions, total] = await Promise.all([
        prisma.affiliateConversion.findMany({
          where,
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
          orderBy: { convertedAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.affiliateConversion.count({ where }),
      ]);

      return {
        conversions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting affiliate conversions:', error);
      throw error;
    }
  }

  /**
   * Generate unique affiliate code
   */
  private static generateAffiliateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
