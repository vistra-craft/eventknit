import { prisma } from '../config/database.js';
import {
  BulkMessageStatus,
  BulkMessageTargetAudience,
  Prisma,
  UserRole,
} from '@prisma/client';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { NotificationService } from './notification.service.js';
import { NotificationType, NotificationPriority } from '@prisma/client';
import { escapeHtml } from '../utils/sanitize.js';

export interface CreateBulkMessageData {
  title: string;
  content: string;
  type: string; // announcement, marketing, system, event_update
  targetAudience: BulkMessageTargetAudience;
  eventId?: string;
  campaignId?: string;
  templateId?: string;
  channels?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    inApp?: boolean;
  };
  scheduledAt?: Date | string;
  variables?: Record<string, string | number | boolean>;
}

export interface UpdateBulkMessageData {
  title?: string;
  content?: string;
  type?: string;
  targetAudience?: BulkMessageTargetAudience;
  eventId?: string;
  campaignId?: string;
  templateId?: string;
  channels?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    inApp?: boolean;
  };
  scheduledAt?: Date | string | null;
  status?: BulkMessageStatus;
  variables?: Record<string, string | number | boolean>;
}

export interface BulkMessageFilters {
  status?: BulkMessageStatus;
  type?: string;
  targetAudience?: BulkMessageTargetAudience;
  eventId?: string;
  createdBy?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}

export class BulkMessageService {
  /**
   * Create a new bulk message
   */
  static async createBulkMessage(
    data: CreateBulkMessageData,
    createdBy: string,
  ) {
    try {
      // Validate event exists if eventId provided
      if (data.eventId) {
        const event = await prisma.event.findUnique({
          where: { id: data.eventId },
          select: { id: true },
        });

        if (!event) {
          throw new NotFoundError('Event not found');
        }
      }

      // Validate target audience
      if (data.targetAudience === BulkMessageTargetAudience.SPECIFIC_EVENT && !data.eventId) {
        throw new ValidationError('Event ID is required when targeting specific event');
      }

      // Default channels (email primary, SMS optional if enabled)
      const { smsService } = await import('./sms.service.js');
      const defaultChannels = {
        email: true,
        sms: smsService.isEnabled() ? false : false, // Default to false, but allow if enabled
        push: true,
        inApp: true,
      };

      const channels = data.channels ?? defaultChannels;

      // Only allow SMS if service is enabled
      if (channels.sms && !smsService.isEnabled()) {
        channels.sms = false;
        logger.warn('SMS channel requested but SMS service is not enabled');
      }

      // Calculate total recipients (will be updated when message is sent)
      const totalRecipients = await this.calculateRecipients(
        data.targetAudience,
        data.eventId,
      );

      // Validate template exists if templateId provided
      if (data.templateId) {
        const template = await prisma.emailTemplate.findUnique({
          where: { id: data.templateId },
          select: { id: true, isActive: true },
        });

        if (!template) {
          throw new NotFoundError('Email template not found');
        }

        if (!template.isActive) {
          throw new ValidationError('Email template is not active');
        }
      }

      const bulkMessage = await prisma.bulkMessage.create({
        data: {
          title: data.title,
          content: data.content,
          type: data.type,
          targetAudience: data.targetAudience,
          eventId: data.eventId,
          campaignId: data.campaignId,
          templateId: data.templateId,
          channels: channels as Prisma.InputJsonValue,
          status: data.scheduledAt
            ? BulkMessageStatus.SCHEDULED
            : BulkMessageStatus.DRAFT,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
          totalRecipients,
          createdBy,
        },
      });

      logger.info(`Bulk message created: ${bulkMessage.id} by user: ${createdBy}`);

      return bulkMessage;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Failed to create bulk message:', error);
      throw new ValidationError('Failed to create bulk message');
    }
  }

