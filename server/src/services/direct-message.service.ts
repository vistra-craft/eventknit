import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';

const prisma = new PrismaClient();

export class DirectMessageService {
  /**
   * Send a direct message
   */
  static async sendMessage(
    senderId: string,
    data: {
      recipientId: string;
      subject?: string;
      content: string;
      eventId?: string;
      registrationId?: string;
      parentMessageId?: string;
    },
  ) {
    try {
      // Check if recipient allows messages
      const recipient = await prisma.user.findUnique({
        where: { id: data.recipientId },
        include: {
          preferences: true,
        },
      });

      if (!recipient) {
        throw new ValidationError('Recipient not found');
      }

      if (recipient.preferences && !recipient.preferences.allowMessages) {
        throw new ValidationError('Recipient does not allow messages');
      }

      const message = await prisma.directMessage.create({
        data: {
          senderId,
          recipientId: data.recipientId,
          subject: data.subject,
          content: data.content,
          eventId: data.eventId,
          registrationId: data.registrationId,
          parentMessageId: data.parentMessageId,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              image: true,
            },
          },
        },
      });

      // TODO: Send notification to recipient

      return message;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get user's messages (inbox)
   */
  static async getInbox(
    userId: string,
    filters?: {
      page?: number;
      limit?: number;
      isRead?: boolean;
    },
  ) {
    try {
      const limit = filters?.limit || 20;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const where: {
        recipientId: string;
        isDeleted: boolean;
        isRead?: boolean;
      } = {
        recipientId: userId,
        isDeleted: false,
      };

      if (filters?.isRead !== undefined) {
        where.isRead = filters.isRead;
      }

      const [messages, total, unreadCount] = await Promise.all([
        prisma.directMessage.findMany({
          where,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            event: {
              select: {
                id: true,
                title: true,
                image: true,
              },
            },
            _count: {
              select: {
                replies: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.directMessage.count({ where }),
        prisma.directMessage.count({
          where: {
            recipientId: userId,
            isRead: false,
            isDeleted: false,
          },
        }),
      ]);

      return {
        messages,
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      };
    } catch (error) {
      logger.error('Error getting inbox:', error);
      throw error;
    }
  }

  /**
   * Get sent messages
   */
  static async getSentMessages(
    userId: string,
    filters?: {
      page?: number;
      limit?: number;
    },
  ) {
    try {
      const limit = filters?.limit || 20;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const where: {
        senderId: string;
        isDeleted: boolean;
      } = {
        senderId: userId,
        isDeleted: false,
      };

      const [messages, total] = await Promise.all([
        prisma.directMessage.findMany({
          where,
          include: {
            recipient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            event: {
              select: {
                id: true,
                title: true,
                image: true,
              },
            },
            _count: {
              select: {
                replies: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.directMessage.count({ where }),
      ]);

      return {
        messages,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      };
    } catch (error) {
      logger.error('Error getting sent messages:', error);
      throw error;
    }
  }

  /**
   * Get message thread
   */
  static async getMessageThread(messageId: string, userId: string) {
    try {
      const message = await prisma.directMessage.findUnique({
        where: { id: messageId },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              image: true,
            },
          },
          parentMessage: {
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          replies: {
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
              recipient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!message) {
        throw new ValidationError('Message not found');
      }

      // Verify user has access
      if (message.senderId !== userId && message.recipientId !== userId) {
        throw new ValidationError('You do not have access to this message');
      }

      // Mark as read if recipient
      if (message.recipientId === userId && !message.isRead) {
        await prisma.directMessage.update({
          where: { id: messageId },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });
      }

      return message;
    } catch (error) {
      logger.error('Error getting message thread:', error);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  static async markAsRead(messageId: string, userId: string) {
    try {
      const message = await prisma.directMessage.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new ValidationError('Message not found');
      }

      if (message.recipientId !== userId) {
        throw new ValidationError('You can only mark your own received messages as read');
      }

      const updated = await prisma.directMessage.update({
        where: { id: messageId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return updated;
    } catch (error) {
      logger.error('Error marking message as read:', error);
      throw error;
    }
  }

  /**
   * Delete message
   */
  static async deleteMessage(messageId: string, userId: string) {
    try {
      const message = await prisma.directMessage.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new ValidationError('Message not found');
      }

      if (message.senderId !== userId && message.recipientId !== userId) {
        throw new ValidationError('You can only delete your own messages');
      }

      await prisma.directMessage.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error deleting message:', error);
      throw error;
    }
  }
}
