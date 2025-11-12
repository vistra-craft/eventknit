import { Router } from 'express';
import { FeaturedEventController } from '../controllers/featured-event.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * @route   GET /api/v1/featured-events/active
 * @desc    Get active featured events (public - for hero section)
 * @access  Public
 */
router.get('/active', FeaturedEventController.getActiveFeaturedEvents);

// Protected routes (require authentication)
router.use(authenticate);

/**
 * @route   GET /api/v1/featured-events
 * @desc    Get all featured events (admin)
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/',
  requireMinRole(UserRole.ADMIN_STAFF),
  FeaturedEventController.getAllFeaturedEvents,
);

/**
 * @route   POST /api/v1/featured-events
 * @desc    Create a new featured event
 * @access  Private (ADMIN_STAFF+)
 */
router.post(
  '/',
  requireMinRole(UserRole.ADMIN_STAFF),
  FeaturedEventController.createFeaturedEvent,
);

/**
 * @route   GET /api/v1/featured-events/:id
 * @desc    Get featured event by ID
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/:id',
  requireMinRole(UserRole.ADMIN_STAFF),
  FeaturedEventController.getFeaturedEventById,
);

/**
 * @route   PUT /api/v1/featured-events/:id
 * @desc    Update featured event
 * @access  Private (ADMIN_STAFF+)
 */
router.put(
  '/:id',
  requireMinRole(UserRole.ADMIN_STAFF),
  FeaturedEventController.updateFeaturedEvent,
);

/**
 * @route   DELETE /api/v1/featured-events/:id
 * @desc    Delete featured event
 * @access  Private (ADMIN_STAFF+)
 */
router.delete(
  '/:id',
  requireMinRole(UserRole.ADMIN_STAFF),
  FeaturedEventController.deleteFeaturedEvent,
);

export default router;


