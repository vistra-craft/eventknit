/**
 * Payment API Functions
 */

import { apiPost, apiGet, API_BASE_URL } from './api';

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
 * Initialize payment for a guest registration (no auth required, uses email verification)
 */
export const initializeGuestPayment = async (registrationId: string, email: string): Promise<InitializePaymentResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/payments/initialize-guest`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId, email }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Payment initialization failed' }));
    throw new Error(error.message || 'Payment initialization failed');
  }

  return response.json();
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


