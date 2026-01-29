/**
 * Venue Capacity Routes
 * API endpoints for venue capacity management
 */

import { Router } from 'express';
import { VenueCapacityController } from '../controllers/venue-capacity.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== Capacity Status ====================

// GET /capacity/events/:eventId - Get venue capacity status
router.get(
  '/events/:eventId',
  requireMinRole(UserRole.TELLER),
  VenueCapacityController.getCapacityStatus,
);

// GET /capacity/events/:eventId/overview - Get comprehensive capacity overview
router.get(
  '/events/:eventId/overview',
  requireMinRole(UserRole.TELLER),
  VenueCapacityController.getCapacityOverview,
);

// GET /capacity/events/:eventId/zones - Get zone capacity statuses
router.get(
  '/events/:eventId/zones',
  requireMinRole(UserRole.TELLER),
  VenueCapacityController.getZoneCapacities,
);

// GET /capacity/events/:eventId/can-check-in - Check if venue can accept check-ins
router.get(
  '/events/:eventId/can-check-in',
  requireMinRole(UserRole.TELLER),
  VenueCapacityController.canCheckIn,
);

// ==================== Capacity Management ====================

// PUT /capacity/events/:eventId - Set venue maximum capacity
router.put(
  '/events/:eventId',
  requireMinRole(UserRole.ADMIN_STAFF),
  VenueCapacityController.setVenueCapacity,
);

// POST /capacity/events/:eventId/reset - Reset occupancy counters
router.post(
  '/events/:eventId/reset',
  requireMinRole(UserRole.ADMIN_STAFF),
  VenueCapacityController.resetOccupancy,
);

// POST /capacity/events/:eventId/recalculate - Recalculate occupancy from records
router.post(
  '/events/:eventId/recalculate',
  requireMinRole(UserRole.ADMIN_STAFF),
  VenueCapacityController.recalculateOccupancy,
);

export default router;
