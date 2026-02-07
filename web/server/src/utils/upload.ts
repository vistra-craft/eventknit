import multer from 'multer';
import { Request } from 'express';

// Configure storage
const storage = multer.memoryStorage(); // Store files in memory for Cloudinary upload

// File filter for images only
const fileFilter = (_req: Request, file: any, cb: any) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Multer configuration
export const upload: any = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 1, // Only one file at a time
  },
});

// Single image upload middleware
export const uploadSingleImage = upload.single('image');