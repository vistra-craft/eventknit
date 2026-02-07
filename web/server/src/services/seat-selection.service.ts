/**
 * Seat Selection Service
 * 
 * Handles seat selection, reservation, and booking
 */

import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { SeatStatus } from '@prisma/client';

export class SeatSelectionService {
  /**
   * Reserve seats (temporary reservation for cart)
   */
  static async reserveSeats(
    eventId: string,
    seatIds: string[],
    registrationId: string,
    reservationTimeoutMinutes: number = 15,
  ) {
    try {
      // Verify registration exists
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: {
          event: true,
        },
      });

      if (!registration) {
        throw new NotFoundError('Registration not found');
      }

      if (registration.eventId !== eventId) {
        throw new ValidationError('Registration does not match event');
      }

      // Get seat map
      const seatMap = await prisma.seatMap.findUnique({
        where: { eventId },
        include: {
          seats: {
            where: {
              id: { in: seatIds },
            },
            include: {
              reservations: {
                where: {
                  status: { in: ['reserved', 'confirmed'] },
                  OR: [
                    { reservedUntil: null },
                    { reservedUntil: { gt: new Date() } },
                  ],
                },
              },
            },
          },
        },
      });

      if (!seatMap) {
        throw new NotFoundError('Seat map not found for this event');
      }

      // Check if seats are available
      const unavailableSeats: string[] = [];
      for (const seat of seatMap.seats) {
        if (seat.status !== SeatStatus.AVAILABLE) {
          unavailableSeats.push(seat.seatIdentifier);
          continue;
        }

        // Check for active reservations
        const activeReservation = seat.reservations.find(
          r => r.status === 'reserved' || r.status === 'confirmed',
        );

        if (activeReservation && activeReservation.registrationId !== registrationId) {
          unavailableSeats.push(seat.seatIdentifier);
        }
      }

      if (unavailableSeats.length > 0) {
        throw new ValidationError(
          `Seats are not available: ${unavailableSeats.join(', ')}`,
        );
      }

      // Create reservations
      const reservedUntil = new Date();
      reservedUntil.setMinutes(reservedUntil.getMinutes() + reservationTimeoutMinutes);

      const reservations = await Promise.all(
        seatIds.map(async (seatId) => {
          const seat = seatMap.seats.find(s => s.id === seatId);
          if (!seat) {
            throw new NotFoundError(`Seat ${seatId} not found`);
          }

          // Check if reservation already exists
          const existing = await prisma.seatReservation.findFirst({
            where: {
              registrationId,
              seatId,
              status: { in: ['reserved', 'confirmed'] },
            },
          });

          if (existing) {
            // Update existing reservation
            return await prisma.seatReservation.update({
              where: { id: existing.id },
              data: {
                reservedUntil,
                priceAtReservation: seat.currentPrice || seat.basePrice || 0,
              },
            });
          }

          // Create new reservation
          return await prisma.seatReservation.create({
            data: {
              seatId,
              registrationId,
              reservedUntil,
              priceAtReservation: seat.currentPrice || seat.basePrice || 0,
              status: 'reserved',
            },
          });
        }),
      );

      // Update seat statuses
      await prisma.seat.updateMany({
        where: {
          id: { in: seatIds },
        },
        data: {
          status: SeatStatus.RESERVED,
        },
      });

