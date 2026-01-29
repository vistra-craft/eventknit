import { socialMediaScheduler } from '../../../src/jobs/social-media-scheduler.js';
import { ScheduledPostsService } from '../../../src/services/social-media/scheduled-posts.service.js';
import { logger } from '../../../src/utils/logger.js';

// Mock dependencies
jest.mock('../../../src/services/social-media/scheduled-posts.service.js');
jest.mock('../../../src/utils/logger.js');

describe('SocialMediaScheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Stop scheduler if running from previous tests
    socialMediaScheduler.stop();
  });

  afterEach(() => {
    jest.useRealTimers();
    socialMediaScheduler.stop();
  });

  describe('start', () => {
    it('should start the scheduler with default interval (5 minutes)', () => {
      // Arrange
      (ScheduledPostsService.processScheduledPosts as jest.Mock).mockResolvedValue({
        success: 0,
        failed: 0,
      });

      // Act
      socialMediaScheduler.start();

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'Starting social media scheduler (checking every 5 minutes)',
      );
    });

    it('should start the scheduler with custom interval', () => {
      // Arrange
      (ScheduledPostsService.processScheduledPosts as jest.Mock).mockResolvedValue({
        success: 0,
        failed: 0,
      });

      // Act
      socialMediaScheduler.start(10);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'Starting social media scheduler (checking every 10 minutes)',
      );
    });

    it('should warn if scheduler is already running', () => {
      // Arrange
      (ScheduledPostsService.processScheduledPosts as jest.Mock).mockResolvedValue({
        success: 0,
        failed: 0,
      });
      socialMediaScheduler.start();
      jest.clearAllMocks();

      // Act
      socialMediaScheduler.start();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith('Social media scheduler is already running');
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should process scheduled posts immediately on start', async () => {
      // Arrange
      (ScheduledPostsService.processScheduledPosts as jest.Mock).mockResolvedValue({
        success: 0,
        failed: 0,
      });

      // Act
      socialMediaScheduler.start();

      // Wait for async processing to complete
      await Promise.resolve();

      // Assert
      expect(ScheduledPostsService.processScheduledPosts).toHaveBeenCalledTimes(1);
    });

    it('should schedule interval to run every N minutes', async () => {
      // Arrange
      (ScheduledPostsService.processScheduledPosts as jest.Mock).mockResolvedValue({
        success: 0,
        failed: 0,
      });

      // Act
      socialMediaScheduler.start(5);

      // Fast-forward time by 5 minutes (300000ms)
      await jest.advanceTimersByTimeAsync(5 * 60 * 1000);

      // Assert - should have been called twice (once on start, once after 5 min)
      expect(ScheduledPostsService.processScheduledPosts).toHaveBeenCalledTimes(2);
    });
  });

  describe('stop', () => {
    it('should stop the scheduler successfully', () => {
      // Arrange
      (ScheduledPostsService.processScheduledPosts as jest.Mock).mockResolvedValue({
        success: 0,
        failed: 0,
      });
      socialMediaScheduler.start();
      jest.clearAllMocks();

      // Act
      socialMediaScheduler.stop();

      // Assert
      expect(logger.info).toHaveBeenCalledWith('Social media scheduler stopped');
    });

    it('should do nothing if scheduler is not running', () => {
      // Act
      socialMediaScheduler.stop();

      // Assert
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should prevent further scheduled posts after stopping', async () => {
      // Arrange
      (ScheduledPostsService.processScheduledPosts as jest.Mock).mockResolvedValue({
        success: 0,
        failed: 0,
      });

      socialMediaScheduler.start(5);
      await Promise.resolve(); // Wait for initial call

      const callCountBeforeStop = (ScheduledPostsService.processScheduledPosts as jest.Mock).mock.calls.length;

      // Act
      socialMediaScheduler.stop();

      // Fast-forward time
      jest.advanceTimersByTime(10 * 60 * 1000);

      // Assert - no additional calls after stop
      expect(ScheduledPostsService.processScheduledPosts).toHaveBeenCalledTimes(callCountBeforeStop);
    });
  });

  describe('processScheduledPosts', () => {
    it('should skip processing if already running', async () => {
      // Arrange - Make the first call take a long time
      let resolveFirst: any;
      const firstCallPromise = new Promise((resolve) => {
        resolveFirst = resolve;
      });

      (ScheduledPostsService.processScheduledPosts as jest.Mock)
        .mockImplementationOnce(() => firstCallPromise)
        .mockResolvedValue({ success: 1, failed: 0 });

      // Act
      socialMediaScheduler.start(1);

      // Wait for first call to start
      await Promise.resolve();

      // Try to trigger another call while first is still running (use non-async version)
      jest.advanceTimersByTime(1 * 60 * 1000);
      await Promise.resolve();

      // Assert - second call should be skipped
      expect(logger.debug).toHaveBeenCalledWith(
        'Scheduled posts processing already in progress, skipping...',
      );

      // Clean up - resolve the first promise
      resolveFirst({ success: 0, failed: 0 });
      await Promise.resolve();
    });

    it('should log results when posts are processed successfully', async () => {
      // Arrange
      (ScheduledPostsService.processScheduledPosts as jest.Mock).mockResolvedValue({
        success: 5,
        failed: 2,
      });

      // Act
      socialMediaScheduler.start();
      await Promise.resolve(); // Wait for initial processing

      // Assert
      expect(logger.info).toHaveBeenCalledWith('Scheduled posts processed: 5 success, 2 failed');
    });

    it('should not log if no posts were processed', async () => {
      // Arrange
      (ScheduledPostsService.processScheduledPosts as jest.Mock).mockResolvedValue({
        success: 0,
        failed: 0,
      });

      // Act
      socialMediaScheduler.start();
      await Promise.resolve(); // Wait for initial processing

      // Assert - info should not be called for 0 success and 0 failed
      expect(logger.info).toHaveBeenCalledWith(
        'Starting social media scheduler (checking every 5 minutes)',
      );
      expect(logger.info).not.toHaveBeenCalledWith(expect.stringContaining('Scheduled posts processed'));
    });

    it('should handle errors during post processing', async () => {
      // Arrange
      const processError = new Error('Processing failed');
      (ScheduledPostsService.processScheduledPosts as jest.Mock).mockRejectedValue(processError);

      // Act
      socialMediaScheduler.start();
      await Promise.resolve(); // Wait for initial processing

      // Assert
      expect(logger.error).toHaveBeenCalledWith('Error in social media scheduler:', processError);
    });

    it('should reset isRunning flag after error', async () => {
      // Arrange
      const processError = new Error('Processing failed');
      (ScheduledPostsService.processScheduledPosts as jest.Mock)
        .mockRejectedValueOnce(processError) // First call fails
        .mockResolvedValue({ success: 1, failed: 0 }); // Second call succeeds

      // Act
      socialMediaScheduler.start(1);
      await Promise.resolve(); // Wait for initial call

      // Wait for interval to trigger again
      jest.advanceTimersByTime(1 * 60 * 1000);
      await Promise.resolve();

      // Assert - second call should proceed (not be skipped)
      expect(ScheduledPostsService.processScheduledPosts).toHaveBeenCalledTimes(2);
    });

    it('should reset isRunning flag after successful processing', async () => {
      // Arrange
      (ScheduledPostsService.processScheduledPosts as jest.Mock).mockResolvedValue({
        success: 3,
        failed: 0,
      });

      // Act
      socialMediaScheduler.start(1);
      await Promise.resolve(); // Wait for initial call

      // Advance time for next interval
      jest.advanceTimersByTime(1 * 60 * 1000);
      await Promise.resolve();

      // Assert - should be called multiple times (not blocked)
      expect(ScheduledPostsService.processScheduledPosts).toHaveBeenCalledTimes(2);
    });

    it('should process posts with only successful results', async () => {
      // Arrange
      (ScheduledPostsService.processScheduledPosts as jest.Mock).mockResolvedValue({
        success: 10,
        failed: 0,
      });

      // Act
      socialMediaScheduler.start();
      await Promise.resolve(); // Wait for initial processing

      // Assert
      expect(logger.info).toHaveBeenCalledWith('Scheduled posts processed: 10 success, 0 failed');
    });

    it('should process posts with only failed results', async () => {
      // Arrange
      (ScheduledPostsService.processScheduledPosts as jest.Mock).mockResolvedValue({
        success: 0,
        failed: 3,
      });

      // Act
      socialMediaScheduler.start();
      await Promise.resolve(); // Wait for initial processing

      // Assert
      expect(logger.info).toHaveBeenCalledWith('Scheduled posts processed: 0 success, 3 failed');
    });
  });

  describe('interval timing', () => {
    it('should respect custom interval timing', async () => {
      // Arrange
      (ScheduledPostsService.processScheduledPosts as jest.Mock).mockResolvedValue({
        success: 0,
        failed: 0,
      });

      const customInterval = 15; // 15 minutes

      // Act
      socialMediaScheduler.start(customInterval);
      await Promise.resolve(); // Wait for initial call

      // Fast-forward by 14 minutes - should not trigger yet
      jest.advanceTimersByTime(14 * 60 * 1000);
      const callsAfter14Min = (ScheduledPostsService.processScheduledPosts as jest.Mock).mock.calls.length;

      // Fast-forward by 1 more minute - should trigger now
      jest.advanceTimersByTime(1 * 60 * 1000);
      await Promise.resolve();
      const callsAfter15Min = (ScheduledPostsService.processScheduledPosts as jest.Mock).mock.calls.length;

      // Assert
      expect(callsAfter14Min).toBe(1); // Only initial call
      expect(callsAfter15Min).toBe(2); // Initial + interval call
    });

    it('should continue running at intervals after first execution', async () => {
      // Arrange
      (ScheduledPostsService.processScheduledPosts as jest.Mock).mockResolvedValue({
        success: 1,
        failed: 0,
      });

      // Act
      socialMediaScheduler.start(5);
      await Promise.resolve(); // Initial call

      // Run multiple intervals
      jest.advanceTimersByTime(5 * 60 * 1000); // +5 min
      await Promise.resolve();
      jest.advanceTimersByTime(5 * 60 * 1000); // +5 min
      await Promise.resolve();
      jest.advanceTimersByTime(5 * 60 * 1000); // +5 min
      await Promise.resolve();

      // Assert - should have been called 4 times (initial + 3 intervals)
      expect(ScheduledPostsService.processScheduledPosts).toHaveBeenCalledTimes(4);
    });
  });
});
