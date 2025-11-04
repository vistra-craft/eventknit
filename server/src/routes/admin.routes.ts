import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireMinRole } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// All admin routes require ADMIN_STAFF or higher (SUPERADMIN, ADMIN_STAFF)
router.use(requireMinRole(UserRole.ADMIN_STAFF));

/**
 * @route   POST /api/v1/admin/users
 * @desc    Create a new user (admin function)
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/users', AdminController.createUser);

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with filters
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/users', AdminController.getUsers);

/**
 * @route   GET /api/v1/admin/users/:id
 * @desc    Get user by ID
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/users/:id', AdminController.getUserById);

/**
 * @route   PUT /api/v1/admin/users/:id
 * @desc    Update user
 * @access  Private (ADMIN_STAFF+)
 */
router.put('/users/:id', AdminController.updateUser);

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (ADMIN_STAFF+)
 */
router.delete('/users/:id', AdminController.deleteUser);

/**
 * @route   POST /api/v1/admin/users/:id/password
 * @desc    Force password reset
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/users/:id/password', AdminController.forcePasswordReset);

/**
 * @route   GET /api/v1/admin/dashboard/stats
 * @desc    Get admin dashboard stats
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/dashboard/stats', AdminController.getDashboardStats);

/**
 * @route   GET /api/v1/admin/dashboard/events
 * @desc    Get recent events for admin dashboard
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/dashboard/events', AdminController.getRecentEvents);

/**
 * @route   GET /api/v1/admin/dashboard/activity
 * @desc    Get recent activity for admin dashboard
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/dashboard/activity', AdminController.getRecentActivity);

/**
 * @route   GET /api/v1/admin/dashboard/alerts
 * @desc    Get system alerts for admin dashboard
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/dashboard/alerts', AdminController.getSystemAlerts);

export default router;



