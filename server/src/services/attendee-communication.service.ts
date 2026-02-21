import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';
import { NotificationService } from './notification.service.js';
import { NotificationType, NotificationPriority } from '@prisma/client';
import { emailService } from './email.service.js';

export class AttendeeCommunicationService {
  /**
   * Schedule a message to a saved audience segment
   * Used by tests to ensure the segment exists and message is persisted
   */
  static async scheduleMessage(
    organizerId: string,
    data: {
      audienceId: string;
      subject: string;
      content: string;
      scheduledFor?: Date;
    },
  ) {
    // Ensure segment belongs to organizer
    const segment = await prisma.attendeeSegment.findFirst({
      where: {
        id: data.audienceId,
        organizerId,
      },
    });

    if (!segment) {
      throw new NotFoundError('Audience segment not found');
    }

    // Persist as a bulk message entry with audience metadata
    const message = await prisma.bulkMessage.create({
      data: {
        title: data.subject,
        content: data.content,
        type: 'announcement',
        targetAudience: 'SPECIFIC_EVENT' as any,
        eventId: data.audienceId, // store audience/segment reference
        channels: { email: true, inApp: true, push: false, sms: false } as any,
        status: 'SCHEDULED' as any,
        scheduledAt: data.scheduledFor,
        createdBy: organizerId,
      },
    });

    return message;
  }

