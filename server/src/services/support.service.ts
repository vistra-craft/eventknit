import { prisma } from '../config/database.js';
import {
  SupportQueryStatus,
  SupportPriority,
  SocialPlatform,
  Prisma,
} from '@prisma/client';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { SocialMediaService } from './social-media.service.js';

export enum SupportChannel {
  SOCIAL = 'social',
  EMAIL = 'email',
  WEBSITE = 'website',
  PHONE = 'phone',
}

export interface CreateSupportQueryData {
  channel: SupportChannel;
  // For social media queries
  socialAccountId?: string;
  platform?: SocialPlatform;
  messageId?: string;
  postId?: string;
  // For email queries
  email?: string;
  subject?: string;
  // For website queries
  formData?: Record<string, unknown>;
  // Common fields
  senderName: string;
  senderEmail?: string;
  message: string;
  priority?: SupportPriority;
  category?: string;
  campaignId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateSupportQueryData {
  status?: SupportQueryStatus;
  priority?: SupportPriority;
  category?: string;
  assignedTo?: string | null;
  campaignId?: string;
  metadata?: Record<string, unknown>;
}

export interface SupportQueryFilters {
  channel?: SupportChannel;
  platform?: SocialPlatform;
  status?: SupportQueryStatus;
  priority?: SupportPriority;
  assignedTo?: string;
  category?: string;
  campaignId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}

export class SupportService {
  /**
   * Create support query from any channel
   */
  static async createQuery(data: CreateSupportQueryData) {
    try {
      // Handle social media queries
      if (data.channel === SupportChannel.SOCIAL) {
        if (!data.socialAccountId || !data.platform || !data.messageId) {
          throw new ValidationError(
            'Social account ID, platform, and message ID are required for social media queries',
          );
        }

        // Use SocialMediaService to create the message
        return await SocialMediaService.createMessage({
          socialAccountId: data.socialAccountId,
          platform: data.platform,
          messageId: data.messageId,
          senderId: data.senderEmail || 'unknown',
          senderName: data.senderName,
          senderEmail: data.senderEmail,
          message: data.message,
          messageType: 'COMMENT', // Default, can be enhanced
          postId: data.postId,
          priority: data.priority,
          category: data.category,
          metadata: {
            ...data.metadata,
            channel: SupportChannel.SOCIAL,
            campaignId: data.campaignId,
          },
        });
      }

      // For email and website queries, we'll create a generic support query
      // This would require a new SupportQuery model, but for now we'll use SocialMessage
      // as a unified model (can be refactored later)

      throw new ValidationError('Email and website support queries not yet implemented');
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error('Failed to create support query:', error);
      throw new ValidationError('Failed to create support query');
    }
  }

  /**
   * Get unified support inbox (all channels)
   */
  static async getSupportInbox(filters?: SupportQueryFilters) {
    try {
      // For now, get social media messages
      // In the future, this will aggregate from multiple sources
      const socialFilters: {
        socialAccountId?: string;
        platform?: SocialPlatform;
        status?: SupportQueryStatus;
        priority?: SupportPriority;
        assignedTo?: string;
        postId?: string;
        startDate?: Date | string;
        endDate?: Date | string;
      } = {};

      if (filters?.platform) {
        socialFilters.platform = filters.platform;
      }
      if (filters?.status) {
        socialFilters.status = filters.status;
      }
      if (filters?.priority) {
        socialFilters.priority = filters.priority;
      }
      if (filters?.assignedTo) {
        socialFilters.assignedTo = filters.assignedTo;
      }
      if (filters?.startDate) {
        socialFilters.startDate = filters.startDate;
      }
      if (filters?.endDate) {
        socialFilters.endDate = filters.endDate;
      }

      const messages = await SocialMediaService.getMessages(socialFilters);

      // Transform to unified format
      return messages.map((msg) => ({
        id: msg.id,
        channel: SupportChannel.SOCIAL,
        platform: msg.platform,
        senderName: msg.senderName,
        senderEmail: msg.senderEmail,
        senderHandle: msg.senderHandle,
        message: msg.message,
        status: msg.status,
        priority: msg.priority,
        category: msg.category,
        assignedTo: msg.assignedTo,
        assignedAgent: msg.assignedAgent,
        postId: msg.postId,
        relatedPost: msg.socialPost,
        campaignId: msg.campaignId,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        responseCount: msg._count?.responses || 0,
      }));
    } catch (error) {
      logger.error('Failed to get support inbox:', error);
      throw new ValidationError('Failed to retrieve support inbox');
    }
  }

