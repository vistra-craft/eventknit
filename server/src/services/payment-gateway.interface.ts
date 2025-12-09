/**
 * Payment Gateway Interface
 * Defines the contract that all payment gateways must implement
 */

export interface PaymentGatewayConfig {
  secretKey: string;
  publicKey?: string;
  webhookSecret?: string;
  environment?: 'test' | 'live';
  [key: string]: any; // Allow gateway-specific config
}

export interface InitializePaymentRequest {
  amount: number; // Amount in main currency unit (e.g., USD, NGN)
  currency: string;
  email: string;
  reference?: string;
  metadata?: Record<string, unknown>;
  callbackUrl?: string;
  returnUrl?: string;
}

export interface InitializePaymentResponse {
  success: boolean;
  authorizationUrl?: string;
  accessCode?: string;
  reference: string;
  gateway: string;
  metadata?: Record<string, unknown>;
}

export interface VerifyPaymentRequest {
  reference: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  reference: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending' | 'cancelled';
  customer: {
    email: string;
    name?: string;
  };
  gateway: string;
  gatewayTransactionId?: string;
  metadata?: Record<string, unknown>;
  paidAt?: Date;
}

export interface RefundPaymentRequest {
  transactionReference: string;
  amount?: number; // Partial refund if specified, full refund if not
  reason?: string;
}

export interface RefundPaymentResponse {
  success: boolean;
  refundId: string;
  amount: number;
  currency: string;
  status: 'success' | 'pending' | 'failed';
  gateway: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentGateway {
  /**
   * Get the gateway name
   */
  getName(): string;

  /**
   * Initialize a payment
   */
  initializePayment(request: InitializePaymentRequest): Promise<InitializePaymentResponse>;

  /**
   * Verify a payment
   */
  verifyPayment(request: VerifyPaymentRequest): Promise<VerifyPaymentResponse>;

  /**
   * Process a refund
   */
  refundPayment(request: RefundPaymentRequest): Promise<RefundPaymentResponse>;

  /**
   * Handle webhook events
   */
  handleWebhook(payload: unknown, signature?: string): Promise<{
    event: string;
    data: Record<string, unknown>;
    reference?: string;
  }>;

  /**
   * Check if gateway is configured
   */
  isConfigured(): boolean;
}
