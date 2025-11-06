import { Router } from 'express';
import { VerificationController } from '../controllers/verification.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { verificationValidations } from '../validations/verification.validations';

const router = Router();

// All verification routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/verification/status
 * @desc    Get verification status for current user
 * @access  Private
 */
router.get('/status', VerificationController.getStatus);

/**
 * @route   POST /api/v1/verification/identity
 * @desc    Submit identity verification (Level 2)
 * @access  Private
 */
router.post(
  '/identity',
  validate(verificationValidations.identityVerification),
  VerificationController.submitIdentityVerification,
);

/**
 * @route   POST /api/v1/verification/business
 * @desc    Submit business verification / KYC (Level 3)
 * @access  Private
 */
router.post(
  '/business',
  validate(verificationValidations.businessVerification),
  VerificationController.submitBusinessVerification,
);

export default router;

