import { prisma } from '../config/database.js';
import {
  EventApprovalMessage,
  EventApprovalMessageType,
  MessageStatus,
  Prisma,
} from '@prisma/client';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';

export interface CreateApprovalMessageInput {
  eventId: string;
  organizerId: string;
  type: EventApprovalMessageType;
  title: string;
  message: string;
  senderRole: 'ADMIN' | 'ORGANIZER';
  senderName: string;
  senderEmail?: string;
  attachedDocuments?: string[];
}

export interface GetApprovalMessagesParams {
  eventId: string;
  limit?: number;
  offset?: number;
}

export interface UpdateMessageStatusInput {
  messageId: string;
  status: MessageStatus;
}

export interface RespondToMessageInput {
  messageId: string;
  responseMessage: string;
}

/**
 * EventApprovalMessageService
 * Handles communication between admins and organizers during event approval process
 */
export class EventApprovalMessageService {
  /**
   * Create a new approval message
   * @param input Message creation input
   * @returns Created approval message
   */
  static async createMessage(
    input: CreateApprovalMessageInput
  ): Promise<EventApprovalMessage> {
    try {
      // Verify event and organizer exist
      const event = await prisma.event.findUnique({
        where: { id: input.eventId },
      });

      if (!event) {
        throw new NotFoundError(`Event with ID ${input.eventId} not found`);
      }

      const organizer = await prisma.user.findUnique({
        where: { id: input.organizerId },
      });

      if (!organizer) {
        throw new NotFoundError(
          `Organizer with ID ${input.organizerId} not found`
        );
      }

      const message = await prisma.eventApprovalMessage.create({
        data: {
          eventId: input.eventId,
          organizerId: input.organizerId,
          type: input.type,
          title: input.title,
          message: input.message,
          senderRole: input.senderRole,
          senderName: input.senderName,
          senderEmail: input.senderEmail,
          attachedDocuments: input.attachedDocuments || [],
          status: 'PENDING',
        },
      });

      logger.info(
        `Created approval message: ${message.id} for event: ${input.eventId}`
      );
      return message;
    } catch (error) {
      logger.error('Error creating approval message:', error);
      throw error;
    }
  }

