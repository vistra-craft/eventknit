import { apiGet, apiPost, apiPut, apiDelete } from './api';

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

export type StaffPayType = 'PERMANENT' | 'CONTRACT' | 'EVENT';

export interface Wage {
  id: string;
  employeeId: string | null;
  employeeName: string;
  department: string | null;
  position: string | null;
  staffType: StaffPayType;
  grossAmount: string;
  amount: string;
  currency: string;
  hoursWorked: string | null;
  hourlyRate: string | null;
  overtimeHours: string | null;
  overtimeRate: string | null;
  dailyRate: string | null;
  eventDays: number | null;
  bonuses: string | null;
  deductions: string | null;
  payPeriod: string;
  payDate: string;
  status: string;
  paymentMethod: string;
  reference: string | null;
  notes: string | null;
  eventId: string | null;
  event?: { id: string; title: string } | null;
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
  platformFeeRevenue: number;
  manualIncome: number;
  totalGrossRevenue: number;
  totalOrganizerPayouts: number;
  platformFeeCount: number;
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
  return apiGet<PaginatedResponse<PlatformExpense>>(`/admin/platform-finance/expenses${query ? `?${query}` : ''}`);
}

export async function getExpenseById(id: string): Promise<{ success: boolean; data: PlatformExpense }> {
  return apiGet<{ success: boolean; data: PlatformExpense }>(`/admin/platform-finance/expenses/${id}`);
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
  return apiPost<{ success: boolean; data: PlatformExpense; message: string }>('/admin/platform-finance/expenses', data);
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
  return apiPut<{ success: boolean; data: PlatformExpense; message: string }>(`/admin/platform-finance/expenses/${id}`, data);
}

export async function deleteExpense(id: string): Promise<{ success: boolean; message: string }> {
  return apiDelete<{ success: boolean; message: string }>(`/admin/platform-finance/expenses/${id}`);
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
  return apiGet<PaginatedResponse<PlatformIncome>>(`/admin/platform-finance/income${query ? `?${query}` : ''}`);
}

export async function getIncomeById(id: string): Promise<{ success: boolean; data: PlatformIncome }> {
  return apiGet<{ success: boolean; data: PlatformIncome }>(`/admin/platform-finance/income/${id}`);
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
  return apiPost<{ success: boolean; data: PlatformIncome; message: string }>('/admin/platform-finance/income', data);
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
  return apiPut<{ success: boolean; data: PlatformIncome; message: string }>(`/admin/platform-finance/income/${id}`, data);
}

export async function deleteIncome(id: string): Promise<{ success: boolean; message: string }> {
  return apiDelete<{ success: boolean; message: string }>(`/admin/platform-finance/income/${id}`);
}

// WAGES
export async function getWages(options?: {
  page?: number;
  limit?: number;
  department?: string;
  status?: string;
  staffType?: string;
  eventId?: string;
  payPeriod?: string;
  startDate?: string;
  endDate?: string;
}): Promise<PaginatedResponse<Wage> & { totalAmount?: number; totalGrossAmount?: number }> {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.department) params.append('department', options.department);
  if (options?.status) params.append('status', options.status);
  if (options?.staffType) params.append('staffType', options.staffType);
  if (options?.eventId) params.append('eventId', options.eventId);
  if (options?.payPeriod) params.append('payPeriod', options.payPeriod);
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);

  const query = params.toString();
  return apiGet<PaginatedResponse<Wage> & { totalAmount?: number; totalGrossAmount?: number }>(`/admin/platform-finance/wages${query ? `?${query}` : ''}`);
}

export async function getWageById(id: string): Promise<{ success: boolean; data: Wage }> {
  return apiGet<{ success: boolean; data: Wage }>(`/admin/platform-finance/wages/${id}`);
}

export async function createWage(data: {
  employeeId?: string;
  employeeName: string;
  department?: string;
  position?: string;
  staffType?: StaffPayType;
  grossAmount?: number;
  amount: number;
  currency?: string;
  hoursWorked?: number;
  hourlyRate?: number;
  overtimeHours?: number;
  overtimeRate?: number;
  dailyRate?: number;
  eventDays?: number;
  bonuses?: number;
  deductions?: number;
  payPeriod: string;
  payDate: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  eventId?: string;
}): Promise<{ success: boolean; data: Wage; message: string }> {
  return apiPost<{ success: boolean; data: Wage; message: string }>('/admin/platform-finance/wages', data);
}

export async function updateWage(id: string, data: {
  employeeId?: string;
  employeeName?: string;
  department?: string;
  position?: string;
  staffType?: StaffPayType;
  grossAmount?: number;
  amount?: number;
  currency?: string;
  hoursWorked?: number | null;
  hourlyRate?: number | null;
  overtimeHours?: number | null;
  overtimeRate?: number | null;
  dailyRate?: number | null;
  eventDays?: number | null;
  bonuses?: number | null;
  deductions?: number | null;
  payPeriod?: string;
  payDate?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  eventId?: string | null;
  status?: string;
}): Promise<{ success: boolean; data: Wage; message: string }> {
  return apiPut<{ success: boolean; data: Wage; message: string }>(`/admin/platform-finance/wages/${id}`, data);
}

export async function deleteWage(id: string): Promise<{ success: boolean; message: string }> {
  return apiDelete<{ success: boolean; message: string }>(`/admin/platform-finance/wages/${id}`);
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
  return apiGet<{ success: boolean; data: FinanceSummary }>(`/admin/platform-finance/summary${query ? `?${query}` : ''}`);
}
