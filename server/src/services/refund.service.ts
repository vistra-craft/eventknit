import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors.js';
import { generateRefundNumber } from '../utils/transaction-helpers.js';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import { createAuditLog, AuditActions } from '../utils/audit.js';
import Paystack from 'paystack';
import { config } from '../config/index.js';
import { NotificationService } from './notification.service.js';
import { NotificationType, NotificationPriority } from '@prisma/client';

export interface CreateRefundData {
  transactionId: string;
  refundAmount?: number; // If not provided, refunds full amount
  refundReason: string;
  refundType: 'full' | 'partial';
  notes?: string;
}

export interface RefundTier {
  daysBeforeEvent: number;
  refundPercentage: number;
}

export interface RefundEligibility {
  eligible: boolean;
  refundPercentage: number;
  refundAmount: number;
  currency: string;
  message: string;
  policyType: string;
  policyText?: string;
  daysUntilEvent: number;
  deadline?: Date;
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
    // Atomically claim the refund for processing using optimistic locking.
    // updateMany with status precondition prevents two admins from processing
    // the same refund simultaneously (only the first one gets count === 1).
    const claimed = await prisma.refund.updateMany({
      where: { id: refundId, status: 'pending' },
      data: { status: 'processing', processedAt: new Date(), processedBy },
    });

    if (claimed.count === 0) {
      // Either refund doesn't exist or is no longer pending
      const refundCheck = await prisma.refund.findUnique({ where: { id: refundId }, select: { status: true } });
      if (!refundCheck) throw new NotFoundError('Refund not found');
      throw new ValidationError(`Cannot process refund with status: ${refundCheck.status}`);
    }

    // Now fetch the full refund data for gateway call
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

