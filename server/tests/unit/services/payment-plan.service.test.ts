import { PaymentPlanService } from '../../../src/services/payment-plan.service.js';
import { prisma } from '../../../src/config/database.js';
import { logger } from '../../../src/utils/logger.js';
import { NotFoundError } from '../../../src/utils/errors.js';
import { Decimal } from '@prisma/client/runtime/library';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  prisma: {
    eventRegistration: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    paymentPlan: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    paymentInstallment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));
jest.mock('../../../src/utils/logger.js');

describe('PaymentPlanService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentPlan', () => {
    it('should create payment plan with installments successfully', async () => {
      // Arrange
      const registrationId = 'reg-1';
      const data = {
        planName: 'Monthly Payment Plan',
        installmentCount: 4,
        frequency: 'MONTHLY' as const,
        startDate: new Date('2026-02-01'),
        autoPaymentEnabled: true,
      };

      const mockRegistration = {
        id: registrationId,
        eventId: 'event-1',
        totalAmount: new Decimal(1000),
        event: { id: 'event-1', currency: 'NGN' },
      };

      (prisma.eventRegistration.findUnique as jest.Mock).mockResolvedValue(mockRegistration);
      (prisma.paymentPlan.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.paymentPlan.create as jest.Mock).mockResolvedValue({
        id: 'plan-1',
        registrationId,
        planName: data.planName,
        totalAmount: new Decimal(1000),
        installmentCount: 4,
        installmentAmount: new Decimal(250),
        frequency: data.frequency,
        currency: 'NGN',
      });
      (prisma.paymentInstallment.createMany as jest.Mock).mockResolvedValue({ count: 4 });

      // Act
      const result = await PaymentPlanService.createPaymentPlan(registrationId, data);

      // Assert
      expect(result.installmentCount).toBe(4);
      expect(prisma.paymentInstallment.createMany).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(`Payment plan created: plan-1 for registration: ${registrationId}`);
    });

    it('should throw NotFoundError if registration does not exist', async () => {
      // Arrange
      (prisma.eventRegistration.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(PaymentPlanService.createPaymentPlan('nonexistent', {
        planName: 'Test',
        installmentCount: 4,
        frequency: 'MONTHLY',
        startDate: new Date(),
      })).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if payment plan already exists', async () => {
      // Arrange
      (prisma.eventRegistration.findUnique as jest.Mock).mockResolvedValue({
        id: 'reg-1',
        eventId: 'event-1',
        totalAmount: new Decimal(1000),
        event: { id: 'event-1', currency: 'NGN' },
      });
      (prisma.paymentPlan.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-plan',
      });

      // Act & Assert
      await expect(PaymentPlanService.createPaymentPlan('reg-1', {
        planName: 'Test',
        installmentCount: 4,
        frequency: 'MONTHLY',
        startDate: new Date(),
      })).rejects.toThrow('Payment plan already exists for this registration');
    });
  });

  describe('getPaymentPlanByRegistration', () => {
    it('should return payment plan with installments', async () => {
      // Arrange
      const mockPlan = {
        id: 'plan-1',
        registrationId: 'reg-1',
        installments: [
          { id: 'inst-1', installmentNumber: 1 },
          { id: 'inst-2', installmentNumber: 2 },
        ],
        registration: { attendee: { email: 'test@example.com' } },
        event: { title: 'Test Event' },
      };

      (prisma.paymentPlan.findUnique as jest.Mock).mockResolvedValue(mockPlan);

      // Act
      const result = await PaymentPlanService.getPaymentPlanByRegistration('reg-1');

      // Assert
      expect(result).toEqual(mockPlan);
      expect(result.installments).toHaveLength(2);
    });

    it('should throw NotFoundError if plan does not exist', async () => {
      // Arrange
      (prisma.paymentPlan.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(PaymentPlanService.getPaymentPlanByRegistration('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getUserPaymentPlans', () => {
    it('should return user payment plans with filters', async () => {
      // Arrange
      const mockPlans = [
        { id: 'plan-1', status: 'ACTIVE' },
        { id: 'plan-2', status: 'ACTIVE' },
      ];

      (prisma.paymentPlan.findMany as jest.Mock).mockResolvedValue(mockPlans);

      // Act
      const result = await PaymentPlanService.getUserPaymentPlans('user-1', {
        status: 'ACTIVE',
      });

      // Assert
      expect(result).toHaveLength(2);
      expect(prisma.paymentPlan.findMany).toHaveBeenCalledWith({
        where: {
          registration: { attendeeId: 'user-1' },
          status: 'ACTIVE',
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('processInstallmentPayment', () => {
    it('should process installment payment and mark as paid', async () => {
      // Arrange
      const mockInstallment = {
        id: 'inst-1',
        planId: 'plan-1',
        status: 'PENDING',
        plan: {
          registrationId: 'reg-1',
          registration: { id: 'reg-1' },
        },
      };

      (prisma.paymentInstallment.findUnique as jest.Mock).mockResolvedValue(mockInstallment);
      (prisma.paymentInstallment.update as jest.Mock).mockResolvedValue({
        ...mockInstallment,
        status: 'PAID',
      });
      (prisma.paymentInstallment.count as jest.Mock).mockResolvedValue(2); // 2 remaining

      // Act
      const result = await PaymentPlanService.processInstallmentPayment('inst-1', {
        amount: 250,
        transactionId: 'txn-1',
      });

      // Assert
      expect(result.status).toBe('PAID');
      expect(prisma.paymentInstallment.update).toHaveBeenCalled();
    });

    it('should complete plan when all installments are paid', async () => {
      // Arrange
      const mockInstallment = {
        id: 'inst-1',
        planId: 'plan-1',
        status: 'PENDING',
        plan: {
          registrationId: 'reg-1',
          registration: { id: 'reg-1' },
        },
      };

      (prisma.paymentInstallment.findUnique as jest.Mock).mockResolvedValue(mockInstallment);
      (prisma.paymentInstallment.update as jest.Mock).mockResolvedValue({
        ...mockInstallment,
        status: 'PAID',
      });
      (prisma.paymentInstallment.count as jest.Mock).mockResolvedValue(0); // No remaining
      (prisma.paymentPlan.update as jest.Mock).mockResolvedValue({ status: 'COMPLETED' });
      (prisma.eventRegistration.update as jest.Mock).mockResolvedValue({ paymentStatus: 'COMPLETED' });

      // Act
      await PaymentPlanService.processInstallmentPayment('inst-1', {
        amount: 250,
        transactionId: 'txn-1',
      });

      // Assert
      expect(prisma.paymentPlan.update).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        data: { status: 'COMPLETED' },
      });
      expect(prisma.eventRegistration.update).toHaveBeenCalled();
    });

    it('should throw ValidationError if installment already paid', async () => {
      // Arrange
      (prisma.paymentInstallment.findUnique as jest.Mock).mockResolvedValue({
        id: 'inst-1',
        status: 'PAID',
      });

      // Act & Assert
      await expect(PaymentPlanService.processInstallmentPayment('inst-1', {
        amount: 250,
      })).rejects.toThrow('Installment already paid');
    });
  });

  describe('getOverdueInstallments', () => {
    it('should return and mark overdue installments', async () => {
      // Arrange
      const mockOverdue = [
        { id: 'inst-1', dueDate: new Date('2026-01-01') },
        { id: 'inst-2', dueDate: new Date('2026-01-15') },
      ];

      (prisma.paymentInstallment.findMany as jest.Mock).mockResolvedValue(mockOverdue);
      (prisma.paymentInstallment.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      // Act
      const result = await PaymentPlanService.getOverdueInstallments('user-1');

      // Assert
      expect(result).toHaveLength(2);
      expect(prisma.paymentInstallment.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['inst-1', 'inst-2'] },
        },
        data: {
          status: 'OVERDUE',
        },
      });
    });
  });

  describe('cancelPaymentPlan', () => {
    it('should cancel payment plan and pending installments', async () => {
      // Arrange
      const mockPlan = {
        id: 'plan-1',
        status: 'ACTIVE',
        registration: { attendeeId: 'user-1' },
      };

      (prisma.paymentPlan.findUnique as jest.Mock).mockResolvedValue(mockPlan);
      (prisma.$transaction as jest.Mock).mockImplementation(async (operations) => {
        return operations;
      });

      // Act
      const result = await PaymentPlanService.cancelPaymentPlan('plan-1', 'user-1');

      // Assert
      expect(result.success).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Payment plan cancelled: plan-1');
    });

    it('should throw ValidationError if user does not own plan', async () => {
      // Arrange
      (prisma.paymentPlan.findUnique as jest.Mock).mockResolvedValue({
        id: 'plan-1',
        registration: { attendeeId: 'other-user' },
      });

      // Act & Assert
      await expect(PaymentPlanService.cancelPaymentPlan('plan-1', 'user-1')).rejects.toThrow(
        'You can only cancel your own payment plans',
      );
    });

    it('should throw ValidationError if plan already completed', async () => {
      // Arrange
      (prisma.paymentPlan.findUnique as jest.Mock).mockResolvedValue({
        id: 'plan-1',
        status: 'COMPLETED',
        registration: { attendeeId: 'user-1' },
      });

      // Act & Assert
      await expect(PaymentPlanService.cancelPaymentPlan('plan-1', 'user-1')).rejects.toThrow(
        'Payment plan cannot be cancelled',
      );
    });
  });
});
