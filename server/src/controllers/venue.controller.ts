/**
 * Venue Controller
 */

import { Response, NextFunction } from 'express';
import { VenueService } from '../services/venue.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class VenueController {
  /**
   * Create venue
   * POST /api/v1/organizer-dashboard/venues
   */
  static async createVenue(
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

      const venue = await VenueService.createVenue(req.user.id, req.body);
      res.status(201).json({
        success: true,
        data: { venue },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get venues
   * GET /api/v1/organizer-dashboard/venues
   */
  static async getVenues(
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

      const venues = await VenueService.getVenues(req.user.id, req.query as {
        isActive?: string | boolean;
        venueType?: string;
        search?: string;
      });
      res.json({
        success: true,
        data: { venues },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get venue by ID
   * GET /api/v1/organizer-dashboard/venues/:venueId
   */
  static async getVenueById(
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

      const venueId = (req.params.venueId as string) as string;
      const venue = await VenueService.getVenueById(venueId, req.user.id);
      res.json({
        success: true,
        data: { venue },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update venue
   * PUT /api/v1/organizer-dashboard/venues/:venueId
   */
  static async updateVenue(
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

      const venueId = (req.params.venueId as string) as string;
      const venue = await VenueService.updateVenue(venueId, req.user.id, req.body);
      res.json({
        success: true,
        data: { venue },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete venue
   * DELETE /api/v1/organizer-dashboard/venues/:venueId
   */
  static async deleteVenue(
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

      const venueId = (req.params.venueId as string) as string;
      await VenueService.deleteVenue(venueId, req.user.id);
      res.json({
        success: true,
        message: 'Venue deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
