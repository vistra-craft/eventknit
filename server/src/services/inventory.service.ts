/**
 * Inventory Service
 *
 * Redis-based atomic inventory counters for high-throughput ticket sales.
 * Uses Redis for fast reads and atomic decrements, with database as source of truth.
 */

import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import Redis from 'ioredis';

// Redis configuration (uses same connection for all operations)
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const INVENTORY_KEY_PREFIX = 'inventory:event:';
const INVENTORY_TTL_SECONDS = 3600; // 1 hour TTL for inventory cache
const SYNC_INTERVAL_MS = 30000; // 30 seconds sync interval

let redis: Redis | null = null;
let syncInterval: ReturnType<typeof setInterval> | null = null;

export interface InventoryResult {
  eventId: string;
  ticketType: string;
  available: number;
  reserved: number;
  total: number;
}

export interface ReservationResult {
  success: boolean;
  reservationId?: string;
  remaining?: number;
  error?: string;
}

export class InventoryService {
  /**
   * Initialize Redis connection
   */
  static async initialize(): Promise<void> {
    try {
      if (redis) {
        return;
      }

      redis = new Redis(REDIS_URL, {
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn('Redis connection failed, falling back to database-only mode');
            return null; // Stop retrying
          }
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
      });

      redis.on('error', (err) => {
        logger.error('Redis error:', err);
      });

      redis.on('connect', () => {
        logger.info('Redis connected for inventory service');
      });

      await redis.connect();

      // Start periodic sync
      this.startSync();

      logger.info('Inventory service initialized with Redis');
    } catch (error) {
      logger.warn('Failed to initialize Redis, using database-only mode:', error);
      redis = null;
    }
  }

  /**
   * Shutdown Redis connection
   */
  static async shutdown(): Promise<void> {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }

    if (redis) {
      await redis.quit();
      redis = null;
    }

    logger.info('Inventory service shut down');
  }

  /**
   * Get inventory key for Redis
   */
  private static getKey(eventId: string, ticketType?: string): string {
    if (ticketType) {
      return `${INVENTORY_KEY_PREFIX}${eventId}:${ticketType}`;
    }
    return `${INVENTORY_KEY_PREFIX}${eventId}`;
  }

  /**
   * Get available inventory for an event
   */
  static async getAvailable(eventId: string, ticketType?: string): Promise<number> {
    try {
      // Try Redis first
      if (redis) {
        const key = this.getKey(eventId, ticketType);
        const cached = await redis.get(key);
        if (cached !== null) {
          return parseInt(cached, 10);
        }
      }

      // Fall back to database
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          capacity: true,
          availableSlots: true,
        },
      });

      if (!event) {
        return 0;
      }

      const available = event.availableSlots ?? event.capacity ?? Infinity;

      // Cache in Redis
      if (redis && typeof available === 'number' && isFinite(available)) {
        const key = this.getKey(eventId, ticketType);
        await redis.setex(key, INVENTORY_TTL_SECONDS, available.toString());
      }

      return available;
    } catch (error) {
      logger.error('Error getting inventory:', error);
      // Fall back to database on error
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { availableSlots: true, capacity: true },
      });
      return event?.availableSlots ?? event?.capacity ?? 0;
    }
  }

  /**
   * Reserve inventory atomically (decrement available count)
   */
  static async reserve(
    eventId: string,
    quantity: number,
    ticketType?: string,
  ): Promise<ReservationResult> {
    try {
      // Try Redis atomic decrement first
      if (redis) {
        const key = this.getKey(eventId, ticketType);

        // Ensure key exists with current value
        const exists = await redis.exists(key);
        if (!exists) {
          // Initialize from database
          const available = await this.getAvailable(eventId, ticketType);
          if (available === 0 || available === Infinity) {
            // No capacity limit, proceed with database
          } else {
            await redis.setex(key, INVENTORY_TTL_SECONDS, available.toString());
          }
        }

        // Atomic decrement with Lua script to prevent going negative
        const script = `
          local current = tonumber(redis.call('GET', KEYS[1]) or '0')
          local quantity = tonumber(ARGV[1])
          if current >= quantity then
            local newValue = current - quantity
            redis.call('SETEX', KEYS[1], ${INVENTORY_TTL_SECONDS}, newValue)
            return newValue
          else
            return -1
          end
        `;

        const result = await redis.eval(script, 1, key, quantity.toString());
        const remaining = typeof result === 'number' ? result : parseInt(result as string, 10);

        if (remaining < 0) {
          return {
            success: false,
            error: 'Not enough inventory available',
          };
        }

        // Also update database (async, don't wait)
        this.syncToDatabase(eventId, ticketType, remaining).catch((err) => {
          logger.error('Failed to sync inventory to database:', err);
        });

        return {
          success: true,
          remaining,
          reservationId: `${eventId}-${Date.now()}`,
        };
      }

      // Fall back to database with transaction
      return await this.reserveWithDatabase(eventId, quantity, ticketType);
    } catch (error) {
      logger.error('Error reserving inventory:', error);

      // Fall back to database
      return this.reserveWithDatabase(eventId, quantity, ticketType);
    }
  }

  /**
   * Release inventory (increment available count)
   */
  static async release(
    eventId: string,
    quantity: number,
    ticketType?: string,
  ): Promise<void> {
    try {
      // Update Redis
      if (redis) {
        const key = this.getKey(eventId, ticketType);
        await redis.incrby(key, quantity);
      }

      // Update database
      await prisma.event.update({
        where: { id: eventId },
        data: {
          availableSlots: {
            increment: quantity,
          },
        },
      });

      logger.debug(`Released ${quantity} inventory for event ${eventId}`);
    } catch (error) {
      logger.error('Error releasing inventory:', error);
      throw error;
    }
  }

  /**
   * Reserve inventory using database transaction (fallback)
   */
  private static async reserveWithDatabase(
    eventId: string,
    quantity: number,
    _ticketType?: string,
  ): Promise<ReservationResult> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const event = await tx.event.findUnique({
          where: { id: eventId },
          select: {
            id: true,
            capacity: true,
            availableSlots: true,
          },
        });

        if (!event) {
          return { success: false, error: 'Event not found' };
        }

        // Check if unlimited capacity
        if (event.capacity === null) {
          return {
            success: true,
            remaining: Infinity,
            reservationId: `${eventId}-${Date.now()}`,
          };
        }

        const available = event.availableSlots ?? event.capacity;
        if (available < quantity) {
          return {
            success: false,
            error: `Not enough inventory. Available: ${available}, Requested: ${quantity}`,
          };
        }

        // Decrement available slots
        await tx.event.update({
          where: { id: eventId },
          data: {
            availableSlots: available - quantity,
          },
        });

        return {
          success: true,
          remaining: available - quantity,
          reservationId: `${eventId}-${Date.now()}`,
        };
      });

      return result;
    } catch (error) {
      logger.error('Error reserving with database:', error);
      return {
        success: false,
        error: 'Failed to reserve inventory',
      };
    }
  }

  /**
   * Sync Redis inventory to database
   */
  private static async syncToDatabase(
    eventId: string,
    _ticketType: string | undefined,
    available: number,
  ): Promise<void> {
    try {
      await prisma.event.update({
        where: { id: eventId },
        data: { availableSlots: available },
      });
    } catch (error) {
      logger.error('Error syncing inventory to database:', error);
    }
  }

  /**
   * Sync all inventory from database to Redis
   */
  static async syncFromDatabase(): Promise<{ synced: number }> {
    if (!redis) {
      return { synced: 0 };
    }

    try {
      const events = await prisma.event.findMany({
        where: {
          deletedAt: null,
          status: 'APPROVED',
          capacity: { not: null },
        },
        select: {
          id: true,
          capacity: true,
          availableSlots: true,
        },
      });

      const pipeline = redis.pipeline();

      for (const event of events) {
        const available = event.availableSlots ?? event.capacity ?? 0;
        const key = this.getKey(event.id);
        pipeline.setex(key, INVENTORY_TTL_SECONDS, available.toString());
      }

      await pipeline.exec();

      logger.info(`Synced ${events.length} event inventories from database to Redis`);
      return { synced: events.length };
    } catch (error) {
      logger.error('Error syncing from database:', error);
      return { synced: 0 };
    }
  }

  /**
   * Start periodic sync from database
   */
  private static startSync(): void {
    if (syncInterval) {
      return;
    }

    // Initial sync
    this.syncFromDatabase().catch((err) => {
      logger.error('Initial inventory sync failed:', err);
    });

    // Periodic sync
    syncInterval = setInterval(() => {
      this.syncFromDatabase().catch((err) => {
        logger.error('Periodic inventory sync failed:', err);
      });
    }, SYNC_INTERVAL_MS);

    logger.info(`Inventory sync started (every ${SYNC_INTERVAL_MS / 1000}s)`);
  }

  /**
   * Get inventory status for multiple events
   */
  static async getInventoryBatch(eventIds: string[]): Promise<Map<string, number>> {
    const result = new Map<string, number>();

    if (redis) {
      try {
        const keys = eventIds.map((id) => this.getKey(id));
        const values = await redis.mget(keys);

        for (let i = 0; i < eventIds.length; i++) {
          if (values[i] !== null) {
            result.set(eventIds[i], parseInt(values[i]!, 10));
          }
        }

        // Get missing from database
        const missingIds = eventIds.filter((id) => !result.has(id));
        if (missingIds.length > 0) {
          const events = await prisma.event.findMany({
            where: { id: { in: missingIds } },
            select: { id: true, availableSlots: true, capacity: true },
          });

          for (const event of events) {
            const available = event.availableSlots ?? event.capacity ?? Infinity;
            result.set(event.id, available);

            // Cache in Redis
            if (isFinite(available)) {
              await redis.setex(
                this.getKey(event.id),
                INVENTORY_TTL_SECONDS,
                available.toString(),
              );
            }
          }
        }
      } catch (error) {
        logger.error('Error getting batch inventory from Redis:', error);
      }
    }

    // Fall back to database for any still missing
    const stillMissing = eventIds.filter((id) => !result.has(id));
    if (stillMissing.length > 0) {
      const events = await prisma.event.findMany({
        where: { id: { in: stillMissing } },
        select: { id: true, availableSlots: true, capacity: true },
      });

      for (const event of events) {
        const available = event.availableSlots ?? event.capacity ?? Infinity;
        result.set(event.id, available);
      }
    }

    return result;
  }

  /**
   * Check if Redis is available
   */
  static isRedisAvailable(): boolean {
    return redis !== null && redis.status === 'ready';
  }
}
