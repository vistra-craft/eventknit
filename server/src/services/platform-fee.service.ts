import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';
import { generateFeeNumber } from '../utils/transaction-helpers.js';
import { Decimal } from '@prisma/client/runtime/library';

export interface PlatformFeeConfig {
  feePercentage: number; // e.g., 7.50 for 7.5%
  minimumFee?: number;
  maximumFee?: number;
  fixedFeePerTicket?: number; // Reserved for future use (0 = disabled)
}

export interface CalculatePlatformFeeResult {
  grossAmount: number;
  feePercentage: number;
  feeAmount: number;
  organizerAmount: number;
}

export class PlatformFeeService {
  /**
   * Default platform fee percentage (7.5%) — used as fallback when
   * SystemSettings has no value for `finance.platformFeePercentage`.
   *
   * See docs/PAYMENT_AND_DISBURSEMENT.md Section 3.2 for the rationale
   * behind this rate (cost-leadership strategy for the Kenyan market).
   */
  private static readonly DEFAULT_FEE_PERCENTAGE = 7.5;

  /** In-memory cache for the global fee config. */
  private static feeConfigCache: { config: PlatformFeeConfig; expiresAt: number } | null = null;
  private static readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Read global fee configuration from SystemSettings.
   * Results are cached for 5 minutes to avoid per-payment DB hits.
   */
  static async getGlobalFeeConfig(): Promise<PlatformFeeConfig> {
    const now = Date.now();
    if (this.feeConfigCache && now < this.feeConfigCache.expiresAt) {
      return this.feeConfigCache.config;
    }

    try {
      const settings = await prisma.systemSettings.findMany({
        where: {
          key: { in: [
            'finance.platformFeePercentage',
            'finance.minimumFee',
            'finance.maximumFee',
            'finance.fixedFeePerTicket',
          ] },
        },
      });

      const map = new Map(settings.map(s => [s.key, s.value]));

      const config: PlatformFeeConfig = {
        feePercentage: map.has('finance.platformFeePercentage')
          ? Number(map.get('finance.platformFeePercentage')) || this.DEFAULT_FEE_PERCENTAGE
          : this.DEFAULT_FEE_PERCENTAGE,
        minimumFee: map.has('finance.minimumFee')
          ? Number(map.get('finance.minimumFee')) || 0
          : 0,
        maximumFee: map.has('finance.maximumFee')
          ? Number(map.get('finance.maximumFee')) || 0
          : 0,
        fixedFeePerTicket: map.has('finance.fixedFeePerTicket')
          ? Number(map.get('finance.fixedFeePerTicket')) || 0
          : 0,
      };

      this.feeConfigCache = { config, expiresAt: now + this.CACHE_TTL_MS };
      return config;
    } catch (error) {
      logger.warn('Failed to read fee config from SystemSettings, using defaults:', error);
      return {
        feePercentage: this.DEFAULT_FEE_PERCENTAGE,
        minimumFee: 0,
        maximumFee: 0,
      };
    }
  }

  /** Invalidate the cached fee config (call after admin updates settings). */
  static invalidateFeeConfigCache(): void {
    this.feeConfigCache = null;
  }

  /**
   * Calculate platform fee for a payment amount
   */
  static calculatePlatformFee(
    grossAmount: number,
    feePercentage: number = this.DEFAULT_FEE_PERCENTAGE,
    config?: PlatformFeeConfig,
  ): CalculatePlatformFeeResult {
    // Apply fee percentage
    let feeAmount = (grossAmount * feePercentage) / 100;

    // Apply minimum fee if configured
    if (config?.minimumFee && feeAmount < config.minimumFee) {
      feeAmount = config.minimumFee;
    }

    // Apply maximum fee if configured
    if (config?.maximumFee && feeAmount > config.maximumFee) {
      feeAmount = config.maximumFee;
    }

    // Ensure fee doesn't exceed gross amount
    feeAmount = Math.min(feeAmount, grossAmount);

    const organizerAmount = grossAmount - feeAmount;

    return {
      grossAmount,
      feePercentage,
      feeAmount: Number(feeAmount.toFixed(2)),
      organizerAmount: Number(organizerAmount.toFixed(2)),
    };
  }

  /**
   * Create platform fee record for a payment transaction
   * This is called automatically when a payment is successful
   */
  static async createPlatformFee(
    transactionId: string,
    feePercentage?: number,
    config?: PlatformFeeConfig,
  ): Promise<{
    id: string;
    feeNumber: string;
    feeAmount: number;
    organizerAmount: number;
  }> {
    // Get payment transaction
    const transaction = await prisma.eventPaymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        event: {
          select: {
            id: true,
            organizerId: true,
          },
        },
        registration: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundError('Payment transaction not found');
    }

    // Check if platform fee already exists
    const existing = await prisma.platformFee.findUnique({
      where: { transactionId },
    });

    if (existing) {
      logger.warn(`Platform fee already exists for transaction: ${transactionId}`);
      return {
        id: existing.id,
        feeNumber: existing.feeNumber,
        feeAmount: Number(existing.feeAmount),
        organizerAmount: Number(existing.organizerAmount),
      };
    }

