import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { SeatType, SeatStatus, Prisma } from '@prisma/client';

export interface SeatPricingContext {
  eventId: string;
  seatId: string;
  seatType: SeatType;
  sectionId?: string;
  basePrice: number;
  currentTime: Date;
  eventDate: Date;
  totalSeats: number;
  soldSeats: number;
}

export interface CalculatedSeatPrice {
  basePrice: number;
  finalPrice: number;
  adjustments: Array<{
    ruleName: string;
    type: string;
    amount: number;
  }>;
  surgeMultiplier?: number;
}

export class DynamicPricingService {
  /**
   * Lightweight rule creator used by tests
   */
  static async createRule(
    organizerId: string,
    data: {
      eventId: string;
      name: string;
      type?: string;
      metric: string;
      threshold: number;
      priceChangeType: 'PERCENTAGE' | 'FIXED_AMOUNT';
      priceChangeValue: number;
    },
  ) {
    const event = await prisma.event.findFirst({
      where: { id: data.eventId, organizerId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const rule = await prisma.dynamicPricingRule.create({
      data: {
        organizerId,
        eventId: data.eventId,
        name: data.name,
        type: data.type || 'THRESHOLD',
        demandThreshold: data.threshold,
        discountType: data.priceChangeType,
        discountValue: data.priceChangeValue,
      },
    });

    return rule;
  }

  /**
   * Create dynamic pricing rule
   */
  static async createPricingRule(organizerId: string, data: {
    eventId: string;
    name: string;
    type: 'time_based' | 'demand_based' | 'group_discount' | 'loyalty';
    startDate?: Date;
    endDate?: Date;
    demandThreshold?: number;
    priceMultiplier?: number;
    minGroupSize?: number;
    discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue?: number;
    loyaltyTierId?: string;
    loyaltyDiscount?: number;
    applicableTicketTypes?: string[];
    priority?: number;
  }) {
    try {
      // Verify event belongs to organizer
      const event = await prisma.event.findFirst({
        where: {
          id: data.eventId,
          organizerId,
          deletedAt: null,
        },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      // Validate rule type specific fields
      if (data.type === 'time_based' && (!data.startDate || !data.endDate)) {
        throw new ValidationError('Time-based pricing requires start and end dates');
      }

      if (data.type === 'demand_based' && (!data.demandThreshold || !data.priceMultiplier)) {
        throw new ValidationError('Demand-based pricing requires threshold and multiplier');
      }

      if (data.type === 'group_discount' && (!data.minGroupSize || !data.discountValue)) {
        throw new ValidationError('Group discount requires min group size and discount value');
      }

      if (data.type === 'loyalty' && !data.loyaltyDiscount) {
        throw new ValidationError('Loyalty pricing requires loyalty discount');
      }

      const rule = await prisma.dynamicPricingRule.create({
        data: {
          organizerId,
          eventId: data.eventId,
          name: data.name,
          type: data.type,
          startDate: data.startDate,
          endDate: data.endDate,
          demandThreshold: data.demandThreshold,
          priceMultiplier: data.priceMultiplier,
          minGroupSize: data.minGroupSize,
          discountType: data.discountType,
          discountValue: data.discountValue,
          loyaltyTierId: data.loyaltyTierId,
          loyaltyDiscount: data.loyaltyDiscount,
          applicableTicketTypes: data.applicableTicketTypes || [],
          priority: data.priority || 0,
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      return rule;
    } catch (error) {
      logger.error('Error creating pricing rule:', error);
      throw error;
    }
  }

  /**
   * Get pricing rules for event
   */
  static async getEventPricingRules(organizerId: string, eventId: string, filters?: {
    type?: string;
    isActive?: boolean;
  }) {
    try {
      const where: Prisma.DynamicPricingRuleWhereInput = {
        eventId,
        organizerId,
        ...(filters?.type && { type: filters.type as 'time_based' | 'demand_based' | 'group_discount' | 'loyalty' }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      };

      const rules = await prisma.dynamicPricingRule.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      return rules;
    } catch (error) {
      logger.error('Error getting pricing rules:', error);
      throw error;
    }
  }

  /**
   * Calculate dynamic price for ticket
   */
  static async calculateDynamicPrice(
    eventId: string,
    ticketType: string,
    quantity: number,
    userId?: string,
  ): Promise<{ originalPrice: number; finalPrice: number; discount?: number; appliedRules: string[] }> {
    try {
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          deletedAt: null,
        },
        select: {
          ticketTypes: true,
        },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      // Get base price from ticket types
      const ticketTypes = event.ticketTypes as Record<string, unknown>[];
      const ticket = ticketTypes?.find((t) => (t as Record<string, unknown>).name === ticketType);
      if (!ticket) {
        throw new NotFoundError('Ticket type not found');
      }

      const originalPrice = Number((ticket as Record<string, unknown>).price);
      let finalPrice = originalPrice;
      const appliedRules: string[] = [];

      // Get active pricing rules
      const rules = await prisma.dynamicPricingRule.findMany({
        where: {
          eventId,
          isActive: true,
          OR: [
            { applicableTicketTypes: { isEmpty: true } },
            { applicableTicketTypes: { has: ticketType } },
          ],
        },
        orderBy: { priority: 'desc' },
      });

      // Apply time-based pricing
      const now = new Date();
      const timeBasedRules = rules.filter(r => r.type === 'time_based' && r.startDate && r.endDate);
      for (const rule of timeBasedRules) {
        if (rule.startDate && rule.endDate && now >= rule.startDate && now <= rule.endDate) {
          if (rule.discountType === 'PERCENTAGE' && rule.discountValue) {
            const discount = (originalPrice * Number(rule.discountValue)) / 100;
            finalPrice = originalPrice - discount;
            appliedRules.push(rule.name);
          } else if (rule.discountType === 'FIXED_AMOUNT' && rule.discountValue) {
            finalPrice = originalPrice - Number(rule.discountValue);
            appliedRules.push(rule.name);
          }
          break; // Apply first matching rule
        }
      }

      // Apply demand-based pricing
      const registrations = await prisma.eventRegistration.count({
        where: {
          eventId,
          status: 'CONFIRMED',
        },
      });

      const event_ = await prisma.event.findFirst({
        where: { id: eventId },
        select: { capacity: true },
      });

      if (event_?.capacity) {
        const soldPercentage = (registrations / event_.capacity) * 100;
        const demandRules = rules.filter(r => r.type === 'demand_based' && r.demandThreshold);
        for (const rule of demandRules) {
          if (rule.demandThreshold && soldPercentage >= rule.demandThreshold) {
            if (rule.priceMultiplier) {
              finalPrice = originalPrice * Number(rule.priceMultiplier);
              appliedRules.push(rule.name);
              break;
            }
          }
        }
      }

      // Apply group discount
      if (quantity > 1) {
        const groupRules = rules.filter(r => r.type === 'group_discount' && r.minGroupSize);
        for (const rule of groupRules) {
          if (rule.minGroupSize && quantity >= rule.minGroupSize) {
            if (rule.discountType === 'PERCENTAGE' && rule.discountValue) {
              const discount = (originalPrice * Number(rule.discountValue)) / 100;
              finalPrice = originalPrice - discount;
              appliedRules.push(rule.name);
            } else if (rule.discountType === 'FIXED_AMOUNT' && rule.discountValue) {
              finalPrice = originalPrice - Number(rule.discountValue);
              appliedRules.push(rule.name);
            }
            break;
          }
        }
      }

      // Apply loyalty discount (if user provided)
      if (userId) {
        // Check user's loyalty tier (placeholder - implement based on your loyalty system)
        const loyaltyRules = rules.filter(r => r.type === 'loyalty');
        for (const rule of loyaltyRules) {
          if (rule.loyaltyDiscount) {
            const discount = (originalPrice * Number(rule.loyaltyDiscount)) / 100;
            finalPrice = originalPrice - discount;
            appliedRules.push(rule.name);
            break;
          }
        }
      }

      const discount = originalPrice - finalPrice;

      return {
        originalPrice,
        finalPrice: Math.max(0, finalPrice), // Ensure price doesn't go negative
        discount: discount > 0 ? discount : undefined,
        appliedRules,
      };
    } catch (error) {
      logger.error('Error calculating dynamic price:', error);
      throw error;
    }
  }

  /**
   * Update pricing rule
   */
  static async updatePricingRule(ruleId: string, organizerId: string, data: {
    name?: string;
    startDate?: Date;
    endDate?: Date;
    demandThreshold?: number;
    priceMultiplier?: number;
    minGroupSize?: number;
    discountType?: string;
    discountValue?: number;
    loyaltyDiscount?: number;
    applicableTicketTypes?: string[];
    priority?: number;
    isActive?: boolean;
  }) {
    try {
      const rule = await prisma.dynamicPricingRule.findFirst({
        where: {
          id: ruleId,
          organizerId,
        },
      });

      if (!rule) {
        throw new NotFoundError('Pricing rule not found');
      }

      const updated = await prisma.dynamicPricingRule.update({
        where: { id: ruleId },
        data,
      });

      return updated;
    } catch (error) {
      logger.error('Error updating pricing rule:', error);
      throw error;
    }
  }

  /**
   * Delete pricing rule
   */
  static async deletePricingRule(ruleId: string, organizerId: string) {
    try {
      const rule = await prisma.dynamicPricingRule.findFirst({
        where: {
          id: ruleId,
          organizerId,
        },
      });

      if (!rule) {
        throw new NotFoundError('Pricing rule not found');
      }

      await prisma.dynamicPricingRule.delete({
        where: { id: ruleId },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error deleting pricing rule:', error);
      throw error;
    }
  }

  // ==================== SEAT-BASED DYNAMIC PRICING ====================

  /**
   * Calculate dynamic price for a specific seat
   */
  static async calculateSeatPrice(context: SeatPricingContext): Promise<CalculatedSeatPrice> {
    try {
      let currentPrice = context.basePrice;
      const adjustments: CalculatedSeatPrice['adjustments'] = [];

      // Get active pricing rules for event
      const rules = await prisma.dynamicPricingRule.findMany({
        where: {
          eventId: context.eventId,
          isActive: true,
        },
        orderBy: { priority: 'desc' },
      });

      const now = context.currentTime;
      const msPerDay = 24 * 60 * 60 * 1000;
      const daysUntilEvent = Math.floor((context.eventDate.getTime() - now.getTime()) / msPerDay);
      const soldPercentage = context.totalSeats > 0
        ? (context.soldSeats / context.totalSeats) * 100
        : 0;

      // Apply seat type premium
      const seatTypePremiums: Record<string, number> = {
        'VIP': 1.5,
        'PREMIUM': 1.25,
        'ACCESSIBLE': 1.0,
        'COMPANION': 1.0,
        'STANDARD': 1.0,
      };
      const seatMultiplier = seatTypePremiums[context.seatType] || 1.0;
      if (seatMultiplier !== 1.0) {
        const premiumAmount = currentPrice * (seatMultiplier - 1);
        currentPrice = currentPrice * seatMultiplier;
        adjustments.push({
          ruleName: `${context.seatType} Seat Premium`,
          type: 'TIER',
          amount: premiumAmount,
        });
      }

      // Apply time-based pricing rules
      for (const rule of rules.filter(r => r.type === 'time_based')) {
        if (rule.startDate && rule.endDate && now >= rule.startDate && now <= rule.endDate) {
          if (rule.discountType === 'PERCENTAGE' && rule.discountValue) {
            const discount = currentPrice * (Number(rule.discountValue) / 100);
            currentPrice = currentPrice - discount;
            adjustments.push({
              ruleName: rule.name,
              type: 'TIME',
              amount: -discount,
            });
          }
          break;
        }
      }

      // Apply early bird discount (30+ days out)
      if (daysUntilEvent >= 30 && !adjustments.some(a => a.type === 'TIME')) {
        const earlyBirdDiscount = currentPrice * 0.15;
        currentPrice = currentPrice - earlyBirdDiscount;
        adjustments.push({
          ruleName: 'Early Bird Discount',
          type: 'TIME',
          amount: -earlyBirdDiscount,
        });
      }

      // Apply demand-based surge pricing
      let surgeMultiplier: number | undefined;
      for (const rule of rules.filter(r => r.type === 'demand_based')) {
        if (rule.demandThreshold && soldPercentage >= rule.demandThreshold && rule.priceMultiplier) {
          const multiplier = Number(rule.priceMultiplier);
          const surgeAmount = currentPrice * (multiplier - 1);
          currentPrice = currentPrice * multiplier;
          surgeMultiplier = multiplier;
          adjustments.push({
            ruleName: rule.name,
            type: 'DEMAND',
            amount: surgeAmount,
          });
          break;
        }
      }

      // Default surge pricing if no rules matched but demand is high
      if (!surgeMultiplier && soldPercentage >= 80) {
        const defaultSurge = 1 + ((soldPercentage - 80) / 100); // Up to 1.2x at 100%
        if (defaultSurge > 1) {
          const surgeAmount = currentPrice * (defaultSurge - 1);
          currentPrice = currentPrice * defaultSurge;
          surgeMultiplier = defaultSurge;
          adjustments.push({
            ruleName: 'High Demand Premium',
            type: 'DEMAND',
            amount: surgeAmount,
          });
        }
      }

      return {
        basePrice: context.basePrice,
        finalPrice: Math.max(0, Math.round(currentPrice * 100) / 100),
        adjustments,
        surgeMultiplier,
      };
    } catch (error) {
      logger.error('Error calculating seat price:', error);
      return {
        basePrice: context.basePrice,
        finalPrice: context.basePrice,
        adjustments: [],
      };
    }
  }

  /**
   * Update all seat prices for an event based on current demand
   */
  static async updateEventSeatPrices(eventId: string): Promise<{ updated: number }> {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          seatMap: {
            include: {
              seats: {
                where: { status: SeatStatus.AVAILABLE },
              },
            },
          },
        },
      });

      if (!event || !event.seatMap) {
        return { updated: 0 };
      }

      const totalSeats = await prisma.seat.count({
        where: { seatMapId: event.seatMap.id },
      });

      const soldSeats = await prisma.seat.count({
        where: {
          seatMapId: event.seatMap.id,
          status: { in: [SeatStatus.BOOKED, SeatStatus.RESERVED] },
        },
      });

      let updated = 0;

      for (const seat of event.seatMap.seats) {
        const context: SeatPricingContext = {
          eventId,
          seatId: seat.id,
          seatType: seat.seatType,
          sectionId: seat.sectionId || undefined,
          basePrice: Number(seat.basePrice || 0),
          currentTime: new Date(),
          eventDate: event.startDate,
          totalSeats,
          soldSeats,
        };

        const calculated = await this.calculateSeatPrice(context);

        if (calculated.finalPrice !== Number(seat.currentPrice)) {
          await prisma.seat.update({
            where: { id: seat.id },
            data: { currentPrice: calculated.finalPrice },
          });
          updated++;
        }
      }

      logger.info(`Updated ${updated} seat prices for event ${eventId}`);
      return { updated };
    } catch (error) {
      logger.error('Error updating event seat prices:', error);
      throw error;
    }
  }

  /**
   * Get seat pricing analytics for event
   */
  static async getSeatPricingAnalytics(eventId: string, organizerId: string) {
    try {
      const event = await prisma.event.findFirst({
        where: { id: eventId, organizerId, deletedAt: null },
        include: {
          seatMap: {
            include: {
              seats: true,
            },
          },
        },
      });

      if (!event || !event.seatMap) {
        throw new NotFoundError('Event or seat map not found');
      }

      const seats = event.seatMap.seats;
      const availableSeats = seats.filter(s => s.status === SeatStatus.AVAILABLE);
      const soldSeats = seats.filter(s => s.status === SeatStatus.BOOKED);
      const reservedSeats = seats.filter(s => s.status === SeatStatus.RESERVED);

      // Revenue calculations
      const potentialRevenue = availableSeats.reduce(
        (sum, s) => sum + Number(s.currentPrice || s.basePrice || 0),
        0,
      );
      const basePotentialRevenue = availableSeats.reduce(
        (sum, s) => sum + Number(s.basePrice || 0),
        0,
      );
      const actualRevenue = soldSeats.reduce(
        (sum, s) => sum + Number(s.currentPrice || s.basePrice || 0),
        0,
      );

      // Price by seat type
      const bySeatType: Record<string, Record<string, unknown>> = {};
      for (const seat of seats) {
        if (!bySeatType[seat.seatType]) {
          bySeatType[seat.seatType] = {
            total: 0,
            available: 0,
            sold: 0,
            avgBasePrice: 0,
            avgCurrentPrice: 0,
            totalBasePrice: 0,
            totalCurrentPrice: 0,
          };
        }
        const stats = bySeatType[seat.seatType] as Record<string, number>;
        stats.total = (stats.total as number) + 1;
        stats.totalBasePrice = (stats.totalBasePrice as number) + Number(seat.basePrice || 0);
        stats.totalCurrentPrice = (stats.totalCurrentPrice as number) + Number(seat.currentPrice || seat.basePrice || 0);
        if (seat.status === SeatStatus.AVAILABLE) stats.available = (stats.available as number) + 1;
        if (seat.status === SeatStatus.BOOKED) stats.sold = (stats.sold as number) + 1;
      }

      for (const type in bySeatType) {
        const stats = bySeatType[type] as Record<string, number>;
        const total = stats.total as number;
        const totalBasePrice = stats.totalBasePrice as number;
        const totalCurrentPrice = stats.totalCurrentPrice as number;
        const avgBasePrice = total > 0 ? Math.round(totalBasePrice / total) : 0;
        const avgCurrentPrice = total > 0 ? Math.round(totalCurrentPrice / total) : 0;
        stats.avgBasePrice = avgBasePrice;
        stats.avgCurrentPrice = avgCurrentPrice;
        stats.priceUplift = avgBasePrice > 0
          ? Math.round(((avgCurrentPrice - avgBasePrice) / avgBasePrice) * 10000) / 100
          : 0;
      }

      return {
        summary: {
          totalSeats: seats.length,
          availableSeats: availableSeats.length,
          soldSeats: soldSeats.length,
          reservedSeats: reservedSeats.length,
          soldPercentage: Math.round((soldSeats.length / seats.length) * 10000) / 100,
        },
        revenue: {
          actual: actualRevenue,
          potentialAtCurrentPrices: potentialRevenue,
          potentialAtBasePrices: basePotentialRevenue,
          dynamicPricingUplift: potentialRevenue - basePotentialRevenue,
          upliftPercentage: basePotentialRevenue > 0
            ? Math.round(((potentialRevenue - basePotentialRevenue) / basePotentialRevenue) * 10000) / 100
            : 0,
        },
        bySeatType,
      };
    } catch (error) {
      logger.error('Error getting seat pricing analytics:', error);
      throw error;
    }
  }
}
