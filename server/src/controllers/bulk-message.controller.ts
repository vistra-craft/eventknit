import { Response, NextFunction } from 'express';
import { BulkMessageService } from '../services/bulk-message.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ValidationError } from '../utils/errors.js';
import { BulkMessageStatus, BulkMessageTargetAudience } from '@prisma/client';

export class BulkMessageController {
  /**
   * Create bulk message
   * POST /api/v1/admin/communications/bulk-messages
   */
  static async createBulkMessage(
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

      const {
        title,
        content,
        type,
        targetAudience,
        eventId,
        channels,
        scheduledAt,
      } = req.body;

      if (!title || typeof title !== 'string') {
        throw new ValidationError('Title is required and must be a string');
      }

      if (!content || typeof content !== 'string') {
        throw new ValidationError('Content is required and must be a string');
      }

      if (!type || typeof type !== 'string') {
        throw new ValidationError('Type is required and must be a string');
      }

      if (!targetAudience || !Object.values(BulkMessageTargetAudience).includes(targetAudience)) {
        throw new ValidationError(
          `Invalid targetAudience. Must be one of: ${Object.values(BulkMessageTargetAudience).join(', ')}`,
        );
      }

      // Validate eventId if targeting specific event
      if (targetAudience === BulkMessageTargetAudience.SPECIFIC_EVENT && !eventId) {
        throw new ValidationError('Event ID is required when targeting specific event');
      }

      const message = await BulkMessageService.createBulkMessage(
        {
          title,
          content,
          type,
          targetAudience,
          eventId,
          channels,
          scheduledAt,
        },
        req.user.id,
      );

      res.status(201).json({
        success: true,
        message: 'Bulk message created successfully',
        data: { message },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get bulk messages
   * GET /api/v1/admin/communications/bulk-messages
   */
  static async getBulkMessages(
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

      const {
        status,
        type,
        targetAudience,
        eventId,
        createdBy,
        startDate,
        endDate,
      } = req.query;

      const filters = {
        ...(status && { status: status as BulkMessageStatus }),
        ...(type && { type: type as string }),
        ...(targetAudience && {
          targetAudience: targetAudience as BulkMessageTargetAudience,
        }),
        ...(eventId && { eventId: eventId as string }),
        ...(createdBy && { createdBy: createdBy as string }),
        ...(startDate && { startDate: new Date(startDate as string) }),
        ...(endDate && { endDate: new Date(endDate as string) }),
      };

      const messages = await BulkMessageService.getBulkMessages(filters);

      res.status(200).json({
        success: true,
        data: { messages },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get bulk message by ID
   * GET /api/v1/admin/communications/bulk-messages/:id
   */
  static async getBulkMessageById(
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
      const message = await BulkMessageService.getBulkMessageById(id);

      res.status(200).json({
        success: true,
        data: { message },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update bulk message
   * PUT /api/v1/admin/communications/bulk-messages/:id
   */
  static async updateBulkMessage(
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
      const {
        title,
        content,
        type,
        targetAudience,
        eventId,
        channels,
        scheduledAt,
        status,
      } = req.body;

      // Validate targetAudience if provided
      if (targetAudience && !Object.values(BulkMessageTargetAudience).includes(targetAudience)) {
        throw new ValidationError(
          `Invalid targetAudience. Must be one of: ${Object.values(BulkMessageTargetAudience).join(', ')}`,
        );
      }

      // Force SMS to be disabled if channels are provided
      if (channels && channels.sms === true) {
        throw new ValidationError('SMS notifications are not available in this system');
      }

      const message = await BulkMessageService.updateBulkMessage(
        id,
        {
          title,
          content,
          type,
          targetAudience,
          eventId,
          channels,
          scheduledAt,
          status,
        },
        req.user.id,
      );

      res.status(200).json({
        success: true,
        message: 'Bulk message updated successfully',
        data: { message },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete bulk message
   * DELETE /api/v1/admin/communications/bulk-messages/:id
   */
  static async deleteBulkMessage(
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
      await BulkMessageService.deleteBulkMessage(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Bulk message deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send bulk message
   * POST /api/v1/admin/communications/bulk-messages/:id/send
   */
  static async sendBulkMessage(
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
      const message = await BulkMessageService.sendBulkMessage(id);

      res.status(200).json({
        success: true,
        message: 'Bulk message sent successfully',
        data: { message },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel scheduled bulk message
   * POST /api/v1/admin/communications/bulk-messages/:id/cancel
   */
  static async cancelBulkMessage(
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
      const message = await BulkMessageService.cancelBulkMessage(id);

      res.status(200).json({
        success: true,
        message: 'Bulk message cancelled successfully',
        data: { message },
      });
    } catch (error) {
      next(error);
    }
  }
}




