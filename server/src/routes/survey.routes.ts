/**
 * Survey Routes
 *
 * POST   /api/v1/surveys                         — Create survey (organizer/admin)
 * PUT    /api/v1/surveys/:surveyId                — Update survey (organizer/admin)
 * DELETE /api/v1/surveys/:surveyId                — Delete survey (organizer/admin)
 * GET    /api/v1/surveys/event/:eventId           — Get survey config (organizer/admin)
 * GET    /api/v1/surveys/event/:eventId/results   — Get aggregated results (organizer/admin)
 * GET    /api/v1/surveys/event/:eventId/public    — Get survey form (attendee)
 * POST   /api/v1/surveys/:surveyId/respond        — Submit response (attendee)
 */

import { Router } from 'express';
import Joi from 'joi';
import { SurveyController } from '../controllers/survey.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate, validateParams } from '../middleware/validation.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ─── Survey Management (Organizer / Admin) ──────────────────────────────────

router.post(
  '/',
  validate(Joi.object({
    eventId: Joi.string().uuid().required(),
    title: Joi.string().max(200).optional(),
    description: Joi.string().max(1000).optional(),
    includeNps: Joi.boolean().optional(),
    includeVenueRating: Joi.boolean().optional(),
    includeSpeakerRating: Joi.boolean().optional(),
    includeContentRating: Joi.boolean().optional(),
    includeOrgRating: Joi.boolean().optional(),
    includeValueRating: Joi.boolean().optional(),
    customQuestions: Joi.array().max(5).items(
      Joi.object({
        id: Joi.string().required(),
        question: Joi.string().max(500).required(),
        type: Joi.string().valid('multiple_choice', 'text', 'rating').required(),
        options: Joi.when('type', {
          is: 'multiple_choice',
          then: Joi.array().min(2).max(10).items(Joi.string().max(200)).required(),
          otherwise: Joi.array().optional(),
        }),
      }),
    ).optional(),
    triggerAfterHours: Joi.number().integer().min(1).max(168).optional(), // 1h to 7 days
  })),
  SurveyController.createSurvey,
);

router.put(
  '/:surveyId',
  validateParams(Joi.object({ surveyId: Joi.string().uuid().required() })),
  validate(Joi.object({
    title: Joi.string().max(200).optional(),
    description: Joi.string().max(1000).optional(),
    includeNps: Joi.boolean().optional(),
    includeVenueRating: Joi.boolean().optional(),
    includeSpeakerRating: Joi.boolean().optional(),
    includeContentRating: Joi.boolean().optional(),
    includeOrgRating: Joi.boolean().optional(),
    includeValueRating: Joi.boolean().optional(),
    customQuestions: Joi.array().max(5).items(
      Joi.object({
        id: Joi.string().required(),
        question: Joi.string().max(500).required(),
        type: Joi.string().valid('multiple_choice', 'text', 'rating').required(),
        options: Joi.when('type', {
          is: 'multiple_choice',
          then: Joi.array().min(2).max(10).items(Joi.string().max(200)).required(),
          otherwise: Joi.array().optional(),
        }),
      }),
    ).optional(),
    triggerAfterHours: Joi.number().integer().min(1).max(168).optional(),
    isActive: Joi.boolean().optional(),
  })),
  SurveyController.updateSurvey,
);

router.delete(
  '/:surveyId',
  validateParams(Joi.object({ surveyId: Joi.string().uuid().required() })),
  SurveyController.deleteSurvey,
);

router.get(
  '/event/:eventId',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  SurveyController.getSurveyForOrganizer,
);

router.get(
  '/event/:eventId/results',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  SurveyController.getSurveyResults,
);

// ─── Attendee ───────────────────────────────────────────────────────────────

router.get(
  '/event/:eventId/public',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  SurveyController.getSurveyForAttendee,
);

router.post(
  '/:surveyId/respond',
  validateParams(Joi.object({ surveyId: Joi.string().uuid().required() })),
  validate(Joi.object({
    eventId: Joi.string().uuid().required(),
    registrationId: Joi.string().uuid().optional(),
    overallRating: Joi.number().integer().min(1).max(5).required(),
    npsScore: Joi.number().integer().min(0).max(10).optional(),
    venueRating: Joi.number().integer().min(1).max(5).optional(),
    speakerRating: Joi.number().integer().min(1).max(5).optional(),
    contentRating: Joi.number().integer().min(1).max(5).optional(),
    orgRating: Joi.number().integer().min(1).max(5).optional(),
    valueRating: Joi.number().integer().min(1).max(5).optional(),
    customAnswers: Joi.object().optional(),
    comment: Joi.string().max(2000).allow('').optional(),
  })),
  SurveyController.submitResponse,
);

export default router;
