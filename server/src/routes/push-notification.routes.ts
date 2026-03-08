/**
 * Push Notification Routes
 *
 * /api/v1/push
 */

import { Router } from 'express';
import { pushNotificationController } from '../controllers/push-notification.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Public route - get VAPID public key
router.get('/vapid-public-key', pushNotificationController.getVapidPublicKey);

// Authenticated routes
router.use(authenticate);

// Subscribe to push notifications
router.post('/subscribe', pushNotificationController.subscribe);

// Unsubscribe from push notifications
router.post('/unsubscribe', pushNotificationController.unsubscribe);

// Unsubscribe from all devices
router.delete('/unsubscribe-all', pushNotificationController.unsubscribeAll);

// Get user's push subscriptions
router.get('/subscriptions', pushNotificationController.getSubscriptions);

// Send test notification
router.post('/test', pushNotificationController.sendTestNotification);

// Admin routes
router.post(
  '/broadcast',
  authorize('SUPERADMIN', 'ADMIN', 'ADMIN_STAFF'),
  pushNotificationController.broadcast,
);

router.post(
  '/cleanup',
  authorize('SUPERADMIN', 'ADMIN', 'ADMIN_STAFF'),
  pushNotificationController.cleanup,
);

export default router;
