import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors.js';

export class AttendeeSegmentationService {
  /**
   * Create a new segment
   */
  static async createSegment(organizerId: string, data: {
    name: string;
    description?: string;
    eventId?: string;
    criteria: any;
    isDynamic?: boolean;
  }) {
    try {
      // Verify event belongs to organizer if eventId provided
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

      const segment = await prisma.attendeeSegment.create({
        data: {
          organizerId,
          eventId: data.eventId,
          name: data.name,
          description: data.description,
          criteria: data.criteria,
          isDynamic: data.isDynamic !== false,
        },
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // If dynamic, calculate initial members
      if (segment.isDynamic) {
        await this.updateSegmentMembers(segment.id);
      }

      return segment;
    } catch (error) {
      logger.error('Error creating segment:', error);
      throw error;
    }
  }

  /**
   * Get organizer's segments
   */
  static async getOrganizerSegments(organizerId: string, filters?: {
    page?: number;
    limit?: number;
    eventId?: string;
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

      const [segments, total] = await Promise.all([
        prisma.attendeeSegment.findMany({
          where,
          include: {
            event: {
              select: {
                id: true,
                title: true,
              },
            },
            _count: {
              select: {
                members: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.attendeeSegment.count({ where }),
      ]);

      return {
        segments: segments.map(s => ({
          ...s,
          memberCount: s._count.members,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      };
    } catch (error) {
      logger.error('Error getting segments:', error);
      throw error;
    }
  }

  /**
   * Get segment by ID
   */
  static async getSegmentById(segmentId: string, organizerId: string) {
    try {
      const segment = await prisma.attendeeSegment.findFirst({
        where: {
          id: segmentId,
          organizerId,
        },
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          members: {
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
            take: 50,
            orderBy: { addedAt: 'desc' },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      if (!segment) {
        throw new NotFoundError('Segment not found');
      }

      return {
        ...segment,
        memberCount: segment._count.members,
      };
    } catch (error) {
      logger.error('Error getting segment:', error);
      throw error;
    }
  }

  /**
   * Update segment
   */
  static async updateSegment(segmentId: string, organizerId: string, data: {
    name?: string;
    description?: string;
    criteria?: any;
    isDynamic?: boolean;
  }) {
    try {
      const segment = await prisma.attendeeSegment.findFirst({
        where: {
          id: segmentId,
          organizerId,
        },
      });

      if (!segment) {
        throw new NotFoundError('Segment not found');
      }

      const updated = await prisma.attendeeSegment.update({
        where: { id: segmentId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.criteria && { criteria: data.criteria }),
          ...(data.isDynamic !== undefined && { isDynamic: data.isDynamic }),
        },
      });

      // If dynamic and criteria changed, update members
      if (updated.isDynamic && data.criteria) {
        await this.updateSegmentMembers(segmentId);
      }

      return updated;
    } catch (error) {
      logger.error('Error updating segment:', error);
      throw error;
    }
  }

  /**
   * Update segment members based on criteria
   */
  static async updateSegmentMembers(segmentId: string) {
    try {
      const segment = await prisma.attendeeSegment.findFirst({
        where: { id: segmentId },
      });

      if (!segment) {
        throw new NotFoundError('Segment not found');
      }

      // Get all registrations for the organizer's events
      const where: any = {
        event: {
          organizerId: segment.organizerId,
        },
      };

      if (segment.eventId) {
        where.eventId = segment.eventId;
      }

      // Apply criteria filters (simplified - would need more complex logic for full implementation)
      const criteria = segment.criteria as any;

      if (criteria.tags) {
        // Would need to join with AttendeeTaggedUser
      }

      if (criteria.registrationDate) {
        if (criteria.registrationDate.before) {
          where.createdAt = {
            lte: new Date(criteria.registrationDate.before),
          };
        }
        if (criteria.registrationDate.after) {
          where.createdAt = {
            gte: new Date(criteria.registrationDate.after),
          };
        }
      }

      const registrations = await prisma.eventRegistration.findMany({
        where,
        select: {
          attendeeId: true,
        },
        distinct: ['attendeeId'],
      });

      const userIds = registrations.map(r => r.attendeeId);

      // Remove existing members not matching criteria
      await prisma.attendeeSegmentMember.deleteMany({
        where: {
          segmentId,
          userId: {
            notIn: userIds,
          },
        },
      });

      // Add new members
      for (const userId of userIds) {
        await prisma.attendeeSegmentMember.upsert({
          where: {
            segmentId_userId: {
              segmentId,
              userId,
            },
          },
          create: {
            segmentId,
            userId,
          },
          update: {},
        });
      }

      // Update member count
      const count = await prisma.attendeeSegmentMember.count({
        where: { segmentId },
      });

      await prisma.attendeeSegment.update({
        where: { id: segmentId },
        data: {
          memberCount: count,
        },
      });

      return { success: true, memberCount: count };
    } catch (error) {
      logger.error('Error updating segment members:', error);
      throw error;
    }
  }

  /**
   * Manually add member to segment
   */
  static async addMemberToSegment(segmentId: string, organizerId: string, userId: string) {
    try {
      const segment = await prisma.attendeeSegment.findFirst({
        where: {
          id: segmentId,
          organizerId,
        },
      });

      if (!segment) {
        throw new NotFoundError('Segment not found');
      }

      // Verify user has registered for organizer's events
      if (segment.eventId) {
        const registration = await prisma.eventRegistration.findFirst({
          where: {
            eventId: segment.eventId,
            attendeeId: userId,
          },
        });

        if (!registration) {
          throw new ValidationError('User has not registered for this event');
        }
      } else {
        const registration = await prisma.eventRegistration.findFirst({
          where: {
            attendeeId: userId,
            event: {
              organizerId,
            },
          },
        });

        if (!registration) {
          throw new ValidationError('User has not registered for any of your events');
        }
      }

      const member = await prisma.attendeeSegmentMember.upsert({
        where: {
          segmentId_userId: {
            segmentId,
            userId,
          },
        },
        create: {
          segmentId,
          userId,
        },
        update: {},
      });

      // Update member count
      await prisma.attendeeSegment.update({
        where: { id: segmentId },
        data: {
          memberCount: {
            increment: 1,
          },
        },
      });

      return member;
    } catch (error) {
      logger.error('Error adding member to segment:', error);
      throw error;
    }
  }

  /**
   * Remove member from segment
   */
  static async removeMemberFromSegment(segmentId: string, organizerId: string, userId: string) {
    try {
      const segment = await prisma.attendeeSegment.findFirst({
        where: {
          id: segmentId,
          organizerId,
        },
      });

      if (!segment) {
        throw new NotFoundError('Segment not found');
      }

      await prisma.attendeeSegmentMember.delete({
        where: {
          segmentId_userId: {
            segmentId,
            userId,
          },
        },
      });

      // Update member count
      await prisma.attendeeSegment.update({
        where: { id: segmentId },
        data: {
          memberCount: {
            decrement: 1,
          },
        },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error removing member from segment:', error);
      throw error;
    }
  }

  /**
   * Delete segment
   */
  static async deleteSegment(segmentId: string, organizerId: string) {
    try {
      const segment = await prisma.attendeeSegment.findFirst({
        where: {
          id: segmentId,
          organizerId,
        },
      });

      if (!segment) {
        throw new NotFoundError('Segment not found');
      }

      await prisma.attendeeSegment.delete({
        where: { id: segmentId },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error deleting segment:', error);
      throw error;
    }
  }
}
