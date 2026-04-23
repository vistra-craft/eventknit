import { Request, Response, NextFunction } from 'express';
import { EventTemplateService } from '../services/event-template.service.js';
import { EventDraftService } from '../services/event-draft.service.js';
import { AttendeeSegmentationService } from '../services/attendee-segmentation.service.js';
import { AttendeeTagService } from '../services/attendee-tag.service.js';
import { AttendeeCommunicationService } from '../services/attendee-communication.service.js';
import { OrganizerAnalyticsService } from '../services/organizer-analytics.service.js';
import { AdvancedPromoCodeService } from '../services/advanced-promo-code.service.js';
import { OrganizerFinancialService } from '../services/organizer-financial.service.js';
import { PayoutManagementService } from '../services/payout-management.service.js';
import { EventCollaborationService } from '../services/event-collaboration.service.js';
import { AdvancedTicketTypesService } from '../services/advanced-ticket-types.service.js';
import { TicketIssuanceService } from '../services/ticket-issuance.service.js';
import { DynamicPricingService } from '../services/dynamic-pricing.service.js';
import { AffiliateProgramService } from '../services/affiliate-program.service.js';
import { EmailMarketingService } from '../services/email-marketing.service.js';
import { SocialMediaService } from '../services/social-media.service.js';
import { AdvancedTeamService } from '../services/advanced-team.service.js';
import { PermissionService } from '../services/permission.service.js';
import { KYCService } from '../services/kyc.service.js';
import { SubscriptionService } from '../services/subscription.service.js';
import { ConsentService } from '../services/consent.service.js';
import { EventSessionService } from '../services/event-session.service.js';
import { ResaleTransferAnalyticsService } from '../services/resale-transfer-analytics.service.js';
import { WorkstationService } from '../services/workstation.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const isAdminRole = (role: UserRole): boolean =>
  role === UserRole.SUPERADMIN || role === UserRole.ADMIN;

