import { prisma } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { Prisma, FinancialEntryStatus, PaymentMethodType, StaffPayType } from '@prisma/client';

// Platform Expenses
export class PlatformExpenseService {
  static async getExpenses(options?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PlatformExpenseWhereInput = {};

    if (options?.category) {
      where.category = options.category;
    }

    if (options?.status) {
      where.status = options.status as FinancialEntryStatus;
    }

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const [expenses, total] = await Promise.all([
      prisma.platformExpense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.platformExpense.count({ where }),
    ]);

    return {
      expenses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getExpenseById(id: string) {
    const expense = await prisma.platformExpense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    return expense;
  }

  static async createExpense(data: {
    category: string;
    description: string;
    amount: number;
    currency?: string;
    paymentMethod?: string;
    recipient?: string;
    reference?: string;
    receiptUrl?: string;
    receiptDate?: Date;
    taxAmount?: number;
    taxRate?: number;
    notes?: string;
    createdBy?: string;
  }) {
    const expenseData: {
      category: string;
      description: string;
      amount: Prisma.Decimal;
      currency: string;
      status?: string;
      expenseDate?: Date;
      vendorName?: string;
      taxRate?: Prisma.Decimal;
      taxAmount?: Prisma.Decimal;
      notes?: string;
      recordedBy?: string;
      paymentMethod?: string;
      recipient?: string;
      reference?: string;
      receiptUrl?: string;
      receiptDate?: Date;
    } = {
      category: data.category,
      description: data.description,
      amount: new Prisma.Decimal(data.amount),
      currency: data.currency || 'KES',
      paymentMethod: data.paymentMethod,
      recipient: data.recipient,
      reference: data.reference,
      receiptUrl: data.receiptUrl,
      receiptDate: data.receiptDate,
      taxAmount: data.taxAmount ? new Prisma.Decimal(data.taxAmount) : undefined,
      taxRate: data.taxRate ? new Prisma.Decimal(data.taxRate) : undefined,
      notes: data.notes,
      recordedBy: data.createdBy,
      status: 'COMPLETED',
    };

    const expense = await prisma.platformExpense.create({
      data: expenseData,
    });

    logger.info(`Created platform expense: ${expense.id}`);
    return expense;
  }

  static async updateExpense(id: string, data: {
    category?: string;
    description?: string;
    amount?: number;
    currency?: string;
    paymentMethod?: string;
    recipient?: string;
    reference?: string;
    receiptUrl?: string;
    receiptDate?: Date;
    taxAmount?: number;
    taxRate?: number;
    notes?: string;
    status?: string;
  }) {
    const existing = await prisma.platformExpense.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Expense not found');
    }

    const updateData: Partial<{
      category: string;
      description: string;
      amount: Prisma.Decimal;
      currency: string;
      status: string;
      expenseDate: Date;
      vendorName: string;
      taxRate: Prisma.Decimal;
      taxAmount: Prisma.Decimal;
      notes: string;
      paymentMethod: string;
      recipient: string;
      reference: string;
      receiptUrl: string;
      receiptDate: Date;
    }> = {};

    if (data.category !== undefined) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.amount !== undefined) updateData.amount = new Prisma.Decimal(data.amount);
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
    if (data.recipient !== undefined) updateData.recipient = data.recipient;
    if (data.reference !== undefined) updateData.reference = data.reference;
    if (data.receiptUrl !== undefined) updateData.receiptUrl = data.receiptUrl;
    if (data.receiptDate !== undefined) updateData.receiptDate = data.receiptDate;
    if (data.taxAmount !== undefined) updateData.taxAmount = new Prisma.Decimal(data.taxAmount);
    if (data.taxRate !== undefined) updateData.taxRate = new Prisma.Decimal(data.taxRate);
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;

    const expense = await prisma.platformExpense.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Updated platform expense: ${expense.id}`);
    return expense;
  }

  static async deleteExpense(id: string) {
    const existing = await prisma.platformExpense.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Expense not found');
    }

    await prisma.platformExpense.delete({ where: { id } });
    logger.info(`Deleted platform expense: ${id}`);
  }
}

// Platform Income
export class PlatformIncomeService {
  static async getIncomes(options?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PlatformIncomeWhereInput = {};

    if (options?.category) {
      where.category = options.category;
    }

    if (options?.status) {
      where.status = options.status as FinancialEntryStatus;
    }

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const [incomes, total] = await Promise.all([
      prisma.platformIncome.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      prisma.platformIncome.count({ where }),
    ]);

    return {
      incomes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getIncomeById(id: string) {
    const income = await prisma.platformIncome.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!income) {
      throw new NotFoundError('Income not found');
    }

    return income;
  }

  static async createIncome(data: {
    category: string;
    description: string;
    amount: number;
    currency?: string;
    source?: string;
    reference?: string;
    paymentMethod?: string;
    eventId?: string;
    transactionId?: string;
    notes?: string;
    createdBy?: string;
  }) {
    const incomeData: {
      category: string;
      description: string;
      amount: Prisma.Decimal;
      currency: string;
      status?: string;
      incomeDate?: Date;
      source?: string;
      transactionId?: string;
      notes?: string;
      recordedBy?: string;
      reference?: string;
      paymentMethod?: string;
      eventId?: string;
    } = {
      category: data.category,
      description: data.description,
      amount: new Prisma.Decimal(data.amount),
      currency: data.currency || 'KES',
      source: data.source,
      reference: data.reference,
      paymentMethod: data.paymentMethod,
      eventId: data.eventId,
      transactionId: data.transactionId,
      notes: data.notes,
      recordedBy: data.createdBy,
      status: 'COMPLETED',
    };

    const income = await prisma.platformIncome.create({
      data: incomeData,
    });

    logger.info(`Created platform income: ${income.id}`);
    return income;
  }

  static async updateIncome(id: string, data: {
    category?: string;
    description?: string;
    amount?: number;
    currency?: string;
    source?: string;
    reference?: string;
    paymentMethod?: string;
    eventId?: string;
    notes?: string;
    status?: string;
  }) {
    const existing = await prisma.platformIncome.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Income not found');
    }

    const updateData: Partial<{
      category: string;
      description: string;
      amount: Prisma.Decimal;
      currency: string;
      status: string;
      incomeDate: Date;
      source: string;
      transactionId: string;
      notes: string;
      reference: string;
      paymentMethod: string;
      eventId: string;
    }> = {};

    if (data.category !== undefined) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.amount !== undefined) updateData.amount = new Prisma.Decimal(data.amount);
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.reference !== undefined) updateData.reference = data.reference;
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
    if (data.eventId !== undefined) updateData.eventId = data.eventId;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;

    const income = await prisma.platformIncome.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Updated platform income: ${income.id}`);
    return income;
  }

  static async deleteIncome(id: string) {
    const existing = await prisma.platformIncome.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Income not found');
    }

    await prisma.platformIncome.delete({ where: { id } });
    logger.info(`Deleted platform income: ${id}`);
  }
}

