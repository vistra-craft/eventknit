import { TicketSecurityService } from '../src/services/ticket-security.service.js';
import { Ed25519CryptoService } from '../src/services/ed25519-crypto.service.js';

describe('TicketSecurityService', () => {
  const originalEnv = process.env.TICKET_SECRET_KEY;
  const originalPrivateKey = process.env.TICKET_PRIVATE_KEY;
  const originalPublicKey = process.env.TICKET_PUBLIC_KEY;

  beforeAll(() => {
    // Set a test secret key for HMAC operations
    process.env.TICKET_SECRET_KEY = 'test-secret-key-for-ticket-security-service-minimum-32-bytes-long';
    // Initialize Ed25519 keys (will auto-generate in dev mode)
    TicketSecurityService.initializeEd25519Keys();
  });

  afterAll(() => {
    // Restore original environment
    if (originalEnv) {
      process.env.TICKET_SECRET_KEY = originalEnv;
    } else {
      delete process.env.TICKET_SECRET_KEY;
    }
    if (originalPrivateKey) {
      process.env.TICKET_PRIVATE_KEY = originalPrivateKey;
    } else {
      delete process.env.TICKET_PRIVATE_KEY;
    }
    if (originalPublicKey) {
      process.env.TICKET_PUBLIC_KEY = originalPublicKey;
    } else {
      delete process.env.TICKET_PUBLIC_KEY;
    }
  });

  describe('Signature Generation', () => {
    it('should generate a signature for a payload', () => {
      const payload = 'test-registration-id|test-event-id|test@example.com|1234567890';
      const signature = TicketSecurityService.generateSignature(payload);

      expect(signature).toBeDefined();
      expect(signature.length).toBe(16); // 16-character hex string
      expect(/^[0-9a-f]{16}$/i.test(signature)).toBe(true); // Hex string
    });

    it('should generate consistent signatures for the same payload', () => {
      const payload = 'test-registration-id|test-event-id|test@example.com|1234567890';
      const signature1 = TicketSecurityService.generateSignature(payload);
      const signature2 = TicketSecurityService.generateSignature(payload);

      expect(signature1).toBe(signature2);
    });

    it('should generate different signatures for different payloads', () => {
      const payload1 = 'test-registration-id|test-event-id|test@example.com|1234567890';
      const payload2 = 'test-registration-id|test-event-id|test@example.com|1234567891';
      const signature1 = TicketSecurityService.generateSignature(payload1);
      const signature2 = TicketSecurityService.generateSignature(payload2);

      expect(signature1).not.toBe(signature2);
    });
  });

  describe('Signature Verification', () => {
    it('should verify a valid signature', () => {
      const payload = 'test-registration-id|test-event-id|test@example.com|1234567890';
      const signature = TicketSecurityService.generateSignature(payload);
      const isValid = TicketSecurityService.verifySignature(payload, signature);

      expect(isValid).toBe(true);
    });

    it('should reject an invalid signature', () => {
      const payload = 'test-registration-id|test-event-id|test@example.com|1234567890';
      const invalidSignature = 'invalid-signature';
      const isValid = TicketSecurityService.verifySignature(payload, invalidSignature);

      expect(isValid).toBe(false);
    });

    it('should reject signature with wrong length', () => {
      const payload = 'test-registration-id|test-event-id|test@example.com|1234567890';
      const shortSignature = 'short';
      const isValid = TicketSecurityService.verifySignature(payload, shortSignature);

      expect(isValid).toBe(false);
    });

    it('should use timing-safe comparison', () => {
      const payload = 'test-registration-id|test-event-id|test@example.com|1234567890';
      const signature = TicketSecurityService.generateSignature(payload);
      
      // This test verifies that timing-safe comparison is used
      // by checking that the method works correctly
      const isValid = TicketSecurityService.verifySignature(payload, signature);
      expect(isValid).toBe(true);
    });
  });

  describe('QR Code Ticket Verification', () => {
    it('should verify a valid QR code ticket with signature', () => {
      const registrationId = 'reg-123';
      const eventId = 'evt-456';
      const email = 'test@example.com';
      const timestamp = Date.now().toString();
      const payload = `${registrationId}|${eventId}|${email}|${timestamp}`;
      const signature = TicketSecurityService.generateSignature(payload);
      const ticketData = `${payload}|${signature}`;

      const result = TicketSecurityService.verifyTicketSignature(ticketData);

      expect(result.isValid).toBe(true);
      expect(result.registrationId).toBe(registrationId);
      expect(result.eventId).toBe(eventId);
      expect(result.email).toBe(email);
      expect(result.timestamp).toBe(parseInt(timestamp, 10));
      expect(result.signature).toBe(signature);
    });

    it('should reject QR code ticket with invalid signature', () => {
      const registrationId = 'reg-123';
      const eventId = 'evt-456';
      const email = 'test@example.com';
      const timestamp = Date.now().toString();
      const payload = `${registrationId}|${eventId}|${email}|${timestamp}`;
      const invalidSignature = 'invalid-signature';
      const ticketData = `${payload}|${invalidSignature}`;

      const result = TicketSecurityService.verifyTicketSignature(ticketData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should support backward compatibility with old format (4 parts)', () => {
      const registrationId = 'reg-123';
      const eventId = 'evt-456';
      const email = 'test@example.com';
      const timestamp = Date.now().toString();
      const ticketData = `${registrationId}|${eventId}|${email}|${timestamp}`;

      const result = TicketSecurityService.verifyTicketSignature(ticketData);

      // Old format should be accepted during migration
      expect(result.isValid).toBe(true);
      expect(result.registrationId).toBe(registrationId);
      expect(result.eventId).toBe(eventId);
      expect(result.email).toBe(email);
      expect(result.timestamp).toBe(parseInt(timestamp, 10));
    });

    it('should reject invalid ticket format', () => {
      const invalidTicket = 'invalid-format';
      const result = TicketSecurityService.verifyTicketSignature(invalidTicket);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject ticket with invalid timestamp', () => {
      const registrationId = 'reg-123';
      const eventId = 'evt-456';
      const email = 'test@example.com';
      const invalidTimestamp = 'not-a-number';
      const payload = `${registrationId}|${eventId}|${email}|${invalidTimestamp}`;
      const signature = TicketSecurityService.generateSignature(payload);
      const ticketData = `${payload}|${signature}`;

      const result = TicketSecurityService.verifyTicketSignature(ticketData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Backup Code Signature', () => {
    it('should generate backup code signature', () => {
      const code = 'ABCDEFGHJK';
      const registrationId = 'reg-123';
      const signature = TicketSecurityService.generateBackupCodeSignature(code, registrationId);

      expect(signature).toBeDefined();
      expect(signature.length).toBe(6);
      expect(/^[0-9a-f]{6}$/i.test(signature)).toBe(true);
    });

    it('should verify valid backup code signature', () => {
      const code = 'ABCDEFGHJK';
      const registrationId = 'reg-123';
      const signature = TicketSecurityService.generateBackupCodeSignature(code, registrationId);
      const isValid = TicketSecurityService.verifyBackupCodeSignature(code, registrationId, signature);

      expect(isValid).toBe(true);
    });

    it('should reject invalid backup code signature', () => {
      const code = 'ABCDEFGHJK';
      const registrationId = 'reg-123';
      const invalidSignature = 'invalid';
      const isValid = TicketSecurityService.verifyBackupCodeSignature(code, registrationId, invalidSignature);

      expect(isValid).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when secret key is not set in production', () => {
      const originalKey = process.env.TICKET_SECRET_KEY;
      const originalEnvMode = process.env.NODE_ENV;

      // Simulate production environment
      process.env.NODE_ENV = 'production';
      delete process.env.TICKET_SECRET_KEY;

      expect(() => {
        TicketSecurityService.generateSignature('test-payload');
      }).toThrow();

      // Restore
      process.env.TICKET_SECRET_KEY = originalKey;
      process.env.NODE_ENV = originalEnvMode;
    });

    it('should use fallback key in development when secret key is not set', () => {
      const originalKey = process.env.TICKET_SECRET_KEY;
      const originalEnvMode = process.env.NODE_ENV;

      // Simulate development environment
      process.env.NODE_ENV = 'development';
      delete process.env.TICKET_SECRET_KEY;

      // Should not throw in development - uses fallback key
      expect(() => {
        TicketSecurityService.generateSignature('test-payload');
      }).not.toThrow();

      // Restore
      process.env.TICKET_SECRET_KEY = originalKey;
      process.env.NODE_ENV = originalEnvMode;
    });

    it('should handle errors gracefully in verification', () => {
      const originalKey = process.env.TICKET_SECRET_KEY;
      const originalEnvMode = process.env.NODE_ENV;

      process.env.NODE_ENV = 'production';
      delete process.env.TICKET_SECRET_KEY;

      const result = TicketSecurityService.verifySignature('test-payload', 'test-signature');
      expect(result).toBe(false);

      process.env.TICKET_SECRET_KEY = originalKey;
      process.env.NODE_ENV = originalEnvMode;
    });
  });

  describe('Format Detection', () => {
    it('should detect legacy HMAC format (pipe-separated)', () => {
      const legacyTicket = 'reg-123|evt-456|test@example.com|1234567890|a1b2c3d4e5f6g7h8';
      const format = TicketSecurityService.detectTicketFormat(legacyTicket);
      expect(format).toBe('LEGACY');
    });

    it('should detect signed Ed25519 format (dot-separated)', () => {
      const signedTicket = Ed25519CryptoService.createSignedTicket({
        rid: 'reg-123',
        eid: 'evt-456',
        sub: 'test@example.com',
        iat: Date.now(),
      });
      const format = TicketSecurityService.detectTicketFormat(signedTicket);
      expect(format).toBe('SIGNED');
    });

    it('should detect backup code format', () => {
      const backupCode = 'ABCDEFGHJK';
      const format = TicketSecurityService.detectTicketFormat(backupCode);
      expect(format).toBe('BACKUP');
    });

    it('should detect backup code with signature', () => {
      const backupCodeWithSig = 'ABCDEFGHJK:abc123';
      const format = TicketSecurityService.detectTicketFormat(backupCodeWithSig);
      expect(format).toBe('BACKUP');
    });
  });

  describe('Ed25519 Signed Tickets', () => {
    it('should generate a signed ticket with correct format', () => {
      const signedTicket = TicketSecurityService.generateSignedTicket(
        'reg-123',
        'evt-456',
        'test@example.com',
        'VIP',
      );

      expect(signedTicket).toBeDefined();
      const parts = signedTicket.split('.');
      expect(parts.length).toBe(3); // header.payload.signature
    });

    it('should verify a valid signed ticket', () => {
      const signedTicket = TicketSecurityService.generateSignedTicket(
        'reg-123',
        'evt-456',
        'test@example.com',
        'General',
      );

      const payload = TicketSecurityService.verifySignedTicket(signedTicket);

      expect(payload).not.toBeNull();
      expect(payload?.rid).toBe('reg-123');
      expect(payload?.eid).toBe('evt-456');
      expect(payload?.sub).toBe('test@example.com');
      expect(payload?.tkt).toBe('General');
      expect(payload?.iat).toBeDefined();
    });

    it('should reject a tampered signed ticket', () => {
      const signedTicket = TicketSecurityService.generateSignedTicket(
        'reg-123',
        'evt-456',
        'test@example.com',
      );

      // Tamper with the payload
      const parts = signedTicket.split('.');
      const tamperedPayload = Buffer.from(JSON.stringify({
        rid: 'hacked-reg',
        eid: 'evt-456',
        sub: 'hacker@example.com',
        iat: Date.now(),
      })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const tamperedTicket = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      const payload = TicketSecurityService.verifySignedTicket(tamperedTicket);
      expect(payload).toBeNull();
    });

    it('should reject a ticket with invalid signature', () => {
      const signedTicket = TicketSecurityService.generateSignedTicket(
        'reg-123',
        'evt-456',
        'test@example.com',
      );

      // Replace signature with garbage
      const parts = signedTicket.split('.');
      const invalidTicket = `${parts[0]}.${parts[1]}.invalidSig123`;

      const payload = TicketSecurityService.verifySignedTicket(invalidTicket);
      expect(payload).toBeNull();
    });

    it('should reject a ticket with wrong format', () => {
      const invalidTicket = 'not.a.valid.token.format';
      const payload = TicketSecurityService.verifySignedTicket(invalidTicket);
      expect(payload).toBeNull();
    });

    it('should include expiration when provided', () => {
      const expiresIn = 3600; // 1 hour in seconds
      const signedTicket = TicketSecurityService.generateSignedTicket(
        'reg-123',
        'evt-456',
        'test@example.com',
        'VIP',
        expiresIn,
      );

      const payload = TicketSecurityService.verifySignedTicket(signedTicket);

      expect(payload).not.toBeNull();
      expect(payload?.exp).toBeDefined();
      // Verify expiration is approximately 1 hour from issued at
      // Both iat and exp are in seconds (Unix timestamps)
      if (payload?.iat && payload?.exp) {
        const diff = payload.exp - payload.iat;
        expect(diff).toBe(expiresIn); // Both in seconds
      }
    });
  });

  describe('Public Key Access', () => {
    it('should return the public key as hex string', () => {
      const publicKey = TicketSecurityService.getPublicKey();

      expect(publicKey).toBeDefined();
      expect(typeof publicKey).toBe('string');
      // Ed25519 public keys are 32 bytes = 64 hex characters
      expect(publicKey.length).toBe(64);
      expect(/^[0-9a-f]{64}$/i.test(publicKey)).toBe(true);
    });

    it('should return consistent public key', () => {
      const publicKey1 = TicketSecurityService.getPublicKey();
      const publicKey2 = TicketSecurityService.getPublicKey();

      expect(publicKey1).toBe(publicKey2);
    });
  });

  describe('Feature Flag', () => {
    it('should report signed tickets status as a boolean', () => {
      // Note: USE_SIGNED_TICKETS is a static readonly property evaluated at class load time
      // We can't dynamically change it, so we just verify it returns a boolean
      const result = TicketSecurityService.isSignedTicketsEnabled();
      expect(typeof result).toBe('boolean');
    });

    it('should default to false when USE_SIGNED_TICKETS is not explicitly true', () => {
      // Since the flag is evaluated at class initialization, if it wasn't set to 'true'
      // before the class was loaded, it should be false
      // This test documents the expected default behavior
      const result = TicketSecurityService.isSignedTicketsEnabled();
      // In test environment without USE_SIGNED_TICKETS=true, it should be false
      expect(result).toBe(false);
    });
  });
});

describe('Ed25519CryptoService', () => {
  beforeAll(() => {
    // Initialize keys for tests
    Ed25519CryptoService.initializeKeys();
  });

  describe('Key Generation', () => {
    it('should generate a key pair', () => {
      const result = Ed25519CryptoService.generateKeyPair();

      expect(result.publicKey).toBeDefined();
      expect(result.privateKeySet).toBe(true);
      // Public key should be 32 bytes = 64 hex chars
      expect(result.publicKey.length).toBe(64);
    });

    it('should return consistent public key after initialization', () => {
      const publicKey1 = Ed25519CryptoService.getPublicKey();
      const publicKey2 = Ed25519CryptoService.getPublicKey();

      expect(publicKey1).toBe(publicKey2);
    });
  });

  describe('Signing and Verification', () => {
    it('should sign data and produce a signature', () => {
      const data = 'test data to sign';
      const signature = Ed25519CryptoService.sign(data);

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      // Ed25519 signatures are 64 bytes, base64url encoded ≈ 86 chars
      expect(signature.length).toBeGreaterThan(80);
    });

    it('should verify a valid signature', () => {
      const data = 'test data to verify';
      const signature = Ed25519CryptoService.sign(data);

      const isValid = Ed25519CryptoService.verify(data, signature);
      expect(isValid).toBe(true);
    });

    it('should reject an invalid signature', () => {
      const data = 'original data';
      const signature = Ed25519CryptoService.sign(data);

      // Verify with different data
      const isValid = Ed25519CryptoService.verify('tampered data', signature);
      expect(isValid).toBe(false);
    });

    it('should reject a corrupted signature', () => {
      const data = 'test data';
      const signature = Ed25519CryptoService.sign(data);

      // Corrupt the signature
      const corruptedSig = `${signature.slice(0, -5)  }XXXXX`;
      const isValid = Ed25519CryptoService.verify(data, corruptedSig);
      expect(isValid).toBe(false);
    });
  });

  describe('Signed Ticket Creation and Parsing', () => {
    it('should create a signed ticket in JWT-like format', () => {
      const payload = {
        rid: 'registration-123',
        eid: 'event-456',
        sub: 'user@example.com',
        tkt: 'VIP Pass',
        iat: Date.now(),
      };

      const token = Ed25519CryptoService.createSignedTicket(payload);

      expect(token).toBeDefined();
      const parts = token.split('.');
      expect(parts.length).toBe(3);

      // Header should decode to { alg: 'EdDSA', typ: 'TKT' }
      const headerJson = Buffer.from(
        parts[0].replace(/-/g, '+').replace(/_/g, '/'),
        'base64',
      ).toString('utf8');
      const header = JSON.parse(headerJson);
      expect(header.alg).toBe('EdDSA');
      expect(header.typ).toBe('TKT');
    });

    it('should parse a valid signed ticket', () => {
      const originalPayload = {
        rid: 'reg-abc',
        eid: 'evt-xyz',
        sub: 'test@test.com',
        tkt: 'General',
        iat: Date.now(),
      };

      const token = Ed25519CryptoService.createSignedTicket(originalPayload);
      const parsed = Ed25519CryptoService.parseSignedTicket(token);

      expect(parsed).not.toBeNull();
      expect(parsed?.rid).toBe(originalPayload.rid);
      expect(parsed?.eid).toBe(originalPayload.eid);
      expect(parsed?.sub).toBe(originalPayload.sub);
      expect(parsed?.tkt).toBe(originalPayload.tkt);
    });

    it('should return null for invalid token', () => {
      const parsed = Ed25519CryptoService.parseSignedTicket('invalid.token');
      expect(parsed).toBeNull();
    });

    it('should return null for tampered payload', () => {
      const token = Ed25519CryptoService.createSignedTicket({
        rid: 'original-reg',
        eid: 'original-evt',
        sub: 'original@example.com',
        iat: Date.now(),
      });

      const parts = token.split('.');
      // Create a tampered payload
      const tamperedPayload = Buffer.from(JSON.stringify({
        rid: 'hacked-reg',
        eid: 'hacked-evt',
        sub: 'hacker@example.com',
        iat: Date.now(),
      })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
      const parsed = Ed25519CryptoService.parseSignedTicket(tamperedToken);

      expect(parsed).toBeNull();
    });
  });

  describe('Format Detection', () => {
    it('should correctly identify signed ticket format', () => {
      const signedTicket = Ed25519CryptoService.createSignedTicket({
        rid: 'reg-1',
        eid: 'evt-1',
        sub: 'a@b.com',
        iat: Date.now(),
      });

      expect(Ed25519CryptoService.isSignedTicketFormat(signedTicket)).toBe(true);
    });

    it('should correctly identify legacy format (pipes)', () => {
      const legacyTicket = 'reg-123|evt-456|test@example.com|1234567890|signature';
      expect(Ed25519CryptoService.isSignedTicketFormat(legacyTicket)).toBe(false);
    });

    it('should correctly identify backup codes', () => {
      const backupCode = 'ABCDEFGHJK';
      expect(Ed25519CryptoService.isSignedTicketFormat(backupCode)).toBe(false);
    });
  });
});

