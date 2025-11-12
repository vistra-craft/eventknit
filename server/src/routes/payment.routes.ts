import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { guestPaymentRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

/**
 * @route   POST /api/v1/payments/initialize
 * @desc    Initialize payment for a registration (authenticated users)
 * @access  Private
 */
router.post(
  '/initialize',
  authenticate,
  PaymentController.initializePayment,
);

/**
 * @route   POST /api/v1/payments/initialize-guest
 * @desc    Initialize payment for a registration (guest users, no auth required)
 * @access  Public (rate limited)
 */
router.post(
  '/initialize-guest',
  guestPaymentRateLimiter,
  PaymentController.initializeGuestPayment,
);

/**
 * @route   GET /api/v1/payments/verify
 * @desc    Verify payment status
 * @access  Public (for payment callbacks)
 */
router.get(
  '/verify',
  PaymentController.verifyPayment,
);

/**
 * @route   POST /api/v1/payments/webhook
 * @desc    Handle Paystack webhook
 * @access  Public (Paystack calls this)
 */
router.post(
  '/webhook',
  PaymentController.handleWebhook,
);

/**
 * @route   GET /api/v1/payments/status/:registrationId
 * @desc    Get payment status for a registration
 * @access  Private
 */
router.get(
  '/status/:registrationId',
  authenticate,
  PaymentController.getPaymentStatus,
);

export default router;


