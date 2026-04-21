import { Router } from 'express';
import { FormController } from '../controllers/form.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

// ─── Public routes (no auth required) ───────────────────────────────────────

/**
 * @route   GET /api/v1/forms/public/:shareToken
 * @desc    Get a public form by share token
 */
router.get('/public/:shareToken', FormController.getPublicForm);

/**
 * @route   POST /api/v1/forms/public/:shareToken/submit
 * @desc    Submit a response to a public form (auth optional — for account linking)
 */
router.post('/public/:shareToken/submit', (req, res, next) => {
  // Optionally attach user if token present, but don't require it
  authenticate(req, res, (err) => {
    if (err) return next(); // Ignore auth errors for public submission
    next();
  });
}, FormController.submitPublicForm);

// ─── Authenticated routes ────────────────────────────────────────────────────

router.use(authenticate);
router.use(requireMinRole(UserRole.ORGANIZER));

/**
 * @route   GET /api/v1/forms
 * @desc    List all forms (organizer sees own; admin sees all)
 */
router.get('/', FormController.listForms);

/**
 * @route   POST /api/v1/forms
 * @desc    Create a new form
 */
router.post('/', FormController.createForm);

/**
 * @route   GET /api/v1/forms/:id
 * @desc    Get a form by ID
 */
router.get('/:id', FormController.getFormById);

/**
 * @route   PATCH /api/v1/forms/:id
 * @desc    Update form metadata or questions
 */
router.patch('/:id', FormController.updateForm);

/**
 * @route   DELETE /api/v1/forms/:id
 * @desc    Delete a form
 */
router.delete('/:id', FormController.deleteForm);

/**
 * @route   GET /api/v1/forms/:id/responses
 * @desc    List responses for a form
 */
router.get('/:id/responses', FormController.listResponses);

/**
 * @route   GET /api/v1/forms/:id/responses/:responseId
 * @desc    Get a single response
 */
router.get('/:id/responses/:responseId', FormController.getResponseById);

/**
 * @route   PATCH /api/v1/forms/:id/responses/:responseId/review
 * @desc    Review a response (approve/reject/waitlist)
 */
router.patch('/:id/responses/:responseId/review', FormController.reviewResponse);

export default router;
