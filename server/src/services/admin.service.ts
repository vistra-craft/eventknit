import { prisma } from '../config/database';
import { hashPassword } from '../utils/password';
import { UserRole, UserStatus } from '@prisma/client';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../utils/errors';
import {
  validateRoleCreation,
  validateUserModification,
  validateUserDeletion,
} from '../utils/privileges';
import { createAuditLog, AuditActions } from '../utils/audit';
import { logger } from '../utils/logger';

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
   * Create a new user (admin function)
   */
  static async createUser(
    data: CreateUserData,
    createdBy: string,
    createdByRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
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
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
}

