import { Router } from 'express';
import { SocialMediaController } from '../controllers/social-media.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

// All social media routes require authentication and ADMIN+ role
router.use(authenticate);
router.use(requireMinRole(UserRole.ADMIN));

/**
 * @route   POST /api/v1/admin/social-media/accounts
 * @desc    Connect social media account
 * @access  Private (ADMIN+)
 */
router.post('/accounts', SocialMediaController.connectAccount);

/**
 * @route   GET /api/v1/admin/social-media/accounts
 * @desc    Get all social media accounts
 * @access  Private (ADMIN+)
 */
router.get('/accounts', SocialMediaController.getAccounts);

/**
 * @route   GET /api/v1/admin/social-media/accounts/:id
 * @desc    Get social account by ID
 * @access  Private (ADMIN+)
 */
router.get('/accounts/:id', SocialMediaController.getAccountById);

/**
 * @route   PUT /api/v1/admin/social-media/accounts/:id
 * @desc    Update social account
 * @access  Private (ADMIN+)
 */
router.put('/accounts/:id', SocialMediaController.updateAccount);

/**
 * @route   DELETE /api/v1/admin/social-media/accounts/:id
 * @desc    Disconnect social account
 * @access  Private (ADMIN+)
 */
router.delete('/accounts/:id', SocialMediaController.disconnectAccount);

/**
 * @route   POST /api/v1/admin/social-media/posts
 * @desc    Create social media post
 * @access  Private (ADMIN+)
 */
router.post('/posts', SocialMediaController.createPost);

/**
 * @route   GET /api/v1/admin/social-media/posts
 * @desc    Get social media posts
 * @access  Private (ADMIN+)
 */
router.get('/posts', SocialMediaController.getPosts);

/**
 * @route   GET /api/v1/admin/social-media/posts/:id
 * @desc    Get social post by ID
 * @access  Private (ADMIN+)
 */
router.get('/posts/:id', SocialMediaController.getPostById);

/**
 * @route   PUT /api/v1/admin/social-media/posts/:id
 * @desc    Update social post
 * @access  Private (ADMIN+)
 */
router.put('/posts/:id', SocialMediaController.updatePost);

/**
 * @route   DELETE /api/v1/admin/social-media/posts/:id
 * @desc    Delete social post
 * @access  Private (ADMIN+)
 */
router.delete('/posts/:id', SocialMediaController.deletePost);

/**
 * @route   PATCH /api/v1/admin/social-media/posts/:id/metrics
 * @desc    Update post metrics
 * @access  Private (ADMIN+)
 */
router.patch('/posts/:id/metrics', SocialMediaController.updatePostMetrics);

/**
 * @route   GET /api/v1/admin/social-media/messages
 * @desc    Get social messages (support queries)
 * @access  Private (ADMIN+)
 */
router.get('/messages', SocialMediaController.getMessages);

/**
 * @route   GET /api/v1/admin/social-media/messages/:id
 * @desc    Get social message by ID
 * @access  Private (ADMIN+)
 */
router.get('/messages/:id', SocialMediaController.getMessageById);

/**
 * @route   POST /api/v1/admin/social-media/messages/:id/assign
 * @desc    Assign message to agent
 * @access  Private (ADMIN+)
 */
router.post('/messages/:id/assign', SocialMediaController.assignMessage);

/**
 * @route   PATCH /api/v1/admin/social-media/messages/:id/status
 * @desc    Update message status
 * @access  Private (ADMIN+)
 */
router.patch('/messages/:id/status', SocialMediaController.updateMessageStatus);

/**
 * @route   POST /api/v1/admin/social-media/messages/:id/responses
 * @desc    Add response to message
 * @access  Private (ADMIN+)
 */
router.post('/messages/:id/responses', SocialMediaController.addResponse);

export default router;




