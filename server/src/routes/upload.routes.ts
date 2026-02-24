import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadSingleImage } from '../utils/upload.js';
import { uploadImageToCloudinary } from '../services/cloudinary.service.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Folder whitelist — maps client folder names to Cloudinary paths + dimensions
const FOLDER_CONFIG: Record<string, { folder: string; width: number; height: number }> = {
  avatars:    { folder: 'user-avatars',     width: 400,  height: 400 },
  speakers:   { folder: 'event-speakers',   width: 400,  height: 400 },
  exhibitors: { folder: 'event-exhibitors', width: 600,  height: 600 },
  sponsors:   { folder: 'event-sponsors',   width: 600,  height: 600 },
  events:     { folder: 'event-images',     width: 1920, height: 1080 },
  general:    { folder: 'general',          width: 800,  height: 800 },
};

// Multer error handler (reuses pattern from auth.routes.ts)
const handleMulterUpload = (req: Request, res: Response, next: NextFunction): void => {
  uploadSingleImage(req, res, (err: unknown) => {
    if (err instanceof (multer as any).MulterError || (err as any)?.code?.startsWith?.('LIMIT_')) {
      const multerErr = err as any;
      if (multerErr.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ success: false, message: 'File too large. Maximum 5MB.' });
        return;
      }
      if (multerErr.code === 'LIMIT_FILE_COUNT') {
        res.status(400).json({ success: false, message: 'Too many files. Only one file allowed.' });
        return;
      }
      res.status(400).json({ success: false, message: multerErr.message || 'Upload error' });
      return;
    }

    if (err instanceof Error && err.message.includes('Only image files are allowed')) {
      res.status(400).json({ success: false, message: err.message });
      return;
    }

    if (err) return next(err);
    next();
  });
};

router.use(authenticate);

/**
 * @route   POST /api/v1/uploads/image
 * @desc    Upload an image to Cloudinary (reusable for avatars, speakers, sponsors, etc.)
 * @access  Private (any authenticated user)
 * @body    multipart/form-data: `image` file + optional `folder` field
 */
router.post('/image', handleMulterUpload, async (
  req: Request<Record<string, never>, unknown, { folder?: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image file provided' });
      return;
    }

    // Resolve folder config (default to 'general')
    const folderKey = req.body.folder && FOLDER_CONFIG[req.body.folder]
      ? req.body.folder
      : 'general';
    const config = FOLDER_CONFIG[folderKey];

    const result = await uploadImageToCloudinary(req.file.buffer, config.folder, {
      width: config.width,
      height: config.height,
      quality: 'auto',
      format: 'auto',
    });

    logger.info(`Image uploaded to ${config.folder} by user ${req.user!.id}`);

    res.json({
      success: true,
      data: {
        url: result.secureUrl,
        publicId: result.publicId,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
