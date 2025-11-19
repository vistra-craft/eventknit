import { Router } from 'express';
import { UnifiedMessagingController } from '../controllers/unified-messaging.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

// All unified messaging routes require authentication and ADMIN_STAFF+ role
router.use(authenticate);
router.use(requireMinRole(UserRole.ADMIN_STAFF));

/**
 * @route   POST /api/v1/admin/communications/unified
 * @desc    Send unified message across all channels
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/unified', UnifiedMessagingController.sendUnifiedMessage);

/**
 * @route   POST /api/v1/admin/communications/messages/:id/engagement
 * @desc    Track message engagement (open, click, unsubscribe)
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/messages/:id/engagement', UnifiedMessagingController.trackEngagement);

/**
 * @route   GET /api/v1/admin/communications/messages/:id/engagement
 * @desc    Get message engagement statistics
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/messages/:id/engagement', UnifiedMessagingController.getEngagementStats);

export default router;




