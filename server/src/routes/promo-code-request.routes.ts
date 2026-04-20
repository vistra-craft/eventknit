import { Router } from 'express';
import { PromoCodeRequestController } from '../controllers/promo-code-request.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { UserRole } from '@prisma/client';
import Joi from 'joi';

// Validation schemas
const createRequestSchema = Joi.object({
  eventId: Joi.string().uuid().optional(),
  message: Joi.string().max(500).optional(),
});

const rejectRequestSchema = Joi.object({
  reason: Joi.string().max(500).optional(),
});

const approveRequestSchema = Joi.object({
  promoCodeId: Joi.string().uuid().required(),
});

// ── Organizer routes ──────────────────────────────────────
export const organizerRouter = Router();

organizerRouter.use(authenticate);
organizerRouter.use(requireMinRole(UserRole.ORGANIZER));

/**
 * @route   POST /api/v1/promo-codes/requests
 * @desc    Create a promo code request
 * @access  Private (ORGANIZER+)
 */
organizerRouter.post(
  '/',
  validate(createRequestSchema),
  PromoCodeRequestController.createRequest,
);

/**
 * @route   GET /api/v1/promo-codes/requests/mine
 * @desc    Get organizer's own requests
 * @access  Private (ORGANIZER+)
 */
organizerRouter.get('/mine', PromoCodeRequestController.getOrganizerRequests);

// ── Admin routes ──────────────────────────────────────────
export const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(requireMinRole(UserRole.ADMIN));

/**
 * @route   GET /api/v1/admin/promo-codes/requests
 * @desc    Get all promo code requests with filtering
 * @access  Private (ADMIN+)
 */
adminRouter.get('/', PromoCodeRequestController.getRequests);

/**
 * @route   GET /api/v1/admin/promo-codes/requests/pending-count
 * @desc    Get count of pending requests
 * @access  Private (ADMIN+)
 */
adminRouter.get('/pending-count', PromoCodeRequestController.getPendingCount);

/**
 * @route   GET /api/v1/admin/promo-codes/requests/:id
 * @desc    Get a single promo code request by ID
 * @access  Private (ADMIN+)
 */
adminRouter.get('/:id', PromoCodeRequestController.getRequestById);

/**
 * @route   PATCH /api/v1/admin/promo-codes/requests/:id/approve
 * @desc    Approve a promo code request
 * @access  Private (ADMIN+)
 */
adminRouter.patch(
  '/:id/approve',
  validate(approveRequestSchema),
  PromoCodeRequestController.approveRequest,
);

/**
 * @route   PATCH /api/v1/admin/promo-codes/requests/:id/reject
 * @desc    Reject a promo code request
 * @access  Private (ADMIN+)
 */
adminRouter.patch(
  '/:id/reject',
  validate(rejectRequestSchema),
  PromoCodeRequestController.rejectRequest,
);

export default { organizerRouter, adminRouter };
