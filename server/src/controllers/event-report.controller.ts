import { Response, NextFunction } from 'express';
import { eventReportService } from '../services/event-report.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class EventReportController {
  /**
   * Submit an event report (user-facing)
   * POST /api/v1/user-dashboard/events/:eventId/reports
   */
  static async createReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const reportedBy = req.user!.id;
      const { category, description } = req.body;
      const submittedIp = req.ip || req.headers['x-forwarded-for']?.toString() || undefined;
      const userAgent = req.headers['user-agent'] || undefined;

      const result = await eventReportService.createReport({
        eventId,
        reportedBy,
        category,
        description,
        submittedIp,
        userAgent,
      });

      res.status(201).json({
        success: true,
        message: 'Report submitted. Thank you.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all event reports (admin-facing)
   * GET /api/v1/admin/event-reports
   */
  static async getReports(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, category, page, limit } = req.query;

      const result = await eventReportService.getReports({
        status: status?.toString(),
        category: category?.toString(),
        page: page ? parseInt(page.toString(), 10) : undefined,
        limit: limit ? parseInt(limit.toString(), 10) : undefined,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a report (admin-facing)
   * PATCH /api/v1/admin/event-reports/:id
   */
  static async updateReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { status, reviewNotes } = req.body;

      const result = await eventReportService.updateReport(id, {
        status,
        reviewNotes,
        reviewedBy: req.user?.id,
      });

      res.status(200).json({
        success: true,
        message: 'Report updated',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get report statistics (admin-facing)
   * GET /api/v1/admin/event-reports/stats
   */
  static async getReportStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await eventReportService.getReportStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if user has reported an event (user-facing)
   * GET /api/v1/user-dashboard/events/:eventId/report-status
   */
  static async getReportStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const userId = req.user!.id;
      const hasReported = await eventReportService.hasUserReportedEvent(eventId, userId);
      res.status(200).json({ success: true, data: { hasReported } });
    } catch (error) {
      next(error);
    }
  }
}
