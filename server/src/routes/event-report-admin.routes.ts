import { Router } from 'express';
import { EventReportController } from '../controllers/event-report.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { validate, validateQuery } from '../middleware/validation.middleware.js';
import { eventReportValidations } from '../validations/event-report.validations.js';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * @route   GET /api/v1/admin/event-reports/stats
 * @desc    Get report statistics
 * @access  Admin only (ADMIN_STAFF+)
 */
router.get(
  '/stats',
  authenticate,
  requireMinRole(UserRole.ADMIN_STAFF),
  EventReportController.getReportStats,
);

/**
 * @route   GET /api/v1/admin/event-reports
 * @desc    Get all event reports with filters
 * @access  Admin only (ADMIN_STAFF+)
 */
router.get(
  '/',
  authenticate,
  requireMinRole(UserRole.ADMIN_STAFF),
  validateQuery(eventReportValidations.getReports),
  EventReportController.getReports,
);

/**
 * @route   PATCH /api/v1/admin/event-reports/:id
 * @desc    Update report status
 * @access  Admin only (ADMIN_STAFF+)
 */
router.patch(
  '/:id',
  authenticate,
  requireMinRole(UserRole.ADMIN_STAFF),
  validate(eventReportValidations.updateReport),
  EventReportController.updateReport,
);

export default router;
