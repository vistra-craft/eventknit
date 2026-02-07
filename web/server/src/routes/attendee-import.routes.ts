/**
 * Attendee Import Routes
 * Handles bulk attendee import for MICE events
 */

import { Router, Request } from 'express';
 
import multer from 'multer';
import {
  downloadTemplate,
  validateImportFile,
  executeImport,
  getImportHistory,
  getImportDetails,
  quickRegister,
  exportAttendees,
} from '../controllers/attendee-import.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

// File filter callback type
type FileFilterCallback = (error: Error | null, acceptFile?: boolean) => void;

// Configure multer for file upload (memory storage for processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req: Request, file: { originalname: string; mimetype: string }, cb: FileFilterCallback) => {
    const allowedMimes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream', // Some systems send CSV as this
    ];
    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    const extension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload a CSV or Excel file.'));
    }
  },
});

// All routes require authentication and organizer/staff role
router.use(authenticate);
router.use(requireMinRole(UserRole.ORGANIZER_STAFF));

/**
 * @route   GET /api/v1/events/:id/import/template
 * @desc    Download CSV template for import
 * @access  Organizer/Admin
 */
router.get('/:id/import/template', downloadTemplate);

/**
 * @route   POST /api/v1/events/:id/import/validate
 * @desc    Validate import file (dry run)
 * @access  Organizer/Admin
 */
router.post('/:id/import/validate', upload.single('file'), validateImportFile);

/**
 * @route   POST /api/v1/events/:id/import
 * @desc    Execute import from CSV/Excel
 * @access  Organizer/Admin
 */
router.post('/:id/import', upload.single('file'), executeImport);

/**
 * @route   GET /api/v1/events/:id/imports
 * @desc    Get import history for event
 * @access  Organizer/Admin
 */
router.get('/:id/imports', getImportHistory);

/**
 * @route   GET /api/v1/events/:id/imports/:importId
 * @desc    Get import details
 * @access  Organizer/Admin
 */
router.get('/:id/imports/:importId', getImportDetails);

/**
 * @route   POST /api/v1/events/:id/attendees/register
 * @desc    Quick register a single attendee (walk-in)
 * @access  Organizer/Admin
 */
router.post('/:id/attendees/register', quickRegister);

/**
 * @route   GET /api/v1/events/:id/attendees/export
 * @desc    Export attendees to CSV
 * @access  Organizer/Admin
 */
router.get('/:id/attendees/export', exportAttendees);

export default router;
