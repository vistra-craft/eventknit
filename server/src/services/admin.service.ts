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
            in: ['ADMIN_STAFF', 'MARKETER', 'SUPPORT', 'TELLER'],
          },
          status: 'ACTIVE',
        },
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          role: {
            in: ['ADMIN_STAFF', 'MARKETER', 'SUPPORT', 'TELLER'],
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

    return {
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