  /**
   * Get all approval messages for an event
   * @param params Query parameters (eventId, limit, offset)
   * @returns Array of approval messages
   */
  static async getEventMessages(
    params: GetApprovalMessagesParams
  ): Promise<{
    messages: EventApprovalMessage[];
    total: number;
  }> {
    try {
      const { eventId, limit = 50, offset = 0 } = params;

      // Verify event exists
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new NotFoundError(`Event with ID ${eventId} not found`);
      }

      const [messages, total] = await Promise.all([
        prisma.eventApprovalMessage.findMany({
          where: { eventId },
          orderBy: { createdAt: 'asc' },
          take: limit,
          skip: offset,
        }),
        prisma.eventApprovalMessage.count({
          where: { eventId },
        }),
      ]);

      return { messages, total };
    } catch (error) {
      logger.error('Error fetching approval messages:', error);
      throw error;
    }
  }

  /**
   * Update message status
   * @param input Message ID and new status
   * @returns Updated message
   */
  static async updateMessageStatus(
    input: UpdateMessageStatusInput
  ): Promise<EventApprovalMessage> {
    try {
      const message = await prisma.eventApprovalMessage.findUnique({
        where: { id: input.messageId },
      });

      if (!message) {
        throw new NotFoundError(
          `Message with ID ${input.messageId} not found`
        );
      }

      const updated = await prisma.eventApprovalMessage.update({
        where: { id: input.messageId },
        data: {
          status: input.status,
        },
      });

      logger.info(
        `Updated message status: ${input.messageId} → ${input.status}`
      );
      return updated;
    } catch (error) {
      logger.error('Error updating message status:', error);
      throw error;
    }
  }

  /**
   * Organizer responds to a REQUEST_INFO message
   * @param input Message ID and response message
   * @returns Updated message
   */
  static async respondToMessage(
    input: RespondToMessageInput
  ): Promise<EventApprovalMessage> {
    try {
      const message = await prisma.eventApprovalMessage.findUnique({
        where: { id: input.messageId },
      });

      if (!message) {
        throw new NotFoundError(
          `Message with ID ${input.messageId} not found`
        );
      }

      if (message.type !== 'REQUEST_INFO') {
        throw new Error('Can only respond to REQUEST_INFO type messages');
      }

      const updated = await prisma.eventApprovalMessage.update({
        where: { id: input.messageId },
        data: {
          status: 'RESPONDED',
          responseMessage: input.responseMessage,
          respondedAt: new Date(),
        },
      });

      logger.info(`Organizer responded to message: ${input.messageId}`);
      return updated;
    } catch (error) {
      logger.error('Error responding to message:', error);
      throw error;
    }
  }

  /**
   * Mark a message as viewed by organizer
   * @param messageId Message ID
   * @returns Updated message
   */
  static async markAsViewed(messageId: string): Promise<EventApprovalMessage> {
    try {
      const message = await prisma.eventApprovalMessage.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new NotFoundError(
          `Message with ID ${messageId} not found`
        );
      }

      if (message.status === 'PENDING') {
        const updated = await prisma.eventApprovalMessage.update({
          where: { id: messageId },
          data: { status: 'VIEWED' },
        });

        logger.info(`Marked message as viewed: ${messageId}`);
        return updated;
      }

      return message;
    } catch (error) {
      logger.error('Error marking message as viewed:', error);
      throw error;
    }
  }

  /**
   * Get messages requiring attention (pending REQUEST_INFO responses)
   * @param organizerId Organizer ID
   * @returns Array of pending REQUEST_INFO messages
   */
  static async getPendingMessagesForOrganizer(
    organizerId: string
  ): Promise<EventApprovalMessage[]> {
    try {
      const messages = await prisma.eventApprovalMessage.findMany({
        where: {
          organizerId,
          type: 'REQUEST_INFO',
          status: { in: ['PENDING', 'VIEWED'] },
        },
        orderBy: { createdAt: 'desc' },
      });

      return messages;
    } catch (error) {
      logger.error(
        'Error fetching pending messages for organizer:',
        error
      );
      throw error;
    }
  }

  /**
   * Get approval history for an event (for admin review)
   * @param eventId Event ID
   * @returns Array of approval-related messages
   */
  static async getApprovalHistory(eventId: string): Promise<EventApprovalMessage[]> {
    try {
      const messages = await prisma.eventApprovalMessage.findMany({
        where: { eventId },
        orderBy: { createdAt: 'desc' },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              organizerId: true,
            },
          },
        },
      });

      return messages;
    } catch (error) {
      logger.error('Error fetching approval history:', error);
      throw error;
    }
  }

  /**
   * Create an APPROVED message
   * @param eventId Event ID
   * @param organizerId Organizer ID
   * @param adminName Admin name
   * @param adminEmail Admin email
   * @returns Created message
   */
  static async createApprovedMessage(
    eventId: string,
    organizerId: string,
    adminName: string,
    adminEmail: string
  ): Promise<EventApprovalMessage> {
    return this.createMessage({
      eventId,
      organizerId,
      type: 'APPROVED',
      title: 'Your Event Has Been Approved',
      message: 'Congratulations! Your event has been approved and is now live on EventKnit.',
      senderRole: 'ADMIN',
      senderName: adminName,
      senderEmail: adminEmail,
    });
  }

  /**
   * Create a REJECTED message
   * @param eventId Event ID
   * @param organizerId Organizer ID
   * @param rejectionReason Reason for rejection
   * @param adminName Admin name
   * @param adminEmail Admin email
   * @returns Created message
   */
  static async createRejectedMessage(
    eventId: string,
    organizerId: string,
    rejectionReason: string,
    adminName: string,
    adminEmail: string
  ): Promise<EventApprovalMessage> {
    return this.createMessage({
      eventId,
      organizerId,
      type: 'REJECTED',
      title: 'Event Approval Status Update',
      message: `Your event submission could not be approved at this time. Reason: ${rejectionReason}`,
      senderRole: 'ADMIN',
      senderName: adminName,
      senderEmail: adminEmail,
    });
  }

  /**
   * Create a REQUEST_INFO message
   * @param eventId Event ID
   * @param organizerId Organizer ID
   * @param message Custom message from admin
   * @param missingDocuments Array of missing document types
   * @param adminName Admin name
   * @param adminEmail Admin email
   * @returns Created message
   */
  static async createRequestInfoMessage(
    eventId: string,
    organizerId: string,
    message: string,
    missingDocuments: string[],
    adminName: string,
    adminEmail: string
  ): Promise<EventApprovalMessage> {
    return this.createMessage({
      eventId,
      organizerId,
      type: 'REQUEST_INFO',
      title: 'Additional Information Required',
      message,
      senderRole: 'ADMIN',
      senderName: adminName,
      senderEmail: adminEmail,
      attachedDocuments: missingDocuments,
    });
  }
}
