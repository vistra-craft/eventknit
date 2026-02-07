import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { emailService } from './email.service.js';
import { FeedbackService } from './feedback.service.js';
import { config } from '../config/index.js';

const prisma = new PrismaClient();

interface FeedbackEmailData {
  recipientEmail: string;
  recipientName: string;
  eventTitle: string;
  eventId: string;
  feedbackToken: string;
  userType: 'ATTENDEE' | 'ORGANIZER';
}

export class FeedbackEmailService {
  private static readonly FEEDBACK_BASE_URL = config.frontend.url || 'http://localhost:5173';

  /**
   * Send feedback request email to a user
   */
  static async sendFeedbackRequestEmail(data: FeedbackEmailData) {
    try {
      const feedbackUrl = `${this.FEEDBACK_BASE_URL}/feedback/${data.feedbackToken}`;

      const subject =
        data.userType === 'ATTENDEE'
          ? `How was your experience at ${data.eventTitle}?`
          : `How was your experience organizing ${data.eventTitle}?`;

      const html = this.generateFeedbackEmailHtml({
        ...data,
        feedbackUrl,
      });

      const text = this.generateFeedbackEmailText({
        ...data,
        feedbackUrl,
      });

      await emailService.sendEmail({
        to: data.recipientEmail,
        subject,
        html,
        text,
      });

      logger.info(`Feedback request email sent to ${data.recipientEmail} for event ${data.eventId}`);
      return true;
    } catch (error) {
      logger.error('Error sending feedback request email:', error);
      throw error;
    }
  }

