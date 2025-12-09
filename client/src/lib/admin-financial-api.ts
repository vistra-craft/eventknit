import apiClient from './api-client';

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

export const createExpense = async (data: CreateExpenseData) => {
  const response = await apiClient.post(`${BASE_URL}/expenses`, data);
  return response.data;
};

export const getExpenses = async (filters?: {
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await apiClient.get(`${BASE_URL}/expenses`, { params: filters });
  return response.data;
};

export const getExpenseById = async (id: string) => {
  const response = await apiClient.get(`${BASE_URL}/expenses/${id}`);
  return response.data;
};

export const updateExpense = async (id: string, data: UpdateExpenseData) => {
  const response = await apiClient.put(`${BASE_URL}/expenses/${id}`, data);
  return response.data;
};

export const deleteExpense = async (id: string) => {
  const response = await apiClient.delete(`${BASE_URL}/expenses/${id}`);
  return response.data;
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

export const createIncome = async (data: CreateIncomeData) => {
  const response = await apiClient.post(`${BASE_URL}/incomes`, data);
  return response.data;
};

export const getIncomes = async (filters?: {
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await apiClient.get(`${BASE_URL}/incomes`, { params: filters });
  return response.data;
};

export const getIncomeById = async (id: string) => {
  const response = await apiClient.get(`${BASE_URL}/incomes/${id}`);
  return response.data;
};

export const updateIncome = async (id: string, data: UpdateIncomeData) => {
  const response = await apiClient.put(`${BASE_URL}/incomes/${id}`, data);
  return response.data;
};

export const deleteIncome = async (id: string) => {
  const response = await apiClient.delete(`${BASE_URL}/incomes/${id}`);
  return response.data;
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

export const getMonthlySummary = async (year: number, month: number) => {
  const response = await apiClient.get(`${BASE_URL}/monthly-summary`, {
    params: { year, month },
  });
  return response.data;
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
}) => {
  const response = await apiClient.get(`${BASE_URL}/overview`, { params: filters });
  return response.data;
};
