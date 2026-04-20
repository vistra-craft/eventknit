import { useMemo, useCallback, useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import {
  canCreateRole,
  canModifyUser,
  canDeleteUser,
  canManageStaff,
  isAdminStaff,
  isOrganizerStaff,
  canAccessAllEvents,
  getCreatableRoles,
  getModifiableRoles,
  getDeletableRoles,
} from "@/lib/permissions";
import { UserRole } from "@/types/auth";
import { getAdminStaffEvents } from "@/lib/admin-api";
import { getMyPermissions } from "@/lib/organizer-dashboard-api";

/**
 * Hook for checking user permissions
 */
export const usePermissions = () => {
  const { user } = useAuth();
  const currentUserRole = user?.role;

  const permissions = useMemo(() => {
    if (!currentUserRole) {
      return {
        canCreateRole: () => false,
        canModifyUser: () => false,
        canDeleteUser: () => false,
        canManageStaff: false,
        isAdminStaff: false,
        isOrganizerStaff: false,
        canAccessAllEvents: false,
        creatableRoles: [] as UserRole[],
        modifiableRoles: [] as UserRole[],
        deletableRoles: [] as UserRole[],
      };
    }

    return {
      canCreateRole: (targetRole: UserRole) => canCreateRole(currentUserRole, targetRole),
      canModifyUser: (targetUserRole: UserRole) => canModifyUser(currentUserRole, targetUserRole),
      canDeleteUser: (targetUserRole: UserRole) => canDeleteUser(currentUserRole, targetUserRole),
      canManageStaff: canManageStaff(currentUserRole),
      isAdminStaff: isAdminStaff(currentUserRole),
      isOrganizerStaff: isOrganizerStaff(currentUserRole),
      canAccessAllEvents: canAccessAllEvents(currentUserRole),
      creatableRoles: getCreatableRoles(currentUserRole),
      modifiableRoles: getModifiableRoles(currentUserRole),
      deletableRoles: getDeletableRoles(currentUserRole),
    };
  }, [currentUserRole]);

  return permissions;
};

/**
 * Hook for checking if user can create a specific role
 */
export const useCanCreateRole = (targetRole: UserRole | null | undefined) => {
  const { canCreateRole } = usePermissions();
  
  if (!targetRole) return false;
  return canCreateRole(targetRole);
};

/**
 * Hook for checking if user can modify a specific user
 */
export const useCanModifyUser = (targetUserRole: UserRole | null | undefined) => {
  const { canModifyUser } = usePermissions();
  
  if (!targetUserRole) return false;
  return canModifyUser(targetUserRole);
};

/**
 * Hook for checking if user can delete a specific user
 */
export const useCanDeleteUser = (targetUserRole: UserRole | null | undefined) => {
  const { canDeleteUser } = usePermissions();
  
  if (!targetUserRole) return false;
  return canDeleteUser(targetUserRole);
};

/**
 * Enhanced permissions hook with additional event-specific checks
 */
export const usePermissionsEnhanced = () => {
  const basePermissions = usePermissions();
  const { user } = useAuth();

  const isAssignedToEvent = useCallback(async (eventId: string): Promise<boolean> => {
    // If user can access all events, they're automatically assigned
    if (basePermissions.canAccessAllEvents) {
      return true;
    }

    // If no user, can't be assigned
    if (!user?.id) {
      return false;
    }

    try {
      // Check if user is assigned to this event
      const response = await getAdminStaffEvents(user.id);
      if (response.success && response.data) {
        const assignedEventIds = new Set(
          response.data.assignments
            .map((assignment) => assignment.eventId)
            .filter(Boolean)
        );
        return assignedEventIds.has(eventId);
      }
      return false;
    } catch (error) {
      console.error('Error checking event assignment:', error);
      return false;
    }
  }, [basePermissions.canAccessAllEvents, user?.id]);

  return {
    ...basePermissions,
    isAssignedToEvent,
  };
};

/**
 * Hook for fetching the current user's effective granular permissions
 * from the backend (e.g., 'analytics.view', 'communication.send').
 * Returns { permissions, hasPermission, loading }.
 */
export const useUserPermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user?.id) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getMyPermissions();
        if (response.success && response.data?.permissions) {
          setPermissions(response.data.permissions);
        }
      } catch (error) {
        console.error('Error fetching user permissions:', error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user?.id]);

  const hasPermission = useCallback(
    (key: string) => permissions.includes(key),
    [permissions],
  );

  return { permissions, hasPermission, loading };
};
