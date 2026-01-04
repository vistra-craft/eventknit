/**
 * Push Notification Service
 *
 * Handles Web Push API notifications using the web-push library.
 * VAPID keys must be configured in environment variables.
 */

import webPush from 'web-push';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

// Initialize web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@eventknit.com';

// Check if VAPID keys are configured
const isConfigured = VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY;

if (isConfigured) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  logger.info('Push notifications configured with VAPID keys');
} else {
  logger.warn('Push notifications not configured - VAPID keys missing. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env');
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  renotify?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

class PushNotificationService {
  /**
   * Check if push notifications are configured
   */
  isConfigured(): boolean {
    return isConfigured;
  }

  /**
   * Get VAPID public key for client-side subscription
   */
  getVapidPublicKey(): string {
    if (!VAPID_PUBLIC_KEY) {
      throw new ValidationError('Push notifications not configured');
    }
    return VAPID_PUBLIC_KEY;
  }

  /**
   * Generate new VAPID keys (for initial setup)
   */
  generateVapidKeys(): { publicKey: string; privateKey: string } {
    return webPush.generateVAPIDKeys();
  }

  /**
   * Subscribe user to push notifications
   */
  async subscribe(
    userId: string,
    subscription: PushSubscriptionData,
    userAgent?: string,
    deviceId?: string
  ) {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if subscription already exists (by endpoint)
    const existingSubscription = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint },
    });

    if (existingSubscription) {
      // Update existing subscription
      const updated = await prisma.pushSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          userId,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
          deviceId,
          isActive: true,
          failCount: 0,
          lastUsed: new Date(),
        },
      });

      logger.info(`Updated push subscription for user ${userId}`);
      return updated;
    }

    // Create new subscription
    const newSubscription = await prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
        deviceId,
      },
    });

    logger.info(`Created push subscription for user ${userId}`);
    return newSubscription;
  }

  /**
   * Unsubscribe user from push notifications
   */
  async unsubscribe(userId: string, endpoint: string) {
    const subscription = await prisma.pushSubscription.findFirst({
      where: {
        userId,
        endpoint,
      },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    await prisma.pushSubscription.delete({
      where: { id: subscription.id },
    });

    logger.info(`Deleted push subscription for user ${userId}`);
    return { success: true };
  }

  /**
   * Unsubscribe all devices for a user
   */
  async unsubscribeAll(userId: string) {
    const result = await prisma.pushSubscription.deleteMany({
      where: { userId },
    });

    logger.info(`Deleted ${result.count} push subscriptions for user ${userId}`);
    return { success: true, count: result.count };
  }

  /**
   * Get user's active subscriptions
   */
  async getUserSubscriptions(userId: string) {
    return prisma.pushSubscription.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        id: true,
        endpoint: true,
        userAgent: true,
        deviceId: true,
        lastUsed: true,
        createdAt: true,
      },
    });
  }

  /**
   * Send push notification to a single subscription
   */
  async sendToSubscription(
    subscription: { endpoint: string; p256dh: string; auth: string },
    payload: PushNotificationPayload
  ): Promise<boolean> {
    if (!isConfigured) {
      logger.warn('Cannot send push notification - VAPID keys not configured');
      return false;
    }

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    try {
      await webPush.sendNotification(
        pushSubscription,
        JSON.stringify(payload),
        {
          TTL: 60 * 60 * 24, // 24 hours
          urgency: 'normal',
        }
      );
      return true;
    } catch (error: any) {
      // Handle expired/invalid subscriptions
      if (error.statusCode === 404 || error.statusCode === 410) {
        logger.warn(`Push subscription no longer valid: ${subscription.endpoint}`);
        // Mark subscription as inactive
        await prisma.pushSubscription.updateMany({
          where: { endpoint: subscription.endpoint },
          data: { isActive: false },
        });
      } else {
        logger.error(`Failed to send push notification:`, error);
        // Increment fail count
        await prisma.pushSubscription.updateMany({
          where: { endpoint: subscription.endpoint },
          data: { failCount: { increment: 1 } },
        });
      }
      return false;
    }
  }

  /**
   * Send push notification to a user (all their active subscriptions)
   */
  async sendToUser(userId: string, payload: PushNotificationPayload): Promise<{ sent: number; failed: number }> {
    if (!isConfigured) {
      logger.warn('Cannot send push notification - VAPID keys not configured');
      return { sent: 0, failed: 0 };
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId,
        isActive: true,
        failCount: { lt: 5 }, // Skip subscriptions that have failed too many times
      },
    });

    if (subscriptions.length === 0) {
      logger.debug(`No active push subscriptions for user ${userId}`);
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const subscription of subscriptions) {
      const success = await this.sendToSubscription(subscription, payload);
      if (success) {
        sent++;
        // Update last used time
        await prisma.pushSubscription.update({
          where: { id: subscription.id },
          data: { lastUsed: new Date(), failCount: 0 },
        });
      } else {
        failed++;
      }
    }

    logger.info(`Sent push notification to user ${userId}: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  /**
   * Send push notification to multiple users
   */
  async sendToUsers(userIds: string[], payload: PushNotificationPayload): Promise<{ sent: number; failed: number }> {
    let totalSent = 0;
    let totalFailed = 0;

    for (const userId of userIds) {
      const result = await this.sendToUser(userId, payload);
      totalSent += result.sent;
      totalFailed += result.failed;
    }

    return { sent: totalSent, failed: totalFailed };
  }

  /**
   * Send push notification to all users with active subscriptions
   */
  async broadcast(payload: PushNotificationPayload): Promise<{ sent: number; failed: number }> {
    if (!isConfigured) {
      logger.warn('Cannot broadcast push notification - VAPID keys not configured');
      return { sent: 0, failed: 0 };
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        isActive: true,
        failCount: { lt: 5 },
      },
    });

    let sent = 0;
    let failed = 0;

    for (const subscription of subscriptions) {
      const success = await this.sendToSubscription(subscription, payload);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    logger.info(`Broadcast push notification: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  /**
   * Clean up stale subscriptions
   */
  async cleanupStaleSubscriptions(daysInactive: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    const result = await prisma.pushSubscription.deleteMany({
      where: {
        OR: [
          { lastUsed: { lt: cutoffDate } },
          { failCount: { gte: 5 } },
          { isActive: false },
        ],
      },
    });

    logger.info(`Cleaned up ${result.count} stale push subscriptions`);
    return { deleted: result.count };
  }
}

export const pushNotificationService = new PushNotificationService();
