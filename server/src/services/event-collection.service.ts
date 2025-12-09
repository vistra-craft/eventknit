import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class EventCollectionService {
  /**
   * Create a new event collection
   */
  static async createCollection(
    userId: string,
    data: {
      name: string;
      description?: string;
      isPublic?: boolean;
      coverImage?: string;
    }
  ) {
    try {
      const shareToken = crypto.randomBytes(16).toString('hex');

      const collection = await prisma.eventCollection.create({
        data: {
          userId,
          name: data.name,
          description: data.description,
          isPublic: data.isPublic || false,
          coverImage: data.coverImage,
          shareToken,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return collection;
    } catch (error) {
      logger.error('Error creating collection:', error);
      throw error;
    }
  }

  /**
   * Get user's collections
   */
  static async getUserCollections(
    userId: string,
    filters?: {
      page?: number;
      limit?: number;
      isPublic?: boolean;
    }
  ) {
    try {
      const limit = filters?.limit || 20;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const where: any = { userId };
      if (filters?.isPublic !== undefined) {
        where.isPublic = filters.isPublic;
      }

      const [collections, total] = await Promise.all([
        prisma.eventCollection.findMany({
          where,
          include: {
            _count: {
              select: {
                events: true,
                followers: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.eventCollection.count({ where }),
      ]);

      return {
        collections,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      };
    } catch (error) {
      logger.error('Error getting user collections:', error);
      throw error;
    }
  }

  /**
   * Get public collections
   */
  static async getPublicCollections(filters?: {
    page?: number;
    limit?: number;
  }) {
    try {
      const limit = filters?.limit || 20;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const [collections, total] = await Promise.all([
        prisma.eventCollection.findMany({
          where: { isPublic: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                events: true,
                followers: true,
              },
            },
          },
          orderBy: { followerCount: 'desc' },
          take: limit,
          skip,
        }),
        prisma.eventCollection.count({ where: { isPublic: true } }),
      ]);

      return {
        collections,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      };
    } catch (error) {
      logger.error('Error getting public collections:', error);
      throw error;
    }
  }

  /**
   * Get collection by ID
   */
  static async getCollectionById(collectionId: string, userId?: string) {
    try {
      const collection = await prisma.eventCollection.findUnique({
        where: { id: collectionId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          events: {
            include: {
              event: {
                include: {
                  organizer: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      organizationName: true,
                    },
                  },
                  _count: {
                    select: {
                      registrations: true,
                    },
                  },
                },
              },
            },
            orderBy: { addedAt: 'desc' },
          },
          _count: {
            select: {
              followers: true,
            },
          },
        },
      });

      if (!collection) {
        throw new ValidationError('Collection not found');
      }

      // Check if user is following
      let isFollowing = false;
      if (userId) {
        const follow = await prisma.collectionFollower.findUnique({
          where: {
            collectionId_userId: {
              collectionId,
              userId,
            },
          },
        });
        isFollowing = !!follow;
      }

      return {
        ...collection,
        isFollowing,
      };
    } catch (error) {
      logger.error('Error getting collection:', error);
      throw error;
    }
  }

  /**
   * Add event to collection
   */
  static async addEventToCollection(
    collectionId: string,
    eventId: string,
    userId: string,
    notes?: string
  ) {
    try {
      // Verify collection belongs to user
      const collection = await prisma.eventCollection.findUnique({
        where: { id: collectionId },
      });

      if (!collection) {
        throw new ValidationError('Collection not found');
      }

      if (collection.userId !== userId) {
        throw new ValidationError('You can only add events to your own collections');
      }

      // Check if event already in collection
      const existing = await prisma.eventCollectionItem.findUnique({
        where: {
          collectionId_eventId: {
            collectionId,
            eventId,
          },
        },
      });

      if (existing) {
        throw new ValidationError('Event is already in this collection');
      }

      // Add event (using create with unique constraint handling)
      const item = await prisma.eventCollectionItem.create({
        data: {
          collectionId,
          eventId,
          notes,
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              image: true,
            },
          },
        },
      });

      // Update collection event count
      await prisma.eventCollection.update({
        where: { id: collectionId },
        data: {
          eventCount: {
            increment: 1,
          },
        },
      });

      return item;
    } catch (error) {
      logger.error('Error adding event to collection:', error);
      throw error;
    }
  }

  /**
   * Remove event from collection
   */
  static async removeEventFromCollection(
    collectionId: string,
    eventId: string,
    userId: string
  ) {
    try {
      const collection = await prisma.eventCollection.findUnique({
        where: { id: collectionId },
      });

      if (!collection) {
        throw new ValidationError('Collection not found');
      }

      if (collection.userId !== userId) {
        throw new ValidationError('You can only remove events from your own collections');
      }

      await prisma.eventCollectionItem.delete({
        where: {
          collectionId_eventId: {
            collectionId,
            eventId,
          },
        },
      });

      // Update collection event count
      await prisma.eventCollection.update({
        where: { id: collectionId },
        data: {
          eventCount: {
            decrement: 1,
          },
        },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error removing event from collection:', error);
      throw error;
    }
  }

  /**
   * Follow/unfollow collection
   */
  static async toggleFollowCollection(collectionId: string, userId: string) {
    try {
      const existing = await prisma.collectionFollower.findUnique({
        where: {
          collectionId_userId: {
            collectionId,
            userId,
          },
        },
      });

      if (existing) {
        // Unfollow
        await prisma.collectionFollower.delete({
          where: {
            collectionId_userId: {
              collectionId,
              userId,
            },
          },
        });

        await prisma.eventCollection.update({
          where: { id: collectionId },
          data: {
            followerCount: {
              decrement: 1,
            },
          },
        });

        return { isFollowing: false };
      } else {
        // Follow
        await prisma.collectionFollower.create({
          data: {
            collectionId,
            userId,
          },
        });

        await prisma.eventCollection.update({
          where: { id: collectionId },
          data: {
            followerCount: {
              increment: 1,
            },
          },
        });

        return { isFollowing: true };
      }
    } catch (error) {
      logger.error('Error toggling follow:', error);
      throw error;
    }
  }

  /**
   * Update collection
   */
  static async updateCollection(
    collectionId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      isPublic?: boolean;
      coverImage?: string;
    }
  ) {
    try {
      const collection = await prisma.eventCollection.findUnique({
        where: { id: collectionId },
      });

      if (!collection) {
        throw new ValidationError('Collection not found');
      }

      if (collection.userId !== userId) {
        throw new ValidationError('You can only update your own collections');
      }

      const updated = await prisma.eventCollection.update({
        where: { id: collectionId },
        data,
      });

      return updated;
    } catch (error) {
      logger.error('Error updating collection:', error);
      throw error;
    }
  }

  /**
   * Delete collection
   */
  static async deleteCollection(collectionId: string, userId: string) {
    try {
      const collection = await prisma.eventCollection.findUnique({
        where: { id: collectionId },
      });

      if (!collection) {
        throw new ValidationError('Collection not found');
      }

      if (collection.userId !== userId) {
        throw new ValidationError('You can only delete your own collections');
      }

      await prisma.eventCollection.delete({
        where: { id: collectionId },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error deleting collection:', error);
      throw error;
    }
  }
}
