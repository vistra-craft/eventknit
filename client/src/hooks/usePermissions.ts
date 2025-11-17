/**
 * Permission Hooks
 * React hooks for checking user permissions
 */

import { useMemo, useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { UserRole } from '@/types/auth';
import {
  canCreateRole,
  canModifyUser,
  canDeleteUser,
  getPermissions,
  isAdminStaff,
  isOrganizerStaff,
} from '@/lib/permissions';
import { getAdminStaffEvents } from '@/lib/admin-api';
import { getOrganizerStaffEvents } from '@/lib/organizer-api';
import type { EventStaffAssignment } from '@/lib/admin-api';

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

export interface UsePermissionsReturn {
  canAccess: (feature: string, eventId?: string) => boolean;
  canAccessEvent: (eventId: string) => boolean;
  getAccessibleEvents: () => Promise<EventStaffAssignment[]>;
  hasRole: (role: UserRole) => boolean;
  isAssignedToEvent: (eventId: string) => Promise<boolean>;
  canModifyEvent: (eventId: string) => boolean;
  getAssignedEvents: () => EventStaffAssignment[];
  isAdminStaff: boolean;
  isOrganizerStaff: boolean;
  canAccessAllEvents: boolean;
}

/**
 * Enhanced usePermissions hook with event-staff assignment checks
 */
export const usePermissionsEnhanced = (): UsePermissionsReturn => {
  const { user } = useAuth();
  const userRole = user?.role;
  const [assignedEvents, setAssignedEvents] = useState<EventStaffAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch assigned events for staff members
  useEffect(() => {
    const fetchAssignedEvents = async () => {
      if (!user?.id || !userRole) {
        setLoading(false);
        return;
      }

      // SUPERADMIN and ADMIN_STAFF can access all events, so no need to fetch assignments
      if (userRole === UserRole.SUPERADMIN || userRole === UserRole.ADMIN_STAFF) {
        setLoading(false);
        return;
      }

      // Organizer staff need to fetch their assignments
      if (isOrganizerStaff(userRole)) {
        try {
          const response = await getOrganizerStaffEvents(user.id);
          if (response.success && response.data) {
            setAssignedEvents(response.data.assignments);
          }
        } catch (error) {
          console.error('Error fetching assigned events:', error);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Admin staff (TELLER, MARKETER, SUPPORT) need to fetch their assignments
      if (isAdminStaff(userRole)) {
        try {
          const response = await getAdminStaffEvents(user.id);
          if (response.success && response.data) {
            setAssignedEvents(response.data.assignments);
          }
        } catch (error) {
          console.error('Error fetching assigned events:', error);
        } finally {
          setLoading(false);
        }
        return;
      }

      setLoading(false);
    };

    fetchAssignedEvents();
  }, [user?.id, userRole]);

  const canAccessAll = useMemo(() => {
    if (!userRole) return false;
    // Only SUPERADMIN and ADMIN_STAFF can access all events
    return userRole === UserRole.SUPERADMIN || userRole === UserRole.ADMIN_STAFF;
  }, [userRole]);

  const isAdminStaffUser = useMemo(() => {
    if (!userRole) return false;
    return isAdminStaff(userRole);
  }, [userRole]);

  const isOrganizerStaffUser = useMemo(() => {
    if (!userRole) return false;
    return isOrganizerStaff(userRole);
  }, [userRole]);

  const canAccess = useMemo(
    () => (feature: string, eventId?: string) => {
      if (!userRole) return false;

      // Admin staff can access all features
      if (canAccessAll) return true;

      // For event-specific features, check assignment
      if (eventId) {
        return assignedEvents.some((assignment) => assignment.eventId === eventId);
      }

      // Default: organizer staff have limited access
      return isOrganizerStaffUser;
    },
    [userRole, canAccessAll, assignedEvents, isOrganizerStaffUser],
  );

  const canAccessEvent = useMemo(
    () => (eventId: string) => {
      if (!userRole) return false;
      if (canAccessAll) return true;
      return assignedEvents.some((assignment) => assignment.eventId === eventId);
    },
    [userRole, canAccessAll, assignedEvents],
  );

  const getAccessibleEvents = async (): Promise<EventStaffAssignment[]> => {
    if (!user?.id || !userRole) return [];

    // SUPERADMIN and ADMIN_STAFF can access all events (fetch from events API, not assignments)
    if (canAccessAll) {
      return [];
    }

    if (isOrganizerStaffUser) {
      const response = await getOrganizerStaffEvents(user.id);
      if (response.success && response.data) {
        return response.data.assignments;
      }
    }

    if (isAdminStaffUser) {
      const response = await getAdminStaffEvents(user.id);
      if (response.success && response.data) {
        return response.data.assignments;
      }
    }

    return [];
  };

  const hasRole = useMemo(
    () => (role: UserRole) => {
      return userRole === role;
    },
    [userRole],
  );

  const isAssignedToEvent = async (eventId: string): Promise<boolean> => {
    if (!userRole) return false;
    if (canAccessAll) return true;

    if (loading) {
      // Wait for assignments to load
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return assignedEvents.some((assignment) => assignment.eventId === eventId);
  };

  const canModifyEvent = useMemo(
    () => (eventId: string) => {
      if (!userRole) return false;

      // Admin staff can modify all events
      if (canAccessAll) return true;

      // Organizer staff can only view, not modify
      if (isOrganizerStaffUser) return false;

      // Check if assigned to event with appropriate role
      const assignment = assignedEvents.find((a) => a.eventId === eventId);
      if (!assignment) return false;

      // Only MANAGER, COORDINATOR, SUPERVISOR can modify
      const modifiableRoles = ['MANAGER', 'COORDINATOR', 'SUPERVISOR'];
      return modifiableRoles.includes(assignment.role);
    },
    [userRole, canAccessAll, assignedEvents, isOrganizerStaffUser],
  );

  const getAssignedEvents = useMemo(
    () => (): EventStaffAssignment[] => {
      return assignedEvents;
    },
    [assignedEvents],
  );

  return {
    canAccess,
    canAccessEvent,
    getAccessibleEvents,
    hasRole,
    isAssignedToEvent,
    canModifyEvent,
    getAssignedEvents,
    isAdminStaff: isAdminStaffUser,
    isOrganizerStaff: isOrganizerStaffUser,
    canAccessAllEvents: canAccessAll,
  };
};



