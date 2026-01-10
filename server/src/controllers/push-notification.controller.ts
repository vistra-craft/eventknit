/**
 * Push Notification Controller
 *
 * Handles push subscription management endpoints
 */

import { Request, Response } from 'express';
import { pushNotificationService, PushSubscriptionData } from '../services/push-notification.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError } from '../utils/errors.js';

export const pushNotificationController = {
  /**
   * Get VAPID public key for client-side subscription
   */
  getVapidPublicKey: asyncHandler(async (_req: Request, res: Response) => {
    const isConfigured = pushNotificationService.isConfigured();

    if (!isConfigured) {
      return res.status(503).json({
        success: false,
        message: 'Push notifications are not configured',
        data: null,
      });
    }

    const publicKey = pushNotificationService.getVapidPublicKey();

    return res.json({
      success: true,
      data: { publicKey },
    });
  }),

  /**
   * Subscribe to push notifications
   */
  subscribe: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    const { subscription, deviceId } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      throw new ValidationError('Invalid subscription data');
    }

    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };

    const userAgent = req.headers['user-agent'];
    const result = await pushNotificationService.subscribe(
      userId,
      subscriptionData,
      userAgent,
      deviceId,
    );

    return res.status(201).json({
      success: true,
      message: 'Successfully subscribed to push notifications',
      data: {
        id: result.id,
        endpoint: result.endpoint,
      },
    });
  }),

  /**
   * Unsubscribe from push notifications
   */
  unsubscribe: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    const { endpoint } = req.body;

    if (!endpoint) {
      throw new ValidationError('Endpoint is required');
    }

    await pushNotificationService.unsubscribe(userId, endpoint);

    return res.json({
      success: true,
      message: 'Successfully unsubscribed from push notifications',
    });
  }),

  /**
   * Unsubscribe from all push notifications
   */
  unsubscribeAll: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    const result = await pushNotificationService.unsubscribeAll(userId);

    return res.json({
      success: true,
      message: `Successfully unsubscribed from ${result.count} device(s)`,
      data: result,
    });
  }),

  /**
   * Get user's push subscriptions
   */
  getSubscriptions: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    const subscriptions = await pushNotificationService.getUserSubscriptions(userId);

    return res.json({
      success: true,
      data: subscriptions,
    });
  }),

  /**
   * Send test notification (for debugging)
   */
  sendTestNotification: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError('Authentication required');
    }

    const result = await pushNotificationService.sendToUser(userId, {
      title: 'Test Notification',
      body: 'Push notifications are working correctly!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'test',
      data: {
        type: 'test',
        url: '/',
      },
    });

    return res.json({
      success: true,
      message: 'Test notification sent',
      data: result,
    });
  }),

  /**
   * Admin: Broadcast notification to all users
   */
  broadcast: asyncHandler(async (req: Request, res: Response) => {
    const { title, body, icon, badge, data } = req.body;

    if (!title || !body) {
      throw new ValidationError('Title and body are required');
    }

    const result = await pushNotificationService.broadcast({
      title,
      body,
      icon,
      badge,
      data,
    });

    return res.json({
      success: true,
      message: 'Broadcast notification sent',
      data: result,
    });
  }),

  /**
   * Admin: Cleanup stale subscriptions
   */
  cleanup: asyncHandler(async (req: Request, res: Response) => {
    const daysInactive = parseInt(req.query.days as string, 10) || 30;

    const result = await pushNotificationService.cleanupStaleSubscriptions(daysInactive);

    return res.json({
      success: true,
      message: `Cleaned up ${result.deleted} stale subscriptions`,
      data: result,
    });
  }),
};
