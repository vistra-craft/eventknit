import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { NotificationType } from '@prisma/client';
import { AdminNotificationSettingsService } from './admin-notification-settings.service.js';

export interface NotificationChannels {
  email?: boolean;
  sms?: boolean;
  push?: boolean;
  inApp?: boolean;
}

export interface NotificationPreferenceData {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  pushEnabled?: boolean;
  inAppEnabled?: boolean;
  eventReminders?: boolean;
  eventUpdates?: boolean;
  eventCancellations?: boolean;
  paymentNotifications?: boolean;
  marketingEmails?: boolean;
  systemAnnouncements?: boolean;
  registrationUpdates?: boolean;
  staffNotifications?: boolean;
  reminderFrequency?: 'all' | 'daily_digest' | 'weekly_digest' | 'none';
}

export class NotificationPreferenceService {
  /**
   * Get user notification preferences
   * Creates default preferences if they don't exist
   */
  static async getUserPreferences(userId: string) {
    try {
      let preferences = await prisma.notificationPreference.findUnique({
        where: { userId },
      });

      // Create default preferences if they don't exist
      if (!preferences) {
        preferences = await this.createDefaultPreferences(userId);
      }

      // Ensure SMS is always disabled (we don't use SMS in this system)
      if (preferences.smsEnabled) {
        preferences = await prisma.notificationPreference.update({
          where: { userId },
          data: { smsEnabled: false },
        });
      }

      return preferences;
    } catch (error) {
      logger.error(`Failed to get notification preferences for user ${userId}:`, error);
      throw new ValidationError('Failed to retrieve notification preferences');
    }
  }

  /**
   * Create default notification preferences for a user
   * Uses system-wide default preferences if configured, otherwise uses hardcoded defaults
   */
  static async createDefaultPreferences(userId: string) {
    try {
      // Get system default preferences
      let defaultPrefs;
      try {
        defaultPrefs = await AdminNotificationSettingsService.getDefaultPreferences();
      } catch (error) {
        // If system defaults not available, use hardcoded defaults
        logger.warn('Failed to get system default preferences, using hardcoded defaults');
        defaultPrefs = {
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
          reminderFrequency: 'all' as const,
        };
      }

      const preferences = await prisma.notificationPreference.create({
        data: {
          userId,
          ...defaultPrefs,
        },
      });

      logger.info(`Created default notification preferences for user ${userId}`);
      return preferences;
    } catch (error) {
      logger.error(`Failed to create default notification preferences for user ${userId}:`, error);
      throw new ValidationError('Failed to create notification preferences');
    }
  }

