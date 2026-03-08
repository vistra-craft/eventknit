import { Router } from 'express';
import { ExtendedProfileController } from '../controllers/extended-profile.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { extendedProfileValidations } from '../validations/extended-profile.validations.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/profile/organizer
 * @desc    Get current user's organizer profile
 * @access  Private (any authenticated organizer)
 */
router.get('/organizer', ExtendedProfileController.getMyOrganizerProfile);

/**
 * @route   PUT /api/v1/profile/organizer
 * @desc    Update current user's organizer profile
 * @access  Private (any authenticated organizer)
 */
router.put(
  '/organizer',
  validate(extendedProfileValidations.upsertOrganizerProfile),
  ExtendedProfileController.updateMyOrganizerProfile,
);

/**
 * @route   GET /api/v1/profile/organizer/:userId
 * @desc    Get organizer profile by user ID (admin use)
 * @access  Private (SUPERADMIN, ADMIN_STAFF)
 */
router.get(
  '/organizer/:userId',
  authorize('SUPERADMIN', 'ADMIN', 'ADMIN_STAFF'),
  ExtendedProfileController.getOrganizerProfile,
);

/**
 * @route   PUT /api/v1/profile/organizer/:userId
 * @desc    Update organizer profile by user ID (admin use)
 * @access  Private (SUPERADMIN, ADMIN_STAFF)
 */
router.put(
  '/organizer/:userId',
  authorize('SUPERADMIN', 'ADMIN', 'ADMIN_STAFF'),
  validate(extendedProfileValidations.upsertOrganizerProfile),
  ExtendedProfileController.updateOrganizerProfile,
);

export default router;
