import { Request, Response, NextFunction } from 'express';
import { USSDSMSController } from '../src/controllers/ussd-sms.controller';
import { USSDSMSService } from '../src/services/ussd-sms.service';
import { USSDService } from '../src/services/ussd.service';
import { logger } from '../src/utils/logger';

// Mock dependencies
jest.mock('../src/services/ussd-sms.service');
jest.mock('../src/services/ussd.service');
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('USSDSMSController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('handleIncomingSMS', () => {
    it('should process incoming SMS from Twilio format', async () => {
      mockRequest.body = {
        From: '+1234567890',
        Body: 'REGISTER',
        MessageSid: 'SM123',
      };

      (USSDSMSService.processIncomingSMS as jest.Mock).mockResolvedValue(undefined);

      await USSDSMSController.handleIncomingSMS(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(USSDSMSService.processIncomingSMS).toHaveBeenCalledWith({
        from: '+1234567890',
        body: 'REGISTER',
        messageId: 'SM123',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'SMS received and processing',
      });
    });

    it('should process incoming SMS from alternative format', async () => {
      mockRequest.body = {
        from: '+1234567890',
        body: 'START',
        messageId: 'MSG456',
      };

      (USSDSMSService.processIncomingSMS as jest.Mock).mockResolvedValue(undefined);

      await USSDSMSController.handleIncomingSMS(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(USSDSMSService.processIncomingSMS).toHaveBeenCalledWith({
        from: '+1234567890',
        body: 'START',
        messageId: 'MSG456',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle missing required fields', async () => {
      mockRequest.body = {
        Body: 'REGISTER',
      };

      await USSDSMSController.handleIncomingSMS(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Missing required fields: From and Body',
      });
      expect(USSDSMSService.processIncomingSMS).not.toHaveBeenCalled();
    });

    it('should handle processing errors gracefully', async () => {
      mockRequest.body = {
        From: '+1234567890',
        Body: 'REGISTER',
      };

      (USSDSMSService.processIncomingSMS as jest.Mock).mockRejectedValue(
        new Error('Processing error'),
      );

      await USSDSMSController.handleIncomingSMS(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Controller processes async and returns success immediately
      // Error is caught and logged but doesn't affect response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'SMS received and processing',
      });
      
      // Wait a bit for async processing
       
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Error should be logged
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('handleUSSD', () => {
    it('should process USSD request', async () => {
      mockRequest.body = {
        phoneNumber: '+1234567890',
        sessionId: 'USS123',
        text: '1',
      };

      (USSDService.handleRequest as jest.Mock).mockResolvedValue('END Registration complete');

      await USSDSMSController.handleUSSD(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(USSDService.handleRequest).toHaveBeenCalledWith({
        sessionId: 'USS123',
        serviceCode: '*384*123#',
        phoneNumber: '+1234567890',
        text: '1',
      });
      expect(mockResponse.set).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith('END Registration complete');
    });

    it('should handle USSD with empty input', async () => {
      mockRequest.body = {
        phoneNumber: '+1234567890',
        sessionId: 'USS123',
        text: '',
      };

      (USSDService.handleRequest as jest.Mock).mockResolvedValue('CON Welcome');

      await USSDSMSController.handleUSSD(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(USSDService.handleRequest).toHaveBeenCalledWith({
        sessionId: 'USS123',
        serviceCode: '*384*123#',
        phoneNumber: '+1234567890',
        text: '',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle missing required fields', async () => {
      mockRequest.body = {
        text: '1',
      };

      await USSDSMSController.handleUSSD(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // USSD returns END text response for invalid requests (not JSON 400)
      expect(mockResponse.set).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith('END Invalid request. Please try again.');
    });

    it('should handle processing errors', async () => {
      mockRequest.body = {
        phoneNumber: '+1234567890',
        sessionId: 'USS123',
        text: '1',
      };

      (USSDService.handleRequest as jest.Mock).mockRejectedValue(
        new Error('Processing error'),
      );

      await USSDSMSController.handleUSSD(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith(
        'END An error occurred. Please try again.',
      );
    });
  });

  describe('getSessionStatus', () => {
    it('should return session status placeholder', async () => {
      mockRequest.params = {
        phoneNumber: '+1234567890',
      };

      await USSDSMSController.getSessionStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Session status endpoint - to be implemented',
      });
    });

    it('should handle missing phone number', async () => {
      mockRequest.params = {};

      await USSDSMSController.getSessionStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Phone number is required',
      });
    });
  });
});

