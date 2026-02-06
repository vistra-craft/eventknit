import * as cron from 'node-cron';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { EventStatus, NotificationType, NotificationPriority } from '@prisma/client';
import { NotificationService } from '../services/notification.service.js';
import { emailService } from '../services/email.service.js';

/**
 * Post-Event Survey Job
 *
 * Sends survey requests to attendees 24 hours after an event ends
 * Runs every hour to check for completed events
 */
export class PostEventSurveyJob {
  private static readonly CRON_SCHEDULE = '0 * * * *'; // Every hour at minute 0
  private static task: cron.ScheduledTask | null = null;

  /**
   * Check if database is available
   */
  private static async isDatabaseAvailable(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Send post-event surveys
   */
  static async sendPostEventSurveys(): Promise<void> {
    try {
      // Check if database is available before proceeding
      const dbAvailable = await this.isDatabaseAvailable();
      if (!dbAvailable) {
        logger.warn('Database not available, skipping post-event survey job');
        return;
      }

      const now = new Date();

      logger.info('Starting post-event survey job');

      // Find events that:
      // 1. Are completed or approved (but ended)
      // 2. Ended between 23-25 hours ago (1-hour window to catch events)
      const endedEvents = await prisma.event.findMany({
        where: {
          status: {
            in: [EventStatus.APPROVED, EventStatus.COMPLETED],
          },
          deletedAt: null,
          // Event ended 23-25 hours ago
          OR: [
            // Events with endDate
            {
              endDate: {
                gte: new Date(now.getTime() - 25 * 60 * 60 * 1000), // 25 hours ago
                lte: new Date(now.getTime() - 23 * 60 * 60 * 1000), // 23 hours ago
              },
            },
            // Events without endDate - use startDate as proxy (assume same-day event)
            {
              endDate: null,
              startDate: {
                gte: new Date(now.getTime() - 25 * 60 * 60 * 1000),
                lte: new Date(now.getTime() - 23 * 60 * 60 * 1000),
              },
            },
          ],
        },
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          organizerId: true,
          organizer: {
            select: {
              organizationName: true,
              email: true,
            },
          },
        },
      });

      let surveysSent = 0;
      let surveysSkipped = 0;

      for (const event of endedEvents) {
        try {
          // Check if survey already sent for this event (within last 48 hours)
          const existingSurvey = await prisma.notification.findFirst({
            where: {
              eventId: event.id,
              type: NotificationType.POST_EVENT_SURVEY,
              createdAt: {
                gte: new Date(now.getTime() - 48 * 60 * 60 * 1000), // Within last 48 hours
              },
            },
          });

          if (existingSurvey) {
            logger.debug(`Survey already sent for event ${event.id}`);
            surveysSkipped++;
            continue;
          }

          // Get all confirmed attendees
          const registrations = await prisma.eventRegistration.findMany({
            where: {
              eventId: event.id,
              status: 'CONFIRMED',
            },
            include: {
              attendee: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            distinct: ['attendeeId'],
          });

          // Generate a survey URL (placeholder - could be integrated with a survey service)
          const surveyUrl = `${process.env.CLIENT_URL || 'https://eventknit.com'}/events/${event.id}/survey`;

          // Send survey to each attendee
          for (const registration of registrations) {
            try {
              const attendeeName = registration.attendee.firstName
                ? `${registration.attendee.firstName}${registration.attendee.lastName ? ` ${registration.attendee.lastName}` : ''}`
                : 'there';

              // Send in-app notification
              await NotificationService.sendNotification({
                userId: registration.attendee.id,
                type: NotificationType.POST_EVENT_SURVEY,
                title: `How was "${event.title}"?`,
                message: `We'd love to hear your feedback about "${event.title}". Please take a moment to share your experience.`,
                priority: NotificationPriority.MEDIUM,
                eventId: event.id,
                registrationId: registration.id,
                data: {
                  surveyUrl,
                },
              });

              // Send survey email
              await emailService.sendPostEventSurveyEmail(registration.attendee.email, {
                attendeeName,
                eventTitle: event.title,
                eventDate: new Intl.DateTimeFormat('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }).format(new Date(event.startDate)),
                surveyUrl,
                organizerName: event.organizer.organizationName || undefined,
              });

              surveysSent++;
            } catch (error) {
              logger.error(`Failed to send survey to ${registration.attendee.email}:`, error);
            }
          }

          logger.info(`Sent surveys for event: ${event.id} (${event.title}) to ${registrations.length} attendees`);
        } catch (error) {
          logger.error(`Failed to process surveys for event ${event.id}:`, error);
        }
      }

      if (surveysSent > 0 || surveysSkipped > 0) {
        logger.info(
          `Post-event survey job completed. Sent ${surveysSent} surveys, skipped ${surveysSkipped} (already sent)`,
        );
      } else {
        logger.debug('No post-event surveys to send');
      }
    } catch (error) {
      // Check if it's a database connection error
      if (error instanceof Error && (
        error.message.includes('Can\'t reach database server') ||
        error.message.includes('P1001') ||
        error.constructor.name === 'PrismaClientInitializationError'
      )) {
        logger.warn('Database connection error during post-event survey job, skipping this run:', error.message);
        return;
      }
      logger.error('Error in post-event survey job:', error);
    }
  }

  /**
   * Start the scheduled job
   */
  static start(): void {
    if (this.task) {
      logger.warn('Post-event survey job is already running');
      return;
    }

    try {
      this.task = cron.schedule(this.CRON_SCHEDULE, async () => {
        await this.sendPostEventSurveys();
      });

      logger.info('✅ Post-event survey job started');
    } catch (error) {
      logger.error('Failed to start post-event survey job:', error);
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
      logger.info('Post-event survey job stopped');
    }
  }
}
