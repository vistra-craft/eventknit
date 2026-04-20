/**
 * Seat Map Controller
 */

import { Request, Response, NextFunction } from 'express';
import { SeatMapService } from '../services/seat-map.service.js';
import { SeatSelectionService } from '../services/seat-selection.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { SeatType } from '@prisma/client';

export class SeatMapController {
  /**
   * Create or update seat map
   * POST /api/v1/organizer-dashboard/events/:eventId/seat-map
   */
  static async upsertSeatMap(
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

      const eventId = (req.params.eventId as string) as string;
      const seatMap = await SeatMapService.upsertSeatMap(req.user.id, {
        ...req.body,
        eventId,
      });

      res.json({
        success: true,
        data: { seatMap },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get seat map for event
   * GET /api/v1/organizer-dashboard/events/:eventId/seat-map
   */
  static async getSeatMap(
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

      const eventId = (req.params.eventId as string) as string;
      const seatMap = await SeatMapService.getSeatMapByEventId(eventId, req.user.id);
      res.json({
        success: true,
        data: { seatMap },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available seats
   * GET /api/v1/organizer-dashboard/events/:eventId/seats/available
   */
  static async getAvailableSeats(
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

      const eventId = (req.params.eventId as string) as string;
      const { sectionId, seatType, minPrice, maxPrice } = req.query as Record<string, string | undefined>;
      const seats = await SeatMapService.getAvailableSeats(eventId, {
        sectionId,
        seatType: seatType as SeatType | undefined,
        minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
        maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
      });
      res.json({
        success: true,
        data: { seats },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete seat map
   * DELETE /api/v1/organizer-dashboard/events/:eventId/seat-map
   */
  static async deleteSeatMap(
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

      const eventId = (req.params.eventId as string) as string;
      await SeatMapService.deleteSeatMap(eventId, req.user.id);
      res.json({
        success: true,
        message: 'Seat map deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

/**
 * Public Seat Selection Controller (for attendees)
 */
export class SeatSelectionController {
  /**
   * Get best available seats
   * POST /api/v1/events/:eventId/seats/best-available
   */
  static async getBestAvailableSeats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const {
        quantity = 1,
        preferredSeatTypes,
        preferredSections,
        maxPrice,
        minPrice,
        keepTogether = true,
        prioritizeValue = false,
      } = req.body;

      const result = await SeatSelectionService.findBestAvailableSeats(eventId, {
        quantity: parseInt(quantity, 10) || 1,
        preferredSeatTypes,
        preferredSections,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        keepTogether,
        prioritizeValue,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get seat recommendations
   * GET /api/v1/events/:eventId/seats/recommendations
   */
  static async getSeatRecommendations(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const budget = req.query.budget ? parseFloat(req.query.budget as string) : undefined;
      const quantity = req.query.quantity ? parseInt(req.query.quantity as string, 10) : 1;

      const result = await SeatSelectionService.getSeatRecommendations(eventId, budget, quantity);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get seat map availability (public)
   * GET /api/v1/events/:eventId/seat-map
   */
  static async getSeatMapAvailability(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const eventId = (req.params.eventId as string) as string;
      const seatMap = await SeatSelectionService.getSeatMapAvailability(eventId);
      res.json({
        success: true,
        data: { seatMap },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reserve seats
   * POST /api/v1/events/:eventId/seats/reserve
   */
  static async reserveSeats(
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

      const eventId = (req.params.eventId as string) as string;
      const { seatIds, registrationId, reservationTimeoutMinutes } = req.body;

      if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'seatIds array is required',
        });
        return;
      }

      if (!registrationId) {
        res.status(400).json({
          success: false,
          message: 'registrationId is required',
        });
        return;
      }

      const reservations = await SeatSelectionService.reserveSeats(
        eventId,
        seatIds,
        registrationId,
        reservationTimeoutMinutes,
      );

      res.json({
        success: true,
        data: { reservations },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirm seat reservation
   * POST /api/v1/registrations/:registrationId/seats/confirm
   */
  static async confirmReservation(
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

      const registrationId = (req.params.registrationId as string) as string;
      const reservation = await SeatSelectionService.confirmSeatReservation(registrationId);
      res.json({
        success: true,
        data: { reservation },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel seat reservation
   * DELETE /api/v1/registrations/:registrationId/seats
   */
  static async cancelReservation(
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

      const registrationId = (req.params.registrationId as string) as string;
      await SeatSelectionService.cancelSeatReservation(registrationId);
      res.json({
        success: true,
        message: 'Seat reservation cancelled',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get seat selection for registration
   * GET /api/v1/registrations/:registrationId/seats
   */
  static async getSeatSelection(
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

      const registrationId = (req.params.registrationId as string) as string;
      const selection = await SeatSelectionService.getSeatSelection(registrationId);
      res.json({
        success: true,
        data: { selection },
      });
    } catch (error) {
      next(error);
    }
  }
}
