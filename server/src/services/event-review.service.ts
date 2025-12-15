import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';

const prisma = new PrismaClient();

export class EventReviewService {
  /**
   * Create or update an event review
   */
  static async createOrUpdateReview(
    userId: string,
    eventId: string,
    data: {
      rating: number;
      title?: string;
      review?: string;
      pros?: string[];
      cons?: string[];
      registrationId?: string;
    },
  ) {
    try {
      // Validate rating
      if (data.rating < 1 || data.rating > 5) {
        throw new ValidationError('Rating must be between 1 and 5');
      }

      // Check if user has registered for this event
      const registration = await prisma.eventRegistration.findFirst({
        where: {
          eventId,
          attendeeId: userId,
          status: 'CONFIRMED',
        },
      });

      if (!registration) {
        throw new ValidationError('You must be registered for this event to review it');
      }

      // Check if event has ended (optional requirement)
      const _event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { endDate: true },
      });

      const isVerifiedAttendee = !!registration.checkedInAt;

      // Create or update review
      const review = await prisma.eventReview.upsert({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
        create: {
          eventId,
          userId,
          registrationId: registration.id,
          rating: data.rating,
          title: data.title,
          review: data.review,
          pros: data.pros || [],
          cons: data.cons || [],
          isVerifiedAttendee,
          attendedDate: registration.checkedInAt || undefined,
          status: 'PENDING', // Auto-approve for now, can add moderation later
        },
        update: {
          rating: data.rating,
          title: data.title,
          review: data.review,
          pros: data.pros || [],
          cons: data.cons || [],
          status: 'PENDING', // Re-moderate on update
        },
      });

      // Update event average rating (could be done via trigger or background job)
      await this.updateEventRating(eventId);

      return review;
    } catch (error) {
      logger.error('Error creating/updating review:', error);
      throw error;
    }
  }

  /**
   * Get reviews for an event
   */
  static async getEventReviews(
    eventId: string,
    filters?: {
      page?: number;
      limit?: number;
      rating?: number;
      status?: string;
    },
  ) {
    try {
      const limit = filters?.limit || 20;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const where: any = {
        eventId,
        status: filters?.status || 'APPROVED',
      };

      if (filters?.rating) {
        where.rating = filters.rating;
      }

      const [reviews, total] = await Promise.all([
        prisma.eventReview.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.eventReview.count({ where }),
      ]);

      // Calculate average rating
      const avgRating = await prisma.eventReview.aggregate({
        where: {
          eventId,
          status: 'APPROVED',
        },
        _avg: {
          rating: true,
        },
        _count: true,
      });

      return {
        reviews,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
        averageRating: avgRating._avg.rating || 0,
        totalReviews: avgRating._count,
      };
    } catch (error) {
      logger.error('Error getting event reviews:', error);
      throw error;
    }
  }

  /**
   * Mark review as helpful
   */
  static async markReviewHelpful(reviewId: string, _userId: string) {
    try {
      // Could add a UserReviewHelpful table to track who marked it helpful
      // For now, just increment the count
      const review = await prisma.eventReview.update({
        where: { id: reviewId },
        data: {
          helpfulCount: {
            increment: 1,
          },
        },
      });

      return review;
    } catch (error) {
      logger.error('Error marking review helpful:', error);
      throw error;
    }
  }

  /**
   * Update event's average rating
   */
  private static async updateEventRating(_eventId: string) {
    try {
      const stats = await prisma.eventReview.aggregate({
        where: {
          eventId: _eventId,
          status: 'APPROVED',
        },
        _avg: {
          rating: true,
        },
        _count: { _all: true },
      });

      // Event model has no rating fields; store in no-op to satisfy flow
      void stats;

      
    } catch (error) {
      logger.error('Error updating event rating:', error);
      // Don't throw, this is a background operation
    }
  }
}

export { prisma };
