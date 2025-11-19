import { prisma } from '../config/database.js';
import { BulkMessageService } from './bulk-message.service.js';
import { EmailTemplateService } from './email-template.service.js';
import { NotificationService } from './notification.service.js';
import { NotificationType, NotificationPriority } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface UnifiedMessageData {
  title: string;
  content: string;
  type: 'campaign' | 'announcement' | 'notification' | 'system';
  targetAudience?: 'all' | 'organizers' | 'attendees' | 'staff' | 'specific_event';
  eventId?: string;
  campaignId?: string;
  templateId?: string;
  channels: {
    email?: boolean;
    push?: boolean;
    inApp?: boolean;
  };
  scheduledAt?: Date | string;
  variables?: Record<string, string | number | boolean>;
}

export class UnifiedMessagingService {
  /**
   * Send unified message across all channels
   * This is the single interface for all outbound communications
   */
  static async sendUnifiedMessage(
    data: UnifiedMessageData,
    createdBy: string,
  ) {
    try {
      let htmlContent = data.content;
      let subject = data.title;

      // If template is provided, render it with variables
      if (data.templateId) {
        const template = await EmailTemplateService.getTemplateById(
          data.templateId,
        );

        if (!template) {
          throw new NotFoundError('Email template not found');
        }

        const rendered = EmailTemplateService.renderTemplate(
          template.htmlContent,
          template.subject || data.title,
          data.variables,
        );

        htmlContent = rendered.html;
        subject = rendered.subject;

        // Increment template usage
        await EmailTemplateService.incrementUsage(data.templateId);
      }

      // Create bulk message record
      const bulkMessage = await BulkMessageService.createBulkMessage(
        {
          title: subject,
          content: htmlContent,
          type: data.type,
          targetAudience: data.targetAudience || 'all',
          eventId: data.eventId,
          channels: {
            email: data.channels.email ?? true,
            sms: false, // SMS disabled
            push: data.channels.push ?? false,
            inApp: data.channels.inApp ?? true,
          },
          scheduledAt: data.scheduledAt,
        },
        createdBy,
      );

      // Update bulk message with campaign and template links
      if (data.campaignId || data.templateId) {
        await prisma.bulkMessage.update({
          where: { id: bulkMessage.id },
          data: {
            ...(data.campaignId && { campaignId: data.campaignId }),
            ...(data.templateId && { templateId: data.templateId }),
          },
        });
      }

      // If not scheduled, send immediately
      if (!data.scheduledAt) {
        await BulkMessageService.sendBulkMessage(bulkMessage.id, createdBy);
      }

      logger.info(
        `Unified message created: ${bulkMessage.id}, type: ${data.type}, campaign: ${data.campaignId || 'none'}`,
      );

      return bulkMessage;
    } catch (error) {
      logger.error('Failed to send unified message:', error);
      throw error;
    }
  }

  /**
   * Send campaign email using template
   */
  static async sendCampaignEmail(
    campaignId: string,
    templateId: string,
    targetAudience: 'all' | 'organizers' | 'attendees' | 'staff' | 'specific_event',
    variables: Record<string, string | number | boolean>,
    eventId?: string,
    scheduledAt?: Date | string,
    createdBy: string,
  ) {
    try {
      return await this.sendUnifiedMessage(
        {
          title: 'Campaign Email',
          content: '', // Will be rendered from template
          type: 'campaign',
          targetAudience,
          eventId,
          campaignId,
          templateId,
          channels: {
            email: true,
            push: false,
            inApp: false,
          },
          scheduledAt,
          variables,
        },
        createdBy,
      );
    } catch (error) {
      logger.error('Failed to send campaign email:', error);
      throw error;
    }
  }

  /**
   * Send announcement using template
   */
  static async sendAnnouncement(
    title: string,
    content: string,
    templateId?: string,
    targetAudience: 'all' | 'organizers' | 'attendees' | 'staff' = 'all',
    campaignId?: string,
    variables?: Record<string, string | number | boolean>,
    scheduledAt?: Date | string,
    createdBy: string,
  ) {
    try {
      return await this.sendUnifiedMessage(
        {
          title,
          content,
          type: 'announcement',
          targetAudience,
          campaignId,
          templateId,
          channels: {
            email: true,
            push: true,
            inApp: true,
          },
          scheduledAt,
          variables,
        },
        createdBy,
      );
    } catch (error) {
      logger.error('Failed to send announcement:', error);
      throw error;
    }
  }

