import { SeatReservationCleanupJob } from '../../../src/jobs/seat-reservation-cleanup.job.js';
import { prisma } from '../../../src/config/database.js';
import { logger } from '../../../src/utils/logger.js';
import * as cron from 'node-cron';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('node-cron');

const mockSeatSelectionService = {
  cleanupExpiredReservations: jest.fn(),
};

jest.mock('../../../src/services/seat-selection.service.js', () => ({
  SeatSelectionService: mockSeatSelectionService,
}));

describe('SeatReservationCleanupJob', () => {
  let mockScheduledTask: { stop: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    // Database available by default
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);

    mockScheduledTask = { stop: jest.fn() };
    (cron.schedule as jest.Mock).mockReturnValue(mockScheduledTask);
  });

  afterEach(() => {
    SeatReservationCleanupJob.stop();
  });

  describe('start', () => {
    it('should schedule the job with correct cron expression', () => {
      SeatReservationCleanupJob.start();

      expect(cron.schedule).toHaveBeenCalledWith(
        '*/5 * * * *',
        expect.any(Function),
        { timezone: 'UTC' },
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Seat reservation cleanup job scheduled: every 5 minutes',
      );
    });

    it('should warn if already running', () => {
      SeatReservationCleanupJob.start();
      jest.clearAllMocks();

      SeatReservationCleanupJob.start();

      expect(logger.warn).toHaveBeenCalledWith(
        'Seat reservation cleanup job is already running',
      );
      expect(cron.schedule).not.toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should stop the running job', () => {
      SeatReservationCleanupJob.start();
      jest.clearAllMocks();

      SeatReservationCleanupJob.stop();

      expect(mockScheduledTask.stop).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(
        'Seat reservation cleanup job stopped',
      );
    });

    it('should do nothing if job is not running', () => {
      SeatReservationCleanupJob.stop();

      expect(mockScheduledTask.stop).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredReservations', () => {
    it('should skip if database is not available', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('DB down'));

      await SeatReservationCleanupJob.cleanupExpiredReservations();

      expect(logger.warn).toHaveBeenCalledWith(
        'Database not available, skipping seat reservation cleanup',
      );
      expect(mockSeatSelectionService.cleanupExpiredReservations).not.toHaveBeenCalled();
    });

    it('should call SeatSelectionService.cleanupExpiredReservations', async () => {
      mockSeatSelectionService.cleanupExpiredReservations.mockResolvedValue({ cleaned: 0 });

      await SeatReservationCleanupJob.cleanupExpiredReservations();

      expect(mockSeatSelectionService.cleanupExpiredReservations).toHaveBeenCalled();
    });

    it('should log when expired reservations are cleaned', async () => {
      mockSeatSelectionService.cleanupExpiredReservations.mockResolvedValue({ cleaned: 3 });

      await SeatReservationCleanupJob.cleanupExpiredReservations();

      expect(logger.info).toHaveBeenCalledWith(
        'Seat reservation cleanup: 3 expired reservations released',
      );
    });

    it('should not log when no reservations cleaned', async () => {
      mockSeatSelectionService.cleanupExpiredReservations.mockResolvedValue({ cleaned: 0 });

      await SeatReservationCleanupJob.cleanupExpiredReservations();

      expect(logger.info).not.toHaveBeenCalledWith(
        expect.stringContaining('expired reservations released'),
      );
    });

    it('should handle database connection errors gracefully', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);
      const dbError = new Error('Can\'t reach database server');
      mockSeatSelectionService.cleanupExpiredReservations.mockRejectedValue(dbError);

      await SeatReservationCleanupJob.cleanupExpiredReservations();

      expect(logger.warn).toHaveBeenCalledWith(
        'Database connection error during seat reservation cleanup, skipping this run:',
        dbError.message,
      );
    });

    it('should handle PrismaClientInitializationError gracefully', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);
      const prismaError = new Error('Prisma init error');
      Object.defineProperty(prismaError, 'constructor', {
        value: { name: 'PrismaClientInitializationError' },
      });
      mockSeatSelectionService.cleanupExpiredReservations.mockRejectedValue(prismaError);

      await SeatReservationCleanupJob.cleanupExpiredReservations();

      expect(logger.warn).toHaveBeenCalledWith(
        'Database connection error during seat reservation cleanup, skipping this run:',
        prismaError.message,
      );
    });

    it('should log unexpected errors', async () => {
      const unexpectedError = new Error('Something unexpected');
      mockSeatSelectionService.cleanupExpiredReservations.mockRejectedValue(unexpectedError);

      await SeatReservationCleanupJob.cleanupExpiredReservations();

      expect(logger.error).toHaveBeenCalledWith(
        'Error during seat reservation cleanup:',
        unexpectedError,
      );
    });
  });
});
