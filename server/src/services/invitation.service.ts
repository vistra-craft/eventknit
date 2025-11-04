import { prisma } from '../config/database';
import { InviteType, UserRole, EventStatus } from '@prisma/client';
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from '../utils/errors';
import { createAuditLog, AuditActions } from '../utils/audit';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export interface CreateInvitationData {
  inviteType: InviteType;
  title?: string;
  description?: string;
  expiresAt?: Date | string;
  maxUses?: number;
}

export interface UpdateInvitationData {
  title?: string;
  description?: string;
  expiresAt?: Date | string;
  maxUses?: number;
  isActive?: boolean;
}

export class InvitationService {
  /**
   * Generate a unique token for invitation link
   */
  private static generateInvitationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new invitation link for an event
   */
  static async createInvitation(
    eventId: string,
    data: CreateInvitationData,
    organizerId: string,
    organizerRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Verify organizer can create invitations
    if (organizerRole !== UserRole.ORGANIZER &&
        organizerRole !== UserRole.SUPERADMIN &&
        organizerRole !== UserRole.ADMIN_STAFF) {
      throw new AuthorizationError('Only organizers can create invitation links');
    }

    // Get event and verify ownership
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        organizerId: true,
        status: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Verify organizer owns the event (unless admin)
    if (organizerRole !== UserRole.SUPERADMIN && organizerRole !== UserRole.ADMIN_STAFF) {
      if (event.organizerId !== organizerId) {
        throw new AuthorizationError('You do not have permission to create invitations for this event');
      }
    }

    // Validate expiration date if provided
    if (data.expiresAt) {
      const expiresAt = new Date(data.expiresAt);
      if (expiresAt < new Date()) {
        throw new ValidationError('Expiration date cannot be in the past');
      }
    }

    // Validate maxUses if provided
    if (data.maxUses !== undefined && data.maxUses < 1) {
      throw new ValidationError('Max uses must be at least 1');
    }

    // Generate unique token
    let token = this.generateInvitationToken();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure token is unique
    while (attempts < maxAttempts) {
      const existing = await prisma.eventInvitation.findUnique({
        where: { token },
      });

      if (!existing) {
        break;
      }

      token = this.generateInvitationToken();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique invitation token');
    }

    // Create invitation
    const invitation = await prisma.eventInvitation.create({
      data: {
        eventId,
        inviteType: data.inviteType,
        token,
        title: data.title?.trim(),
        description: data.description?.trim(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        maxUses: data.maxUses || null,
        isActive: true,
        createdBy: organizerId,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId: organizerId,
      action: AuditActions.INVITATION_CREATED,
      entity: 'EventInvitation',
      entityId: invitation.id,
      metadata: {
        eventId,
        eventTitle: event.title,
        inviteType: data.inviteType,
        token: `${token.substring(0, 8)}...`, // Only log partial token for security
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Invitation created: ${invitation.id} for event: ${eventId} by organizer: ${organizerId}`);

    return invitation;
  }

  /**
   * Get all invitations for an event
   */
  static async getEventInvitations(
    eventId: string,
    organizerId: string,
    organizerRole: UserRole,
  ) {
    // Verify organizer can view invitations
    if (organizerRole !== UserRole.ORGANIZER &&
        organizerRole !== UserRole.SUPERADMIN &&
        organizerRole !== UserRole.ADMIN_STAFF) {
      throw new AuthorizationError('Only organizers can view invitation links');
    }

    // Get event and verify ownership
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
      },
      select: {
        id: true,
        organizerId: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Verify organizer owns the event (unless admin)
    if (organizerRole !== UserRole.SUPERADMIN && organizerRole !== UserRole.ADMIN_STAFF) {
      if (event.organizerId !== organizerId) {
        throw new AuthorizationError('You do not have permission to view invitations for this event');
      }
    }

    // Get invitations
    const invitations = await prisma.eventInvitation.findMany({
      where: {
        eventId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    // Transform invitations to include usage count
    const invitationsWithUsage = invitations.map(invitation => ({
      ...invitation,
      usageCount: invitation._count.registrations,
    }));

    return invitationsWithUsage;
  }

  /**
   * Get invitation by token (public - for registration)
   */
  static async getInvitationByToken(token: string) {
    const invitation = await prisma.eventInvitation.findUnique({
      where: { token },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            fullDescription: true,
            startDate: true,
            endDate: true,
            startTime: true,
            endTime: true,
            location: true,
            venue: true,
            address: true,
            isOnline: true,
            onlineLink: true,
            image: true,
            isFree: true,
            price: true,
            ticketTypes: true,
            capacity: true,
            availableSlots: true,
            status: true,
            registrationDeadline: true,
            registrationFields: true,
            category: true,
            tags: true,
            type: true,
            organizer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                organizationName: true,
              },
            },
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundError('Invalid invitation link');
    }

    // Check if invitation is active
    if (!invitation.isActive) {
      throw new ValidationError('This invitation link has been revoked');
    }

    // Check if invitation has expired
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      throw new ValidationError('This invitation link has expired');
    }

    // Check if invitation has reached max uses
    if (invitation.maxUses !== null && invitation.usedCount >= invitation.maxUses) {
      throw new ValidationError('This invitation link has reached its maximum number of uses');
    }

    // Check if event is approved
    if (invitation.event.status !== EventStatus.APPROVED) {
      throw new ValidationError('This event is not yet available for registration');
    }

    return invitation;
  }

  /**
   * Update an invitation
   */
  static async updateInvitation(
    invitationId: string,
    data: UpdateInvitationData,
    organizerId: string,
    organizerRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get invitation
    const invitation = await prisma.eventInvitation.findUnique({
      where: { id: invitationId },
      include: {
        event: {
          select: {
            id: true,
            organizerId: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }

    // Verify organizer owns the event (unless admin)
    if (organizerRole !== UserRole.SUPERADMIN && organizerRole !== UserRole.ADMIN_STAFF) {
      if (invitation.event.organizerId !== organizerId) {
        throw new AuthorizationError('You do not have permission to update this invitation');
      }
    }

    // Validate expiration date if provided
    if (data.expiresAt) {
      const expiresAt = new Date(data.expiresAt);
      if (expiresAt < new Date()) {
        throw new ValidationError('Expiration date cannot be in the past');
      }
    }

    // Validate maxUses if provided
    if (data.maxUses !== undefined) {
      if (data.maxUses < 1) {
        throw new ValidationError('Max uses must be at least 1');
      }
      if (data.maxUses < invitation.usedCount) {
        throw new ValidationError(`Max uses cannot be less than current usage (${invitation.usedCount})`);
      }
    }

    // Update invitation
    const updatedInvitation = await prisma.eventInvitation.update({
      where: { id: invitationId },
      data: {
        title: data.title !== undefined ? data.title.trim() : undefined,
        description: data.description !== undefined ? data.description.trim() : undefined,
        expiresAt: data.expiresAt !== undefined ? (data.expiresAt ? new Date(data.expiresAt) : null) : undefined,
        maxUses: data.maxUses !== undefined ? data.maxUses : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
        revokedAt: data.isActive === false ? new Date() : undefined,
        revokedBy: data.isActive === false ? organizerId : undefined,
      },
    });

    // Audit log
    await createAuditLog({
      userId: organizerId,
      action: AuditActions.INVITATION_UPDATED,
      entity: 'EventInvitation',
      entityId: invitationId,
      metadata: {
        eventId: invitation.eventId,
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Invitation updated: ${invitationId} by organizer: ${organizerId}`);

    return updatedInvitation;
  }

  /**
   * Revoke an invitation
   */
  static async revokeInvitation(
    invitationId: string,
    organizerId: string,
    organizerRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.updateInvitation(
      invitationId,
      { isActive: false },
      organizerId,
      organizerRole,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Delete an invitation
   */
  static async deleteInvitation(
    invitationId: string,
    organizerId: string,
    organizerRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get invitation
    const invitation = await prisma.eventInvitation.findUnique({
      where: { id: invitationId },
      include: {
        event: {
          select: {
            id: true,
            organizerId: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }

    // Verify organizer owns the event (unless admin)
    if (organizerRole !== UserRole.SUPERADMIN && organizerRole !== UserRole.ADMIN_STAFF) {
      if (invitation.event.organizerId !== organizerId) {
        throw new AuthorizationError('You do not have permission to delete this invitation');
      }
    }

    // Delete invitation
    await prisma.eventInvitation.delete({
      where: { id: invitationId },
    });

    // Audit log
    await createAuditLog({
      userId: organizerId,
      action: AuditActions.INVITATION_DELETED,
      entity: 'EventInvitation',
      entityId: invitationId,
      metadata: {
        eventId: invitation.eventId,
        inviteType: invitation.inviteType,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Invitation deleted: ${invitationId} by organizer: ${organizerId}`);
  }
}

