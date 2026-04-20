import { Router, Request } from 'express';
import { TicketController } from '../controllers/ticket.controller.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';
import { config as _config } from '../config/index.js';

const router = Router();

/**
 * Rate limiter for resend ticket email
 * Limits: 3 resends per hour per user
 */
const resendTicketRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 resends per hour
  message: 'Too many resend requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _next) => {
    res.status(429).json({
      success: false,
      message: 'Too many resend requests. Please try again later.',
    });
  },
  keyGenerator: (req: Request) => {
    // Rate limit per user, not per IP
    const authReq = req as AuthenticatedRequest;
    return authReq.user?.id || req.ip || 'unknown';
  },
});

/**
 * @route   GET /api/v1/tickets/:registrationId/view
 * @desc    Get ticket by registration ID (public - with email verification)
 * @access  Public (requires email query parameter)
 */
router.get('/:registrationId/view', TicketController.getTicketPublic);

/**
 * @route   GET /api/v1/tickets/:registrationId/download-public
 * @desc    Download ticket as PDF (public - with email verification)
 * @access  Public (requires email query parameter)
 */
router.get('/:registrationId/download-public', TicketController.downloadTicketPDFPublic);

// Protected routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/tickets/:registrationId
 * @desc    Get ticket by registration ID
 * @access  Private (User can view their own tickets, organizers can view their event tickets, admins can view any)
 */
router.get('/:registrationId', TicketController.getTicket);

/**
 * @route   GET /api/v1/tickets/:registrationId/download
 * @desc    Download ticket as PDF
 * @access  Private (User can download their own tickets, organizers can download their event tickets, admins can download any)
 */
router.get('/:registrationId/download', TicketController.downloadTicketPDF);

/**
 * @route   POST /api/v1/tickets/:registrationId/resend
 * @desc    Resend ticket email
 * @access  Private (User can only resend their own tickets)
 */
router.post('/:registrationId/resend', resendTicketRateLimiter, TicketController.resendTicketEmail);

/**
 * @route   GET /api/v1/tickets/:registrationId/refund-eligibility
 * @desc    Check refund eligibility for a registration
 * @access  Private (User can only check their own registrations)
 */
router.get('/:registrationId/refund-eligibility', TicketController.checkRefundEligibility);

/**
 * @route   POST /api/v1/tickets/:registrationId/request-refund
 * @desc    Request a refund for a registration
 * @access  Private (User can only request refunds for their own registrations)
 */
router.post('/:registrationId/request-refund', TicketController.requestRefund);

export default router;

