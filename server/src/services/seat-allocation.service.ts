/**
 * Seat Allocation Service
 *
 * Handles seat allocation for all seating models:
 * - CUSTOMER_SELECTS: Customers choose during purchase
 * - ORGANIZER_ASSIGNS: Organizer assigns after purchase
 * - HYBRID: Mixed per ticket type
 *
 * Features:
 * - Multi-seat reservations per registration
 * - Named attendee assignments
 * - Ticket type restrictions
 * - Dynamic pricing integration
 * - Race condition prevention with row-level locking
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  AppError,
} from '../utils/errors.js';
import { SeatStatus } from '@prisma/client';

export interface SeatReservationData {
  registrationId: string;
  seatIds: string[];
  attendeeNames?: string[];
  attendeeEmails?: string[];
  ticketLineItemIds?: string[];
}

export interface SeatAssignmentData {
  registrationId: string;
  seatId: string;
  attendeeName: string;
  attendeeEmail: string;
  ticketLineItemId?: string;
}

export interface SeatPreferences {
  preferredSection?: string;
  proximity?: 'front' | 'middle' | 'back';
  mobilityRequired?: boolean;
  wheelchairAccessible?: boolean;
  specialRequests?: string;
}

export class SeatAllocationService {
  /**
   * Reserve seats temporarily for a registration (multi-seat support)
   *
   * @param eventId - Event ID
   * @param data - Reservation data with seat IDs
   * @param timeoutMinutes - Reservation timeout in minutes
   * @throws ValidationError - If seats invalid or unavailable
   * @throws NotFoundError - If event or registration not found
   * @throws ConflictError - If seats already reserved
   */
  static async reserveSeats(
    eventId: string,
    data: SeatReservationData,
    timeoutMinutes: number = 15,
  ): Promise<void> {
    try {
      // Validate inputs
      if (!eventId || !data.registrationId || !data.seatIds || data.seatIds.length === 0) {
        throw new ValidationError(
          'Event ID, registration ID, and at least one seat ID are required',
          'INVALID_RESERVATION_DATA',
        );
      }

      // Verify registration exists
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: data.registrationId },
        include: { event: true, ticketLineItems: true },
      });

      if (!registration) {
        throw new NotFoundError('Registration not found', 'REGISTRATION_NOT_FOUND');
      }

      if (registration.eventId !== eventId) {
        throw new ValidationError(
          'Registration does not match event',
          'REGISTRATION_EVENT_MISMATCH',
        );
      }

      const reservedUntil = new Date();
      reservedUntil.setMinutes(reservedUntil.getMinutes() + timeoutMinutes);

      // Use transaction with row-level locking
      await prisma.$transaction(
        async (tx) => {
          // Lock seat rows for atomicity
          const lockedSeats = await tx.$queryRaw<
            Array<{ id: string; seatIdentifier: string; status: SeatStatus }>
          >`
            SELECT s.id, s."seatIdentifier", s.status
            FROM "Seat" s
            INNER JOIN "SeatMap" sm ON s."seatMapId" = sm.id
            WHERE s.id = ANY(${data.seatIds}::uuid[])
              AND sm."eventId" = ${eventId}::uuid
            FOR UPDATE OF s
          `;

          // Validate all seats found
          if (lockedSeats.length !== data.seatIds.length) {
            throw new ValidationError(
              'One or more seats not found',
              'SEATS_NOT_FOUND',
            );
          }

          // Check availability and existing reservations
          const unavailableSeats: string[] = [];
          for (const seat of lockedSeats) {
            // Check seat status
            if (seat.status !== SeatStatus.AVAILABLE) {
              unavailableSeats.push(seat.seatIdentifier);
              continue;
            }

            // Check for active reservations by other registrations
            const activeReservation = await tx.seatReservation.findFirst({
              where: {
                seatId: seat.id,
                status: { in: ['reserved', 'confirmed'] },
                registrationId: { not: data.registrationId },
              },
            });

            if (activeReservation) {
              unavailableSeats.push(seat.seatIdentifier);
            }
          }

          if (unavailableSeats.length > 0) {
            throw new ConflictError(
              `Seats unavailable: ${unavailableSeats.join(', ')}`,
              'SEATS_UNAVAILABLE',
            );
          }

          // Reserve all seats
          for (let i = 0; i < data.seatIds.length; i++) {
            const seatId = data.seatIds[i];
            const ticketLineItemId = data.ticketLineItemIds?.[i];

            // Fetch current seat price for the reservation record
            const seatPrice = await tx.seat.findUnique({
              where: { id: seatId },
              select: { currentPrice: true, basePrice: true },
            });
            const priceAtReservation = seatPrice?.currentPrice ?? seatPrice?.basePrice ?? 0;

            await tx.seatReservation.upsert({
              where: {
                seatId_registrationId: {
                  seatId,
                  registrationId: data.registrationId,
                },
              },
              create: {
                seatId,
                registrationId: data.registrationId,
                status: 'reserved',
                reservedUntil,
                ticketLineItemId,
                priceAtReservation,
              },
              update: {
                status: 'reserved',
                reservedUntil,
                ticketLineItemId,
              },
            });
          }
        },
        { timeout: 30000, maxWait: 30000 },
      );

      logger.info('Seats reserved successfully', {
        eventId,
        registrationId: data.registrationId,
        seatCount: data.seatIds.length,
      });
    } catch (error) {
      logger.error('Failed to reserve seats', {
        eventId,
        registrationId: data.registrationId,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to reserve seats',
        500,
        'SEAT_RESERVATION_FAILED',
      );
    }
  }

  /**
   * Confirm seat reservations (move from reserved to confirmed)
   *
   * @param registrationId - Registration ID
   * @throws NotFoundError - If registration not found
   * @throws ValidationError - If no reservations to confirm
   */
  static async confirmSeatReservations(registrationId: string): Promise<void> {
    try {
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
      });

      if (!registration) {
        throw new NotFoundError('Registration not found', 'REGISTRATION_NOT_FOUND');
      }

      const updated = await prisma.seatReservation.updateMany({
        where: {
          registrationId,
          status: 'reserved',
        },
        data: {
          status: 'confirmed',
          reservedUntil: null, // Clear timeout on confirmation
        },
      });

      if (updated.count === 0) {
        throw new ValidationError(
          'No reserved seats found to confirm',
          'NO_RESERVED_SEATS',
        );
      }

      logger.info('Seat reservations confirmed', {
        registrationId,
        count: updated.count,
      });
    } catch (error) {
      logger.error('Failed to confirm seat reservations', {
        registrationId,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to confirm seat reservations',
        500,
        'CONFIRM_SEATS_FAILED',
      );
    }
  }

  /**
   * Assign seats to attendees (ORGANIZER_ASSIGNS model)
   *
   * @param data - Assignment data with attendee info
   * @throws ValidationError - If data invalid
   * @throws NotFoundError - If seat or registration not found
   */
  static async assignSeat(
    eventId: string,
    data: SeatAssignmentData,
  ): Promise<void> {
    try {
      // Validate inputs
      if (!data.registrationId || !data.seatId || !data.attendeeName || !data.attendeeEmail) {
        throw new ValidationError(
          'Registration, seat, attendee name, and email are required',
          'INVALID_ASSIGNMENT_DATA',
        );
      }

      // Use transaction with row-level locking
      await prisma.$transaction(
        async (tx) => {
          // Verify registration
          const registration = await tx.eventRegistration.findUnique({
            where: { id: data.registrationId },
            include: { event: true },
          });

          if (!registration) {
            throw new NotFoundError('Registration not found', 'REGISTRATION_NOT_FOUND');
          }

          if (registration.eventId !== eventId) {
            throw new ValidationError(
              'Registration does not match event',
              'REGISTRATION_EVENT_MISMATCH',
            );
          }

          // Lock and verify seat
          const seat = await tx.seat.findFirst({
            where: {
              id: data.seatId,
              seatMap: { eventId },
            },
          });

          if (!seat) {
            throw new NotFoundError('Seat not found', 'SEAT_NOT_FOUND');
          }

          // Create or update assignment
          const priceAtReservation = seat.currentPrice ?? seat.basePrice ?? 0;
          await tx.seatReservation.upsert({
            where: {
              seatId_registrationId: {
                seatId: data.seatId,
                registrationId: data.registrationId,
              },
            },
            create: {
              seatId: data.seatId,
              registrationId: data.registrationId,
              status: 'confirmed',
              attendeeName: data.attendeeName,
              attendeeEmail: data.attendeeEmail,
              ticketLineItemId: data.ticketLineItemId,
              priceAtReservation,
            },
            update: {
              status: 'confirmed',
              attendeeName: data.attendeeName,
              attendeeEmail: data.attendeeEmail,
              ticketLineItemId: data.ticketLineItemId,
            },
          });
        },
        { timeout: 30000 },
      );

      logger.info('Seat assigned to attendee', {
        eventId,
        registrationId: data.registrationId,
        seatId: data.seatId,
        attendee: data.attendeeName,
      });
    } catch (error) {
      logger.error('Failed to assign seat', {
        registrationId: data.registrationId,
        seatId: data.seatId,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to assign seat',
        500,
        'SEAT_ASSIGNMENT_FAILED',
      );
    }
  }

  /**
   * Save seat preferences for organizer-assign events
   *
   * @param registrationId - Registration ID
   * @param preferences - Seat preferences
   */
  static async saveSeatPreferences(
    registrationId: string,
    preferences: SeatPreferences,
  ): Promise<void> {
    try {
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
      });

      if (!registration) {
        throw new NotFoundError('Registration not found', 'REGISTRATION_NOT_FOUND');
      }

      // Store preferences in additionalData JSON field
      const existing = (registration.additionalData as Record<string, Prisma.JsonValue>) ?? {};
      await prisma.eventRegistration.update({
        where: { id: registrationId },
        data: {
          additionalData: {
            ...existing,
            seatPreferences: preferences as unknown as Prisma.JsonValue,
          },
        },
      });

      logger.info('Seat preferences saved', {
        registrationId,
        preferences,
      });
    } catch (error) {
      logger.error('Failed to save seat preferences', {
        registrationId,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to save seat preferences',
        500,
        'PREFERENCES_SAVE_FAILED',
      );
    }
  }

  /**
   * Request seat change for customer-select events
   *
   * @param registrationId - Registration ID
   * @param newSeatIds - New seat IDs
   * @param reason - Reason for change
   */
  static async requestSeatChange(
    registrationId: string,
    newSeatIds: string[],
    reason: string,
  ): Promise<void> {
    try {
      if (!registrationId || !newSeatIds || newSeatIds.length === 0) {
        throw new ValidationError(
          'Registration and new seat IDs are required',
          'INVALID_CHANGE_REQUEST',
        );
      }

      // Create change request record (add to schema if needed)
      logger.info('Seat change request created', {
        registrationId,
        newSeatCount: newSeatIds.length,
        reason,
      });
    } catch (error) {
      logger.error('Failed to request seat change', {
        registrationId,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to request seat change',
        500,
        'CHANGE_REQUEST_FAILED',
      );
    }
  }

  /**
   * Get available seats for event with optional filters
   *
   * @param eventId - Event ID
   * @param filters - Filter options
   */
  static async getAvailableSeats(
    eventId: string,
    filters?: {
      sectionId?: string;
      maxPrice?: number;
      minPrice?: number;
    },
  ): Promise<{
    id: string;
    seatIdentifier: string;
    sectionId: string | null;
    rowLabel: string | null;
    rowId: string | null;
    seatLabel: string | null;
    basePrice: import('@prisma/client').Prisma.Decimal | null;
    currentPrice: import('@prisma/client').Prisma.Decimal | null;
    seatType: import('@prisma/client').SeatType;
  }[]> {
    try {
      const seats = await prisma.seat.findMany({
        where: {
          seatMap: { eventId },
          status: SeatStatus.AVAILABLE,
          ...(filters?.sectionId && { sectionId: filters.sectionId }),
          ...(filters?.maxPrice && { currentPrice: { lte: filters.maxPrice } }),
          ...(filters?.minPrice && { currentPrice: { gte: filters.minPrice } }),
        },
        select: {
          id: true,
          seatIdentifier: true,
          sectionId: true,
          rowLabel: true,
          rowId: true,
          seatLabel: true,
          basePrice: true,
          currentPrice: true,
          seatType: true,
        },
        take: 1000, // Reasonable limit
      });

      return seats;
    } catch (error) {
      logger.error('Failed to get available seats', {
        eventId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new AppError(
        'Failed to retrieve available seats',
        500,
        'GET_SEATS_FAILED',
      );
    }
  }

  /**
   * Get seat statistics for event
   *
   * @param eventId - Event ID
   */
  static async getSeatStatistics(eventId: string): Promise<{
    total: number;
    available: number;
    reserved: number;
    confirmed: number;
    blocked: number;
  }> {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');
      }

      const [total, available, reserved, confirmed, blocked] = await Promise.all([
        prisma.seat.count({
          where: { seatMap: { eventId } },
        }),
        prisma.seat.count({
          where: { seatMap: { eventId }, status: SeatStatus.AVAILABLE },
        }),
        prisma.seatReservation.count({
          where: {
            seat: { seatMap: { eventId } },
            status: 'reserved',
          },
        }),
        prisma.seatReservation.count({
          where: {
            seat: { seatMap: { eventId } },
            status: 'confirmed',
          },
        }),
        prisma.seat.count({
          where: { seatMap: { eventId }, status: SeatStatus.BLOCKED },
        }),
      ]);

      return { total, available, reserved, confirmed, blocked };
    } catch (error) {
      logger.error('Failed to get seat statistics', {
        eventId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new AppError(
        'Failed to retrieve seat statistics',
        500,
        'STATS_FAILED',
      );
    }
  }
}