    // Calculate platform fee — use global config from SystemSettings when not overridden
    const grossAmount = Number(transaction.amount);
    const globalConfig = config || await this.getGlobalFeeConfig();
    const feePercent = feePercentage || globalConfig.feePercentage;
    const calculation = this.calculatePlatformFee(grossAmount, feePercent, globalConfig);

    // Generate fee number
    let feeNumber = generateFeeNumber();
    let attempts = 0;
    while (attempts < 10) {
      const existingNumber = await prisma.platformFee.findUnique({
        where: { feeNumber },
      });
      if (!existingNumber) break;
      feeNumber = generateFeeNumber();
      attempts++;
    }

    // Create platform fee record
    const platformFee = await prisma.platformFee.create({
      data: {
        feeNumber,
        transactionId,
        grossAmount: new Decimal(calculation.grossAmount),
        feePercentage: new Decimal(calculation.feePercentage),
        feeAmount: new Decimal(calculation.feeAmount),
        organizerAmount: new Decimal(calculation.organizerAmount),
        currency: transaction.currency,
        status: 'calculated',
        eventId: transaction.eventId,
        registrationId: transaction.registrationId,
      },
    });

    logger.info(
      `Platform fee created: ${platformFee.id} for transaction: ${transactionId}. Fee: ${calculation.feeAmount}, Organizer: ${calculation.organizerAmount}`,
    );

    return {
      id: platformFee.id,
      feeNumber: platformFee.feeNumber,
      feeAmount: calculation.feeAmount,
      organizerAmount: calculation.organizerAmount,
    };
  }

  /**
   * Get platform fee by transaction ID
   */
  static async getPlatformFeeByTransaction(transactionId: string) {
    const fee = await prisma.platformFee.findUnique({
      where: { transactionId },
      include: {
        transaction: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                organizer: {
                  select: {
                    id: true,
                    organizationName: true,
                  },
                },
              },
            },
          },
        },
        disbursement: {
          select: {
            id: true,
            disbursementNumber: true,
            status: true,
            completedAt: true,
          },
        },
      },
    });

    if (!fee) {
      throw new NotFoundError('Platform fee not found');
    }

    return fee;
  }

  /**
   * Get platform fees for an event
   */
  static async getEventPlatformFees(
    eventId: string,
    options?: {
      status?: string;
      includeDisbursed?: boolean;
    },
  ) {
    const where: {
      eventId: string;
      status?: string;
      disbursementId?: { not: null } | null;
    } = {
      eventId,
    };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.includeDisbursed === false) {
      where.disbursementId = null;
    }

    return prisma.platformFee.findMany({
      where,
      include: {
        transaction: {
          select: {
            id: true,
            transactionNumber: true,
            amount: true,
            paymentDate: true,
            attendeeName: true,
            attendeeEmail: true,
          },
        },
        disbursement: {
          select: {
            id: true,
            disbursementNumber: true,
            status: true,
          },
        },
      },
      orderBy: {
        calculatedAt: 'desc',
      },
    });
  }

  /**
   * Get platform fee summary for an event
   */
  static async getEventPlatformFeeSummary(eventId: string) {
    const fees = await prisma.platformFee.findMany({
      where: { eventId },
      select: {
        feeAmount: true,
        organizerAmount: true,
        status: true,
        disbursementId: true,
      },
    });

    const totalFees = fees.reduce((sum, fee) => sum + Number(fee.feeAmount), 0);
    const totalOrganizerAmount = fees.reduce((sum, fee) => sum + Number(fee.organizerAmount), 0);
    const disbursedFees = fees.filter((f) => f.disbursementId !== null).length;
    const pendingFees = fees.filter((f) => f.disbursementId === null).length;

    return {
      totalFees: Number(totalFees.toFixed(2)),
      totalOrganizerAmount: Number(totalOrganizerAmount.toFixed(2)),
      totalTransactions: fees.length,
      disbursedCount: disbursedFees,
      pendingCount: pendingFees,
    };
  }

  /**
   * Update platform fee status (e.g., when disbursed)
   */
  static async updatePlatformFeeStatus(
    feeId: string,
    status: string,
    disbursementId?: string,
  ) {
    const fee = await prisma.platformFee.findUnique({
      where: { id: feeId },
    });

    if (!fee) {
      throw new NotFoundError('Platform fee not found');
    }

    const updateData: {
      status: string;
      disbursementId?: string;
    } = {
      status,
    };

    if (disbursementId) {
      updateData.disbursementId = disbursementId;
    }

    return prisma.platformFee.update({
      where: { id: feeId },
      data: updateData,
    });
  }

  /**
   * Get platform fees ready for disbursement (not yet disbursed)
   */
  static async getPendingDisbursementFees(eventId: string, organizerId: string) {
    return prisma.platformFee.findMany({
      where: {
        eventId,
        status: 'calculated',
        disbursementId: null,
        transaction: {
          event: {
            organizerId,
          },
        },
      },
      include: {
        transaction: {
          select: {
            id: true,
            transactionNumber: true,
            amount: true,
            paymentDate: true,
          },
        },
      },
      orderBy: {
        calculatedAt: 'asc',
      },
    });
  }
}