  /**
   * Get support query by ID
   */
  static async getQueryById(queryId: string, _channel?: SupportChannel) {
    try {
      // For now, assume it's a social media message
      // In the future, check channel and route accordingly
      const message = await SocialMediaService.getMessageById(queryId);

      return {
        id: message.id,
        channel: SupportChannel.SOCIAL,
        platform: message.platform,
        senderName: message.senderName,
        senderEmail: message.senderEmail,
        senderHandle: message.senderHandle,
        message: message.message,
        status: message.status,
        priority: message.priority,
        category: message.category,
        assignedTo: message.assignedTo,
        assignedAgent: message.assignedAgent,
        postId: message.postId,
        relatedPost: message.socialPost,
        campaignId: message.campaignId,
        responses: message.responses,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Failed to get support query ${queryId}:`, error);
      throw new ValidationError('Failed to retrieve support query');
    }
  }

  /**
   * Assign query to agent
   */
  static async assignQuery(queryId: string, agentId: string, _channel?: SupportChannel) {
    try {
      // For now, assume it's a social media message
      const message = await SocialMediaService.assignMessage(queryId, agentId);

      return {
        id: message.id,
        assignedTo: message.assignedTo,
        assignedAgent: message.assignedAgent,
        status: message.status,
      };
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ValidationError ||
        error instanceof AuthorizationError
      ) {
        throw error;
      }
      logger.error(`Failed to assign query ${queryId}:`, error);
      throw new ValidationError('Failed to assign query');
    }
  }

  /**
   * Update query status
   */
  static async updateQueryStatus(
    queryId: string,
    status: SupportQueryStatus,
    _channel?: SupportChannel,
  ) {
    try {
      // For now, assume it's a social media message
      const message = await SocialMediaService.updateMessageStatus(queryId, status);

      return {
        id: message.id,
        status: message.status,
        resolvedAt: message.resolvedAt,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Failed to update query status ${queryId}:`, error);
      throw new ValidationError('Failed to update query status');
    }
  }

