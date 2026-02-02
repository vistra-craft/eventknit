import * as cron from 'node-cron';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Token Cleanup Job
 *
 * Removes:
 * - Expired EmailVerification tokens older than 7 days
 * - Expired RefreshTokens older than 7 days
 * - Revoked RefreshTokens older than 30 days
 *
 * Runs daily at 2:00 AM UTC
 */
export class TokenCleanupJob {
  private static readonly CLEANUP_AGE_DAYS = 7;
  private static readonly REVOKED_TOKEN_RETENTION_DAYS = 30;
  private static readonly CRON_SCHEDULE = '0 2 * * *'; // Daily at 2:00 AM UTC
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
   * Clean up expired tokens
   */
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      // Check if database is available before proceeding
      const dbAvailable = await this.isDatabaseAvailable();
      if (!dbAvailable) {
        logger.warn('Database not available, skipping token cleanup job');
        return;
      }

      const expiredCutoffDate = new Date();
      expiredCutoffDate.setDate(expiredCutoffDate.getDate() - this.CLEANUP_AGE_DAYS);

      const revokedCutoffDate = new Date();
      revokedCutoffDate.setDate(revokedCutoffDate.getDate() - this.REVOKED_TOKEN_RETENTION_DAYS);

      logger.info(`Starting token cleanup job - removing tokens expired before ${expiredCutoffDate.toISOString()}`);

      // Delete expired EmailVerification tokens that are older than CLEANUP_AGE_DAYS
      const emailVerificationResult = await prisma.emailVerification.deleteMany({
        where: {
          expiresAt: {
            lt: expiredCutoffDate,
          },
        },
      });

      // Delete expired RefreshTokens that are older than CLEANUP_AGE_DAYS
      const expiredRefreshTokenResult = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: expiredCutoffDate,
          },
        },
      });

      // Delete revoked RefreshTokens that are older than REVOKED_TOKEN_RETENTION_DAYS
      const revokedRefreshTokenResult = await prisma.refreshToken.deleteMany({
        where: {
          revoked: true,
          revokedAt: {
            lt: revokedCutoffDate,
          },
        },
      });

      logger.info(
        `Token cleanup completed: ${emailVerificationResult.count} email verification tokens, ` +
        `${expiredRefreshTokenResult.count} expired refresh tokens, ` +
        `${revokedRefreshTokenResult.count} revoked refresh tokens removed`
      );
    } catch (error) {
      // Check if it's a database connection error
      if (error instanceof Error && (
        error.message.includes('Can\'t reach database server') ||
        error.message.includes('P1001') || // Prisma connection error code
        error.constructor.name === 'PrismaClientInitializationError'
      )) {
        logger.warn('Database connection error during token cleanup, skipping this run:', error.message);
        return;
      }
      logger.error('Error during token cleanup:', error);
      // Don't throw - allow job to continue running
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

    logger.info(
      `Token cleanup job scheduled: Daily at 2:00 AM UTC ` +
      `(removes expired tokens > ${this.CLEANUP_AGE_DAYS} days, revoked refresh tokens > ${this.REVOKED_TOKEN_RETENTION_DAYS} days)`
    );
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
    expiredEmailVerificationCount: number;
    expiredRefreshTokenCount: number;
    revokedRefreshTokenCount: number;
    expiredCutoffDate: Date;
    revokedCutoffDate: Date;
  }> {
    const expiredCutoffDate = new Date();
    expiredCutoffDate.setDate(expiredCutoffDate.getDate() - this.CLEANUP_AGE_DAYS);

    const revokedCutoffDate = new Date();
    revokedCutoffDate.setDate(revokedCutoffDate.getDate() - this.REVOKED_TOKEN_RETENTION_DAYS);

    try {
      const [expiredEmailVerificationCount, expiredRefreshTokenCount, revokedRefreshTokenCount] =
        await Promise.all([
          prisma.emailVerification.count({
            where: {
              expiresAt: {
                lt: expiredCutoffDate,
              },
            },
          }),
          prisma.refreshToken.count({
            where: {
              expiresAt: {
                lt: expiredCutoffDate,
              },
            },
          }),
          prisma.refreshToken.count({
            where: {
              revoked: true,
              revokedAt: {
                lt: revokedCutoffDate,
              },
            },
          }),
        ]);

      return {
        expiredEmailVerificationCount,
        expiredRefreshTokenCount,
        revokedRefreshTokenCount,
        expiredCutoffDate,
        revokedCutoffDate,
      };
    } catch (error) {
      // If database is not available, return zero counts
      if (error instanceof Error && (
        error.message.includes('Can\'t reach database server') ||
        error.message.includes('P1001') ||
        error.constructor.name === 'PrismaClientInitializationError'
      )) {
        return {
          expiredEmailVerificationCount: 0,
          expiredRefreshTokenCount: 0,
          revokedRefreshTokenCount: 0,
          expiredCutoffDate,
          revokedCutoffDate,
        };
      }
      throw error;
    }
  }
}

