import { AdminFinancialService } from '../src/services/admin-financial.service';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../src/config/database';

vi.mock('../src/config/database', () => ({
  prisma: {
    platformExpense: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    platformIncome: {
      findMany: vi.fn(),
    },
    wage: {
      aggregate: vi.fn(),
    },
    platformFee: {
      aggregate: vi.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  platformExpense: {
    create: vi.Mock;
    findMany: vi.Mock;
    count: vi.Mock;
    aggregate: vi.Mock;
  };
  platformIncome: {
    findMany: vi.Mock;
  };
  wage: {
    aggregate: vi.Mock;
  };
  platformFee: {
    aggregate: vi.Mock;
  };
};

describe('AdminFinancialService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
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

  it('computes financial overview with wages and platform fees', async () => {
    prismaMock.platformExpense.findMany.mockResolvedValue([
      { amount: new Decimal(50) },
      { amount: new Decimal(20) },
    ]);
    prismaMock.platformIncome.findMany.mockResolvedValue([
      { amount: new Decimal(200) },
    ]);
    prismaMock.wage.aggregate.mockResolvedValue({
      _sum: { amount: new Decimal(100) },
      _count: 2,
    });
    prismaMock.platformFee.aggregate.mockResolvedValue({
      _sum: { feeAmount: new Decimal(150), grossAmount: new Decimal(2000), organizerAmount: new Decimal(1850) },
      _count: 3,
    });

    const overview = await AdminFinancialService.getFinancialOverview({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    });

    // Operating expenses (70) + wages (100) = 170
    expect(overview.totalExpenses).toBe(170);
    // Manual income (200) + platform fee revenue (150) = 350
    expect(overview.totalIncome).toBe(350);
    // 350 - 170 = 180
    expect(overview.netProfit).toBe(180);
    // Enhanced fields
    expect(overview.operatingExpenses).toBe(70);
    expect(overview.totalWages).toBe(100);
    expect(overview.platformFeeRevenue).toBe(150);
    expect(overview.manualIncome).toBe(200);
    expect(overview.totalGrossRevenue).toBe(2000);
    expect(overview.totalOrganizerPayouts).toBe(1850);
    expect(overview.platformFeeCount).toBe(3);
    expect(overview.wageCount).toBe(2);
  });

  it('computes financial overview with no wages or platform fees', async () => {
    prismaMock.platformExpense.findMany.mockResolvedValue([
      { amount: new Decimal(50) },
    ]);
    prismaMock.platformIncome.findMany.mockResolvedValue([
      { amount: new Decimal(200) },
    ]);
    prismaMock.wage.aggregate.mockResolvedValue({
      _sum: { amount: null },
      _count: 0,
    });
    prismaMock.platformFee.aggregate.mockResolvedValue({
      _sum: { feeAmount: null, grossAmount: null, organizerAmount: null },
      _count: 0,
    });

    const overview = await AdminFinancialService.getFinancialOverview();

    expect(overview.totalExpenses).toBe(50);
    expect(overview.totalIncome).toBe(200);
    expect(overview.netProfit).toBe(150);
    expect(overview.totalWages).toBe(0);
    expect(overview.platformFeeRevenue).toBe(0);
  });
});

