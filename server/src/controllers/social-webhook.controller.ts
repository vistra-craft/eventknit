/**
 * Social Media Webhook Controller
 *
 * Handles webhooks from social media platforms for analytics and events
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { prisma } from '../config/database.js';
import { config } from '../config/index.js';

/**
 * Verify HMAC-SHA256 webhook signature.
 * Returns true if the signature is valid, false otherwise.
 */
function verifyHmacSignature(
  payload: string,
  signature: string | undefined,
  secret: string,
  prefix = 'sha256=',
): boolean {
  if (!signature) return false;

  const sig = signature.startsWith(prefix) ? signature.slice(prefix.length) : signature;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

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
      const secret = config.socialMedia.facebook.clientSecret;
      if (secret) {
        const signature = req.headers['x-hub-signature-256'] as string | undefined;
        if (!verifyHmacSignature(JSON.stringify(req.body), signature, secret)) {
          logger.warn('Facebook webhook signature verification failed');
          res.status(401).json({ error: 'Invalid signature' });
          return;
        }
      } else if (process.env.NODE_ENV === 'production') {
        logger.error('Facebook webhook secret not configured in production — rejecting request');
        res.status(503).json({ error: 'Webhook not configured' });
        return;
      } else {
        logger.warn('Facebook webhook secret not configured — skipping verification in development');
      }

      const { object, entry } = req.body;

      if (object === 'page') {
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
      const secret = config.socialMedia.twitter.clientSecret;
      if (secret) {
        const signature = req.headers['x-twitter-webhooks-signature'] as string | undefined;
        if (!verifyHmacSignature(JSON.stringify(req.body), signature, secret)) {
          logger.warn('Twitter webhook signature verification failed');
          res.status(401).json({ error: 'Invalid signature' });
          return;
        }
      } else if (process.env.NODE_ENV === 'production') {
        logger.error('Twitter webhook secret not configured in production — rejecting request');
        res.status(503).json({ error: 'Webhook not configured' });
        return;
      } else {
        logger.warn('Twitter webhook secret not configured — skipping verification in development');
      }

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
      // Instagram uses Facebook's webhook system — same signature header
      const secret = config.socialMedia.instagram.clientSecret || config.socialMedia.facebook.clientSecret;
      if (secret) {
        const signature = req.headers['x-hub-signature-256'] as string | undefined;
        if (!verifyHmacSignature(JSON.stringify(req.body), signature, secret)) {
          logger.warn('Instagram webhook signature verification failed');
          res.status(401).json({ error: 'Invalid signature' });
          return;
        }
      } else if (process.env.NODE_ENV === 'production') {
        logger.error('Instagram webhook secret not configured in production — rejecting request');
        res.status(503).json({ error: 'Webhook not configured' });
        return;
      } else {
        logger.warn('Instagram webhook secret not configured — skipping verification in development');
      }

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
  private static async processFacebookEvent(event: Record<string, unknown>) {
    try {
      if ('messaging' in event) {
        logger.info('Facebook message event received');
      } else if ('changes' in event && Array.isArray(event.changes)) {
        for (const change of event.changes) {
          if (change.field === 'feed') {
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
  private static async processTwitterEvent(event: Record<string, unknown>) {
    try {
      if ('in_reply_to_status_id' in event) {
        await this.updatePostMetrics('twitter', event.in_reply_to_status_id as string);
      }
    } catch (error) {
      logger.error('Error processing Twitter event:', error);
    }
  }

  /**
   * Process Instagram event
   */
  private static async processInstagramEvent(_event: Record<string, unknown>) {
    try {
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
        logger.info(`Updating metrics for post ${post.id} from ${platform}`);
      }
    } catch (error) {
      logger.error('Error updating post metrics:', error);
    }
  }
}
