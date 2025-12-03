import * as cron from 'node-cron';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { RegistrationStatus } from '@prisma/client';
import { EventService } from '../services/event.service.js';

/**
 * Payment Timeout Job
 *
 * Cancels abandoned registrations with PENDING payment status older than 24 hours
 * Restores event capacity for cancelled registrations
 * Runs every hour
 */
export class PaymentTimeoutJob {
  private static readonly TIMEOUT_HOURS = 24;
  private static readonly CRON_SCHEDULE = '0 * * * *'; // Every hour at minute 0
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
   * Cancel abandoned payments
   */
  static async cancelAbandonedPayments(): Promise<void> {
    try {
      // Check if database is available before proceeding
      const dbAvailable = await this.isDatabaseAvailable();
      if (!dbAvailable) {
        logger.warn('Database not available, skipping payment timeout job');
        return;
      }

      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - this.TIMEOUT_HOURS);

      logger.info(`Starting payment timeout job - cancelling payments pending since before ${cutoffDate.toISOString()}`);

      // Find registrations with PENDING payment status older than TIMEOUT_HOURS
      const abandonedRegistrations = await prisma.eventRegistration.findMany({
        where: {
          paymentStatus: 'PENDING',
          status: RegistrationStatus.PENDING,
          createdAt: {
            lt: cutoffDate,
          },
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              capacity: true,
              availableSlots: true,
            },
          },
          attendee: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (abandonedRegistrations.length === 0) {
        logger.info('No abandoned payments found');
        return;
      }

      logger.info(`Found ${abandonedRegistrations.length} abandoned payment(s) to cancel`);

      let cancelledCount = 0;
      let capacityRestoredCount = 0;

      // Process each abandoned registration
      for (const registration of abandonedRegistrations) {
        try {
          // Use transaction to ensure atomic cancellation and capacity restoration
          await prisma.$transaction(async (tx) => {
            // Re-check registration status (might have been updated by another process)
            const currentRegistration = await tx.eventRegistration.findUnique({
              where: { id: registration.id },
              select: {
                id: true,
                status: true,
                paymentStatus: true,
                quantity: true,
                createdAt: true,
              },
            });

            // Skip if already cancelled or payment completed
            if (
              !currentRegistration ||
              currentRegistration.status === RegistrationStatus.CANCELLED ||
              currentRegistration.paymentStatus === 'COMPLETED'
            ) {
              return;
            }

            // Use status validation to ensure consistency
            const syncedStatus = EventService.validateAndSyncStatus(
              currentRegistration.status,
              currentRegistration.paymentStatus || 'PENDING',
              'FAILED',
              RegistrationStatus.CANCELLED,
            );

            // Cancel registration
            await tx.eventRegistration.update({
              where: { id: registration.id },
              data: {
                status: syncedStatus.status,
                paymentStatus: syncedStatus.paymentStatus,
                cancelledAt: new Date(),
                cancelledBy: null, // System cancellation
              },
            });

            // Restore event capacity if capacity exists
            if (registration.event.capacity !== null) {
              const newAvailableSlots = (registration.event.availableSlots || registration.event.capacity) + registration.quantity;
              await tx.event.update({
                where: { id: registration.event.id },
                data: {
                  availableSlots: Math.min(registration.event.capacity, newAvailableSlots),
                },
              });
              capacityRestoredCount++;
            }

            cancelledCount++;
            logger.info(`Cancelled abandoned payment: registration ${registration.id} for event: ${registration.event.title}`);
          });
        } catch (error) {
          logger.error(`Error cancelling abandoned payment for registration ${registration.id}:`, error);
          // Continue with next registration
        }
      }

      logger.info(
        `Payment timeout job completed: ${cancelledCount} registration(s) cancelled, ${capacityRestoredCount} event(s) capacity restored`,
      );
    } catch (error) {
      // Check if it's a database connection error
      if (error instanceof Error && (
        error.message.includes('Can\'t reach database server') ||
        error.message.includes('P1001') || // Prisma connection error code
        error.constructor.name === 'PrismaClientInitializationError'
      )) {
        logger.warn('Database connection error during payment timeout job, skipping this run:', error.message);
        return;
      }
      logger.error('Error during payment timeout job:', error);
      // Don't throw - allow job to continue running
    }
  }

  /**
   * Start the scheduled payment timeout job
   */
  static start(): void {
    if (this.task) {
      logger.warn('Payment timeout job is already running');
      return;
    }

    // Run cleanup immediately on startup (optional - can be removed if not desired)
    this.cancelAbandonedPayments().catch((error) => {
      logger.error('Initial payment timeout job failed:', error);
    });

    // Schedule hourly cleanup
    this.task = cron.schedule(
      this.CRON_SCHEDULE,
      async () => {
        logger.info('Running scheduled payment timeout job...');
        await this.cancelAbandonedPayments();
      },
      {
        timezone: 'UTC',
      },
    );

    logger.info(
      `Payment timeout job scheduled: Every hour (cancels payments pending > ${this.TIMEOUT_HOURS} hours)`,
    );
  }

  /**
   * Stop the scheduled payment timeout job
   */
  static stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Payment timeout job stopped');
    }
  }

  /**
   * Get payment timeout statistics (for admin dashboard)
   */
  static async getTimeoutStats(): Promise<{
    abandonedPaymentsCount: number;
    timeoutDate: Date;
  }> {
    const timeoutDate = new Date();
    timeoutDate.setHours(timeoutDate.getHours() - this.TIMEOUT_HOURS);

    try {
      const abandonedPaymentsCount = await prisma.eventRegistration.count({
        where: {
          paymentStatus: 'PENDING',
          status: RegistrationStatus.PENDING,
          createdAt: {
            lt: timeoutDate,
          },
        },
      });

      return {
        abandonedPaymentsCount,
        timeoutDate,
      };
    } catch (error) {
      // If database is not available, return zero count
      if (error instanceof Error && (
        error.message.includes('Can\'t reach database server') ||
        error.message.includes('P1001') ||
        error.constructor.name === 'PrismaClientInitializationError'
      )) {
        return {
          abandonedPaymentsCount: 0,
          timeoutDate,
        };
      }
      throw error;
    }
  }
}

