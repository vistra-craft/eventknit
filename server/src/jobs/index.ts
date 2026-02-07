import { logger } from '../utils/logger.js';
import { TokenCleanupJob } from './token-cleanup.job.js';
import { PaymentTimeoutJob } from './payment-timeout.job.js';
import { BulkMessageSchedulerJob } from './bulk-message-scheduler.job.js';
import { EventReminderJob } from './event-reminder.job.js';
import { SMSSessionCleanupJob } from './sms-session-cleanup.job.js';
import { PostEventSurveyJob } from './post-event-survey.job.js';
import { EmailDigestJob } from './email-digest.job.js';
import { CartCleanupJob } from './cart-cleanup.job.js';

/**
 * Initialize all scheduled jobs
 */
export function initializeJobs(): void {
  try {
    TokenCleanupJob.start();
    PaymentTimeoutJob.start();
    BulkMessageSchedulerJob.start();
    EventReminderJob.start();
    SMSSessionCleanupJob.start();
    PostEventSurveyJob.start();
    EmailDigestJob.start();
    CartCleanupJob.start();

    logger.info('Scheduled jobs initialized (8 jobs)');
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
    TokenCleanupJob.stop();
    PaymentTimeoutJob.stop();
    BulkMessageSchedulerJob.stop();
    EventReminderJob.stop();
    SMSSessionCleanupJob.stop();
    PostEventSurveyJob.stop();
    EmailDigestJob.stop();
    CartCleanupJob.stop();

    logger.info('Scheduled jobs stopped');
  } catch (error) {
    logger.error('Error stopping scheduled jobs:', error);
  }
}

// Export individual jobs for direct access if needed
export { TokenCleanupJob } from './token-cleanup.job.js';
export { PaymentTimeoutJob } from './payment-timeout.job.js';
export { BulkMessageSchedulerJob } from './bulk-message-scheduler.job.js';
export { EventReminderJob } from './event-reminder.job.js';
export { SMSSessionCleanupJob } from './sms-session-cleanup.job.js';
export { PostEventSurveyJob } from './post-event-survey.job.js';
export { EmailDigestJob } from './email-digest.job.js';
export { CartCleanupJob } from './cart-cleanup.job.js';

