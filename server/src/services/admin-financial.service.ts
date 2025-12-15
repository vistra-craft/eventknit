import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreatePlatformExpenseData {
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
  isTaxDeductible?: boolean;
  expenseDate?: Date;
  recordedBy?: string;
}

export interface UpdatePlatformExpenseData {
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
  isTaxDeductible?: boolean;
  status?: string;
  expenseDate?: Date;
  approvedBy?: string;
}

export interface CreatePlatformIncomeData {
  category: string;
  description: string;
  amount: number;
  currency?: string;
  source?: string;
  reference?: string;
  paymentMethod?: string;
  eventId?: string;
  transactionId?: string;
  taxAmount?: number;
  taxRate?: number;
  incomeDate?: Date;
  recordedBy?: string;
}

export interface UpdatePlatformIncomeData {
  category?: string;
  description?: string;
  amount?: number;
  currency?: string;
  source?: string;
  reference?: string;
  paymentMethod?: string;
  eventId?: string;
  transactionId?: string;
  taxAmount?: number;
  taxRate?: number;
  status?: string;
  incomeDate?: Date;
}

export class AdminFinancialService {
  // ========== Platform Expenses ==========

  static async createExpense(data: CreatePlatformExpenseData) {
    try {
      const expense = await prisma.platformExpense.create({
        data: {
          category: data.category,
          description: data.description,
          amount: new Decimal(data.amount),
          currency: data.currency || 'NGN',
          paymentMethod: data.paymentMethod,
          recipient: data.recipient,
          reference: data.reference,
          receiptUrl: data.receiptUrl,
          receiptDate: data.receiptDate,
          taxAmount: data.taxAmount ? new Decimal(data.taxAmount) : null,
          taxRate: data.taxRate ? new Decimal(data.taxRate) : null,
          isTaxDeductible: data.isTaxDeductible || false,
          expenseDate: data.expenseDate || new Date(),
          recordedBy: data.recordedBy,
          status: 'pending',
        },
      });

      logger.info(`Platform expense created: ${expense.id}`);
      return expense;
    } catch (error: any) {
      logger.error('Error creating platform expense:', error);
      throw new ValidationError(`Failed to create expense: ${error.message}`);
    }
  }

