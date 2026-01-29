import { Response, NextFunction } from 'express';
import { FacilityZoneService } from '../services/facility-zone.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ValidationError } from '../utils/errors.js';

export class FacilityZoneController {
  /**
   * Create a new facility zone
   * POST /api/v1/zones
   */
  static async createZone(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const { eventId, name, code, description, maxCapacity, accessStart, accessEnd } = req.body;

      if (!eventId || !name || !code) {
        throw new ValidationError('Event ID, name, and code are required');
      }

      const zone = await FacilityZoneService.createZone(
        {
          eventId,
          name,
          code,
          description,
          maxCapacity: maxCapacity ? parseInt(maxCapacity, 10) : undefined,
          accessStart: accessStart ? new Date(accessStart) : undefined,
          accessEnd: accessEnd ? new Date(accessEnd) : undefined,
        },
        req.user.id,
      );

      res.status(201).json({
        success: true,
        data: { zone },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get zone by ID
   * GET /api/v1/zones/:id
   */
  static async getZoneById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const id = req.params.id as string;

      const zone = await FacilityZoneService.getZoneById(id);

      res.status(200).json({
        success: true,
        data: { zone },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get zones for an event
   * GET /api/v1/events/:eventId/zones
   */
  static async getEventZones(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const eventId = req.params.eventId as string;
      const includeInactive = req.query.includeInactive === 'true';

      const zones = await FacilityZoneService.getEventZones(eventId, includeInactive);

      res.status(200).json({
        success: true,
        data: { zones },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a zone
   * PUT /api/v1/zones/:id
   */
  static async updateZone(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const id = req.params.id as string;
      const { name, description, maxCapacity, accessStart, accessEnd, isActive } = req.body;

      const zone = await FacilityZoneService.updateZone(id, {
        name,
        description,
        maxCapacity: maxCapacity ? parseInt(maxCapacity, 10) : undefined,
        accessStart: accessStart ? new Date(accessStart) : undefined,
        accessEnd: accessEnd ? new Date(accessEnd) : undefined,
        isActive,
      });

      res.status(200).json({
        success: true,
        data: { zone },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign facility to zone
   * POST /api/v1/zones/:zoneId/facilities/:facilityId
   */
  static async assignFacility(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const zoneId = req.params.zoneId as string;
      const facilityId = req.params.facilityId as string;

      const mapping = await FacilityZoneService.assignFacilityToZone(facilityId, zoneId);

      res.status(201).json({
        success: true,
        data: { mapping },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove facility from zone
   * DELETE /api/v1/zones/:zoneId/facilities/:facilityId
   */
  static async removeFacility(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const zoneId = req.params.zoneId as string;
      const facilityId = req.params.facilityId as string;

      await FacilityZoneService.removeFacilityFromZone(facilityId, zoneId);

      res.status(200).json({
        success: true,
        message: 'Facility removed from zone',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk assign attendees to zone
   * POST /api/v1/zones/:zoneId/attendees/bulk-assign
   */
  static async bulkAssignAttendees(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const zoneId = req.params.zoneId as string;
      const { registrationIds, expiresAt } = req.body;

      if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
        throw new ValidationError('Registration IDs array is required');
      }

      const result = await FacilityZoneService.bulkAssignAttendees({
        zoneId,
        registrationIds,
        grantedBy: req.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
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
   * Get attendees in a zone
   * GET /api/v1/zones/:zoneId/attendees
   */
  static async getAttendeesInZone(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const zoneId = req.params.zoneId as string;

      const attendees = await FacilityZoneService.getAttendeesInZone(zoneId);

      res.status(200).json({
        success: true,
        data: { attendees },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke attendee access
   * DELETE /api/v1/zones/:zoneId/attendees/:registrationId
   */
  static async revokeAccess(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const zoneId = req.params.zoneId as string;
      const registrationId = req.params.registrationId as string;

      await FacilityZoneService.revokeAccess(registrationId, zoneId);

      res.status(200).json({
        success: true,
        message: 'Access revoked',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate zone access
   * GET /api/v1/zones/:zoneId/access/check/:registrationId
   */
  static async validateAccess(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const zoneId = req.params.zoneId as string;
      const registrationId = req.params.registrationId as string;

      const validation = await FacilityZoneService.validateZoneAccess(registrationId, zoneId);

      res.status(200).json({
        success: true,
        data: validation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check zone capacity
   * GET /api/v1/zones/:zoneId/capacity
   */
  static async checkCapacity(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const zoneId = req.params.zoneId as string;

      const capacity = await FacilityZoneService.checkZoneCapacity(zoneId);

      res.status(200).json({
        success: true,
        data: capacity,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get attendee movement history
   * GET /api/v1/registrations/:registrationId/movements
   */
  static async getMovementHistory(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const registrationId = req.params.registrationId as string;

      const movements = await FacilityZoneService.getAttendeeMovementHistory(registrationId);

      res.status(200).json({
        success: true,
        data: { movements },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get zone analytics
   * GET /api/v1/events/:eventId/zones/analytics
   */
  static async getZoneAnalytics(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const eventId = req.params.eventId as string;
      const { startDate, endDate } = req.query;

      const analytics = await FacilityZoneService.getZoneAnalytics(
        eventId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
      );

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
}
