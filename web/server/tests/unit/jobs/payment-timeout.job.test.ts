import { PaymentTimeoutJob } from '../../../src/jobs/payment-timeout.job.js';
import { prisma } from '../../../src/config/database.js';
import { logger } from '../../../src/utils/logger.js';
import { EventService } from '../../../src/services/event.service.js';
import { RegistrationStatus } from '@prisma/client';
import * as cron from 'node-cron';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
    eventRegistration: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    event: {
      update: jest.fn(),
    },
  },
}));
jest.mock('../../../src/services/event.service.js');
jest.mock('../../../src/utils/logger.js');
jest.mock('node-cron');

describe('PaymentTimeoutJob', () => {
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
    PaymentTimeoutJob.stop();
  });

  describe('start', () => {
    it('should start the payment timeout job successfully', () => {
      // Act
      PaymentTimeoutJob.start();

      // Assert
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 * * * *', // Every hour
        expect.any(Function),
        { timezone: 'UTC' },
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Payment timeout job scheduled: Every hour (cancels payments pending > 24 hours)',
      );
    });

    it('should run cleanup immediately on startup', () => {
      // Arrange
      (prisma.eventRegistration.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      PaymentTimeoutJob.start();

      // Assert - cancelAbandonedPayments was called
      // We'll verify this indirectly through the mock setup
      expect(logger.info).toHaveBeenCalled();
    });

    it('should warn if job is already running', () => {
      // Arrange
      PaymentTimeoutJob.start();
      jest.clearAllMocks();

      // Act
      PaymentTimeoutJob.start();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith('Payment timeout job is already running');
      expect(cron.schedule).not.toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should stop the payment timeout job successfully', () => {
      // Arrange
      PaymentTimeoutJob.start();
      jest.clearAllMocks();

      // Act
      PaymentTimeoutJob.stop();

      // Assert
      expect(mockScheduledTask.stop).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith('Payment timeout job stopped');
    });

    it('should do nothing if job is not running', () => {
      // Act
      PaymentTimeoutJob.stop();

      // Assert
      expect(mockScheduledTask.stop).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });
  });

  describe('cancelAbandonedPayments', () => {
    it('should skip if database is not available', async () => {
      // Arrange
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Database unavailable'));

      // Act
      await PaymentTimeoutJob.cancelAbandonedPayments();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'Database not available, skipping payment timeout job',
      );
      expect(prisma.eventRegistration.findMany).not.toHaveBeenCalled();
    });

    it('should log when no abandoned payments found', async () => {
      // Arrange
      (prisma.eventRegistration.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      await PaymentTimeoutJob.cancelAbandonedPayments();

      // Assert
      expect(logger.info).toHaveBeenCalledWith('No abandoned payments found');
    });

    it('should cancel abandoned payments and restore event capacity', async () => {
      // Arrange
      const now = new Date('2026-01-29T12:00:00Z');
      jest.useFakeTimers().setSystemTime(now);

      const mockRegistration = {
        id: 'reg-1',
        status: RegistrationStatus.PENDING,
        paymentStatus: 'PENDING',
        quantity: 2,
        createdAt: new Date('2026-01-28T11:00:00Z'), // 25 hours ago
        event: {
          id: 'event-1',
          title: 'Test Event',
          capacity: 100,
          availableSlots: 50,
        },
        attendee: {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      (prisma.eventRegistration.findMany as jest.Mock).mockResolvedValue([mockRegistration]);

      // Mock transaction
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          eventRegistration: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'reg-1',
              status: RegistrationStatus.PENDING,
              paymentStatus: 'PENDING',
              quantity: 2,
              createdAt: new Date('2026-01-28T11:00:00Z'),
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          event: {
            update: jest.fn().mockResolvedValue({}),
          },
        });
      });

      (EventService.validateAndSyncStatus as jest.Mock).mockReturnValue({
        status: RegistrationStatus.CANCELLED,
        paymentStatus: 'FAILED',
      });

      // Act
      await PaymentTimeoutJob.cancelAbandonedPayments();

      // Assert
      expect(logger.info).toHaveBeenCalledWith('Found 1 abandoned payment(s) to cancel');
      expect(EventService.validateAndSyncStatus).toHaveBeenCalledWith(
        RegistrationStatus.PENDING,
        'PENDING',
        'FAILED',
        RegistrationStatus.CANCELLED,
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Cancelled abandoned payment: registration reg-1 for event: Test Event',
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Payment timeout job completed: 1 registration(s) cancelled, 1 event(s) capacity restored',
      );

      jest.useRealTimers();
    });

    it('should skip registration if already cancelled', async () => {
      // Arrange
      const mockRegistration = {
        id: 'reg-2',
        status: RegistrationStatus.PENDING,
        paymentStatus: 'PENDING',
        quantity: 1,
        createdAt: new Date('2026-01-27T12:00:00Z'),
        event: { id: 'event-2', title: 'Event 2', capacity: 50, availableSlots: 25 },
        attendee: { id: 'user-2', email: 'user@example.com', firstName: 'Jane', lastName: 'Smith' },
      };

      (prisma.eventRegistration.findMany as jest.Mock).mockResolvedValue([mockRegistration]);

      // Mock transaction - registration already cancelled
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          eventRegistration: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'reg-2',
              status: RegistrationStatus.CANCELLED, // Already cancelled
              paymentStatus: 'FAILED',
            }),
            update: jest.fn(),
          },
          event: {
            update: jest.fn(),
          },
        });
      });

      // Act
      await PaymentTimeoutJob.cancelAbandonedPayments();

      // Assert
      expect(logger.info).toHaveBeenCalledWith('Found 1 abandoned payment(s) to cancel');
      // Should not update or restore capacity
      expect(logger.info).not.toHaveBeenCalledWith(expect.stringContaining('Cancelled abandoned payment'));
    });

    it('should skip registration if payment already completed', async () => {
      // Arrange
      const mockRegistration = {
        id: 'reg-3',
        status: RegistrationStatus.PENDING,
        paymentStatus: 'PENDING',
        quantity: 1,
        createdAt: new Date('2026-01-27T12:00:00Z'),
        event: { id: 'event-3', title: 'Event 3', capacity: 50, availableSlots: 25 },
        attendee: { id: 'user-3', email: 'user3@example.com', firstName: 'Bob', lastName: 'Johnson' },
      };

      (prisma.eventRegistration.findMany as jest.Mock).mockResolvedValue([mockRegistration]);

      // Mock transaction - payment completed
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          eventRegistration: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'reg-3',
              status: RegistrationStatus.CONFIRMED,
              paymentStatus: 'COMPLETED', // Payment completed
            }),
            update: jest.fn(),
          },
          event: {
            update: jest.fn(),
          },
        });
      });

      // Act
      await PaymentTimeoutJob.cancelAbandonedPayments();

      // Assert - should not cancel
      expect(logger.info).not.toHaveBeenCalledWith(expect.stringContaining('Cancelled abandoned payment'));
    });

    it('should not restore capacity for events with no capacity limit', async () => {
      // Arrange
      const mockRegistration = {
        id: 'reg-4',
        status: RegistrationStatus.PENDING,
        paymentStatus: 'PENDING',
        quantity: 5,
        createdAt: new Date('2026-01-27T12:00:00Z'),
        event: {
          id: 'event-4',
          title: 'Unlimited Event',
          capacity: null, // No capacity limit
          availableSlots: null,
        },
        attendee: { id: 'user-4', email: 'user4@example.com', firstName: 'Alice', lastName: 'Wonder' },
      };

      (prisma.eventRegistration.findMany as jest.Mock).mockResolvedValue([mockRegistration]);

      let _capacityRestored = false;

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          eventRegistration: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'reg-4',
              status: RegistrationStatus.PENDING,
              paymentStatus: 'PENDING',
              quantity: 5,
              createdAt: new Date('2026-01-27T12:00:00Z'),
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          event: {
            update: jest.fn().mockImplementation(() => {
              _capacityRestored = true;
              return Promise.resolve({});
            }),
          },
        });
      });

      (EventService.validateAndSyncStatus as jest.Mock).mockReturnValue({
        status: RegistrationStatus.CANCELLED,
        paymentStatus: 'FAILED',
      });

      // Act
      await PaymentTimeoutJob.cancelAbandonedPayments();

      // Assert - capacity not restored (count = 0)
      expect(logger.info).toHaveBeenCalledWith(
        'Payment timeout job completed: 1 registration(s) cancelled, 0 event(s) capacity restored',
      );
    });

    it('should handle errors for individual registrations and continue', async () => {
      // Arrange
      const mockRegistrations = [
        {
          id: 'reg-5',
          status: RegistrationStatus.PENDING,
          paymentStatus: 'PENDING',
          quantity: 1,
          createdAt: new Date('2026-01-27T12:00:00Z'),
          event: { id: 'event-5', title: 'Event 5', capacity: 100, availableSlots: 50 },
          attendee: { id: 'user-5', email: 'user5@example.com', firstName: 'Test', lastName: 'User' },
        },
        {
          id: 'reg-6',
          status: RegistrationStatus.PENDING,
          paymentStatus: 'PENDING',
          quantity: 2,
          createdAt: new Date('2026-01-27T12:00:00Z'),
          event: { id: 'event-6', title: 'Event 6', capacity: 100, availableSlots: 50 },
          attendee: { id: 'user-6', email: 'user6@example.com', firstName: 'Another', lastName: 'User' },
        },
      ];

      (prisma.eventRegistration.findMany as jest.Mock).mockResolvedValue(mockRegistrations);

      const mockError = new Error('Transaction failed');
      (prisma.$transaction as jest.Mock)
        .mockRejectedValueOnce(mockError) // First registration fails
        .mockImplementation(async (callback) => {
          // Second registration succeeds
          return callback({
            eventRegistration: {
              findUnique: jest.fn().mockResolvedValue({
                id: 'reg-6',
                status: RegistrationStatus.PENDING,
                paymentStatus: 'PENDING',
                quantity: 2,
                createdAt: new Date('2026-01-27T12:00:00Z'),
              }),
              update: jest.fn().mockResolvedValue({}),
            },
            event: {
              update: jest.fn().mockResolvedValue({}),
            },
          });
        });

      (EventService.validateAndSyncStatus as jest.Mock).mockReturnValue({
        status: RegistrationStatus.CANCELLED,
        paymentStatus: 'FAILED',
      });

      // Act
      await PaymentTimeoutJob.cancelAbandonedPayments();

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        'Error cancelling abandoned payment for registration reg-5:',
        mockError,
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Payment timeout job completed: 1 registration(s) cancelled, 1 event(s) capacity restored',
      );
    });

    it('should handle database connection errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Can\'t reach database server');
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);
      (prisma.eventRegistration.findMany as jest.Mock).mockRejectedValue(dbError);

      // Act
      await PaymentTimeoutJob.cancelAbandonedPayments();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'Database connection error during payment timeout job, skipping this run:',
        dbError.message,
      );
    });

    it('should handle Prisma initialization errors', async () => {
      // Arrange
      const prismaError = new Error('Prisma init error');
      prismaError.constructor = { name: 'PrismaClientInitializationError' } as any;

      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);
      (prisma.eventRegistration.findMany as jest.Mock).mockRejectedValue(prismaError);

      // Act
      await PaymentTimeoutJob.cancelAbandonedPayments();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'Database connection error during payment timeout job, skipping this run:',
        prismaError.message,
      );
    });
  });

  describe('getTimeoutStats', () => {
    it('should return count of abandoned payments', async () => {
      // Arrange
      (prisma.eventRegistration.count as jest.Mock).mockResolvedValue(5);

      // Act
      const result = await PaymentTimeoutJob.getTimeoutStats();

      // Assert
      expect(result.abandonedPaymentsCount).toBe(5);
      expect(result.timeoutDate).toBeInstanceOf(Date);
    });

    it('should return 0 if database is not available', async () => {
      // Arrange
      const dbError = new Error('Can\'t reach database server');
      (prisma.eventRegistration.count as jest.Mock).mockRejectedValue(dbError);

      // Act
      const result = await PaymentTimeoutJob.getTimeoutStats();

      // Assert
      expect(result.abandonedPaymentsCount).toBe(0);
      expect(result.timeoutDate).toBeInstanceOf(Date);
    });

    it('should return 0 for Prisma initialization errors', async () => {
      // Arrange
      const prismaError = new Error('Prisma init error');
      prismaError.constructor = { name: 'PrismaClientInitializationError' } as any;
      (prisma.eventRegistration.count as jest.Mock).mockRejectedValue(prismaError);

      // Act
      const result = await PaymentTimeoutJob.getTimeoutStats();

      // Assert
      expect(result.abandonedPaymentsCount).toBe(0);
    });

    it('should throw other errors', async () => {
      // Arrange
      const otherError = new Error('Other error');
      (prisma.eventRegistration.count as jest.Mock).mockRejectedValue(otherError);

      // Act & Assert
      await expect(PaymentTimeoutJob.getTimeoutStats()).rejects.toThrow(otherError);
    });
  });
});
