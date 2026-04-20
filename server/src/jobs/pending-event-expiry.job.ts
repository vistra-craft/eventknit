import * as cron from 'node-cron';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { EventStatus } from '@prisma/client';

/**
 * Pending Event Expiry Job
 *
 * Automatically rejects PENDING events whose start date has passed.
 * Industry standard: approving a past event is meaningless — auto-expire it
 * with a system rejection reason so admins can see it in the Declined page.
 *
 * Runs every hour.
 */
export class PendingEventExpiryJob {
  private static readonly CRON_SCHEDULE = '0 * * * *'; // Every hour, on the hour
  private static task: cron.ScheduledTask | null = null;

  private static async isDatabaseAvailable(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (_error) {
      return false;
    }
  }

  static async expireStaleEvents(): Promise<void> {
    try {
      const dbAvailable = await this.isDatabaseAvailable();
      if (!dbAvailable) {
        logger.warn('Database not available, skipping pending event expiry job');
        return;
      }

      const now = new Date();

      // Find PENDING events whose startDate is in the past
      const staleEvents = await prisma.event.findMany({
        where: {
          status: EventStatus.PENDING,
          startDate: { lt: now },
          deletedAt: null,
        },
        select: { id: true, title: true, startDate: true },
      });

      if (staleEvents.length === 0) {
        logger.debug('No stale pending events to expire');
        return;
      }

      logger.info(`Found ${staleEvents.length} stale pending event(s) to auto-expire`);

      let expired = 0;
      for (const event of staleEvents) {
        try {
          await prisma.event.update({
            where: { id: event.id },
            data: {
              status: EventStatus.REJECTED,
              rejectionReason: 'Automatically rejected — event start date passed before approval was granted.',
              rejectedAt: now,
              // No rejectedBy — system action
            },
          });
          expired++;
          logger.info(`Auto-expired event "${event.title}" (${event.id}), startDate was ${event.startDate?.toISOString()}`);
        } catch (err) {
          logger.error(`Failed to auto-expire event ${event.id}:`, err);
        }
      }

      logger.info(`Pending event expiry job completed — expired ${expired}/${staleEvents.length} events`);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('Can\'t reach database server') ||
          error.message.includes('P1001') ||
          error.constructor.name === 'PrismaClientInitializationError')
      ) {
        logger.warn('Database connection error during pending event expiry job, skipping this run:', error.message);
        return;
      }
      logger.error('Error in pending event expiry job:', error);
    }
  }

  static start(): void {
    if (this.task) {
      logger.warn('Pending event expiry job is already running');
      return;
    }

    try {
      this.task = cron.schedule(this.CRON_SCHEDULE, async () => {
        await this.expireStaleEvents();
      });

      logger.info('✅ Pending event expiry job started');
    } catch (error) {
      logger.error('Failed to start pending event expiry job:', error);
      throw error;
    }
  }

  static stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Pending event expiry job stopped');
    }
  }
}
