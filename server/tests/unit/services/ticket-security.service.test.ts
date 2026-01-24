import crypto from 'crypto';
import { TicketSecurityService } from '../../../src/services/ticket-security.service.js';

describe('TicketSecurityService', () => {
  const testSecretKey = 'test-secret-key-minimum-32-characters-long-for-security';

  beforeAll(() => {
    // Set the secret key for all tests
    process.env.TICKET_SECRET_KEY = testSecretKey;
  });

  afterAll(() => {
    // Clean up
    delete process.env.TICKET_SECRET_KEY;
  });

  describe('generateSignature', () => {
    it('should generate 16-character hex signature', () => {
      // Arrange
      const payload = 'reg-123|event-123|user@test.com|1640000000000';

      // Act
      const signature = TicketSecurityService.generateSignature(payload);

      // Assert
      expect(signature).toHaveLength(16);
      expect(signature).toMatch(/^[0-9a-f]{16}$/); // Hex string
    });

    it('should generate consistent signatures for same payload', () => {
      // Arrange
      const payload = 'reg-123|event-123|user@test.com|1640000000000';

      // Act
      const signature1 = TicketSecurityService.generateSignature(payload);
      const signature2 = TicketSecurityService.generateSignature(payload);

      // Assert
      expect(signature1).toBe(signature2);
    });

    it('should generate different signatures for different payloads', () => {
      // Arrange
      const payload1 = 'reg-123|event-123|user@test.com|1640000000000';
      const payload2 = 'reg-456|event-456|other@test.com|1640000000001';

      // Act
      const signature1 = TicketSecurityService.generateSignature(payload1);
      const signature2 = TicketSecurityService.generateSignature(payload2);

      // Assert
      expect(signature1).not.toBe(signature2);
    });

    it('should throw error if secret key is not set', () => {
      // Arrange
      const originalKey = process.env.TICKET_SECRET_KEY;
      const originalEnv = process.env.NODE_ENV;
      delete process.env.TICKET_SECRET_KEY;
      process.env.NODE_ENV = 'production';

      // Act & Assert
      expect(() => {
        TicketSecurityService.generateSignature('test-payload');
      }).toThrow('Failed to generate ticket signature');

      // Restore
      process.env.TICKET_SECRET_KEY = originalKey;
      process.env.NODE_ENV = originalEnv;
    });

    it('should use dev key in non-production when secret not set', () => {
      // Arrange
      const originalKey = process.env.TICKET_SECRET_KEY;
      const originalEnv = process.env.NODE_ENV;
      delete process.env.TICKET_SECRET_KEY;
      process.env.NODE_ENV = 'development';

      // Act
      const signature = TicketSecurityService.generateSignature('test-payload');

      // Assert
      expect(signature).toHaveLength(16);
      expect(signature).toMatch(/^[0-9a-f]{16}$/);

      // Restore
      process.env.TICKET_SECRET_KEY = originalKey;
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('verifySignature', () => {
    it('should return true for valid signature', () => {
      // Arrange
      const payload = 'reg-123|event-123|user@test.com|1640000000000';
      const validSignature = TicketSecurityService.generateSignature(payload);

      // Act
      const result = TicketSecurityService.verifySignature(payload, validSignature);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      // Arrange
      const payload = 'reg-123|event-123|user@test.com|1640000000000';
      const invalidSignature = 'invalid0signature';

      // Act
      const result = TicketSecurityService.verifySignature(payload, invalidSignature);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if signature length does not match', () => {
      // Arrange
      const payload = 'reg-123|event-123|user@test.com|1640000000000';
      const wrongLengthSignature = 'abc123'; // Too short

      // Act
      const result = TicketSecurityService.verifySignature(payload, wrongLengthSignature);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for tampered payload', () => {
      // Arrange
      const originalPayload = 'reg-123|event-123|user@test.com|1640000000000';
      const signature = TicketSecurityService.generateSignature(originalPayload);
      const tamperedPayload = 'reg-456|event-123|user@test.com|1640000000000'; // Changed registration ID

      // Act
      const result = TicketSecurityService.verifySignature(tamperedPayload, signature);

      // Assert
      expect(result).toBe(false);
    });

    it('should use timing-safe comparison', () => {
      // Arrange
      const payload = 'reg-123|event-123|user@test.com|1640000000000';
      const validSignature = TicketSecurityService.generateSignature(payload);

      // Spy on crypto.timingSafeEqual to ensure it's called
      const timingSafeSpy = jest.spyOn(crypto, 'timingSafeEqual');

      // Act
      TicketSecurityService.verifySignature(payload, validSignature);

      // Assert
      expect(timingSafeSpy).toHaveBeenCalled();

      // Restore
      timingSafeSpy.mockRestore();
    });
  });

  describe('verifyTicketSignature', () => {
    it('should verify valid 5-part ticket data', () => {
      // Arrange
      const registrationId = 'reg-123';
      const eventId = 'event-123';
      const email = 'user@test.com';
      const timestamp = Date.now();
      const payload = `${registrationId}|${eventId}|${email}|${timestamp}`;
      const signature = TicketSecurityService.generateSignature(payload);
      const ticketData = `${payload}|${signature}`;

      // Act
      const result = TicketSecurityService.verifyTicketSignature(ticketData);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.registrationId).toBe(registrationId);
      expect(result.eventId).toBe(eventId);
      expect(result.email).toBe(email);
      expect(result.timestamp).toBe(timestamp);
      expect(result.signature).toBe(signature);
      expect(result.error).toBeUndefined();
    });

    it('should accept legacy 4-part format for backward compatibility', () => {
      // Arrange
      const ticketData = 'reg-123|event-123|user@test.com|1640000000000';

      // Act
      const result = TicketSecurityService.verifyTicketSignature(ticketData);

      // Assert
      expect(result.isValid).toBe(true); // Backward compatibility
      expect(result.registrationId).toBe('reg-123');
      expect(result.eventId).toBe('event-123');
      expect(result.email).toBe('user@test.com');
      expect(result.timestamp).toBe(1640000000000);
    });

    it('should reject ticket data with invalid format (too few parts)', () => {
      // Arrange
      const ticketData = 'reg-123|event-123'; // Only 2 parts

      // Act
      const result = TicketSecurityService.verifyTicketSignature(ticketData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid ticket format: expected 5 parts separated by |');
    });

    it('should reject ticket data with invalid format (too many parts)', () => {
      // Arrange
      const ticketData = 'reg-123|event-123|user@test.com|1640000000000|sig|extra'; // 6 parts

      // Act
      const result = TicketSecurityService.verifyTicketSignature(ticketData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid ticket format: expected 5 parts separated by |');
    });

    it('should reject ticket data with invalid timestamp', () => {
      // Arrange
      const ticketData = 'reg-123|event-123|user@test.com|not-a-number|signature';

      // Act
      const result = TicketSecurityService.verifyTicketSignature(ticketData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid timestamp in ticket data');
    });

    it('should reject ticket data with invalid signature', () => {
      // Arrange
      const payload = 'reg-123|event-123|user@test.com|1640000000000';
      const invalidSignature = 'invalid0000000sig';
      const ticketData = `${payload}|${invalidSignature}`;

      // Act
      const result = TicketSecurityService.verifyTicketSignature(ticketData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Signature verification failed');
    });

    it('should reject tampered ticket data', () => {
      // Arrange
      const originalPayload = 'reg-123|event-123|user@test.com|1640000000000';
      const signature = TicketSecurityService.generateSignature(originalPayload);
      // Tamper with registration ID but keep original signature
      const tamperedTicketData = `reg-456|event-123|user@test.com|1640000000000|${signature}`;

      // Act
      const result = TicketSecurityService.verifyTicketSignature(tamperedTicketData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Signature verification failed');
    });
  });

  describe('generateBackupCodeSignature', () => {
    it('should generate 6-character hex signature', () => {
      // Arrange
      const code = 'ABCD123456';
      const registrationId = 'reg-123';

      // Act
      const signature = TicketSecurityService.generateBackupCodeSignature(code, registrationId);

      // Assert
      expect(signature).toHaveLength(6);
      expect(signature).toMatch(/^[0-9a-f]{6}$/); // Hex string
    });

    it('should generate consistent signatures for same code and registration', () => {
      // Arrange
      const code = 'ABCD123456';
      const registrationId = 'reg-123';

      // Act
      const signature1 = TicketSecurityService.generateBackupCodeSignature(code, registrationId);
      const signature2 = TicketSecurityService.generateBackupCodeSignature(code, registrationId);

      // Assert
      expect(signature1).toBe(signature2);
    });

    it('should generate different signatures for different codes', () => {
      // Arrange
      const code1 = 'ABCD123456';
      const code2 = 'EFGH789012';
      const registrationId = 'reg-123';

      // Act
      const signature1 = TicketSecurityService.generateBackupCodeSignature(code1, registrationId);
      const signature2 = TicketSecurityService.generateBackupCodeSignature(code2, registrationId);

      // Assert
      expect(signature1).not.toBe(signature2);
    });

    it('should generate different signatures for different registration IDs', () => {
      // Arrange
      const code = 'ABCD123456';
      const registrationId1 = 'reg-123';
      const registrationId2 = 'reg-456';

      // Act
      const signature1 = TicketSecurityService.generateBackupCodeSignature(code, registrationId1);
      const signature2 = TicketSecurityService.generateBackupCodeSignature(code, registrationId2);

      // Assert
      expect(signature1).not.toBe(signature2);
    });
  });

  describe('verifyBackupCodeSignature', () => {
    it('should return true for valid backup code signature', () => {
      // Arrange
      const code = 'ABCD123456';
      const registrationId = 'reg-123';
      const validSignature = TicketSecurityService.generateBackupCodeSignature(code, registrationId);

      // Act
      const result = TicketSecurityService.verifyBackupCodeSignature(code, registrationId, validSignature);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for invalid backup code signature', () => {
      // Arrange
      const code = 'ABCD123456';
      const registrationId = 'reg-123';
      const invalidSignature = 'abc123';

      // Act
      const result = TicketSecurityService.verifyBackupCodeSignature(code, registrationId, invalidSignature);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if signature length does not match', () => {
      // Arrange
      const code = 'ABCD123456';
      const registrationId = 'reg-123';
      const wrongLengthSignature = 'ab'; // Too short

      // Act
      const result = TicketSecurityService.verifyBackupCodeSignature(code, registrationId, wrongLengthSignature);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for wrong backup code', () => {
      // Arrange
      const originalCode = 'ABCD123456';
      const wrongCode = 'EFGH789012';
      const registrationId = 'reg-123';
      const signature = TicketSecurityService.generateBackupCodeSignature(originalCode, registrationId);

      // Act
      const result = TicketSecurityService.verifyBackupCodeSignature(wrongCode, registrationId, signature);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for wrong registration ID', () => {
      // Arrange
      const code = 'ABCD123456';
      const originalRegistrationId = 'reg-123';
      const wrongRegistrationId = 'reg-456';
      const signature = TicketSecurityService.generateBackupCodeSignature(code, originalRegistrationId);

      // Act
      const result = TicketSecurityService.verifyBackupCodeSignature(code, wrongRegistrationId, signature);

      // Assert
      expect(result).toBe(false);
    });

    it('should use timing-safe comparison', () => {
      // Arrange
      const code = 'ABCD123456';
      const registrationId = 'reg-123';
      const validSignature = TicketSecurityService.generateBackupCodeSignature(code, registrationId);

      // Spy on crypto.timingSafeEqual
      const timingSafeSpy = jest.spyOn(crypto, 'timingSafeEqual');

      // Act
      TicketSecurityService.verifyBackupCodeSignature(code, registrationId, validSignature);

      // Assert
      expect(timingSafeSpy).toHaveBeenCalled();

      // Restore
      timingSafeSpy.mockRestore();
    });
  });
});
