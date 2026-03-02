import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { Decimal } from '@prisma/client/runtime/library';

export class PersonalEventFeedService {
  /**
   * Get or create user's event feed
   */
  static async getOrCreateFeed(userId: string) {
    try {
      let feed = await prisma.personalEventFeed.findUnique({
        where: { userId },
        include: {
          feedItems: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  startDate: true,
                  endDate: true,
                  location: true,
                  category: true,
                  image: true,
                  isFree: true,
                  price: true,
                  currency: true,
                },
              },
            },
            where: {
              dismissed: false,
            },
            orderBy: [
              { relevanceScore: 'desc' },
              { addedAt: 'desc' },
            ],
            take: 50,
          },
        },
      });

      if (!feed) {
        feed = await prisma.personalEventFeed.create({
          data: {
            userId,
            preferences: {},
            filters: {},
          },
          include: {
            feedItems: {
              include: {
                event: {
                  select: {
                    id: true,
                    title: true,
                    description: true,
                    startDate: true,
                    endDate: true,
                    location: true,
                    category: true,
                    image: true,
                    isFree: true,
                    price: true,
                    currency: true,
                  },
                },
              },
              orderBy: { addedAt: 'desc' },
              take: 50,
            },
          },
        });
      }

      return feed;
    } catch (error: unknown) {
      logger.error('Error getting feed:', error);
      throw new ValidationError(`Failed to get feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refresh feed with personalized recommendations
   */
  static async refreshFeed(userId: string) {
    try {
      const _feed = await this.getOrCreateFeed(userId);

      // Get user preferences
      const userInterests = await prisma.userInterest.findMany({
        where: { userId },
      });

      const pastRegistrations = await prisma.eventRegistration.findMany({
        where: { attendeeId: userId },
        include: {
          event: {
            select: {
              category: true,
              tags: true,
              location: true,
            },
          },
        },
      });

      // Extract preferences
      const preferredCategories = new Set<string>();
      const preferredTags = new Set<string>();
      const preferredLocations = new Set<string>();

      userInterests.forEach((interest) => {
        if (interest.category) preferredCategories.add(interest.category);
        interest.tags?.forEach((tag) => preferredTags.add(tag));
      });

      pastRegistrations.forEach((reg) => {
        if (reg.event.category) preferredCategories.add(reg.event.category);
        reg.event.tags?.forEach((tag) => preferredTags.add(tag));
        if (reg.event.location) preferredLocations.add(reg.event.location);
      });

      // Find recommended events
      const now = new Date();
      const recommendedEvents = await prisma.event.findMany({
        where: {
          status: 'APPROVED',
          startDate: {
            gt: now,
          },
          deletedAt: null,
          OR: [
            ...Array.from(preferredCategories).map((cat) => ({
              category: cat,
            })),
            ...Array.from(preferredTags).map((tag) => ({
              tags: {
                has: tag,
              },
            })),
            ...Array.from(preferredLocations).map((loc) => ({
              location: {
                contains: loc,
              },
            })),
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          startDate: true,
          endDate: true,
          location: true,
          category: true,
          image: true,
          tags: true,
          isFree: true,
          price: true,
          currency: true,
        },
        take: 50,
      });

      // Calculate relevance scores and add to feed
      const feedItems = recommendedEvents.map((event) => {
        let relevanceScore = 0.5; // Base score

        // Boost score based on matches
        if (event.category && preferredCategories.has(event.category)) {
          relevanceScore += 0.2;
        }

        if (event.tags) {
          const matchingTags = event.tags.filter((tag) => preferredTags.has(tag));
          relevanceScore += matchingTags.length * 0.1;
        }

        if (event.location && Array.from(preferredLocations).some((loc) => event.location?.includes(loc))) {
          relevanceScore += 0.1;
        }

        return {
          feedId: _feed.id,
          eventId: event.id,
          relevanceScore: new Decimal(Math.min(relevanceScore, 1.0)),
          reason: this.generateReason(event, preferredCategories, preferredTags, preferredLocations),
        };
      });

      // Remove old items and add new ones
      await prisma.$transaction([
        prisma.feedItem.deleteMany({
          where: {
            feedId: _feed.id,
            viewed: true,
          },
        }),
        ...feedItems.map((item) =>
          prisma.feedItem.upsert({
            where: {
              feedId_eventId: {
                feedId: _feed.id,
                eventId: item.eventId,
              },
            },
            create: item,
            update: {
              relevanceScore: item.relevanceScore,
              reason: item.reason,
              viewed: false,
              dismissed: false,
            },
          }),
        ),
        prisma.personalEventFeed.update({
          where: { id: _feed.id },
          data: { lastUpdated: new Date() },
        }),
      ]);

      logger.info(`Feed refreshed for user: ${userId}`);
      return { success: true, itemsAdded: feedItems.length };
    } catch (error: unknown) {
      logger.error('Error refreshing feed:', error);
      throw new ValidationError(`Failed to refresh feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update feed preferences
   */
  static async updateFeedPreferences(
    userId: string,
    preferences: {
      preferences?: Record<string, unknown>;
      filters?: Record<string, unknown>;
    },
  ) {
    try {
      const _feed = await this.getOrCreateFeed(userId);

      const updated = await prisma.personalEventFeed.update({
        where: { id: _feed.id },
        data: {
          preferences: preferences.preferences || _feed.preferences,
          filters: preferences.filters || _feed.filters,
        },
      });

      return updated;
    } catch (error: unknown) {
      logger.error('Error updating feed preferences:', error);
      throw new ValidationError(`Failed to update preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mark feed item as viewed
   */
  static async markItemViewed(userId: string, itemId: string) {
    try {
      await this.getOrCreateFeed(userId);
      const item = await prisma.feedItem.findUnique({
        where: { id: itemId },
        include: { feed: true },
      });

      if (!item || item.feed.userId !== userId) {
        throw new NotFoundError('Feed item not found');
      }

      await prisma.feedItem.update({
        where: { id: itemId },
        data: {
          viewed: true,
          viewedAt: new Date(),
        },
      });

      return { success: true };
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error marking item viewed:', error);
      throw new ValidationError(`Failed to mark item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Dismiss feed item
   */
  static async dismissItem(userId: string, itemId: string) {
    try {
      await this.getOrCreateFeed(userId);
      const item = await prisma.feedItem.findUnique({
        where: { id: itemId },
        include: { feed: true },
      });

      if (!item || item.feed.userId !== userId) {
        throw new NotFoundError('Feed item not found');
      }

      await prisma.feedItem.update({
        where: { id: itemId },
        data: {
          dismissed: true,
          dismissedAt: new Date(),
        },
      });

      return { success: true };
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error dismissing item:', error);
      throw new ValidationError(`Failed to dismiss item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static generateReason(
    event: {
      category?: string;
      tags?: string[];
      location?: string;
    },
    categories: Set<string>,
    tags: Set<string>,
    locations: Set<string>,
  ): string {
    const reasons: string[] = [];

    if (event.category && categories.has(event.category)) {
      reasons.push(`Based on your interest in ${event.category}`);
    }

    if (event.tags) {
      const matchingTags = event.tags.filter((tag: string) => tags.has(tag));
      if (matchingTags.length > 0) {
        reasons.push(`Matches your tags: ${matchingTags.slice(0, 2).join(', ')}`);
      }
    }

    if (event.location && Array.from(locations).some((loc) => event.location?.includes(loc))) {
      reasons.push('Near your preferred location');
    }

    return reasons.length > 0 ? reasons[0] : 'Recommended for you';
  }
}
