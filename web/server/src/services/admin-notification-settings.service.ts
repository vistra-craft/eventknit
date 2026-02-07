import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export interface DefaultNotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  eventReminders: boolean;
  eventUpdates: boolean;
  eventCancellations: boolean;
  paymentNotifications: boolean;
  marketingEmails: boolean;
  systemAnnouncements: boolean;
  registrationUpdates: boolean;
  staffNotifications: boolean;
  reminderFrequency: 'all' | 'daily_digest' | 'weekly_digest' | 'none';
}

export interface SystemNotificationConfig {
  smsEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  defaultReminderTime: number; // Hours before event (default: 24)
  defaultDeadlineReminderTime: number; // Hours before deadline (default: 24)
  maxNotificationsPerUser: number; // Max notifications to keep per user (default: 1000)
  notificationRetentionDays: number; // Days to keep notifications (default: 90)
}

export interface NotificationTemplate {
  id: string;
  type: string;
  subject: string;
  body: string;
  variables: string[]; // Available template variables
}

export class AdminNotificationSettingsService {
  private static readonly DEFAULT_PREFERENCES_KEY = 'default.preferences';
  private static readonly SYSTEM_CONFIG_KEY = 'system.config';
  private static readonly TEMPLATES_KEY_PREFIX = 'template.';

  /**
   * Get default notification preferences for new users
   */
  static async getDefaultPreferences(): Promise<DefaultNotificationPreferences> {
    try {
      const setting = await prisma.systemNotificationSettings.findUnique({
        where: { key: this.DEFAULT_PREFERENCES_KEY },
      });

      if (!setting) {
        // Return system defaults if not set
        return {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          inAppEnabled: true,
          eventReminders: true,
          eventUpdates: true,
          eventCancellations: true,
          paymentNotifications: true,
          marketingEmails: true,
          systemAnnouncements: true,
          registrationUpdates: true,
          staffNotifications: true,
          reminderFrequency: 'all',
        };
      }

      return JSON.parse(setting.value) as DefaultNotificationPreferences;
    } catch (error) {
      logger.error('Failed to get default preferences:', error);
      throw new ValidationError('Failed to retrieve default notification preferences');
    }
  }

  /**
   * Update default notification preferences
   */
  static async updateDefaultPreferences(
    preferences: Partial<DefaultNotificationPreferences>,
    updatedBy: string,
  ): Promise<DefaultNotificationPreferences> {
    try {
      const current = await this.getDefaultPreferences();
      const updated = { ...current, ...preferences };

      await prisma.systemNotificationSettings.upsert({
        where: { key: this.DEFAULT_PREFERENCES_KEY },
        create: {
          key: this.DEFAULT_PREFERENCES_KEY,
          value: JSON.stringify(updated),
          category: 'defaults',
          description: 'Default notification preferences for new users',
          updatedBy,
        },
        update: {
          value: JSON.stringify(updated),
          updatedBy,
          updatedAt: new Date(),
        },
      });

      logger.info(`Default notification preferences updated by user: ${updatedBy}`);
      return updated;
    } catch (error) {
      logger.error('Failed to update default preferences:', error);
      throw new ValidationError('Failed to update default notification preferences');
    }
  }

  /**
   * Get system-wide notification configuration
   */
  static async getSystemConfig(): Promise<SystemNotificationConfig> {
    try {
      const setting = await prisma.systemNotificationSettings.findUnique({
        where: { key: this.SYSTEM_CONFIG_KEY },
      });

      if (!setting) {
        // Return system defaults if not set
        return {
          smsEnabled: false,
          emailEnabled: true,
          pushEnabled: true,
          inAppEnabled: true,
          defaultReminderTime: 24,
          defaultDeadlineReminderTime: 24,
          maxNotificationsPerUser: 1000,
          notificationRetentionDays: 90,
        };
      }

      return JSON.parse(setting.value) as SystemNotificationConfig;
    } catch (error) {
      logger.error('Failed to get system config:', error);
      throw new ValidationError('Failed to retrieve system notification configuration');
    }
  }

