import { logger } from '../utils/logger.js';
import { TokenCleanupJob } from './token-cleanup.job.js';
import { PaymentTimeoutJob } from './payment-timeout.job.js';
import { BulkMessageSchedulerJob } from './bulk-message-scheduler.job.js';
import { EventReminderJob } from './event-reminder.job.js';

/**
 * Initialize all scheduled jobs
 */
export function initializeJobs(): void {
  try {
    logger.info('Initializing scheduled jobs...');
    
    // Start token cleanup job
    TokenCleanupJob.start();
    
    // Start payment timeout job
    PaymentTimeoutJob.start();
    
    // Start bulk message scheduler job
    BulkMessageSchedulerJob.start();
    
    // Start event reminder job
    EventReminderJob.start();
    
    logger.info('✅ All scheduled jobs initialized');
  } catch (error) {
    logger.error('Failed to initialize scheduled jobs:', error);
    throw error;
  }
}

/**
 * Stop all scheduled jobs (for graceful shutdown)
 */
export function stopJobs(): void {
  try {
    logger.info('Stopping scheduled jobs...');
    
    TokenCleanupJob.stop();
    PaymentTimeoutJob.stop();
    BulkMessageSchedulerJob.stop();
    EventReminderJob.stop();
    
    logger.info('✅ All scheduled jobs stopped');
  } catch (error) {
    logger.error('Error stopping scheduled jobs:', error);
  }
}

// Export individual jobs for direct access if needed
export { TokenCleanupJob } from './token-cleanup.job.js';
export { PaymentTimeoutJob } from './payment-timeout.job.js';
export { BulkMessageSchedulerJob } from './bulk-message-scheduler.job.js';
export { EventReminderJob } from './event-reminder.job.js';

