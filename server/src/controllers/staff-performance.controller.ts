import { Response, NextFunction } from 'express';
import { StaffPerformanceService, type PerformancePeriod } from '../services/staff-performance.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/errors.js';
import { UserRole } from '@prisma/client';

/**
 * Staff Performance Controller
 * Handles API requests for staff performance metrics and analytics
 */
export class StaffPerformanceController {
  /**
   * Get performance metrics for a specific staff member
   * GET /api/v1/admin/staff-performance/:staffId
   * GET /api/v1/organizer/staff-performance/:staffId
   */
  static async getStaffPerformance(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const { staffId } = req.params;
      const period = (req.query.period as PerformancePeriod) || 'all';

      if (!Object.values(['today', 'week', 'month', 'quarter', 'year', 'all']).includes(period)) {
        throw new ValidationError(`Invalid period: ${period}`);
      }

      // Check permissions
      const isAdmin = req.user.role === UserRole.SUPERADMIN || req.user.role === UserRole.ADMIN_STAFF;
      const isOrganizer = req.user.role === UserRole.ORGANIZER || req.user.role === UserRole.ORGANIZER_STAFF || req.user.role === UserRole.ORGANIZER_TELLER;
      const isSelf = req.user.id === staffId;

      // Staff can only view their own performance
      // Admins can view any admin staff performance
      // Organizers can view their organizer staff performance
      if (!isSelf && !isAdmin && !isOrganizer) {
        throw new AuthorizationError('Insufficient permissions to view staff performance');
      }

      const performance = await StaffPerformanceService.getStaffPerformance(
        staffId,
        period,
      );

      if (!performance) {
        throw new NotFoundError('Staff member not found');
      }

      res.status(200).json({
        success: true,
        data: performance,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get team performance metrics
   * GET /api/v1/admin/staff-performance/team
   * GET /api/v1/organizer/staff-performance/team
   */
  static async getTeamPerformance(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const period = (req.query.period as PerformancePeriod) || 'all';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      if (!Object.values(['today', 'week', 'month', 'quarter', 'year', 'all']).includes(period)) {
        throw new ValidationError(`Invalid period: ${period}`);
      }

      // Determine staff type based on user role
      let staffType: 'ADMIN_STAFF' | 'ORGANIZER_STAFF';
      
      if (req.user.role === UserRole.SUPERADMIN || req.user.role === UserRole.ADMIN_STAFF) {
        staffType = 'ADMIN_STAFF';
      } else if (req.user.role === UserRole.ORGANIZER || req.user.role === UserRole.ORGANIZER_STAFF || req.user.role === UserRole.ORGANIZER_TELLER) {
        staffType = 'ORGANIZER_STAFF';
      } else {
        throw new AuthorizationError('Insufficient permissions to view team performance');
      }

      const performances = await StaffPerformanceService.getTeamPerformance(
        staffType,
        period,
        limit,
      );

      res.status(200).json({
        success: true,
        data: {
          performances,
          count: performances.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get team performance summary
   * GET /api/v1/admin/staff-performance/team/summary
   * GET /api/v1/organizer/staff-performance/team/summary
   */
  static async getTeamSummary(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const period = (req.query.period as PerformancePeriod) || 'all';

      if (!Object.values(['today', 'week', 'month', 'quarter', 'year', 'all']).includes(period)) {
        throw new ValidationError(`Invalid period: ${period}`);
      }

      // Determine staff type based on user role
      let staffType: 'ADMIN_STAFF' | 'ORGANIZER_STAFF';
      
      if (req.user.role === UserRole.SUPERADMIN || req.user.role === UserRole.ADMIN_STAFF) {
        staffType = 'ADMIN_STAFF';
      } else if (req.user.role === UserRole.ORGANIZER || req.user.role === UserRole.ORGANIZER_STAFF || req.user.role === UserRole.ORGANIZER_TELLER) {
        staffType = 'ORGANIZER_STAFF';
      } else {
        throw new AuthorizationError('Insufficient permissions to view team summary');
      }

      const summary = await StaffPerformanceService.getTeamSummary(
        staffType,
        period,
      );

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get performance trends for a staff member
   * GET /api/v1/admin/staff-performance/:staffId/trends
   * GET /api/v1/organizer/staff-performance/:staffId/trends
   */
  static async getPerformanceTrends(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const { staffId } = req.params;
      const period = (req.query.period as PerformancePeriod) || 'month';

      if (!Object.values(['today', 'week', 'month', 'quarter', 'year', 'all']).includes(period)) {
        throw new ValidationError(`Invalid period: ${period}`);
      }

      // Check permissions (same as getStaffPerformance)
      const isAdmin = req.user.role === UserRole.SUPERADMIN || req.user.role === UserRole.ADMIN_STAFF;
      const isOrganizer = req.user.role === UserRole.ORGANIZER || req.user.role === UserRole.ORGANIZER_STAFF || req.user.role === UserRole.ORGANIZER_TELLER;
      const isSelf = req.user.id === staffId;

      if (!isSelf && !isAdmin && !isOrganizer) {
        throw new AuthorizationError('Insufficient permissions to view performance trends');
      }

      const trends = await StaffPerformanceService.getPerformanceTrends(
        staffId,
        period,
      );

      res.status(200).json({
        success: true,
        data: trends,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get organizer staff utilization metrics
   * GET /api/v1/organizer/staff-performance/utilization
   */
  static async getOrganizerStaffUtilization(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const period = (req.query.period as PerformancePeriod) || 'month';

      if (!Object.values(['today', 'week', 'month', 'quarter', 'year', 'all']).includes(period)) {
        throw new ValidationError(`Invalid period: ${period}`);
      }

      // Only organizers can access this
      if (
        req.user.role !== UserRole.ORGANIZER &&
        req.user.role !== UserRole.ORGANIZER_STAFF &&
        req.user.role !== UserRole.ORGANIZER_TELLER
      ) {
        throw new AuthorizationError(
          'Insufficient permissions to view staff utilization',
        );
      }

      const utilization = await StaffPerformanceService.getOrganizerStaffUtilization(
        req.user.id,
        period,
      );

      res.status(200).json({
        success: true,
        data: utilization,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get event coverage analysis
   * GET /api/v1/organizer/staff-performance/coverage
   */
  static async getEventCoverageAnalysis(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const period = (req.query.period as PerformancePeriod) || 'month';

      if (!Object.values(['today', 'week', 'month', 'quarter', 'year', 'all']).includes(period)) {
        throw new ValidationError(`Invalid period: ${period}`);
      }

      // Only organizers can access this
      if (
        req.user.role !== UserRole.ORGANIZER &&
        req.user.role !== UserRole.ORGANIZER_STAFF &&
        req.user.role !== UserRole.ORGANIZER_TELLER
      ) {
        throw new AuthorizationError(
          'Insufficient permissions to view event coverage',
        );
      }

      const coverage = await StaffPerformanceService.getEventCoverageAnalysis(
        req.user.id,
        period,
      );

      res.status(200).json({
        success: true,
        data: coverage,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get staff availability tracking
   * GET /api/v1/organizer/staff-performance/availability
   */
  static async getStaffAvailability(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const period = (req.query.period as PerformancePeriod) || 'month';

      if (!Object.values(['today', 'week', 'month', 'quarter', 'year', 'all']).includes(period)) {
        throw new ValidationError(`Invalid period: ${period}`);
      }

      // Only organizers can access this
      if (
        req.user.role !== UserRole.ORGANIZER &&
        req.user.role !== UserRole.ORGANIZER_STAFF &&
        req.user.role !== UserRole.ORGANIZER_TELLER
      ) {
        throw new AuthorizationError(
          'Insufficient permissions to view staff availability',
        );
      }

      const availability = await StaffPerformanceService.getStaffAvailability(
        req.user.id,
        period,
      );

      res.status(200).json({
        success: true,
        data: availability,
      });
    } catch (error) {
      next(error);
    }
  }
}


