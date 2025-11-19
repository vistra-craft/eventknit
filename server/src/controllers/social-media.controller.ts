import { Response, NextFunction } from 'express';
import { SocialMediaService } from '../services/social-media.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ValidationError } from '../utils/errors.js';
import {
  SocialPlatform,
  PostStatus,
  SupportQueryStatus,
  SupportPriority,
} from '@prisma/client';

export class SocialMediaController {
  /**
   * Connect social media account
   * POST /api/v1/admin/social-media/accounts
   */
  static async connectAccount(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const {
        platform,
        accountId,
        accountName,
        accountHandle,
        accessToken,
        refreshToken,
        tokenExpiry,
        metadata,
      } = req.body;

      if (!platform || !Object.values(SocialPlatform).includes(platform)) {
        throw new ValidationError(
          `Invalid platform. Must be one of: ${Object.values(SocialPlatform).join(', ')}`,
        );
      }

      if (!accountId || typeof accountId !== 'string') {
        throw new ValidationError('Account ID is required');
      }

      if (!accountName || typeof accountName !== 'string') {
        throw new ValidationError('Account name is required');
      }

      const account = await SocialMediaService.connectAccount({
        platform,
        accountId,
        accountName,
        accountHandle,
        accessToken,
        refreshToken,
        tokenExpiry,
        metadata,
      });

      res.status(201).json({
        success: true,
        message: 'Social account connected successfully',
        data: { account },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get social media accounts
   * GET /api/v1/admin/social-media/accounts
   */
  static async getAccounts(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { platform, isActive } = req.query;

      const filters: { platform?: SocialPlatform; isActive?: boolean } = {};
      if (platform && Object.values(SocialPlatform).includes(platform as SocialPlatform)) {
        filters.platform = platform as SocialPlatform;
      }
      if (isActive !== undefined) {
        filters.isActive = isActive === 'true';
      }

      const accounts = await SocialMediaService.getAccounts(filters);

      res.status(200).json({
        success: true,
        data: { accounts },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get social account by ID
   * GET /api/v1/admin/social-media/accounts/:id
   */
  static async getAccountById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;
      const account = await SocialMediaService.getAccountById(id);

      res.status(200).json({
        success: true,
        data: { account },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update social account
   * PUT /api/v1/admin/social-media/accounts/:id
   */
  static async updateAccount(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;
      const {
        accountName,
        accountHandle,
        accessToken,
        refreshToken,
        tokenExpiry,
        followers,
        following,
        isActive,
        lastSyncedAt,
        metadata,
      } = req.body;

      const account = await SocialMediaService.updateAccount(id, {
        accountName,
        accountHandle,
        accessToken,
        refreshToken,
        tokenExpiry,
        followers,
        following,
        isActive,
        lastSyncedAt,
        metadata,
      });

      res.status(200).json({
        success: true,
        message: 'Social account updated successfully',
        data: { account },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disconnect social account
   * DELETE /api/v1/admin/social-media/accounts/:id
   */
  static async disconnectAccount(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;
      await SocialMediaService.disconnectAccount(id);

      res.status(200).json({
        success: true,
        message: 'Social account disconnected successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create social post
   * POST /api/v1/admin/social-media/posts
   */
  static async createPost(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const {
        socialAccountId,
        platform,
        content,
        mediaUrls,
        status,
        scheduledAt,
        campaignId,
        metadata,
      } = req.body;

      if (!socialAccountId || typeof socialAccountId !== 'string') {
        throw new ValidationError('Social account ID is required');
      }

      if (!platform || !Object.values(SocialPlatform).includes(platform)) {
        throw new ValidationError(
          `Invalid platform. Must be one of: ${Object.values(SocialPlatform).join(', ')}`,
        );
      }

      if (!content && (!mediaUrls || mediaUrls.length === 0)) {
        throw new ValidationError('Post must have content or media');
      }

      const post = await SocialMediaService.createPost({
        socialAccountId,
        platform,
        content,
        mediaUrls,
        status,
        scheduledAt,
        campaignId,
        createdBy: req.user.id,
        metadata,
      });

      res.status(201).json({
        success: true,
        message: 'Social post created successfully',
        data: { post },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get social posts
   * GET /api/v1/admin/social-media/posts
   */
  static async getPosts(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const {
        socialAccountId,
        platform,
        status,
        campaignId,
        startDate,
        endDate,
      } = req.query;

      const filters: {
        socialAccountId?: string;
        platform?: SocialPlatform;
        status?: PostStatus;
        campaignId?: string;
        startDate?: Date | string;
        endDate?: Date | string;
      } = {};

      if (socialAccountId) filters.socialAccountId = socialAccountId as string;
      if (platform && Object.values(SocialPlatform).includes(platform as SocialPlatform)) {
        filters.platform = platform as SocialPlatform;
      }
      if (status && Object.values(PostStatus).includes(status as PostStatus)) {
        filters.status = status as PostStatus;
      }
      if (campaignId) filters.campaignId = campaignId as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const posts = await SocialMediaService.getPosts(filters);

      res.status(200).json({
        success: true,
        data: { posts },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get social post by ID
   * GET /api/v1/admin/social-media/posts/:id
   */
  static async getPostById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;
      const post = await SocialMediaService.getPostById(id);

      res.status(200).json({
        success: true,
        data: { post },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update social post
   * PUT /api/v1/admin/social-media/posts/:id
   */
  static async updatePost(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;
      const {
        content,
        mediaUrls,
        status,
        scheduledAt,
        publishedAt,
        postId,
        metadata,
      } = req.body;

      const post = await SocialMediaService.updatePost(id, {
        content,
        mediaUrls,
        status,
        scheduledAt,
        publishedAt,
        postId,
        metadata,
      });

      res.status(200).json({
        success: true,
        message: 'Social post updated successfully',
        data: { post },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete social post
   * DELETE /api/v1/admin/social-media/posts/:id
   */
  static async deletePost(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;
      await SocialMediaService.deletePost(id);

      res.status(200).json({
        success: true,
        message: 'Social post deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update post metrics
   * PATCH /api/v1/admin/social-media/posts/:id/metrics
   */
  static async updatePostMetrics(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;
      const { likes, comments, shares, views, clicks, reach, impressions } = req.body;

      const metrics = await SocialMediaService.updatePostMetrics(id, {
        likes,
        comments,
        shares,
        views,
        clicks,
        reach,
        impressions,
      });

      res.status(200).json({
        success: true,
        message: 'Post metrics updated successfully',
        data: { metrics },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get social messages (support queries)
   * GET /api/v1/admin/social-media/messages
   */
  static async getMessages(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const {
        socialAccountId,
        platform,
        status,
        priority,
        assignedTo,
        postId,
        startDate,
        endDate,
      } = req.query;

      const filters: {
        socialAccountId?: string;
        platform?: SocialPlatform;
        status?: SupportQueryStatus;
        priority?: SupportPriority;
        assignedTo?: string;
        postId?: string;
        startDate?: Date | string;
        endDate?: Date | string;
      } = {};

      if (socialAccountId) filters.socialAccountId = socialAccountId as string;
      if (platform && Object.values(SocialPlatform).includes(platform as SocialPlatform)) {
        filters.platform = platform as SocialPlatform;
      }
      if (status && Object.values(SupportQueryStatus).includes(status as SupportQueryStatus)) {
        filters.status = status as SupportQueryStatus;
      }
      if (priority && Object.values(SupportPriority).includes(priority as SupportPriority)) {
        filters.priority = priority as SupportPriority;
      }
      if (assignedTo) filters.assignedTo = assignedTo as string;
      if (postId) filters.postId = postId as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const messages = await SocialMediaService.getMessages(filters);

      res.status(200).json({
        success: true,
        data: { messages },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get social message by ID
   * GET /api/v1/admin/social-media/messages/:id
   */
  static async getMessageById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;
      const message = await SocialMediaService.getMessageById(id);

      res.status(200).json({
        success: true,
        data: { message },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign message to agent
   * POST /api/v1/admin/social-media/messages/:id/assign
   */
  static async assignMessage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;
      const { agentId } = req.body;

      if (!agentId || typeof agentId !== 'string') {
        throw new ValidationError('Agent ID is required');
      }

      const message = await SocialMediaService.assignMessage(id, agentId);

      res.status(200).json({
        success: true,
        message: 'Message assigned successfully',
        data: { message },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update message status
   * PATCH /api/v1/admin/social-media/messages/:id/status
   */
  static async updateMessageStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!status || !Object.values(SupportQueryStatus).includes(status)) {
        throw new ValidationError(
          `Invalid status. Must be one of: ${Object.values(SupportQueryStatus).join(', ')}`,
        );
      }

      const message = await SocialMediaService.updateMessageStatus(id, status, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Message status updated successfully',
        data: { message },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add response to message
   * POST /api/v1/admin/social-media/messages/:id/responses
   */
  static async addResponse(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;
      const { response, isInternal } = req.body;

      if (!response || typeof response !== 'string') {
        throw new ValidationError('Response text is required');
      }

      const supportResponse = await SocialMediaService.addResponse(
        id,
        response,
        req.user.id,
        isInternal ?? false,
      );

      res.status(201).json({
        success: true,
        message: 'Response added successfully',
        data: { response: supportResponse },
      });
    } catch (error) {
      next(error);
    }
  }
}

