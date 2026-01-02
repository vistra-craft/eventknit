import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';
import crypto from 'crypto';
import { RegistrationStatus, TicketStatus } from '@prisma/client';
import { TicketService } from './ticket.service.js';
import { DigitalWalletService } from './digital-wallet.service.js';

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

      // Create transfer
      const transfer = await prisma.ticketTransfer.create({
        data: {
          registrationId,
          fromUserId,
          toUserId: toUserId || undefined,
          toEmail: toUserId ? undefined : data.toEmail,
          transferToken,
          message: data.message,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
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

      // TODO: Send notification email to recipient

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
              event: true,
              ticketLineItems: true,
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

      // Void old and Generate new registration
      const result = await prisma.$transaction(async (tx) => {
        const oldRegistration = transfer.registration;

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
            registrationData: (oldRegistration.registrationData as any) || undefined,
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

        // 3. Void OLD registration
        await tx.eventRegistration.update({
          where: { id: oldRegistration.id },
          data: {
            status: RegistrationStatus.CANCELLED,
            ticketStatus: TicketStatus.CANCELLED,
            qrCodeDataUrl: null, // Effectively voids physical printout
          },
        });

        // 4. Update transfer status and link to the NEW registration ID
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

      return updated;
    } catch (error) {
      logger.error('Error cancelling transfer:', error);
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

      const where: any = {};

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
