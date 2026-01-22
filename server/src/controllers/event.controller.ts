import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/event.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { EventStatus, EventType, DataAccessLevel } from '@prisma/client';
import { logger } from '../utils/logger.js';

export class EventController {
  /**
   * Create a new event
   */
  static async createEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const event = await EventService.createEvent(
        req.body,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(201).json({
        success: true,
        message: 'Event created successfully. Waiting for admin approval.',
        data: { event },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all events (with filters)
   */
  static async getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: {
        status?: EventStatus;
        category?: string;
        isFree?: boolean;
        organizerId?: string;
        search?: string;
        limit?: number;
        offset?: number;
        page?: number;
        type?: EventType;
        dateFrom?: string;
        dateTo?: string;
      } = {};

      logger.debug('[EventController] Query params:', req.query);

      if (req.query.status) {
        filters.status = req.query.status as EventStatus;
      }
      if (req.query.category) {
        filters.category = req.query.category as string;
      }
      if (req.query.isFree !== undefined) {
        filters.isFree = req.query.isFree === 'true' || req.query.isFree === '1';
      }
      if (req.query.organizerId) {
        filters.organizerId = req.query.organizerId as string;
      }
      if (req.query.search) {
        filters.search = req.query.search as string;
      }
      if (req.query.type) {
        filters.type = req.query.type as EventType;
      }
      if (req.query.limit) {
        filters.limit = parseInt(req.query.limit as string, 10);
      }
      // Support both page and offset (page takes precedence)
      if (req.query.page) {
        filters.page = parseInt(req.query.page as string, 10);
      } else if (req.query.offset) {
        filters.offset = parseInt(req.query.offset as string, 10);
      }
      // Date range filtering
      if (req.query.dateFrom) {
        filters.dateFrom = req.query.dateFrom as string;
      }
      if (req.query.dateTo) {
        filters.dateTo = req.query.dateTo as string;
      }

      logger.debug('[EventController] Parsed filters:', filters);

      const result = await EventService.getEvents(filters);

      logger.debug('[EventController] Service returned:', {
        eventCount: result.events.length,
        total: result.total,
        events: result.events.map(e => ({ id: e.id, title: e.title, status: e.status, type: e.type })),
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get event by ID
   */
  static async getEventById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await EventService.getEventById((req.params.id as string));

      res.status(200).json({
        success: true,
        data: { event },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update event
   */
  static async updateEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const event = await EventService.updateEvent(
        (req.params.id as string),
        req.body,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Event updated successfully. Waiting for admin approval if previously approved.',
        data: { event },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete event
   */
  static async deleteEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      await EventService.deleteEvent(
        (req.params.id as string),
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Event deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register for an event (purchase/register)
   */
  static async registerForEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      logger.debug(`[EventController.registerForEvent] Starting registration for event ${(req.params.id as string)}, user: ${req.user.id}`);
      
      const registration = await EventService.registerForEvent(
        (req.params.id as string),
        req.user.id,
        req.body,
        ipAddress,
        userAgent,
      );

      logger.debug(`[EventController.registerForEvent] Registration completed successfully: ${registration.id}, status: ${registration.status}`);

      // Normalize totalAmount for API consumers as a fixed-precision string
      const normalizedRegistration = {
        ...registration,
        totalAmount: registration.totalAmount !== null && registration.totalAmount !== undefined
          ? Number(registration.totalAmount as unknown as number).toFixed(2)
          : '0.00',
      };

      res.status(201).json({
        success: true,
        message: registration.status === 'CONFIRMED'
          ? 'Registration successful'
          : 'Registration pending. Payment will be processed when payment system is implemented.',
        data: { registration: normalizedRegistration },
      });
    } catch (error) {
      logger.error('[EventController.registerForEvent] Error in registration controller:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        eventId: (req.params.id as string),
        userId: req.user?.id,
        errorType: error?.constructor?.name || typeof error,
      });
      next(error);
    }
  }

  /**
   * Get event registrations (organizer function)
   */
  static async getEventRegistrations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const registrations = await EventService.getEventRegistrations(
        (req.params.id as string),
        req.user.id,
        req.user.role,
      );

      res.status(200).json({
        success: true,
        data: { registrations },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel registration (attendee function)
   */
  static async cancelRegistration(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      await EventService.cancelRegistration(
        (req.params.id as string),
        req.user.id,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Registration cancelled successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve event (admin function)
   */
  static async approveEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const event = await EventService.approveEvent(
        (req.params.id as string),
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Event approved successfully',
        data: { event },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject event (admin function)
   */
  static async rejectEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { rejectionReason } = req.body;

      if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Rejection reason is required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const event = await EventService.rejectEvent(
        (req.params.id as string),
        rejectionReason,
        req.user.id,
        req.user.role,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Event rejected successfully',
        data: { event },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel event (organizer function)
   */
  static async cancelEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const event = await EventService.cancelEvent(
        (req.params.id as string),
        req.user.id,
        req.user.role,
        req.body?.reason,
        ipAddress,
        userAgent,
      );

      res.status(200).json({
        success: true,
        message: 'Event cancelled successfully',
        data: { event },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update organizer data access level (admin function)
   */
  static async updateOrganizerDataAccess(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { dataAccessLevel } = req.body;

      if (!dataAccessLevel || !['RESTRICTED', 'STANDARD', 'FULL'].includes(dataAccessLevel)) {
        res.status(400).json({
          success: false,
          message: 'Valid dataAccessLevel is required (RESTRICTED, STANDARD, or FULL)',
        });
        return;
      }

      const event = await EventService.updateOrganizerDataAccess(
        (req.params.id as string),
        dataAccessLevel as DataAccessLevel,
        req.user.id,
      );

      res.status(200).json({
        success: true,
        message: 'Organizer data access updated successfully',
        data: { event },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk update organizer data access level (admin function)
   */
  static async bulkUpdateOrganizerDataAccess(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { eventIds, dataAccessLevel } = req.body;

      if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'eventIds array is required and must not be empty',
        });
        return;
      }

      if (!dataAccessLevel || !['RESTRICTED', 'STANDARD', 'FULL'].includes(dataAccessLevel)) {
        res.status(400).json({
          success: false,
          message: 'Valid dataAccessLevel is required (RESTRICTED, STANDARD, or FULL)',
        });
        return;
      }

      const result = await EventService.bulkUpdateOrganizerDataAccess(
        eventIds,
        dataAccessLevel as DataAccessLevel,
        req.user.id,
      );

      res.status(200).json({
        success: true,
        message: `Organizer data access updated successfully for ${result.updatedCount} event(s)`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's registered events (for user dashboard)
   */
  static async getUserRegisteredEvents(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const filters: {
        page?: number;
        limit?: number;
      } = {};

      if (req.query.page) {
        filters.page = parseInt(req.query.page as string, 10);
      }
      if (req.query.limit) {
        filters.limit = parseInt(req.query.limit as string, 10);
      }

      const result = await EventService.getUserRegisteredEvents(req.user.id, filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get invitation by token (public - for registration form)
   */
  static async getInvitationByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { InvitationService } = await import('../services/invitation.service.js');
      const invitation = await InvitationService.getInvitationByToken((req.params.token as string));

      res.status(200).json({
        success: true,
        data: { invitation },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register for event as guest (public - no auth required)
   */
  static async registerAsGuest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = (req.params.id as string);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const result = await EventService.registerAsGuest(
        eventId,
        req.body,
        ipAddress,
        userAgent,
      );

      res.status(201).json({
        success: true,
        message: 'Registration successful. Check your email for ticket confirmation and account setup.',
        data: {
          registration: {
            ...result.registration,
            totalAmount: result.registration.totalAmount !== null && result.registration.totalAmount !== undefined
              ? Number(result.registration.totalAmount as unknown as number).toFixed(2)
              : '0.00',
          },
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register for event via invitation link (public - no auth required)
   */
  static async registerViaInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const result = await EventService.registerViaInvitation(
        (req.params.token as string),
        req.body,
        ipAddress,
        userAgent,
      );

      res.status(201).json({
        success: true,
        message: result.registration.status === 'CONFIRMED'
          ? 'Registration successful'
          : 'Registration pending. Payment will be processed when payment system is implemented.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Duplicate an event
   */
  static async duplicateEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const id = (req.params.id as string) as string;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const duplicatedEvent = await EventService.duplicateEvent(
        id,
        req.user.id,
        req.user.role,
        req.body,
        ipAddress,
        userAgent,
      );

      res.status(201).json({
        success: true,
        message: 'Event duplicated successfully',
        data: { event: duplicatedEvent },
      });
    } catch (error) {
      next(error);
    }
  }
}




