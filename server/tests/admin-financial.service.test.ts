import { AdminFinancialService } from '../src/services/admin-financial.service';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../src/config/database';

jest.mock('../src/config/database', () => ({
  prisma: {
    platformExpense: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    platformIncome: {
      findMany: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  platformExpense: {
    create: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    aggregate: jest.Mock;
  };
  platformIncome: {
    findMany: jest.Mock;
  };
};

describe('AdminFinancialService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates expense with defaults', async () => {
    prismaMock.platformExpense.create.mockResolvedValue({ id: 'exp-1', amount: new Decimal(100) });

    const expense = await AdminFinancialService.createExpense({
      category: 'infra',
      description: 'server cost',
      amount: 100,
      recordedBy: 'admin-1',
    });

    expect(prismaMock.platformExpense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          category: 'infra',
          description: 'server cost',
          amount: expect.any(Decimal),
          currency: 'NGN',
          recordedBy: 'admin-1',
          status: 'pending',
        }),
      }),
    );
    expect(expense).toEqual(expect.objectContaining({ id: 'exp-1' }));
  });

  it('gets expenses with pagination', async () => {
    prismaMock.platformExpense.findMany.mockResolvedValue([{ id: 'exp-1' }]);
    prismaMock.platformExpense.count.mockResolvedValue(1);
    prismaMock.platformExpense.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(100) } });

    const result = await AdminFinancialService.getExpenses({
      category: 'infra',
      status: 'approved',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-02-01'),
      page: 1,
      limit: 10,
    });

    expect(prismaMock.platformExpense.findMany).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        items: [{ id: 'exp-1' }],
        total: 1,
        totalAmount: 100,
      }),
    );
  });

  it('computes financial overview', async () => {
    prismaMock.platformExpense.findMany.mockResolvedValue([
      { amount: new Decimal(50) },
      { amount: new Decimal(20) },
    ]);
    prismaMock.platformIncome.findMany.mockResolvedValue([
      { amount: new Decimal(200) },
    ]);

    const overview = await AdminFinancialService.getFinancialOverview({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    });

    expect(overview.totalExpenses).toBe(70);
    expect(overview.totalIncome).toBe(200);
    expect(overview.netProfit).toBe(130);
  });
});

