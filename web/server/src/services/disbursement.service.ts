import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors.js';
import { generateDisbursementNumber } from '../utils/transaction-helpers.js';
import { PlatformFeeService } from './platform-fee.service.js';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import { createAuditLog, AuditActions } from '../utils/audit.js';

export interface CreateDisbursementData {
  eventId: string;
  organizerId: string;
  platformFeeIds?: string[]; // Specific fees to include (optional - if not provided, includes all pending)
  scheduledDate?: Date; // When to process the disbursement
  paymentMethod?: string;
  bankAccount?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  notes?: string;
}

export interface ProcessDisbursementData {
  paymentReference?: string; // External payment reference (e.g., Paystack transfer reference)
  metadata?: Record<string, unknown>;
}

export class DisbursementService {
  /**
   * Create a new disbursement for an organizer
   * This aggregates pending platform fees and creates a disbursement record
   */
  static async createDisbursement(
    data: CreateDisbursementData,
    createdBy: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Verify event exists and belongs to organizer
    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
      select: {
        id: true,
        title: true,
        organizerId: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (event.organizerId !== data.organizerId) {
      throw new AuthorizationError('Event does not belong to this organizer');
    }

    // Eventbrite-style: Verify organizer has identity verification to receive payouts
    const organizer = await prisma.user.findUnique({
      where: { id: data.organizerId },
      select: {
        id: true,
        isIdentityVerified: true,
        verificationLevel: true,
      },
    });

    if (!organizer) {
      throw new NotFoundError('Organizer not found');
    }

    if (!organizer.isIdentityVerified) {
      throw new ValidationError(
        'Identity verification is required to receive payouts. Please verify your identity in your profile settings to receive funds from ticket sales.',
      );
    }

    // Get platform fees to include
    let feesToInclude;
    if (data.platformFeeIds && data.platformFeeIds.length > 0) {
      // Include specific fees
      feesToInclude = await prisma.platformFee.findMany({
        where: {
          id: { in: data.platformFeeIds },
          eventId: data.eventId,
          status: 'calculated',
          disbursementId: null,
        },
      });

      if (feesToInclude.length !== data.platformFeeIds.length) {
        throw new ValidationError('Some platform fees not found or already disbursed');
      }
    } else {
      // Include all pending fees for this event
      feesToInclude = await PlatformFeeService.getPendingDisbursementFees(
        data.eventId,
        data.organizerId,
      );
    }

    if (feesToInclude.length === 0) {
      throw new ValidationError('No pending platform fees to disburse');
    }

    // Calculate total amount
    const totalAmount = feesToInclude.reduce(
      (sum, fee) => sum + Number(fee.organizerAmount),
      0,
    );

    // Generate disbursement number
    let disbursementNumber = generateDisbursementNumber();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.organizerDisbursement.findUnique({
        where: { disbursementNumber },
      });
      if (!existing) break;
      disbursementNumber = generateDisbursementNumber();
      attempts++;
    }

    // Create disbursement with fees
    const disbursement = await prisma.$transaction(async (tx) => {
      const newDisbursement = await tx.organizerDisbursement.create({
        data: {
          disbursementNumber,
          organizerId: data.organizerId,
          eventId: data.eventId,
          totalAmount: new Decimal(totalAmount),
          currency: feesToInclude[0]?.currency || 'NGN',
          paymentMethod: data.paymentMethod || 'bank_transfer',
          bankAccount: data.bankAccount,
          bankName: data.bankName,
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          status: 'pending',
          scheduledDate: data.scheduledDate || null,
          notes: data.notes,
          createdBy,
        },
      });

      // Link platform fees to disbursement
      await tx.platformFee.updateMany({
        where: {
          id: { in: feesToInclude.map((f) => f.id) },
        },
        data: {
          disbursementId: newDisbursement.id,
          status: 'disbursed',
        },
      });

      return newDisbursement;
    });

    // Audit log
    await createAuditLog({
      userId: createdBy,
      action: AuditActions.DISBURSEMENT_CREATED,
      entity: 'OrganizerDisbursement',
      entityId: disbursement.id,
      metadata: {
        eventId: data.eventId,
        eventTitle: event.title,
        organizerId: data.organizerId,
        totalAmount: totalAmount.toString(),
        feeCount: feesToInclude.length,
        scheduledDate: data.scheduledDate?.toISOString(),
      },
      ipAddress,
      userAgent,
    });

    logger.info(
      `Disbursement created: ${disbursement.id} for event: ${data.eventId}, organizer: ${data.organizerId}, amount: ${totalAmount}`,
    );

    return {
      ...disbursement,
      totalAmount: Number(disbursement.totalAmount),
      platformFees: feesToInclude,
    };
  }

