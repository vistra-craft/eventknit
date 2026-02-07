import crypto from 'crypto';
import { logger } from '../utils/logger.js';

/**
 * TicketSecurityService
 * 
 * Centralized cryptographic operations for ticket security.
 * Handles signature generation and verification for QR codes and backup codes.
 */
export class TicketSecurityService {
  private static readonly SECRET_KEY_ENV = 'TICKET_SECRET_KEY';
  private static readonly SIGNATURE_LENGTH = 16; // 16-character hex string (truncated from 64-char hash)
  private static readonly HMAC_ALGORITHM = 'sha256';

  /**
   * Get the secret key from environment variables
   * @throws Error if secret key is not set
   */
  private static getSecretKey(): string {
    const secretKey = process.env[this.SECRET_KEY_ENV] || (process.env.NODE_ENV === 'production' ? null : 'dev-ticket-secret-key-change-in-production-min-32-chars');
    if (!secretKey) {
      throw new Error(`Environment variable ${this.SECRET_KEY_ENV} is not set`);
    }
    if (secretKey.length < 32) {
      logger.warn(`Secret key is shorter than recommended 32 bytes. Current length: ${secretKey.length}`);
    }
    return secretKey;
  }

  /**
   * Generate HMAC-SHA256 signature for ticket data
   * @param payload - The data to sign (e.g., "registrationId|eventId|email|timestamp")
   * @returns 16-character hex string signature
   */
  static generateSignature(payload: string): string {
    try {
      const secretKey = this.getSecretKey();
      const hmac = crypto.createHmac(this.HMAC_ALGORITHM, secretKey);
      hmac.update(payload);
      const hash = hmac.digest('hex');
      // Truncate to 16 characters for shorter QR codes
      return hash.substring(0, this.SIGNATURE_LENGTH);
    } catch (error) {
      logger.error('Failed to generate signature:', error);
      throw new Error('Failed to generate ticket signature');
    }
  }

  /**
   * Verify ticket signature using constant-time comparison (prevents timing attacks)
   * @param payload - The original data that was signed
   * @param providedSignature - The signature to verify
   * @returns true if signature is valid, false otherwise
   */
  static verifySignature(payload: string, providedSignature: string): boolean {
    try {
      const expectedSignature = this.generateSignature(payload);

      // Use timing-safe comparison to prevent timing attacks
      if (expectedSignature.length !== providedSignature.length) {
        return false;
      }

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(providedSignature),
      );
    } catch (error) {
      logger.error('Failed to verify signature:', error);
      return false;
    }
  }

  /**
   * Verify QR code ticket data format
   * Format: registrationId|eventId|email|timestamp|signature
   * @param ticketData - The full QR code data string
   * @returns Object with parsed data and verification result
   */
  static verifyTicketSignature(ticketData: string): {
    isValid: boolean;
    registrationId?: string;
    eventId?: string;
    email?: string;
    timestamp?: number;
    signature?: string;
    error?: string;
  } {
    try {
      const parts = ticketData.split('|');

      // Check if it's the new format (5 parts) or old format (4 parts)
      if (parts.length === 4) {
        // Old format without signature - backward compatibility
        return {
          isValid: true, // Allow old format during migration
          registrationId: parts[0],
          eventId: parts[1],
          email: parts[2],
          timestamp: parseInt(parts[3], 10),
        };
      }

      if (parts.length !== 5) {
        return {
          isValid: false,
          error: 'Invalid ticket format: expected 5 parts separated by |',
        };
      }

      const [registrationId, eventId, email, timestampStr, signature] = parts;
      const timestamp = parseInt(timestampStr, 10);

      if (isNaN(timestamp)) {
        return {
          isValid: false,
          error: 'Invalid timestamp in ticket data',
        };
      }

      // Reconstruct payload (without signature)
      const payload = `${registrationId}|${eventId}|${email}|${timestampStr}`;

      // Verify signature
      const isValid = this.verifySignature(payload, signature);

      return {
        isValid,
        registrationId,
        eventId,
        email,
        timestamp,
        signature,
        error: isValid ? undefined : 'Signature verification failed',
      };
    } catch (error) {
      logger.error('Failed to verify ticket signature:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error during verification',
      };
    }
  }

  /**
   * Generate signature for backup code
   * Used if implementing Option B (Enhanced backup codes with signature)
   * @param code - The backup code
   * @param registrationId - The registration ID
   * @returns 6-character signature
   */
  static generateBackupCodeSignature(code: string, registrationId: string): string {
    try {
      const secretKey = this.getSecretKey();
      const payload = `${code}|${registrationId}`;
      const hmac = crypto.createHmac(this.HMAC_ALGORITHM, secretKey);
      hmac.update(payload);
      const hash = hmac.digest('hex');
      // Return 6-character signature
      return hash.substring(0, 6);
    } catch (error) {
      logger.error('Failed to generate backup code signature:', error);
      throw new Error('Failed to generate backup code signature');
    }
  }

  /**
   * Verify backup code signature (if using Option B)
   * @param code - The backup code
   * @param registrationId - The registration ID
   * @param providedSignature - The signature to verify
   * @returns true if signature is valid
   */
  static verifyBackupCodeSignature(code: string, registrationId: string, providedSignature: string): boolean {
    try {
      const expectedSignature = this.generateBackupCodeSignature(code, registrationId);

      if (expectedSignature.length !== providedSignature.length) {
        return false;
      }

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(providedSignature),
      );
    } catch (error) {
      logger.error('Failed to verify backup code signature:', error);
      return false;
    }
  }
}

