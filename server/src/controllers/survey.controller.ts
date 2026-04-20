/**
 * Survey Controller
 *
 * Thin wrapper over SurveyService — extracts request data, calls service, formats response.
 * Authorization is handled via route-level middleware (requireMinRole / authenticate).
 */

import { Response, NextFunction } from 'express';
import { SurveyService } from '../services/survey.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AuthenticationError } from '../utils/errors.js';

export class SurveyController {
  // ─── Organizer / Admin — Survey Management ──────────────────────────────────

  /**
   * POST /api/v1/surveys
   * Create a survey for an event.
   */
  static async createSurvey(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');

      const survey = await SurveyService.createSurvey(req.user.id, req.body);

      res.status(201).json({
        success: true,
        message: 'Survey created successfully',
        data: { survey },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/surveys/:surveyId
   * Update a survey.
   */
  static async updateSurvey(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');

      const surveyId = req.params.surveyId as string;
      const survey = await SurveyService.updateSurvey(surveyId, req.user.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Survey updated successfully',
        data: { survey },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/surveys/:surveyId
   * Delete a survey (only if no responses).
   */
  static async deleteSurvey(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');

      const surveyId = req.params.surveyId as string;
      await SurveyService.deleteSurvey(surveyId, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Survey deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/surveys/event/:eventId
   * Get survey config for an event (organizer view — includes response count).
   */
  static async getSurveyForOrganizer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');

      const eventId = req.params.eventId as string;
      const survey = await SurveyService.getSurveyForOrganizer(eventId);

      res.status(200).json({
        success: true,
        data: { survey },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/surveys/event/:eventId/results
   * Get aggregated survey results (organizer/admin analytics).
   */
  static async getSurveyResults(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');

      const eventId = req.params.eventId as string;
      const results = await SurveyService.getSurveyResults(eventId);

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  // ─── Attendee — Survey Response ─────────────────────────────────────────────

  /**
   * GET /api/v1/surveys/event/:eventId/public
   * Get survey form for an attendee to fill out.
   */
  static async getSurveyForAttendee(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');

      const eventId = req.params.eventId as string;
      const survey = await SurveyService.getSurveyByEventId(eventId);
      const hasResponded = await SurveyService.hasResponded(survey.id, req.user.id);

      res.status(200).json({
        success: true,
        data: { survey, hasResponded },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/surveys/:surveyId/respond
   * Submit a survey response.
   */
  static async submitResponse(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');

      const surveyId = req.params.surveyId as string;
      const response = await SurveyService.submitResponse(req.user.id, {
        surveyId,
        ...req.body,
      });

      res.status(201).json({
        success: true,
        message: 'Thank you for your feedback!',
        data: { response },
      });
    } catch (error) {
      next(error);
    }
  }

  // ─── Admin — Platform Overview ──────────────────────────────────────────────

  /**
   * GET /api/v1/admin/surveys
   * List all surveys across platform (admin only).
   */
  static async getAllSurveys(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AuthenticationError('Authentication required');

      const { page, limit, eventId } = req.query as Record<string, string>;
      const results = await SurveyService.getAllSurveyResults({
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        eventId: eventId || undefined,
      });

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
}
