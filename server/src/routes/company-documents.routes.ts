import { Router } from 'express';
import { CompanyDocumentsController } from '../controllers/company-documents.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireMinRole } from '../middleware/auth.middleware.js';
import { uploadSingleDocument } from '../utils/upload.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(requireMinRole(UserRole.ADMIN));

/**
 * @route   GET /api/v1/admin/company-documents
 * @desc    List all company documents (with optional filters)
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/', CompanyDocumentsController.list);

/**
 * @route   GET /api/v1/admin/company-documents/:id
 * @desc    Get a single document by ID
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/:id', CompanyDocumentsController.getById);

/**
 * @route   POST /api/v1/admin/company-documents/link
 * @desc    Save a Google Doc / external link document
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/link', CompanyDocumentsController.createLink);

/**
 * @route   POST /api/v1/admin/company-documents/upload
 * @desc    Upload a file document (PDF, Word, Excel, etc.)
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/upload', uploadSingleDocument, CompanyDocumentsController.uploadFile);

/**
 * @route   PATCH /api/v1/admin/company-documents/:id
 * @desc    Update document metadata (name, description, category, externalUrl)
 * @access  Private (ADMIN_STAFF+)
 */
router.patch('/:id', CompanyDocumentsController.update);

/**
 * @route   DELETE /api/v1/admin/company-documents/:id
 * @desc    Delete a document (removes Cloudinary asset for uploaded files)
 * @access  Private (ADMIN_STAFF+)
 */
router.delete('/:id', CompanyDocumentsController.delete);

export default router;
