import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors';
import { platformManager } from './social-media/platform-manager';
import { SocialMediaOAuthService } from './social-media/oauth.service';

export class SocialMediaService {
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
