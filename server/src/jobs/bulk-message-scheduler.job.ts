import * as cron from 'node-cron';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { BulkMessageStatus } from '@prisma/client';
import { BulkMessageService } from '../services/bulk-message.service.js';

/**
 * Bulk Message Scheduler Job
 *
 * Processes scheduled bulk messages that are ready to be sent
 * Runs every 5 minutes
 */
export class BulkMessageSchedulerJob {
  private static readonly CRON_SCHEDULE = '*/5 * * * *'; // Every 5 minutes
  private static task: cron.ScheduledTask | null = null;

  /**
   * Process scheduled bulk messages
   */
  static async processScheduledMessages(): Promise<void> {
    try {
      const now = new Date();

      logger.info('Starting bulk message scheduler job');

      // Find scheduled messages that are ready to be sent
      const scheduledMessages = await prisma.bulkMessage.findMany({
        where: {
          status: BulkMessageStatus.SCHEDULED,
          scheduledAt: {
            lte: now, // Scheduled time has passed
          },
        },
        select: {
          id: true,
          title: true,
          scheduledAt: true,
        },
      });

      if (scheduledMessages.length === 0) {
        logger.debug('No scheduled bulk messages ready to be sent');
        return;
      }

      logger.info(`Found ${scheduledMessages.length} scheduled bulk message(s) ready to be sent`);

      // Process each scheduled message
      for (const message of scheduledMessages) {
        try {
          logger.info(`Processing scheduled bulk message: ${message.id} (${message.title})`);
          await BulkMessageService.sendBulkMessage(message.id);
          logger.info(`Successfully sent scheduled bulk message: ${message.id}`);
        } catch (error) {
          logger.error(`Failed to send scheduled bulk message ${message.id}:`, error);
          // Continue with other messages even if one fails
        }
      }

      logger.info(`Bulk message scheduler job completed. Processed ${scheduledMessages.length} message(s)`);
    } catch (error) {
      logger.error('Error in bulk message scheduler job:', error);
    }
  }

  /**
   * Start the scheduled job
   */
  static start(): void {
    if (this.task) {
      logger.warn('Bulk message scheduler job is already running');
      return;
    }

    try {
      this.task = cron.schedule(this.CRON_SCHEDULE, async () => {
        await this.processScheduledMessages();
      });

      logger.info('✅ Bulk message scheduler job started');
    } catch (error) {
      logger.error('Failed to start bulk message scheduler job:', error);
      throw error;
    }
  }

  /**
   * Stop the scheduled job
   */
  static stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Bulk message scheduler job stopped');
    }
  }
}

