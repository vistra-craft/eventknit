import { TokenCleanupJob } from '../../../src/jobs/token-cleanup.job.js';
import { prisma } from '../../../src/config/database.js';
import { logger } from '../../../src/utils/logger.js';
import * as cron from 'node-cron';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    emailVerification: {
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    refreshToken: {
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));
jest.mock('../../../src/utils/logger.js');
jest.mock('node-cron');

describe('TokenCleanupJob', () => {
  let mockScheduledTask: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock database as available by default
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);

    // Create mock scheduled task
    mockScheduledTask = {
      stop: jest.fn(),
    };

    // Mock cron.schedule to return the mock task
    (cron.schedule as jest.Mock).mockReturnValue(mockScheduledTask);
  });

  afterEach(() => {
    TokenCleanupJob.stop();
  });

  describe('start', () => {
    it('should start the token cleanup job successfully', () => {
      // Act
      TokenCleanupJob.start();

      // Assert
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 2 * * *', // Daily at 2:00 AM UTC
        expect.any(Function),
        { timezone: 'UTC' },
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Token cleanup job scheduled: Daily at 2:00 AM UTC (removes expired tokens > 7 days, revoked refresh tokens > 30 days)',
      );
    });

    it('should run cleanup immediately on startup', () => {
      // Arrange
      (prisma.emailVerification.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

      // Act
      TokenCleanupJob.start();

      // Assert - cleanup was called immediately
      expect(logger.info).toHaveBeenCalled();
    });

    it('should warn if job is already running', () => {
      // Arrange
      TokenCleanupJob.start();
      jest.clearAllMocks();

      // Act
      TokenCleanupJob.start();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith('Token cleanup job is already running');
      expect(cron.schedule).not.toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should stop the token cleanup job successfully', () => {
      // Arrange
      TokenCleanupJob.start();
      jest.clearAllMocks();

      // Act
      TokenCleanupJob.stop();

      // Assert
      expect(mockScheduledTask.stop).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith('Token cleanup job stopped');
    });

    it('should do nothing if job is not running', () => {
      // Act
      TokenCleanupJob.stop();

      // Assert
      expect(mockScheduledTask.stop).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should skip if database is not available', async () => {
      // Arrange
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Database unavailable'));

      // Act
      await TokenCleanupJob.cleanupExpiredTokens();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'Database not available, skipping token cleanup job',
      );
      expect(prisma.emailVerification.deleteMany).not.toHaveBeenCalled();
    });

    it('should delete expired tokens older than 7 days', async () => {
      // Arrange
      const now = new Date('2026-01-29T12:00:00Z');
      jest.useFakeTimers().setSystemTime(now);

      const expectedExpiredCutoffDate = new Date('2026-01-22T12:00:00Z'); // 7 days ago
      const expectedRevokedCutoffDate = new Date('2025-12-30T12:00:00Z'); // 30 days ago

      (prisma.emailVerification.deleteMany as jest.Mock).mockResolvedValue({ count: 15 });
      (prisma.refreshToken.deleteMany as jest.Mock)
        .mockResolvedValueOnce({ count: 10 }) // expired refresh tokens
        .mockResolvedValueOnce({ count: 5 }); // revoked refresh tokens

      // Act
      await TokenCleanupJob.cleanupExpiredTokens();

      // Assert
      expect(prisma.emailVerification.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expectedExpiredCutoffDate,
          },
        },
      });
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expectedExpiredCutoffDate,
          },
        },
      });
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          revoked: true,
          revokedAt: {
            lt: expectedRevokedCutoffDate,
          },
        },
      });
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('removing tokens expired before'),
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Token cleanup completed: 15 email verification tokens, 10 expired refresh tokens, 5 revoked refresh tokens removed',
      );

      jest.useRealTimers();
    });

    it('should log when no tokens are deleted', async () => {
      // Arrange
      (prisma.emailVerification.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

      // Act
      await TokenCleanupJob.cleanupExpiredTokens();

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'Token cleanup completed: 0 email verification tokens, 0 expired refresh tokens, 0 revoked refresh tokens removed',
      );
    });

    it('should handle database connection errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Can\'t reach database server');
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);
      (prisma.emailVerification.deleteMany as jest.Mock).mockRejectedValue(dbError);

      // Act
      await TokenCleanupJob.cleanupExpiredTokens();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'Database connection error during token cleanup, skipping this run:',
        dbError.message,
      );
    });

    it('should handle P1001 Prisma error code', async () => {
      // Arrange
      const dbError = new Error('P1001: Connection refused');
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);
      (prisma.emailVerification.deleteMany as jest.Mock).mockRejectedValue(dbError);

      // Act
      await TokenCleanupJob.cleanupExpiredTokens();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'Database connection error during token cleanup, skipping this run:',
        dbError.message,
      );
    });

    it('should handle Prisma initialization errors', async () => {
      // Arrange
      const prismaError = new Error('Prisma init error');
      prismaError.constructor = { name: 'PrismaClientInitializationError' } as any;

      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);
      (prisma.emailVerification.deleteMany as jest.Mock).mockRejectedValue(prismaError);

      // Act
      await TokenCleanupJob.cleanupExpiredTokens();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'Database connection error during token cleanup, skipping this run:',
        prismaError.message,
      );
    });

    it('should log general errors without throwing', async () => {
      // Arrange
      const generalError = new Error('Some other error');
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);
      (prisma.emailVerification.deleteMany as jest.Mock).mockRejectedValue(generalError);

      // Act
      await TokenCleanupJob.cleanupExpiredTokens();

      // Assert
      expect(logger.error).toHaveBeenCalledWith('Error during token cleanup:', generalError);
    });
  });

  describe('getCleanupStats', () => {
    it('should return count of expired tokens', async () => {
      // Arrange
      const now = new Date('2026-01-29T12:00:00Z');
      jest.useFakeTimers().setSystemTime(now);

      (prisma.emailVerification.count as jest.Mock).mockResolvedValue(42);
      (prisma.refreshToken.count as jest.Mock)
        .mockResolvedValueOnce(10) // expired refresh tokens
        .mockResolvedValueOnce(5); // revoked refresh tokens

      // Act
      const result = await TokenCleanupJob.getCleanupStats();

      // Assert
      expect(result.expiredEmailVerificationCount).toBe(42);
      expect(result.expiredRefreshTokenCount).toBe(10);
      expect(result.revokedRefreshTokenCount).toBe(5);
      expect(result.expiredCutoffDate).toBeInstanceOf(Date);
      expect(result.expiredCutoffDate.getTime()).toBe(new Date('2026-01-22T12:00:00Z').getTime());
      expect(result.revokedCutoffDate).toBeInstanceOf(Date);
      expect(result.revokedCutoffDate.getTime()).toBe(new Date('2025-12-30T12:00:00Z').getTime());

      jest.useRealTimers();
    });

    it('should return 0 if database is not available', async () => {
      // Arrange
      const dbError = new Error('Can\'t reach database server');
      (prisma.emailVerification.count as jest.Mock).mockRejectedValue(dbError);

      // Act
      const result = await TokenCleanupJob.getCleanupStats();

      // Assert
      expect(result.expiredEmailVerificationCount).toBe(0);
      expect(result.expiredRefreshTokenCount).toBe(0);
      expect(result.revokedRefreshTokenCount).toBe(0);
      expect(result.expiredCutoffDate).toBeInstanceOf(Date);
      expect(result.revokedCutoffDate).toBeInstanceOf(Date);
    });

    it('should return 0 for P1001 error code', async () => {
      // Arrange
      const dbError = new Error('P1001: Connection refused');
      (prisma.emailVerification.count as jest.Mock).mockRejectedValue(dbError);

      // Act
      const result = await TokenCleanupJob.getCleanupStats();

      // Assert
      expect(result.expiredEmailVerificationCount).toBe(0);
      expect(result.expiredRefreshTokenCount).toBe(0);
      expect(result.revokedRefreshTokenCount).toBe(0);
    });

    it('should return 0 for Prisma initialization errors', async () => {
      // Arrange
      const prismaError = new Error('Prisma init error');
      prismaError.constructor = { name: 'PrismaClientInitializationError' } as any;
      (prisma.emailVerification.count as jest.Mock).mockRejectedValue(prismaError);

      // Act
      const result = await TokenCleanupJob.getCleanupStats();

      // Assert
      expect(result.expiredEmailVerificationCount).toBe(0);
      expect(result.expiredRefreshTokenCount).toBe(0);
      expect(result.revokedRefreshTokenCount).toBe(0);
    });

    it('should throw other errors', async () => {
      // Arrange
      const otherError = new Error('Other error');
      (prisma.emailVerification.count as jest.Mock).mockRejectedValue(otherError);

      // Act & Assert
      await expect(TokenCleanupJob.getCleanupStats()).rejects.toThrow(otherError);
    });
  });
});