      logger.info(`Reserved ${seatIds.length} seats for registration ${registrationId}`);
      return reservations;
    } catch (error) {
      logger.error('Error reserving seats:', error);
      throw error;
    }
  }

  /**
   * Confirm seat reservation (after payment)
   */
  static async confirmSeatReservation(registrationId: string) {
    try {
      const reservation = await prisma.seatReservation.findUnique({
        where: { registrationId },
        include: {
          seat: true,
        },
      });

      if (!reservation) {
        throw new NotFoundError('Seat reservation not found');
      }

      if (reservation.status === 'confirmed') {
        return reservation; // Already confirmed
      }

      // Confirm reservation
      const confirmed = await prisma.seatReservation.update({
        where: { id: reservation.id },
        data: {
          status: 'confirmed',
          confirmedAt: new Date(),
          reservedUntil: null,
        },
      });

      // Update seat status
      await prisma.seat.update({
        where: { id: reservation.seatId },
        data: {
          status: SeatStatus.BOOKED,
        },
      });

      logger.info(`Confirmed seat reservation for registration ${registrationId}`);
      return confirmed;
    } catch (error) {
      logger.error('Error confirming seat reservation:', error);
      throw error;
    }
  }

  /**
   * Cancel seat reservation
   */
  static async cancelSeatReservation(registrationId: string) {
    try {
      const reservation = await prisma.seatReservation.findUnique({
        where: { registrationId },
        include: {
          seat: true,
        },
      });

      if (!reservation) {
        throw new NotFoundError('Seat reservation not found');
      }

      // Cancel reservation
      await prisma.seatReservation.update({
        where: { id: reservation.id },
        data: {
          status: 'cancelled',
        },
      });

      // Release seat
      await prisma.seat.update({
        where: { id: reservation.seatId },
        data: {
          status: SeatStatus.AVAILABLE,
        },
      });

      logger.info(`Cancelled seat reservation for registration ${registrationId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error cancelling seat reservation:', error);
      throw error;
    }
  }

  /**
   * Get seat selection for registration
   */
  static async getSeatSelection(registrationId: string) {
    try {
      const reservation = await prisma.seatReservation.findUnique({
        where: { registrationId },
        include: {
          seat: {
            include: {
              seatMap: {
                include: {
                  event: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
          },
          registration: {
            select: {
              id: true,
              attendee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      return reservation;
    } catch (error) {
      logger.error('Error getting seat selection:', error);
      throw error;
    }
  }

  /**
   * Get seat map with availability for public viewing
   */
  static async getSeatMapAvailability(eventId: string) {
    try {
      const seatMap = await prisma.seatMap.findUnique({
        where: { eventId },
        include: {
          seats: {
            include: {
              reservations: {
                where: {
                  status: { in: ['reserved', 'confirmed'] },
                  OR: [
                    { reservedUntil: null },
                    { reservedUntil: { gt: new Date() } },
                  ],
                },
              },
            },
            orderBy: [
              { sectionId: 'asc' },
              { rowLabel: 'asc' },
              { seatLabel: 'asc' },
            ],
          },
        },
      });

      if (!seatMap) {
        throw new NotFoundError('Seat map not found');
      }

      // Map seats with availability status
      const seatsWithAvailability = seatMap.seats.map((seat) => {
        const hasActiveReservation = seat.reservations.length > 0;
        const isAvailable = seat.status === SeatStatus.AVAILABLE && !hasActiveReservation;

        return {
          id: seat.id,
          seatIdentifier: seat.seatIdentifier,
          sectionId: seat.sectionId,
          rowLabel: seat.rowLabel,
          seatLabel: seat.seatLabel,
          seatType: seat.seatType,
          status: isAvailable ? 'available' : seat.status.toLowerCase(),
          price: seat.currentPrice || seat.basePrice,
          x: seat.x,
          y: seat.y,
          angle: seat.angle,
          metadata: seat.metadata,
        };
      });

      return {
        ...seatMap,
        seats: seatsWithAvailability,
      };
    } catch (error) {
      logger.error('Error getting seat map availability:', error);
      throw error;
    }
  }

  /**
   * Clean up expired reservations (should be run periodically)
   */
  static async cleanupExpiredReservations() {
    try {
      const now = new Date();

      const expiredReservations = await prisma.seatReservation.findMany({
        where: {
          status: 'reserved',
          reservedUntil: {
            lt: now,
          },
        },
        include: {
          seat: true,
        },
      });

      if (expiredReservations.length === 0) {
        return { cleaned: 0 };
      }

      // Release seats and cancel reservations
      await prisma.$transaction([
        prisma.seatReservation.updateMany({
          where: {
            id: { in: expiredReservations.map(r => r.id) },
          },
          data: {
            status: 'cancelled',
          },
        }),
        prisma.seat.updateMany({
          where: {
            id: { in: expiredReservations.map(r => r.seat.id) },
          },
          data: {
            status: SeatStatus.AVAILABLE,
          },
        }),
      ]);

      logger.info(`Cleaned up ${expiredReservations.length} expired seat reservations`);
      return { cleaned: expiredReservations.length };
    } catch (error) {
      logger.error('Error cleaning up expired reservations:', error);
      throw error;
    }
  }
}
