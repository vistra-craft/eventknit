import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate, requireMinRole } from '../middleware/auth.middleware';
import { eventValidations } from '../validations/event.validations';
import { UserRole } from '@prisma/client';

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

// Protected routes (require authentication)
router.use(authenticate);

/**
 * @route   POST /api/v1/events
 * @desc    Create a new event
 * @access  Private (ORGANIZER+)
 */
router.post(
  '/',
  requireMinRole(UserRole.ORGANIZER),
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

export default router;

