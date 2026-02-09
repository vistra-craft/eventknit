/**
 * Type definitions for Configuration model
 * Ensures type safety when working with JSON fields
 */

export interface MailTrapConfig {
  trap: boolean;
  toAddress: string[];
  ccAddress: string[];
}

export interface ConfigurationData {
  id: string;
  mailTrap: MailTrapConfig;
  isSystemUnderMaintenance: boolean;
  maintenanceMessage?: string | null;
  maintenanceStartTime?: Date | null;
  maintenanceEndTime?: Date | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Helper function to parse mailTrap JSON from Prisma
 */
export function parseMailTrapConfig(mailTrapJson: unknown): MailTrapConfig {
  // Default configuration
  const defaultConfig: MailTrapConfig = {
    trap: false,
    toAddress: [],
    ccAddress: [],
  };

  if (typeof mailTrapJson === 'string') {
    try {
      const parsed = JSON.parse(mailTrapJson);
      return {
        trap: typeof parsed.trap === 'boolean' ? parsed.trap : defaultConfig.trap,
        toAddress: Array.isArray(parsed.toAddress) ? parsed.toAddress : defaultConfig.toAddress,
        ccAddress: Array.isArray(parsed.ccAddress) ? parsed.ccAddress : defaultConfig.ccAddress,
      };
    } catch {
      return defaultConfig;
    }
  }

  if (typeof mailTrapJson === 'object' && mailTrapJson !== null) {
    const config = mailTrapJson as Record<string, unknown>;
    return {
      trap: typeof config.trap === 'boolean' ? config.trap : defaultConfig.trap,
      toAddress: Array.isArray(config.toAddress) ? config.toAddress : defaultConfig.toAddress,
      ccAddress: Array.isArray(config.ccAddress) ? config.ccAddress : defaultConfig.ccAddress,
    };
  }

  return defaultConfig;
}

/**
 * Helper function to stringify mailTrap config for Prisma
 */
export function stringifyMailTrapConfig(config: MailTrapConfig): string {
  return JSON.stringify(config);
}
