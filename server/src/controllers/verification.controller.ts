import { Request, Response, NextFunction } from 'express';
import { VerificationService } from '../services/verification.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class VerificationController {
  /**
   * Get verification status
   */
  static async getStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const status = await VerificationService.getVerificationStatus(req.user.id);

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit identity verification
   */
  static async submitIdentityVerification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const result = await VerificationService.submitIdentityVerification(req.user.id, req.body);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          verificationLevel: result.verificationLevel,
          payoutLimit: result.payoutLimit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit business verification / KYC
   */
  static async submitBusinessVerification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const result = await VerificationService.submitBusinessVerification(req.user.id, req.body);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          verificationLevel: result.verificationLevel,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

