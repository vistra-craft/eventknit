import { Response, NextFunction } from 'express';
import { UserStatus } from '@prisma/client';
import { AuthorizationError } from '../utils/errors';
import { AuthenticatedRequest } from './auth.middleware';

/**
 * Middleware to ensure user account is ACTIVE before performing actions
 * DEACTIVATED users can login but cannot perform platform actions
 */
export const requireActive = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    if (!req.user) {
      throw new AuthorizationError('Authentication required');
    }

    // Only ACTIVE users can perform actions
    if (req.user.status !== UserStatus.ACTIVE) {
      if (req.user.status === UserStatus.DEACTIVATED) {
        throw new AuthorizationError('Your account has been deactivated. Please contact support to reactivate your account');
      }
      if (req.user.status === UserStatus.SUSPENDED) {
        throw new AuthorizationError('Your account has been suspended. Please contact support');
      }
      throw new AuthorizationError('Your account is not active. Please contact support');
    }

    next();
  } catch (error) {
    next(error);
  }
};




