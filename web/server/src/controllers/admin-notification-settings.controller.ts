import { Response, NextFunction } from 'express';
import { AdminNotificationSettingsService } from '../services/admin-notification-settings.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AuthorizationError } from '../utils/errors.js';
import { UserRole } from '@prisma/client';

export class AdminNotificationSettingsController {
  /**
   * Get default notification preferences
   * GET /api/v1/admin/notification-settings/defaults
   */
  static async getDefaultPreferences(
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

      // Only admins can access
      if (
        req.user.role !== UserRole.SUPERADMIN &&
        req.user.role !== UserRole.ADMIN_STAFF
      ) {
        throw new AuthorizationError('Only admins can access notification settings');
      }

      const preferences = await AdminNotificationSettingsService.getDefaultPreferences();

      res.status(200).json({
        success: true,
        data: { preferences },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update default notification preferences
   * PUT /api/v1/admin/notification-settings/defaults
   */
  static async updateDefaultPreferences(
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

      // Only admins can update
      if (
        req.user.role !== UserRole.SUPERADMIN &&
        req.user.role !== UserRole.ADMIN_STAFF
      ) {
        throw new AuthorizationError('Only admins can update notification settings');
      }

      const preferences = await AdminNotificationSettingsService.updateDefaultPreferences(
        req.body,
        req.user.id,
      );

      res.status(200).json({
        success: true,
        data: { preferences },
        message: 'Default notification preferences updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get system-wide notification configuration
   * GET /api/v1/admin/notification-settings/system
   */
  static async getSystemConfig(
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

      // Only admins can access
      if (
        req.user.role !== UserRole.SUPERADMIN &&
        req.user.role !== UserRole.ADMIN_STAFF
      ) {
        throw new AuthorizationError('Only admins can access notification settings');
      }

      const config = await AdminNotificationSettingsService.getSystemConfig();

      res.status(200).json({
        success: true,
        data: { config },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update system-wide notification configuration
   * PUT /api/v1/admin/notification-settings/system
   */
  static async updateSystemConfig(
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

      // Only admins can update
      if (
        req.user.role !== UserRole.SUPERADMIN &&
        req.user.role !== UserRole.ADMIN_STAFF
      ) {
        throw new AuthorizationError('Only admins can update notification settings');
      }

      const config = await AdminNotificationSettingsService.updateSystemConfig(
        req.body,
        req.user.id,
      );

      res.status(200).json({
        success: true,
        data: { config },
        message: 'System notification configuration updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all notification templates
   * GET /api/v1/admin/notification-settings/templates
   */
  static async getTemplates(
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

      // Only admins can access
      if (
        req.user.role !== UserRole.SUPERADMIN &&
        req.user.role !== UserRole.ADMIN_STAFF
      ) {
        throw new AuthorizationError('Only admins can access notification settings');
      }

      const templates = await AdminNotificationSettingsService.getTemplates();

      res.status(200).json({
        success: true,
        data: { templates },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific notification template
   * GET /api/v1/admin/notification-settings/templates/:type
   */
  static async getTemplate(
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

      // Only admins can access
      if (
        req.user.role !== UserRole.SUPERADMIN &&
        req.user.role !== UserRole.ADMIN_STAFF
      ) {
        throw new AuthorizationError('Only admins can access notification settings');
      }

      const type = (req.params.type as string) as string;
      const template = await AdminNotificationSettingsService.getTemplate(type);

      if (!template) {
        res.status(404).json({
          success: false,
          message: 'Template not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { template },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create or update a notification template
   * PUT /api/v1/admin/notification-settings/templates/:type
   */
  static async saveTemplate(
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

      // Only admins can update
      if (
        req.user.role !== UserRole.SUPERADMIN &&
        req.user.role !== UserRole.ADMIN_STAFF
      ) {
        throw new AuthorizationError('Only admins can update notification settings');
      }

      const type = (req.params.type as string) as string;
      const template = await AdminNotificationSettingsService.saveTemplate(
        type,
        req.body,
        req.user.id,
      );

      res.status(200).json({
        success: true,
        data: { template },
        message: 'Notification template saved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a notification template
   * DELETE /api/v1/admin/notification-settings/templates/:type
   */
  static async deleteTemplate(
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

      // Only admins can delete
      if (
        req.user.role !== UserRole.SUPERADMIN &&
        req.user.role !== UserRole.ADMIN_STAFF
      ) {
        throw new AuthorizationError('Only admins can delete notification templates');
      }

      const type = (req.params.type as string) as string;
      await AdminNotificationSettingsService.deleteTemplate(type);

      res.status(200).json({
        success: true,
        message: 'Notification template deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notification analytics summary
   * GET /api/v1/admin/notification-settings/analytics
   */
  static async getAnalytics(
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

      // Only admins can access
      if (
        req.user.role !== UserRole.SUPERADMIN &&
        req.user.role !== UserRole.ADMIN_STAFF
      ) {
        throw new AuthorizationError('Only admins can access notification analytics');
      }

      const period = (req.query.period as 'day' | 'week' | 'month') || 'week';
      const analytics = await AdminNotificationSettingsService.getAnalyticsSummary(period);

      res.status(200).json({
        success: true,
        data: { analytics },
      });
    } catch (error) {
      next(error);
    }
  }
}





