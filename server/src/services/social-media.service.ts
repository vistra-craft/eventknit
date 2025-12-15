import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { platformManager } from './social-media/platform-manager';
import { SocialMediaOAuthService } from './social-media/oauth.service';

export class SocialMediaService {
  // ========== Social Accounts ==========

  static async connectAccount(data: {
    platform: string;
    accountId: string;
    accountName: string;
    accountHandle?: string;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: Date | string;
    metadata?: Record<string, unknown>;
  }) {
    try {
      const account = await prisma.socialAccount.upsert({
        where: {
          platform_accountId: {
            platform: data.platform as any,
            accountId: data.accountId,
          },
        },
        create: {
          platform: data.platform as any,
          accountId: data.accountId,
          accountName: data.accountName,
          accountHandle: data.accountHandle,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          tokenExpiry: data.tokenExpiry ? new Date(data.tokenExpiry) : undefined,
          metadata: data.metadata as any,
        },
        update: {
          accountName: data.accountName,
          accountHandle: data.accountHandle,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          tokenExpiry: data.tokenExpiry ? new Date(data.tokenExpiry) : undefined,
          metadata: data.metadata as any,
          isActive: true,
          lastSyncedAt: new Date(),
        },
      });

      return account;
    } catch (error) {
      logger.error('Error connecting social account:', error);
      throw error;
    }
  }

  static async getAccounts(filters?: { platform?: string; isActive?: boolean }) {
    try {
      const where: any = {};
      if (filters?.platform) {
        where.platform = filters.platform as any;
      }
      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      return await prisma.socialAccount.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error getting social accounts:', error);
      throw error;
    }
  }

  static async getAccountById(id: string) {
    try {
      const account = await prisma.socialAccount.findUnique({
        where: { id },
      });
      if (!account) {
        throw new NotFoundError('Social account not found');
      }
      return account;
    } catch (error) {
      logger.error('Error getting social account by id:', error);
      throw error;
    }
  }

  static async updateAccount(
    id: string,
    data: {
      accountName?: string;
      accountHandle?: string;
      accessToken?: string;
      refreshToken?: string;
      tokenExpiry?: Date | string;
      followers?: number;
      following?: number;
      isActive?: boolean;
      lastSyncedAt?: Date | string;
      metadata?: Record<string, unknown>;
    },
  ) {
    try {
      const account = await prisma.socialAccount.update({
        where: { id },
        data: {
          ...(data.accountName !== undefined && { accountName: data.accountName }),
          ...(data.accountHandle !== undefined && { accountHandle: data.accountHandle }),
          ...(data.accessToken !== undefined && { accessToken: data.accessToken }),
          ...(data.refreshToken !== undefined && { refreshToken: data.refreshToken }),
          ...(data.tokenExpiry !== undefined && {
            tokenExpiry: data.tokenExpiry ? new Date(data.tokenExpiry) : null,
          }),
          ...(data.followers !== undefined && { followers: data.followers }),
          ...(data.following !== undefined && { following: data.following }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.lastSyncedAt !== undefined && {
            lastSyncedAt: data.lastSyncedAt ? new Date(data.lastSyncedAt) : null,
          }),
          ...(data.metadata !== undefined && { metadata: data.metadata as any }),
        },
      });

      return account;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error updating social account:', error);
      throw error;
    }
  }

  static async disconnectAccount(id: string) {
    try {
      await prisma.socialAccount.update({
        where: { id },
        data: {
          isActive: false,
          accessToken: null,
          refreshToken: null,
          tokenExpiry: null,
        },
      });
    } catch (error) {
      logger.error('Error disconnecting social account:', error);
      throw error;
    }
  }

