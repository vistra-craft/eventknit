import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { logger } from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { createAuditLog, AuditActions } from '../utils/audit.js';
import crypto from 'crypto';

export interface CreditBalance {
  userId: string;
  balance: number;
  currency: string;
}

export interface CreditTransactionData {
  userId: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT' | 'EXPIRED' | 'ADJUSTMENT';
  description: string;
  reference?: string;
  referenceType?: 'REFUND' | 'PURCHASE' | 'ADMIN_GRANT' | 'PROMO' | 'EXPIRY' | 'VOUCHER';
  voucherCode?: string;
  expiresAt?: Date;
  eventId?: string;
  initiatedBy?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateVoucherData {
  code?: string; // Auto-generate if not provided
  description?: string;
  amount: number;
  currency?: string;
  maxUses?: number;
  usesPerUser?: number;
  validFrom?: Date;
  validUntil?: Date;
  eventId?: string;
  organizerId?: string;
  minPurchaseAmount?: number;
  createdBy: string;
}

export interface VoucherRedemptionResult {
  success: boolean;
  message: string;
  creditedAmount?: number;
  newBalance?: number;
}

export class CreditService {
  /**
   * Get or create user credit balance
   */
  static async getOrCreateCreditBalance(userId: string): Promise<CreditBalance> {
    let credit = await prisma.userCredit.findUnique({
      where: { userId },
    });

    if (!credit) {
      credit = await prisma.userCredit.create({
        data: {
          userId,
          balance: 0,
          currency: 'NGN',
        },
      });
    }

    return {
      userId: credit.userId,
      balance: Number(credit.balance),
      currency: credit.currency,
    };
  }

  /**
   * Get user credit balance
   */
  static async getCreditBalance(userId: string): Promise<CreditBalance | null> {
    const credit = await prisma.userCredit.findUnique({
      where: { userId },
    });

    if (!credit) {
      return null;
    }

    return {
      userId: credit.userId,
      balance: Number(credit.balance),
      currency: credit.currency,
    };
  }

  /**
   * Add credit to user balance
   */
  static async addCredit(data: CreditTransactionData): Promise<CreditBalance> {
    if (data.amount <= 0) {
      throw new ValidationError('Credit amount must be positive');
    }

    // Get or create credit balance
    const creditBalance = await this.getOrCreateCreditBalance(data.userId);

    // Calculate new balance
    const newBalance = creditBalance.balance + data.amount;

    // Update balance and create transaction in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedCredit = await tx.userCredit.update({
        where: { userId: data.userId },
        data: {
          balance: new Decimal(newBalance),
        },
      });

      await tx.creditTransaction.create({
        data: {
          creditId: updatedCredit.id,
          type: data.type || 'CREDIT',
          amount: new Decimal(data.amount),
          balanceAfter: new Decimal(newBalance),
          description: data.description,
          reference: data.reference,
          referenceType: data.referenceType,
          voucherCode: data.voucherCode,
          expiresAt: data.expiresAt,
          eventId: data.eventId,
          initiatedBy: data.initiatedBy,
          metadata: data.metadata as Prisma.InputJsonValue,
        },
      });

