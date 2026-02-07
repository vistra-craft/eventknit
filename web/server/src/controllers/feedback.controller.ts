import { Response, NextFunction, Request } from 'express';
import { FeedbackService } from '../services/feedback.service.js';
import { FeedbackEmailService } from '../services/feedback-email.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ValidationError } from '../utils/errors.js';

export class FeedbackController {
  /**
   * Submit feedback (authenticated users)
   * POST /api/v1/feedback
   */
  static async submitFeedback(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const {
        eventId,
        userType,
        npsScore,
        comment,
        eventQuality,
        platformUsability,
        registrationProcess,
        communicationQuality,
        improvementAreas,
        wouldUseAgain,
        wouldRecommend,
      } = req.body;

      if (!eventId) {
        throw new ValidationError('Event ID is required');
      }

      if (npsScore === undefined || npsScore < 0 || npsScore > 10) {
        throw new ValidationError('NPS score must be between 0 and 10');
      }

      if (!userType || !['ATTENDEE', 'ORGANIZER'].includes(userType)) {
        throw new ValidationError('User type must be ATTENDEE or ORGANIZER');
      }

      const feedback = await FeedbackService.createOrUpdateFeedback({
        eventId,
        userId: req.user.id,
        userType,
        npsScore,
        comment,
        eventQuality,
        platformUsability,
        registrationProcess,
        communicationQuality,
        improvementAreas,
        wouldUseAgain,
        wouldRecommend,
        submittedVia: 'PLATFORM',
      });

      res.status(201).json({
        success: true,
        data: { feedback },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit feedback via email token (no authentication)
   * POST /api/v1/feedback/token/:token
   */
  static async submitFeedbackViaToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const token = (req.params.token as string) as string;

      if (!token) {
        throw new ValidationError('Feedback token is required');
      }

      const {
        npsScore,
        comment,
        eventQuality,
        platformUsability,
        registrationProcess,
        communicationQuality,
        improvementAreas,
        wouldUseAgain,
        wouldRecommend,
      } = req.body;

      if (npsScore === undefined || npsScore < 0 || npsScore > 10) {
        throw new ValidationError('NPS score must be between 0 and 10');
      }

      const feedback = await FeedbackService.submitFeedbackViaToken(token, {
        npsScore,
        comment,
        eventQuality,
        platformUsability,
        registrationProcess,
        communicationQuality,
        improvementAreas,
        wouldUseAgain,
        wouldRecommend,
      });

      res.status(200).json({
        success: true,
        data: { feedback },
        message: 'Thank you for your feedback!',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate feedback token (for pre-filling form)
   * GET /api/v1/feedback/token/:token
   */
  static async validateFeedbackToken(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      const token = (req.params.token as string) as string;

      if (!token) {
        throw new ValidationError('Feedback token is required');
      }

      // This will throw if token is invalid
      const feedback = await FeedbackService.submitFeedbackViaToken(token, {
        npsScore: 0, // Dummy value, won't be saved
      });

      // Return event info for the feedback form
      res.status(200).json({
        success: true,
        data: {
          eventId: feedback.eventId,
          eventTitle: feedback.event?.title,
          valid: true,
        },
      });
    } catch (_error) {
      // Token is invalid or expired
      res.status(400).json({
        success: false,
        data: { valid: false },
        error: { message: 'Invalid or expired feedback token' },
      });
    }
  }

  /**
   * Get all feedback (admin only)
   * GET /api/v1/admin/feedback
   */
  static async getAllFeedback(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const {
        page,
        limit,
        userType,
        eventId,
        minNps,
        maxNps,
        startDate,
        endDate,
      } = req.query;

      const result = await FeedbackService.getAllFeedback({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        userType: userType as 'ATTENDEE' | 'ORGANIZER' | undefined,
        eventId: eventId as string | undefined,
        minNps: minNps ? parseInt(minNps as string, 10) : undefined,
        maxNps: maxNps ? parseInt(maxNps as string, 10) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get feedback analytics (admin only)
   * GET /api/v1/admin/feedback/analytics
   */
  static async getFeedbackAnalytics(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const { startDate, endDate, eventId } = req.query;

      const analytics = await FeedbackService.getFeedbackAnalytics({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        eventId: eventId as string | undefined,
      });

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single feedback by ID (admin only)
   * GET /api/v1/admin/feedback/:id
   */
  static async getFeedbackById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const id = (req.params.id as string) as string;
      const feedback = await FeedbackService.getFeedbackById(id);

      res.status(200).json({
        success: true,
        data: { feedback },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add admin notes to feedback (admin only)
   * PATCH /api/v1/admin/feedback/:id/notes
   */
  static async addAdminNotes(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const id = (req.params.id as string) as string;
      const { notes } = req.body;

      if (!notes || typeof notes !== 'string') {
        throw new ValidationError('Notes are required');
      }

      const feedback = await FeedbackService.addAdminNotes(id, req.user.id, notes);

      res.status(200).json({
        success: true,
        data: { feedback },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Trigger feedback emails for an event (admin only)
   * POST /api/v1/admin/feedback/trigger/:eventId
   */
  static async triggerFeedbackEmails(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const { includeOrganizer = true, includeAttendees = true } = req.body;

      const results: {
        attendees?: { sent: number; failed: number };
        organizer?: boolean;
      } = {};

      if (includeAttendees) {
        results.attendees = await FeedbackEmailService.triggerAttendeeFeedbackEmails(eventId);
      }

      if (includeOrganizer) {
        results.organizer = await FeedbackEmailService.triggerOrganizerFeedbackEmail(eventId);
      }

      res.status(200).json({
        success: true,
        data: results,
        message: 'Feedback emails triggered successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get feedback for a specific event (admin/organizer)
   * GET /api/v1/admin/feedback/event/:eventId
   */
  static async getEventFeedback(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const { page, limit } = req.query;

      const result = await FeedbackService.getEventFeedback(eventId, {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default FeedbackController;
