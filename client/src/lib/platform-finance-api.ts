import { api } from './api';

// Types
export interface PlatformExpense {
  id: string;
  category: string;
  description: string;
  amount: string;
  currency: string;
  paymentMethod: string | null;
  recipient: string | null;
  reference: string | null;
  receiptUrl: string | null;
  receiptDate: string | null;
  taxAmount: string | null;
  taxRate: string | null;
  notes: string | null;
  status: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformIncome {
  id: string;
  category: string;
  description: string;
  amount: string;
  currency: string;
  source: string | null;
  reference: string | null;
  paymentMethod: string | null;
  eventId: string | null;
  transactionId: string | null;
  notes: string | null;
  status: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  event?: {
    id: string;
    title: string;
  } | null;
}

export interface Wage {
  id: string;
  employeeId: string | null;
  employeeName: string;
  department: string | null;
  position: string | null;
  amount: string;
  currency: string;
  payPeriod: string;
  payDate: string;
  status: string;
  paymentMethod: string;
  reference: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  totalWages: number;
  netProfit: number;
  expenseCount: number;
  incomeCount: number;
  wageCount: number;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    total: number;
    totalPages: number;
  };
}

// EXPENSES
export async function getExpenses(options?: {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<PaginatedResponse<PlatformExpense>> {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.category) params.append('category', options.category);
  if (options?.status) params.append('status', options.status);
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);

  const query = params.toString();
  const response = await api.get(`/admin/platform-finance/expenses${query ? `?${query}` : ''}`);
  return response.data;
}

export async function getExpenseById(id: string): Promise<{ success: boolean; data: PlatformExpense }> {
  const response = await api.get(`/admin/platform-finance/expenses/${id}`);
  return response.data;
}

export async function createExpense(data: {
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
  notes?: string;
}): Promise<{ success: boolean; data: PlatformExpense; message: string }> {
  const response = await api.post('/admin/platform-finance/expenses', data);
  return response.data;
}

export async function updateExpense(id: string, data: {
  category?: string;
  description?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  recipient?: string;
  reference?: string;
  receiptUrl?: string;
  receiptDate?: string;
  taxAmount?: number;
  taxRate?: number;
  notes?: string;
  status?: string;
}): Promise<{ success: boolean; data: PlatformExpense; message: string }> {
  const response = await api.put(`/admin/platform-finance/expenses/${id}`, data);
  return response.data;
}

export async function deleteExpense(id: string): Promise<{ success: boolean; message: string }> {
  const response = await api.delete(`/admin/platform-finance/expenses/${id}`);
  return response.data;
}

// INCOME
export async function getIncomes(options?: {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<PaginatedResponse<PlatformIncome>> {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.category) params.append('category', options.category);
  if (options?.status) params.append('status', options.status);
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);

  const query = params.toString();
  const response = await api.get(`/admin/platform-finance/income${query ? `?${query}` : ''}`);
  return response.data;
}

export async function getIncomeById(id: string): Promise<{ success: boolean; data: PlatformIncome }> {
  const response = await api.get(`/admin/platform-finance/income/${id}`);
  return response.data;
}

export async function createIncome(data: {
  category: string;
  description: string;
  amount: number;
  currency?: string;
  source?: string;
  reference?: string;
  paymentMethod?: string;
  eventId?: string;
  notes?: string;
}): Promise<{ success: boolean; data: PlatformIncome; message: string }> {
  const response = await api.post('/admin/platform-finance/income', data);
  return response.data;
}

export async function updateIncome(id: string, data: {
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
}): Promise<{ success: boolean; data: PlatformIncome; message: string }> {
  const response = await api.put(`/admin/platform-finance/income/${id}`, data);
  return response.data;
}

export async function deleteIncome(id: string): Promise<{ success: boolean; message: string }> {
  const response = await api.delete(`/admin/platform-finance/income/${id}`);
  return response.data;
}

// WAGES
export async function getWages(options?: {
  page?: number;
  limit?: number;
  department?: string;
  status?: string;
  payPeriod?: string;
  startDate?: string;
  endDate?: string;
}): Promise<PaginatedResponse<Wage>> {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.department) params.append('department', options.department);
  if (options?.status) params.append('status', options.status);
  if (options?.payPeriod) params.append('payPeriod', options.payPeriod);
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);

  const query = params.toString();
  const response = await api.get(`/admin/platform-finance/wages${query ? `?${query}` : ''}`);
  return response.data;
}

export async function getWageById(id: string): Promise<{ success: boolean; data: Wage }> {
  const response = await api.get(`/admin/platform-finance/wages/${id}`);
  return response.data;
}

export async function createWage(data: {
  employeeId?: string;
  employeeName: string;
  department?: string;
  position?: string;
  amount: number;
  currency?: string;
  payPeriod: string;
  payDate: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
}): Promise<{ success: boolean; data: Wage; message: string }> {
  const response = await api.post('/admin/platform-finance/wages', data);
  return response.data;
}

export async function updateWage(id: string, data: {
  employeeId?: string;
  employeeName?: string;
  department?: string;
  position?: string;
  amount?: number;
  currency?: string;
  payPeriod?: string;
  payDate?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  status?: string;
}): Promise<{ success: boolean; data: Wage; message: string }> {
  const response = await api.put(`/admin/platform-finance/wages/${id}`, data);
  return response.data;
}

export async function deleteWage(id: string): Promise<{ success: boolean; message: string }> {
  const response = await api.delete(`/admin/platform-finance/wages/${id}`);
  return response.data;
}

// SUMMARY
export async function getFinanceSummary(options?: {
  startDate?: string;
  endDate?: string;
}): Promise<{ success: boolean; data: FinanceSummary }> {
  const params = new URLSearchParams();
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);

  const query = params.toString();
  const response = await api.get(`/admin/platform-finance/summary${query ? `?${query}` : ''}`);
  return response.data;
}
