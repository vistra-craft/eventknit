import { prisma } from '../config/database';
import { hashPassword } from '../utils/password.js';
import { UserRole, UserStatus } from '@prisma/client';
import {
  NotFoundError,
  ConflictError,
  AuthorizationError,
} from '../utils/errors.js';
import {
  validateRoleCreation,
  validateUserDeletion,
} from '../utils/privileges.js';
import { createAuditLog, AuditActions } from '../utils/audit.js';
import { logger } from '../utils/logger.js';

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

  /**
   * Get organizer dashboard stats
   */
  static async getDashboardStats(organizerId: string, organizerRole: UserRole) {
    // Validate organizer can view dashboard
    if (organizerRole !== UserRole.ORGANIZER &&
        organizerRole !== UserRole.SUPERADMIN &&
        organizerRole !== UserRole.ADMIN_STAFF) {
      throw new AuthorizationError('Only organizers can view dashboard');
    }

    // Get organizer's events
    const events = await prisma.event.findMany({
      where: {
        organizerId,
        deletedAt: null,
      },
      include: {
        registrations: {
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING'],
            },
          },
        },
      },
    });

    // Calculate stats
    const totalEvents = events.length;
    
    // Count speakers, exhibitors (sponsors) from all events
    let totalSpeakers = 0;
    let totalExhibitors = 0;
    let totalAttendees = 0;
    let totalRevenue = 0;

    events.forEach(event => {
      // Count speakers
      if (event.speakers) {
        const speakers = event.speakers as Array<{ name: string; title: string; bio: string }>;
        totalSpeakers += speakers.length;
      }

      // Count exhibitors/sponsors
      if (event.sponsors) {
        const sponsors = event.sponsors as Array<{ name: string; level: string; logo: string }>;
        totalExhibitors += sponsors.length;
      }

      // Count attendees (confirmed registrations)
      const confirmedRegistrations = event.registrations.filter(r => r.status === 'CONFIRMED');
      totalAttendees += confirmedRegistrations.reduce((sum, reg) => sum + reg.quantity, 0);

      // Calculate revenue (sum of totalAmount from confirmed registrations)
      totalRevenue += confirmedRegistrations.reduce((sum, reg) => {
        return sum + Number(reg.totalAmount);
      }, 0);
    });

    return {
      totalEvents,
      totalSpeakers,
      totalExhibitors,
      totalAttendees,
      totalRevenue,
    };
  }

  /**
   * Get organizer events with dashboard data
   */
  static async getDashboardEvents(organizerId: string, organizerRole: UserRole, limit: number = 10) {
    // Validate organizer can view dashboard
    if (organizerRole !== UserRole.ORGANIZER &&
        organizerRole !== UserRole.SUPERADMIN &&
        organizerRole !== UserRole.ADMIN_STAFF) {
      throw new AuthorizationError('Only organizers can view dashboard');
    }

    const events = await prisma.event.findMany({
      where: {
        organizerId,
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
        registrations: {
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING'],
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Transform events with dashboard data
    const dashboardEvents = events.map(event => {
      const speakers = (event.speakers as Array<{ name: string; title: string; bio: string }>) || [];
      const sponsors = (event.sponsors as Array<{ name: string; level: string; logo: string }>) || [];
      const confirmedRegistrations = event.registrations.filter(r => r.status === 'CONFIRMED');
      const attendees = confirmedRegistrations.reduce((sum, reg) => sum + reg.quantity, 0);
      const revenue = confirmedRegistrations.reduce((sum, reg) => sum + Number(reg.totalAmount), 0);

      // Determine status based on dates
      let status = 'upcoming';
      const now = new Date();
      if (event.status === 'COMPLETED') {
        status = 'completed';
      } else if (event.endDate && new Date(event.endDate) < now) {
        status = 'completed';
      } else if (event.startDate && new Date(event.startDate) <= now) {
        status = 'active';
      } else if (event.status === 'APPROVED') {
        status = 'active';
      } else if (event.status === 'PENDING') {
        status = 'pending';
      }

      return {
        id: event.id,
        title: event.title,
        date: event.startDate ? new Date(event.startDate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
        }) : '',
        time: event.startTime && event.endTime 
          ? `${event.startTime} - ${event.endTime}`
          : event.startTime || '',
        location: event.location,
        venue: event.venue || '',
        status,
        attendees,
        capacity: event.capacity || 0,
        revenue,
        views: 0, // TODO: Add view tracking
        conversion: event.capacity && event.capacity > 0 
          ? ((attendees / event.capacity) * 100).toFixed(1)
          : '0',
        speakers: speakers.length,
        exhibitors: sponsors.length,
        sponsors: sponsors.length,
        image: event.image || '',
        description: event.description,
        category: event.category || '',
        organizer: event.organizer.organizationName || `${event.organizer.firstName} ${event.organizer.lastName}`,
        price: event.isFree ? 'Free' : event.price ? `$${Number(event.price)}` : 'N/A',
        rating: 0, // TODO: Add rating system
        fullDescription: event.fullDescription || event.description,
        duration: event.duration || '',
        ageRestriction: event.ageRestriction || '',
      };
    });

    return dashboardEvents;
  }

  /**
   * Get all organizer events (with filters)
   */
  static async getOrganizerEvents(
    organizerId: string,
    organizerRole: UserRole,
    filters: {
      status?: string;
      category?: string;
      search?: string;
      limit?: number;
      offset?: number;
      upcoming?: boolean; // true for upcoming, false for past
    } = {},
  ) {
    // Validate organizer can view events
    if (organizerRole !== UserRole.ORGANIZER &&
        organizerRole !== UserRole.SUPERADMIN &&
        organizerRole !== UserRole.ADMIN_STAFF) {
      throw new AuthorizationError('Only organizers can view their events');
    }

    const where: Record<string, unknown> = {
      organizerId,
      deletedAt: null,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    // Filter by date (upcoming vs past) - must be before search OR
    const now = new Date();
    if (filters.upcoming === true) {
      where.startDate = { gte: now };
    } else if (filters.upcoming === false) {
      where.AND = [
        {
          OR: [
            { endDate: { lt: now } },
            {
              AND: [
                { endDate: null },
                { startDate: { lt: now } },
              ],
            },
          ],
        },
      ];
    }

    // Add search filter
    if (filters.search) {
      const searchConditions = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ];
      
      if (where.AND && Array.isArray(where.AND)) {
        where.AND.push({ OR: searchConditions });
      } else {
        where.OR = searchConditions;
      }
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              organizationName: true,
            },
          },
          registrations: {
            where: {
              status: {
                in: ['CONFIRMED', 'PENDING'],
              },
            },
          },
          _count: {
            select: {
              registrations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.event.count({ where }),
    ]);

    // Transform events with dashboard data
    const transformedEvents = events.map(event => {
      const speakers = (event.speakers as Array<{ name: string; title: string; bio: string }>) || [];
      const sponsors = (event.sponsors as Array<{ name: string; level: string; logo: string }>) || [];
      const confirmedRegistrations = event.registrations.filter(r => r.status === 'CONFIRMED');
      const attendees = confirmedRegistrations.reduce((sum, reg) => sum + reg.quantity, 0);
      const revenue = confirmedRegistrations.reduce((sum, reg) => sum + Number(reg.totalAmount), 0);

      // Determine status based on dates
      let status = 'upcoming';
      if (event.status === 'COMPLETED' || event.status === 'CANCELLED') {
        status = event.status.toLowerCase();
      } else if (event.endDate && new Date(event.endDate) < now) {
        status = 'completed';
      } else if (event.startDate && new Date(event.startDate) <= now) {
        status = 'active';
      } else if (event.status === 'APPROVED') {
        status = 'active';
      } else if (event.status === 'PENDING') {
        status = 'pending';
      }

      return {
        id: event.id,
        title: event.title,
        date: event.startDate ? new Date(event.startDate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
        }) : '',
        time: event.startTime && event.endTime 
          ? `${event.startTime} - ${event.endTime}`
          : event.startTime || '',
        location: event.location,
        venue: event.venue || '',
        status,
        attendees,
        capacity: event.capacity || 0,
        revenue,
        views: 0, // TODO: Add view tracking
        conversion: event.capacity && event.capacity > 0 
          ? ((attendees / event.capacity) * 100).toFixed(1)
          : '0',
        speakers: speakers.length,
        exhibitors: sponsors.length,
        sponsors: sponsors.length,
        image: event.image || '',
        description: event.description,
        category: event.category || '',
        organizer: event.organizer.organizationName || `${event.organizer.firstName} ${event.organizer.lastName}`,
        price: event.isFree ? 'Free' : event.price ? `$${Number(event.price)}` : 'N/A',
        rating: 0, // TODO: Add rating system
        fullDescription: event.fullDescription || event.description,
        duration: event.duration || '',
        ageRestriction: event.ageRestriction || '',
      };
    });

    return {
      events: transformedEvents,
      total,
      limit,
      offset,
    };
  }
}