      return updatedCredit;
    });

    logger.info(`Credit added for user ${data.userId}: ${data.amount} (${data.description})`);

    return {
      userId: result.userId,
      balance: Number(result.balance),
      currency: result.currency,
    };
  }

  /**
   * Deduct credit from user balance
   */
  static async deductCredit(data: CreditTransactionData): Promise<CreditBalance> {
    if (data.amount <= 0) {
      throw new ValidationError('Deduction amount must be positive');
    }

    const creditBalance = await this.getCreditBalance(data.userId);

    if (!creditBalance) {
      throw new ValidationError('User has no credit balance');
    }

    if (creditBalance.balance < data.amount) {
      throw new ValidationError(`Insufficient credit balance. Available: ${creditBalance.balance}`);
    }

    const newBalance = creditBalance.balance - data.amount;

    const result = await prisma.$transaction(async (tx) => {
      const credit = await tx.userCredit.findUnique({
        where: { userId: data.userId },
      });

      if (!credit) {
        throw new ValidationError('Credit record not found');
      }

      const updatedCredit = await tx.userCredit.update({
        where: { userId: data.userId },
        data: {
          balance: new Decimal(newBalance),
        },
      });

      await tx.creditTransaction.create({
        data: {
          creditId: credit.id,
          type: 'DEBIT',
          amount: new Decimal(-data.amount), // Negative for deductions
          balanceAfter: new Decimal(newBalance),
          description: data.description,
          reference: data.reference,
          referenceType: data.referenceType || 'PURCHASE',
          eventId: data.eventId,
          initiatedBy: data.initiatedBy,
          metadata: data.metadata as Prisma.InputJsonValue,
        },
      });

      return updatedCredit;
    });

    logger.info(`Credit deducted for user ${data.userId}: ${data.amount} (${data.description})`);

    return {
      userId: result.userId,
      balance: Number(result.balance),
      currency: result.currency,
    };
  }

  /**
   * Convert a refund to credit instead of processing payment refund
   */
  static async convertRefundToCredit(
    refundId: string,
    userId: string,
    amount: number,
    eventId: string,
    eventTitle: string,
    initiatedBy: string,
  ): Promise<CreditBalance> {
    return this.addCredit({
      userId,
      amount,
      type: 'CREDIT',
      description: `Credit from refund for "${eventTitle}"`,
      reference: refundId,
      referenceType: 'REFUND',
      eventId,
      initiatedBy,
    });
  }

  /**
   * Get credit transaction history for a user
   */
  static async getCreditHistory(
    userId: string,
    options?: { limit?: number; offset?: number },
  ) {
    const credit = await prisma.userCredit.findUnique({
      where: { userId },
    });

    if (!credit) {
      return { transactions: [], total: 0, balance: 0 };
    }

    const [transactions, total] = await Promise.all([
      prisma.creditTransaction.findMany({
        where: { creditId: credit.id },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
        include: {
          event: {
            select: { id: true, title: true },
          },
          initiator: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      prisma.creditTransaction.count({
        where: { creditId: credit.id },
      }),
    ]);

    return {
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        balanceAfter: Number(t.balanceAfter),
        description: t.description,
        reference: t.reference,
        referenceType: t.referenceType,
        voucherCode: t.voucherCode,
        expiresAt: t.expiresAt,
        event: t.event,
        initiator: t.initiator,
        createdAt: t.createdAt,
      })),
      total,
      balance: Number(credit.balance),
    };
  }

  // ==================== VOUCHER METHODS ====================

  /**
   * Generate a unique voucher code
   */
  private static generateVoucherCode(prefix = 'EK'): string {
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${random}`;
  }

  /**
   * Create a new voucher
   */
  static async createVoucher(data: CreateVoucherData) {
    // Generate code if not provided
    let code = data.code;
    if (!code) {
      let attempts = 0;
      do {
        code = this.generateVoucherCode();
        const existing = await prisma.voucher.findUnique({ where: { code } });
        if (!existing) break;
        attempts++;
      } while (attempts < 10);

      if (attempts >= 10) {
        throw new ValidationError('Failed to generate unique voucher code');
      }
    } else {
      // Check if provided code is unique
      const existing = await prisma.voucher.findUnique({ where: { code } });
      if (existing) {
        throw new ValidationError('Voucher code already exists');
      }
    }

    const voucher = await prisma.voucher.create({
      data: {
        code,
        description: data.description,
        amount: new Decimal(data.amount),
        currency: data.currency || 'NGN',
        maxUses: data.maxUses,
        usesPerUser: data.usesPerUser || 1,
        validFrom: data.validFrom || new Date(),
        validUntil: data.validUntil,
        eventId: data.eventId,
        organizerId: data.organizerId,
        minPurchaseAmount: data.minPurchaseAmount ? new Decimal(data.minPurchaseAmount) : null,
        createdBy: data.createdBy,
        isActive: true,
      },
    });

    // Audit log
    await createAuditLog({
      userId: data.createdBy,
      action: AuditActions.VOUCHER_CREATED,
      entity: 'Voucher',
      entityId: voucher.id,
      metadata: {
        code: voucher.code,
        amount: data.amount,
        maxUses: data.maxUses,
        eventId: data.eventId,
      },
    });

    logger.info(`Voucher created: ${voucher.code} (${data.amount})`);

    return voucher;
  }

  /**
   * Redeem a voucher code
   */
  static async redeemVoucher(
    code: string,
    userId: string,
    eventId?: string,
    orderId?: string,
  ): Promise<VoucherRedemptionResult> {
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!voucher) {
      return { success: false, message: 'Invalid voucher code' };
    }

    if (!voucher.isActive) {
      return { success: false, message: 'This voucher is no longer active' };
    }

    const now = new Date();

    if (voucher.validFrom > now) {
      return { success: false, message: 'This voucher is not yet valid' };
    }

    if (voucher.validUntil && voucher.validUntil < now) {
      return { success: false, message: 'This voucher has expired' };
    }

    if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
      return { success: false, message: 'This voucher has reached its usage limit' };
    }

    // Check event restriction
    if (voucher.eventId && eventId && voucher.eventId !== eventId) {
      return { success: false, message: 'This voucher is not valid for this event' };
    }

    // Check if user has already redeemed this voucher
    const existingRedemptions = await prisma.voucherRedemption.count({
      where: {
        voucherId: voucher.id,
        userId,
      },
    });

    if (existingRedemptions >= voucher.usesPerUser) {
      return { success: false, message: 'You have already used this voucher' };
    }

    // Redeem the voucher
    const creditAmount = Number(voucher.amount);

    const result = await prisma.$transaction(async (tx) => {
      // Update voucher usage count
      await tx.voucher.update({
        where: { id: voucher.id },
        data: { usedCount: { increment: 1 } },
      });

      // Create redemption record
      await tx.voucherRedemption.create({
        data: {
          voucherId: voucher.id,
          userId,
          amount: voucher.amount,
          orderId,
          eventId: eventId || voucher.eventId,
        },
      });

      // Add credit to user balance
      const creditBalance = await this.addCredit({
        userId,
        amount: creditAmount,
        type: 'CREDIT',
        description: `Voucher redemption: ${voucher.code}`,
        referenceType: 'VOUCHER',
        voucherCode: voucher.code,
        eventId: eventId || voucher.eventId || undefined,
      });

      return creditBalance;
    });

    // Audit log
    await createAuditLog({
      userId,
      action: AuditActions.VOUCHER_REDEEMED,
      entity: 'Voucher',
      entityId: voucher.id,
      metadata: {
        code: voucher.code,
        amount: creditAmount,
        eventId,
      },
    });

    logger.info(`Voucher ${voucher.code} redeemed by user ${userId}`);

    return {
      success: true,
      message: `Successfully redeemed! ${creditAmount} credit added to your balance.`,
      creditedAmount: creditAmount,
      newBalance: result.balance,
    };
  }

  /**
   * Get voucher by code (for validation before redemption)
   */
  static async getVoucherByCode(code: string, eventId?: string) {
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        event: {
          select: { id: true, title: true },
        },
      },
    });

    if (!voucher) {
      return null;
    }

    const now = new Date();
    const isValid =
      voucher.isActive &&
      voucher.validFrom <= now &&
      (!voucher.validUntil || voucher.validUntil > now) &&
      (!voucher.maxUses || voucher.usedCount < voucher.maxUses) &&
      (!voucher.eventId || !eventId || voucher.eventId === eventId);

    return {
      code: voucher.code,
      description: voucher.description,
      amount: Number(voucher.amount),
      currency: voucher.currency,
      isValid,
      remainingUses: voucher.maxUses ? voucher.maxUses - voucher.usedCount : null,
      validUntil: voucher.validUntil,
      event: voucher.event,
      minPurchaseAmount: voucher.minPurchaseAmount ? Number(voucher.minPurchaseAmount) : null,
    };
  }

  /**
   * Get vouchers created by an organizer
   */
  static async getOrganizerVouchers(
    organizerId: string,
    options?: { eventId?: string; isActive?: boolean; limit?: number; offset?: number },
  ) {
    const where: Prisma.VoucherWhereInput = { organizerId };

    if (options?.eventId) {
      where.eventId = options.eventId;
    }

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
        include: {
          event: {
            select: { id: true, title: true },
          },
          _count: {
            select: { redemptions: true },
          },
        },
      }),
      prisma.voucher.count({ where }),
    ]);

    return {
      vouchers: vouchers.map((v) => ({
        id: v.id,
        code: v.code,
        description: v.description,
        amount: Number(v.amount),
        currency: v.currency,
        maxUses: v.maxUses,
        usedCount: v.usedCount,
        usesPerUser: v.usesPerUser,
        validFrom: v.validFrom,
        validUntil: v.validUntil,
        isActive: v.isActive,
        event: v.event,
        redemptionsCount: v._count.redemptions,
        minPurchaseAmount: v.minPurchaseAmount ? Number(v.minPurchaseAmount) : null,
        createdAt: v.createdAt,
      })),
      total,
    };
  }

  /**
   * Deactivate a voucher
   */
  static async deactivateVoucher(voucherId: string, userId: string) {
    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
    });

    if (!voucher) {
      throw new NotFoundError('Voucher not found');
    }

    // Check if user is the creator or organizer
    if (voucher.createdBy !== userId && voucher.organizerId !== userId) {
      throw new ValidationError('You do not have permission to deactivate this voucher');
    }

    await prisma.voucher.update({
      where: { id: voucherId },
      data: { isActive: false },
    });

    await createAuditLog({
      userId,
      action: AuditActions.VOUCHER_DEACTIVATED,
      entity: 'Voucher',
      entityId: voucherId,
      metadata: { code: voucher.code },
    });

    logger.info(`Voucher ${voucher.code} deactivated by user ${userId}`);

    return { success: true, message: 'Voucher deactivated successfully' };
  }

  /**
   * Apply credit at checkout
   * Returns the amount that can be applied from credit balance
   */
  static async calculateCreditToApply(
    userId: string,
    orderTotal: number,
    currency: string,
  ): Promise<{ availableCredit: number; applicableAmount: number }> {
    const creditBalance = await this.getCreditBalance(userId);

    if (!creditBalance || creditBalance.balance <= 0) {
      return { availableCredit: 0, applicableAmount: 0 };
    }

    // Check currency match
    if (creditBalance.currency !== currency) {
      return { availableCredit: 0, applicableAmount: 0 };
    }

    // Can't apply more credit than the order total
    const applicableAmount = Math.min(creditBalance.balance, orderTotal);

    return {
      availableCredit: creditBalance.balance,
      applicableAmount,
    };
  }
}
