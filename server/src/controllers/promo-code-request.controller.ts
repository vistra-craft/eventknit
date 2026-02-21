import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { PromoCodeRequestService } from '../services/promo-code-request.service.js';
import { PromoCodeRequestStatus } from '@prisma/client';

export class PromoCodeRequestController {
  /**
   * Create a promo code request (organizer)
   */
  static async createRequest(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res
          .status(401)
          .json({ success: false, message: 'Authentication required' });
        return;
      }

      const { eventId, message } = req.body;

      const request = await PromoCodeRequestService.createRequest(
        req.user.id,
        { eventId, message },
      );

      res.status(201).json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all requests with filtering (admin)
   */
  static async getRequests(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const status = req.query.status as PromoCodeRequestStatus | undefined;
      const organizerId = req.query.organizerId as string | undefined;
      const page = req.query.page
        ? parseInt(req.query.page as string, 10)
        : 1;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 20;

      const result = await PromoCodeRequestService.getRequests({
        status,
        organizerId,
        page,
        limit,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get organizer's own requests
   */
  static async getOrganizerRequests(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res
          .status(401)
          .json({ success: false, message: 'Authentication required' });
        return;
      }

      const page = req.query.page
        ? parseInt(req.query.page as string, 10)
        : 1;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 20;

      const result = await PromoCodeRequestService.getOrganizerRequests(
        req.user.id,
        page,
        limit,
      );

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve a request (admin)
   */
  static async approveRequest(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res
          .status(401)
          .json({ success: false, message: 'Authentication required' });
        return;
      }

      const id = req.params.id as string;
      const { promoCodeId } = req.body;

      const result = await PromoCodeRequestService.approveRequest(
        id,
        req.user.id,
        promoCodeId,
      );

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject a request (admin)
   */
  static async rejectRequest(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res
          .status(401)
          .json({ success: false, message: 'Authentication required' });
        return;
      }

      const id = req.params.id as string;
      const { reason } = req.body;

      const result = await PromoCodeRequestService.rejectRequest(
        id,
        req.user.id,
        reason,
      );

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single request by ID (admin)
   */
  static async getRequestById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const request = await PromoCodeRequestService.getRequestById(id);
      res.status(200).json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pending request count (admin badge)
   */
  static async getPendingCount(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const count = await PromoCodeRequestService.getPendingCount();
      res.status(200).json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  }
}
