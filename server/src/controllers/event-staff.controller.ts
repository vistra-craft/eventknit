import { Response, NextFunction } from 'express';
import { EventStaffService } from '../services/event-staff.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ValidationError } from '../utils/errors.js';
import { EventStatus } from '@prisma/client';

export class EventStaffController {
  /**
   * Assign staff to event (Admin)
   * POST /api/v1/admin/events/:eventId/staff
   */
  static async assignStaffToEvent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const { staffId, role, notes, shiftStart, shiftEnd, facility } = req.body;

      if (!staffId || typeof staffId !== 'string') {
        throw new ValidationError('Staff ID is required and must be a string');
      }

      if (!role || typeof role !== 'string') {
        throw new ValidationError('Role is required and must be a string');
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      // Validate role is a valid event staff role
      const validRoles = ['SCANNER', 'SUPPORT', 'MANAGER', 'COORDINATOR', 'SUPERVISOR', 'TICKET_SELLER'];
      if (!validRoles.includes(role)) {
        throw new ValidationError(`Invalid role. Valid roles are: ${validRoles.join(', ')}`);
      }

      const assignment = await EventStaffService.assignStaffToEvent(
        eventId,
        {
          staffId,
          role: role as 'SCANNER' | 'SUPPORT' | 'MANAGER' | 'COORDINATOR' | 'SUPERVISOR' | 'TICKET_SELLER',
          notes,
          shiftStart,
          shiftEnd,
          facility,
        },
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(201).json({
        success: true,
        message: 'Staff assigned to event successfully',
        data: { assignment },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get staff assigned to event (Admin)
   * GET /api/v1/admin/events/:eventId/staff
   */
  static async getEventStaff(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const { role, staffType, isActive } = req.query;

      const filters: {
        role?: string;
        staffType?: 'ADMIN_STAFF' | 'ORGANIZER_STAFF';
        isActive?: boolean;
      } = {};

      if (role && typeof role === 'string') {
        filters.role = role;
      }

      if (staffType && typeof staffType === 'string') {
        if (staffType === 'ADMIN_STAFF' || staffType === 'ORGANIZER_STAFF') {
          filters.staffType = staffType;
        }
      }

      if (isActive !== undefined) {
        filters.isActive = isActive === 'true' || (typeof isActive === 'boolean' && isActive);
      }

      const assignments = await EventStaffService.getEventStaff(eventId, filters);

      res.status(200).json({
        success: true,
        data: { assignments },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get events assigned to staff member (Admin)
   * GET /api/v1/admin/staff/:staffId/events
   */
  static async getStaffEvents(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const staffId = (req.params.staffId as string) as string;
      const { status, startDate, endDate } = req.query;

      const filters: {
        status?: EventStatus;
        startDate?: string;
        endDate?: string;
      } = {};

      if (status && typeof status === 'string') {
        if (Object.values(EventStatus).includes(status as EventStatus)) {
          filters.status = status as EventStatus;
        }
      }

      if (startDate && typeof startDate === 'string') {
        filters.startDate = startDate;
      }

      if (endDate && typeof endDate === 'string') {
        filters.endDate = endDate;
      }

      const assignments = await EventStaffService.getStaffEvents(staffId, filters);

      res.status(200).json({
        success: true,
        data: { assignments },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update staff assignment (Admin)
   * PUT /api/v1/admin/events/:eventId/staff/:staffId
   */
  static async updateStaffAssignment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const staffId = (req.params.staffId as string) as string;
      const { role, notes, isActive, shiftStart, shiftEnd, facility } = req.body;

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const assignment = await EventStaffService.updateStaffAssignment(
        eventId,
        staffId,
        {
          role,
          notes,
          isActive,
          shiftStart,
          shiftEnd,
          facility,
        },
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Staff assignment updated successfully',
        data: { assignment },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove staff from event (Admin)
   * DELETE /api/v1/admin/events/:eventId/staff/:staffId
   */
  static async removeStaffFromEvent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const staffId = (req.params.staffId as string) as string;

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      await EventStaffService.removeStaffFromEvent(
        eventId,
        staffId,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Staff removed from event successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk assign staff to event (Admin)
   * POST /api/v1/admin/events/:eventId/staff/bulk
   */
  static async bulkAssignStaff(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const { staffIds, role, notes } = req.body;

      if (!Array.isArray(staffIds) || staffIds.length === 0) {
        throw new ValidationError('Staff IDs must be a non-empty array');
      }

      if (!role || typeof role !== 'string') {
        throw new ValidationError('Role is required and must be a string');
      }

      // Validate role is a valid event staff role
      const validRoles = ['SCANNER', 'SUPPORT', 'MANAGER', 'COORDINATOR', 'SUPERVISOR', 'TICKET_SELLER'];
      if (!validRoles.includes(role)) {
        throw new ValidationError(`Invalid role. Valid roles are: ${validRoles.join(', ')}`);
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const assignments = await EventStaffService.bulkAssignStaff(
        eventId,
        staffIds,
        role as 'SCANNER' | 'SUPPORT' | 'MANAGER' | 'COORDINATOR' | 'SUPERVISOR' | 'TICKET_SELLER',
        req.user.id,
        req.user.role,
        notes,
        ipAddress,
        userAgent,
      );

      res.status(201).json({
        success: true,
        message: `${assignments.length} staff members assigned to event successfully`,
        data: { assignments },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign organizer staff to event (Organizer)
   * POST /api/v1/organizer/events/:eventId/staff
   */
  static async assignOrganizerStaffToEvent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const { staffId, role, notes, shiftStart, shiftEnd, facility } = req.body;

      if (!staffId || typeof staffId !== 'string') {
        throw new ValidationError('Staff ID is required and must be a string');
      }

      if (!role || typeof role !== 'string') {
        throw new ValidationError('Role is required and must be a string');
      }

      // Validate role is a valid event staff role
      const validRoles = ['SCANNER', 'SUPPORT', 'MANAGER', 'COORDINATOR', 'SUPERVISOR', 'TICKET_SELLER'];
      if (!validRoles.includes(role)) {
        throw new ValidationError(`Invalid role. Valid roles are: ${validRoles.join(', ')}`);
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const assignment = await EventStaffService.assignStaffToEvent(
        eventId,
        {
          staffId,
          role: role as 'SCANNER' | 'SUPPORT' | 'MANAGER' | 'COORDINATOR' | 'SUPERVISOR' | 'TICKET_SELLER',
          notes,
          shiftStart,
          shiftEnd,
          facility,
        },
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(201).json({
        success: true,
        message: 'Staff assigned to event successfully',
        data: { assignment },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get organizer staff assigned to event (Organizer)
   * GET /api/v1/organizer/events/:eventId/staff
   */
  static async getOrganizerEventStaff(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const { role, isActive } = req.query;

      const filters: {
        role?: string;
        isActive?: boolean;
      } = {};

      if (role && typeof role === 'string') {
        filters.role = role;
      }

      if (isActive !== undefined) {
        filters.isActive = isActive === 'true' || (typeof isActive === 'boolean' && isActive);
      }

      const assignments = await EventStaffService.getEventStaff(
        eventId,
        filters,
        req.user.id,
      );

      res.status(200).json({
        success: true,
        data: { assignments },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get events where organizer staff is assigned (Organizer)
   * GET /api/v1/organizer/staff/:staffId/events
   */
  static async getOrganizerStaffEvents(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const staffId = (req.params.staffId as string) as string;
      const { status, startDate, endDate } = req.query;

      const filters: {
        status?: EventStatus;
        startDate?: string;
        endDate?: string;
      } = {};

      if (status && typeof status === 'string') {
        if (Object.values(EventStatus).includes(status as EventStatus)) {
          filters.status = status as EventStatus;
        }
      }

      if (startDate && typeof startDate === 'string') {
        filters.startDate = startDate;
      }

      if (endDate && typeof endDate === 'string') {
        filters.endDate = endDate;
      }

      const assignments = await EventStaffService.getStaffEvents(staffId, filters);

      res.status(200).json({
        success: true,
        data: { assignments },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update organizer staff assignment (Organizer)
   * PUT /api/v1/organizer/events/:eventId/staff/:staffId
   */
  static async updateOrganizerStaffAssignment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const staffId = (req.params.staffId as string) as string;
      const { role, notes, isActive, shiftStart, shiftEnd, facility } = req.body;

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const assignment = await EventStaffService.updateStaffAssignment(
        eventId,
        staffId,
        {
          role,
          notes,
          isActive,
          shiftStart,
          shiftEnd,
          facility,
        },
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Staff assignment updated successfully',
        data: { assignment },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove organizer staff from event (Organizer)
   * DELETE /api/v1/organizer/events/:eventId/staff/:staffId
   */
  static async removeOrganizerStaffFromEvent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const staffId = (req.params.staffId as string) as string;

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      await EventStaffService.removeStaffFromEvent(
        eventId,
        staffId,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Staff removed from event successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all staff assignments for organizer's events (Organizer)
   * GET /api/v1/organizer/staff/assignments
   */
  static async getOrganizerStaffAssignments(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { eventId, staffId, status, startDate, endDate } = req.query;

      const filters: {
        status?: EventStatus;
        startDate?: string;
        endDate?: string;
      } = {};

      if (status && typeof status === 'string') {
        if (Object.values(EventStatus).includes(status as EventStatus)) {
          filters.status = status as EventStatus;
        }
      }

      if (startDate && typeof startDate === 'string') {
        filters.startDate = startDate;
      }

      if (endDate && typeof endDate === 'string') {
        filters.endDate = endDate;
      }

      const assignments = await EventStaffService.getOrganizerStaffEvents(
        req.user.id,
        filters,
      );

      // Filter by eventId if provided
      let filteredAssignments = assignments;
      if (eventId && typeof eventId === 'string') {
        filteredAssignments = assignments.filter((a: { event: { id: string } }) => a.event.id === eventId);
      }

      // Filter by staffId if provided
      if (staffId && typeof staffId === 'string') {
        filteredAssignments = filteredAssignments.filter((a: { staff: { id: string } }) => a.staff.id === staffId);
      }

      res.status(200).json({
        success: true,
        data: { assignments: filteredAssignments },
      });
    } catch (error) {
      next(error);
    }
  }
}

