import { prisma } from '../config/database.js';
import {
  SocialPlatform,
  PostStatus,
  MessageType,
  SupportQueryStatus,
  SupportPriority,
  Prisma,
} from '@prisma/client';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface CreateSocialAccountData {
  platform: SocialPlatform;
  accountId: string;
  accountName: string;
  accountHandle?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date | string;
  metadata?: Record<string, unknown>;
}

export interface UpdateSocialAccountData {
  accountName?: string;
  accountHandle?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date | string | null;
  followers?: number;
  following?: number;
  isActive?: boolean;
  lastSyncedAt?: Date | string;
  metadata?: Record<string, unknown>;
}

export interface CreateSocialPostData {
  socialAccountId: string;
  platform: SocialPlatform;
  content?: string;
  mediaUrls?: string[];
  status?: PostStatus;
  scheduledAt?: Date | string;
  campaignId?: string;
  createdBy?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateSocialPostData {
  content?: string;
  mediaUrls?: string[];
  status?: PostStatus;
  scheduledAt?: Date | string | null;
  publishedAt?: Date | string;
  postId?: string; // Platform-specific post ID after publishing
  metadata?: Record<string, unknown>;
}

export interface CreateSocialMessageData {
  socialAccountId: string;
  platform: SocialPlatform;
  messageId: string;
  senderId: string;
  senderName: string;
  senderHandle?: string;
  senderEmail?: string;
  message: string;
  messageType: MessageType;
  postId?: string;
  priority?: SupportPriority;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface SocialPostFilters {
  socialAccountId?: string;
  platform?: SocialPlatform;
  status?: PostStatus;
  campaignId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface SocialMessageFilters {
  socialAccountId?: string;
  platform?: SocialPlatform;
  status?: SupportQueryStatus;
  priority?: SupportPriority;
  assignedTo?: string;
  postId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}

export class SocialMediaService {
  /**
   * Create or update social media account
   */
  static async connectAccount(data: CreateSocialAccountData) {
    try {
      // Check if account already exists
      const existing = await prisma.socialAccount.findUnique({
        where: {
          platform_accountId: {
            platform: data.platform,
            accountId: data.accountId,
          },
        },
      });

      if (existing) {
        // Update existing account
        return await this.updateAccount(existing.id, {
          accountName: data.accountName,
          accountHandle: data.accountHandle,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          tokenExpiry: data.tokenExpiry ? new Date(data.tokenExpiry) : undefined,
          metadata: data.metadata,
          isActive: true,
        });
      }

      // Create new account
      const account = await prisma.socialAccount.create({
        data: {
          platform: data.platform,
          accountId: data.accountId,
          accountName: data.accountName,
          accountHandle: data.accountHandle,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          tokenExpiry: data.tokenExpiry ? new Date(data.tokenExpiry) : undefined,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
        },
      });

      logger.info(`Social account connected: ${account.id} (${data.platform})`);
      return account;
    } catch (error) {
      logger.error('Failed to connect social account:', error);
      throw new ValidationError('Failed to connect social account');
    }
  }

  /**
   * Get social media accounts
   */
  static async getAccounts(filters?: { platform?: SocialPlatform; isActive?: boolean }) {
    try {
      const where: Prisma.SocialAccountWhereInput = {};
      if (filters?.platform) {
        where.platform = filters.platform;
      }
      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      const accounts = await prisma.socialAccount.findMany({
        where,
        orderBy: { connectedAt: 'desc' },
        include: {
          _count: {
            select: {
              posts: true,
              messages: true,
            },
          },
        },
      });

      return accounts;
    } catch (error) {
      logger.error('Failed to get social accounts:', error);
      throw new ValidationError('Failed to retrieve social accounts');
    }
  }

  /**
   * Get social account by ID
   */
  static async getAccountById(accountId: string) {
    try {
      const account = await prisma.socialAccount.findUnique({
        where: { id: accountId },
        include: {
          _count: {
            select: {
              posts: true,
              messages: true,
            },
          },
        },
      });

      if (!account) {
        throw new NotFoundError('Social account not found');
      }

      return account;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Failed to get social account ${accountId}:`, error);
      throw new ValidationError('Failed to retrieve social account');
    }
  }

  /**
   * Update social account
   */
  static async updateAccount(accountId: string, data: UpdateSocialAccountData) {
    try {
      const account = await prisma.socialAccount.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        throw new NotFoundError('Social account not found');
      }

      const updateData: Prisma.SocialAccountUpdateInput = {};
      if (data.accountName !== undefined) updateData.accountName = data.accountName;
      if (data.accountHandle !== undefined) updateData.accountHandle = data.accountHandle;
      if (data.accessToken !== undefined) updateData.accessToken = data.accessToken;
      if (data.refreshToken !== undefined) updateData.refreshToken = data.refreshToken;
      if (data.tokenExpiry !== undefined) {
        updateData.tokenExpiry = data.tokenExpiry ? new Date(data.tokenExpiry) : null;
      }
      if (data.followers !== undefined) updateData.followers = data.followers;
      if (data.following !== undefined) updateData.following = data.following;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.lastSyncedAt !== undefined) {
        updateData.lastSyncedAt = data.lastSyncedAt ? new Date(data.lastSyncedAt) : null;
      }
      if (data.metadata !== undefined) {
        updateData.metadata = data.metadata ? (data.metadata as Prisma.InputJsonValue) : Prisma.JsonNull;
      }

      const updated = await prisma.socialAccount.update({
        where: { id: accountId },
        data: updateData,
      });

      logger.info(`Social account updated: ${accountId}`);
      return updated;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Failed to update social account ${accountId}:`, error);
      throw new ValidationError('Failed to update social account');
    }
  }

  /**
   * Disconnect social account
   */
  static async disconnectAccount(accountId: string) {
    try {
      const account = await prisma.socialAccount.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        throw new NotFoundError('Social account not found');
      }

      // Soft delete by setting isActive to false and clearing tokens
      const updated = await prisma.socialAccount.update({
        where: { id: accountId },
        data: {
          isActive: false,
          accessToken: null,
          refreshToken: null,
          tokenExpiry: null,
        },
      });

      logger.info(`Social account disconnected: ${accountId}`);
      return updated;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Failed to disconnect social account ${accountId}:`, error);
      throw new ValidationError('Failed to disconnect social account');
    }
  }

  /**
   * Create social media post
   */
  static async createPost(data: CreateSocialPostData) {
    try {
      // Verify account exists
      const account = await prisma.socialAccount.findUnique({
        where: { id: data.socialAccountId },
      });

      if (!account) {
        throw new NotFoundError('Social account not found');
      }

      if (account.platform !== data.platform) {
        throw new ValidationError('Platform mismatch between account and post');
      }

      const post = await prisma.socialPost.create({
        data: {
          socialAccountId: data.socialAccountId,
          platform: data.platform,
          content: data.content,
          mediaUrls: data.mediaUrls ? (data.mediaUrls as Prisma.InputJsonValue) : undefined,
          status: data.status ?? PostStatus.DRAFT,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
          campaignId: data.campaignId,
          createdBy: data.createdBy,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
        },
        include: {
          socialAccount: {
            select: {
              id: true,
              accountName: true,
              platform: true,
            },
          },
        },
      });

      logger.info(`Social post created: ${post.id} (${data.platform})`);
      return post;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Failed to create social post:', error);
      throw new ValidationError('Failed to create social post');
    }
  }

  /**
   * Get social posts
   */
  static async getPosts(filters?: SocialPostFilters) {
    try {
      const where: Prisma.SocialPostWhereInput = {};

      if (filters?.socialAccountId) {
        where.socialAccountId = filters.socialAccountId;
      }

      if (filters?.platform) {
        where.platform = filters.platform;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.campaignId) {
        where.campaignId = filters.campaignId;
      }

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      const posts = await prisma.socialPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          socialAccount: {
            select: {
              id: true,
              accountName: true,
              platform: true,
            },
          },
          metrics: true,
          _count: {
            select: {
              relatedMessages: true,
            },
          },
        },
      });

      return posts;
    } catch (error) {
      logger.error('Failed to get social posts:', error);
      throw new ValidationError('Failed to retrieve social posts');
    }
  }

  /**
   * Get social post by ID
   */
  static async getPostById(postId: string) {
    try {
      const post = await prisma.socialPost.findUnique({
        where: { id: postId },
        include: {
          socialAccount: {
            select: {
              id: true,
              accountName: true,
              platform: true,
            },
          },
          metrics: true,
          relatedMessages: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!post) {
        throw new NotFoundError('Social post not found');
      }

      return post;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Failed to get social post ${postId}:`, error);
      throw new ValidationError('Failed to retrieve social post');
    }
  }

