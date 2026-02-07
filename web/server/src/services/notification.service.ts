import { prisma } from '../config/database.js';
import {
  NotificationType,
  NotificationPriority,
  DeliveryStatus,
  Prisma,
} from '@prisma/client';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { emailService } from './email.service.js';
import { smsService } from './sms.service.js';
import { pushNotificationService } from './push-notification.service.js';
import { NotificationPreferenceService, NotificationChannels } from './notification-preference.service.js';
import { websocketService } from './websocket.service.js';

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

      // Send real-time notification via WebSocket if in-app channel is enabled
      if (channels.inApp) {
        try {
          websocketService.sendNotification(data.userId, {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            createdAt: notification.createdAt,
            eventId: notification.eventId,
            isRead: notification.isRead,
          });
        } catch (error) {
          logger.error(`Failed to send WebSocket notification ${notification.id}:`, error);
        }
      }

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
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              venue: true,
              location: true,
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

      // Check SMS preferences and deliver via SMS if enabled
      const shouldSendSMS = channels.sms
        ? await NotificationPreferenceService.shouldSendNotification(
          notification.userId,
          notification.type,
          'sms',
        )
        : false;

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
          // Check if notification still exists before updating (might be deleted during test cleanup)
          const existingNotification = await prisma.notification.findUnique({
            where: { id: notificationId },
          });
          if (existingNotification) {
            await prisma.notification.update({
              where: { id: notificationId },
              data: { emailStatus: DeliveryStatus.SENT },
            });
          }
        } catch (error) {
          logger.error(`Failed to send email for notification ${notificationId}:`, error);
          // Check if notification still exists before updating
          const existingNotification = await prisma.notification.findUnique({
            where: { id: notificationId },
          });
          if (existingNotification) {
            await prisma.notification.update({
              where: { id: notificationId },
              data: { emailStatus: DeliveryStatus.FAILED },
            });
          }
        }
      } else if (channels.email && !shouldSendEmail) {
        // User has disabled email for this category
        // Check if notification still exists before updating
        const existingNotification = await prisma.notification.findUnique({
          where: { id: notificationId },
        });
        if (existingNotification) {
          await prisma.notification.update({
            where: { id: notificationId },
            data: { emailStatus: DeliveryStatus.FAILED },
          });
        }
      }

      // Deliver via SMS
      if (shouldSendSMS && notification.user.phoneNumber && smsService.isEnabled()) {
        try {
          await this.deliverSMS(notification);
          // Check if notification still exists before updating
          const existingNotification = await prisma.notification.findUnique({
            where: { id: notificationId },
          });
          if (existingNotification) {
            await prisma.notification.update({
              where: { id: notificationId },
              data: { smsStatus: DeliveryStatus.SENT },
            });
          }
        } catch (error) {
          logger.error(`Failed to send SMS for notification ${notificationId}:`, error);
          // Check if notification still exists before updating
          const existingNotification = await prisma.notification.findUnique({
            where: { id: notificationId },
          });
          if (existingNotification) {
            await prisma.notification.update({
              where: { id: notificationId },
              data: { smsStatus: DeliveryStatus.FAILED },
            });
          }
        }
      } else if (channels.sms && !shouldSendSMS) {
        // User has disabled SMS for this category or SMS service not enabled
        const existingNotification = await prisma.notification.findUnique({
          where: { id: notificationId },
        });
        if (existingNotification) {
          await prisma.notification.update({
            where: { id: notificationId },
            data: { smsStatus: DeliveryStatus.FAILED },
          });
        }
      } else if (channels.sms && !notification.user.phoneNumber) {
        // SMS requested but user has no phone number
        const existingNotification = await prisma.notification.findUnique({
          where: { id: notificationId },
        });
        if (existingNotification) {
          await prisma.notification.update({
            where: { id: notificationId },
            data: { smsStatus: DeliveryStatus.FAILED },
          });
          logger.debug(`SMS delivery skipped for notification ${notificationId} - user has no phone number`);
        }
      }

      // Deliver via push notification service
      if (shouldSendPush) {
        try {
          const pushResult = await pushNotificationService.sendToUser(notification.userId, {
            title: notification.title,
            body: notification.message,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: notification.type,
            data: {
              notificationId: notification.id,
              type: notification.type,
              eventId: notification.eventId || undefined,
              registrationId: notification.registrationId || undefined,
              url: notification.data && typeof notification.data === 'object' && 'url' in notification.data
                ? (notification.data as { url?: string }).url
                : '/',
            },
          });

          // Check if notification still exists before updating
          const existingNotification = await prisma.notification.findUnique({
            where: { id: notificationId },
          });
          if (existingNotification) {
            await prisma.notification.update({
              where: { id: notificationId },
              data: {
                pushStatus: pushResult.sent > 0 ? DeliveryStatus.SENT : DeliveryStatus.FAILED,
              },
            });
          }
        } catch (error) {
          logger.error(`Failed to send push for notification ${notificationId}:`, error);
          // Check if notification still exists before updating
          const existingNotification = await prisma.notification.findUnique({
            where: { id: notificationId },
          });
          if (existingNotification) {
            await prisma.notification.update({
              where: { id: notificationId },
              data: { pushStatus: DeliveryStatus.FAILED },
            });
          }
        }
      }

      // In-app is already marked as delivered when notification is created
    } catch (error) {
      logger.error(`Failed to deliver notification ${notificationId}:`, error);
      throw error;
    }
  }

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
   * Deliver notification via SMS
   */
  private static async deliverSMS(notification: {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    user: { phoneNumber: string | null };
    data?: Prisma.JsonValue;
    event?: { title: string; startDate: Date; venue: string | null; location: string } | null;
  }) {
    try {
      if (!notification.user.phoneNumber) {
        throw new ValidationError('User phone number is required for SMS delivery');
      }

      const smsMessage = this.getSMSTemplate(notification);
      const result = await smsService.sendSMS({
        to: notification.user.phoneNumber,
        message: smsMessage,
        isCritical: this.isCriticalNotification(notification.type),
      });

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to send SMS');
      }
    } catch (error) {
      logger.error(`Failed to send SMS notification ${notification.id}:`, error);
      throw error;
    }
  }

  /**
   * Get SMS template for notification (concise format for SMS)
   */
  private static getSMSTemplate(notification: {
    type: NotificationType;
    title: string;
    message: string;
    data?: Prisma.JsonValue;
    event?: { title: string; startDate: Date; venue: string | null; location: string } | null;
  }): string {
    // Extract data if available
    const data = notification.data as Record<string, unknown> | undefined;
    const event = notification.event;

    // Generate concise SMS message based on notification type
    switch (notification.type) {
    case NotificationType.EVENT_REMINDER_24H:
    case NotificationType.EVENT_REMINDER_1H:
    case NotificationType.EVENT_REMINDER_FOR_STAFF: {
      if (event) {
        const date = new Date(event.startDate).toLocaleDateString();
        const time = new Date(event.startDate).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });
        let msg = `Reminder: ${event.title} on ${date} at ${time}`;
        if (event.venue) {
          msg += `. Venue: ${event.venue}`;
        }
        return msg;
      }
      return notification.message;
    }

    case NotificationType.EVENT_CANCELLED:
      return event
        ? `URGENT: ${event.title} has been CANCELLED. Check email for details.`
        : `URGENT: Event cancelled. ${notification.message}`;

    case NotificationType.EVENT_POSTPONED:
      return event
        ? `URGENT: ${event.title} has been POSTPONED. Check email for new date.`
        : `URGENT: Event postponed. ${notification.message}`;

    case NotificationType.EVENT_VENUE_CHANGED:
      return event
        ? `URGENT: ${event.title} venue changed. Check email for new location.`
        : `URGENT: Venue changed. ${notification.message}`;

    case NotificationType.EVENT_TIME_CHANGED:
      return event
        ? `URGENT: ${event.title} time changed. Check email for new time.`
        : `URGENT: Time changed. ${notification.message}`;

    case NotificationType.PAYMENT_SUCCESS: {
      const amount = data?.amount as number | undefined;
      const currency = (data?.currency as string) || 'NGN';
      return amount
        ? `Payment confirmed: ${currency} ${amount.toFixed(2)}. Your ticket is confirmed!`
        : notification.message;
    }

    case NotificationType.PAYMENT_FAILED:
      return 'Payment failed. Please try again or contact support.';

    case NotificationType.REGISTRATION_CONFIRMED:
      return event
        ? `Registration confirmed for ${event.title}. See you there!`
        : notification.message;

    case NotificationType.WAITLIST_AVAILABLE:
      return event
        ? `Spot available for ${event.title}! You have 24h to register. Visit EventKnit now.`
        : notification.message;

    case NotificationType.REFUND_RECEIVED: {
      const refundAmount = data?.amount as number | undefined;
      const refundCurrency = (data?.currency as string) || 'NGN';
      return refundAmount
        ? `Refund processed: ${refundCurrency} ${refundAmount.toFixed(2)}. Check your account.`
        : notification.message;
    }

    case NotificationType.REGISTRATION_DEADLINE_24H:
    case NotificationType.REGISTRATION_DEADLINE_1H:
      return event
        ? `Last chance! Registration for ${event.title} closes soon. Register now!`
        : notification.message;

    case NotificationType.SECURITY_ALERT:
      return `Security Alert: ${notification.message}. If this wasn't you, secure your account.`;

    case NotificationType.LOGIN_ATTEMPT: {
      const location = data?.location as string | undefined;
      return location
        ? `Login attempt from ${location}. If this wasn't you, secure your account.`
        : 'Login attempt detected. If this wasn\'t you, secure your account.';
    }

    default:
      // Generic SMS message - truncate if too long
      return notification.message.length > 160
        ? `${notification.message.substring(0, 157)  }...`
        : notification.message;
    }
  }

  /**
   * Check if notification type is critical (affects retry behavior)
   */
  private static isCriticalNotification(type: NotificationType): boolean {
    const criticalTypes: string[] = [
      NotificationType.EVENT_CANCELLED,
      NotificationType.EVENT_POSTPONED,
      NotificationType.EVENT_VENUE_CHANGED,
      NotificationType.EVENT_TIME_CHANGED,
      NotificationType.PAYMENT_FAILED,
      NotificationType.SECURITY_ALERT,
      NotificationType.LOGIN_ATTEMPT,
      NotificationType.WAITLIST_AVAILABLE,
      NotificationType.REGISTRATION_DEADLINE_1H,
    ];
    return criticalTypes.includes(type as string);
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
        throw new AuthorizationError('You do not have permission to access this notification');
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

      // Notify via WebSocket
      try {
        websocketService.notifyNotificationRead(userId, notificationId);
        // Also send updated unread count
        const unreadCount = await this.getUnreadCount(userId);
        websocketService.sendUnreadCountUpdate(userId, unreadCount);
      } catch (error) {
        logger.error('Failed to send WebSocket notification for read status:', error);
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof AuthorizationError) {
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

      // Notify via WebSocket
      try {
        websocketService.notifyAllNotificationsRead(userId);
        // Also send updated unread count (should be 0)
        websocketService.sendUnreadCountUpdate(userId, 0);
      } catch (error) {
        logger.error('Failed to send WebSocket notification for all read:', error);
      }

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
        throw new AuthorizationError('You do not have permission to delete this notification');
      }

      await prisma.notification.delete({
        where: { id: notificationId },
      });

      logger.info(`Notification ${notificationId} deleted by user ${userId}`);

      // Notify via WebSocket
      try {
        websocketService.notifyNotificationDeleted(userId, notificationId);
        // Also send updated unread count
        const unreadCount = await this.getUnreadCount(userId);
        websocketService.sendUnreadCountUpdate(userId, unreadCount);
      } catch (error) {
        logger.error('Failed to send WebSocket notification for deletion:', error);
      }

      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof AuthorizationError) {
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

