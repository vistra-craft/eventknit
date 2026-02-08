import { Response, NextFunction } from 'express';
import { ConfigurationService } from '../services/configuration.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class ConfigurationController {
  /**
   * Get system configuration
   */
  static async getConfiguration(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const configuration = await ConfigurationService.getConfiguration();
      res.status(200).json({
        success: true,
        data: configuration,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update mailTrap configuration
   */
  static async updateMailTrap(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { trap, toAddress, ccAddress } = req.body;

      await ConfigurationService.updateMailTrap(
        {
          trap: Boolean(trap),
          toAddress: Array.isArray(toAddress) ? toAddress : [],
          ccAddress: Array.isArray(ccAddress) ? ccAddress : [],
        },
        req.user?.id,
      );

      res.status(200).json({
        success: true,
        message: 'MailTrap configuration updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update maintenance mode
   */
  static async updateMaintenanceMode(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { isUnderMaintenance, message, startTime, endTime } = req.body;

      await ConfigurationService.updateMaintenanceMode(
        Boolean(isUnderMaintenance),
        message,
        startTime ? new Date(startTime) : undefined,
        endTime ? new Date(endTime) : undefined,
        req.user?.id,
      );

      res.status(200).json({
        success: true,
        message: `Maintenance mode ${isUnderMaintenance ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if system is under maintenance (public endpoint)
   */
  static async checkMaintenanceStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const isUnderMaintenance = await ConfigurationService.isSystemUnderMaintenance();
      res.status(200).json({
        success: true,
        data: { isUnderMaintenance },
      });
    } catch (error) {
      next(error);
    }
  }
}
