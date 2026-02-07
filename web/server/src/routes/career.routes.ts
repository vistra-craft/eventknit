import { Router } from 'express';
import { CareerController } from '../controllers/career.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { validate, validateQuery } from '../middleware/validation.middleware.js';
import { careerValidations } from '../validations/career.validations.js';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * Public routes (no authentication required)
 */

/**
 * @route   POST /api/v1/careers
 * @desc    Submit a career inquiry (sends auto-reply email)
 * @access  Public
 */
router.post(
  '/',
  validate(careerValidations.submitInquiry),
  CareerController.submitInquiry,
);

/**
 * Admin routes (authentication required)
 */

/**
 * @route   GET /api/v1/careers
 * @desc    Get all career inquiries
 * @access  Admin only (SUPERADMIN, ADMIN_STAFF)
 */
router.get(
  '/',
  authenticate,
  requireMinRole(UserRole.ADMIN_STAFF),
  validateQuery(careerValidations.getInquiries),
  CareerController.getAllInquiries,
);

/**
 * @route   PATCH /api/v1/careers/:id
 * @desc    Update career inquiry status
 * @access  Admin only (SUPERADMIN, ADMIN_STAFF)
 */
router.patch(
  '/:id',
  authenticate,
  requireMinRole(UserRole.ADMIN_STAFF),
  validate(careerValidations.updateInquiry),
  CareerController.updateInquiry,
);

export default router;
