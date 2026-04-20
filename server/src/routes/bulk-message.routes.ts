import { Router } from 'express';
import { BulkMessageController } from '../controllers/bulk-message.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

// All bulk message routes require authentication and ADMIN+ role
router.use(authenticate);
router.use(requireMinRole(UserRole.ADMIN));

/**
 * @route   POST /api/v1/admin/communications/bulk-messages
 * @desc    Create a new bulk message
 * @access  Private (ADMIN+)
 */
router.post('/', BulkMessageController.createBulkMessage);

/**
 * @route   GET /api/v1/admin/communications/bulk-messages
 * @desc    Get all bulk messages with filters
 * @access  Private (ADMIN+)
 */
router.get('/', BulkMessageController.getBulkMessages);

/**
 * @route   GET /api/v1/admin/communications/bulk-messages/:id
 * @desc    Get bulk message by ID
 * @access  Private (ADMIN+)
 */
router.get('/:id', BulkMessageController.getBulkMessageById);

/**
 * @route   PUT /api/v1/admin/communications/bulk-messages/:id
 * @desc    Update bulk message
 * @access  Private (ADMIN+)
 */
router.put('/:id', BulkMessageController.updateBulkMessage);

/**
 * @route   DELETE /api/v1/admin/communications/bulk-messages/:id
 * @desc    Delete bulk message
 * @access  Private (ADMIN+)
 */
router.delete('/:id', BulkMessageController.deleteBulkMessage);

/**
 * @route   POST /api/v1/admin/communications/bulk-messages/:id/send
 * @desc    Send bulk message immediately
 * @access  Private (ADMIN+)
 */
router.post('/:id/send', BulkMessageController.sendBulkMessage);

/**
 * @route   POST /api/v1/admin/communications/bulk-messages/:id/cancel
 * @desc    Cancel scheduled bulk message
 * @access  Private (ADMIN+)
 */
router.post('/:id/cancel', BulkMessageController.cancelBulkMessage);

export default router;




