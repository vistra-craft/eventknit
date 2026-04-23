import { Router } from 'express';
import { FormTemplateController } from '../controllers/form-template.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require at minimum ADMIN role
router.use(authenticate, requireMinRole(UserRole.ADMIN));

/**
 * @route   GET /api/v1/form-templates
 * @desc    List all templates (built-in + custom). Optional ?purpose= filter.
 */
router.get('/', FormTemplateController.listAll);

/**
 * @route   GET /api/v1/form-templates/built-in
 * @desc    List only built-in templates. Optional ?purpose= filter.
 */
router.get('/built-in', FormTemplateController.listBuiltIn);

/**
 * @route   GET /api/v1/form-templates/:id
 * @desc    Get a single custom template by id
 */
router.get('/:id', FormTemplateController.getById);

/**
 * @route   POST /api/v1/form-templates
 * @desc    Save a custom template
 */
router.post('/', FormTemplateController.create);

/**
 * @route   PUT /api/v1/form-templates/:id
 * @desc    Update a custom template
 */
router.put('/:id', FormTemplateController.update);

/**
 * @route   DELETE /api/v1/form-templates/:id
 * @desc    Delete a custom template (built-in templates cannot be deleted)
 */
router.delete('/:id', FormTemplateController.remove);

export default router;