  /**
   * Send message to segment
   */
  static async sendToSegment(organizerId: string, segmentId: string, data: {
    subject: string;
    content: string;
    sendEmail?: boolean;
    sendNotification?: boolean;
  }) {
    try {
      const segment = await prisma.attendeeSegment.findFirst({
        where: {
          id: segmentId,
          organizerId,
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!segment) {
        throw new NotFoundError('Segment not found');
      }

      const results = {
        sent: 0,
        failed: 0,
        errors: [] as string[],
      };

      // Send to each member
      for (const member of segment.members) {
        try {
          if (data.sendNotification) {
            await NotificationService.sendNotification({
              userId: member.userId,
              type: NotificationType.EVENT_UPDATE,
              title: data.subject,
              message: data.content,
              priority: NotificationPriority.MEDIUM,
            });
          }

          if (data.sendEmail && member.user.email) {
            await emailService.sendEmail({
              to: member.user.email,
              subject: data.subject,
              html: data.content,
            });
          }

          results.sent++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Failed to send to ${member.user.email}: ${error.message}`);
          logger.error(`Error sending to user ${member.userId}:`, error);
        }
      }

      return results;
    } catch (error) {
      logger.error('Error sending to segment:', error);
      throw error;
    }
  }

  /**
   * Send message to tagged users
   */
  static async sendToTaggedUsers(organizerId: string, tagId: string, data: {
    subject: string;
    content: string;
    eventId?: string;
    sendEmail?: boolean;
    sendNotification?: boolean;
  }) {
    try {
      const tag = await prisma.attendeeTag.findFirst({
        where: {
          id: tagId,
          organizerId,
        },
      });

      if (!tag) {
        throw new NotFoundError('Tag not found');
      }

      const where: any = {
        tagId,
      };

      if (data.eventId) {
        where.eventId = data.eventId;
      }

      const taggedUsers = await prisma.attendeeTaggedUser.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      const results = {
        sent: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const taggedUser of taggedUsers) {
        try {
          if (data.sendNotification) {
            await NotificationService.sendNotification({
              userId: taggedUser.userId,
              type: NotificationType.EVENT_UPDATE,
              title: data.subject,
              message: data.content,
              priority: NotificationPriority.MEDIUM,
              eventId: data.eventId,
            });
          }

          if (data.sendEmail && taggedUser.user.email) {
            await emailService.sendEmail({
              to: taggedUser.user.email,
              subject: data.subject,
              html: data.content,
            });
          }

          results.sent++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Failed to send to ${taggedUser.user.email}: ${error.message}`);
          logger.error(`Error sending to user ${taggedUser.userId}:`, error);
        }
      }

      return results;
    } catch (error) {
      logger.error('Error sending to tagged users:', error);
      throw error;
    }
  }

  /**
   * Send message to event registrations
   */
  static async sendToEventRegistrations(organizerId: string, eventId: string, data: {
    subject: string;
    content: string;
    registrationIds?: string[];
    sendEmail?: boolean;
    sendNotification?: boolean;
  }) {
    try {
      // Verify event belongs to organizer
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          organizerId,
          deletedAt: null,
        },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      const where: any = {
        eventId,
        status: 'CONFIRMED',
      };

      if (data.registrationIds && data.registrationIds.length > 0) {
        where.id = {
          in: data.registrationIds,
        };
      }

      const registrations = await prisma.eventRegistration.findMany({
        where,
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
      });

      const results = {
        sent: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const registration of registrations) {
        try {
          if (data.sendNotification) {
            await NotificationService.sendNotification({
              userId: registration.attendeeId,
              type: NotificationType.EVENT_UPDATE,
              title: data.subject,
              message: data.content,
              priority: NotificationPriority.MEDIUM,
              eventId,
              registrationId: registration.id,
            });
          }

          if (data.sendEmail && registration.attendee.email) {
            await emailService.sendEmail({
              to: registration.attendee.email,
              subject: data.subject,
              html: data.content,
            });
          }

          results.sent++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Failed to send to ${registration.attendee.email}: ${error.message}`);
          logger.error(`Error sending to registration ${registration.id}:`, error);
        }
      }

      return results;
    } catch (error) {
      logger.error('Error sending to event registrations:', error);
      throw error;
    }
  }

  /**
   * Get communication history
   */
  static async getCommunicationHistory(organizerId: string, filters?: {
    page?: number;
    limit?: number;
    eventId?: string;
    segmentId?: string;
    tagId?: string;
  }) {
    try {
      const limit = filters?.limit || 20;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      // Get bulk messages sent by organizer
      const where: any = {
        createdBy: organizerId,
      };

      if (filters?.eventId) {
        where.eventId = filters.eventId;
      }

      const [messages, total] = await Promise.all([
        prisma.bulkMessage.findMany({
          where,
          include: {
            event: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.bulkMessage.count({ where }),
      ]);

      return {
        messages,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      };
    } catch (error) {
      logger.error('Error getting communication history:', error);
      throw error;
    }
  }

  /**
   * Get segment recipients (for email campaigns)
   */
  static async getSegmentRecipients(segmentId: string, organizerId: string): Promise<Array<{ id: string; email: string; firstName?: string; lastName?: string }>> {
    try {
      const segment = await prisma.attendeeSegment.findFirst({
        where: {
          id: segmentId,
          organizerId,
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!segment) {
        return [];
      }

      return segment.members.map(m => ({
        id: m.user.id,
        email: m.user.email,
        firstName: m.user.firstName || undefined,
        lastName: m.user.lastName || undefined,
      }));
    } catch (error) {
      logger.error('Error getting segment recipients:', error);
      return [];
    }
  }

  /**
   * Get tagged users recipients (for email campaigns)
   */
  static async getTaggedUsersRecipients(tagId: string, organizerId: string): Promise<Array<{ id: string; email: string; firstName?: string; lastName?: string }>> {
    try {
      const tag = await prisma.attendeeTag.findFirst({
        where: {
          id: tagId,
          organizerId,
        },
        include: {
          taggedUsers: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!tag) {
        return [];
      }

      return tag.taggedUsers.map(tu => ({
        id: tu.user.id,
        email: tu.user.email,
        firstName: tu.user.firstName || undefined,
        lastName: tu.user.lastName || undefined,
      }));
    } catch (error) {
      logger.error('Error getting tagged users recipients:', error);
      return [];
    }
  }

  /**
   * Get event registrations recipients (for email campaigns)
   */
  static async getEventRegistrationsRecipients(eventId: string, organizerId: string): Promise<Array<{ id: string; email: string; firstName?: string; lastName?: string }>> {
    try {
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          organizerId,
          deletedAt: null,
        },
      });

      if (!event) {
        return [];
      }

      const registrations = await prisma.eventRegistration.findMany({
        where: {
          eventId,
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

      return registrations.map(r => ({
        id: r.attendee.id,
        email: r.attendee.email,
        firstName: r.attendee.firstName || undefined,
        lastName: r.attendee.lastName || undefined,
      }));
    } catch (error) {
      logger.error('Error getting event registrations recipients:', error);
      return [];
    }
  }

  /**
   * Send event cancellation emails to all confirmed attendees
   */
  static async sendEventCancellationEmails(
    eventId: string,
    data: {
      cancellationReason?: string;
      refundInfo?: {
        amount: string;
        status: 'processing' | 'completed' | 'pending' | 'not_applicable';
      };
    },
  ) {
    try {
      // Get event details
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          title: true,
          startDate: true,
          venue: true,
          location: true,
          organizer: {
            select: {
              organizationName: true,
              email: true,
            },
          },
        },
      });

      if (!event) {
        logger.error(`Cannot send cancellation emails: Event ${eventId} not found`);
        return { sent: 0, failed: 0, errors: [] as string[] };
      }

      // Get all confirmed registrations
      const registrations = await prisma.eventRegistration.findMany({
        where: {
          eventId,
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

      const results = {
        sent: 0,
        failed: 0,
        errors: [] as string[],
      };

      const eventDate = event.startDate
        ? new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        }).format(new Date(event.startDate))
        : 'TBD';

      const eventLocation = event.venue || event.location;

      // Send emails to each attendee
      for (const registration of registrations) {
        try {
          const attendeeName = registration.attendee.firstName
            ? `${registration.attendee.firstName}${registration.attendee.lastName ? ` ${registration.attendee.lastName}` : ''}`
            : undefined;

          await emailService.sendEventCancellationEmail(registration.attendee.email, {
            attendeeName: attendeeName || 'there',
            eventTitle: event.title,
            eventDate,
            eventLocation,
            cancellationReason: data.cancellationReason,
            refundAmount: data.refundInfo?.amount,
            refundStatus: data.refundInfo?.status,
            organizerName: event.organizer.organizationName || undefined,
            supportEmail: event.organizer.email,
          });

          // Also send in-app notification
          await NotificationService.sendNotification({
            userId: registration.attendee.id,
            type: NotificationType.EVENT_CANCELLED,
            title: `Event Cancelled: ${event.title}`,
            message: `The event "${event.title}" scheduled for ${eventDate} has been cancelled.${data.cancellationReason ? ` Reason: ${data.cancellationReason}` : ''}`,
            priority: NotificationPriority.HIGH,
            eventId,
            registrationId: registration.id,
            data: {
              reason: data.cancellationReason,
              refundInfo: data.refundInfo,
            },
          });

          results.sent++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Failed to send to ${registration.attendee.email}: ${error.message}`);
          logger.error(`Error sending cancellation email to ${registration.attendee.email}:`, error);
        }
      }

      logger.info(
        `Event cancellation emails sent for ${eventId}: ${results.sent} sent, ${results.failed} failed`,
      );

      return results;
    } catch (error) {
      logger.error('Error sending event cancellation emails:', error);
      throw error;
    }
  }

  /**
   * Send event postponement emails to all confirmed attendees
   */
  static async sendEventPostponementEmails(
    eventId: string,
    data: {
      originalDate: Date | string;
      newDate: Date | string;
      originalLocation?: string;
      newLocation?: string;
      postponementReason?: string;
      refundOption?: boolean;
    },
  ) {
    try {
      // Get event details
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          title: true,
          venue: true,
          location: true,
          organizer: {
            select: {
              organizationName: true,
              email: true,
            },
          },
        },
      });

      if (!event) {
        logger.error(`Cannot send postponement emails: Event ${eventId} not found`);
        return { sent: 0, failed: 0, errors: [] as string[] };
      }

      // Get all confirmed registrations
      const registrations = await prisma.eventRegistration.findMany({
        where: {
          eventId,
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

      const results = {
        sent: 0,
        failed: 0,
        errors: [] as string[],
      };

      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      });

      const originalDateStr = dateFormatter.format(
        typeof data.originalDate === 'string' ? new Date(data.originalDate) : data.originalDate,
      );
      const newDateStr = dateFormatter.format(
        typeof data.newDate === 'string' ? new Date(data.newDate) : data.newDate,
      );

      // Send emails to each attendee
      for (const registration of registrations) {
        try {
          const attendeeName = registration.attendee.firstName
            ? `${registration.attendee.firstName}${registration.attendee.lastName ? ` ${registration.attendee.lastName}` : ''}`
            : undefined;

          await emailService.sendEventPostponementEmail(registration.attendee.email, {
            attendeeName: attendeeName || 'there',
            eventTitle: event.title,
            originalDate: originalDateStr,
            newDate: newDateStr,
            originalLocation: data.originalLocation,
            newLocation: data.newLocation || event.venue || event.location,
            postponementReason: data.postponementReason,
            organizerName: event.organizer.organizationName || undefined,
            supportEmail: event.organizer.email,
            refundOption: data.refundOption,
          });

          // Also send in-app notification
          await NotificationService.sendNotification({
            userId: registration.attendee.id,
            type: NotificationType.EVENT_UPDATE,
            title: `Event Rescheduled: ${event.title}`,
            message: `The event "${event.title}" has been rescheduled from ${originalDateStr} to ${newDateStr}. Your ticket remains valid.`,
            priority: NotificationPriority.HIGH,
            eventId,
            registrationId: registration.id,
            data: {
              originalDate: originalDateStr,
              newDate: newDateStr,
              reason: data.postponementReason,
            },
          });

          results.sent++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Failed to send to ${registration.attendee.email}: ${error.message}`);
          logger.error(`Error sending postponement email to ${registration.attendee.email}:`, error);
        }
      }

      logger.info(
        `Event postponement emails sent for ${eventId}: ${results.sent} sent, ${results.failed} failed`,
      );

      return results;
    } catch (error) {
      logger.error('Error sending event postponement emails:', error);
      throw error;
    }
  }

  /**
   * Send event update emails to all confirmed attendees
   */
  static async sendEventUpdateEmails(
    eventId: string,
    data: {
      updateType: 'location' | 'time' | 'details' | 'general';
      updateSummary: string;
    },
  ) {
    try {
      // Get event details
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          title: true,
          startDate: true,
          venue: true,
          location: true,
          organizer: {
            select: {
              organizationName: true,
              email: true,
            },
          },
        },
      });

      if (!event) {
        logger.error(`Cannot send update emails: Event ${eventId} not found`);
        return { sent: 0, failed: 0, errors: [] as string[] };
      }

      // Get all confirmed registrations
      const registrations = await prisma.eventRegistration.findMany({
        where: {
          eventId,
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

      const results = {
        sent: 0,
        failed: 0,
        errors: [] as string[],
      };

      const eventDate = event.startDate
        ? new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        }).format(new Date(event.startDate))
        : 'TBD';

      const eventLocation = event.venue || event.location;

      // Send emails to each attendee
      for (const registration of registrations) {
        try {
          const attendeeName = registration.attendee.firstName
            ? `${registration.attendee.firstName}${registration.attendee.lastName ? ` ${registration.attendee.lastName}` : ''}`
            : undefined;

          await emailService.sendEventUpdateEmail(registration.attendee.email, {
            attendeeName: attendeeName || 'there',
            eventTitle: event.title,
            eventDate,
            eventLocation,
            updateType: data.updateType,
            updateSummary: data.updateSummary,
            organizerName: event.organizer.organizationName || undefined,
            supportEmail: event.organizer.email,
          });

          // Also send in-app notification
          await NotificationService.sendNotification({
            userId: registration.attendee.id,
            type: NotificationType.EVENT_UPDATE,
            title: `Event Update: ${event.title}`,
            message: data.updateSummary,
            priority: NotificationPriority.MEDIUM,
            eventId,
            registrationId: registration.id,
            data: {
              updateType: data.updateType,
            },
          });

          results.sent++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Failed to send to ${registration.attendee.email}: ${error.message}`);
          logger.error(`Error sending update email to ${registration.attendee.email}:`, error);
        }
      }

      logger.info(
        `Event update emails sent for ${eventId}: ${results.sent} sent, ${results.failed} failed`,
      );

      return results;
    } catch (error) {
      logger.error('Error sending event update emails:', error);
      throw error;
    }
  }
}
