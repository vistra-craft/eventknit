import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export class OrganizerFinancialService {
  /**
   * Create expense
   */
  static async createExpense(organizerId: string, data: {
    eventId?: string;
    category: string;
    description: string;
    amount: number;
    currency?: string;
    receiptUrl?: string;
    receiptDate?: Date;
    taxAmount?: number;
    taxRate?: number;
    isTaxDeductible?: boolean;
    expenseDate?: Date;
  }) {
    try {
      // Verify event belongs to organizer if eventId provided
      if (data.eventId) {
        const event = await prisma.event.findFirst({
          where: {
            id: data.eventId,
            organizerId,
            deletedAt: null,
          },
        });

        if (!event) {
          throw new NotFoundError('Event not found');
        }
      }

      const expense = await prisma.eventExpense.create({
        data: {
          organizerId,
          eventId: data.eventId,
          category: data.category,
          description: data.description,
          amount: data.amount,
          currency: data.currency || 'NGN',
          receiptUrl: data.receiptUrl,
          receiptDate: data.receiptDate,
          taxAmount: data.taxAmount,
          taxRate: data.taxRate,
          isTaxDeductible: data.isTaxDeductible || false,
          expenseDate: data.expenseDate || new Date(),
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      return expense;
    } catch (error) {
      logger.error('Error creating expense:', error);
      throw error;
    }
  }

  /**
   * Get organizer expenses
   */
  static async getExpenses(organizerId: string, filters?: {
    page?: number;
    limit?: number;
    eventId?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
  }) {
    try {
      const limit = filters?.limit || 20;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const where: any = {
        organizerId,
      };

      if (filters?.eventId) {
        where.eventId = filters.eventId;
      }

      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.startDate || filters?.endDate) {
        where.expenseDate = {};
        if (filters.startDate) {
          where.expenseDate.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.expenseDate.lte = filters.endDate;
        }
      }

      const [expenses, total] = await Promise.all([
        prisma.eventExpense.findMany({
          where,
          include: {
            event: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { expenseDate: 'desc' },
          take: limit,
          skip,
        }),
        prisma.eventExpense.count({ where }),
      ]);

      return {
        expenses,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      };
    } catch (error) {
      logger.error('Error getting expenses:', error);
      throw error;
    }
  }

  /**
   * Get profit/loss statement
   */
  static async getProfitLossStatement(organizerId: string, filters?: {
    eventId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const where: any = {
        organizerId,
      };

      if (filters?.eventId) {
        where.eventId = filters.eventId;
      }

      // Get revenue
      const revenueTransactions = await prisma.eventPaymentTransaction.findMany({
        where: {
          event: {
            organizerId,
            ...(filters?.eventId && { id: filters.eventId }),
            deletedAt: null,
          },
          paymentStatus: 'success',
          paymentDate: {
            gte: filters?.startDate,
            lte: filters?.endDate,
          },
        },
        include: {
          platformFee: true,
        },
      });

      const grossRevenue = revenueTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );
      const platformFees = revenueTransactions.reduce(
        (sum, t) => sum + (t.platformFee ? Number(t.platformFee.feeAmount) : 0),
        0
      );
      const netRevenue = grossRevenue - platformFees;

      // Get expenses
      const expenseWhere: any = {
        organizerId,
        ...(filters?.eventId && { eventId: filters.eventId }),
        expenseDate: {
          gte: filters?.startDate,
          lte: filters?.endDate,
        },
        status: {
          in: ['approved', 'paid'],
        },
      };

      const expenses = await prisma.eventExpense.findMany({
        where: expenseWhere,
      });

      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const taxDeductibleExpenses = expenses
        .filter(e => e.isTaxDeductible)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      // Expenses by category
      const expensesByCategory = expenses.reduce((acc: any, expense) => {
        if (!acc[expense.category]) {
          acc[expense.category] = {
            category: expense.category,
            amount: 0,
            count: 0,
          };
        }
        acc[expense.category].amount += Number(expense.amount);
        acc[expense.category].count++;
        return acc;
      }, {});

      // Calculate profit/loss
      const profit = netRevenue - totalExpenses;
      const profitMargin = netRevenue > 0 ? (profit / netRevenue) * 100 : 0;

      return {
        period: {
          startDate: filters?.startDate,
          endDate: filters?.endDate,
        },
        revenue: {
          gross: grossRevenue,
          platformFees,
          net: netRevenue,
        },
        expenses: {
          total: totalExpenses,
          taxDeductible: taxDeductibleExpenses,
          byCategory: Object.values(expensesByCategory),
        },
        profit: {
          amount: profit,
          margin: profitMargin,
        },
        summary: {
          totalTransactions: revenueTransactions.length,
          totalExpenses: expenses.length,
        },
      };
    } catch (error) {
      logger.error('Error getting profit/loss statement:', error);
      throw error;
    }
  }

  /**
   * Create financial goal
   */
  static async createFinancialGoal(organizerId: string, data: {
    name: string;
    description?: string;
    targetAmount: number;
    currency?: string;
    eventId?: string;
    startDate: Date;
    endDate: Date;
  }) {
    try {
      if (data.eventId) {
        const event = await prisma.event.findFirst({
          where: {
            id: data.eventId,
            organizerId,
            deletedAt: null,
          },
        });

        if (!event) {
          throw new NotFoundError('Event not found');
        }
      }

      if (data.endDate <= data.startDate) {
        throw new ValidationError('End date must be after start date');
      }

      const goal = await prisma.financialGoal.create({
        data: {
          organizerId,
          eventId: data.eventId,
          name: data.name,
          description: data.description,
          targetAmount: data.targetAmount,
          currency: data.currency || 'NGN',
          startDate: data.startDate,
          endDate: data.endDate,
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      return goal;
    } catch (error) {
      logger.error('Error creating financial goal:', error);
      throw error;
    }
  }

  /**
   * Update financial goal progress
   */
  static async updateGoalProgress(goalId: string, organizerId: string) {
    try {
      const goal = await prisma.financialGoal.findFirst({
        where: {
          id: goalId,
          organizerId,
        },
      });

      if (!goal) {
        throw new NotFoundError('Financial goal not found');
      }

      // Calculate current amount from revenue
      const where: any = {
        event: {
          organizerId,
        },
        paymentStatus: 'success',
      };

      if (goal.eventId) {
        where.eventId = goal.eventId;
      }

      if (goal.startDate && goal.endDate) {
        where.paymentDate = {
          gte: goal.startDate,
          lte: goal.endDate,
        };
      }

      const transactions = await prisma.eventPaymentTransaction.findMany({
        where,
        include: {
          platformFee: true,
        },
      });

      const currentAmount = transactions.reduce((sum, t) => {
        const netAmount = Number(t.amount) - (t.platformFee ? Number(t.platformFee.feeAmount) : 0);
        return sum + netAmount;
      }, 0);

      const progressPercentage = goal.targetAmount > 0
        ? Math.min((currentAmount / Number(goal.targetAmount)) * 100, 100)
        : 0;

      const status = progressPercentage >= 100 ? 'completed' : goal.status;

      const updated = await prisma.financialGoal.update({
        where: { id: goalId },
        data: {
          currentAmount,
          progressPercentage,
          status,
          ...(status === 'completed' && !goal.completedAt && { completedAt: new Date() }),
        },
      });

      return updated;
    } catch (error) {
      logger.error('Error updating goal progress:', error);
      throw error;
    }
  }

  /**
   * Get financial goals
   */
  static async getFinancialGoals(organizerId: string, filters?: {
    eventId?: string;
    status?: string;
  }) {
    try {
      const where: any = {
        organizerId,
      };

      if (filters?.eventId) {
        where.eventId = filters.eventId;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      const goals = await prisma.financialGoal.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { endDate: 'desc' },
      });

      // Update progress for each goal
      const goalsWithProgress = await Promise.all(
        goals.map(async (goal) => {
          const updated = await this.updateGoalProgress(goal.id, organizerId);
          return updated;
        })
      );

      return goalsWithProgress;
    } catch (error) {
      logger.error('Error getting financial goals:', error);
      throw error;
    }
  }

  /**
   * Calculate tax summary
   */
  static async getTaxSummary(organizerId: string, filters?: {
    eventId?: string;
    year?: number;
  }) {
    try {
      const year = filters?.year || new Date().getFullYear();
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);

      // Get revenue
      const transactions = await prisma.eventPaymentTransaction.findMany({
        where: {
          event: {
            organizerId,
            ...(filters?.eventId && { id: filters.eventId }),
            deletedAt: null,
          },
          paymentStatus: 'success',
          paymentDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          platformFee: true,
        },
      });

      const grossRevenue = transactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );
      const platformFees = transactions.reduce(
        (sum, t) => sum + (t.platformFee ? Number(t.platformFee.feeAmount) : 0),
        0
      );
      const netRevenue = grossRevenue - platformFees;

      // Get tax-deductible expenses
      const expenses = await prisma.eventExpense.findMany({
        where: {
          organizerId,
          ...(filters?.eventId && { eventId: filters.eventId }),
          isTaxDeductible: true,
          expenseDate: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            in: ['approved', 'paid'],
          },
        },
      });

      const taxDeductibleExpenses = expenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0
      );

      const taxableIncome = netRevenue - taxDeductibleExpenses;

      return {
        year,
        revenue: {
          gross: grossRevenue,
          platformFees,
          net: netRevenue,
        },
        expenses: {
          taxDeductible: taxDeductibleExpenses,
          total: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
        },
        taxableIncome,
        summary: {
          totalTransactions: transactions.length,
          totalExpenses: expenses.length,
        },
      };
    } catch (error) {
      logger.error('Error getting tax summary:', error);
      throw error;
    }
  }
}
