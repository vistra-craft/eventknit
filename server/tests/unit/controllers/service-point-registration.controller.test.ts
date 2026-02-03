import { Response, NextFunction } from 'express';
import { ServicePointRegistrationController } from '../../../src/controllers/service-point-registration.controller';
import { ServicePointRegistrationService } from '../../../src/services/service-point-registration.service';
import { AuthenticatedRequest } from '../../../src/middleware/auth.middleware';
import { ValidationError, NotFoundError } from '../../../src/utils/errors';

// Mock dependencies
jest.mock('../../../src/services/service-point-registration.service');

describe('ServicePointRegistrationController', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  const mockUser = {
    id: 'staff-123',
    email: 'staff@example.com',
    role: 'TELLER',
  };

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      user: mockUser as any,
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('initiateRegistration', () => {
    const mockResult = {
      sessionId: 'session-123',
      otpSent: true,
      expiresAt: new Date(),
      message: 'OTP sent to attendee phone',
    };

    it('should initiate registration successfully', async () => {
      // Arrange
      mockRequest.params = { eventId: 'event-123' };
      mockRequest.body = { phoneNumber: '+254712345678', facilityId: 'facility-123' };
      (ServicePointRegistrationService.initiateRegistration as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await ServicePointRegistrationController.initiateRegistration(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(ServicePointRegistrationService.initiateRegistration).toHaveBeenCalledWith(
        'event-123',
        '+254712345678',
        'staff-123',
        'facility-123',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.params = { eventId: 'event-123' };
      mockRequest.body = { phoneNumber: '+254712345678' };

      // Act
      await ServicePointRegistrationController.initiateRegistration(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required',
        },
      });
      expect(ServicePointRegistrationService.initiateRegistration).not.toHaveBeenCalled();
    });

    it('should call next with error for missing phone number', async () => {
      // Arrange
      mockRequest.params = { eventId: 'event-123' };
      mockRequest.body = {};

      // Act
      await ServicePointRegistrationController.initiateRegistration(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should call next with error when service throws', async () => {
      // Arrange
      mockRequest.params = { eventId: 'event-123' };
      mockRequest.body = { phoneNumber: '+254712345678' };
      const error = new NotFoundError('Event not found');
      (ServicePointRegistrationService.initiateRegistration as jest.Mock).mockRejectedValue(error);

      // Act
      await ServicePointRegistrationController.initiateRegistration(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('verifyOTP', () => {
    const mockResult = {
      verified: true,
      sessionId: 'session-123',
      phoneNumber: '254712345678',
      message: 'OTP verified successfully',
    };

    it('should verify OTP successfully', async () => {
      // Arrange
      mockRequest.body = { sessionId: 'session-123', otp: '1234' };
      (ServicePointRegistrationService.verifyOTP as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await ServicePointRegistrationController.verifyOTP(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(ServicePointRegistrationService.verifyOTP).toHaveBeenCalledWith('session-123', '1234');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.body = { sessionId: 'session-123', otp: '1234' };

      // Act
      await ServicePointRegistrationController.verifyOTP(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(ServicePointRegistrationService.verifyOTP).not.toHaveBeenCalled();
    });

    it('should call next with error for missing sessionId', async () => {
      // Arrange
      mockRequest.body = { otp: '1234' };

      // Act
      await ServicePointRegistrationController.verifyOTP(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should call next with error for missing OTP', async () => {
      // Arrange
      mockRequest.body = { sessionId: 'session-123' };

      // Act
      await ServicePointRegistrationController.verifyOTP(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('completeRegistration', () => {
    const mockResult = {
      registrationId: 'registration-123',
      attendeeName: 'John Doe',
      email: 'john@example.com',
      ticketType: 'General Admission',
      backupCode: 'BACKUP-123456',
      qrCodeDataUrl: 'data:image/png;base64,qrcode',
    };

    it('should complete registration successfully', async () => {
      // Arrange
      mockRequest.body = {
        sessionId: 'session-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
        ticketTypeId: 'ticket-1',
      };
      (ServicePointRegistrationService.completeRegistration as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await ServicePointRegistrationController.completeRegistration(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(ServicePointRegistrationService.completeRegistration).toHaveBeenCalledWith(
        'session-123',
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          company: 'Acme Corp',
          ticketTypeId: 'ticket-1',
        }),
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.body = { sessionId: 'session-123' };

      // Act
      await ServicePointRegistrationController.completeRegistration(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(ServicePointRegistrationService.completeRegistration).not.toHaveBeenCalled();
    });

    it('should call next with error for missing sessionId', async () => {
      // Arrange
      mockRequest.body = { firstName: 'John', lastName: 'Doe', email: 'john@example.com' };

      // Act
      await ServicePointRegistrationController.completeRegistration(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('getSessionStatus', () => {
    const mockResult = {
      id: 'session-123',
      status: 'verified',
      verified: true,
      phoneNumber: '254712345678',
      expiresAt: new Date(),
      createdAt: new Date(),
    };

    it('should get session status successfully', async () => {
      // Arrange
      mockRequest.params = { sessionId: 'session-123' };
      (ServicePointRegistrationService.getSessionStatus as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await ServicePointRegistrationController.getSessionStatus(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(ServicePointRegistrationService.getSessionStatus).toHaveBeenCalledWith('session-123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.params = { sessionId: 'session-123' };

      // Act
      await ServicePointRegistrationController.getSessionStatus(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(ServicePointRegistrationService.getSessionStatus).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws', async () => {
      // Arrange
      mockRequest.params = { sessionId: 'invalid-session' };
      const error = new NotFoundError('Session not found');
      (ServicePointRegistrationService.getSessionStatus as jest.Mock).mockRejectedValue(error);

      // Act
      await ServicePointRegistrationController.getSessionStatus(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('cancelSession', () => {
    it('should cancel session successfully', async () => {
      // Arrange
      mockRequest.params = { sessionId: 'session-123' };
      (ServicePointRegistrationService.cancelSession as jest.Mock).mockResolvedValue(undefined);

      // Act
      await ServicePointRegistrationController.cancelSession(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(ServicePointRegistrationService.cancelSession).toHaveBeenCalledWith('session-123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Session cancelled successfully',
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.params = { sessionId: 'session-123' };

      // Act
      await ServicePointRegistrationController.cancelSession(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(ServicePointRegistrationService.cancelSession).not.toHaveBeenCalled();
    });
  });

  describe('getKioskConfig', () => {
    const mockResult = {
      eventCode: 'TEST2024',
      eventTitle: 'Test Conference',
      ussdShortCode: '*384*123#',
      smsKeyword: 'TEST2024',
      instructions: ['Welcome!', 'Follow instructions'],
    };

    it('should get kiosk config successfully (no auth required)', async () => {
      // Arrange
      mockRequest.params = { eventId: 'event-123' };
      (ServicePointRegistrationService.getKioskConfig as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await ServicePointRegistrationController.getKioskConfig(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(ServicePointRegistrationService.getKioskConfig).toHaveBeenCalledWith('event-123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it('should call next with error when service throws', async () => {
      // Arrange
      mockRequest.params = { eventId: 'invalid-event' };
      const error = new NotFoundError('Event not found');
      (ServicePointRegistrationService.getKioskConfig as jest.Mock).mockRejectedValue(error);

      // Act
      await ServicePointRegistrationController.getKioskConfig(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getStats', () => {
    const mockResult = {
      totalSessions: 100,
      completedRegistrations: 50,
      pendingVerification: 20,
      verifiedPendingCompletion: 10,
      cancelledSessions: 5,
      expiredSessions: 15,
    };

    it('should get stats successfully', async () => {
      // Arrange
      mockRequest.params = { eventId: 'event-123' };
      (ServicePointRegistrationService.getServicePointStats as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await ServicePointRegistrationController.getStats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(ServicePointRegistrationService.getServicePointStats).toHaveBeenCalledWith('event-123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.params = { eventId: 'event-123' };

      // Act
      await ServicePointRegistrationController.getStats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(ServicePointRegistrationService.getServicePointStats).not.toHaveBeenCalled();
    });
  });

  describe('checkActiveSession', () => {
    const mockResult = {
      id: 'session-123',
      status: 'pending_otp',
      verified: false,
      phoneNumber: '254712345678',
      expiresAt: new Date(),
      createdAt: new Date(),
    };

    it('should find active session', async () => {
      // Arrange
      mockRequest.params = { eventId: 'event-123', phoneNumber: '254712345678' };
      (ServicePointRegistrationService.getActiveSession as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await ServicePointRegistrationController.checkActiveSession(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(ServicePointRegistrationService.getActiveSession).toHaveBeenCalledWith(
        '254712345678',
        'event-123',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        hasActiveSession: true,
      });
    });

    it('should return hasActiveSession false when no session exists', async () => {
      // Arrange
      mockRequest.params = { eventId: 'event-123', phoneNumber: '254712345678' };
      (ServicePointRegistrationService.getActiveSession as jest.Mock).mockResolvedValue(null);

      // Act
      await ServicePointRegistrationController.checkActiveSession(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        hasActiveSession: false,
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.params = { eventId: 'event-123', phoneNumber: '254712345678' };

      // Act
      await ServicePointRegistrationController.checkActiveSession(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(ServicePointRegistrationService.getActiveSession).not.toHaveBeenCalled();
    });
  });
});
