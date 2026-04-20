import { PrismaClient, EventStatus, UserRole, UserStatus, RegistrationStatus } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { ServicePointRegistrationService } from '../../../src/services/service-point-registration.service.js';
import { ValidationError, NotFoundError } from '../../../src/utils/errors.js';

// Mock dependencies
vi.mock('../../../src/config/database.js', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

vi.mock('../../../src/services/sms.service.js', () => ({
  smsService: {
    sendSMS: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('../../../src/services/ticket.service.js', () => ({
  TicketService: {
    generateBackupTicketCode: vi.fn().mockReturnValue('BACKUP-123456'),
    generateTicketData: vi.fn().mockReturnValue('ticket-data-string'),
    generateQRCode: vi.fn().mockResolvedValue('data:image/png;base64,qrcode'),
  },
}));

vi.mock('../../../src/services/websocket.service.js', () => ({
  websocketService: {
    emitToRoom: vi.fn(),
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { prisma } from '../../../src/config/database.js';
import { smsService } from '../../../src/services/sms.service.js';
import { websocketService } from '../../../src/services/websocket.service.js';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('ServicePointRegistrationService', () => {
  const _futureDate = new Date('2026-12-31');

  const mockStaff = {
    id: 'staff-123',
    email: 'staff@example.com',
    firstName: 'Staff',
    lastName: 'Member',
    status: UserStatus.ACTIVE,
    role: UserRole.TELLER,
  };

  const mockEvent = {
    id: 'event-123',
    title: 'Test Conference',
    status: EventStatus.APPROVED,
    registrationCode: 'TEST2024',
    deletedAt: null,
    isFree: true,
    ticketTypes: [
      { id: 'ticket-1', name: 'General Admission' },
      { id: 'ticket-2', name: 'VIP' },
    ],
  };

  const mockFacility = {
    id: 'facility-123',
    eventId: mockEvent.id,
    name: 'Registration Desk 1',
    isActive: true,
    allowRegistration: true,
  };

  const mockSession = {
    id: 'session-123',
    eventId: mockEvent.id,
    facilityId: mockFacility.id,
    phoneNumber: '254712345678',
    otp: '1234',
    otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
    verified: false,
    staffId: mockStaff.id,
    firstName: null,
    lastName: null,
    email: null,
    company: null,
    industry: null,
    jobTitle: null,
    ticketTypeId: null,
    registrationId: null,
    completed: false,
    cancelled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    event: mockEvent,
  };

  beforeEach(() => {
    mockReset(prismaMock);
    vi.clearAllMocks();
  });

  describe('initiateRegistration', () => {
    const phoneNumber = '+254712345678';

    it('should initiate registration and send OTP', async () => {
      // Arrange
      prismaMock.event.findFirst.mockResolvedValue(mockEvent as any);
      prismaMock.user.findFirst.mockResolvedValue(mockStaff as any);
      prismaMock.servicePointSession.findFirst.mockResolvedValue(null); // No existing session
      prismaMock.servicePointSession.create.mockResolvedValue(mockSession as any);

      // Act
      const result = await ServicePointRegistrationService.initiateRegistration(
        mockEvent.id,
        phoneNumber,
        mockStaff.id,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.sessionId).toBe(mockSession.id);
      expect(result.otpSent).toBe(true);
      expect(result.expiresAt).toBeDefined();
      expect(smsService.sendSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '254712345678',
          isCritical: true,
        }),
      );
    });

    it('should return existing session if one is active', async () => {
      // Arrange
      prismaMock.event.findFirst.mockResolvedValue(mockEvent as any);
      prismaMock.user.findFirst.mockResolvedValue(mockStaff as any);
      prismaMock.servicePointSession.findFirst.mockResolvedValue(mockSession as any);

      // Act
      const result = await ServicePointRegistrationService.initiateRegistration(
        mockEvent.id,
        phoneNumber,
        mockStaff.id,
      );

      // Assert
      expect(result.sessionId).toBe(mockSession.id);
      expect(result.otpSent).toBe(false);
      expect(result.message).toContain('Active session exists');
      expect(prismaMock.servicePointSession.create).not.toHaveBeenCalled();
    });

    it('should throw error for invalid phone number', async () => {
      // Act & Assert
      await expect(
        ServicePointRegistrationService.initiateRegistration(
          mockEvent.id,
          '123', // Too short
          mockStaff.id,
        ),
      ).rejects.toThrow(ValidationError);

      await expect(
        ServicePointRegistrationService.initiateRegistration(
          mockEvent.id,
          '123',
          mockStaff.id,
        ),
      ).rejects.toThrow('Valid phone number is required');
    });

    it('should throw error if event not found', async () => {
      // Arrange
      prismaMock.event.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        ServicePointRegistrationService.initiateRegistration(
          'invalid-event',
          phoneNumber,
          mockStaff.id,
        ),
      ).rejects.toThrow(NotFoundError);

      await expect(
        ServicePointRegistrationService.initiateRegistration(
          'invalid-event',
          phoneNumber,
          mockStaff.id,
        ),
      ).rejects.toThrow('Event not found or not active');
    });

    it('should throw error if staff has insufficient permissions', async () => {
      // Arrange
      prismaMock.event.findFirst.mockResolvedValue(mockEvent as any);
      prismaMock.user.findFirst.mockResolvedValue(null); // No matching staff

      // Act & Assert
      await expect(
        ServicePointRegistrationService.initiateRegistration(
          mockEvent.id,
          phoneNumber,
          'invalid-staff-id',
        ),
      ).rejects.toThrow(ValidationError);

      await expect(
        ServicePointRegistrationService.initiateRegistration(
          mockEvent.id,
          phoneNumber,
          'invalid-staff-id',
        ),
      ).rejects.toThrow('Invalid staff member or insufficient permissions');
    });

    it('should throw error if facility does not allow registration', async () => {
      // Arrange
      prismaMock.event.findFirst.mockResolvedValue(mockEvent as any);
      prismaMock.user.findFirst.mockResolvedValue(mockStaff as any);
      prismaMock.eventFacility.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        ServicePointRegistrationService.initiateRegistration(
          mockEvent.id,
          phoneNumber,
          mockStaff.id,
          'invalid-facility',
        ),
      ).rejects.toThrow(ValidationError);

      await expect(
        ServicePointRegistrationService.initiateRegistration(
          mockEvent.id,
          phoneNumber,
          mockStaff.id,
          'invalid-facility',
        ),
      ).rejects.toThrow('Facility not found or does not allow registration');
    });

    it('should still return success if SMS fails', async () => {
      // Arrange
      prismaMock.event.findFirst.mockResolvedValue(mockEvent as any);
      prismaMock.user.findFirst.mockResolvedValue(mockStaff as any);
      prismaMock.servicePointSession.findFirst.mockResolvedValue(null);
      prismaMock.servicePointSession.create.mockResolvedValue(mockSession as any);
      (smsService.sendSMS as vi.Mock).mockResolvedValue({ success: false, error: 'SMS failed' });

      // Act
      const result = await ServicePointRegistrationService.initiateRegistration(
        mockEvent.id,
        phoneNumber,
        mockStaff.id,
      );

      // Assert
      expect(result.sessionId).toBe(mockSession.id);
      expect(result.otpSent).toBe(false);
      expect(result.message).toContain('SMS delivery failed');
    });
  });

  describe('verifyOTP', () => {
    it('should verify OTP successfully', async () => {
      // Arrange
      prismaMock.servicePointSession.findFirst.mockResolvedValue(mockSession as any);
      prismaMock.servicePointSession.update.mockResolvedValue({
        ...mockSession,
        verified: true,
      } as any);

      // Act
      const result = await ServicePointRegistrationService.verifyOTP(mockSession.id, '1234');

      // Assert
      expect(result.verified).toBe(true);
      expect(result.sessionId).toBe(mockSession.id);
      expect(result.phoneNumber).toBe(mockSession.phoneNumber);
      expect(prismaMock.servicePointSession.update).toHaveBeenCalledWith({
        where: { id: mockSession.id },
        data: { verified: true },
      });
      expect(websocketService.emitToRoom).toHaveBeenCalledWith(
        `event:${mockSession.eventId}`,
        'service-point:otp-verified',
        expect.any(Object),
      );
    });

    it('should throw error for invalid OTP format', async () => {
      // Act & Assert
      await expect(
        ServicePointRegistrationService.verifyOTP(mockSession.id, '12'), // Too short
      ).rejects.toThrow(ValidationError);

      await expect(
        ServicePointRegistrationService.verifyOTP(mockSession.id, '12'),
      ).rejects.toThrow('Invalid OTP format');
    });

    it('should throw error if session not found', async () => {
      // Arrange
      prismaMock.servicePointSession.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        ServicePointRegistrationService.verifyOTP('invalid-session', '1234'),
      ).rejects.toThrow(NotFoundError);

      await expect(
        ServicePointRegistrationService.verifyOTP('invalid-session', '1234'),
      ).rejects.toThrow('Session not found or already completed');
    });

    it('should throw error if OTP has expired', async () => {
      // Arrange
      const expiredSession = {
        ...mockSession,
        otpExpiresAt: new Date(Date.now() - 1000), // Expired
      };
      prismaMock.servicePointSession.findFirst.mockResolvedValue(expiredSession as any);

      // Act & Assert
      await expect(
        ServicePointRegistrationService.verifyOTP(mockSession.id, '1234'),
      ).rejects.toThrow(ValidationError);

      await expect(
        ServicePointRegistrationService.verifyOTP(mockSession.id, '1234'),
      ).rejects.toThrow('OTP has expired');
    });

    it('should throw error for wrong OTP', async () => {
      // Arrange
      prismaMock.servicePointSession.findFirst.mockResolvedValue(mockSession as any);

      // Act & Assert
      await expect(
        ServicePointRegistrationService.verifyOTP(mockSession.id, '9999'), // Wrong code
      ).rejects.toThrow(ValidationError);

      await expect(
        ServicePointRegistrationService.verifyOTP(mockSession.id, '9999'),
      ).rejects.toThrow('Invalid OTP code');
    });
  });

  describe('completeRegistration', () => {
    const verifiedSession = {
      ...mockSession,
      verified: true,
      event: mockEvent,
    };

    const attendeeData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      company: 'Acme Corp',
      industry: 'Technology',
      jobTitle: 'Engineer',
      ticketTypeId: 'ticket-1',
    };

    const mockUser = {
      id: 'user-123',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '254712345678',
    };

    const mockRegistration = {
      id: 'registration-123',
      eventId: mockEvent.id,
      attendeeId: mockUser.id,
      status: RegistrationStatus.CONFIRMED,
      backupCode: 'BACKUP-123456',
    };

    it('should complete registration successfully', async () => {
      // Arrange
      prismaMock.servicePointSession.findFirst.mockResolvedValue(verifiedSession as any);
      prismaMock.user.findUnique.mockResolvedValue(null); // New user
      prismaMock.user.create.mockResolvedValue(mockUser as any);
      prismaMock.eventRegistration.findUnique.mockResolvedValue(null); // No existing registration
      prismaMock.eventRegistration.create.mockResolvedValue(mockRegistration as any);
      prismaMock.eventRegistration.update.mockResolvedValue(mockRegistration as any);
      prismaMock.servicePointSession.update.mockResolvedValue({
        ...verifiedSession,
        completed: true,
      } as any);

      // Act
      const result = await ServicePointRegistrationService.completeRegistration(
        mockSession.id,
        attendeeData,
      );

      // Assert
      expect(result.registrationId).toBe(mockRegistration.id);
      expect(result.attendeeName).toBe('John Doe');
      expect(result.email).toBe('john.doe@example.com');
      expect(result.backupCode).toBe('BACKUP-123456');
      expect(websocketService.emitToRoom).toHaveBeenCalledWith(
        `event:${mockEvent.id}`,
        'service-point:registration-complete',
        expect.any(Object),
      );
    });

    it('should throw error for missing required fields', async () => {
      // Act & Assert
      await expect(
        ServicePointRegistrationService.completeRegistration(mockSession.id, {
          firstName: '',
          lastName: 'Doe',
          email: 'test@example.com',
        }),
      ).rejects.toThrow(ValidationError);

      await expect(
        ServicePointRegistrationService.completeRegistration(mockSession.id, {
          firstName: '',
          lastName: 'Doe',
          email: 'test@example.com',
        }),
      ).rejects.toThrow('First name, last name, and email are required');
    });

    it('should throw error for invalid email format', async () => {
      // Act & Assert
      await expect(
        ServicePointRegistrationService.completeRegistration(mockSession.id, {
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email',
        }),
      ).rejects.toThrow(ValidationError);

      await expect(
        ServicePointRegistrationService.completeRegistration(mockSession.id, {
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email',
        }),
      ).rejects.toThrow('Invalid email format');
    });

    it('should throw error if session not verified', async () => {
      // Arrange
      prismaMock.servicePointSession.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        ServicePointRegistrationService.completeRegistration(mockSession.id, attendeeData),
      ).rejects.toThrow(NotFoundError);

      await expect(
        ServicePointRegistrationService.completeRegistration(mockSession.id, attendeeData),
      ).rejects.toThrow('Session not found, not verified, or already completed');
    });

    it('should throw error if attendee is already registered', async () => {
      // Arrange
      prismaMock.servicePointSession.findFirst.mockResolvedValue(verifiedSession as any);
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.eventRegistration.findUnique.mockResolvedValue({
        ...mockRegistration,
        status: RegistrationStatus.CONFIRMED,
      } as any);

      // Act & Assert
      await expect(
        ServicePointRegistrationService.completeRegistration(mockSession.id, attendeeData),
      ).rejects.toThrow(ValidationError);

      await expect(
        ServicePointRegistrationService.completeRegistration(mockSession.id, attendeeData),
      ).rejects.toThrow('Attendee is already registered for this event');
    });

    it('should throw error for invalid ticket type', async () => {
      // Arrange
      prismaMock.servicePointSession.findFirst.mockResolvedValue(verifiedSession as any);
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(mockUser as any);
      prismaMock.eventRegistration.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        ServicePointRegistrationService.completeRegistration(mockSession.id, {
          ...attendeeData,
          ticketTypeId: 'invalid-ticket-type',
        }),
      ).rejects.toThrow(ValidationError);

      await expect(
        ServicePointRegistrationService.completeRegistration(mockSession.id, {
          ...attendeeData,
          ticketTypeId: 'invalid-ticket-type',
        }),
      ).rejects.toThrow('Invalid ticket type');
    });

    it('should use existing user if email already registered', async () => {
      // Arrange
      prismaMock.servicePointSession.findFirst.mockResolvedValue(verifiedSession as any);
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.eventRegistration.findUnique.mockResolvedValue(null);
      prismaMock.eventRegistration.create.mockResolvedValue(mockRegistration as any);
      prismaMock.eventRegistration.update.mockResolvedValue(mockRegistration as any);
      prismaMock.servicePointSession.update.mockResolvedValue({
        ...verifiedSession,
        completed: true,
      } as any);

      // Act
      const result = await ServicePointRegistrationService.completeRegistration(
        mockSession.id,
        attendeeData,
      );

      // Assert
      expect(result.registrationId).toBe(mockRegistration.id);
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  describe('cancelSession', () => {
    it('should cancel session successfully', async () => {
      // Arrange
      prismaMock.servicePointSession.findFirst.mockResolvedValue(mockSession as any);
      prismaMock.servicePointSession.update.mockResolvedValue({
        ...mockSession,
        cancelled: true,
      } as any);

      // Act
      await ServicePointRegistrationService.cancelSession(mockSession.id);

      // Assert
      expect(prismaMock.servicePointSession.update).toHaveBeenCalledWith({
        where: { id: mockSession.id },
        data: { cancelled: true },
      });
    });

    it('should throw error if session not found', async () => {
      // Arrange
      prismaMock.servicePointSession.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        ServicePointRegistrationService.cancelSession('invalid-session'),
      ).rejects.toThrow(NotFoundError);

      await expect(
        ServicePointRegistrationService.cancelSession('invalid-session'),
      ).rejects.toThrow('Session not found or already completed/cancelled');
    });
  });

  describe('getSessionStatus', () => {
    it('should return pending_otp status for unverified session', async () => {
      // Arrange
      prismaMock.servicePointSession.findUnique.mockResolvedValue(mockSession as any);

      // Act
      const result = await ServicePointRegistrationService.getSessionStatus(mockSession.id);

      // Assert
      expect(result.status).toBe('pending_otp');
      expect(result.verified).toBe(false);
    });

    it('should return verified status for verified session', async () => {
      // Arrange
      const verifiedSession = { ...mockSession, verified: true };
      prismaMock.servicePointSession.findUnique.mockResolvedValue(verifiedSession as any);

      // Act
      const result = await ServicePointRegistrationService.getSessionStatus(mockSession.id);

      // Assert
      expect(result.status).toBe('verified');
      expect(result.verified).toBe(true);
    });

    it('should return completed status for completed session', async () => {
      // Arrange
      const completedSession = { ...mockSession, verified: true, completed: true };
      prismaMock.servicePointSession.findUnique.mockResolvedValue(completedSession as any);

      // Act
      const result = await ServicePointRegistrationService.getSessionStatus(mockSession.id);

      // Assert
      expect(result.status).toBe('completed');
    });

    it('should return cancelled status for cancelled session', async () => {
      // Arrange
      const cancelledSession = { ...mockSession, cancelled: true };
      prismaMock.servicePointSession.findUnique.mockResolvedValue(cancelledSession as any);

      // Act
      const result = await ServicePointRegistrationService.getSessionStatus(mockSession.id);

      // Assert
      expect(result.status).toBe('cancelled');
    });

    it('should return expired status for expired session', async () => {
      // Arrange
      const expiredSession = {
        ...mockSession,
        otpExpiresAt: new Date(Date.now() - 1000),
      };
      prismaMock.servicePointSession.findUnique.mockResolvedValue(expiredSession as any);

      // Act
      const result = await ServicePointRegistrationService.getSessionStatus(mockSession.id);

      // Assert
      expect(result.status).toBe('expired');
    });

    it('should throw error if session not found', async () => {
      // Arrange
      prismaMock.servicePointSession.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        ServicePointRegistrationService.getSessionStatus('invalid-session'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getActiveSession', () => {
    it('should return active session for phone number', async () => {
      // Arrange
      prismaMock.servicePointSession.findFirst.mockResolvedValue(mockSession as any);
      prismaMock.servicePointSession.findUnique.mockResolvedValue(mockSession as any);

      // Act
      const result = await ServicePointRegistrationService.getActiveSession(
        '254712345678',
        mockEvent.id,
      );

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(mockSession.id);
    });

    it('should return null if no active session exists', async () => {
      // Arrange
      prismaMock.servicePointSession.findFirst.mockResolvedValue(null);

      // Act
      const result = await ServicePointRegistrationService.getActiveSession(
        '254712345678',
        mockEvent.id,
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('handleSMSResponse', () => {
    const sessionWithEvent = {
      ...mockSession,
      event: { title: 'Test Conference' },
    };

    it('should verify OTP via SMS response', async () => {
      // Arrange
      prismaMock.servicePointSession.findFirst.mockResolvedValue(sessionWithEvent as any);
      prismaMock.servicePointSession.update.mockResolvedValue({
        ...sessionWithEvent,
        verified: true,
      } as any);

      // Act
      const result = await ServicePointRegistrationService.handleSMSResponse(
        '254712345678',
        '1234',
      );

      // Assert
      expect(result).toContain('Code verified');
      expect(prismaMock.servicePointSession.update).toHaveBeenCalledWith({
        where: { id: mockSession.id },
        data: { verified: true },
      });
      expect(websocketService.emitToRoom).toHaveBeenCalled();
    });

    it('should return error message if no pending session', async () => {
      // Arrange
      prismaMock.servicePointSession.findFirst.mockResolvedValue(null);

      // Act
      const result = await ServicePointRegistrationService.handleSMSResponse(
        '254712345678',
        '1234',
      );

      // Assert
      expect(result).toContain('No pending registration found');
    });

    it('should return error message for invalid OTP format', async () => {
      // Arrange
      prismaMock.servicePointSession.findFirst.mockResolvedValue(sessionWithEvent as any);

      // Act
      const result = await ServicePointRegistrationService.handleSMSResponse(
        '254712345678',
        'abc', // Invalid format
      );

      // Assert
      expect(result).toContain('Invalid code format');
    });

    it('should return error message for wrong OTP', async () => {
      // Arrange
      prismaMock.servicePointSession.findFirst.mockResolvedValue(sessionWithEvent as any);

      // Act
      const result = await ServicePointRegistrationService.handleSMSResponse(
        '254712345678',
        '9999', // Wrong code
      );

      // Assert
      expect(result).toContain('Invalid code');
    });
  });

  describe('getKioskConfig', () => {
    it('should return kiosk configuration', async () => {
      // Arrange
      prismaMock.event.findFirst.mockResolvedValue(mockEvent as any);

      // Act
      const result = await ServicePointRegistrationService.getKioskConfig(mockEvent.id);

      // Assert
      expect(result.eventTitle).toBe(mockEvent.title);
      expect(result.eventCode).toBe(mockEvent.registrationCode);
      expect(result.instructions).toBeInstanceOf(Array);
      expect(result.instructions.length).toBeGreaterThan(0);
    });

    it('should throw error if event not found', async () => {
      // Arrange
      prismaMock.event.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        ServicePointRegistrationService.getKioskConfig('invalid-event'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should delete expired sessions', async () => {
      // Arrange
      prismaMock.servicePointSession.deleteMany.mockResolvedValue({ count: 5 });

      // Act
      const result = await ServicePointRegistrationService.cleanupExpiredSessions();

      // Assert
      expect(result).toBe(5);
      expect(prismaMock.servicePointSession.deleteMany).toHaveBeenCalledWith({
        where: {
          completed: false,
          cancelled: false,
          createdAt: {
            lt: expect.any(Date),
          },
        },
      });
    });
  });

  describe('getServicePointStats', () => {
    it('should return correct statistics', async () => {
      // Arrange
      prismaMock.servicePointSession.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(50)  // completed
        .mockResolvedValueOnce(20)  // pending
        .mockResolvedValueOnce(10)  // verified
        .mockResolvedValueOnce(5);  // cancelled

      // Act
      const result = await ServicePointRegistrationService.getServicePointStats(mockEvent.id);

      // Assert
      expect(result.totalSessions).toBe(100);
      expect(result.completedRegistrations).toBe(50);
      expect(result.pendingVerification).toBe(20);
      expect(result.verifiedPendingCompletion).toBe(10);
      expect(result.cancelledSessions).toBe(5);
      expect(result.expiredSessions).toBe(15); // 100 - 50 - 20 - 10 - 5
    });
  });
});
