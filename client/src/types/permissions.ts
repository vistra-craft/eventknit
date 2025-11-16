/**
 * Permission Types
 */

import { UserRole } from './auth';

/**
 * Role hierarchy for privilege checking
 */
export const roleHierarchy: Record<UserRole, number> = {
  [UserRole.SUPERADMIN]: 9,
  [UserRole.ADMIN_STAFF]: 8,
  [UserRole.MARKETER]: 7,
  [UserRole.SUPPORT]: 6,
  [UserRole.TELLER]: 5,
  [UserRole.ORGANIZER]: 4,
  [UserRole.ORGANIZER_STAFF]: 3,
  [UserRole.ORGANIZER_TELLER]: 2,
  [UserRole.ATTENDEE]: 1,
};

/**
 * Roles that can create users with specific roles
 * (Currently unused, kept for future reference)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _roleCreationRules: Record<UserRole, UserRole[]> = {
  [UserRole.SUPERADMIN]: [
    UserRole.SUPERADMIN,
    UserRole.ADMIN_STAFF,
    UserRole.MARKETER,
    UserRole.SUPPORT,
    UserRole.TELLER,
    UserRole.ORGANIZER,
    UserRole.ORGANIZER_STAFF,
    UserRole.ORGANIZER_TELLER,
    UserRole.ATTENDEE,
  ],
  [UserRole.ADMIN_STAFF]: [
    UserRole.ADMIN_STAFF,
    UserRole.MARKETER,
    UserRole.SUPPORT,
    UserRole.TELLER,
    UserRole.ORGANIZER,
    UserRole.ORGANIZER_STAFF,
    UserRole.ORGANIZER_TELLER,
    UserRole.ATTENDEE,
  ],
  [UserRole.MARKETER]: [
    UserRole.MARKETER,
    UserRole.SUPPORT,
    UserRole.ORGANIZER,
    UserRole.ORGANIZER_STAFF,
    UserRole.ORGANIZER_TELLER,
    UserRole.ATTENDEE,
  ],
  [UserRole.SUPPORT]: [],
  [UserRole.TELLER]: [],
  [UserRole.ORGANIZER]: [
    UserRole.ORGANIZER_STAFF,
    UserRole.ORGANIZER_TELLER,
  ],
  [UserRole.ORGANIZER_STAFF]: [],
  [UserRole.ORGANIZER_TELLER]: [],
  [UserRole.ATTENDEE]: [],
};

/**
 * Permission check result
 */
export interface PermissionResult {
  canCreate: boolean;
  canModify: boolean;
  canDelete: boolean;
}

/**
 * Role information with permissions
 */
export interface RoleInfo {
  role: UserRole;
  hierarchy: number;
  displayName: string;
  description: string;
  canCreate: boolean;
  canModify: boolean;
  canDelete: boolean;
  creatableRoles: UserRole[];
  modifiableRoles: UserRole[];
}

