/**
 * Social Media Webhook Controller
 * 
 * Handles webhooks from social media platforms for analytics and events
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { prisma } from '../config/database.js';

export class SocialWebhookController {
  /**
   * Handle Facebook webhook
   * POST /api/v1/webhooks/social-media/facebook
   */
  static async handleFacebookWebhook(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      // TODO: Verify Facebook webhook signature
      // Reference: https://developers.facebook.com/docs/graph-api/webhooks/getting-started

      const { object, entry } = req.body;

      if (object === 'page') {
        // Handle page events (posts, comments, etc.)
        for (const event of entry || []) {
          await this.processFacebookEvent(event);
        }
      }

      // Facebook requires 200 response immediately
      res.status(200).send('OK');
    } catch (error) {
      logger.error('Facebook webhook error:', error);
      res.status(200).send('OK'); // Still return 200 to prevent retries
    }
  }

  /**
   * Handle Twitter webhook
   * POST /api/v1/webhooks/social-media/twitter
   */
  static async handleTwitterWebhook(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      // TODO: Verify Twitter webhook signature
      // Reference: https://developer.twitter.com/en/docs/twitter-api/enterprise/account-activity-api/guides/getting-started-with-webhooks

      const { tweet_create_events } = req.body;

      if (tweet_create_events) {
        for (const event of tweet_create_events) {
          await this.processTwitterEvent(event);
        }
      }

      res.status(200).json({ status: 'ok' });
    } catch (error) {
      logger.error('Twitter webhook error:', error);
      res.status(200).json({ status: 'ok' });
    }
  }

  /**
   * Handle Instagram webhook
   * POST /api/v1/webhooks/social-media/instagram
   */
  static async handleInstagramWebhook(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      // TODO: Verify Instagram webhook signature
      // Instagram uses Facebook's webhook system

      const { object, entry } = req.body;

      if (object === 'instagram') {
        for (const event of entry || []) {
          await this.processInstagramEvent(event);
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      logger.error('Instagram webhook error:', error);
      res.status(200).send('OK');
    }
  }

  /**
   * Process Facebook event
   */
  private static async processFacebookEvent(event: any) {
    try {
      // Handle different event types
      if (event.messaging) {
        // Handle messages
        logger.info('Facebook message event received');
      } else if (event.changes) {
        // Handle page changes (post updates, comments, etc.)
        for (const change of event.changes) {
          if (change.field === 'feed') {
            // Post was created/updated
            await this.updatePostMetrics('facebook', change.value.post_id);
          }
        }
      }
    } catch (error) {
      logger.error('Error processing Facebook event:', error);
    }
  }

  /**
   * Process Twitter event
   */
  private static async processTwitterEvent(event: any) {
    try {
      // Update post metrics if this is a reply to our post
      if (event.in_reply_to_status_id) {
        await this.updatePostMetrics('twitter', event.in_reply_to_status_id);
      }
    } catch (error) {
      logger.error('Error processing Twitter event:', error);
    }
  }

  /**
   * Process Instagram event
   */
  private static async processInstagramEvent(_event: any) {
    try {
      // Handle Instagram events (comments, likes, etc.)
      logger.info('Instagram event received');
    } catch (error) {
      logger.error('Error processing Instagram event:', error);
    }
  }

  /**
   * Update post metrics from webhook data
   */
  private static async updatePostMetrics(platform: string, externalPostId: string) {
    try {
      const post = await prisma.socialMediaPost.findFirst({
        where: {
          platform: platform.toLowerCase(),
          externalPostId,
        },
      });

      if (post) {
        // Fetch latest metrics from platform and update
        // This would call the platform adapter's getPostMetrics method
        // For now, we'll just log it
        logger.info(`Updating metrics for post ${post.id} from ${platform}`);
        
        // TODO: Call platform adapter to get metrics and update post
        // const platformAdapter = platformManager.getPlatform(platform);
        // if (platformAdapter) {
        //   const metrics = await platformAdapter.getPostMetrics(accessToken, externalPostId);
        //   await SocialMediaService.updatePostAnalytics(post.id, metrics);
        // }
      }
    } catch (error) {
      logger.error('Error updating post metrics:', error);
    }
  }
}
