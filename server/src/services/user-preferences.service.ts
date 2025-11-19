import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { UserRole } from '@prisma/client';

export interface UserPreferencesData {
  // Appearance
  theme?: 'light' | 'dark' | 'system';
  primaryColor?: string;
  dashboardLayout?: 'compact' | 'spacious';
  showMetrics?: boolean;
  showCharts?: boolean;
  language?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';

  // Privacy
  profileVisibility?: 'public' | 'private' | 'friends';
  showEmail?: boolean;
  showPhone?: boolean;
  allowMessages?: boolean;

  // Account
  sessionTimeout?: number; // minutes
  loginAlerts?: boolean;
  twoFactorAuth?: boolean;

  // Organizer-specific
  eventNotifications?: boolean;
  registrationNotifications?: boolean;
  paymentNotifications?: boolean;
  marketingEmails?: boolean;
  weeklyDigest?: boolean;

  // Attendee-specific
  eventReminders?: boolean;
  eventUpdates?: boolean;
  promotionalOffers?: boolean;
}

export interface UserPreferences extends UserPreferencesData {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserPreferencesService {
  /**
   * Get default preferences based on user role
   */
  private static getDefaultPreferences(role?: UserRole): UserPreferencesData {
    const baseDefaults: UserPreferencesData = {
      // Appearance
      theme: 'system',
      dashboardLayout: 'spacious',
      showMetrics: true,
      showCharts: true,
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',

      // Privacy
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
      allowMessages: true,

      // Account
      sessionTimeout: 30,
      loginAlerts: true,
      twoFactorAuth: false,
    };

    // Role-specific defaults
    switch (role) {
    case UserRole.ORGANIZER:
    case UserRole.ORGANIZER_STAFF:
    case UserRole.ORGANIZER_TELLER:
      return {
        ...baseDefaults,
        eventNotifications: true,
        registrationNotifications: true,
        paymentNotifications: true,
        marketingEmails: false,
        weeklyDigest: true,
      };

    case UserRole.ATTENDEE:
      return {
        ...baseDefaults,
        eventReminders: true,
        eventUpdates: true,
        promotionalOffers: true,
      };

    case UserRole.ADMIN_STAFF:
    case UserRole.SUPERADMIN:
    case UserRole.SUPPORT:
    case UserRole.MARKETER:
    case UserRole.TELLER:
      return {
        ...baseDefaults,
        eventNotifications: true,
        registrationNotifications: true,
        paymentNotifications: true,
        marketingEmails: false,
        weeklyDigest: true,
      };

    default:
      return baseDefaults;
    }
  }

  /**
   * Validate preferences
   */
  private static validatePreferences(
    preferences: Partial<UserPreferencesData>,
  ): void {
    // Validate theme
    if (
      preferences.theme &&
      !['light', 'dark', 'system'].includes(preferences.theme)
    ) {
      throw new ValidationError(
        'Invalid theme value. Must be light, dark, or system',
      );
    }

    // Validate dashboard layout
    if (
      preferences.dashboardLayout &&
      !['compact', 'spacious'].includes(preferences.dashboardLayout)
    ) {
      throw new ValidationError(
        'Invalid dashboard layout. Must be compact or spacious',
      );
    }

    // Validate time format
    if (
      preferences.timeFormat &&
      !['12h', '24h'].includes(preferences.timeFormat)
    ) {
      throw new ValidationError('Invalid time format. Must be 12h or 24h');
    }

    // Validate profile visibility
    if (
      preferences.profileVisibility &&
      !['public', 'private', 'friends'].includes(preferences.profileVisibility)
    ) {
      throw new ValidationError(
        'Invalid profile visibility. Must be public, private, or friends',
      );
    }

    // Validate session timeout (1-1440 minutes)
    if (preferences.sessionTimeout !== undefined) {
      if (
        typeof preferences.sessionTimeout !== 'number' ||
        preferences.sessionTimeout < 1 ||
        preferences.sessionTimeout > 1440
      ) {
        throw new ValidationError(
          'Session timeout must be between 1 and 1440 minutes',
        );
      }
    }

    // Validate primary color format (hex color)
    if (preferences.primaryColor) {
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexColorRegex.test(preferences.primaryColor)) {
        throw new ValidationError(
          'Primary color must be a valid hex color (e.g., #FF5733)',
        );
      }
    }
  }

