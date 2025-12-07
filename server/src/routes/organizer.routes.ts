import { Router, Response, NextFunction } from 'express';
import { OrganizerController } from '../controllers/organizer.controller.js';
import { EventStaffController } from '../controllers/event-staff.controller.js';
import { StaffPerformanceController } from '../controllers/staff-performance.controller.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { canManageStaff } from '../utils/privileges.js';
import { AuthorizationError } from '../utils/errors.js';

const router = Router();

// All organizer routes require authentication
router.use(authenticate);

// Middleware to check if user can manage staff
const canManageStaffMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user || !canManageStaff(req.user.role)) {
    throw new AuthorizationError('You do not have permission to manage staff');
  }
  next();
};

/**
 * @route   POST /api/v1/organizer/staff
 * @desc    Create staff member
 * @access  Private (ORGANIZER+)
 */
router.post('/staff', canManageStaffMiddleware, OrganizerController.createStaff);

/**
 * @route   GET /api/v1/organizer/staff
 * @desc    Get all staff members
 * @access  Private (ORGANIZER+)
 */
router.get('/staff', canManageStaffMiddleware, OrganizerController.getStaff);

/**
 * @route   GET /api/v1/organizer/staff/assignments
 * @desc    Get all staff assignments for organizer's events
 * @access  Private (ORGANIZER+)
 */
router.get('/staff/assignments', EventStaffController.getOrganizerStaffAssignments);

/**
 * @route   GET /api/v1/organizer/staff/:id
 * @desc    Get staff member by ID
 * @access  Private (ORGANIZER+)
 */
router.get('/staff/:id', canManageStaffMiddleware, OrganizerController.getStaffById);

/**
 * @route   PUT /api/v1/organizer/staff/:id
 * @desc    Update staff member
 * @access  Private (ORGANIZER+)
 */
router.put('/staff/:id', canManageStaffMiddleware, OrganizerController.updateStaff);

/**
 * @route   DELETE /api/v1/organizer/staff/:id
 * @desc    Delete staff member (soft delete)
 * @access  Private (ORGANIZER+)
 */
router.delete('/staff/:id', canManageStaffMiddleware, OrganizerController.deleteStaff);

/**
 * @route   POST /api/v1/organizer/staff/:id/deactivate
 * @desc    Deactivate staff member
 * @access  Private (ORGANIZER+)
 */
router.post('/staff/:id/deactivate', canManageStaffMiddleware, OrganizerController.deactivateStaff);

/**
 * @route   GET /api/v1/organizer/dashboard/stats
 * @desc    Get organizer dashboard stats
 * @access  Private (ORGANIZER+)
 */
router.get('/dashboard/stats', OrganizerController.getDashboardStats);

/**
 * @route   GET /api/v1/organizer/dashboard/events
 * @desc    Get organizer dashboard events
 * @access  Private (ORGANIZER+)
 */
router.get('/dashboard/events', OrganizerController.getDashboardEvents);

/**
 * @route   GET /api/v1/organizer/events
 * @desc    Get all organizer events (with filters: status, category, search, upcoming, past)
 * @access  Private (ORGANIZER+)
 */
router.get('/events', OrganizerController.getOrganizerEvents);

/**
 * @route   POST /api/v1/organizer/events/:eventId/staff
 * @desc    Assign organizer staff to event
 * @access  Private (ORGANIZER+)
 */
router.post('/events/:eventId/staff', EventStaffController.assignOrganizerStaffToEvent);

/**
 * @route   GET /api/v1/organizer/events/:eventId/staff
 * @desc    Get organizer staff assigned to event
 * @access  Private (ORGANIZER+)
 */
router.get('/events/:eventId/staff', EventStaffController.getOrganizerEventStaff);

/**
 * @route   GET /api/v1/organizer/staff/:staffId/events
 * @desc    Get events where organizer staff is assigned
 * @access  Private (ORGANIZER+)
 */
router.get('/staff/:staffId/events', EventStaffController.getOrganizerStaffEvents);

/**
 * @route   PUT /api/v1/organizer/events/:eventId/staff/:staffId
 * @desc    Update organizer staff assignment
 * @access  Private (ORGANIZER+)
 */
router.put('/events/:eventId/staff/:staffId', EventStaffController.updateOrganizerStaffAssignment);

/**
 * @route   DELETE /api/v1/organizer/events/:eventId/staff/:staffId
 * @desc    Remove organizer staff from event
 * @access  Private (ORGANIZER+)
 */
router.delete('/events/:eventId/staff/:staffId', EventStaffController.removeOrganizerStaffFromEvent);

/**
 * @route   GET /api/v1/organizer/staff-performance/team
 * @desc    Get team performance metrics
 * @access  Private (ORGANIZER+)
 */
router.get('/staff-performance/team', StaffPerformanceController.getTeamPerformance);

/**
 * @route   GET /api/v1/organizer/staff-performance/team/summary
 * @desc    Get team performance summary
 * @access  Private (ORGANIZER+)
 */
router.get('/staff-performance/team/summary', StaffPerformanceController.getTeamSummary);

/**
 * @route   GET /api/v1/organizer/staff-performance/utilization
 * @desc    Get organizer staff utilization metrics
 * @access  Private (ORGANIZER+)
 */
router.get('/staff-performance/utilization', StaffPerformanceController.getOrganizerStaffUtilization);

/**
 * @route   GET /api/v1/organizer/staff-performance/coverage
 * @desc    Get event coverage analysis
 * @access  Private (ORGANIZER+)
 */
router.get('/staff-performance/coverage', StaffPerformanceController.getEventCoverageAnalysis);

/**
 * @route   GET /api/v1/organizer/staff-performance/availability
 * @desc    Get staff availability tracking
 * @access  Private (ORGANIZER+)
 */
router.get('/staff-performance/availability', StaffPerformanceController.getStaffAvailability);

/**
 * @route   GET /api/v1/organizer/staff-performance/:staffId/trends
 * @desc    Get performance trends for a staff member
 * @access  Private (ORGANIZER+)
 */
router.get('/staff-performance/:staffId/trends', StaffPerformanceController.getPerformanceTrends);

/**
 * @route   GET /api/v1/organizer/staff-performance/:staffId
 * @desc    Get performance metrics for a specific staff member
 * @access  Private (ORGANIZER+)
 */
router.get('/staff-performance/:staffId', StaffPerformanceController.getStaffPerformance);

export default router;

