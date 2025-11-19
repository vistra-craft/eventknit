import { Router } from 'express';
import { SupportController } from '../controllers/support.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

// All support routes require authentication and ADMIN_STAFF+ role
router.use(authenticate);
router.use(requireMinRole(UserRole.ADMIN_STAFF));

/**
 * @route   GET /api/v1/admin/support/inbox
 * @desc    Get unified support inbox (all channels)
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/inbox', SupportController.getInbox);

/**
 * @route   GET /api/v1/admin/support/queries/:id
 * @desc    Get support query by ID
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/queries/:id', SupportController.getQueryById);

/**
 * @route   POST /api/v1/admin/support/queries/:id/assign
 * @desc    Assign query to agent
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/queries/:id/assign', SupportController.assignQuery);

/**
 * @route   PATCH /api/v1/admin/support/queries/:id/status
 * @desc    Update query status
 * @access  Private (ADMIN_STAFF+)
 */
router.patch('/queries/:id/status', SupportController.updateQueryStatus);

/**
 * @route   POST /api/v1/admin/support/queries/:id/responses
 * @desc    Add response to query
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/queries/:id/responses', SupportController.addResponse);

/**
 * @route   GET /api/v1/admin/support/statistics
 * @desc    Get support statistics
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/statistics', SupportController.getStatistics);

/**
 * @route   GET /api/v1/admin/support/agents/:id/performance
 * @desc    Get agent performance metrics
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/agents/:id/performance', SupportController.getAgentPerformance);

export default router;