  /**
   * Get user preferences (merge with defaults)
   */
  static async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      // Get user to determine role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        throw new NotFoundError(`User ${userId} not found`);
      }

      // Get user preferences from database
      const dbPreferences = await prisma.userPreferences.findUnique({
        where: { userId },
      });

      // Get defaults based on role
      const defaults = this.getDefaultPreferences(user.role);

      // Merge defaults with user preferences
      const preferences: UserPreferencesData = {
        ...defaults,
        ...(dbPreferences
          ? {
            theme: dbPreferences.theme as
                | 'light'
                | 'dark'
                | 'system'
                | undefined,
            primaryColor: dbPreferences.primaryColor || undefined,
            dashboardLayout: dbPreferences.dashboardLayout as
                | 'compact'
                | 'spacious'
                | undefined,
            showMetrics: dbPreferences.showMetrics,
            showCharts: dbPreferences.showCharts,
            language: dbPreferences.language,
            timezone: dbPreferences.timezone || undefined,
            dateFormat: dbPreferences.dateFormat,
            timeFormat: dbPreferences.timeFormat as '12h' | '24h' | undefined,
            profileVisibility: dbPreferences.profileVisibility as
                | 'public'
                | 'private'
                | 'friends'
                | undefined,
            showEmail: dbPreferences.showEmail,
            showPhone: dbPreferences.showPhone,
            allowMessages: dbPreferences.allowMessages,
            sessionTimeout: dbPreferences.sessionTimeout,
            loginAlerts: dbPreferences.loginAlerts,
            twoFactorAuth: dbPreferences.twoFactorAuth,
            eventNotifications: dbPreferences.eventNotifications,
            registrationNotifications:
                dbPreferences.registrationNotifications,
            paymentNotifications: dbPreferences.paymentNotifications,
            marketingEmails: dbPreferences.marketingEmails,
            weeklyDigest: dbPreferences.weeklyDigest,
            eventReminders: dbPreferences.eventReminders,
            eventUpdates: dbPreferences.eventUpdates,
            promotionalOffers: dbPreferences.promotionalOffers,
          }
          : {}),
      };

      return {
        ...preferences,
        id: dbPreferences?.id || '',
        userId,
        createdAt: dbPreferences?.createdAt || new Date(),
        updatedAt: dbPreferences?.updatedAt || new Date(),
      };
    } catch (error) {
      logger.error(`Failed to get preferences for user ${userId}:`, error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new ValidationError('Failed to retrieve user preferences');
    }
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(
    userId: string,
    preferences: Partial<UserPreferencesData>,
  ): Promise<UserPreferences> {
    try {
      // Validate preferences
      this.validatePreferences(preferences);

      // Get user to ensure they exist
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        throw new NotFoundError(`User ${userId} not found`);
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {};

      // Only update provided fields
      if (preferences.theme !== undefined) updateData.theme = preferences.theme;
      if (preferences.primaryColor !== undefined)
        updateData.primaryColor = preferences.primaryColor || null;
      if (preferences.dashboardLayout !== undefined)
        updateData.dashboardLayout = preferences.dashboardLayout;
      if (preferences.showMetrics !== undefined)
        updateData.showMetrics = preferences.showMetrics;
      if (preferences.showCharts !== undefined)
        updateData.showCharts = preferences.showCharts;
      if (preferences.language !== undefined)
        updateData.language = preferences.language;
      if (preferences.timezone !== undefined)
        updateData.timezone = preferences.timezone || null;
      if (preferences.dateFormat !== undefined)
        updateData.dateFormat = preferences.dateFormat;
      if (preferences.timeFormat !== undefined)
        updateData.timeFormat = preferences.timeFormat;
      if (preferences.profileVisibility !== undefined)
        updateData.profileVisibility = preferences.profileVisibility;
      if (preferences.showEmail !== undefined)
        updateData.showEmail = preferences.showEmail;
      if (preferences.showPhone !== undefined)
        updateData.showPhone = preferences.showPhone;
      if (preferences.allowMessages !== undefined)
        updateData.allowMessages = preferences.allowMessages;
      if (preferences.sessionTimeout !== undefined)
        updateData.sessionTimeout = preferences.sessionTimeout;
      if (preferences.loginAlerts !== undefined)
        updateData.loginAlerts = preferences.loginAlerts;
      if (preferences.twoFactorAuth !== undefined)
        updateData.twoFactorAuth = preferences.twoFactorAuth;
      if (preferences.eventNotifications !== undefined)
        updateData.eventNotifications = preferences.eventNotifications;
      if (preferences.registrationNotifications !== undefined)
        updateData.registrationNotifications =
          preferences.registrationNotifications;
      if (preferences.paymentNotifications !== undefined)
        updateData.paymentNotifications = preferences.paymentNotifications;
      if (preferences.marketingEmails !== undefined)
        updateData.marketingEmails = preferences.marketingEmails;
      if (preferences.weeklyDigest !== undefined)
        updateData.weeklyDigest = preferences.weeklyDigest;
      if (preferences.eventReminders !== undefined)
        updateData.eventReminders = preferences.eventReminders;
      if (preferences.eventUpdates !== undefined)
        updateData.eventUpdates = preferences.eventUpdates;
      if (preferences.promotionalOffers !== undefined)
        updateData.promotionalOffers = preferences.promotionalOffers;

      // Upsert preferences
      await prisma.userPreferences.upsert({
        where: { userId },
        create: {
          userId,
          ...updateData,
        },
        update: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      logger.info(`Preferences updated for user ${userId}`);

      // Return merged preferences
      return this.getUserPreferences(userId);
    } catch (error) {
      logger.error(`Failed to update preferences for user ${userId}:`, error);
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Failed to update user preferences');
    }
  }

  /**
   * Update a single preference
   */
  static async updatePreference(
    userId: string,
    key: keyof UserPreferencesData,
    value: any,
  ): Promise<UserPreferences> {
    return this.updatePreferences(userId, { [key]: value });
  }

  /**
   * Reset preferences to defaults
   */
  static async resetPreferences(userId: string): Promise<UserPreferences> {
    try {
      // Get user to determine role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        throw new NotFoundError(`User ${userId} not found`);
      }

      // Delete existing preferences
      await prisma.userPreferences.deleteMany({
        where: { userId },
      });

      logger.info(`Preferences reset to defaults for user ${userId}`);

      // Return default preferences
      return this.getUserPreferences(userId);
    } catch (error) {
      logger.error(`Failed to reset preferences for user ${userId}:`, error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new ValidationError('Failed to reset user preferences');
    }
  }

  /**
   * Get default preferences for a role (without user ID)
   */
  static getDefaultPreferencesForRole(role?: UserRole): UserPreferencesData {
    return this.getDefaultPreferences(role);
  }
}
