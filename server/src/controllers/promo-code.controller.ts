import { Request, Response, NextFunction } from 'express';
import { PromoCodeService } from '../services/promo-code.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class PromoCodeController {
  /**
   * Validate a promo code
   */
  static async validatePromoCode(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { code, eventId, ticketType, totalAmount } = req.body;
      const userId = (req as AuthenticatedRequest).user?.id;

      if (!code || !eventId || totalAmount === undefined) {
        res.status(400).json({
          success: false,
          message: 'Code, eventId, and totalAmount are required',
        });
        return;
      }

      const validation = await PromoCodeService.validatePromoCode(
        code,
        eventId,
        ticketType || null,
        parseFloat(totalAmount),
        userId || '',
      );

      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: validation.error,
        });
        return;
      }

      res.json({
        success: true,
        data: {
          valid: true,
          discountAmount: validation.discountAmount,
          promoCode: validation.promoCode,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new promo code
   */
  static async createPromoCode(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const organizerId = req.user.id;
      const promoCode = await PromoCodeService.createPromoCode(organizerId, req.body);

      res.status(201).json({
        success: true,
        message: 'Promo code created successfully',
        data: { promoCode },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get promo codes for organizer
   */
  static async getPromoCodes(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const organizerId = req.user.id;
      const eventId = req.query.eventId as string | undefined;

      const promoCodes = await PromoCodeService.getPromoCodes(organizerId, eventId);

      res.json({
        success: true,
        data: { promoCodes },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single promo code
   */
  static async getPromoCode(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const organizerId = req.user.id;
      const promoCodeId = req.params.id;

      const promoCode = await PromoCodeService.getPromoCodeById(promoCodeId, organizerId);

      res.json({
        success: true,
        data: { promoCode },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a promo code
   */
  static async updatePromoCode(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const organizerId = req.user.id;
      const promoCodeId = req.params.id;

      const promoCode = await PromoCodeService.updatePromoCode(
        promoCodeId,
        organizerId,
        req.body,
      );

      res.json({
        success: true,
        message: 'Promo code updated successfully',
        data: { promoCode },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a promo code
   */
  static async deletePromoCode(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const organizerId = req.user.id;
      const promoCodeId = req.params.id;

      await PromoCodeService.deletePromoCode(promoCodeId, organizerId);

      res.json({
        success: true,
        message: 'Promo code deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