  /**
   * Send system notification
   */
  static async sendSystemNotification(
    title: string,
    message: string,
    targetAudience: 'all' | 'organizers' | 'attendees' | 'staff' = 'all',
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    _createdBy: string,
  ) {
    try {
      // For system notifications, use the notification service directly
      // This ensures they appear in the notification center
      const notificationType = NotificationType.SYSTEM_ANNOUNCEMENT;
      const notificationPriority =
        priority === 'low'
          ? NotificationPriority.LOW
          : priority === 'high'
            ? NotificationPriority.HIGH
            : priority === 'urgent'
              ? NotificationPriority.URGENT
              : NotificationPriority.MEDIUM;

      // Get target users based on audience
      const userIds = await this.getTargetUserIds(targetAudience);

      // Send bulk notification
      await NotificationService.sendBulkNotification(
        userIds,
        notificationType,
        title,
        message,
        {
          email: true,
          sms: false,
          push: true,
          inApp: true,
        },
        notificationPriority,
      );

      logger.info(
        `System notification sent to ${userIds.length} users, audience: ${targetAudience}`,
      );

      return { success: true, recipients: userIds.length };
    } catch (error) {
      logger.error('Failed to send system notification:', error);
      throw error;
    }
  }

  /**
   * Get target user IDs based on audience
   */
  private static async getTargetUserIds(
    targetAudience: 'all' | 'organizers' | 'attendees' | 'staff' | 'specific_event',
    eventId?: string,
  ): Promise<string[]> {
    try {
      let users;

      switch (targetAudience) {
      case 'all':
        users = await prisma.user.findMany({
          where: {
            status: 'ACTIVE',
          },
          select: { id: true },
        });
        break;

      case 'organizers':
        users = await prisma.user.findMany({
          where: {
            status: 'ACTIVE',
            role: 'ORGANIZER',
          },
          select: { id: true },
        });
        break;

      case 'attendees':
        // Get users who have registered for at least one event
        users = await prisma.user.findMany({
          where: {
            status: 'ACTIVE',
            registrations: {
              some: {},
            },
          },
          select: { id: true },
          distinct: ['id'],
        });
        break;

      case 'staff':
        users = await prisma.user.findMany({
          where: {
            status: 'ACTIVE',
            role: {
              in: ['ADMIN_STAFF', 'SUPERADMIN'],
            },
          },
          select: { id: true },
        });
        break;

      case 'specific_event': {
        if (!eventId) {
          throw new ValidationError('Event ID is required for specific event audience');
        }
        // Get users registered for the specific event
        const registrations = await prisma.eventRegistration.findMany({
          where: {
            eventId,
          },
          select: {
            userId: true,
          },
          distinct: ['userId'],
        });
        return registrations.map((r) => r.userId);
      }
      default:
        return [];
      }

      return users.map((u) => u.id);
    } catch (error) {
      logger.error('Failed to get target user IDs:', error);
      throw error;
    }
  }

  /**
   * Track message engagement (opens, clicks)
   */
  static async trackEngagement(
    messageId: string,
    type: 'open' | 'click' | 'unsubscribe',
  ) {
    try {
      const updateData: Record<string, unknown> = {};

      switch (type) {
      case 'open':
        updateData.openedCount = { increment: 1 };
        break;
      case 'click':
        updateData.clickedCount = { increment: 1 };
        break;
      case 'unsubscribe':
        updateData.unsubscribedCount = { increment: 1 };
        break;
      }

      await prisma.bulkMessage.update({
        where: { id: messageId },
        data: updateData,
      });

      logger.info(`Engagement tracked: ${type} for message ${messageId}`);
    } catch (error) {
      logger.error(`Failed to track engagement for message ${messageId}:`, error);
      // Don't throw - engagement tracking is not critical
    }
  }

  /**
   * Get message engagement statistics
   */
  static async getEngagementStats(messageId: string) {
    try {
      const message = await prisma.bulkMessage.findUnique({
        where: { id: messageId },
        select: {
          id: true,
          title: true,
          totalRecipients: true,
          sentCount: true,
          openedCount: true,
          clickedCount: true,
          unsubscribedCount: true,
          sentAt: true,
        },
      });

      if (!message) {
        throw new NotFoundError('Bulk message not found');
      }

      const openRate =
        message.sentCount > 0
          ? (message.openedCount / message.sentCount) * 100
          : 0;
      const clickRate =
        message.sentCount > 0
          ? (message.clickedCount / message.sentCount) * 100
          : 0;
      const unsubscribeRate =
        message.sentCount > 0
          ? (message.unsubscribedCount / message.sentCount) * 100
          : 0;

      return {
        messageId: message.id,
        title: message.title,
        totalRecipients: message.totalRecipients,
        sentCount: message.sentCount,
        openedCount: message.openedCount,
        clickedCount: message.clickedCount,
        unsubscribedCount: message.unsubscribedCount,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        unsubscribeRate: Math.round(unsubscribeRate * 100) / 100,
        sentAt: message.sentAt,
      };
    } catch (error) {
      logger.error(`Failed to get engagement stats for message ${messageId}:`, error);
      throw error;
    }
  }
}

