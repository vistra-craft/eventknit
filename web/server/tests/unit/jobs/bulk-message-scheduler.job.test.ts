import { BulkMessageSchedulerJob } from '../../../src/jobs/bulk-message-scheduler.job.js';
import { prisma } from '../../../src/config/database.js';
import { logger } from '../../../src/utils/logger.js';
import { BulkMessageService } from '../../../src/services/bulk-message.service.js';
import { BulkMessageStatus } from '@prisma/client';
import * as cron from 'node-cron';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    bulkMessage: {
      findMany: jest.fn(),
    },
  },
}));
jest.mock('../../../src/services/bulk-message.service.js');
jest.mock('../../../src/utils/logger.js');
jest.mock('node-cron');

describe('BulkMessageSchedulerJob', () => {
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
    BulkMessageSchedulerJob.stop();
  });

  describe('start', () => {
    it('should start the bulk message scheduler job successfully', () => {
      // Act
      BulkMessageSchedulerJob.start();

      // Assert
      expect(cron.schedule).toHaveBeenCalledWith('*/5 * * * *', expect.any(Function));
      expect(logger.info).toHaveBeenCalledWith('✅ Bulk message scheduler job started');
    });

    it('should warn if job is already running', () => {
      // Arrange
      BulkMessageSchedulerJob.start();
      jest.clearAllMocks();

      // Act
      BulkMessageSchedulerJob.start();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith('Bulk message scheduler job is already running');
      expect(cron.schedule).not.toHaveBeenCalled();
    });

    it('should handle error when starting job', () => {
      // Arrange
      const mockError = new Error('Cron start failed');
      (cron.schedule as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      // Act & Assert
      expect(() => BulkMessageSchedulerJob.start()).toThrow(mockError);
      expect(logger.error).toHaveBeenCalledWith('Failed to start bulk message scheduler job:', mockError);
    });
  });

  describe('stop', () => {
    it('should stop the bulk message scheduler job successfully', () => {
      // Arrange
      BulkMessageSchedulerJob.start();
      jest.clearAllMocks();

      // Act
      BulkMessageSchedulerJob.stop();

      // Assert
      expect(mockScheduledTask.stop).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith('Bulk message scheduler job stopped');
    });

    it('should do nothing if job is not running', () => {
      // Act
      BulkMessageSchedulerJob.stop();

      // Assert
      expect(mockScheduledTask.stop).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });
  });

  describe('processScheduledMessages', () => {
    it('should skip if database is not available', async () => {
      // Arrange
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Database unavailable'));

      // Act
      await BulkMessageSchedulerJob.processScheduledMessages();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'Database not available, skipping bulk message scheduler job',
      );
      expect(prisma.bulkMessage.findMany).not.toHaveBeenCalled();
    });

    it('should log when no scheduled messages are ready', async () => {
      // Arrange
      (prisma.bulkMessage.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      await BulkMessageSchedulerJob.processScheduledMessages();

      // Assert
      expect(logger.debug).toHaveBeenCalledWith('No scheduled bulk messages ready to be sent');
      expect(BulkMessageService.sendBulkMessage).not.toHaveBeenCalled();
    });

    it('should process scheduled messages that are ready to be sent', async () => {
      // Arrange
      const now = new Date('2026-01-29T12:00:00Z');
      jest.useFakeTimers().setSystemTime(now);

      const mockMessages = [
        {
          id: 'msg-1',
          title: 'Message 1',
          scheduledAt: new Date('2026-01-29T11:55:00Z'), // 5 minutes ago
        },
        {
          id: 'msg-2',
          title: 'Message 2',
          scheduledAt: new Date('2026-01-29T12:00:00Z'), // Now
        },
      ];

      (prisma.bulkMessage.findMany as jest.Mock).mockResolvedValue(mockMessages);
      (BulkMessageService.sendBulkMessage as jest.Mock).mockResolvedValue(undefined);

      // Act
      await BulkMessageSchedulerJob.processScheduledMessages();

      // Assert
      expect(logger.info).toHaveBeenCalledWith('Found 2 scheduled bulk message(s) ready to be sent');
      expect(BulkMessageService.sendBulkMessage).toHaveBeenCalledTimes(2);
      expect(BulkMessageService.sendBulkMessage).toHaveBeenCalledWith('msg-1');
      expect(BulkMessageService.sendBulkMessage).toHaveBeenCalledWith('msg-2');
      expect(logger.info).toHaveBeenCalledWith(
        'Bulk message scheduler job completed. Processed 2 message(s)',
      );

      jest.useRealTimers();
    });

    it('should query for messages with correct criteria', async () => {
      // Arrange
      const now = new Date('2026-01-29T12:00:00Z');
      jest.useFakeTimers().setSystemTime(now);

      (prisma.bulkMessage.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      await BulkMessageSchedulerJob.processScheduledMessages();

      // Assert
      expect(prisma.bulkMessage.findMany).toHaveBeenCalledWith({
        where: {
          status: BulkMessageStatus.SCHEDULED,
          scheduledAt: {
            lte: now,
          },
        },
        select: {
          id: true,
          title: true,
          scheduledAt: true,
        },
      });

      jest.useRealTimers();
    });

    it('should handle errors when sending individual messages and continue', async () => {
      // Arrange
      const mockMessages = [
        { id: 'msg-3', title: 'Message 3', scheduledAt: new Date('2026-01-29T11:00:00Z') },
        { id: 'msg-4', title: 'Message 4', scheduledAt: new Date('2026-01-29T11:30:00Z') },
        { id: 'msg-5', title: 'Message 5', scheduledAt: new Date('2026-01-29T11:45:00Z') },
      ];

      (prisma.bulkMessage.findMany as jest.Mock).mockResolvedValue(mockMessages);

      const sendError = new Error('Failed to send message');
      (BulkMessageService.sendBulkMessage as jest.Mock)
        .mockResolvedValueOnce(undefined) // First succeeds
        .mockRejectedValueOnce(sendError) // Second fails
        .mockResolvedValueOnce(undefined); // Third succeeds

      // Act
      await BulkMessageSchedulerJob.processScheduledMessages();

      // Assert
      expect(BulkMessageService.sendBulkMessage).toHaveBeenCalledTimes(3);
      expect(logger.error).toHaveBeenCalledWith('Failed to send scheduled bulk message msg-4:', sendError);
      expect(logger.info).toHaveBeenCalledWith('Successfully sent scheduled bulk message: msg-3');
      expect(logger.info).toHaveBeenCalledWith('Successfully sent scheduled bulk message: msg-5');
      expect(logger.info).toHaveBeenCalledWith(
        'Bulk message scheduler job completed. Processed 3 message(s)',
      );
    });

    it('should log info for each message being processed', async () => {
      // Arrange
      const mockMessage = {
        id: 'msg-6',
        title: 'Important Message',
        scheduledAt: new Date('2026-01-29T11:00:00Z'),
      };

      (prisma.bulkMessage.findMany as jest.Mock).mockResolvedValue([mockMessage]);
      (BulkMessageService.sendBulkMessage as jest.Mock).mockResolvedValue(undefined);

      // Act
      await BulkMessageSchedulerJob.processScheduledMessages();

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'Processing scheduled bulk message: msg-6 (Important Message)',
      );
      expect(logger.info).toHaveBeenCalledWith('Successfully sent scheduled bulk message: msg-6');
    });

    it('should handle database connection errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Can\'t reach database server');
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);
      (prisma.bulkMessage.findMany as jest.Mock).mockRejectedValue(dbError);

      // Act
      await BulkMessageSchedulerJob.processScheduledMessages();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'Database connection error during bulk message scheduler job, skipping this run:',
        dbError.message,
      );
    });

    it('should handle P1001 Prisma error code', async () => {
      // Arrange
      const dbError = new Error('P1001: Connection refused');
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);
      (prisma.bulkMessage.findMany as jest.Mock).mockRejectedValue(dbError);

      // Act
      await BulkMessageSchedulerJob.processScheduledMessages();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'Database connection error during bulk message scheduler job, skipping this run:',
        dbError.message,
      );
    });

    it('should handle Prisma initialization errors', async () => {
      // Arrange
      const prismaError = new Error('Prisma init error');
      prismaError.constructor = { name: 'PrismaClientInitializationError' } as any;

      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);
      (prisma.bulkMessage.findMany as jest.Mock).mockRejectedValue(prismaError);

      // Act
      await BulkMessageSchedulerJob.processScheduledMessages();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'Database connection error during bulk message scheduler job, skipping this run:',
        prismaError.message,
      );
    });

    it('should log general errors', async () => {
      // Arrange
      const generalError = new Error('Some other error');
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);
      (prisma.bulkMessage.findMany as jest.Mock).mockRejectedValue(generalError);

      // Act
      await BulkMessageSchedulerJob.processScheduledMessages();

      // Assert
      expect(logger.error).toHaveBeenCalledWith('Error in bulk message scheduler job:', generalError);
    });
  });
});