  /**
   * Update system-wide notification configuration
   */
  static async updateSystemConfig(
    config: Partial<SystemNotificationConfig>,
    updatedBy: string,
  ): Promise<SystemNotificationConfig> {
    try {
      const current = await this.getSystemConfig();
      const updated = { ...current, ...config };

      // Validate values
      if (updated.defaultReminderTime && updated.defaultReminderTime < 0) {
        throw new ValidationError('Default reminder time must be non-negative');
      }
      if (updated.maxNotificationsPerUser && updated.maxNotificationsPerUser < 1) {
        throw new ValidationError('Max notifications per user must be at least 1');
      }
      if (updated.notificationRetentionDays && updated.notificationRetentionDays < 1) {
        throw new ValidationError('Notification retention days must be at least 1');
      }

      await prisma.systemNotificationSettings.upsert({
        where: { key: this.SYSTEM_CONFIG_KEY },
        create: {
          key: this.SYSTEM_CONFIG_KEY,
          value: JSON.stringify(updated),
          category: 'system',
          description: 'System-wide notification configuration',
          updatedBy,
        },
        update: {
          value: JSON.stringify(updated),
          updatedBy,
          updatedAt: new Date(),
        },
      });

      logger.info(`System notification config updated by user: ${updatedBy}`);
      return updated;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error('Failed to update system config:', error);
      throw new ValidationError('Failed to update system notification configuration');
    }
  }

  /**
   * Get all notification templates
   */
  static async getTemplates(): Promise<NotificationTemplate[]> {
    try {
      const settings = await prisma.systemNotificationSettings.findMany({
        where: {
          key: {
            startsWith: this.TEMPLATES_KEY_PREFIX,
          },
        },
      });

      return settings.map((setting) => {
        const template = JSON.parse(setting.value) as Omit<NotificationTemplate, 'id'>;
        return {
          id: setting.id,
          ...template,
        };
      });
    } catch (error) {
      logger.error('Failed to get templates:', error);
      throw new ValidationError('Failed to retrieve notification templates');
    }
  }

  /**
   * Get a specific notification template by type
   */
  static async getTemplate(type: string): Promise<NotificationTemplate | null> {
    try {
      const setting = await prisma.systemNotificationSettings.findUnique({
        where: { key: `${this.TEMPLATES_KEY_PREFIX}${type}` },
      });

      if (!setting) {
        return null;
      }

      const template = JSON.parse(setting.value) as Omit<NotificationTemplate, 'id'>;
      return {
        id: setting.id,
        ...template,
      };
    } catch (error) {
      logger.error(`Failed to get template ${type}:`, error);
      throw new ValidationError(`Failed to retrieve notification template: ${type}`);
    }
  }

