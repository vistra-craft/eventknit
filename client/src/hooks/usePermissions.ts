/**
 * Permission Hooks
 * React hooks for checking user permissions
 */

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { UserRole } from '@/types/auth';
import {
  canCreateRole,
  canModifyUser,
  canDeleteUser,
  getPermissions,
} from '@/lib/permissions';

/**
 * Hook to check if current user can create a specific role
 */
export const useCanCreateRole = (targetRole: UserRole): boolean => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user?.role) return false;
    return canCreateRole(user.role, targetRole);
  }, [user?.role, targetRole]);
};

/**
 * Hook to check if current user can modify a user with a specific role
 */
export const useCanModifyUser = (targetUserRole: UserRole): boolean => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user?.role) return false;
    return canModifyUser(user.role, targetUserRole);
  }, [user?.role, targetUserRole]);
};

/**
 * Hook to check if current user can delete a user with a specific role
 */
export const useCanDeleteUser = (targetUserRole: UserRole): boolean => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user?.role) return false;
    return canDeleteUser(user.role, targetUserRole);
  }, [user?.role, targetUserRole]);
};

/**
 * Hook to get all permissions for a target role
 */
export const usePermissions = (targetRole: UserRole) => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user?.role) {
      return {
        canCreate: false,
        canModify: false,
        canDelete: false,
      };
    }
    return getPermissions(user.role, targetRole);
  }, [user?.role, targetRole]);
};

/**
 * Hook to check if current user can create any of the provided roles
 * Returns a map of role -> canCreate boolean
 */
export const useCanCreateRoles = (targetRoles: UserRole[]): Record<UserRole, boolean> => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user?.role) {
      return targetRoles.reduce((acc, role) => {
        acc[role] = false;
        return acc;
      }, {} as Record<UserRole, boolean>);
    }

    return targetRoles.reduce((acc, role) => {
      acc[role] = canCreateRole(user.role, role);
      return acc;
    }, {} as Record<UserRole, boolean>);
  }, [user?.role, targetRoles]);
};

/**
 * Hook to get current user's role
 */
export const useCurrentUserRole = (): UserRole | null => {
  const { user } = useAuth();
  return user?.role || null;
};



