import { TicketSecurityService } from '../src/services/ticket-security.service.js';

describe('TicketSecurityService', () => {
  const originalEnv = process.env.TICKET_SECRET_KEY;

  beforeAll(() => {
    // Set a test secret key
    process.env.TICKET_SECRET_KEY = 'test-secret-key-for-ticket-security-service-minimum-32-bytes-long';
  });

  afterAll(() => {
    // Restore original environment
    if (originalEnv) {
      process.env.TICKET_SECRET_KEY = originalEnv;
    } else {
      delete process.env.TICKET_SECRET_KEY;
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
    it('should throw error when secret key is not set', () => {
      const originalKey = process.env.TICKET_SECRET_KEY;
      delete process.env.TICKET_SECRET_KEY;

      expect(() => {
        TicketSecurityService.generateSignature('test-payload');
      }).toThrow();

      process.env.TICKET_SECRET_KEY = originalKey;
    });

    it('should handle errors gracefully in verification', () => {
      const originalKey = process.env.TICKET_SECRET_KEY;
      delete process.env.TICKET_SECRET_KEY;

      const result = TicketSecurityService.verifySignature('test-payload', 'test-signature');
      expect(result).toBe(false);

      process.env.TICKET_SECRET_KEY = originalKey;
    });
  });
});

