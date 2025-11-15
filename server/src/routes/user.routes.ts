import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/user/dashboard/stats
 * @desc    Get user dashboard statistics
 * @access  Private (User can only view their own stats)
 */
router.get('/dashboard/stats', UserController.getDashboardStats);

export default router;

