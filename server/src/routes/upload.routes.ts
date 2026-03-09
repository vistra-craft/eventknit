import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadSingleImage, uploadSingleDocument } from '../utils/upload.js';
import { uploadImageToCloudinary, uploadBuffer } from '../services/cloudinary.service.js';
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

  uploadSingleImage(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ success: false, message: 'File too large. Maximum 5MB.' });
        return;
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        res.status(400).json({ success: false, message: 'Too many files. Only one file allowed.' });
        return;
      }
      res.status(400).json({ success: false, message: err.message || 'Upload error' });
      return;
    }

    if (isMulterLimitError(err)) {
      res.status(400).json({
        success: false,
        message: typeof err.message === 'string' ? err.message : 'Upload error',
      });
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

// Signed upload folder config (subset of FOLDER_CONFIG — only what direct upload clients need)
const SIGNED_FOLDER_CONFIG: Record<string, { folder: string; maxWidth: number; maxHeight: number }> = {
  avatars:    { folder: 'user-avatars',    maxWidth: 400,  maxHeight: 400 },
  speakers:   { folder: 'event-speakers',  maxWidth: 400,  maxHeight: 400 },
  exhibitors: { folder: 'event-exhibitors', maxWidth: 600, maxHeight: 600 },
  sponsors:   { folder: 'event-sponsors',  maxWidth: 600,  maxHeight: 600 },
  events:     { folder: 'event-images',    maxWidth: 1920, maxHeight: 1080 },
  general:    { folder: 'general',         maxWidth: 800,  maxHeight: 800 },
};

router.use(authenticate);

/**
 * @route   POST /api/v1/uploads/sign
 * @desc    Generate a signed upload params for direct Cloudinary upload from the browser
 * @access  Private (any authenticated user)
 * @body    { folder: string }
 * @returns { timestamp, signature, apiKey, cloudName, folder, transformation }
 */
router.post('/sign', (req: Request<Record<string, never>, unknown, { folder?: string }>, res: Response): void => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    res.status(503).json({ success: false, message: 'Cloudinary is not configured' });
    return;
  }

  const folderKey = req.body.folder && SIGNED_FOLDER_CONFIG[req.body.folder]
    ? req.body.folder
    : 'general';
  const config = SIGNED_FOLDER_CONFIG[folderKey];

  const timestamp = Math.round(Date.now() / 1000);

  // Params that must be included in the signature
  const paramsToSign = {
    folder: config.folder,
    timestamp,
    transformation: `c_limit,w_${config.maxWidth},h_${config.maxHeight},q_auto,f_auto`,
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  res.json({
    success: true,
    data: {
      timestamp,
      signature,
      apiKey,
      cloudName,
      folder: config.folder,
      transformation: paramsToSign.transformation,
    },
  });
});

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

/**
 * @route   POST /api/v1/uploads/document
 * @desc    Upload an image or PDF document to Cloudinary (for verification/KYC)
 * @access  Private (any authenticated user)
 * @body    multipart/form-data: `file` field (image or PDF, max 10MB)
 */
router.post('/document', (req: Request, res: Response, next: NextFunction): void => {
  uploadSingleDocument(req, res, async (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ success: false, message: 'File too large. Maximum 10MB.' });
        return;
      }
      res.status(400).json({ success: false, message: err.message || 'Upload error' });
      return;
    }
    if (err instanceof Error) {
      res.status(400).json({ success: false, message: err.message });
      return;
    }
    if (err) return next(err);

    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file provided' });
        return;
      }

      let result;
      if (req.file.mimetype === 'application/pdf') {
        result = await uploadBuffer(req.file.buffer, {
          folder: 'kyc-documents',
          resource_type: 'raw',
          format: 'pdf',
        });
      } else {
        result = await uploadImageToCloudinary(req.file.buffer, 'kyc-documents', {
          quality: 'auto',
          format: 'auto',
        });
      }

      logger.info(`Document uploaded to kyc-documents by user ${req.user!.id}`);

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
});

export default router;
