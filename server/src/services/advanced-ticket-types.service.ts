import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { Prisma } from '@prisma/client';

export class AdvancedTicketTypesService {
  /**
   * Create an advanced ticket type
   * Mirrors test expectations and validates organizer/event ownership
   */
  static async createTicketType(
    organizerId: string,
    data: {
      eventId: string;
      name: string;
      basePrice: number;
      maxPerOrder?: number;
      rules?: Prisma.JsonValue;
    },
  ) {
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

    const ticket = await prisma.ticketPackage.create({
      data: {
        organizerId,
        eventId: data.eventId,
        name: data.name,
        price: data.basePrice,
        // For now we map maxPerOrder into the existing quantity fields:
        // maxQuantity determines the per-order upper bound; minQuantity stays undefined here.
        maxQuantity: data.maxPerOrder,
        type: 'group',
        // Advanced rules can later be materialized into DynamicPricingRule;
        // we keep them at service level for now.
      },
    });

    return ticket;
  }

  /**
   * Create ticket package (group, bundle, or donation)
   */
  static async createTicketPackage(organizerId: string, data: {
    eventId: string;
    name: string;
    description?: string;
    type: 'group' | 'bundle' | 'donation';
    price?: number;
    minQuantity?: number;
    maxQuantity?: number;
    bundleItems?: Prisma.JsonValue[];
    isDonation?: boolean;
    minDonation?: number;
    maxDonation?: number;
    suggestedAmounts?: number[];
    hasReservedSeating?: boolean;
    seatingChart?: Prisma.JsonValue;
    availableFrom?: Date;
    availableUntil?: Date;
    quantity?: number;
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

      // Validate donation settings
      if (data.type === 'donation') {
        if (!data.isDonation) {
          throw new ValidationError('Donation type must have isDonation set to true');
        }
        if (data.minDonation && data.maxDonation && data.minDonation > data.maxDonation) {
          throw new ValidationError('Min donation must be less than max donation');
        }
      }

      // Validate bundle settings
      if (data.type === 'bundle' && (!data.bundleItems || data.bundleItems.length === 0)) {
        throw new ValidationError('Bundle type must have bundle items');
      }

      // Validate group settings
      if (data.type === 'group') {
        if (!data.minQuantity || !data.maxQuantity) {
          throw new ValidationError('Group type must have min and max quantity');
        }
        if (data.minQuantity > data.maxQuantity) {
          throw new ValidationError('Min quantity must be less than max quantity');
        }
      }

      const package_ = await prisma.ticketPackage.create({
        data: {
          organizerId,
          eventId: data.eventId,
          name: data.name,
          description: data.description,
          type: data.type,
          price: data.price,
          minQuantity: data.minQuantity,
          maxQuantity: data.maxQuantity,
          bundleItems: data.bundleItems,
          isDonation: data.isDonation || false,
          minDonation: data.minDonation,
          maxDonation: data.maxDonation,
          suggestedAmounts: data.suggestedAmounts,
          hasReservedSeating: data.hasReservedSeating || false,
          seatingChart: data.seatingChart,
          availableFrom: data.availableFrom,
          availableUntil: data.availableUntil,
          quantity: data.quantity,
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

      return package_;
    } catch (error) {
      logger.error('Error creating ticket package:', error);
      throw error;
    }
  }

  /**
   * Get ticket packages for event
   */
  static async getEventTicketPackages(organizerId: string, eventId: string, filters?: {
    type?: string;
    isActive?: boolean;
  }) {
    try {
      // Verify event belongs to organizer
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          organizerId,
          deletedAt: null,
        },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      const where: Prisma.TicketPackageWhereInput = {
        eventId,
        organizerId,
        ...(filters?.type && { type: filters.type as 'group' | 'bundle' | 'donation' }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      };

      const packages = await prisma.ticketPackage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return packages;
    } catch (error) {
      logger.error('Error getting ticket packages:', error);
      throw error;
    }
  }

  /**
   * Update ticket package
   */
  static async updateTicketPackage(packageId: string, organizerId: string, data: {
    name?: string;
    description?: string;
    price?: number;
    minQuantity?: number;
    maxQuantity?: number;
    bundleItems?: Prisma.JsonValue[];
    minDonation?: number;
    maxDonation?: number;
    suggestedAmounts?: number[];
    hasReservedSeating?: boolean;
    seatingChart?: Prisma.JsonValue;
    availableFrom?: Date;
    availableUntil?: Date;
    quantity?: number;
    isActive?: boolean;
  }) {
    try {
      const package_ = await prisma.ticketPackage.findFirst({
        where: {
          id: packageId,
          organizerId,
        },
      });

      if (!package_) {
        throw new NotFoundError('Ticket package not found');
      }

      const updated = await prisma.ticketPackage.update({
        where: { id: packageId },
        data,
      });

      return updated;
    } catch (error) {
      logger.error('Error updating ticket package:', error);
      throw error;
    }
  }

  /**
   * Get reserved seating configuration
   */
  static async getReservedSeating(eventId: string, organizerId: string) {
    try {
      const packages = await prisma.ticketPackage.findMany({
        where: {
          eventId,
          organizerId,
          hasReservedSeating: true,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          seatingChart: true,
          soldQuantity: true,
          quantity: true,
        },
      });

      return packages;
    } catch (error) {
      logger.error('Error getting reserved seating:', error);
      throw error;
    }
  }

  /**
   * Update reserved seating (mark seats as sold)
   */
  static async updateReservedSeating(packageId: string, organizerId: string, seats: string[]) {
    try {
      const package_ = await prisma.ticketPackage.findFirst({
        where: {
          id: packageId,
          organizerId,
          hasReservedSeating: true,
        },
      });

      if (!package_) {
        throw new NotFoundError('Ticket package with reserved seating not found');
      }

      const seatingChart = package_.seatingChart as Record<string, unknown> | null;
      if (!seatingChart) {
        throw new ValidationError('No seating chart configured');
      }

      // Update seating chart to mark seats as sold
      // This is a simplified version - in production, you'd want more sophisticated seat management
      const soldSeats = (seatingChart.soldSeats as string[]) || [];
      const updatedChart = {
        ...seatingChart,
        soldSeats: [...soldSeats, ...seats],
      };

      await prisma.ticketPackage.update({
        where: { id: packageId },
        data: {
          seatingChart: updatedChart,
          soldQuantity: {
            increment: seats.length,
          },
        },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error updating reserved seating:', error);
      throw error;
    }
  }

  /**
   * Delete ticket package
   */
  static async deleteTicketPackage(packageId: string, organizerId: string) {
    try {
      const package_ = await prisma.ticketPackage.findFirst({
        where: {
          id: packageId,
          organizerId,
        },
      });

      if (!package_) {
        throw new NotFoundError('Ticket package not found');
      }

      await prisma.ticketPackage.delete({
        where: { id: packageId },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error deleting ticket package:', error);
      throw error;
    }
  }
}
