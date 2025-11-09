import { Router, Response, NextFunction } from 'express';
import { OrganizerController } from '../controllers/organizer.controller';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { canManageStaff } from '../utils/privileges';
import { AuthorizationError } from '../utils/errors';

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

export default router;