  static async getExpenses(filters?: {
    category?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (filters?.category) where.category = filters.category;
      if (filters?.status) where.status = filters.status;
      if (filters?.startDate || filters?.endDate) {
        where.expenseDate = {};
        if (filters.startDate) where.expenseDate.gte = filters.startDate;
        if (filters.endDate) where.expenseDate.lte = filters.endDate;
      }

      const [expenses, total, aggregate] = await Promise.all([
        prisma.platformExpense.findMany({
          where,
          orderBy: { expenseDate: 'desc' },
          skip,
          take: limit,
        }),
        prisma.platformExpense.count({ where }),
        prisma.platformExpense.aggregate({
          where,
          _sum: { amount: true },
        }),
      ]);

      const totalAmount = Number(aggregate._sum.amount || 0);

      // Backward-compatible shape plus richer pagination metadata
      return {
        // Legacy-style fields expected by tests and callers
        items: expenses,
        total,
        totalAmount,
        // Newer structured fields for pagination-aware consumers
        expenses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Error fetching platform expenses:', error);
      throw new ValidationError(`Failed to fetch expenses: ${error.message}`);
    }
  }

  static async getExpenseById(id: string) {
    try {
      const expense = await prisma.platformExpense.findUnique({
        where: { id },
      });

      if (!expense) {
        throw new NotFoundError('Expense not found');
      }

      return expense;
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error fetching expense:', error);
      throw new ValidationError(`Failed to fetch expense: ${error.message}`);
    }
  }

  static async updateExpense(id: string, data: UpdatePlatformExpenseData) {
    try {
      const existingExpense = await prisma.platformExpense.findUnique({
        where: { id },
      });

      if (!existingExpense) {
        throw new NotFoundError('Expense not found');
      }

      const updateData: any = {};
      if (data.category !== undefined) updateData.category = data.category;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.amount !== undefined) updateData.amount = new Decimal(data.amount);
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
      if (data.recipient !== undefined) updateData.recipient = data.recipient;
      if (data.reference !== undefined) updateData.reference = data.reference;
      if (data.receiptUrl !== undefined) updateData.receiptUrl = data.receiptUrl;
      if (data.receiptDate !== undefined) updateData.receiptDate = data.receiptDate;
      if (data.taxAmount !== undefined) updateData.taxAmount = data.taxAmount ? new Decimal(data.taxAmount) : null;
      if (data.taxRate !== undefined) updateData.taxRate = data.taxRate ? new Decimal(data.taxRate) : null;
      if (data.isTaxDeductible !== undefined) updateData.isTaxDeductible = data.isTaxDeductible;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.expenseDate !== undefined) updateData.expenseDate = data.expenseDate;
      if (data.approvedBy !== undefined) updateData.approvedBy = data.approvedBy;

      const expense = await prisma.platformExpense.update({
        where: { id },
        data: updateData,
      });

      logger.info(`Platform expense updated: ${id}`);
      return expense;
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error updating expense:', error);
      throw new ValidationError(`Failed to update expense: ${error.message}`);
    }
  }

  static async deleteExpense(id: string) {
    try {
      const expense = await prisma.platformExpense.findUnique({
        where: { id },
      });

      if (!expense) {
        throw new NotFoundError('Expense not found');
      }

      await prisma.platformExpense.delete({
        where: { id },
      });

      logger.info(`Platform expense deleted: ${id}`);
      return { success: true };
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error deleting expense:', error);
      throw new ValidationError(`Failed to delete expense: ${error.message}`);
    }
  }

  // ========== Platform Income ==========

  static async createIncome(data: CreatePlatformIncomeData) {
    try {
      const income = await prisma.platformIncome.create({
        data: {
          category: data.category,
          description: data.description,
          amount: new Decimal(data.amount),
          currency: data.currency || 'NGN',
          source: data.source,
          reference: data.reference,
          paymentMethod: data.paymentMethod,
          eventId: data.eventId,
          transactionId: data.transactionId,
          taxAmount: data.taxAmount ? new Decimal(data.taxAmount) : null,
          taxRate: data.taxRate ? new Decimal(data.taxRate) : null,
          incomeDate: data.incomeDate || new Date(),
          recordedBy: data.recordedBy,
          status: 'received',
        },
      });

      logger.info(`Platform income created: ${income.id}`);
      return income;
    } catch (error: any) {
      logger.error('Error creating platform income:', error);
      throw new ValidationError(`Failed to create income: ${error.message}`);
    }
  }

  static async getIncomes(filters?: {
    category?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (filters?.category) where.category = filters.category;
      if (filters?.status) where.status = filters.status;
      if (filters?.startDate || filters?.endDate) {
        where.incomeDate = {};
        if (filters.startDate) where.incomeDate.gte = filters.startDate;
        if (filters.endDate) where.incomeDate.lte = filters.endDate;
      }

      const [incomes, total] = await Promise.all([
        prisma.platformIncome.findMany({
          where,
          include: {
            event: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { incomeDate: 'desc' },
          skip,
          take: limit,
        }),
        prisma.platformIncome.count({ where }),
      ]);

      return {
        incomes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Error fetching platform incomes:', error);
      throw new ValidationError(`Failed to fetch incomes: ${error.message}`);
    }
  }

  static async getIncomeById(id: string) {
    try {
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
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error fetching income:', error);
      throw new ValidationError(`Failed to fetch income: ${error.message}`);
    }
  }

  static async updateIncome(id: string, data: UpdatePlatformIncomeData) {
    try {
      const existingIncome = await prisma.platformIncome.findUnique({
        where: { id },
      });

      if (!existingIncome) {
        throw new NotFoundError('Income not found');
      }

      const updateData: any = {};
      if (data.category !== undefined) updateData.category = data.category;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.amount !== undefined) updateData.amount = new Decimal(data.amount);
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.source !== undefined) updateData.source = data.source;
      if (data.reference !== undefined) updateData.reference = data.reference;
      if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
      if (data.eventId !== undefined) updateData.eventId = data.eventId;
      if (data.transactionId !== undefined) updateData.transactionId = data.transactionId;
      if (data.taxAmount !== undefined) updateData.taxAmount = data.taxAmount ? new Decimal(data.taxAmount) : null;
      if (data.taxRate !== undefined) updateData.taxRate = data.taxRate ? new Decimal(data.taxRate) : null;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.incomeDate !== undefined) updateData.incomeDate = data.incomeDate;

      const income = await prisma.platformIncome.update({
        where: { id },
        data: updateData,
      });

      logger.info(`Platform income updated: ${id}`);
      return income;
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error updating income:', error);
      throw new ValidationError(`Failed to update income: ${error.message}`);
    }
  }

  static async deleteIncome(id: string) {
    try {
      const income = await prisma.platformIncome.findUnique({
        where: { id },
      });

      if (!income) {
        throw new NotFoundError('Income not found');
      }

      await prisma.platformIncome.delete({
        where: { id },
      });

      logger.info(`Platform income deleted: ${id}`);
      return { success: true };
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error deleting income:', error);
      throw new ValidationError(`Failed to delete income: ${error.message}`);
    }
  }

  // ========== Monthly Summaries ==========

  static async getMonthlySummary(year: number, month: number) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      const [expenses, incomes] = await Promise.all([
        prisma.platformExpense.findMany({
          where: {
            expenseDate: {
              gte: startDate,
              lte: endDate,
            },
            status: {
              not: 'cancelled',
            },
          },
        }),
        prisma.platformIncome.findMany({
          where: {
            incomeDate: {
              gte: startDate,
              lte: endDate,
            },
            status: {
              not: 'cancelled',
            },
          },
        }),
      ]);

      // Calculate totals
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
      const netProfit = totalIncome - totalExpenses;

      // Group by category
      const expensesByCategory: Record<string, number> = {};
      expenses.forEach((e) => {
        expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + Number(e.amount);
      });

      const incomesByCategory: Record<string, number> = {};
      incomes.forEach((i) => {
        incomesByCategory[i.category] = (incomesByCategory[i.category] || 0) + Number(i.amount);
      });

      return {
        period: {
          year,
          month,
          startDate,
          endDate,
        },
        summary: {
          totalExpenses,
          totalIncome,
          netProfit,
        },
        expensesByCategory,
        incomesByCategory,
        expenses: expenses.length,
        incomes: incomes.length,
      };
    } catch (error: any) {
      logger.error('Error generating monthly summary:', error);
      throw new ValidationError(`Failed to generate monthly summary: ${error.message}`);
    }
  }

  static async getFinancialOverview(filters?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const whereExpense: any = {
        status: { not: 'cancelled' },
      };
      const whereIncome: any = {
        status: { not: 'cancelled' },
      };

      if (filters?.startDate || filters?.endDate) {
        whereExpense.expenseDate = {};
        whereIncome.incomeDate = {};
        if (filters.startDate) {
          whereExpense.expenseDate.gte = filters.startDate;
          whereIncome.incomeDate.gte = filters.startDate;
        }
        if (filters.endDate) {
          whereExpense.expenseDate.lte = filters.endDate;
          whereIncome.incomeDate.lte = filters.endDate;
        }
      }

      const [expenses, incomes] = await Promise.all([
        prisma.platformExpense.findMany({ where: whereExpense }),
        prisma.platformIncome.findMany({ where: whereIncome }),
      ]);

      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
      const netProfit = totalIncome - totalExpenses;

      return {
        totalExpenses,
        totalIncome,
        netProfit,
        expenseCount: expenses.length,
        incomeCount: incomes.length,
      };
    } catch (error: any) {
      logger.error('Error fetching financial overview:', error);
      throw new ValidationError(`Failed to fetch financial overview: ${error.message}`);
    }
  }
}
