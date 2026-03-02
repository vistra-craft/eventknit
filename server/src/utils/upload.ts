import multer from 'multer';
import type { RequestHandler } from 'express';

// Local type so TS4023 doesn't fire when emitting declarations
type MulterInstance = {
  single(fieldname: string): RequestHandler;
  array(fieldname: string, maxCount?: number): RequestHandler;
  none(): RequestHandler;
  any(): RequestHandler;
};

// Configure storage
const storage = multer.memoryStorage(); // Store files in memory for Cloudinary upload

// Multer configuration
export const upload: MulterInstance = multer({
  storage,
  fileFilter(_req, file, cb) {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 1, // Only one file at a time
  },
}) as unknown as MulterInstance;

// Single image upload middleware
export const uploadSingleImage: RequestHandler = upload.single('image');
