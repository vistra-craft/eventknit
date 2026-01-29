/**
 * Dashboard Controller
 * Handles real-time dashboard metrics, analytics, and monitoring endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { DashboardAnalyticsService } from '../services/dashboard-analytics.service.js';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';

export class DashboardController {
  /**
   * GET /api/v1/dashboard/events/:eventId/realtime-metrics
   * Get real-time metrics for event dashboard
   */
  static async getRealtimeMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.eventId as string;

      const metrics = await DashboardAnalyticsService.getRealtimeMetrics(eventId);

      res.status(200).json({
        success: true,
        data: { metrics },
      });
    } catch (error) {
      logger.error('Error fetching realtime metrics:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/dashboard/events/:eventId/recent-scans?limit=100
   * Get recent scans with attendee details
   */
  static async getRecentScans(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.eventId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

      if (limit < 1 || limit > 500) {
        throw new ValidationError('Limit must be between 1 and 500');
      }

      const scans = await DashboardAnalyticsService.getRecentScans(eventId, limit);

      res.status(200).json({
        success: true,
        data: { scans, count: scans.length },
      });
    } catch (error) {
      logger.error('Error fetching recent scans:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/dashboard/events/:eventId/heatmap?start=2026-01-01&end=2026-01-31
   * Get facility heatmap data
   */
  static async getFacilityHeatmap(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.eventId as string;
      const { start, end } = req.query;

      if (!start || !end) {
        throw new ValidationError('Start and end dates are required');
      }

      const startDate = new Date(start as string);
      const endDate = new Date(end as string);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new ValidationError('Invalid date format');
      }

      if (startDate > endDate) {
        throw new ValidationError('Start date must be before end date');
      }

      const heatmap = await DashboardAnalyticsService.getFacilityHeatmap(
        eventId,
        startDate,
        endDate,
      );

      res.status(200).json({
        success: true,
        data: { heatmap },
      });
    } catch (error) {
      logger.error('Error generating facility heatmap:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/dashboard/events/:eventId/staff-metrics
   * Get staff performance metrics
   */
  static async getStaffMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.eventId as string;

      const metrics = await DashboardAnalyticsService.getStaffMetrics(eventId);

      res.status(200).json({
        success: true,
        data: { metrics, count: metrics.length },
      });
    } catch (error) {
      logger.error('Error fetching staff metrics:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/dashboard/events/:eventId/capacity-overview
   * Get capacity overview for all zones
   */
  static async getCapacityOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.eventId as string;

      const capacityStatuses = await DashboardAnalyticsService.getCapacityOverview(eventId);

      res.status(200).json({
        success: true,
        data: { zones: capacityStatuses, count: capacityStatuses.length },
      });
    } catch (error) {
      logger.error('Error fetching capacity overview:', error);
      next(error);
    }
  }

  /**
   * GET /api/v1/dashboard/events/:eventId/attendance-trend?interval=hourly
   * Get attendance trend data
   */
  static async getAttendanceTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.eventId as string;
      const interval = (req.query.interval as 'hourly' | 'daily') || 'hourly';

      if (interval !== 'hourly' && interval !== 'daily') {
        throw new ValidationError('Interval must be either "hourly" or "daily"');
      }

      const trend = await DashboardAnalyticsService.getAttendanceTrend(eventId, interval);

      res.status(200).json({
        success: true,
        data: { trend, count: trend.length, interval },
      });
    } catch (error) {
      logger.error('Error fetching attendance trend:', error);
      next(error);
    }
  }
}
