import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors.js';
import { generateRefundNumber } from '../utils/transaction-helpers.js';
import { PlatformFeeService } from './platform-fee.service.js';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import { createAuditLog, AuditActions } from '../utils/audit.js';
import Paystack from 'paystack';
import { config } from '../config/index.js';

export interface CreateRefundData {
  transactionId: string;
  refundAmount?: number; // If not provided, refunds full amount
  refundReason: string;
  refundType: 'full' | 'partial';
  notes?: string;
}

export interface ProcessRefundData {
  refundReference?: string; // External refund reference (e.g., Paystack refund reference)
  metadata?: Record<string, unknown>;
}

export class RefundService {
  private static paystack: Paystack | null = null;

  private static getPaystack(): Paystack {
    if (!this.paystack) {
      if (!config.paystack.secretKey) {
        throw new ValidationError('Paystack secret key not configured');
      }
      this.paystack = new Paystack(config.paystack.secretKey);
    }
    return this.paystack;
  }

  /**
   * Create a refund request
   */
  static async createRefund(
    data: CreateRefundData,
    requestedBy: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get payment transaction
    const transaction = await prisma.eventPaymentTransaction.findUnique({
      where: { id: data.transactionId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            organizerId: true,
          },
        },
        registration: {
          select: {
            id: true,
            status: true,
          },
        },
        refund: true, // Check if refund already exists
      },
    });

    if (!transaction) {
      throw new NotFoundError('Payment transaction not found');
    }

    // Check if refund already exists
    if (transaction.refund) {
      throw new ValidationError('Refund already exists for this transaction');
    }

    // Determine refund amount
    const transactionAmount = Number(transaction.amount);
    const refundAmount =
      data.refundAmount && data.refundType === 'partial'
        ? data.refundAmount
        : transactionAmount;

    if (refundAmount > transactionAmount) {
      throw new ValidationError('Refund amount cannot exceed transaction amount');
    }

    if (refundAmount <= 0) {
      throw new ValidationError('Refund amount must be greater than zero');
    }

    // Calculate platform fee refund (if full refund, refund the platform fee too)
    let platformFeeRefund: number | null = null;
    if (data.refundType === 'full') {
      const platformFee = await prisma.platformFee.findUnique({
        where: { transactionId: data.transactionId },
      });
      if (platformFee) {
        platformFeeRefund = Number(platformFee.feeAmount);
      }
    }

    // Generate refund number
    let refundNumber = generateRefundNumber();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.refund.findUnique({
        where: { refundNumber },
      });
      if (!existing) break;
      refundNumber = generateRefundNumber();
      attempts++;
    }

    // Create refund record
    const refund = await prisma.refund.create({
      data: {
        refundNumber,
        transactionId: data.transactionId,
        refundAmount: new Decimal(refundAmount),
        currency: transaction.currency,
        refundReason: data.refundReason,
        refundType: data.refundType,
        paymentMethod: 'paystack_refund',
        status: 'pending',
        eventId: transaction.eventId,
        registrationId: transaction.registrationId,
        platformFeeRefund: platformFeeRefund ? new Decimal(platformFeeRefund) : null,
        notes: data.notes,
        requestedBy,
      },
    });

    // Audit log
    await createAuditLog({
      userId: requestedBy,
      action: AuditActions.REFUND_REQUESTED,
      entity: 'Refund',
      entityId: refund.id,
      metadata: {
        transactionId: data.transactionId,
        eventId: transaction.eventId,
        eventTitle: transaction.event.title,
        refundAmount: refundAmount.toString(),
        refundType: data.refundType,
        refundReason: data.refundReason,
      },
      ipAddress,
      userAgent,
    });

    logger.info(
      `Refund requested: ${refund.id} for transaction: ${data.transactionId}, amount: ${refundAmount}`,
    );

    return refund;
  }

  /**
   * Process a refund (initiate refund with Paystack)
   */
  static async processRefund(
    refundId: string,
    data: ProcessRefundData,
    processedBy: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        transaction: {
          select: {
            id: true,
            paystackReference: true,
            amount: true,
            currency: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!refund) {
      throw new NotFoundError('Refund not found');
    }

    if (refund.status !== 'pending') {
      throw new ValidationError(`Cannot process refund with status: ${refund.status}`);
    }

    try {
      // Initiate refund with Paystack
      const paystack = this.getPaystack();
      const refundAmountInKobo = Math.round(Number(refund.refundAmount) * 100);

      const paystackResponse = await paystack.refund.create({
        transaction: refund.transaction.paystackReference,
        amount: refundAmountInKobo, // Amount in kobo
        currency: refund.currency,
        customer_note: refund.refundReason,
      });

      const paystackRefundData = paystackResponse.data as {
        id: number;
        transaction: { id: number };
        amount: number;
        status: string;
        reference?: string;
      };

      // Update refund status
      const updated = await prisma.refund.update({
        where: { id: refundId },
        data: {
          status: 'processing',
          processedAt: new Date(),
          refundReference: paystackRefundData.reference || paystackRefundData.id.toString(),
          metadata: {
            paystackRefundId: paystackRefundData.id,
            paystackTransactionId: paystackRefundData.transaction.id,
            ...(data.metadata || {}),
          } as Prisma.InputJsonValue,
          processedBy,
        },
      });

      // Audit log
      await createAuditLog({
        userId: processedBy,
        action: AuditActions.REFUND_PROCESSED,
        entity: 'Refund',
        entityId: refundId,
        metadata: {
          transactionId: refund.transactionId,
          eventId: refund.eventId,
          refundAmount: Number(refund.refundAmount).toString(),
          paystackRefundId: paystackRefundData.id.toString(),
        },
        ipAddress,
        userAgent,
      });

      logger.info(`Refund processing started: ${refundId} via Paystack refund: ${paystackRefundData.id}`);

      return updated;
    } catch (error) {
      logger.error(`Failed to process refund ${refundId} with Paystack:`, error);
      throw new ValidationError('Failed to process refund with Paystack');
    }
  }

  /**
   * Complete a refund (mark as completed after Paystack confirms)
   */
  static async completeRefund(
    refundId: string,
    refundReference: string,
    completedBy: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        transaction: {
          include: {
            registration: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!refund) {
      throw new NotFoundError('Refund not found');
    }

    if (refund.status !== 'processing') {
      throw new ValidationError(`Cannot complete refund with status: ${refund.status}`);
    }

    // Update refund status and adjust platform fee if needed
    await prisma.$transaction(async (tx) => {
      await tx.refund.update({
        where: { id: refundId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          refundReference,
          processedBy: completedBy,
        },
      });

      // If full refund, adjust platform fee
      if (refund.refundType === 'full' && refund.platformFeeRefund) {
        const platformFee = await tx.platformFee.findUnique({
          where: { transactionId: refund.transactionId },
        });

        if (platformFee && platformFee.disbursementId === null) {
          // Platform fee not yet disbursed - can be adjusted
          // Mark as refunded or remove (depending on business logic)
          await tx.platformFee.update({
            where: { id: platformFee.id },
            data: {
              status: 'refunded',
            },
          });
        }
      }
    });

    // Audit log
    await createAuditLog({
      userId: completedBy,
      action: AuditActions.REFUND_COMPLETED,
      entity: 'Refund',
      entityId: refundId,
      metadata: {
        transactionId: refund.transactionId,
        eventId: refund.eventId,
        refundAmount: Number(refund.refundAmount).toString(),
        refundReference,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Refund completed: ${refundId} by user: ${completedBy}`);

    return prisma.refund.findUnique({
      where: { id: refundId },
    });
  }

  /**
   * Get refund by ID
   */
  static async getRefund(refundId: string, userId?: string) {
    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        transaction: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                organizerId: true,
              },
            },
          },
        },
        requester: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        processor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!refund) {
      throw new NotFoundError('Refund not found');
    }

    // Check authorization
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      // Only admin or event organizer can view
      if (
        user?.role !== 'SUPERADMIN' &&
        user?.role !== 'ADMIN_STAFF' &&
        refund.transaction.event.organizerId !== userId
      ) {
        throw new AuthorizationError('Access denied');
      }
    }

    return refund;
  }

  /**
   * Get refunds for an event
   */
  static async getEventRefunds(eventId: string, filters?: { status?: string }) {
    const where: {
      eventId: string;
      status?: string;
    } = {
      eventId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    return prisma.refund.findMany({
      where,
      include: {
        transaction: {
          select: {
            id: true,
            transactionNumber: true,
            amount: true,
            paymentDate: true,
            attendeeName: true,
          },
        },
        requester: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });
  }

  /**
   * Get refund summary for an event
   */
  static async getEventRefundSummary(eventId: string) {
    const refunds = await prisma.refund.findMany({
      where: { eventId },
      select: {
        refundAmount: true,
        platformFeeRefund: true,
        status: true,
        refundType: true,
      },
    });

    const totalRefunded = refunds
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + Number(r.refundAmount), 0);

    const totalPlatformFeeRefunded = refunds
      .filter((r) => r.status === 'completed' && r.platformFeeRefund)
      .reduce((sum, r) => sum + Number(r.platformFeeRefund || 0), 0);

    return {
      totalRefunded: Number(totalRefunded.toFixed(2)),
      totalPlatformFeeRefunded: Number(totalPlatformFeeRefunded.toFixed(2)),
      totalCount: refunds.length,
      completedCount: refunds.filter((r) => r.status === 'completed').length,
      pendingCount: refunds.filter((r) => r.status === 'pending').length,
      processingCount: refunds.filter((r) => r.status === 'processing').length,
      fullRefunds: refunds.filter((r) => r.refundType === 'full').length,
      partialRefunds: refunds.filter((r) => r.refundType === 'partial').length,
    };
  }
}

