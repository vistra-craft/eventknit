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
  | 'ORGANIZER_ADMIN'
  | 'ORGANIZER_TELLER'
  | 'ADMIN'
  | 'SUPERADMIN'
  | 'SUPPORT'
  | 'TELLER';

/**
 * Primary role labels (full names for profile, settings, etc.)
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  ATTENDEE: 'Attendee',
  ORGANIZER: 'Event Organizer',
  ORGANIZER_ADMIN: 'Team Member',
  ORGANIZER_TELLER: 'Check-in Staff',
  ADMIN: 'Administrator',
  SUPERADMIN: 'Super Administrator',
  SUPPORT: 'Support Team',
  TELLER: 'Teller',
};

/**
 * Short role labels (for badges, compact displays)
 */
export const ROLE_LABELS_SHORT: Record<UserRole, string> = {
  ATTENDEE: 'Attendee',
  ORGANIZER: 'Organizer',
  ORGANIZER_ADMIN: 'Staff',
  ORGANIZER_TELLER: 'Check-in',
  ADMIN: 'Admin',
  SUPERADMIN: 'Super Admin',
  SUPPORT: 'Support',
  TELLER: 'Teller',
};

/**
 * Role descriptions (for tooltips, help text)
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ATTENDEE: 'Browse events, register, manage tickets and transfers',
  ORGANIZER: 'Full organizer dashboard — events, staff, analytics, finance, branding',
  ORGANIZER_ADMIN: 'Manage organizer events, attendees, and analytics (no finance or settings)',
  ORGANIZER_TELLER: 'Event day operations — QR scanning and check-in for assigned events',
  ADMIN: 'Full admin dashboard access except system management',
  SUPERADMIN: 'Full platform access including system health, database, logs, and backups',
  SUPPORT: 'Customer support, communications, marketing, and flagged content review',
  TELLER: 'Event day hub — QR scanning, badge printing, and walk-in registration',
};

/**
 * Role badge colors (for UI consistency)
 */
export const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  ATTENDEE: 'blue',
  ORGANIZER: 'purple',
  ORGANIZER_ADMIN: 'teal',
  ORGANIZER_TELLER: 'cyan',
  ADMIN: 'red',
  SUPERADMIN: 'pink',
  SUPPORT: 'green',
  TELLER: 'indigo',
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
