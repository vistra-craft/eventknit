import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { encrypt, decrypt } from '../utils/encryption.js';

export type SettingType = 'string' | 'number' | 'boolean' | 'json';
export type SettingCategory =
  | 'general'
  | 'users'
  | 'notifications'
  | 'security'
  | 'appearance'
  | 'email'
  | 'api'
  | 'maintenance';

export interface SystemSetting {
  id: string;
  key: string;
  value: any;
  type: SettingType;
  category: SettingCategory;
  description?: string;
  isPublic: boolean;
  isEncrypted: boolean;
  environment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettingHistory {
  id: string;
  key: string;
  oldValue?: any;
  newValue: any;
  changedBy: string;
  changeReason?: string;
  createdAt: Date;
}

export class SystemSettingsService {
  /**
   * Validate setting value based on type
   */
  private static validateSettingValue(
    key: string,
    value: any,
    type: SettingType,
  ): void {
    switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        throw new ValidationError(`Setting ${key} must be a string`);
      }
      break;
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        throw new ValidationError(`Setting ${key} must be a number`);
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        throw new ValidationError(`Setting ${key} must be a boolean`);
      }
      break;
    case 'json':
      // JSON values are stored as strings, so we validate they can be parsed
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch {
          throw new ValidationError(`Setting ${key} must be valid JSON`);
        }
      } else {
        // If it's already an object, validate it can be stringified
        try {
          JSON.stringify(value);
        } catch {
          throw new ValidationError(
            `Setting ${key} must be serializable to JSON`,
          );
        }
      }
      break;
    default:
      throw new ValidationError(`Unknown setting type: ${type}`);
    }
  }

  /**
   * Serialize value for storage
   */
  private static serializeValue(value: any, type: SettingType): string {
    switch (type) {
    case 'string':
      return String(value);
    case 'number':
      return String(value);
    case 'boolean':
      return String(value);
    case 'json':
      return typeof value === 'string' ? value : JSON.stringify(value);
    default:
      return String(value);
    }
  }

  /**
   * Deserialize value from storage
   */
  private static deserializeValue(
    value: string,
    type: SettingType,
    isEncrypted: boolean,
  ): any {
    let decryptedValue = value;

    // Decrypt if needed
    if (isEncrypted) {
      try {
        decryptedValue = decrypt(value);
      } catch (error) {
        logger.error('Failed to decrypt setting value:', error);
        throw new ValidationError('Failed to decrypt setting value');
      }
    }

    switch (type) {
    case 'string':
      return decryptedValue;
    case 'number': {
      const num = Number(decryptedValue);
      if (isNaN(num)) {
        throw new ValidationError('Invalid number value');
      }
      return num;
    }
    case 'boolean':
      return decryptedValue === 'true' || decryptedValue === '1';
    case 'json': {
      try {
        return JSON.parse(decryptedValue);
      } catch {
        throw new ValidationError('Invalid JSON value');
      }
    }
    default:
      return decryptedValue;
    }
  }

  /**
   * Get a single setting by key
   */
  static async getSetting(
    key: string,
    environment?: string,
  ): Promise<SystemSetting | null> {
    try {
      // Try to get environment-specific setting first
      let setting = null;
      if (environment) {
        setting = await prisma.systemSettings.findFirst({
          where: {
            key,
            environment,
          },
        });
      }

      // Fall back to environment-agnostic setting
      if (!setting) {
        setting = await prisma.systemSettings.findUnique({
          where: { key },
        });
      }

      if (!setting) {
        return null;
      }

      const value = this.deserializeValue(
        setting.value,
        setting.type as SettingType,
        setting.isEncrypted,
      );

      return {
        id: setting.id,
        key: setting.key,
        value,
        type: setting.type as SettingType,
        category: setting.category as SettingCategory,
        description: setting.description || undefined,
        isPublic: setting.isPublic,
        isEncrypted: setting.isEncrypted,
        environment: setting.environment || undefined,
        createdAt: setting.createdAt,
        updatedAt: setting.updatedAt,
      };
    } catch (error) {
      logger.error(`Failed to get setting ${key}:`, error);
      throw new ValidationError(`Failed to retrieve setting: ${key}`);
    }
  }

  /**
   * Get multiple settings by category or all settings
   */
  static async getSettings(
    category?: SettingCategory,
    environment?: string,
  ): Promise<SystemSetting[]> {
    try {
      const where: any = {};

      if (category) {
        where.category = category;
      }

      if (environment) {
        where.OR = [{ environment }, { environment: null }];
      }

      const settings = await prisma.systemSettings.findMany({
        where,
        orderBy: { key: 'asc' },
      });

      return settings.map((setting) => {
        const value = this.deserializeValue(
          setting.value,
          setting.type as SettingType,
          setting.isEncrypted,
        );

        return {
          id: setting.id,
          key: setting.key,
          value,
          type: setting.type as SettingType,
          category: setting.category as SettingCategory,
          description: setting.description || undefined,
          isPublic: setting.isPublic,
          isEncrypted: setting.isEncrypted,
          environment: setting.environment || undefined,
          createdAt: setting.createdAt,
          updatedAt: setting.updatedAt,
        };
      });
    } catch (error) {
      logger.error('Failed to get settings:', error);
      throw new ValidationError('Failed to retrieve settings');
    }
  }

  /**
   * Set or update a single setting
   */
  static async setSetting(
    key: string,
    value: any,
    type: SettingType,
    category: SettingCategory,
    userId: string,
    options?: {
      description?: string;
      isPublic?: boolean;
      isEncrypted?: boolean;
      environment?: string;
      changeReason?: string;
    },
  ): Promise<SystemSetting> {
    try {
      // Validate value
      this.validateSettingValue(key, value, type);

      // Serialize value
      let serializedValue = this.serializeValue(value, type);

      // Encrypt if needed
      const shouldEncrypt = options?.isEncrypted ?? false;
      if (shouldEncrypt) {
        serializedValue = encrypt(serializedValue);
      }

      // Get existing setting for history
      const existing = await prisma.systemSettings.findUnique({
        where: { key },
      });

      const oldValue = existing?.value;

      // Create or update setting
      const setting = await prisma.systemSettings.upsert({
        where: { key },
        create: {
          key,
          value: serializedValue,
          type,
          category,
          description: options?.description,
          isPublic: options?.isPublic ?? false,
          isEncrypted: shouldEncrypt,
          environment: options?.environment || null,
          createdBy: userId,
          updatedBy: userId,
        },
        update: {
          value: serializedValue,
          type,
          category,
          description: options?.description,
          isPublic: options?.isPublic ?? false,
          isEncrypted: shouldEncrypt,
          environment: options?.environment || null,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });

      // Create history entry
      await prisma.settingsHistory.create({
        data: {
          settingId: setting.id,
          key: setting.key,
          oldValue: oldValue || null,
          newValue: setting.value,
          changedBy: userId,
          changeReason: options?.changeReason || null,
        },
      });

      logger.info(`Setting ${key} updated by user ${userId}`);

      // Return deserialized setting
      const deserializedValue = this.deserializeValue(
        setting.value,
        type,
        shouldEncrypt,
      );

      return {
        id: setting.id,
        key: setting.key,
        value: deserializedValue,
        type: setting.type as SettingType,
        category: setting.category as SettingCategory,
        description: setting.description || undefined,
        isPublic: setting.isPublic,
        isEncrypted: setting.isEncrypted,
        environment: setting.environment || undefined,
        createdAt: setting.createdAt,
        updatedAt: setting.updatedAt,
      };
    } catch (error) {
      logger.error(`Failed to set setting ${key}:`, error);
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(`Failed to update setting: ${key}`);
    }
  }

  /**
   * Bulk update settings
   */
  static async setSettings(
    settings: Array<{
      key: string;
      value: any;
      type: SettingType;
      category: SettingCategory;
      description?: string;
      isPublic?: boolean;
      isEncrypted?: boolean;
      environment?: string;
    }>,
    userId: string,
    changeReason?: string,
  ): Promise<SystemSetting[]> {
    try {
      const results: SystemSetting[] = [];

      for (const setting of settings) {
        const result = await this.setSetting(
          setting.key,
          setting.value,
          setting.type,
          setting.category,
          userId,
          {
            description: setting.description,
            isPublic: setting.isPublic,
            isEncrypted: setting.isEncrypted,
            environment: setting.environment,
            changeReason,
          },
        );
        results.push(result);
      }

      return results;
    } catch (error) {
      logger.error('Failed to bulk update settings:', error);
      throw new ValidationError('Failed to update settings');
    }
  }

  /**
   * Delete a setting
   */
  static async deleteSetting(key: string, userId: string): Promise<void> {
    try {
      const setting = await prisma.systemSettings.findUnique({
        where: { key },
      });

      if (!setting) {
        throw new NotFoundError(`Setting ${key} not found`);
      }

      // Create history entry for deletion
      await prisma.settingsHistory.create({
        data: {
          settingId: setting.id,
          key: setting.key,
          oldValue: setting.value,
          newValue: '[DELETED]',
          changedBy: userId,
          changeReason: 'Setting deleted',
        },
      });

      await prisma.systemSettings.delete({
        where: { key },
      });

      logger.info(`Setting ${key} deleted by user ${userId}`);
    } catch (error) {
      logger.error(`Failed to delete setting ${key}:`, error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new ValidationError(`Failed to delete setting: ${key}`);
    }
  }

  /**
   * Get public settings (no auth required)
   */
  static async getPublicSettings(): Promise<Record<string, any>> {
    try {
      const settings = await prisma.systemSettings.findMany({
        where: { isPublic: true },
      });

      const result: Record<string, any> = {};

      for (const setting of settings) {
        const value = this.deserializeValue(
          setting.value,
          setting.type as SettingType,
          false, // Don't decrypt public settings even if encrypted
        );
        result[setting.key] = value;
      }

      return result;
    } catch (error) {
      logger.error('Failed to get public settings:', error);
      throw new ValidationError('Failed to retrieve public settings');
    }
  }

  /**
   * Get setting history
   */
  static async getSettingsHistory(
    key: string,
    limit: number = 50,
  ): Promise<SettingHistory[]> {
    try {
      const history = await prisma.settingsHistory.findMany({
        where: { key },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return history.map((entry) => {
        let oldValue: any = undefined;
        let newValue: any = undefined;

        try {
          if (entry.oldValue) {
            oldValue = JSON.parse(entry.oldValue);
          }
          if (entry.newValue) {
            newValue = JSON.parse(entry.newValue);
          }
        } catch {
          // If parsing fails, use raw string
          oldValue = entry.oldValue || undefined;
          newValue = entry.newValue;
        }

        return {
          id: entry.id,
          key: entry.key,
          oldValue,
          newValue,
          changedBy: entry.changedBy,
          changeReason: entry.changeReason || undefined,
          createdAt: entry.createdAt,
        };
      });
    } catch (error) {
      logger.error(`Failed to get history for setting ${key}:`, error);
      throw new ValidationError(`Failed to retrieve setting history: ${key}`);
    }
  }
}