  /**
   * Add response to query
   */
  static async addResponse(
    queryId: string,
    response: string,
    agentId: string,
    isInternal: boolean = false,
    _channel?: SupportChannel,
  ) {
    try {
      // For now, assume it's a social media message
      const supportResponse = await SocialMediaService.addResponse(
        queryId,
        response,
        agentId,
        isInternal,
      );

      return supportResponse;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Failed to add response to query ${queryId}:`, error);
      throw new ValidationError('Failed to add response');
    }
  }

  /**
   * Get support statistics
   */
  static async getSupportStatistics(filters?: {
    startDate?: Date | string;
    endDate?: Date | string;
    platform?: SocialPlatform;
  }) {
    try {
      const where: Prisma.SocialMessageWhereInput = {};

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      if (filters?.platform) {
        where.platform = filters.platform;
      }

      const [
        total,
        newQueries,
        inProgress,
        resolved,
        closed,
        byPlatform,
        byPriority,
        byStatus,
      ] = await Promise.all([
        prisma.socialMessage.count({ where }),
        prisma.socialMessage.count({
          where: { ...where, status: SupportQueryStatus.NEW },
        }),
        prisma.socialMessage.count({
          where: { ...where, status: SupportQueryStatus.IN_PROGRESS },
        }),
        prisma.socialMessage.count({
          where: { ...where, status: SupportQueryStatus.RESOLVED },
        }),
        prisma.socialMessage.count({
          where: { ...where, status: SupportQueryStatus.CLOSED },
        }),
        prisma.socialMessage.groupBy({
          by: ['platform'],
          where,
          _count: { id: true },
        }),
        prisma.socialMessage.groupBy({
          by: ['priority'],
          where,
          _count: { id: true },
        }),
        prisma.socialMessage.groupBy({
          by: ['status'],
          where,
          _count: { id: true },
        }),
      ]);

      // Calculate average response time (simplified - would need response timestamps)
      const resolvedQueries = await prisma.socialMessage.findMany({
        where: {
          ...where,
          status: SupportQueryStatus.RESOLVED,
          resolvedAt: { not: null },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
        },
      });

      const responseTimes = resolvedQueries
        .map((q) => {
          if (!q.resolvedAt) return null;
          return q.resolvedAt.getTime() - q.createdAt.getTime();
        })
        .filter((t): t is number => t !== null);

      const avgResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0;

      return {
        total,
        byStatus: {
          new: newQueries,
          inProgress,
          resolved,
          closed,
        },
        byPlatform: byPlatform.reduce(
          (acc, item) => {
            acc[item.platform] = item._count.id;
            return acc;
          },
          {} as Record<string, number>,
        ),
        byPriority: byPriority.reduce(
          (acc, item) => {
            acc[item.priority] = item._count.id;
            return acc;
          },
          {} as Record<string, number>,
        ),
        byStatusBreakdown: byStatus.reduce(
          (acc, item) => {
            acc[item.status] = item._count.id;
            return acc;
          },
          {} as Record<string, number>,
        ),
        averageResponseTime: avgResponseTime, // in milliseconds
        resolutionRate: total > 0 ? (resolved / total) * 100 : 0,
      };
    } catch (error) {
      logger.error('Failed to get support statistics:', error);
      throw new ValidationError('Failed to retrieve support statistics');
    }
  }

  /**
   * Get agent performance metrics
   */
  static async getAgentPerformance(agentId: string, filters?: {
    startDate?: Date | string;
    endDate?: Date | string;
  }) {
    try {
      const where: Prisma.SocialMessageWhereInput = {
        assignedTo: agentId,
      };

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      const [
        totalAssigned,
        resolved,
        inProgress,
        responses,
      ] = await Promise.all([
        prisma.socialMessage.count({ where }),
        prisma.socialMessage.count({
          where: { ...where, status: SupportQueryStatus.RESOLVED },
        }),
        prisma.socialMessage.count({
          where: { ...where, status: SupportQueryStatus.IN_PROGRESS },
        }),
        prisma.supportResponse.count({
          where: {
            sentBy: agentId,
            ...(filters?.startDate || filters?.endDate
              ? {
                sentAt: {
                  ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
                  ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
                },
              }
              : {}),
          },
        }),
      ]);

      const resolvedQueries = await prisma.socialMessage.findMany({
        where: {
          ...where,
          status: SupportQueryStatus.RESOLVED,
          resolvedAt: { not: null },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
        },
      });

      const resolutionTimes = resolvedQueries
        .map((q) => {
          if (!q.resolvedAt) return null;
          return q.resolvedAt.getTime() - q.createdAt.getTime();
        })
        .filter((t): t is number => t !== null);

      const avgResolutionTime =
        resolutionTimes.length > 0
          ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
          : 0;

      return {
        agentId,
        totalAssigned,
        resolved,
        inProgress,
        totalResponses: responses,
        resolutionRate: totalAssigned > 0 ? (resolved / totalAssigned) * 100 : 0,
        averageResolutionTime: avgResolutionTime, // in milliseconds
      };
    } catch (error) {
      logger.error(`Failed to get agent performance for ${agentId}:`, error);
      throw new ValidationError('Failed to retrieve agent performance');
    }
  }
}

