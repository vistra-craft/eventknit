import multer from 'multer';
import { Request } from 'express';

const storage = multer.memoryStorage();

// Image-only filter
const imageFilter = (_req: Request, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Document filter: images + PDFs + Word + Excel + PowerPoint + text
const ALLOWED_DOCUMENT_MIMETYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
]);

const documentFilter = (_req: Request, file: any, cb: any) => {
  if (ALLOWED_DOCUMENT_MIMETYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Allowed: images, PDF, Word, Excel, PowerPoint, CSV, TXT'));
  }
};

// Image upload (5 MB)
export const upload: any = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

// Document upload (25 MB)
export const documentUpload: any = multer({
  storage,
  fileFilter: documentFilter,
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
});

export const uploadSingleImage = upload.single('image');
export const uploadSingleDocument = documentUpload.single('file');