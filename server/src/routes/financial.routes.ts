import { Router } from 'express';
import { FinancialController } from '../controllers/financial.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

// All financial routes require authentication
router.use(authenticate);

// Finance insights for dashboards
/**
 * @route   GET /api/v1/admin/finance/insights
 * @desc    Get aggregated finance insights for admin dashboards
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/insights',
  requireMinRole(UserRole.ADMIN_STAFF),
  FinancialController.getFinanceInsights,
);

// Payment Transactions
/**
 * @route   POST /api/v1/admin/finance/payments/sync
 * @desc    Sync payments from Paystack
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/payments/sync', requireMinRole(UserRole.ADMIN_STAFF), FinancialController.syncPayments);

/**
 * @route   GET /api/v1/admin/finance/payments
 * @desc    Get payment transactions
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/payments', requireMinRole(UserRole.ADMIN_STAFF), FinancialController.getPaymentTransactions);

/**
 * @route   GET /api/v1/admin/finance/payments/:id
 * @desc    Get payment transaction by ID
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/payments/:id', requireMinRole(UserRole.ADMIN_STAFF), FinancialController.getPaymentTransaction);

// Platform Fees
/**
 * @route   GET /api/v1/admin/finance/platform-fees
 * @desc    Get platform fees for an event
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/platform-fees', requireMinRole(UserRole.ADMIN_STAFF), FinancialController.getPlatformFees);

/**
 * @route   GET /api/v1/admin/finance/platform-fees/summary
 * @desc    Get platform fee summary for an event
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/platform-fees/summary', requireMinRole(UserRole.ADMIN_STAFF), FinancialController.getPlatformFeeSummary);

// Disbursements
/**
 * @route   POST /api/v1/admin/finance/disbursements
 * @desc    Create a new disbursement
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/disbursements', requireMinRole(UserRole.ADMIN_STAFF), FinancialController.createDisbursement);

/**
 * @route   GET /api/v1/admin/finance/disbursements
 * @desc    Get disbursements (by organizer or event)
 * @access  Private (ADMIN_STAFF+ or ORGANIZER for own disbursements)
 */
router.get('/disbursements', FinancialController.getDisbursements);

/**
 * @route   GET /api/v1/admin/finance/disbursements/summary
 * @desc    Get disbursement summary for an organizer
 * @access  Private (ADMIN_STAFF+ or ORGANIZER for own summary)
 */
router.get('/disbursements/summary', FinancialController.getDisbursementSummary);

/**
 * @route   GET /api/v1/admin/finance/disbursements/:id
 * @desc    Get disbursement by ID
 * @access  Private (ADMIN_STAFF+ or ORGANIZER for own disbursement)
 */
router.get('/disbursements/:id', FinancialController.getDisbursement);

/**
 * @route   POST /api/v1/admin/finance/disbursements/:id/process
 * @desc    Process a disbursement
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/disbursements/:id/process', requireMinRole(UserRole.ADMIN_STAFF), FinancialController.processDisbursement);

/**
 * @route   POST /api/v1/admin/finance/disbursements/:id/complete
 * @desc    Complete a disbursement
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/disbursements/:id/complete', requireMinRole(UserRole.ADMIN_STAFF), FinancialController.completeDisbursement);

// Refunds
/**
 * @route   POST /api/v1/admin/finance/refunds
 * @desc    Create a refund request
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/refunds', requireMinRole(UserRole.ADMIN_STAFF), FinancialController.createRefund);

/**
 * @route   GET /api/v1/admin/finance/refunds
 * @desc    Get refunds for an event
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/refunds', requireMinRole(UserRole.ADMIN_STAFF), FinancialController.getRefunds);

/**
 * @route   GET /api/v1/admin/finance/refunds/summary
 * @desc    Get refund summary for an event
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/refunds/summary', requireMinRole(UserRole.ADMIN_STAFF), FinancialController.getRefundSummary);

/**
 * @route   GET /api/v1/admin/finance/refunds/:id
 * @desc    Get refund by ID
 * @access  Private (ADMIN_STAFF+ or ORGANIZER for own event refunds)
 */
router.get('/refunds/:id', FinancialController.getRefund);

/**
 * @route   POST /api/v1/admin/finance/refunds/:id/process
 * @desc    Process a refund
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/refunds/:id/process', requireMinRole(UserRole.ADMIN_STAFF), FinancialController.processRefund);

/**
 * @route   POST /api/v1/admin/finance/refunds/:id/complete
 * @desc    Complete a refund
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/refunds/:id/complete', requireMinRole(UserRole.ADMIN_STAFF), FinancialController.completeRefund);

// Reconciliation
/**
 * @route   POST /api/v1/admin/finance/reconciliations
 * @desc    Create a payment reconciliation
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/reconciliations', requireMinRole(UserRole.ADMIN_STAFF), FinancialController.createReconciliation);

/**
 * @route   GET /api/v1/admin/finance/reconciliations
 * @desc    Get reconciliations
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/reconciliations', requireMinRole(UserRole.ADMIN_STAFF), FinancialController.getReconciliations);

/**
 * @route   GET /api/v1/admin/finance/reconciliations/:id
 * @desc    Get reconciliation by ID
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/reconciliations/:id', requireMinRole(UserRole.ADMIN_STAFF), FinancialController.getReconciliation);

/**
 * @route   POST /api/v1/admin/finance/reconciliations/:id/auto-fix
 * @desc    Auto-fix reconciliation discrepancies
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/reconciliations/:id/auto-fix', requireMinRole(UserRole.ADMIN_STAFF), FinancialController.autoFixReconciliation);

export default router;

