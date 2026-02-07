/**
 * Accounting API Functions
 * Handles general accounting: expenses, incomes, and wages
 * (separate from payment gateway transactions in financial-api.ts)
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';
import type { ApiResponse } from './api';

// ==================== Types ====================

export type FinancialEntryStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethodType = 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CHECK' | 'MOBILE_MONEY' | 'MPESA' | 'OTHER';

export interface PlatformExpense {
  id: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  recipient?: string;
  reference?: string;
  receiptUrl?: string;
  receiptDate?: string;
  taxAmount?: number;
  taxRate?: number;
  isTaxDeductible?: boolean;
  expenseDate: string;
  status: string;
  recordedBy?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformIncome {
  id: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  source?: string;
  reference?: string;
  paymentMethod?: string;
  eventId?: string;
  transactionId?: string;
  taxAmount?: number;
  taxRate?: number;
  incomeDate: string;
  status: string;
  recordedBy?: string;
  createdAt: string;
  updatedAt: string;
  event?: {
    id: string;
    title: string;
  };
}

// Unified transaction type for dashboard display
export interface AccountingTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  source?: string;
  recipient?: string;
  status: string;
  paymentMethod?: string;
  reference?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ==================== Expenses ====================

export interface CreateExpenseData {
  category: string;
  description: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  recipient?: string;
  reference?: string;
  receiptUrl?: string;
  receiptDate?: string;
  taxAmount?: number;
  taxRate?: number;
  isTaxDeductible?: boolean;
  expenseDate?: string;
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {
  status?: string;
  approvedBy?: string;
}

export interface ExpensesResponse {
  items: PlatformExpense[];
  expenses: PlatformExpense[];
  total: number;
  totalAmount: number;
  pagination: PaginationInfo;
}

/**
 * Create a new expense
 */
export const createExpense = async (
  data: CreateExpenseData
): Promise<ApiResponse<PlatformExpense>> => {
  return apiPost<ApiResponse<PlatformExpense>>('/admin/financial/expenses', data);
};

/**
 * Get all expenses with optional filters
 */
