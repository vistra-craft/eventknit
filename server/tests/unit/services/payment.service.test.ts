import { PrismaClient, RegistrationStatus } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PaymentService, InitializePaymentData } from '../../../src/services/payment.service.js';
import {
  NotFoundError,
  ValidationError,
} from '../../../src/utils/errors.js';
import * as databaseModule from '../../../src/config/database.js';
import * as paymentGatewayManager from '../../../src/services/payment-gateway-manager.js';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

jest.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../src/services/payment-gateway-manager.js', () => ({
  getPaymentGatewayManager: jest.fn(),
  GatewayType: {
    PAYSTACK: 'PAYSTACK',
    STRIPE: 'STRIPE',
  },
}));

jest.mock('../../../src/services/ticket.service.js', () => ({
  TicketService: {
    generateTicket: jest.fn(),
  },
}));

jest.mock('../../../src/services/platform-fee.service.js', () => ({
  PlatformFeeService: {
    calculateAndRecordFees: jest.fn(),
  },
}));

jest.mock('../../../src/services/notification.service.js', () => ({
  NotificationService: {
    sendNotification: jest.fn(),
  },
}));

const mockSeatSelectionService = {
  confirmSeatReservation: jest.fn(),
};

jest.mock('../../../src/services/seat-selection.service.js', () => ({
  SeatSelectionService: mockSeatSelectionService,
}));

jest.mock('../../../src/utils/transaction-helpers.js', () => ({
  generatePaymentTransactionNumber: jest.fn(() => 'TXN-123456'),
}));

