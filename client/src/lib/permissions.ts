/**
 * Client-side Permission Checking Functions
 * Mirrors backend logic from server/src/utils/privileges.ts
 */

import { UserRole } from '@/types/auth';
import { roleHierarchy, roleCreationRules } from '@/types/permissions';
import type { PermissionResult, RoleInfo } from '@/types/permissions';

/**
 * Check if a user role can create another user with a specific role
 */
export const canCreateRole = (userRole: UserRole, targetRole: UserRole): boolean => {
  const allowedRoles = roleCreationRules[userRole] || [];
  return allowedRoles.includes(targetRole);
};

/**
 * Check if a user can modify another user based on roles
 */
export const canModifyUser = (userRole: UserRole, targetUserRole: UserRole): boolean => {
  // SUPERADMIN can modify anyone
  if (userRole === UserRole.SUPERADMIN) return true;

  // ADMIN_STAFF cannot modify SUPERADMIN
  if (userRole === UserRole.ADMIN_STAFF && targetUserRole === UserRole.SUPERADMIN) {
    return false;
  }

  // MARKETER cannot modify SUPERADMIN or ADMIN_STAFF
  if (
    userRole === UserRole.MARKETER &&
    (targetUserRole === UserRole.SUPERADMIN || targetUserRole === UserRole.ADMIN_STAFF)
  ) {
    return false;
  }

  // ORGANIZER can only modify their staff
  if (userRole === UserRole.ORGANIZER) {
    return (
      targetUserRole === UserRole.ORGANIZER_STAFF || targetUserRole === UserRole.ORGANIZER_TELLER
    );
  }

  // Otherwise, check role hierarchy
  return roleHierarchy[userRole] >= roleHierarchy[targetUserRole];
};

/**
 * Check if a user can delete another user
 */
export const canDeleteUser = (userRole: UserRole, targetUserRole: UserRole): boolean => {
  // SUPERADMIN can delete anyone (including other SUPERADMINs)
  if (userRole === UserRole.SUPERADMIN) return true;

  // ADMIN_STAFF cannot delete SUPERADMIN
  if (userRole === UserRole.ADMIN_STAFF && targetUserRole === UserRole.SUPERADMIN) {
    return false;
  }

  // MARKETER cannot delete SUPERADMIN or ADMIN_STAFF
  if (
    userRole === UserRole.MARKETER &&
    (targetUserRole === UserRole.SUPERADMIN || targetUserRole === UserRole.ADMIN_STAFF)
  ) {
    return false;
  }

  // ORGANIZER can only delete their staff
  if (userRole === UserRole.ORGANIZER) {
    return (
      targetUserRole === UserRole.ORGANIZER_STAFF || targetUserRole === UserRole.ORGANIZER_TELLER
    );
  }

  // For now, only admins can delete
  return false;
};

/**
 * Get all permissions for a role against a target role
 */
export const getPermissions = (
  userRole: UserRole,
  targetRole: UserRole,
): PermissionResult => {
  return {
    canCreate: canCreateRole(userRole, targetRole),
    canModify: canModifyUser(userRole, targetRole),
    canDelete: canDeleteUser(userRole, targetRole),
  };
};

/**
 * Get role description
 */
export const getRoleDescription = (role: UserRole): string => {
  const descriptions: Record<UserRole, string> = {
    [UserRole.SUPERADMIN]: 'Full system access with all permissions',
    [UserRole.ADMIN_STAFF]: 'Administrative staff with management capabilities',
    [UserRole.MARKETER]: 'Marketing team member with event promotion access',
    [UserRole.SUPPORT]: 'Customer support team member',
    [UserRole.TELLER]: 'Event staff member for ticket scanning and check-in',
    [UserRole.ORGANIZER]: 'Event organizer with full event management capabilities',
    [UserRole.ORGANIZER_STAFF]: 'Organizer staff member with limited event management',
    [UserRole.ORGANIZER_TELLER]: 'Organizer teller for ticket scanning at specific events',
    [UserRole.ATTENDEE]: 'Regular event attendee',
  };

  return descriptions[role] || 'No description available';
};

/**
 * Get display name for a role
 */
export const getRoleDisplayName = (role: UserRole): string => {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Build role information with permissions
 */
export const buildRoleInfo = (
  role: UserRole,
  currentUserRole: UserRole,
  allRoles: UserRole[],
): RoleInfo => {
  const hierarchy = roleHierarchy[role];
  const canCreate = canCreateRole(currentUserRole, role);
  const canModify = canModifyUser(currentUserRole, role);
  const canDelete = canDeleteUser(currentUserRole, role);

  // Get roles that this role can create
  const creatableRoles: UserRole[] = [];
  allRoles.forEach((targetRole) => {
    if (canCreateRole(role, targetRole)) {
      creatableRoles.push(targetRole);
    }
  });

  // Get roles that this role can modify
  const modifiableRoles: UserRole[] = [];
  allRoles.forEach((targetRole) => {
    if (canModifyUser(role, targetRole)) {
      modifiableRoles.push(targetRole);
    }
  });

  return {
    role,
    hierarchy,
    displayName: getRoleDisplayName(role),
    description: getRoleDescription(role),
    canCreate,
    canModify,
    canDelete,
    creatableRoles,
    modifiableRoles,
  };
};

/**
 * Check if user is admin staff (can access all events)
 */
export const isAdminStaff = (userRole: UserRole): boolean => {
  const adminStaffRoles: UserRole[] = [
    UserRole.SUPERADMIN,
    UserRole.ADMIN_STAFF,
    UserRole.MARKETER,
    UserRole.SUPPORT,
    UserRole.TELLER,
  ];
  return adminStaffRoles.includes(userRole);
};

/**
 * Check if user is organizer staff (limited access)
 */
export const isOrganizerStaff = (userRole: UserRole): boolean => {
  return userRole === UserRole.ORGANIZER_STAFF || userRole === UserRole.ORGANIZER_TELLER;
};

/**
 * Check if user can access all events (only SUPERADMIN and ADMIN_STAFF)
 */
export const canAccessAllEvents = (userRole: UserRole): boolean => {
  return userRole === UserRole.SUPERADMIN || userRole === UserRole.ADMIN_STAFF;
};



