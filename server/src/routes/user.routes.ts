import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/user/me/notification-preferences
 * @desc    Get user notification preferences
 * @access  Private
 */
router.get('/me/notification-preferences', NotificationController.getPreferences);

/**
 * @route   PUT /api/v1/user/me/notification-preferences
 * @desc    Update user notification preferences
 * @access  Private
 */
router.put('/me/notification-preferences', NotificationController.updatePreferences);

export default router;
