import { Response, NextFunction } from 'express';
import {
  SystemSettingsService,
  SettingCategory,
} from '../services/system-settings.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AuthorizationError } from '../utils/errors.js';
import { UserRole } from '@prisma/client';

export class SystemSettingsController {
  /**
   * Get all settings (with optional category filter)
   * GET /api/v1/admin/settings?category=general&environment=production
   */
  static async getSettings(
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
        throw new AuthorizationError('Only admins can access system settings');
      }

      const category = req.query.category as string | undefined;
      const environment = req.query.environment as string | undefined;

      const settings = await SystemSettingsService.getSettings(
        category as SettingCategory | undefined,
        environment,
      );

      res.status(200).json({
        success: true,
        data: { settings },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single setting by key
   * GET /api/v1/admin/settings/:key?environment=production
   */
  static async getSetting(
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
        throw new AuthorizationError('Only admins can access system settings');
      }

      const key = (req.params.key as string) as string;
      const environment = req.query.environment as string | undefined;

      const setting = await SystemSettingsService.getSetting(key, environment);

      if (!setting) {
        res.status(404).json({
          success: false,
          message: `Setting ${key} not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { setting },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create or update a single setting
   * PUT /api/v1/admin/settings/:key
   */
  static async setSetting(
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
        throw new AuthorizationError('Only admins can update system settings');
      }

      const key = (req.params.key as string) as string;
      const {
        value,
        type,
        category,
        description,
        isPublic,
        isEncrypted,
        environment,
        changeReason,
      } = req.body;

      if (value === undefined || value === null || !type || !category) {
        res.status(400).json({
          success: false,
          message: 'value, type, and category are required',
        });
        return;
      }

      const setting = await SystemSettingsService.setSetting(
        key,
        value,
        type,
        category,
        req.user.id,
        {
          description,
          isPublic,
          isEncrypted,
          environment,
          changeReason,
        },
      );

      res.status(200).json({
        success: true,
        data: { setting },
        message: `Setting ${key} updated successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk update settings
   * PUT /api/v1/admin/settings
   */
  static async setSettings(
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
        throw new AuthorizationError('Only admins can update system settings');
      }

      const { settings, changeReason } = req.body;

      if (!Array.isArray(settings) || settings.length === 0) {
        res.status(400).json({
          success: false,
          message: 'settings array is required',
        });
        return;
      }

      const updated = await SystemSettingsService.setSettings(
        settings,
        req.user.id,
        changeReason,
      );

      res.status(200).json({
        success: true,
        data: { settings: updated },
        message: `${updated.length} settings updated successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a setting
   * DELETE /api/v1/admin/settings/:key
   */
  static async deleteSetting(
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
        throw new AuthorizationError('Only admins can delete system settings');
      }

      const key = (req.params.key as string) as string;

      await SystemSettingsService.deleteSetting(key, req.user.id);

      res.status(200).json({
        success: true,
        message: `Setting ${key} deleted successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get setting history
   * GET /api/v1/admin/settings/:key/history?limit=50
   */
  static async getSettingsHistory(
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
        throw new AuthorizationError('Only admins can access setting history');
      }

      const key = (req.params.key as string) as string;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 50;

      const history = await SystemSettingsService.getSettingsHistory(
        key,
        limit,
      );

      res.status(200).json({
        success: true,
        data: { history },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get public settings (no auth required)
   * GET /api/v1/settings/public
   */
  static async getPublicSettings(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const settings = await SystemSettingsService.getPublicSettings();

      res.status(200).json({
        success: true,
        data: { settings },
      });
    } catch (error) {
      next(error);
    }
  }
}
