import crypto from 'crypto';
import { logger } from './logger.js';

/**
 * Encryption utility for sensitive settings
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64; // 512 bits
const KEY_LENGTH = 32; // 256 bits
const ITERATIONS = 100000;

/**
 * Get encryption key from environment variable
 * Falls back to a default key (should be set in production)
 */
function getEncryptionKey(): string {
  const key = process.env.SETTINGS_ENCRYPTION_KEY;
  if (!key) {
    logger.warn(
      'SETTINGS_ENCRYPTION_KEY not set, using default (not secure for production)',
    );
    // Default key for development - MUST be changed in production
    return 'default-dev-key-change-in-production-min-32-chars';
  }
  return key;
}

/**
 * Derive a key from the master key using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt a value
 */
export function encrypt(value: string): string {
  try {
    const masterKey = getEncryptionKey();
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(masterKey, salt);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Combine salt + iv + tag + encrypted data
    const combined =
      `${salt.toString('hex') 
      }:${ 
        iv.toString('hex') 
      }:${ 
        tag.toString('hex') 
      }:${ 
        encrypted}`;

    return combined;
  } catch (error) {
    logger.error('Encryption failed:', error);
    throw new Error('Failed to encrypt value');
  }
}

/**
 * Decrypt a value
 */
export function decrypt(encryptedValue: string): string {
  try {
    const masterKey = getEncryptionKey();
    const parts = encryptedValue.split(':');

    if (parts.length !== 4) {
      throw new Error('Invalid encrypted value format');
    }

    const salt = Buffer.from(parts[0], 'hex');
    const iv = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];

    const key = deriveKey(masterKey, salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('Decryption failed:', error);
    throw new Error('Failed to decrypt value');
  }
}

/**
 * Check if a value is encrypted (basic check)
 */
export function isEncrypted(value: string): boolean {
  // Encrypted values have the format: salt:iv:tag:encrypted (4 parts separated by :)
  return value.split(':').length === 4;
}
