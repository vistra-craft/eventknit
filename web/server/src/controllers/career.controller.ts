import { Request, Response, NextFunction } from 'express';
import { careerService } from '../services/career.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class CareerController {
  /**
   * Submit a career inquiry (public endpoint)
   * POST /api/v1/careers
   */
  static async submitInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      // Get client info for tracking
      const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || undefined;
      const userAgent = req.headers['user-agent'] || undefined;
      const source = req.body.source || req.query.source?.toString() || undefined;

      const result = await careerService.submitInquiry({
        email,
        source,
        ipAddress,
        userAgent,
      });

      res.status(201).json({
        success: true,
        message: 'Thank you for your interest! Check your email for next steps.',
        data: {
          email: result.email,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all career inquiries (admin only)
   * GET /api/v1/careers
   */
  static async getAllInquiries(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, page, limit } = req.query;

      const result = await careerService.getAllInquiries({
        status: status?.toString(),
        page: page ? parseInt(page.toString(), 10) : undefined,
        limit: limit ? parseInt(limit.toString(), 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update career inquiry status (admin only)
   * PATCH /api/v1/careers/:id
   */
  static async updateInquiry(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { status, notes } = req.body;

      const result = await careerService.updateInquiryStatus(id, {
        status,
        notes,
        reviewedBy: req.user?.id,
      });

      res.status(200).json({
        success: true,
        message: 'Inquiry updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
