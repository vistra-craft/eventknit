import Redis from 'ioredis';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

/**
 * LockService
 * 
 * Distributed locking service using Redis.
 * Prevents race conditions in concurrent operations.
 */
export class LockService {
  private static redisClient: Redis | null = null;
  private static readonly DEFAULT_TTL = 5000; // 5 seconds in milliseconds
  private static readonly DEFAULT_RETRY_DELAY = 100; // 100ms
  private static readonly DEFAULT_MAX_RETRIES = 3;

  /**
   * Initialize Redis client
   */
  static initialize(): void {
    if (this.redisClient) {
      return;
    }

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      this.redisClient = new Redis(redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.redisClient.on('error', (error) => {
        logger.error('Redis connection error:', error);
      });

      this.redisClient.on('connect', () => {
        logger.info('Redis connected successfully');
      });
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      // Continue without Redis - locks will fail gracefully
      this.redisClient = null;
    }
  }

  /**
   * Get Redis client (initialize if needed)
   */
  private static getClient(): Redis | null {
    if (!this.redisClient) {
      this.initialize();
    }
    return this.redisClient;
  }

  /**
   * Generate a unique lock value to prevent accidental release by other processes
   */
  private static generateLockValue(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Acquire a distributed lock
   * @param key - Lock key
   * @param ttl - Time to live in milliseconds (default: 5 seconds)
   * @returns Lock value if acquired, null if failed
   */
  static async acquireLock(key: string, ttl: number = this.DEFAULT_TTL): Promise<string | null> {
    const client = this.getClient();
    if (!client) {
      logger.warn('Redis not available, lock acquisition skipped');
      return null;
    }

    try {
      const lockValue = this.generateLockValue();
      const ttlSeconds = Math.ceil(ttl / 1000); // Convert to seconds

      // Use SET with NX (only if not exists) and EX (expiration)
      const result = await client.set(key, lockValue, 'EX', ttlSeconds, 'NX');

      if (result === 'OK') {
        return lockValue;
      }

      return null;
    } catch (error) {
      logger.error(`Error acquiring lock for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Release a distributed lock
   * @param key - Lock key
   * @param lockValue - Lock value returned from acquireLock
   * @returns true if released, false otherwise
   */
  static async releaseLock(key: string, lockValue: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) {
      logger.warn('Redis not available, lock release skipped');
      return false;
    }

    try {
      // Use Lua script to atomically check and delete
      // This ensures we only delete the lock if we own it
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;

      const result = await client.eval(script, 1, key, lockValue);
      return result === 1;
    } catch (error) {
      logger.error(`Error releasing lock for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Extend a lock's TTL
   * @param key - Lock key
   * @param lockValue - Lock value returned from acquireLock
   * @param ttl - New time to live in milliseconds
   * @returns true if extended, false otherwise
   */
  static async extendLock(key: string, lockValue: string, ttl: number = this.DEFAULT_TTL): Promise<boolean> {
    const client = this.getClient();
    if (!client) {
      logger.warn('Redis not available, lock extension skipped');
      return false;
    }

    try {
      // Use Lua script to atomically check and extend
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("pexpire", KEYS[1], ARGV[2])
        else
          return 0
        end
      `;

      const ttlMilliseconds = ttl.toString();
      const result = await client.eval(script, 1, key, lockValue, ttlMilliseconds);
      return result === 1;
    } catch (error) {
      logger.error(`Error extending lock for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Acquire lock with retry logic
   * @param key - Lock key
   * @param ttl - Time to live in milliseconds
   * @param maxRetries - Maximum number of retries (default: 3)
   * @param retryDelay - Delay between retries in milliseconds (default: 100ms)
   * @returns Lock value if acquired, null if failed after retries
   */
  static async acquireLockWithRetry(
    key: string,
    ttl: number = this.DEFAULT_TTL,
    maxRetries: number = this.DEFAULT_MAX_RETRIES,
    retryDelay: number = this.DEFAULT_RETRY_DELAY,
  ): Promise<string | null> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const lockValue = await this.acquireLock(key, ttl);

      if (lockValue) {
        return lockValue;
      }

      if (attempt < maxRetries) {
        // Wait before retrying
        await new Promise<void>((resolve) => {
          // eslint-disable-next-line no-undef
          setTimeout(() => resolve(), retryDelay);
        });
      }
    }

    return null;
  }

  /**
   * Execute a function with a distributed lock
   * Automatically acquires and releases the lock
   * @param key - Lock key
   * @param fn - Function to execute
   * @param ttl - Time to live in milliseconds
   * @param maxRetries - Maximum number of retries
   * @returns Result of the function or null if lock acquisition failed
   */
  static async withLock<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL,
    maxRetries: number = this.DEFAULT_MAX_RETRIES,
  ): Promise<T | null> {
    const lockValue = await this.acquireLockWithRetry(key, ttl, maxRetries);

    if (!lockValue) {
      logger.warn(`Failed to acquire lock for key ${key} after retries`);
      return null;
    }

    try {
      const result = await fn();
      return result;
    } finally {
      await this.releaseLock(key, lockValue);
    }
  }

  /**
   * Close Redis connection
   */
  static async close(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
    }
  }
}

