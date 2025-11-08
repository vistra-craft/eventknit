/**
 * Payment API Functions
 */

import { apiPost, apiGet, type ApiResponse } from './api';

/**
 * Initialize payment response
 */
export interface InitializePaymentResponse {
  success: boolean;
  message: string;
  data: {
    authorizationUrl: string;
    accessCode: string;
    reference: string;
  };
}

/**
 * Verify payment response
 */
export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    reference: string;
    amount: number;
    status: string;
    customer: {
      email: string;
    };
    metadata?: Record<string, unknown>;
  };
}

/**
 * Payment status response
 */
export interface PaymentStatusResponse {
  success: boolean;
  data: {
    paymentStatus: string;
    paymentMethod: string | null;
    paymentTransactionId: string | null;
    totalAmount: number;
  };
}

/**
 * Initialize payment for a registration
 */
export const initializePayment = async (registrationId: string): Promise<InitializePaymentResponse> => {
  return apiPost<InitializePaymentResponse>('/payments/initialize', { registrationId });
};

/**
 * Verify payment by reference
 */
export const verifyPayment = async (reference: string): Promise<VerifyPaymentResponse> => {
  return apiGet<VerifyPaymentResponse>(`/payments/verify?reference=${encodeURIComponent(reference)}`);
};

/**
 * Get payment status for a registration
 */
export const getPaymentStatus = async (registrationId: string): Promise<PaymentStatusResponse> => {
  return apiGet<PaymentStatusResponse>(`/payments/status/${registrationId}`);
};


