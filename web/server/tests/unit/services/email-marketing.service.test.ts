import { EmailMarketingService } from '../../../src/services/email-marketing.service.js';
import { prisma } from '../../../src/config/database.js';
import { logger } from '../../../src/utils/logger.js';
import { emailService } from '../../../src/services/email.service.js';
import { AttendeeCommunicationService } from '../../../src/services/attendee-communication.service.js';
import { NotFoundError } from '../../../src/utils/errors.js';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  prisma: {
    event: {
      findFirst: jest.fn(),
    },
    emailCampaign: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    emailAutomationRule: {
      create: jest.fn(),
    },
    eventRegistration: {
      findMany: jest.fn(),
    },
  },
}));
jest.mock('../../../src/utils/logger.js');
jest.mock('../../../src/services/email.service.js', () => ({
  emailService: {
    sendEmail: jest.fn(),
  },
}));
jest.mock('../../../src/services/attendee-communication.service.js');

describe('EmailMarketingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCampaign', () => {
    it('should create campaign successfully without event', async () => {
      // Arrange
      const mockCampaign = {
        id: 'campaign-1',
        organizerId: 'org-1',
        name: 'Test Campaign',
        subject: 'Test Subject',
        content: '<p>Test Content</p>',
        status: 'draft',
      };

      (prisma.emailCampaign.create as jest.Mock).mockResolvedValue(mockCampaign);

      // Act
      const result = await EmailMarketingService.createCampaign('org-1', {
        name: 'Test Campaign',
        subject: 'Test Subject',
        content: '<p>Test Content</p>',
        recipientType: 'all',
      });

      // Assert
      expect(prisma.emailCampaign.create).toHaveBeenCalledWith({
        data: {
          organizerId: 'org-1',
          eventId: undefined,
          name: 'Test Campaign',
          subject: 'Test Subject',
          content: '<p>Test Content</p>',
          plainText: undefined,
          recipientType: 'all',
          segmentId: undefined,
          tagId: undefined,
          scheduledAt: undefined,
          status: 'draft',
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
      expect(result).toEqual(mockCampaign);
    });

    it('should create campaign with scheduled status', async () => {
      // Arrange
      const scheduledDate = new Date('2026-02-01T10:00:00Z');
      const mockCampaign = {
        id: 'campaign-1',
        status: 'scheduled',
        scheduledAt: scheduledDate,
      };

      (prisma.emailCampaign.create as jest.Mock).mockResolvedValue(mockCampaign);

      // Act
      await EmailMarketingService.createCampaign('org-1', {
        name: 'Scheduled Campaign',
        subject: 'Test',
        content: 'Content',
        recipientType: 'all',
        scheduledAt: scheduledDate,
      });

      // Assert
      expect(prisma.emailCampaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'scheduled',
            scheduledAt: scheduledDate,
          }),
        }),
      );
    });

    it('should throw NotFoundError if event not found', async () => {
      // Arrange
      (prisma.event.findFirst as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        EmailMarketingService.createCampaign('org-1', {
          eventId: 'event-1',
          name: 'Test Campaign',
          subject: 'Test',
          content: 'Content',
          recipientType: 'all',
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should verify event ownership when eventId provided', async () => {
      // Arrange
      const mockEvent = { id: 'event-1', title: 'Test Event' };
      (prisma.event.findFirst as jest.Mock).mockResolvedValue(mockEvent);
      (prisma.emailCampaign.create as jest.Mock).mockResolvedValue({ id: 'campaign-1' });

      // Act
      await EmailMarketingService.createCampaign('org-1', {
        eventId: 'event-1',
        name: 'Test Campaign',
        subject: 'Test',
        content: 'Content',
        recipientType: 'event_registrations',
      });

      // Assert
      expect(prisma.event.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'event-1',
          organizerId: 'org-1',
          deletedAt: null,
        },
      });
    });

    it('should throw ValidationError if segment recipient type without segmentId', async () => {
      // Act & Assert
      await expect(
        EmailMarketingService.createCampaign('org-1', {
          name: 'Test Campaign',
          subject: 'Test',
          content: 'Content',
          recipientType: 'segment',
        }),
      ).rejects.toThrow('Segment ID is required for segment recipient type');
    });

    it('should throw ValidationError if tag recipient type without tagId', async () => {
      // Act & Assert
      await expect(
        EmailMarketingService.createCampaign('org-1', {
          name: 'Test Campaign',
          subject: 'Test',
          content: 'Content',
          recipientType: 'tag',
        }),
      ).rejects.toThrow('Tag ID is required for tag recipient type');
    });

    it('should create campaign with segment and tag IDs', async () => {
      // Arrange
      (prisma.emailCampaign.create as jest.Mock).mockResolvedValue({ id: 'campaign-1' });

      // Act
      await EmailMarketingService.createCampaign('org-1', {
        name: 'Segment Campaign',
        subject: 'Test',
        content: 'Content',
        recipientType: 'segment',
        segmentId: 'segment-1',
      });

      // Assert
      expect(prisma.emailCampaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recipientType: 'segment',
            segmentId: 'segment-1',
          }),
        }),
      );
    });
  });

  describe('getCampaigns', () => {
    it('should return paginated campaigns with default parameters', async () => {
      // Arrange
      const mockCampaigns = [
        { id: 'campaign-1', name: 'Campaign 1' },
        { id: 'campaign-2', name: 'Campaign 2' },
      ];
      (prisma.emailCampaign.findMany as jest.Mock).mockResolvedValue(mockCampaigns);
      (prisma.emailCampaign.count as jest.Mock).mockResolvedValue(2);

      // Act
      const result = await EmailMarketingService.getCampaigns('org-1');

      // Assert
      expect(prisma.emailCampaign.findMany).toHaveBeenCalledWith({
        where: { organizerId: 'org-1' },
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 0,
      });
      expect(result).toEqual({
        campaigns: mockCampaigns,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should filter by eventId', async () => {
      // Arrange
      (prisma.emailCampaign.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.emailCampaign.count as jest.Mock).mockResolvedValue(0);

      // Act
      await EmailMarketingService.getCampaigns('org-1', { eventId: 'event-1' });

      // Assert
      expect(prisma.emailCampaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizerId: 'org-1',
            eventId: 'event-1',
          },
        }),
      );
    });

    it('should filter by status', async () => {
      // Arrange
      (prisma.emailCampaign.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.emailCampaign.count as jest.Mock).mockResolvedValue(0);

      // Act
      await EmailMarketingService.getCampaigns('org-1', { status: 'sent' });

      // Assert
      expect(prisma.emailCampaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizerId: 'org-1',
            status: 'sent',
          },
        }),
      );
    });

    it('should handle custom page and limit', async () => {
      // Arrange
      (prisma.emailCampaign.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.emailCampaign.count as jest.Mock).mockResolvedValue(45);

      // Act
      const result = await EmailMarketingService.getCampaigns('org-1', {
        page: 2,
        limit: 10,
      });

      // Assert
      expect(prisma.emailCampaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 10, // (2 - 1) * 10
        }),
      );
      expect(result.totalPages).toBe(5); // 45 / 10 = 4.5, ceil = 5
    });

    it('should calculate pagination correctly', async () => {
      // Arrange
      (prisma.emailCampaign.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.emailCampaign.count as jest.Mock).mockResolvedValue(100);

      // Act
      const result = await EmailMarketingService.getCampaigns('org-1', {
        page: 3,
        limit: 20,
      });

      // Assert
      expect(result.page).toBe(3);
      expect(result.limit).toBe(20);
      expect(result.total).toBe(100);
      expect(result.totalPages).toBe(5);
    });
  });

  describe('sendCampaign', () => {
    const mockCampaign = {
      id: 'campaign-1',
      organizerId: 'org-1',
      subject: 'Test Subject',
      content: '<p>Test Content</p>',
      plainText: 'Test Content',
      status: 'draft',
      recipientType: 'all',
    };

    it('should throw NotFoundError if campaign not found', async () => {
      // Arrange
      (prisma.emailCampaign.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.emailCampaign.update as jest.Mock).mockResolvedValue({});

      // Act & Assert
      await expect(
        EmailMarketingService.sendCampaign('campaign-1', 'org-1'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if campaign already sent', async () => {
      // Arrange
      (prisma.emailCampaign.findFirst as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        status: 'sent',
      });
      (prisma.emailCampaign.update as jest.Mock).mockResolvedValue({});

      // Act & Assert
      await expect(
        EmailMarketingService.sendCampaign('campaign-1', 'org-1'),
      ).rejects.toThrow('Campaign has already been sent');
    });

    it('should send campaign to all recipients successfully', async () => {
      // Arrange
      const mockRegistrations = [
        { attendee: { email: 'user1@example.com', firstName: 'John', lastName: 'Doe' } },
        { attendee: { email: 'user2@example.com', firstName: 'Jane', lastName: 'Smith' } },
      ];

      (prisma.emailCampaign.findFirst as jest.Mock).mockResolvedValue(mockCampaign);
      (prisma.emailCampaign.update as jest.Mock).mockResolvedValue({});
      (prisma.eventRegistration.findMany as jest.Mock).mockResolvedValue(mockRegistrations);
      (emailService.sendEmail as jest.Mock).mockResolvedValue({});

      // Act
      const result = await EmailMarketingService.sendCampaign('campaign-1', 'org-1');

      // Assert
      expect(prisma.emailCampaign.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'campaign-1' },
        data: { status: 'sending' },
      });
      expect(emailService.sendEmail).toHaveBeenCalledTimes(2);
      expect(emailService.sendEmail).toHaveBeenCalledWith({
        to: 'user1@example.com',
        subject: 'Test Subject',
        html: '<p>Test Content</p>',
        text: 'Test Content',
      });
      expect(result).toEqual({
        success: true,
        sentCount: 2,
        deliveredCount: 2,
        bouncedCount: 0,
      });
    });

    it('should update campaign status to sent with stats', async () => {
      // Arrange
      const mockRegistrations = [
        { attendee: { email: 'user1@example.com', firstName: 'John', lastName: 'Doe' } },
      ];

      (prisma.emailCampaign.findFirst as jest.Mock).mockResolvedValue(mockCampaign);
      (prisma.emailCampaign.update as jest.Mock).mockResolvedValue({});
      (prisma.eventRegistration.findMany as jest.Mock).mockResolvedValue(mockRegistrations);
      (emailService.sendEmail as jest.Mock).mockResolvedValue({});

      // Act
      await EmailMarketingService.sendCampaign('campaign-1', 'org-1');

      // Assert
      expect(prisma.emailCampaign.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'campaign-1' },
        data: {
          status: 'sent',
          sentAt: expect.any(Date),
          sentCount: 1,
          deliveredCount: 1,
          bouncedCount: 0,
        },
      });
    });

    it('should handle email send failures as bounces', async () => {
      // Arrange
      const mockRegistrations = [
        { attendee: { email: 'user1@example.com', firstName: 'John', lastName: 'Doe' } },
        { attendee: { email: 'user2@example.com', firstName: 'Jane', lastName: 'Smith' } },
      ];

      (prisma.emailCampaign.findFirst as jest.Mock).mockResolvedValue(mockCampaign);
      (prisma.emailCampaign.update as jest.Mock).mockResolvedValue({});
      (prisma.eventRegistration.findMany as jest.Mock).mockResolvedValue(mockRegistrations);
      (emailService.sendEmail as jest.Mock)
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Email send failed'));

      // Act
      const result = await EmailMarketingService.sendCampaign('campaign-1', 'org-1');

      // Assert
      expect(result).toEqual({
        success: true,
        sentCount: 1,
        deliveredCount: 1,
        bouncedCount: 1,
      });
      expect(logger.error).toHaveBeenCalledWith(
        'Error sending email to user2@example.com:',
        expect.any(Error),
      );
    });

    it('should get segment recipients for segment campaigns', async () => {
      // Arrange
      const segmentCampaign = {
        ...mockCampaign,
        recipientType: 'segment',
        segmentId: 'segment-1',
      };
      const mockRecipients = [
        { email: 'user1@example.com', firstName: 'John', lastName: 'Doe' },
      ];

      (prisma.emailCampaign.findFirst as jest.Mock).mockResolvedValue(segmentCampaign);
      (prisma.emailCampaign.update as jest.Mock).mockResolvedValue({});
      (AttendeeCommunicationService.getSegmentRecipients as jest.Mock).mockResolvedValue(mockRecipients);
      (emailService.sendEmail as jest.Mock).mockResolvedValue({});

      // Act
      await EmailMarketingService.sendCampaign('campaign-1', 'org-1');

      // Assert
      expect(AttendeeCommunicationService.getSegmentRecipients).toHaveBeenCalledWith(
        'segment-1',
        'org-1',
      );
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
    });

    it('should get tag recipients for tag campaigns', async () => {
      // Arrange
      const tagCampaign = {
        ...mockCampaign,
        recipientType: 'tag',
        tagId: 'tag-1',
      };
      const mockRecipients = [
        { email: 'user1@example.com', firstName: 'John', lastName: 'Doe' },
      ];

      (prisma.emailCampaign.findFirst as jest.Mock).mockResolvedValue(tagCampaign);
      (prisma.emailCampaign.update as jest.Mock).mockResolvedValue({});
      (AttendeeCommunicationService.getTaggedUsersRecipients as jest.Mock).mockResolvedValue(mockRecipients);
      (emailService.sendEmail as jest.Mock).mockResolvedValue({});

      // Act
      await EmailMarketingService.sendCampaign('campaign-1', 'org-1');

      // Assert
      expect(AttendeeCommunicationService.getTaggedUsersRecipients).toHaveBeenCalledWith(
        'tag-1',
        'org-1',
      );
    });

    it('should get event registration recipients for event campaigns', async () => {
      // Arrange
      const eventCampaign = {
        ...mockCampaign,
        recipientType: 'event_registrations',
        eventId: 'event-1',
      };
      const mockRecipients = [
        { email: 'user1@example.com', firstName: 'John', lastName: 'Doe' },
      ];

      (prisma.emailCampaign.findFirst as jest.Mock).mockResolvedValue(eventCampaign);
      (prisma.emailCampaign.update as jest.Mock).mockResolvedValue({});
      (AttendeeCommunicationService.getEventRegistrationsRecipients as jest.Mock).mockResolvedValue(mockRecipients);
      (emailService.sendEmail as jest.Mock).mockResolvedValue({});

      // Act
      await EmailMarketingService.sendCampaign('campaign-1', 'org-1');

      // Assert
      expect(AttendeeCommunicationService.getEventRegistrationsRecipients).toHaveBeenCalledWith(
        'event-1',
        'org-1',
      );
    });

    it('should get distinct attendees for all recipients', async () => {
      // Arrange
      (prisma.emailCampaign.findFirst as jest.Mock).mockResolvedValue(mockCampaign);
      (prisma.emailCampaign.update as jest.Mock).mockResolvedValue({});
      (prisma.eventRegistration.findMany as jest.Mock).mockResolvedValue([]);
      (emailService.sendEmail as jest.Mock).mockResolvedValue({});

      // Act
      await EmailMarketingService.sendCampaign('campaign-1', 'org-1');

      // Assert
      expect(prisma.eventRegistration.findMany).toHaveBeenCalledWith({
        where: {
          event: {
            organizerId: 'org-1',
          },
          status: 'CONFIRMED',
        },
        include: {
          attendee: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        distinct: ['attendeeId'],
      });
    });

    it('should set campaign status to failed on error', async () => {
      // Arrange
      (prisma.emailCampaign.findFirst as jest.Mock).mockResolvedValue(mockCampaign);
      (prisma.emailCampaign.update as jest.Mock)
        .mockResolvedValueOnce({}) // First update for 'sending' status
        .mockRejectedValueOnce(new Error('Update failed')) // Second update will fail
        .mockResolvedValueOnce({}); // Third update for 'failed' status
      (prisma.eventRegistration.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        EmailMarketingService.sendCampaign('campaign-1', 'org-1'),
      ).rejects.toThrow('Database error');

      expect(prisma.emailCampaign.update).toHaveBeenCalledWith({
        where: { id: 'campaign-1' },
        data: { status: 'failed' },
      });
    });
  });

  describe('createAutomationRule', () => {
    it('should throw NotFoundError if campaign not found', async () => {
      // Arrange
      (prisma.emailCampaign.findFirst as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        EmailMarketingService.createAutomationRule('org-1', {
          campaignId: 'campaign-1',
          name: 'Test Rule',
          trigger: 'registration_confirmed',
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should create automation rule successfully', async () => {
      // Arrange
      const mockCampaign = { id: 'campaign-1', organizerId: 'org-1' };
      const mockRule = {
        id: 'rule-1',
        campaignId: 'campaign-1',
        name: 'Test Rule',
        trigger: 'registration_confirmed',
        delayType: 'immediate',
      };

      (prisma.emailCampaign.findFirst as jest.Mock).mockResolvedValue(mockCampaign);
      (prisma.emailAutomationRule.create as jest.Mock).mockResolvedValue(mockRule);

      // Act
      const result = await EmailMarketingService.createAutomationRule('org-1', {
        campaignId: 'campaign-1',
        name: 'Test Rule',
        trigger: 'registration_confirmed',
        delayType: 'immediate',
      });

      // Assert
      expect(prisma.emailAutomationRule.create).toHaveBeenCalledWith({
        data: {
          campaignId: 'campaign-1',
          organizerId: 'org-1',
          name: 'Test Rule',
          trigger: 'registration_confirmed',
          triggerConditions: undefined,
          delayType: 'immediate',
          delayValue: undefined,
        },
      });
      expect(result).toEqual(mockRule);
    });

    it('should create rule with delay configuration', async () => {
      // Arrange
      const mockCampaign = { id: 'campaign-1', organizerId: 'org-1' };
      (prisma.emailCampaign.findFirst as jest.Mock).mockResolvedValue(mockCampaign);
      (prisma.emailAutomationRule.create as jest.Mock).mockResolvedValue({ id: 'rule-1' });

      // Act
      await EmailMarketingService.createAutomationRule('org-1', {
        campaignId: 'campaign-1',
        name: 'Delayed Rule',
        trigger: 'event_reminder',
        delayType: 'before_event',
        delayValue: 7,
        triggerConditions: { eventType: 'conference' },
      });

      // Assert
      expect(prisma.emailAutomationRule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          delayType: 'before_event',
          delayValue: 7,
          triggerConditions: { eventType: 'conference' },
        }),
      });
    });
  });

  describe('getCampaignAnalytics', () => {
    it('should throw NotFoundError if campaign not found', async () => {
      // Arrange
      (prisma.emailCampaign.findFirst as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        EmailMarketingService.getCampaignAnalytics('campaign-1', 'org-1'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should calculate analytics rates correctly', async () => {
      // Arrange
      const mockCampaign = {
        id: 'campaign-1',
        name: 'Test Campaign',
        subject: 'Test Subject',
        status: 'sent',
        sentAt: new Date('2026-01-20T10:00:00Z'),
        sentCount: 100,
        deliveredCount: 95,
        openedCount: 50,
        clickedCount: 20,
        bouncedCount: 5,
        unsubscribedCount: 3,
      };

      (prisma.emailCampaign.findFirst as jest.Mock).mockResolvedValue(mockCampaign);

      // Act
      const result = await EmailMarketingService.getCampaignAnalytics('campaign-1', 'org-1');

      // Assert
      expect(result.campaign).toEqual({
        id: 'campaign-1',
        name: 'Test Campaign',
        subject: 'Test Subject',
        status: 'sent',
        sentAt: mockCampaign.sentAt,
      });
      expect(result.metrics).toEqual({
        sent: 100,
        delivered: 95,
        opened: 50,
        clicked: 20,
        bounced: 5,
        unsubscribed: 3,
      });
      expect(result.rates.deliveryRate).toBe(95);
      expect(result.rates.openRate).toBeCloseTo(52.63, 2);
      expect(result.rates.clickRate).toBeCloseTo(21.05, 2);
      expect(result.rates.bounceRate).toBe(5);
      expect(result.rates.unsubscribeRate).toBeCloseTo(3.16, 2);
    });

    it('should handle zero sent emails', async () => {
      // Arrange
      const mockCampaign = {
        id: 'campaign-1',
        name: 'Draft Campaign',
        subject: 'Test',
        status: 'draft',
        sentAt: null,
        sentCount: 0,
        deliveredCount: 0,
        openedCount: 0,
        clickedCount: 0,
        bouncedCount: 0,
        unsubscribedCount: 0,
      };

      (prisma.emailCampaign.findFirst as jest.Mock).mockResolvedValue(mockCampaign);

      // Act
      const result = await EmailMarketingService.getCampaignAnalytics('campaign-1', 'org-1');

      // Assert
      expect(result.rates).toEqual({
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
        unsubscribeRate: 0,
      });
    });

    it('should handle zero delivered emails', async () => {
      // Arrange
      const mockCampaign = {
        id: 'campaign-1',
        name: 'Failed Campaign',
        subject: 'Test',
        status: 'sent',
        sentAt: new Date(),
        sentCount: 10,
        deliveredCount: 0,
        openedCount: 0,
        clickedCount: 0,
        bouncedCount: 10,
        unsubscribedCount: 0,
      };

      (prisma.emailCampaign.findFirst as jest.Mock).mockResolvedValue(mockCampaign);

      // Act
      const result = await EmailMarketingService.getCampaignAnalytics('campaign-1', 'org-1');

      // Assert
      expect(result.rates.deliveryRate).toBe(0);
      expect(result.rates.bounceRate).toBe(100);
      expect(result.rates.openRate).toBe(0);
      expect(result.rates.clickRate).toBe(0);
    });
  });

  describe('trackEmailOpen', () => {
    it('should increment openedCount', async () => {
      // Arrange
      (prisma.emailCampaign.update as jest.Mock).mockResolvedValue({});

      // Act
      const result = await EmailMarketingService.trackEmailOpen('campaign-1');

      // Assert
      expect(prisma.emailCampaign.update).toHaveBeenCalledWith({
        where: { id: 'campaign-1' },
        data: {
          openedCount: {
            increment: 1,
          },
        },
      });
      expect(result).toEqual({ success: true });
    });

    it('should return success false on error', async () => {
      // Arrange
      (prisma.emailCampaign.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act
      const result = await EmailMarketingService.trackEmailOpen('campaign-1');

      // Assert
      expect(result).toEqual({ success: false });
      expect(logger.error).toHaveBeenCalledWith(
        'Error tracking email open:',
        expect.any(Error),
      );
    });
  });

  describe('trackEmailClick', () => {
    it('should increment clickedCount', async () => {
      // Arrange
      (prisma.emailCampaign.update as jest.Mock).mockResolvedValue({});

      // Act
      const result = await EmailMarketingService.trackEmailClick('campaign-1');

      // Assert
      expect(prisma.emailCampaign.update).toHaveBeenCalledWith({
        where: { id: 'campaign-1' },
        data: {
          clickedCount: {
            increment: 1,
          },
        },
      });
      expect(result).toEqual({ success: true });
    });

    it('should return success false on error', async () => {
      // Arrange
      (prisma.emailCampaign.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act
      const result = await EmailMarketingService.trackEmailClick('campaign-1');

      // Assert
      expect(result).toEqual({ success: false });
      expect(logger.error).toHaveBeenCalledWith(
        'Error tracking email click:',
        expect.any(Error),
      );
    });
  });
});
