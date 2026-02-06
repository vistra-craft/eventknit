import crypto from 'crypto';
import { logger } from '../utils/logger.js';

/**
 * Ed25519CryptoService
 *
 * Asymmetric cryptographic operations for secure ticket signing.
 * Uses Ed25519 algorithm for:
 * - Server: Signs tickets with PRIVATE key
 * - Mobile: Verifies tickets with PUBLIC key (safe to distribute)
 *
 * Key Features:
 * - 32-byte keys, 64-byte signatures
 * - Fast verification (ideal for mobile)
 * - 128-bit security level
 * - No secret key exposure to clients
 */
export class Ed25519CryptoService {
  private static readonly PRIVATE_KEY_ENV = 'TICKET_PRIVATE_KEY';
  private static readonly PUBLIC_KEY_ENV = 'TICKET_PUBLIC_KEY';

  // Cached key objects for performance
  private static privateKeyObject: crypto.KeyObject | null = null;
  private static publicKeyObject: crypto.KeyObject | null = null;
  private static publicKeyBase64: string | null = null;

  /**
   * Initialize or generate Ed25519 key pair
   * In production, keys should be pre-generated and stored in environment variables
   * In development, generates a new pair if not provided
   */
  static initializeKeys(): { publicKey: string; privateKeySet: boolean } {
    const privateKeyHex = process.env[this.PRIVATE_KEY_ENV];
    const publicKeyHex = process.env[this.PUBLIC_KEY_ENV];

    if (privateKeyHex && publicKeyHex) {
      // Use provided keys
      try {
        const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');
        const publicKeyBuffer = Buffer.from(publicKeyHex, 'hex');

        this.privateKeyObject = crypto.createPrivateKey({
          key: Buffer.concat([
            // Ed25519 private key DER prefix
            Buffer.from('302e020100300506032b657004220420', 'hex'),
            privateKeyBuffer,
          ]),
          format: 'der',
          type: 'pkcs8',
        });

        this.publicKeyObject = crypto.createPublicKey({
          key: Buffer.concat([
            // Ed25519 public key DER prefix
            Buffer.from('302a300506032b6570032100', 'hex'),
            publicKeyBuffer,
          ]),
          format: 'der',
          type: 'spki',
        });

        this.publicKeyBase64 = publicKeyHex;
        logger.info('Ed25519 keys loaded from environment variables');

        return {
          publicKey: publicKeyHex,
          privateKeySet: true,
        };
      } catch (error) {
        logger.error('Failed to load Ed25519 keys from environment:', error);
        throw new Error('Invalid Ed25519 keys in environment variables');
      }
    }

    // Development: Generate new key pair
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('Generating new Ed25519 key pair for development. Set TICKET_PRIVATE_KEY and TICKET_PUBLIC_KEY in production!');
      return this.generateKeyPair();
    }

