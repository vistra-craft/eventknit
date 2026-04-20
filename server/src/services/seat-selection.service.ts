/**
 * Seat Selection Service
 * 
 * Handles seat selection, reservation, and booking
 */

import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { Prisma, SeatStatus, SeatType, type Seat, type SeatReservation } from '@prisma/client';
import { DynamicPricingService, SeatPricingContext } from './dynamic-pricing.service.js';

export interface BestSeatCriteria {
  quantity: number;
  preferredSeatTypes?: SeatType[];
  preferredSections?: string[];
  maxPrice?: number;
  minPrice?: number;
  keepTogether?: boolean; // Try to keep seats adjacent
  prioritizeValue?: boolean; // Prioritize price-to-quality ratio
}

export interface SeatScore {
  seat: Seat;
  score: number;
  reasons: string[];
  dynamicPrice?: number;
}

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
        include: { event: true },
      });

      if (!registration) {
        throw new NotFoundError('Registration not found');
      }

      if (registration.eventId !== eventId) {
        throw new ValidationError('Registration does not match event');
      }

      const reservedUntil = new Date();
      reservedUntil.setMinutes(reservedUntil.getMinutes() + reservationTimeoutMinutes);

      // Use transaction with row-level locking to prevent race conditions
      const reservations = await prisma.$transaction(async (tx) => {
        // Lock the seat rows using FOR UPDATE to prevent concurrent reservations
        const lockedSeats = await tx.$queryRaw<Array<{ id: string; seatIdentifier: string; status: string; basePrice: Prisma.Decimal | null; currentPrice: Prisma.Decimal | null }>>`
          SELECT s.id, s."seatIdentifier", s.status, s."basePrice", s."currentPrice"
          FROM "Seat" s
          INNER JOIN "SeatMap" sm ON s."seatMapId" = sm.id
          WHERE s.id = ANY(${seatIds}::uuid[])
            AND sm."eventId" = ${eventId}::uuid
          FOR UPDATE OF s
        `;

        if (lockedSeats.length !== seatIds.length) {
          throw new ValidationError('One or more seats not found');
        }

        // Check all seats are available
        const unavailableSeats: string[] = [];
        for (const seat of lockedSeats) {
          if (seat.status !== 'AVAILABLE') {
            unavailableSeats.push(seat.seatIdentifier);
            continue;
          }

          // Check for active reservations by OTHER registrations
          const activeReservation = await tx.seatReservation.findFirst({
            where: {
              seatId: seat.id,
              status: { in: ['reserved', 'confirmed'] },
              registrationId: { not: registrationId },
              OR: [
                { reservedUntil: null },
                { reservedUntil: { gt: new Date() } },
              ],
            },
          });

          if (activeReservation) {
            unavailableSeats.push(seat.seatIdentifier);
          }
        }

        if (unavailableSeats.length > 0) {
          throw new ValidationError(
            `Seats are not available: ${unavailableSeats.join(', ')}`,
          );
        }

        // Cancel any previous reservations for this registration (user changing seat selection)
        const previousReservations = await tx.seatReservation.findMany({
          where: {
            registrationId,
            status: 'reserved',
            seatId: { notIn: seatIds },
          },
          select: { id: true, seatId: true },
        });

        if (previousReservations.length > 0) {
          await tx.seatReservation.updateMany({
            where: { id: { in: previousReservations.map(r => r.id) } },
            data: { status: 'cancelled' },
          });
          await tx.seat.updateMany({
            where: { id: { in: previousReservations.map(r => r.seatId) } },
            data: { status: SeatStatus.AVAILABLE },
          });
        }

        // Create or update reservations for all requested seats
        const newReservations: SeatReservation[] = [];
        for (const seat of lockedSeats) {
          const existing = await tx.seatReservation.findFirst({
            where: {
              seatId: seat.id,
              registrationId,
              status: { in: ['reserved', 'confirmed'] },
            },
          });

          if (existing) {
            const updated = await tx.seatReservation.update({
              where: { id: existing.id },
              data: {
                reservedUntil,
                priceAtReservation: seat.currentPrice || seat.basePrice || 0,
                status: 'reserved',
              },
            });
            newReservations.push(updated);
          } else {
            const created = await tx.seatReservation.create({
              data: {
                seatId: seat.id,
                registrationId,
                reservedUntil,
                priceAtReservation: seat.currentPrice || seat.basePrice || 0,
                status: 'reserved',
              },
            });
            newReservations.push(created);
          }
        }

        // Update all seat statuses to RESERVED
        await tx.seat.updateMany({
          where: { id: { in: seatIds } },
          data: { status: SeatStatus.RESERVED },
        });

        return newReservations;
      }, {
        timeout: 10000,
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
      const reservations = await prisma.seatReservation.findMany({
        where: {
          registrationId,
          status: 'reserved',
        },
        include: { seat: true },
      });

      if (reservations.length === 0) {
        // Check if already confirmed
        const confirmed = await prisma.seatReservation.findFirst({
          where: { registrationId, status: 'confirmed' },
        });
        if (confirmed) {
          return [confirmed]; // Already confirmed
        }
        throw new NotFoundError('Seat reservation not found');
      }

      // Confirm all reservations atomically
      await prisma.$transaction([
        prisma.seatReservation.updateMany({
          where: {
            registrationId,
            status: 'reserved',
          },
          data: {
            status: 'confirmed',
            confirmedAt: new Date(),
            reservedUntil: null,
          },
        }),
        prisma.seat.updateMany({
          where: {
            id: { in: reservations.map(r => r.seatId) },
          },
          data: {
            status: SeatStatus.BOOKED,
          },
        }),
      ]);

      logger.info(`Confirmed ${reservations.length} seat reservation(s) for registration ${registrationId}`);
      return reservations;
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
      const reservations = await prisma.seatReservation.findMany({
        where: {
          registrationId,
          status: { in: ['reserved', 'confirmed'] },
        },
        include: { seat: true },
      });

      if (reservations.length === 0) {
        throw new NotFoundError('Seat reservation not found');
      }

      // Cancel all reservations and release seats atomically
      await prisma.$transaction([
        prisma.seatReservation.updateMany({
          where: {
            registrationId,
            status: { in: ['reserved', 'confirmed'] },
          },
          data: { status: 'cancelled' },
        }),
        prisma.seat.updateMany({
          where: {
            id: { in: reservations.map(r => r.seatId) },
          },
          data: { status: SeatStatus.AVAILABLE },
        }),
      ]);

      logger.info(`Cancelled ${reservations.length} seat reservation(s) for registration ${registrationId}`);
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
      const reservations = await prisma.seatReservation.findMany({
        where: {
          registrationId,
          status: { in: ['reserved', 'confirmed'] },
        },
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

      return reservations;
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

  // ==================== BEST AVAILABLE SEAT ALGORITHM ====================

  /**
   * Find the best available seats based on criteria
   */
  static async findBestAvailableSeats(
    eventId: string,
    criteria: BestSeatCriteria,
  ): Promise<{ seats: SeatScore[]; totalPrice: number }> {
    try {
      const seatMap = await prisma.seatMap.findUnique({
        where: { eventId },
        include: {
          event: {
            select: {
              startDate: true,
            },
          },
          seats: {
            where: {
              status: SeatStatus.AVAILABLE,
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
        throw new NotFoundError('Seat map not found');
      }

      // Filter out seats with active reservations
      let availableSeats = seatMap.seats.filter(s => s.reservations.length === 0);

      // Get inventory stats for dynamic pricing
      const totalSeats = await prisma.seat.count({
        where: { seatMapId: seatMap.id },
      });
      const soldSeats = await prisma.seat.count({
        where: {
          seatMapId: seatMap.id,
          status: { in: [SeatStatus.BOOKED, SeatStatus.RESERVED] },
        },
      });

      // Apply filters
      if (criteria.preferredSeatTypes && criteria.preferredSeatTypes.length > 0) {
        const preferred = availableSeats.filter(s =>
          criteria.preferredSeatTypes!.includes(s.seatType),
        );
        // Only filter if we have enough seats, otherwise include all
        if (preferred.length >= criteria.quantity) {
          availableSeats = preferred;
        }
      }

      if (criteria.preferredSections && criteria.preferredSections.length > 0) {
        const preferred = availableSeats.filter(s =>
          s.sectionId && criteria.preferredSections!.includes(s.sectionId),
        );
        if (preferred.length >= criteria.quantity) {
          availableSeats = preferred;
        }
      }

      // Calculate dynamic prices and scores for each seat
      const scoredSeats: SeatScore[] = [];

      for (const seat of availableSeats) {
        const context: SeatPricingContext = {
          eventId,
          seatId: seat.id,
          seatType: seat.seatType,
          sectionId: seat.sectionId || undefined,
          basePrice: Number(seat.basePrice || seat.currentPrice || 0),
          currentTime: new Date(),
          eventDate: seatMap.event.startDate,
          totalSeats,
          soldSeats,
        };

        const pricing = await DynamicPricingService.calculateSeatPrice(context);
        const dynamicPrice = pricing.finalPrice;

        // Apply price filters
        if (criteria.maxPrice !== undefined && dynamicPrice > criteria.maxPrice) {
          continue;
        }
        if (criteria.minPrice !== undefined && dynamicPrice < criteria.minPrice) {
          continue;
        }

        const { score, reasons } = this.calculateSeatScore(seat, criteria, dynamicPrice);

        scoredSeats.push({
          seat,
          score,
          reasons,
          dynamicPrice,
        });
      }

      // Sort by score (highest first)
      scoredSeats.sort((a, b) => b.score - a.score);

      // If keeping together, find adjacent seats
      let selectedSeats: SeatScore[];
      if (criteria.keepTogether && criteria.quantity > 1) {
        selectedSeats = this.findAdjacentSeats(scoredSeats, criteria.quantity);
      } else {
        selectedSeats = scoredSeats.slice(0, criteria.quantity);
      }

      const totalPrice = selectedSeats.reduce((sum, s) => sum + (s.dynamicPrice || 0), 0);

      return {
        seats: selectedSeats,
        totalPrice: Math.round(totalPrice * 100) / 100,
      };
    } catch (error) {
      logger.error('Error finding best available seats:', error);
      throw error;
    }
  }

  /**
   * Calculate score for a seat based on criteria
   */
  private static calculateSeatScore(
    seat: Seat,
    criteria: BestSeatCriteria,
    dynamicPrice: number,
  ): { score: number; reasons: string[] } {
    let score = 50; // Base score
    const reasons: string[] = [];

    // Seat type scoring
    const seatTypeScores: Record<string, number> = {
      'VIP': 30,
      'PREMIUM': 20,
      'STANDARD': 10,
      'ACCESSIBLE': 15,
      'COMPANION': 5,
    };
    const typeScore = seatTypeScores[seat.seatType] || 10;
    score += typeScore;
    reasons.push(`${seat.seatType} seat (+${typeScore})`);

    // Preferred seat type bonus
    if (criteria.preferredSeatTypes?.includes(seat.seatType)) {
      score += 20;
      reasons.push('Preferred seat type (+20)');
    }

    // Preferred section bonus
    if (seat.sectionId && criteria.preferredSections?.includes(seat.sectionId)) {
      score += 15;
      reasons.push('Preferred section (+15)');
    }

    // Position scoring (center is usually better)
    // Assumes x coordinate, with center around 50
    if (seat.x !== null && seat.x !== undefined) {
      const centerDistance = Math.abs(50 - (seat.x || 50));
      const positionScore = Math.max(0, 10 - centerDistance / 5);
      score += positionScore;
      if (positionScore > 5) {
        reasons.push(`Good center position (+${Math.round(positionScore)})`);
      }
    }

    // Row scoring (lower row numbers typically closer to stage)
    if (seat.rowLabel) {
      const rowNum = parseInt(seat.rowLabel.replace(/\D/g, ''), 10);
      if (!isNaN(rowNum) && rowNum <= 5) {
        score += 15 - rowNum * 2;
        reasons.push(`Front row bonus (+${15 - rowNum * 2})`);
      }
    }

    // Value scoring (if prioritizing value)
    if (criteria.prioritizeValue && dynamicPrice > 0) {
      const basePrice = Number(seat.basePrice) || dynamicPrice;
      const valueRatio = basePrice / dynamicPrice;
      if (valueRatio > 1) {
        // Price is below base - good value
        const valueScore = Math.min(20, (valueRatio - 1) * 50);
        score += valueScore;
        reasons.push(`Good value (+${Math.round(valueScore)})`);
      }
    }

    return { score: Math.round(score), reasons };
  }

  /**
   * Find adjacent seats (for groups)
   */
  private static findAdjacentSeats(
    scoredSeats: SeatScore[],
    quantity: number,
  ): SeatScore[] {
    if (scoredSeats.length < quantity) {
      return scoredSeats.slice(0, quantity);
    }

    // Group seats by section and row
    const byRowSection: Map<string, SeatScore[]> = new Map();
    for (const scoredSeat of scoredSeats) {
      const key = `${scoredSeat.seat.sectionId}-${scoredSeat.seat.rowLabel}`;
      if (!byRowSection.has(key)) {
        byRowSection.set(key, []);
      }
      byRowSection.get(key)!.push(scoredSeat);
    }

    // Find best consecutive group in each row
    let bestGroup: SeatScore[] = [];
    let bestGroupScore = -Infinity;

    for (const [_, rowSeats] of byRowSection) {
      if (rowSeats.length < quantity) continue;

      // Sort by seat label/position
      rowSeats.sort((a, b) => {
        const aNum = parseInt(a.seat.seatLabel?.replace(/\D/g, '') || '0', 10);
        const bNum = parseInt(b.seat.seatLabel?.replace(/\D/g, '') || '0', 10);
        return aNum - bNum;
      });

      // Find consecutive groups
      for (let i = 0; i <= rowSeats.length - quantity; i++) {
        const group = rowSeats.slice(i, i + quantity);

        // Check if consecutive (seat numbers should be sequential)
        let isConsecutive = true;
        for (let j = 1; j < group.length; j++) {
          const prevNum = parseInt(group[j - 1].seat.seatLabel?.replace(/\D/g, '') || '0', 10);
          const currNum = parseInt(group[j].seat.seatLabel?.replace(/\D/g, '') || '0', 10);
          if (currNum !== prevNum + 1) {
            isConsecutive = false;
            break;
          }
        }

        if (isConsecutive) {
          const groupScore = group.reduce((sum, s) => sum + s.score, 0) / group.length;
          if (groupScore > bestGroupScore) {
            bestGroupScore = groupScore;
            bestGroup = group;
          }
        }
      }
    }

    // If no consecutive group found, return top scored seats
    if (bestGroup.length === 0) {
      return scoredSeats.slice(0, quantity);
    }

    return bestGroup;
  }

  /**
   * Get seat recommendations with dynamic pricing
   */
  static async getSeatRecommendations(
    eventId: string,
    budget?: number,
    quantity: number = 1,
  ) {
    try {
      const seatMap = await prisma.seatMap.findUnique({
        where: { eventId },
        include: {
          event: {
            select: { startDate: true },
          },
          seats: {
            where: { status: SeatStatus.AVAILABLE },
          },
        },
      });

      if (!seatMap) {
        throw new NotFoundError('Seat map not found');
      }

      // Get inventory stats
      const totalSeats = await prisma.seat.count({
        where: { seatMapId: seatMap.id },
      });
      const soldSeats = await prisma.seat.count({
        where: {
          seatMapId: seatMap.id,
          status: { in: [SeatStatus.BOOKED, SeatStatus.RESERVED] },
        },
      });

      const recommendations = {
        bestValue: await this.findBestAvailableSeats(eventId, {
          quantity,
          prioritizeValue: true,
          maxPrice: budget,
          keepTogether: quantity > 1,
        }),
        premium: await this.findBestAvailableSeats(eventId, {
          quantity,
          preferredSeatTypes: [SeatType.VIP, SeatType.PREMIUM],
          keepTogether: quantity > 1,
        }),
        budget: budget ? await this.findBestAvailableSeats(eventId, {
          quantity,
          maxPrice: budget * 0.7, // 70% of budget for budget option
          keepTogether: quantity > 1,
        }) : null,
      };

      // Price stats
      const prices = await Promise.all(
        seatMap.seats.slice(0, 50).map(async (seat) => {
          const context: SeatPricingContext = {
            eventId,
            seatId: seat.id,
            seatType: seat.seatType,
            sectionId: seat.sectionId || undefined,
            basePrice: Number(seat.basePrice || 0),
            currentTime: new Date(),
            eventDate: seatMap.event.startDate,
            totalSeats,
            soldSeats,
          };
          const pricing = await DynamicPricingService.calculateSeatPrice(context);
          return pricing.finalPrice;
        }),
      );

      const priceStats = {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      };

      return {
        recommendations,
        priceStats,
        availability: {
          total: totalSeats,
          available: seatMap.seats.length,
          soldPercentage: Math.round((soldSeats / totalSeats) * 100),
        },
      };
    } catch (error) {
      logger.error('Error getting seat recommendations:', error);
      throw error;
    }
  }
}