// Wages
export class WageService {
  static async getWages(options?: {
    page?: number;
    limit?: number;
    department?: string;
    status?: string;
    staffType?: string;
    eventId?: string;
    payPeriod?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.WageWhereInput = {};

    if (options?.department) {
      where.department = options.department;
    }

    if (options?.status) {
      where.status = options.status as FinancialEntryStatus;
    }

    if (options?.staffType) {
      where.staffType = options.staffType as StaffPayType;
    }

    if (options?.eventId) {
      where.eventId = options.eventId;
    }

    if (options?.payPeriod) {
      where.payPeriod = options.payPeriod;
    }

    if (options?.startDate || options?.endDate) {
      where.payDate = {};
      if (options.startDate) where.payDate.gte = options.startDate;
      if (options.endDate) where.payDate.lte = options.endDate;
    }

    const [wages, total, aggregate] = await Promise.all([
      prisma.wage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { payDate: 'desc' },
        include: {
          event: { select: { id: true, title: true } },
        },
      }),
      prisma.wage.count({ where }),
      prisma.wage.aggregate({
        where,
        _sum: { amount: true, grossAmount: true },
      }),
    ]);

    return {
      wages,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      totalAmount: Number(aggregate._sum.amount || 0),
      totalGrossAmount: Number(aggregate._sum.grossAmount || 0),
    };
  }

  static async getWageById(id: string) {
    const wage = await prisma.wage.findUnique({
      where: { id },
      include: {
        event: { select: { id: true, title: true } },
      },
    });

    if (!wage) {
      throw new NotFoundError('Wage record not found');
    }

    return wage;
  }

  static async createWage(data: {
    employeeId?: string;
    employeeName: string;
    department?: string;
    position?: string;
    staffType?: StaffPayType;
    grossAmount?: number;
    amount: number;
    currency?: string;
    hoursWorked?: number;
    hourlyRate?: number;
    overtimeHours?: number;
    overtimeRate?: number;
    dailyRate?: number;
    eventDays?: number;
    bonuses?: number;
    deductions?: number;
    payPeriod: string;
    payDate: Date;
    paymentMethod?: PaymentMethodType;
    reference?: string;
    notes?: string;
    eventId?: string;
    createdBy?: string;
  }) {
    const grossAmount = data.grossAmount ?? data.amount;
    const wage = await prisma.wage.create({
      data: {
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        department: data.department,
        position: data.position,
        staffType: data.staffType || 'PERMANENT',
        grossAmount: new Prisma.Decimal(grossAmount),
        amount: new Prisma.Decimal(data.amount),
        currency: data.currency || 'KES',
        hoursWorked: data.hoursWorked !== undefined && data.hoursWorked !== null ? new Prisma.Decimal(data.hoursWorked) : null,
        hourlyRate: data.hourlyRate !== undefined && data.hourlyRate !== null ? new Prisma.Decimal(data.hourlyRate) : null,
        overtimeHours: data.overtimeHours !== undefined && data.overtimeHours !== null ? new Prisma.Decimal(data.overtimeHours) : null,
        overtimeRate: data.overtimeRate !== undefined && data.overtimeRate !== null ? new Prisma.Decimal(data.overtimeRate) : null,
        dailyRate: data.dailyRate !== undefined && data.dailyRate !== null ? new Prisma.Decimal(data.dailyRate) : null,
        eventDays: data.eventDays ?? null,
        bonuses: data.bonuses !== undefined && data.bonuses !== null ? new Prisma.Decimal(data.bonuses) : null,
        deductions: data.deductions !== undefined && data.deductions !== null ? new Prisma.Decimal(data.deductions) : null,
        payPeriod: data.payPeriod,
        payDate: data.payDate,
        paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
        reference: data.reference,
        notes: data.notes,
        eventId: data.eventId || null,
        createdBy: data.createdBy,
        status: 'COMPLETED' as FinancialEntryStatus,
      },
      include: {
        event: { select: { id: true, title: true } },
      },
    });

    logger.info(`Created wage record: ${wage.id}`);
    return wage;
  }

  static async updateWage(id: string, data: {
    employeeId?: string;
    employeeName?: string;
    department?: string;
    position?: string;
    staffType?: StaffPayType;
    grossAmount?: number;
    amount?: number;
    currency?: string;
    hoursWorked?: number | null;
    hourlyRate?: number | null;
    overtimeHours?: number | null;
    overtimeRate?: number | null;
    dailyRate?: number | null;
    eventDays?: number | null;
    bonuses?: number | null;
    deductions?: number | null;
    payPeriod?: string;
    payDate?: Date;
    paymentMethod?: PaymentMethodType;
    reference?: string;
    notes?: string;
    eventId?: string | null;
    status?: FinancialEntryStatus;
  }) {
    const existing = await prisma.wage.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Wage record not found');
    }

    const updateData: Prisma.WageUpdateInput = {};

    if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;
    if (data.employeeName !== undefined) updateData.employeeName = data.employeeName;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.staffType !== undefined) updateData.staffType = data.staffType;
    if (data.grossAmount !== undefined) updateData.grossAmount = new Prisma.Decimal(data.grossAmount);
    if (data.amount !== undefined) updateData.amount = new Prisma.Decimal(data.amount);
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.hoursWorked !== undefined) updateData.hoursWorked = data.hoursWorked !== null ? new Prisma.Decimal(data.hoursWorked) : null;
    if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate !== null ? new Prisma.Decimal(data.hourlyRate) : null;
    if (data.overtimeHours !== undefined) updateData.overtimeHours = data.overtimeHours !== null ? new Prisma.Decimal(data.overtimeHours) : null;
    if (data.overtimeRate !== undefined) updateData.overtimeRate = data.overtimeRate !== null ? new Prisma.Decimal(data.overtimeRate) : null;
    if (data.dailyRate !== undefined) updateData.dailyRate = data.dailyRate !== null ? new Prisma.Decimal(data.dailyRate) : null;
    if (data.eventDays !== undefined) updateData.eventDays = data.eventDays;
    if (data.bonuses !== undefined) updateData.bonuses = data.bonuses !== null ? new Prisma.Decimal(data.bonuses) : null;
    if (data.deductions !== undefined) updateData.deductions = data.deductions !== null ? new Prisma.Decimal(data.deductions) : null;
    if (data.payPeriod !== undefined) updateData.payPeriod = data.payPeriod;
    if (data.payDate !== undefined) updateData.payDate = data.payDate;
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
    if (data.reference !== undefined) updateData.reference = data.reference;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.eventId !== undefined) {
      updateData.event = data.eventId ? { connect: { id: data.eventId } } : { disconnect: true };
    }

    const wage = await prisma.wage.update({
      where: { id },
      data: updateData,
      include: {
        event: { select: { id: true, title: true } },
      },
    });

    logger.info(`Updated wage record: ${wage.id}`);
    return wage;
  }

  static async deleteWage(id: string) {
    const existing = await prisma.wage.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Wage record not found');
    }

    await prisma.wage.delete({ where: { id } });
    logger.info(`Deleted wage record: ${id}`);
  }
}

