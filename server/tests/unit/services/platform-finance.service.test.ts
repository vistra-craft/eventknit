import { PrismaClient, Prisma } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import {
  PlatformExpenseService,
  PlatformIncomeService,
  WageService,
  PlatformFinanceSummaryService,
} from '../../../src/services/platform-finance.service.js';
import { NotFoundError } from '../../../src/utils/errors.js';
import * as databaseModule from '../../../src/config/database.js';

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

describe('Platform Finance Services', () => {
  let prisma: DeepMockProxy<PrismaClient>;

  beforeAll(() => {
    prisma = databaseModule.prisma as DeepMockProxy<PrismaClient>;
  });

  beforeEach(() => {
    mockReset(prisma);
    jest.clearAllMocks();
  });

  describe('PlatformExpenseService', () => {
    const mockExpense = {
      id: 'expense-123',
      category: 'infrastructure',
      description: 'Server costs',
      amount: new Prisma.Decimal(100),
      currency: 'KES',
      paymentMethod: 'credit_card',
      recipient: 'AWS',
      reference: 'INV-12345',
      receiptUrl: null,
      receiptDate: null,
      taxAmount: new Prisma.Decimal(10),
      taxRate: new Prisma.Decimal(10),
      notes: null,
      recordedBy: 'admin-1',
      status: 'COMPLETED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe('getExpenses', () => {
      it('should return paginated expenses with default limit 20', async () => {
        // Arrange
        prisma.platformExpense.findMany.mockResolvedValue([mockExpense] as any);
        prisma.platformExpense.count.mockResolvedValue(1);

        // Act
        const result = await PlatformExpenseService.getExpenses();

        // Assert
        expect(result.expenses).toHaveLength(1);
        expect(result.page).toBe(1);
        expect(result.totalPages).toBe(1);
        expect(prisma.platformExpense.findMany).toHaveBeenCalledWith({
          where: {},
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
        });
      });

      it('should handle custom pagination', async () => {
        // Arrange
        prisma.platformExpense.findMany.mockResolvedValue([mockExpense] as any);
        prisma.platformExpense.count.mockResolvedValue(50);

        // Act
        const result = await PlatformExpenseService.getExpenses({ page: 2, limit: 10 });

        // Assert
        expect(result.page).toBe(2);
        expect(result.totalPages).toBe(5);
        expect(prisma.platformExpense.findMany).toHaveBeenCalledWith({
          where: {},
          skip: 10,
          take: 10,
          orderBy: { createdAt: 'desc' },
        });
      });

      it('should filter by category', async () => {
        // Arrange
        prisma.platformExpense.findMany.mockResolvedValue([mockExpense] as any);
        prisma.platformExpense.count.mockResolvedValue(1);

        // Act
        await PlatformExpenseService.getExpenses({ category: 'infrastructure' });

        // Assert
        expect(prisma.platformExpense.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { category: 'infrastructure' },
          }),
        );
      });

      it('should filter by status', async () => {
        // Arrange
        prisma.platformExpense.findMany.mockResolvedValue([mockExpense] as any);
        prisma.platformExpense.count.mockResolvedValue(1);

        // Act
        await PlatformExpenseService.getExpenses({ status: 'COMPLETED' });

        // Assert
        expect(prisma.platformExpense.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { status: 'COMPLETED' },
          }),
        );
      });

      it('should filter by date range', async () => {
        // Arrange
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-12-31');
        prisma.platformExpense.findMany.mockResolvedValue([mockExpense] as any);
        prisma.platformExpense.count.mockResolvedValue(1);

        // Act
        await PlatformExpenseService.getExpenses({ startDate, endDate });

        // Assert
        expect(prisma.platformExpense.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          }),
        );
      });
    });

    describe('getExpenseById', () => {
      it('should return expense if found', async () => {
        // Arrange
        prisma.platformExpense.findUnique.mockResolvedValue(mockExpense as any);

        // Act
        const result = await PlatformExpenseService.getExpenseById('expense-123');

        // Assert
        expect(result).toEqual(mockExpense);
        expect(prisma.platformExpense.findUnique).toHaveBeenCalledWith({
          where: { id: 'expense-123' },
        });
      });

      it('should throw NotFoundError if expense not found', async () => {
        // Arrange
        prisma.platformExpense.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(
          PlatformExpenseService.getExpenseById('non-existent'),
        ).rejects.toThrow(NotFoundError);

        await expect(
          PlatformExpenseService.getExpenseById('non-existent'),
        ).rejects.toThrow('Expense not found');
      });
    });

    describe('createExpense', () => {
      it('should create expense with all fields', async () => {
        // Arrange
        const createData = {
          category: 'infrastructure',
          description: 'Server costs',
          amount: 100,
          currency: 'USD',
          paymentMethod: 'credit_card',
          recipient: 'AWS',
          reference: 'INV-12345',
          receiptUrl: 'https://example.com/receipt.pdf',
          receiptDate: new Date('2024-01-15'),
          taxAmount: 10,
          taxRate: 10,
          notes: 'Monthly server costs',
          createdBy: 'admin-1',
        };
        prisma.platformExpense.create.mockResolvedValue(mockExpense as any);

        // Act
        const result = await PlatformExpenseService.createExpense(createData);

        // Assert
        expect(result).toEqual(mockExpense);
        expect(prisma.platformExpense.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            category: 'infrastructure',
            description: 'Server costs',
            currency: 'USD',
            status: 'COMPLETED',
          }),
        });
      });

      it('should use default currency KES if not provided', async () => {
        // Arrange
        const createData = {
          category: 'infrastructure',
          description: 'Server costs',
          amount: 100,
        };
        prisma.platformExpense.create.mockResolvedValue({
          ...mockExpense,
          currency: 'KES',
        } as any);

        // Act
        await PlatformExpenseService.createExpense(createData);

        // Assert
        expect(prisma.platformExpense.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            currency: 'KES',
          }),
        });
      });

      it('should convert amounts to Prisma.Decimal', async () => {
        // Arrange
        const createData = {
          category: 'infrastructure',
          description: 'Server costs',
          amount: 100,
          taxAmount: 10,
          taxRate: 10,
        };
        prisma.platformExpense.create.mockResolvedValue(mockExpense as any);

        // Act
        await PlatformExpenseService.createExpense(createData);

        // Assert
        const createCall = prisma.platformExpense.create.mock.calls[0][0];
        expect(createCall.data.amount).toBeInstanceOf(Prisma.Decimal);
        expect(createCall.data.taxAmount).toBeInstanceOf(Prisma.Decimal);
        expect(createCall.data.taxRate).toBeInstanceOf(Prisma.Decimal);
      });
    });

    describe('updateExpense', () => {
      it('should update expense fields', async () => {
        // Arrange
        prisma.platformExpense.findUnique.mockResolvedValue(mockExpense as any);
        const updatedExpense = { ...mockExpense, category: 'marketing' };
        prisma.platformExpense.update.mockResolvedValue(updatedExpense as any);

        // Act
        const result = await PlatformExpenseService.updateExpense('expense-123', {
          category: 'marketing',
        });

        // Assert
        expect(result.category).toBe('marketing');
        expect(prisma.platformExpense.update).toHaveBeenCalled();
      });

      it('should throw NotFoundError if expense not found', async () => {
        // Arrange
        prisma.platformExpense.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(
          PlatformExpenseService.updateExpense('non-existent', { category: 'marketing' }),
        ).rejects.toThrow(NotFoundError);
      });

      it('should handle undefined fields', async () => {
        // Arrange
        prisma.platformExpense.findUnique.mockResolvedValue(mockExpense as any);
        prisma.platformExpense.update.mockResolvedValue(mockExpense as any);

        // Act
        await PlatformExpenseService.updateExpense('expense-123', {
          category: 'marketing',
          description: undefined,
        });

        // Assert
        const updateCall = prisma.platformExpense.update.mock.calls[0][0];
        expect(updateCall.data).toHaveProperty('category');
        expect(updateCall.data).not.toHaveProperty('description');
      });
    });

    describe('deleteExpense', () => {
      it('should delete expense if found', async () => {
        // Arrange
        prisma.platformExpense.findUnique.mockResolvedValue(mockExpense as any);
        prisma.platformExpense.delete.mockResolvedValue(mockExpense as any);

        // Act
        await PlatformExpenseService.deleteExpense('expense-123');

        // Assert
        expect(prisma.platformExpense.delete).toHaveBeenCalledWith({
          where: { id: 'expense-123' },
        });
      });

      it('should throw NotFoundError if expense not found', async () => {
        // Arrange
        prisma.platformExpense.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(
          PlatformExpenseService.deleteExpense('non-existent'),
        ).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('PlatformIncomeService', () => {
    const mockIncome = {
      id: 'income-123',
      category: 'platform_fees',
      description: 'Platform fees from event',
      amount: new Prisma.Decimal(50),
      currency: 'KES',
      source: 'EventKnit Platform',
      reference: 'FEE-12345',
      paymentMethod: 'stripe',
      eventId: 'event-123',
      transactionId: 'txn-123',
      notes: null,
      recordedBy: 'system',
      status: 'COMPLETED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockIncomeWithEvent = {
      ...mockIncome,
      event: {
        id: 'event-123',
        title: 'Test Event',
      },
    };

    describe('getIncomes', () => {
      it('should return paginated incomes with event relation', async () => {
        // Arrange
        prisma.platformIncome.findMany.mockResolvedValue([mockIncomeWithEvent] as any);
        prisma.platformIncome.count.mockResolvedValue(1);

        // Act
        const result = await PlatformIncomeService.getIncomes();

        // Assert
        expect(result.incomes).toHaveLength(1);
        expect(result.incomes[0].event).toBeDefined();
        expect(prisma.platformIncome.findMany).toHaveBeenCalledWith({
          where: {},
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            event: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });
      });

      it('should filter by category', async () => {
        // Arrange
        prisma.platformIncome.findMany.mockResolvedValue([mockIncomeWithEvent] as any);
        prisma.platformIncome.count.mockResolvedValue(1);

        // Act
        await PlatformIncomeService.getIncomes({ category: 'platform_fees' });

        // Assert
        expect(prisma.platformIncome.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { category: 'platform_fees' },
          }),
        );
      });

      it('should filter by status', async () => {
        // Arrange
        prisma.platformIncome.findMany.mockResolvedValue([mockIncomeWithEvent] as any);
        prisma.platformIncome.count.mockResolvedValue(1);

        // Act
        await PlatformIncomeService.getIncomes({ status: 'COMPLETED' });

        // Assert
        expect(prisma.platformIncome.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { status: 'COMPLETED' },
          }),
        );
      });

      it('should filter by date range', async () => {
        // Arrange
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-12-31');
        prisma.platformIncome.findMany.mockResolvedValue([mockIncomeWithEvent] as any);
        prisma.platformIncome.count.mockResolvedValue(1);

        // Act
        await PlatformIncomeService.getIncomes({ startDate, endDate });

        // Assert
        expect(prisma.platformIncome.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          }),
        );
      });
    });

    describe('getIncomeById', () => {
      it('should return income with event relation if found', async () => {
        // Arrange
        prisma.platformIncome.findUnique.mockResolvedValue(mockIncomeWithEvent as any);

        // Act
        const result = await PlatformIncomeService.getIncomeById('income-123');

        // Assert
        expect(result).toEqual(mockIncomeWithEvent);
        expect(result.event).toBeDefined();
        expect(prisma.platformIncome.findUnique).toHaveBeenCalledWith({
          where: { id: 'income-123' },
          include: {
            event: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });
      });

      it('should throw NotFoundError if income not found', async () => {
        // Arrange
        prisma.platformIncome.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(
          PlatformIncomeService.getIncomeById('non-existent'),
        ).rejects.toThrow(NotFoundError);

        await expect(
          PlatformIncomeService.getIncomeById('non-existent'),
        ).rejects.toThrow('Income not found');
      });
    });

    describe('createIncome', () => {
      it('should create income with all fields', async () => {
        // Arrange
        const createData = {
          category: 'platform_fees',
          description: 'Platform fees',
          amount: 50,
          currency: 'USD',
          source: 'EventKnit',
          reference: 'FEE-123',
          paymentMethod: 'stripe',
          eventId: 'event-123',
          transactionId: 'txn-123',
          notes: 'Monthly fees',
          createdBy: 'system',
        };
        prisma.platformIncome.create.mockResolvedValue(mockIncome as any);

        // Act
        const result = await PlatformIncomeService.createIncome(createData);

        // Assert
        expect(result).toEqual(mockIncome);
        expect(prisma.platformIncome.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            category: 'platform_fees',
            amount: expect.any(Prisma.Decimal),
            status: 'COMPLETED',
          }),
        });
      });

      it('should use default currency KES if not provided', async () => {
        // Arrange
        const createData = {
          category: 'platform_fees',
          description: 'Platform fees',
          amount: 50,
        };
        prisma.platformIncome.create.mockResolvedValue(mockIncome as any);

        // Act
        await PlatformIncomeService.createIncome(createData);

        // Assert
        expect(prisma.platformIncome.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            currency: 'KES',
          }),
        });
      });
    });

    describe('updateIncome', () => {
      it('should update income fields', async () => {
        // Arrange
        prisma.platformIncome.findUnique.mockResolvedValue(mockIncome as any);
        const updatedIncome = { ...mockIncome, category: 'subscriptions' };
        prisma.platformIncome.update.mockResolvedValue(updatedIncome as any);

        // Act
        const result = await PlatformIncomeService.updateIncome('income-123', {
          category: 'subscriptions',
        });

        // Assert
        expect(result.category).toBe('subscriptions');
        expect(prisma.platformIncome.update).toHaveBeenCalled();
      });

      it('should throw NotFoundError if income not found', async () => {
        // Arrange
        prisma.platformIncome.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(
          PlatformIncomeService.updateIncome('non-existent', { category: 'subscriptions' }),
        ).rejects.toThrow(NotFoundError);
      });
    });

    describe('deleteIncome', () => {
      it('should delete income if found', async () => {
        // Arrange
        prisma.platformIncome.findUnique.mockResolvedValue(mockIncome as any);
        prisma.platformIncome.delete.mockResolvedValue(mockIncome as any);

        // Act
        await PlatformIncomeService.deleteIncome('income-123');

        // Assert
        expect(prisma.platformIncome.delete).toHaveBeenCalledWith({
          where: { id: 'income-123' },
        });
      });

      it('should throw NotFoundError if income not found', async () => {
        // Arrange
        prisma.platformIncome.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(
          PlatformIncomeService.deleteIncome('non-existent'),
        ).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('WageService', () => {
    const mockWage = {
      id: 'wage-123',
      employeeId: 'emp-123',
      employeeName: 'John Doe',
      department: 'Engineering',
      position: 'Senior Developer',
      amount: new Prisma.Decimal(5000),
      currency: 'KES',
      payPeriod: '2024-01',
      payDate: new Date('2024-01-31'),
      paymentMethod: 'BANK_TRANSFER',
      reference: 'PAY-123',
      notes: null,
      createdBy: 'admin-1',
      status: 'COMPLETED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe('getWages', () => {
      it('should return paginated wages with default limit 20', async () => {
        // Arrange
        prisma.wage.findMany.mockResolvedValue([mockWage] as any);
        prisma.wage.count.mockResolvedValue(1);

        // Act
        const result = await WageService.getWages();

        // Assert
        expect(result.wages).toHaveLength(1);
        expect(result.page).toBe(1);
        expect(result.totalPages).toBe(1);
        expect(prisma.wage.findMany).toHaveBeenCalledWith({
          where: {},
          skip: 0,
          take: 20,
          orderBy: { payDate: 'desc' },
        });
      });

      it('should filter by department', async () => {
        // Arrange
        prisma.wage.findMany.mockResolvedValue([mockWage] as any);
        prisma.wage.count.mockResolvedValue(1);

        // Act
        await WageService.getWages({ department: 'Engineering' });

        // Assert
        expect(prisma.wage.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { department: 'Engineering' },
          }),
        );
      });

      it('should filter by status', async () => {
        // Arrange
        prisma.wage.findMany.mockResolvedValue([mockWage] as any);
        prisma.wage.count.mockResolvedValue(1);

        // Act
        await WageService.getWages({ status: 'COMPLETED' });

        // Assert
        expect(prisma.wage.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { status: 'COMPLETED' },
          }),
        );
      });

      it('should filter by payPeriod', async () => {
        // Arrange
        prisma.wage.findMany.mockResolvedValue([mockWage] as any);
        prisma.wage.count.mockResolvedValue(1);

        // Act
        await WageService.getWages({ payPeriod: '2024-01' });

        // Assert
        expect(prisma.wage.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { payPeriod: '2024-01' },
          }),
        );
      });

      it('should filter by payDate range', async () => {
        // Arrange
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-12-31');
        prisma.wage.findMany.mockResolvedValue([mockWage] as any);
        prisma.wage.count.mockResolvedValue(1);

        // Act
        await WageService.getWages({ startDate, endDate });

        // Assert
        expect(prisma.wage.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              payDate: {
                gte: startDate,
                lte: endDate,
              },
            },
          }),
        );
      });
    });

    describe('getWageById', () => {
      it('should return wage if found', async () => {
        // Arrange
        prisma.wage.findUnique.mockResolvedValue(mockWage as any);

        // Act
        const result = await WageService.getWageById('wage-123');

        // Assert
        expect(result).toEqual(mockWage);
        expect(prisma.wage.findUnique).toHaveBeenCalledWith({
          where: { id: 'wage-123' },
        });
      });

      it('should throw NotFoundError if wage not found', async () => {
        // Arrange
        prisma.wage.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(
          WageService.getWageById('non-existent'),
        ).rejects.toThrow(NotFoundError);

        await expect(
          WageService.getWageById('non-existent'),
        ).rejects.toThrow('Wage record not found');
      });
    });

    describe('createWage', () => {
      it('should create wage with all fields', async () => {
        // Arrange
        const createData = {
          employeeId: 'emp-123',
          employeeName: 'John Doe',
          department: 'Engineering',
          position: 'Senior Developer',
          amount: 5000,
          currency: 'USD',
          payPeriod: '2024-01',
          payDate: new Date('2024-01-31'),
          paymentMethod: 'BANK_TRANSFER' as const,
          reference: 'PAY-123',
          notes: 'Monthly salary',
          createdBy: 'admin-1',
        };
        prisma.wage.create.mockResolvedValue(mockWage as any);

        // Act
        const result = await WageService.createWage(createData);

        // Assert
        expect(result).toEqual(mockWage);
        expect(prisma.wage.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            employeeName: 'John Doe',
            department: 'Engineering',
            amount: expect.any(Prisma.Decimal),
            paymentMethod: 'BANK_TRANSFER',
            status: 'COMPLETED',
          }),
        });
      });

      it('should use default currency KES if not provided', async () => {
        // Arrange
        const createData = {
          employeeName: 'John Doe',
          amount: 5000,
          payPeriod: '2024-01',
          payDate: new Date('2024-01-31'),
        };
        prisma.wage.create.mockResolvedValue(mockWage as any);

        // Act
        await WageService.createWage(createData);

        // Assert
        expect(prisma.wage.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            currency: 'KES',
          }),
        });
      });

      it('should use default paymentMethod BANK_TRANSFER if not provided', async () => {
        // Arrange
        const createData = {
          employeeName: 'John Doe',
          amount: 5000,
          payPeriod: '2024-01',
          payDate: new Date('2024-01-31'),
        };
        prisma.wage.create.mockResolvedValue(mockWage as any);

        // Act
        await WageService.createWage(createData);

        // Assert
        expect(prisma.wage.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            paymentMethod: 'BANK_TRANSFER',
          }),
        });
      });
    });

    describe('updateWage', () => {
      it('should update wage fields', async () => {
        // Arrange
        prisma.wage.findUnique.mockResolvedValue(mockWage as any);
        const updatedWage = { ...mockWage, department: 'Marketing' };
        prisma.wage.update.mockResolvedValue(updatedWage as any);

        // Act
        const result = await WageService.updateWage('wage-123', {
          department: 'Marketing',
        });

        // Assert
        expect(result.department).toBe('Marketing');
        expect(prisma.wage.update).toHaveBeenCalled();
      });

      it('should throw NotFoundError if wage not found', async () => {
        // Arrange
        prisma.wage.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(
          WageService.updateWage('non-existent', { department: 'Marketing' }),
        ).rejects.toThrow(NotFoundError);
      });
    });

    describe('deleteWage', () => {
      it('should delete wage if found', async () => {
        // Arrange
        prisma.wage.findUnique.mockResolvedValue(mockWage as any);
        prisma.wage.delete.mockResolvedValue(mockWage as any);

        // Act
        await WageService.deleteWage('wage-123');

        // Assert
        expect(prisma.wage.delete).toHaveBeenCalledWith({
          where: { id: 'wage-123' },
        });
      });

      it('should throw NotFoundError if wage not found', async () => {
        // Arrange
        prisma.wage.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(
          WageService.deleteWage('non-existent'),
        ).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('PlatformFinanceSummaryService', () => {
    describe('getFinanceSummary', () => {
      it('should return summary with all categories', async () => {
        // Arrange
        prisma.platformExpense.aggregate.mockResolvedValue({
          _sum: { amount: new Prisma.Decimal(200) },
          _count: 5,
        } as any);

        prisma.platformIncome.aggregate.mockResolvedValue({
          _sum: { amount: new Prisma.Decimal(500) },
          _count: 10,
        } as any);

        prisma.wage.aggregate.mockResolvedValue({
          _sum: { amount: new Prisma.Decimal(300) },
          _count: 3,
        } as any);

        // Act
        const result = await PlatformFinanceSummaryService.getFinanceSummary();

        // Assert
        expect(result.totalIncome).toBe(500);
        expect(result.totalExpenses).toBe(500); // 200 + 300 (expenses + wages)
        expect(result.totalWages).toBe(300);
        expect(result.netProfit).toBe(0); // 500 - 500
        expect(result.expenseCount).toBe(5);
        expect(result.incomeCount).toBe(10);
        expect(result.wageCount).toBe(3);
      });

      it('should calculate positive netProfit', async () => {
        // Arrange
        prisma.platformExpense.aggregate.mockResolvedValue({
          _sum: { amount: new Prisma.Decimal(100) },
          _count: 2,
        } as any);

        prisma.platformIncome.aggregate.mockResolvedValue({
          _sum: { amount: new Prisma.Decimal(1000) },
          _count: 5,
        } as any);

        prisma.wage.aggregate.mockResolvedValue({
          _sum: { amount: new Prisma.Decimal(200) },
          _count: 1,
        } as any);

        // Act
        const result = await PlatformFinanceSummaryService.getFinanceSummary();

        // Assert
        expect(result.totalIncome).toBe(1000);
        expect(result.totalExpenses).toBe(300); // 100 + 200
        expect(result.netProfit).toBe(700); // 1000 - 300
      });

      it('should calculate negative netProfit', async () => {
        // Arrange
        prisma.platformExpense.aggregate.mockResolvedValue({
          _sum: { amount: new Prisma.Decimal(500) },
          _count: 5,
        } as any);

        prisma.platformIncome.aggregate.mockResolvedValue({
          _sum: { amount: new Prisma.Decimal(200) },
          _count: 2,
        } as any);

        prisma.wage.aggregate.mockResolvedValue({
          _sum: { amount: new Prisma.Decimal(400) },
          _count: 2,
        } as any);

        // Act
        const result = await PlatformFinanceSummaryService.getFinanceSummary();

        // Assert
        expect(result.totalIncome).toBe(200);
        expect(result.totalExpenses).toBe(900); // 500 + 400
        expect(result.netProfit).toBe(-700); // 200 - 900
      });

      it('should return zeros when no data exists', async () => {
        // Arrange
        prisma.platformExpense.aggregate.mockResolvedValue({
          _sum: { amount: null },
          _count: 0,
        } as any);

        prisma.platformIncome.aggregate.mockResolvedValue({
          _sum: { amount: null },
          _count: 0,
        } as any);

        prisma.wage.aggregate.mockResolvedValue({
          _sum: { amount: null },
          _count: 0,
        } as any);

        // Act
        const result = await PlatformFinanceSummaryService.getFinanceSummary();

        // Assert
        expect(result.totalIncome).toBe(0);
        expect(result.totalExpenses).toBe(0);
        expect(result.totalWages).toBe(0);
        expect(result.netProfit).toBe(0);
        expect(result.expenseCount).toBe(0);
        expect(result.incomeCount).toBe(0);
        expect(result.wageCount).toBe(0);
      });

      it('should filter by date range', async () => {
        // Arrange
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-12-31');

        prisma.platformExpense.aggregate.mockResolvedValue({
          _sum: { amount: new Prisma.Decimal(100) },
          _count: 1,
        } as any);

        prisma.platformIncome.aggregate.mockResolvedValue({
          _sum: { amount: new Prisma.Decimal(300) },
          _count: 2,
        } as any);

        prisma.wage.aggregate.mockResolvedValue({
          _sum: { amount: new Prisma.Decimal(50) },
          _count: 1,
        } as any);

        // Act
        await PlatformFinanceSummaryService.getFinanceSummary({ startDate, endDate });

        // Assert
        expect(prisma.platformExpense.aggregate).toHaveBeenCalledWith({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            status: 'COMPLETED',
          },
          _sum: { amount: true },
          _count: true,
        });

        expect(prisma.platformIncome.aggregate).toHaveBeenCalledWith({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            status: 'COMPLETED',
          },
          _sum: { amount: true },
          _count: true,
        });

        expect(prisma.wage.aggregate).toHaveBeenCalledWith({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            status: 'COMPLETED',
          },
          _sum: { amount: true },
          _count: true,
        });
      });

      it('should only include COMPLETED status entries', async () => {
        // Arrange
        prisma.platformExpense.aggregate.mockResolvedValue({
          _sum: { amount: new Prisma.Decimal(100) },
          _count: 1,
        } as any);

        prisma.platformIncome.aggregate.mockResolvedValue({
          _sum: { amount: new Prisma.Decimal(200) },
          _count: 1,
        } as any);

        prisma.wage.aggregate.mockResolvedValue({
          _sum: { amount: new Prisma.Decimal(50) },
          _count: 1,
        } as any);

        // Act
        await PlatformFinanceSummaryService.getFinanceSummary();

        // Assert
        expect(prisma.platformExpense.aggregate).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: 'COMPLETED',
            }),
          }),
        );

        expect(prisma.platformIncome.aggregate).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: 'COMPLETED',
            }),
          }),
        );

        expect(prisma.wage.aggregate).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: 'COMPLETED',
            }),
          }),
        );
      });
    });
  });
});
