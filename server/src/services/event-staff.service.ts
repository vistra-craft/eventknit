import { prisma } from '../config/database.js';
import { UserRole, UserStatus, EventStatus, Prisma } from '@prisma/client';
import {
  NotFoundError,
  ConflictError,
  AuthorizationError,
  ValidationError,
} from '../utils/errors.js';
import { createAuditLog, AuditActions } from '../utils/audit.js';
import { logger } from '../utils/logger.js';

// Valid event-specific roles
export const EVENT_STAFF_ROLES = [
  'SCANNER',
  'SUPPORT',
  'MANAGER',
  'COORDINATOR',
  'SUPERVISOR',
  'TICKET_SELLER',
] as const;

export type EventStaffRole = typeof EVENT_STAFF_ROLES[number];

export interface AssignStaffToEventData {
  staffId: string;
  role: EventStaffRole;
  notes?: string;
  shiftStart?: Date | string;
  shiftEnd?: Date | string;
  facility?: string;
}

export interface UpdateStaffAssignmentData {
  role?: EventStaffRole;
  notes?: string;
  isActive?: boolean;
  shiftStart?: Date | string | null;
  shiftEnd?: Date | string | null;
  facility?: string | null;
}

export interface EventStaffFilters {
  role?: string;
  staffType?: 'ADMIN_STAFF' | 'ORGANIZER_STAFF';
  isActive?: boolean;
}

export interface StaffEventsFilters {
  status?: EventStatus;
  startDate?: Date | string;
  endDate?: Date | string;
}

export class EventStaffService {
  /**
   * Determine staff type from user role
   */
  private static getStaffType(userRole: UserRole): 'ADMIN_STAFF' | 'ORGANIZER_STAFF' {
    const adminStaffRoles: UserRole[] = [
      UserRole.ADMIN_STAFF,
      UserRole.MARKETER,
      UserRole.SUPPORT,
      UserRole.TELLER,
    ];
    
    if (adminStaffRoles.includes(userRole)) {
      return 'ADMIN_STAFF';
    }
    
    const organizerStaffRoles: UserRole[] = [
      UserRole.ORGANIZER_STAFF,
      UserRole.ORGANIZER_TELLER,
    ];
    
    if (organizerStaffRoles.includes(userRole)) {
      return 'ORGANIZER_STAFF';
    }
    
    throw new ValidationError(`User role ${userRole} is not a valid staff role`);
  }

  /**
   * Validate event-specific role
   */
  private static validateEventRole(role: string): void {
    if (!EVENT_STAFF_ROLES.includes(role as EventStaffRole)) {
      throw new ValidationError(
        `Invalid event role: ${role}. Valid roles are: ${EVENT_STAFF_ROLES.join(', ')}`,
      );
    }
  }

