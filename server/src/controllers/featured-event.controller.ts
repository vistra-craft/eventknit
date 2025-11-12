import { Request, Response, NextFunction } from 'express';
import { FeaturedEventService } from '../services/featured-event.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class FeaturedEventController {
  /**
   * Create a new featured event
   */
  static async createFeaturedEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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

      // Parse dates if provided
      const data = {
        ...req.body,
        displayStartDate: req.body.displayStartDate ? new Date(req.body.displayStartDate) : undefined,
        displayEndDate: req.body.displayEndDate ? new Date(req.body.displayEndDate) : undefined,
      };

      const featuredEvent = await FeaturedEventService.createFeaturedEvent(
        data,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(201).json({
        success: true,
        message: 'Featured event created successfully',
        data: { featuredEvent },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active featured events (public)
   */
  static async getActiveFeaturedEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const featuredEvents = await FeaturedEventService.getActiveFeaturedEvents();

      res.status(200).json({
        success: true,
        data: { featuredEvents },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all featured events (admin)
   */
  static async getAllFeaturedEvents(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const featuredEvents = await FeaturedEventService.getAllFeaturedEvents();

      res.status(200).json({
        success: true,
        data: { featuredEvents },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get featured event by ID
   */
  static async getFeaturedEventById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const featuredEvent = await FeaturedEventService.getFeaturedEventById(req.params.id);

      res.status(200).json({
        success: true,
        data: { featuredEvent },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update featured event
   */
  static async updateFeaturedEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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

      // Parse dates if provided
      const data = {
        ...req.body,
        displayStartDate: req.body.displayStartDate ? new Date(req.body.displayStartDate) : undefined,
        displayEndDate: req.body.displayEndDate ? new Date(req.body.displayEndDate) : undefined,
      };

      const featuredEvent = await FeaturedEventService.updateFeaturedEvent(
        req.params.id,
        data,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Featured event updated successfully',
        data: { featuredEvent },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete featured event
   */
  static async deleteFeaturedEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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

      await FeaturedEventService.deleteFeaturedEvent(
        req.params.id,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Featured event deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}


