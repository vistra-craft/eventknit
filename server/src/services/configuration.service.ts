import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { parseMailTrapConfig, type MailTrapConfig } from '../types/configuration.types.js';

export class ConfigurationService {
  /**
   * Get current system configuration
   */
  static async getConfiguration(): Promise<{
    id: string;
    mailTrap: MailTrapConfig;
    isSystemUnderMaintenance: boolean;
    maintenanceMessage?: string | null;
    maintenanceStartTime?: Date | null;
    maintenanceEndTime?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }> {
    let configuration = await prisma.configuration.findFirst();

    // Create default configuration if none exists
    if (!configuration) {
      logger.info('No configuration found, creating default...');
      configuration = await prisma.configuration.create({
        data: {
          mailTrap: {
            trap: false,
            toAddress: ['vistracraft@gmail.com'],
            ccAddress: [],
          },
          isSystemUnderMaintenance: false,
        },
      });
    }

    const mailTrap = parseMailTrapConfig(configuration.mailTrap);

    return {
      id: configuration.id,
      mailTrap,
      isSystemUnderMaintenance: configuration.isSystemUnderMaintenance,
      maintenanceMessage: configuration.maintenanceMessage,
      maintenanceStartTime: configuration.maintenanceStartTime,
      maintenanceEndTime: configuration.maintenanceEndTime,
      createdAt: configuration.createdAt,
      updatedAt: configuration.updatedAt,
    };
  }

  /**
   * Update mailTrap configuration
   */
  static async updateMailTrap(
    mailTrapConfig: MailTrapConfig,
    updatedBy?: string,
  ): Promise<void> {
    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const email of mailTrapConfig.toAddress) {
      if (!emailRegex.test(email)) {
        throw new ValidationError(`Invalid email address in toAddress: ${email}`);
      }
    }

    for (const email of mailTrapConfig.ccAddress) {
      if (!emailRegex.test(email)) {
        throw new ValidationError(`Invalid email address in ccAddress: ${email}`);
      }
    }

    const configuration = await prisma.configuration.findFirst();

    if (!configuration) {
      throw new NotFoundError('Configuration not found. Please run database seed.');
    }

    await prisma.configuration.update({
      where: { id: configuration.id },
      data: {
        mailTrap: mailTrapConfig as any, // Prisma Json type requires any cast
        updatedBy,
      },
    });

    logger.info(`MailTrap configuration updated: trap=${mailTrapConfig.trap}, toAddress=${mailTrapConfig.toAddress.join(', ')}`);
  }

  /**
   * Update system maintenance status
   */
  static async updateMaintenanceMode(
    isUnderMaintenance: boolean,
    message?: string,
    startTime?: Date,
    endTime?: Date,
    updatedBy?: string,
  ): Promise<void> {
    const configuration = await prisma.configuration.findFirst();

    if (!configuration) {
      throw new NotFoundError('Configuration not found. Please run database seed.');
    }

    await prisma.configuration.update({
      where: { id: configuration.id },
      data: {
        isSystemUnderMaintenance: isUnderMaintenance,
        maintenanceMessage: message,
        maintenanceStartTime: startTime,
        maintenanceEndTime: endTime,
        updatedBy,
      },
    });

    logger.info(`Maintenance mode updated: ${isUnderMaintenance ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Check if system is under maintenance
   */
  static async isSystemUnderMaintenance(): Promise<boolean> {
    const configuration = await prisma.configuration.findFirst({
      select: { isSystemUnderMaintenance: true },
    });

    return configuration?.isSystemUnderMaintenance ?? false;
  }
}
