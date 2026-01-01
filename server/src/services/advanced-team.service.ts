import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, AuthorizationError } from '../utils/errors.js';
import { PermissionService } from './permission.service.js';

export class AdvancedTeamService {
  /**
   * Create team role template with permissions
   */
  static async createRoleTemplate(
    organizerId: string,
    data: {
      name: string;
      description?: string;
      permissionKeys?: string[]; // New: granular permissions
      // Legacy permissions (kept for backward compatibility)
      canEdit?: boolean;
      canManageAttendees?: boolean;
      canManageTickets?: boolean;
      canViewAnalytics?: boolean;
      canManageStaff?: boolean;
      canPublish?: boolean;
      canManageCollaborators?: boolean;
    },
  ) {
    try {
      // Validate permissions if provided
      if (data.permissionKeys && data.permissionKeys.length > 0) {
        const permissions = await prisma.permission.findMany({
          where: { key: { in: data.permissionKeys } },
        });
        
        if (permissions.length !== data.permissionKeys.length) {
          const foundKeys = permissions.map(p => p.key);
          const missingKeys = data.permissionKeys.filter(k => !foundKeys.includes(k));
          throw new NotFoundError(`Permissions not found: ${missingKeys.join(', ')}`);
        }
      }

      // Create role template
      const template = await prisma.teamRoleTemplate.create({
        data: {
          organizerId,
          name: data.name,
          description: data.description,
          // Legacy permissions (backward compatibility)
          canEdit: data.canEdit || false,
          canManageAttendees: data.canManageAttendees || false,
          canManageTickets: data.canManageTickets || false,
          canViewAnalytics: data.canViewAnalytics !== false,
          canManageStaff: data.canManageStaff || false,
          canPublish: data.canPublish || false,
          canManageCollaborators: data.canManageCollaborators || false,
        },
      });

      // Assign permissions if provided
      if (data.permissionKeys && data.permissionKeys.length > 0) {
        const permissions = await prisma.permission.findMany({
          where: { key: { in: data.permissionKeys } },
        });

        await prisma.teamRolePermission.createMany({
          data: permissions.map(perm => ({
            roleId: template.id,
            permissionId: perm.id,
          })),
          skipDuplicates: true,
        });
      }

      // Return template with permissions
      return await this.getRoleTemplateById(template.id, organizerId);
    } catch (error) {
      logger.error('Error creating role template:', error);
      throw error;
    }
  }

  /**
   * Get role template by ID
   */
  static async getRoleTemplateById(templateId: string, organizerId: string) {
    const template = await prisma.teamRoleTemplate.findFirst({
      where: {
        id: templateId,
        organizerId,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundError('Role template not found');
    }

    return template;
  }

  /**
   * Get organizer's role templates with permissions
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
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: {
              staffWithCustomRole: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return templates;
    } catch (error) {
      logger.error('Error getting role templates:', error);
      throw error;
    }
  }

  /**
   * Update role template
   */
  static async updateRoleTemplate(
    templateId: string,
    organizerId: string,
    data: {
      name?: string;
      description?: string;
      permissionKeys?: string[];
      isActive?: boolean;
    },
  ) {
    try {
      const template = await this.getRoleTemplateById(templateId, organizerId);

      // Validate permissions if provided
      if (data.permissionKeys) {
        const permissions = await prisma.permission.findMany({
          where: { key: { in: data.permissionKeys } },
        });
        
        if (permissions.length !== data.permissionKeys.length) {
          const foundKeys = permissions.map(p => p.key);
          const missingKeys = data.permissionKeys.filter(k => !foundKeys.includes(k));
          throw new NotFoundError(`Permissions not found: ${missingKeys.join(', ')}`);
        }

        // Replace all permissions
        await prisma.teamRolePermission.deleteMany({
          where: { roleId: templateId },
        });

        await prisma.teamRolePermission.createMany({
          data: permissions.map(perm => ({
            roleId: templateId,
            permissionId: perm.id,
          })),
          skipDuplicates: true,
        });
      }

      // Update template
      const updated = await prisma.teamRoleTemplate.update({
        where: { id: templateId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      return updated;
    } catch (error) {
      logger.error('Error updating role template:', error);
      throw error;
    }
  }

  /**
   * Delete role template
   */
  static async deleteRoleTemplate(templateId: string, organizerId: string) {
    try {
      const template = await this.getRoleTemplateById(templateId, organizerId);

      // Check if role is in use
      const staffCount = await prisma.user.count({
        where: { customRoleId: templateId },
      });

      if (staffCount > 0) {
        throw new AuthorizationError(
          `Cannot delete role: ${staffCount} staff member(s) are assigned to this role. Please reassign them first.`,
        );
      }

      // Delete role (permissions will be cascade deleted)
      await prisma.teamRoleTemplate.delete({
        where: { id: templateId },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error deleting role template:', error);
      throw error;
    }
  }

  /**
   * Duplicate role template
   */
  static async duplicateRoleTemplate(templateId: string, organizerId: string, newName?: string) {
    try {
      const template = await this.getRoleTemplateById(templateId, organizerId);

      // Get permission keys
      const permissionKeys = template.permissions.map(rp => rp.permission.key);

      // Create new template
      const duplicated = await this.createRoleTemplate(organizerId, {
        name: newName || `${template.name} (Copy)`,
        description: template.description || undefined,
        permissionKeys,
      });

      return duplicated;
    } catch (error) {
      logger.error('Error duplicating role template:', error);
      throw error;
    }
  }

  /**
   * Use role template to create collaborator permissions (legacy method)
   */
  static async applyRoleTemplate(templateId: string, organizerId: string) {
    try {
      const template = await this.getRoleTemplateById(templateId, organizerId);

      // Update usage count
      await prisma.teamRoleTemplate.update({
        where: { id: templateId },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });

      // Return both legacy permissions and new granular permissions
      const permissionKeys = template.permissions.map(rp => rp.permission.key);

      return {
        permissions: {
          // Legacy permissions (backward compatibility)
          canEdit: template.canEdit,
          canManageAttendees: template.canManageAttendees,
          canManageTickets: template.canManageTickets,
          canViewAnalytics: template.canViewAnalytics,
          canManageStaff: template.canManageStaff,
          canPublish: template.canPublish,
          canManageCollaborators: template.canManageCollaborators,
          // New granular permissions
          permissionKeys,
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
