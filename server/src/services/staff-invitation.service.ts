import crypto from 'crypto';
import { UserRole, StaffInvitationStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { hashToken } from '../utils/password.js';
import { hashPassword, checkPasswordBreach } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { validateRoleCreation, canManageStaff } from '../utils/privileges.js';
import { createAuditLog, AuditActions } from '../utils/audit.js';
import { emailService } from './email.service.js';
import { ConflictError, NotFoundError, ValidationError, AuthorizationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

const INVITATION_EXPIRY_HOURS = 72;

interface InviteStaffData {
  email: string;
  role: UserRole;
  message?: string;
}

interface AcceptInvitationData {
  token: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export class StaffInvitationService {
  /**
   * Send a staff invitation
   */
  static async inviteStaff(
    data: InviteStaffData,
    inviterId: string,
    inviterRole: UserRole,
  ) {
    // Validate role creation permission
    validateRoleCreation(inviterRole, data.role);

    // Get inviter details
    const inviter = await prisma.user.findUnique({
      where: { id: inviterId },
      select: { id: true, firstName: true, lastName: true, email: true, organizationName: true },
    });

    if (!inviter) {
      throw new NotFoundError('Inviter not found');
    }

    // Prevent self-invitation
    if (inviter.email === data.email.toLowerCase()) {
      throw new ValidationError('You cannot invite yourself');
    }

    // Check if an active user already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      select: { id: true, status: true },
    });

    if (existingUser && existingUser.status === 'ACTIVE') {
      throw new ConflictError('A user with this email already exists');
    }

    // Revoke any existing PENDING invitation for same email+role
    await prisma.staffInvitation.updateMany({
      where: {
        email: data.email.toLowerCase(),
        role: data.role,
        status: StaffInvitationStatus.PENDING,
      },
      data: {
        status: StaffInvitationStatus.REVOKED,
        revokedAt: new Date(),
        revokedById: inviterId,
      },
    });

    // Determine scope
    const isOrgScope =
      data.role === UserRole.ORGANIZER_ADMIN || data.role === UserRole.ORGANIZER_TELLER;
    const scope = isOrgScope ? 'ORGANIZATION' : 'PLATFORM';

    // Generate token — store hash, send raw
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);

    const invitation = await prisma.staffInvitation.create({
      data: {
        email: data.email.toLowerCase(),
        token: tokenHash,
        role: data.role,
        invitedById: inviterId,
        organizationName: isOrgScope ? inviter.organizationName : null,
        scope,
        status: StaffInvitationStatus.PENDING,
        expiresAt,
        message: data.message,
      },
    });

    // Send invitation email
    const inviterName = [inviter.firstName, inviter.lastName].filter(Boolean).join(' ') || 'An administrator';
    try {
      await emailService.sendStaffInvitationEmail(data.email.toLowerCase(), {
        inviterName,
        organizationName: isOrgScope ? inviter.organizationName || undefined : undefined,
        role: data.role,
        message: data.message,
        acceptUrl: `${config.frontend.url}/auth/accept-invite?token=${rawToken}`,
        expiryHours: INVITATION_EXPIRY_HOURS,
      });
    } catch (err) {
      logger.error('Failed to send staff invitation email', { error: err, email: data.email });
      // Don't fail the invitation creation — the admin can resend
    }

    // Audit log
    await createAuditLog({
      action: AuditActions.STAFF_INVITED,
      userId: inviterId,
      entityId: invitation.id,
      entity: 'StaffInvitation',
      metadata: { email: data.email, role: data.role, scope },
    });

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      scope: invitation.scope,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    };
  }

  /**
   * Validate an invitation token (public — for the accept page)
   */
  static async validateToken(rawToken: string) {
    const tokenHash = hashToken(rawToken);

    const invitation = await prisma.staffInvitation.findUnique({
      where: { token: tokenHash },
      include: {
        invitedBy: {
          select: { firstName: true, lastName: true, organizationName: true },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundError('Invalid invitation link');
    }

    if (invitation.status === StaffInvitationStatus.REVOKED) {
      throw new ValidationError('This invitation has been revoked');
    }

    if (invitation.status === StaffInvitationStatus.ACCEPTED) {
      throw new ValidationError('This invitation has already been accepted');
    }

    if (invitation.status === StaffInvitationStatus.EXPIRED || invitation.expiresAt < new Date()) {
      // Mark as expired if not already
      if (invitation.status !== StaffInvitationStatus.EXPIRED) {
        await prisma.staffInvitation.update({
          where: { id: invitation.id },
          data: { status: StaffInvitationStatus.EXPIRED },
        });
      }
      throw new ValidationError('This invitation has expired. Please ask the administrator to send a new one.');
    }

    const inviterName = [invitation.invitedBy.firstName, invitation.invitedBy.lastName]
      .filter(Boolean)
      .join(' ') || 'An administrator';

    return {
      email: invitation.email,
      role: invitation.role,
      scope: invitation.scope,
      organizationName: invitation.organizationName,
      inviterName,
      message: invitation.message,
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * Accept an invitation and create the user account
   */
  static async acceptInvitation(data: AcceptInvitationData) {
    const tokenHash = hashToken(data.token);

    const invitation = await prisma.staffInvitation.findUnique({
      where: { token: tokenHash },
    });

    if (!invitation) {
      throw new NotFoundError('Invalid invitation link');
    }

    if (invitation.status !== StaffInvitationStatus.PENDING) {
      throw new ValidationError(`This invitation is ${invitation.status.toLowerCase()}`);
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.staffInvitation.update({
        where: { id: invitation.id },
        data: { status: StaffInvitationStatus.EXPIRED },
      });
      throw new ValidationError('This invitation has expired. Please ask the administrator to send a new one.');
    }

    // Check email not taken by active user (race condition guard)
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
      select: { id: true, status: true },
    });

    if (existingUser && existingUser.status === 'ACTIVE') {
      throw new ConflictError('An account with this email already exists');
    }

    // Password breach check
    await checkPasswordBreach(data.password);

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user and update invitation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: invitation.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber || null,
          role: invitation.role,
          status: 'ACTIVE',
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          organizationName: invitation.organizationName,
          createdBy: invitation.invitedById,
          managedBy: invitation.scope === 'ORGANIZATION' ? invitation.invitedById : null,
        },
      });

      await tx.staffInvitation.update({
        where: { id: invitation.id },
        data: {
          status: StaffInvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
          acceptedUserId: user.id,
        },
      });

      return user;
    });

    // Generate auth tokens
    const accessToken = generateAccessToken({
      userId: result.id,
      email: result.email,
      role: result.role,
    });

    const refreshToken = generateRefreshToken({
      userId: result.id,
      email: result.email,
      role: result.role,
    });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: hashToken(refreshToken),
        userId: result.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Audit log
    await createAuditLog({
      action: AuditActions.STAFF_INVITATION_ACCEPTED,
      userId: result.id,
      entityId: invitation.id,
      entity: 'StaffInvitation',
      metadata: { role: invitation.role, scope: invitation.scope },
    });

    return {
      user: {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        role: result.role,
        status: result.status,
        isEmailVerified: result.isEmailVerified,
        organizationName: result.organizationName,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
      accessToken,
      refreshToken,
      expiresIn: config.jwt.expiresIn,
    };
  }

  /**
   * Resend an invitation (revokes old, creates new)
   */
  static async resendInvitation(invitationId: string, requesterId: string, requesterRole: UserRole) {
    const invitation = await prisma.staffInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }

    // For org staff, only the inviter (or admin) can resend
    if (invitation.scope === 'ORGANIZATION' && invitation.invitedById !== requesterId) {
      if (!canManageStaff(requesterRole)) {
        throw new AuthorizationError('You can only resend your own invitations');
      }
    }

    if (invitation.status === StaffInvitationStatus.ACCEPTED) {
      throw new ValidationError('This invitation has already been accepted');
    }

    // Revoke old invitation
    await prisma.staffInvitation.update({
      where: { id: invitationId },
      data: {
        status: StaffInvitationStatus.REVOKED,
        revokedAt: new Date(),
        revokedById: requesterId,
      },
    });

    // Create new invitation
    return this.inviteStaff(
      { email: invitation.email, role: invitation.role, message: invitation.message || undefined },
      invitation.invitedById,
      requesterRole,
    );
  }

  /**
   * Revoke an invitation
   */
  static async revokeInvitation(invitationId: string, revokedById: string, revokerRole: UserRole) {
    const invitation = await prisma.staffInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }

    if (invitation.status !== StaffInvitationStatus.PENDING) {
      throw new ValidationError(`Cannot revoke an invitation that is ${invitation.status.toLowerCase()}`);
    }

    // For org staff, only the inviter (or admin) can revoke
    if (invitation.scope === 'ORGANIZATION' && invitation.invitedById !== revokedById) {
      if (!canManageStaff(revokerRole)) {
        throw new AuthorizationError('You can only revoke your own invitations');
      }
    }

    await prisma.staffInvitation.update({
      where: { id: invitationId },
      data: {
        status: StaffInvitationStatus.REVOKED,
        revokedAt: new Date(),
        revokedById,
      },
    });

    await createAuditLog({
      action: AuditActions.INVITATION_REVOKED,
      userId: revokedById,
      entityId: invitationId,
      entity: 'StaffInvitation',
      metadata: { email: invitation.email, role: invitation.role },
    });

    return { success: true };
  }

  /**
   * Get invitations (admin — all platform scope, organizer — own org scope)
   */
  static async getInvitations(filters: {
    scope?: string;
    inviterId?: string;
    status?: StaffInvitationStatus;
    page?: number;
    limit?: number;
  }) {
    const { scope, inviterId, status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (scope) where.scope = scope;
    if (inviterId) where.invitedById = inviterId;
    if (status) where.status = status;

    const [invitations, total] = await Promise.all([
      prisma.staffInvitation.findMany({
        where,
        include: {
          invitedBy: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.staffInvitation.count({ where }),
    ]);

    return {
      invitations: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        scope: inv.scope,
        status: inv.status,
        organizationName: inv.organizationName,
        invitedBy: {
          firstName: inv.invitedBy.firstName,
          lastName: inv.invitedBy.lastName,
          email: inv.invitedBy.email,
        },
        expiresAt: inv.expiresAt,
        acceptedAt: inv.acceptedAt,
        createdAt: inv.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
