/**
 * Survey Service
 *
 * Business logic for the post-event survey system.
 * Organizers/admins create surveys per event; attendees submit responses.
 *
 * Capabilities:
 * - Create / update / delete survey for an event
 * - Submit attendee response (one per attendee per survey)
 * - Aggregate results for organizer analytics
 * - Admin access to all survey data for managed events
 */

import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { Prisma } from '@prisma/client';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} from '../utils/errors.js';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface CustomQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'text' | 'rating';
  options?: string[]; // For multiple_choice
}

export interface CreateSurveyData {
  eventId: string;
  title?: string;
  description?: string;
  includeNps?: boolean;
  includeVenueRating?: boolean;
  includeSpeakerRating?: boolean;
  includeContentRating?: boolean;
  includeOrgRating?: boolean;
  includeValueRating?: boolean;
  customQuestions?: CustomQuestion[];
  triggerAfterHours?: number;
}

export interface UpdateSurveyData {
  title?: string;
  description?: string;
  includeNps?: boolean;
  includeVenueRating?: boolean;
  includeSpeakerRating?: boolean;
  includeContentRating?: boolean;
  includeOrgRating?: boolean;
  includeValueRating?: boolean;
  customQuestions?: CustomQuestion[];
  triggerAfterHours?: number;
  isActive?: boolean;
}

export interface SubmitResponseData {
  surveyId: string;
  eventId: string;
  registrationId?: string;
  overallRating: number;
  npsScore?: number;
  venueRating?: number;
  speakerRating?: number;
  contentRating?: number;
  orgRating?: number;
  valueRating?: number;
  customAnswers?: Record<string, unknown>;
  comment?: string;
}

// ─── Service ────────────────────────────────────────────────────────────────────

