import { Router, Request } from 'express';
import { CheckpointController } from '../controllers/checkpoint.controller.js';
import { authenticate, requireMinRole, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import { UserRole } from '@prisma/client';

const router = Router();

// All checkpoint routes require authentication
router.use(authenticate);

/**
 * Rate limiter for scanning endpoints
 * Limits: 100 scans per minute per user
 */
const scanRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many scan requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const authReq = req as AuthenticatedRequest;
    return authReq.user?.id || req.ip || 'unknown';
  },
  skip: () => config.env === 'test' || process.env.NODE_ENV === 'test',
});

/**
 * Rate limiter for IP-based scanning (additional protection)
 */
const ipScanRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: 'Too many scan requests from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.ip || 'unknown',
  skip: () => config.env === 'test' || process.env.NODE_ENV === 'test',
});

// ========================================
// Checkpoint CRUD Routes (Admin only)
// ========================================

/**
 * @route   POST /api/v1/checkpoints
 * @desc    Create a new checkpoint
 * @access  Private (ADMIN_STAFF or higher)
 */
router.post('/', requireMinRole(UserRole.ADMIN_STAFF), CheckpointController.createCheckpoint);

/**
 * @route   GET /api/v1/checkpoints/:checkpointId
 * @desc    Get checkpoint by ID
 * @access  Private (ADMIN_STAFF or higher)
 */
router.get('/:checkpointId', requireMinRole(UserRole.ADMIN_STAFF), CheckpointController.getCheckpoint);

/**
 * @route   PUT /api/v1/checkpoints/:checkpointId
 * @desc    Update checkpoint
 * @access  Private (ADMIN_STAFF or higher)
 */
router.put('/:checkpointId', requireMinRole(UserRole.ADMIN_STAFF), CheckpointController.updateCheckpoint);

/**
 * @route   DELETE /api/v1/checkpoints/:checkpointId
 * @desc    Delete checkpoint
 * @access  Private (ADMIN_STAFF or higher)
 */
router.delete('/:checkpointId', requireMinRole(UserRole.ADMIN_STAFF), CheckpointController.deleteCheckpoint);

/**
 * @route   POST /api/v1/checkpoints/:checkpointId/duplicate
 * @desc    Duplicate checkpoint
 * @access  Private (ADMIN_STAFF or higher)
 */
router.post('/:checkpointId/duplicate', requireMinRole(UserRole.ADMIN_STAFF), CheckpointController.duplicateCheckpoint);

// ========================================
// Event Checkpoint Routes
// ========================================

/**
 * @route   GET /api/v1/checkpoints/event/:eventId
 * @desc    Get checkpoints for an event
 * @access  Private (ADMIN_STAFF or higher)
 */
router.get('/event/:eventId', requireMinRole(UserRole.ADMIN_STAFF), CheckpointController.getEventCheckpoints);

/**
 * @route   GET /api/v1/checkpoints/event/:eventId/summary
 * @desc    Get event checkpoint summary with stats
 * @access  Private (ADMIN_STAFF or higher)
 */
router.get(
  '/event/:eventId/summary',
  requireMinRole(UserRole.ADMIN_STAFF),
  CheckpointController.getEventCheckpointSummary,
);

// ========================================
// Checkpoint Scanning Routes
// ========================================

/**
 * @route   POST /api/v1/checkpoints/:checkpointId/scan
 * @desc    Scan at checkpoint
 * @access  Private (TELLER or higher)
 */
router.post(
  '/:checkpointId/scan',
  requireMinRole(UserRole.TELLER),
  scanRateLimiter,
  ipScanRateLimiter,
  CheckpointController.scanCheckpoint,
);

/**
 * @route   GET /api/v1/checkpoints/:checkpointId/scans
 * @desc    Get checkpoint scan history
 * @access  Private (ADMIN_STAFF or higher)
 */
router.get('/:checkpointId/scans', requireMinRole(UserRole.ADMIN_STAFF), CheckpointController.getCheckpointScans);

/**
 * @route   GET /api/v1/checkpoints/:checkpointId/stats
 * @desc    Get checkpoint statistics
 * @access  Private (ADMIN_STAFF or higher)
 */
router.get('/:checkpointId/stats', requireMinRole(UserRole.ADMIN_STAFF), CheckpointController.getCheckpointStats);

// ========================================
// Checkpoint Staff Routes
// ========================================

/**
 * @route   POST /api/v1/checkpoints/:checkpointId/staff
 * @desc    Assign staff to checkpoint
 * @access  Private (ADMIN_STAFF or higher)
 */
router.post('/:checkpointId/staff', requireMinRole(UserRole.ADMIN_STAFF), CheckpointController.assignStaff);

/**
 * @route   GET /api/v1/checkpoints/:checkpointId/staff
 * @desc    Get checkpoint staff
 * @access  Private (ADMIN_STAFF or higher)
 */
router.get('/:checkpointId/staff', requireMinRole(UserRole.ADMIN_STAFF), CheckpointController.getCheckpointStaff);

/**
 * @route   DELETE /api/v1/checkpoints/:checkpointId/staff/:staffId
 * @desc    Remove staff from checkpoint
 * @access  Private (ADMIN_STAFF or higher)
 */
router.delete('/:checkpointId/staff/:staffId', requireMinRole(UserRole.ADMIN_STAFF), CheckpointController.removeStaff);

// ========================================
// Attendee Routes
// ========================================

/**
 * @route   GET /api/v1/checkpoints/attendee/:registrationId
 * @desc    Get attendee checkpoint status
 * @access  Private (TELLER or higher)
 */
router.get(
  '/attendee/:registrationId',
  requireMinRole(UserRole.TELLER),
  CheckpointController.getAttendeeCheckpointStatus,
);

/**
 * @route   GET /api/v1/checkpoints/:checkpointId/eligibility/:registrationId
 * @desc    Check attendee eligibility for checkpoint
 * @access  Private (TELLER or higher)
 */
router.get(
  '/:checkpointId/eligibility/:registrationId',
  requireMinRole(UserRole.TELLER),
  CheckpointController.checkEligibility,
);

export default router;
