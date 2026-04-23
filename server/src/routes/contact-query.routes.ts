import { Router } from 'express';
import { ContactQueryController } from '../controllers/contact-query.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

// ── Public router (no auth) ──────────────────────────────────────────────────
// Mounted at: POST /api/v1/contact
export const publicContactRouter = Router();

publicContactRouter.post('/', ContactQueryController.submit);

// ── Admin router (ADMIN+ auth required) ─────────────────────────────────────
// Mounted at: /api/v1/admin/support/contact-queries
export const adminContactRouter = Router();

adminContactRouter.use(authenticate);
adminContactRouter.use(requireMinRole(UserRole.ADMIN));

/**
 * @route   GET /api/v1/admin/support/contact-queries/statistics
 * @desc    Get contact query counts by status / priority
 * @access  Private (ADMIN+)
 */
adminContactRouter.get('/statistics', ContactQueryController.getStatistics);

/**
 * @route   GET /api/v1/admin/support/contact-queries
 * @desc    List all contact queries (paginated, filterable)
 * @access  Private (ADMIN+)
 */
adminContactRouter.get('/', ContactQueryController.list);

/**
 * @route   GET /api/v1/admin/support/contact-queries/:id
 * @desc    Get a single contact query with full reply thread
 * @access  Private (ADMIN+)
 */
adminContactRouter.get('/:id', ContactQueryController.getById);

/**
 * @route   PATCH /api/v1/admin/support/contact-queries/:id/status
 * @desc    Update the status of a contact query
 * @access  Private (ADMIN+)
 */
adminContactRouter.patch('/:id/status', ContactQueryController.updateStatus);

/**
 * @route   POST /api/v1/admin/support/contact-queries/:id/reply
 * @desc    Reply to sender via email and record the response
 * @access  Private (ADMIN+)
 */
adminContactRouter.post('/:id/reply', ContactQueryController.reply);

/**
 * @route   POST /api/v1/admin/support/contact-queries/:id/notes
 * @desc    Add an internal note (not emailed to sender)
 * @access  Private (ADMIN+)
 */
adminContactRouter.post('/:id/notes', ContactQueryController.addNote);
