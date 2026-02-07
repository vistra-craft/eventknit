import { Response, NextFunction } from 'express';
import { ServicePointRegistrationService } from '../services/service-point-registration.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ValidationError } from '../utils/errors.js';

export class ServicePointRegistrationController {
  /**
   * Initiate service point registration by sending OTP to attendee
   * POST /api/v1/events/:eventId/service-point/initiate
   * Requires: TELLER or higher
   */
  static async initiateRegistration(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const eventId = req.params.eventId as string;
      const { phoneNumber, facilityId } = req.body;

      if (!eventId) {
        throw new ValidationError('Event ID is required');
      }

      if (!phoneNumber) {
        throw new ValidationError('Phone number is required');
      }

      const result = await ServicePointRegistrationService.initiateRegistration(
        eventId,
        phoneNumber,
        req.user.id,
        facilityId,
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify OTP code
   * POST /api/v1/events/:eventId/service-point/verify
   * Requires: TELLER or higher
   */
  static async verifyOTP(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const { sessionId, otp } = req.body;

      if (!sessionId) {
        throw new ValidationError('Session ID is required');
      }

      if (!otp) {
        throw new ValidationError('OTP is required');
      }

      const result = await ServicePointRegistrationService.verifyOTP(sessionId, otp);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Complete registration with attendee details
   * POST /api/v1/events/:eventId/service-point/complete
   * Requires: TELLER or higher
   */
  static async completeRegistration(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const { sessionId, firstName, lastName, email, company, industry, jobTitle, ticketTypeId, registrationData } =
        req.body;

      if (!sessionId) {
        throw new ValidationError('Session ID is required');
      }

      const result = await ServicePointRegistrationService.completeRegistration(sessionId, {
        firstName,
        lastName,
        email,
        company,
        industry,
        jobTitle,
        ticketTypeId,
        registrationData,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get session status
   * GET /api/v1/events/:eventId/service-point/session/:sessionId
   * Requires: TELLER or higher
   */
  static async getSessionStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const sessionId = req.params.sessionId as string;

      if (!sessionId) {
        throw new ValidationError('Session ID is required');
      }

      const result = await ServicePointRegistrationService.getSessionStatus(sessionId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel an incomplete session
   * DELETE /api/v1/events/:eventId/service-point/session/:sessionId
   * Requires: TELLER or higher
   */
  static async cancelSession(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const sessionId = req.params.sessionId as string;

      if (!sessionId) {
        throw new ValidationError('Session ID is required');
      }

      await ServicePointRegistrationService.cancelSession(sessionId);

      res.status(200).json({
        success: true,
        message: 'Session cancelled successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get kiosk configuration for self-service display
   * GET /api/v1/events/:eventId/service-point/kiosk-config
   * Public endpoint (no auth required for kiosk display)
   */
  static async getKioskConfig(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.params.eventId as string;

      if (!eventId) {
        throw new ValidationError('Event ID is required');
      }

      const result = await ServicePointRegistrationService.getKioskConfig(eventId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get service point statistics
   * GET /api/v1/events/:eventId/service-point/stats
   * Requires: TELLER or higher
   */
  static async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const eventId = req.params.eventId as string;

      if (!eventId) {
        throw new ValidationError('Event ID is required');
      }

      const result = await ServicePointRegistrationService.getServicePointStats(eventId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check for active session by phone number
   * GET /api/v1/events/:eventId/service-point/check-phone/:phoneNumber
   * Requires: TELLER or higher
   */
  static async checkActiveSession(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const eventId = req.params.eventId as string;
      const phoneNumber = req.params.phoneNumber as string;

      if (!eventId) {
        throw new ValidationError('Event ID is required');
      }

      if (!phoneNumber) {
        throw new ValidationError('Phone number is required');
      }

      const result = await ServicePointRegistrationService.getActiveSession(phoneNumber, eventId);

      res.status(200).json({
        success: true,
        data: result,
        hasActiveSession: result !== null,
      });
    } catch (error) {
      next(error);
    }
  }
}
