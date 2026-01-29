import { apiGet, apiPost, apiDelete } from './api';

/**
 * Push Notification API
 *
 * Client-side API for managing push notification subscriptions
 */

export interface PushSubscriptionInfo {
  id: string;
  endpoint: string;
  userAgent: string | null;
  deviceId: string | null;
  lastUsed: string;
  createdAt: string;
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Get VAPID public key from server
 */
export async function getVapidPublicKey(): Promise<string | null> {
  try {
    const response = await apiGet<{ success: boolean; data?: { publicKey: string } }>('/push/vapid-public-key');
    return response.data?.publicKey || null;
  } catch (error) {
    console.error('Failed to get VAPID public key:', error);
    return null;
  }
}

/**
 * Convert VAPID key to Uint8Array for subscription
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }
  return Notification.requestPermission();
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Register service worker for push notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('Service worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(deviceId?: string): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported');
    return false;
  }

  // Request permission first
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.warn('Notification permission denied');
    return false;
  }

  // Get VAPID public key
  const vapidKey = await getVapidPublicKey();
  if (!vapidKey) {
    console.error('Failed to get VAPID key');
    return false;
  }

  // Register service worker
  const registration = await registerServiceWorker();
  if (!registration) {
    return false;
  }

  try {
    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    });

    // Send subscription to server
    const response = await apiPost<{ success: boolean }>('/push/subscribe', {
      subscription: subscription.toJSON(),
      deviceId,
    });

    if (response.success) {
      console.log('Push subscription successful');
      return true;
    }
  } catch (error) {
    console.error('Push subscription failed:', error);
  }

  return false;
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Unsubscribe from browser
      await subscription.unsubscribe();

      // Notify server
      await apiPost('/push/unsubscribe', {
        endpoint: subscription.endpoint,
      });

      console.log('Push unsubscription successful');
      return true;
    }
  } catch (error) {
    console.error('Push unsubscription failed:', error);
  }

  return false;
}

/**
 * Unsubscribe from all devices
 */
export async function unsubscribeFromAllDevices(): Promise<{ success: boolean; count: number }> {
  try {
    const response = await apiDelete<{ success: boolean; data?: { count: number } }>('/push/unsubscribe-all');
    return { success: true, count: response.data?.count || 0 };
  } catch (error) {
    console.error('Failed to unsubscribe from all devices:', error);
    return { success: false, count: 0 };
  }
}

/**
 * Check if user is subscribed to push notifications
 */
export async function isSubscribedToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (error) {
    console.error('Failed to check push subscription:', error);
    return false;
  }
}

/**
 * Get user's push subscriptions from server
 */
export async function getPushSubscriptions(): Promise<PushSubscriptionInfo[]> {
  try {
    const response = await apiGet<{ success: boolean; data: PushSubscriptionInfo[] }>('/push/subscriptions');
    return response.data || [];
  } catch (error) {
    console.error('Failed to get push subscriptions:', error);
    return [];
  }
}

/**
 * Send test notification to self
 */
export async function sendTestNotification(): Promise<boolean> {
  try {
    const response = await apiPost<{ success: boolean }>('/push/test');
    return response.success;
  } catch (error) {
    console.error('Failed to send test notification:', error);
    return false;
  }
}
