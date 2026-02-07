import { Router } from 'express';
import { FacilityZoneController } from '../controllers/facility-zone.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

// All facility zone routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/zones
 * @desc    Create a new facility zone
 * @access  Private (ADMIN_STAFF or higher)
 */
router.post('/', requireMinRole(UserRole.ADMIN_STAFF), FacilityZoneController.createZone);

/**
 * @route   GET /api/v1/events/:eventId/zones
 * @desc    Get all zones for an event
 * @access  Private (TELLER or higher)
 */
router.get('/events/:eventId/zones', requireMinRole(UserRole.TELLER), FacilityZoneController.getEventZones);

/**
 * @route   GET /api/v1/events/:eventId/zones/analytics
 * @desc    Get zone analytics for an event
 * @access  Private (ADMIN_STAFF or higher)
 */
router.get('/events/:eventId/zones/analytics', requireMinRole(UserRole.ADMIN_STAFF), FacilityZoneController.getZoneAnalytics);

/**
 * @route   GET /api/v1/zones/:id
 * @desc    Get zone by ID
 * @access  Private (TELLER or higher)
 */
router.get('/:id', requireMinRole(UserRole.TELLER), FacilityZoneController.getZoneById);

/**
 * @route   PUT /api/v1/zones/:id
 * @desc    Update a zone
 * @access  Private (ADMIN_STAFF or higher)
 */
router.put('/:id', requireMinRole(UserRole.ADMIN_STAFF), FacilityZoneController.updateZone);

/**
 * @route   POST /api/v1/zones/:zoneId/facilities/:facilityId
 * @desc    Assign facility to zone
 * @access  Private (ADMIN_STAFF or higher)
 */
router.post('/:zoneId/facilities/:facilityId', requireMinRole(UserRole.ADMIN_STAFF), FacilityZoneController.assignFacility);

/**
 * @route   DELETE /api/v1/zones/:zoneId/facilities/:facilityId
 * @desc    Remove facility from zone
 * @access  Private (ADMIN_STAFF or higher)
 */
router.delete('/:zoneId/facilities/:facilityId', requireMinRole(UserRole.ADMIN_STAFF), FacilityZoneController.removeFacility);

/**
 * @route   POST /api/v1/zones/:zoneId/attendees/bulk-assign
 * @desc    Bulk assign attendees to zone
 * @access  Private (ADMIN_STAFF or higher)
 */
router.post('/:zoneId/attendees/bulk-assign', requireMinRole(UserRole.ADMIN_STAFF), FacilityZoneController.bulkAssignAttendees);

/**
 * @route   GET /api/v1/zones/:zoneId/attendees
 * @desc    Get attendees in a zone
 * @access  Private (TELLER or higher)
 */
router.get('/:zoneId/attendees', requireMinRole(UserRole.TELLER), FacilityZoneController.getAttendeesInZone);

/**
 * @route   DELETE /api/v1/zones/:zoneId/attendees/:registrationId
 * @desc    Revoke attendee access to zone
 * @access  Private (ADMIN_STAFF or higher)
 */
router.delete('/:zoneId/attendees/:registrationId', requireMinRole(UserRole.ADMIN_STAFF), FacilityZoneController.revokeAccess);

/**
 * @route   GET /api/v1/zones/:zoneId/access/check/:registrationId
 * @desc    Validate attendee access to zone
 * @access  Private (TELLER or higher)
 */
router.get('/:zoneId/access/check/:registrationId', requireMinRole(UserRole.TELLER), FacilityZoneController.validateAccess);

/**
 * @route   GET /api/v1/zones/:zoneId/capacity
 * @desc    Check zone capacity
 * @access  Private (TELLER or higher)
 */
router.get('/:zoneId/capacity', requireMinRole(UserRole.TELLER), FacilityZoneController.checkCapacity);

/**
 * @route   GET /api/v1/registrations/:registrationId/movements
 * @desc    Get attendee movement history
 * @access  Private (TELLER or higher)
 */
router.get('/registrations/:registrationId/movements', requireMinRole(UserRole.TELLER), FacilityZoneController.getMovementHistory);

export default router;
