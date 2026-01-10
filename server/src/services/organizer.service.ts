import { prisma } from '../config/database.js';
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
  customRoleId?: string | null; // Assign or remove custom role
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
        customRoleId: true,
        customRole: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
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

    // Validate custom role if provided
    if (data.customRoleId !== undefined && data.customRoleId !== null) {
      const customRole = await prisma.teamRoleTemplate.findFirst({
        where: {
          id: data.customRoleId,
          organizerId,
          isActive: true,
        },
      });

      if (!customRole) {
        throw new NotFoundError('Custom role not found or not active');
      }
    }

    // Prepare update data
    const updateData: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string | null;
      role?: UserRole;
      customRoleId?: string | null;
      status?: UserStatus;
      updatedBy?: string;
    } = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName.trim();
    if (data.lastName !== undefined) updateData.lastName = data.lastName.trim();
    if (data.phoneNumber !== undefined) {
      updateData.phoneNumber = data.phoneNumber && data.phoneNumber.trim() !== '' ? data.phoneNumber.trim() : null;
    }
    if (data.role !== undefined) updateData.role = data.role;
    if (data.customRoleId !== undefined) updateData.customRoleId = data.customRoleId;
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
   * Check if organizer has created at least one event (any status)
   */
  static async hasEvent(organizerId: string): Promise<boolean> {
    const event = await prisma.event.findFirst({
      where: {
        organizerId,
        deletedAt: null,
      },
      select: { id: true },
    });
    return !!event;
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate stats
    const totalEvents = events.length;

    // Count speakers, exhibitors (sponsors) from all events
    let totalSpeakers = 0;
    let totalExhibitors = 0;
    let totalAttendees = 0;
    let totalRevenue = 0;

    // For performance insights
    let bestPerformingEvent: { id: string; title: string; conversionRate: number } | null = null;
    let bestConversionRate = 0;
    let totalCapacityUtilization = 0;
    let eventsWithCapacity = 0;

    // For revenue growth calculation
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    let currentPeriodRevenue = 0;
    let previousPeriodRevenue = 0;

    // For health score
    let totalRegistrationRate = 0;
    let eventsWithRegistrations = 0;
    let totalSpeakerConfirmationRate = 0;
    let eventsWithSpeakers = 0;
    let totalSponsorEngagementRate = 0;
    let eventsWithSponsors = 0;

    // For upcoming deadlines
    const upcomingDeadlines: Array<{
      type: string;
      eventId: string;
      eventTitle: string;
      deadlineDate: string;
      daysRemaining: number;
    }> = [];

    events.forEach(event => {
      // Count speakers
      const speakers = event.speakers ? (event.speakers as Array<{ name: string; title: string; bio: string }>) : [];
      totalSpeakers += speakers.length;

      // Count exhibitors/sponsors
      const sponsors = event.sponsors ? (event.sponsors as Array<{ name: string; level: string; logo: string }>) : [];
      totalExhibitors += sponsors.length;

      // Count attendees (confirmed registrations)
      const confirmedRegistrations = event.registrations.filter(r => r.status === 'CONFIRMED');
      const totalRegistrations = event.registrations.length;
      const attendeeCount = confirmedRegistrations.reduce((sum, reg) => sum + reg.quantity, 0);
      totalAttendees += attendeeCount;

      // Calculate revenue (sum of totalAmount from confirmed registrations)
      const eventRevenue = confirmedRegistrations.reduce((sum, reg) => {
        return sum + Number(reg.totalAmount);
      }, 0);
      totalRevenue += eventRevenue;

      // Calculate conversion rate for best performing event (using attendee count)
      if (event.capacity && event.capacity > 0 && attendeeCount > 0) {
        const conversionRate = (attendeeCount / event.capacity) * 100;
        if (conversionRate > bestConversionRate) {
          bestConversionRate = conversionRate;
          bestPerformingEvent = {
            id: event.id,
            title: event.title,
            conversionRate: Math.round(conversionRate * 10) / 10, // Round to 1 decimal
          };
        }
      }

      // Calculate capacity utilization for average attendance
      if (event.capacity && event.capacity > 0) {
        const utilization = (attendeeCount / event.capacity) * 100;
        totalCapacityUtilization += utilization;
        eventsWithCapacity++;
      }

      // Revenue growth (last 30 days vs previous 30 days)
      confirmedRegistrations.forEach(reg => {
        const regDate = reg.createdAt;
        if (regDate >= thirtyDaysAgo) {
          currentPeriodRevenue += Number(reg.totalAmount);
        } else if (regDate >= sixtyDaysAgo && regDate < thirtyDaysAgo) {
          previousPeriodRevenue += Number(reg.totalAmount);
        }
      });

      // Registration rate for health score
      if (event.capacity && event.capacity > 0) {
        const registrationRate = (totalRegistrations / event.capacity) * 100;
        totalRegistrationRate += Math.min(registrationRate, 100); // Cap at 100%
        eventsWithRegistrations++;
      } else if (totalRegistrations > 0) {
        // For unlimited capacity events, assume 100% if there are registrations
        totalRegistrationRate += 100;
        eventsWithRegistrations++;
      }

      // Speaker confirmation rate (assume all speakers are confirmed if they exist)
      if (speakers.length > 0) {
        // For now, we'll assume 100% if speakers exist (since we don't track confirmation status)
        totalSpeakerConfirmationRate += 100;
        eventsWithSpeakers++;
      }

      // Sponsor engagement rate (assume 100% if sponsors exist)
      if (sponsors.length > 0) {
        totalSponsorEngagementRate += 100;
        eventsWithSponsors++;
      }

      // Collect upcoming deadlines
      // Registration deadline
      if (event.registrationDeadline && new Date(event.registrationDeadline) > now) {
        const deadlineDate = new Date(event.registrationDeadline);
        const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysRemaining <= 60) { // Only show deadlines within 60 days
          upcomingDeadlines.push({
            type: 'registration_deadline',
            eventId: event.id,
            eventTitle: event.title,
            deadlineDate: event.registrationDeadline.toISOString(),
            daysRemaining,
          });
        }
      }

      // Early bird pricing deadlines from ticketTypes
      if (event.ticketTypes) {
        try {
          const ticketTypes = Array.isArray(event.ticketTypes)
            ? event.ticketTypes
            : typeof event.ticketTypes === 'string'
              ? JSON.parse(event.ticketTypes)
              : [];

          ticketTypes.forEach((ticketType: any) => {
            if (ticketType.availableUntil) {
              const deadlineDate = new Date(ticketType.availableUntil);
              if (deadlineDate > now) {
                const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                if (daysRemaining <= 60) {
                  upcomingDeadlines.push({
                    type: 'early_bird_pricing',
                    eventId: event.id,
                    eventTitle: event.title,
                    deadlineDate: deadlineDate.toISOString(),
                    daysRemaining,
                  });
                }
              }
            }
          });
        } catch (_error) {
          // Invalid ticketTypes JSON, skip
        }
      }
    });

    // Calculate performance insights
    const performanceInsights: {
      bestPerformingEvent: { id: string; title: string; conversionRate: number } | null;
      revenueGrowth: { percentage: number; period: '30d' | '90d' | '1y' };
      averageAttendance: { percentage: number; totalEvents: number };
    } = {
      bestPerformingEvent,
      revenueGrowth: {
        percentage: previousPeriodRevenue > 0
          ? Math.round(((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100)
          : currentPeriodRevenue > 0 ? 100 : 0,
        period: '30d',
      },
      averageAttendance: {
        percentage: eventsWithCapacity > 0
          ? Math.round((totalCapacityUtilization / eventsWithCapacity) * 10) / 10
          : 0,
        totalEvents: eventsWithCapacity,
      },
    };

    // Sort deadlines by days remaining (ascending)
    upcomingDeadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);
    // Take top 3
    const topDeadlines = upcomingDeadlines.slice(0, 3);

    // Calculate health score
    const registrationRate = eventsWithRegistrations > 0
      ? Math.round((totalRegistrationRate / eventsWithRegistrations) * 10) / 10
      : 0;
    const speakerConfirmation = eventsWithSpeakers > 0
      ? Math.round((totalSpeakerConfirmationRate / eventsWithSpeakers) * 10) / 10
      : 0;
    const sponsorEngagement = eventsWithSponsors > 0
      ? Math.round((totalSponsorEngagementRate / eventsWithSponsors) * 10) / 10
      : 0;

    // Overall health score is weighted average
    const overallHealthScore = Math.round(
      (registrationRate * 0.4 + speakerConfirmation * 0.3 + sponsorEngagement * 0.3),
    );

    const healthScore = {
      overall: overallHealthScore,
      components: {
        registrationRate,
        speakerConfirmation,
        sponsorEngagement,
      },
    };

    return {
      totalEvents,
      totalSpeakers,
      totalExhibitors,
      totalAttendees,
      totalRevenue,
      performanceInsights,
      upcomingDeadlines: topDeadlines,
      healthScore,
    };
  }

  /**
   * Get organizer events with dashboard data
   */
  static async getDashboardEvents(
    organizerId: string,
    organizerRole: UserRole,
    filters?: {
      page?: number;
      limit?: number;
    },
  ) {
    // Validate organizer can view dashboard
    if (organizerRole !== UserRole.ORGANIZER &&
      organizerRole !== UserRole.SUPERADMIN &&
      organizerRole !== UserRole.ADMIN_STAFF) {
      throw new AuthorizationError('Only organizers can view dashboard');
    }

    const limit = filters?.limit || 12; // Default 12 for infinite scroll
    const page = filters?.page || 1;
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
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
        skip,
      }),
      prisma.event.count({
        where: {
          organizerId,
          deletedAt: null,
        },
      }),
    ]);

    // Transform events with dashboard data
    const dashboardEvents = events.map(event => {
      const speakers = (event.speakers as Array<{ name: string; title: string; bio: string }>) || [];
      const sponsors = (event.sponsors as Array<{ name: string; level: string; logo: string }>) || [];
      const confirmedRegistrations = event.registrations.filter(r => r.status === 'CONFIRMED');
      const attendees = confirmedRegistrations.reduce((sum, reg) => sum + reg.quantity, 0);
      const revenue = confirmedRegistrations.reduce((sum, reg) => sum + Number(reg.totalAmount), 0);

      // Determine status based on dates and platform rules (Eventbrite-style)
      let status = 'upcoming';
      const now = new Date();
      switch (event.status) {
      case 'CANCELLED':
        status = 'cancelled';
        break;
      case 'REJECTED':
        status = 'unpublished';
        break;
      case 'PENDING':
        status = 'unpublished';
        break;
      case 'COMPLETED':
        status = 'completed';
        break;
      case 'APPROVED':
      default:
        if (event.endDate && new Date(event.endDate) < now) {
          status = 'completed';
        } else if (event.startDate && new Date(event.startDate) <= now) {
          status = 'active';
        } else if (event.status === 'APPROVED') {
          status = 'active';
        }
        break;
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

    const totalPages = Math.ceil(total / limit);

    return {
      events: dashboardEvents,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    };
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
      page?: number;
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
    // Support both page and offset for backward compatibility
    let skip = 0;
    if (filters.page !== undefined) {
      skip = (filters.page - 1) * limit;
    } else if (filters.offset !== undefined) {
      skip = filters.offset;
    }

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
        skip,
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

    const page = filters.page !== undefined ? filters.page : Math.floor(skip / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    return {
      events: transformedEvents,
      total,
      limit,
      page,
      totalPages,
      hasMore: page < totalPages,
      // Keep offset for backward compatibility
      offset: skip,
    };
  }
}