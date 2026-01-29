/**
 * Venue Capacity Controller
 * Handles API requests for venue capacity management
 */

import { Response } from 'express';
import { VenueCapacityService } from '../services/venue-capacity.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class VenueCapacityController {
  /**
   * GET /capacity/events/:eventId
   * Get venue capacity status
   */
  static async getCapacityStatus(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const status = await VenueCapacityService.getCapacityStatus(eventId);

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get capacity status',
      });
    }
  }

  /**
   * PUT /capacity/events/:eventId
   * Set venue maximum capacity
   */
  static async setVenueCapacity(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const { maxCapacity } = req.body;

      // Validate maxCapacity
      if (maxCapacity !== null && (typeof maxCapacity !== 'number' || maxCapacity < 0)) {
        res.status(400).json({
          success: false,
          message: 'maxCapacity must be a positive number or null',
        });
        return;
      }

      await VenueCapacityService.setVenueCapacity(eventId, maxCapacity);

      res.status(200).json({
        success: true,
        message: 'Venue capacity updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to set venue capacity',
      });
    }
  }

  /**
   * GET /capacity/events/:eventId/overview
   * Get comprehensive capacity overview including zones
   */
  static async getCapacityOverview(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const overview = await VenueCapacityService.getCapacityOverview(eventId);

      res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get capacity overview',
      });
    }
  }

  /**
   * GET /capacity/events/:eventId/zones
   * Get zone capacity statuses
   */
  static async getZoneCapacities(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const zones = await VenueCapacityService.getZoneCapacityOverview(eventId);

      res.status(200).json({
        success: true,
        data: zones,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get zone capacities',
      });
    }
  }

  /**
   * POST /capacity/events/:eventId/reset
   * Reset all occupancy counters
   */
  static async resetOccupancy(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      await VenueCapacityService.resetOccupancy(eventId);

      res.status(200).json({
        success: true,
        message: 'Occupancy counters reset successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reset occupancy',
      });
    }
  }

  /**
   * POST /capacity/events/:eventId/recalculate
   * Recalculate occupancy from check-in records
   */
  static async recalculateOccupancy(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const result = await VenueCapacityService.recalculateOccupancy(eventId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Occupancy recalculated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to recalculate occupancy',
      });
    }
  }

  /**
   * GET /capacity/events/:eventId/can-check-in
   * Check if venue can accept more check-ins
   */
  static async canCheckIn(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const count = parseInt(req.query.count as string, 10) || 1;

      const canCheckIn = await VenueCapacityService.canCheckIn(eventId, count);

      res.status(200).json({
        success: true,
        data: { canCheckIn, requestedCount: count },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to check capacity',
      });
    }
  }
}
