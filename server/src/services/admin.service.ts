import { prisma } from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import { UserRole, UserStatus } from '@prisma/client';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../utils/errors.js';
import {
  validateRoleCreation,
  validateUserModification,
  validateUserDeletion,
} from '../utils/privileges.js';
import { createAuditLog, AuditActions } from '../utils/audit.js';
import { logger } from '../utils/logger.js';
import { emailService } from './email.service.js';
import { websocketService } from './websocket.service.js';

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
  organizationName?: string;
  businessEmail?: string;
  status?: UserStatus;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: UserRole;
  status?: UserStatus;
  organizationName?: string;
  businessEmail?: string;
}

export class AdminService {
  /**
   * Seed test users (for production setup)
   */
  static async seedTestUsers(createdBy: string) {
    const testUsers = [
      {
        email: 'test@organizer.com',
        password: 'testpass123',
        firstName: 'Test',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        organizationName: 'Test Organization',
        businessEmail: 'test@organizer.com',
      },
      {
        email: 'test@user.com',
        password: 'testpass123',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.ATTENDEE,
      },
    ];

    const results = [];

    for (const userData of testUsers) {
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existing) {
        const hashedPassword = await hashPassword(userData.password);
        const user = await prisma.user.update({
          where: { id: existing.id },
          data: {
            password: hashedPassword,
            role: userData.role,
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
            ...(userData.organizationName && { organizationName: userData.organizationName }),
            ...(userData.businessEmail && { businessEmail: userData.businessEmail }),
            updatedBy: createdBy,
          },
        });
        results.push({ email: userData.email, action: 'updated', user });
      } else {
        const hashedPassword = await hashPassword(userData.password);
        const user = await prisma.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
            ...(userData.organizationName && { organizationName: userData.organizationName }),
            ...(userData.businessEmail && { businessEmail: userData.businessEmail }),
            createdBy,
          },
        });
        results.push({ email: userData.email, action: 'created', user });
      }
    }

    logger.info('Test users seeded via admin endpoint');
    return { users: results };
  }
  /**
   * Create a new user (admin function)
   */
  static async createUser(
    data: CreateUserData,
    createdBy: string,
    createdByRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
    sendEmailNotification?: boolean,
  ) {
    // Validate role creation permission
    validateRoleCreation(createdByRole, data.role);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Validate role requirements
    if (data.role === UserRole.ORGANIZER) {
      if (!data.organizationName || !data.businessEmail) {
        throw new ValidationError('Organization name and business email are required for organizers');
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        role: data.role,
        status: data.status || UserStatus.ACTIVE, // Default to ACTIVE (auto-approved)
        organizationName: data.organizationName,
        businessEmail: data.businessEmail,
        createdBy,
        // managedBy: createdByRole === UserRole.ORGANIZER ? createdBy : null, // Will be available after Prisma migration
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        status: true,
        isEmailVerified: true,
        organizationName: true,
        businessEmail: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Audit log
    await createAuditLog({
      userId: createdBy,
      action: AuditActions.ADMIN_USER_CREATED,
      entity: 'User',
      entityId: user.id,
      metadata: {
        createdUserRole: data.role,
        createdUserEmail: data.email,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`User created by admin: ${user.email} with role ${user.role}`);

    // Send email notification if requested (for organizer accounts)
    if (sendEmailNotification && data.role === UserRole.ORGANIZER) {
      try {
        await emailService.sendAdminCreatedAccountEmail(
          user.email,
          user.firstName || 'User',
          data.password, // Send the plain password (temporary)
          user.role,
          user.organizationName || undefined,
        );
        logger.info(`Welcome email sent to ${user.email}`);
      } catch (error) {
        // Log error but don't fail user creation if email fails
        logger.error(`Failed to send welcome email to ${user.email}:`, error);
      }
    }

    return user;
  }

  /**
   * Update user (admin function)
   */
  static async updateUser(
    userId: string,
    data: UpdateUserData,
    updatedBy: string,
    updatedByRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Validate modification permission
    if (data.role && data.role !== targetUser.role) {
      validateRoleCreation(updatedByRole, data.role);
      validateUserModification(updatedByRole, targetUser.role);
    } else {
      validateUserModification(updatedByRole, targetUser.role);
    }

    // Prepare update data
    const updateData: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string | null;
      role?: UserRole;
      status?: UserStatus;
      organizationName?: string | null;
      businessEmail?: string | null;
      updatedBy?: string;
    } = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName.trim();
    if (data.lastName !== undefined) updateData.lastName = data.lastName.trim();
    if (data.phoneNumber !== undefined) {
      updateData.phoneNumber = data.phoneNumber && data.phoneNumber.trim() !== '' ? data.phoneNumber.trim() : null;
    }
    if (data.role !== undefined) updateData.role = data.role;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.organizationName !== undefined) {
      updateData.organizationName = data.organizationName && data.organizationName.trim() !== '' ? data.organizationName.trim() : null;
    }
    if (data.businessEmail !== undefined) {
      updateData.businessEmail = data.businessEmail && data.businessEmail.trim() !== '' ? data.businessEmail.trim() : null;
    }
    updateData.updatedBy = updatedBy;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        status: true,
        isEmailVerified: true,
        organizationName: true,
        businessEmail: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Audit log
    const metadata: Record<string, unknown> = {};
    if (data.role && data.role !== targetUser.role) {
      metadata.roleChanged = true;
      metadata.oldRole = targetUser.role;
      metadata.newRole = data.role;
    }
    if (data.status && data.status !== targetUser.status) {
      metadata.statusChanged = true;
      metadata.oldStatus = targetUser.status;
      metadata.newStatus = data.status;
    }

    await createAuditLog({
      userId: updatedBy,
      action: AuditActions.USER_UPDATED,
      entity: 'User',
      entityId: userId,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      ipAddress,
      userAgent,
    });

    logger.info(`User updated by admin: ${updatedUser.email}`);

    return updatedUser;
  }

  /**
   * Change a user's role.
   * Validates privilege hierarchy, revokes sessions (forces re-login so the
   * new role is picked up in the JWT), sends notification email, and creates
   * an audit log entry with old/new role metadata.
   */
  static async changeUserRole(
    userId: string,
    newRole: UserRole,
    adminId: string,
    adminRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    if (targetUser.role === newRole) {
      throw new ValidationError(`User already has the ${newRole} role`);
    }

    // Validate the admin can modify this user AND assign the target role
    validateUserModification(adminRole, targetUser.role);
    validateRoleCreation(adminRole, newRole);

    const oldRole = targetUser.role;

    // Update the role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: newRole,
        updatedBy: adminId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        status: true,
        isEmailVerified: true,
        organizationName: true,
        businessEmail: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Revoke all refresh tokens so the user must re-login
    // and receives a new JWT with the updated role
    await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revokedReason: 'role_change',
      },
    });

    // Audit log
    await createAuditLog({
      userId: adminId,
      action: AuditActions.USER_UPDATED,
      entity: 'User',
      entityId: userId,
      metadata: {
        action: 'role_change',
        oldRole,
        newRole,
        changedBy: adminId,
      },
      ipAddress,
      userAgent,
    });

    // Send notification email (fire-and-forget)
    const { emailService } = await import('./email.service.js');
    emailService.sendRoleChangeEmail(
      targetUser.email,
      targetUser.firstName || 'User',
      oldRole,
      newRole,
    ).catch((err: Error) => {
      logger.warn(`Failed to send role change email to ${targetUser.email}:`, err);
    });

    logger.info(`Role changed for ${updatedUser.email}: ${oldRole} → ${newRole} by admin ${adminId}`);

    return updatedUser;
  }

  /**
   * Delete user (soft delete)
   */
  static async deleteUser(
    userId: string,
    deletedBy: string,
    deletedByRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Validate deletion permission
    validateUserDeletion(deletedByRole, targetUser.role);

    // Soft delete
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        updatedBy: deletedBy,
      },
    });

    // Audit log
    await createAuditLog({
      userId: deletedBy,
      action: AuditActions.USER_DELETED,
      entity: 'User',
      entityId: userId,
      metadata: {
        deletedUserRole: targetUser.role,
        deletedUserEmail: targetUser.email,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`User deleted by admin: ${targetUser.email}`);
  }

  /**
   * Get all users (with filters)
   */
  static async getUsers(filters: {
    role?: UserRole;
    status?: UserStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: {
      deletedAt: null;
      role?: UserRole;
      status?: UserStatus;
      OR?: Array<{
        email?: { contains: string; mode: 'insensitive' };
        firstName?: { contains: string; mode: 'insensitive' };
        lastName?: { contains: string; mode: 'insensitive' };
      }>;
    } = {
      deletedAt: null,
    };

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      const searchConditions: Array<Record<string, { contains: string; mode: 'insensitive' }>> = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
      // Also search by organization name for organizers
      if (filters.role === UserRole.ORGANIZER) {
        searchConditions.push({ organizationName: { contains: filters.search, mode: 'insensitive' } });
      }
      where.OR = searchConditions as typeof where.OR;
    }

    // Base fields for all user types
    const baseSelect = {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      role: true,
      status: true,
      isEmailVerified: true,
      organizationName: true,
      businessEmail: true,
      createdAt: true,
      updatedAt: true,
    };

    // Additional fields when fetching organizers
    const organizerSelect = filters.role === UserRole.ORGANIZER ? {
      avatar: true,
      verificationLevel: true,
      kycStatus: true,
      isIdentityVerified: true,
      organizerEntityType: true,
      organizerIndustry: true,
      profileCompleted: true,
      lastLoginAt: true,
      organizerSubscription: {
        select: { tier: true },
      },
      _count: {
        select: {
          eventsCreated: true,
          eventRegistrations: true,
        },
      },
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { ...baseSelect, ...organizerSelect },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get enriched organizer details for admin panel
   */
  static async getOrganizerDetails(userId: string) {
    const [user, recentEvents, organizerProfile, kycDocumentSummary] = await Promise.all([
      // Full user data with relation counts
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          role: true,
          status: true,
          isEmailVerified: true,
          organizationName: true,
          businessEmail: true,
          avatar: true,
          verificationLevel: true,
          kycStatus: true,
          kycSubmittedAt: true,
          kycApprovedAt: true,
          isIdentityVerified: true,
          organizerEntityType: true,
          organizerIndustry: true,
          organizerBusinessName: true,
          profileCompleted: true,
          lastLoginAt: true,
          payoutLimit: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              eventsCreated: true,
              eventRegistrations: true,
              kycDocuments: true,
            },
          },
        },
      }),
      // Recent events (last 5)
      prisma.event.findMany({
        where: { organizerId: userId, deletedAt: null },
        select: {
          id: true,
          title: true,
          startDate: true,
          status: true,
          _count: { select: { registrations: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Organizer profile data
      prisma.organizerProfile.findUnique({
        where: { userId },
        select: {
          website: true,
          description: true,
          socialLinks: true,
          bankAccountLast4: true,
          location: true,
        },
      }),
      // KYC documents count grouped by status
      prisma.kYCDocument.groupBy({
        by: ['status'],
        where: { userId },
        _count: { status: true },
      }),
    ]);

    if (!user) {
      throw new NotFoundError('Organizer not found');
    }

    // Compute total revenue from their events
    const revenueResult = await prisma.eventRegistration.aggregate({
      _sum: { totalAmount: true },
      where: {
        event: { organizerId: userId, deletedAt: null },
        status: { in: ['CONFIRMED'] },
      },
    });

    return {
      user,
      recentEvents,
      organizerProfile,
      kycDocumentSummary,
      totalRevenue: revenueResult._sum?.totalAmount?.toString() || '0',
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        status: true,
        isEmailVerified: true,
        organizationName: true,
        businessEmail: true,
        kycStatus: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Force password reset (admin function)
   */
  static async forcePasswordReset(
    userId: string,
    newPassword: string,
    resetBy: string,
    resetByRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Validate permission
    validateUserModification(resetByRole, targetUser.role);

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedBy: resetBy,
      },
    });

    // Audit log
    await createAuditLog({
      userId: resetBy,
      action: AuditActions.USER_PASSWORD_RESET,
      entity: 'User',
      entityId: userId,
      metadata: {
        resetUserEmail: targetUser.email,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Password reset by admin for user: ${targetUser.email}`);
  }

  /**
   * Suspend user (punitive action - user cannot login)
   */
  static async suspendUser(
    userId: string,
    suspendedBy: string,
    suspendedByRole: UserRole,
    reason?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Validate permission
    validateUserModification(suspendedByRole, targetUser.role);

    // Cannot suspend yourself
    if (targetUser.id === suspendedBy) {
      throw new ValidationError('You cannot suspend your own account');
    }

    // Update status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.SUSPENDED,
        updatedBy: suspendedBy,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    // Audit log
    await createAuditLog({
      userId: suspendedBy,
      action: AuditActions.USER_UPDATED,
      entity: 'User',
      entityId: userId,
      metadata: {
        statusChanged: true,
        oldStatus: targetUser.status,
        newStatus: UserStatus.SUSPENDED,
        reason: reason || 'No reason provided',
      },
      ipAddress,
      userAgent,
    });

    logger.info(`User suspended by admin: ${targetUser.email}`);
    return updatedUser;
  }

  /**
   * Deactivate user (non-punitive action - user can login but cannot perform actions)
   */
  static async deactivateUser(
    userId: string,
    deactivatedBy: string,
    deactivatedByRole: UserRole,
    reason?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Validate permission
    validateUserModification(deactivatedByRole, targetUser.role);

    // Cannot deactivate yourself
    if (targetUser.id === deactivatedBy) {
      throw new ValidationError('You cannot deactivate your own account');
    }

    // Update status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.DEACTIVATED,
        updatedBy: deactivatedBy,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    // Audit log
    await createAuditLog({
      userId: deactivatedBy,
      action: AuditActions.USER_UPDATED,
      entity: 'User',
      entityId: userId,
      metadata: {
        statusChanged: true,
        oldStatus: targetUser.status,
        newStatus: UserStatus.DEACTIVATED,
        reason: reason || 'No reason provided',
      },
      ipAddress,
      userAgent,
    });

    logger.info(`User deactivated by admin: ${targetUser.email}`);
    return updatedUser;
  }

  /**
   * Activate user (reactivate suspended or deactivated user)
   */
  static async activateUser(
    userId: string,
    activatedBy: string,
    activatedByRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Validate permission
    validateUserModification(activatedByRole, targetUser.role);

    // Check if user is already active
    if (targetUser.status === UserStatus.ACTIVE) {
      throw new ValidationError('User is already active');
    }

    // Update status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        updatedBy: activatedBy,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    // Audit log
    await createAuditLog({
      userId: activatedBy,
      action: AuditActions.USER_UPDATED,
      entity: 'User',
      entityId: userId,
      metadata: {
        statusChanged: true,
        oldStatus: targetUser.status,
        newStatus: UserStatus.ACTIVE,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`User activated by admin: ${targetUser.email}`);
    return updatedUser;
  }

  /**
   * Approve a pending organizer (PENDING_APPROVAL → ACTIVE)
   */
  static async approveOrganizer(
    userId: string,
    approvedBy: string,
    approvedByRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Validate: must be an organizer
    if (targetUser.role !== UserRole.ORGANIZER) {
      throw new ValidationError('Only organizer accounts can be approved');
    }

    // Validate: must be PENDING_APPROVAL
    if (targetUser.status !== UserStatus.PENDING_APPROVAL) {
      throw new ValidationError(`Cannot approve organizer with status ${targetUser.status}`);
    }

    // Validate permission
    validateUserModification(approvedByRole, targetUser.role);

    // Update status to ACTIVE
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        updatedBy: approvedBy,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    // Audit log
    await createAuditLog({
      userId: approvedBy,
      action: AuditActions.ADMIN_ORGANIZER_APPROVED,
      entity: 'User',
      entityId: userId,
      metadata: {
        organizerEmail: targetUser.email,
        organizerName: `${targetUser.firstName} ${targetUser.lastName}`,
        oldStatus: UserStatus.PENDING_APPROVAL,
        newStatus: UserStatus.ACTIVE,
      },
      ipAddress,
      userAgent,
    });

    // Fire-and-forget: send approval email
    emailService.sendOrganizerApprovedEmail(targetUser.email, targetUser.firstName || '').catch((err) => {
      logger.error('Failed to send organizer approved email:', err);
    });

    // Emit Socket.IO event for real-time notification
    websocketService.emitToRoom(
      `user:${userId}:notifications`,
      'organizer:approved',
      {
        userId,
        status: 'ACTIVE',
        message: 'Your organizer account has been approved!',
      },
    );

    logger.info(`Organizer approved by admin: ${targetUser.email}`);
    return updatedUser;
  }

  /**
   * Suspend an organizer with a reason (manual review gate).
   * Sets status to PENDING_APPROVAL and stores the reason so the organizer
   * knows exactly why they cannot access their dashboard.
   */
  static async suspendOrganizerWithReason(
    userId: string,
    adminId: string,
    adminRole: UserRole,
    reason: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });

    if (!targetUser) throw new NotFoundError('User not found');
    if (targetUser.role !== UserRole.ORGANIZER) {
      throw new ValidationError('Only organizer accounts can be suspended via this action');
    }
    if (targetUser.status === UserStatus.DEACTIVATED) {
      throw new ValidationError('Cannot suspend a deactivated account');
    }

    validateUserModification(adminRole, targetUser.role);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.PENDING_APPROVAL,
        suspensionReason: reason,
        suspendedAt: new Date(),
        updatedBy: adminId,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true, suspensionReason: true },
    });

    await createAuditLog({
      userId: adminId,
      action: AuditActions.USER_STATUS_CHANGED,
      entity: 'User',
      entityId: userId,
      metadata: {
        organizerEmail: targetUser.email,
        reason,
        oldStatus: targetUser.status,
        newStatus: UserStatus.PENDING_APPROVAL,
      },
      ipAddress,
      userAgent,
    });

    emailService.sendOrganizerSuspendedEmail(targetUser.email, targetUser.firstName || '', reason).catch((err) => {
      logger.error('Failed to send organizer suspended email:', err);
    });

    websocketService.emitToRoom(`user:${userId}:notifications`, 'organizer:suspended', {
      userId,
      status: 'PENDING_APPROVAL',
      message: 'Your organizer account has been suspended. Please check your email for details.',
    });

    logger.info(`Organizer suspended by admin (${adminId}): ${targetUser.email} — reason: ${reason}`);
    return updatedUser;
  }

  /**
   * Get attendees with event filtering and registration history
   */
  static async getAttendees(filters: {
    eventId?: string;
    search?: string;
    status?: UserStatus;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: {
      deletedAt: null;
      role: 'ATTENDEE';
      status?: UserStatus;
      OR?: Array<{
        email?: { contains: string; mode: 'insensitive' };
        firstName?: { contains: string; mode: 'insensitive' };
        lastName?: { contains: string; mode: 'insensitive' };
      }>;
      registrations?: {
        some: {
          eventId: string;
        };
      };
    } = {
      deletedAt: null,
      role: UserRole.ATTENDEE,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.eventId) {
      where.registrations = {
        some: {
          eventId: filters.eventId,
        },
      };
    }

    const [attendees, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          status: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    // Fetch registrations separately for each attendee
    const attendeesWithRegistrations = await Promise.all(
      attendees.map(async (attendee) => {
        const registrations = await prisma.eventRegistration.findMany({
          where: { attendeeId: attendee.id },
          select: {
            id: true,
            eventId: true,
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
                endDate: true,
              },
            },
            status: true,
            totalAmount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Limit registration history per attendee
        });

        return {
          ...attendee,
          registrations,
        };
      }),
    );

    return {
      attendees: attendeesWithRegistrations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get admin dashboard growth series for charts
   */
  static async getDashboardGrowth(
    period: 'monthly' | 'quarterly' | 'semiannual' | 'yearly' = 'monthly',
  ) {
    const now = new Date();

    type Bucket = { label: string; start: Date; end: Date };

    const buckets: Bucket[] = [];

    if (period === 'monthly') {
      // Last 6 calendar months including current
      for (let i = 5; i >= 0; i -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
        const label = date.toLocaleString('default', { month: 'short' });
        buckets.push({ label, start, end });
      }
    } else if (period === 'quarterly') {
      // Last 4 quarters including current
      const currentQuarter = Math.floor(now.getMonth() / 3) + 1; // 1-4
      const currentYear = now.getFullYear();

      for (let i = 3; i >= 0; i -= 1) {
        const quarterIndex = currentQuarter - i; // can go below 1
        const yearOffset = quarterIndex <= 0 ? Math.ceil(-quarterIndex / 4) : 0;
        const year = currentYear - yearOffset;
        const normalizedQuarter =
          ((quarterIndex - 1) % 4 + 4) % 4 /* 0-3 */ + 1; /* 1-4 */

        const startMonth = (normalizedQuarter - 1) * 3;
        const start = new Date(year, startMonth, 1);
        const end = new Date(year, startMonth + 3, 1);
        const label = `Q${normalizedQuarter} ${year}`;
        buckets.push({ label, start, end });
      }
    } else if (period === 'semiannual') {
      // Last 2 half-years (H1/H2) including current
      const currentYear = now.getFullYear();
      const isSecondHalf = now.getMonth() >= 6;

      const halfConfigs: Array<{ year: number; half: 1 | 2 }> = isSecondHalf
        ? [
          { year: currentYear - 1, half: 2 },
          { year: currentYear, half: 1 },
        ]
        : [
          { year: currentYear - 1, half: 1 },
          { year: currentYear - 1, half: 2 },
        ];

      for (const cfg of halfConfigs) {
        const startMonth = cfg.half === 1 ? 0 : 6;
        const start = new Date(cfg.year, startMonth, 1);
        const end = new Date(cfg.year, startMonth + 6, 1);
        const label = `H${cfg.half} ${cfg.year}`;
        buckets.push({ label, start, end });
      }
    } else if (period === 'yearly') {
      // Last 3 full years including current
      const currentYear = now.getFullYear();
      for (let i = 2; i >= 0; i -= 1) {
        const year = currentYear - i;
        const start = new Date(year, 0, 1);
        const end = new Date(year + 1, 0, 1);
        const label = `${year}`;
        buckets.push({ label, start, end });
      }
    }

    const organizers: { label: string; value: number }[] = [];
    const events: { label: string; value: number }[] = [];
    const revenue: { label: string; value: number }[] = [];
    const attendees: { label: string; value: number }[] = [];

    for (const bucket of buckets) {
      const [organizersCount, eventsCount, registrationsAgg, attendeesCount] = await Promise.all([
        prisma.user.count({
          where: {
            deletedAt: null,
            role: 'ORGANIZER',
            status: 'ACTIVE',
            createdAt: {
              gte: bucket.start,
              lt: bucket.end,
            },
          },
        }),
        prisma.event.count({
          where: {
            deletedAt: null,
            createdAt: {
              gte: bucket.start,
              lt: bucket.end,
            },
          },
        }),
        prisma.eventRegistration.aggregate({
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING'],
            },
            createdAt: {
              gte: bucket.start,
              lt: bucket.end,
            },
          },
          _sum: {
            totalAmount: true,
          },
        }),
        prisma.user.count({
          where: {
            deletedAt: null,
            role: 'ATTENDEE',
            createdAt: {
              gte: bucket.start,
              lt: bucket.end,
            },
          },
        }),
      ]);

      organizers.push({ label: bucket.label, value: organizersCount });
      events.push({ label: bucket.label, value: eventsCount });
      revenue.push({ label: bucket.label, value: Number(registrationsAgg._sum.totalAmount || 0) });
      attendees.push({ label: bucket.label, value: attendeesCount });
    }

    return {
      period,
      organizers,
      events,
      revenue,
      attendees,
    };
  }

  /**
   * Get admin dashboard stats
   */
  static async getDashboardStats(timeRange: '7d' | '30d' | '90d' | '1y' = '30d') {
    // Calculate date range
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Get previous period for comparison
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);

    // Total events
    const [totalEvents, totalEventsPrev] = await Promise.all([
      prisma.event.count({
        where: { deletedAt: null },
      }),
      prisma.event.count({
        where: {
          deletedAt: null,
          createdAt: { lt: startDate },
        },
      }),
    ]);

    // Active staff (all admin roles)
    const [activeStaff, activeStaffPrev] = await Promise.all([
      prisma.user.count({
        where: {
          deletedAt: null,
          role: {
            in: ['ADMIN', 'SUPPORT', 'TELLER'],
          },
          status: 'ACTIVE',
        },
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          role: {
            in: ['ADMIN', 'SUPPORT', 'TELLER'],
          },
          status: 'ACTIVE',
          createdAt: { lt: startDate },
        },
      }),
    ]);

    // Organizers
    const [organizers, organizersPrev] = await Promise.all([
      prisma.user.count({
        where: {
          deletedAt: null,
          role: 'ORGANIZER',
          status: 'ACTIVE',
        },
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          role: 'ORGANIZER',
          status: 'ACTIVE',
          createdAt: { lt: startDate },
        },
      }),
    ]);

    // Platform revenue (sum of all event registrations)
    const [revenueResult, revenueResultPrev] = await Promise.all([
      prisma.eventRegistration.aggregate({
        where: {
          status: {
            in: ['CONFIRMED', 'PENDING'],
          },
          createdAt: { gte: startDate },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.eventRegistration.aggregate({
        where: {
          status: {
            in: ['CONFIRMED', 'PENDING'],
          },
          createdAt: {
            gte: prevStartDate,
            lt: startDate,
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    const totalRevenue = Number(revenueResult._sum.totalAmount || 0);
    const totalRevenuePrev = Number(revenueResultPrev._sum.totalAmount || 0);

    // Additional platform metrics for mobile dashboard
    const [
      totalUsers,
      activeEvents,
      totalCheckIns,
      pendingApprovals,
      totalTicketsSold,
    ] = await Promise.all([
      // Total attendee users
      prisma.user.count({
        where: {
          deletedAt: null,
          role: 'ATTENDEE',
          status: 'ACTIVE',
        },
      }),
      // Currently live events (approved and currently running)
      prisma.event.count({
        where: {
          deletedAt: null,
          status: 'APPROVED',
          startDate: { lte: now },
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      }),
      // Total check-ins (all time)
      prisma.eventRegistration.count({
        where: {
          checkedInAt: { not: null },
        },
      }),
      // Events pending approval
      prisma.event.count({
        where: {
          deletedAt: null,
          status: 'PENDING',
        },
      }),
      // Total tickets sold (confirmed registrations)
      prisma.eventRegistration.count({
        where: {
          status: 'CONFIRMED',
        },
      }),
    ]);

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): { value: string; changeType: 'positive' | 'negative' } => {
      if (previous === 0) {
        return { value: current > 0 ? '+100%' : '0%', changeType: current > 0 ? 'positive' : 'positive' };
      }
      const change = ((current - previous) / previous) * 100;
      return {
        value: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
        changeType: change >= 0 ? 'positive' : 'negative',
      };
    };

    const eventsChange = calculateChange(totalEvents, totalEventsPrev);
    const staffChange = calculateChange(activeStaff, activeStaffPrev);
    const organizersChange = calculateChange(organizers, organizersPrev);
    const revenueChange = calculateChange(totalRevenue, totalRevenuePrev);

    // System health (simplified - can be enhanced with actual health checks)
    const systemHealth = 99.9; // Placeholder - can be calculated from actual system metrics

    // Parse growth percentages as raw numbers for mobile
    const parseGrowth = (change: { value: string }) => {
      const num = parseFloat(change.value.replace(/[+%]/g, ''));
      return isNaN(num) ? 0 : num;
    };

    return {
      // Raw numeric data for mobile dashboard
      platform: {
        totalEvents,
        activeEvents,
        totalUsers,
        activeOrganizers: organizers,
        totalTicketsSold,
        totalRevenue,
        totalCheckIns,
        pendingApprovals,
      },
      comparison: {
        eventsGrowth: parseGrowth(eventsChange),
        usersGrowth: parseGrowth(organizersChange),
        revenueGrowth: parseGrowth(revenueChange),
        checkInsGrowth: 0,
      },
      // Formatted stats for web dashboard
      stats: {
        totalEvents: {
          value: totalEvents.toLocaleString(),
          change: eventsChange.value,
          changeType: eventsChange.changeType,
        },
        activeStaff: {
          value: activeStaff.toLocaleString(),
          change: staffChange.value,
          changeType: staffChange.changeType,
        },
        organizers: {
          value: organizers.toLocaleString(),
          change: organizersChange.value,
          changeType: organizersChange.changeType,
        },
        platformRevenue: {
          value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          change: revenueChange.value,
          changeType: revenueChange.changeType,
        },
        systemHealth: {
          value: `${systemHealth}%`,
          change: '+0.1%',
          changeType: 'positive' as const,
        },
      },
      meta: {
        timeRange,
        periodStart: startDate.toISOString(),
        periodEnd: now.toISOString(),
      },
    };
  }

  /**
   * Get user statistics (staff, organizers, attendees, active users)
   */
  static async getUsersStats(timeRange: '7d' | '30d' | '90d' | '1y' = '30d') {
    // Calculate date range
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Get previous period for comparison
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);

    // Total Staff (all admin roles)
    const [totalStaff, totalStaffPrev] = await Promise.all([
      prisma.user.count({
        where: {
          deletedAt: null,
          role: {
            in: ['SUPERADMIN', 'ADMIN', 'SUPPORT', 'TELLER'],
          },
        },
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          role: {
            in: ['SUPERADMIN', 'ADMIN', 'SUPPORT', 'TELLER'],
          },
          createdAt: { lt: startDate },
        },
      }),
    ]);

    // Total Organizers
    const [totalOrganizers, totalOrganizersPrev] = await Promise.all([
      prisma.user.count({
        where: {
          deletedAt: null,
          role: {
            in: ['ORGANIZER', 'ORGANIZER_ADMIN', 'ORGANIZER_TELLER'],
          },
        },
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          role: {
            in: ['ORGANIZER', 'ORGANIZER_ADMIN', 'ORGANIZER_TELLER'],
          },
          createdAt: { lt: startDate },
        },
      }),
    ]);

    // Total Attendees
    const [totalAttendees, totalAttendeesPrev] = await Promise.all([
      prisma.user.count({
        where: {
          deletedAt: null,
          role: 'ATTENDEE',
        },
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          role: 'ATTENDEE',
          createdAt: { lt: startDate },
        },
      }),
    ]);

    // Active Users (across all types)
    const [activeUsers, activeUsersPrev] = await Promise.all([
      prisma.user.count({
        where: {
          deletedAt: null,
          status: 'ACTIVE',
        },
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          status: 'ACTIVE',
          createdAt: { lt: startDate },
        },
      }),
    ]);

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): { value: string; changeType: 'positive' | 'negative' } => {
      if (previous === 0) {
        return { value: current > 0 ? '+100%' : '0%', changeType: current > 0 ? 'positive' : 'positive' };
      }
      const change = ((current - previous) / previous) * 100;
      return {
        value: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
        changeType: change >= 0 ? 'positive' : 'negative',
      };
    };

    const staffChange = calculateChange(totalStaff, totalStaffPrev);
    const organizersChange = calculateChange(totalOrganizers, totalOrganizersPrev);
    const attendeesChange = calculateChange(totalAttendees, totalAttendeesPrev);
    const activeUsersChange = calculateChange(activeUsers, activeUsersPrev);

    return {
      stats: {
        totalStaff: {
          value: totalStaff.toLocaleString(),
          change: staffChange.value,
          changeType: staffChange.changeType,
        },
        totalOrganizers: {
          value: totalOrganizers.toLocaleString(),
          change: organizersChange.value,
          changeType: organizersChange.changeType,
        },
        totalAttendees: {
          value: totalAttendees.toLocaleString(),
          change: attendeesChange.value,
          changeType: attendeesChange.changeType,
        },
        activeUsers: {
          value: activeUsers.toLocaleString(),
          change: activeUsersChange.value,
          changeType: activeUsersChange.changeType,
        },
      },
      meta: {
        timeRange,
        periodStart: startDate.toISOString(),
        periodEnd: now.toISOString(),
      },
    };
  }

  /**
   * Get recent events for admin dashboard
   */
  static async getRecentEvents(limit: number = 10) {
    const events = await prisma.event.findMany({
      where: {
        deletedAt: null,
      },
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
            registrations: {
              where: {
                status: {
                  in: ['CONFIRMED', 'PENDING'],
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Calculate revenue per event
    const eventsWithRevenue = await Promise.all(
      events.map(async (event) => {
        const revenueResult = await prisma.eventRegistration.aggregate({
          where: {
            eventId: event.id,
            status: {
              in: ['CONFIRMED', 'PENDING'],
            },
          },
          _sum: {
            totalAmount: true,
          },
        });

        const revenue = Number(revenueResult._sum.totalAmount || 0);

        return {
          id: event.id,
          title: event.title,
          organizer: event.organizer.organizationName || `${event.organizer.firstName} ${event.organizer.lastName}`,
          date: event.startDate.toISOString().split('T')[0],
          attendees: event._count.registrations,
          status: event.status.toLowerCase(),
          revenue: `$${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          category: event.category || 'Uncategorized',
        };
      }),
    );

    return eventsWithRevenue;
  }

  /**
   * Get recent activity logs for admin dashboard
   */
  static async getRecentActivity(limit: number = 10) {
    const activities = await prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            'EVENT_CREATED',
            'EVENT_APPROVED',
            'EVENT_REJECTED',
            'USER_CREATED',
            'ADMIN_USER_CREATED',
            'EVENT_UPDATED',
            'REGISTRATION_VIA_INVITATION',
          ],
        },
      },
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
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Transform activities to dashboard format
    const formattedActivities = activities.map((activity) => {
      const getUserDisplayName = () => {
        if (activity.user) {
          return `${activity.user.firstName} ${activity.user.lastName}`;
        }
        return 'System';
      };

      const getActivityMessage = () => {
        switch (activity.action) {
        case 'EVENT_CREATED':
          return `Event "${(activity.metadata as Record<string, unknown>)?.title || 'Unknown'}" created`;
        case 'EVENT_APPROVED':
          return `Event "${(activity.metadata as Record<string, unknown>)?.title || 'Unknown'}" approved`;
        case 'EVENT_REJECTED':
          return `Event "${(activity.metadata as Record<string, unknown>)?.title || 'Unknown'}" rejected`;
        case 'USER_CREATED':
        case 'ADMIN_USER_CREATED':
          return `New user registered: ${(activity.metadata as Record<string, unknown>)?.createdUserEmail || 'Unknown'}`;
        case 'EVENT_UPDATED':
          return `Event "${(activity.metadata as Record<string, unknown>)?.title || 'Unknown'}" updated`;
        case 'REGISTRATION_VIA_INVITATION':
          return `Registration via invitation for "${(activity.metadata as Record<string, unknown>)?.eventTitle || 'Unknown'}"`;
        default:
          return activity.action.replace(/_/g, ' ').toLowerCase();
        }
      };

      const getActivityIcon = () => {
        switch (activity.action) {
        case 'EVENT_CREATED':
        case 'EVENT_UPDATED':
          return 'EVENT';
        case 'EVENT_APPROVED':
          return 'CHECK';
        case 'EVENT_REJECTED':
          return 'ALERT';
        case 'USER_CREATED':
        case 'ADMIN_USER_CREATED':
          return 'USER';
        case 'REGISTRATION_VIA_INVITATION':
          return 'REGISTRATION';
        default:
          return 'ACTIVITY';
        }
      };

      const getTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return `${seconds} seconds ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
        const days = Math.floor(hours / 24);
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
      };

      return {
        id: activity.id,
        type: activity.action.toLowerCase(),
        message: getActivityMessage(),
        time: getTimeAgo(activity.createdAt),
        icon: getActivityIcon(),
        user: getUserDisplayName(),
        createdAt: activity.createdAt.toISOString(),
      };
    });

    return formattedActivities;
  }

  /**
   * Get event analytics for admin mobile app
   */
  static async getEventAnalytics(eventId: string) {
    // Find the event
    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            organizationName: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Parse ticket types from JSON field
    const ticketTypes = (event.ticketTypes as Array<{
      name: string;
      price: number;
      quantity: number;
      features?: string[];
    }>) || [];

    // Calculate total tickets from ticketTypes quantities, fall back to event capacity
    const totalTickets = ticketTypes.length > 0
      ? ticketTypes.reduce((sum, tt) => sum + (tt.quantity || 0), 0)
      : (event.capacity || 0);

    // Get registration status counts
    const statusCounts = await prisma.eventRegistration.groupBy({
      by: ['status'],
      where: { eventId },
      _count: { id: true },
    });

    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    const confirmedCount = statusMap['CONFIRMED'] || 0;
    const pendingCount = statusMap['PENDING'] || 0;
    const ticketsSold = confirmedCount + pendingCount;
    const ticketsAvailable = Math.max(0, totalTickets - ticketsSold);
    const salesRate = totalTickets > 0
      ? Math.round((ticketsSold / totalTickets) * 10000) / 100
      : 0;

    // Total revenue (sum of totalAmount where status = CONFIRMED)
    const revenueResult = await prisma.eventRegistration.aggregate({
      where: { eventId, status: 'CONFIRMED' },
      _sum: { totalAmount: true },
    });
    const totalRevenue = Number(revenueResult._sum.totalAmount || 0);

    // Total check-ins
    const totalCheckIns = await prisma.eventRegistration.count({
      where: { eventId, checkedInAt: { not: null } },
    });
    const checkInRate = ticketsSold > 0
      ? Math.round((totalCheckIns / ticketsSold) * 10000) / 100
      : 0;

    // Ticket breakdown by ticketType
    const soldByType = await prisma.eventRegistration.groupBy({
      by: ['ticketType'],
      where: {
        eventId,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      _count: { id: true },
    });

    const revenueByType = await prisma.eventRegistration.groupBy({
      by: ['ticketType'],
      where: {
        eventId,
        status: 'CONFIRMED',
      },
      _sum: { totalAmount: true },
    });

    const soldMap = soldByType.reduce((acc, item) => {
      if (item.ticketType) acc[item.ticketType] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    const revenueMap = revenueByType.reduce((acc, item) => {
      if (item.ticketType) acc[item.ticketType] = Number(item._sum.totalAmount || 0);
      return acc;
    }, {} as Record<string, number>);

    const ticketBreakdown = ticketTypes.map((tt) => {
      const sold = soldMap[tt.name] || 0;
      const total = tt.quantity || 0;
      const revenue = revenueMap[tt.name] || 0;
      const percentage = total > 0
        ? Math.round((sold / total) * 10000) / 100
        : 0;
      return { ticketType: tt.name, sold, total, revenue, percentage };
    });

    // If there are registrations with ticket types not in ticketTypes JSON, include them too
    const knownTypes = new Set(ticketTypes.map((tt) => tt.name));
    for (const typeName of Object.keys(soldMap)) {
      if (!knownTypes.has(typeName)) {
        const sold = soldMap[typeName] || 0;
        const revenue = revenueMap[typeName] || 0;
        ticketBreakdown.push({
          ticketType: typeName,
          sold,
          total: 0,
          revenue,
          percentage: 0,
        });
      }
    }

    // Attendees by facility
    const facilityGroups = await prisma.eventRegistration.groupBy({
      by: ['lastScanFacility'],
      where: {
        eventId,
        lastScanFacility: { not: null },
      },
      _count: { id: true },
    });

    const attendeesByFacility: Record<string, number> = {};
    for (const group of facilityGroups) {
      if (group.lastScanFacility) {
        attendeesByFacility[group.lastScanFacility] = group._count.id;
      }
    }

    return {
      eventId: event.id,
      eventTitle: event.title,
      totalTickets,
      ticketsSold,
      ticketsAvailable,
      salesRate,
      totalRevenue,
      totalCheckIns,
      checkInRate,
      ticketBreakdown,
      salesTrend: [] as Array<{ date: string; count: number }>,
      checkInTrend: [] as Array<{ date: string; count: number }>,
      attendeesByFacility,
    };
  }

  /**
   * Get system alerts (placeholder - can be enhanced with actual system monitoring)
   */
  static async getSystemAlerts() {
    // Placeholder - can be enhanced with actual system health checks
    // For now, return empty array or basic alerts
    return [
      {
        id: '1',
        type: 'info',
        message: 'System operating normally',
        time: 'Just now',
        severity: 'info',
      },
    ];
  }
}

