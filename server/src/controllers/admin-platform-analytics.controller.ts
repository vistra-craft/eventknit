import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AdminPlatformAnalyticsService } from '../services/admin-platform-analytics.service.js';
import { ResaleTransferAnalyticsService } from '../services/resale-transfer-analytics.service.js';
import { logger } from '../utils/logger.js';

/**
 * Admin Platform Analytics Controller
 * Provides endpoints for platform-wide analytics (GMV, fees, gateway health, refunds)
 */
export class AdminPlatformAnalyticsController {
  /**
   * Get GMV (Gross Merchandise Value) analytics
   * GET /api/v1/admin/platform-analytics/gmv
   */
  static async getGMVAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters = AdminPlatformAnalyticsController.parseFilters(req);
      const data = await AdminPlatformAnalyticsService.getGMVAnalytics(filters);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Error getting GMV analytics:', error);
      const message = error instanceof Error ? error.message : 'Failed to get GMV analytics';
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * Get platform fees analytics
   * GET /api/v1/admin/platform-analytics/fees
   */
  static async getPlatformFeesAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters = AdminPlatformAnalyticsController.parseFilters(req);
      const data = await AdminPlatformAnalyticsService.getPlatformFeesAnalytics(filters);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Error getting platform fees analytics:', error);
      const message = error instanceof Error ? error.message : 'Failed to get platform fees analytics';
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * Get payment gateway health metrics
   * GET /api/v1/admin/platform-analytics/gateway-health
   */
  static async getPaymentGatewayHealth(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters = AdminPlatformAnalyticsController.parseFilters(req);
      const data = await AdminPlatformAnalyticsService.getPaymentGatewayHealth(filters);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Error getting payment gateway health:', error);
      const message = error instanceof Error ? error.message : 'Failed to get payment gateway health';
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * Get refund trends analytics
   * GET /api/v1/admin/platform-analytics/refund-trends
   */
  static async getRefundTrends(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters = AdminPlatformAnalyticsController.parseFilters(req);
      const data = await AdminPlatformAnalyticsService.getRefundTrends(filters);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Error getting refund trends:', error);
      const message = error instanceof Error ? error.message : 'Failed to get refund trends';
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * Get complete platform dashboard analytics
   * GET /api/v1/admin/platform-analytics/dashboard
   */
  static async getDashboardAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters = AdminPlatformAnalyticsController.parseFilters(req);
      const data = await AdminPlatformAnalyticsService.getDashboardAnalytics(filters);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Error getting dashboard analytics:', error);
      const message = error instanceof Error ? error.message : 'Failed to get dashboard analytics';
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * Helper to parse filter parameters from request
   */
  /**
   * Get platform-wide resale statistics
   * GET /api/v1/admin/platform-analytics/resale/stats
   */
  static async getResaleStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const data = await ResaleTransferAnalyticsService.getPlatformResaleStats({
        startDate: typeof startDate === 'string' ? startDate : undefined,
        endDate: typeof endDate === 'string' ? endDate : undefined,
      });
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error getting resale stats:', error);
      const message = error instanceof Error ? error.message : 'Failed to get resale stats';
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * Get platform-wide transfer statistics
   * GET /api/v1/admin/platform-analytics/transfers/stats
   */
  static async getTransferStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const data = await ResaleTransferAnalyticsService.getPlatformTransferStats({
        startDate: typeof startDate === 'string' ? startDate : undefined,
        endDate: typeof endDate === 'string' ? endDate : undefined,
      });
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error getting transfer stats:', error);
      const message = error instanceof Error ? error.message : 'Failed to get transfer stats';
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * Get resale activity list with filtering
   * GET /api/v1/admin/platform-analytics/resale/activity
   */
  static async getResaleActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status, eventId, page, limit } = req.query;
      const data = await ResaleTransferAnalyticsService.getPlatformResaleActivity({
        status: typeof status === 'string' ? status : undefined,
        eventId: typeof eventId === 'string' ? eventId : undefined,
        page: typeof page === 'string' ? parseInt(page, 10) : undefined,
        limit: typeof limit === 'string' ? parseInt(limit, 10) : undefined,
      });
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error getting resale activity:', error);
      const message = error instanceof Error ? error.message : 'Failed to get resale activity';
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * Get pending resale seller payouts
   * GET /api/v1/admin/platform-analytics/resale/pending-payouts
   */
  static async getResalePendingPayouts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit } = req.query;
      const data = await ResaleTransferAnalyticsService.getResalePendingPayouts({
        page: typeof page === 'string' ? parseInt(page, 10) : undefined,
        limit: typeof limit === 'string' ? parseInt(limit, 10) : undefined,
      });
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error getting resale pending payouts:', error);
      const message = error instanceof Error ? error.message : 'Failed to get pending payouts';
      res.status(500).json({ success: false, message });
    }
  }

  /**
   * Helper to parse filter parameters from request
   */
  private static parseFilters(req: AuthenticatedRequest) {
    const { startDate, endDate, currency } = req.query;

    return {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      currency: currency as string | undefined,
    };
  }
}
