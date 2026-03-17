import { PaymentTimeoutJob } from '../../../src/jobs/payment-timeout.job.js';
import { prisma } from '../../../src/config/database.js';
import { logger } from '../../../src/utils/logger.js';
import { EventService } from '../../../src/services/event.service.js';
import { RegistrationStatus } from '@prisma/client';
import * as cron from 'node-cron';

// Mock dependencies
vi.mock('../../../src/config/database.js', () => ({
  prisma: {
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
    eventRegistration: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    event: {
      update: vi.fn(),
    },
    seatReservation: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    seat: {
      updateMany: vi.fn(),
    },
  },
}));
vi.mock('../../../src/services/event.service.js');
vi.mock('../../../src/utils/logger.js');
vi.mock('node-cron');

describe('PaymentTimeoutJob', () => {
  let mockScheduledTask: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock database as available by default
    (prisma.$queryRaw as vi.Mock).mockResolvedValue([{ result: 1 }]);

    // Create mock scheduled task
    mockScheduledTask = {
      stop: vi.fn(),
    };

    // Mock cron.schedule to return the mock task
    (cron.schedule as vi.Mock).mockReturnValue(mockScheduledTask);
  });

  afterEach(() => {
    PaymentTimeoutJob.stop();
  });

  describe('start', () => {
    it('should start the payment timeout job with 5-minute schedule', () => {
      // Act
      PaymentTimeoutJob.start();

      // Assert
      expect(cron.schedule).toHaveBeenCalledWith(
        '*/5 * * * *', // Every 5 minutes
        expect.any(Function),
        { timezone: 'UTC' },
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Payment timeout job scheduled: Every 5 minutes (cancels payments pending > 30 minutes)',
      );
    });

    it('should run cleanup immediately on startup', () => {
      // Arrange
      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue([]);

      // Act
      PaymentTimeoutJob.start();

      // Assert - cancelAbandonedPayments was called
      expect(logger.info).toHaveBeenCalled();
    });

    it('should warn if job is already running', () => {
      // Arrange
      PaymentTimeoutJob.start();
      vi.clearAllMocks();

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
      vi.clearAllMocks();

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
      (prisma.$queryRaw as vi.Mock).mockRejectedValue(new Error('Database unavailable'));

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
      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue([]);

      // Act
      await PaymentTimeoutJob.cancelAbandonedPayments();

      // Assert
      expect(logger.info).toHaveBeenCalledWith('No abandoned payments found');
    });

    it('should use 30-minute timeout cutoff', async () => {
      // Arrange
      const now = new Date('2026-01-29T12:00:00Z');
      vi.useFakeTimers().setSystemTime(now);

      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue([]);

      // Act
      await PaymentTimeoutJob.cancelAbandonedPayments();

      // Assert - should query with 30-minute cutoff
      expect(prisma.eventRegistration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              lt: expect.any(Date),
            },
          }),
        }),
      );

      // Verify the cutoff date is 30 minutes ago
      const callArgs = (prisma.eventRegistration.findMany as vi.Mock).mock.calls[0][0];
      const cutoffDate = callArgs.where.createdAt.lt;
      const expectedCutoff = new Date('2026-01-29T11:30:00Z'); // 30 minutes before noon
      expect(cutoffDate.getTime()).toBe(expectedCutoff.getTime());

      vi.useRealTimers();
    });

    it('should cancel abandoned payments and restore event capacity', async () => {
      // Arrange
      const now = new Date('2026-01-29T12:00:00Z');
      vi.useFakeTimers().setSystemTime(now);

      const mockRegistration = {
        id: 'reg-1',
        status: RegistrationStatus.PENDING,
        paymentStatus: 'PENDING',
        quantity: 2,
        createdAt: new Date('2026-01-29T11:20:00Z'), // 40 minutes ago
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

      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue([mockRegistration]);

      // Mock transaction
      (prisma.$transaction as vi.Mock).mockImplementation(async (callback) => {
        return callback({
          eventRegistration: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'reg-1',
              status: RegistrationStatus.PENDING,
              paymentStatus: 'PENDING',
              quantity: 2,
              createdAt: new Date('2026-01-29T11:20:00Z'),
            }),
            update: vi.fn().mockResolvedValue({}),
          },
          event: {
            update: vi.fn().mockResolvedValue({}),
          },
          seatReservation: {
            findMany: vi.fn().mockResolvedValue([]),
            updateMany: vi.fn().mockResolvedValue({}),
          },
          seat: {
            updateMany: vi.fn().mockResolvedValue({}),
          },
        });
      });

      (EventService.validateAndSyncStatus as vi.Mock).mockReturnValue({
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

      vi.useRealTimers();
    });

    it('should release seat reservations when cancelling abandoned payment', async () => {
      // Arrange
      const mockRegistration = {
        id: 'reg-1',
        status: RegistrationStatus.PENDING,
        paymentStatus: 'PENDING',
        quantity: 1,
        createdAt: new Date('2026-01-27T12:00:00Z'),
        event: {
          id: 'event-1',
          title: 'Seated Event',
          capacity: null,
          availableSlots: null,
        },
        attendee: {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
      };

      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue([mockRegistration]);

      const mockSeatReservations = [
        { id: 'seat-res-1', seatId: 'seat-1' },
        { id: 'seat-res-2', seatId: 'seat-2' },
      ];

      const mockTxSeatReservation = {
        findMany: vi.fn().mockResolvedValue(mockSeatReservations),
        updateMany: vi.fn().mockResolvedValue({}),
      };
      const mockTxSeat = {
        updateMany: vi.fn().mockResolvedValue({}),
      };

      (prisma.$transaction as vi.Mock).mockImplementation(async (callback) => {
        return callback({
          eventRegistration: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'reg-1',
              status: RegistrationStatus.PENDING,
              paymentStatus: 'PENDING',
              quantity: 1,
              createdAt: new Date('2026-01-27T12:00:00Z'),
            }),
            update: vi.fn().mockResolvedValue({}),
          },
          event: {
            update: vi.fn().mockResolvedValue({}),
          },
          seatReservation: mockTxSeatReservation,
          seat: mockTxSeat,
        });
      });

      (EventService.validateAndSyncStatus as vi.Mock).mockReturnValue({
        status: RegistrationStatus.CANCELLED,
        paymentStatus: 'FAILED',
      });

      // Act
      await PaymentTimeoutJob.cancelAbandonedPayments();

      // Assert - seat reservations should be queried and cancelled
      expect(mockTxSeatReservation.findMany).toHaveBeenCalledWith({
        where: {
          registrationId: 'reg-1',
          status: { in: ['reserved'] },
        },
        select: { id: true, seatId: true },
      });
      expect(mockTxSeatReservation.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['seat-res-1', 'seat-res-2'] } },
        data: { status: 'cancelled' },
      });
      expect(mockTxSeat.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['seat-1', 'seat-2'] } },
        data: { status: 'AVAILABLE' },
      });
      expect(logger.info).toHaveBeenCalledWith(
        'Released 2 seat(s) for abandoned registration reg-1',
      );
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

      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue([mockRegistration]);

      // Mock transaction - registration already cancelled
      (prisma.$transaction as vi.Mock).mockImplementation(async (callback) => {
        return callback({
          eventRegistration: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'reg-2',
              status: RegistrationStatus.CANCELLED, // Already cancelled
              paymentStatus: 'FAILED',
            }),
            update: vi.fn(),
          },
          event: {
            update: vi.fn(),
          },
          seatReservation: {
            findMany: vi.fn().mockResolvedValue([]),
            updateMany: vi.fn(),
          },
          seat: {
            updateMany: vi.fn(),
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

      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue([mockRegistration]);

      // Mock transaction - payment completed
      (prisma.$transaction as vi.Mock).mockImplementation(async (callback) => {
        return callback({
          eventRegistration: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'reg-3',
              status: RegistrationStatus.CONFIRMED,
              paymentStatus: 'COMPLETED', // Payment completed
            }),
            update: vi.fn(),
          },
          event: {
            update: vi.fn(),
          },
          seatReservation: {
            findMany: vi.fn().mockResolvedValue([]),
            updateMany: vi.fn(),
          },
          seat: {
            updateMany: vi.fn(),
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

      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue([mockRegistration]);

      const mockEventUpdate = vi.fn();
      (prisma.$transaction as vi.Mock).mockImplementation(async (callback) => {
        return callback({
          eventRegistration: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'reg-4',
              status: RegistrationStatus.PENDING,
              paymentStatus: 'PENDING',
              quantity: 5,
              createdAt: new Date('2026-01-27T12:00:00Z'),
            }),
            update: vi.fn().mockResolvedValue({}),
          },
          event: {
            update: mockEventUpdate,
          },
          seatReservation: {
            findMany: vi.fn().mockResolvedValue([]),
            updateMany: vi.fn(),
          },
          seat: {
            updateMany: vi.fn(),
          },
        });
      });

      (EventService.validateAndSyncStatus as vi.Mock).mockReturnValue({
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

      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue(mockRegistrations);

      const mockError = new Error('Transaction failed');
      (prisma.$transaction as vi.Mock)
        .mockRejectedValueOnce(mockError) // First registration fails
        .mockImplementation(async (callback) => {
          // Second registration succeeds
          return callback({
            eventRegistration: {
              findUnique: vi.fn().mockResolvedValue({
                id: 'reg-6',
                status: RegistrationStatus.PENDING,
                paymentStatus: 'PENDING',
                quantity: 2,
                createdAt: new Date('2026-01-27T12:00:00Z'),
              }),
              update: vi.fn().mockResolvedValue({}),
            },
            event: {
              update: vi.fn().mockResolvedValue({}),
            },
            seatReservation: {
              findMany: vi.fn().mockResolvedValue([]),
              updateMany: vi.fn(),
            },
            seat: {
              updateMany: vi.fn(),
            },
          });
        });

      (EventService.validateAndSyncStatus as vi.Mock).mockReturnValue({
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
      (prisma.$queryRaw as vi.Mock).mockResolvedValue([{ result: 1 }]);
      (prisma.eventRegistration.findMany as vi.Mock).mockRejectedValue(dbError);

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

      (prisma.$queryRaw as vi.Mock).mockResolvedValue([{ result: 1 }]);
      (prisma.eventRegistration.findMany as vi.Mock).mockRejectedValue(prismaError);

      // Act
      await PaymentTimeoutJob.cancelAbandonedPayments();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'Database connection error during payment timeout job, skipping this run:',
        prismaError.message,
      );
    });

    it('should cap restored availableSlots at event capacity', async () => {
      // Arrange - event where restoring would exceed capacity
      const mockRegistration = {
        id: 'reg-cap',
        status: RegistrationStatus.PENDING,
        paymentStatus: 'PENDING',
        quantity: 10,
        createdAt: new Date('2026-01-27T12:00:00Z'),
        event: {
          id: 'event-cap',
          title: 'Capped Event',
          capacity: 100,
          availableSlots: 95, // Near capacity already
        },
        attendee: { id: 'user-cap', email: 'cap@example.com', firstName: 'Cap', lastName: 'Test' },
      };

      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue([mockRegistration]);

      let capturedAvailableSlots: number | null = null;
      (prisma.$transaction as vi.Mock).mockImplementation(async (callback) => {
        return callback({
          eventRegistration: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'reg-cap',
              status: RegistrationStatus.PENDING,
              paymentStatus: 'PENDING',
              quantity: 10,
              createdAt: new Date('2026-01-27T12:00:00Z'),
            }),
            update: vi.fn().mockResolvedValue({}),
          },
          event: {
            update: vi.fn().mockImplementation((args) => {
              capturedAvailableSlots = args.data.availableSlots;
              return Promise.resolve({});
            }),
          },
          seatReservation: {
            findMany: vi.fn().mockResolvedValue([]),
            updateMany: vi.fn(),
          },
          seat: {
            updateMany: vi.fn(),
          },
        });
      });

      (EventService.validateAndSyncStatus as vi.Mock).mockReturnValue({
        status: RegistrationStatus.CANCELLED,
        paymentStatus: 'FAILED',
      });

      // Act
      await PaymentTimeoutJob.cancelAbandonedPayments();

      // Assert - availableSlots should be capped at capacity (100), not 95 + 10 = 105
      expect(capturedAvailableSlots).toBe(100);
    });
  });

  describe('getTimeoutStats', () => {
    it('should return count of abandoned payments', async () => {
      // Arrange
      (prisma.eventRegistration.count as vi.Mock).mockResolvedValue(5);

      // Act
      const result = await PaymentTimeoutJob.getTimeoutStats();

      // Assert
      expect(result.abandonedPaymentsCount).toBe(5);
      expect(result.timeoutDate).toBeInstanceOf(Date);
    });

    it('should use 30-minute timeout for stats calculation', async () => {
      // Arrange
      const now = new Date('2026-01-29T12:00:00Z');
      vi.useFakeTimers().setSystemTime(now);

      (prisma.eventRegistration.count as vi.Mock).mockResolvedValue(0);

      // Act
      const result = await PaymentTimeoutJob.getTimeoutStats();

      // Assert - timeout date should be 30 minutes ago
      const expectedTimeout = new Date('2026-01-29T11:30:00Z');
      expect(result.timeoutDate.getTime()).toBe(expectedTimeout.getTime());

      vi.useRealTimers();
    });

    it('should return 0 if database is not available', async () => {
      // Arrange
      const dbError = new Error('Can\'t reach database server');
      (prisma.eventRegistration.count as vi.Mock).mockRejectedValue(dbError);

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
      (prisma.eventRegistration.count as vi.Mock).mockRejectedValue(prismaError);

      // Act
      const result = await PaymentTimeoutJob.getTimeoutStats();

      // Assert
      expect(result.abandonedPaymentsCount).toBe(0);
    });

    it('should throw other errors', async () => {
      // Arrange
      const otherError = new Error('Other error');
      (prisma.eventRegistration.count as vi.Mock).mockRejectedValue(otherError);

      // Act & Assert
      await expect(PaymentTimeoutJob.getTimeoutStats()).rejects.toThrow(otherError);
    });
  });
});
