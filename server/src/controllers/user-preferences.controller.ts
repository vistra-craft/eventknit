import { Response, NextFunction } from 'express';
import {
  UserPreferencesService,
  UserPreferencesData,
} from '../services/user-preferences.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ValidationError } from '../utils/errors.js';

export class UserPreferencesController {
  /**
   * Get current user's preferences
   * GET /api/v1/user/me/preferences
   */
  static async getPreferences(
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

      const preferences = await UserPreferencesService.getUserPreferences(
        req.user.id,
      );

      res.status(200).json({
        success: true,
        data: { preferences },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user's preferences
   * PUT /api/v1/user/me/preferences
   */
  static async updatePreferences(
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

      const preferences = req.body.preferences || req.body;

      if (!preferences || typeof preferences !== 'object') {
        throw new ValidationError('Preferences data is required');
      }

      const updated = await UserPreferencesService.updatePreferences(
        req.user.id,
        preferences,
      );

      res.status(200).json({
        success: true,
        message: 'Preferences updated successfully',
        data: { preferences: updated },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a single preference
   * PATCH /api/v1/user/me/preferences/:key
   */
  static async updatePreference(
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

      const key = (req.params.key as string) as string;
      const { value } = req.body;

      if (!key) {
        throw new ValidationError('Preference key is required');
      }

      if (value === undefined) {
        throw new ValidationError('Preference value is required');
      }

      const updated = await UserPreferencesService.updatePreference(
        req.user.id,
        key as keyof UserPreferencesData,
        value,
      );

      res.status(200).json({
        success: true,
        message: 'Preference updated successfully',
        data: { preferences: updated },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset preferences to defaults
   * POST /api/v1/user/me/preferences/reset
   */
  static async resetPreferences(
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

      const preferences = await UserPreferencesService.resetPreferences(
        req.user.id,
      );

      res.status(200).json({
        success: true,
        message: 'Preferences reset to defaults',
        data: { preferences },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get default preferences for current user's role
   * GET /api/v1/user/me/preferences/defaults
   */
  static async getDefaults(
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

      const defaults = UserPreferencesService.getDefaultPreferencesForRole(
        req.user.role,
      );

      res.status(200).json({
        success: true,
        data: { preferences: defaults },
      });
    } catch (error) {
      next(error);
    }
  }
}

