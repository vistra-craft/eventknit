import multer from 'multer';
import { Request } from 'express';

// Configure storage
const storage = multer.memoryStorage(); // Store files in memory for Cloudinary upload

// File filter for images only
// eslint-disable-next-line no-undef
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 1, // Only one file at a time
  },
});

// Single image upload middleware
export const uploadSingleImage = upload.single('image');