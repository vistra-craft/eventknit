import { Response, NextFunction } from 'express';
import { ExtendedProfileService } from '../services/extended-profile.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class ExtendedProfileController {
  /**
   * Get staff profile
   */
  static async getStaffProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = (req.params.userId as string) as string;
      const result = await ExtendedProfileService.getStaffProfile(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update staff profile
   */
  static async updateStaffProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = (req.params.userId as string) as string;
      const profile = await ExtendedProfileService.upsertStaffProfile(userId, req.body);

      res.status(200).json({
        success: true,
        message: 'Staff profile updated successfully',
        data: { staffProfile: profile },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get organizer profile
   */
  static async getOrganizerProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = (req.params.userId as string) as string;
      const result = await ExtendedProfileService.getOrganizerProfile(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update organizer profile
   */
  static async updateOrganizerProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = (req.params.userId as string) as string;
      const profile = await ExtendedProfileService.upsertOrganizerProfile(userId, req.body);

      res.status(200).json({
        success: true,
        message: 'Organizer profile updated successfully',
        data: { organizerProfile: profile },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get emergency contact
   */
  static async getEmergencyContact(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = (req.params.userId as string) as string;
      const contact = await ExtendedProfileService.getEmergencyContact(userId);

      res.status(200).json({
        success: true,
        data: { emergencyContact: contact },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update emergency contact
   */
  static async updateEmergencyContact(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = (req.params.userId as string) as string;
      const contact = await ExtendedProfileService.upsertEmergencyContact(userId, req.body);

      res.status(200).json({
        success: true,
        message: 'Emergency contact updated successfully',
        data: { emergencyContact: contact },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete emergency contact
   */
  static async deleteEmergencyContact(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = (req.params.userId as string) as string;
      await ExtendedProfileService.deleteEmergencyContact(userId);

      res.status(200).json({
        success: true,
        message: 'Emergency contact deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get full user profile with all extended data
   */
  static async getFullProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = (req.params.userId as string) as string;
      const profile = await ExtendedProfileService.getFullUserProfile(userId);

      res.status(200).json({
        success: true,
        data: { profile },
      });
    } catch (error) {
      next(error);
    }
  }
}
