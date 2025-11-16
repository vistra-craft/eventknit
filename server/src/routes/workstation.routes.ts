import { Router, Request } from 'express';
import { WorkstationController } from '../controllers/workstation.controller.js';
import { authenticate, requireMinRole, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import { UserRole } from '@prisma/client';

const router = Router();

// All workstation routes require authentication
router.use(authenticate);

/**
 * Rate limiter for scanning endpoints
 * Limits: 100 scans per minute per user
 */
const scanRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 scans per minute
  message: 'Too many scan requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Rate limit per user, not per IP
    const authReq = req as AuthenticatedRequest;
    return authReq.user?.id || req.ip || 'unknown';
  },
  skip: () => config.env === 'test' || process.env.NODE_ENV === 'test',
});

/**
 * Rate limiter for IP-based scanning (additional protection)
 * Limits: 200 scans per minute per IP
 */
const ipScanRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 scans per minute per IP
  message: 'Too many scan requests from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown';
  },
  skip: () => config.env === 'test' || process.env.NODE_ENV === 'test',
});

/**
 * Rate limiter for search endpoints
 * Limits: 30 searches per minute per user
 */
const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: 'Too many search requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const authReq = req as AuthenticatedRequest;
    return authReq.user?.id || req.ip || 'unknown';
  },
  skip: () => config.env === 'test' || process.env.NODE_ENV === 'test',
});

/**
 * @route   POST /api/v1/workstation/scan
 * @desc    Scan ticket (check-in)
 * @access  Private (TELLER or higher)
 */
router.post(
  '/scan',
  requireMinRole(UserRole.TELLER),
  scanRateLimiter,
  ipScanRateLimiter,
  WorkstationController.scanTicket,
);

/**
 * @route   POST /api/v1/workstation/scan-out
 * @desc    Scan out (check-out)
 * @access  Private (TELLER or higher)
 */
router.post(
  '/scan-out',
  requireMinRole(UserRole.TELLER),
  scanRateLimiter,
  ipScanRateLimiter,
  WorkstationController.scanOut,
);

/**
 * @route   GET /api/v1/workstation/tickets/:ticketId
 * @desc    Get ticket details with scan history
 * @access  Private (TELLER or higher)
 */
router.get('/tickets/:ticketId', requireMinRole(UserRole.TELLER), WorkstationController.getTicket);

/**
 * @route   POST /api/v1/workstation/manual-check-in
 * @desc    Manual check-in (by search term)
 * @access  Private (ADMIN_STAFF or higher)
 */
router.post(
  '/manual-check-in',
  requireMinRole(UserRole.ADMIN_STAFF),
  scanRateLimiter,
  WorkstationController.manualCheckIn,
);

/**
 * @route   POST /api/v1/workstation/manual-check-out
 * @desc    Manual check-out (by search term)
 * @access  Private (ADMIN_STAFF or higher)
 */
router.post(
  '/manual-check-out',
  requireMinRole(UserRole.ADMIN_STAFF),
  scanRateLimiter,
  WorkstationController.manualCheckOut,
);

/**
 * @route   GET /api/v1/workstation/search
 * @desc    Search attendees
 * @access  Private (TELLER or higher)
 */
router.get(
  '/search',
  requireMinRole(UserRole.TELLER),
  searchRateLimiter,
  WorkstationController.searchAttendees,
);

/**
 * @route   GET /api/v1/workstation/events/:eventId
 * @desc    Get event with scan configuration and statistics
 * @access  Private (TELLER or higher)
 */
router.get('/events/:eventId', requireMinRole(UserRole.TELLER), WorkstationController.getEvent);

/**
 * @route   GET /api/v1/workstation/events/:eventId/attendees
 * @desc    Get event attendees with scan status
 * @access  Private (TELLER or higher)
 */
router.get(
  '/events/:eventId/attendees',
  requireMinRole(UserRole.TELLER),
  WorkstationController.getEventAttendees,
);

/**
 * @route   GET /api/v1/workstation/events/:eventId/scans
 * @desc    Get scan history for event
 * @access  Private (TELLER or higher)
 */
router.get('/events/:eventId/scans', requireMinRole(UserRole.TELLER), WorkstationController.getEventScans);

/**
 * @route   GET /api/v1/workstation/events/:eventId/config
 * @desc    Get event scan configuration
 * @access  Private (TELLER or higher)
 */
router.get('/events/:eventId/config', requireMinRole(UserRole.TELLER), WorkstationController.getEventConfig);

/**
 * @route   PUT /api/v1/workstation/events/:eventId/config
 * @desc    Update event scan configuration
 * @access  Private (ADMIN_STAFF or higher)
 */
router.put(
  '/events/:eventId/config',
  requireMinRole(UserRole.ADMIN_STAFF),
  WorkstationController.updateEventConfig,
);

export default router;

