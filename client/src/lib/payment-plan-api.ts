/**
 * Payment Plan API Functions
 */

import { apiGet, apiPost, type ApiResponse } from './api';

export interface PaymentPlan {
  id: string;
  registrationId: string;
  eventId: string;
  planName: string;
  totalAmount: number;
  currency: string;
  installmentCount: number;
  installmentAmount: number;
  frequency: string;
  startDate: string;
  endDate: string;
  status: string;
  autoPaymentEnabled: boolean;
  installments: PaymentInstallment[];
  event?: {
    id: string;
    title: string;
  };
}

export interface PaymentInstallment {
  id: string;
  planId: string;
  installmentNumber: number;
  amount: number;
  currency: string;
  dueDate: string;
  paidAmount?: number;
  paidAt?: string;
  status: string;
}

export interface CreatePaymentPlanData {
  registrationId: string;
  planName: string;
  installmentCount: number;
  frequency: 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY' | 'CUSTOM';
  startDate: string;
  autoPaymentEnabled?: boolean;
  paymentMethod?: string;
}

export interface ProcessInstallmentPaymentData {
  amount: number;
  transactionId?: string;
  gateway?: string;
  gatewayReference?: string;
}

/**
 * Create payment plan
 */
export const createPaymentPlan = async (
  data: CreatePaymentPlanData
): Promise<ApiResponse<{ plan: PaymentPlan }>> => {
  return apiPost('/user-dashboard/payment-plans', data);
};

/**
 * Get user's payment plans
 */
export const getUserPaymentPlans = async (filters?: {
  status?: string;
  eventId?: string;
}): Promise<ApiResponse<{ plans: PaymentPlan[] }>> => {
  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.eventId) queryParams.append('eventId', filters.eventId);

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `/user-dashboard/payment-plans?${queryString}`
    : '/user-dashboard/payment-plans';
  return apiGet(endpoint);
};

/**
 * Get payment plan by registration
 */
export const getPaymentPlanByRegistration = async (
  registrationId: string
): Promise<ApiResponse<{ plan: PaymentPlan }>> => {
  return apiGet(`/user-dashboard/payment-plans/registration/${registrationId}`);
};

/**
 * Process installment payment
 */
export const processInstallmentPayment = async (
  installmentId: string,
  data: ProcessInstallmentPaymentData
): Promise<ApiResponse<{ installment: PaymentInstallment }>> => {
  return apiPost(`/user-dashboard/payment-plans/installments/${installmentId}/pay`, data);
};

/**
 * Get overdue installments
 */
export const getOverdueInstallments = async (): Promise<ApiResponse<{ installments: PaymentInstallment[] }>> => {
  return apiGet('/user-dashboard/payment-plans/overdue');
};

/**
 * Cancel payment plan
 */
export const cancelPaymentPlan = async (planId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiPost(`/user-dashboard/payment-plans/${planId}/cancel`, {});
};
