import { Response, NextFunction } from 'express';
import { FacilityService } from '../services/facility.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export class FacilityController {
  /**
   * Create a new facility for an event
   * POST /api/v1/events/:eventId/facilities
   */
  static async createFacility(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const { name, code, description, icon, color, location, isActive, allowCheckIn, allowCheckOut, sortOrder } = req.body;

      if (!name || typeof name !== 'string') {
        throw new ValidationError('Name is required');
      }

      if (!code || typeof code !== 'string') {
        throw new ValidationError('Code is required');
      }

      if (code.length > 10) {
        throw new ValidationError('Code must be 10 characters or less');
      }

      const facility = await FacilityService.createFacility(eventId, {
        name,
        code,
        description,
        icon,
        color,
        location,
        isActive,
        allowCheckIn,
        allowCheckOut,
        sortOrder,
      });

      res.status(201).json({
        success: true,
        message: 'Facility created successfully',
        data: facility,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all facilities for an event
   * GET /api/v1/events/:eventId/facilities
   */
  static async getFacilities(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const { includeStats, activeOnly } = req.query;

      const facilities = await FacilityService.getFacilities(eventId, {
        includeStats: includeStats === 'true',
        activeOnly: activeOnly === 'true',
      });

      res.status(200).json({
        success: true,
        data: facilities,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single facility
   * GET /api/v1/events/:eventId/facilities/:id
   */
  static async getFacilityById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const id = (req.params.id as string) as string;

      const facility = await FacilityService.getFacilityById(id);

      if (!facility) {
        throw new NotFoundError('Facility not found');
      }

      res.status(200).json({
        success: true,
        data: facility,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a facility
   * PUT /api/v1/events/:eventId/facilities/:id
   */
  static async updateFacility(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const id = (req.params.id as string) as string;
      const { name, code, description, icon, color, location, isActive, allowCheckIn, allowCheckOut, sortOrder } = req.body;

      if (code && code.length > 10) {
        throw new ValidationError('Code must be 10 characters or less');
      }

      const facility = await FacilityService.updateFacility(id, {
        name,
        code,
        description,
        icon,
        color,
        location,
        isActive,
        allowCheckIn,
        allowCheckOut,
        sortOrder,
      });

      res.status(200).json({
        success: true,
        message: 'Facility updated successfully',
        data: facility,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a facility
   * DELETE /api/v1/events/:eventId/facilities/:id
   */
  static async deleteFacility(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const id = (req.params.id as string) as string;

      const result = await FacilityService.deleteFacility(id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get facility statistics
   * GET /api/v1/events/:eventId/facilities/:id/stats
   */
  static async getFacilityStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const id = (req.params.id as string) as string;

      const stats = await FacilityService.getFacilityStats(id);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reorder facilities
   * POST /api/v1/events/:eventId/facilities/reorder
   */
  static async reorderFacilities(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const { orderedIds } = req.body;

      if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
        throw new ValidationError('orderedIds must be a non-empty array');
      }

      const facilities = await FacilityService.reorderFacilities(eventId, orderedIds);

      res.status(200).json({
        success: true,
        message: 'Facilities reordered successfully',
        data: facilities,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create default facility
   * POST /api/v1/events/:eventId/facilities/create-default
   */
  static async createDefaultFacility(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const eventId = (req.params.eventId as string) as string;

      const facility = await FacilityService.createDefaultFacility(eventId);

      res.status(201).json({
        success: true,
        message: 'Default facility created successfully',
        data: facility,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ensure default facility exists (used by scanner)
   * POST /api/v1/events/:eventId/facilities/ensure-default
   */
  static async ensureDefaultFacility(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const eventId = (req.params.eventId as string) as string;

      const facilities = await FacilityService.ensureDefaultFacility(eventId);

      res.status(200).json({
        success: true,
        data: facilities,
      });
    } catch (error) {
      next(error);
    }
  }
}
