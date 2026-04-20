import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { emailService } from './email.service.js';
import { AttendeeCommunicationService } from './attendee-communication.service.js';
import { generateUnsubscribeUrl, UnsubscribeTokenPayload } from '../utils/jwt.js';
import { config } from '../config/index.js';

export class EmailMarketingService {
  /**
   * Create email campaign
   */
  static async createCampaign(organizerId: string, data: {
    eventId?: string;
    name: string;
    subject: string;
    content: string;
    plainText?: string;
    recipientType: 'all' | 'segment' | 'tag' | 'event_registrations';
    segmentId?: string;
    tagId?: string;
    scheduledAt?: Date;
  }) {
    try {
      if (data.eventId) {
        const event = await prisma.event.findFirst({
          where: {
            id: data.eventId,
            organizerId,
            deletedAt: null,
          },
        });

        if (!event) {
          throw new NotFoundError('Event not found');
        }
      }

      // Validate recipient type
      if (data.recipientType === 'segment' && !data.segmentId) {
        throw new ValidationError('Segment ID is required for segment recipient type');
      }

      if (data.recipientType === 'tag' && !data.tagId) {
        throw new ValidationError('Tag ID is required for tag recipient type');
      }

      const campaign = await prisma.emailCampaign.create({
        data: {
          organizerId,
          eventId: data.eventId,
          name: data.name,
          subject: data.subject,
          content: data.content,
          plainText: data.plainText,
          recipientType: data.recipientType,
          segmentId: data.segmentId,
          tagId: data.tagId,
          scheduledAt: data.scheduledAt,
          status: data.scheduledAt ? 'scheduled' : 'draft',
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      return campaign;
    } catch (error) {
      logger.error('Error creating email campaign:', error);
      throw error;
    }
  }

  /**
   * Get organizer's email campaigns
   */
  static async getCampaigns(organizerId: string, filters?: {
    eventId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const limit = filters?.limit || 20;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const where: any = {
        organizerId,
      };

      if (filters?.eventId) {
        where.eventId = filters.eventId;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      const [campaigns, total] = await Promise.all([
        prisma.emailCampaign.findMany({
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
        prisma.emailCampaign.count({ where }),
      ]);

      return {
        campaigns,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting email campaigns:', error);
      throw error;
    }
  }

  /**
   * Send email campaign
   */
  static async sendCampaign(campaignId: string, organizerId: string) {
    try {
      const campaign = await prisma.emailCampaign.findFirst({
        where: {
          id: campaignId,
          organizerId,
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      if (!campaign) {
        throw new NotFoundError('Email campaign not found');
      }

      if (campaign.status === 'sent') {
        throw new ValidationError('Campaign has already been sent');
      }

      // Update status to sending
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { status: 'sending' },
      });

      // Get recipients based on recipient type
      let recipients: Array<{ id: string; email: string; firstName?: string; lastName?: string }> = [];

      if (campaign.recipientType === 'all') {
        // Get all organizer's event registrations
        const registrations = await prisma.eventRegistration.findMany({
          where: {
            event: {
              organizerId,
            },
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

        recipients = registrations.map(r => ({
          id: r.attendee.id,
          email: r.attendee.email,
          firstName: r.attendee.firstName || undefined,
          lastName: r.attendee.lastName || undefined,
        }));
      } else if (campaign.recipientType === 'segment' && campaign.segmentId) {
        recipients = await AttendeeCommunicationService.getSegmentRecipients(campaign.segmentId, organizerId);
      } else if (campaign.recipientType === 'tag' && campaign.tagId) {
        recipients = await AttendeeCommunicationService.getTaggedUsersRecipients(campaign.tagId, organizerId);
      } else if (campaign.recipientType === 'event_registrations' && campaign.eventId) {
        recipients = await AttendeeCommunicationService.getEventRegistrationsRecipients(campaign.eventId, organizerId);
      }

      // Send emails
      let sentCount = 0;
      let deliveredCount = 0;
      let bouncedCount = 0;

      for (const recipient of recipients) {
        try {
          // Generate personalized unsubscribe link for this recipient
          // CAN-SPAM and GDPR require unsubscribe links in marketing emails
          const unsubscribePayload: UnsubscribeTokenPayload = {
            userId: recipient.id,
            email: recipient.email,
            eventId: campaign.eventId || undefined,
            campaignId: campaign.id,
            type: 'marketing',
          };
          const unsubscribeUrl = generateUnsubscribeUrl(config.frontend.url, unsubscribePayload);

          // Add unsubscribe footer to HTML content
          const unsubscribeFooter = `
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
              <p>You're receiving this email because you registered for events or subscribed to updates.</p>
              <p>
                <a href="${unsubscribeUrl}" style="color: #4f46e5; text-decoration: underline;">Unsubscribe from marketing emails</a>
                &nbsp;|&nbsp;
                <a href="${config.frontend.url}/settings/notifications" style="color: #4f46e5; text-decoration: underline;">Manage email preferences</a>
              </p>
            </div>
          `;

          // Add unsubscribe link to plain text version
          const unsubscribeText = `\n\n---\nYou're receiving this email because you registered for events or subscribed to updates.\nUnsubscribe: ${unsubscribeUrl}\nManage preferences: ${config.frontend.url}/settings/notifications`;

          await emailService.sendEmail({
            to: recipient.email,
            subject: campaign.subject,
            html: campaign.content + unsubscribeFooter,
            text: (campaign.plainText || '') + unsubscribeText,
          });

          sentCount++;
          deliveredCount++;
        } catch (error) {
          logger.error(`Error sending email to ${recipient.email}:`, error);
          bouncedCount++;
        }
      }

      // Update campaign status and stats
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'sent',
          sentAt: new Date(),
          sentCount,
          deliveredCount,
          bouncedCount,
        },
      });

      return {
        success: true,
        sentCount,
        deliveredCount,
        bouncedCount,
      };
    } catch (error) {
      logger.error('Error sending email campaign:', error);
      // Update status to failed
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { status: 'failed' },
      }).catch((err) => { logger.error('Failed to update campaign status to failed', { campaignId, error: err }); });
      throw error;
    }
  }

  /**
   * Create email automation rule
   */
  static async createAutomationRule(organizerId: string, data: {
    campaignId: string;
    name: string;
    trigger: string;
    triggerConditions?: any;
    delayType?: 'immediate' | 'after_days' | 'before_event';
    delayValue?: number;
  }) {
    try {
      const campaign = await prisma.emailCampaign.findFirst({
        where: {
          id: data.campaignId,
          organizerId,
        },
      });

      if (!campaign) {
        throw new NotFoundError('Email campaign not found');
      }

      const rule = await prisma.emailAutomationRule.create({
        data: {
          campaignId: data.campaignId,
          organizerId,
          name: data.name,
          trigger: data.trigger,
          triggerConditions: data.triggerConditions,
          delayType: data.delayType,
          delayValue: data.delayValue,
        },
      });

      return rule;
    } catch (error) {
      logger.error('Error creating automation rule:', error);
      throw error;
    }
  }

  /**
   * Get campaign analytics
   */
  static async getCampaignAnalytics(campaignId: string, organizerId: string) {
    try {
      const campaign = await prisma.emailCampaign.findFirst({
        where: {
          id: campaignId,
          organizerId,
        },
      });

      if (!campaign) {
        throw new NotFoundError('Email campaign not found');
      }

      const totalSent = campaign.sentCount;
      const delivered = campaign.deliveredCount;
      const opened = campaign.openedCount;
      const clicked = campaign.clickedCount;
      const bounced = campaign.bouncedCount;
      const unsubscribed = campaign.unsubscribedCount;

      const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
      const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
      const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;
      const bounceRate = totalSent > 0 ? (bounced / totalSent) * 100 : 0;
      const unsubscribeRate = delivered > 0 ? (unsubscribed / delivered) * 100 : 0;

      return {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          subject: campaign.subject,
          status: campaign.status,
          sentAt: campaign.sentAt,
        },
        metrics: {
          sent: totalSent,
          delivered,
          opened,
          clicked,
          bounced,
          unsubscribed,
        },
        rates: {
          deliveryRate,
          openRate,
          clickRate,
          bounceRate,
          unsubscribeRate,
        },
      };
    } catch (error) {
      logger.error('Error getting campaign analytics:', error);
      throw error;
    }
  }

  /**
   * Track email open
   */
  static async trackEmailOpen(campaignId: string) {
    try {
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          openedCount: {
            increment: 1,
          },
        },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error tracking email open:', error);
      return { success: false };
    }
  }

  /**
   * Track email click
   */
  static async trackEmailClick(campaignId: string) {
    try {
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          clickedCount: {
            increment: 1,
          },
        },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error tracking email click:', error);
      return { success: false };
    }
  }
}
