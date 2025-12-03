/**
 * Financial API Functions
 * Handles all API calls related to event payment accounting and financial management
 */

import { apiGet, apiPost } from './api';
import type { ApiResponse } from './api';

// ==================== Types ====================

export interface PaymentTransaction {
  id: string;
  transactionNumber: string;
  paystackReference: string;
  paystackAmount: number;
  currency: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentDate: string | null;
  eventId: string;
  registrationId: string;
  attendeeEmail: string;
  attendeeName: string | null;
  event?: {
    id: string;
    title: string;
    organizer: {
      id: string;
      organizationName: string | null;
    };
  };
  platformFee?: {
    id: string;
    feeAmount: number;
    organizerAmount: number;
    status: string;
  };
}

export interface PlatformFee {
  id: string;
  feeNumber: string;
  transactionId: string;
  grossAmount: number;
  feePercentage: number;
  feeAmount: number;
  organizerAmount: number;
  currency: string;
  status: string;
  calculatedAt: string;
  eventId: string;
  registrationId: string;
  disbursementId: string | null;
  transaction?: {
    id: string;
    transactionNumber: string;
    amount: number;
    paymentDate: string | null;
    attendeeName: string | null;
    attendeeEmail: string;
  };
}

export interface Disbursement {
  id: string;
  disbursementNumber: string;
  organizerId: string;
  eventId: string;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  scheduledDate: string | null;
  processedAt: string | null;
  completedAt: string | null;
  paymentReference: string | null;
  event?: {
    id: string;
    title: string;
  };
  organizer?: {
    id: string;
    email: string;
    organizationName: string | null;
  };
  platformFees?: Array<{
    id: string;
    feeAmount: number;
    organizerAmount: number;
  }>;
}

export interface Refund {
  id: string;
  refundNumber: string;
  transactionId: string;
  refundAmount: number;
  currency: string;
  refundReason: string;
  refundType: 'full' | 'partial';
  status: string;
  requestedAt: string;
  processedAt: string | null;
  completedAt: string | null;
  refundReference: string | null;
  eventId: string;
  registrationId: string;
  platformFeeRefund: number | null;
  transaction?: {
    id: string;
    transactionNumber: string;
    amount: number;
    paymentDate: string | null;
    attendeeName: string | null;
  };
}

export interface Reconciliation {
  id: string;
  reconciliationNumber: string;
  startDate: string;
  endDate: string;
  reconciliationDate: string;
  totalPaystackTransactions: number;
  totalSystemTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  totalPaystackAmount: number;
  totalSystemAmount: number;
  discrepancyAmount: number;
  status: string;
  eventId: string | null;
  discrepancies?: Array<{
    type: string;
    reference?: string;
    description: string;
    paystackAmount?: number;
    systemAmount?: number;
  }>;
}

// ==================== Payment Transactions ====================

