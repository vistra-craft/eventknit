import { OrganizerFinancialService } from '../src/services/organizer-financial.service';
import { NotFoundError } from '../src/utils/errors';
import { prisma } from '../src/config/database';

jest.mock('../src/config/database', () => ({
  prisma: {
    event: { findFirst: jest.fn() },
    eventExpense: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    eventPaymentTransaction: {
      findMany: jest.fn(),
    },
    refund: {
      findMany: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  event: { findFirst: jest.Mock };
  eventExpense: { create: jest.Mock; findMany: jest.Mock };
  eventPaymentTransaction: { findMany: jest.Mock };
  refund: { findMany: jest.Mock };
};

describe('OrganizerFinancialService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('throws when creating expense for missing event', async () => {
    prismaMock.event.findFirst.mockResolvedValue(null);
    await expect(
      OrganizerFinancialService.createExpense('org-1', {
        eventId: 'evt-x',
        category: 'ops',
        description: 'chairs',
        amount: 50,
      } as any),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('creates expense when event belongs to organizer', async () => {
    prismaMock.event.findFirst.mockResolvedValue({ id: 'evt-1', organizerId: 'org-1' });
    prismaMock.eventExpense.create.mockResolvedValue({ id: 'exp-1' });

    const exp = await OrganizerFinancialService.createExpense('org-1', {
      eventId: 'evt-1',
      category: 'ops',
      description: 'chairs',
      amount: 50,
    } as any);

    expect(prismaMock.eventExpense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizerId: 'org-1', eventId: 'evt-1', amount: 50 }),
      }),
    );
    expect(exp).toEqual({ id: 'exp-1' });
  });

  it('builds profit/loss statement', async () => {
    prismaMock.eventPaymentTransaction.findMany.mockResolvedValue([
      { amount: 200, platformFee: { feeAmount: 20 } },
    ]);
    prismaMock.eventExpense.findMany = jest.fn().mockResolvedValue([
      { amount: 50, isTaxDeductible: true },
    ]);

    const pl = await OrganizerFinancialService.getProfitLossStatement('org-1', { eventId: 'evt-1' });

    expect(pl.netRevenue).toBe(180); // 200 - 20
    expect(pl.totalExpenses).toBe(50);
    expect(pl.netProfit).toBe(130);
  });

  it('computes tax summary', async () => {
    prismaMock.eventPaymentTransaction.findMany.mockResolvedValue([
      { amount: 300, platformFee: { feeAmount: 30 } },
    ]);
    prismaMock.eventExpense.findMany.mockResolvedValue([
      { amount: 40, isTaxDeductible: true },
      { amount: 10, isTaxDeductible: false },
    ]);

    const summary = await OrganizerFinancialService.getTaxSummary('org-1', { eventId: 'evt-1', year: 2024 });

    expect(summary.taxableIncome).toBe(260); // (300-30) - 40
    expect(summary.netRevenue).toBe(270);
    expect(summary.taxDeductibleExpenses).toBe(40);
  });
});

