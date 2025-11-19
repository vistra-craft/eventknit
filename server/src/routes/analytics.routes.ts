import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

// All analytics routes require authentication and ADMIN_STAFF+ role
router.use(authenticate);
router.use(requireMinRole(UserRole.ADMIN_STAFF));

/**
 * @route   GET /api/v1/admin/analytics/unified
 * @desc    Get unified analytics dashboard
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/unified', AnalyticsController.getUnifiedAnalytics);

/**
 * @route   GET /api/v1/admin/analytics/platforms
 * @desc    Get platform breakdown
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/platforms', AnalyticsController.getPlatformBreakdown);

/**
 * @route   GET /api/v1/admin/analytics/campaign-attribution
 * @desc    Get campaign attribution (support queries linked to campaigns)
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/campaign-attribution', AnalyticsController.getCampaignAttribution);

/**
 * @route   GET /api/v1/admin/analytics/customer-journey/:identifier
 * @desc    Get customer journey tracking
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/customer-journey/:identifier', AnalyticsController.getCustomerJourney);

/**
 * @route   GET /api/v1/admin/analytics/social-roi
 * @desc    Get social media ROI
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/social-roi', AnalyticsController.getSocialMediaROI);

/**
 * @route   GET /api/v1/admin/analytics/support-efficiency
 * @desc    Get support efficiency metrics
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/support-efficiency', AnalyticsController.getSupportEfficiency);

export default router;

