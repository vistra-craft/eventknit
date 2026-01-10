import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyAccessToken } from '../utils/jwt.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { UserRole } from '@prisma/client';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: UserRole;
  eventId?: string;
}

export interface ScanEvent {
  scanId: string;
  registrationId: string;
  eventId: string;
  scanType: string;
  facility: string | null;
  scannedAt: Date;
  attendeeName?: string;
  ticketType?: string | null;
  isReEntry: boolean;
  signatureValid?: boolean;
  codeType?: string;
}

export interface StatisticsUpdate {
  eventId: string;
  checkedInCount: number;
  scanCounts: Record<string, number>;
  timestamp: Date;
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, AuthenticatedSocket> = new Map();

  /**
   * Initialize Socket.IO server
   */
  initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify token
        const decoded = verifyAccessToken(token);

        // Get user from database
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            role: true,
            status: true,
          },
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        // For notification rooms, allow all authenticated users
        // For event rooms, require TELLER or higher
        // This will be checked when joining specific rooms

        // Attach user info to socket
        socket.userId = user.id;
        socket.userRole = user.role;

        next();
      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const clientId = socket.id;
      this.connectedClients.set(clientId, socket);

      logger.info(`WebSocket client connected: ${clientId} (user: ${socket.userId})`);

      // Handle joining notification room
      socket.on('join:notifications', async () => {
        try {
          if (!socket.userId) {
            socket.emit('error', { message: 'User ID not found' });
            return;
          }

          // Join user's personal notification room
          socket.join(`user:${socket.userId}:notifications`);
          logger.info(`Client ${clientId} joined notification room for user: ${socket.userId}`);
          socket.emit('joined:notifications', { userId: socket.userId });
        } catch (error) {
          logger.error('Error joining notification room:', error);
          socket.emit('error', { message: 'Failed to join notification room' });
        }
      });

      // Handle leaving notification room
      socket.on('leave:notifications', () => {
        if (socket.userId) {
          socket.leave(`user:${socket.userId}:notifications`);
          logger.info(`Client ${clientId} left notification room for user: ${socket.userId}`);
        }
      });

      // Handle joining event room
      socket.on('join:event', async (data: { eventId: string }) => {
        try {
          if (!data.eventId) {
            socket.emit('error', { message: 'Event ID is required' });
            return;
          }

          // Verify user has access to this event (basic check)
          // In production, you might want to verify the user is authorized for this event
          const event = await prisma.event.findUnique({
            where: { id: data.eventId },
            select: { id: true },
          });

          if (!event) {
            socket.emit('error', { message: 'Event not found' });
            return;
          }

          // Leave previous room if any
          if (socket.eventId) {
            socket.leave(`event:${socket.eventId}`);
          }

          // Join new event room
          socket.join(`event:${data.eventId}`);
          socket.eventId = data.eventId;

          logger.info(`Client ${clientId} joined event room: ${data.eventId}`);

          // Send current statistics
          await this.sendStatisticsUpdate(data.eventId);

          socket.emit('joined:event', { eventId: data.eventId });
        } catch (error) {
          logger.error('Error joining event room:', error);
          socket.emit('error', { message: 'Failed to join event room' });
        }
      });

      // Handle leaving event room
      socket.on('leave:event', (data: { eventId: string }) => {
        if (data.eventId) {
          socket.leave(`event:${data.eventId}`);
          if (socket.eventId === data.eventId) {
            socket.eventId = undefined;
          }
          logger.info(`Client ${clientId} left event room: ${data.eventId}`);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.connectedClients.delete(clientId);
        logger.info(`WebSocket client disconnected: ${clientId}`);
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });

    logger.info('WebSocket service initialized');
  }

  /**
   * Emit scan event to event room
   */
  emitScanEvent(eventId: string, scanEvent: ScanEvent): void {
    if (!this.io) {
      logger.warn('WebSocket server not initialized, cannot emit scan event');
      return;
    }

    this.io.to(`event:${eventId}`).emit('scan:event', scanEvent);
    logger.debug(`Emitted scan event to event room: ${eventId}`, { scanId: scanEvent.scanId });
  }

  /**
   * Emit event to any room
   */
  emitToRoom(room: string, event: string, data: any): void {
    if (!this.io) {
      logger.warn(`WebSocket server not initialized, cannot emit to room: ${room}`);
      return;
    }

    this.io.to(room).emit(event, data);
    logger.debug(`Emitted ${event} to room: ${room}`);
  }

  /**
   * Send statistics update to event room
   */
  async sendStatisticsUpdate(eventId: string): Promise<void> {
    if (!this.io) {
      return;
    }

    try {
      // Get current statistics
      const checkedInCount = await prisma.eventRegistration.count({
        where: {
          eventId,
          isCurrentlyInside: true,
        },
      });

      const scanStats = await prisma.ticketScan.groupBy({
        by: ['scanType'],
        where: {
          eventId,
        },
        _count: {
          id: true,
        },
      });

      const statistics: StatisticsUpdate = {
        eventId,
        checkedInCount,
        scanCounts: scanStats.reduce(
          (acc, stat) => {
            acc[stat.scanType] = stat._count.id;
            return acc;
          },
          {} as Record<string, number>,
        ),
        timestamp: new Date(),
      };

      this.io.to(`event:${eventId}`).emit('statistics:update', statistics);
    } catch (error) {
      logger.error('Error sending statistics update:', error);
    }
  }

  /**
   * Get connected clients count for an event
   */
  getConnectedClientsCount(eventId?: string): number {
    if (!eventId) {
      return this.connectedClients.size;
    }

    let count = 0;
    this.connectedClients.forEach((socket) => {
      if (socket.eventId === eventId && socket.rooms.has(`event:${eventId}`)) {
        count++;
      }
    });

    return count;
  }

  /**
   * Send notification to user via WebSocket
   */
  sendNotification(userId: string, notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    priority: string;
    createdAt: Date;
    eventId?: string | null;
    isRead: boolean;
  }): void {
    if (!this.io) {
      logger.warn('WebSocket server not initialized, cannot send notification');
      return;
    }

    this.io.to(`user:${userId}:notifications`).emit('notification:new', notification);
    logger.debug(`Sent notification to user ${userId} via WebSocket`, { notificationId: notification.id });
  }

  /**
   * Send unread count update to user
   */
  sendUnreadCountUpdate(userId: string, count: number): void {
    if (!this.io) {
      logger.warn('WebSocket server not initialized, cannot send unread count update');
      return;
    }

    this.io.to(`user:${userId}:notifications`).emit('notification:unread-count', { count });
    logger.debug(`Sent unread count update to user ${userId}`, { count });
  }

  /**
   * Notify user that a notification was marked as read
   */
  notifyNotificationRead(userId: string, notificationId: string): void {
    if (!this.io) {
      logger.warn('WebSocket server not initialized, cannot notify notification read');
      return;
    }

    this.io.to(`user:${userId}:notifications`).emit('notification:read', { notificationId });
    logger.debug(`Notified user ${userId} that notification ${notificationId} was read`);
  }

  /**
   * Notify user that all notifications were marked as read
   */
  notifyAllNotificationsRead(userId: string): void {
    if (!this.io) {
      logger.warn('WebSocket server not initialized, cannot notify all read');
      return;
    }

    this.io.to(`user:${userId}:notifications`).emit('notification:all-read');
    logger.debug(`Notified user ${userId} that all notifications were read`);
  }

  /**
   * Notify user that a notification was deleted
   */
  notifyNotificationDeleted(userId: string, notificationId: string): void {
    if (!this.io) {
      logger.warn('WebSocket server not initialized, cannot notify notification deleted');
      return;
    }

    this.io.to(`user:${userId}:notifications`).emit('notification:deleted', { notificationId });
    logger.debug(`Notified user ${userId} that notification ${notificationId} was deleted`);
  }

  /**
   * Get Socket.IO server instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const websocketService = new WebSocketService();



