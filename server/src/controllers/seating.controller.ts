/**
 * Seating Controller
 *
 * Handles seat allocation, assignment, and management endpoints
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { SeatAllocationService } from '../services/seat-allocation.service.js';
import { SeatingConfigurationService } from '../services/seating-configuration.service.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from '../utils/errors.js';

/**
 * Extract a route parameter as a guaranteed string.
 * Express v5 types params as `string | string[]`; at runtime they are always strings.
 */
function routeParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const raw = params[key];
  return Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
}

export class SeatingController {
  /**
   * Reserve seats for registration (temporary, for cart)
   * POST /api/v1/events/:eventId/seats/reserve
   */
  static async reserveSeats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 'MISSING_AUTH');
      }

      const eventId = routeParam(req.params as Record<string, string | string[]>, 'eventId');
      const { registrationId, seatIds } = req.body as {
        registrationId?: string;
        seatIds?: string[];
      };

      // Validate inputs
      if (!registrationId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
        throw new ValidationError(
          'Registration ID and seat IDs array are required',
          'INVALID_RESERVE_REQUEST',
        );
      }

      // Verify user owns the registration
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        select: { attendeeId: true, eventId: true },
      });

      if (!registration) {
        throw new NotFoundError('Registration not found', 'REGISTRATION_NOT_FOUND');
      }

      if (registration.attendeeId !== req.user.id) {
        throw new AuthorizationError(
          'You can only reserve seats for your own registration',
          'UNAUTHORIZED_REGISTRATION',
        );
      }

      if (registration.eventId !== eventId) {
        throw new ValidationError(
          'Registration does not match event',
          'REGISTRATION_EVENT_MISMATCH',
        );
      }

      // Reserve seats
      await SeatAllocationService.reserveSeats(eventId, {
        registrationId,
        seatIds,
      });

      res.status(200).json({
        success: true,
        message: 'Seats reserved successfully',
        data: {
          registrationId,
          seatCount: seatIds.length,
        },
      });
    } catch (error) {
      logger.error('Seat reservation failed', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }

  /**
   * Confirm seat reservations (move to confirmed status)
   * POST /api/v1/registrations/:registrationId/seats/confirm
   */
  static async confirmSeats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 'MISSING_AUTH');
      }

      const registrationId = routeParam(
        req.params as Record<string, string | string[]>,
        'registrationId',
      );

      // Verify user owns the registration
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        select: { attendeeId: true },
      });

      if (!registration) {
        throw new NotFoundError('Registration not found', 'REGISTRATION_NOT_FOUND');
      }

      if (registration.attendeeId !== req.user.id) {
        throw new AuthorizationError(
          'You can only confirm seats for your own registration',
          'UNAUTHORIZED_REGISTRATION',
        );
      }

      // Confirm seats
      await SeatAllocationService.confirmSeatReservations(registrationId);

      res.status(200).json({
        success: true,
        message: 'Seats confirmed successfully',
      });
    } catch (error) {
      logger.error('Seat confirmation failed', {
        registrationId: routeParam(
          req.params as Record<string, string | string[]>,
          'registrationId',
        ),
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }

  /**
   * Assign seat to attendee (ORGANIZER_ASSIGNS model)
   * POST /api/v1/organizer-dashboard/events/:eventId/seats/assign
   */
  static async assignSeat(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 'MISSING_AUTH');
      }

      const eventId = routeParam(req.params as Record<string, string | string[]>, 'eventId');
      const { registrationId, seatId, attendeeName, attendeeEmail } = req.body as {
        registrationId?: string;
        seatId?: string;
        attendeeName?: string;
        attendeeEmail?: string;
      };

      // Validate inputs
      if (!registrationId || !seatId || !attendeeName || !attendeeEmail) {
        throw new ValidationError(
          'Registration ID, seat ID, attendee name, and email are required',
          'INVALID_ASSIGN_REQUEST',
        );
      }

      // Verify organizer owns the event
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { organizerId: true },
      });

      if (!event) {
        throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');
      }

      if (event.organizerId !== req.user.id) {
        throw new AuthorizationError(
          'You can only manage seats for your own events',
          'UNAUTHORIZED_EVENT',
        );
      }

      // Assign seat
      await SeatAllocationService.assignSeat(eventId, {
        registrationId,
        seatId,
        attendeeName,
        attendeeEmail,
      });

      res.status(200).json({
        success: true,
        message: 'Seat assigned successfully',
        data: {
          registrationId,
          seatId,
          attendeeName,
        },
      });
    } catch (error) {
      logger.error('Seat assignment failed', {
        userId: req.user?.id,
        eventId: routeParam(req.params as Record<string, string | string[]>, 'eventId'),
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }

  /**
   * Save seat preferences (ORGANIZER_ASSIGNS model)
   * POST /api/v1/registrations/:registrationId/seats/preferences
   */
  static async saveSeatPreferences(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 'MISSING_AUTH');
      }

      const registrationId = routeParam(
        req.params as Record<string, string | string[]>,
        'registrationId',
      );
      const { preferredSection, proximity, mobilityRequired, wheelchairAccessible, specialRequests } =
        req.body as {
          preferredSection?: string;
          proximity?: 'front' | 'middle' | 'back';
          mobilityRequired?: boolean;
          wheelchairAccessible?: boolean;
          specialRequests?: string;
        };

      // Verify user owns the registration
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        select: { attendeeId: true },
      });

      if (!registration) {
        throw new NotFoundError('Registration not found', 'REGISTRATION_NOT_FOUND');
      }

      if (registration.attendeeId !== req.user.id) {
        throw new AuthorizationError(
          'You can only set preferences for your own registration',
          'UNAUTHORIZED_REGISTRATION',
        );
      }

      // Save preferences
      await SeatAllocationService.saveSeatPreferences(registrationId, {
        preferredSection,
        proximity,
        mobilityRequired,
        wheelchairAccessible,
        specialRequests,
      });

      res.status(200).json({
        success: true,
        message: 'Seat preferences saved successfully',
      });
    } catch (error) {
      logger.error('Save preferences failed', {
        registrationId: routeParam(
          req.params as Record<string, string | string[]>,
          'registrationId',
        ),
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }

  /**
   * Get seat statistics for event
   * GET /api/v1/events/:eventId/seats/statistics
   */
  static async getSeatStatistics(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const eventId = routeParam(req.params as Record<string, string | string[]>, 'eventId');

      const stats = await SeatAllocationService.getSeatStatistics(eventId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Get seat statistics failed', {
        eventId: routeParam(req.params as Record<string, string | string[]>, 'eventId'),
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }

  /**
   * Get available seats for event
   * GET /api/v1/events/:eventId/seats/available
   */
  static async getAvailableSeats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const eventId = routeParam(req.params as Record<string, string | string[]>, 'eventId');
      const { sectionId, minPrice, maxPrice } = req.query as {
        sectionId?: string;
        minPrice?: string;
        maxPrice?: string;
      };

      const seats = await SeatAllocationService.getAvailableSeats(eventId, {
        sectionId,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
      });

      res.status(200).json({
        success: true,
        data: {
          seats,
          count: seats.length,
        },
      });
    } catch (error) {
      logger.error('Get available seats failed', {
        eventId: routeParam(req.params as Record<string, string | string[]>, 'eventId'),
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }

  /**
   * Configure seating for event
   * POST /api/v1/organizer-dashboard/events/:eventId/seating/configure
   */
  static async configureSeating(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 'MISSING_AUTH');
      }

      const eventId = routeParam(req.params as Record<string, string | string[]>, 'eventId');
      const { hasSeatingMap, seatingType, seatMapRequired } = req.body as {
        hasSeatingMap?: boolean;
        seatingType?: string;
        seatMapRequired?: boolean;
      };

      // Verify organizer owns the event
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { organizerId: true },
      });

      if (!event) {
        throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');
      }

      if (event.organizerId !== req.user.id) {
        throw new AuthorizationError(
          'You can only configure seating for your own events',
          'UNAUTHORIZED_EVENT',
        );
      }

      // Configure seating
      await SeatingConfigurationService.configureSeating({
        eventId,
        hasSeatingMap: hasSeatingMap ?? false,
        seatingType: seatingType as import('@prisma/client').SeatingType,
        seatMapRequired: seatMapRequired ?? false,
      });

      res.status(200).json({
        success: true,
        message: 'Seating configuration updated successfully',
      });
    } catch (error) {
      logger.error('Configure seating failed', {
        userId: req.user?.id,
        eventId: routeParam(req.params as Record<string, string | string[]>, 'eventId'),
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }

  /**
   * Validate seating configuration
   * GET /api/v1/organizer-dashboard/events/:eventId/seating/validate
   */
  static async validateSeatingConfiguration(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const eventId = routeParam(req.params as Record<string, string | string[]>, 'eventId');

      const result = await SeatingConfigurationService.validateSeatingConfiguration(eventId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Validate seating configuration failed', {
        eventId: routeParam(req.params as Record<string, string | string[]>, 'eventId'),
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }

  /**
   * Get seating configuration for event
   * GET /api/v1/events/:eventId/seating/configuration
   */
  static async getSeatingConfiguration(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const eventId = routeParam(req.params as Record<string, string | string[]>, 'eventId');

      const config = await SeatingConfigurationService.getSeatingConfiguration(eventId);

      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      logger.error('Get seating configuration failed', {
        eventId: routeParam(req.params as Record<string, string | string[]>, 'eventId'),
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }

  /**
   * Dashboard: Get seat allocation summary
   * GET /api/v1/organizer-dashboard/events/:eventId/seats/summary
   * Returns: totalSeats, allocatedSeats, availableSeats, pendingSeats, byModel
   */
  static async getSeatAllocationSummary(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 'MISSING_AUTH');
      }

      const eventId = routeParam(req.params as Record<string, string | string[]>, 'eventId');

      // Verify organizer owns this event
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { organizerId: true, hasSeatingMap: true, seatingType: true },
      });

      if (!event) {
        throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');
      }

      if (event.organizerId !== req.user.id) {
        throw new AuthorizationError('You do not own this event', 'UNAUTHORIZED_EVENT');
      }

      if (!event.hasSeatingMap) {
        res.status(200).json({
          success: true,
          data: {
            hasSeating: false,
            message: 'This event does not have seating configured',
          },
        });
        return;
      }

      // Get seat statistics (Seat has no eventId — must traverse via seatMap)
      const seatMapWhere = { seatMap: { eventId } } as const;
      const reservationWhere = { seat: { seatMap: { eventId } } } as const;
      const [totalSeats, allocatedSeats, availableSeats] = await Promise.all([
        prisma.seat.count({ where: seatMapWhere }),
        prisma.seatReservation.count({
          where: {
            ...reservationWhere,
            status: { in: ['confirmed', 'reserved'] },
          },
        }),
        prisma.seat.count({
          where: {
            ...seatMapWhere,
            reservations: {
              none: {
                status: { in: ['confirmed', 'reserved'] },
              },
            },
          },
        }),
      ]);

      // Get breakdown by status
      const byModel = await prisma.seatReservation.groupBy({
        by: ['status'],
        where: { ...reservationWhere },
        _count: { _all: true },
      });

      const statusBreakdown = byModel.reduce(
        (acc, item) => {
          acc[item.status ?? 'UNKNOWN'] = item._count._all;
          return acc;
        },
        {} as Record<string, number>,
      );

      res.status(200).json({
        success: true,
        data: {
          totalSeats,
          allocatedSeats,
          availableSeats,
          pendingSeats: statusBreakdown['PENDING'] || 0,
          byStatus: statusBreakdown,
          lastUpdated: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Get seat allocation summary failed', {
        userId: req.user?.id,
        eventId: routeParam(req.params as Record<string, string | string[]>, 'eventId'),
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }

  /**
   * Dashboard: Get seat allocations list with pagination
   * GET /api/v1/organizer-dashboard/events/:eventId/seats/allocations
   */
  static async getSeatAllocations(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 'MISSING_AUTH');
      }

      const eventId = routeParam(req.params as Record<string, string | string[]>, 'eventId');
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, parseInt(req.query.limit as string, 10) || 50);
      const statusFilter = (req.query.status as string) || 'all';

      // Verify organizer owns this event
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { organizerId: true },
      });

      if (!event || event.organizerId !== req.user.id) {
        throw new AuthorizationError('You do not own this event', 'UNAUTHORIZED_EVENT');
      }

      const baseWhere = { seat: { seatMap: { eventId } } } as const;
      const whereClause = statusFilter !== 'all'
        ? { ...baseWhere, status: statusFilter }
        : baseWhere;

      const [allocations, total] = await Promise.all([
        prisma.seatReservation.findMany({
          where: whereClause,
          include: {
            registration: {
              select: {
                id: true,
                attendee: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
            },
            seat: {
              select: {
                id: true,
                sectionId: true,
                rowLabel: true,
                seatLabel: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.seatReservation.count({ where: whereClause }),
      ]);

      const formattedAllocations = allocations.map((allocation) => {
        const attendee = allocation.registration?.attendee;
        const seat = allocation.seat;
        return {
          id: allocation.id,
          registrationId: allocation.registration?.id,
          attendeeName: attendee
            ? `${attendee.firstName ?? ''} ${attendee.lastName ?? ''}`.trim() || 'Unknown'
            : (allocation.attendeeName ?? 'Unknown'),
          attendeeEmail: attendee?.email ?? allocation.attendeeEmail,
          seatId: seat?.id,
          seatLocation: seat
            ? [seat.sectionId, seat.rowLabel, seat.seatLabel].filter(Boolean).join('-')
            : 'Unassigned',
          status: allocation.status,
          allocatedAt: allocation.createdAt,
        };
      });

      res.status(200).json({
        success: true,
        data: {
          allocations: formattedAllocations,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      logger.error('Get seat allocations failed', {
        userId: req.user?.id,
        eventId: routeParam(req.params as Record<string, string | string[]>, 'eventId'),
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }

  /**
   * Dashboard: Get seat allocation breakdown by ticket type
   * GET /api/v1/organizer-dashboard/events/:eventId/seats/by-type
   */
  static async getSeatAllocationByType(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 'MISSING_AUTH');
      }

      const eventId = routeParam(req.params as Record<string, string | string[]>, 'eventId');

      // Verify organizer owns this event
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { organizerId: true },
      });

      if (!event || event.organizerId !== req.user.id) {
        throw new AuthorizationError('You do not own this event', 'UNAUTHORIZED_EVENT');
      }

      // Ticket types are stored in TicketLineItem rows — get distinct values for this event
      const ticketTypeRows = await prisma.ticketLineItem.findMany({
        where: { registration: { eventId } },
        select: { ticketType: true },
        distinct: ['ticketType'],
      });
      const ticketTypes = ticketTypeRows.map((r) => r.ticketType);

      const allocationByType: Record<string, unknown> = {};

      // Available seats (no confirmed/reserved reservation) — same for all ticket types
      const availableSeats = await prisma.seat.count({
        where: {
          seatMap: { eventId },
          reservations: {
            none: {
              status: { in: ['confirmed', 'reserved'] },
            },
          },
        },
      });

      for (const ticketTypeName of ticketTypes) {
        const [allocated, pending] = await Promise.all([
          prisma.seatReservation.count({
            where: {
              seat: { seatMap: { eventId } },
              status: 'confirmed',
              registration: { ticketType: ticketTypeName },
            },
          }),
          prisma.seatReservation.count({
            where: {
              seat: { seatMap: { eventId } },
              status: 'reserved',
              registration: { ticketType: ticketTypeName },
            },
          }),
        ]);

        allocationByType[ticketTypeName] = {
          allocated,
          available: availableSeats,
          pending,
          total: allocated + availableSeats + pending,
        };
      }

      res.status(200).json({
        success: true,
        data: {
          byType: allocationByType,
        },
      });
    } catch (error) {
      logger.error('Get seat allocation by type failed', {
        userId: req.user?.id,
        eventId: routeParam(req.params as Record<string, string | string[]>, 'eventId'),
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }

  /**
   * Dashboard: Get seat transfer and resale operations history
   * GET /api/v1/organizer-dashboard/events/:eventId/seats/operations
   */
  static async getSeatOperations(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 'MISSING_AUTH');
      }

      const eventId = routeParam(req.params as Record<string, string | string[]>, 'eventId');
      const limit = Math.min(100, parseInt(req.query.limit as string, 10) || 20);

      // Verify organizer owns this event
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { organizerId: true },
      });

      if (!event || event.organizerId !== req.user.id) {
        throw new AuthorizationError('You do not own this event', 'UNAUTHORIZED_EVENT');
      }

      // Get recent seat operations (transfers, resales, allocations)
      const operations = await prisma.seatReservation.findMany({
        where: { seat: { seatMap: { eventId } } },
        include: {
          registration: {
            select: {
              id: true,
              attendee: { select: { firstName: true, lastName: true, email: true } },
            },
          },
          seat: {
            select: { id: true, sectionId: true, rowLabel: true, seatLabel: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      });

      const formattedOperations = operations.map((op) => {
        const attendee = op.registration?.attendee;
        const seat = op.seat;
        return {
          id: op.id,
          type: op.status === 'released' ? 'RELEASED' : 'ALLOCATION',
          seatId: seat?.id,
          seatLocation: seat
            ? [seat.sectionId, seat.rowLabel, seat.seatLabel].filter(Boolean).join('-')
            : 'Unassigned',
          attendeeName: attendee
            ? `${attendee.firstName ?? ''} ${attendee.lastName ?? ''}`.trim() || 'Unknown'
            : (op.attendeeName ?? 'Unknown'),
          attendeeEmail: attendee?.email ?? op.attendeeEmail,
          status: op.status,
          operationDate: op.updatedAt,
          registrationId: op.registration?.id,
        };
      });

      res.status(200).json({
        success: true,
        data: {
          operations: formattedOperations,
        },
      });
    } catch (error) {
      logger.error('Get seat operations failed', {
        userId: req.user?.id,
        eventId: routeParam(req.params as Record<string, string | string[]>, 'eventId'),
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }

  /**
   * Get registration seats
   * GET /api/v1/registrations/:registrationId/seats
   */
  static async getRegistrationSeats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 'MISSING_AUTH');
      }

      const registrationId = routeParam(req.params as Record<string, string | string[]>, 'registrationId');

      // Verify user owns this registration
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        select: { attendeeId: true, id: true },
      });

      if (!registration) {
        throw new NotFoundError('Registration not found', 'REGISTRATION_NOT_FOUND');
      }

      if (registration.attendeeId !== req.user.id) {
        throw new AuthorizationError('You do not own this registration', 'UNAUTHORIZED_REGISTRATION');
      }

      // Get seats for this registration
      const seats = await prisma.seatReservation.findMany({
        where: { registrationId },
        include: {
          seat: {
            select: {
              id: true,
              sectionId: true,
              rowLabel: true,
              seatLabel: true,
              seatType: true,
              currentPrice: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      const formattedSeats = seats.map((s) => ({
        seatId: s.seat?.id,
        location: s.seat
          ? [s.seat.sectionId, s.seat.rowLabel, s.seat.seatLabel].filter(Boolean).join('-')
          : 'Unassigned',
        section: s.seat?.sectionId,
        row: s.seat?.rowLabel,
        number: s.seat?.seatLabel,
        type: s.seat?.seatType,
        price: s.seat?.currentPrice,
        status: s.status,
        allocatedAt: s.createdAt,
      }));

      res.status(200).json({
        success: true,
        data: {
          registrationId,
          seats: formattedSeats,
          seatCount: formattedSeats.length,
        },
      });
    } catch (error) {
      logger.error('Get registration seats failed', {
        userId: req.user?.id,
        registrationId: routeParam(req.params as Record<string, string | string[]>, 'registrationId'),
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }
}
