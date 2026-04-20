/**
 * Mobile Routes
 *
 * /api/v1/mobile
 *
 * Mobile-specific API endpoints for iOS and Android apps.
 * These endpoints are optimized for mobile use cases:
 * - Reduced payload sizes
 * - Batch operations for offline sync
 * - FCM push notification management
 */

import { Router } from 'express';
import Joi from 'joi';
import { mobileController } from '../controllers/mobile.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate, validateParams } from '../middleware/validation.middleware.js';

const router = Router();

// All mobile routes require authentication
router.use(authenticate);

// ========== Device Registration ==========

/**
 * Register device for FCM push notifications
 * Called on app launch with fresh FCM token
 */
router.post(
  '/device/register',
  validate(
    Joi.object({
      fcmToken: Joi.string().required().min(10).max(500),
      platform: Joi.string().valid('ios', 'android').required(),
      deviceId: Joi.string().optional().max(100),
      deviceModel: Joi.string().optional().max(100),
      osVersion: Joi.string().optional().max(20),
      appVersion: Joi.string().optional().max(20),
    }),
  ),
  mobileController.registerDevice,
);

/**
 * Unregister device (on logout)
 */
router.post(
  '/device/unregister',
  validate(
    Joi.object({
      fcmToken: Joi.string().required(),
    }),
  ),
  mobileController.unregisterDevice,
);

/**
 * Unregister all devices (logout from all devices)
 */
router.delete('/device/unregister-all', mobileController.unregisterAllDevices);

/**
 * Get user's registered devices
 */
router.get('/device/list', mobileController.getDevices);

// ========== Event Topic Subscriptions ==========

/**
 * Subscribe to event updates via FCM topic
 */
router.post(
  '/device/subscribe-event',
  validate(
    Joi.object({
      fcmToken: Joi.string().required(),
      eventId: Joi.string().uuid().required(),
    }),
  ),
  mobileController.subscribeToEvent,
);

/**
 * Unsubscribe from event updates
 */
router.post(
  '/device/unsubscribe-event',
  validate(
    Joi.object({
      fcmToken: Joi.string().required(),
      eventId: Joi.string().uuid().required(),
    }),
  ),
  mobileController.unsubscribeFromEvent,
);

/**
 * Send test notification (for debugging)
 */
router.post('/device/test', mobileController.sendTestNotification);

// ========== Mobile Dashboard ==========

/**
 * Get lightweight dashboard summary
 * Optimized for mobile home screen
 */
router.get('/dashboard/summary', mobileController.getDashboardSummary);

/**
 * Get per-event organizer dashboard stats
 * Optimized for mobile organizer dashboard
 */
router.get(
  '/dashboard/organizer/:eventId',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  mobileController.getOrganizerEventDashboard,
);

// ========== Offline Support ==========

/**
 * Get event with tickets for offline caching
 */
router.get(
  '/events/:eventId/offline',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  mobileController.getEventForOffline,
);

/**
 * Batch sync offline scans
 * For staff/teller apps to sync check-ins made offline
 */
router.post(
  '/scan/sync',
  authorize('TELLER', 'ORGANIZER', 'SUPERADMIN', 'ADMIN'),
  validate(
    Joi.object({
      scans: Joi.array()
        .items(
          Joi.object({
            qrCode: Joi.string().required(),
            checkpointId: Joi.string().uuid().optional(),
            scannedAt: Joi.date().iso().optional(),
            localId: Joi.string().optional(), // Client-side ID for tracking
          }),
        )
        .min(1)
        .max(100)
        .required(),
    }),
  ),
  mobileController.batchSyncScans,
);

export default router;
