import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

interface CreateFeedbackData {
  eventId: string;
  userId: string;
  userType: 'ATTENDEE' | 'ORGANIZER';
  npsScore: number;
  comment?: string;
  eventQuality?: number;
  platformUsability?: number;
  registrationProcess?: number;
  communicationQuality?: number;
  improvementAreas?: string[];
  wouldUseAgain?: boolean;
  wouldRecommend?: boolean;
  submittedVia?: 'EMAIL' | 'PLATFORM';
  feedbackToken?: string;
}

interface FeedbackFilters {
  page?: number;
  limit?: number;
  userType?: 'ATTENDEE' | 'ORGANIZER';
  eventId?: string;
  minNps?: number;
  maxNps?: number;
  startDate?: Date;
  endDate?: Date;
}

export class FeedbackService {
  /**
   * Create or update feedback for an event
   */
  static async createOrUpdateFeedback(data: CreateFeedbackData) {
    try {
      // Validate NPS score (0-10)
      if (data.npsScore < 0 || data.npsScore > 10) {
        throw new ValidationError('NPS score must be between 0 and 10');
      }

      // Validate category ratings (1-5)
      const categoryRatings = [
        data.eventQuality,
        data.platformUsability,
        data.registrationProcess,
        data.communicationQuality,
      ];
      for (const rating of categoryRatings) {
        if (rating !== undefined && (rating < 1 || rating > 5)) {
          throw new ValidationError('Category ratings must be between 1 and 5');
        }
      }

      // Check if event exists
      const event = await prisma.event.findUnique({
        where: { id: data.eventId },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      // Create or update feedback
      const feedback = await prisma.eventFeedback.upsert({
        where: {
          eventId_userId: {
            eventId: data.eventId,
            userId: data.userId,
          },
        },
        create: {
          eventId: data.eventId,
          userId: data.userId,
          userType: data.userType,
          npsScore: data.npsScore,
          comment: data.comment,
          eventQuality: data.eventQuality,
          platformUsability: data.platformUsability,
          registrationProcess: data.registrationProcess,
          communicationQuality: data.communicationQuality,
          improvementAreas: data.improvementAreas || [],
          wouldUseAgain: data.wouldUseAgain,
          wouldRecommend: data.wouldRecommend,
          submittedVia: data.submittedVia || 'PLATFORM',
        },
        update: {
          npsScore: data.npsScore,
          comment: data.comment,
          eventQuality: data.eventQuality,
          platformUsability: data.platformUsability,
          registrationProcess: data.registrationProcess,
          communicationQuality: data.communicationQuality,
          improvementAreas: data.improvementAreas || [],
          wouldUseAgain: data.wouldUseAgain,
          wouldRecommend: data.wouldRecommend,
          submittedVia: data.submittedVia || 'PLATFORM',
        },
        include: {
          event: {
            select: { id: true, title: true },
          },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      return feedback;
    } catch (error) {
      logger.error('Error creating/updating feedback:', error);
      throw error;
    }
  }

  /**
   * Submit feedback via email token (no authentication required)
   */
  static async submitFeedbackViaToken(
    token: string,
    data: {
      npsScore: number;
      comment?: string;
      eventQuality?: number;
      platformUsability?: number;
      registrationProcess?: number;
      communicationQuality?: number;
      improvementAreas?: string[];
      wouldUseAgain?: boolean;
      wouldRecommend?: boolean;
    },
  ) {
    try {
      // Find feedback record by token
      const existingFeedback = await prisma.eventFeedback.findUnique({
        where: { feedbackToken: token },
      });

      if (!existingFeedback) {
        throw new NotFoundError('Invalid or expired feedback token');
      }

      if (existingFeedback.tokenExpiresAt && existingFeedback.tokenExpiresAt < new Date()) {
        throw new ValidationError('Feedback token has expired');
      }

      // Validate NPS score
      if (data.npsScore < 0 || data.npsScore > 10) {
        throw new ValidationError('NPS score must be between 0 and 10');
      }

      // Update feedback
      const feedback = await prisma.eventFeedback.update({
        where: { feedbackToken: token },
        data: {
          npsScore: data.npsScore,
          comment: data.comment,
          eventQuality: data.eventQuality,
          platformUsability: data.platformUsability,
          registrationProcess: data.registrationProcess,
          communicationQuality: data.communicationQuality,
          improvementAreas: data.improvementAreas || [],
          wouldUseAgain: data.wouldUseAgain,
          wouldRecommend: data.wouldRecommend,
          submittedVia: 'EMAIL',
          feedbackToken: null, // Clear token after use
          tokenExpiresAt: null,
        },
        include: {
          event: {
            select: { id: true, title: true },
          },
        },
      });

      return feedback;
    } catch (error) {
      logger.error('Error submitting feedback via token:', error);
      throw error;
    }
  }

  /**
   * Create a feedback request (email trigger)
   * Creates a pending feedback record with a token for email-based submission
   */
  static async createFeedbackRequest(
    eventId: string,
    userId: string,
    userType: 'ATTENDEE' | 'ORGANIZER',
  ) {
    try {
      // Generate unique token
      const feedbackToken = randomBytes(32).toString('hex');
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7); // Token valid for 7 days

      // Check if feedback already exists
      const existing = await prisma.eventFeedback.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
      });

      if (existing && existing.npsScore !== null) {
        // Already submitted feedback
        return null;
      }

      // Create or update feedback request
      const feedback = await prisma.eventFeedback.upsert({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
        create: {
          eventId,
          userId,
          userType,
          npsScore: 0, // Placeholder, will be updated when submitted
          feedbackToken,
          tokenExpiresAt,
          emailSentAt: new Date(),
        },
        update: {
          feedbackToken,
          tokenExpiresAt,
          emailSentAt: new Date(),
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          event: {
            select: { id: true, title: true },
          },
        },
      });

      return { feedback, token: feedbackToken };
    } catch (error) {
      logger.error('Error creating feedback request:', error);
      throw error;
    }
  }

  /**
   * Get all feedback for admin dashboard
   */
  static async getAllFeedback(filters: FeedbackFilters = {}) {
    try {
      const limit = filters.limit || 20;
      const page = filters.page || 1;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};

      if (filters.userType) {
        where.userType = filters.userType;
      }

      if (filters.eventId) {
        where.eventId = filters.eventId;
      }

      if (filters.minNps !== undefined || filters.maxNps !== undefined) {
        where.npsScore = {};
        if (filters.minNps !== undefined) {
          (where.npsScore as Record<string, number>).gte = filters.minNps;
        }
        if (filters.maxNps !== undefined) {
          (where.npsScore as Record<string, number>).lte = filters.maxNps;
        }
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          (where.createdAt as Record<string, Date>).gte = filters.startDate;
        }
        if (filters.endDate) {
          (where.createdAt as Record<string, Date>).lte = filters.endDate;
        }
      }

      const [feedback, total] = await Promise.all([
        prisma.eventFeedback.findMany({
          where,
          include: {
            event: {
              select: { id: true, title: true, startDate: true },
            },
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.eventFeedback.count({ where }),
      ]);

      return {
        feedback,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      };
    } catch (error) {
      logger.error('Error getting feedback:', error);
      throw error;
    }
  }

  /**
   * Get feedback analytics for admin dashboard
   */
  static async getFeedbackAnalytics(filters?: { startDate?: Date; endDate?: Date; eventId?: string }) {
    try {
      const where: Record<string, unknown> = {};

      if (filters?.eventId) {
        where.eventId = filters.eventId;
      }

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters?.startDate) {
          (where.createdAt as Record<string, Date>).gte = filters.startDate;
        }
        if (filters?.endDate) {
          (where.createdAt as Record<string, Date>).lte = filters.endDate;
        }
      }

      // Get NPS stats
      const npsStats = await prisma.eventFeedback.aggregate({
        where,
        _avg: { npsScore: true },
        _count: { _all: true },
      });

      // Get NPS distribution (Promoters: 9-10, Passives: 7-8, Detractors: 0-6)
      const [promoters, passives, detractors] = await Promise.all([
        prisma.eventFeedback.count({
          where: { ...where, npsScore: { gte: 9 } },
        }),
        prisma.eventFeedback.count({
          where: { ...where, npsScore: { gte: 7, lte: 8 } },
        }),
        prisma.eventFeedback.count({
          where: { ...where, npsScore: { lte: 6 } },
        }),
      ]);

      const totalResponses = npsStats._count._all;
      const npsScore =
        totalResponses > 0
          ? Math.round(((promoters - detractors) / totalResponses) * 100)
          : 0;

      // Get category averages
      const categoryStats = await prisma.eventFeedback.aggregate({
        where,
        _avg: {
          eventQuality: true,
          platformUsability: true,
          registrationProcess: true,
          communicationQuality: true,
        },
      });

      // Get feedback by user type
      const byUserType = await prisma.eventFeedback.groupBy({
        by: ['userType'],
        where,
        _count: { _all: true },
        _avg: { npsScore: true },
      });

      // Get improvement areas distribution
      const allFeedback = await prisma.eventFeedback.findMany({
        where,
        select: { improvementAreas: true },
      });

      const improvementAreasCount: Record<string, number> = {};
      allFeedback.forEach((f) => {
        f.improvementAreas.forEach((area) => {
          improvementAreasCount[area] = (improvementAreasCount[area] || 0) + 1;
        });
      });

      // Get would use again / recommend percentages
      const wouldUseAgainCount = await prisma.eventFeedback.count({
        where: { ...where, wouldUseAgain: true },
      });
      const wouldRecommendCount = await prisma.eventFeedback.count({
        where: { ...where, wouldRecommend: true },
      });

      return {
        totalResponses,
        npsScore,
        averageNps: npsStats._avg.npsScore || 0,
        distribution: {
          promoters,
          passives,
          detractors,
        },
        categoryAverages: {
          eventQuality: categoryStats._avg.eventQuality || 0,
          platformUsability: categoryStats._avg.platformUsability || 0,
          registrationProcess: categoryStats._avg.registrationProcess || 0,
          communicationQuality: categoryStats._avg.communicationQuality || 0,
        },
        byUserType: byUserType.map((item) => ({
          userType: item.userType,
          count: item._count._all,
          averageNps: item._avg.npsScore || 0,
        })),
        improvementAreas: Object.entries(improvementAreasCount)
          .map(([area, count]) => ({ area, count }))
          .sort((a, b) => b.count - a.count),
        retention: {
          wouldUseAgain: totalResponses > 0 ? Math.round((wouldUseAgainCount / totalResponses) * 100) : 0,
          wouldRecommend: totalResponses > 0 ? Math.round((wouldRecommendCount / totalResponses) * 100) : 0,
        },
      };
    } catch (error) {
      logger.error('Error getting feedback analytics:', error);
      throw error;
    }
  }

  /**
   * Get single feedback by ID
   */
  static async getFeedbackById(feedbackId: string) {
    try {
      const feedback = await prisma.eventFeedback.findUnique({
        where: { id: feedbackId },
        include: {
          event: {
            select: { id: true, title: true, startDate: true, endDate: true },
          },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      if (!feedback) {
        throw new NotFoundError('Feedback not found');
      }

      return feedback;
    } catch (error) {
      logger.error('Error getting feedback:', error);
      throw error;
    }
  }

  /**
   * Add admin notes to feedback
   */
  static async addAdminNotes(feedbackId: string, adminId: string, notes: string) {
    try {
      const feedback = await prisma.eventFeedback.update({
        where: { id: feedbackId },
        data: {
          adminNotes: notes,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      return feedback;
    } catch (error) {
      logger.error('Error adding admin notes:', error);
      throw error;
    }
  }

  /**
   * Get feedback for a specific event
   */
  static async getEventFeedback(eventId: string, filters?: { page?: number; limit?: number }) {
    try {
      const limit = filters?.limit || 20;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const [feedback, total] = await Promise.all([
        prisma.eventFeedback.findMany({
          where: { eventId },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.eventFeedback.count({ where: { eventId } }),
      ]);

      return {
        feedback,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting event feedback:', error);
      throw error;
    }
  }
}

export { prisma };