export class SurveyService {
  /**
   * Create a survey for an event.
   * Only the event organizer or an admin (for managed events) can create.
   */
  static async createSurvey(
    createdById: string,
    data: CreateSurveyData,
  ) {
    // Validate event exists
    const event = await prisma.event.findUnique({
      where: { id: data.eventId, deletedAt: null },
      select: { id: true, organizerId: true, isManaged: true, managedByAdminId: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Verify caller owns the event or is admin for managed events
    if (event.organizerId !== createdById && !(event.isManaged && event.managedByAdminId === createdById)) {
      // Check if user is a platform admin
      const user = await prisma.user.findUnique({ where: { id: createdById }, select: { role: true } });
      if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
        throw new AuthorizationError('You do not have permission to create a survey for this event');
      }
    }

    // Validate custom questions (max 5)
    if (data.customQuestions && data.customQuestions.length > 5) {
      throw new ValidationError('Maximum 5 custom questions allowed');
    }

    if (data.customQuestions) {
      for (const q of data.customQuestions) {
        if (!q.id || !q.question || !q.type) {
          throw new ValidationError('Each custom question must have id, question, and type');
        }
        if (q.type === 'multiple_choice' && (!q.options || q.options.length < 2)) {
          throw new ValidationError('Multiple choice questions must have at least 2 options');
        }
      }
    }

    // Check if survey already exists for this event
    const existing = await prisma.eventSurvey.findUnique({
      where: { eventId: data.eventId },
    });

    if (existing) {
      throw new ValidationError('A survey already exists for this event. Use update instead.');
    }

    const survey = await prisma.eventSurvey.create({
      data: {
        eventId: data.eventId,
        createdById,
        title: data.title ?? 'Event Feedback Survey',
        description: data.description,
        includeNps: data.includeNps ?? false,
        includeVenueRating: data.includeVenueRating ?? false,
        includeSpeakerRating: data.includeSpeakerRating ?? false,
        includeContentRating: data.includeContentRating ?? false,
        includeOrgRating: data.includeOrgRating ?? false,
        includeValueRating: data.includeValueRating ?? false,
        customQuestions: (data.customQuestions ?? []) as unknown as Prisma.InputJsonValue,
        triggerAfterHours: data.triggerAfterHours ?? 24,
      },
    });

    logger.info('Survey created', { surveyId: survey.id, eventId: data.eventId });
    return survey;
  }

  /**
   * Update an existing survey.
   */
  static async updateSurvey(
    surveyId: string,
    userId: string,
    data: UpdateSurveyData,
  ) {
    const survey = await prisma.eventSurvey.findUnique({
      where: { id: surveyId },
      include: {
        event: { select: { organizerId: true, isManaged: true, managedByAdminId: true } },
      },
    });

    if (!survey) {
      throw new NotFoundError('Survey not found');
    }

    // Verify caller owns the event or is admin
    if (survey.event.organizerId !== userId && !(survey.event.isManaged && survey.event.managedByAdminId === userId)) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
        throw new AuthorizationError('You do not have permission to update this survey');
      }
    }

    // Validate custom questions (max 5)
    if (data.customQuestions && data.customQuestions.length > 5) {
      throw new ValidationError('Maximum 5 custom questions allowed');
    }

    const updated = await prisma.eventSurvey.update({
      where: { id: surveyId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.includeNps !== undefined && { includeNps: data.includeNps }),
        ...(data.includeVenueRating !== undefined && { includeVenueRating: data.includeVenueRating }),
        ...(data.includeSpeakerRating !== undefined && { includeSpeakerRating: data.includeSpeakerRating }),
        ...(data.includeContentRating !== undefined && { includeContentRating: data.includeContentRating }),
        ...(data.includeOrgRating !== undefined && { includeOrgRating: data.includeOrgRating }),
        ...(data.includeValueRating !== undefined && { includeValueRating: data.includeValueRating }),
        ...(data.customQuestions !== undefined && { customQuestions: data.customQuestions as unknown as Prisma.InputJsonValue }),
        ...(data.triggerAfterHours !== undefined && { triggerAfterHours: data.triggerAfterHours }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    logger.info('Survey updated', { surveyId });
    return updated;
  }

  /**
   * Get survey for an event (public — attendees need this to render the form).
   */
  static async getSurveyByEventId(eventId: string) {
    const survey = await prisma.eventSurvey.findUnique({
      where: { eventId, isActive: true },
    });

    if (!survey) {
      throw new NotFoundError('No active survey found for this event');
    }

    return survey;
  }

  /**
   * Get survey with full details for organizer/admin (includes response count).
   */
  static async getSurveyForOrganizer(eventId: string) {
    const survey = await prisma.eventSurvey.findUnique({
      where: { eventId },
      include: {
        _count: { select: { responses: true } },
      },
    });

    if (!survey) {
      throw new NotFoundError('No survey found for this event');
    }

    return survey;
  }

  /**
   * Delete a survey. Only allowed if no responses have been submitted.
   */
  static async deleteSurvey(surveyId: string, userId: string) {
    const survey = await prisma.eventSurvey.findUnique({
      where: { id: surveyId },
      include: {
        event: { select: { organizerId: true, isManaged: true, managedByAdminId: true } },
        _count: { select: { responses: true } },
      },
    });

    if (!survey) {
      throw new NotFoundError('Survey not found');
    }

    // Verify caller owns the event or is admin
    if (survey.event.organizerId !== userId && !(survey.event.isManaged && survey.event.managedByAdminId === userId)) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN')) {
        throw new AuthorizationError('You do not have permission to delete this survey');
      }
    }

    if (survey._count.responses > 0) {
      throw new ValidationError(
        `Cannot delete survey with ${survey._count.responses} response(s). Deactivate it instead.`,
      );
    }

    await prisma.eventSurvey.delete({ where: { id: surveyId } });
    logger.info('Survey deleted', { surveyId });
  }

  // ─── Responses ──────────────────────────────────────────────────────────────

  /**
   * Submit a survey response. One response per attendee per survey.
   */
  static async submitResponse(
    attendeeId: string,
    data: SubmitResponseData,
  ) {
    // Validate survey exists and is active
    const survey = await prisma.eventSurvey.findUnique({
      where: { id: data.surveyId },
    });

    if (!survey) {
      throw new NotFoundError('Survey not found');
    }

    if (!survey.isActive) {
      throw new ValidationError('This survey is no longer accepting responses');
    }

    // Validate overall rating (required, 1-5)
    if (data.overallRating < 1 || data.overallRating > 5) {
      throw new ValidationError('Overall rating must be between 1 and 5');
    }

    // Validate NPS score if included (0-10)
    if (survey.includeNps && data.npsScore !== undefined) {
      if (data.npsScore < 0 || data.npsScore > 10) {
        throw new ValidationError('NPS score must be between 0 and 10');
      }
    }

    // Validate category ratings (1-5) if included
    const categoryChecks: Array<{ field: string; value?: number; included: boolean }> = [
      { field: 'venueRating', value: data.venueRating, included: survey.includeVenueRating },
      { field: 'speakerRating', value: data.speakerRating, included: survey.includeSpeakerRating },
      { field: 'contentRating', value: data.contentRating, included: survey.includeContentRating },
      { field: 'orgRating', value: data.orgRating, included: survey.includeOrgRating },
      { field: 'valueRating', value: data.valueRating, included: survey.includeValueRating },
    ];

    for (const check of categoryChecks) {
      if (check.included && check.value !== undefined) {
        if (check.value < 1 || check.value > 5) {
          throw new ValidationError(`${check.field} must be between 1 and 5`);
        }
      }
    }

    // Verify attendee was registered for this event
    const registration = await prisma.eventRegistration.findFirst({
      where: {
        eventId: data.eventId,
        attendeeId,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      select: { id: true },
    });

    if (!registration) {
      throw new AuthorizationError('You must be registered for this event to submit feedback');
    }

    // Create or update response (upsert to handle re-submissions)
    const response = await prisma.surveyResponse.upsert({
      where: {
        surveyId_attendeeId: {
          surveyId: data.surveyId,
          attendeeId,
        },
      },
      create: {
        surveyId: data.surveyId,
        eventId: data.eventId,
        attendeeId,
        registrationId: registration.id,
        overallRating: data.overallRating,
        npsScore: data.npsScore,
        venueRating: data.venueRating,
        speakerRating: data.speakerRating,
        contentRating: data.contentRating,
        orgRating: data.orgRating,
        valueRating: data.valueRating,
        customAnswers: (data.customAnswers ?? {}) as Prisma.InputJsonValue,
        comment: data.comment,
      },
      update: {
        overallRating: data.overallRating,
        npsScore: data.npsScore,
        venueRating: data.venueRating,
        speakerRating: data.speakerRating,
        contentRating: data.contentRating,
        orgRating: data.orgRating,
        valueRating: data.valueRating,
        customAnswers: (data.customAnswers ?? {}) as Prisma.InputJsonValue,
        comment: data.comment,
      },
    });

    logger.info('Survey response submitted', {
      surveyId: data.surveyId,
      attendeeId,
      overallRating: data.overallRating,
    });

    return response;
  }

  /**
   * Check if an attendee has already responded to a survey.
   */
  static async hasResponded(surveyId: string, attendeeId: string): Promise<boolean> {
    const response = await prisma.surveyResponse.findUnique({
      where: {
        surveyId_attendeeId: { surveyId, attendeeId },
      },
      select: { id: true },
    });
    return !!response;
  }

  // ─── Analytics ──────────────────────────────────────────────────────────────

  /**
   * Get aggregated survey results for organizer/admin dashboard.
   */
  static async getSurveyResults(eventId: string) {
    const survey = await prisma.eventSurvey.findUnique({
      where: { eventId },
      include: {
        _count: { select: { responses: true } },
      },
    });

    if (!survey) {
      throw new NotFoundError('No survey found for this event');
    }

    const responses = await prisma.surveyResponse.findMany({
      where: { surveyId: survey.id },
      select: {
        overallRating: true,
        npsScore: true,
        venueRating: true,
        speakerRating: true,
        contentRating: true,
        orgRating: true,
        valueRating: true,
        customAnswers: true,
        comment: true,
        submittedAt: true,
        attendee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Calculate averages
    const totalResponses = responses.length;
    if (totalResponses === 0) {
      return {
        survey,
        totalResponses: 0,
        averages: {},
        npsBreakdown: null,
        responses: [],
      };
    }

    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const avg = (arr: number[]) => arr.length > 0 ? Number((sum(arr) / arr.length).toFixed(1)) : null;

    const overallRatings = responses.map(r => r.overallRating);
    const npsScores = responses.map(r => r.npsScore).filter((v): v is number => v !== null && v !== undefined);
    const venueRatings = responses.map(r => r.venueRating).filter((v): v is number => v !== null && v !== undefined);
    const speakerRatings = responses.map(r => r.speakerRating).filter((v): v is number => v !== null && v !== undefined);
    const contentRatings = responses.map(r => r.contentRating).filter((v): v is number => v !== null && v !== undefined);
    const orgRatings = responses.map(r => r.orgRating).filter((v): v is number => v !== null && v !== undefined);
    const valueRatings = responses.map(r => r.valueRating).filter((v): v is number => v !== null && v !== undefined);

    // NPS breakdown: promoters (9-10), passives (7-8), detractors (0-6)
    let npsBreakdown = null;
    if (npsScores.length > 0) {
      const promoters = npsScores.filter(s => s >= 9).length;
      const detractors = npsScores.filter(s => s <= 6).length;
      const npsValue = Math.round(((promoters - detractors) / npsScores.length) * 100);
      npsBreakdown = {
        score: npsValue,
        promoters,
        passives: npsScores.filter(s => s >= 7 && s <= 8).length,
        detractors,
        total: npsScores.length,
      };
    }

    return {
      survey,
      totalResponses,
      averages: {
        overall: avg(overallRatings),
        nps: avg(npsScores),
        venue: avg(venueRatings),
        speakers: avg(speakerRatings),
        content: avg(contentRatings),
        organization: avg(orgRatings),
        value: avg(valueRatings),
      },
      npsBreakdown,
      responses,
    };
  }

  /**
   * Get all survey results across events (admin-only, for platform overview).
   */
  static async getAllSurveyResults(filters: {
    page?: number;
    limit?: number;
    eventId?: string;
  } = {}) {
    const { page = 1, limit = 20, eventId } = filters;
    const skip = (page - 1) * limit;

    const where = eventId ? { eventId } : {};

    const [surveys, total] = await Promise.all([
      prisma.eventSurvey.findMany({
        where,
        include: {
          event: { select: { id: true, title: true, startDate: true } },
          _count: { select: { responses: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.eventSurvey.count({ where }),
    ]);

    return { surveys, total, page, limit };
  }
}
