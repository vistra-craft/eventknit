import { Response, NextFunction } from 'express';
import { OrganizerService } from '../services/organizer.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class OrganizerController {
  /**
   * Create staff member
   */
  static async createStaff(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const staff = await OrganizerService.createStaff(
        req.body,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(201).json({
        success: true,
        message: 'Staff member created successfully',
        data: { staff },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all staff members
   */
  static async getStaff(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const staff = await OrganizerService.getStaff(req.user.id, req.user.role);

      res.status(200).json({
        success: true,
        data: { staff },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get staff member by ID
   */
  static async getStaffById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const staff = await OrganizerService.getStaffById(
        req.params.id,
        req.user.id,
        req.user.role,
      );

      res.status(200).json({
        success: true,
        data: { staff },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update staff member
   */
  static async updateStaff(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const staff = await OrganizerService.updateStaff(
        req.params.id,
        req.body,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Staff member updated successfully',
        data: { staff },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete staff member
   */
  static async deleteStaff(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      await OrganizerService.deleteStaff(
        req.params.id,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Staff member deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate staff member
   */
  static async deactivateStaff(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      await OrganizerService.deactivateStaff(
        req.params.id,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Staff member deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

