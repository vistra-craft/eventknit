import { Response, NextFunction } from 'express';
import { CheckpointService } from '../services/checkpoint.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { CheckpointType } from '@prisma/client';
import { websocketService } from '../services/websocket.service.js';

export class CheckpointController {
  /**
   * Create a new checkpoint
   * POST /api/v1/checkpoints
   * Requires: ADMIN_STAFF or higher
   */
  static async createCheckpoint(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const {
        eventId,
        name,
        type,
        description,
        location,
        stationCode,
        quota,
        quotaEnforced,
        eligibilityRules,
        activeFrom,
        activeTo,
        displayOrder,
      } = req.body;

      if (!eventId || typeof eventId !== 'string') {
        throw new ValidationError('Event ID is required');
      }

      if (!name || typeof name !== 'string') {
        throw new ValidationError('Name is required');
      }

      const checkpoint = await CheckpointService.createCheckpoint({
        eventId,
        name,
        type: type as CheckpointType,
        description,
        location,
        stationCode,
        quota,
        quotaEnforced,
        eligibilityRules,
        activeFrom: activeFrom ? new Date(activeFrom) : undefined,
        activeTo: activeTo ? new Date(activeTo) : undefined,
        displayOrder,
        createdBy: req.user.id,
      });

      res.status(201).json({
        success: true,
        data: checkpoint,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get checkpoint by ID
   * GET /api/v1/checkpoints/:checkpointId
   * Requires: ADMIN_STAFF or higher
   */
  static async getCheckpoint(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const checkpointId = (req.params.checkpointId as string) as string;

      if (!checkpointId) {
        throw new ValidationError('Checkpoint ID is required');
      }

      const checkpoint = await CheckpointService.getCheckpointById(checkpointId);

      if (!checkpoint) {
        throw new NotFoundError('Checkpoint not found');
      }

      res.status(200).json({
        success: true,
        data: checkpoint,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get checkpoints for an event
   * GET /api/v1/checkpoints/event/:eventId
   * Requires: ADMIN_STAFF or higher
   */
  static async getEventCheckpoints(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const eventId = (req.params.eventId as string) as string;
      const { type, isActive, includeStats } = req.query;

      if (!eventId) {
        throw new ValidationError('Event ID is required');
      }

      const checkpoints = await CheckpointService.getEventCheckpoints(eventId, {
        type: type as CheckpointType | undefined,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        includeStats: includeStats === 'true',
      });

      res.status(200).json({
        success: true,
        data: checkpoints,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update checkpoint
   * PUT /api/v1/checkpoints/:checkpointId
   * Requires: ADMIN_STAFF or higher
   */
  static async updateCheckpoint(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const checkpointId = (req.params.checkpointId as string) as string;
      const {
        name,
        type,
        description,
        location,
        stationCode,
        quota,
        quotaEnforced,
        eligibilityRules,
        activeFrom,
        activeTo,
        isActive,
        displayOrder,
      } = req.body;

      if (!checkpointId) {
        throw new ValidationError('Checkpoint ID is required');
      }

      const checkpoint = await CheckpointService.updateCheckpoint(checkpointId, {
        name,
        type: type as CheckpointType,
        description,
        location,
        stationCode,
        quota,
        quotaEnforced,
        eligibilityRules,
        activeFrom: activeFrom ? new Date(activeFrom) : undefined,
        activeTo: activeTo ? new Date(activeTo) : undefined,
        isActive,
        displayOrder,
      });

      res.status(200).json({
        success: true,
        data: checkpoint,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete checkpoint
   * DELETE /api/v1/checkpoints/:checkpointId
   * Requires: ADMIN_STAFF or higher
   */
  static async deleteCheckpoint(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const checkpointId = (req.params.checkpointId as string) as string;

      if (!checkpointId) {
        throw new ValidationError('Checkpoint ID is required');
      }

      await CheckpointService.deleteCheckpoint(checkpointId);

      res.status(200).json({
        success: true,
        message: 'Checkpoint deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Duplicate checkpoint
   * POST /api/v1/checkpoints/:checkpointId/duplicate
   * Requires: ADMIN_STAFF or higher
   */
  static async duplicateCheckpoint(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const checkpointId = (req.params.checkpointId as string) as string;
      const { name } = req.body;

      if (!checkpointId) {
        throw new ValidationError('Checkpoint ID is required');
      }

      const checkpoint = await CheckpointService.duplicateCheckpoint(checkpointId, name);

      res.status(201).json({
        success: true,
        data: checkpoint,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Scan at checkpoint
   * POST /api/v1/checkpoints/:checkpointId/scan
   * Requires: TELLER or higher
   */
  static async scanCheckpoint(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const checkpointId = (req.params.checkpointId as string) as string;
      const { code, eventId, deviceId, deviceType, notes } = req.body;

      if (!checkpointId) {
        throw new ValidationError('Checkpoint ID is required');
      }

      if (!code || typeof code !== 'string') {
        throw new ValidationError('Code is required');
      }

      if (!eventId || typeof eventId !== 'string') {
        throw new ValidationError('Event ID is required');
      }

      const ipAddress = req.ip || req.socket.remoteAddress || undefined;
      const userAgent = req.headers['user-agent'] || undefined;

      const result = await CheckpointService.scanCheckpoint(code, checkpointId, eventId, req.user.id, {
        deviceId,
        deviceType,
        ipAddress,
        userAgent,
        notes,
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: {
            code: result.errorCode || 'SCAN_ERROR',
            message: result.errorMessage || 'Scan failed',
            details: {
              checkpointId: result.checkpointId,
              registrationId: result.registrationId,
            },
          },
        });
        return;
      }

      // Emit WebSocket event for real-time updates
      websocketService.emitToRoom(`event:${eventId}`, 'checkpoint:scan', {
        checkpointId: result.checkpointId,
        registrationId: result.registrationId,
        scanId: result.scanId,
        attendeeName: result.attendeeName,
        ticketType: result.ticketType,
        scanNumber: result.scanNumber,
        quotaRemaining: result.quotaRemaining,
        scannedAt: new Date(),
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
   * Get checkpoint scans
   * GET /api/v1/checkpoints/:checkpointId/scans
   * Requires: ADMIN_STAFF or higher
   */
  static async getCheckpointScans(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const checkpointId = (req.params.checkpointId as string) as string;
      const { page, limit, scannedBy, startDate, endDate } = req.query;

      if (!checkpointId) {
        throw new ValidationError('Checkpoint ID is required');
      }

      const result = await CheckpointService.getCheckpointScans(checkpointId, {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        scannedBy: scannedBy as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
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
   * Get checkpoint statistics
   * GET /api/v1/checkpoints/:checkpointId/stats
   * Requires: ADMIN_STAFF or higher
   */
  static async getCheckpointStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const checkpointId = (req.params.checkpointId as string) as string;

      if (!checkpointId) {
        throw new ValidationError('Checkpoint ID is required');
      }

      const stats = await CheckpointService.getCheckpointStats(checkpointId);

      if (!stats) {
        throw new NotFoundError('Checkpoint not found');
      }

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get event checkpoint summary
   * GET /api/v1/checkpoints/event/:eventId/summary
   * Requires: ADMIN_STAFF or higher
   */
  static async getEventCheckpointSummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const eventId = (req.params.eventId as string) as string;

      if (!eventId) {
        throw new ValidationError('Event ID is required');
      }

      const summary = await CheckpointService.getEventCheckpointSummary(eventId);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign staff to checkpoint
   * POST /api/v1/checkpoints/:checkpointId/staff
   * Requires: ADMIN_STAFF or higher
   */
  static async assignStaff(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const checkpointId = (req.params.checkpointId as string) as string;
      const { staffId, shiftStart, shiftEnd } = req.body;

      if (!checkpointId) {
        throw new ValidationError('Checkpoint ID is required');
      }

      if (!staffId || typeof staffId !== 'string') {
        throw new ValidationError('Staff ID is required');
      }

      const assignment = await CheckpointService.assignStaff(checkpointId, staffId, req.user.id, {
        shiftStart: shiftStart ? new Date(shiftStart) : undefined,
        shiftEnd: shiftEnd ? new Date(shiftEnd) : undefined,
      });

      res.status(200).json({
        success: true,
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove staff from checkpoint
   * DELETE /api/v1/checkpoints/:checkpointId/staff/:staffId
   * Requires: ADMIN_STAFF or higher
   */
  static async removeStaff(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const checkpointId = (req.params.checkpointId as string) as string;
      const staffId = (req.params.staffId as string) as string;

      if (!checkpointId || !staffId) {
        throw new ValidationError('Checkpoint ID and Staff ID are required');
      }

      await CheckpointService.removeStaff(checkpointId, staffId);

      res.status(200).json({
        success: true,
        message: 'Staff removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get checkpoint staff
   * GET /api/v1/checkpoints/:checkpointId/staff
   * Requires: ADMIN_STAFF or higher
   */
  static async getCheckpointStaff(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const checkpointId = (req.params.checkpointId as string) as string;

      if (!checkpointId) {
        throw new ValidationError('Checkpoint ID is required');
      }

      const staff = await CheckpointService.getCheckpointStaff(checkpointId);

      res.status(200).json({
        success: true,
        data: staff,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get attendee checkpoint status
   * GET /api/v1/checkpoints/attendee/:registrationId
   * Requires: TELLER or higher
   */
  static async getAttendeeCheckpointStatus(
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

      const registrationId = (req.params.registrationId as string) as string;
      const { eventId } = req.query;

      if (!registrationId) {
        throw new ValidationError('Registration ID is required');
      }

      if (!eventId || typeof eventId !== 'string') {
        throw new ValidationError('Event ID is required');
      }

      const status = await CheckpointService.getAttendeeCheckpointStatus(registrationId, eventId);

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check attendee eligibility for checkpoint
   * GET /api/v1/checkpoints/:checkpointId/eligibility/:registrationId
   * Requires: TELLER or higher
   */
  static async checkEligibility(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const checkpointId = (req.params.checkpointId as string) as string;
      const registrationId = (req.params.registrationId as string) as string;

      if (!checkpointId || !registrationId) {
        throw new ValidationError('Checkpoint ID and Registration ID are required');
      }

      const eligibility = await CheckpointService.checkEligibility(checkpointId, registrationId);

      res.status(200).json({
        success: true,
        data: eligibility,
      });
    } catch (error) {
      next(error);
    }
  }
}
