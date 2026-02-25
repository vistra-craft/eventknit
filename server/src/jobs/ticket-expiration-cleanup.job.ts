import * as cron from 'node-cron';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Ticket Expiration Cleanup Job
 *
 * Handles three types of expiration:
 * 1. PENDING transfers with expiresAt < now() → mark as EXPIRED
 * 2. LISTED resales with expiresAt < now() → mark as EXPIRED
 * 3. RESERVED resales with reservedAt older than 30 minutes → revert to LISTED
 *    (releases stale payment reservations)
 */
export class TicketExpirationCleanupJob {
  private static readonly CRON_SCHEDULE = '0 */6 * * *'; // Every 6 hours
  private static readonly RESERVATION_TIMEOUT_MINUTES = 30;
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
   * Run all expiration cleanup tasks
   */
  static async cleanup(): Promise<void> {
    try {
      const dbAvailable = await this.isDatabaseAvailable();
      if (!dbAvailable) {
        logger.warn('Database not available, skipping ticket expiration cleanup');
        return;
      }

      const now = new Date();

      // 1. Expire pending transfers
      const expiredTransfers = await prisma.ticketTransfer.updateMany({
        where: {
          status: 'PENDING',
          expiresAt: { lt: now },
        },
        data: {
          status: 'EXPIRED',
        },
      });

      // 2. Expire listed resales
      const expiredResales = await prisma.ticketResale.updateMany({
        where: {
          status: 'LISTED',
          expiresAt: { lt: now },
        },
        data: {
          status: 'EXPIRED',
        },
      });

      // 3. Release stale reserved resales (reserved > 30 minutes ago)
      const reservationCutoff = new Date(now.getTime() - this.RESERVATION_TIMEOUT_MINUTES * 60 * 1000);
      const releasedReservations = await prisma.ticketResale.updateMany({
        where: {
          status: 'RESERVED',
          reservedAt: { lt: reservationCutoff },
        },
        data: {
          status: 'LISTED',
          reservedAt: null,
          paymentReference: null,
          paymentStatus: null,
        },
      });

      const totalChanges = expiredTransfers.count + expiredResales.count + releasedReservations.count;
      if (totalChanges > 0) {
        logger.info(
          `Ticket expiration cleanup: ${expiredTransfers.count} transfers expired, ` +
          `${expiredResales.count} resales expired, ` +
          `${releasedReservations.count} stale reservations released`,
        );
      }
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('Can\'t reach database server') ||
        error.message.includes('P1001') ||
        error.constructor.name === 'PrismaClientInitializationError'
      )) {
        logger.warn('Database connection error during ticket expiration cleanup, skipping this run:', error.message);
        return;
      }
      logger.error('Error during ticket expiration cleanup:', error);
    }
  }

  /**
   * Start the scheduled cleanup job
   */
  static start(): void {
    if (this.task) {
      logger.warn('Ticket expiration cleanup job is already running');
      return;
    }

    this.task = cron.schedule(this.CRON_SCHEDULE, async () => {
      await this.cleanup();
    }, {
      timezone: 'UTC',
    });

    logger.info('Ticket expiration cleanup job scheduled: every 6 hours');
  }

  /**
   * Stop the scheduled cleanup job
   */
  static stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Ticket expiration cleanup job stopped');
    }
  }
}
