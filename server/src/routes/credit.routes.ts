import { Router, Response } from 'express';
import { CreditService } from '../services/credit.service.js';
import { authenticate, AuthenticatedRequest, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';
import { logger } from '../utils/logger.js';

const router = Router();

// All credit routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/credits/balance
 * Get current user's credit balance
 */
router.get('/balance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const balance = await CreditService.getCreditBalance(userId);

    res.json({
      success: true,
      data: balance || { userId, balance: 0, currency: 'NGN' },
    });
  } catch (error) {
    logger.error('Error getting credit balance:', error);
    const message = error instanceof Error ? error.message : 'Failed to get credit balance';
    res.status(500).json({ success: false, message });
  }
});

/**
 * GET /api/v1/credits/history
 * Get credit transaction history
 */
router.get('/history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const offset = parseInt(req.query.offset as string, 10) || 0;

    const history = await CreditService.getCreditHistory(userId, { limit, offset });

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    logger.error('Error getting credit history:', error);
    const message = error instanceof Error ? error.message : 'Failed to get credit history';
    res.status(500).json({ success: false, message });
  }
});

/**
 * POST /api/v1/credits/redeem
 * Redeem a voucher code
 */
router.post('/redeem', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { code, eventId, orderId } = req.body;

    if (!code || typeof code !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Voucher code is required',
      });
      return;
    }

    const result = await CreditService.redeemVoucher(code.trim(), userId, eventId, orderId);

    res.status(result.success ? 200 : 400).json({
      success: result.success,
      message: result.message,
      data: result.success
        ? {
          creditedAmount: result.creditedAmount,
          newBalance: result.newBalance,
        }
        : undefined,
    });
  } catch (error) {
    logger.error('Error redeeming voucher:', error);
    const message = error instanceof Error ? error.message : 'Failed to redeem voucher';
    res.status(500).json({ success: false, message });
  }
});

/**
 * GET /api/v1/credits/voucher/:code
 * Check voucher validity without redeeming
 */
router.get('/voucher/:code', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const code = req.params.code as string;
    const eventId = typeof req.query.eventId === 'string' ? req.query.eventId : undefined;

    const voucher = await CreditService.getVoucherByCode(code, eventId);

    if (!voucher) {
      res.status(404).json({
        success: false,
        message: 'Voucher not found',
      });
      return;
    }

    res.json({
      success: true,
      data: voucher,
    });
  } catch (error) {
    logger.error('Error checking voucher:', error);
    const message = error instanceof Error ? error.message : 'Failed to check voucher';
    res.status(500).json({ success: false, message });
  }
});

/**
 * GET /api/v1/credits/calculate
 * Calculate how much credit can be applied to an order
 */
router.get('/calculate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const orderTotal = parseFloat(req.query.orderTotal as string);
    const currency = (req.query.currency as string) || 'NGN';

    if (isNaN(orderTotal) || orderTotal <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid order total is required',
      });
      return;
    }

    const result = await CreditService.calculateCreditToApply(userId, orderTotal, currency);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error calculating credit:', error);
    const message = error instanceof Error ? error.message : 'Failed to calculate credit';
    res.status(500).json({ success: false, message });
  }
});

// ==================== ORGANIZER ROUTES ====================

/**
 * POST /api/v1/credits/vouchers
 * Create a new voucher (Organizer only)
 */
router.post(
  '/vouchers',
  requireMinRole(UserRole.ORGANIZER),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const {
        code,
        description,
        amount,
        currency,
        maxUses,
        usesPerUser,
        validFrom,
        validUntil,
        eventId,
        minPurchaseAmount,
      } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({
          success: false,
          message: 'Valid amount is required',
        });
        return;
      }

      const voucher = await CreditService.createVoucher({
        code,
        description,
        amount,
        currency,
        maxUses,
        usesPerUser,
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        eventId,
        organizerId: userId,
        minPurchaseAmount,
        createdBy: userId,
      });

      res.status(201).json({
        success: true,
        message: 'Voucher created successfully',
        data: {
          id: voucher.id,
          code: voucher.code,
          amount: Number(voucher.amount),
          currency: voucher.currency,
        },
      });
    } catch (error) {
      logger.error('Error creating voucher:', error);
      const message = error instanceof Error ? error.message : 'Failed to create voucher';
      res.status(400).json({ success: false, message });
    }
  },
);

/**
 * GET /api/v1/credits/vouchers
 * Get vouchers created by organizer
 */
router.get(
  '/vouchers',
  requireMinRole(UserRole.ORGANIZER),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { eventId, isActive, limit, offset } = req.query;

      const result = await CreditService.getOrganizerVouchers(userId, {
        eventId: eventId as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error getting vouchers:', error);
      const message = error instanceof Error ? error.message : 'Failed to get vouchers';
      res.status(500).json({ success: false, message });
    }
  },
);

/**
 * DELETE /api/v1/credits/vouchers/:id
 * Deactivate a voucher
 */
router.delete(
  '/vouchers/:id',
  requireMinRole(UserRole.ORGANIZER),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;

      const result = await CreditService.deactivateVoucher(id, userId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Error deactivating voucher:', error);
      const message = error instanceof Error ? error.message : 'Failed to deactivate voucher';
      res.status(error instanceof Error && error.message.includes('not found') ? 404 : 400).json({
        success: false,
        message,
      });
    }
  },
);

// ==================== ADMIN ROUTES ====================

/**
 * POST /api/v1/credits/admin/grant
 * Admin grant credit to a user
 */
router.post(
  '/admin/grant',
  requireMinRole(UserRole.ADMIN),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const adminId = req.user!.id;
      const { userId, amount, description, expiresAt } = req.body;

      if (!userId || !amount || amount <= 0) {
        res.status(400).json({
          success: false,
          message: 'Valid user ID and amount are required',
        });
        return;
      }

      const result = await CreditService.addCredit({
        userId,
        amount,
        type: 'CREDIT',
        description: description || 'Admin credit grant',
        referenceType: 'ADMIN_GRANT',
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        initiatedBy: adminId,
      });

      res.status(201).json({
        success: true,
        message: 'Credit granted successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error granting credit:', error);
      const message = error instanceof Error ? error.message : 'Failed to grant credit';
      res.status(400).json({ success: false, message });
    }
  },
);

export default router;