  /**
   * Calculate number of recipients for a bulk message
   */
  private static async calculateRecipients(
    targetAudience: BulkMessageTargetAudience,
    eventId?: string,
  ): Promise<number> {
    try {
      switch (targetAudience) {
      case BulkMessageTargetAudience.ALL:
        return await prisma.user.count({
          where: {
            deletedAt: null,
            status: 'ACTIVE',
          },
        });

      case BulkMessageTargetAudience.ORGANIZERS:
        return await prisma.user.count({
          where: {
            role: UserRole.ORGANIZER,
            deletedAt: null,
            status: 'ACTIVE',
          },
        });

      case BulkMessageTargetAudience.ATTENDEES:
        return await prisma.user.count({
          where: {
            role: UserRole.ATTENDEE,
            deletedAt: null,
            status: 'ACTIVE',
          },
        });

      case BulkMessageTargetAudience.STAFF:
        return await prisma.user.count({
          where: {
            role: {
              in: [
                UserRole.ADMIN_STAFF,
                UserRole.MARKETER,
                UserRole.SUPPORT,
                UserRole.TELLER,
                UserRole.ORGANIZER_STAFF,
                UserRole.ORGANIZER_TELLER,
              ],
            },
            deletedAt: null,
            status: 'ACTIVE',
          },
        });

      case BulkMessageTargetAudience.SPECIFIC_EVENT: {
        if (!eventId) {
          return 0;
        }
        return await prisma.eventRegistration.count({
          where: {
            eventId,
            status: 'CONFIRMED',
          },
        });
      }

      default:
        return 0;
      }
    } catch (error) {
      logger.error('Failed to calculate recipients:', error);
      return 0;
    }
  }

