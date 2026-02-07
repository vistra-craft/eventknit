import { Response, NextFunction } from 'express';
import { AdminFinancialService } from '../services/admin-financial.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class AdminFinancialController {
  // ========== Platform Expenses ==========

  static async createExpense(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const expense = await AdminFinancialService.createExpense({
        ...req.body,
        recordedBy: req.user?.id,
      });

      res.status(201).json({
        success: true,
        message: 'Expense created successfully',
        data: { expense },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getExpenses(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, status, startDate, endDate, page, limit } = req.query;

      const filters: any = {};
      if (category) filters.category = category as string;
      if (status) filters.status = status as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (page) filters.page = parseInt(page as string, 10);
      if (limit) filters.limit = parseInt(limit as string, 10);

      const result = await AdminFinancialService.getExpenses(filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getExpenseById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = (req.params.id as string) as string;
      const expense = await AdminFinancialService.getExpenseById(id);

      res.status(200).json({
        success: true,
        data: { expense },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateExpense(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = (req.params.id as string) as string;
      const expense = await AdminFinancialService.updateExpense(id, {
        ...req.body,
        approvedBy: req.body.status === 'approved' ? req.user?.id : undefined,
      });

      res.status(200).json({
        success: true,
        message: 'Expense updated successfully',
        data: { expense },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteExpense(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = (req.params.id as string) as string;
      await AdminFinancialService.deleteExpense(id);

      res.status(200).json({
        success: true,
        message: 'Expense deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // ========== Platform Income ==========

  static async createIncome(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const income = await AdminFinancialService.createIncome({
        ...req.body,
        recordedBy: req.user?.id,
      });

      res.status(201).json({
        success: true,
        message: 'Income created successfully',
        data: { income },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getIncomes(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, status, startDate, endDate, page, limit } = req.query;

      const filters: any = {};
      if (category) filters.category = category as string;
      if (status) filters.status = status as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (page) filters.page = parseInt(page as string, 10);
      if (limit) filters.limit = parseInt(limit as string, 10);

      const result = await AdminFinancialService.getIncomes(filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getIncomeById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = (req.params.id as string) as string;
      const income = await AdminFinancialService.getIncomeById(id);

      res.status(200).json({
        success: true,
        data: { income },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateIncome(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = (req.params.id as string) as string;
      const income = await AdminFinancialService.updateIncome(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Income updated successfully',
        data: { income },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteIncome(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = (req.params.id as string) as string;
      await AdminFinancialService.deleteIncome(id);

      res.status(200).json({
        success: true,
        message: 'Income deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // ========== Monthly Summaries ==========

  static async getMonthlySummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { year, month } = req.query;

      if (!year || !month) {
        res.status(400).json({
          success: false,
          message: 'Year and month are required',
        });
        return;
      }

      const summary = await AdminFinancialService.getMonthlySummary(
        parseInt(year as string, 10),
        parseInt(month as string, 10),
      );

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getFinancialOverview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const filters: any = {};
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const overview = await AdminFinancialService.getFinancialOverview(filters);

      res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (error) {
      next(error);
    }
  }
}
