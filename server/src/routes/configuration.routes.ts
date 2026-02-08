import { Router } from 'express';
import { ConfigurationController } from '../controllers/configuration.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * Public endpoint - Check maintenance status
 * GET /api/v1/configuration/maintenance/status
 */
router.get('/maintenance/status', ConfigurationController.checkMaintenanceStatus);

/**
 * Protected endpoints - Require SUPERADMIN role
 */

// Get configuration
router.get(
  '/',
  authenticate,
  requireRole([UserRole.SUPERADMIN]),
  ConfigurationController.getConfiguration,
);

// Update mailTrap configuration
router.put(
  '/mailtrap',
  authenticate,
  requireRole([UserRole.SUPERADMIN]),
  ConfigurationController.updateMailTrap,
);

// Update maintenance mode
router.put(
  '/maintenance',
  authenticate,
  requireRole([UserRole.SUPERADMIN]),
  ConfigurationController.updateMaintenanceMode,
);

export default router;
