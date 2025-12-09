import { PaymentPlanService } from '../src/services/payment-plan.service';
import { NotFoundError, ValidationError } from '../src/utils/errors';
import { Decimal } from '@prisma/client/runtime/library';

const prismaMock = {
  eventRegistration: {
    findUnique: jest.fn(),
  },
  paymentPlan: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  paymentInstallment: {
    createMany: jest.fn(),
  },
};

jest.mock('../src/config/database', () => ({
  prisma: prismaMock,
}));

describe('PaymentPlanService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const baseRegistration = {
    id: 'reg-1',
    totalAmount: new Decimal(200),
    eventId: 'evt-1',
    event: { id: 'evt-1', currency: 'USD' },
  };

  describe('createPaymentPlan', () => {
    it('throws when registration is missing', async () => {
      prismaMock.eventRegistration.findUnique.mockResolvedValue(null);

      await expect(
        PaymentPlanService.createPaymentPlan('missing', {
          planName: 'Split 2',
          installmentCount: 2,
          frequency: 'MONTHLY',
          startDate: new Date(),
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws when plan already exists', async () => {
      prismaMock.eventRegistration.findUnique.mockResolvedValue(baseRegistration as any);
      prismaMock.paymentPlan.findUnique.mockResolvedValue({ id: 'plan-1' });

      await expect(
        PaymentPlanService.createPaymentPlan(baseRegistration.id, {
          planName: 'Split 2',
          installmentCount: 2,
          frequency: 'MONTHLY',
          startDate: new Date(),
        }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('creates plan and installments', async () => {
      const startDate = new Date('2024-01-01T00:00:00Z');
      prismaMock.eventRegistration.findUnique.mockResolvedValue(baseRegistration as any);
      prismaMock.paymentPlan.findUnique.mockResolvedValue(null);
      prismaMock.paymentPlan.create.mockResolvedValue({
        id: 'plan-1',
        eventId: 'evt-1',
        currency: 'USD',
      });
      prismaMock.paymentInstallment.createMany.mockResolvedValue({ count: 2 });

      const plan = await PaymentPlanService.createPaymentPlan(baseRegistration.id, {
        planName: 'Split 2',
        installmentCount: 2,
        frequency: 'MONTHLY',
        startDate,
        autoPaymentEnabled: true,
        paymentMethod: 'card',
      });

      expect(prismaMock.paymentPlan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            registrationId: baseRegistration.id,
            eventId: 'evt-1',
            planName: 'Split 2',
            installmentCount: 2,
            frequency: 'MONTHLY',
            startDate,
            endDate: expect.any(Date),
            status: 'ACTIVE',
          }),
        }),
      );
      expect(prismaMock.paymentInstallment.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ planId: 'plan-1', installmentNumber: 1 }),
            expect.objectContaining({ planId: 'plan-1', installmentNumber: 2 }),
          ]),
        }),
      );
      expect(plan).toEqual(expect.objectContaining({ id: 'plan-1' }));
    });
  });

  describe('getPaymentPlanByRegistration', () => {
    it('throws when not found', async () => {
      prismaMock.paymentPlan.findUnique = jest.fn().mockResolvedValue(null);

      await expect(PaymentPlanService.getPaymentPlanByRegistration('missing')).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});

