import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';

export class AdvancedTeamService {
  /**
   * Create team role template
   */
  static async createRoleTemplate(organizerId: string, data: {
    name: string;
    description?: string;
    canEdit?: boolean;
    canManageAttendees?: boolean;
    canManageTickets?: boolean;
    canViewAnalytics?: boolean;
    canManageStaff?: boolean;
    canPublish?: boolean;
    canManageCollaborators?: boolean;
  }) {
    try {
      const template = await prisma.teamRoleTemplate.create({
        data: {
          organizerId,
          name: data.name,
          description: data.description,
          canEdit: data.canEdit || false,
          canManageAttendees: data.canManageAttendees || false,
          canManageTickets: data.canManageTickets || false,
          canViewAnalytics: data.canViewAnalytics !== false,
          canManageStaff: data.canManageStaff || false,
          canPublish: data.canPublish || false,
          canManageCollaborators: data.canManageCollaborators || false,
        },
      });

      return template;
    } catch (error) {
      logger.error('Error creating role template:', error);
      throw error;
    }
  }

  /**
   * Get organizer's role templates
   */
  static async getRoleTemplates(organizerId: string, filters?: {
    isActive?: boolean;
  }) {
    try {
      const where: any = {
        organizerId,
      };

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      const templates = await prisma.teamRoleTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return templates;
    } catch (error) {
      logger.error('Error getting role templates:', error);
      throw error;
    }
  }

  /**
   * Use role template to create collaborator permissions
   */
  static async applyRoleTemplate(templateId: string, organizerId: string) {
    try {
      const template = await prisma.teamRoleTemplate.findFirst({
        where: {
          id: templateId,
          organizerId,
        },
      });

      if (!template) {
        throw new NotFoundError('Role template not found');
      }

      // Update usage count
      await prisma.teamRoleTemplate.update({
        where: { id: templateId },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });

      return {
        permissions: {
          canEdit: template.canEdit,
          canManageAttendees: template.canManageAttendees,
          canManageTickets: template.canManageTickets,
          canViewAnalytics: template.canViewAnalytics,
          canManageStaff: template.canManageStaff,
          canPublish: template.canPublish,
          canManageCollaborators: template.canManageCollaborators,
        },
      };
    } catch (error) {
      logger.error('Error applying role template:', error);
      throw error;
    }
  }

  /**
   * Get team activity feed
   */
  static async getTeamActivityFeed(organizerId: string, filters?: {
    eventId?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const limit = filters?.limit || 50;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const where: any = {
        organizerId,
      };

      if (filters?.eventId) {
        where.eventId = filters.eventId;
      }

      if (filters?.userId) {
        where.userId = filters.userId;
      }

      const [activities, total] = await Promise.all([
        prisma.teamActivityFeed.findMany({
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
        prisma.teamActivityFeed.count({ where }),
      ]);

      return {
        activities,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting team activity feed:', error);
      throw error;
    }
  }

  /**
   * Log team activity
   */
  static async logActivity(
    organizerId: string,
    userId: string,
    action: string,
    description: string,
    metadata?: any,
    eventId?: string,
  ) {
    try {
      await prisma.teamActivityFeed.create({
        data: {
          organizerId,
          userId,
          eventId,
          action,
          description,
          metadata,
        },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error logging team activity:', error);
      // Don't throw - activity logging shouldn't break the flow
      return { success: false };
    }
  }

  /**
   * Get team performance metrics
   */
  static async getTeamPerformanceMetrics(organizerId: string, filters?: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const where: any = {
        organizerId,
      };

      if (filters?.userId) {
        where.userId = filters.userId;
      }

      if (filters?.startDate || filters?.endDate) {
        where.periodStart = {};
        where.periodEnd = {};
        if (filters.startDate) {
          where.periodStart.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.periodEnd.lte = filters.endDate;
        }
      }

      const metrics = await prisma.teamPerformanceMetric.findMany({
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
        orderBy: { periodStart: 'desc' },
      });

      // Aggregate metrics
      const aggregated = metrics.reduce((acc: any, metric) => {
        if (!acc[metric.userId]) {
          acc[metric.userId] = {
            user: metric.user,
            eventsCreated: 0,
            ticketsSold: 0,
            revenueGenerated: 0,
            attendeesManaged: 0,
          };
        }
        acc[metric.userId].eventsCreated += metric.eventsCreated;
        acc[metric.userId].ticketsSold += metric.ticketsSold;
        acc[metric.userId].revenueGenerated += Number(metric.revenueGenerated);
        acc[metric.userId].attendeesManaged += metric.attendeesManaged;
        return acc;
      }, {});

      return {
        metrics: Object.values(aggregated),
        total: metrics.length,
      };
    } catch (error) {
      logger.error('Error getting team performance metrics:', error);
      throw error;
    }
  }

  /**
   * Update team performance metrics
   */
  static async updateTeamMetrics(
    organizerId: string,
    userId: string,
    data: {
      eventsCreated?: number;
      ticketsSold?: number;
      revenueGenerated?: number;
      attendeesManaged?: number;
    },
    periodStart: Date,
    periodEnd: Date,
  ) {
    try {
      const metric = await prisma.teamPerformanceMetric.upsert({
        where: {
          organizerId_userId_periodStart_periodEnd: {
            organizerId,
            userId,
            periodStart,
            periodEnd,
          },
        },
        create: {
          organizerId,
          userId,
          eventsCreated: data.eventsCreated || 0,
          ticketsSold: data.ticketsSold || 0,
          revenueGenerated: data.revenueGenerated || 0,
          attendeesManaged: data.attendeesManaged || 0,
          periodStart,
          periodEnd,
        },
        update: {
          eventsCreated: {
            increment: data.eventsCreated || 0,
          },
          ticketsSold: {
            increment: data.ticketsSold || 0,
          },
          revenueGenerated: {
            increment: data.revenueGenerated || 0,
          },
          attendeesManaged: {
            increment: data.attendeesManaged || 0,
          },
        },
      });

      return metric;
    } catch (error) {
      logger.error('Error updating team metrics:', error);
      throw error;
    }
  }
}
