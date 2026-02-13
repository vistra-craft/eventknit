/**
 * Role Labels - Display-Friendly Terminology
 *
 * This file maps backend role enums to user-friendly UI labels.
 *
 * Strategy: Keep backend code unchanged (ATTENDEE/ORGANIZER),
 * but display industry-standard terminology in the UI.
 *
 * Based on 2026 industry research: Eventbrite, Meetup, Ticket Tailor
 */

export type UserRole =
  | 'ATTENDEE'
  | 'ORGANIZER'
  | 'ORGANIZER_STAFF'
  | 'ORGANIZER_TELLER'
  | 'ADMIN'
  | 'ADMIN_STAFF'
  | 'SUPERADMIN';

/**
 * Primary role labels (full names for profile, settings, etc.)
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  ATTENDEE: 'Attendee',
  ORGANIZER: 'Event Organizer',
  ORGANIZER_STAFF: 'Team Member',
  ORGANIZER_TELLER: 'Check-in Staff',
  ADMIN: 'Administrator',
  ADMIN_STAFF: 'Admin Team Member',
  SUPERADMIN: 'Super Administrator',
};

/**
 * Short role labels (for badges, compact displays)
 */
export const ROLE_LABELS_SHORT: Record<UserRole, string> = {
  ATTENDEE: 'Attendee',
  ORGANIZER: 'Organizer',
  ORGANIZER_STAFF: 'Staff',
  ORGANIZER_TELLER: 'Check-in',
  ADMIN: 'Admin',
  ADMIN_STAFF: 'Admin Staff',
  SUPERADMIN: 'Super Admin',
};

/**
 * Role descriptions (for tooltips, help text)
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ATTENDEE: 'Browse and attend events',
  ORGANIZER: 'Create and manage events',
  ORGANIZER_STAFF: 'Help manage events as a team member',
  ORGANIZER_TELLER: 'Check-in attendees at events',
  ADMIN: 'Manage platform and users',
  ADMIN_STAFF: 'Support platform administration',
  SUPERADMIN: 'Full platform control',
};

/**
 * Role badge colors (for UI consistency)
 */
export const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  ATTENDEE: 'blue',
  ORGANIZER: 'purple',
  ORGANIZER_STAFF: 'teal',
  ORGANIZER_TELLER: 'cyan',
  ADMIN: 'red',
  ADMIN_STAFF: 'orange',
  SUPERADMIN: 'pink',
};

/**
 * Get display label for a role
 * @param role - The backend role enum value
 * @param short - Use short version (default: false)
 * @returns User-friendly role label
 */
export function getRoleLabel(role: UserRole, short: boolean = false): string {
  if (short) {
    return ROLE_LABELS_SHORT[role] || role;
  }
  return ROLE_LABELS[role] || role;
}

/**
 * Get role description
 * @param role - The backend role enum value
 * @returns Role description text
 */
export function getRoleDescription(role: UserRole): string {
  return ROLE_DESCRIPTIONS[role] || '';
}

/**
 * Get role badge color
 * @param role - The backend role enum value
 * @returns Color name for badge styling
 */
export function getRoleBadgeColor(role: UserRole): string {
  return ROLE_BADGE_COLORS[role] || 'gray';
}
