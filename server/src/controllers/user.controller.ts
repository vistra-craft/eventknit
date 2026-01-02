import { Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class UserController {
  /**
   * Get user dashboard statistics
   * Similar to Eventbrite's user dashboard
   */
  static async getDashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const stats = await UserService.getDashboardStats(req.user.id);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get role switch options for the current user
   */
  static async getRoleSwitchOptions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const options = await UserService.getRoleSwitchOptions(req.user.id);

      res.status(200).json({
        success: true,
        data: options,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Switch from ATTENDEE to ORGANIZER
   */
  static async becomeOrganizer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { organizationName, businessEmail } = req.body;

      const user = await UserService.becomeOrganizer(
        req.user.id,
        { organizationName, businessEmail },
        req.ip,
        req.headers['user-agent'],
      );

      res.status(200).json({
        success: true,
        message: 'Successfully switched to Organizer role',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Switch from ORGANIZER to ATTENDEE
   */
  static async becomeAttendee(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const user = await UserService.becomeAttendee(
        req.user.id,
        req.ip,
        req.headers['user-agent'],
      );

      res.status(200).json({
        success: true,
        message: 'Successfully switched to Attendee role',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
}

