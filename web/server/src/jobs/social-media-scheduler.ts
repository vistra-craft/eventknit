/**
 * Social Media Scheduler Job
 * 
 * Background job to process scheduled social media posts
 * Run this as a cron job (e.g., every 5 minutes)
 */

import { ScheduledPostsService } from '../services/social-media/scheduled-posts.service.js';
import { logger } from '../utils/logger.js';

/* global NodeJS */
class SocialMediaScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the scheduler
   * @param intervalMinutes - How often to check for scheduled posts (default: 5 minutes)
   */
  start(intervalMinutes: number = 5) {
    if (this.intervalId) {
      logger.warn('Social media scheduler is already running');
      return;
    }

    logger.info(`Starting social media scheduler (checking every ${intervalMinutes} minutes)`);

    // Run immediately on start
    this.processScheduledPosts();

    // Then run on interval
    this.intervalId = setInterval(() => {
      this.processScheduledPosts();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Social media scheduler stopped');
    }
  }

  /**
   * Process scheduled posts
   */
  private async processScheduledPosts() {
    if (this.isRunning) {
      logger.debug('Scheduled posts processing already in progress, skipping...');
      return;
    }

    try {
      this.isRunning = true;
      const results = await ScheduledPostsService.processScheduledPosts();
      
      if (results.success > 0 || results.failed > 0) {
        logger.info(`Scheduled posts processed: ${results.success} success, ${results.failed} failed`);
      }
    } catch (error) {
      logger.error('Error in social media scheduler:', error);
    } finally {
      this.isRunning = false;
    }
  }
}

// Export singleton instance
export const socialMediaScheduler = new SocialMediaScheduler();

// Auto-start in production (optional)
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_SOCIAL_SCHEDULER === 'true') {
  const interval = parseInt(process.env.SOCIAL_SCHEDULER_INTERVAL_MINUTES || '5', 10);
  socialMediaScheduler.start(interval);
}
