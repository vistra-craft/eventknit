import { Request, Response, NextFunction } from 'express';
import { TemplateService } from '../services/template.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class TemplateController {
  /**
   * Create a new template
   */
  static async createTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const template = await TemplateService.createTemplate(
        (req.params.eventId as string),
        req.body,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: { template },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all templates for an event
   */
  static async getEventTemplates(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const templates = await TemplateService.getEventTemplates(
        (req.params.eventId as string),
        req.user.id,
        req.user.role,
      );

      res.status(200).json({
        success: true,
        data: { templates },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get template by ID
   */
  static async getTemplateById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const template = await TemplateService.getTemplateById(
        (req.params.id as string),
        req.user.id,
        req.user.role,
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
   * Get default template for an event (public - for printing)
   */
  static async getDefaultTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const template = await TemplateService.getDefaultTemplate((req.params.eventId as string));

      if (!template) {
        res.status(404).json({
          success: false,
          message: 'No default template found for this event',
        });
        return;
      }

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
   */
  static async updateTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const template = await TemplateService.updateTemplate(
        (req.params.id as string),
        req.body,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Template updated successfully',
        data: { template },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete template
   */
  static async deleteTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      await TemplateService.deleteTemplate(
        (req.params.id as string),
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Template deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Duplicate template
   */
  static async duplicateTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const { name } = req.body;
      if (!name || typeof name !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Template name is required',
        });
        return;
      }

      const template = await TemplateService.duplicateTemplate(
        (req.params.id as string),
        name,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(201).json({
        success: true,
        message: 'Template duplicated successfully',
        data: { template },
      });
    } catch (error) {
      next(error);
    }
  }
}

