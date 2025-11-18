import { prisma } from '../config/database.js';
import {
  NotificationType,
  NotificationPriority,
  DeliveryStatus,
  Prisma,
} from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { emailService } from './email.service.js';
import { NotificationPreferenceService, NotificationChannels } from './notification-preference.service.js';

export interface SendNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  channels?: NotificationChannels;
  priority?: NotificationPriority;
  expiresAt?: Date;
  eventId?: string;
  registrationId?: string;
  relatedUserId?: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface NotificationFilters {
  type?: NotificationType;
  isRead?: boolean;
  priority?: NotificationPriority;
  eventId?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}

export class NotificationService {
  /**
   * Send notification to a single user
   * Creates notification record and queues delivery via selected channels
   */
  static async sendNotification(data: SendNotificationData) {
    try {
      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Get user preferences to determine default channels
      // Note: SMS is disabled - we only use email notifications
      const defaultChannels: NotificationChannels = {
        email: true,
        sms: false, // SMS not used in this system
        push: true,
        inApp: true,
      };

      const channels = data.channels ?? defaultChannels;

      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          channels: channels as Prisma.InputJsonValue,
          priority: data.priority ?? NotificationPriority.MEDIUM,
          expiresAt: data.expiresAt,
          eventId: data.eventId,
          registrationId: data.registrationId,
          relatedUserId: data.relatedUserId,
          data: data.data ? (data.data as Prisma.InputJsonValue) : undefined,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
          // Set initial delivery status
          emailStatus: channels.email ? DeliveryStatus.PENDING : null,
          smsStatus: channels.sms ? DeliveryStatus.PENDING : null,
          pushStatus: channels.push ? DeliveryStatus.PENDING : null,
          inAppStatus: channels.inApp ? DeliveryStatus.DELIVERED : null, // In-app is immediate
        },
      });

      logger.info(`Notification created: ${notification.id} for user ${data.userId}, type: ${data.type}`);

      // Deliver via channels (async, don't await)
      this.deliverNotification(notification.id, channels).catch((error) => {
        logger.error(`Failed to deliver notification ${notification.id}:`, error);
      });

      return notification;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Failed to send notification to user ${data.userId}:`, error);
      throw new ValidationError('Failed to send notification');
    }
  }

  /**
   * Send notification to multiple users (bulk)
   */
  static async sendBulkNotification(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    channels?: NotificationChannels,
    priority?: NotificationPriority,
    eventId?: string,
    data?: Record<string, unknown>,
  ) {
    try {
      const results = {
        total: userIds.length,
        created: 0,
        failed: 0,
        errors: [] as Array<{ userId: string; error: string }>,
      };

      // Send notifications in parallel (with concurrency limit)
      const batchSize = 10;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        await Promise.allSettled(
          batch.map(async (userId) => {
            try {
              await this.sendNotification({
                userId,
                type,
                title,
                message,
                channels,
                priority,
                eventId,
                data,
              });
              results.created++;
            } catch (error) {
              results.failed++;
              results.errors.push({
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          }),
        );
      }

      logger.info(
        `Bulk notification sent: ${results.created} created, ${results.failed} failed out of ${results.total}`,
      );

      return results;
    } catch (error) {
      logger.error('Failed to send bulk notification:', error);
      throw new ValidationError('Failed to send bulk notification');
    }
  }

  /**
   * Send event notification to all registered attendees or organizers
   */
  static async sendEventNotification(
    eventId: string,
    type: NotificationType,
    title: string,
    message: string,
    targetAudience: 'attendees' | 'organizer' | 'staff',
    channels?: NotificationChannels,
    priority?: NotificationPriority,
    data?: Record<string, unknown>,
  ) {
    try {
      // Verify event exists
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, title: true, organizerId: true },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      let userIds: string[] = [];

      if (targetAudience === 'attendees') {
        // Get all registered attendees
        const registrations = await prisma.eventRegistration.findMany({
          where: {
            eventId,
            status: 'CONFIRMED',
          },
          select: { attendeeId: true },
        });
        userIds = registrations.map((r) => r.attendeeId);
      } else if (targetAudience === 'organizer') {
        // Get event organizer
        userIds = [event.organizerId];
      } else if (targetAudience === 'staff') {
        // Get all assigned staff
        const staffAssignments = await prisma.eventStaff.findMany({
          where: {
            eventId,
            isActive: true,
          },
          select: { staffId: true },
        });
        userIds = staffAssignments.map((s) => s.staffId);
      }

      if (userIds.length === 0) {
        logger.info(`No recipients found for event notification: ${eventId}, audience: ${targetAudience}`);
        return { total: 0, created: 0, failed: 0, errors: [] };
      }

      return await this.sendBulkNotification(
        userIds,
        type,
        title,
        message,
        channels,
        priority,
        eventId,
        data,
      );
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Failed to send event notification for event ${eventId}:`, error);
      throw new ValidationError('Failed to send event notification');
    }
  }

  /**
   * Deliver notification via specified channels
   */
  private static async deliverNotification(
    notificationId: string,
    channels: NotificationChannels,
  ) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
            },
          },
        },
      });

      if (!notification) {
        throw new NotFoundError('Notification not found');
      }

      // Check user preferences before sending
      const shouldSendEmail = channels.email
        ? await NotificationPreferenceService.shouldSendNotification(
          notification.userId,
          notification.type,
          'email',
        )
        : false;

      // SMS is disabled in this system - skip SMS delivery
      // const shouldSendSMS = false;

      const shouldSendPush = channels.push
        ? await NotificationPreferenceService.shouldSendNotification(
          notification.userId,
          notification.type,
          'push',
        )
        : false;

      // Deliver via email
      if (shouldSendEmail && notification.user.email) {
        try {
          await this.deliverEmail(notification);
          await prisma.notification.update({
            where: { id: notificationId },
            data: { emailStatus: DeliveryStatus.SENT },
          });
        } catch (error) {
          logger.error(`Failed to send email for notification ${notificationId}:`, error);
          await prisma.notification.update({
            where: { id: notificationId },
            data: { emailStatus: DeliveryStatus.FAILED },
          });
        }
      } else if (channels.email && !shouldSendEmail) {
        // User has disabled email for this category
        await prisma.notification.update({
          where: { id: notificationId },
          data: { emailStatus: DeliveryStatus.FAILED },
        });
      }

      // SMS delivery is disabled - we only use email notifications
      // Mark SMS as not sent if it was requested
      if (channels.sms) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: { smsStatus: DeliveryStatus.FAILED },
        });
        logger.debug(`SMS delivery skipped for notification ${notificationId} - SMS not enabled in this system`);
      }

      // Deliver via push (placeholder - implement when push service is available)
      if (shouldSendPush) {
        try {
          // TODO: Implement push notification delivery
          // await this.deliverPush(notification);
          await prisma.notification.update({
            where: { id: notificationId },
            data: { pushStatus: DeliveryStatus.SENT },
          });
        } catch (error) {
          logger.error(`Failed to send push for notification ${notificationId}:`, error);
          await prisma.notification.update({
            where: { id: notificationId },
            data: { pushStatus: DeliveryStatus.FAILED },
          });
        }
      }

      // In-app is already marked as delivered when notification is created
    } catch (error) {
      logger.error(`Failed to deliver notification ${notificationId}:`, error);
      throw error;
    }
  }

  /**
   * Deliver notification via email
   */
  private static async deliverEmail(notification: {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    user: { email: string; firstName: string | null; lastName: string | null };
  }) {
    try {
      const html = this.getEmailTemplate(notification);
      await emailService.sendEmail({
        to: notification.user.email,
        subject: notification.title,
        html,
        isCritical: false,
      });
    } catch (error) {
      logger.error(`Failed to send email notification ${notification.id}:`, error);
      throw error;
    }
  }

  /**
   * Get email template for notification
   */
  private static getEmailTemplate(notification: {
    type: NotificationType;
    title: string;
    message: string;
    user: { firstName: string | null; lastName: string | null };
  }): string {
    const userName = notification.user.firstName || 'User';
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${notification.title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4a6cf7;">${notification.title}</h1>
            <p>Hello ${userName},</p>
            <div style="background-color: #f5f5f5; border-left: 4px solid #4a6cf7; padding: 15px; margin: 20px 0;">
              ${notification.message.replace(/\n/g, '<br>')}
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated message from EventKnit. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId: string, filters?: NotificationFilters) {
    try {
      const where: Prisma.NotificationWhereInput = {
        userId,
        ...(filters?.type && { type: filters.type }),
        ...(filters?.isRead !== undefined && { isRead: filters.isRead }),
        ...(filters?.priority && { priority: filters.priority }),
        ...(filters?.eventId && { eventId: filters.eventId }),
        ...(filters?.startDate && { createdAt: { gte: filters.startDate } }),
        ...(filters?.endDate && { createdAt: { lte: filters.endDate } }),
      };

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit ?? 50,
        skip: filters?.offset ?? 0,
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      return notifications;
    } catch (error) {
      logger.error(`Failed to get notifications for user ${userId}:`, error);
      throw new ValidationError('Failed to retrieve notifications');
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new NotFoundError('Notification not found');
      }

      if (notification.userId !== userId) {
        throw new ValidationError('Notification does not belong to user');
      }

      if (notification.isRead) {
        return notification;
      }

      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      logger.info(`Notification ${notificationId} marked as read by user ${userId}`);
      return updated;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error(`Failed to mark notification ${notificationId} as read:`, error);
      throw new ValidationError('Failed to mark notification as read');
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      logger.info(`Marked ${result.count} notifications as read for user ${userId}`);
      return result;
    } catch (error) {
      logger.error(`Failed to mark all notifications as read for user ${userId}:`, error);
      throw new ValidationError('Failed to mark all notifications as read');
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new NotFoundError('Notification not found');
      }

      if (notification.userId !== userId) {
        throw new ValidationError('Notification does not belong to user');
      }

      await prisma.notification.delete({
        where: { id: notificationId },
      });

      logger.info(`Notification ${notificationId} deleted by user ${userId}`);
      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error(`Failed to delete notification ${notificationId}:`, error);
      throw new ValidationError('Failed to delete notification');
    }
  }

  /**
   * Get unread notification count for user
   */
  static async getUnreadCount(userId: string) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      return count;
    } catch (error) {
      logger.error(`Failed to get unread count for user ${userId}:`, error);
      throw new ValidationError('Failed to get unread notification count');
    }
  }
}

