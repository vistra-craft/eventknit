import { Router } from 'express';
import { FacilityController } from '../controllers/facility.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

// All facility routes require authentication
router.use(authenticate);

/**
 * POST /api/v1/facilities/events/:eventId/reorder
 * Reorder facilities (must be defined before /:id routes)
 * Requires: ADMIN_STAFF or higher
 */
router.post(
  '/events/:eventId/reorder',
  requireMinRole(UserRole.ADMIN_STAFF),
  FacilityController.reorderFacilities,
);

/**
 * POST /api/v1/facilities/events/:eventId/create-default
 * Create default "Main Entrance" facility
 * Requires: ADMIN_STAFF or higher
 */
router.post(
  '/events/:eventId/create-default',
  requireMinRole(UserRole.ADMIN_STAFF),
  FacilityController.createDefaultFacility,
);

/**
 * POST /api/v1/facilities/events/:eventId/ensure-default
 * Ensure at least one facility exists (creates default if none)
 * Requires: TELLER or higher (used by scanner)
 */
router.post(
  '/events/:eventId/ensure-default',
  requireMinRole(UserRole.TELLER),
  FacilityController.ensureDefaultFacility,
);

/**
 * POST /api/v1/facilities/events/:eventId
 * Create a new facility
 * Requires: ADMIN_STAFF or higher
 */
router.post(
  '/events/:eventId',
  requireMinRole(UserRole.ADMIN_STAFF),
  FacilityController.createFacility,
);

/**
 * GET /api/v1/facilities/events/:eventId
 * Get all facilities for an event
 * Requires: TELLER or higher
 */
router.get(
  '/events/:eventId',
  requireMinRole(UserRole.TELLER),
  FacilityController.getFacilities,
);

/**
 * GET /api/v1/facilities/events/:eventId/:id
 * Get a single facility
 * Requires: TELLER or higher
 */
router.get(
  '/events/:eventId/:id',
  requireMinRole(UserRole.TELLER),
  FacilityController.getFacilityById,
);

/**
 * PUT /api/v1/facilities/events/:eventId/:id
 * Update a facility
 * Requires: ADMIN_STAFF or higher
 */
router.put(
  '/events/:eventId/:id',
  requireMinRole(UserRole.ADMIN_STAFF),
  FacilityController.updateFacility,
);

/**
 * DELETE /api/v1/facilities/events/:eventId/:id
 * Delete a facility
 * Requires: ADMIN_STAFF or higher
 */
router.delete(
  '/events/:eventId/:id',
  requireMinRole(UserRole.ADMIN_STAFF),
  FacilityController.deleteFacility,
);

/**
 * GET /api/v1/facilities/events/:eventId/:id/stats
 * Get facility statistics
 * Requires: TELLER or higher
 */
router.get(
  '/events/:eventId/:id/stats',
  requireMinRole(UserRole.TELLER),
  FacilityController.getFacilityStats,
);

export default router;