export const getExpenses = async (params?: {
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<ExpensesResponse>> => {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append('category', params.category);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const query = queryParams.toString();
  return apiGet<ApiResponse<ExpensesResponse>>(
    `/admin/financial/expenses${query ? `?${query}` : ''}`
  );
};

/**
 * Get expense by ID
 */
export const getExpenseById = async (id: string): Promise<ApiResponse<PlatformExpense>> => {
  return apiGet<ApiResponse<PlatformExpense>>(`/admin/financial/expenses/${id}`);
};

/**
 * Update an expense
 */
export const updateExpense = async (
  id: string,
  data: UpdateExpenseData
): Promise<ApiResponse<PlatformExpense>> => {
  return apiPut<ApiResponse<PlatformExpense>>(`/admin/financial/expenses/${id}`, data);
};

/**
 * Delete an expense
 */
export const deleteExpense = async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete<ApiResponse<{ success: boolean }>>(`/admin/financial/expenses/${id}`);
};

// ==================== Incomes ====================

export interface CreateIncomeData {
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
  incomeDate?: string;
}

export interface UpdateIncomeData extends Partial<CreateIncomeData> {
  status?: string;
}

export interface IncomesResponse {
  incomes: PlatformIncome[];
  pagination: PaginationInfo;
}

/**
 * Create a new income entry
 */
export const createIncome = async (
  data: CreateIncomeData
): Promise<ApiResponse<PlatformIncome>> => {
  return apiPost<ApiResponse<PlatformIncome>>('/admin/financial/incomes', data);
};

/**
 * Get all incomes with optional filters
 */
export const getIncomes = async (params?: {
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<IncomesResponse>> => {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append('category', params.category);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const query = queryParams.toString();
  return apiGet<ApiResponse<IncomesResponse>>(
    `/admin/financial/incomes${query ? `?${query}` : ''}`
  );
};

/**
 * Get income by ID
 */
export const getIncomeById = async (id: string): Promise<ApiResponse<PlatformIncome>> => {
  return apiGet<ApiResponse<PlatformIncome>>(`/admin/financial/incomes/${id}`);
};

/**
 * Update an income entry
 */
export const updateIncome = async (
  id: string,
  data: UpdateIncomeData
): Promise<ApiResponse<PlatformIncome>> => {
  return apiPut<ApiResponse<PlatformIncome>>(`/admin/financial/incomes/${id}`, data);
};

/**
 * Delete an income entry
 */
export const deleteIncome = async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete<ApiResponse<{ success: boolean }>>(`/admin/financial/incomes/${id}`);
};

// ==================== Financial Summary ====================

export interface MonthlySummary {
  period: {
    year: number;
    month: number;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalExpenses: number;
    totalIncome: number;
    netProfit: number;
  };
  expensesByCategory: Record<string, number>;
  incomesByCategory: Record<string, number>;
  expenses: number;
  incomes: number;
}

export interface FinancialOverview {
  totalExpenses: number;
  totalIncome: number;
  netProfit: number;
  expenseCount: number;
  incomeCount: number;
}

/**
 * Get monthly financial summary
 */
export const getMonthlySummary = async (
  year: number,
  month: number
): Promise<ApiResponse<MonthlySummary>> => {
  return apiGet<ApiResponse<MonthlySummary>>(
    `/admin/financial/monthly-summary?year=${year}&month=${month}`
  );
};

/**
 * Get financial overview with optional date range
 */
export const getFinancialOverview = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<FinancialOverview>> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const query = queryParams.toString();
  return apiGet<ApiResponse<FinancialOverview>>(
    `/admin/financial/overview${query ? `?${query}` : ''}`
  );
};

// ==================== Combined Transactions ====================

/**
 * Get combined transactions (incomes + expenses) for dashboard view
 */
export const getCombinedTransactions = async (params?: {
  type?: 'income' | 'expense';
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<ApiResponse<{
  transactions: AccountingTransaction[];
  summary: FinancialOverview;
}>> => {
  // Fetch both incomes and expenses
  const [expensesRes, incomesRes] = await Promise.all([
    getExpenses({
      category: params?.type === 'income' ? undefined : params?.category,
      status: params?.status,
      startDate: params?.startDate,
      endDate: params?.endDate,
      limit: params?.limit || 100,
    }),
    getIncomes({
      category: params?.type === 'expense' ? undefined : params?.category,
      status: params?.status,
      startDate: params?.startDate,
      endDate: params?.endDate,
      limit: params?.limit || 100,
    }),
  ]);

  const transactions: AccountingTransaction[] = [];

  // Convert expenses to unified format
  if (expensesRes.success && expensesRes.data) {
    const expenses = expensesRes.data.expenses || expensesRes.data.items || [];
    expenses.forEach((e) => {
      if (params?.type && params.type !== 'expense') return;
      transactions.push({
        id: e.id,
        type: 'expense',
        category: e.category,
        description: e.description,
        amount: Number(e.amount),
        currency: e.currency,
        date: e.expenseDate,
        recipient: e.recipient,
        status: e.status,
        paymentMethod: e.paymentMethod,
        reference: e.reference,
      });
    });
  }

  // Convert incomes to unified format
  if (incomesRes.success && incomesRes.data) {
    const incomes = incomesRes.data.incomes || [];
    incomes.forEach((i) => {
      if (params?.type && params.type !== 'income') return;
      transactions.push({
        id: i.id,
        type: 'income',
        category: i.category,
        description: i.description,
        amount: Number(i.amount),
        currency: i.currency,
        date: i.incomeDate,
        source: i.source,
        status: i.status,
        paymentMethod: i.paymentMethod,
        reference: i.reference,
      });
    });
  }

  // Sort by date descending
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate summary
  const completedIncomes = transactions.filter(t => t.type === 'income' && t.status !== 'cancelled');
  const completedExpenses = transactions.filter(t => t.type === 'expense' && t.status !== 'cancelled');

  const totalIncome = completedIncomes.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = completedExpenses.reduce((sum, t) => sum + t.amount, 0);

  return {
    success: true,
    data: {
      transactions,
      summary: {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        incomeCount: completedIncomes.length,
        expenseCount: completedExpenses.length,
      },
    },
    message: 'Transactions fetched successfully',
  };
};

// ==================== Wages (Expense Category Filter) ====================

/**
 * Get wages (expenses with category "Wages" or "Salary")
 */
export const getWages = async (params?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<ExpensesResponse>> => {
  return getExpenses({
    ...params,
    category: 'Wages',
  });
};

/**
 * Create a wage entry
 */
export const createWage = async (data: {
  description: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  recipient: string;
  reference?: string;
  expenseDate?: string;
}): Promise<ApiResponse<PlatformExpense>> => {
  return createExpense({
    ...data,
    category: 'Wages',
  });
};
