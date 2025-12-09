import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class EventCalendarService {
  /**
   * Sync event to calendar
   */
  static async syncToCalendar(
    userId: string,
    registrationId: string,
    calendarType: 'GOOGLE' | 'APPLE' | 'OUTLOOK' | 'ICAL',
    reminderMinutes?: number
  ) {
    try {
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: { event: true },
      });

      if (!registration) {
        throw new NotFoundError('Registration not found');
      }

      if (registration.attendeeId !== userId) {
        throw new ValidationError('You can only sync your own events');
      }

      // Check if already synced
      const existing = await prisma.eventCalendarSync.findUnique({
        where: {
          userId_registrationId_calendarType: {
            userId,
            registrationId,
            calendarType,
          },
        },
      });

      if (existing && existing.syncStatus === 'ACTIVE') {
        throw new ValidationError('Event is already synced to this calendar');
      }

      const sync = await prisma.eventCalendarSync.upsert({
        where: {
          userId_registrationId_calendarType: {
            userId,
            registrationId,
            calendarType,
          },
        },
        create: {
          userId,
          registrationId,
          calendarType,
          reminderEnabled: reminderMinutes !== undefined,
          reminderMinutes: reminderMinutes || null,
          syncStatus: 'ACTIVE',
          syncedAt: new Date(),
        },
        update: {
          reminderEnabled: reminderMinutes !== undefined,
          reminderMinutes: reminderMinutes || null,
          syncStatus: 'ACTIVE',
          lastSyncedAt: new Date(),
        },
        include: {
          registration: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  startDate: true,
                  endDate: true,
                  location: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      // Generate calendar file based on type
      const calendarData = this.generateCalendarFile(sync, calendarType);

      logger.info(`Event synced to ${calendarType} calendar: ${registrationId}`);
      return { sync, calendarData };
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error syncing to calendar:', error);
      throw new ValidationError(`Failed to sync to calendar: ${error.message}`);
    }
  }

  /**
   * Get user's calendar syncs
   */
  static async getUserCalendarSyncs(userId: string) {
    try {
      const syncs = await prisma.eventCalendarSync.findMany({
        where: {
          userId,
          syncStatus: 'ACTIVE',
        },
        include: {
          registration: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  startDate: true,
                  endDate: true,
                  location: true,
                },
              },
            },
          },
        },
        orderBy: { syncedAt: 'desc' },
      });

      return syncs;
    } catch (error: any) {
      logger.error('Error fetching calendar syncs:', error);
      throw new ValidationError(`Failed to fetch syncs: ${error.message}`);
    }
  }

  /**
   * Remove calendar sync
   */
  static async removeCalendarSync(userId: string, syncId: string) {
    try {
      const sync = await prisma.eventCalendarSync.findUnique({
        where: { id: syncId },
      });

      if (!sync) {
        throw new NotFoundError('Calendar sync not found');
      }

      if (sync.userId !== userId) {
        throw new ValidationError('You can only remove your own syncs');
      }

      await prisma.eventCalendarSync.update({
        where: { id: syncId },
        data: {
          syncStatus: 'DISABLED',
        },
      });

      logger.info(`Calendar sync removed: ${syncId}`);
      return { success: true };
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error removing calendar sync:', error);
      throw new ValidationError(`Failed to remove sync: ${error.message}`);
    }
  }

  /**
   * Generate calendar file (iCal format)
   */
  private static generateCalendarFile(sync: any, calendarType: string) {
    const event = sync.registration.event;
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    // Generate iCal format
    const ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EventKnit//Event Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${sync.registrationId}@eventknit.com`,
      `DTSTART:${this.formatICalDate(startDate)}`,
      `DTEND:${this.formatICalDate(endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || ''}`,
      `LOCATION:${event.location || ''}`,
      sync.reminderEnabled && sync.reminderMinutes
        ? `BEGIN:VALARM\nTRIGGER:-PT${sync.reminderMinutes}M\nACTION:DISPLAY\nDESCRIPTION:Reminder\nEND:VALARM`
        : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .filter((line) => line)
      .join('\n');

    return {
      format: calendarType === 'ICAL' ? 'ics' : 'json',
      data: calendarType === 'ICAL' ? ical : this.generateJSONCalendar(sync),
      filename: `event-${event.id}.${calendarType === 'ICAL' ? 'ics' : 'json'}`,
    };
  }

  private static formatICalDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  private static generateJSONCalendar(sync: any) {
    const event = sync.registration.event;
    return {
      summary: event.title,
      description: event.description || '',
      location: event.location || '',
      start: {
        dateTime: event.startDate,
        timeZone: 'UTC',
      },
      end: {
        dateTime: event.endDate || event.startDate,
        timeZone: 'UTC',
      },
      reminders: sync.reminderEnabled && sync.reminderMinutes
        ? {
            useDefault: false,
            overrides: [
              {
                method: 'popup',
                minutes: sync.reminderMinutes,
              },
            ],
          }
        : undefined,
    };
  }
}
