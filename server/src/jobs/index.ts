import { logger } from '../utils/logger';
import { TokenCleanupJob } from './token-cleanup.job';
import { PaymentTimeoutJob } from './payment-timeout.job';

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
    
    logger.info('✅ All scheduled jobs stopped');
  } catch (error) {
    logger.error('Error stopping scheduled jobs:', error);
  }
}

// Export individual jobs for direct access if needed
export { TokenCleanupJob } from './token-cleanup.job';
export { PaymentTimeoutJob } from './payment-timeout.job';

