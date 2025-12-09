/**
 * Scheduled Posts Service
 * 
 * Handles background processing of scheduled social media posts
 */

import { prisma } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import { SocialMediaService } from '../social-media.service';

export class ScheduledPostsService {
  /**
   * Process scheduled posts that are due
   * This should be called by a cron job or background worker
   */
  static async processScheduledPosts() {
    try {
      const now = new Date();
      
      // Find posts scheduled for now or in the past that are still in 'scheduled' status
      const scheduledPosts = await prisma.socialMediaPost.findMany({
        where: {
          status: 'scheduled',
          scheduledAt: {
            lte: now,
          },
        },
        include: {
          organizer: {
            select: {
              id: true,
            },
          },
        },
        take: 50, // Process in batches
      });

      logger.info(`Processing ${scheduledPosts.length} scheduled posts`);

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const post of scheduledPosts) {
        try {
          await SocialMediaService.publishPost(post.id, post.organizerId);
          results.success++;
          logger.info(`Successfully published scheduled post: ${post.id}`);
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Post ${post.id}: ${error.message}`);
          logger.error(`Failed to publish scheduled post ${post.id}:`, error);
        }
      }

      return results;
    } catch (error) {
      logger.error('Error processing scheduled posts:', error);
      throw error;
    }
  }

  /**
   * Schedule a post for future publishing
   */
  static async schedulePost(
    postId: string,
    scheduledAt: Date,
    organizerId: string,
  ) {
    try {
      const post = await prisma.socialMediaPost.findFirst({
        where: {
          id: postId,
          organizerId,
        },
      });

      if (!post) {
        throw new Error('Post not found');
      }

      if (scheduledAt <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }

      const updated = await prisma.socialMediaPost.update({
        where: { id: postId },
        data: {
          status: 'scheduled',
          scheduledAt,
        },
      });

      logger.info(`Scheduled post ${postId} for ${scheduledAt}`);
      return updated;
    } catch (error) {
      logger.error('Error scheduling post:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled post
   */
  static async cancelScheduledPost(postId: string, organizerId: string) {
    try {
      const post = await prisma.socialMediaPost.findFirst({
        where: {
          id: postId,
          organizerId,
          status: 'scheduled',
        },
      });

      if (!post) {
        throw new Error('Scheduled post not found');
      }

      const updated = await prisma.socialMediaPost.update({
        where: { id: postId },
        data: {
          status: 'draft',
          scheduledAt: null,
        },
      });

      logger.info(`Cancelled scheduled post: ${postId}`);
      return updated;
    } catch (error) {
      logger.error('Error cancelling scheduled post:', error);
      throw error;
    }
  }
}
