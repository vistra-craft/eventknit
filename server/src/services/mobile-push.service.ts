/**
 * Mobile Push Notification Service
 *
 * Handles Firebase Cloud Messaging (FCM) for iOS and Android
 */

import admin from 'firebase-admin';
import { prisma } from '../config/database.js';

// Types
interface DeviceRegistration {
  fcmToken: string;
  platform: 'ios' | 'android';
  deviceId?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
}

interface PushNotification {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
}

interface SendResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors?: string[];
}

class MobilePushService {
  private isInitialized = false;

  /**
   * Initialize Firebase Admin SDK
   */
  initialize(): void {
    if (this.isInitialized) return;

    try {
      // Check if Firebase is already initialized
      if (admin.apps.length === 0) {
        // Try to initialize from environment variable or service account file
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

        if (serviceAccount) {
          admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(serviceAccount)),
          });
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
          });
        } else {
          // logger.warn('Firebase not configured: Missing service account credentials');
          return;
        }
      }

      this.isInitialized = true;
      // logger.info('Firebase Admin SDK initialized for mobile push notifications');
    } catch (_error) {
      // logger.error('Failed to initialize Firebase Admin SDK:', _error);
    }
  }

  /**
   * Check if FCM is configured
   */
  isConfigured(): boolean {
    return this.isInitialized;
  }

  /**
   * Register a mobile device for push notifications
   */
  async registerDevice(userId: string, device: DeviceRegistration) {
    // Upsert device - update if token exists, create if not
    const existingDevice = await prisma.mobileDevice.findUnique({
      where: { fcmToken: device.fcmToken },
    });

    if (existingDevice) {
      // Update existing device
      return await prisma.mobileDevice.update({
        where: { id: existingDevice.id },
        data: {
          userId,
          platform: device.platform,
          deviceId: device.deviceId,
          deviceModel: device.deviceModel,
          osVersion: device.osVersion,
          appVersion: device.appVersion,
          isActive: true,
          lastUsed: new Date(),
          failCount: 0,
        },
      });
    }

    // Create new device
    return await prisma.mobileDevice.create({
      data: {
        userId,
        fcmToken: device.fcmToken,
        platform: device.platform,
        deviceId: device.deviceId,
        deviceModel: device.deviceModel,
        osVersion: device.osVersion,
        appVersion: device.appVersion,
      },
    });
  }

  /**
   * Unregister a device
   */
  async unregisterDevice(userId: string, fcmToken: string): Promise<boolean> {
    const result = await prisma.mobileDevice.deleteMany({
      where: {
        userId,
        fcmToken,
      },
    });
    return result.count > 0;
  }

  /**
   * Unregister all devices for a user
   */
  async unregisterAllDevices(userId: string): Promise<{ count: number }> {
    const result = await prisma.mobileDevice.deleteMany({
      where: { userId },
    });
    return { count: result.count };
  }

  /**
   * Get user's registered devices
   */
  async getUserDevices(userId: string) {
    return await prisma.mobileDevice.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        id: true,
        platform: true,
        deviceModel: true,
        osVersion: true,
        appVersion: true,
        lastUsed: true,
        createdAt: true,
      },
    });
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(userId: string, notification: PushNotification): Promise<SendResult> {
    if (!this.isInitialized) {
      return { success: false, successCount: 0, failureCount: 0, errors: ['FCM not initialized'] };
    }

    const devices = await prisma.mobileDevice.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        id: true,
        fcmToken: true,
        platform: true,
      },
    });

    if (devices.length === 0) {
      return { success: true, successCount: 0, failureCount: 0 };
    }

    const tokens = devices.map(d => d.fcmToken);
    return await this.sendToTokens(tokens, notification);
  }

  /**
   * Send push notification to multiple tokens
   */
  async sendToTokens(tokens: string[], notification: PushNotification): Promise<SendResult> {
    if (!this.isInitialized) {
      return { success: false, successCount: 0, failureCount: 0, errors: ['FCM not initialized'] };
    }

    if (tokens.length === 0) {
      return { success: true, successCount: 0, failureCount: 0 };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: notification.data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            // Mark device as inactive if token is invalid
            if (
              resp.error?.code === 'messaging/registration-token-not-registered' ||
              resp.error?.code === 'messaging/invalid-registration-token'
            ) {
              this.markDeviceInactive(tokens[idx]);
            }
          }
        });
      }

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      // logger.error('FCM send error:', error);
      return {
        success: false,
        successCount: 0,
        failureCount: tokens.length,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Send notification to a topic (e.g., event updates)
   */
  async sendToTopic(topic: string, notification: PushNotification): Promise<SendResult> {
    if (!this.isInitialized) {
      return { success: false, successCount: 0, failureCount: 0, errors: ['FCM not initialized'] };
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: notification.data,
        android: {
          priority: 'high',
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      };

      await admin.messaging().send(message);
      return { success: true, successCount: 1, failureCount: 0 };
    } catch (error) {
      // logger.error('FCM topic send error:', error);
      return {
        success: false,
        successCount: 0,
        failureCount: 1,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Subscribe device to topic
   */
  async subscribeToTopic(fcmToken: string, topic: string): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      await admin.messaging().subscribeToTopic(fcmToken, topic);
      return true;
    } catch (_error) {
      // logger.error('FCM subscribe error:', _error);
      return false;
    }
  }

  /**
   * Unsubscribe device from topic
   */
  async unsubscribeFromTopic(fcmToken: string, topic: string): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      await admin.messaging().unsubscribeFromTopic(fcmToken, topic);
      return true;
    } catch (_error) {
      // logger.error('FCM unsubscribe error:', _error);
      return false;
    }
  }

  /**
   * Mark device as inactive (called when token is invalid)
   */
  private async markDeviceInactive(fcmToken: string): Promise<void> {
    try {
      await prisma.mobileDevice.update({
        where: { fcmToken },
        data: {
          isActive: false,
          failCount: { increment: 1 },
        },
      });
    } catch (error) {
      // Ignore if device not found
      // error is intentionally unused
       
      void error;
    }
  }

  /**
   * Clean up inactive devices
   */
  async cleanupInactiveDevices(daysInactive: number = 30): Promise<{ deleted: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    const result = await prisma.mobileDevice.deleteMany({
      where: {
        OR: [
          { isActive: false },
          { lastUsed: { lt: cutoffDate } },
          { failCount: { gte: 5 } },
        ],
      },
    });

    return { deleted: result.count };
  }
}

export const mobilePushService = new MobilePushService();
