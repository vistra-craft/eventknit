/**
 * Admin Survey Routes
 *
 * GET /api/v1/admin/surveys — List all surveys across platform (admin only)
 */

import { Router } from 'express';
import Joi from 'joi';
import { SurveyController } from '../controllers/survey.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { validateQuery } from '../middleware/validation.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(requireMinRole(UserRole.ADMIN));

router.get(
  '/',
  validateQuery(Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    eventId: Joi.string().uuid().optional(),
  })),
  SurveyController.getAllSurveys,
);

export default router;
