import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

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
    }
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
              allowTransfers: true, // Add this field to Event model if needed
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

      if (registration.status !== 'CONFIRMED') {
        throw new ValidationError('Only confirmed registrations can be transferred');
      }

      // Check if event allows transfers
      // For now, allow all transfers. Can add event.allowTransfers check later

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
          status: {
            in: ['PENDING', 'ACCEPTED'],
          },
        },
      });

      if (existingTransfer) {
        throw new ValidationError('A transfer for this ticket is already pending or accepted');
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

      // Update registration to new owner
      await prisma.$transaction(async (tx) => {
        // Update transfer status
        await tx.ticketTransfer.update({
          where: { id: transfer.id },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date(),
            toUserId: userId, // Set if it was email-based
          },
        });

        // Update registration owner
        await tx.eventRegistration.update({
          where: { id: transfer.registrationId },
          data: {
            attendeeId: userId,
          },
        });
      });

      return { success: true, message: 'Transfer accepted successfully' };
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
    }
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
