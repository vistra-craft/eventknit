import { Router, Request } from 'express';
import { ServicePointRegistrationController } from '../controllers/service-point-registration.controller.js';
import { authenticate, requireMinRole, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * Rate limiter for registration initiation
 * Limits: 30 initiations per minute per user (to prevent SMS abuse)
 */
const initiateRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many registration requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const authReq = req as AuthenticatedRequest;
    return authReq.user?.id || req.ip || 'unknown';
  },
  skip: () => config.env === 'test' || process.env.NODE_ENV === 'test',
});

/**
 * Rate limiter for OTP verification
 * Limits: 10 attempts per minute per session (to prevent brute force)
 */
const verifyRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many verification attempts. Please wait before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Rate limit per session ID
    return req.body?.sessionId || req.ip || 'unknown';
  },
  skip: () => config.env === 'test' || process.env.NODE_ENV === 'test',
});

/**
 * @route   POST /api/v1/events/:eventId/service-point/initiate
 * @desc    Initiate service point registration by sending OTP to attendee
 * @access  Private (TELLER or higher)
 */
router.post(
  '/:eventId/service-point/initiate',
  authenticate,
  requireMinRole(UserRole.TELLER),
  initiateRateLimiter,
  ServicePointRegistrationController.initiateRegistration,
);

/**
 * @route   POST /api/v1/events/:eventId/service-point/verify
 * @desc    Verify OTP code
 * @access  Private (TELLER or higher)
 */
router.post(
  '/:eventId/service-point/verify',
  authenticate,
  requireMinRole(UserRole.TELLER),
  verifyRateLimiter,
  ServicePointRegistrationController.verifyOTP,
);

/**
 * @route   POST /api/v1/events/:eventId/service-point/complete
 * @desc    Complete registration with attendee details
 * @access  Private (TELLER or higher)
 */
router.post(
  '/:eventId/service-point/complete',
  authenticate,
  requireMinRole(UserRole.TELLER),
  ServicePointRegistrationController.completeRegistration,
);

/**
 * @route   GET /api/v1/events/:eventId/service-point/session/:sessionId
 * @desc    Get session status
 * @access  Private (TELLER or higher)
 */
router.get(
  '/:eventId/service-point/session/:sessionId',
  authenticate,
  requireMinRole(UserRole.TELLER),
  ServicePointRegistrationController.getSessionStatus,
);

/**
 * @route   DELETE /api/v1/events/:eventId/service-point/session/:sessionId
 * @desc    Cancel an incomplete session
 * @access  Private (TELLER or higher)
 */
router.delete(
  '/:eventId/service-point/session/:sessionId',
  authenticate,
  requireMinRole(UserRole.TELLER),
  ServicePointRegistrationController.cancelSession,
);

/**
 * @route   GET /api/v1/events/:eventId/service-point/kiosk-config
 * @desc    Get kiosk configuration for self-service display
 * @access  Public (for kiosk display)
 */
router.get('/:eventId/service-point/kiosk-config', ServicePointRegistrationController.getKioskConfig);

/**
 * @route   GET /api/v1/events/:eventId/service-point/stats
 * @desc    Get service point statistics
 * @access  Private (TELLER or higher)
 */
router.get(
  '/:eventId/service-point/stats',
  authenticate,
  requireMinRole(UserRole.TELLER),
  ServicePointRegistrationController.getStats,
);

/**
 * @route   GET /api/v1/events/:eventId/service-point/check-phone/:phoneNumber
 * @desc    Check for active session by phone number
 * @access  Private (TELLER or higher)
 */
router.get(
  '/:eventId/service-point/check-phone/:phoneNumber',
  authenticate,
  requireMinRole(UserRole.TELLER),
  ServicePointRegistrationController.checkActiveSession,
);

export default router;
