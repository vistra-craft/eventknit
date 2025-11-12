import * as cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { RegistrationStatus } from '@prisma/client';

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
   * Cancel abandoned payments
   */
  static async cancelAbandonedPayments(): Promise<void> {
    try {
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

            // Cancel registration
            await tx.eventRegistration.update({
              where: { id: registration.id },
              data: {
                status: RegistrationStatus.CANCELLED,
                paymentStatus: 'FAILED',
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
      logger.error('Error during payment timeout job:', error);
      throw error;
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
  }
}

