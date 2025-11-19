import { Response, NextFunction } from 'express';
import { EmailTemplateService } from '../services/email-template.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class EmailTemplateController {
  /**
   * Create email template
   * POST /api/v1/admin/communications/email-templates
   */
  static async createTemplate(
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

      const template = await EmailTemplateService.createTemplate(
        req.body,
        req.user.id,
        req.user.role,
      );

      res.status(201).json({
        success: true,
        message: 'Email template created successfully',
        data: { template },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all templates
   * GET /api/v1/admin/communications/email-templates
   */
  static async getTemplates(
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

      const { category, isActive, search, limit, offset } = req.query;

      const filters = {
        ...(category && { category: category as string }),
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
        ...(search && { search: search as string }),
        ...(limit && { limit: parseInt(limit as string, 10) }),
        ...(offset && { offset: parseInt(offset as string, 10) }),
      };

      const result = await EmailTemplateService.getTemplates(filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get template by ID
   * GET /api/v1/admin/communications/email-templates/:id
   */
  static async getTemplateById(
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

      const { id } = req.params;
      const template = await EmailTemplateService.getTemplateById(id);

      res.status(200).json({
        success: true,
        data: { template },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update template
   * PUT /api/v1/admin/communications/email-templates/:id
   */
  static async updateTemplate(
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

      const { id } = req.params;
      const template = await EmailTemplateService.updateTemplate(
        id,
        req.body,
        req.user.id,
        req.user.role,
      );

      res.status(200).json({
        success: true,
        message: 'Email template updated successfully',
        data: { template },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete template
   * DELETE /api/v1/admin/communications/email-templates/:id
   */
  static async deleteTemplate(
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

      const { id } = req.params;
      await EmailTemplateService.deleteTemplate(id, req.user.id, req.user.role);

      res.status(200).json({
        success: true,
        message: 'Email template deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}