  /**
   * Trigger feedback emails for all attendees of an event (post-event)
   */
  static async triggerAttendeeFeedbackEmails(eventId: string) {
    try {
      // Get event with registrations
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          registrations: {
            where: {
              status: 'CONFIRMED',
            },
            include: {
              attendee: {
                select: { id: true, firstName: true, lastName: true, email: true },
              },
            },
          },
        },
      });

      if (!event) {
        logger.warn(`Event ${eventId} not found for feedback emails`);
        return { sent: 0, failed: 0 };
      }

      let sent = 0;
      let failed = 0;

      for (const registration of event.registrations) {
        try {
          // Create feedback request with token
          const result = await FeedbackService.createFeedbackRequest(
            eventId,
            registration.attendeeId,
            'ATTENDEE',
          );

          if (result) {
            // Send email
            await this.sendFeedbackRequestEmail({
              recipientEmail: registration.attendee.email,
              recipientName: `${registration.attendee.firstName} ${registration.attendee.lastName}`.trim(),
              eventTitle: event.title,
              eventId: event.id,
              feedbackToken: result.token,
              userType: 'ATTENDEE',
            });
            sent++;
          }
        } catch (error) {
          logger.error(
            `Failed to send feedback email to ${registration.attendee.email}:`,
            error,
          );
          failed++;
        }
      }

      logger.info(
        `Feedback emails for event ${eventId}: ${sent} sent, ${failed} failed`,
      );
      return { sent, failed };
    } catch (error) {
      logger.error('Error triggering attendee feedback emails:', error);
      throw error;
    }
  }

  /**
   * Trigger feedback email for event organizer (post-event)
   */
  static async triggerOrganizerFeedbackEmail(eventId: string) {
    try {
      // Get event with organizer
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          organizer: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      if (!event) {
        logger.warn(`Event ${eventId} not found for organizer feedback`);
        return false;
      }

      // Create feedback request with token
      const result = await FeedbackService.createFeedbackRequest(
        eventId,
        event.organizerId,
        'ORGANIZER',
      );

      if (result) {
        // Send email
        await this.sendFeedbackRequestEmail({
          recipientEmail: event.organizer.email,
          recipientName: `${event.organizer.firstName} ${event.organizer.lastName}`.trim(),
          eventTitle: event.title,
          eventId: event.id,
          feedbackToken: result.token,
          userType: 'ORGANIZER',
        });

        logger.info(`Organizer feedback email sent for event ${eventId}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error triggering organizer feedback email:', error);
      throw error;
    }
  }

  /**
   * Trigger all feedback emails for an event (both attendees and organizer)
   */
  static async triggerAllFeedbackEmails(eventId: string) {
    try {
      const [attendeeResult, organizerResult] = await Promise.all([
        this.triggerAttendeeFeedbackEmails(eventId),
        this.triggerOrganizerFeedbackEmail(eventId),
      ]);

      return {
        attendees: attendeeResult,
        organizer: organizerResult,
      };
    } catch (error) {
      logger.error('Error triggering all feedback emails:', error);
      throw error;
    }
  }

  /**
   * Generate HTML email template for feedback request
   */
  private static generateFeedbackEmailHtml(data: {
    recipientName: string;
    eventTitle: string;
    feedbackUrl: string;
    userType: 'ATTENDEE' | 'ORGANIZER';
  }): string {
    const isAttendee = data.userType === 'ATTENDEE';
    const greeting = data.recipientName ? `Hi ${data.recipientName},` : 'Hello,';

    const intro = isAttendee
      ? `Thank you for attending <strong>${data.eventTitle}</strong>! We'd love to hear about your experience.`
      : `Thank you for organizing <strong>${data.eventTitle}</strong>! We'd love to hear about your experience using EventKnit.`;

    const cta = isAttendee
      ? 'Your feedback helps event organizers improve future events and helps us make EventKnit better for everyone.'
      : 'Your feedback helps us improve EventKnit and provide better tools for event organizers like you.';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Share Your Feedback</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">
                Share Your Feedback
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                ${greeting}
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                ${intro}
              </p>
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #374151;">
                ${cta}
              </p>

              <!-- NPS Quick Response -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 30px; text-align: center;">
                <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #111827;">
                  How likely are you to recommend EventKnit?
                </p>
                <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
                  Click a number to share your rating (0 = Not likely, 10 = Very likely)
                </p>
                <table role="presentation" style="margin: 0 auto; border-collapse: separate; border-spacing: 4px;">
                  <tr>
                    ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    .map(
      (n) => `
                      <td>
                        <a href="${data.feedbackUrl}?nps=${n}" style="display: inline-block; width: 32px; height: 32px; line-height: 32px; text-align: center; background-color: ${n <= 6 ? '#fecaca' : n <= 8 ? '#fef08a' : '#bbf7d0'}; color: #374151; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
                          ${n}
                        </a>
                      </td>
                    `,
    )
    .join('')}
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center;">
                <a href="${data.feedbackUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Share Detailed Feedback
                </a>
              </div>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280; text-align: center;">
                This survey takes less than 2 minutes to complete.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                This email was sent by EventKnit. If you have any questions, please contact us.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">
                This feedback link expires in 7 days.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Generate plain text email for feedback request
   */
  private static generateFeedbackEmailText(data: {
    recipientName: string;
    eventTitle: string;
    feedbackUrl: string;
    userType: 'ATTENDEE' | 'ORGANIZER';
  }): string {
    const isAttendee = data.userType === 'ATTENDEE';
    const greeting = data.recipientName ? `Hi ${data.recipientName},` : 'Hello,';

    const intro = isAttendee
      ? `Thank you for attending ${data.eventTitle}! We'd love to hear about your experience.`
      : `Thank you for organizing ${data.eventTitle}! We'd love to hear about your experience using EventKnit.`;

    return `
${greeting}

${intro}

Your feedback helps us improve EventKnit for everyone.

How likely are you to recommend EventKnit? (0-10)

Share your feedback here: ${data.feedbackUrl}

This survey takes less than 2 minutes to complete.

This feedback link expires in 7 days.

---
EventKnit
    `.trim();
  }
}

export default FeedbackEmailService;
