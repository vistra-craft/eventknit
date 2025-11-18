import * as cron from 'node-cron';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { EventStatus, RegistrationStatus, NotificationType, NotificationPriority } from '@prisma/client';
import { NotificationService } from '../services/notification.service.js';

/**
 * Event Reminder Job
 *
 * Sends event reminders to registered attendees
 * - 24 hours before event
 * - 1 hour before event
 * - Registration deadline reminders (24h and 1h before deadline)
 * Runs every 15 minutes
 */
export class EventReminderJob {
  private static readonly CRON_SCHEDULE = '*/15 * * * *'; // Every 15 minutes
  private static task: cron.ScheduledTask | null = null;

  /**
   * Send event reminders
   */
  static async sendEventReminders(): Promise<void> {
    try {
      const now = new Date();

      logger.info('Starting event reminder job');

      // Find events that are:
      // 1. Approved
      // 2. Starting within 24 hours (but not within 1 hour)
      // 3. Starting within 1 hour (but not already started)
      const events24h = await prisma.event.findMany({
        where: {
          status: EventStatus.APPROVED,
          startDate: {
            gte: new Date(now.getTime() + 23 * 60 * 60 * 1000), // 23 hours from now
            lte: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours from now
          },
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          startDate: true,
        },
      });

      const events1h = await prisma.event.findMany({
        where: {
          status: EventStatus.APPROVED,
          startDate: {
            gte: new Date(now.getTime() + 50 * 60 * 1000), // 50 minutes from now
            lte: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
          },
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          startDate: true,
        },
      });

      let reminders24hSent = 0;
      let reminders1hSent = 0;

      // Send 24-hour reminders
      for (const event of events24h) {
        try {
          // Check if 24h reminder already sent (by checking for existing notifications)
          const existingReminder = await prisma.notification.findFirst({
            where: {
              eventId: event.id,
              type: NotificationType.EVENT_REMINDER_24H,
              createdAt: {
                gte: new Date(now.getTime() - 60 * 60 * 1000), // Within last hour
              },
            },
          });

          if (existingReminder) {
            logger.debug(`24h reminder already sent for event ${event.id}`);
            continue;
          }

          await NotificationService.sendEventNotification(
            event.id,
            NotificationType.EVENT_REMINDER_24H,
            `Event Reminder: ${event.title}`,
            `Don't forget! "${event.title}" is happening tomorrow. We look forward to seeing you there!`,
            'attendees',
            undefined,
            NotificationPriority.MEDIUM,
          );

          reminders24hSent++;
          logger.info(`Sent 24h reminder for event: ${event.id} (${event.title})`);
        } catch (error) {
          logger.error(`Failed to send 24h reminder for event ${event.id}:`, error);
        }
      }

      // Send 1-hour reminders
      for (const event of events1h) {
        try {
          // Check if 1h reminder already sent
          const existingReminder = await prisma.notification.findFirst({
            where: {
              eventId: event.id,
              type: NotificationType.EVENT_REMINDER_1H,
              createdAt: {
                gte: new Date(now.getTime() - 30 * 60 * 1000), // Within last 30 minutes
              },
            },
          });

          if (existingReminder) {
            logger.debug(`1h reminder already sent for event ${event.id}`);
            continue;
          }

          await NotificationService.sendEventNotification(
            event.id,
            NotificationType.EVENT_REMINDER_1H,
            `Event Starting Soon: ${event.title}`,
            `"${event.title}" is starting in about 1 hour. See you soon!`,
            'attendees',
            undefined,
            NotificationPriority.HIGH,
          );

          reminders1hSent++;
          logger.info(`Sent 1h reminder for event: ${event.id} (${event.title})`);
        } catch (error) {
          logger.error(`Failed to send 1h reminder for event ${event.id}:`, error);
        }
      }

      // Send registration deadline reminders
      const deadline24h = await prisma.event.findMany({
        where: {
          status: EventStatus.APPROVED,
          registrationDeadline: {
            gte: new Date(now.getTime() + 23 * 60 * 60 * 1000), // 23 hours from now
            lte: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours from now
          },
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          registrationDeadline: true,
        },
      });

      const deadline1h = await prisma.event.findMany({
        where: {
          status: EventStatus.APPROVED,
          registrationDeadline: {
            gte: new Date(now.getTime() + 50 * 60 * 1000), // 50 minutes from now
            lte: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
          },
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          registrationDeadline: true,
        },
      });

      let deadline24hSent = 0;
      let deadline1hSent = 0;

      // Send 24h registration deadline reminders
      for (const event of deadline24h) {
        try {
          // Check if 24h deadline reminder already sent
          const existingReminder = await prisma.notification.findFirst({
            where: {
              eventId: event.id,
              type: NotificationType.REGISTRATION_DEADLINE_24H,
              createdAt: {
                gte: new Date(now.getTime() - 60 * 60 * 1000), // Within last hour
              },
            },
          });

          if (existingReminder) {
            logger.debug(`24h deadline reminder already sent for event ${event.id}`);
            continue;
          }

          await NotificationService.sendEventNotification(
            event.id,
            NotificationType.REGISTRATION_DEADLINE_24H,
            `Registration Closing Soon: ${event.title}`,
            `Registration for "${event.title}" closes in 24 hours. Don't miss out - register now!`,
            'attendees',
            undefined,
            NotificationPriority.MEDIUM,
          );

          deadline24hSent++;
          logger.info(`Sent 24h registration deadline reminder for event: ${event.id} (${event.title})`);
        } catch (error) {
          logger.error(`Failed to send 24h deadline reminder for event ${event.id}:`, error);
        }
      }

      // Send 1h registration deadline reminders
      for (const event of deadline1h) {
        try {
          // Check if 1h deadline reminder already sent
          const existingReminder = await prisma.notification.findFirst({
            where: {
              eventId: event.id,
              type: NotificationType.REGISTRATION_DEADLINE_1H,
              createdAt: {
                gte: new Date(now.getTime() - 30 * 60 * 1000), // Within last 30 minutes
              },
            },
          });

          if (existingReminder) {
            logger.debug(`1h deadline reminder already sent for event ${event.id}`);
            continue;
          }

          await NotificationService.sendEventNotification(
            event.id,
            NotificationType.REGISTRATION_DEADLINE_1H,
            `Last Chance to Register: ${event.title}`,
            `Registration for "${event.title}" closes in 1 hour. This is your last chance to register!`,
            'attendees',
            undefined,
            NotificationPriority.HIGH,
          );

          deadline1hSent++;
          logger.info(`Sent 1h registration deadline reminder for event: ${event.id} (${event.title})`);
        } catch (error) {
          logger.error(`Failed to send 1h deadline reminder for event ${event.id}:`, error);
        }
      }

      if (reminders24hSent > 0 || reminders1hSent > 0 || deadline24hSent > 0 || deadline1hSent > 0) {
        logger.info(
          `Event reminder job completed. Sent ${reminders24hSent} 24h event reminders, ${reminders1hSent} 1h event reminders, ${deadline24hSent} 24h deadline reminders, and ${deadline1hSent} 1h deadline reminders`,
        );
      } else {
        logger.debug('No event reminders to send');
      }
    } catch (error) {
      logger.error('Error in event reminder job:', error);
    }
  }

  /**
   * Start the scheduled job
   */
  static start(): void {
    if (this.task) {
      logger.warn('Event reminder job is already running');
      return;
    }

    try {
      this.task = cron.schedule(this.CRON_SCHEDULE, async () => {
        await this.sendEventReminders();
      });

      logger.info('✅ Event reminder job started');
    } catch (error) {
      logger.error('Failed to start event reminder job:', error);
      throw error;
    }
  }

  /**
   * Stop the scheduled job
   */
  static stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Event reminder job stopped');
    }
  }
}

