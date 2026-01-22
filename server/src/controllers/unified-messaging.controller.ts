import { Response, NextFunction } from 'express';
import { UnifiedMessagingService } from '../services/unified-messaging.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class UnifiedMessagingController {
  /**
   * Send unified message
   * POST /api/v1/admin/communications/unified
   */
  static async sendUnifiedMessage(
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

      const message = await UnifiedMessagingService.sendUnifiedMessage(
        req.body,
        req.user.id,
      );

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: { message },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Track message engagement
   * POST /api/v1/admin/communications/messages/:id/engagement
   */
  static async trackEngagement(
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

      const id = (req.params.id as string) as string;
      const { type } = req.body; // 'open', 'click', 'unsubscribe'

      if (!type || !['open', 'click', 'unsubscribe'].includes(type)) {
        res.status(400).json({
          success: false,
          message: 'Invalid engagement type. Must be: open, click, or unsubscribe',
        });
        return;
      }

      await UnifiedMessagingService.trackEngagement(id, type);

      res.status(200).json({
        success: true,
        message: 'Engagement tracked successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get message engagement statistics
   * GET /api/v1/admin/communications/messages/:id/engagement
   */
  static async getEngagementStats(
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

      const id = (req.params.id as string) as string;
      const stats = await UnifiedMessagingService.getEngagementStats(id);

      res.status(200).json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  }
}




