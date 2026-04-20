/**
 * UUID / Slug identification utilities.
 *
 * Single source of truth for detecting whether an identifier is a UUID
 * (database primary key) or a human-readable slug.
 */

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Returns true when `value` is a well-formed UUID v4 string
 * (case-insensitive, with hyphens).
 */
export const isValidUUID = (value: string): boolean => UUID_REGEX.test(value);