  /**
   * Create social media post
   */
  static async createPost(organizerId: string, data: {
    eventId?: string;
    platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin';
    content: string;
    mediaUrls?: string[];
    scheduledAt?: Date;
  }) {
    try {
      if (data.eventId) {
        const event = await prisma.event.findFirst({
          where: {
            id: data.eventId,
            organizerId,
            deletedAt: null,
          },
        });

        if (!event) {
          throw new NotFoundError('Event not found');
        }
      }

      const post = await prisma.socialMediaPost.create({
        data: {
          organizerId,
          eventId: data.eventId,
          platform: data.platform,
          content: data.content,
          mediaUrls: data.mediaUrls || [],
          scheduledAt: data.scheduledAt,
          status: data.scheduledAt ? 'scheduled' : 'draft',
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      return post;
    } catch (error) {
      logger.error('Error creating social media post:', error);
      throw error;
    }
  }

  /**
   * Get organizer's social media posts
   */
  static async getPosts(organizerId: string, filters?: {
    eventId?: string;
    platform?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const limit = filters?.limit || 20;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const where: any = {
        organizerId,
      };

      if (filters?.eventId) {
        where.eventId = filters.eventId;
      }

      if (filters?.platform) {
        where.platform = filters.platform;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      const [posts, total] = await Promise.all([
        prisma.socialMediaPost.findMany({
          where,
          include: {
            event: {
              select: {
                id: true,
                title: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.socialMediaPost.count({ where }),
      ]);

      return {
        posts,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting social media posts:', error);
      throw error;
    }
  }

  static async getPostById(id: string) {
    try {
      const post = await prisma.socialMediaPost.findUnique({
        where: { id },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              image: true,
            },
          },
        },
      });
      if (!post) {
        throw new NotFoundError('Social media post not found');
      }
      return post;
    } catch (error) {
      logger.error('Error getting social media post by id:', error);
      throw error;
    }
  }

  static async updatePost(
    id: string,
    data: {
      content?: string;
      mediaUrls?: string[];
      status?: string;
      scheduledAt?: Date | string;
      metadata?: Record<string, unknown>;
    },
  ) {
    try {
      const post = await prisma.socialMediaPost.update({
        where: { id },
        data: {
          ...(data.content !== undefined && { content: data.content }),
          ...(data.mediaUrls !== undefined && { mediaUrls: data.mediaUrls as any }),
          ...(data.status !== undefined && { status: data.status as any }),
          ...(data.scheduledAt !== undefined && {
            scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
          }),
          ...(data.metadata !== undefined && { metadata: data.metadata as any }),
        },
      });
      return post;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error updating social media post:', error);
      throw error;
    }
  }

  static async deletePost(id: string) {
    try {
      await prisma.socialMediaPost.delete({
        where: { id },
      });
    } catch (error) {
      logger.error('Error deleting social media post:', error);
      throw error;
    }
  }

  static async updatePostMetrics(
    id: string,
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
      const post = await prisma.socialMediaPost.findUnique({ where: { id } });
      if (!post) {
        throw new NotFoundError('Social media post not found');
      }

      const existing = await prisma.socialPostMetrics.findUnique({
        where: { postId: id },
      });

      const updatedMetrics = existing
        ? await prisma.socialPostMetrics.update({
          where: { postId: id },
          data: {
            ...(metrics.likes !== undefined && { likes: metrics.likes }),
            ...(metrics.comments !== undefined && { comments: metrics.comments }),
            ...(metrics.shares !== undefined && { shares: metrics.shares }),
            ...(metrics.views !== undefined && { views: metrics.views }),
            ...(metrics.clicks !== undefined && { clicks: metrics.clicks }),
            ...(metrics.reach !== undefined && { reach: metrics.reach }),
            ...(metrics.impressions !== undefined && { impressions: metrics.impressions }),
          },
        })
        : await prisma.socialPostMetrics.create({
          data: {
            postId: id,
            likes: metrics.likes ?? 0,
            comments: metrics.comments ?? 0,
            shares: metrics.shares ?? 0,
            views: metrics.views ?? 0,
            clicks: metrics.clicks ?? 0,
            reach: metrics.reach ?? 0,
            impressions: metrics.impressions ?? 0,
          },
        });

      return updatedMetrics;
    } catch (error) {
      logger.error('Error updating social media post metrics:', error);
      throw error;
    }
  }

  // ========== Social Messages (Support) ==========

  static async getMessages(filters: {
    socialAccountId?: string;
    platform?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    postId?: string;
    startDate?: Date | string;
    endDate?: Date | string;
  }) {
    try {
      const where: any = {};
      if (filters.socialAccountId) where.socialAccountId = filters.socialAccountId;
      if (filters.platform) where.platform = filters.platform as any;
      if (filters.status) where.status = filters.status as any;
      if (filters.priority) where.priority = filters.priority as any;
      if (filters.assignedTo) where.assignedTo = filters.assignedTo;
      if (filters.postId) where.postId = filters.postId;
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
        if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
      }

      return await prisma.socialMessage.findMany({
        where,
        include: {
          socialPost: true,
          assignedAgent: true,
          _count: {
            select: { responses: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error getting social messages:', error);
      throw error;
    }
  }

  static async getMessageById(id: string) {
    try {
      const message = await prisma.socialMessage.findUnique({
        where: { id },
        include: {
          socialPost: true,
          assignedAgent: true,
          responses: true,
        },
      });
      if (!message) {
        throw new NotFoundError('Support message not found');
      }
      return message;
    } catch (error) {
      logger.error('Error getting social message by id:', error);
      throw error;
    }
  }

  static async assignMessage(id: string, agentId: string) {
    try {
      const message = await prisma.socialMessage.update({
        where: { id },
        data: {
          assignedTo: agentId,
          assignedAt: new Date(),
        },
        include: {
          assignedAgent: true,
        },
      });
      return message;
    } catch (error) {
      logger.error('Error assigning social message:', error);
      throw error;
    }
  }

  static async updateMessageStatus(id: string, status: any, updatedBy: string) {
    try {
      const message = await prisma.socialMessage.update({
        where: { id },
        data: {
          status,
          resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
          assignedTo: updatedBy,
        },
      });
      return message;
    } catch (error) {
      logger.error('Error updating social message status:', error);
      throw error;
    }
  }

  static async addResponse(
    messageId: string,
    response: string,
    agentId: string,
    isInternal: boolean = false,
  ) {
    try {
      const created = await prisma.supportResponse.create({
        data: {
          messageId,
          response,
          sentBy: agentId,
          isInternal,
        },
      });
      return created;
    } catch (error) {
      logger.error('Error adding support response:', error);
      throw error;
    }
  }

  /**
   * Post to social media using platform adapter
   */
  static async publishPost(postId: string, organizerId: string, socialAccountId?: string) {
    try {
      const post = await prisma.socialMediaPost.findFirst({
        where: {
          id: postId,
          organizerId,
        },
      });

      if (!post) {
        throw new NotFoundError('Social media post not found');
      }

      if (post.status === 'posted') {
        throw new ValidationError('Post has already been published');
      }

      // Get platform adapter
      const platformAdapter = platformManager.getPlatform(post.platform);
      if (!platformAdapter) {
        throw new ValidationError(`Platform ${post.platform} is not available or not configured`);
      }

      // Get social account for access token
      let accessToken: string;
      if (socialAccountId) {
        // Use provided account
        accessToken = await SocialMediaOAuthService.ensureValidToken(socialAccountId);
      } else {
        // Find organizer's connected account for this platform
        const account = await prisma.socialAccount.findFirst({
          where: {
            platform: post.platform.toUpperCase() as any,
            isActive: true,
          },
        });

        if (!account || !account.accessToken) {
          throw new ValidationError(`No active account connected for platform ${post.platform}`);
        }

        accessToken = await SocialMediaOAuthService.ensureValidToken(account.id);
      }

      // Prepare post data
      const postData = {
        content: post.content,
        mediaUrls: post.mediaUrls || [],
        link: post.eventId ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/events/${post.eventId}` : undefined,
      };

      // Create post via platform adapter
      const response = await platformAdapter.createPost(accessToken, postData);

      // Update post with response
      const updated = await prisma.socialMediaPost.update({
        where: { id: postId },
        data: {
          status: 'posted',
          postedAt: response.publishedAt,
          externalPostId: response.postId,
        },
      });

      logger.info(`Published post ${postId} to ${post.platform}: ${response.postId}`);
      return updated;
    } catch (error) {
      logger.error('Error publishing social media post:', error);
      // Update status to failed
      await prisma.socialMediaPost.update({
        where: { id: postId },
        data: { status: 'failed' },
      }).catch(() => {});
      throw error;
    }
  }

  /**
   * Create social media calendar
   */
  static async createCalendar(organizerId: string, data: {
    name: string;
    description?: string;
    autoPostEnabled?: boolean;
    platforms?: string[];
  }) {
    try {
      const calendar = await prisma.socialMediaCalendar.create({
        data: {
          organizerId,
          name: data.name,
          description: data.description,
          autoPostEnabled: data.autoPostEnabled || false,
          platforms: data.platforms || [],
        },
      });

      return calendar;
    } catch (error) {
      logger.error('Error creating social media calendar:', error);
      throw error;
    }
  }

  /**
   * Get social media calendars
   */
  static async getCalendars(organizerId: string) {
    try {
      const calendars = await prisma.socialMediaCalendar.findMany({
        where: { organizerId },
        orderBy: { createdAt: 'desc' },
      });

      return calendars;
    } catch (error) {
      logger.error('Error getting social media calendars:', error);
      throw error;
    }
  }

  /**
   * Get social media analytics
   */
  static async getSocialMediaAnalytics(organizerId: string, filters?: {
    eventId?: string;
    platform?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const where: any = {
        organizerId,
        status: 'posted',
      };

      if (filters?.eventId) {
        where.eventId = filters.eventId;
      }

      if (filters?.platform) {
        where.platform = filters.platform;
      }

      if (filters?.startDate || filters?.endDate) {
        where.postedAt = {};
        if (filters.startDate) {
          where.postedAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.postedAt.lte = filters.endDate;
        }
      }

      const posts = await prisma.socialMediaPost.findMany({
        where,
        select: {
          platform: true,
          impressions: true,
          likes: true,
          shares: true,
          comments: true,
          clicks: true,
        },
      });

      // Aggregate by platform
      const byPlatform = posts.reduce((acc: any, post) => {
        if (!acc[post.platform]) {
          acc[post.platform] = {
            platform: post.platform,
            posts: 0,
            impressions: 0,
            likes: 0,
            shares: 0,
            comments: 0,
            clicks: 0,
          };
        }
        acc[post.platform].posts++;
        acc[post.platform].impressions += post.impressions;
        acc[post.platform].likes += post.likes;
        acc[post.platform].shares += post.shares;
        acc[post.platform].comments += post.comments;
        acc[post.platform].clicks += post.clicks;
        return acc;
      }, {});

      const total = {
        posts: posts.length,
        impressions: posts.reduce((sum, p) => sum + p.impressions, 0),
        likes: posts.reduce((sum, p) => sum + p.likes, 0),
        shares: posts.reduce((sum, p) => sum + p.shares, 0),
        comments: posts.reduce((sum, p) => sum + p.comments, 0),
        clicks: posts.reduce((sum, p) => sum + p.clicks, 0),
      };

      return {
        byPlatform: Object.values(byPlatform),
        total,
      };
    } catch (error) {
      logger.error('Error getting social media analytics:', error);
      throw error;
    }
  }

  /**
   * Update post analytics (called by webhook from social media platforms)
   */
  static async updatePostAnalytics(postId: string, data: {
    impressions?: number;
    likes?: number;
    shares?: number;
    comments?: number;
    clicks?: number;
  }) {
    try {
      const updateData: any = {};
      if (data.impressions !== undefined) updateData.impressions = data.impressions;
      if (data.likes !== undefined) updateData.likes = data.likes;
      if (data.shares !== undefined) updateData.shares = data.shares;
      if (data.comments !== undefined) updateData.comments = data.comments;
      if (data.clicks !== undefined) updateData.clicks = data.clicks;

      await prisma.socialMediaPost.update({
        where: { id: postId },
        data: updateData,
      });

      return { success: true };
    } catch (error) {
      logger.error('Error updating post analytics:', error);
      return { success: false };
    }
  }
}
