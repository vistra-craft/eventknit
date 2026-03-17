import { EventReminderJob } from '../../../src/jobs/event-reminder.job.js';
import { prisma } from '../../../src/config/database.js';
import { logger } from '../../../src/utils/logger.js';
import { NotificationService } from '../../../src/services/notification.service.js';
import { NotificationType, NotificationPriority } from '@prisma/client';
import * as cron from 'node-cron';

// Mock dependencies
vi.mock('../../../src/config/database.js', () => ({
  prisma: {
    $queryRaw: vi.fn(),
    event: {
      findMany: vi.fn(),
    },
    notification: {
      findFirst: vi.fn(),
    },
  },
}));
vi.mock('../../../src/services/notification.service.js');
vi.mock('../../../src/utils/logger.js');
vi.mock('node-cron');

describe('EventReminderJob', () => {
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
    EventReminderJob.stop();
  });

  describe('start', () => {
    it('should start the event reminder job successfully', () => {
      // Act
      EventReminderJob.start();

      // Assert
      expect(cron.schedule).toHaveBeenCalledWith('*/15 * * * *', expect.any(Function));
      expect(logger.info).toHaveBeenCalledWith('✅ Event reminder job started');
    });

    it('should warn if job is already running', () => {
      // Arrange
      EventReminderJob.start();
      vi.clearAllMocks();

      // Act
      EventReminderJob.start();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith('Event reminder job is already running');
      expect(cron.schedule).not.toHaveBeenCalled();
    });

    it('should handle error when starting job', () => {
      // Arrange
      const mockError = new Error('Cron start failed');
      (cron.schedule as vi.Mock).mockImplementation(() => {
        throw mockError;
      });

      // Act & Assert
      expect(() => EventReminderJob.start()).toThrow(mockError);
      expect(logger.error).toHaveBeenCalledWith('Failed to start event reminder job:', mockError);
    });
  });

  describe('stop', () => {
    it('should stop the event reminder job successfully', () => {
      // Arrange
      EventReminderJob.start();
      vi.clearAllMocks();

      // Act
      EventReminderJob.stop();

      // Assert
      expect(mockScheduledTask.stop).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith('Event reminder job stopped');
    });

    it('should do nothing if job is not running', () => {
      // Act
      EventReminderJob.stop();

      // Assert
      expect(mockScheduledTask.stop).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });
  });

  describe('sendEventReminders', () => {
    it('should skip if database is not available', async () => {
      // Arrange
      (prisma.$queryRaw as vi.Mock).mockRejectedValue(new Error('Database unavailable'));

      // Act
      await EventReminderJob.sendEventReminders();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith('Database not available, skipping event reminder job');
      expect(prisma.event.findMany).not.toHaveBeenCalled();
    });

    it('should send 24h event reminders to attendees and staff', async () => {
      // Arrange
      const now = new Date('2026-01-29T12:00:00Z');
      vi.useFakeTimers().setSystemTime(now);

      const mockEvent = {
        id: 'event-1',
        title: 'Test Event',
        startDate: new Date('2026-01-30T12:00:00Z'),
      };

      (prisma.event.findMany as vi.Mock)
        .mockResolvedValueOnce([mockEvent]) // 24h events
        .mockResolvedValueOnce([]) // 1h events
        .mockResolvedValueOnce([]) // 24h deadlines
        .mockResolvedValueOnce([]); // 1h deadlines

      (prisma.notification.findFirst as vi.Mock).mockResolvedValue(null);
      (NotificationService.sendEventNotification as vi.Mock).mockResolvedValue(undefined);

      // Act
      await EventReminderJob.sendEventReminders();

      // Assert
      expect(NotificationService.sendEventNotification).toHaveBeenCalledTimes(2);

      // Attendee reminder
      expect(NotificationService.sendEventNotification).toHaveBeenCalledWith(
        'event-1',
        NotificationType.EVENT_REMINDER_24H,
        'Event Reminder: Test Event',
        expect.stringContaining('tomorrow'),
        'attendees',
        undefined,
        NotificationPriority.MEDIUM,
      );

      // Staff reminder
      expect(NotificationService.sendEventNotification).toHaveBeenCalledWith(
        'event-1',
        NotificationType.EVENT_REMINDER_FOR_STAFF,
        'Event Reminder: Test Event',
        expect.stringContaining('tomorrow'),
        'staff',
        undefined,
        NotificationPriority.MEDIUM,
      );

      vi.useRealTimers();
    });

    it('should send 1h event reminders with HIGH priority', async () => {
      // Arrange
      const now = new Date('2026-01-29T12:00:00Z');
      vi.useFakeTimers().setSystemTime(now);

      const mockEvent = {
        id: 'event-2',
        title: 'Urgent Event',
        startDate: new Date('2026-01-29T13:00:00Z'),
      };

      (prisma.event.findMany as vi.Mock)
        .mockResolvedValueOnce([]) // 24h events
        .mockResolvedValueOnce([mockEvent]) // 1h events
        .mockResolvedValueOnce([]) // 24h deadlines
        .mockResolvedValueOnce([]); // 1h deadlines

      (prisma.notification.findFirst as vi.Mock).mockResolvedValue(null);
      (NotificationService.sendEventNotification as vi.Mock).mockResolvedValue(undefined);

      // Act
      await EventReminderJob.sendEventReminders();

      // Assert
      expect(NotificationService.sendEventNotification).toHaveBeenCalledTimes(2);

      // Attendee reminder (HIGH priority)
      expect(NotificationService.sendEventNotification).toHaveBeenCalledWith(
        'event-2',
        NotificationType.EVENT_REMINDER_1H,
        'Event Starting Soon: Urgent Event',
        expect.stringContaining('1 hour'),
        'attendees',
        undefined,
        NotificationPriority.HIGH,
      );

      vi.useRealTimers();
    });

    it('should skip sending reminder if already sent recently (24h)', async () => {
      // Arrange
      const now = new Date('2026-01-29T12:00:00Z');
      vi.useFakeTimers().setSystemTime(now);

      const mockEvent = {
        id: 'event-3',
        title: 'Test Event',
        startDate: new Date('2026-01-30T12:00:00Z'),
      };

      (prisma.event.findMany as vi.Mock)
        .mockResolvedValueOnce([mockEvent])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Mock existing notification (already sent)
      (prisma.notification.findFirst as vi.Mock).mockResolvedValue({
        id: 'notif-1',
        eventId: 'event-3',
        type: NotificationType.EVENT_REMINDER_24H,
        createdAt: new Date('2026-01-29T11:30:00Z'), // 30 minutes ago
      });

      // Act
      await EventReminderJob.sendEventReminders();

      // Assert
      expect(logger.debug).toHaveBeenCalledWith('24h reminder already sent for event event-3');
      expect(NotificationService.sendEventNotification).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should send registration deadline reminders', async () => {
      // Arrange
      const now = new Date('2026-01-29T12:00:00Z');
      vi.useFakeTimers().setSystemTime(now);

      const mockEvent24h = {
        id: 'event-4',
        title: 'Event with Deadline',
        registrationDeadline: new Date('2026-01-30T12:00:00Z'),
      };

      const mockEvent1h = {
        id: 'event-5',
        title: 'Event with Urgent Deadline',
        registrationDeadline: new Date('2026-01-29T13:00:00Z'),
      };

      (prisma.event.findMany as vi.Mock)
        .mockResolvedValueOnce([]) // 24h events
        .mockResolvedValueOnce([]) // 1h events
        .mockResolvedValueOnce([mockEvent24h]) // 24h deadlines
        .mockResolvedValueOnce([mockEvent1h]); // 1h deadlines

      (prisma.notification.findFirst as vi.Mock).mockResolvedValue(null);
      (NotificationService.sendEventNotification as vi.Mock).mockResolvedValue(undefined);

      // Act
      await EventReminderJob.sendEventReminders();

      // Assert
      expect(NotificationService.sendEventNotification).toHaveBeenCalledTimes(2);

      // 24h deadline reminder (MEDIUM priority)
      expect(NotificationService.sendEventNotification).toHaveBeenCalledWith(
        'event-4',
        NotificationType.REGISTRATION_DEADLINE_24H,
        'Registration Closing Soon: Event with Deadline',
        expect.stringContaining('24 hours'),
        'attendees',
        undefined,
        NotificationPriority.MEDIUM,
      );

      // 1h deadline reminder (HIGH priority)
      expect(NotificationService.sendEventNotification).toHaveBeenCalledWith(
        'event-5',
        NotificationType.REGISTRATION_DEADLINE_1H,
        'Last Chance to Register: Event with Urgent Deadline',
        expect.stringContaining('1 hour'),
        'attendees',
        undefined,
        NotificationPriority.HIGH,
      );

      vi.useRealTimers();
    });

    it('should handle notification service errors and continue processing', async () => {
      // Arrange
      const now = new Date('2026-01-29T12:00:00Z');
      vi.useFakeTimers().setSystemTime(now);

      const mockEvents = [
        { id: 'event-6', title: 'Event 6', startDate: new Date('2026-01-30T12:00:00Z') },
        { id: 'event-7', title: 'Event 7', startDate: new Date('2026-01-30T12:00:00Z') },
      ];

      (prisma.event.findMany as vi.Mock)
        .mockResolvedValueOnce(mockEvents)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      (prisma.notification.findFirst as vi.Mock).mockResolvedValue(null);

      const mockError = new Error('Notification service failed');
      (NotificationService.sendEventNotification as vi.Mock)
        .mockRejectedValueOnce(mockError) // First event attendee fails (staff not sent)
        .mockResolvedValueOnce(undefined) // Second event attendee succeeds
        .mockResolvedValueOnce(undefined); // Second event staff succeeds

      // Act
      await EventReminderJob.sendEventReminders();

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send 24h reminder for event event-6:',
        mockError,
      );
      expect(NotificationService.sendEventNotification).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });

    it('should handle database connection errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Can\'t reach database server');
      (prisma.$queryRaw as vi.Mock).mockResolvedValue([{ result: 1 }]);
      (prisma.event.findMany as vi.Mock).mockRejectedValue(dbError);

      // Act
      await EventReminderJob.sendEventReminders();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'Database connection error during event reminder job, skipping this run:',
        dbError.message,
      );
    });

    it('should handle Prisma initialization errors', async () => {
      // Arrange
      const prismaError = new Error('Prisma init error');
      prismaError.constructor = { name: 'PrismaClientInitializationError' } as any;

      (prisma.$queryRaw as vi.Mock).mockResolvedValue([{ result: 1 }]);
      (prisma.event.findMany as vi.Mock).mockRejectedValue(prismaError);

      // Act
      await EventReminderJob.sendEventReminders();

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'Database connection error during event reminder job, skipping this run:',
        prismaError.message,
      );
    });

    it('should log when no reminders need to be sent', async () => {
      // Arrange
      (prisma.event.findMany as vi.Mock)
        .mockResolvedValueOnce([]) // 24h events
        .mockResolvedValueOnce([]) // 1h events
        .mockResolvedValueOnce([]) // 24h deadlines
        .mockResolvedValueOnce([]); // 1h deadlines

      // Act
      await EventReminderJob.sendEventReminders();

      // Assert
      expect(logger.debug).toHaveBeenCalledWith('No event reminders to send');
    });

    it('should log summary when reminders are sent', async () => {
      // Arrange
      const now = new Date('2026-01-29T12:00:00Z');
      vi.useFakeTimers().setSystemTime(now);

      const event24h = { id: 'e1', title: 'Event 1', startDate: new Date('2026-01-30T12:00:00Z') };
      const event1h = { id: 'e2', title: 'Event 2', startDate: new Date('2026-01-29T13:00:00Z') };
      const deadline24h = { id: 'e3', title: 'Event 3', registrationDeadline: new Date('2026-01-30T12:00:00Z') };
      const deadline1h = { id: 'e4', title: 'Event 4', registrationDeadline: new Date('2026-01-29T13:00:00Z') };

      (prisma.event.findMany as vi.Mock)
        .mockResolvedValueOnce([event24h])
        .mockResolvedValueOnce([event1h])
        .mockResolvedValueOnce([deadline24h])
        .mockResolvedValueOnce([deadline1h]);

      (prisma.notification.findFirst as vi.Mock).mockResolvedValue(null);
      (NotificationService.sendEventNotification as vi.Mock).mockResolvedValue(undefined);

      // Act
      await EventReminderJob.sendEventReminders();

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'Event reminder job completed. Sent 1 24h event reminders, 1 1h event reminders, 1 24h deadline reminders, and 1 1h deadline reminders',
      );

      vi.useRealTimers();
    });
  });
});