  /**
   * Create or update a notification template
   */
  static async saveTemplate(
    type: string,
    template: Omit<NotificationTemplate, 'id' | 'type'>,
    updatedBy: string,
  ): Promise<NotificationTemplate> {
    try {
      if (!template.subject || !template.body) {
        throw new ValidationError('Template subject and body are required');
      }

      const templateData = {
        type,
        ...template,
      };

      const setting = await prisma.systemNotificationSettings.upsert({
        where: { key: `${this.TEMPLATES_KEY_PREFIX}${type}` },
        create: {
          key: `${this.TEMPLATES_KEY_PREFIX}${type}`,
          value: JSON.stringify(templateData),
          category: 'templates',
          description: `Notification template for ${type}`,
          updatedBy,
        },
        update: {
          value: JSON.stringify(templateData),
          updatedBy,
          updatedAt: new Date(),
        },
      });

      logger.info(`Notification template ${type} saved by user: ${updatedBy}`);
      return {
        id: setting.id,
        ...templateData,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error(`Failed to save template ${type}:`, error);
      throw new ValidationError(`Failed to save notification template: ${type}`);
    }
  }

  /**
   * Delete a notification template
   */
  static async deleteTemplate(type: string): Promise<void> {
    try {
      const setting = await prisma.systemNotificationSettings.findUnique({
        where: { key: `${this.TEMPLATES_KEY_PREFIX}${type}` },
      });

      if (!setting) {
        throw new NotFoundError(`Notification template not found: ${type}`);
      }

      await prisma.systemNotificationSettings.delete({
        where: { id: setting.id },
      });

      logger.info(`Notification template ${type} deleted`);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Failed to delete template ${type}:`, error);
      throw new ValidationError(`Failed to delete notification template: ${type}`);
    }
  }

  /**
   * Get notification analytics summary
   */
  static async getAnalyticsSummary(period: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    byChannel: {
      email: { sent: number; delivered: number; failed: number };
      sms: { sent: number; delivered: number; failed: number };
      push: { sent: number; delivered: number; failed: number };
      inApp: { sent: number; delivered: number; failed: number };
    };
    byType: Record<string, { sent: number; delivered: number; failed: number }>;
    deliveryRate: number;
    failureRate: number;
  }> {
    try {
      const now = new Date();
      const startDate = new Date();
      
      switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      }

      // Get all notifications in the period
      const notifications = await prisma.notification.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          type: true,
          channels: true,
          emailStatus: true,
          smsStatus: true,
          pushStatus: true,
          inAppStatus: true,
        },
      });

      const totalSent = notifications.length;
      let totalDelivered = 0;
      let totalFailed = 0;

      const byChannel = {
        email: { sent: 0, delivered: 0, failed: 0 },
        sms: { sent: 0, delivered: 0, failed: 0 },
        push: { sent: 0, delivered: 0, failed: 0 },
        inApp: { sent: 0, delivered: 0, failed: 0 },
      };

      const byType: Record<string, { sent: number; delivered: number; failed: number }> = {};

      for (const notification of notifications) {
        const channels = notification.channels as {
          email?: boolean;
          sms?: boolean;
          push?: boolean;
          inApp?: boolean;
        };

        // Track by channel
        if (channels.email) {
          byChannel.email.sent++;
          if (notification.emailStatus === 'DELIVERED') {
            byChannel.email.delivered++;
            totalDelivered++;
          } else if (notification.emailStatus === 'FAILED') {
            byChannel.email.failed++;
            totalFailed++;
          }
        }
        if (channels.sms) {
          byChannel.sms.sent++;
          if (notification.smsStatus === 'DELIVERED') {
            byChannel.sms.delivered++;
            totalDelivered++;
          } else if (notification.smsStatus === 'FAILED') {
            byChannel.sms.failed++;
            totalFailed++;
          }
        }
        if (channels.push) {
          byChannel.push.sent++;
          if (notification.pushStatus === 'DELIVERED') {
            byChannel.push.delivered++;
            totalDelivered++;
          } else if (notification.pushStatus === 'FAILED') {
            byChannel.push.failed++;
            totalFailed++;
          }
        }
        if (channels.inApp) {
          byChannel.inApp.sent++;
          if (notification.inAppStatus === 'DELIVERED') {
            byChannel.inApp.delivered++;
            totalDelivered++;
          } else if (notification.inAppStatus === 'FAILED') {
            byChannel.inApp.failed++;
            totalFailed++;
          }
        }

        // Track by type
        const type = notification.type;
        if (!byType[type]) {
          byType[type] = { sent: 0, delivered: 0, failed: 0 };
        }
        byType[type].sent++;
        // Count as delivered if at least one channel delivered
        if (
          notification.emailStatus === 'DELIVERED' ||
          notification.smsStatus === 'DELIVERED' ||
          notification.pushStatus === 'DELIVERED' ||
          notification.inAppStatus === 'DELIVERED'
        ) {
          byType[type].delivered++;
        }
        // Count as failed if all channels failed
        if (
          (channels.email && notification.emailStatus === 'FAILED') ||
          (channels.sms && notification.smsStatus === 'FAILED') ||
          (channels.push && notification.pushStatus === 'FAILED') ||
          (channels.inApp && notification.inAppStatus === 'FAILED')
        ) {
          byType[type].failed++;
        }
      }

      const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
      const failureRate = totalSent > 0 ? (totalFailed / totalSent) * 100 : 0;

      return {
        totalSent,
        totalDelivered,
        totalFailed,
        byChannel,
        byType,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        failureRate: Math.round(failureRate * 100) / 100,
      };
    } catch (error) {
      logger.error('Failed to get analytics summary:', error);
      throw new ValidationError('Failed to retrieve notification analytics');
    }
  }

  /**
   * Apply default preferences to a new user
   */
  static async applyDefaultPreferencesToUser(userId: string): Promise<void> {
    try {
      const defaults = await this.getDefaultPreferences();

      await prisma.notificationPreference.upsert({
        where: { userId },
        create: {
          userId,
          ...defaults,
        },
        update: {
          // Only update if user hasn't customized their preferences
          // This allows users to override defaults
        },
      });

      logger.debug(`Applied default notification preferences to user: ${userId}`);
    } catch (error) {
      logger.error(`Failed to apply default preferences to user ${userId}:`, error);
      // Don't throw - this is not critical
    }
  }
}





