import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../config/database.js';

export interface AdminSecurityRequest extends Request {
  adminSecurityChecked?: boolean;
}

/**
 * Middleware to restrict admin panel access based on:
 * 1. Allowed domains/origins (CORS-like but for admin only)
 * 2. IP whitelist
 * 3. Subdomain validation (optional)
 */
export class AdminSecurityMiddleware {
  private static allowedOriginsCache: string[] | null = null;
  private static allowedIPsCache: string[] | null = null;
  private static lastCacheRefresh: number = 0;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Refresh cache from database settings
   */
  private static async refreshCache(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCacheRefresh < this.CACHE_TTL) {
      return; // Cache is still fresh
    }

    try {
      // Get admin allowed origins from system settings
      const originsetting = await prisma.systemSettings.findUnique({
        where: { key: 'admin_allowed_origins' },
      });

      if (originsetting?.value) {
        const origins = typeof originsetting.value === 'string'
          ? JSON.parse(originsetting.value)
          : originsetting.value;
        this.allowedOriginsCache = Array.isArray(origins) ? origins : [origins];
      } else {
        // Fallback to config
        this.allowedOriginsCache = config.admin.allowedOrigins;
      }

      // Get admin allowed IPs from system settings
      const ipSetting = await prisma.systemSettings.findUnique({
        where: { key: 'admin_allowed_ips' },
      });

      if (ipSetting?.value) {
        const ips = typeof ipSetting.value === 'string'
          ? JSON.parse(ipSetting.value)
          : ipSetting.value;
        this.allowedIPsCache = Array.isArray(ips) ? ips : [ips];
      } else {
        // Fallback to config
        this.allowedIPsCache = config.admin.allowedIPs;
      }

      this.lastCacheRefresh = now;
      logger.debug('Admin security cache refreshed', {
        allowedOrigins: this.allowedOriginsCache,
        allowedIPs: this.allowedIPsCache,
      });
    } catch (error) {
      logger.error('Failed to refresh admin security cache:', error);
      // Keep using existing cache or config fallback
      if (!this.allowedOriginsCache) {
        this.allowedOriginsCache = config.admin.allowedOrigins;
      }
      if (!this.allowedIPsCache) {
        this.allowedIPsCache = config.admin.allowedIPs;
      }
    }
  }

  /**
   * Force cache refresh (used when settings are updated)
   */
  static async forceRefreshCache(): Promise<void> {
    this.lastCacheRefresh = 0;
    await this.refreshCache();
  }

  /**
   * Check if origin is allowed for admin access
   */
  private static async isOriginAllowed(origin: string | undefined): Promise<boolean> {
    await this.refreshCache();

    // If no origin (mobile app, curl, etc.)
    if (!origin) {
      return config.admin.allowNoOrigin;
    }

    // In development, check if we should allow all localhost
    if (config.env === 'development' && config.admin.allowLocalhostInDev) {
      if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
        return true;
      }
    }

    // Check against allowed origins
    const allowedOrigins = this.allowedOriginsCache || [];

    // Exact match
    if (allowedOrigins.includes(origin)) {
      return true;
    }

    // Check for wildcard subdomains (e.g., *.eventknit.com)
    for (const allowed of allowedOrigins) {
      if (allowed.startsWith('*.')) {
        const domain = allowed.substring(2); // Remove *.
        if (origin.endsWith(`.${  domain}`) || origin.endsWith(domain)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get client IP address from request
   */
  private static getClientIP(req: Request): string {
    // Check X-Forwarded-For header (from proxies/load balancers)
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = typeof forwardedFor === 'string' ? forwardedFor.split(',') : forwardedFor;
      return ips[0].trim();
    }

    // Check X-Real-IP header
    const realIP = req.headers['x-real-ip'];
    if (realIP && typeof realIP === 'string') {
      return realIP.trim();
    }

    // Fallback to socket remote address
    return req.socket.remoteAddress || req.ip || 'unknown';
  }

  /**
   * Check if IP is allowed for admin access
   */
  private static async isIPAllowed(ip: string): Promise<boolean> {
    await this.refreshCache();

    // If IP checking is disabled
    if (!config.admin.enableIPWhitelist) {
      return true;
    }

    // In development, optionally allow all IPs
    if (config.env === 'development' && config.admin.allowAllIPsInDev) {
      return true;
    }

    const allowedIPs = this.allowedIPsCache || [];

    // If no IPs configured, deny by default (fail-secure)
    if (allowedIPs.length === 0) {
      logger.warn('No admin allowed IPs configured - denying access by default');
      return false;
    }

    // Check for exact match
    if (allowedIPs.includes(ip)) {
      return true;
    }

    // Check for CIDR ranges or wildcards
    for (const allowed of allowedIPs) {
      // Simple wildcard support (e.g., 192.168.1.*)
      if (allowed.includes('*')) {
        const pattern = allowed.replace(/\./g, '\\.').replace(/\*/g, '\\d+');
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(ip)) {
          return true;
        }
      }

      // Support for CIDR notation (basic implementation)
      if (allowed.includes('/')) {
        if (this.isIPInCIDR(ip, allowed)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if IP is in CIDR range (basic IPv4 implementation)
   */
  private static isIPInCIDR(ip: string, cidr: string): boolean {
    try {
      const [range, bits] = cidr.split('/');
      const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1);

      const ipInt = this.ipToInt(ip);
      const rangeInt = this.ipToInt(range);

      return (ipInt & mask) === (rangeInt & mask);
    } catch (error) {
      logger.error('Error checking CIDR range:', error);
      return false;
    }
  }

  /**
   * Convert IP string to integer
   */
  private static ipToInt(ip: string): number {
    return ip.split('.').reduce((int, octet) => (int << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  /**
   * Check subdomain restriction (admin.yourdomain.com)
   */
  private static isSubdomainAllowed(origin: string | undefined): boolean {
    if (!config.admin.requireSpecificSubdomain || !config.admin.requiredSubdomain) {
      return true; // No subdomain restriction
    }

    if (!origin) {
      return false;
    }

    try {
      const url = new URL(origin);
      const hostname = url.hostname;

      // Check if hostname starts with required subdomain
      const requiredSubdomain = config.admin.requiredSubdomain;
      return hostname === requiredSubdomain || hostname.startsWith(`${requiredSubdomain}.`);
    } catch (error) {
      logger.error('Error parsing origin URL:', error);
      return false;
    }
  }

  /**
   * Main middleware function
   */
  static async checkAccess(req: AdminSecurityRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const origin = req.get('origin') || req.get('referer');
      const clientIP = AdminSecurityMiddleware.getClientIP(req);

      logger.debug('Admin security check', {
        origin,
        clientIP,
        path: req.path,
        method: req.method,
      });

      // Check origin/domain whitelist
      const originAllowed = await AdminSecurityMiddleware.isOriginAllowed(origin);
      if (!originAllowed) {
        logger.warn('Admin access denied - origin not allowed', {
          origin,
          clientIP,
          path: req.path,
        });
        res.status(403).json({
          success: false,
          error: 'Access denied: Origin not allowed for admin access',
          code: 'ADMIN_ORIGIN_DENIED',
        });
        return;
      }

      // Check IP whitelist
      const ipAllowed = await AdminSecurityMiddleware.isIPAllowed(clientIP);
      if (!ipAllowed) {
        logger.warn('Admin access denied - IP not allowed', {
          origin,
          clientIP,
          path: req.path,
        });
        res.status(403).json({
          success: false,
          error: 'Access denied: IP address not allowed for admin access',
          code: 'ADMIN_IP_DENIED',
        });
        return;
      }

      // Check subdomain restriction
      const subdomainAllowed = AdminSecurityMiddleware.isSubdomainAllowed(origin);
      if (!subdomainAllowed) {
        logger.warn('Admin access denied - subdomain not allowed', {
          origin,
          clientIP,
          path: req.path,
          requiredSubdomain: config.admin.requiredSubdomain,
        });
        res.status(403).json({
          success: false,
          error: `Access denied: Admin access only allowed from ${config.admin.requiredSubdomain}`,
          code: 'ADMIN_SUBDOMAIN_DENIED',
        });
        return;
      }

      // All checks passed
      req.adminSecurityChecked = true;
      logger.debug('Admin security check passed', {
        origin,
        clientIP,
      });

      next();
    } catch (error) {
      logger.error('Admin security middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during security check',
      });
    }
  }
}

/**
 * Export middleware function for use in routes
 */
export const adminSecurityCheck = AdminSecurityMiddleware.checkAccess.bind(AdminSecurityMiddleware);

/**
 * Export function to force cache refresh (for use when settings change)
 */
export const refreshAdminSecurityCache = AdminSecurityMiddleware.forceRefreshCache.bind(AdminSecurityMiddleware);
