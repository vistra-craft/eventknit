import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { createAuditLog, AuditActions } from '../utils/audit.js';
import { emailService } from './email.service.js';
import crypto from 'crypto';

interface ExportedUserData {
  exportedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    otherName: string | null;
    phoneNumber: string | null;
    companyAffiliation: string | null;
    role: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
  registrations: Array<{
    id: string;
    eventTitle: string;
    eventDate: Date;
    ticketType: string | null;
    quantity: number;
    status: string;
    registeredAt: Date;
    totalAmount: string | null;
  }>;
  payments: Array<{
    id: string;
    eventTitle: string;
    amount: string;
    currency: string;
    status: string;
    paymentDate: Date | null;
    transactionNumber: string;
  }>;
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    createdAt: Date;
    readAt: Date | null;
  }>;
  transfers: Array<{
    id: string;
    direction: 'sent' | 'received';
    eventTitle: string;
    status: string;
    createdAt: Date;
    completedAt: Date | null;
  }>;
  preferences: {
    eventUpdates: boolean;
    marketingEmails: boolean;
    eventNotifications: boolean;
  };
}

export class GDPRService {
  /**
   * Export all user data (GDPR Article 20 - Right to Data Portability)
   */
  static async exportUserData(userId: string): Promise<ExportedUserData> {
    // Get user with related data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        otherName: true,
        phoneNumber: true,
        companyAffiliation: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get registrations
    const registrations = await prisma.eventRegistration.findMany({
      where: { attendeeId: userId },
      include: {
        event: {
          select: {
            title: true,
            startDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get payment transactions
    const payments = await prisma.eventPaymentTransaction.findMany({
      where: {
        attendeeEmail: user.email,
      },
      include: {
        event: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        createdAt: true,
        readAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 1000, // Limit to last 1000 notifications
    });

    // Get ticket transfers (sent and received)
    const sentTransfers = await prisma.ticketTransfer.findMany({
      where: { fromUserId: userId },
      include: {
        registration: {
          include: {
            event: {
              select: { title: true },
            },
          },
        },
      },
    });

    const receivedTransfers = await prisma.ticketTransfer.findMany({
      where: { toUserId: userId },
      include: {
        registration: {
          include: {
            event: {
              select: { title: true },
            },
          },
        },
      },
    });

    // Get user preferences
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    // Build export object
    const exportData: ExportedUserData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        otherName: user.otherName,
        phoneNumber: user.phoneNumber,
        companyAffiliation: user.companyAffiliation,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      registrations: registrations.map(reg => ({
        id: reg.id,
        eventTitle: reg.event.title,
        eventDate: reg.event.startDate,
        ticketType: reg.ticketType,
        quantity: reg.quantity,
        status: reg.status,
        registeredAt: reg.createdAt,
        totalAmount: reg.totalAmount?.toString() || null,
      })),
      payments: payments.map(payment => ({
        id: payment.id,
        eventTitle: payment.event.title,
        amount: payment.amount.toString(),
        currency: payment.currency,
        status: payment.paymentStatus,
        paymentDate: payment.paymentDate,
        transactionNumber: payment.transactionNumber,
      })),
      notifications: notifications.map(notif => ({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        createdAt: notif.createdAt,
        readAt: notif.readAt,
      })),
      transfers: [
        ...sentTransfers.map(t => ({
          id: t.id,
          direction: 'sent' as const,
          eventTitle: t.registration.event.title,
          status: t.status,
          createdAt: t.createdAt,
          completedAt: t.acceptedAt,
        })),
        ...receivedTransfers.map(t => ({
          id: t.id,
          direction: 'received' as const,
          eventTitle: t.registration.event.title,
          status: t.status,
          createdAt: t.createdAt,
          completedAt: t.acceptedAt,
        })),
      ],
      preferences: {
        eventUpdates: preferences?.eventUpdates ?? true,
        marketingEmails: preferences?.marketingEmails ?? false,
        eventNotifications: preferences?.eventNotifications ?? true,
      },
    };

    // Create audit log
    await createAuditLog({
      userId,
      action: AuditActions.DATA_EXPORTED,
      entity: 'User',
      entityId: userId,
      metadata: {
        exportType: 'full',
        recordCounts: {
          registrations: registrations.length,
          payments: payments.length,
          notifications: notifications.length,
          transfers: sentTransfers.length + receivedTransfers.length,
        },
      },
    });

    logger.info(`User data exported for user ${userId}`);

    return exportData;
  }

  /**
   * Request data export - generates export and emails download link
   */
  static async requestDataExport(userId: string): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate export
    const exportData = await this.exportUserData(userId);

    // Generate unique export token
    const exportToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store export request (could be stored in Redis or DB)
    await prisma.dataExportRequest.create({
      data: {
        userId,
        token: exportToken,
        status: 'COMPLETED',
        expiresAt,
        exportData: exportData as unknown as Prisma.InputJsonValue,
      },
    });

    // Send email with download link
    const downloadUrl = `${config.frontend.url}/api/v1/gdpr/download/${exportToken}`;

    await emailService.sendDataExportReadyEmail(user.email, {
      userName: user.firstName || 'there',
      downloadUrl,
      expiresAt: expiresAt.toISOString(),
    });

    logger.info(`Data export requested and sent for user ${userId}`);

    return { message: 'Your data export is being prepared and will be sent to your email shortly.' };
  }

  /**
   * Download exported data by token
   */
  static async downloadExport(token: string): Promise<ExportedUserData> {
    const exportRequest = await prisma.dataExportRequest.findUnique({
      where: { token },
    });

    if (!exportRequest) {
      throw new NotFoundError('Export not found or has expired');
    }

    if (exportRequest.expiresAt < new Date()) {
      throw new ValidationError('Export link has expired. Please request a new export.');
    }

    // Audit log for download
    await createAuditLog({
      userId: exportRequest.userId,
      action: AuditActions.DATA_EXPORTED,
      entity: 'DataExportRequest',
      entityId: exportRequest.id,
      metadata: {
        action: 'downloaded',
      },
    });

    return exportRequest.exportData as unknown as ExportedUserData;
  }

  /**
   * Delete user account (GDPR Article 17 - Right to Erasure)
   * Anonymizes personal data while retaining transaction records for legal compliance
   */
  static async deleteAccount(
    userId: string,
    data: {
      confirmEmail: string;
      reason?: string;
    },
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify email confirmation
    if (data.confirmEmail.toLowerCase() !== user.email.toLowerCase()) {
      throw new ValidationError('Email confirmation does not match your account email');
    }

    // Generate anonymized identifier
    const anonymizedId = `deleted_${crypto.randomBytes(8).toString('hex')}`;
    const anonymizedEmail = `${anonymizedId}@deleted.eventknit.com`;

    // Begin transaction for data anonymization
    await prisma.$transaction(async (tx) => {
      // Cancel any pending registrations
      await tx.eventRegistration.updateMany({
        where: {
          attendeeId: userId,
          status: 'PENDING',
        },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: 'SYSTEM_ACCOUNT_DELETION',
        },
      });

      // Cancel any pending transfers
      await tx.ticketTransfer.updateMany({
        where: {
          OR: [
            { fromUserId: userId, status: 'PENDING' },
            { toUserId: userId, status: 'PENDING' },
          ],
        },
        data: {
          status: 'CANCELLED',
        },
      });

      // Anonymize user data
      await tx.user.update({
        where: { id: userId },
        data: {
          email: anonymizedEmail,
          firstName: 'Deleted',
          lastName: 'User',
          otherName: null,
          phoneNumber: null,
          companyAffiliation: null,
          googleId: null,
          password: null,
          status: 'DEACTIVATED',
          // Keep role and createdAt for potential legal reference
        },
      });

      // Anonymize payment transaction attendee info
      // Note: We keep transaction records for legal/financial compliance
      await tx.eventPaymentTransaction.updateMany({
        where: { attendeeEmail: user.email },
        data: {
          attendeeEmail: anonymizedEmail,
          attendeeName: 'Deleted User',
        },
      });

      // Delete notification preferences
      await tx.userPreferences.deleteMany({
        where: { userId },
      });

      // Delete notifications (optional - could anonymize instead)
      await tx.notification.deleteMany({
        where: { userId },
      });

      // Delete refresh tokens
      await tx.refreshToken.deleteMany({
        where: { userId },
      });

      // Delete segment memberships
      await tx.attendeeSegmentMember.deleteMany({
        where: { userId },
      });

      // Delete tagged user records
      await tx.attendeeTaggedUser.deleteMany({
        where: { userId },
      });
    });

    // Create audit log
    await createAuditLog({
      userId,
      action: AuditActions.ACCOUNT_DELETED,
      entity: 'User',
      entityId: userId,
      metadata: {
        originalEmail: user.email,
        anonymizedEmail,
        reason: data.reason || 'User requested account deletion',
        deletionType: 'anonymization',
      },
      ipAddress,
      userAgent,
    });

    // Send confirmation email to original email
    try {
      await emailService.sendAccountDeletionConfirmationEmail(user.email, {
        userName: user.firstName || 'there',
      });
    } catch (error) {
      // Email might fail if already deleted, log but don't fail
      logger.warn(`Failed to send deletion confirmation email to ${user.email}:`, error);
    }

    logger.info(`Account deleted (anonymized) for user ${userId}`);

    return {
      message: 'Your account has been deleted. Personal data has been anonymized and any pending registrations have been cancelled.',
    };
  }
}