  /**
   * Get bulk messages with filters
   */
  static async getBulkMessages(filters?: BulkMessageFilters) {
    try {
      const where: Prisma.BulkMessageWhereInput = {};

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.type) {
        where.type = filters.type;
      }

      if (filters?.targetAudience) {
        where.targetAudience = filters.targetAudience;
      }

      if (filters?.eventId) {
        where.eventId = filters.eventId;
      }

      if (filters?.createdBy) {
        where.createdBy = filters.createdBy;
      }

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      const messages = await prisma.bulkMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
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

      return messages;
    } catch (error) {
      logger.error('Failed to get bulk messages:', error);
      throw new ValidationError('Failed to retrieve bulk messages');
    }
  }

  /**
   * Get bulk message by ID
   */
  static async getBulkMessageById(messageId: string) {
    try {
      const message = await prisma.bulkMessage.findUnique({
        where: { id: messageId },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
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

      if (!message) {
        throw new NotFoundError('Bulk message not found');
      }

      return message;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Failed to get bulk message ${messageId}:`, error);
      throw new ValidationError('Failed to retrieve bulk message');
    }
  }

  /**
   * Update bulk message
   */
  static async updateBulkMessage(
    messageId: string,
    data: UpdateBulkMessageData,
    updatedBy: string,
  ) {
    try {
      const message = await prisma.bulkMessage.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new NotFoundError('Bulk message not found');
      }

      // Cannot update if already sent
      if (message.status === BulkMessageStatus.SENT) {
        throw new ValidationError('Cannot update a message that has already been sent');
      }

      // Validate event if provided
      if (data.eventId) {
        const event = await prisma.event.findUnique({
          where: { id: data.eventId },
          select: { id: true },
        });

        if (!event) {
          throw new NotFoundError('Event not found');
        }
      }

      // Validate template if provided
      if (data.templateId) {
        const template = await prisma.emailTemplate.findUnique({
          where: { id: data.templateId },
          select: { id: true, isActive: true },
        });

        if (!template) {
          throw new NotFoundError('Email template not found');
        }

        if (!template.isActive) {
          throw new ValidationError('Email template is not active');
        }
      }

      // Force SMS to be disabled if channels are updated
      const updateData: Prisma.BulkMessageUpdateInput = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.targetAudience !== undefined) updateData.targetAudience = data.targetAudience;
      if (data.eventId !== undefined) {
        updateData.event = data.eventId ? { connect: { id: data.eventId } } : { disconnect: true };
      }
      if (data.campaignId !== undefined) {
        updateData.campaignId = data.campaignId;
      }
      if (data.templateId !== undefined) {
        updateData.template = data.templateId ? { connect: { id: data.templateId } } : { disconnect: true };
      }
      if (data.status !== undefined) updateData.status = data.status;

      if (data.channels) {
        const channels = { ...data.channels };
        // Only allow SMS if service is enabled
        const { smsService } = await import('./sms.service.js');
        if (channels.sms && !smsService.isEnabled()) {
          channels.sms = false;
          logger.warn('SMS channel requested but SMS service is not enabled');
        }
        updateData.channels = channels as Prisma.InputJsonValue;
      }

      if (data.scheduledAt !== undefined) {
        updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
        // Update status based on scheduledAt
        if (data.scheduledAt) {
          updateData.status = BulkMessageStatus.SCHEDULED;
        } else if (message.status === BulkMessageStatus.SCHEDULED) {
          updateData.status = BulkMessageStatus.DRAFT;
        }
      }

      // Recalculate recipients if target audience or event changed
      if (data.targetAudience !== undefined || data.eventId !== undefined) {
        const finalTargetAudience = data.targetAudience ?? message.targetAudience;
        const finalEventId = data.eventId ?? message.eventId ?? undefined;
        const totalRecipients = await this.calculateRecipients(
          finalTargetAudience,
          finalEventId,
        );
        updateData.totalRecipients = totalRecipients;
      }

      const updated = await prisma.bulkMessage.update({
        where: { id: messageId },
        data: updateData,
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
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

      logger.info(`Bulk message updated: ${messageId} by user: ${updatedBy}`);

      return updated;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error(`Failed to update bulk message ${messageId}:`, error);
      throw new ValidationError('Failed to update bulk message');
    }
  }

  /**
   * Send bulk message
   */
  static async sendBulkMessage(messageId: string) {
    try {
      const message = await prisma.bulkMessage.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new NotFoundError('Bulk message not found');
      }

      if (message.status === BulkMessageStatus.SENT) {
        throw new ValidationError('Message has already been sent');
      }

      if (message.status === BulkMessageStatus.SENDING) {
        throw new ValidationError('Message is currently being sent');
      }

      // Update status to sending
      await prisma.bulkMessage.update({
        where: { id: messageId },
        data: { status: BulkMessageStatus.SENDING },
      });

      // Get recipients
      const recipients = await this.getRecipients(message.targetAudience, message.eventId ?? undefined);

      logger.info(`Sending bulk message ${messageId} to ${recipients.length} recipients`);

      // Send notifications in batches to avoid overwhelming the system
      const batchSize = 50;
      let sentCount = 0;
      let failedCount = 0;

      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async (userId) => {
            try {
              // Determine notification type based on message type
              let notificationType: NotificationType = NotificationType.SYSTEM_ANNOUNCEMENT;
              if (message.type === 'marketing') {
                notificationType = NotificationType.NEW_EVENT_AVAILABLE;
              } else if (message.type === 'event_update' && message.eventId) {
                notificationType = NotificationType.EVENT_UPDATE;
              }

              await NotificationService.sendNotification({
                userId,
                type: notificationType,
                title: escapeHtml(message.title),
                message: escapeHtml(message.content),
                channels: message.channels as {
                  email?: boolean;
                  sms?: boolean;
                  push?: boolean;
                  inApp?: boolean;
                },
                priority: NotificationPriority.MEDIUM,
                eventId: message.eventId ?? undefined,
                data: {
                  bulkMessageId: messageId,
                  messageType: message.type,
                },
              });

              sentCount++;
            } catch (error) {
              failedCount++;
              logger.error(`Failed to send bulk message to user ${userId}:`, error);
            }
          }),
        );

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < recipients.length) {
          await new Promise((resolve) => {
             
            setTimeout(resolve, 100);
          });
        }
      }

      // Update message status
      const updated = await prisma.bulkMessage.update({
        where: { id: messageId },
        data: {
          status: BulkMessageStatus.SENT,
          sentAt: new Date(),
          sentCount,
          failedCount,
        },
      });

      logger.info(
        `Bulk message ${messageId} sent: ${sentCount} successful, ${failedCount} failed`,
      );

      return updated;
    } catch (error) {
      // Update status back to draft if sending failed
      try {
        await prisma.bulkMessage.update({
          where: { id: messageId },
          data: { status: BulkMessageStatus.DRAFT },
        });
      } catch (updateError) {
        logger.error('Failed to update bulk message status after error:', updateError);
      }

      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error(`Failed to send bulk message ${messageId}:`, error);
      throw new ValidationError('Failed to send bulk message');
    }
  }

  /**
   * Get recipients for bulk message
   */
  private static async getRecipients(
    targetAudience: BulkMessageTargetAudience,
    eventId?: string,
  ): Promise<string[]> {
    try {
      switch (targetAudience) {
      case BulkMessageTargetAudience.ALL: {
        const allUsers = await prisma.user.findMany({
          where: {
            deletedAt: null,
            status: 'ACTIVE',
          },
          select: { id: true },
        });
        return allUsers.map((u) => u.id);
      }

      case BulkMessageTargetAudience.ORGANIZERS: {
        const organizers = await prisma.user.findMany({
          where: {
            role: UserRole.ORGANIZER,
            deletedAt: null,
            status: 'ACTIVE',
          },
          select: { id: true },
        });
        return organizers.map((u) => u.id);
      }

      case BulkMessageTargetAudience.ATTENDEES: {
        const attendees = await prisma.user.findMany({
          where: {
            role: UserRole.ATTENDEE,
            deletedAt: null,
            status: 'ACTIVE',
          },
          select: { id: true },
        });
        return attendees.map((u) => u.id);
      }

      case BulkMessageTargetAudience.STAFF: {
        const staff = await prisma.user.findMany({
          where: {
            role: {
              in: [
                UserRole.ADMIN_STAFF,
                UserRole.MARKETER,
                UserRole.SUPPORT,
                UserRole.TELLER,
                UserRole.ORGANIZER_STAFF,
                UserRole.ORGANIZER_TELLER,
              ],
            },
            deletedAt: null,
            status: 'ACTIVE',
          },
          select: { id: true },
        });
        return staff.map((u) => u.id);
      }

      case BulkMessageTargetAudience.SPECIFIC_EVENT: {
        if (!eventId) {
          return [];
        }
        const registrations = await prisma.eventRegistration.findMany({
          where: {
            eventId,
            status: 'CONFIRMED',
          },
          select: { attendeeId: true },
        });
        return registrations.map((r) => r.attendeeId);
      }

      default:
        return [];
      }
    } catch (error) {
      logger.error('Failed to get recipients:', error);
      return [];
    }
  }

  /**
   * Cancel scheduled bulk message
   */
  static async cancelBulkMessage(messageId: string) {
    try {
      const message = await prisma.bulkMessage.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new NotFoundError('Bulk message not found');
      }

      if (message.status !== BulkMessageStatus.SCHEDULED) {
        throw new ValidationError('Can only cancel scheduled messages');
      }

      const updated = await prisma.bulkMessage.update({
        where: { id: messageId },
        data: {
          status: BulkMessageStatus.CANCELLED,
        },
      });

      logger.info(`Bulk message cancelled: ${messageId}`);

      return updated;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error(`Failed to cancel bulk message ${messageId}:`, error);
      throw new ValidationError('Failed to cancel bulk message');
    }
  }

  /**
   * Delete bulk message
   */
  static async deleteBulkMessage(messageId: string, userId: string) {
    try {
      const message = await prisma.bulkMessage.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new NotFoundError('Bulk message not found');
      }

      // Only creator can delete
      if (message.createdBy !== userId) {
        throw new AuthorizationError('You can only delete your own bulk messages');
      }

      // Cannot delete if already sent
      if (message.status === BulkMessageStatus.SENT) {
        throw new ValidationError('Cannot delete a message that has already been sent');
      }

      await prisma.bulkMessage.delete({
        where: { id: messageId },
      });

      logger.info(`Bulk message deleted: ${messageId} by user: ${userId}`);

      return { success: true };
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ValidationError ||
        error instanceof AuthorizationError
      ) {
        throw error;
      }
      logger.error(`Failed to delete bulk message ${messageId}:`, error);
      throw new ValidationError('Failed to delete bulk message');
    }
  }
}

