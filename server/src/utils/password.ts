import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { config } from '../config/index.js';
import { logger } from './logger.js';

/**
 * Hash a plain password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, config.security.bcryptRounds);
};

/**
 * Compare a plain password with a hashed password
 */
export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Hash a token (e.g., password reset, email verification) with SHA-256.
 * Tokens are stored as hashes in the database so that a DB compromise
 * doesn't expose usable tokens. The raw token is sent to the user,
 * and on verification we hash the incoming token and look up the hash.
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Check if a password has been found in known data breaches using the
 * HaveIBeenPwned k-anonymity API. Only the first 5 characters of the
 * SHA-1 hash are sent to the API — the full password is never exposed.
 *
 * Returns the number of times the password appeared in breaches,
 * or 0 if it was not found. Returns 0 on network errors (non-blocking).
 */
export const checkPasswordBreach = async (password: string): Promise<number> => {
  try {
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
      signal: AbortSignal.timeout(3000), // 3-second timeout
    });

    if (!response.ok) {
      return 0; // Don't block registration if API is down
    }

    const text = await response.text();
    for (const line of text.split('\n')) {
      const [hashSuffix, count] = line.trim().split(':');
      if (hashSuffix === suffix) {
        return parseInt(count, 10) || 0;
      }
    }

    return 0;
  } catch (error) {
    logger.warn('HIBP password check failed (non-blocking):', error);
    return 0; // Don't block registration if API is unreachable
  }
};