export class OrganizerDashboardController {
  // Event Templates
  static async createTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const template = await EventTemplateService.createTemplate(req.user.id, req.body);
      res.status(201).json({ success: true, data: { template } });
    } catch (error) {
      next(error);
    }
  }

  static async getTemplates(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        category: req.query.category as string | undefined,
        search: req.query.search as string | undefined,
      };

      const result = await EventTemplateService.getOrganizerTemplates(req.user.id, filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getPublicTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        category: req.query.category as string | undefined,
        search: req.query.search as string | undefined,
      };

      const result = await EventTemplateService.getPublicTemplates(filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getTemplateById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const templateId = (req.params.templateId as string) as string;
      const template = await EventTemplateService.getTemplateById(templateId, req.user?.id);
      res.status(200).json({ success: true, data: { template } });
    } catch (error) {
      next(error);
    }
  }

  static async updateTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const templateId = (req.params.templateId as string) as string;
      const template = await EventTemplateService.updateTemplate(templateId, req.user.id, req.body);
      res.status(200).json({ success: true, data: { template } });
    } catch (error) {
      next(error);
    }
  }

  static async createTemplateVersion(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const templateId = (req.params.templateId as string) as string;
      const version = await EventTemplateService.createTemplateVersion(templateId, req.user.id, req.body);
      res.status(201).json({ success: true, data: { version } });
    } catch (error) {
      next(error);
    }
  }

  static async shareTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const templateId = (req.params.templateId as string) as string;
      const template = await EventTemplateService.shareTemplate(templateId, req.user.id);
      res.status(200).json({ success: true, data: { template } });
    } catch (error) {
      next(error);
    }
  }

  static async useTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const templateId = (req.params.templateId as string) as string;
      const result = await EventTemplateService.useTemplate(templateId, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const templateId = (req.params.templateId as string) as string;
      const result = await EventTemplateService.deleteTemplate(templateId, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async createTemplateFromEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const template = await EventTemplateService.createTemplateFromEvent(eventId, req.user.id, req.body);
      res.status(201).json({ success: true, data: { template } });
    } catch (error) {
      next(error);
    }
  }

  // Event Drafts
  static async createDraft(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const draft = await EventDraftService.createDraft(req.user.id, req.body);
      res.status(201).json({ success: true, data: { draft } });
    } catch (error) {
      next(error);
    }
  }

  static async getDrafts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await EventDraftService.getOrganizerDrafts(req.user.id, filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getDraftById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const draftId = (req.params.draftId as string) as string;
      const draft = await EventDraftService.getDraftById(draftId, req.user.id);
      res.status(200).json({ success: true, data: { draft } });
    } catch (error) {
      next(error);
    }
  }

  static async updateDraft(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const draftId = (req.params.draftId as string) as string;
      const draft = await EventDraftService.updateDraft(draftId, req.user.id, req.body);
      res.status(200).json({ success: true, data: { draft } });
    } catch (error) {
      next(error);
    }
  }

  static async createDraftVersion(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const draftId = (req.params.draftId as string) as string;
      const version = await EventDraftService.createDraftVersion(draftId, req.user.id, req.body);
      res.status(201).json({ success: true, data: { version } });
    } catch (error) {
      next(error);
    }
  }

  static async scheduleDraft(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const draftId = (req.params.draftId as string) as string;
      const { scheduledPublishAt } = req.body;
      const draft = await EventDraftService.scheduleDraft(draftId, req.user.id, new Date(scheduledPublishAt));
      res.status(200).json({ success: true, data: { draft } });
    } catch (error) {
      next(error);
    }
  }

  static async publishDraft(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const draftId = (req.params.draftId as string) as string;
      const result = await EventDraftService.publishDraft(draftId, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Event Sessions
  static async createSession(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const eventId = req.params.eventId as string;
      const session = await EventSessionService.createSession(req.user.id, eventId, req.body);
      res.status(201).json({ success: true, data: { session } });
    } catch (error) {
      next(error);
    }
  }

  static async getEventSessions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const eventId = req.params.eventId as string;
      const dayOfEvent = req.query.dayOfEvent ? parseInt(req.query.dayOfEvent as string, 10) : undefined;
      const sessions = await EventSessionService.getEventSessions(req.user.id, eventId, { dayOfEvent });
      res.status(200).json({ success: true, data: { sessions } });
    } catch (error) {
      next(error);
    }
  }

  static async getSessionById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const sessionId = req.params.sessionId as string;
      const session = await EventSessionService.getSessionById(req.user.id, sessionId);
      res.status(200).json({ success: true, data: { session } });
    } catch (error) {
      next(error);
    }
  }

  static async updateSession(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const sessionId = req.params.sessionId as string;
      const session = await EventSessionService.updateSession(req.user.id, sessionId, req.body);
      res.status(200).json({ success: true, data: { session } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteSession(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const sessionId = req.params.sessionId as string;
      const result = await EventSessionService.deleteSession(req.user.id, sessionId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getEventSessionStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const eventId = req.params.eventId as string;
      const dayOfEvent = req.query.dayOfEvent ? parseInt(req.query.dayOfEvent as string, 10) : undefined;
      const stats = await EventSessionService.getEventSessionStats(req.user.id, eventId, { dayOfEvent });
      res.status(200).json({ success: true, data: { sessions: stats } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteDraft(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const draftId = (req.params.draftId as string) as string;
      const result = await EventDraftService.deleteDraft(draftId, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Attendee Segmentation
  static async createSegment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const segment = await AttendeeSegmentationService.createSegment(req.user.id, req.body);
      res.status(201).json({ success: true, data: { segment } });
    } catch (error) {
      next(error);
    }
  }

  static async getSegments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        eventId: req.query.eventId as string | undefined,
      };

      const result = await AttendeeSegmentationService.getOrganizerSegments(req.user.id, filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getSegmentById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const segmentId = (req.params.segmentId as string) as string;
      const segment = await AttendeeSegmentationService.getSegmentById(segmentId, req.user.id);
      res.status(200).json({ success: true, data: { segment } });
    } catch (error) {
      next(error);
    }
  }

  static async updateSegment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const segmentId = (req.params.segmentId as string) as string;
      const segment = await AttendeeSegmentationService.updateSegment(segmentId, req.user.id, req.body);
      res.status(200).json({ success: true, data: { segment } });
    } catch (error) {
      next(error);
    }
  }

  static async updateSegmentMembers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const segmentId = (req.params.segmentId as string) as string;
      const result = await AttendeeSegmentationService.updateSegmentMembers(segmentId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async addMemberToSegment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const segmentId = (req.params.segmentId as string) as string;
      const { userId } = req.body;
      const member = await AttendeeSegmentationService.addMemberToSegment(segmentId, req.user.id, userId);
      res.status(200).json({ success: true, data: { member } });
    } catch (error) {
      next(error);
    }
  }

  static async removeMemberFromSegment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const segmentId = (req.params.segmentId as string) as string;
      const userId = (req.params.userId as string) as string;
      const result = await AttendeeSegmentationService.removeMemberFromSegment(segmentId, req.user.id, userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async deleteSegment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const segmentId = (req.params.segmentId as string) as string;
      const result = await AttendeeSegmentationService.deleteSegment(segmentId, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Attendee Tags
  static async createTag(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const tag = await AttendeeTagService.createTag(req.user.id, req.body);
      res.status(201).json({ success: true, data: { tag } });
    } catch (error) {
      next(error);
    }
  }

  static async getTags(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const tags = await AttendeeTagService.getOrganizerTags(req.user.id);
      res.status(200).json({ success: true, data: { tags } });
    } catch (error) {
      next(error);
    }
  }

  static async getTagById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const tagId = (req.params.tagId as string) as string;
      const tag = await AttendeeTagService.getTagById(tagId, req.user.id);
      res.status(200).json({ success: true, data: { tag } });
    } catch (error) {
      next(error);
    }
  }

  static async updateTag(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const tagId = (req.params.tagId as string) as string;
      const tag = await AttendeeTagService.updateTag(tagId, req.user.id, req.body);
      res.status(200).json({ success: true, data: { tag } });
    } catch (error) {
      next(error);
    }
  }

  static async tagUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const tagId = (req.params.tagId as string) as string;
      const tag = await AttendeeTagService.tagUser(tagId, req.user.id, {
        ...req.body,
        taggedBy: req.user.id,
      });
      res.status(200).json({ success: true, data: { tag } });
    } catch (error) {
      next(error);
    }
  }

  static async untagUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const tagId = (req.params.tagId as string) as string;
      const userId = (req.params.userId as string) as string;
      const result = await AttendeeTagService.untagUser(tagId, req.user.id, userId, req.query.eventId as string | undefined);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getTaggedUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const tagId = (req.params.tagId as string) as string;
      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        eventId: req.query.eventId as string | undefined,
      };

      const result = await AttendeeTagService.getTaggedUsers(tagId, req.user.id, filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTag(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const tagId = (req.params.tagId as string) as string;
      const result = await AttendeeTagService.deleteTag(tagId, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Attendee Communication
  static async sendToSegment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const segmentId = (req.params.segmentId as string) as string;
      const result = await AttendeeCommunicationService.sendToSegment(req.user.id, segmentId, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async sendToTaggedUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const tagId = (req.params.tagId as string) as string;
      const result = await AttendeeCommunicationService.sendToTaggedUsers(req.user.id, tagId, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async sendToEventRegistrations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const result = await AttendeeCommunicationService.sendToEventRegistrations(req.user.id, eventId, req.body, req.user.role);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getCommunicationHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        eventId: req.query.eventId as string | undefined,
        segmentId: req.query.segmentId as string | undefined,
        tagId: req.query.tagId as string | undefined,
      };

      const result = await AttendeeCommunicationService.getCommunicationHistory(req.user.id, filters, req.user.role);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Analytics
  static async getEventAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const timeRange = req.query.startDate || req.query.endDate ? {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      } : undefined;

      const analytics = await OrganizerAnalyticsService.getEventAnalytics(req.user.id, eventId, timeRange);
      res.status(200).json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  }

  static async getRevenueAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        eventId: req.query.eventId as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const analytics = await OrganizerAnalyticsService.getRevenueAnalytics(req.user.id, filters);
      res.status(200).json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  }

  static async getAttendeeInsights(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const eventId = req.query.eventId as string | undefined;
      const insights = await OrganizerAnalyticsService.getAttendeeInsights(req.user.id, eventId);
      res.status(200).json({ success: true, data: insights });
    } catch (error) {
      next(error);
    }
  }

  static async getMarketingAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const eventId = req.query.eventId as string | undefined;
      const analytics = await OrganizerAnalyticsService.getMarketingAnalytics(req.user.id, eventId);
      res.status(200).json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  }

  static async getCheckoutAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        eventId: req.query.eventId as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const analytics = await OrganizerAnalyticsService.getCheckoutAnalytics(req.user.id, filters);
      res.status(200).json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  }

  static async getAbandonmentAnalysis(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const eventId = req.query.eventId as string | undefined;
      const analytics = await OrganizerAnalyticsService.getAbandonmentAnalysis(req.user.id, eventId);
      res.status(200).json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  }

  // Advanced Promo Codes
  static async createPromoCodeVariant(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const promoCodeId = (req.params.promoCodeId as string) as string;
      const variant = await AdvancedPromoCodeService.createVariant(promoCodeId, req.user.id, req.body);
      res.status(201).json({ success: true, data: { variant } });
    } catch (error) {
      next(error);
    }
  }

  static async getPromoCodeAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const promoCodeId = (req.params.promoCodeId as string) as string;
      const analytics = await AdvancedPromoCodeService.getPromoCodeAnalytics(req.user.id, promoCodeId);
      res.status(200).json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  }

  static async getOrganizerPromoCodeAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        eventId: req.query.eventId as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const analytics = await AdvancedPromoCodeService.getOrganizerPromoCodeAnalytics(req.user.id, filters);
      res.status(200).json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  }

  // Financial Management
  static async createExpense(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const expense = await OrganizerFinancialService.createExpense(req.user.id, req.body);
      res.status(201).json({ success: true, data: { expense } });
    } catch (error) {
      next(error);
    }
  }

  static async getExpenses(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        eventId: req.query.eventId as string | undefined,
        category: req.query.category as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        status: req.query.status as string | undefined,
      };

      const result = await OrganizerFinancialService.getExpenses(req.user.id, filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getProfitLossStatement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        eventId: req.query.eventId as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const statement = await OrganizerFinancialService.getProfitLossStatement(req.user.id, filters);
      res.status(200).json({ success: true, data: statement });
    } catch (error) {
      next(error);
    }
  }

  static async createFinancialGoal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const goal = await OrganizerFinancialService.createFinancialGoal(req.user.id, req.body);
      res.status(201).json({ success: true, data: { goal } });
    } catch (error) {
      next(error);
    }
  }

  static async getFinancialGoals(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        eventId: req.query.eventId as string | undefined,
        status: req.query.status as string | undefined,
      };

      const goals = await OrganizerFinancialService.getFinancialGoals(req.user.id, filters);
      res.status(200).json({ success: true, data: { goals } });
    } catch (error) {
      next(error);
    }
  }

  static async getTaxSummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        eventId: req.query.eventId as string | undefined,
        year: req.query.year ? parseInt(req.query.year as string, 10) : undefined,
      };

      const summary = await OrganizerFinancialService.getTaxSummary(req.user.id, filters);
      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  // Payout Management
  static async getPayoutPreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const preferences = await PayoutManagementService.getPayoutPreferences(req.user.id);
      res.status(200).json({ success: true, data: { preferences } });
    } catch (error) {
      next(error);
    }
  }

  static async updatePayoutPreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const preferences = await PayoutManagementService.updatePayoutPreferences(req.user.id, req.body);
      res.status(200).json({ success: true, data: { preferences } });
    } catch (error) {
      next(error);
    }
  }

  static async getPayoutHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        status: req.query.status as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const result = await PayoutManagementService.getPayoutHistory(req.user.id, filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async schedulePayout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const disbursement = await PayoutManagementService.schedulePayout(req.user.id, req.body);
      res.status(201).json({ success: true, data: { disbursement } });
    } catch (error) {
      next(error);
    }
  }

  static async getPayoutSummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const summary = await PayoutManagementService.getPayoutSummary(req.user.id);
      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  // Resale & Transfer Analytics
  static async getEventResaleStats(req: AuthenticatedRequest<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const { eventId } = req.params;
      const admin = isAdminRole(req.user.role);
      const stats = await ResaleTransferAnalyticsService.getEventResaleStats(eventId, req.user.id, admin);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  static async getEventResaleListings(req: AuthenticatedRequest<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const { eventId } = req.params;
      const { status, page, limit } = req.query;
      const filters = {
        status: typeof status === 'string' ? status : undefined,
        page: typeof page === 'string' ? parseInt(page, 10) : undefined,
        limit: typeof limit === 'string' ? parseInt(limit, 10) : undefined,
      };
      const admin = isAdminRole(req.user.role);
      const result = await ResaleTransferAnalyticsService.getEventResaleListings(eventId, req.user.id, filters, admin);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getEventTransferStats(req: AuthenticatedRequest<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const { eventId } = req.params;
      const admin = isAdminRole(req.user.role);
      const stats = await ResaleTransferAnalyticsService.getEventTransferStats(eventId, req.user.id, admin);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  static async getEventTransferHistory(req: AuthenticatedRequest<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const { eventId } = req.params;
      const { status, page, limit } = req.query;
      const filters = {
        status: typeof status === 'string' ? status : undefined,
        page: typeof page === 'string' ? parseInt(page, 10) : undefined,
        limit: typeof limit === 'string' ? parseInt(limit, 10) : undefined,
      };
      const admin = isAdminRole(req.user.role);
      const result = await ResaleTransferAnalyticsService.getEventTransferHistory(eventId, req.user.id, filters, admin);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Scan & Check-In Analytics
  static async getEventScanOverview(req: AuthenticatedRequest<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const { eventId } = req.params;
      const admin = isAdminRole(req.user.role);
      const data = await WorkstationService.getOrganizerEventScanOverview(eventId, req.user.id, admin);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getEventScanHistory(req: AuthenticatedRequest<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const { eventId } = req.params;
      const { scanType, page, limit } = req.query;
      const admin = isAdminRole(req.user.role);
      const data = await WorkstationService.getOrganizerEventScans(eventId, req.user.id, {
        scanType: typeof scanType === 'string' ? scanType : undefined,
        page: typeof page === 'string' ? parseInt(page, 10) : undefined,
        limit: typeof limit === 'string' ? parseInt(limit, 10) : undefined,
      }, admin);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getEventScanAttendees(req: AuthenticatedRequest<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const { eventId } = req.params;
      const { page, limit } = req.query;
      const admin = isAdminRole(req.user.role);
      const data = await WorkstationService.getOrganizerEventAttendees(eventId, req.user.id, {
        page: typeof page === 'string' ? parseInt(page, 10) : undefined,
        limit: typeof limit === 'string' ? parseInt(limit, 10) : undefined,
      }, admin);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async updateEventScanConfig(req: AuthenticatedRequest<{ eventId: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const { eventId } = req.params;
      const { allowReEntry, requireCheckOut, maxReEntries } = req.body;
      const admin = isAdminRole(req.user.role);
      const config = await WorkstationService.updateOrganizerEventScanConfig(eventId, req.user.id, {
        allowReEntry,
        requireCheckOut,
        maxReEntries,
      }, admin);
      res.status(200).json({ success: true, data: { config } });
    } catch (error) {
      next(error);
    }
  }

  // Event Collaboration
  static async inviteCollaborator(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const collaborator = await EventCollaborationService.inviteCollaborator(eventId, req.user.id, req.body);
      res.status(201).json({ success: true, data: { collaborator } });
    } catch (error) {
      next(error);
    }
  }

  static async acceptInvitation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const collaborationId = (req.params.collaborationId as string) as string;
      const collaboration = await EventCollaborationService.acceptInvitation(collaborationId, req.user.id);
      res.status(200).json({ success: true, data: { collaboration } });
    } catch (error) {
      next(error);
    }
  }

  static async getEventCollaborators(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const collaborators = await EventCollaborationService.getEventCollaborators(eventId, req.user.id);
      res.status(200).json({ success: true, data: { collaborators } });
    } catch (error) {
      next(error);
    }
  }

  static async updateCollaboratorPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const collaborationId = (req.params.collaborationId as string) as string;
      const collaboration = await EventCollaborationService.updateCollaboratorPermissions(
        collaborationId,
        req.user.id,
        req.body,
      );
      res.status(200).json({ success: true, data: { collaboration } });
    } catch (error) {
      next(error);
    }
  }

  static async removeCollaborator(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const collaborationId = (req.params.collaborationId as string) as string;
      const result = await EventCollaborationService.removeCollaborator(collaborationId, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getEventActivityLog(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        action: req.query.action as string | undefined,
        userId: req.query.userId as string | undefined,
      };

      const result = await EventCollaborationService.getEventActivityLog(eventId, req.user.id, filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Phase 3: Advanced Ticket Types
  static async createTicketPackage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const package_ = await AdvancedTicketTypesService.createTicketPackage(req.user.id, req.body);
      res.status(201).json({ success: true, data: { package: package_ } });
    } catch (error) {
      next(error);
    }
  }

  static async getEventTicketPackages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const filters = {
        type: req.query.type as string | undefined,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      };

      const admin = isAdminRole(req.user.role);
      const packages = await AdvancedTicketTypesService.getEventTicketPackages(req.user.id, eventId, filters, admin);
      res.status(200).json({ success: true, data: { packages } });
    } catch (error) {
      next(error);
    }
  }

  static async updateTicketPackage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const packageId = (req.params.packageId as string) as string;
      const updated = await AdvancedTicketTypesService.updateTicketPackage(packageId, req.user.id, req.body);
      res.status(200).json({ success: true, data: { package: updated } });
    } catch (error) {
      next(error);
    }
  }

  static async getReservedSeating(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const seating = await AdvancedTicketTypesService.getReservedSeating(eventId, req.user.id);
      res.status(200).json({ success: true, data: { seating } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTicketPackage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const packageId = (req.params.packageId as string) as string;
      const result = await AdvancedTicketTypesService.deleteTicketPackage(packageId, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Complementary ticket issuances
  static async issueComplementaryTickets(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }
      const { packageId } = req.params as { packageId: string };
      const { emails, quantity, note, expiresAt } = req.body as {
        emails: string[];
        quantity?: number;
        note?: string;
        expiresAt?: string;
      };
      const issuances = await TicketIssuanceService.issue(
        packageId,
        req.user.id,
        emails,
        quantity ?? 1,
        note,
        expiresAt ? new Date(expiresAt) : undefined,
      );
      res.status(201).json({ success: true, data: { issuances } });
    } catch (error) {
      next(error);
    }
  }

  static async getPackageIssuances(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }
      const { packageId } = req.params as { packageId: string };
      const issuances = await TicketIssuanceService.listForPackage(packageId, req.user.id);
      res.status(200).json({ success: true, data: { issuances } });
    } catch (error) {
      next(error);
    }
  }

  static async cancelIssuance(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }
      const { issuanceId } = req.params as { issuanceId: string };
      const issuance = await TicketIssuanceService.cancel(issuanceId, req.user.id);
      res.status(200).json({ success: true, data: { issuance } });
    } catch (error) {
      next(error);
    }
  }

  // Phase 3: Dynamic Pricing
  static async createPricingRule(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const rule = await DynamicPricingService.createPricingRule(req.user.id, req.body);
      res.status(201).json({ success: true, data: { rule } });
    } catch (error) {
      next(error);
    }
  }

  static async getEventPricingRules(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const filters = {
        type: req.query.type as string | undefined,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      };

      const rules = await DynamicPricingService.getEventPricingRules(req.user.id, eventId, filters);
      res.status(200).json({ success: true, data: { rules } });
    } catch (error) {
      next(error);
    }
  }

  static async calculateDynamicPrice(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const { ticketType, quantity } = req.query;

      const result = await DynamicPricingService.calculateDynamicPrice(
        eventId,
        ticketType as string,
        parseInt(quantity as string, 10) || 1,
        req.user.id,
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async updatePricingRule(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const ruleId = (req.params.ruleId as string) as string;
      const updated = await DynamicPricingService.updatePricingRule(ruleId, req.user.id, req.body);
      res.status(200).json({ success: true, data: { rule: updated } });
    } catch (error) {
      next(error);
    }
  }

  static async deletePricingRule(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const ruleId = (req.params.ruleId as string) as string;
      const result = await DynamicPricingService.deletePricingRule(ruleId, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Phase 3: Affiliate Program
  static async createAffiliateProgram(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const program = await AffiliateProgramService.createProgram(req.user.id, req.body);
      res.status(201).json({ success: true, data: { program } });
    } catch (error) {
      next(error);
    }
  }

  static async getAffiliatePrograms(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        eventId: req.query.eventId as string | undefined,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      };

      const programs = await AffiliateProgramService.getOrganizerPrograms(req.user.id, filters);
      res.status(200).json({ success: true, data: { programs } });
    } catch (error) {
      next(error);
    }
  }

  static async applyAsAffiliate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const programId = (req.params.programId as string) as string;
      const affiliate = await AffiliateProgramService.applyAsAffiliate(programId, req.user.id);
      res.status(201).json({ success: true, data: { affiliate } });
    } catch (error) {
      next(error);
    }
  }

  static async getAffiliateDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const affiliateId = (req.params.affiliateId as string) as string;
      const dashboard = await AffiliateProgramService.getAffiliateDashboard(affiliateId, req.user.id);
      res.status(200).json({ success: true, data: dashboard });
    } catch (error) {
      next(error);
    }
  }

  static async getAffiliateConversions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const affiliateId = (req.params.affiliateId as string) as string;
      const filters = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        status: req.query.status as string | undefined,
      };

      const result = await AffiliateProgramService.getAffiliateConversions(affiliateId, req.user.id, filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Phase 3: Email Marketing
  static async createEmailCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const campaign = await EmailMarketingService.createCampaign(req.user.id, req.body);
      res.status(201).json({ success: true, data: { campaign } });
    } catch (error) {
      next(error);
    }
  }

  static async getEmailCampaigns(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        eventId: req.query.eventId as string | undefined,
        status: req.query.status as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await EmailMarketingService.getCampaigns(req.user.id, filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async sendEmailCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const campaignId = (req.params.campaignId as string) as string;
      const result = await EmailMarketingService.sendCampaign(campaignId, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getCampaignAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const campaignId = (req.params.campaignId as string) as string;
      const analytics = await EmailMarketingService.getCampaignAnalytics(campaignId, req.user.id);
      res.status(200).json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  }

  // Phase 3: Social Media
  static async createSocialPost(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const post = await SocialMediaService.createPost(req.user.id, req.body);
      res.status(201).json({ success: true, data: { post } });
    } catch (error) {
      next(error);
    }
  }

  static async getSocialPosts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        eventId: req.query.eventId as string | undefined,
        platform: req.query.platform as string | undefined,
        status: req.query.status as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await SocialMediaService.getPosts(req.user.id, filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async publishSocialPost(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const postId = (req.params.postId as string) as string;
      const post = await SocialMediaService.publishPost(postId, req.user.id);
      res.status(200).json({ success: true, data: { post } });
    } catch (error) {
      next(error);
    }
  }

  static async getSocialMediaAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        eventId: req.query.eventId as string | undefined,
        platform: req.query.platform as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const analytics = await SocialMediaService.getSocialMediaAnalytics(req.user.id, filters);
      res.status(200).json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  }

  // Phase 3: Advanced Team Features
  static async createRoleTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const template = await AdvancedTeamService.createRoleTemplate(req.user.id, req.body);
      res.status(201).json({ success: true, data: { template } });
    } catch (error) {
      next(error);
    }
  }

  static async getRoleTemplates(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      };

      const templates = await AdvancedTeamService.getRoleTemplates(req.user.id, filters);
      res.status(200).json({ success: true, data: { templates } });
    } catch (error) {
      next(error);
    }
  }

  static async getRoleTemplateById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const template = await AdvancedTeamService.getRoleTemplateById((req.params.id as string), req.user.id);
      res.status(200).json({ success: true, data: { template } });
    } catch (error) {
      next(error);
    }
  }

  static async updateRoleTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const template = await AdvancedTeamService.updateRoleTemplate((req.params.id as string), req.user.id, req.body);
      res.status(200).json({ success: true, data: { template } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteRoleTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      await AdvancedTeamService.deleteRoleTemplate((req.params.id as string), req.user.id);
      res.status(200).json({ success: true, message: 'Role template deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async duplicateRoleTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const template = await AdvancedTeamService.duplicateRoleTemplate(
        (req.params.id as string),
        req.user.id,
        req.body.name,
      );
      res.status(201).json({ success: true, data: { template } });
    } catch (error) {
      next(error);
    }
  }

  static async getTeamActivityFeed(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        eventId: req.query.eventId as string | undefined,
        userId: req.query.userId as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await AdvancedTeamService.getTeamActivityFeed(req.user.id, filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getTeamPerformanceMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const filters = {
        userId: req.query.userId as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const metrics = await AdvancedTeamService.getTeamPerformanceMetrics(req.user.id, filters);
      res.status(200).json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all permissions
   */
  static async getPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const category = req.query.category as string | undefined;
      const permissions = await PermissionService.getAllPermissions(category);
      res.status(200).json({ success: true, data: { permissions } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get permissions grouped by category
   */
  static async getPermissionsByCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const permissions = await PermissionService.getPermissionsByCategory();
      res.status(200).json({ success: true, data: { permissions } });
    } catch (error) {
      next(error);
    }
  }

  // ========== KYC / Entity Type Verification ==========

  /**
   * Set organizer entity type
   */
  static async setEntityType(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const result = await KYCService.setEntityType(req.user.id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get KYC requirements for current user
   */
  static async getKYCRequirements(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const requirements = await KYCService.getKYCRequirements(req.user.id);
      res.status(200).json({ success: true, data: requirements });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all KYC documents with requirements status
   */
  static async getKYCDocuments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const result = await KYCService.getUserKYCDocuments(req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create/upload a KYC document
   */
  static async createKYCDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const document = await KYCService.createKYCDocument(req.user.id, {
        ...req.body,
        issueDate: req.body.issueDate ? new Date(req.body.issueDate) : undefined,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
      });
      res.status(201).json({ success: true, data: { document } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a KYC document
   */
  static async updateKYCDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const documentId = (req.params.documentId as string) as string;
      const document = await KYCService.updateKYCDocument(documentId, req.user.id, {
        ...req.body,
        issueDate: req.body.issueDate ? new Date(req.body.issueDate) : undefined,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
      });
      res.status(200).json({ success: true, data: { document } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a KYC document
   */
  static async deleteKYCDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const documentId = (req.params.documentId as string) as string;
      await KYCService.deleteKYCDocument(documentId, req.user.id);
      res.status(200).json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit KYC for review
   */
  static async submitKYCForReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const result = await KYCService.submitKYCForReview(req.user.id);
      res.status(200).json({ success: true, message: result.message, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get directors/shareholders
   */
  static async getDirectors(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const directors = await KYCService.getDirectors(req.user.id);
      res.status(200).json({ success: true, data: { directors } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create/add a director/shareholder
   */
  static async createDirector(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const director = await KYCService.createDirector(req.user.id, {
        ...req.body,
        dateOfBirth: new Date(req.body.dateOfBirth),
      });
      res.status(201).json({ success: true, data: { director } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a director/shareholder
   */
  static async deleteDirector(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const directorId = (req.params.directorId as string) as string;
      await KYCService.deleteDirector(directorId, req.user.id);
      res.status(200).json({ success: true, message: 'Director deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // ========== Subscription Management ==========

  /**
   * Get subscription plans (for organizer pricing/upgrade page)
   */
  static async getSubscriptionPlans(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await SubscriptionService.getActivePlans();
      res.status(200).json({ success: true, data: { plans } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get organizer subscription
   */
  static async getSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const subscription = await SubscriptionService.getSubscription(req.user.id);
      res.status(200).json({ success: true, data: { subscription } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upgrade subscription tier
   */
  static async upgradeSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { tier, billingEmail } = req.body;
      const subscription = await SubscriptionService.upgradeSubscription(
        req.user.id,
        tier,
        billingEmail,
      );
      res.status(200).json({ success: true, data: { subscription } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel Premium subscription
   */
  static async cancelSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const subscription = await SubscriptionService.cancelSubscription(req.user.id);
      res.status(200).json({ success: true, message: 'Subscription canceled successfully', data: { subscription } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Initialize subscription payment (Paystack)
   */
  static async initializeSubscriptionPayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { tier, billingEmail } = req.body;
      const result = await SubscriptionService.initializeSubscriptionPayment(
        req.user.id,
        tier,
        billingEmail,
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify subscription payment (frontend callback)
   */
  static async verifySubscriptionPayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { reference } = req.query;
      if (!reference || typeof reference !== 'string') {
        res.status(400).json({ success: false, message: 'Payment reference is required' });
        return;
      }

      const result = await SubscriptionService.verifySubscriptionPayment(reference);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // ========== My Permissions ==========

  /**
   * Get the current user's effective permissions
   */
  static async getMyPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const permissions = await PermissionService.getUserEffectivePermissions(req.user.id);
      res.status(200).json({ success: true, data: { permissions } });
    } catch (error) {
      next(error);
    }
  }

  // ========== Consent Management ==========

  /**
   * Get consent statistics for an event
   */
  static async getEventConsentStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const stats = await ConsentService.getEventConsentStats(eventId, req.user.id);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

