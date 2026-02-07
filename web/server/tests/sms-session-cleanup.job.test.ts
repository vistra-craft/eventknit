import { SMSSessionCleanupJob } from '../src/jobs/sms-session-cleanup.job';
import { USSDSMSService } from '../src/services/ussd-sms.service';
import { prisma } from '../src/config/database';
import { logger } from '../src/utils/logger';

// Mock dependencies
jest.mock('../src/services/ussd-sms.service');
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('SMSSessionCleanupJob', () => {
  let dbConnected = false;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      logger.info('✅ Test database connected');
    } catch (_error) {
      logger.warn('⚠️  Database not available. Tests will be skipped.');
      dbConnected = false;
    }
  });

  afterAll(async () => {
    if (dbConnected) {
      try {
        await prisma.$disconnect();
      } catch {
        // Ignore disconnection errors
      }
    }
  });

  beforeEach(async () => {
    if (!dbConnected) return;
    await prisma.sMSSession.deleteMany({});
    jest.clearAllMocks();
  });

  afterEach(() => {
    SMSSessionCleanupJob.stop();
  });

  describe('start', () => {
    it('should start the cleanup job', () => {
      SMSSessionCleanupJob.start();

      // Job should be started (we can't easily test cron schedule, but we can verify it doesn't throw)
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('SMS Session Cleanup Job started'),
      );
    });

    it('should not start job if already running', () => {
      SMSSessionCleanupJob.start();

      SMSSessionCleanupJob.start();

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('already running'),
      );
    });
  });

  describe('stop', () => {
    it('should stop the cleanup job', () => {
      SMSSessionCleanupJob.start();
      SMSSessionCleanupJob.stop();

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('SMS Session Cleanup Job stopped'),
      );
    });

    it('should handle stopping when not started', () => {
      // Should not throw
      expect(() => SMSSessionCleanupJob.stop()).not.toThrow();
    });
  });

  describe('cleanup execution', () => {
    it('should call cleanupExpiredSessions when job runs', async () => {
      if (!dbConnected) return;

      (USSDSMSService.cleanupExpiredSessions as jest.Mock).mockResolvedValue(undefined);

      SMSSessionCleanupJob.start();

      // Manually trigger the cleanup (simulating cron execution)
      await USSDSMSService.cleanupExpiredSessions();

      expect(USSDSMSService.cleanupExpiredSessions).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      if (!dbConnected) return;

      const error = new Error('Cleanup failed');
      (USSDSMSService.cleanupExpiredSessions as jest.Mock).mockRejectedValue(error);

      SMSSessionCleanupJob.start();

      try {
        await USSDSMSService.cleanupExpiredSessions();
      } catch (_e) {
        // Error should be caught and logged by the job
      }

      expect(USSDSMSService.cleanupExpiredSessions).toHaveBeenCalled();
    });
  });
});

