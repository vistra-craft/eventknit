import { UserRole } from '@prisma/client';
import { AuthorizationError } from './errors.js';

/**
 * Role hierarchy for privilege checking
 */
export const roleHierarchy: Record<UserRole, number> = {
  SUPERADMIN: 10,
  ADMIN: 9,
  SUPPORT: 6,
  TELLER: 5,
  ORGANIZER: 4,
  ORGANIZER_ADMIN: 3,
  ORGANIZER_TELLER: 2,
  ATTENDEE: 1,
};

/**
 * Roles that can create users with specific roles
 */
const roleCreationRules: Record<UserRole, UserRole[]> = {
  SUPERADMIN: [
    UserRole.SUPERADMIN,
    UserRole.ADMIN,
    UserRole.SUPPORT,
    UserRole.TELLER,
    UserRole.ORGANIZER,
    UserRole.ORGANIZER_ADMIN,
    UserRole.ORGANIZER_TELLER,
    UserRole.ATTENDEE,
  ],
  ADMIN: [
    UserRole.ADMIN,
    UserRole.SUPPORT,
    UserRole.TELLER,
    UserRole.ORGANIZER,
    UserRole.ORGANIZER_ADMIN,
    UserRole.ORGANIZER_TELLER,
    UserRole.ATTENDEE,
  ],
  SUPPORT: [],
  TELLER: [],
  ORGANIZER: [
    UserRole.ORGANIZER_ADMIN,
    UserRole.ORGANIZER_TELLER,
  ],
  ORGANIZER_ADMIN: [],
  ORGANIZER_TELLER: [],
  ATTENDEE: [],
};

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
 * Validate role creation permission
 */
export const validateRoleCreation = (userRole: UserRole, targetRole: UserRole): void => {
  if (!canCreateRole(userRole, targetRole)) {
    throw new AuthorizationError(
      `You do not have permission to create users with role: ${targetRole}`,
    );
  }
};

/**
 * Validate user modification permission
 */
export const validateUserModification = (userRole: UserRole, targetUserRole: UserRole): void => {
  if (!canModifyUser(userRole, targetUserRole)) {
    throw new AuthorizationError(
      `You do not have permission to modify users with role: ${targetUserRole}`,
    );
  }
};

/**
 * Validate user deletion permission
 */
export const validateUserDeletion = (userRole: UserRole, targetUserRole: UserRole): void => {
  if (!canDeleteUser(userRole, targetUserRole)) {
    throw new AuthorizationError(
      `You do not have permission to delete users with role: ${targetUserRole}`,
    );
  }
};

/**
 * Check if user is admin staff (can access admin dashboard)
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
 * Check if user has platform admin privileges (SUPERADMIN or ADMIN).
 * Use this instead of inline SUPERADMIN/ADMIN checks in services and controllers.
 */
export const isPlatformAdmin = (userRole: UserRole): boolean => {
  return userRole === UserRole.SUPERADMIN || userRole === UserRole.ADMIN;
};

/**
 * Check if user is organizer staff (limited access)
 */
export const isOrganizerStaff = (userRole: UserRole): boolean => {
  return userRole === UserRole.ORGANIZER_ADMIN || userRole === UserRole.ORGANIZER_TELLER;
};

/**
 * Check if user can access all events (admin roles)
 */
export const canAccessAllEvents = (userRole: UserRole): boolean => {
  return isAdminStaff(userRole);
};
