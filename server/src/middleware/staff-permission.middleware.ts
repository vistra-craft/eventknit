import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware.js';
import { StaffPermissionService } from '../services/staff-permission.service.js';
import { AuthorizationError } from '../utils/errors.js';

/**
 * Middleware to check if user can access an event
 * Validates event-staff assignments for organizer staff
 */
export const requireEventAccess = () => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const eventId = (req.params.eventId as string);

      if (!eventId) {
        throw new AuthorizationError('Event ID is required');
      }

      await StaffPermissionService.validateEventAccess(
        req.user.id,
        req.user.role,
        eventId,
      );

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if organizer can access their staff
 */
export const requireOrganizerStaffAccess = () => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const staffId = (req.params.staffId as string);

      if (!staffId) {
        throw new AuthorizationError('Staff ID is required');
      }

      await StaffPermissionService.validateOrganizerStaffAccess(
        req.user.id,
        staffId,
      );

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if organizer can access their event
 */
export const requireOrganizerEventAccess = () => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const eventId = (req.params.eventId as string);

      if (!eventId) {
        throw new AuthorizationError('Event ID is required');
      }

      await StaffPermissionService.validateOrganizerEventAccess(
        req.user.id,
        eventId,
      );

      next();
    } catch (error) {
      next(error);
    }
  };
};



