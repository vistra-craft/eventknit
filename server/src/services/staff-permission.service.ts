import { prisma } from '../config/database.js';
import { UserRole, Prisma } from '@prisma/client';
import { AuthorizationError, NotFoundError } from '../utils/errors.js';

/**
 * Staff Permission Service
 * Handles permission checks for event-staff assignments
 */
export class StaffPermissionService {
  /**
   * Check if user can access an event
   * - Admin staff can access any event
   * - Organizer can access their own events
   * - Organizer staff can only access events they're assigned to
   */
  static async canAccessEvent(
    userId: string,
    userRole: UserRole,
    eventId: string,
  ): Promise<boolean> {
    // Admin staff (SUPERADMIN, ADMIN_STAFF, MARKETER, SUPPORT, TELLER) can access any event
    const adminStaffRoles: UserRole[] = [
      UserRole.SUPERADMIN,
      UserRole.ADMIN_STAFF,
      UserRole.MARKETER,
      UserRole.SUPPORT,
      UserRole.TELLER,
    ];

    if (adminStaffRoles.includes(userRole)) {
      // Verify event exists
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true },
      });
      return !!event;
    }

    // Organizer can access their own events
    if (userRole === UserRole.ORGANIZER) {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { organizerId: true },
      });

      if (!event) {
        return false;
      }

      return event.organizerId === userId;
    }

    // Organizer staff can only access events they're assigned to
    if (userRole === UserRole.ORGANIZER_STAFF || userRole === UserRole.ORGANIZER_TELLER) {
      const assignment = await prisma.eventStaff.findUnique({
        where: {
          eventId_staffId: {
            eventId,
            staffId: userId,
          },
        },
        select: {
          id: true,
          isActive: true,
        },
      });

      return !!assignment && assignment.isActive;
    }

    return false;
  }

  /**
   * Get all events accessible to a user
   * - Admin staff: all events
   * - Organizer: their own events
   * - Organizer staff: only assigned events
   */
  static async getAccessibleEvents(
    userId: string,
    userRole: UserRole,
    filters?: {
      status?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const adminStaffRoles: UserRole[] = [
      UserRole.SUPERADMIN,
      UserRole.ADMIN_STAFF,
      UserRole.MARKETER,
      UserRole.SUPPORT,
      UserRole.TELLER,
    ];

    // Admin staff can access all events
    if (adminStaffRoles.includes(userRole)) {
      const where: Prisma.EventWhereInput = {};

      if (filters?.status) {
        where.status = filters.status as Prisma.EventStatus;
      }

      if (filters?.startDate || filters?.endDate) {
        where.startDate = {};
        if (filters.startDate) {
          where.startDate.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.startDate.lte = filters.endDate;
        }
      }

      return prisma.event.findMany({
        where,
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          status: true,
          location: true,
          venue: true,
        },
        orderBy: {
          startDate: 'desc',
        },
      });
    }

    // Organizer can access their own events
    if (userRole === UserRole.ORGANIZER) {
      const where: Prisma.EventWhereInput = {
        organizerId: userId,
      };

      if (filters?.status) {
        where.status = filters.status as Prisma.EventStatus;
      }

      if (filters?.startDate || filters?.endDate) {
        where.startDate = {};
        if (filters.startDate) {
          where.startDate.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.startDate.lte = filters.endDate;
        }
      }

      return prisma.event.findMany({
        where,
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          status: true,
          location: true,
          venue: true,
        },
        orderBy: {
          startDate: 'desc',
        },
      });
    }

    // Organizer staff can only access assigned events
    if (userRole === UserRole.ORGANIZER_STAFF || userRole === UserRole.ORGANIZER_TELLER) {
      const assignments = await prisma.eventStaff.findMany({
        where: {
          staffId: userId,
          isActive: true,
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
              status: true,
              location: true,
              venue: true,
            },
          },
        },
        orderBy: {
          assignedAt: 'desc',
        },
      });

      let events = assignments.map((a) => a.event);

      // Apply filters
      if (filters?.status) {
        events = events.filter((e) => e.status === filters.status);
      }

      if (filters?.startDate) {
        events = events.filter((e) => e.startDate >= filters.startDate!);
      }

      if (filters?.endDate) {
        events = events.filter((e) => e.startDate <= filters.endDate!);
      }

      return events;
    }

    return [];
  }

  /**
   * Check if staff is assigned to event
   */
  static async isStaffAssignedToEvent(
    staffId: string,
    eventId: string,
  ): Promise<boolean> {
    const assignment = await prisma.eventStaff.findUnique({
      where: {
        eventId_staffId: {
          eventId,
          staffId,
        },
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    return !!assignment && assignment.isActive;
  }

  /**
   * Check if organizer can access their staff member
   */
  static async canOrganizerAccessStaff(
    organizerId: string,
    staffId: string,
  ): Promise<boolean> {
    // Get organizer
    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
      select: {
        id: true,
        role: true,
        organizationName: true,
      },
    });

    if (!organizer || organizer.role !== UserRole.ORGANIZER) {
      return false;
    }

    // Get staff member
    const staff = await prisma.user.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        role: true,
        organizationName: true,
      },
    });

    if (!staff) {
      return false;
    }

    // Check if staff is organizer staff
    if (
      staff.role !== UserRole.ORGANIZER_STAFF &&
      staff.role !== UserRole.ORGANIZER_TELLER
    ) {
      return false;
    }

    // Check if staff belongs to organizer's organization
    return staff.organizationName === organizer.organizationName;
  }

  /**
   * Check if organizer can access their event
   */
  static async canOrganizerAccessEvent(
    organizerId: string,
    eventId: string,
  ): Promise<boolean> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizerId: true,
      },
    });

    if (!event) {
      return false;
    }

    return event.organizerId === organizerId;
  }

  /**
   * Validate event access and throw error if not allowed
   */
  static async validateEventAccess(
    userId: string,
    userRole: UserRole,
    eventId: string,
  ): Promise<void> {
    const canAccess = await this.canAccessEvent(userId, userRole, eventId);

    if (!canAccess) {
      throw new AuthorizationError('You do not have access to this event');
    }
  }

  /**
   * Validate organizer can access their staff
   */
  static async validateOrganizerStaffAccess(
    organizerId: string,
    staffId: string,
  ): Promise<void> {
    const canAccess = await this.canOrganizerAccessStaff(organizerId, staffId);

    if (!canAccess) {
      throw new AuthorizationError('You do not have access to this staff member');
    }
  }

  /**
   * Validate organizer can access their event
   */
  static async validateOrganizerEventAccess(
    organizerId: string,
    eventId: string,
  ): Promise<void> {
    const canAccess = await this.canOrganizerAccessEvent(organizerId, eventId);

    if (!canAccess) {
      throw new AuthorizationError('You do not have access to this event');
    }
  }

  /**
   * Get staff's event assignment details
   */
  static async getStaffEventAssignment(
    staffId: string,
    eventId: string,
  ) {
    const assignment = await prisma.eventStaff.findUnique({
      where: {
        eventId_staffId: {
          eventId,
          staffId,
        },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundError('Staff assignment not found');
    }

    return assignment;
  }

  /**
   * Get all event assignments for a staff member
   */
  static async getStaffAssignments(
    staffId: string,
    filters?: {
      isActive?: boolean;
      eventStatus?: string;
    },
  ) {
    const where: Prisma.EventStaffWhereInput = {
      staffId,
    };

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.eventStatus) {
      where.event = {
        status: filters.eventStatus as Prisma.EventStatus,
      };
    }

    return prisma.eventStaff.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            status: true,
            location: true,
            venue: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });
  }
}