  /**
   * Update user notification preferences
   */
  static async updatePreferences(userId: string, data: NotificationPreferenceData) {
    try {
      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Get or create preferences
      const existingPreferences = await prisma.notificationPreference.findUnique({
        where: { userId },
      });

      // SMS can be enabled if user opts in and SMS service is configured
      // Default to false, but allow users to enable it
      const smsEnabled = data.smsEnabled ?? existingPreferences?.smsEnabled ?? false;

      const preferences = existingPreferences
        ? await prisma.notificationPreference.update({
          where: { userId },
          data: {
            emailEnabled: data.emailEnabled ?? existingPreferences.emailEnabled,
            smsEnabled, // Always false - SMS not used
            pushEnabled: data.pushEnabled ?? existingPreferences.pushEnabled,
            inAppEnabled: data.inAppEnabled ?? existingPreferences.inAppEnabled,
            eventReminders: data.eventReminders ?? existingPreferences.eventReminders,
            eventUpdates: data.eventUpdates ?? existingPreferences.eventUpdates,
            eventCancellations:
                data.eventCancellations ?? existingPreferences.eventCancellations,
            paymentNotifications:
                data.paymentNotifications ?? existingPreferences.paymentNotifications,
            marketingEmails: data.marketingEmails ?? existingPreferences.marketingEmails,
            systemAnnouncements:
                data.systemAnnouncements ?? existingPreferences.systemAnnouncements,
            registrationUpdates:
                data.registrationUpdates ?? existingPreferences.registrationUpdates,
            staffNotifications:
                data.staffNotifications ?? existingPreferences.staffNotifications,
            reminderFrequency:
                data.reminderFrequency ?? existingPreferences.reminderFrequency,
          },
        })
        : await this.createDefaultPreferences(userId);

      logger.info(`Updated notification preferences for user ${userId}`);
      return preferences;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Failed to update notification preferences for user ${userId}:`, error);
      throw new ValidationError('Failed to update notification preferences');
    }
  }

  /**
   * Check if notification should be sent based on user preferences
   */
  static async shouldSendNotification(
    userId: string,
    notificationType: NotificationType,
    channel: 'email' | 'sms' | 'push' | 'inApp',
  ): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);

      // Check channel preference
      switch (channel) {
      case 'email':
        if (!preferences.emailEnabled) {
          return false;
        }
        break;
      case 'sms':
        // Check if SMS is enabled in system and user preferences
        if (!preferences.smsEnabled) {
          return false;
        }
        // Also check if SMS service is enabled globally
        const { smsService } = await import('./sms.service.js');
        if (!smsService.isEnabled()) {
          return false;
        }
        break;
      case 'push':
        if (!preferences.pushEnabled) {
          return false;
        }
        break;
      case 'inApp':
        if (!preferences.inAppEnabled) {
          return false;
        }
        break;
      }

      // Check category preferences based on notification type
      const categoryAllowed = this.isCategoryAllowed(notificationType, preferences);
      if (!categoryAllowed) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error(
        `Failed to check notification preference for user ${userId}, type ${notificationType}, channel ${channel}:`,
        error,
      );
      // Default to allowing notification if preference check fails
      return true;
    }
  }

  /**
   * Check if notification category is allowed based on type
   */
  private static isCategoryAllowed(
    notificationType: NotificationType,
    preferences: {
      eventReminders: boolean;
      eventUpdates: boolean;
      eventCancellations: boolean;
      paymentNotifications: boolean;
      marketingEmails: boolean;
      systemAnnouncements: boolean;
      registrationUpdates: boolean;
      staffNotifications: boolean;
    },
  ): boolean {
    // Event reminders
    const reminderTypes: NotificationType[] = [
      NotificationType.EVENT_REMINDER_24H,
      NotificationType.EVENT_REMINDER_1H,
      NotificationType.EVENT_REMINDER_FOR_STAFF,
      NotificationType.REGISTRATION_DEADLINE_REMINDER,
    ];
    if (reminderTypes.includes(notificationType)) {
      return preferences.eventReminders;
    }

    // Event updates
    const updateTypes: NotificationType[] = [
      NotificationType.EVENT_UPDATE,
      NotificationType.EVENT_VENUE_CHANGED,
      NotificationType.EVENT_TIME_CHANGED,
      NotificationType.EVENT_POSTPONED,
      NotificationType.EVENT_UPDATE_FOR_STAFF,
    ];
    if (updateTypes.includes(notificationType)) {
      return preferences.eventUpdates;
    }

    // Event cancellations
    const cancellationTypes: NotificationType[] = [
      NotificationType.EVENT_CANCELLED,
      NotificationType.EVENT_CANCELLED_BY_ADMIN,
      NotificationType.EVENT_CANCELLED_FOR_STAFF,
    ];
    if (cancellationTypes.includes(notificationType)) {
      return preferences.eventCancellations;
    }

    // Payment notifications
    const paymentTypes: NotificationType[] = [
      NotificationType.PAYMENT_PENDING,
      NotificationType.PAYMENT_FAILED,
      NotificationType.PAYMENT_SUCCESS,
      NotificationType.PAYMENT_RECEIVED,
      NotificationType.REFUND_RECEIVED,
      NotificationType.REFUND_PROCESSED,
    ];
    if (paymentTypes.includes(notificationType)) {
      return preferences.paymentNotifications;
    }

    // Registration updates
    const registrationTypes: NotificationType[] = [
      NotificationType.REGISTRATION_CONFIRMED,
      NotificationType.REGISTRATION_CANCELLED,
      NotificationType.WAITLIST_AVAILABLE,
    ];
    if (registrationTypes.includes(notificationType)) {
      return preferences.registrationUpdates;
    }

    // Staff notifications
    const staffTypes: NotificationType[] = [
      NotificationType.STAFF_ASSIGNED_TO_EVENT,
      NotificationType.STAFF_REMOVED_FROM_EVENT,
      NotificationType.STAFF_ASSIGNMENT_UPDATED,
    ];
    if (staffTypes.includes(notificationType)) {
      return preferences.staffNotifications;
    }

    // Marketing
    const marketingTypes: NotificationType[] = [
      NotificationType.NEW_EVENT_AVAILABLE,
      NotificationType.PROMOTION_OFFER,
      NotificationType.EARLY_BIRD_REMINDER,
    ];
    if (marketingTypes.includes(notificationType)) {
      return preferences.marketingEmails;
    }

    // System announcements
    const systemTypes: NotificationType[] = [
      NotificationType.SYSTEM_ANNOUNCEMENT,
      NotificationType.PLATFORM_UPDATE,
      NotificationType.MAINTENANCE_SCHEDULED,
      NotificationType.SECURITY_ALERT,
    ];
    if (systemTypes.includes(notificationType)) {
      return preferences.systemAnnouncements;
    }

    // Account-related notifications are always allowed (security)
    const accountTypes: NotificationType[] = [
      NotificationType.ACCOUNT_VERIFIED,
      NotificationType.PASSWORD_CHANGED,
      NotificationType.LOGIN_ATTEMPT,
      NotificationType.ACCOUNT_SUSPENDED,
      NotificationType.ACCOUNT_ACTIVATED,
    ];
    if (accountTypes.includes(notificationType)) {
      return true; // Always allow security-related notifications
    }

    // Event-related organizer notifications are always allowed
    const organizerTypes: NotificationType[] = [
      NotificationType.EVENT_APPROVED,
      NotificationType.EVENT_REJECTED,
      NotificationType.REGISTRATION_MILESTONE_50,
      NotificationType.REGISTRATION_MILESTONE_75,
      NotificationType.REGISTRATION_MILESTONE_100,
      NotificationType.CAPACITY_REACHED,
      NotificationType.EVENT_PERFORMANCE_SUMMARY,
    ];
    if (organizerTypes.includes(notificationType)) {
      return true; // Always allow important organizer notifications
    }

    // Default to allowing if type doesn't match any category
    return true;
  }

  /**
   * Get default notification preferences
   * Note: SMS is disabled by default as we only use email notifications
   */
  static getDefaultPreferences() {
    return {
      emailEnabled: true,
      smsEnabled: false, // SMS not used in this system
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
      reminderFrequency: 'all' as const,
    };
  }
}

