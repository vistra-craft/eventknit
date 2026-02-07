import { Router, Response, NextFunction } from 'express';
import { OrganizerController } from '../controllers/organizer.controller.js';
import { EventStaffController } from '../controllers/event-staff.controller.js';
import { StaffPerformanceController } from '../controllers/staff-performance.controller.js';
import { InvoiceController } from '../controllers/invoice.controller.js';
import { WhiteLabelController } from '../controllers/white-label.controller.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { canManageStaff } from '../utils/privileges.js';
import { AuthorizationError } from '../utils/errors.js';
import { validate, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import {
  createBrandingSchema,
  createCustomDomainSchema,
  updateCustomDomainSchema,
} from '../validations/white-label.validations.js';
import Joi from 'joi';

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
 * @route   GET /api/v1/organizer/dashboard-access
 * @desc    Check if organizer has dashboard access (has created an event)
 * @access  Private (ORGANIZER+)
 */
router.get('/dashboard-access', OrganizerController.getDashboardAccess);

/**
 * @route   POST /api/v1/organizer/onboarding/complete
 * @desc    Complete onboarding for organizer (save preferences and mark as complete)
 * @access  Private (ORGANIZER)
 */
router.post('/onboarding/complete', OrganizerController.completeOnboarding);

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

// ========== Invoices ==========
router.get(
  '/events/:eventId/invoices',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  validateQuery(Joi.object({
    status: Joi.string().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  })),
  InvoiceController.getEventInvoices,
);

// ========== White-Label Branding ==========
/**
 * @route   GET /api/v1/organizer/branding
 * @desc    Get organizer's branding
 * @access  Private (ORGANIZER+)
 */
router.get('/branding', WhiteLabelController.getBranding);

/**
 * @route   PUT /api/v1/organizer/branding
 * @desc    Create or update branding
 * @access  Private (ORGANIZER+)
 */
router.put('/branding', validate(createBrandingSchema), WhiteLabelController.upsertBranding);

/**
 * @route   GET /api/v1/organizer/custom-domains
 * @desc    Get custom domains for organizer
 * @access  Private (ORGANIZER+)
 */
router.get('/custom-domains', WhiteLabelController.getCustomDomains);

/**
 * @route   POST /api/v1/organizer/custom-domains
 * @desc    Add custom domain
 * @access  Private (ORGANIZER+)
 */
router.post('/custom-domains', validate(createCustomDomainSchema), WhiteLabelController.addCustomDomain);

/**
 * @route   GET /api/v1/organizer/custom-domains/:domainId
 * @desc    Get custom domain by ID
 * @access  Private (ORGANIZER+)
 */
router.get('/custom-domains/:domainId', WhiteLabelController.getCustomDomainById);

/**
 * @route   PUT /api/v1/organizer/custom-domains/:domainId
 * @desc    Update custom domain
 * @access  Private (ORGANIZER+)
 */
router.put('/custom-domains/:domainId', validate(updateCustomDomainSchema), WhiteLabelController.updateCustomDomain);

/**
 * @route   DELETE /api/v1/organizer/custom-domains/:domainId
 * @desc    Delete custom domain
 * @access  Private (ORGANIZER+)
 */
router.delete('/custom-domains/:domainId', WhiteLabelController.deleteCustomDomain);

export default router;

