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
  SUPERADMIN: 9,
  ADMIN_STAFF: 8,
  MARKETER: 7,
  SUPPORT: 6,
  TELLER: 5,
  ORGANIZER: 4,
  ORGANIZER_STAFF: 3,
  ORGANIZER_TELLER: 2,
  ATTENDEE: 1,
};

/**
 * Roles that can create users with specific roles
 * (Mirrors backend roleCreationRules)
 */
export const roleCreationRules: Record<UserRole, UserRole[]> = {
  SUPERADMIN: [
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
  ADMIN_STAFF: [
    UserRole.ADMIN_STAFF,
    UserRole.MARKETER,
    UserRole.SUPPORT,
    UserRole.TELLER,
    UserRole.ORGANIZER,
    UserRole.ORGANIZER_STAFF,
    UserRole.ORGANIZER_TELLER,
    UserRole.ATTENDEE,
  ],
  MARKETER: [
    UserRole.MARKETER,
    UserRole.SUPPORT,
    UserRole.ORGANIZER,
    UserRole.ORGANIZER_STAFF,
    UserRole.ORGANIZER_TELLER,
    UserRole.ATTENDEE,
  ],
  SUPPORT: [],
  TELLER: [],
  ORGANIZER: [
    UserRole.ORGANIZER_STAFF,
    UserRole.ORGANIZER_TELLER,
  ],
  ORGANIZER_STAFF: [],
  ORGANIZER_TELLER: [],
  ATTENDEE: [],
};