      // Update refund with gateway reference (status already set to 'processing' above)
      const updated = await prisma.refund.update({
        where: { id: refundId },
        data: {
          refundReference: paystackRefundData.reference || paystackRefundData.id.toString(),
          metadata: {
            paystackRefundId: paystackRefundData.id,
            paystackTransactionId: paystackRefundData.transaction.id,
            ...(data.metadata || {}),
          } as Prisma.InputJsonValue,
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
      // Rollback status to 'pending' since the gateway call failed
      await prisma.refund.update({
        where: { id: refundId },
        data: { status: 'pending', processedAt: null, processedBy: null },
      }).catch((rollbackErr) => {
        logger.error(`Failed to rollback refund ${refundId} status:`, rollbackErr);
      });

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
              include: {
                attendee: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
                event: {
                  include: {
                    organizer: {
                      select: {
                        id: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            organizerId: true,
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

    // Send refund completion notifications
    try {
      const registration = refund.transaction.registration;
      const attendee = registration.attendee;
      const event = refund.event;

      // Notify attendee
      if (attendee) {
        await NotificationService.sendNotification({
          userId: attendee.id,
          type: NotificationType.REFUND_RECEIVED,
          title: `Refund Processed: ${event.title}`,
          message: `Your refund of ₦${Number(refund.refundAmount).toLocaleString()} for "${event.title}" has been processed and will be credited to your account within 3-5 business days.`,
          priority: NotificationPriority.HIGH,
          eventId: event.id,
          registrationId: registration.id,
          data: {
            refundAmount: Number(refund.refundAmount),
            currency: refund.currency,
            refundReference,
            refundReason: refund.refundReason,
          },
        });
      }

      // Notify organizer
      if (event.organizerId) {
        await NotificationService.sendNotification({
          userId: event.organizerId,
          type: NotificationType.REFUND_PROCESSED,
          title: `Refund Processed: ${event.title}`,
          message: `A refund of ₦${Number(refund.refundAmount).toLocaleString()} has been processed for "${event.title}"${attendee ? ` (${attendee.firstName || attendee.email})` : ''}.`,
          priority: NotificationPriority.MEDIUM,
          eventId: event.id,
          registrationId: registration.id,
          relatedUserId: attendee?.id,
          data: {
            refundAmount: Number(refund.refundAmount),
            currency: refund.currency,
            attendeeName: attendee?.firstName && attendee?.lastName
              ? `${attendee.firstName} ${attendee.lastName}`
              : attendee?.email,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to send refund completion notifications:', error);
    }

    return prisma.refund.findUnique({
      where: { id: refundId },
    });
  }

  /**
   * Check refund eligibility for a registration
   * Supports multiple refund policy types: no_refunds, full_refund, partial_refund, tiered, custom
   */
  static async getRefundEligibility(registrationId: string, userId?: string): Promise<RefundEligibility> {
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            refundSLA: true,
            refundPolicy: true,
            refundPolicyText: true,
            refundTiers: true,
            autoRefundEnabled: true,
          },
        },
        paymentTransaction: {
          select: {
            id: true,
            amount: true,
            currency: true,
          },
        },
        refund: {
          select: { id: true, status: true },
        },
      },
    });

    if (!registration) {
      throw new NotFoundError('Registration not found');
    }

    if (userId && registration.attendeeId !== userId) {
      throw new AuthorizationError('You can only check refunds for your own registrations');
    }

    // Check if refund already exists
    if (registration.refund) {
      return {
        eligible: false,
        refundPercentage: 0,
        refundAmount: 0,
        currency: registration.paymentTransaction?.currency || 'NGN',
        message: `A refund request already exists for this registration (Status: ${registration.refund.status})`,
        policyType: 'existing_refund',
        daysUntilEvent: 0,
      };
    }

    if (!registration.paymentTransaction) {
      return {
        eligible: false,
        refundPercentage: 0,
        refundAmount: 0,
        currency: 'NGN',
        message: 'No payment transaction found for this registration',
        policyType: 'no_payment',
        daysUntilEvent: 0,
      };
    }

    const event = registration.event;
    const transactionAmount = Number(registration.paymentTransaction.amount);
    const currency = registration.paymentTransaction.currency;
    const now = new Date();
    const eventStartDate = new Date(event.startDate);
    const msUntilEvent = eventStartDate.getTime() - now.getTime();
    const daysUntilEvent = Math.floor(msUntilEvent / (24 * 60 * 60 * 1000));

    const refundPolicy = event.refundPolicy || 'no_refunds';
    const refundSLA = event.refundSLA || 0;

    // Policy: no_refunds
    if (refundPolicy === 'no_refunds' || refundSLA === 0) {
      return {
        eligible: false,
        refundPercentage: 0,
        refundAmount: 0,
        currency,
        message: 'Refunds are not allowed for this event',
        policyType: 'no_refunds',
        policyText: event.refundPolicyText || undefined,
        daysUntilEvent,
      };
    }

    // Check if past the refund deadline
    if (daysUntilEvent < 0) {
      return {
        eligible: false,
        refundPercentage: 0,
        refundAmount: 0,
        currency,
        message: 'This event has already started or passed',
        policyType: refundPolicy,
        policyText: event.refundPolicyText || undefined,
        daysUntilEvent,
      };
    }

    // Policy: full_refund
    if (refundPolicy === 'full_refund') {
      if (daysUntilEvent < refundSLA) {
        const deadline = new Date(eventStartDate.getTime() - refundSLA * 24 * 60 * 60 * 1000);
        return {
          eligible: false,
          refundPercentage: 0,
          refundAmount: 0,
          currency,
          message: `Refund deadline has passed. Full refunds are available up to ${refundSLA} days before the event.`,
          policyType: 'full_refund',
          policyText: event.refundPolicyText || undefined,
          daysUntilEvent,
          deadline,
        };
      }
      return {
        eligible: true,
        refundPercentage: 100,
        refundAmount: transactionAmount,
        currency,
        message: 'You are eligible for a full refund',
        policyType: 'full_refund',
        policyText: event.refundPolicyText || undefined,
        daysUntilEvent,
        deadline: new Date(eventStartDate.getTime() - refundSLA * 24 * 60 * 60 * 1000),
      };
    }

    // Policy: tiered
    if (refundPolicy === 'tiered' && event.refundTiers) {
      const tiers = event.refundTiers as unknown as RefundTier[];
      if (!Array.isArray(tiers) || tiers.length === 0) {
        return {
          eligible: false,
          refundPercentage: 0,
          refundAmount: 0,
          currency,
          message: 'Refund policy is not properly configured',
          policyType: 'tiered',
          daysUntilEvent,
        };
      }

      // Sort tiers by daysBeforeEvent descending to find the applicable tier
      const sortedTiers = [...tiers].sort((a, b) => b.daysBeforeEvent - a.daysBeforeEvent);

      // Find the applicable tier
      let applicableTier: RefundTier | null = null;
      for (const tier of sortedTiers) {
        if (daysUntilEvent >= tier.daysBeforeEvent) {
          applicableTier = tier;
          break;
        }
      }

      if (!applicableTier) {
        // No tier applies - within the final window (no refund)
        const lowestTier = sortedTiers[sortedTiers.length - 1];
        return {
          eligible: false,
          refundPercentage: 0,
          refundAmount: 0,
          currency,
          message: `Refund deadline has passed. The last refund window was ${lowestTier.daysBeforeEvent} days before the event.`,
          policyType: 'tiered',
          policyText: event.refundPolicyText || undefined,
          daysUntilEvent,
        };
      }

      const refundAmount = Math.round(transactionAmount * applicableTier.refundPercentage) / 100;
      return {
        eligible: true,
        refundPercentage: applicableTier.refundPercentage,
        refundAmount,
        currency,
        message: applicableTier.refundPercentage === 100
          ? 'You are eligible for a full refund'
          : `You are eligible for a ${applicableTier.refundPercentage}% refund (${currency} ${refundAmount.toLocaleString()})`,
        policyType: 'tiered',
        policyText: event.refundPolicyText || undefined,
        daysUntilEvent,
      };
    }

    // Policy: partial_refund (fixed percentage)
    if (refundPolicy === 'partial_refund') {
      if (daysUntilEvent < refundSLA) {
        return {
          eligible: false,
          refundPercentage: 0,
          refundAmount: 0,
          currency,
          message: `Refund deadline has passed. Refunds are available up to ${refundSLA} days before the event.`,
          policyType: 'partial_refund',
          policyText: event.refundPolicyText || undefined,
          daysUntilEvent,
          deadline: new Date(eventStartDate.getTime() - refundSLA * 24 * 60 * 60 * 1000),
        };
      }
      // Default partial refund is 50% - can be configured via custom policy text
      const partialPercentage = 50;
      const refundAmount = Math.round(transactionAmount * partialPercentage) / 100;
      return {
        eligible: true,
        refundPercentage: partialPercentage,
        refundAmount,
        currency,
        message: `You are eligible for a ${partialPercentage}% refund (${currency} ${refundAmount.toLocaleString()})`,
        policyType: 'partial_refund',
        policyText: event.refundPolicyText || undefined,
        daysUntilEvent,
        deadline: new Date(eventStartDate.getTime() - refundSLA * 24 * 60 * 60 * 1000),
      };
    }

    // Policy: custom - just check SLA deadline, percentage handled manually
    if (refundPolicy === 'custom') {
      if (daysUntilEvent < refundSLA) {
        return {
          eligible: false,
          refundPercentage: 0,
          refundAmount: 0,
          currency,
          message: event.refundPolicyText || `Refund deadline has passed (${refundSLA} days before event)`,
          policyType: 'custom',
          policyText: event.refundPolicyText || undefined,
          daysUntilEvent,
        };
      }
      return {
        eligible: true,
        refundPercentage: 100, // Custom policy determines actual amount
        refundAmount: transactionAmount,
        currency,
        message: event.refundPolicyText || 'You may be eligible for a refund. Please contact the organizer.',
        policyType: 'custom',
        policyText: event.refundPolicyText || undefined,
        daysUntilEvent,
      };
    }

    // Fallback
    return {
      eligible: false,
      refundPercentage: 0,
      refundAmount: 0,
      currency,
      message: 'Unable to determine refund eligibility',
      policyType: refundPolicy,
      daysUntilEvent,
    };
  }

  /**
   * Request a refund as an attendee
   * Uses configurable refund policies to determine eligibility and amount
   */
  static async requestRefundAttendee(
    registrationId: string,
    userId: string,
    data: { refundReason: string },
    ipAddress?: string,
    userAgent?: string,
  ) {
    // 1. Check refund eligibility
    const eligibility = await this.getRefundEligibility(registrationId, userId);

    if (!eligibility.eligible) {
      throw new ValidationError(eligibility.message);
    }

    // 2. Get registration details for creating refund
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            autoRefundEnabled: true,
            organizerId: true,
          },
        },
        paymentTransaction: {
          select: {
            id: true,
            amount: true,
            currency: true,
          },
        },
      },
    });

    if (!registration || !registration.paymentTransaction) {
      throw new NotFoundError('Registration or payment not found');
    }

    // 3. Determine refund type based on percentage
    const refundType: 'full' | 'partial' = eligibility.refundPercentage === 100 ? 'full' : 'partial';

    // 4. Create refund request with calculated amount
    const refund = await this.createRefund(
      {
        transactionId: registration.paymentTransaction.id,
        refundAmount: eligibility.refundAmount,
        refundReason: data.refundReason,
        refundType,
        notes: `Auto-calculated: ${eligibility.refundPercentage}% refund based on ${eligibility.policyType} policy`,
      },
      userId,
      ipAddress,
      userAgent,
    );

    // 5. Handle Auto-Refund if enabled
    if (registration.event.autoRefundEnabled) {
      logger.info(`Auto-refund triggered for refund ${refund.id} (registration: ${registrationId})`);
      try {
        await this.processRefund(refund.id, {}, 'SYSTEM', ipAddress, userAgent);
      } catch (error) {
        logger.error(`Auto-refund failed for refund ${refund.id}:`, error);
      }
    }

    return {
      ...refund,
      eligibility,
    };
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
        user?.role !== 'ADMIN' &&
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
   * Get all refunds (admin) with optional search, pagination, and filters
   */
  static async getAllRefunds(filters?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.RefundWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { refundNumber: { contains: filters.search, mode: 'insensitive' } },
        { transaction: { transactionNumber: { contains: filters.search, mode: 'insensitive' } } },
        { transaction: { attendeeName: { contains: filters.search, mode: 'insensitive' } } },
        { event: { title: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
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
          event: {
            select: {
              id: true,
              title: true,
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
        orderBy: { requestedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.refund.count({ where }),
    ]);

    return {
      refunds,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get platform-wide refund summary (admin)
   */
  static async getPlatformRefundSummary() {
    const refunds = await prisma.refund.findMany({
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