  /**
   * Get disbursement by ID
   */
  static async getDisbursement(disbursementId: string, organizerId?: string) {
    const disbursement = await prisma.organizerDisbursement.findUnique({
      where: { id: disbursementId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            organizerId: true,
          },
        },
        organizer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            organizationName: true,
          },
        },
        platformFees: {
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
          },
        },
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!disbursement) {
      throw new NotFoundError('Disbursement not found');
    }

    // Check authorization if organizerId provided
    if (organizerId && disbursement.organizerId !== organizerId) {
      throw new AuthorizationError('Access denied');
    }

    return disbursement;
  }

  /**
   * Get all disbursements for an organizer
   */
  static async getOrganizerDisbursements(
    organizerId: string,
    filters?: {
      eventId?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const where: {
      organizerId: string;
      eventId?: string;
      status?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = {
      organizerId,
    };

    if (filters?.eventId) {
      where.eventId = filters.eventId;
    }

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

    return prisma.organizerDisbursement.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get all disbursements for an event
   */
  static async getEventDisbursements(eventId: string, organizerId?: string) {
    const where: {
      eventId: string;
      organizerId?: string;
    } = {
      eventId,
    };

    if (organizerId) {
      where.organizerId = organizerId;
    }

    return prisma.organizerDisbursement.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            email: true,
            organizationName: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Process a disbursement (mark as processing/initiate payment)
   * This would typically integrate with Paystack Transfer API or bank transfer
   */
  static async processDisbursement(
    disbursementId: string,
    data: ProcessDisbursementData,
    processedBy: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const disbursement = await prisma.organizerDisbursement.findUnique({
      where: { id: disbursementId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        organizer: {
          select: {
            id: true,
            isIdentityVerified: true,
            verificationLevel: true,
          },
        },
      },
    });

    if (!disbursement) {
      throw new NotFoundError('Disbursement not found');
    }

    if (disbursement.status !== 'pending') {
      throw new ValidationError(`Cannot process disbursement with status: ${disbursement.status}`);
    }

    // Eventbrite-style: Verify organizer has identity verification to receive payouts
    if (!disbursement.organizer.isIdentityVerified) {
      throw new ValidationError(
        'Identity verification is required to receive payouts. The organizer must verify their identity before funds can be disbursed.',
      );
    }

    // Update status to processing
    const updated = await prisma.organizerDisbursement.update({
      where: { id: disbursementId },
      data: {
        status: 'processing',
        processedAt: new Date(),
        paymentReference: data.paymentReference,
        metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
        updatedBy: processedBy,
      },
    });

    // Audit log
    await createAuditLog({
      userId: processedBy,
      action: AuditActions.DISBURSEMENT_PROCESSED,
      entity: 'OrganizerDisbursement',
      entityId: disbursementId,
      metadata: {
        eventId: disbursement.eventId,
        eventTitle: disbursement.event.title,
        organizerId: disbursement.organizerId,
        totalAmount: Number(disbursement.totalAmount).toString(),
        paymentReference: data.paymentReference,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Disbursement processing started: ${disbursementId} by user: ${processedBy}`);

    return updated;
  }

  /**
   * Complete a disbursement (mark as completed after payment is confirmed)
   */
  static async completeDisbursement(
    disbursementId: string,
    paymentReference: string,
    completedBy: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const disbursement = await prisma.organizerDisbursement.findUnique({
      where: { id: disbursementId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!disbursement) {
      throw new NotFoundError('Disbursement not found');
    }

    if (disbursement.status !== 'processing' && disbursement.status !== 'pending') {
      throw new ValidationError(`Cannot complete disbursement with status: ${disbursement.status}`);
    }

    const updated = await prisma.organizerDisbursement.update({
      where: { id: disbursementId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        paymentReference,
        updatedBy: completedBy,
      },
    });

    // Audit log
    await createAuditLog({
      userId: completedBy,
      action: AuditActions.DISBURSEMENT_COMPLETED,
      entity: 'OrganizerDisbursement',
      entityId: disbursementId,
      metadata: {
        eventId: disbursement.eventId,
        eventTitle: disbursement.event.title,
        organizerId: disbursement.organizerId,
        totalAmount: Number(disbursement.totalAmount).toString(),
        paymentReference,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Disbursement completed: ${disbursementId} by user: ${completedBy}`);

    return updated;
  }

  /**
   * Mark disbursement as failed
   */
  static async failDisbursement(
    disbursementId: string,
    failureReason: string,
    failedBy: string,
  ) {
    const disbursement = await prisma.organizerDisbursement.findUnique({
      where: { id: disbursementId },
    });

    if (!disbursement) {
      throw new NotFoundError('Disbursement not found');
    }

    // Unlink platform fees so they can be included in another disbursement
    await prisma.$transaction(async (tx) => {
      await tx.platformFee.updateMany({
        where: {
          disbursementId,
        },
        data: {
          disbursementId: null,
          status: 'calculated',
        },
      });

      await tx.organizerDisbursement.update({
        where: { id: disbursementId },
        data: {
          status: 'failed',
          failureReason,
          updatedBy: failedBy,
        },
      });
    });

    logger.warn(`Disbursement failed: ${disbursementId}. Reason: ${failureReason}`);

    return prisma.organizerDisbursement.findUnique({
      where: { id: disbursementId },
    });
  }

  /**
   * Get disbursement summary for an organizer
   */
  static async getOrganizerDisbursementSummary(organizerId: string) {
    const disbursements = await prisma.organizerDisbursement.findMany({
      where: { organizerId },
      select: {
        totalAmount: true,
        status: true,
        completedAt: true,
      },
    });

    const totalDisbursed = disbursements
      .filter((d) => d.status === 'completed')
      .reduce((sum, d) => sum + Number(d.totalAmount), 0);

    const totalPending = disbursements
      .filter((d) => d.status === 'pending' || d.status === 'processing')
      .reduce((sum, d) => sum + Number(d.totalAmount), 0);

    return {
      totalDisbursed: Number(totalDisbursed.toFixed(2)),
      totalPending: Number(totalPending.toFixed(2)),
      totalCount: disbursements.length,
      completedCount: disbursements.filter((d) => d.status === 'completed').length,
      pendingCount: disbursements.filter((d) => d.status === 'pending').length,
      processingCount: disbursements.filter((d) => d.status === 'processing').length,
      failedCount: disbursements.filter((d) => d.status === 'failed').length,
    };
  }

  /**
   * Get scheduled disbursements that are ready to process
   */
  static async getScheduledDisbursementsReadyToProcess() {
    const now = new Date();
    return prisma.organizerDisbursement.findMany({
      where: {
        status: 'pending',
        scheduledDate: {
          lte: now,
        },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        organizer: {
          select: {
            id: true,
            email: true,
            organizationName: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });
  }
}

