import { Request, Response, NextFunction } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import { verifyAccessToken } from '../utils/jwt.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';
import { prisma } from '../config/database.js';
import { UserRole, UserStatus } from '@prisma/client';

export interface AuthenticatedRequest<P = ParamsDictionary> extends Request<P> {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    status?: UserStatus; // Include status for action checks
  };
}

/**
 * Middleware to authenticate user via JWT token
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyAccessToken(token);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Check account status
    // SUSPENDED users cannot access anything
    if (user.status === UserStatus.SUSPENDED) {
      throw new AuthenticationError('Your account has been suspended. Please contact support');
    }
    // DEACTIVATED users can authenticate but will be restricted from actions
    // ACTIVE users have full access

    // Attach user to request (including status for action checks)
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
    } else {
      next(new AuthenticationError('Invalid or expired token'));
    }
  }
};

/**
 * Middleware to check if user has required role(s)
 * ADMIN is automatically allowed wherever SUPERADMIN is allowed (same privilege tier).
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  // ADMIN inherits SUPERADMIN access — they are the same privilege tier
  const expanded = allowedRoles.includes(UserRole.SUPERADMIN) && !allowedRoles.includes(UserRole.ADMIN)
    ? [...allowedRoles, UserRole.ADMIN]
    : allowedRoles;

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (!expanded.includes(req.user.role)) {
        throw new AuthorizationError('You do not have permission to access this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Role hierarchy check
 * SUPERADMIN > ADMIN > other admin roles
 * ORGANIZER > ORGANIZER_ADMIN > ORGANIZER_TELLER
 */
const roleHierarchy: Record<UserRole, number> = {
  SUPERADMIN: 10,
  ADMIN: 9,
  SUPPORT: 7,
  TELLER: 6,
  ORGANIZER: 5,
  ORGANIZER_ADMIN: 4,
  ORGANIZER_TELLER: 3,
  ATTENDEE: 1,
};

/**
 * Middleware to check if user has minimum role level
 */
export const requireMinRole = (minRole: UserRole) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const userLevel = roleHierarchy[req.user.role] || 0;
      const requiredLevel = roleHierarchy[minRole] || 0;

      if (userLevel < requiredLevel) {
        throw new AuthorizationError('You do not have sufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has one of the allowed roles
 * ADMIN is automatically allowed wherever SUPERADMIN is allowed (same privilege tier).
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  // ADMIN inherits SUPERADMIN access — they are the same privilege tier
  const expanded = allowedRoles.includes(UserRole.SUPERADMIN) && !allowedRoles.includes(UserRole.ADMIN)
    ? [...allowedRoles, UserRole.ADMIN]
    : allowedRoles;

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (!expanded.includes(req.user.role)) {
        throw new AuthorizationError('You do not have sufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to block users whose account is not ACTIVE.
 * Use on routes where only fully approved, active users should operate
 * (e.g. organizer dashboard actions, event creation, staff invitations).
 *
 * PENDING_APPROVAL organizers must wait for admin approval.
 * DEACTIVATED users must contact support or wait for reactivation.
 * SUSPENDED users are already blocked by the authenticate middleware.
 */
export const requireActiveStatus = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (req.user.status === UserStatus.PENDING_APPROVAL) {
      throw new AuthorizationError(
        'Your account is pending approval. You will be notified once an admin reviews your application.',
      );
    }

    if (req.user.status === UserStatus.DEACTIVATED) {
      throw new AuthorizationError(
        'Your account has been deactivated. Please contact support for assistance.',
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - attaches user if token is present, but doesn't fail if missing
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (user && user.status !== UserStatus.SUSPENDED) {
      // Allow ACTIVE and DEACTIVATED users (DEACTIVATED will be restricted from actions)
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      };
    }

    next();
  } catch {
    // If token is invalid, just continue without user
    next();
  }
};

