import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors.js';

export class EventCollaborationService {
  /**
   * Invite collaborator to event
   */
  static async inviteCollaborator(
    eventId: string,
    organizerId: string,
    data: {
      collaboratorId: string;
      role?: string;
      canEdit?: boolean;
      canManageAttendees?: boolean;
      canManageTickets?: boolean;
      canViewAnalytics?: boolean;
      canManageStaff?: boolean;
      canPublish?: boolean;
    },
  ) {
    try {
      // Verify event belongs to organizer
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          organizerId,
          deletedAt: null,
        },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      if (data.collaboratorId === organizerId) {
        throw new ValidationError('You cannot invite yourself as a collaborator');
      }

      // Check if already a collaborator
      const existing = await prisma.eventCollaborator.findUnique({
        where: {
          eventId_collaboratorId: {
            eventId,
            collaboratorId: data.collaboratorId,
          },
        },
      });

      if (existing) {
        throw new ValidationError('User is already a collaborator on this event');
      }

      const collaborator = await prisma.eventCollaborator.create({
        data: {
          eventId,
          collaboratorId: data.collaboratorId,
          role: data.role,
          canEdit: data.canEdit || false,
          canManageAttendees: data.canManageAttendees || false,
          canManageTickets: data.canManageTickets || false,
          canViewAnalytics: data.canViewAnalytics !== false,
          canManageStaff: data.canManageStaff || false,
          canPublish: data.canPublish || false,
          invitedBy: organizerId,
        },
        include: {
          collaborator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Log activity
      await this.logActivity(eventId, organizerId, 'collaborator_invited', {
        collaboratorId: data.collaboratorId,
        role: data.role,
      });

      return collaborator;
    } catch (error) {
      logger.error('Error inviting collaborator:', error);
      throw error;
    }
  }

  /**
   * Accept collaboration invitation
   */
  static async acceptInvitation(collaborationId: string, userId: string) {
    try {
      const collaboration = await prisma.eventCollaborator.findFirst({
        where: {
          id: collaborationId,
          collaboratorId: userId,
        },
      });

      if (!collaboration) {
        throw new NotFoundError('Collaboration invitation not found');
      }

      if (collaboration.acceptedAt) {
        throw new ValidationError('Invitation already accepted');
      }

      const updated = await prisma.eventCollaborator.update({
        where: { id: collaborationId },
        data: {
          acceptedAt: new Date(),
          isActive: true,
        },
      });

      // Log activity
      await this.logActivity(collaboration.eventId, userId, 'collaboration_accepted', {
        collaborationId,
      });

      return updated;
    } catch (error) {
      logger.error('Error accepting invitation:', error);
      throw error;
    }
  }

  /**
   * Get event collaborators
   */
  static async getEventCollaborators(eventId: string, organizerId: string) {
    try {
      // Verify organizer owns the event or is a collaborator
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          deletedAt: null,
        },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      const isOwner = event.organizerId === organizerId;
      const isCollaborator = await prisma.eventCollaborator.findFirst({
        where: {
          eventId,
          collaboratorId: organizerId,
          isActive: true,
        },
      });

      if (!isOwner && !isCollaborator) {
        throw new AuthorizationError('You do not have permission to view collaborators');
      }

      const collaborators = await prisma.eventCollaborator.findMany({
        where: {
          eventId,
        },
        include: {
          collaborator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return collaborators;
    } catch (error) {
      logger.error('Error getting collaborators:', error);
      throw error;
    }
  }

  /**
   * Update collaborator permissions
   */
  static async updateCollaboratorPermissions(
    collaborationId: string,
    organizerId: string,
    data: {
      role?: string;
      canEdit?: boolean;
      canManageAttendees?: boolean;
      canManageTickets?: boolean;
      canViewAnalytics?: boolean;
      canManageStaff?: boolean;
      canPublish?: boolean;
    },
  ) {
    try {
      const collaboration = await prisma.eventCollaborator.findFirst({
        where: {
          id: collaborationId,
        },
        include: {
          event: {
            select: {
              organizerId: true,
            },
          },
        },
      });

      if (!collaboration) {
        throw new NotFoundError('Collaboration not found');
      }

      // Only event owner can update permissions
      if (collaboration.event.organizerId !== organizerId) {
        throw new AuthorizationError('Only event owner can update collaborator permissions');
      }

      const updated = await prisma.eventCollaborator.update({
        where: { id: collaborationId },
        data,
      });

      // Log activity
      await this.logActivity(collaboration.eventId, organizerId, 'collaborator_permissions_updated', {
        collaborationId,
        changes: data,
      });

      return updated;
    } catch (error) {
      logger.error('Error updating collaborator permissions:', error);
      throw error;
    }
  }

  /**
   * Remove collaborator
   */
  static async removeCollaborator(collaborationId: string, organizerId: string) {
    try {
      const collaboration = await prisma.eventCollaborator.findFirst({
        where: {
          id: collaborationId,
        },
        include: {
          event: {
            select: {
              organizerId: true,
            },
          },
        },
      });

      if (!collaboration) {
        throw new NotFoundError('Collaboration not found');
      }

      // Only event owner can remove collaborators
      if (collaboration.event.organizerId !== organizerId) {
        throw new AuthorizationError('Only event owner can remove collaborators');
      }

      await prisma.eventCollaborator.delete({
        where: { id: collaborationId },
      });

      // Log activity
      await this.logActivity(collaboration.eventId, organizerId, 'collaborator_removed', {
        collaborationId,
        collaboratorId: collaboration.collaboratorId,
      });

      return { success: true };
    } catch (error) {
      logger.error('Error removing collaborator:', error);
      throw error;
    }
  }

  /**
   * Get event activity log
   */
  static async getEventActivityLog(eventId: string, organizerId: string, filters?: {
    page?: number;
    limit?: number;
    action?: string;
    userId?: string;
  }) {
    try {
      // Verify organizer owns the event or is a collaborator
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          deletedAt: null,
        },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      const isOwner = event.organizerId === organizerId;
      const isCollaborator = await prisma.eventCollaborator.findFirst({
        where: {
          eventId,
          collaboratorId: organizerId,
          isActive: true,
          canViewAnalytics: true,
        },
      });

      if (!isOwner && !isCollaborator) {
        throw new AuthorizationError('You do not have permission to view activity log');
      }

      const limit = filters?.limit || 50;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const where: {
        eventId: string;
        action?: string;
        userId?: string;
      } = {
        eventId,
      };

      if (filters?.action) {
        where.action = filters.action;
      }

      if (filters?.userId) {
        where.userId = filters.userId;
      }

      const [activities, total] = await Promise.all([
        prisma.eventActivityLog.findMany({
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
        prisma.eventActivityLog.count({ where }),
      ]);

      return {
        activities,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      };
    } catch (error) {
      logger.error('Error getting activity log:', error);
      throw error;
    }
  }

  /**
   * Log activity (internal method)
   */
  static async logActivity(
    eventId: string,
    userId: string,
    action: string,
    metadata?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      await prisma.eventActivityLog.create({
        data: {
          eventId,
          userId,
          action,
          description: this.getActionDescription(action, metadata),
          changes: metadata,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      logger.error('Error logging activity:', error);
      // Don't throw - activity logging shouldn't break the flow
    }
  }

  /**
   * Get action description
   */
  private static getActionDescription(action: string, metadata?: Record<string, unknown>): string {
    const descriptions: Record<string, string> = {
      collaborator_invited: `Invited ${metadata?.collaboratorId} as ${metadata?.role || 'collaborator'}`,
      collaboration_accepted: 'Accepted collaboration invitation',
      collaborator_permissions_updated: 'Updated collaborator permissions',
      collaborator_removed: 'Removed collaborator',
      event_updated: 'Event updated',
      ticket_created: 'Ticket type created',
      attendee_added: 'Attendee added',
    };

    return descriptions[action] || action;
  }

  /**
   * Check if user can perform action on event
   */
  static async canPerformAction(
    eventId: string,
    userId: string,
    action: 'edit' | 'manageAttendees' | 'manageTickets' | 'viewAnalytics' | 'manageStaff' | 'publish',
  ): Promise<boolean> {
    try {
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          deletedAt: null,
        },
      });

      if (!event) {
        return false;
      }

      // Event owner can do everything
      if (event.organizerId === userId) {
        return true;
      }

      // Check collaborator permissions
      const collaboration = await prisma.eventCollaborator.findFirst({
        where: {
          eventId,
          collaboratorId: userId,
          isActive: true,
          acceptedAt: {
            not: null,
          },
        },
      });

      if (!collaboration) {
        return false;
      }

      const permissionMap: Record<string, keyof typeof collaboration> = {
        edit: 'canEdit',
        manageAttendees: 'canManageAttendees',
        manageTickets: 'canManageTickets',
        viewAnalytics: 'canViewAnalytics',
        manageStaff: 'canManageStaff',
        publish: 'canPublish',
      };

      return Boolean(collaboration[permissionMap[action]]);
    } catch (error) {
      logger.error('Error checking permissions:', error);
      return false;
    }
  }
}
