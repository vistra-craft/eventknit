/**
 * Seating Routes
 *
 * Routes for seat allocation, assignment, and management
 */

import { Router } from 'express';
import { authenticate as authenticateToken } from '../middleware/auth.middleware.js';
import { SeatingController } from '../controllers/seating.controller.js';

const router = Router();

/**
 * Customer seat reservation (temporary, for cart)
 */
router.post(
  '/events/:eventId/seats/reserve',
  authenticateToken,
  (req, res, next) => SeatingController.reserveSeats(req, res, next),
);

/**
 * Customer seat confirmation (after payment)
 */
router.post(
  '/registrations/:registrationId/seats/confirm',
  authenticateToken,
  (req, res, next) => SeatingController.confirmSeats(req, res, next),
);

/**
 * Organizer assigns seat to attendee
 */
router.post(
  '/organizer-dashboard/events/:eventId/seats/assign',
  authenticateToken,
  (req, res, next) => SeatingController.assignSeat(req, res, next),
);

/**
 * Customer saves seat preferences (for ORGANIZER_ASSIGNS events)
 */
router.post(
  '/registrations/:registrationId/seats/preferences',
  authenticateToken,
  (req, res, next) => SeatingController.saveSeatPreferences(req, res, next),
);

/**
 * Get available seats for event
 */
router.get(
  '/events/:eventId/seats/available',
  authenticateToken,
  (req, res, next) => SeatingController.getAvailableSeats(req, res, next),
);

/**
 * Get seat statistics for event
 */
router.get(
  '/events/:eventId/seats/statistics',
  authenticateToken,
  (req, res, next) => SeatingController.getSeatStatistics(req, res, next),
);

/**
 * Configure seating for event
 */
router.post(
  '/organizer-dashboard/events/:eventId/seating/configure',
  authenticateToken,
  (req, res, next) => SeatingController.configureSeating(req, res, next),
);

/**
 * Validate seating configuration
 */
router.get(
  '/organizer-dashboard/events/:eventId/seating/validate',
  authenticateToken,
  (req, res, next) => SeatingController.validateSeatingConfiguration(req, res, next),
);

/**
 * Get seating configuration
 */
router.get(
  '/events/:eventId/seating/configuration',
  authenticateToken,
  (req, res, next) => SeatingController.getSeatingConfiguration(req, res, next),
);

/**
 * Dashboard: Get seat allocation summary
 * GET /api/v1/organizer-dashboard/events/:eventId/seats/summary
 * Returns: totalSeats, allocatedSeats, availableSeats, pendingSeats, byModel breakdown
 */
router.get(
  '/organizer-dashboard/events/:eventId/seats/summary',
  authenticateToken,
  (req, res, next) => SeatingController.getSeatAllocationSummary(req, res, next),
);

/**
 * Dashboard: Get seat allocations list with pagination
 * GET /api/v1/organizer-dashboard/events/:eventId/seats/allocations?page=1&limit=50&status=all
 * Returns: paginated list of seat allocations with attendee info
 */
router.get(
  '/organizer-dashboard/events/:eventId/seats/allocations',
  authenticateToken,
  (req, res, next) => SeatingController.getSeatAllocations(req, res, next),
);

/**
 * Dashboard: Get seat allocation breakdown by ticket type
 * GET /api/v1/organizer-dashboard/events/:eventId/seats/by-type
 * Returns: allocation stats grouped by ticket type
 */
router.get(
  '/organizer-dashboard/events/:eventId/seats/by-type',
  authenticateToken,
  (req, res, next) => SeatingController.getSeatAllocationByType(req, res, next),
);

/**
 * Dashboard: Get seat transfer and resale operations history
 * GET /api/v1/organizer-dashboard/events/:eventId/seats/operations?limit=20
 * Returns: list of seat transfer, resale, and allocation operations
 */
router.get(
  '/organizer-dashboard/events/:eventId/seats/operations',
  authenticateToken,
  (req, res, next) => SeatingController.getSeatOperations(req, res, next),
);

/**
 * Get registration seats
 * GET /api/v1/registrations/:registrationId/seats
 * Returns: list of seats allocated to a specific registration
 */
router.get(
  '/registrations/:registrationId/seats',
  authenticateToken,
  (req, res, next) => SeatingController.getRegistrationSeats(req, res, next),
);

export default router;
