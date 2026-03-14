import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { FeaturedEventController } from '../controllers/featured-event.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { uploadSingleImage } from '../utils/upload.js';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * Wrapper for multer middleware to handle errors
 * Only processes multipart/form-data requests, skips JSON requests
 */
const handleMulterUpload = (req: Request, res: Response, next: NextFunction): void => {
  const isMulterLimitError = (value: unknown): value is { code: string; message?: string } => {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    if (!('code' in value)) {
      return false;
    }
    const codeValue = value.code;
    return typeof codeValue === 'string' && codeValue.startsWith('LIMIT_');
  };

  // Skip multer for JSON requests - only process multipart/form-data
  const contentType = req.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    // For JSON requests, just proceed to the controller
    return next();
  }

  uploadSingleImage(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({
          success: false,
          message: 'File too large. Maximum file size is 5MB.',
        });
        return;
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        res.status(400).json({
          success: false,
          message: 'Too many files. Only one file is allowed.',
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
      });
      return;
    }

    if (isMulterLimitError(err)) {
      res.status(400).json({
        success: false,
        message: typeof err.message === 'string' ? err.message : 'File upload limit exceeded',
      });
      return;
    }

    if (err instanceof Error) {
      // Handle file filter errors (e.g., "Only image files are allowed")
      if (err.message.includes('Only image files are allowed')) {
        res.status(400).json({
          success: false,
          message: err.message,
        });
        return;
      }
    }

    if (err) {
      return next(err);
    }

    next();
  });
};

/**
 * @route   GET /api/v1/featured-events/active
 * @desc    Get active featured events (public - for hero section)
 * @access  Public
 */
router.get('/active', FeaturedEventController.getActiveFeaturedEvents);

// Protected routes (require authentication)
router.use(authenticate);

/**
 * @route   GET /api/v1/featured-events
 * @desc    Get all featured events (admin)
 * @access  Private (ADMIN+)
 */
router.get(
  '/',
  requireMinRole(UserRole.ADMIN),
  FeaturedEventController.getAllFeaturedEvents,
);

/**
 * @route   POST /api/v1/featured-events
 * @desc    Create a new featured event
 * @access  Private (ADMIN+)
 */
router.post(
  '/',
  requireMinRole(UserRole.ADMIN),
  handleMulterUpload,
  FeaturedEventController.createFeaturedEvent,
);

/**
 * @route   GET /api/v1/featured-events/:id
 * @desc    Get featured event by ID
 * @access  Private (ADMIN+)
 */
router.get(
  '/:id',
  requireMinRole(UserRole.ADMIN),
  FeaturedEventController.getFeaturedEventById,
);

/**
 * @route   PUT /api/v1/featured-events/:id
 * @desc    Update featured event
 * @access  Private (ADMIN+)
 */
router.put(
  '/:id',
  requireMinRole(UserRole.ADMIN),
  handleMulterUpload,
  FeaturedEventController.updateFeaturedEvent,
);

/**
 * @route   DELETE /api/v1/featured-events/:id
 * @desc    Delete featured event
 * @access  Private (ADMIN+)
 */
router.delete(
  '/:id',
  requireMinRole(UserRole.ADMIN),
  FeaturedEventController.deleteFeaturedEvent,
);

export default router;