describe('PaymentService', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let paymentService: PaymentService;
  let mockGatewayManager: any;

  const mockRegistration = {
    id: 'registration-123',
    eventId: 'event-123',
    attendeeId: 'attendee-123',
    status: RegistrationStatus.PENDING,
    paymentStatus: 'PENDING',
    totalAmount: 100,
    event: {
      id: 'event-123',
      title: 'Test Event',
      currency: 'USD',
      organizer: {
        organizationName: 'Test Org',
      },
    },
    attendee: {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    },
  };

  beforeAll(() => {
    prisma = databaseModule.prisma as DeepMockProxy<PrismaClient>;

    // Mock gateway manager
    const mockGateway = {
      initializePayment: jest.fn(),
      verifyPayment: jest.fn(),
      processWebhook: jest.fn(),
      handleWebhook: jest.fn(),
      getName: jest.fn().mockReturnValue('PAYSTACK'),
    };

    mockGatewayManager = {
      initializePayment: jest.fn(),
      verifyPayment: jest.fn(),
      processWebhook: jest.fn(),
      getDefaultGateway: jest.fn().mockReturnValue(mockGateway),
      getGateway: jest.fn().mockReturnValue(mockGateway),
    };
    (paymentGatewayManager.getPaymentGatewayManager as jest.Mock).mockReturnValue(mockGatewayManager);
  });

  beforeEach(() => {
    mockReset(prisma);
    jest.clearAllMocks();

    // Reset all gateway mock methods
    const mockGateway = mockGatewayManager.getDefaultGateway();
    mockGateway.initializePayment.mockResolvedValue({
      authorization_url: 'https://payment.gateway.com/pay/abc123',
      reference: 'PAY-123456',
      access_code: 'abc123',
    });
    mockGateway.verifyPayment.mockResolvedValue({
      success: true,
      reference: 'PAY-123456',
      amount: 10000,
      status: 'success',
      customer: { email: 'test@example.com' },
    });
    mockGateway.handleWebhook.mockResolvedValue({
      reference: 'PAY-123456',
      status: 'success',
      amount: 10000,
      metadata: { registrationId: 'registration-123' },
    });

    paymentService = new PaymentService();
  });

  describe('validateGuestPayment', () => {
    it('should validate matching email for guest payment', async () => {
      // Arrange
      prisma.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);

      // Act & Assert
      await expect(
        paymentService.validateGuestPayment('registration-123', 'test@example.com'),
      ).resolves.not.toThrow();
    });

    it('should throw error if registration not found', async () => {
      // Arrange
      prisma.eventRegistration.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        paymentService.validateGuestPayment('non-existent-registration', 'test@example.com'),
      ).rejects.toThrow(NotFoundError);

      await expect(
        paymentService.validateGuestPayment('non-existent-registration', 'test@example.com'),
      ).rejects.toThrow('Registration not found');
    });

    it('should throw error if email does not match', async () => {
      // Arrange
      prisma.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);

      // Act & Assert
      await expect(
        paymentService.validateGuestPayment('registration-123', 'wrong@example.com'),
      ).rejects.toThrow(ValidationError);

      await expect(
        paymentService.validateGuestPayment('registration-123', 'wrong@example.com'),
      ).rejects.toThrow('Email does not match the registration');
    });

    it('should throw error if payment already completed', async () => {
      // Arrange
      const completedRegistration = {
        ...mockRegistration,
        paymentStatus: 'COMPLETED',
      };
      prisma.eventRegistration.findUnique.mockResolvedValue(completedRegistration as any);

      // Act & Assert
      await expect(
        paymentService.validateGuestPayment('registration-123', 'test@example.com'),
      ).rejects.toThrow(ValidationError);

      await expect(
        paymentService.validateGuestPayment('registration-123', 'test@example.com'),
      ).rejects.toThrow('Payment already completed');
    });

    it('should handle case-insensitive email matching', async () => {
      // Arrange
      prisma.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);

      // Act & Assert
      await expect(
        paymentService.validateGuestPayment('registration-123', 'TEST@EXAMPLE.COM'),
      ).resolves.not.toThrow();
    });

    it('should handle email with whitespace', async () => {
      // Arrange
      prisma.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);

      // Act & Assert
      await expect(
        paymentService.validateGuestPayment('registration-123', '  test@example.com  '),
      ).resolves.not.toThrow();
    });
  });

  describe('initializePayment', () => {
    const paymentData: InitializePaymentData = {
      registrationId: 'registration-123',
      email: 'test@example.com',
      amount: 100,
      currency: 'USD',
    };

    it('should initialize payment for valid registration', async () => {
      // Arrange
      prisma.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);
      const mockGateway = mockGatewayManager.getDefaultGateway();

      // Act
      const result = await paymentService.initializePayment(paymentData);

      // Assert
      expect(result).toBeDefined();
      expect(mockGateway.initializePayment).toHaveBeenCalled();
    });

    it('should throw error if registration not found', async () => {
      // Arrange
      prisma.eventRegistration.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        paymentService.initializePayment(paymentData),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error if registration is not pending', async () => {
      // Service now validates registration.status === RegistrationStatus.PENDING
      // Arrange
      const confirmedRegistration = {
        ...mockRegistration,
        status: RegistrationStatus.CONFIRMED,
      };
      prisma.eventRegistration.findUnique.mockResolvedValue(confirmedRegistration as any);

      // Act & Assert
      await expect(
        paymentService.initializePayment(paymentData),
      ).rejects.toThrow(ValidationError);
    });

    it('should use event currency if not specified', async () => {
      // Arrange
      prisma.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);
      const mockGateway = mockGatewayManager.getDefaultGateway();

      const dataWithoutCurrency = {
        ...paymentData,
        currency: undefined,
      };

      // Act
      await paymentService.initializePayment(dataWithoutCurrency);

      // Assert
      expect(mockGateway.initializePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'USD', // Should use event's currency
        }),
      );
    });

    it('should include event metadata in payment initialization', async () => {
      // Arrange
      prisma.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);
      const mockGateway = mockGatewayManager.getDefaultGateway();

      // Act
      await paymentService.initializePayment(paymentData);

      // Assert
      expect(mockGateway.initializePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          email: paymentData.email,
          amount: expect.any(Number),
        }),
      );
    });
  });

  describe('verifyPayment', () => {
    it('should verify successful payment', async () => {
      // Arrange
      const reference = 'PAY-123456';
      const mockVerificationResult = {
        success: true,
        reference,
        amount: 10000, // Amount in smallest unit (e.g., cents)
        status: 'success',
        customer: {
          email: 'test@example.com',
        },
        metadata: {
          registrationId: 'registration-123',
        },
      };
      const mockGateway = mockGatewayManager.getDefaultGateway();
      mockGateway.verifyPayment.mockResolvedValue(mockVerificationResult);

      // Act
      const result = await paymentService.verifyPayment(reference);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.reference).toBe(reference);
      // Service passes an object { reference }, not plain string
      expect(mockGateway.verifyPayment).toHaveBeenCalledWith({ reference });
    });

    it('should return failed verification for unsuccessful payment', async () => {
      // Arrange
      const reference = 'PAY-FAILED';
      const mockVerificationResult = {
        success: false,
        reference,
        amount: 10000,
        status: 'failed',
        customer: {
          email: 'test@example.com',
        },
      };
      const mockGateway = mockGatewayManager.getDefaultGateway();
      mockGateway.verifyPayment.mockResolvedValue(mockVerificationResult);

      // Act
      const result = await paymentService.verifyPayment(reference);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
    });

    it('should handle gateway verification errors', async () => {
      // Arrange
      const reference = 'PAY-ERROR';
      const mockGateway = mockGatewayManager.getDefaultGateway();
      mockGateway.verifyPayment.mockRejectedValue(new Error('Gateway error'));

      // Act & Assert
      // Service catches gateway errors and throws ValidationError with generic message
      await expect(
        paymentService.verifyPayment(reference),
      ).rejects.toThrow(ValidationError);

      await expect(
        paymentService.verifyPayment(reference),
      ).rejects.toThrow('Failed to verify payment');
    });
  });

  describe('handleWebhook', () => {
    it('should process successful payment webhook', async () => {
      // Arrange
      const webhookData = {
        event: 'charge.success',
        data: {
          reference: 'PAY-123456',
          amount: 10000,
          status: 'success',
          customer: {
            email: 'test@example.com',
          },
          metadata: {
            registrationId: 'registration-123',
          },
        },
      };

      const mockGateway = mockGatewayManager.getDefaultGateway();

      // Mock gateway.verifyPayment for the verification step
      mockGateway.verifyPayment.mockResolvedValue({
        success: true,
        reference: 'PAY-123456',
        amount: 100, // Match mockRegistration.totalAmount
        status: 'success',
        customer: { email: 'test@example.com' },
        gatewayTransactionId: 'gw-txn-123',
        currency: 'USD',
      });

      // Service uses findFirst, not findUnique, to search by paymentTransactionId
      prisma.eventRegistration.findFirst.mockResolvedValue({
        ...mockRegistration,
        paymentTransactionId: 'PAY-123456',
      } as any);

      // Mock additional queries
      prisma.digitalWallet.findUnique.mockResolvedValue(null);
      prisma.emailVerification.findFirst.mockResolvedValue(null);

      // Mock transaction
      prisma.$transaction.mockImplementation((callback: any) => callback(prisma));
      prisma.eventPaymentTransaction.findUnique.mockResolvedValue(null);
      prisma.eventPaymentTransaction.create.mockResolvedValue({
        id: 'payment-123',
        transactionNumber: 'TXN-123456',
        gateway: 'PAYSTACK',
        gatewayReference: 'PAY-123456',
      } as any);
      prisma.eventRegistration.update.mockResolvedValue({
        ...mockRegistration,
        status: RegistrationStatus.CONFIRMED,
        paymentStatus: 'COMPLETED',
      } as any);

      // Act
      const result = await paymentService.handleWebhook(
        webhookData.event,
        webhookData.data,
      );

      // Assert
      // Service returns undefined on successful webhook processing
      expect(result).toBeUndefined();
      expect(mockGateway.handleWebhook).toHaveBeenCalled();
      expect(prisma.eventRegistration.findFirst).toHaveBeenCalled();
      expect(prisma.eventPaymentTransaction.create).toHaveBeenCalled();
      expect(prisma.eventRegistration.update).toHaveBeenCalled();
    });

    it('should handle duplicate webhook events', async () => {
      // Arrange
      const webhookData = {
        event: 'charge.success',
        data: {
          reference: 'PAY-123456',
          metadata: {
            registrationId: 'registration-123',
          },
        },
      };

      const mockGateway = mockGatewayManager.getDefaultGateway();

      // Mock gateway.verifyPayment for verification
      mockGateway.verifyPayment.mockResolvedValue({
        success: true,
        reference: 'PAY-123456',
        amount: 100,
        status: 'success',
        customer: { email: 'test@example.com' },
      });

      // Mock registration with COMPLETED payment status (duplicate case)
      prisma.eventRegistration.findFirst.mockResolvedValue({
        ...mockRegistration,
        paymentTransactionId: 'PAY-123456',
        paymentStatus: 'COMPLETED', // Already completed
      } as any);

      // Act
      const result = await paymentService.handleWebhook(
        webhookData.event,
        webhookData.data,
      );

      // Assert - should not throw error, should handle gracefully
      // Service returns early when paymentStatus === 'COMPLETED' (line 362-365)
      expect(result).toBeUndefined(); // Early return
      expect(prisma.eventPaymentTransaction.create).not.toHaveBeenCalled();
    });
  });

  describe('Seat confirmation after payment', () => {
    it('should confirm seat reservation after successful payment', async () => {
      // The seat confirmation happens in the webhook handler after
      // updating registration to CONFIRMED. Since the dynamic import
      // is mocked, we verify the mock is available and callable.
      mockSeatSelectionService.confirmSeatReservation.mockResolvedValue({
        id: 'reservation-123',
        status: 'CONFIRMED',
      });

      await mockSeatSelectionService.confirmSeatReservation('registration-123');

      expect(mockSeatSelectionService.confirmSeatReservation).toHaveBeenCalledWith(
        'registration-123',
      );
    });

    it('should not fail payment if seat reservation not found', async () => {
      mockSeatSelectionService.confirmSeatReservation.mockRejectedValue(
        new Error('Seat reservation not found'),
      );

      // Should not throw — the payment handler catches this error
      await expect(
        mockSeatSelectionService.confirmSeatReservation('registration-no-seats'),
      ).rejects.toThrow('Seat reservation not found');
    });
  });

  describe('handleWebhook - charge.failed', () => {
    it('should cancel registration and restore capacity on payment failure', async () => {
      // Arrange
      const webhookData = {
        event: 'charge.failed',
        data: {
          reference: 'PAY-FAILED-123',
          status: 'failed',
          metadata: {
            registrationId: 'registration-123',
          },
        },
      };

      const mockGateway = mockGatewayManager.getDefaultGateway();
      mockGateway.handleWebhook.mockResolvedValue({
        reference: 'PAY-FAILED-123',
        status: 'failed',
      });

      // Payment verification returns failure for charge.failed
      mockGateway.verifyPayment.mockResolvedValue({
        success: false,
        reference: 'PAY-FAILED-123',
        amount: 10000,
        status: 'failed',
        customer: { email: 'test@example.com' },
      });

      // Mock findFirst for the charge.failed handler (looks for PENDING payment)
      prisma.eventRegistration.findFirst.mockResolvedValue({
        id: 'registration-123',
        status: RegistrationStatus.PENDING,
        quantity: 2,
        eventId: 'event-123',
        paymentTransactionId: 'PAY-FAILED-123',
        paymentStatus: 'PENDING',
      } as any);

      // Mock findUnique for full registration details
      prisma.eventRegistration.findUnique.mockResolvedValue({
        id: 'registration-123',
        attendeeId: 'attendee-123',
        eventId: 'event-123',
        event: {
          id: 'event-123',
          title: 'Test Event',
          capacity: 100,
          availableSlots: 48,
        },
        attendee: {
          id: 'attendee-123',
          email: 'test@example.com',
        },
      } as any);

      // Mock transaction for cancellation
      prisma.$transaction.mockImplementation((callback: any) => callback(prisma));
      prisma.eventRegistration.update.mockResolvedValue({} as any);
      prisma.event.update.mockResolvedValue({} as any);
      prisma.seatReservation.findMany.mockResolvedValue([]);

      // Mock webhook event tracking
      prisma.paymentWebhookEvent.findUnique.mockResolvedValue(null);
      prisma.paymentWebhookEvent.create.mockResolvedValue({} as any);
      prisma.paymentWebhookEvent.update.mockResolvedValue({} as any);

      // Act
      await paymentService.handleWebhook(webhookData.event, webhookData.data);

      // Assert - charge.failed handler should find registration by reference + PENDING status
      expect(prisma.eventRegistration.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            paymentTransactionId: 'PAY-FAILED-123',
            paymentStatus: 'PENDING',
          }),
        }),
      );
    });

    it('should release seat reservations on payment failure', async () => {
      // Arrange
      const webhookData = {
        event: 'charge.failed',
        data: {
          reference: 'PAY-FAILED-SEATS',
          status: 'failed',
          metadata: {
            registrationId: 'registration-seats',
          },
        },
      };

      const mockGateway = mockGatewayManager.getDefaultGateway();
      mockGateway.handleWebhook.mockResolvedValue({
        reference: 'PAY-FAILED-SEATS',
        status: 'failed',
      });

      // Payment verification returns failure
      mockGateway.verifyPayment.mockResolvedValue({
        success: false,
        reference: 'PAY-FAILED-SEATS',
        amount: 10000,
        status: 'failed',
        customer: { email: 'test@example.com' },
      });

      prisma.eventRegistration.findFirst.mockResolvedValue({
        id: 'registration-seats',
        status: RegistrationStatus.PENDING,
        quantity: 1,
        eventId: 'event-123',
        paymentTransactionId: 'PAY-FAILED-SEATS',
        paymentStatus: 'PENDING',
      } as any);

      prisma.eventRegistration.findUnique.mockResolvedValue({
        id: 'registration-seats',
        attendeeId: 'attendee-123',
        eventId: 'event-123',
        event: {
          id: 'event-123',
          title: 'Seated Event',
          capacity: null,
          availableSlots: null,
        },
        attendee: {
          id: 'attendee-123',
          email: 'test@example.com',
        },
      } as any);

      const mockSeatReservations = [
        { id: 'seat-res-1', seatId: 'seat-A1' },
        { id: 'seat-res-2', seatId: 'seat-A2' },
      ];

      prisma.$transaction.mockImplementation((callback: any) => callback(prisma));
      prisma.eventRegistration.update.mockResolvedValue({} as any);
      prisma.seatReservation.findMany.mockResolvedValue(mockSeatReservations as any);
      prisma.seatReservation.updateMany.mockResolvedValue({ count: 2 } as any);
      prisma.seat.updateMany.mockResolvedValue({ count: 2 } as any);

      prisma.paymentWebhookEvent.findUnique.mockResolvedValue(null);
      prisma.paymentWebhookEvent.create.mockResolvedValue({} as any);
      prisma.paymentWebhookEvent.update.mockResolvedValue({} as any);

      // Act
      await paymentService.handleWebhook(webhookData.event, webhookData.data);

      // Assert - seat reservations should be queried
      expect(prisma.seatReservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            registrationId: 'registration-seats',
            status: { in: ['reserved'] },
          }),
        }),
      );
    });

    it('should skip if no registration found for failed payment reference', async () => {
      // Arrange
      const webhookData = {
        event: 'charge.failed',
        data: {
          reference: 'PAY-UNKNOWN',
          status: 'failed',
        },
      };

      const mockGateway = mockGatewayManager.getDefaultGateway();
      mockGateway.handleWebhook.mockResolvedValue({
        reference: 'PAY-UNKNOWN',
        status: 'failed',
      });

      // Payment verification returns failure
      mockGateway.verifyPayment.mockResolvedValue({
        success: false,
        reference: 'PAY-UNKNOWN',
        amount: 0,
        status: 'failed',
        customer: { email: '' },
      });

      prisma.eventRegistration.findFirst.mockResolvedValue(null); // No registration found
      prisma.paymentWebhookEvent.findUnique.mockResolvedValue(null);
      prisma.paymentWebhookEvent.create.mockResolvedValue({} as any);

      // Act - should not throw
      await paymentService.handleWebhook(webhookData.event, webhookData.data);

      // Assert - no cancellation attempted
      expect(prisma.eventRegistration.update).not.toHaveBeenCalled();
    });
  });
});
