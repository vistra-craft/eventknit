import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { Decimal } from '@prisma/client/runtime/library';

export class TicketResaleService {
  /**
   * List a ticket for resale
   */
  static async listTicketForResale(
    userId: string,
    registrationId: string,
    resalePrice: number,
    expiresAt?: Date,
  ) {
    try {
      // Verify registration belongs to user
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
              currency: true,
              ticketTypes: true, // Include ticket types to check for name-locked
            },
          },
        },
      });

      if (!registration) {
        throw new NotFoundError('Registration not found');
      }

      if (registration.attendeeId !== userId) {
        throw new ValidationError('You can only resell your own tickets');
      }

      // Check if ticket is name-locked
      if (registration.ticketType && registration.event.ticketTypes) {
        const ticketTypes = registration.event.ticketTypes as Array<{
          name: string;
          nameLocked?: boolean;
        }>;
        const ticketType = ticketTypes.find(tt => tt.name === registration.ticketType);
        if (ticketType?.nameLocked) {
          throw new ValidationError('This ticket is name-locked and cannot be resold. The ticket is tied to the original purchaser\'s identity.');
        }
      }

      // Check if already listed
      const existingResale = await prisma.ticketResale.findUnique({
        where: { registrationId },
      });

      if (existingResale && existingResale.status === 'LISTED') {
        throw new ValidationError('Ticket is already listed for resale');
      }

      // Calculate platform fee (e.g., 10% of resale price)
      const platformFeePercentage = 0.1;
      const platformFee = new Decimal(resalePrice * platformFeePercentage);
      const sellerPayout = new Decimal(resalePrice - Number(platformFee));

      // Set expiration if not provided (default: 7 days before event)
      let expirationDate = expiresAt;
      if (!expirationDate && registration.event.startDate) {
        const eventDate = new Date(registration.event.startDate);
        expirationDate = new Date(eventDate);
        expirationDate.setDate(expirationDate.getDate() - 7);
      }

      const resale = await prisma.ticketResale.create({
        data: {
          registrationId,
          sellerId: userId,
          originalPrice: registration.totalAmount || new Decimal(0),
          resalePrice: new Decimal(resalePrice),
          currency: registration.event.currency || 'NGN',
          platformFee,
          sellerPayout,
          expiresAt: expirationDate,
          status: 'LISTED',
        },
        include: {
          registration: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  startDate: true,
                  endDate: true,
                },
              },
            },
          },
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      logger.info(`Ticket listed for resale: ${resale.id}`);
      return resale;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error listing ticket for resale:', error);
      throw new ValidationError(`Failed to list ticket: ${error.message}`);
    }
  }

  /**
   * Get all listed tickets (marketplace)
   */
  static async getMarketplaceTickets(filters?: {
    eventId?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {
        status: 'LISTED',
        expiresAt: {
          gt: new Date(),
        },
      };

      if (filters?.eventId) {
        where.registration = { eventId: filters.eventId };
      }

      if (filters?.minPrice || filters?.maxPrice) {
        where.resalePrice = {};
        if (filters.minPrice) {
          where.resalePrice.gte = new Decimal(filters.minPrice);
        }
        if (filters.maxPrice) {
          where.resalePrice.lte = new Decimal(filters.maxPrice);
        }
      }

      const [tickets, total] = await Promise.all([
        prisma.ticketResale.findMany({
          where,
          include: {
            registration: {
              include: {
                event: {
                  select: {
                    id: true,
                    title: true,
                    startDate: true,
                    endDate: true,
                    location: true,
                    category: true,
                    image: true,
                  },
                },
              },
            },
            seller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { listedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.ticketResale.count({ where }),
      ]);

      return {
        tickets,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Error fetching marketplace tickets:', error);
      throw new ValidationError(`Failed to fetch tickets: ${error.message}`);
    }
  }

  /**
   * Get user's resale listings
   */
  static async getUserResales(userId: string, status?: string) {
    try {
      const where: any = { sellerId: userId };
      if (status) {
        where.status = status;
      }

      const resales = await prisma.ticketResale.findMany({
        where,
        include: {
          registration: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  startDate: true,
                  endDate: true,
                },
              },
            },
          },
          buyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { listedAt: 'desc' },
      });

      return resales;
    } catch (error: any) {
      logger.error('Error fetching user resales:', error);
      throw new ValidationError(`Failed to fetch resales: ${error.message}`);
    }
  }

  /**
   * Purchase a resale ticket
   */
  static async purchaseResaleTicket(userId: string, resaleId: string) {
    try {
      const resale = await prisma.ticketResale.findUnique({
        where: { id: resaleId },
        include: {
          registration: {
            include: { event: true },
          },
        },
      });

      if (!resale) {
        throw new NotFoundError('Resale listing not found');
      }

      if (resale.status !== 'LISTED') {
        throw new ValidationError('Ticket is no longer available');
      }

      if (resale.sellerId === userId) {
        throw new ValidationError('You cannot purchase your own ticket');
      }

      if (resale.expiresAt && resale.expiresAt < new Date()) {
        throw new ValidationError('This listing has expired');
      }

      // Update registration to new owner
      await prisma.$transaction(async (tx) => {
        // Update registration
        await tx.eventRegistration.update({
          where: { id: resale.registrationId },
          data: {
            attendeeId: userId,
            updatedAt: new Date(),
          },
        });

        // Update resale status
        await tx.ticketResale.update({
          where: { id: resaleId },
          data: {
            status: 'SOLD',
            buyerId: userId,
            soldAt: new Date(),
          },
        });

        // Create payment transaction (if needed)
        // This would integrate with your payment system
      });

      logger.info(`Ticket resale purchased: ${resaleId} by user ${userId}`);
      return { success: true, message: 'Ticket purchased successfully' };
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error purchasing resale ticket:', error);
      throw new ValidationError(`Failed to purchase ticket: ${error.message}`);
    }
  }

  /**
   * Cancel a resale listing
   */
  static async cancelResale(userId: string, resaleId: string) {
    try {
      const resale = await prisma.ticketResale.findUnique({
        where: { id: resaleId },
      });

      if (!resale) {
        throw new NotFoundError('Resale listing not found');
      }

      if (resale.sellerId !== userId) {
        throw new ValidationError('You can only cancel your own listings');
      }

      if (resale.status !== 'LISTED') {
        throw new ValidationError('Only active listings can be cancelled');
      }

      await prisma.ticketResale.update({
        where: { id: resaleId },
        data: {
          status: 'CANCELLED',
        },
      });

      logger.info(`Resale cancelled: ${resaleId}`);
      return { success: true };
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error cancelling resale:', error);
      throw new ValidationError(`Failed to cancel resale: ${error.message}`);
    }
  }
}
