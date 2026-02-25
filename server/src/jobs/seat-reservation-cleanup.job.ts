import * as cron from 'node-cron';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Seat Reservation Cleanup Job
 *
 * Releases expired seat reservations so seats become available again.
 * Reservations are time-critical (15-minute window), so this runs
 * every 5 minutes to keep seat availability accurate.
 */
export class SeatReservationCleanupJob {
  private static readonly CRON_SCHEDULE = '*/5 * * * *'; // Every 5 minutes
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
   * Release expired seat reservations
   */
  static async cleanupExpiredReservations(): Promise<void> {
    try {
      const dbAvailable = await this.isDatabaseAvailable();
      if (!dbAvailable) {
        logger.warn('Database not available, skipping seat reservation cleanup');
        return;
      }

      const { SeatSelectionService } = await import('../services/seat-selection.service.js');
      const result = await SeatSelectionService.cleanupExpiredReservations();

      if (result.cleaned > 0) {
        logger.info(`Seat reservation cleanup: ${result.cleaned} expired reservations released`);
      }
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('Can\'t reach database server') ||
        error.message.includes('P1001') ||
        error.constructor.name === 'PrismaClientInitializationError'
      )) {
        logger.warn('Database connection error during seat reservation cleanup, skipping this run:', error.message);
        return;
      }
      logger.error('Error during seat reservation cleanup:', error);
    }
  }

  /**
   * Start the scheduled cleanup job
   */
  static start(): void {
    if (this.task) {
      logger.warn('Seat reservation cleanup job is already running');
      return;
    }

    this.task = cron.schedule(this.CRON_SCHEDULE, async () => {
      await this.cleanupExpiredReservations();
    }, {
      timezone: 'UTC',
    });

    logger.info('Seat reservation cleanup job scheduled: every 5 minutes');
  }

  /**
   * Stop the scheduled cleanup job
   */
  static stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Seat reservation cleanup job stopped');
    }
  }
}