  /**
   * Validate organizer can assign their staff to their event
   */
  private static async validateOrganizerStaffAssignment(
    staffId: string,
    eventId: string,
    organizerId: string,
  ): Promise<void> {
    // Get staff member
    const staff = await prisma.user.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        role: true,
        organizationName: true,
        status: true,
      },
    });

    if (!staff) {
      throw new NotFoundError('Staff member not found');
    }

    // Check if staff is organizer staff
    if (staff.role !== UserRole.ORGANIZER_STAFF && staff.role !== UserRole.ORGANIZER_TELLER) {
      throw new ValidationError('Staff member must be an organizer staff member');
    }

    // Check if staff belongs to organizer's organization
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

    if (staff.organizationName !== organizer.organizationName) {
      throw new AuthorizationError('Staff member does not belong to your organization');
    }

    // Check if event belongs to organizer
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizerId: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new AuthorizationError('Event does not belong to you');
    }

    // Check staff status
    if (staff.status !== UserStatus.ACTIVE) {
      throw new ValidationError('Staff member is not active');
    }
  }

  /**
   * Assign staff to event
   */
  static async assignStaffToEvent(
    eventId: string,
    data: AssignStaffToEventData,
    assignedBy: string,
    assignedByRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Validate event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizerId: true,
        status: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Validate event-specific role
    this.validateEventRole(data.role);

    // Get staff member
    const staff = await prisma.user.findUnique({
      where: { id: data.staffId },
      select: {
        id: true,
        role: true,
        status: true,
        organizationName: true,
      },
    });

    if (!staff) {
      throw new NotFoundError('Staff member not found');
    }

    // Check staff status
    if (staff.status !== UserStatus.ACTIVE) {
      throw new ValidationError('Staff member is not active');
    }

    // Determine staff type
    let staffType: 'ADMIN_STAFF' | 'ORGANIZER_STAFF';
    try {
      staffType = this.getStaffType(staff.role);
    } catch {
      throw new ValidationError(`User role ${staff.role} is not a valid staff role`);
    }

    // Validate permissions based on staff type
    if (staffType === 'ADMIN_STAFF') {
      // Only ADMIN_STAFF+ can assign admin staff
      if (
        assignedByRole !== UserRole.SUPERADMIN &&
        assignedByRole !== UserRole.ADMIN_STAFF
      ) {
        throw new AuthorizationError('Only admin staff can assign admin staff to events');
      }
    } else {
      // ORGANIZER_STAFF - validate organizer can assign their staff
      await this.validateOrganizerStaffAssignment(data.staffId, eventId, assignedBy);
    }

    // Check for duplicate assignment
    const existingAssignment = await prisma.eventStaff.findUnique({
      where: {
        eventId_staffId: {
          eventId,
          staffId: data.staffId,
        },
      },
    });

    if (existingAssignment) {
      throw new ConflictError('Staff member is already assigned to this event');
    }

    // Parse shift times if provided
    const shiftStart = data.shiftStart ? new Date(data.shiftStart) : null;
    const shiftEnd = data.shiftEnd ? new Date(data.shiftEnd) : null;

    // Validate shift times
    if (shiftStart && shiftEnd && shiftStart >= shiftEnd) {
      throw new ValidationError('Shift start time must be before shift end time');
    }

    // Create assignment
    const assignment = await prisma.eventStaff.create({
      data: {
        eventId,
        staffId: data.staffId,
        role: data.role,
        staffType,
        assignedBy,
        notes: data.notes,
        shiftStart,
        shiftEnd,
        facility: data.facility,
        isActive: true,
      },
      include: {
        staff: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
          },
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId: assignedBy,
      action: AuditActions.STAFF_ASSIGNED_TO_EVENT,
      entity: 'EventStaff',
      entityId: assignment.id,
      metadata: {
        eventId,
        staffId: data.staffId,
        role: data.role,
        staffType,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Staff ${data.staffId} assigned to event ${eventId} with role ${data.role}`);

    return assignment;
  }

  /**
   * Get staff assigned to an event
   */
  static async getEventStaff(
    eventId: string,
    filters?: EventStaffFilters,
    organizerId?: string,
  ) {
    // Validate event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizerId: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // If organizerId provided, verify event belongs to organizer
    if (organizerId && event.organizerId !== organizerId) {
      throw new AuthorizationError('Event does not belong to you');
    }

    // Build where clause
    const where: Prisma.EventStaffWhereInput = {
      eventId,
    };

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.staffType) {
      where.staffType = filters.staffType;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // If organizerId provided, only return their staff
    if (organizerId) {
      const organizer = await prisma.user.findUnique({
        where: { id: organizerId },
        select: {
          organizationName: true,
        },
      });

      if (organizer) {
        where.staff = {
          organizationName: organizer.organizationName,
        };
      }
    }

    const assignments = await prisma.eventStaff.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    return assignments;
  }

  /**
   * Get events assigned to a staff member
   */
  static async getStaffEvents(
    staffId: string,
    filters?: StaffEventsFilters,
  ) {
    // Validate staff exists
    const staff = await prisma.user.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!staff) {
      throw new NotFoundError('Staff member not found');
    }

    // Build where clause
    const where: Prisma.EventStaffWhereInput = {
      staffId,
    };

    if (filters?.status || filters?.startDate || filters?.endDate) {
      const eventFilter: Prisma.EventWhereInput = {};
      if (filters?.status) {
        eventFilter.status = filters.status;
      }
      if (filters?.startDate || filters?.endDate) {
        const dateFilter: { gte?: Date; lte?: Date } = {};
        if (filters.startDate) {
          dateFilter.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          dateFilter.lte = new Date(filters.endDate);
        }
        eventFilter.startDate = dateFilter;
      }
      where.event = eventFilter;
    }

    const assignments = await prisma.eventStaff.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
            location: true,
            venue: true,
            status: true,
            image: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    return assignments;
  }

  /**
   * Get all events where organizer's staff are assigned
   */
  static async getOrganizerStaffEvents(
    organizerId: string,
    filters?: StaffEventsFilters,
  ) {
    // Get organizer info
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

    // Build where clause
    const where: Prisma.EventStaffWhereInput = {
      staff: {
        organizationName: organizer.organizationName,
      },
    };

    if (filters?.status || filters?.startDate || filters?.endDate) {
      const eventFilter: Prisma.EventWhereInput = {};
      if (filters?.status) {
        eventFilter.status = filters.status;
      }
      if (filters?.startDate || filters?.endDate) {
        const dateFilter: { gte?: Date; lte?: Date } = {};
        if (filters.startDate) {
          dateFilter.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          dateFilter.lte = new Date(filters.endDate);
        }
        eventFilter.startDate = dateFilter;
      }
      where.event = eventFilter;
    }

    const assignments = await prisma.eventStaff.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
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
      orderBy: {
        assignedAt: 'desc',
      },
    });

    return assignments;
  }

  /**
   * Remove staff from event
   */
  static async removeStaffFromEvent(
    eventId: string,
    staffId: string,
    removedBy: string,
    removedByRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get assignment
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
            organizerId: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundError('Staff assignment not found');
    }

    // Validate permissions
    if (assignment.staffType === 'ADMIN_STAFF') {
      // Only ADMIN_STAFF+ can remove admin staff
      if (
        removedByRole !== UserRole.SUPERADMIN &&
        removedByRole !== UserRole.ADMIN_STAFF
      ) {
        throw new AuthorizationError('Only admin staff can remove admin staff from events');
      }
    } else {
      // ORGANIZER_STAFF - only event organizer can remove
      if (assignment.event.organizerId !== removedBy) {
        throw new AuthorizationError('Only the event organizer can remove their staff');
      }
    }

    // Delete assignment
    await prisma.eventStaff.delete({
      where: {
        eventId_staffId: {
          eventId,
          staffId,
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId: removedBy,
      action: AuditActions.STAFF_REMOVED_FROM_EVENT,
      entity: 'EventStaff',
      entityId: assignment.id,
      metadata: {
        eventId,
        staffId,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Staff ${staffId} removed from event ${eventId}`);
  }

  /**
   * Update staff role in event
   */
  static async updateStaffRole(
    eventId: string,
    staffId: string,
    newRole: EventStaffRole,
    updatedBy: string,
    updatedByRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Validate role
    this.validateEventRole(newRole);

    // Get assignment
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
            organizerId: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundError('Staff assignment not found');
    }

    // Validate permissions
    if (assignment.staffType === 'ADMIN_STAFF') {
      // Only ADMIN_STAFF+ can update admin staff
      if (
        updatedByRole !== UserRole.SUPERADMIN &&
        updatedByRole !== UserRole.ADMIN_STAFF
      ) {
        throw new AuthorizationError('Only admin staff can update admin staff assignments');
      }
    } else {
      // ORGANIZER_STAFF - only event organizer can update
      if (assignment.event.organizerId !== updatedBy) {
        throw new AuthorizationError('Only the event organizer can update their staff assignments');
      }
    }

    // Update role
    const updated = await prisma.eventStaff.update({
      where: {
        eventId_staffId: {
          eventId,
          staffId,
        },
      },
      data: {
        role: newRole,
      },
      include: {
        staff: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId: updatedBy,
      action: AuditActions.STAFF_ASSIGNMENT_UPDATED,
      entity: 'EventStaff',
      entityId: updated.id,
      metadata: {
        eventId,
        staffId,
        oldRole: assignment.role,
        newRole,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Staff ${staffId} role updated to ${newRole} for event ${eventId}`);

    return updated;
  }

  /**
   * Update staff assignment
   */
  static async updateStaffAssignment(
    eventId: string,
    staffId: string,
    updates: UpdateStaffAssignmentData,
    updatedBy: string,
    updatedByRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get assignment
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
            organizerId: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundError('Staff assignment not found');
    }

    // Validate permissions
    if (assignment.staffType === 'ADMIN_STAFF') {
      // Only ADMIN_STAFF+ can update admin staff
      if (
        updatedByRole !== UserRole.SUPERADMIN &&
        updatedByRole !== UserRole.ADMIN_STAFF
      ) {
        throw new AuthorizationError('Only admin staff can update admin staff assignments');
      }
    } else {
      // ORGANIZER_STAFF - only event organizer can update
      if (assignment.event.organizerId !== updatedBy) {
        throw new AuthorizationError('Only the event organizer can update their staff assignments');
      }
    }

    // Validate role if provided
    if (updates.role) {
      this.validateEventRole(updates.role);
    }

    // Parse shift times if provided
    const shiftStart = updates.shiftStart === null
      ? null
      : updates.shiftStart
        ? new Date(updates.shiftStart)
        : undefined;

    const shiftEnd = updates.shiftEnd === null
      ? null
      : updates.shiftEnd
        ? new Date(updates.shiftEnd)
        : undefined;

    // Validate shift times
    const finalShiftStart = shiftStart !== undefined ? shiftStart : assignment.shiftStart;
    const finalShiftEnd = shiftEnd !== undefined ? shiftEnd : assignment.shiftEnd;

    if (finalShiftStart && finalShiftEnd && finalShiftStart >= finalShiftEnd) {
      throw new ValidationError('Shift start time must be before shift end time');
    }

    // Build update data
    const updateData: Prisma.EventStaffUpdateInput = {};

    if (updates.role !== undefined) {
      updateData.role = updates.role;
    }

    if (updates.notes !== undefined) {
      updateData.notes = updates.notes;
    }

    if (updates.isActive !== undefined) {
      updateData.isActive = updates.isActive;
    }

    if (updates.shiftStart !== undefined) {
      updateData.shiftStart = shiftStart;
    }

    if (updates.shiftEnd !== undefined) {
      updateData.shiftEnd = shiftEnd;
    }

    if (updates.facility !== undefined) {
      updateData.facility = updates.facility;
    }

    // Update assignment
    const updated = await prisma.eventStaff.update({
      where: {
        eventId_staffId: {
          eventId,
          staffId,
        },
      },
      data: updateData,
      include: {
        staff: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
          },
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId: updatedBy,
      action: AuditActions.STAFF_ASSIGNMENT_UPDATED,
      entity: 'EventStaff',
      entityId: updated.id,
      metadata: {
        eventId,
        staffId,
        updates,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Staff assignment ${assignment.id} updated for event ${eventId}`);

    return updated;
  }

  /**
   * Get staff event count
   */
  static async getStaffEventCount(staffId: string): Promise<number> {
    const count = await prisma.eventStaff.count({
      where: {
        staffId,
        isActive: true,
      },
    });

    return count;
  }

  /**
   * Get event staff count
   */
  static async getEventStaffCount(
    eventId: string,
    staffType?: 'ADMIN_STAFF' | 'ORGANIZER_STAFF',
  ): Promise<number> {
    const where: Prisma.EventStaffWhereInput = {
      eventId,
      isActive: true,
    };

    if (staffType) {
      where.staffType = staffType;
    }

    const count = await prisma.eventStaff.count({ where });

    return count;
  }

  /**
   * Bulk assign staff to event
   */
  static async bulkAssignStaff(
    eventId: string,
    staffIds: string[],
    role: EventStaffRole,
    assignedBy: string,
    assignedByRole: UserRole,
    notes?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Validate role
    this.validateEventRole(role);

    // Validate event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizerId: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Validate permissions
    if (
      assignedByRole !== UserRole.SUPERADMIN &&
      assignedByRole !== UserRole.ADMIN_STAFF
    ) {
      // For organizer, validate they own the event
      if (assignedByRole !== UserRole.ORGANIZER || event.organizerId !== assignedBy) {
        throw new AuthorizationError('You do not have permission to assign staff to this event');
      }
    }

    // Validate staff members
    const staffMembers = await prisma.user.findMany({
      where: {
        id: {
          in: staffIds,
        },
      },
      select: {
        id: true,
        role: true,
        status: true,
        organizationName: true,
      },
    });

    if (staffMembers.length !== staffIds.length) {
      throw new NotFoundError('One or more staff members not found');
    }

    // Check for existing assignments
    const existingAssignments = await prisma.eventStaff.findMany({
      where: {
        eventId,
        staffId: {
          in: staffIds,
        },
      },
    });

    if (existingAssignments.length > 0) {
      const existingIds = existingAssignments.map((a) => a.staffId);
      throw new ConflictError(
        `Staff members already assigned: ${existingIds.join(', ')}`,
      );
    }

    // Validate all staff are active
    const inactiveStaff = staffMembers.filter((s) => s.status !== UserStatus.ACTIVE);
    if (inactiveStaff.length > 0) {
      throw new ValidationError(
        `One or more staff members are not active: ${inactiveStaff.map((s) => s.id).join(', ')}`,
      );
    }

    // For organizer, validate all staff belong to their organization
    if (assignedByRole === UserRole.ORGANIZER) {
      const organizer = await prisma.user.findUnique({
        where: { id: assignedBy },
        select: {
          organizationName: true,
        },
      });

      if (organizer) {
        const invalidStaff = staffMembers.filter(
          (s) => s.organizationName !== organizer.organizationName,
        );
        if (invalidStaff.length > 0) {
          throw new AuthorizationError(
            `One or more staff members do not belong to your organization: ${invalidStaff.map((s) => s.id).join(', ')}`,
          );
        }
      }
    }

    // Create assignments
    const assignments = await Promise.all(
      staffMembers.map(async (staff: { id: string; role: UserRole }) => {
        const staffType = this.getStaffType(staff.role);
        return prisma.eventStaff.create({
          data: {
            eventId,
            staffId: staff.id,
            role,
            staffType,
            assignedBy,
            notes,
            isActive: true,
          },
          include: {
            staff: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        });
      }),
    );

    // Audit log
    await createAuditLog({
      userId: assignedBy,
      action: AuditActions.STAFF_ASSIGNED_TO_EVENT,
      entity: 'EventStaff',
      entityId: assignments[0]?.id || '',
      metadata: {
        eventId,
        staffIds,
        role,
        count: assignments.length,
        bulk: true,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Bulk assigned ${assignments.length} staff members to event ${eventId}`);

    return assignments;
  }
}

