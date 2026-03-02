import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { Decimal } from '@prisma/client/runtime/library';
import { RegistrationStatus } from '@prisma/client';
import { TicketService } from './ticket.service.js';
import { emailService } from './email.service.js';
import { getPaymentGatewayManager } from './payment-gateway-manager.js';
import { SeatTransferHelperService } from './seat-transfer-helper.service.js';
import crypto from 'crypto';

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
              allowResale: true,
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

      // Check if event allows resale
      if (registration.event.allowResale === false) {
        throw new ValidationError('Resale is disabled for this event');
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
    } catch (error: unknown) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error listing ticket for resale:', error);
      throw new ValidationError(`Failed to list ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

      const where: {
        status: string;
        expiresAt: { gt: Date };
        registration?: { eventId: string };
        resalePrice?: { gte?: number; lte?: number };
        category?: string;
      } = {
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
    } catch (error: unknown) {
      logger.error('Error fetching marketplace tickets:', error);
      throw new ValidationError(`Failed to fetch tickets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's resale listings
   */
  static async getUserResales(userId: string, status?: string) {
    try {
      const where: { sellerId: string; status?: string } = { sellerId: userId };
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
    } catch (error: unknown) {
      logger.error('Error fetching user resales:', error);
      throw new ValidationError(`Failed to fetch resales: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize payment for a resale ticket purchase
   */
  static async initializeResalePayment(userId: string, resaleId: string, email: string) {
    try {
      const resale = await prisma.ticketResale.findUnique({
        where: { id: resaleId },
        include: {
          registration: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  startDate: true,
                  currency: true,
                },
              },
            },
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

      // Reserve the listing to prevent double-purchase
      const reference = `RESALE-${resaleId}-${Date.now()}`;

      await prisma.ticketResale.update({
        where: { id: resaleId },
        data: {
          status: 'RESERVED',
          reservedAt: new Date(),
          paymentReference: reference,
          paymentStatus: 'PENDING',
        },
      });

      // Initialize payment via gateway
      const gateway = getPaymentGatewayManager().getDefaultGateway();
      const paymentResult = await gateway.initializePayment({
        amount: Number(resale.resalePrice),
        currency: resale.currency,
        email,
        reference,
        metadata: {
          type: 'resale',
          resaleId,
          eventId: resale.registration.event.id,
          eventTitle: resale.registration.event.title,
        },
      });

      if (!paymentResult.success) {
        // Revert reservation
        await prisma.ticketResale.update({
          where: { id: resaleId },
          data: {
            status: 'LISTED',
            reservedAt: null,
            paymentReference: null,
            paymentStatus: null,
          },
        });
        throw new ValidationError('Failed to initialize payment');
      }

      logger.info(`Resale payment initialized: ${reference} for resale ${resaleId}`);
      return {
        authorizationUrl: paymentResult.authorizationUrl,
        accessCode: paymentResult.accessCode,
        reference: paymentResult.reference,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error initializing resale payment:', error);
      throw new ValidationError(`Failed to initialize payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify payment and complete resale purchase
   */
  static async verifyResalePayment(reference: string, userId: string) {
    try {
      const resale = await prisma.ticketResale.findFirst({
        where: { paymentReference: reference },
        include: {
          registration: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  startDate: true,
                  venue: true,
                  location: true,
                },
              },
              ticketLineItems: true,
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

      if (!resale) {
        throw new NotFoundError('Resale not found for this payment reference');
      }

      if (resale.status !== 'RESERVED') {
        throw new ValidationError(`Cannot verify payment: listing status is ${resale.status}`);
      }

      // Verify payment with gateway
      const gateway = getPaymentGatewayManager().getDefaultGateway();
      const verification = await gateway.verifyPayment({ reference });

      if (!verification.success || verification.status !== 'success') {
        // Payment failed — revert to LISTED
        await prisma.ticketResale.update({
          where: { id: resale.id },
          data: {
            status: 'LISTED',
            reservedAt: null,
            paymentReference: null,
            paymentStatus: 'FAILED',
          },
        });
        throw new ValidationError('Payment verification failed. The listing has been made available again.');
      }

      // Payment succeeded — transfer ownership in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const oldRegistration = resale.registration;

        // Get buyer details for seat transfer
        const buyer = await tx.user.findUnique({
          where: { id: userId },
          select: {
            email: true,
            phoneNumber: true,
            firstName: true,
            lastName: true,
          },
        });

        if (!buyer) {
          throw new ValidationError('Buyer user not found');
        }

        const buyerFullName = `${buyer.firstName} ${buyer.lastName}`.trim();

        // 1. Create new registration for buyer
        const newRegistration = await tx.eventRegistration.create({
          data: {
            eventId: oldRegistration.eventId,
            attendeeId: userId,
            quantity: oldRegistration.quantity,
            totalAmount: resale.resalePrice,
            status: RegistrationStatus.CONFIRMED,
            paymentStatus: oldRegistration.paymentStatus,
            ticketType: oldRegistration.ticketType,
            registrationData: (oldRegistration.registrationData as Prisma.JsonValue) || undefined,
            backupCode: TicketService.generateBackupTicketCode(),
            qrSecret: crypto.randomUUID(),
          },
        });

        // 2. Copy ticket line items
        if (oldRegistration.ticketLineItems.length > 0) {
          await tx.ticketLineItem.createMany({
            data: oldRegistration.ticketLineItems.map((item) => ({
              registrationId: newRegistration.id,
              ticketType: item.ticketType,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          });
        }

        // 3. ✅ HANDLE SEAT ALLOCATIONS (NEW)
        // Get event seating configuration
        const event = await tx.event.findUnique({
          where: { id: oldRegistration.eventId },
          select: { hasSeatingMap: true, seatingType: true },
        });

        let needsSeatSelection = false;

        if (event?.hasSeatingMap) {
          const seatHandlingResult = await SeatTransferHelperService.handleResaleSeats(
            tx,
            {
              fromRegistrationId: oldRegistration.id,
              toRegistrationId: newRegistration.id,
              toUserEmail: buyer.email,
              toUserPhone: buyer.phoneNumber ?? undefined,
              toUserName: buyerFullName,
              eventId: oldRegistration.eventId,
              seatingType: (event.seatingType as 'CUSTOMER_SELECTS' | 'ORGANIZER_ASSIGNS' | 'HYBRID') ?? 'CUSTOMER_SELECTS',
            },
          );

          // If CUSTOMER_SELECTS model, buyer needs to select new seats
          if (seatHandlingResult.action === 'RELEASED') {
            logger.info(
              `[TicketResale] Seats released for buyer to select. Resale ID: ${resale.id}`,
            );
            needsSeatSelection = true;
          } else if (seatHandlingResult.action === 'TRANSFERRED') {
            logger.info(
              `[TicketResale] Successfully transferred ${seatHandlingResult.transferred} seat(s) to buyer. Resale ID: ${resale.id}`,
            );
          }

          if (seatHandlingResult.errors.length > 0) {
            logger.warn(
              `[TicketResale] Seat handling completed with ${seatHandlingResult.errors.length} error(s):`,
              seatHandlingResult.errors,
            );
            // Don't throw - allow resale even if some seats couldn't be handled
          }
        }

        // 4. Cancel old registration
        await tx.eventRegistration.update({
          where: { id: oldRegistration.id },
          data: {
            status: RegistrationStatus.CANCELLED,
            qrCodeDataUrl: null,
          },
        });

        // 5. Mark resale as SOLD
        await tx.ticketResale.update({
          where: { id: resale.id },
          data: {
            status: 'SOLD',
            buyerId: userId,
            soldAt: new Date(),
            paymentStatus: 'COMPLETED',
          },
        });

        return { registration: newRegistration, needsSeatSelection };
      });

      // Send seller notification email asynchronously
      if (resale.seller?.email) {
        const buyer = await prisma.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true },
        });

        const eventDate = resale.registration.event.startDate.toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });

        emailService.sendTicketResaleSoldEmail(resale.seller.email, {
          sellerName: `${resale.seller.firstName} ${resale.seller.lastName}`.trim(),
          buyerFirstName: buyer?.firstName || 'A buyer',
          eventTitle: resale.registration.event.title,
          eventDate,
          salePrice: Number(resale.resalePrice),
          platformFee: Number(resale.platformFee),
          sellerPayout: Number(resale.sellerPayout),
          currency: resale.currency,
        }).catch((err) => {
          logger.error(`Error sending resale sold email to ${resale.seller!.email}:`, err);
        });
      }

      logger.info(`Resale payment verified and completed: ${reference}, resale ${resale.id}`);
      return {
        success: true,
        message: 'Ticket purchased successfully',
        registrationId: result.registration.id,
        needsSeatSelection: result.needsSeatSelection,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error verifying resale payment:', error);
      throw new ValidationError(`Failed to verify payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * @deprecated Use initializeResalePayment + verifyResalePayment instead
   */
  static async purchaseResaleTicket(_userId: string, _resaleId: string) {
    throw new ValidationError('Direct purchase is no longer supported. Use the payment flow via initializeResalePayment.');
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
    } catch (error: unknown) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error cancelling resale:', error);
      throw new ValidationError(`Failed to cancel resale: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