// Financial Summaries
export class PlatformFinanceSummaryService {
  static async getFinanceSummary(options?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: { createdAt?: { gte?: Date; lte?: Date } } = {};

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const [
      expensesAggregate,
      incomesAggregate,
      wagesAggregate,
      platformFeesAggregate,
    ] = await Promise.all([
      prisma.platformExpense.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.platformIncome.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.wage.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true, grossAmount: true },
        _count: true,
      }),
      // Platform fees = automatic revenue from ticket sales
      prisma.platformFee.aggregate({
        where: { ...where },
        _sum: { feeAmount: true, grossAmount: true, organizerAmount: true },
        _count: true,
      }),
    ]);

    const manualIncome = Number(incomesAggregate._sum.amount || 0);
    const platformFeeIncome = Number(platformFeesAggregate._sum.feeAmount || 0);
    const totalIncome = manualIncome + platformFeeIncome;
    const totalWages = Number(wagesAggregate._sum.amount || 0);
    const totalExpenses = Number(expensesAggregate._sum.amount || 0) + totalWages;
    const netProfit = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      totalWages,
      netProfit,
      expenseCount: expensesAggregate._count,
      incomeCount: incomesAggregate._count,
      wageCount: wagesAggregate._count,
      // Revenue breakdown
      platformFeeRevenue: platformFeeIncome,
      manualIncome,
      totalGrossRevenue: Number(platformFeesAggregate._sum.grossAmount || 0),
      totalOrganizerPayouts: Number(platformFeesAggregate._sum.organizerAmount || 0),
      platformFeeCount: platformFeesAggregate._count,
    };
  }
}
