import { Router } from 'express';
import { TemplateController } from '../controllers/template.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * @route   GET /api/v1/templates/events/:eventId/default
 * @desc    Get default template for an event (public - for printing)
 * @access  Public
 */
router.get('/events/:eventId/default', TemplateController.getDefaultTemplate);

// Protected routes (require authentication)
router.use(authenticate);

/**
 * @route   POST /api/v1/templates/events/:eventId
 * @desc    Create a new template for an event
 * @access  Private (ORGANIZER+)
 */
router.post(
  '/events/:eventId',
  requireMinRole(UserRole.ORGANIZER),
  TemplateController.createTemplate,
);

/**
 * @route   GET /api/v1/templates/events/:eventId
 * @desc    Get all templates for an event
 * @access  Private (ORGANIZER+)
 */
router.get(
  '/events/:eventId',
  requireMinRole(UserRole.ORGANIZER),
  TemplateController.getEventTemplates,
);

/**
 * @route   GET /api/v1/templates/:id
 * @desc    Get template by ID
 * @access  Private (ORGANIZER+)
 */
router.get(
  '/:id',
  requireMinRole(UserRole.ORGANIZER),
  TemplateController.getTemplateById,
);

/**
 * @route   PUT /api/v1/templates/:id
 * @desc    Update template
 * @access  Private (ORGANIZER+)
 */
router.put(
  '/:id',
  requireMinRole(UserRole.ORGANIZER),
  TemplateController.updateTemplate,
);

/**
 * @route   DELETE /api/v1/templates/:id
 * @desc    Delete template
 * @access  Private (ORGANIZER+)
 */
router.delete(
  '/:id',
  requireMinRole(UserRole.ORGANIZER),
  TemplateController.deleteTemplate,
);

/**
 * @route   POST /api/v1/templates/:id/duplicate
 * @desc    Duplicate template
 * @access  Private (ORGANIZER+)
 */
router.post(
  '/:id/duplicate',
  requireMinRole(UserRole.ORGANIZER),
  TemplateController.duplicateTemplate,
);

export default router;



