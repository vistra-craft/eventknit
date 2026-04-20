import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';

export class PayoutManagementService {
  /**
   * Get or create payout preferences
   */
  static async getPayoutPreferences(organizerId: string) {
    try {
      let preferences = await prisma.payoutPreference.findUnique({
        where: { organizerId },
      });

      if (!preferences) {
        // Create default preferences
        preferences = await prisma.payoutPreference.create({
          data: {
            organizerId,
            primaryMethod: 'bank_transfer',
          },
        });
      }

      return preferences;
    } catch (error) {
      logger.error('Error getting payout preferences:', error);
      throw error;
    }
  }

  /**
   * Update payout preferences
   */
  static async updatePayoutPreferences(organizerId: string, data: {
    primaryMethod?: string;
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    bankCode?: string;
    routingNumber?: string;
    paystackRecipientCode?: string;
    alternativeMethods?: Record<string, unknown>;
    autoPayoutEnabled?: boolean;
    autoPayoutThreshold?: number;
    autoPayoutSchedule?: string;
    taxId?: string;
    taxCountry?: string;
  }) {
    try {
      const preferences = await prisma.payoutPreference.upsert({
        where: { organizerId },
        create: {
          organizerId,
          primaryMethod: data.primaryMethod || 'bank_transfer',
          bankName: data.bankName,
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          bankCode: data.bankCode,
          routingNumber: data.routingNumber,
          paystackRecipientCode: data.paystackRecipientCode,
          alternativeMethods: data.alternativeMethods as unknown as Prisma.InputJsonValue,
          autoPayoutEnabled: data.autoPayoutEnabled,
          autoPayoutThreshold: data.autoPayoutThreshold,
          autoPayoutSchedule: data.autoPayoutSchedule,
          taxId: data.taxId,
          taxCountry: data.taxCountry,
        },
        update: {
          ...(data.primaryMethod && { primaryMethod: data.primaryMethod }),
          ...(data.bankName !== undefined && { bankName: data.bankName }),
          ...(data.accountName !== undefined && { accountName: data.accountName }),
          ...(data.accountNumber !== undefined && { accountNumber: data.accountNumber }),
          ...(data.bankCode !== undefined && { bankCode: data.bankCode }),
          ...(data.routingNumber !== undefined && { routingNumber: data.routingNumber }),
          ...(data.paystackRecipientCode !== undefined && { paystackRecipientCode: data.paystackRecipientCode }),
          ...(data.alternativeMethods !== undefined && { alternativeMethods: data.alternativeMethods as unknown as Prisma.InputJsonValue }),
          ...(data.autoPayoutEnabled !== undefined && { autoPayoutEnabled: data.autoPayoutEnabled }),
          ...(data.autoPayoutThreshold !== undefined && { autoPayoutThreshold: data.autoPayoutThreshold }),
          ...(data.autoPayoutSchedule !== undefined && { autoPayoutSchedule: data.autoPayoutSchedule }),
          ...(data.taxId !== undefined && { taxId: data.taxId }),
          ...(data.taxCountry !== undefined && { taxCountry: data.taxCountry }),
        },
      });

      return preferences;
    } catch (error) {
      logger.error('Error updating payout preferences:', error);
      throw error;
    }
  }

  /**
   * Get payout history
   */
  static async getPayoutHistory(organizerId: string, filters?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const limit = filters?.limit || 20;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const where: {
        organizerId: string;
        status?: string;
        createdAt?: { gte?: Date; lte?: Date };
      } = {
        organizerId,
      };

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate;
        }
      }

      const [disbursements, total] = await Promise.all([
        prisma.organizerDisbursement.findMany({
          where,
          include: {
            event: {
              select: {
                id: true,
                title: true,
              },
            },
            platformFees: {
              select: {
                id: true,
                feeAmount: true,
                organizerAmount: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.organizerDisbursement.count({ where }),
      ]);

      return {
        disbursements,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      };
    } catch (error) {
      logger.error('Error getting payout history:', error);
      throw error;
    }
  }

  /**
   * Schedule payout
   */
  static async schedulePayout(organizerId: string, data: {
    eventId?: string;
    amount?: number;
    scheduledDate: Date;
    notes?: string;
  }) {
    try {
      if (data.scheduledDate <= new Date()) {
        throw new ValidationError('Scheduled date must be in the future');
      }

      // Get pending platform fees for the organizer
      const where: {
        event: { organizerId: string };
        status: string;
        amountOwed?: { gt: number };
        disbursementId?: null;
        eventId?: string;
      } = {
        event: {
          organizerId,
        },
        status: 'calculated',
        disbursementId: null,
      };

      if (data.eventId) {
        where.eventId = data.eventId;
      }

      const platformFees = await prisma.platformFee.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      if (platformFees.length === 0) {
        throw new ValidationError('No pending payouts available');
      }

      const totalAmount = data.amount || platformFees.reduce(
        (sum, fee) => sum + Number(fee.organizerAmount),
        0,
      );

      // Get payout preferences
      const preferences = await this.getPayoutPreferences(organizerId);

      // Create disbursement
      const disbursement = await prisma.organizerDisbursement.create({
        data: {
          disbursementNumber: `DISB-${Date.now()}`,
          organizerId,
          eventId: data.eventId || platformFees[0].eventId,
          totalAmount,
          currency: platformFees[0].currency,
          paymentMethod: preferences.primaryMethod,
          bankName: preferences.bankName,
          accountName: preferences.accountName,
          accountNumber: preferences.accountNumber,
          scheduledDate: data.scheduledDate,
          notes: data.notes,
          status: 'pending',
        },
      });

      // Link platform fees to disbursement
      await prisma.platformFee.updateMany({
        where: {
          id: {
            in: platformFees.map(f => f.id),
          },
        },
        data: {
          disbursementId: disbursement.id,
        },
      });

      return disbursement;
    } catch (error) {
      logger.error('Error scheduling payout:', error);
      throw error;
    }
  }

  /**
   * Get payout summary
   */
  static async getPayoutSummary(organizerId: string) {
    try {
      // Get pending platform fees
      const pendingFees = await prisma.platformFee.findMany({
        where: {
          event: {
            organizerId,
          },
          status: 'calculated',
          disbursementId: null,
        },
      });

      const pendingAmount = pendingFees.reduce(
        (sum, fee) => sum + Number(fee.organizerAmount),
        0,
      );

      // Get completed disbursements
      const completedDisbursements = await prisma.organizerDisbursement.findMany({
        where: {
          organizerId,
          status: 'completed',
        },
      });

      const totalPaid = completedDisbursements.reduce(
        (sum, d) => sum + Number(d.totalAmount),
        0,
      );

      // Get pending disbursements
      const pendingDisbursements = await prisma.organizerDisbursement.findMany({
        where: {
          organizerId,
          status: {
            in: ['pending', 'processing'],
          },
        },
      });

      const pendingPayoutAmount = pendingDisbursements.reduce(
        (sum, d) => sum + Number(d.totalAmount),
        0,
      );

      return {
        pending: {
          amount: pendingAmount,
          count: pendingFees.length,
        },
        scheduled: {
          amount: pendingPayoutAmount,
          count: pendingDisbursements.length,
        },
        totalPaid,
        totalDisbursements: completedDisbursements.length,
      };
    } catch (error) {
      logger.error('Error getting payout summary:', error);
      throw error;
    }
  }
}