export interface PaymentTransactionsResponse {
  transactions: PaymentTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SyncPaymentsParams {
  startDate?: string;
  endDate?: string;
  eventId?: string;
}

export interface SyncPaymentsResponse {
  totalFetched: number;
  created: number;
  skipped: number;
  errors: number;
  details: Array<{ reference: string; action: string; reason?: string }>;
}

/**
 * Sync payments from Paystack
 */
export const syncPaymentsFromPaystack = async (
  params: SyncPaymentsParams
): Promise<ApiResponse<SyncPaymentsResponse>> => {
  return apiPost<ApiResponse<SyncPaymentsResponse>>(
    '/admin/finance/payments/sync',
    params
  );
};

/**
 * Get payment transactions
 */
export const getPaymentTransactions = async (params?: {
  eventId?: string;
  registrationId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaymentTransactionsResponse>> => {
  const queryParams = new URLSearchParams();
  if (params?.eventId) queryParams.append('eventId', params.eventId);
  if (params?.registrationId) queryParams.append('registrationId', params.registrationId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const query = queryParams.toString();
  return apiGet<ApiResponse<PaymentTransactionsResponse>>(
    `/admin/finance/payments${query ? `?${query}` : ''}`
  );
};

/**
 * Get payment transaction by ID
 */
export const getPaymentTransaction = async (
  id: string
): Promise<ApiResponse<PaymentTransaction>> => {
  return apiGet<ApiResponse<PaymentTransaction>>(`/admin/finance/payments/${id}`);
};

// ==================== Platform Fees ====================

/**
 * Get platform fees for an event
 */
export const getPlatformFees = async (params: {
  eventId: string;
  status?: string;
  includeDisbursed?: boolean;
}): Promise<ApiResponse<PlatformFee[]>> => {
  const queryParams = new URLSearchParams();
  queryParams.append('eventId', params.eventId);
  if (params.status) queryParams.append('status', params.status);
  if (params.includeDisbursed !== undefined) {
    queryParams.append('includeDisbursed', params.includeDisbursed.toString());
  }

  return apiGet<ApiResponse<PlatformFee[]>>(
    `/admin/finance/platform-fees?${queryParams.toString()}`
  );
};

/**
 * Get platform fee summary for an event
 */
export const getPlatformFeeSummary = async (
  eventId: string
): Promise<ApiResponse<{
  totalFees: number;
  totalOrganizerAmount: number;
  totalTransactions: number;
  disbursedCount: number;
  pendingCount: number;
}>> => {
  return apiGet<ApiResponse<{
    totalFees: number;
    totalOrganizerAmount: number;
    totalTransactions: number;
    disbursedCount: number;
    pendingCount: number;
  }>>(`/admin/finance/platform-fees/summary?eventId=${eventId}`);
};

// ==================== Disbursements ====================

export interface CreateDisbursementParams {
  eventId: string;
  organizerId: string;
  platformFeeIds?: string[];
  scheduledDate?: string;
  paymentMethod?: string;
  bankAccount?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  notes?: string;
}

/**
 * Create a new disbursement
 */
export const createDisbursement = async (
  params: CreateDisbursementParams
): Promise<ApiResponse<Disbursement>> => {
  return apiPost<ApiResponse<Disbursement>>('/admin/finance/disbursements', params);
};

/**
 * Get disbursements
 */
export const getDisbursements = async (params?: {
  organizerId?: string;
  eventId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<Disbursement[]>> => {
  const queryParams = new URLSearchParams();
  if (params?.organizerId) queryParams.append('organizerId', params.organizerId);
  if (params?.eventId) queryParams.append('eventId', params.eventId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const query = queryParams.toString();
  return apiGet<ApiResponse<Disbursement[]>>(
    `/admin/finance/disbursements${query ? `?${query}` : ''}`
  );
};

/**
 * Get disbursement by ID
 */
export const getDisbursement = async (
  id: string
): Promise<ApiResponse<Disbursement>> => {
  return apiGet<ApiResponse<Disbursement>>(`/admin/finance/disbursements/${id}`);
};

/**
 * Process a disbursement
 */
export const processDisbursement = async (
  id: string,
  params: {
    paymentReference?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<ApiResponse<Disbursement>> => {
  return apiPost<ApiResponse<Disbursement>>(
    `/admin/finance/disbursements/${id}/process`,
    params
  );
};

/**
 * Complete a disbursement
 */
export const completeDisbursement = async (
  id: string,
  paymentReference: string
): Promise<ApiResponse<Disbursement>> => {
  return apiPost<ApiResponse<Disbursement>>(
    `/admin/finance/disbursements/${id}/complete`,
    { paymentReference }
  );
};

/**
 * Get disbursement summary for an organizer
 */
export const getDisbursementSummary = async (
  organizerId: string
): Promise<ApiResponse<{
  totalDisbursed: number;
  totalPending: number;
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  processingCount: number;
  failedCount: number;
}>> => {
  return apiGet<ApiResponse<{
    totalDisbursed: number;
    totalPending: number;
    totalCount: number;
    completedCount: number;
    pendingCount: number;
    processingCount: number;
    failedCount: number;
  }>>(`/admin/finance/disbursements/summary?organizerId=${organizerId}`);
};

// ==================== Refunds ====================

export interface CreateRefundParams {
  transactionId: string;
  refundAmount?: number;
  refundReason: string;
  refundType: 'full' | 'partial';
  notes?: string;
}

/**
 * Create a refund request
 */
export const createRefund = async (
  params: CreateRefundParams
): Promise<ApiResponse<Refund>> => {
  return apiPost<ApiResponse<Refund>>('/admin/finance/refunds', params);
};

/**
 * Get refunds for an event
 */
export const getRefunds = async (params: {
  eventId: string;
  status?: string;
}): Promise<ApiResponse<Refund[]>> => {
  const queryParams = new URLSearchParams();
  queryParams.append('eventId', params.eventId);
  if (params.status) queryParams.append('status', params.status);

  return apiGet<ApiResponse<Refund[]>>(
    `/admin/finance/refunds?${queryParams.toString()}`
  );
};

/**
 * Get refund by ID
 */
export const getRefund = async (id: string): Promise<ApiResponse<Refund>> => {
  return apiGet<ApiResponse<Refund>>(`/admin/finance/refunds/${id}`);
};

/**
 * Process a refund
 */
export const processRefund = async (
  id: string,
  params: {
    refundReference?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<ApiResponse<Refund>> => {
  return apiPost<ApiResponse<Refund>>(`/admin/finance/refunds/${id}/process`, params);
};

/**
 * Complete a refund
 */
export const completeRefund = async (
  id: string,
  refundReference: string
): Promise<ApiResponse<Refund>> => {
  return apiPost<ApiResponse<Refund>>(
    `/admin/finance/refunds/${id}/complete`,
    { refundReference }
  );
};

/**
 * Get refund summary for an event
 */
export const getRefundSummary = async (
  eventId: string
): Promise<ApiResponse<{
  totalRefunded: number;
  totalPlatformFeeRefunded: number;
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  processingCount: number;
  fullRefunds: number;
  partialRefunds: number;
}>> => {
  return apiGet<ApiResponse<{
    totalRefunded: number;
    totalPlatformFeeRefunded: number;
    totalCount: number;
    completedCount: number;
    pendingCount: number;
    processingCount: number;
    fullRefunds: number;
    partialRefunds: number;
  }>>(`/admin/finance/refunds/summary?eventId=${eventId}`);
};

// ==================== Reconciliation ====================

export interface CreateReconciliationParams {
  startDate: string;
  endDate: string;
  eventId?: string;
}

/**
 * Create a payment reconciliation
 */
export const createReconciliation = async (
  params: CreateReconciliationParams
): Promise<ApiResponse<Reconciliation>> => {
  return apiPost<ApiResponse<Reconciliation>>('/admin/finance/reconciliations', params);
};

/**
 * Get reconciliations
 */
export const getReconciliations = async (params?: {
  eventId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<Reconciliation[]>> => {
  const queryParams = new URLSearchParams();
  if (params?.eventId) queryParams.append('eventId', params.eventId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const query = queryParams.toString();
  return apiGet<ApiResponse<Reconciliation[]>>(
    `/admin/finance/reconciliations${query ? `?${query}` : ''}`
  );
};

/**
 * Get reconciliation by ID
 */
export const getReconciliation = async (
  id: string
): Promise<ApiResponse<Reconciliation>> => {
  return apiGet<ApiResponse<Reconciliation>>(`/admin/finance/reconciliations/${id}`);
};

/**
 * Auto-fix reconciliation discrepancies
 */
export const autoFixReconciliation = async (
  id: string
): Promise<ApiResponse<Reconciliation>> => {
  return apiPost<ApiResponse<Reconciliation>>(
    `/admin/finance/reconciliations/${id}/auto-fix`,
    {}
  );
};

// ==================== Finance Insights (Dashboards) ====================

export type FinanceInsightsPeriod = 'monthly' | 'quarterly' | 'semiannual' | 'yearly';

export interface FinanceInsightsPoint {
  label: string;
  value: number;
}

export interface FinanceInsights {
  period: FinanceInsightsPeriod;
  totalRevenue: FinanceInsightsPoint[];
  platformFees: FinanceInsightsPoint[];
  pendingDisbursements: FinanceInsightsPoint[];
  totalRefunds: FinanceInsightsPoint[];
}

/**
 * Get aggregated finance insights for admin dashboards
 */
export const getFinanceInsights = async (
  period: FinanceInsightsPeriod
): Promise<ApiResponse<FinanceInsights>> => {
  return apiGet<ApiResponse<FinanceInsights>>(
    `/admin/finance/insights?period=${period}`
  );
};

