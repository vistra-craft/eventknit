import { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { EventApprovalMessageService } from '../services/event-approval-message.service.js';
import { EventApprovalMessageType, MessageStatus } from '@prisma/client';
import { logger } from '../utils/logger.js';

// ─── Typed request shapes ───────────────────────────────────────────────

interface GetApprovalMessagesQuery {
  limit?: string;
  offset?: string;
}

interface CreateMessageBody {
  type: EventApprovalMessageType;
  title: string;
  message: string;
  attachedDocuments?: string[];
}

interface RequestInfoBody {
  message: string;
  missingDocuments: string[];
}

interface RespondToMessageBody {
  responseMessage: string;
}

// ─── Controller ─────────────────────────────────────────────────────────

export class EventApprovalMessageController {
  /**
   * Get all approval messages for an event
   * GET /api/v1/admin/events/:eventId/approval-messages
   */
  static async getEventMessages(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const eventId = (req.params as Record<string, string>).eventId;
      const query = req.query as Partial<GetApprovalMessagesQuery>;
      
      const limit = query.limit ? parseInt(query.limit, 10) : 50;
      const offset = query.offset ? parseInt(query.offset, 10) : 0;

      const result = await EventApprovalMessageService.getEventMessages({
        eventId,
        limit,
        offset,
      });

      res.json({
        success: true,
        data: {
          messages: result.messages,
          total: result.total,
          limit,
          offset,
        },
      });
    } catch (error) {
      logger.error('Error fetching approval messages:', error);
      next(error);
    }
  }

  /**
   * Request more information from organizer
   * POST /api/v1/admin/events/:eventId/approval-messages/request-info
   */
  static async requestMoreInfo(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const eventId = (req.params as Record<string, string>).eventId;
      const body = req.body as RequestInfoBody;
      const admin = req.user!;

      if (!body.message && body.missingDocuments.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Either message or missingDocuments must be provided',
        });
        return;
      }

      // Get event to fetch organizer ID
      const { prisma } = await import('../config/database.js');
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { organizerId: true },
      });

      if (!event) {
        res.status(404).json({
          success: false,
          message: 'Event not found',
        });
        return;
      }

      const message = await EventApprovalMessageService.createRequestInfoMessage(
        eventId,
        event.organizerId,
        body.message,
        body.missingDocuments,
        admin.email, // Use email as sender name for now
        admin.email,
      );

      // TODO: Send email notification to organizer
      // TODO: Create in-app notification

      res.status(201).json({
        success: true,
        data: { message },
      });
    } catch (error) {
      logger.error('Error requesting more info:', error);
      next(error);
    }
  }

  /**
   * Send approval message
   * POST /api/v1/admin/events/:eventId/approval-messages
   */
  static async sendMessage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const eventId = (req.params as Record<string, string>).eventId;
      const body = req.body as CreateMessageBody;
      const admin = req.user!;

      // Get event to fetch organizer ID
      const { prisma } = await import('../config/database.js');
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { organizerId: true },
      });

      if (!event) {
        res.status(404).json({
          success: false,
          message: 'Event not found',
        });
        return;
      }

      const message = await EventApprovalMessageService.createMessage({
        eventId,
        organizerId: event.organizerId,
        type: body.type,
        title: body.title,
        message: body.message,
        senderRole: 'ADMIN',
        senderName: admin.email, // Use email as sender name for now
        senderEmail: admin.email,
        attachedDocuments: body.attachedDocuments,
      });

      // TODO: Send email notification
      // TODO: Create in-app notification

      res.status(201).json({
        success: true,
        data: { message },
      });
    } catch (error) {
      logger.error('Error sending approval message:', error);
      next(error);
    }
  }

  /**
   * Organizer responds to REQUEST_INFO message
   * POST /api/v1/admin/events/:eventId/approval-messages/:messageId/respond
   */
  static async respondToMessage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const messageId = (req.params as Record<string, string>).messageId;
      const body = req.body as RespondToMessageBody;

      const message = await EventApprovalMessageService.respondToMessage({
        messageId,
        responseMessage: body.responseMessage,
      });

      // TODO: Notify admin that organizer has responded
      // TODO: Create in-app notification for admin

      res.json({
        success: true,
        data: { message },
      });
    } catch (error) {
      logger.error('Error responding to message:', error);
      next(error);
    }
  }

  /**
   * Mark a message as viewed
   * PATCH /api/v1/admin/events/:eventId/approval-messages/:messageId/mark-viewed
   */
  static async markAsViewed(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const messageId = (req.params as Record<string, string>).messageId;

      const message = await EventApprovalMessageService.markAsViewed(messageId);

      res.json({
        success: true,
        data: { message },
      });
    } catch (error) {
      logger.error('Error marking message as viewed:', error);
      next(error);
    }
  }

  /**
   * Get pending messages for organizer
   * GET /api/v1/admin/organizers/:organizerId/approval-messages/pending
   */
  static async getPendingMessages(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const organizerId = (req.params as Record<string, string>).organizerId;

      const messages = await EventApprovalMessageService.getPendingMessagesForOrganizer(
        organizerId,
      );

      res.json({
        success: true,
        data: { messages },
      });
    } catch (error) {
      logger.error('Error fetching pending messages:', error);
      next(error);
    }
  }

  /**
   * Get approval history for event
   * GET /api/v1/admin/events/:eventId/approval-history
   */
  static async getApprovalHistory(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const eventId = (req.params as Record<string, string>).eventId;

      const messages = await EventApprovalMessageService.getApprovalHistory(eventId);

      res.json({
        success: true,
        data: { messages },
      });
    } catch (error) {
      logger.error('Error fetching approval history:', error);
      next(error);
    }
  }
}
