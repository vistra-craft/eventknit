import { Router } from 'express';
import { platformFinanceController } from '../controllers/platform-finance.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication and admin access
router.use(authenticate);
router.use(requireMinRole(UserRole.ADMIN));

// Summary
router.get('/summary', platformFinanceController.getFinanceSummary);

// Expenses
router.get('/expenses', platformFinanceController.getExpenses);
router.get('/expenses/:id', platformFinanceController.getExpenseById);
router.post('/expenses', platformFinanceController.createExpense);
router.put('/expenses/:id', platformFinanceController.updateExpense);
router.delete('/expenses/:id', platformFinanceController.deleteExpense);

// Income
router.get('/income', platformFinanceController.getIncomes);
router.get('/income/:id', platformFinanceController.getIncomeById);
router.post('/income', platformFinanceController.createIncome);
router.put('/income/:id', platformFinanceController.updateIncome);
router.delete('/income/:id', platformFinanceController.deleteIncome);

// Wages
router.get('/wages', platformFinanceController.getWages);
router.get('/wages/:id', platformFinanceController.getWageById);
router.post('/wages', platformFinanceController.createWage);
router.put('/wages/:id', platformFinanceController.updateWage);
router.delete('/wages/:id', platformFinanceController.deleteWage);

export default router;
