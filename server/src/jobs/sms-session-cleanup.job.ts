import * as cron from 'node-cron';
import { USSDSMSService } from '../services/ussd-sms.service.js';
import { logger } from '../utils/logger.js';

/**
 * Scheduled job to clean up expired SMS sessions
 * Runs every hour
 */
export class SMSSessionCleanupJob {
  private static cronJob: cron.ScheduledTask | null = null;

  /**
   * Start the cleanup job
   */
  static start(): void {
    if (this.cronJob) {
      logger.warn('SMS Session Cleanup Job is already running');
      return;
    }

    // Run every hour at minute 0
    this.cronJob = cron.schedule('0 * * * *', async () => {
      try {
        logger.info('Running SMS session cleanup job...');
        await USSDSMSService.cleanupExpiredSessions();
        logger.info('SMS session cleanup job completed successfully');
      } catch (error) {
        logger.error('SMS session cleanup job failed:', error);
      }
    });

    logger.info('✅ SMS Session Cleanup Job started (runs every hour)');
  }

  /**
   * Stop the cleanup job
   */
  static stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('SMS Session Cleanup Job stopped');
    }
  }
}

