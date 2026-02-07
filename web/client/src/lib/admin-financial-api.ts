import apiClient from './api-client';
import type { ApiResponse } from './api';

const BASE_URL = '/api/v1/admin/financial';

// ========== Platform Expenses ==========

export interface CreateExpenseData {
  category: string;
  description: string;
  amount: number;
  currency?: string;
  paymentMethod?: 'cash' | 'bank_transfer' | 'credit_card' | 'check';
  recipient?: string;
  reference?: string;
  receiptUrl?: string;
  receiptDate?: string;
  taxAmount?: number;
  taxRate?: number;
  isTaxDeductible?: boolean;
  expenseDate?: string;
}

export interface UpdateExpenseData {
  category?: string;
  description?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: 'cash' | 'bank_transfer' | 'credit_card' | 'check';
  recipient?: string;
  reference?: string;
  receiptUrl?: string;
  receiptDate?: string;
  taxAmount?: number;
  taxRate?: number;
  isTaxDeductible?: boolean;
  status?: 'pending' | 'approved' | 'paid' | 'cancelled';
  expenseDate?: string;
}

export interface Expense {
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
  isTaxDeductible: boolean;
  status: string;
  expenseDate: string;
  recordedBy?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export const createExpense = async (data: CreateExpenseData): Promise<ApiResponse<Expense>> => {
  return apiClient.post<ApiResponse<Expense>>(`${BASE_URL}/expenses`, data);
};

export const getExpenses = async (filters?: {
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ expenses: Expense[]; total?: number }>> => {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.page !== undefined) params.append('page', filters.page.toString());
  if (filters?.limit !== undefined) params.append('limit', filters.limit.toString());
  const qs = params.toString();
  return apiClient.get<ApiResponse<{ expenses: Expense[]; total?: number }>>(
    `${BASE_URL}/expenses${qs ? `?${qs}` : ''}`,
  );
};

export const getExpenseById = async (id: string): Promise<ApiResponse<Expense>> => {
  return apiClient.get<ApiResponse<Expense>>(`${BASE_URL}/expenses/${id}`);
};

export const updateExpense = async (id: string, data: UpdateExpenseData): Promise<ApiResponse<Expense>> => {
  return apiClient.put<ApiResponse<Expense>>(`${BASE_URL}/expenses/${id}`, data);
};

export const deleteExpense = async (id: string): Promise<ApiResponse<void>> => {
  return apiClient.delete<ApiResponse<void>>(`${BASE_URL}/expenses/${id}`);
};

// ========== Platform Income ==========

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

export interface UpdateIncomeData {
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
  status?: 'received' | 'pending' | 'cancelled';
  incomeDate?: string;
}

export interface Income {
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
  status: string;
  incomeDate: string;
  recordedBy?: string;
  createdAt: string;
  updatedAt: string;
  event?: {
    id: string;
    title: string;
  };
}

export const createIncome = async (data: CreateIncomeData): Promise<ApiResponse<Income>> => {
  return apiClient.post<ApiResponse<Income>>(`${BASE_URL}/incomes`, data);
};

export const getIncomes = async (filters?: {
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ incomes: Income[]; total?: number }>> => {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.page !== undefined) params.append('page', filters.page.toString());
  if (filters?.limit !== undefined) params.append('limit', filters.limit.toString());
  const qs = params.toString();
  return apiClient.get<ApiResponse<{ incomes: Income[]; total?: number }>>(
    `${BASE_URL}/incomes${qs ? `?${qs}` : ''}`,
  );
};

export const getIncomeById = async (id: string): Promise<ApiResponse<Income>> => {
  return apiClient.get<ApiResponse<Income>>(`${BASE_URL}/incomes/${id}`);
};

export const updateIncome = async (id: string, data: UpdateIncomeData): Promise<ApiResponse<Income>> => {
  return apiClient.put<ApiResponse<Income>>(`${BASE_URL}/incomes/${id}`, data);
};

export const deleteIncome = async (id: string): Promise<ApiResponse<void>> => {
  return apiClient.delete<ApiResponse<void>>(`${BASE_URL}/incomes/${id}`);
};

// ========== Monthly Summaries ==========

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

export const getMonthlySummary = async (year: number, month: number): Promise<ApiResponse<MonthlySummary>> => {
  const params = new URLSearchParams();
  params.append('year', year.toString());
  params.append('month', month.toString());
  return apiClient.get<ApiResponse<MonthlySummary>>(
    `${BASE_URL}/monthly-summary?${params.toString()}`,
  );
};

// ========== Financial Overview ==========

export interface FinancialOverview {
  totalExpenses: number;
  totalIncome: number;
  netProfit: number;
  expenseCount: number;
  incomeCount: number;
}

export const getFinancialOverview = async (filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<FinancialOverview>> => {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  const qs = params.toString();
  return apiClient.get<ApiResponse<FinancialOverview>>(
    `${BASE_URL}/overview${qs ? `?${qs}` : ''}`,
  );
};
