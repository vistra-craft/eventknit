import { Router } from 'express';
import { PromoCodeController } from '../controllers/promo-code.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * @route   POST /api/v1/promo-codes/validate
 * @desc    Validate a promo code (public - for checkout)
 * @access  Public (but user ID helps with usage limits)
 */
router.post('/validate', PromoCodeController.validatePromoCode);

// Protected routes (require authentication)
router.use(authenticate);

/**
 * @route   POST /api/v1/promo-codes
 * @desc    Create a new promo code
 * @access  Private (ORGANIZER+)
 */
router.post(
  '/',
  requireMinRole(UserRole.ORGANIZER),
  PromoCodeController.createPromoCode,
);

/**
 * @route   GET /api/v1/promo-codes
 * @desc    Get promo codes for organizer
 * @access  Private (ORGANIZER+)
 */
router.get(
  '/',
  requireMinRole(UserRole.ORGANIZER),
  PromoCodeController.getPromoCodes,
);

/**
 * @route   GET /api/v1/promo-codes/:id
 * @desc    Get a single promo code
 * @access  Private (ORGANIZER+)
 */
router.get(
  '/:id',
  requireMinRole(UserRole.ORGANIZER),
  PromoCodeController.getPromoCode,
);

/**
 * @route   PUT /api/v1/promo-codes/:id
 * @desc    Update a promo code
 * @access  Private (ORGANIZER+)
 */
router.put(
  '/:id',
  requireMinRole(UserRole.ORGANIZER),
  PromoCodeController.updatePromoCode,
);

/**
 * @route   DELETE /api/v1/promo-codes/:id
 * @desc    Delete a promo code
 * @access  Private (ORGANIZER+)
 */
router.delete(
  '/:id',
  requireMinRole(UserRole.ORGANIZER),
  PromoCodeController.deletePromoCode,
);

export default router;

