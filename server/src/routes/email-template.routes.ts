import { Router } from 'express';
import { EmailTemplateController } from '../controllers/email-template.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

// All email template routes require authentication and ADMIN_STAFF+ role
router.use(authenticate);
router.use(requireMinRole(UserRole.ADMIN_STAFF));

/**
 * @route   POST /api/v1/admin/communications/email-templates
 * @desc    Create email template
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/', EmailTemplateController.createTemplate);

/**
 * @route   GET /api/v1/admin/communications/email-templates
 * @desc    Get all email templates
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/', EmailTemplateController.getTemplates);

/**
 * @route   GET /api/v1/admin/communications/email-templates/:id
 * @desc    Get email template by ID
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/:id', EmailTemplateController.getTemplateById);

/**
 * @route   PUT /api/v1/admin/communications/email-templates/:id
 * @desc    Update email template
 * @access  Private (ADMIN_STAFF+)
 */
router.put('/:id', EmailTemplateController.updateTemplate);

/**
 * @route   DELETE /api/v1/admin/communications/email-templates/:id
 * @desc    Delete email template
 * @access  Private (ADMIN_STAFF+)
 */
router.delete('/:id', EmailTemplateController.deleteTemplate);

export default router;

