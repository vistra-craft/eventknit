import { Router } from 'express';
import { FeedbackController } from '../controllers/feedback.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

// All admin feedback routes require authentication and admin role
router.use(authenticate);
router.use(requireMinRole(UserRole.ADMIN_STAFF));

/**
 * @route   GET /api/v1/admin/feedback
 * @desc    Get all feedback with filters
 * @access  Private (Admin only)
 */
router.get('/', FeedbackController.getAllFeedback);

/**
 * @route   GET /api/v1/admin/feedback/analytics
 * @desc    Get feedback analytics
 * @access  Private (Admin only)
 */
router.get('/analytics', FeedbackController.getFeedbackAnalytics);

/**
 * @route   GET /api/v1/admin/feedback/event/:eventId
 * @desc    Get feedback for a specific event
 * @access  Private (Admin only)
 */
router.get('/event/:eventId', FeedbackController.getEventFeedback);

/**
 * @route   GET /api/v1/admin/feedback/:id
 * @desc    Get single feedback by ID
 * @access  Private (Admin only)
 */
router.get('/:id', FeedbackController.getFeedbackById);

/**
 * @route   PATCH /api/v1/admin/feedback/:id/notes
 * @desc    Add admin notes to feedback
 * @access  Private (Admin only)
 */
router.patch('/:id/notes', FeedbackController.addAdminNotes);

/**
 * @route   POST /api/v1/admin/feedback/trigger/:eventId
 * @desc    Trigger feedback emails for an event
 * @access  Private (Admin only)
 */
router.post('/trigger/:eventId', FeedbackController.triggerFeedbackEmails);

export default router;
