import { Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { SocialPlatform } from '@prisma/client';

export class AnalyticsController {
  /**
   * Get unified analytics dashboard
   * GET /api/v1/admin/analytics/unified
   */
  static async getUnifiedAnalytics(
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

      const { startDate, endDate, platform, campaignId } = req.query;

      const filters: {
        startDate?: Date | string;
        endDate?: Date | string;
        platform?: SocialPlatform;
        campaignId?: string;
      } = {};

      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (platform && Object.values(SocialPlatform).includes(platform as SocialPlatform)) {
        filters.platform = platform as SocialPlatform;
      }
      if (campaignId) filters.campaignId = campaignId as string;

      const analytics = await AnalyticsService.getUnifiedAnalytics(filters);

      res.status(200).json({
        success: true,
        data: { analytics },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get platform breakdown
   * GET /api/v1/admin/analytics/platforms
   */
  static async getPlatformBreakdown(
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

      const { startDate, endDate, platform } = req.query;

      const filters: {
        startDate?: Date | string;
        endDate?: Date | string;
        platform?: SocialPlatform;
      } = {};

      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (platform && Object.values(SocialPlatform).includes(platform as SocialPlatform)) {
        filters.platform = platform as SocialPlatform;
      }

      const breakdown = await AnalyticsService.getPlatformBreakdown(filters);

      res.status(200).json({
        success: true,
        data: { breakdown },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get campaign attribution
   * GET /api/v1/admin/analytics/campaign-attribution
   */
  static async getCampaignAttribution(
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

      const { startDate, endDate, platform } = req.query;

      const filters: {
        startDate?: Date | string;
        endDate?: Date | string;
        platform?: SocialPlatform;
      } = {};

      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (platform && Object.values(SocialPlatform).includes(platform as SocialPlatform)) {
        filters.platform = platform as SocialPlatform;
      }

      const attribution = await AnalyticsService.getCampaignAttribution(filters);

      res.status(200).json({
        success: true,
        data: { attribution },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get customer journey
   * GET /api/v1/admin/analytics/customer-journey/:identifier
   */
  static async getCustomerJourney(
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

      const identifier = (req.params.identifier as string) as string;
      const { startDate, endDate, platform } = req.query;

      const filters: {
        startDate?: Date | string;
        endDate?: Date | string;
        platform?: SocialPlatform;
      } = {};

      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (platform && Object.values(SocialPlatform).includes(platform as SocialPlatform)) {
        filters.platform = platform as SocialPlatform;
      }

      const journey = await AnalyticsService.getCustomerJourney(identifier, filters);

      res.status(200).json({
        success: true,
        data: { journey },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get social media ROI
   * GET /api/v1/admin/analytics/social-roi
   */
  static async getSocialMediaROI(
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

      const { startDate, endDate, platform } = req.query;

      const filters: {
        startDate?: Date | string;
        endDate?: Date | string;
        platform?: SocialPlatform;
      } = {};

      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (platform && Object.values(SocialPlatform).includes(platform as SocialPlatform)) {
        filters.platform = platform as SocialPlatform;
      }

      const roi = await AnalyticsService.getSocialMediaROI(filters);

      res.status(200).json({
        success: true,
        data: { roi },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get support efficiency metrics
   * GET /api/v1/admin/analytics/support-efficiency
   */
  static async getSupportEfficiency(
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

      const { startDate, endDate, platform } = req.query;

      const filters: {
        startDate?: Date | string;
        endDate?: Date | string;
        platform?: SocialPlatform;
      } = {};

      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (platform && Object.values(SocialPlatform).includes(platform as SocialPlatform)) {
        filters.platform = platform as SocialPlatform;
      }

      const efficiency = await AnalyticsService.getSupportEfficiency(filters);

      res.status(200).json({
        success: true,
        data: { efficiency },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user geography analytics
   * GET /api/v1/admin/analytics/geography
   */
  static async getUserGeographyAnalytics(
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

      const { startDate, endDate } = req.query;

      const filters: {
        startDate?: Date | string;
        endDate?: Date | string;
      } = {};

      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const analytics = await AnalyticsService.getUserGeographyAnalytics(filters);

      res.status(200).json({
        success: true,
        data: { analytics },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get security events analytics
   * GET /api/v1/admin/analytics/security
   */
  static async getSecurityEventsAnalytics(
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

      const { startDate, endDate } = req.query;

      const filters: {
        startDate?: Date | string;
        endDate?: Date | string;
      } = {};

      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const analytics = await AnalyticsService.getSecurityEventsAnalytics(filters);

      res.status(200).json({
        success: true,
        data: { analytics },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user sessions analytics
   * GET /api/v1/admin/analytics/sessions
   */
  static async getUserSessionsAnalytics(
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

      const { startDate, endDate } = req.query;

      const filters: {
        startDate?: Date | string;
        endDate?: Date | string;
      } = {};

      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const analytics = await AnalyticsService.getUserSessionsAnalytics(filters);

      res.status(200).json({
        success: true,
        data: { analytics },
      });
    } catch (error) {
      next(error);
    }
  }
}




