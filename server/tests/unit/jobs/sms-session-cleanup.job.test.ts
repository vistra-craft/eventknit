import { SMSSessionCleanupJob } from '../../../src/jobs/sms-session-cleanup.job.js';
import { USSDSMSService } from '../../../src/services/ussd-sms.service.js';
import { logger } from '../../../src/utils/logger.js';
import * as cron from 'node-cron';

// Mock dependencies
vi.mock('../../../src/services/ussd-sms.service.js');
vi.mock('../../../src/utils/logger.js');
vi.mock('node-cron');

describe('SMSSessionCleanupJob', () => {
  let mockScheduledTask: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock scheduled task
    mockScheduledTask = {
      stop: vi.fn(),
    };

    // Mock cron.schedule to return the mock task
    (cron.schedule as vi.Mock).mockReturnValue(mockScheduledTask);
  });

  afterEach(() => {
    // Stop job after each test to clean up
    SMSSessionCleanupJob.stop();
  });

  describe('start', () => {
    it('should start the cleanup job successfully', () => {
      // Act
      SMSSessionCleanupJob.start();

      // Assert
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 * * * *', // Every hour at minute 0
        expect.any(Function),
      );
      expect(logger.info).toHaveBeenCalledWith(
        '✅ SMS Session Cleanup Job started (runs every hour)',
      );
    });

    it('should warn if job is already running', () => {
      // Arrange
      SMSSessionCleanupJob.start();
      vi.clearAllMocks();

      // Act
      SMSSessionCleanupJob.start();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith('SMS Session Cleanup Job is already running');
      expect(cron.schedule).not.toHaveBeenCalled();
    });

    it('should execute cleanup when cron job triggers', async () => {
      // Arrange
      (USSDSMSService.cleanupExpiredSessions as vi.Mock).mockResolvedValue(undefined);

      // Act
      SMSSessionCleanupJob.start();

      // Get the callback function passed to cron.schedule
      const cronCallback = (cron.schedule as vi.Mock).mock.calls[0][1];

      // Execute the callback
      await cronCallback();

      // Assert
      expect(logger.info).toHaveBeenCalledWith('Running SMS session cleanup job...');
      expect(USSDSMSService.cleanupExpiredSessions).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith('SMS session cleanup job completed successfully');
    });

    it('should handle errors during cleanup execution', async () => {
      // Arrange
      const mockError = new Error('Cleanup failed');
      (USSDSMSService.cleanupExpiredSessions as vi.Mock).mockRejectedValue(mockError);

      // Act
      SMSSessionCleanupJob.start();

      // Get the callback function passed to cron.schedule
      const cronCallback = (cron.schedule as vi.Mock).mock.calls[0][1];

      // Execute the callback
      await cronCallback();

      // Assert
      expect(logger.info).toHaveBeenCalledWith('Running SMS session cleanup job...');
      expect(USSDSMSService.cleanupExpiredSessions).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith('SMS session cleanup job failed:', mockError);
    });
  });

  describe('stop', () => {
    it('should stop the cleanup job successfully', () => {
      // Arrange
      SMSSessionCleanupJob.start();
      vi.clearAllMocks();

      // Act
      SMSSessionCleanupJob.stop();

      // Assert
      expect(mockScheduledTask.stop).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith('SMS Session Cleanup Job stopped');
    });

    it('should do nothing if job is not running', () => {
      // Act
      SMSSessionCleanupJob.stop();

      // Assert
      expect(mockScheduledTask.stop).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should allow restart after stopping', () => {
      // Arrange
      SMSSessionCleanupJob.start();
      SMSSessionCleanupJob.stop();
      vi.clearAllMocks();

      // Act
      SMSSessionCleanupJob.start();

      // Assert
      expect(cron.schedule).toHaveBeenCalledTimes(1);
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });
});
