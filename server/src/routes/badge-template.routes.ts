import { Router } from 'express';
import { BadgeTemplateController } from '../controllers/badge-template.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';
import { uploadSingleImage } from '../utils/upload.js';

const router = Router();

// All badge template routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/badge-templates/default
 * @desc    Get the default template for a scope
 * @access  Private (TELLER or higher)
 */
router.get('/default', requireMinRole(UserRole.TELLER), BadgeTemplateController.getDefaultTemplate);

/**
 * @route   POST /api/v1/badge-templates/ensure-defaults
 * @desc    Ensure default templates exist (admin only)
 * @access  Private (ADMIN or higher)
 */
router.post(
  '/ensure-defaults',
  requireMinRole(UserRole.ADMIN),
  BadgeTemplateController.ensureDefaultTemplates,
);

/**
 * @route   POST /api/v1/badge-templates
 * @desc    Create a new badge template
 * @access  Private (ADMIN or higher)
 */
router.post('/', requireMinRole(UserRole.ADMIN), BadgeTemplateController.createTemplate);

/**
 * @route   GET /api/v1/badge-templates
 * @desc    Get badge templates with filters
 * @access  Private (TELLER or higher)
 */
router.get('/', requireMinRole(UserRole.TELLER), BadgeTemplateController.getTemplates);

/**
 * @route   GET /api/v1/badge-templates/:id
 * @desc    Get a badge template by ID
 * @access  Private (TELLER or higher)
 */
router.get('/:id', requireMinRole(UserRole.TELLER), BadgeTemplateController.getTemplateById);

/**
 * @route   PUT /api/v1/badge-templates/:id
 * @desc    Update a badge template
 * @access  Private (ADMIN or higher)
 */
router.put('/:id', requireMinRole(UserRole.ADMIN), BadgeTemplateController.updateTemplate);

/**
 * @route   DELETE /api/v1/badge-templates/:id
 * @desc    Delete a badge template (soft delete)
 * @access  Private (ADMIN or higher)
 */
router.delete('/:id', requireMinRole(UserRole.ADMIN), BadgeTemplateController.deleteTemplate);

/**
 * @route   POST /api/v1/badge-templates/:id/duplicate
 * @desc    Duplicate a badge template
 * @access  Private (ADMIN or higher)
 */
router.post(
  '/:id/duplicate',
  requireMinRole(UserRole.ADMIN),
  BadgeTemplateController.duplicateTemplate,
);

/**
 * @route   POST /api/v1/badge-templates/:id/set-default
 * @desc    Set a template as default
 * @access  Private (ADMIN or higher)
 */
router.post(
  '/:id/set-default',
  requireMinRole(UserRole.ADMIN),
  BadgeTemplateController.setDefaultTemplate,
);

/**
 * @route   POST /api/v1/badge-templates/:id/background
 * @desc    Upload background image for a badge template
 * @access  Private (ADMIN or higher)
 */
router.post(
  '/:id/background',
  requireMinRole(UserRole.ADMIN),
  uploadSingleImage,
  BadgeTemplateController.uploadBackgroundImage,
);

/**
 * @route   DELETE /api/v1/badge-templates/:id/background
 * @desc    Remove background image from a badge template
 * @access  Private (ADMIN or higher)
 */
router.delete(
  '/:id/background',
  requireMinRole(UserRole.ADMIN),
  BadgeTemplateController.removeBackgroundImage,
);

export default router;
