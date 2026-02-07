/**
 * Offline Sync Service
 * Handles offline scan storage and synchronization
 */

import { scanTicket, scanOut } from './workstation-api';
import type { ScanRequest, ScanResponse } from './workstation-api';

/**
 * Offline Scan Queue Item
 */
export interface OfflineScanItem {
  id: string;
  timestamp: Date;
  request: ScanRequest;
  type: 'check-in' | 'check-out';
  signatureValid?: boolean;
  codeType?: 'QR_CODE' | 'BACKUP_CODE' | 'UNKNOWN';
  retryCount: number;
  lastError?: string;
}

/**
 * Sync Status
 */
export interface SyncStatus {
  isOnline: boolean;
  queueLength: number;
  syncing: boolean;
  lastSyncAt: Date | null;
  failedItems: number;
}

/**
 * Storage Keys
 */
const STORAGE_KEYS = {
  SCAN_QUEUE: 'workstation_offline_scan_queue',
  SYNC_STATUS: 'workstation_sync_status',
  LAST_SYNC: 'workstation_last_sync',
};

/**
 * Maximum queue size to prevent storage overflow
 */
const MAX_QUEUE_SIZE = 1000;

/**
 * Maximum retry attempts before marking as failed
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Get offline scan queue from storage
 */
export const getOfflineQueue = (): OfflineScanItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SCAN_QUEUE);
    if (!stored) return [];

    const queue = JSON.parse(stored) as OfflineScanItem[];
    // Convert timestamp strings back to Date objects
    return queue.map((item) => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }));
  } catch (error) {
    console.error('Error reading offline queue:', error);
    return [];
  }
};

/**
 * Save offline scan queue to storage
 */
export const saveOfflineQueue = (queue: OfflineScanItem[]): void => {
  try {
    // Limit queue size
    const limitedQueue = queue.slice(0, MAX_QUEUE_SIZE);
    localStorage.setItem(STORAGE_KEYS.SCAN_QUEUE, JSON.stringify(limitedQueue));
  } catch (error) {
    console.error('Error saving offline queue:', error);
    // If storage is full, try to clear old items
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      const queue = getOfflineQueue();
      // Keep only the most recent 500 items
      const recentQueue = queue
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 500);
      localStorage.setItem(STORAGE_KEYS.SCAN_QUEUE, JSON.stringify(recentQueue));
    }
  }
};

/**
 * Add scan to offline queue
 */
export const addToOfflineQueue = (
  request: ScanRequest,
  type: 'check-in' | 'check-out',
  signatureValid?: boolean,
  codeType?: 'QR_CODE' | 'BACKUP_CODE' | 'UNKNOWN',
): OfflineScanItem => {
  const queue = getOfflineQueue();
  const item: OfflineScanItem = {
    id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
    timestamp: new Date(),
    request,
    type,
    signatureValid,
    codeType,
    retryCount: 0,
  };

  queue.push(item);
  saveOfflineQueue(queue);
  return item;
};

/**
 * Remove item from offline queue
 */
export const removeFromOfflineQueue = (itemId: string): void => {
  const queue = getOfflineQueue();
  const filtered = queue.filter((item) => item.id !== itemId);
  saveOfflineQueue(filtered);
};

/**
 * Update item in offline queue
 */
export const updateOfflineQueueItem = (
  itemId: string,
  updates: Partial<OfflineScanItem>,
): void => {
  const queue = getOfflineQueue();
  const updated = queue.map((item) =>
    item.id === itemId ? { ...item, ...updates } : item,
  );
  saveOfflineQueue(updated);
};

/**
 * Check if device is online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Get sync status
 */
export const getSyncStatus = (): SyncStatus => {
  const queue = getOfflineQueue();
  const failedItems = queue.filter((item) => item.retryCount >= MAX_RETRY_ATTEMPTS).length;

  let lastSyncAt: Date | null = null;
  try {
    const lastSyncStr = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    if (lastSyncStr) {
      lastSyncAt = new Date(lastSyncStr);
    }
  } catch (error) {
    console.error('Error reading last sync time:', error);
  }

  return {
    isOnline: isOnline(),
    queueLength: queue.length,
    syncing: false, // Will be set by sync function
    lastSyncAt,
    failedItems,
  };
};

/**
 * Sync offline queue with server
 */
export const syncOfflineQueue = async (
  onProgress?: (synced: number, total: number) => void,
  onItemComplete?: (item: OfflineScanItem, success: boolean) => void,
): Promise<{ synced: number; failed: number; errors: string[] }> => {
  if (!isOnline()) {
    throw new Error('Device is offline. Cannot sync.');
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { synced: 0, failed: 0, errors: [] };
  }

  // Filter out items that have exceeded max retries
  const itemsToSync = queue.filter((item) => item.retryCount < MAX_RETRY_ATTEMPTS);
  const failedItems = queue.filter((item) => item.retryCount >= MAX_RETRY_ATTEMPTS);

  let synced = 0;
  let failed = failedItems.length;
  const errors: string[] = [];

  // Update sync status
  const updateSyncStatus = (syncing: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify({ syncing }));
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  };

  updateSyncStatus(true);

  try {
    // Sync items one by one to avoid overwhelming the server
    for (let i = 0; i < itemsToSync.length; i++) {
      const item = itemsToSync[i];

      try {
        let response: ScanResponse;

        if (item.type === 'check-in') {
          response = await scanTicket(item.request);
        } else {
          response = await scanOut(item.request);
        }

        if (response.success) {
          // Successfully synced - remove from queue
          removeFromOfflineQueue(item.id);
          synced++;
          onItemComplete?.(item, true);
        } else {
          // API returned error - increment retry count
          updateOfflineQueueItem(item.id, {
            retryCount: item.retryCount + 1,
            lastError: response.error?.message || 'Unknown error',
          });
          failed++;
          errors.push(`Item ${item.id}: ${response.error?.message || 'Unknown error'}`);
          onItemComplete?.(item, false);
        }
      } catch (error) {
        // Network or other error - increment retry count
        const errorMessage = error instanceof Error ? error.message : 'Network error';
        updateOfflineQueueItem(item.id, {
          retryCount: item.retryCount + 1,
          lastError: errorMessage,
        });
        failed++;
        errors.push(`Item ${item.id}: ${errorMessage}`);
        onItemComplete?.(item, false);
      }

      // Report progress
      onProgress?.(synced, itemsToSync.length);

      // Small delay between syncs to avoid rate limiting
      if (i < itemsToSync.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Update last sync time
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } finally {
    updateSyncStatus(false);
  }

  return { synced, failed, errors };
};

/**
 * Clear failed items from queue
 */
export const clearFailedItems = (): number => {
  const queue = getOfflineQueue();
  const activeItems = queue.filter((item) => item.retryCount < MAX_RETRY_ATTEMPTS);
  const failedCount = queue.length - activeItems.length;
  saveOfflineQueue(activeItems);
  return failedCount;
};

/**
 * Clear entire queue
 */
export const clearQueue = (): void => {
  localStorage.removeItem(STORAGE_KEYS.SCAN_QUEUE);
  localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
};

/**
 * Get queue statistics
 */
export const getQueueStats = () => {
  const queue = getOfflineQueue();
  return {
    total: queue.length,
    pending: queue.filter((item) => item.retryCount < MAX_RETRY_ATTEMPTS).length,
    failed: queue.filter((item) => item.retryCount >= MAX_RETRY_ATTEMPTS).length,
    oldestItem: queue.length > 0 ? queue[0].timestamp : null,
    newestItem: queue.length > 0 ? queue[queue.length - 1].timestamp : null,
  };
};



