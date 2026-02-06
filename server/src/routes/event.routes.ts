import { Router } from 'express';
import { EventController } from '../controllers/event.controller.js';
import { SeatSelectionController } from '../controllers/seat-map.controller.js';
import { validate, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { eventValidations } from '../validations/event.validations.js';
import { reserveSeatsSchema } from '../validations/venue.validations.js';
import { guestRegistrationRateLimiter } from '../middleware/rateLimiter.middleware.js';
import { UserRole } from '@prisma/client';
import Joi from 'joi';

const router = Router();

/**
 * @route   GET /api/v1/events
 * @desc    Get all events (public - can filter by status, category, etc.)
 * @access  Public
 */
router.get('/', EventController.getEvents);

/**
 * @route   GET /api/v1/events/:id
 * @desc    Get event by ID (public)
 * @access  Public
 */
router.get('/:id', EventController.getEventById);

/**
 * @route   POST /api/v1/events/:id/register-guest
 * @desc    Register for an event as guest (public - no auth required)
 * @access  Public
 */
router.post(
  '/:id/register-guest',
  guestRegistrationRateLimiter,
  validate(eventValidations.registerAsGuest),
  EventController.registerAsGuest,
);

/**
 * @route   GET /api/v1/events/:id/seat-map
 * @desc    Get seat map availability (public)
 * @access  Public
 */
router.get(
  '/:id/seat-map',
  validateParams(Joi.object({ id: Joi.string().uuid().required() })),
  SeatSelectionController.getSeatMapAvailability,
);

// Protected routes (require authentication)
router.use(authenticate);

/**
 * @route   POST /api/v1/events
 * @desc    Create a new event
 * @access  Private (ORGANIZER+)
 */
router.post(
  '/',
  validate(eventValidations.createEvent),
  EventController.createEvent,
);

/**
 * @route   PUT /api/v1/events/:id
 * @desc    Update event
 * @access  Private (ORGANIZER+)
 */
router.put(
  '/:id',
  requireMinRole(UserRole.ORGANIZER),
  validate(eventValidations.updateEvent),
  EventController.updateEvent,
);

/**
 * @route   DELETE /api/v1/events/:id
 * @desc    Delete event
 * @access  Private (ORGANIZER+)
 */
router.delete(
  '/:id',
  requireMinRole(UserRole.ORGANIZER),
  EventController.deleteEvent,
);

/**
 * @route   POST /api/v1/events/:id/duplicate
 * @desc    Duplicate an event
 * @access  Private (ORGANIZER+)
 */
router.post(
  '/:id/duplicate',
  requireMinRole(UserRole.ORGANIZER),
  validate(eventValidations.duplicateEvent),
  EventController.duplicateEvent,
);

/**
 * @route   POST /api/v1/events/:id/register
 * @desc    Register for an event (purchase/register)
 * @access  Private (ATTENDEE+)
 */
router.post(
  '/:id/register',
  validate(eventValidations.registerForEvent),
  EventController.registerForEvent,
);

/**
 * @route   GET /api/v1/events/:id/registrations
 * @desc    Get event registrations (organizer function)
 * @access  Private (ORGANIZER+)
 */
router.get(
  '/:id/registrations',
  requireMinRole(UserRole.ORGANIZER),
  EventController.getEventRegistrations,
);

/**
 * @route   DELETE /api/v1/events/registrations/:id
 * @desc    Cancel registration
 * @access  Private (ATTENDEE+)
 */
router.delete(
  '/registrations/:id',
  EventController.cancelRegistration,
);

/**
 * @route   POST /api/v1/events/:id/approve
 * @desc    Approve event (admin function)
 * @access  Private (ADMIN_STAFF+)
 */
router.post(
  '/:id/approve',
  requireMinRole(UserRole.ADMIN_STAFF),
  EventController.approveEvent,
);

/**
 * @route   POST /api/v1/events/:id/reject
 * @desc    Reject event (admin function)
 * @access  Private (ADMIN_STAFF+)
 */
router.post(
  '/:id/reject',
  requireMinRole(UserRole.ADMIN_STAFF),
  validate(eventValidations.rejectEvent),
  EventController.rejectEvent,
);

/**
 * @route   POST /api/v1/events/:id/cancel
 * @desc    Cancel event (organizer function)
 * @access  Private (ORGANIZER+)
 */
router.post(
  '/:id/cancel',
  requireMinRole(UserRole.ORGANIZER),
  EventController.cancelEvent,
);

/**
 * @route   PUT /api/v1/events/bulk/organizer-data-access
 * @desc    Bulk update organizer data access level (admin function)
 * @access  Private (ADMIN_STAFF+)
 * @note    Must be defined before /:id/organizer-data-access to avoid route conflict
 */
router.put(
  '/bulk/organizer-data-access',
  requireMinRole(UserRole.ADMIN_STAFF),
  EventController.bulkUpdateOrganizerDataAccess,
);

/**
 * @route   PUT /api/v1/events/:id/organizer-data-access
 * @desc    Update organizer data access level (admin function)
 * @access  Private (ADMIN_STAFF+)
 */
router.put(
  '/:id/organizer-data-access',
  requireMinRole(UserRole.ADMIN_STAFF),
  EventController.updateOrganizerDataAccess,
);

/**
 * @route   GET /api/v1/events/user/registered
 * @desc    Get user's registered events (for user dashboard)
 * @access  Private (ATTENDEE+)
 */
router.get('/user/registered', EventController.getUserRegisteredEvents);

/**
 * @route   POST /api/v1/events/:id/seats/reserve
 * @desc    Reserve seats for registration
 * @access  Private (ATTENDEE+)
 */
router.post(
  '/:id/seats/reserve',
  validateParams(Joi.object({ id: Joi.string().uuid().required() })),
  validate(reserveSeatsSchema),
  SeatSelectionController.reserveSeats,
);

/**
 * @route   POST /api/v1/events/registrations/:registrationId/seats/confirm
 * @desc    Confirm seat reservation (after payment)
 * @access  Private (ATTENDEE+)
 */
router.post(
  '/registrations/:registrationId/seats/confirm',
  validateParams(Joi.object({ registrationId: Joi.string().uuid().required() })),
  SeatSelectionController.confirmReservation,
);

/**
 * @route   DELETE /api/v1/events/registrations/:registrationId/seats
 * @desc    Cancel seat reservation
 * @access  Private (ATTENDEE+)
 */
router.delete(
  '/registrations/:registrationId/seats',
  validateParams(Joi.object({ registrationId: Joi.string().uuid().required() })),
  SeatSelectionController.cancelReservation,
);

/**
 * @route   GET /api/v1/events/registrations/:registrationId/seats
 * @desc    Get seat selection for registration
 * @access  Private (ATTENDEE+)
 */
router.get(
  '/registrations/:registrationId/seats',
  validateParams(Joi.object({ registrationId: Joi.string().uuid().required() })),
  SeatSelectionController.getSeatSelection,
);

/**
 * @route   POST /api/v1/events/:id/seats/best-available
 * @desc    Find best available seats based on criteria
 * @access  Public
 */
router.post(
  '/:id/seats/best-available',
  validateParams(Joi.object({ id: Joi.string().uuid().required() })),
  validate(Joi.object({
    quantity: Joi.number().integer().min(1).max(10).default(1),
    preferredSeatTypes: Joi.array().items(Joi.string().valid('STANDARD', 'VIP', 'PREMIUM', 'ACCESSIBLE', 'COMPANION')).optional(),
    preferredSections: Joi.array().items(Joi.string()).optional(),
    maxPrice: Joi.number().positive().optional(),
    minPrice: Joi.number().min(0).optional(),
    keepTogether: Joi.boolean().default(true),
    prioritizeValue: Joi.boolean().default(false),
  })),
  SeatSelectionController.getBestAvailableSeats,
);

/**
 * @route   GET /api/v1/events/:id/seats/recommendations
 * @desc    Get seat recommendations with pricing
 * @access  Public
 */
router.get(
  '/:id/seats/recommendations',
  validateParams(Joi.object({ id: Joi.string().uuid().required() })),
  validateQuery(Joi.object({
    budget: Joi.number().positive().optional(),
    quantity: Joi.number().integer().min(1).max(10).default(1),
  })),
  SeatSelectionController.getSeatRecommendations,
);

export default router;