    throw new Error('Ed25519 keys not configured. Set TICKET_PRIVATE_KEY and TICKET_PUBLIC_KEY environment variables.');
  }

  /**
   * Generate a new Ed25519 key pair
   * Returns hex-encoded keys for storage in environment variables
   */
  static generateKeyPair(): { publicKey: string; privateKeySet: boolean } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

    this.privateKeyObject = privateKey;
    this.publicKeyObject = publicKey;

    // Export raw keys for storage
    const publicKeyRaw = publicKey.export({ type: 'spki', format: 'der' });
    const privateKeyRaw = privateKey.export({ type: 'pkcs8', format: 'der' });

    // Extract just the 32-byte key material (skip DER headers)
    const publicKeyBytes = publicKeyRaw.slice(-32);
    const privateKeyBytes = privateKeyRaw.slice(-32);

    this.publicKeyBase64 = publicKeyBytes.toString('hex');

    logger.info('Generated new Ed25519 key pair');
    logger.info(`Public key (hex): ${this.publicKeyBase64}`);
    logger.info(`Private key (hex): ${privateKeyBytes.toString('hex')}`);
    logger.info('Add these to your .env file as TICKET_PUBLIC_KEY and TICKET_PRIVATE_KEY');

    return {
      publicKey: this.publicKeyBase64,
      privateKeySet: true,
    };
  }

  /**
   * Get the public key for distribution to mobile apps
   * Safe to expose - only allows verification, not signing
   */
  static getPublicKey(): string {
    if (!this.publicKeyBase64) {
      this.initializeKeys();
    }
    return this.publicKeyBase64!;
  }

  /**
   * Sign data with the private key
   * Returns Base64URL-encoded signature (64 bytes → ~88 chars)
   */
  static sign(data: string): string {
    if (!this.privateKeyObject) {
      this.initializeKeys();
    }

    try {
      const signature = crypto.sign(null, Buffer.from(data), this.privateKeyObject!);
      return this.base64UrlEncode(signature);
    } catch (error) {
      logger.error('Failed to sign data:', error);
      throw new Error('Signing failed');
    }
  }

  /**
   * Verify signature with the public key
   * Used by server for double-checking; mobile uses its own verification
   */
  static verify(data: string, signatureBase64Url: string): boolean {
    if (!this.publicKeyObject) {
      this.initializeKeys();
    }

    try {
      const signatureBuffer = this.base64UrlDecode(signatureBase64Url);
      return crypto.verify(null, Buffer.from(data), this.publicKeyObject!, signatureBuffer);
    } catch (error) {
      logger.error('Failed to verify signature:', error);
      return false;
    }
  }

  /**
   * Create a signed ticket token (JWT-like format)
   * Format: {header}.{payload}.{signature}
   */
  static createSignedTicket(payload: TicketPayload): string {
    const header = {
      alg: 'EdDSA',
      typ: 'TKT',
    };

    const headerEncoded = this.base64UrlEncode(Buffer.from(JSON.stringify(header)));
    const payloadEncoded = this.base64UrlEncode(Buffer.from(JSON.stringify(payload)));

    const dataToSign = `${headerEncoded}.${payloadEncoded}`;
    const signature = this.sign(dataToSign);

    return `${dataToSign}.${signature}`;
  }

  /**
   * Parse and verify a signed ticket token
   * Returns the payload if valid, null if invalid
   */
  static parseSignedTicket(token: string): TicketPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        logger.debug('Invalid token format: expected 3 parts');
        return null;
      }

      const [headerEncoded, payloadEncoded, signature] = parts;

      // Verify signature
      const dataToVerify = `${headerEncoded}.${payloadEncoded}`;
      if (!this.verify(dataToVerify, signature)) {
        logger.debug('Token signature verification failed');
        return null;
      }

      // Decode and parse payload
      const payloadJson = this.base64UrlDecode(payloadEncoded).toString('utf8');
      const payload = JSON.parse(payloadJson) as TicketPayload;

      // Validate required fields
      if (!payload.rid || !payload.eid || !payload.sub) {
        logger.debug('Token missing required fields');
        return null;
      }

      return payload;
    } catch (error) {
      logger.error('Failed to parse signed ticket:', error);
      return null;
    }
  }

  /**
   * Check if a token is in the new signed format (contains dots)
   */
  static isSignedTicketFormat(code: string): boolean {
    const parts = code.split('.');
    return parts.length === 3 && !code.includes('|');
  }

  // Base64URL encoding (URL-safe, no padding)
  private static base64UrlEncode(buffer: Buffer): string {
    return buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Base64URL decoding
  private static base64UrlDecode(str: string): Buffer {
    // Add padding if needed
    let padded = str.replace(/-/g, '+').replace(/_/g, '/');
    const padding = 4 - (padded.length % 4);
    if (padding !== 4) {
      padded += '='.repeat(padding);
    }
    return Buffer.from(padded, 'base64');
  }
}

/**
 * Ticket payload structure for signed tokens
 * Uses short field names to minimize QR code size
 */
export interface TicketPayload {
  /** Registration ID (rid) */
  rid: string;
  /** Event ID (eid) */
  eid: string;
  /** Subject/Email (sub) */
  sub: string;
  /** Ticket type (tkt) */
  tkt?: string;
  /** Issued at timestamp (iat) */
  iat: number;
  /** Expiration timestamp (exp) - optional */
  exp?: number;
}
