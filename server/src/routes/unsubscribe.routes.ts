/**
 * Email Unsubscribe Routes
 * Public routes for handling email marketing unsubscribe requests
 * No authentication required - uses signed tokens
 */

import { Router, Request, Response, NextFunction } from 'express';
import { verifyUnsubscribeToken } from '../utils/jwt.js';
import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * @route   GET /api/v1/unsubscribe
 * @desc    Handle email unsubscribe from marketing emails
 * @access  Public (token-based)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.query.token as string;

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Missing unsubscribe token',
      });
      return;
    }

    // Verify the unsubscribe token
    let payload;
    try {
      payload = verifyUnsubscribeToken(token);
    } catch (_error) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired unsubscribe link. Please request a new link or manage your preferences from your account settings.',
      });
      return;
    }

    const { userId, email, eventId, campaignId, type } = payload;

    // Update user notification preferences based on unsubscribe type
    if (type === 'marketing' || type === 'all') {
      // Disable marketing emails in user preferences
      await prisma.notificationPreference.upsert({
        where: { userId },
        update: {
          marketingEmails: false,
        },
        create: {
          userId,
          marketingEmails: false,
        },
      });

      logger.info(`User ${userId} (${email}) unsubscribed from marketing emails. Campaign: ${campaignId || 'N/A'}`);
    }

    // If event-specific unsubscribe, also update event subscription
    if (type === 'event_updates' && eventId) {
      await prisma.eventUpdateSubscription.updateMany({
        where: {
          userId,
          eventId,
        },
        data: {
          isActive: false,
          unsubscribedAt: new Date(),
        },
      });

      logger.info(`User ${userId} (${email}) unsubscribed from event ${eventId} updates. Campaign: ${campaignId || 'N/A'}`);
    }

    // Update campaign stats if campaign ID provided
    if (campaignId) {
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          unsubscribedCount: {
            increment: 1,
          },
        },
      }).catch((err) => {
        // Campaign might not exist, just log and continue
        logger.warn(`Failed to update unsubscribe count for campaign ${campaignId}:`, err);
      });
    }

    // Return success response (HTML for browser display)
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed - EventKnit</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          h1 {
            color: #1f2937;
            font-size: 24px;
            margin-bottom: 12px;
          }
          p {
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          a {
            display: inline-block;
            background: #4f46e5;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
          }
          a:hover {
            background: #4338ca;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✅</div>
          <h1>Successfully Unsubscribed</h1>
          <p>You have been unsubscribed from ${type === 'marketing' ? 'marketing emails' : 'event updates'}. You will no longer receive these types of emails from us.</p>
          <p>If you change your mind, you can always re-subscribe from your account settings.</p>
          <a href="${config.frontend.url}/settings/notifications">Manage Email Preferences</a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/unsubscribe
 * @desc    Handle email unsubscribe via API (for programmatic use)
 * @access  Public (token-based)
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Missing unsubscribe token',
      });
      return;
    }

    // Verify the unsubscribe token
    let payload;
    try {
      payload = verifyUnsubscribeToken(token);
    } catch (_error) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired unsubscribe token',
      });
      return;
    }

    const { userId, email, eventId, campaignId, type } = payload;

    // Update user notification preferences
    if (type === 'marketing' || type === 'all') {
      await prisma.notificationPreference.upsert({
        where: { userId },
        update: {
          marketingEmails: false,
        },
        create: {
          userId,
          marketingEmails: false,
        },
      });
    }

    // If event-specific unsubscribe
    if (type === 'event_updates' && eventId) {
      await prisma.eventUpdateSubscription.updateMany({
        where: {
          userId,
          eventId,
        },
        data: {
          isActive: false,
          unsubscribedAt: new Date(),
        },
      });
    }

    // Update campaign stats
    if (campaignId) {
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          unsubscribedCount: {
            increment: 1,
          },
        },
      }).catch(() => {});
    }

    logger.info(`API unsubscribe: User ${userId} (${email}) from ${type}. Campaign: ${campaignId || 'N/A'}`);

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed',
      data: {
        type,
        eventId: eventId || null,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
