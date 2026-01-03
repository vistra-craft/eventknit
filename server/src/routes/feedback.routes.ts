import { Router } from 'express';
import { FeedbackController } from '../controllers/feedback.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * Public routes (no authentication required)
 * These allow feedback submission via email token
 */

/**
 * @route   GET /api/v1/feedback/token/:token
 * @desc    Validate a feedback token
 * @access  Public
 */
router.get('/token/:token', FeedbackController.validateFeedbackToken);

/**
 * @route   POST /api/v1/feedback/token/:token
 * @desc    Submit feedback via email token
 * @access  Public
 */
router.post('/token/:token', FeedbackController.submitFeedbackViaToken);

/**
 * Authenticated routes
 */

/**
 * @route   POST /api/v1/feedback
 * @desc    Submit feedback (authenticated users)
 * @access  Private
 */
router.post('/', authenticate, FeedbackController.submitFeedback);

export default router;
