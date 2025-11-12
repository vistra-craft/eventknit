import * as cron from 'node-cron';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Token Cleanup Job
 * 
 * Removes expired EmailVerification tokens that are older than 7 days
 * Runs daily at 2:00 AM UTC
 */
export class TokenCleanupJob {
  private static readonly CLEANUP_AGE_DAYS = 7;
  private static readonly CRON_SCHEDULE = '0 2 * * *'; // Daily at 2:00 AM UTC
  private static task: cron.ScheduledTask | null = null;

  /**
   * Clean up expired tokens
   */
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.CLEANUP_AGE_DAYS);

      logger.info(`Starting token cleanup job - removing tokens expired before ${cutoffDate.toISOString()}`);

      // Delete expired tokens that are older than CLEANUP_AGE_DAYS
      const result = await prisma.emailVerification.deleteMany({
        where: {
          expiresAt: {
            lt: cutoffDate,
          },
        },
      });

      logger.info(`Token cleanup completed: ${result.count} expired tokens removed`);
    } catch (error) {
      logger.error('Error during token cleanup:', error);
      throw error;
    }
  }

  /**
   * Start the scheduled cleanup job
   */
  static start(): void {
    if (this.task) {
      logger.warn('Token cleanup job is already running');
      return;
    }

    // Run cleanup immediately on startup (optional - can be removed if not desired)
    this.cleanupExpiredTokens().catch((error) => {
      logger.error('Initial token cleanup failed:', error);
    });

    // Schedule daily cleanup
    this.task = cron.schedule(this.CRON_SCHEDULE, async () => {
      logger.info('Running scheduled token cleanup job...');
      await this.cleanupExpiredTokens();
    }, {
      timezone: 'UTC',
    });

    logger.info(`Token cleanup job scheduled: Daily at 2:00 AM UTC (removes tokens expired > ${this.CLEANUP_AGE_DAYS} days ago)`);
  }

  /**
   * Stop the scheduled cleanup job
   */
  static stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Token cleanup job stopped');
    }
  }

  /**
   * Get cleanup statistics (for admin dashboard)
   */
  static async getCleanupStats(): Promise<{
    expiredTokensCount: number;
    cutoffDate: Date;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.CLEANUP_AGE_DAYS);

    const expiredTokensCount = await prisma.emailVerification.count({
      where: {
        expiresAt: {
          lt: cutoffDate,
        },
      },
    });

    return {
      expiredTokensCount,
      cutoffDate,
    };
  }
}

