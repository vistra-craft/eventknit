import { PrismaClient, NotificationType } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';
import { NotificationService } from './notification.service.js';
import { websocketService } from './websocket.service.js';

const prisma = new PrismaClient();

/** Reusable user select with avatar */
const userSelectWithAvatar = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatar: true,
} as const;

const eventSelect = {
  id: true,
  title: true,
  image: true,
} as const;

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
        include: { preferences: true },
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
          sender: { select: userSelectWithAvatar },
          recipient: { select: userSelectWithAvatar },
          event: { select: eventSelect },
        },
      });

      // Real-time: notify recipient via WebSocket
      websocketService.emitToRoom(
        `user:${data.recipientId}:notifications`,
        'message:new',
        { message },
      );

      // Notify recipient of new message (fire-and-forget — never block the send)
      NotificationService.sendNotification({
        userId: data.recipientId,
        type: NotificationType.NEW_MESSAGE,
        title: `New message from ${message.sender.firstName} ${message.sender.lastName}`,
        message: message.subject
          ? `${message.subject}: ${message.content.slice(0, 100)}${message.content.length > 100 ? '…' : ''}`
          : `${message.content.slice(0, 120)}${message.content.length > 120 ? '…' : ''}`,
        eventId: data.eventId,
        relatedUserId: senderId,
        data: { messageId: message.id },
      }).catch((err: unknown) => logger.error('Failed to send DM notification:', err));

      return message;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get conversations list — grouped by partner with last message and unread count
   */
  static async getConversations(userId: string) {
    try {
      // Get all messages involving this user (not deleted)
      const allMessages = await prisma.directMessage.findMany({
        where: {
          isDeleted: false,
          OR: [
            { senderId: userId },
            { recipientId: userId },
          ],
        },
        include: {
          sender: { select: userSelectWithAvatar },
          recipient: { select: userSelectWithAvatar },
          event: { select: eventSelect },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Group by conversation partner
      const conversationMap = new Map<string, {
        partnerId: string;
        partner: { id: string; firstName: string | null; lastName: string | null; email: string; avatar: string | null };
        lastMessage: typeof allMessages[0];
        unreadCount: number;
        totalMessages: number;
      }>();

      for (const msg of allMessages) {
        const partnerId = msg.senderId === userId ? msg.recipientId : msg.senderId;
        const partner = msg.senderId === userId ? msg.recipient : msg.sender;

        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            partnerId,
            partner,
            lastMessage: msg,
            unreadCount: 0,
            totalMessages: 0,
          });
        }

        const conv = conversationMap.get(partnerId)!;
        conv.totalMessages++;

        // Count unread messages FROM this partner
        if (msg.recipientId === userId && !msg.isRead) {
          conv.unreadCount++;
        }
      }

      // Sort by last message timestamp (newest first)
      const conversations = Array.from(conversationMap.values())
        .sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());

      // Total unread across all conversations
      const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

      return { conversations, totalUnread };
    } catch (error) {
      logger.error('Error getting conversations:', error);
      throw error;
    }
  }

  /**
   * Get all messages in a conversation with a specific partner
   */
  static async getConversationWithUser(
    userId: string,
    partnerId: string,
    filters?: { page?: number; limit?: number },
  ) {
    try {
      const limit = filters?.limit || 50;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const where = {
        isDeleted: false,
        OR: [
          { senderId: userId, recipientId: partnerId },
          { senderId: partnerId, recipientId: userId },
        ],
      };

      const [messages, total] = await Promise.all([
        prisma.directMessage.findMany({
          where,
          include: {
            sender: { select: userSelectWithAvatar },
            recipient: { select: userSelectWithAvatar },
            event: { select: eventSelect },
          },
          orderBy: { createdAt: 'asc' },
          take: limit,
          skip,
        }),
        prisma.directMessage.count({ where }),
      ]);

      // Auto-mark unread messages from partner as read
      const unreadFromPartner = messages.filter(
        (m) => m.recipientId === userId && !m.isRead,
      );

      if (unreadFromPartner.length > 0) {
        await prisma.directMessage.updateMany({
          where: {
            id: { in: unreadFromPartner.map((m) => m.id) },
          },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });

        // Notify partner that their messages were read
        for (const msg of unreadFromPartner) {
          websocketService.emitToRoom(
            `user:${partnerId}:notifications`,
            'message:read',
            { messageId: msg.id, readAt: new Date().toISOString() },
          );
        }
      }

      // Get partner info
      const partner = await prisma.user.findUnique({
        where: { id: partnerId },
        select: userSelectWithAvatar,
      });

      return {
        messages,
        partner,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      };
    } catch (error) {
      logger.error('Error getting conversation:', error);
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
            sender: { select: userSelectWithAvatar },
            event: { select: eventSelect },
            _count: { select: { replies: true } },
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

      const where = {
        senderId: userId,
        isDeleted: false,
      };

      const [messages, total] = await Promise.all([
        prisma.directMessage.findMany({
          where,
          include: {
            recipient: { select: userSelectWithAvatar },
            event: { select: eventSelect },
            _count: { select: { replies: true } },
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
          sender: { select: userSelectWithAvatar },
          recipient: { select: userSelectWithAvatar },
          event: { select: eventSelect },
          parentMessage: {
            include: {
              sender: { select: userSelectWithAvatar },
            },
          },
          replies: {
            include: {
              sender: { select: userSelectWithAvatar },
              recipient: { select: userSelectWithAvatar },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!message) {
        throw new ValidationError('Message not found');
      }

      if (message.senderId !== userId && message.recipientId !== userId) {
        throw new ValidationError('You do not have access to this message');
      }

      // Mark as read if recipient
      if (message.recipientId === userId && !message.isRead) {
        await prisma.directMessage.update({
          where: { id: messageId },
          data: { isRead: true, readAt: new Date() },
        });

        // Notify sender their message was read
        websocketService.emitToRoom(
          `user:${message.senderId}:notifications`,
          'message:read',
          { messageId, readAt: new Date().toISOString() },
        );
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
        data: { isRead: true, readAt: new Date() },
      });

      // Notify sender their message was read
      websocketService.emitToRoom(
        `user:${message.senderId}:notifications`,
        'message:read',
        { messageId, readAt: updated.readAt?.toISOString() },
      );

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
        data: { isDeleted: true, deletedAt: new Date() },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error deleting message:', error);
      throw error;
    }
  }
}
