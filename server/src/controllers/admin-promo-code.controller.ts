import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { PromoCodeService, CreatePromoCodeData, BulkGenerateData } from '../services/promo-code.service.js';
import { PromoCodeScope, DiscountType } from '@prisma/client';

export class AdminPromoCodeController {
  /**
   * Check if a promo code is available
   */
  static async checkAvailability(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = req.query.code as string;
      if (!code || code.length < 3) {
        res.status(400).json({ success: false, message: 'Code must be at least 3 characters' });
        return;
      }

      const available = await PromoCodeService.checkCodeAvailability(code);
      res.status(200).json({ success: true, data: { available } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate a unique promo code
   */
  static async generateCode(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = await PromoCodeService.generateUniqueCode();
      res.status(200).json({ success: true, data: { code } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all promo codes with filtering
   */
  static async getPromoCodes(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = {
        scope: req.query.scope as PromoCodeScope | undefined,
        eventId: req.query.eventId as string | undefined,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        batchId: req.query.batchId as string | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      };

      const result = await PromoCodeService.getAllPromoCodes(options);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get promo code statistics
   */
  static async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await PromoCodeService.getPromoCodeStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single promo code by ID
   */
  static async getPromoCodeById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const promoCode = await PromoCodeService.getPromoCodeByIdAdmin((req.params.id as string));

      res.status(200).json({
        success: true,
        data: promoCode,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new promo code
   */
  static async createPromoCode(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const data: CreatePromoCodeData = {
        code: req.body.code,
        scope: req.body.scope || PromoCodeScope.EVENT,
        eventId: req.body.eventId,
        eventIds: req.body.eventIds,
        discountType: req.body.discountType as DiscountType,
        discountValue: parseFloat(req.body.discountValue),
        minOrderAmount: req.body.minOrderAmount ? parseFloat(req.body.minOrderAmount) : undefined,
        maxDiscount: req.body.maxDiscount ? parseFloat(req.body.maxDiscount) : undefined,
        applicableTicketTypes: req.body.applicableTicketTypes || [],
        usageLimit: req.body.usageLimit ? parseInt(req.body.usageLimit, 10) : undefined,
        maxUsesPerUser: req.body.maxUsesPerUser ? parseInt(req.body.maxUsesPerUser, 10) : 1,
        validFrom: req.body.validFrom,
        validUntil: req.body.validUntil,
        isActive: req.body.isActive !== false,
        firstTimeOnly: req.body.firstTimeOnly || false,
        isStackable: req.body.isStackable || false,
        // Marketing fields
        isReferral: req.body.isReferral || false,
        referrerUserId: req.body.referrerUserId,
        campaignName: req.body.campaignName,
        campaignSource: req.body.campaignSource,
        isTiered: req.body.isTiered || false,
        discountTiers: req.body.discountTiers,
      };

      const overrideOrganizerId = req.body.organizerId as string | undefined;
      const promoCode = await PromoCodeService.createPromoCode(req.user.id, data, true, overrideOrganizerId);

      res.status(201).json({
        success: true,
        message: 'Promo code created successfully',
        data: promoCode,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a promo code
   */
  static async updatePromoCode(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const promoCode = await PromoCodeService.updatePromoCodeAdmin((req.params.id as string), req.body);

      res.status(200).json({
        success: true,
        message: 'Promo code updated successfully',
        data: promoCode,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a promo code
   */
  static async deletePromoCode(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await PromoCodeService.deletePromoCodeAdmin((req.params.id as string));

      res.status(200).json({
        success: true,
        message: 'Promo code deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk generate promo codes
   */
  static async bulkGenerate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const data: BulkGenerateData = {
        count: parseInt(req.body.count, 10),
        prefix: req.body.prefix,
        scope: req.body.scope || PromoCodeScope.PLATFORM,
        eventId: req.body.eventId,
        eventIds: req.body.eventIds,
        discountType: req.body.discountType as DiscountType,
        discountValue: parseFloat(req.body.discountValue),
        minOrderAmount: req.body.minOrderAmount ? parseFloat(req.body.minOrderAmount) : undefined,
        maxDiscount: req.body.maxDiscount ? parseFloat(req.body.maxDiscount) : undefined,
        usageLimit: req.body.usageLimit ? parseInt(req.body.usageLimit, 10) : 1,
        maxUsesPerUser: req.body.maxUsesPerUser ? parseInt(req.body.maxUsesPerUser, 10) : 1,
        validFrom: req.body.validFrom,
        validUntil: req.body.validUntil,
        firstTimeOnly: req.body.firstTimeOnly || false,
        // Marketing fields
        isReferral: req.body.isReferral || false,
        referrerUserId: req.body.referrerUserId,
        campaignName: req.body.campaignName,
        campaignSource: req.body.campaignSource,
        isTiered: req.body.isTiered || false,
        discountTiers: req.body.discountTiers,
      };

      const result = await PromoCodeService.bulkGenerateCodes(req.user.id, data);

      res.status(201).json({
        success: true,
        message: `Successfully generated ${result.count} promo codes`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get codes by batch ID
   */
  static async getCodesByBatch(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const codes = await PromoCodeService.getCodesByBatchId((req.params.batchId as string));

      res.status(200).json({
        success: true,
        data: { codes, count: codes.length },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a batch of promo codes
   */
  static async deleteBatch(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PromoCodeService.deleteBatch((req.params.batchId as string));

      res.status(200).json({
        success: true,
        message: `Deleted ${result.deleted} promo codes`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle promo code active status
   */
  static async toggleActive(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const promoCode = await PromoCodeService.getPromoCodeByIdAdmin((req.params.id as string));
      const updated = await PromoCodeService.updatePromoCodeAdmin((req.params.id as string), {
        isActive: !promoCode.isActive,
      });

      res.status(200).json({
        success: true,
        message: updated.isActive ? 'Promo code activated' : 'Promo code deactivated',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}
