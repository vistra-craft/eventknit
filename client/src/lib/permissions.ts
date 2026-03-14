import { UserRole } from "@/types/auth";
import { roleHierarchy, roleCreationRules } from "@/types/permissions";

/**
 * Check if a user role can create another user with a specific role
 * (Mirrors backend canCreateRole)
 */
export const canCreateRole = (userRole: UserRole, targetRole: UserRole): boolean => {
  const allowedRoles = roleCreationRules[userRole] || [];
  return allowedRoles.includes(targetRole);
};

/**
 * Check if a user can modify another user based on roles
 * (Mirrors backend canModifyUser)
 */
export const canModifyUser = (userRole: UserRole, targetUserRole: UserRole): boolean => {
  // SUPERADMIN can modify anyone
  if (userRole === UserRole.SUPERADMIN) return true;

  // ADMIN can modify anyone except SUPERADMIN
  if (userRole === UserRole.ADMIN && targetUserRole === UserRole.SUPERADMIN) {
    return false;
  }
  if (userRole === UserRole.ADMIN) return true;

  // ORGANIZER can only modify their staff
  if (userRole === UserRole.ORGANIZER) {
    return targetUserRole === UserRole.ORGANIZER_ADMIN || targetUserRole === UserRole.ORGANIZER_TELLER;
  }

  // Otherwise, check role hierarchy
  return roleHierarchy[userRole] >= roleHierarchy[targetUserRole];
};

/**
 * Check if a user can delete another user
 * (Mirrors backend canDeleteUser)
 */
export const canDeleteUser = (userRole: UserRole, targetUserRole: UserRole): boolean => {
  // SUPERADMIN can delete anyone (including other SUPERADMINs)
  if (userRole === UserRole.SUPERADMIN) return true;

  // ADMIN can delete anyone except SUPERADMIN
  if (userRole === UserRole.ADMIN && targetUserRole === UserRole.SUPERADMIN) {
    return false;
  }
  if (userRole === UserRole.ADMIN) return true;

  // ORGANIZER can only delete their staff
  if (userRole === UserRole.ORGANIZER) {
    return targetUserRole === UserRole.ORGANIZER_ADMIN || targetUserRole === UserRole.ORGANIZER_TELLER;
  }

  // For now, only admins can delete
  return false;
};

/**
 * Check if a user can manage staff (for organizers)
 * (Mirrors backend canManageStaff)
 */
export const canManageStaff = (userRole: UserRole): boolean => {
  const allowedRoles: UserRole[] = [
    UserRole.SUPERADMIN,
    UserRole.ADMIN,
    UserRole.ORGANIZER,
  ];
  return allowedRoles.includes(userRole);
};

/**
 * Check if user is admin staff (can access admin dashboard)
 * (Mirrors backend isAdminStaff)
 */
export const isAdminStaff = (userRole: UserRole): boolean => {
  const adminRoles: UserRole[] = [
    UserRole.SUPERADMIN,
    UserRole.ADMIN,
    UserRole.SUPPORT,
    UserRole.TELLER,
  ];
  return adminRoles.includes(userRole);
};

/**
 * Check if user is organizer staff (limited access)
 * (Mirrors backend isOrganizerStaff)
 */
export const isOrganizerStaff = (userRole: UserRole): boolean => {
  return userRole === UserRole.ORGANIZER_ADMIN || userRole === UserRole.ORGANIZER_TELLER;
};

/**
 * Check if user can access all events (admin roles)
 * (Mirrors backend canAccessAllEvents)
 */
export const canAccessAllEvents = (userRole: UserRole): boolean => {
  return isAdminStaff(userRole);
};

/**
 * Get all roles that a user can create
 */
export const getCreatableRoles = (userRole: UserRole): UserRole[] => {
  return roleCreationRules[userRole] || [];
};

/**
 * Get all roles that a user can modify
 */
export const getModifiableRoles = (userRole: UserRole): UserRole[] => {
  const allRoles = Object.values(UserRole);
  return allRoles.filter((role) => canModifyUser(userRole, role));
};

/**
 * Get all roles that a user can delete
 */
export const getDeletableRoles = (userRole: UserRole): UserRole[] => {
  const allRoles = Object.values(UserRole);
  return allRoles.filter((role) => canDeleteUser(userRole, role));
};
