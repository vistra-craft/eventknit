import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/event.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { EventStatus } from '@prisma/client';

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
      } = {};

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
      if (req.query.limit) {
        filters.limit = parseInt(req.query.limit as string, 10);
      }
      if (req.query.offset) {
        filters.offset = parseInt(req.query.offset as string, 10);
      }

      const result = await EventService.getEvents(filters);

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
      const event = await EventService.getEventById(req.params.id);

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
        req.params.id,
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
        req.params.id,
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

      const registration = await EventService.registerForEvent(
        req.params.id,
        req.user.id,
        req.body,
        ipAddress,
        userAgent,
      );

      res.status(201).json({
        success: true,
        message: registration.status === 'CONFIRMED'
          ? 'Registration successful'
          : 'Registration pending. Payment will be processed when payment system is implemented.',
        data: { registration },
      });
    } catch (error) {
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
        req.params.id,
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
        req.params.id,
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
        req.params.id,
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
        req.params.id,
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

      const events = await EventService.getUserRegisteredEvents(req.user.id);

      res.status(200).json({
        success: true,
        data: { events },
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
      const { InvitationService } = await import('../services/invitation.service');
      const invitation = await InvitationService.getInvitationByToken(req.params.token);

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
      const eventId = req.params.eventId;
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
        message: 'Registration successful. Check your email for confirmation and access link.',
        data: {
          registration: result.registration,
          user: result.user,
          // Don't return magicLinkToken in response for security (it's in email)
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
        req.params.token,
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
}


