import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import type { AuthenticatedRequest } from './auth.middleware.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';
import { PermissionService } from '../services/permission.service.js';

/** Roles that bypass granular permission checks (full access) */
const BYPASS_ROLES: UserRole[] = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN_STAFF,
  UserRole.ORGANIZER,
];

/**
 * Middleware to check if user has ALL of the required permissions.
 * SUPERADMIN, ADMIN_STAFF, and ORGANIZER bypass this check (they have full access).
 * ORGANIZER_STAFF and ORGANIZER_TELLER must have the permission via their custom role.
 */
export const requirePermission = (...permissionKeys: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Admin and organizer roles bypass granular permission checks
      if (BYPASS_ROLES.includes(req.user.role)) {
        return next();
      }

      // Staff roles: check against their custom role permissions
      const userPermissions = await PermissionService.getUserEffectivePermissions(req.user.id);
      const hasAll = permissionKeys.every(key => userPermissions.includes(key));

      if (!hasAll) {
        throw new AuthorizationError('You do not have the required permissions for this action');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has ANY of the required permissions.
 * Useful when multiple permission keys could grant access to the same resource.
 */
export const requireAnyPermission = (...permissionKeys: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (BYPASS_ROLES.includes(req.user.role)) {
        return next();
      }

      const userPermissions = await PermissionService.getUserEffectivePermissions(req.user.id);
      const hasAny = permissionKeys.some(key => userPermissions.includes(key));

      if (!hasAny) {
        throw new AuthorizationError('You do not have the required permissions for this action');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
