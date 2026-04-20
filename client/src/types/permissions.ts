import { UserRole } from "@/types/auth";

/**
 * Permission check result
 */
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Role hierarchy for privilege checking
 * (Mirrors backend roleHierarchy)
 */
export const roleHierarchy: Record<UserRole, number> = {
  [UserRole.SUPERADMIN]: 10,
  [UserRole.ADMIN]: 9,
  [UserRole.SUPPORT]: 6,
  [UserRole.TELLER]: 5,
  [UserRole.ORGANIZER]: 4,
  [UserRole.ORGANIZER_ADMIN]: 3,
  [UserRole.ORGANIZER_TELLER]: 2,
  [UserRole.ATTENDEE]: 1,
};

/**
 * Roles that can create users with specific roles
 * (Mirrors backend roleCreationRules)
 */
export const roleCreationRules: Record<UserRole, UserRole[]> = {
  [UserRole.SUPERADMIN]: [
    UserRole.SUPERADMIN,
    UserRole.ADMIN,
    UserRole.SUPPORT,
    UserRole.TELLER,
    UserRole.ORGANIZER,
    UserRole.ORGANIZER_ADMIN,
    UserRole.ORGANIZER_TELLER,
    UserRole.ATTENDEE,
  ],
  [UserRole.ADMIN]: [
    UserRole.ADMIN,
    UserRole.SUPPORT,
    UserRole.TELLER,
    UserRole.ORGANIZER,
    UserRole.ORGANIZER_ADMIN,
    UserRole.ORGANIZER_TELLER,
    UserRole.ATTENDEE,
  ],
  [UserRole.SUPPORT]: [],
  [UserRole.TELLER]: [],
  [UserRole.ORGANIZER]: [
    UserRole.ORGANIZER_ADMIN,
    UserRole.ORGANIZER_TELLER,
  ],
  [UserRole.ORGANIZER_ADMIN]: [],
  [UserRole.ORGANIZER_TELLER]: [],
  [UserRole.ATTENDEE]: [],
};
