import Joi from 'joi';

export const createExpenseSchema = Joi.object({
  category: Joi.string().required().messages({
    'any.required': 'Category is required',
  }),
  description: Joi.string().required().messages({
    'any.required': 'Description is required',
  }),
  amount: Joi.number().positive().required().messages({
    'any.required': 'Amount is required',
    'number.positive': 'Amount must be positive',
  }),
  currency: Joi.string().default('NGN'),
  paymentMethod: Joi.string().valid('cash', 'bank_transfer', 'credit_card', 'check').optional(),
  recipient: Joi.string().optional(),
  reference: Joi.string().optional(),
  receiptUrl: Joi.string().uri().optional(),
  receiptDate: Joi.date().optional(),
  taxAmount: Joi.number().min(0).optional(),
  taxRate: Joi.number().min(0).max(100).optional(),
  isTaxDeductible: Joi.boolean().default(false),
  expenseDate: Joi.date().optional(),
});

export const updateExpenseSchema = Joi.object({
  category: Joi.string().optional(),
  description: Joi.string().optional(),
  amount: Joi.number().positive().optional(),
  currency: Joi.string().optional(),
  paymentMethod: Joi.string().valid('cash', 'bank_transfer', 'credit_card', 'check').optional(),
  recipient: Joi.string().optional(),
  reference: Joi.string().optional(),
  receiptUrl: Joi.string().uri().optional(),
  receiptDate: Joi.date().optional(),
  taxAmount: Joi.number().min(0).optional(),
  taxRate: Joi.number().min(0).max(100).optional(),
  isTaxDeductible: Joi.boolean().optional(),
  status: Joi.string().valid('pending', 'approved', 'paid', 'cancelled').optional(),
  expenseDate: Joi.date().optional(),
});

export const createIncomeSchema = Joi.object({
  category: Joi.string().required().messages({
    'any.required': 'Category is required',
  }),
  description: Joi.string().required().messages({
    'any.required': 'Description is required',
  }),
  amount: Joi.number().positive().required().messages({
    'any.required': 'Amount is required',
    'number.positive': 'Amount must be positive',
  }),
  currency: Joi.string().default('NGN'),
  source: Joi.string().optional(),
  reference: Joi.string().optional(),
  paymentMethod: Joi.string().optional(),
  eventId: Joi.string().uuid().optional(),
  transactionId: Joi.string().optional(),
  taxAmount: Joi.number().min(0).optional(),
  taxRate: Joi.number().min(0).max(100).optional(),
  incomeDate: Joi.date().optional(),
});

export const updateIncomeSchema = Joi.object({
  category: Joi.string().optional(),
  description: Joi.string().optional(),
  amount: Joi.number().positive().optional(),
  currency: Joi.string().optional(),
  source: Joi.string().optional(),
  reference: Joi.string().optional(),
  paymentMethod: Joi.string().optional(),
  eventId: Joi.string().uuid().optional(),
  transactionId: Joi.string().optional(),
  taxAmount: Joi.number().min(0).optional(),
  taxRate: Joi.number().min(0).max(100).optional(),
  status: Joi.string().valid('received', 'pending', 'cancelled').optional(),
  incomeDate: Joi.date().optional(),
});

export const getMonthlySummarySchema = Joi.object({
  year: Joi.number().integer().min(2000).max(2100).required(),
  month: Joi.number().integer().min(1).max(12).required(),
});

export const getFinancialOverviewSchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
});
