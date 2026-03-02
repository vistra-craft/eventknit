import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';
import crypto from 'crypto';
import { RegistrationStatus, TicketStatus, Prisma } from '@prisma/client';
import { TicketService } from './ticket.service.js';
import { DigitalWalletService } from './digital-wallet.service.js';
import { emailService } from './email.service.js';
import { SeatTransferHelperService } from './seat-transfer-helper.service.js';

export class TicketTransferService {
  /**
   * Initiate a ticket transfer
   */
  static async initiateTransfer(
    fromUserId: string,
    registrationId: string,
    data: {
      toUserId?: string;
      toEmail?: string;
      message?: string;
    },
  ) {
    try {
      // Validate registration belongs to user
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              allowTransfers: true,
              venue: true,
              location: true,
              ticketTypes: true, // Include ticket types to check for name-locked
            },
          },
        },
      });

      if (!registration) {
        throw new ValidationError('Registration not found');
      }

      if (registration.attendeeId !== fromUserId) {
        throw new ValidationError('You can only transfer your own tickets');
      }

      if (registration.status !== RegistrationStatus.CONFIRMED) {
        throw new ValidationError('Only confirmed registrations can be transferred');
      }

      // Check if event allows transfers
      if (registration.event.allowTransfers === false) {
        throw new ValidationError('Transfers are disabled for this event');
      }

      // Check if event has started
      if (registration.event.startDate < new Date()) {
        throw new ValidationError('Cannot transfer tickets for events that have already started');
      }

      // Check if ticket is name-locked
      if (registration.ticketType && registration.event.ticketTypes) {
        const ticketTypes = registration.event.ticketTypes as Array<{
          name: string;
          nameLocked?: boolean;
        }>;
        const ticketType = ticketTypes.find(tt => tt.name === registration.ticketType);
        if (ticketType?.nameLocked) {
          throw new ValidationError('This ticket is name-locked and cannot be transferred. The ticket is tied to the original purchaser\'s identity.');
        }
      }

      // Validate recipient
      let toUserId = data.toUserId;
      if (!toUserId && data.toEmail) {
        // Find user by email
        const recipient = await prisma.user.findUnique({
          where: { email: data.toEmail },
        });
        if (recipient) {
          toUserId = recipient.id;
        }
      }

      if (!toUserId && !data.toEmail) {
        throw new ValidationError('Either toUserId or toEmail must be provided');
      }

      // Generate transfer token
      const transferToken = crypto.randomBytes(32).toString('hex');

      // Check if transfer already exists
      const existingTransfer = await prisma.ticketTransfer.findFirst({
        where: {
          registrationId,
          status: 'PENDING',
        },
      });

      if (existingTransfer) {
        throw new ValidationError('A transfer for this ticket is already pending');
      }

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create transfer
      const transfer = await prisma.ticketTransfer.create({
        data: {
          registrationId,
          fromUserId,
          toUserId: toUserId || undefined,
          toEmail: toUserId ? undefined : data.toEmail,
          transferToken,
          message: data.message,
          expiresAt,
        },
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
            },
          },
          fromUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          toUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Send notification email to recipient
      const recipientEmail = transfer.toUser?.email || transfer.toEmail;
      if (recipientEmail) {
        const senderName = `${transfer.fromUser.firstName} ${transfer.fromUser.lastName}`.trim();
        const recipientName = transfer.toUser
          ? `${transfer.toUser.firstName} ${transfer.toUser.lastName}`.trim()
          : undefined;
        const eventDate = transfer.registration.event.startDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const eventLocation = transfer.registration.event.venue || transfer.registration.event.location || 'TBA';

        // Send email asynchronously (don't block the response)
        emailService.sendTicketTransferOfferEmail(recipientEmail, {
          recipientName,
          senderName,
          senderEmail: transfer.fromUser.email,
          eventTitle: transfer.registration.event.title,
          eventDate,
          eventLocation,
          ticketType: transfer.registration.ticketType || undefined,
          quantity: transfer.registration.quantity,
          transferToken: transfer.transferToken,
          message: data.message,
          expiresAt,
        }).then((result) => {
          if (result.success) {
            logger.info(`Transfer offer email sent to ${recipientEmail} for transfer ${transfer.id}`);
          } else {
            logger.error(`Failed to send transfer offer email to ${recipientEmail}:`, result.error);
          }
        }).catch((err) => {
          logger.error(`Error sending transfer offer email to ${recipientEmail}:`, err);
        });
      }

      return transfer;
    } catch (error) {
      logger.error('Error initiating transfer:', error);
      throw error;
    }
  }

  /**
   * Accept a ticket transfer
   */
  static async acceptTransfer(transferToken: string, userId: string) {
    try {
      const transfer = await prisma.ticketTransfer.findUnique({
        where: { transferToken },
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
                  organizerId: true,
                },
              },
              ticketLineItems: true,
            },
          },
          fromUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!transfer) {
        throw new ValidationError('Transfer not found');
      }

      if (transfer.status !== 'PENDING') {
        throw new ValidationError(`Transfer is already ${transfer.status.toLowerCase()}`);
      }

      if (transfer.expiresAt && transfer.expiresAt < new Date()) {
        throw new ValidationError('Transfer has expired');
      }

      // Verify user is the recipient
      if (transfer.toUserId && transfer.toUserId !== userId) {
        throw new ValidationError('You are not the recipient of this transfer');
      }

      // If transfer was sent to an email (no toUserId), verify the accepting user's email matches
      if (!transfer.toUserId && transfer.toEmail) {
        const acceptingUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });
        if (!acceptingUser || acceptingUser.email.toLowerCase() !== transfer.toEmail.toLowerCase()) {
          throw new ValidationError('You are not the recipient of this transfer');
        }
      }

      // Void old and Generate new registration
      const result = await prisma.$transaction(async (tx) => {
        const oldRegistration = transfer.registration;

        // Get recipient user details for seat transfer
        const recipientUser = await tx.user.findUnique({
          where: { id: userId },
          select: {
            email: true,
            phoneNumber: true,
            firstName: true,
            lastName: true,
          },
        });

        if (!recipientUser) {
          throw new ValidationError('Recipient user not found');
        }

        const recipientFullName = `${recipientUser.firstName} ${recipientUser.lastName}`.trim();

        // 1. Create NEW registration for the recipient
        const newRegistration = await tx.eventRegistration.create({
          data: {
            eventId: oldRegistration.eventId,
            attendeeId: userId,
            quantity: oldRegistration.quantity,
            totalAmount: oldRegistration.totalAmount,
            status: RegistrationStatus.CONFIRMED,
            paymentStatus: oldRegistration.paymentStatus,
            ticketType: oldRegistration.ticketType,
            registrationData: (oldRegistration.registrationData as Prisma.JsonValue) || undefined,
            backupCode: TicketService.generateBackupTicketCode(),
            qrSecret: crypto.randomUUID(),
          },
        });

        // 2. Copy TicketLineItems
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

        // 3. ✅ TRANSFER SEAT ALLOCATIONS (NEW)
        // If event has seating, transfer seats to new registration
        const event = await tx.event.findUnique({
          where: { id: oldRegistration.eventId },
          select: { hasSeatingMap: true },
        });

        if (event?.hasSeatingMap) {
          const seatTransferResult = await SeatTransferHelperService.transferSeats(
            tx,
            {
              fromRegistrationId: oldRegistration.id,
              toRegistrationId: newRegistration.id,
              toUserEmail: recipientUser.email,
              toUserPhone: recipientUser.phoneNumber ?? undefined,
              toUserName: recipientFullName,
              eventId: oldRegistration.eventId,
            },
          );

          if (seatTransferResult.transferred > 0) {
            logger.info(
              `[TicketTransfer] Successfully transferred ${seatTransferResult.transferred} seat(s) to new registration`,
            );
          }

          if (seatTransferResult.errors.length > 0) {
            logger.warn(
              `[TicketTransfer] Seat transfer completed with ${seatTransferResult.errors.length} error(s):`,
              seatTransferResult.errors,
            );
            // Don't throw - allow transfer even if some seats couldn't be transferred
            // This prevents blocking the transfer for technical issues
          }
        }

        // 4. Void OLD registration
        await tx.eventRegistration.update({
          where: { id: oldRegistration.id },
          data: {
            status: RegistrationStatus.CANCELLED,
            ticketStatus: TicketStatus.CANCELLED,
            qrCodeDataUrl: null, // Effectively voids physical printout
          },
        });

        // 5. Update transfer status and link to the NEW registration ID
        await tx.ticketTransfer.update({
          where: { id: transfer.id },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date(),
            toUserId: userId,
            registrationId: newRegistration.id,
            // parentTransferId would be set if there was a previous transfer
          },
        });

        return newRegistration;
      });

      // Automatically add to digital wallet for recipient if enabled
      try {
        const wallet = await prisma.digitalWallet.findUnique({
          where: { userId },
        });

        if (wallet?.autoAddTickets !== false) {
          await DigitalWalletService.addTicketToWallet(userId, result.id);
        }
      } catch (walletError) {
        logger.warn('Failed to auto-add transferred ticket to wallet:', walletError);
      }

      // Send notification email to the original sender
      if (transfer.fromUser?.email) {
        // Get recipient details
        const recipient = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        });

        if (recipient) {
          const senderName = `${transfer.fromUser.firstName} ${transfer.fromUser.lastName}`.trim();
          const recipientName = `${recipient.firstName} ${recipient.lastName}`.trim();
          const eventDate = transfer.registration.event.startDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          // Send email asynchronously
          emailService.sendTicketTransferAcceptedEmail(transfer.fromUser.email, {
            senderName,
            recipientName,
            recipientEmail: recipient.email,
            eventTitle: transfer.registration.event.title,
            eventDate,
            ticketType: transfer.registration.ticketType || undefined,
            quantity: transfer.registration.quantity,
          }).then((emailResult) => {
            if (emailResult.success) {
              logger.info(`Transfer accepted email sent to ${transfer.fromUser.email} for transfer ${transfer.id}`);
            } else {
              logger.error(`Failed to send transfer accepted email to ${transfer.fromUser.email}:`, emailResult.error);
            }
          }).catch((err) => {
            logger.error(`Error sending transfer accepted email to ${transfer.fromUser.email}:`, err);
          });
        }
      }

      return { success: true, message: 'Transfer accepted successfully', registrationId: result.id };
    } catch (error) {
      logger.error('Error accepting transfer:', error);
      throw error;
    }
  }


  /**
   * Reject or cancel a transfer
   */
  static async cancelTransfer(transferId: string, userId: string) {
    try {
      const transfer = await prisma.ticketTransfer.findUnique({
        where: { id: transferId },
        include: {
          registration: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  startDate: true,
                },
              },
            },
          },
          fromUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          toUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!transfer) {
        throw new ValidationError('Transfer not found');
      }

      // Only sender or recipient can cancel
      if (transfer.fromUserId !== userId && transfer.toUserId !== userId) {
        throw new ValidationError('You are not authorized to cancel this transfer');
      }

      if (transfer.status !== 'PENDING') {
        throw new ValidationError('Only pending transfers can be cancelled');
      }

      const updated = await prisma.ticketTransfer.update({
        where: { id: transferId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });

      // Determine who cancelled and who should be notified
      const cancelledBySender = transfer.fromUserId === userId;
      const cancelledByName = cancelledBySender
        ? `${transfer.fromUser.firstName} ${transfer.fromUser.lastName}`.trim()
        : transfer.toUser
          ? `${transfer.toUser.firstName} ${transfer.toUser.lastName}`.trim()
          : 'The recipient';

      // Get the email of the other party (the one who didn't cancel)
      const notifyEmail = cancelledBySender
        ? (transfer.toUser?.email || transfer.toEmail)
        : transfer.fromUser.email;

      const notifyName = cancelledBySender
        ? (transfer.toUser ? `${transfer.toUser.firstName} ${transfer.toUser.lastName}`.trim() : undefined)
        : `${transfer.fromUser.firstName} ${transfer.fromUser.lastName}`.trim();

      if (notifyEmail) {
        const eventDate = transfer.registration.event.startDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        // Send email asynchronously
        emailService.sendTicketTransferCancelledEmail(notifyEmail, {
          recipientName: notifyName,
          cancelledByName,
          cancelledBySender,
          eventTitle: transfer.registration.event.title,
          eventDate,
          ticketType: transfer.registration.ticketType || undefined,
          quantity: transfer.registration.quantity,
        }).then((emailResult) => {
          if (emailResult.success) {
            logger.info(`Transfer cancelled email sent to ${notifyEmail} for transfer ${transfer.id}`);
          } else {
            logger.error(`Failed to send transfer cancelled email to ${notifyEmail}:`, emailResult.error);
          }
        }).catch((err) => {
          logger.error(`Error sending transfer cancelled email to ${notifyEmail}:`, err);
        });
      }

      return updated;
    } catch (error) {
      logger.error('Error cancelling transfer:', error);
      throw error;
    }
  }

  /**
   * Get transfer details by token (public, no auth required)
   * Used by the transfer acceptance page to display transfer info
   */
  static async getTransferByToken(transferToken: string) {
    try {
      const transfer = await prisma.ticketTransfer.findUnique({
        where: { transferToken },
        include: {
          registration: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  image: true,
                  startDate: true,
                  endDate: true,
                  venue: true,
                  location: true,
                },
              },
            },
          },
          fromUser: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!transfer) {
        throw new ValidationError('Transfer not found');
      }

      // Return sanitized data (no sensitive fields)
      return {
        id: transfer.id,
        status: transfer.status,
        expiresAt: transfer.expiresAt,
        message: transfer.message,
        ticketType: transfer.registration.ticketType,
        quantity: transfer.registration.quantity,
        fromUser: {
          firstName: transfer.fromUser.firstName,
          lastName: transfer.fromUser.lastName,
        },
        event: transfer.registration.event,
        createdAt: transfer.createdAt,
      };
    } catch (error) {
      logger.error('Error getting transfer by token:', error);
      throw error;
    }
  }

  /**
   * Get user's transfer history
   */
  static async getTransferHistory(
    userId: string,
    filters?: {
      page?: number;
      limit?: number;
      type?: 'sent' | 'received';
    },
  ) {
    try {
      const limit = filters?.limit || 20;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const where: { fromUserId?: string; toUserId?: string; OR?: Array<{ fromUserId: string } | { toUserId: string }> } = {};

      if (filters?.type === 'sent') {
        where.fromUserId = userId;
      } else if (filters?.type === 'received') {
        where.toUserId = userId;
      } else {
        where.OR = [
          { fromUserId: userId },
          { toUserId: userId },
        ];
      }

      const [transfers, total] = await Promise.all([
        prisma.ticketTransfer.findMany({
          where,
          include: {
            registration: {
              include: {
                event: {
                  select: {
                    id: true,
                    title: true,
                    image: true,
                    startDate: true,
                  },
                },
              },
            },
            fromUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            toUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.ticketTransfer.count({ where }),
      ]);

      return {
        transfers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      };
    } catch (error) {
      logger.error('Error getting transfer history:', error);
      throw error;
    }
  }
}
