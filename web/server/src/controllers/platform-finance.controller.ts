import { Request, Response } from 'express';
import {
  PlatformExpenseService,
  PlatformIncomeService,
  WageService,
  PlatformFinanceSummaryService,
} from '../services/platform-finance.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError } from '../utils/errors.js';

export const platformFinanceController = {
  // EXPENSES
  getExpenses: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, category, status, startDate, endDate } = req.query;

    const result = await PlatformExpenseService.getExpenses({
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      category: category as string,
      status: status as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({
      success: true,
      data: result.expenses,
      pagination: {
        page: result.page,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  }),

  getExpenseById: asyncHandler(async (req: Request, res: Response) => {
    const id = (req.params.id as string) as string;
    const expense = await PlatformExpenseService.getExpenseById(id);

    res.json({
      success: true,
      data: expense,
    });
  }),

  createExpense: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { category, description, amount, ...rest } = req.body;

    if (!category || !description || amount === undefined) {
      throw new ValidationError('Category, description, and amount are required');
    }

    const expense = await PlatformExpenseService.createExpense({
      category,
      description,
      amount: parseFloat(amount),
      ...rest,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      data: expense,
      message: 'Expense created successfully',
    });
  }),

  updateExpense: asyncHandler(async (req: Request, res: Response) => {
    const id = (req.params.id as string) as string;
    const data = { ...req.body };

    if (data.amount !== undefined) {
      data.amount = parseFloat(data.amount);
    }

    const expense = await PlatformExpenseService.updateExpense(id, data);

    res.json({
      success: true,
      data: expense,
      message: 'Expense updated successfully',
    });
  }),

  deleteExpense: asyncHandler(async (req: Request, res: Response) => {
    const id = (req.params.id as string) as string;
    await PlatformExpenseService.deleteExpense(id);

    res.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  }),

  // INCOME
  getIncomes: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, category, status, startDate, endDate } = req.query;

    const result = await PlatformIncomeService.getIncomes({
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      category: category as string,
      status: status as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({
      success: true,
      data: result.incomes,
      pagination: {
        page: result.page,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  }),

  getIncomeById: asyncHandler(async (req: Request, res: Response) => {
    const id = (req.params.id as string) as string;
    const income = await PlatformIncomeService.getIncomeById(id);

    res.json({
      success: true,
      data: income,
    });
  }),

  createIncome: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { category, description, amount, ...rest } = req.body;

    if (!category || !description || amount === undefined) {
      throw new ValidationError('Category, description, and amount are required');
    }

    const income = await PlatformIncomeService.createIncome({
      category,
      description,
      amount: parseFloat(amount),
      ...rest,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      data: income,
      message: 'Income created successfully',
    });
  }),

  updateIncome: asyncHandler(async (req: Request, res: Response) => {
    const id = (req.params.id as string) as string;
    const data = { ...req.body };

    if (data.amount !== undefined) {
      data.amount = parseFloat(data.amount);
    }

    const income = await PlatformIncomeService.updateIncome(id, data);

    res.json({
      success: true,
      data: income,
      message: 'Income updated successfully',
    });
  }),

  deleteIncome: asyncHandler(async (req: Request, res: Response) => {
    const id = (req.params.id as string) as string;
    await PlatformIncomeService.deleteIncome(id);

    res.json({
      success: true,
      message: 'Income deleted successfully',
    });
  }),

  // WAGES
  getWages: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, department, status, payPeriod, startDate, endDate } = req.query;

    const result = await WageService.getWages({
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      department: department as string,
      status: status as string,
      payPeriod: payPeriod as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({
      success: true,
      data: result.wages,
      pagination: {
        page: result.page,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  }),

  getWageById: asyncHandler(async (req: Request, res: Response) => {
    const id = (req.params.id as string) as string;
    const wage = await WageService.getWageById(id);

    res.json({
      success: true,
      data: wage,
    });
  }),

  createWage: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { employeeName, amount, payPeriod, payDate, ...rest } = req.body;

    if (!employeeName || amount === undefined || !payPeriod || !payDate) {
      throw new ValidationError('Employee name, amount, pay period, and pay date are required');
    }

    const wage = await WageService.createWage({
      employeeName,
      amount: parseFloat(amount),
      payPeriod,
      payDate: new Date(payDate),
      ...rest,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      data: wage,
      message: 'Wage record created successfully',
    });
  }),

  updateWage: asyncHandler(async (req: Request, res: Response) => {
    const id = (req.params.id as string) as string;
    const data = { ...req.body };

    if (data.amount !== undefined) {
      data.amount = parseFloat(data.amount);
    }
    if (data.payDate !== undefined) {
      data.payDate = new Date(data.payDate);
    }

    const wage = await WageService.updateWage(id, data);

    res.json({
      success: true,
      data: wage,
      message: 'Wage record updated successfully',
    });
  }),

  deleteWage: asyncHandler(async (req: Request, res: Response) => {
    const id = (req.params.id as string) as string;
    await WageService.deleteWage(id);

    res.json({
      success: true,
      message: 'Wage record deleted successfully',
    });
  }),

  // SUMMARY
  getFinanceSummary: asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    const summary = await PlatformFinanceSummaryService.getFinanceSummary({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({
      success: true,
      data: summary,
    });
  }),
};
