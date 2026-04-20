import multer from 'multer';
import type { RequestHandler } from 'express';

// Local type so TS4023 doesn't fire when emitting declarations
type MulterInstance = {
  single(fieldname: string): RequestHandler;
  array(fieldname: string, maxCount?: number): RequestHandler;
  none(): RequestHandler;
  any(): RequestHandler;
};

const storage = multer.memoryStorage();

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

// Document upload (images + PDFs, up to 10MB)
export const documentUpload: MulterInstance = multer({
  storage,
  fileFilter(_req, file, cb) {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image files and PDFs are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for documents
    files: 1,
  },
}) as unknown as MulterInstance;

export const uploadSingleDocument: RequestHandler = documentUpload.single('file');
