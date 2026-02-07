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
  private static connectionStartTime: number | null = null;
  private static readonly DEFAULT_TTL = 5000; // 5 seconds in milliseconds
  private static readonly DEFAULT_RETRY_DELAY = 100; // 100ms
  private static readonly DEFAULT_MAX_RETRIES = 3;
  private static readonly CONNECTION_TIMEOUT = 3000; // 3 seconds to establish connection

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
          // Stop retrying after 3 attempts
          if (times > 3) {
            logger.warn('Redis connection failed after 3 attempts, disabling Redis');
            this.redisClient = null;
            return null; // Stop retrying
          }
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 1, // Fail fast on individual requests
        connectTimeout: 2000, // 2 second connection timeout
        commandTimeout: 1000, // 1 second command timeout
        lazyConnect: true, // Connect lazily to avoid blocking initialization
        enableOfflineQueue: false, // Don't queue commands when offline
        enableReadyCheck: true, // Check if Redis is ready before executing commands
      });

      this.redisClient.on('error', (error) => {
        logger.error('Redis connection error:', error);
        // If connection fails, disable Redis
        if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
          logger.warn('Redis not available, disabling Redis client');
          this.redisClient = null;
        }
      });

      this.redisClient.on('connect', () => {
        logger.info('Redis connected successfully');
        this.connectionStartTime = null; // Reset on successful connect
      });

      this.redisClient.on('ready', () => {
        logger.info('Redis ready');
        this.connectionStartTime = null; // Reset on ready
      });

      this.redisClient.on('close', () => {
        logger.warn('Redis connection closed');
        this.redisClient = null;
        this.connectionStartTime = null;
      });

      // Track connection start time
      this.connectionStartTime = Date.now();
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
   * Check if Redis client is ready
   */
  private static isClientReady(): boolean {
    if (!this.redisClient) {
      return false;
    }
    
    const status = this.redisClient.status;
    
    // If connecting for too long, consider it unavailable
    if (status === 'connecting' && this.connectionStartTime) {
      const elapsed = Date.now() - this.connectionStartTime;
      if (elapsed > this.CONNECTION_TIMEOUT) {
        logger.warn('Redis connection timeout, disabling client');
        this.redisClient = null;
        this.connectionStartTime = null;
        return false;
      }
    }
    
    // Check if client is connected and ready
    // Status can be: 'wait', 'end', 'close', 'connecting', 'connect', 'ready'
    return status === 'ready' || status === 'connect';
  }

  /**
   * Acquire a distributed lock
   * @param key - Lock key
   * @param ttl - Time to live in milliseconds (default: 5 seconds)
   * @returns Lock value if acquired, null if failed
   */
  static async acquireLock(key: string, ttl: number = this.DEFAULT_TTL): Promise<string | null> {
    const client = this.getClient();
    if (!client || !this.isClientReady()) {
      // Redis not available - return null immediately
      return null;
    }

    try {
      const lockValue = this.generateLockValue();
      const ttlSeconds = Math.ceil(ttl / 1000); // Convert to seconds

      // Use SET with NX (only if not exists) and EX (expiration)
      // commandTimeout is already set in Redis config, but add Promise.race as backup
      const result = await Promise.race([
        client.set(key, lockValue, 'EX', ttlSeconds, 'NX'),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)), // 1.5 second timeout (longer than commandTimeout)
      ]);

      if (result === 'OK') {
        return lockValue;
      }

      return null;
    } catch (error) {
      logger.error(`Error acquiring lock for key ${key}:`, error);
      // If connection error, disable Redis client
      if (error instanceof Error && (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT'))) {
        this.redisClient = null;
      }
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
    if (!client || !this.isClientReady()) {
      // Redis not available - return false immediately
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

      // Add timeout to prevent hanging
      const result = await Promise.race([
        client.eval(script, 1, key, lockValue),
        new Promise<number>((resolve) => setTimeout(() => resolve(0), 1500)), // 1.5 second timeout
      ]);

      return result === 1;
    } catch (error) {
      logger.error(`Error releasing lock for key ${key}:`, error);
      // If connection error, disable Redis client
      if (error instanceof Error && (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT'))) {
        this.redisClient = null;
      }
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
    if (!client || !this.isClientReady()) {
      // Redis not available - return false immediately
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
      // Add timeout to prevent hanging
      const result = await Promise.race([
        client.eval(script, 1, key, lockValue, ttlMilliseconds),
        new Promise<number>((resolve) => setTimeout(() => resolve(0), 1500)), // 1.5 second timeout
      ]);

      return result === 1;
    } catch (error) {
      logger.error(`Error extending lock for key ${key}:`, error);
      // If connection error, disable Redis client
      if (error instanceof Error && (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT'))) {
        this.redisClient = null;
      }
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
    // Check if Redis is available before attempting retries
    if (!this.isClientReady()) {
      return null;
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // Check again before each attempt
      if (!this.isClientReady()) {
        return null;
      }

      const lockValue = await this.acquireLock(key, ttl);

      if (lockValue) {
        return lockValue;
      }

      // If Redis client was disabled during acquireLock, stop retrying
      if (!this.isClientReady()) {
        return null;
      }

      if (attempt < maxRetries) {
        // Wait before retrying
        await new Promise<void>((resolve) => {
           
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
      try {
        // Check if client is connected before trying to quit
        const status = this.redisClient.status;
        if (status === 'ready' || status === 'connect') {
          // Client is connected, use quit() for graceful shutdown
          await this.redisClient.quit();
        } else {
          // Client is not connected, just disconnect
          this.redisClient.disconnect();
        }
      } catch (error) {
        // If quit() fails, try disconnect() as fallback
        try {
          this.redisClient.disconnect();
        } catch {
          // Ignore disconnect errors
        }
        logger.warn('Error closing Redis connection:', error);
      } finally {
        this.redisClient = null;
      }
    }
  }
}

