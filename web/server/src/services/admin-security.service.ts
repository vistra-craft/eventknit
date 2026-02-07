import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { refreshAdminSecurityCache } from '../middleware/admin-security.middleware.js';

export class AdminSecurityService {
  /**
   * Get admin allowed origins
   */
  static async getAllowedOrigins() {
    try {
      const setting = await prisma.systemSettings.findUnique({
        where: { key: 'admin_allowed_origins' },
      });

      if (!setting) {
        return {
          origins: [] as string[],
          lastUpdated: null,
          updatedBy: null,
        };
      }

      const origins = typeof setting.value === 'string'
        ? JSON.parse(setting.value)
        : setting.value;

      return {
        origins: Array.isArray(origins) ? origins : [origins],
        lastUpdated: setting.updatedAt,
        updatedBy: setting.updatedBy,
      };
    } catch (error) {
      logger.error('Failed to get admin allowed origins:', error);
      throw error;
    }
  }

  /**
   * Update admin allowed origins
   */
  static async updateAllowedOrigins(origins: string[], updatedBy: string) {
    try {
      // Validate origins format
      for (const origin of origins) {
        if (!origin.trim()) {
          throw new ValidationError('Origin cannot be empty');
        }

        // Check if it's a wildcard subdomain
        if (origin.startsWith('*.')) {
          const domain = origin.substring(2);
          if (!domain || domain.includes('*')) {
            throw new ValidationError(`Invalid wildcard origin format: ${origin}`);
          }
        } else {
          // Validate as URL
          try {
            new URL(origin);
          } catch {
            throw new ValidationError(`Invalid origin URL format: ${origin}`);
          }
        }
      }

      const setting = await prisma.systemSettings.upsert({
        where: { key: 'admin_allowed_origins' },
        create: {
          key: 'admin_allowed_origins',
          value: JSON.stringify(origins),
          type: 'json',
          category: 'security',
          description: 'Allowed origins for admin panel access',
          isPublic: false,
          createdBy: updatedBy,
          updatedBy,
        },
        update: {
          value: JSON.stringify(origins),
          updatedBy,
        },
      });

      // Refresh middleware cache
      await refreshAdminSecurityCache();

      logger.info(`Admin allowed origins updated by ${updatedBy}`, { origins });

      return {
        origins,
        lastUpdated: setting.updatedAt,
        updatedBy: setting.updatedBy,
      };
    } catch (error) {
      logger.error('Failed to update admin allowed origins:', error);
      throw error;
    }
  }

  /**
   * Add an origin to the allowed list
   */
  static async addAllowedOrigin(origin: string, updatedBy: string) {
    try {
      const current = await this.getAllowedOrigins();
      const origins = current.origins;

      if (origins.includes(origin)) {
        throw new ValidationError('Origin already exists in allowed list');
      }

      origins.push(origin);

      return await this.updateAllowedOrigins(origins, updatedBy);
    } catch (error) {
      logger.error('Failed to add allowed origin:', error);
      throw error;
    }
  }

  /**
   * Remove an origin from the allowed list
   */
  static async removeAllowedOrigin(origin: string, updatedBy: string) {
    try {
      const current = await this.getAllowedOrigins();
      const origins = current.origins.filter(o => o !== origin);

      if (origins.length === current.origins.length) {
        throw new NotFoundError('Origin not found in allowed list');
      }

      return await this.updateAllowedOrigins(origins, updatedBy);
    } catch (error) {
      logger.error('Failed to remove allowed origin:', error);
      throw error;
    }
  }

  /**
   * Get admin allowed IPs
   */
  static async getAllowedIPs() {
    try {
      const setting = await prisma.systemSettings.findUnique({
        where: { key: 'admin_allowed_ips' },
      });

      if (!setting) {
        return {
          ips: [] as string[],
          lastUpdated: null,
          updatedBy: null,
        };
      }

      const ips = typeof setting.value === 'string'
        ? JSON.parse(setting.value)
        : setting.value;

      return {
        ips: Array.isArray(ips) ? ips : [ips],
        lastUpdated: setting.updatedAt,
        updatedBy: setting.updatedBy,
      };
    } catch (error) {
      logger.error('Failed to get admin allowed IPs:', error);
      throw error;
    }
  }

  /**
   * Update admin allowed IPs
   */
  static async updateAllowedIPs(ips: string[], updatedBy: string) {
    try {
      // Validate IP format (simple validation)
      for (const ip of ips) {
        if (!ip.trim()) {
          throw new ValidationError('IP address cannot be empty');
        }

        // Support for CIDR notation, wildcards, or regular IPs
        const isValidFormat =
          /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) || // Regular IP
          /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(ip) || // CIDR
          /^(\d{1,3}\.){0,3}\*$/.test(ip); // Wildcard

        if (!isValidFormat) {
          throw new ValidationError(`Invalid IP format: ${ip}. Use regular IP (1.2.3.4), CIDR (1.2.3.0/24), or wildcard (192.168.*)`);
        }
      }

      const setting = await prisma.systemSettings.upsert({
        where: { key: 'admin_allowed_ips' },
        create: {
          key: 'admin_allowed_ips',
          value: JSON.stringify(ips),
          type: 'json',
          category: 'security',
          description: 'Allowed IP addresses for admin panel access',
          isPublic: false,
          createdBy: updatedBy,
          updatedBy,
        },
        update: {
          value: JSON.stringify(ips),
          updatedBy,
        },
      });

      // Refresh middleware cache
      await refreshAdminSecurityCache();

      logger.info(`Admin allowed IPs updated by ${updatedBy}`, { ips });

      return {
        ips,
        lastUpdated: setting.updatedAt,
        updatedBy: setting.updatedBy,
      };
    } catch (error) {
      logger.error('Failed to update admin allowed IPs:', error);
      throw error;
    }
  }

  /**
   * Add an IP to the allowed list
   */
  static async addAllowedIP(ip: string, updatedBy: string) {
    try {
      const current = await this.getAllowedIPs();
      const ips = current.ips;

      if (ips.includes(ip)) {
        throw new ValidationError('IP already exists in allowed list');
      }

      ips.push(ip);

      return await this.updateAllowedIPs(ips, updatedBy);
    } catch (error) {
      logger.error('Failed to add allowed IP:', error);
      throw error;
    }
  }

  /**
   * Remove an IP from the allowed list
   */
  static async removeAllowedIP(ip: string, updatedBy: string) {
    try {
      const current = await this.getAllowedIPs();
      const ips = current.ips.filter(i => i !== ip);

      if (ips.length === current.ips.length) {
        throw new NotFoundError('IP not found in allowed list');
      }

      return await this.updateAllowedIPs(ips, updatedBy);
    } catch (error) {
      logger.error('Failed to remove allowed IP:', error);
      throw error;
    }
  }

  /**
   * Get all admin security settings
   */
  static async getSecuritySettings() {
    try {
      const [origins, ips] = await Promise.all([
        this.getAllowedOrigins(),
        this.getAllowedIPs(),
      ]);

      return {
        allowedOrigins: origins,
        allowedIPs: ips,
      };
    } catch (error) {
      logger.error('Failed to get admin security settings:', error);
      throw error;
    }
  }
}
