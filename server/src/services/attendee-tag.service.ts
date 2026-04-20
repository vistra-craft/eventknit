import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export class AttendeeTagService {
  /**
   * Create a new tag
   */
  static async createTag(organizerId: string, data: {
    name: string;
    color?: string;
    description?: string;
  }) {
    try {
      // Check if tag with same name already exists
      const existing = await prisma.attendeeTag.findUnique({
        where: {
          organizerId_name: {
            organizerId,
            name: data.name,
          },
        },
      });

      if (existing) {
        throw new ValidationError('Tag with this name already exists');
      }

      const tag = await prisma.attendeeTag.create({
        data: {
          organizerId,
          name: data.name,
          color: data.color,
          description: data.description,
        },
      });

      return tag;
    } catch (error) {
      logger.error('Error creating tag:', error);
      throw error;
    }
  }

  /**
   * Get organizer's tags
   */
  static async getOrganizerTags(organizerId: string) {
    try {
      const tags = await prisma.attendeeTag.findMany({
        where: {
          organizerId,
        },
        include: {
          _count: {
            select: {
              taggedUsers: true,
            },
          },
        },
        orderBy: { usageCount: 'desc' },
      });

      return tags.map(tag => ({
        ...tag,
        usageCount: tag._count.taggedUsers,
      }));
    } catch (error) {
      logger.error('Error getting tags:', error);
      throw error;
    }
  }

  /**
   * Get tag by ID
   */
  static async getTagById(tagId: string, organizerId: string) {
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
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              event: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
            take: 50,
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              taggedUsers: true,
            },
          },
        },
      });

      if (!tag) {
        throw new NotFoundError('Tag not found');
      }

      return {
        ...tag,
        usageCount: tag._count.taggedUsers,
      };
    } catch (error) {
      logger.error('Error getting tag:', error);
      throw error;
    }
  }

  /**
   * Update tag
   */
  static async updateTag(tagId: string, organizerId: string, data: {
    name?: string;
    color?: string;
    description?: string;
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

      // If name is being changed, check for conflicts
      if (data.name && data.name !== tag.name) {
        const existing = await prisma.attendeeTag.findUnique({
          where: {
            organizerId_name: {
              organizerId,
              name: data.name,
            },
          },
        });

        if (existing) {
          throw new ValidationError('Tag with this name already exists');
        }
      }

      const updated = await prisma.attendeeTag.update({
        where: { id: tagId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.color !== undefined && { color: data.color }),
          ...(data.description !== undefined && { description: data.description }),
        },
      });

      return updated;
    } catch (error) {
      logger.error('Error updating tag:', error);
      throw error;
    }
  }

  /**
   * Tag a user
   */
  static async tagUser(tagId: string, organizerId: string, data: {
    userId: string;
    eventId?: string;
    notes?: string;
    taggedBy?: string;
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

      // Verify user has registered for organizer's events
      if (data.eventId) {
        const registration = await prisma.eventRegistration.findFirst({
          where: {
            eventId: data.eventId,
            attendeeId: data.userId,
            event: {
              organizerId,
            },
          },
        });

        if (!registration) {
          throw new ValidationError('User has not registered for this event');
        }
      } else {
        const registration = await prisma.eventRegistration.findFirst({
          where: {
            attendeeId: data.userId,
            event: {
              organizerId,
            },
          },
        });

        if (!registration) {
          throw new ValidationError('User has not registered for any of your events');
        }
      }

      const taggedUser = await prisma.attendeeTaggedUser.upsert({
        where: {
          tagId_userId_eventId: data.eventId
            ? { tagId, userId: data.userId, eventId: data.eventId }
            : undefined,
        },
        create: {
          tagId,
          userId: data.userId,
          ...(data.eventId ? { eventId: data.eventId } : {}),
          notes: data.notes,
          taggedBy: data.taggedBy || organizerId,
        },
        update: {
          notes: data.notes,
        },
      });

      // Update tag usage count
      const count = await prisma.attendeeTaggedUser.count({
        where: { tagId },
      });

      await prisma.attendeeTag.update({
        where: { id: tagId },
        data: {
          usageCount: count,
        },
      });

      return taggedUser;
    } catch (error) {
      logger.error('Error tagging user:', error);
      throw error;
    }
  }

  /**
   * Remove tag from user
   */
  static async untagUser(tagId: string, organizerId: string, userId: string, eventId?: string) {
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

      await prisma.attendeeTaggedUser.delete({
        where: {
          tagId_userId_eventId: eventId ? { tagId, userId, eventId } : undefined,
        },
      });

      // Update tag usage count
      const count = await prisma.attendeeTaggedUser.count({
        where: { tagId },
      });

      await prisma.attendeeTag.update({
        where: { id: tagId },
        data: {
          usageCount: count,
        },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error untagging user:', error);
      throw error;
    }
  }

  /**
   * Get users with a specific tag
   */
  static async getTaggedUsers(tagId: string, organizerId: string, filters?: {
    page?: number;
    limit?: number;
    eventId?: string;
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

      const limit = filters?.limit || 50;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const where: {
        tagId: string;
        eventId?: string;
      } = {
        tagId,
      };

      if (filters?.eventId) {
        where.eventId = filters.eventId;
      }

      const [taggedUsers, total] = await Promise.all([
        prisma.attendeeTaggedUser.findMany({
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
        prisma.attendeeTaggedUser.count({ where }),
      ]);

      return {
        taggedUsers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      };
    } catch (error) {
      logger.error('Error getting tagged users:', error);
      throw error;
    }
  }

  /**
   * Delete tag
   */
  static async deleteTag(tagId: string, organizerId: string) {
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

      await prisma.attendeeTag.delete({
        where: { id: tagId },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error deleting tag:', error);
      throw error;
    }
  }
}
