import { Response, NextFunction } from 'express';
import { BadgeTemplateService } from '../services/badge-template.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ValidationError } from '../utils/errors.js';

export class BadgeTemplateController {
  /**
   * Create a new badge template
   * POST /api/v1/badge-templates
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
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const {
        name,
        description,
        width,
        height,
        sizePreset,
        orientation,
        backgroundColor,
        elements,
        isDefault,
        organizerId,
        eventId,
      } = req.body;

      if (!name || typeof name !== 'string') {
        throw new ValidationError('Name is required');
      }

      const template = await BadgeTemplateService.createTemplate(
        {
          name,
          description,
          width,
          height,
          sizePreset,
          orientation,
          backgroundColor,
          elements,
          isDefault,
          organizerId,
          eventId,
        },
        req.user.id,
      );

      res.status(201).json({
        success: true,
        data: { template },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a badge template by ID
   * GET /api/v1/badge-templates/:id
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
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Template ID is required');
      }

      const template = await BadgeTemplateService.getTemplateById(id);

      res.status(200).json({
        success: true,
        data: { template },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get badge templates with filters
   * GET /api/v1/badge-templates
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
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const {
        organizerId,
        eventId,
        isDefault,
        isActive,
        search,
        page,
        limit,
      } = req.query;

      const result = await BadgeTemplateService.getTemplates({
        organizerId: organizerId as string | undefined,
        eventId: eventId as string | undefined,
        isDefault: isDefault === 'true' ? true : isDefault === 'false' ? false : undefined,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
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
   * Update a badge template
   * PUT /api/v1/badge-templates/:id
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
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const { id } = req.params;
      const {
        name,
        description,
        width,
        height,
        sizePreset,
        orientation,
        backgroundColor,
        elements,
        isDefault,
        isActive,
      } = req.body;

      if (!id) {
        throw new ValidationError('Template ID is required');
      }

      const template = await BadgeTemplateService.updateTemplate(id, {
        name,
        description,
        width,
        height,
        sizePreset,
        orientation,
        backgroundColor,
        elements,
        isDefault,
        isActive,
      });

      res.status(200).json({
        success: true,
        data: { template },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a badge template (soft delete)
   * DELETE /api/v1/badge-templates/:id
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
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Template ID is required');
      }

      await BadgeTemplateService.deleteTemplate(id);

      res.status(200).json({
        success: true,
        message: 'Template deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Duplicate a badge template
   * POST /api/v1/badge-templates/:id/duplicate
   */
  static async duplicateTemplate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const { id } = req.params;
      const { name } = req.body;

      if (!id) {
        throw new ValidationError('Template ID is required');
      }

      const template = await BadgeTemplateService.duplicateTemplate(id, name, req.user.id);

      res.status(201).json({
        success: true,
        data: { template },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set a template as default
   * POST /api/v1/badge-templates/:id/set-default
   */
  static async setDefaultTemplate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Template ID is required');
      }

      const template = await BadgeTemplateService.setDefaultTemplate(id);

      res.status(200).json({
        success: true,
        data: { template },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get the default template for a scope
   * GET /api/v1/badge-templates/default
   */
  static async getDefaultTemplate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const { organizerId, eventId } = req.query;

      const template = await BadgeTemplateService.getDefaultTemplate(
        organizerId as string | undefined,
        eventId as string | undefined,
      );

      res.status(200).json({
        success: true,
        data: { template },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ensure default templates exist (admin only)
   * POST /api/v1/badge-templates/ensure-defaults
   */
  static async ensureDefaultTemplates(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      await BadgeTemplateService.ensureDefaultTemplates();

      res.status(200).json({
        success: true,
        message: 'Default templates ensured',
      });
    } catch (error) {
      next(error);
    }
  }
}
