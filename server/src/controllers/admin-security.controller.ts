import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AdminSecurityService } from '../services/admin-security.service.js';

export class AdminSecurityController {
  /**
   * Get all admin security settings
   */
  static async getSecuritySettings(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const settings = await AdminSecurityService.getSecuritySettings();

      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get allowed origins
   */
  static async getAllowedOrigins(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await AdminSecurityService.getAllowedOrigins();

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update allowed origins
   */
  static async updateAllowedOrigins(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { origins } = req.body;

      if (!Array.isArray(origins)) {
        res.status(400).json({
          success: false,
          message: 'Origins must be an array',
        });
        return;
      }

      const result = await AdminSecurityService.updateAllowedOrigins(origins, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Admin allowed origins updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add allowed origin
   */
  static async addAllowedOrigin(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { origin } = req.body;

      if (!origin || typeof origin !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Origin must be a string',
        });
        return;
      }

      const result = await AdminSecurityService.addAllowedOrigin(origin, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Origin added to allowed list',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove allowed origin
   */
  static async removeAllowedOrigin(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { origin } = req.params;

      if (!origin || typeof origin !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Origin parameter is required and must be a string',
        });
        return;
      }

      const result = await AdminSecurityService.removeAllowedOrigin(
        decodeURIComponent(origin),
        req.user.id,
      );

      res.status(200).json({
        success: true,
        message: 'Origin removed from allowed list',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get allowed IPs
   */
  static async getAllowedIPs(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await AdminSecurityService.getAllowedIPs();

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update allowed IPs
   */
  static async updateAllowedIPs(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { ips } = req.body;

      if (!Array.isArray(ips)) {
        res.status(400).json({
          success: false,
          message: 'IPs must be an array',
        });
        return;
      }

      const result = await AdminSecurityService.updateAllowedIPs(ips, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Admin allowed IPs updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add allowed IP
   */
  static async addAllowedIP(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { ip } = req.body;

      if (!ip || typeof ip !== 'string') {
        res.status(400).json({
          success: false,
          message: 'IP must be a string',
        });
        return;
      }

      const result = await AdminSecurityService.addAllowedIP(ip, req.user.id);

      res.status(200).json({
        success: true,
        message: 'IP added to allowed list',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove allowed IP
   */
  static async removeAllowedIP(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { ip } = req.params;

      if (!ip || typeof ip !== 'string') {
        res.status(400).json({
          success: false,
          message: 'IP parameter is required and must be a string',
        });
        return;
      }

      const result = await AdminSecurityService.removeAllowedIP(
        decodeURIComponent(ip),
        req.user.id,
      );

      res.status(200).json({
        success: true,
        message: 'IP removed from allowed list',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
