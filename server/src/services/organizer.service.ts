import { prisma } from '../config/database';
import { hashPassword } from '../utils/password';
import { UserRole, UserStatus } from '@prisma/client';
import {
  NotFoundError,
  ConflictError,
  AuthorizationError,
} from '../utils/errors';
import {
  validateRoleCreation,
  validateUserDeletion,
} from '../utils/privileges';
import { createAuditLog, AuditActions } from '../utils/audit';
import { logger } from '../utils/logger';

export interface CreateStaffData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'ORGANIZER_STAFF' | 'ORGANIZER_TELLER';
}

export interface UpdateStaffData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: 'ORGANIZER_STAFF' | 'ORGANIZER_TELLER';
  status?: UserStatus;
}

export class OrganizerService {
  /**
   * Create staff member (organizer function)
   */
  static async createStaff(
    data: CreateStaffData,
    organizerId: string,
    organizerRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Validate organizer can create staff
    if (organizerRole !== UserRole.ORGANIZER &&
        organizerRole !== UserRole.SUPERADMIN &&
        organizerRole !== UserRole.ADMIN_STAFF) {
      throw new AuthorizationError('Only organizers can create staff members');
    }

    // Validate role creation permission
    validateRoleCreation(organizerRole, data.role);

    // Get organizer info
    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
      select: {
        id: true,
        role: true,
        organizationName: true,
      },
    });

    if (!organizer) {
      throw new NotFoundError('Organizer not found');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create staff member
    const staff = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        role: data.role,
        status: UserStatus.ACTIVE,
        organizationName: organizer.organizationName,
        // managedBy: organizerId, // Will be available after Prisma migration
        createdBy: organizerId,
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
        createdAt: true,
        updatedAt: true,
      },
    });

    // Audit log
    await createAuditLog({
      userId: organizerId,
      action: AuditActions.STAFF_CREATED,
      entity: 'User',
      entityId: staff.id,
      metadata: {
        staffRole: data.role,
        staffEmail: data.email,
        organizerId,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Staff created by organizer: ${staff.email} with role ${staff.role}`);

    return staff;
  }

  /**
   * Get all staff members for an organizer
   */
  static async getStaff(organizerId: string, organizerRole: UserRole) {
    // Validate organizer can view staff
    if (organizerRole !== UserRole.ORGANIZER &&
        organizerRole !== UserRole.SUPERADMIN &&
        organizerRole !== UserRole.ADMIN_STAFF) {
      throw new AuthorizationError('Only organizers can view staff members');
    }

    // Get organizer info for organizationName
    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
      select: {
        id: true,
        organizationName: true,
      },
    });

    if (!organizer) {
      throw new NotFoundError('Organizer not found');
    }

    // Note: Will use managedBy after Prisma migration
    // For now, filter by organizationName
    const staff = await prisma.user.findMany({
      where: {
        // managedBy: organizerId, // Will be available after Prisma migration
        organizationName: organizer.organizationName,
        deletedAt: null,
        role: {
          in: [UserRole.ORGANIZER_STAFF, UserRole.ORGANIZER_TELLER],
        },
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
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return staff;
  }

  /**
   * Get staff member by ID
   */
  static async getStaffById(staffId: string, organizerId: string, organizerRole: UserRole) {
    // Validate organizer can view staff
    if (organizerRole !== UserRole.ORGANIZER &&
        organizerRole !== UserRole.SUPERADMIN &&
        organizerRole !== UserRole.ADMIN_STAFF) {
      throw new AuthorizationError('Only organizers can view staff members');
    }

    const staff = await prisma.user.findUnique({
      where: { id: staffId },
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
        createdAt: true,
        updatedAt: true,
        // managedBy: true, // Will be available after Prisma migration
      },
    });

    if (!staff) {
      throw new NotFoundError('Staff member not found');
    }

    // Get organizer info for organizationName check
    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
      select: {
        id: true,
        organizationName: true,
      },
    });

    if (!organizer) {
      throw new NotFoundError('Organizer not found');
    }

    // Verify staff belongs to organizer (unless admin)
    // Note: Will use managedBy after Prisma migration
    if (organizerRole !== UserRole.SUPERADMIN && organizerRole !== UserRole.ADMIN_STAFF) {
      // For now, check organizationName match
      if (staff.organizationName !== organizer.organizationName) {
        throw new AuthorizationError('You do not have permission to view this staff member');
      }
      // After migration: if (staff.managedBy !== organizerId) { ... }
    }

    return staff;
  }

  /**
   * Update staff member
   */
  static async updateStaff(
    staffId: string,
    data: UpdateStaffData,
    organizerId: string,
    organizerRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get staff member
    const staff = await prisma.user.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        organizationName: true,
        role: true,
        status: true,
      },
    });

    if (!staff) {
      throw new NotFoundError('Staff member not found');
    }

    // Get organizer info for organizationName check
    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
      select: {
        id: true,
        organizationName: true,
      },
    });

    if (!organizer) {
      throw new NotFoundError('Organizer not found');
    }

    // Verify staff belongs to organizer (unless admin)
    // Note: Will use managedBy after Prisma migration
    if (organizerRole !== UserRole.SUPERADMIN && organizerRole !== UserRole.ADMIN_STAFF) {
      // For now, check organizationName match
      if (staff.organizationName !== organizer.organizationName) {
        throw new AuthorizationError('You do not have permission to modify this staff member');
      }
      // After migration: if (staff.managedBy !== organizerId) { ... }
    }

    // Validate role change if applicable
    if (data.role && data.role !== staff.role) {
      validateRoleCreation(organizerRole, data.role);
    }

    // Prepare update data
    const updateData: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string | null;
      role?: UserRole;
      status?: UserStatus;
      updatedBy?: string;
    } = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName.trim();
    if (data.lastName !== undefined) updateData.lastName = data.lastName.trim();
    if (data.phoneNumber !== undefined) {
      updateData.phoneNumber = data.phoneNumber && data.phoneNumber.trim() !== '' ? data.phoneNumber.trim() : null;
    }
    if (data.role !== undefined) updateData.role = data.role;
    if (data.status !== undefined) updateData.status = data.status;
    updateData.updatedBy = organizerId;

    // Update staff
    const updatedStaff = await prisma.user.update({
      where: { id: staffId },
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
        createdAt: true,
        updatedAt: true,
      },
    });

    // Audit log
    const metadata: Record<string, unknown> = {};
    if (data.role && data.role !== staff.role) {
      metadata.roleChanged = true;
      metadata.oldRole = staff.role;
      metadata.newRole = data.role;
    }
    if (data.status && data.status !== staff.status) {
      metadata.statusChanged = true;
      metadata.oldStatus = staff.status;
      metadata.newStatus = data.status;
    }

    await createAuditLog({
      userId: organizerId,
      action: AuditActions.USER_UPDATED,
      entity: 'User',
      entityId: staffId,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      ipAddress,
      userAgent,
    });

    logger.info(`Staff updated by organizer: ${updatedStaff.email}`);

    return updatedStaff;
  }

  /**
   * Delete staff member (soft delete)
   */
  static async deleteStaff(
    staffId: string,
    organizerId: string,
    organizerRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get staff member
    const staff = await prisma.user.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        email: true,
        organizationName: true,
        role: true,
      },
    });

    if (!staff) {
      throw new NotFoundError('Staff member not found');
    }

    // Get organizer info for organizationName check
    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
      select: {
        id: true,
        organizationName: true,
      },
    });

    if (!organizer) {
      throw new NotFoundError('Organizer not found');
    }

    // Verify staff belongs to organizer (unless admin)
    // Note: Will use managedBy after Prisma migration
    if (organizerRole !== UserRole.SUPERADMIN && organizerRole !== UserRole.ADMIN_STAFF) {
      // For now, check organizationName match
      if (staff.organizationName !== organizer.organizationName) {
        throw new AuthorizationError('You do not have permission to delete this staff member');
      }
      // After migration: if (staff.managedBy !== organizerId) { ... }
    }

    // Validate deletion permission
    validateUserDeletion(organizerRole, staff.role);

    // Soft delete
    await prisma.user.update({
      where: { id: staffId },
      data: {
        deletedAt: new Date(),
        updatedBy: organizerId,
      },
    });

    // Audit log
    await createAuditLog({
      userId: organizerId,
      action: AuditActions.STAFF_DELETED,
      entity: 'User',
      entityId: staffId,
      metadata: {
        staffRole: staff.role,
        staffEmail: staff.email,
        organizerId,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Staff deleted by organizer: ${staff.email}`);
  }

  /**
   * Deactivate staff member (set status to DEACTIVATED)
   * DEACTIVATED users can login but cannot perform actions
   */
  static async deactivateStaff(
    staffId: string,
    organizerId: string,
    organizerRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.updateStaff(
      staffId,
      { status: UserStatus.DEACTIVATED },
      organizerId,
      organizerRole,
      ipAddress,
      userAgent,
    );

    // Additional audit log for deactivation
    await createAuditLog({
      userId: organizerId,
      action: AuditActions.STAFF_DEACTIVATED,
      entity: 'User',
      entityId: staffId,
      metadata: {
        organizerId,
      },
      ipAddress,
      userAgent,
    });
  }
}

