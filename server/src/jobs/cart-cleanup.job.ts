/**
 * Cart Cleanup Job
 *
 * Periodically releases expired cart reservations and restores inventory.
 * Runs every minute to ensure timely release of abandoned carts.
 */

import * as cron from 'node-cron';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { CartService } from '../services/cart.service.js';

export class CartCleanupJob {
  private static readonly CRON_SCHEDULE = '* * * * *'; // Every minute
  private static task: cron.ScheduledTask | null = null;

  /**
   * Check if database is available
   */
  private static async isDatabaseAvailable(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Release expired carts
   */
  static async cleanupExpiredCarts(): Promise<void> {
    try {
      // Check if database is available
      const dbAvailable = await this.isDatabaseAvailable();
      if (!dbAvailable) {
        logger.warn('Database not available, skipping cart cleanup job');
        return;
      }

      logger.debug('Running cart cleanup job...');

      const result = await CartService.releaseExpiredCarts();

      if (result.released > 0) {
        logger.info(
          `Cart cleanup: ${result.released} expired carts released, ${result.inventoryRestored} inventory items restored`,
        );
      }
    } catch (error) {
      // Check if it's a database connection error
      if (
        error instanceof Error &&
        (error.message.includes('Can\'t reach database server') ||
          error.message.includes('P1001') ||
          error.constructor.name === 'PrismaClientInitializationError')
      ) {
        logger.warn('Database connection error during cart cleanup job:', error.message);
        return;
      }
      logger.error('Error during cart cleanup job:', error);
    }
  }

  /**
   * Start the scheduled cart cleanup job
   */
  static start(): void {
    if (this.task) {
      logger.warn('Cart cleanup job is already running');
      return;
    }

    // Run cleanup immediately on startup
    this.cleanupExpiredCarts().catch((error) => {
      logger.error('Initial cart cleanup job failed:', error);
    });

    // Schedule every minute
    this.task = cron.schedule(
      this.CRON_SCHEDULE,
      async () => {
        await this.cleanupExpiredCarts();
      },
      {
        timezone: 'UTC',
      },
    );

    logger.info('Cart cleanup job scheduled: Every minute');
  }

  /**
   * Stop the scheduled cart cleanup job
   */
  static stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Cart cleanup job stopped');
    }
  }

  /**
   * Get cart cleanup statistics
   */
  static async getCleanupStats(): Promise<{
    activeCartsCount: number;
    reservedCartsCount: number;
    expiringInFiveMinutes: number;
    totalItemsInCarts: number;
  }> {
    try {
      const stats = await CartService.getCartStats();

      return {
        activeCartsCount: stats.activeCarts,
        reservedCartsCount: stats.reservedCarts,
        expiringInFiveMinutes: stats.expiringInMinutes,
        totalItemsInCarts: stats.totalItemsInCarts,
      };
    } catch (error) {
      // If database is not available, return zero counts
      if (
        error instanceof Error &&
        (error.message.includes('Can\'t reach database server') ||
          error.message.includes('P1001') ||
          error.constructor.name === 'PrismaClientInitializationError')
      ) {
        return {
          activeCartsCount: 0,
          reservedCartsCount: 0,
          expiringInFiveMinutes: 0,
          totalItemsInCarts: 0,
        };
      }
      throw error;
    }
  }
}
