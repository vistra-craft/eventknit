import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../src/middleware/auth.middleware.js';
import { PaymentPlanController } from '../../../src/controllers/payment-plan.controller.js';
import { PaymentPlanService } from '../../../src/services/payment-plan.service.js';
import { Decimal } from '@prisma/client/runtime/library';
import { UserRole } from '@prisma/client';

// Mock the service
jest.mock('../../../src/services/payment-plan.service.js');

describe('PaymentPlanController', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-1', email: 'test@example.com', role: UserRole.ATTENDEE },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('createPaymentPlan', () => {
    it('should create payment plan successfully', async () => {
      // Arrange
      const requestData = {
        registrationId: 'reg-1',
        planName: 'Monthly Payment',
        installmentCount: 4,
        frequency: 'MONTHLY',
        startDate: '2026-02-01',
        autoPaymentEnabled: true,
        paymentMethod: 'card',
      };
      mockRequest.body = requestData;

      const mockPlan = {
        id: 'plan-1',
        registrationId: 'reg-1',
        planName: 'Monthly Payment',
        installmentCount: 4,
        installmentAmount: new Decimal(250),
      };

      (PaymentPlanService.createPaymentPlan as jest.Mock).mockResolvedValue(mockPlan);

      // Act
      await PaymentPlanController.createPaymentPlan(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(PaymentPlanService.createPaymentPlan).toHaveBeenCalledWith('reg-1', {
        planName: 'Monthly Payment',
        installmentCount: 4,
        frequency: 'MONTHLY',
        startDate: expect.any(Date),
        autoPaymentEnabled: true,
        paymentMethod: 'card',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payment plan created successfully',
        data: { plan: mockPlan },
      });
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Service error');
      (PaymentPlanService.createPaymentPlan as jest.Mock).mockRejectedValue(error);

      mockRequest.body = {
        registrationId: 'reg-1',
        planName: 'Test',
        installmentCount: 4,
        frequency: 'MONTHLY',
        startDate: '2026-02-01',
      };

      // Act
      await PaymentPlanController.createPaymentPlan(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getPaymentPlanByRegistration', () => {
    it('should get payment plan by registration ID', async () => {
      // Arrange
      mockRequest.params = { registrationId: 'reg-1' };
      const mockPlan = {
        id: 'plan-1',
        registrationId: 'reg-1',
        installments: [{ id: 'inst-1' }],
      };

      (PaymentPlanService.getPaymentPlanByRegistration as jest.Mock).mockResolvedValue(mockPlan);

      // Act
      await PaymentPlanController.getPaymentPlanByRegistration(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(PaymentPlanService.getPaymentPlanByRegistration).toHaveBeenCalledWith('reg-1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { plan: mockPlan },
      });
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Not found');
      mockRequest.params = { registrationId: 'reg-1' };
      (PaymentPlanService.getPaymentPlanByRegistration as jest.Mock).mockRejectedValue(error);

      // Act
      await PaymentPlanController.getPaymentPlanByRegistration(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getUserPaymentPlans', () => {
    it('should get user payment plans with filters', async () => {
      // Arrange
      mockRequest.query = { status: 'ACTIVE', eventId: 'event-1' };
      const mockPlans = [
        { id: 'plan-1', status: 'ACTIVE' },
        { id: 'plan-2', status: 'ACTIVE' },
      ];

      (PaymentPlanService.getUserPaymentPlans as jest.Mock).mockResolvedValue(mockPlans);

      // Act
      await PaymentPlanController.getUserPaymentPlans(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(PaymentPlanService.getUserPaymentPlans).toHaveBeenCalledWith('user-1', {
        status: 'ACTIVE',
        eventId: 'event-1',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { plans: mockPlans },
      });
    });

    it('should return 401 if user not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await PaymentPlanController.getUserPaymentPlans(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
      expect(PaymentPlanService.getUserPaymentPlans).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Service error');
      (PaymentPlanService.getUserPaymentPlans as jest.Mock).mockRejectedValue(error);

      // Act
      await PaymentPlanController.getUserPaymentPlans(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('processInstallmentPayment', () => {
    it('should process installment payment successfully', async () => {
      // Arrange
      mockRequest.params = { installmentId: 'inst-1' };
      mockRequest.body = {
        amount: 250,
        transactionId: 'txn-1',
        gateway: 'paystack',
        gatewayReference: 'ref-123',
      };

      const mockInstallment = {
        id: 'inst-1',
        status: 'PAID',
        paidAmount: new Decimal(250),
      };

      (PaymentPlanService.processInstallmentPayment as jest.Mock).mockResolvedValue(mockInstallment);

      // Act
      await PaymentPlanController.processInstallmentPayment(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(PaymentPlanService.processInstallmentPayment).toHaveBeenCalledWith('inst-1', {
        amount: 250,
        transactionId: 'txn-1',
        gateway: 'paystack',
        gatewayReference: 'ref-123',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Installment payment processed successfully',
        data: { installment: mockInstallment },
      });
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Payment failed');
      mockRequest.params = { installmentId: 'inst-1' };
      mockRequest.body = { amount: 250 };
      (PaymentPlanService.processInstallmentPayment as jest.Mock).mockRejectedValue(error);

      // Act
      await PaymentPlanController.processInstallmentPayment(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getOverdueInstallments', () => {
    it('should get overdue installments for authenticated user', async () => {
      // Arrange
      const mockInstallments = [
        { id: 'inst-1', status: 'OVERDUE' },
        { id: 'inst-2', status: 'OVERDUE' },
      ];

      (PaymentPlanService.getOverdueInstallments as jest.Mock).mockResolvedValue(mockInstallments);

      // Act
      await PaymentPlanController.getOverdueInstallments(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(PaymentPlanService.getOverdueInstallments).toHaveBeenCalledWith('user-1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { installments: mockInstallments },
      });
    });

    it('should get all overdue installments when user not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      const mockInstallments = [{ id: 'inst-1', status: 'OVERDUE' }];

      (PaymentPlanService.getOverdueInstallments as jest.Mock).mockResolvedValue(mockInstallments);

      // Act
      await PaymentPlanController.getOverdueInstallments(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(PaymentPlanService.getOverdueInstallments).toHaveBeenCalledWith(undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Service error');
      (PaymentPlanService.getOverdueInstallments as jest.Mock).mockRejectedValue(error);

      // Act
      await PaymentPlanController.getOverdueInstallments(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('cancelPaymentPlan', () => {
    it('should cancel payment plan successfully', async () => {
      // Arrange
      mockRequest.params = { planId: 'plan-1' };
      (PaymentPlanService.cancelPaymentPlan as jest.Mock).mockResolvedValue({ success: true });

      // Act
      await PaymentPlanController.cancelPaymentPlan(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(PaymentPlanService.cancelPaymentPlan).toHaveBeenCalledWith('plan-1', 'user-1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Payment plan cancelled successfully',
      });
    });

    it('should return 401 if user not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.params = { planId: 'plan-1' };

      // Act
      await PaymentPlanController.cancelPaymentPlan(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
      expect(PaymentPlanService.cancelPaymentPlan).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Cannot cancel');
      mockRequest.params = { planId: 'plan-1' };
      (PaymentPlanService.cancelPaymentPlan as jest.Mock).mockRejectedValue(error);

      // Act
      await PaymentPlanController.cancelPaymentPlan(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