  /**
   * Update social post
   */
  static async updatePost(postId: string, data: UpdateSocialPostData) {
    try {
      const post = await prisma.socialPost.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new NotFoundError('Social post not found');
      }

      // Cannot update published posts
      if (post.status === PostStatus.PUBLISHED && data.status !== PostStatus.PUBLISHED) {
        throw new ValidationError('Cannot change status of published post');
      }

      const updateData: Prisma.SocialPostUpdateInput = {};
      if (data.content !== undefined) updateData.content = data.content;
      if (data.mediaUrls !== undefined) {
        updateData.mediaUrls = data.mediaUrls as Prisma.InputJsonValue;
      }
      if (data.status !== undefined) updateData.status = data.status;
      if (data.scheduledAt !== undefined) {
        updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
      }
      if (data.publishedAt !== undefined) {
        updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
      }
      if (data.postId !== undefined) updateData.postId = data.postId;
      if (data.metadata !== undefined) {
        updateData.metadata = data.metadata as Prisma.InputJsonValue;
      }

      const updated = await prisma.socialPost.update({
        where: { id: postId },
        data: updateData,
        include: {
          socialAccount: {
            select: {
              id: true,
              accountName: true,
              platform: true,
            },
          },
          metrics: true,
        },
      });

      logger.info(`Social post updated: ${postId}`);
      return updated;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error(`Failed to update social post ${postId}:`, error);
      throw new ValidationError('Failed to update social post');
    }
  }

  /**
   * Delete social post
   */
  static async deletePost(postId: string) {
    try {
      const post = await prisma.socialPost.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new NotFoundError('Social post not found');
      }

      // Cannot delete published posts (should be archived instead)
      if (post.status === PostStatus.PUBLISHED) {
        throw new ValidationError('Cannot delete published post. Archive it instead.');
      }

      await prisma.socialPost.delete({
        where: { id: postId },
      });

      logger.info(`Social post deleted: ${postId}`);
      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error(`Failed to delete social post ${postId}:`, error);
      throw new ValidationError('Failed to delete social post');
    }
  }

  /**
   * Update post metrics
   */
  static async updatePostMetrics(
    postId: string,
    metrics: {
      likes?: number;
      comments?: number;
      shares?: number;
      views?: number;
      clicks?: number;
      reach?: number;
      impressions?: number;
    },
  ) {
    try {
      const post = await prisma.socialPost.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new NotFoundError('Social post not found');
      }

      // Get or create metrics
      let postMetrics = await prisma.socialPostMetrics.findUnique({
        where: { postId },
      });

      if (!postMetrics) {
        postMetrics = await prisma.socialPostMetrics.create({
          data: {
            postId,
            likes: metrics.likes ?? 0,
            comments: metrics.comments ?? 0,
            shares: metrics.shares ?? 0,
            views: metrics.views ?? 0,
            clicks: metrics.clicks ?? 0,
            reach: metrics.reach ?? 0,
            impressions: metrics.impressions ?? 0,
          },
        });
      } else {
        const updateData: Prisma.SocialPostMetricsUpdateInput = {};
        if (metrics.likes !== undefined) updateData.likes = metrics.likes;
        if (metrics.comments !== undefined) updateData.comments = metrics.comments;
        if (metrics.shares !== undefined) updateData.shares = metrics.shares;
        if (metrics.views !== undefined) updateData.views = metrics.views;
        if (metrics.clicks !== undefined) updateData.clicks = metrics.clicks;
        if (metrics.reach !== undefined) updateData.reach = metrics.reach;
        if (metrics.impressions !== undefined) updateData.impressions = metrics.impressions;

        // Calculate engagement rate
        const reach = metrics.reach ?? postMetrics.reach;
        const totalEngagement =
          (metrics.likes ?? postMetrics.likes) +
          (metrics.comments ?? postMetrics.comments) +
          (metrics.shares ?? postMetrics.shares);

        if (reach > 0) {
          updateData.engagementRate = totalEngagement / reach;
        }

        postMetrics = await prisma.socialPostMetrics.update({
          where: { postId },
          data: updateData,
        });
      }

      return postMetrics;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Failed to update post metrics for ${postId}:`, error);
      throw new ValidationError('Failed to update post metrics');
    }
  }

  /**
   * Create social message (support query from social platform)
   */
  static async createMessage(data: CreateSocialMessageData) {
    try {
      // Verify account exists
      const account = await prisma.socialAccount.findUnique({
        where: { id: data.socialAccountId },
      });

      if (!account) {
        throw new NotFoundError('Social account not found');
      }

      if (account.platform !== data.platform) {
        throw new ValidationError('Platform mismatch between account and message');
      }

      // Check if message already exists
      const existing = await prisma.socialMessage.findUnique({
        where: {
          platform_messageId: {
            platform: data.platform,
            messageId: data.messageId,
          },
        },
      });

      if (existing) {
        // Update existing message if needed
        return existing;
      }

      // Verify post exists if postId provided
      if (data.postId) {
        const post = await prisma.socialPost.findUnique({
          where: { id: data.postId },
        });

        if (!post) {
          throw new NotFoundError('Related post not found');
        }
      }

      const message = await prisma.socialMessage.create({
        data: {
          socialAccountId: data.socialAccountId,
          platform: data.platform,
          messageId: data.messageId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderHandle: data.senderHandle,
          senderEmail: data.senderEmail,
          message: data.message,
          messageType: data.messageType,
          postId: data.postId,
          priority: data.priority ?? SupportPriority.MEDIUM,
          category: data.category,
          status: SupportQueryStatus.NEW,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
        },
        include: {
          socialAccount: {
            select: {
              id: true,
              accountName: true,
              platform: true,
            },
          },
          socialPost: {
            select: {
              id: true,
              content: true,
              platform: true,
            },
          },
        },
      });

      logger.info(`Social message created: ${message.id} (${data.platform})`);
      return message;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Failed to create social message:', error);
      throw new ValidationError('Failed to create social message');
    }
  }

  /**
   * Get social messages (support queries)
   */
  static async getMessages(filters?: SocialMessageFilters) {
    try {
      const where: Prisma.SocialMessageWhereInput = {};

      if (filters?.socialAccountId) {
        where.socialAccountId = filters.socialAccountId;
      }

      if (filters?.platform) {
        where.platform = filters.platform;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.priority) {
        where.priority = filters.priority;
      }

      if (filters?.assignedTo) {
        where.assignedTo = filters.assignedTo;
      }

      if (filters?.postId) {
        where.postId = filters.postId;
      }

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      const messages = await prisma.socialMessage.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          socialAccount: {
            select: {
              id: true,
              accountName: true,
              platform: true,
            },
          },
          socialPost: {
            select: {
              id: true,
              content: true,
              platform: true,
            },
          },
          assignedAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              responses: true,
            },
          },
        },
      });

      return messages;
    } catch (error) {
      logger.error('Failed to get social messages:', error);
      throw new ValidationError('Failed to retrieve social messages');
    }
  }

  /**
   * Get social message by ID
   */
  static async getMessageById(messageId: string) {
    try {
      const message = await prisma.socialMessage.findUnique({
        where: { id: messageId },
        include: {
          socialAccount: {
            select: {
              id: true,
              accountName: true,
              platform: true,
            },
          },
          socialPost: {
            select: {
              id: true,
              content: true,
              platform: true,
              publishedAt: true,
            },
          },
          assignedAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          responses: {
            orderBy: { sentAt: 'asc' },
            include: {
              agent: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!message) {
        throw new NotFoundError('Social message not found');
      }

      return message;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Failed to get social message ${messageId}:`, error);
      throw new ValidationError('Failed to retrieve social message');
    }
  }

  /**
   * Assign message to agent
   */
  static async assignMessage(messageId: string, agentId: string) {
    try {
      const message = await prisma.socialMessage.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new NotFoundError('Social message not found');
      }

      // Verify agent exists and has support role
      const agent = await prisma.user.findUnique({
        where: { id: agentId },
        select: {
          id: true,
          role: true,
        },
      });

      if (!agent) {
        throw new NotFoundError('Agent not found');
      }

      // Check if agent has support role
      const supportRoles = ['SUPPORT', 'ADMIN_STAFF', 'SUPERADMIN'];
      if (!supportRoles.includes(agent.role)) {
        throw new AuthorizationError('User does not have support role');
      }

      const updated = await prisma.socialMessage.update({
        where: { id: messageId },
        data: {
          assignedTo: agentId,
          assignedAt: new Date(),
          status:
            message.status === SupportQueryStatus.NEW
              ? SupportQueryStatus.IN_PROGRESS
              : message.status,
        },
        include: {
          assignedAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      logger.info(`Social message ${messageId} assigned to agent ${agentId}`);
      return updated;
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ValidationError ||
        error instanceof AuthorizationError
      ) {
        throw error;
      }
      logger.error(`Failed to assign message ${messageId}:`, error);
      throw new ValidationError('Failed to assign message');
    }
  }

  /**
   * Update message status
   */
  static async updateMessageStatus(
    messageId: string,
    status: SupportQueryStatus,
    _resolvedBy?: string,
  ) {
    try {
      const message = await prisma.socialMessage.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new NotFoundError('Social message not found');
      }

      const updateData: Prisma.SocialMessageUpdateInput = {
        status,
      };

      if (status === SupportQueryStatus.RESOLVED && !message.resolvedAt) {
        updateData.resolvedAt = new Date();
      }

      const updated = await prisma.socialMessage.update({
        where: { id: messageId },
        data: updateData,
      });

      logger.info(`Social message ${messageId} status updated to ${status}`);
      return updated;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Failed to update message status ${messageId}:`, error);
      throw new ValidationError('Failed to update message status');
    }
  }

  /**
   * Add response to message
   */
  static async addResponse(
    messageId: string,
    response: string,
    agentId: string,
    isInternal: boolean = false,
  ) {
    try {
      const message = await prisma.socialMessage.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new NotFoundError('Social message not found');
      }

      // Verify agent exists
      const agent = await prisma.user.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        throw new NotFoundError('Agent not found');
      }

      const supportResponse = await prisma.supportResponse.create({
        data: {
          messageId,
          response,
          sentBy: agentId,
          isInternal,
        },
        include: {
          agent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Update message status if not internal
      if (!isInternal && message.status === SupportQueryStatus.NEW) {
        await prisma.socialMessage.update({
          where: { id: messageId },
          data: { status: SupportQueryStatus.IN_PROGRESS },
        });
      }

      logger.info(`Response added to message ${messageId} by agent ${agentId}`);
      return supportResponse;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Failed to add response to message ${messageId}:`, error);
      throw new ValidationError('Failed to add response');
    }
  }
}

