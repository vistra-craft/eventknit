import Paystack from 'paystack';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import {
  PaymentGateway,
  PaymentGatewayConfig,
  InitializePaymentRequest,
  InitializePaymentResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  RefundPaymentRequest,
  RefundPaymentResponse,
} from '../payment-gateway.interface.js';

export class PaystackGateway implements PaymentGateway {
  private paystack: Paystack | null = null;
  private gatewayConfig: PaymentGatewayConfig;

  constructor(gatewayConfig?: PaymentGatewayConfig) {
    this.gatewayConfig = gatewayConfig || {
      secretKey: config.paystack.secretKey || '',
      publicKey: config.paystack.publicKey || '',
      webhookSecret: config.paystack.webhookSecret || '',
    };

    if (this.gatewayConfig.secretKey) {
      this.paystack = new Paystack(this.gatewayConfig.secretKey);
    }
  }

  getName(): string {
    return 'PAYSTACK';
  }

  isConfigured(): boolean {
    return !!this.gatewayConfig.secretKey;
  }

  async initializePayment(request: InitializePaymentRequest): Promise<InitializePaymentResponse> {
    if (!this.isConfigured() || !this.paystack) {
      throw new Error('Paystack is not configured');
    }

    try {
      // Convert amount to smallest currency unit (kobo for NGN, cents for KES)
      const amountInSmallestUnit = Math.round(request.amount * 100);

      logger.info('Paystack payment initialization request:', {
        email: request.email,
        amount: amountInSmallestUnit,
        currency: request.currency,
        reference: request.reference,
      });

      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('PAYSTACK_TIMEOUT')), 10000); // 10 second timeout
      });

      const response = await Promise.race([
        this.paystack.transaction.initialize({
          email: request.email,
          amount: amountInSmallestUnit,
          currency: request.currency,
          reference: request.reference,
          metadata: request.metadata,
          callback_url: request.callbackUrl,
        }),
        timeoutPromise,
      ]);

      if ((response as any).status && (response as any).data) {
        const data: any = (response as any).data;
        return {
          success: true,
          authorizationUrl: data.authorization_url,
          accessCode: data.access_code,
          reference: data.reference,
          gateway: 'PAYSTACK',
          metadata: data as Record<string, unknown>,
        };
      }

      logger.error('Paystack returned unsuccessful response:', response);
      throw new Error('PAYSTACK_FAILED_RESPONSE');
    } catch (error: any) {
      const errorCode = this.classifyPaystackError(error);
      logger.error('Paystack payment initialization error:', {
        errorCode,
        message: error.message,
        statusCode: error.response?.status,
        responseData: error.response?.data,
        isTransient: this.isTransientError(errorCode),
        stack: error.stack,
      });
      // Rethrow with classified error code
      const err = new Error(error.message);
      (err as any).code = errorCode;
      (err as any).isTransient = this.isTransientError(errorCode);
      throw err;
    }
  }

  /**
   * Classify Paystack errors as transient (retryable) or permanent
   */
  private classifyPaystackError(error: any): string {
    if (error.message === 'PAYSTACK_TIMEOUT') return 'PAYSTACK_TIMEOUT';
    if (error.message === 'PAYSTACK_FAILED_RESPONSE') return 'PAYSTACK_FAILED_RESPONSE';
    
    const statusCode = error.response?.status;
    
    // Transient errors - can retry
    if (!statusCode) return 'NETWORK_ERROR'; // Network failure
    if (statusCode === 408) return 'REQUEST_TIMEOUT';
    if (statusCode === 429) return 'RATE_LIMITED';
    if (statusCode === 500 || statusCode === 502 || statusCode === 503 || statusCode === 504) return 'PAYSTACK_UNAVAILABLE';
    
    // Permanent errors - do not retry
    if (statusCode === 401) return 'PAYSTACK_AUTH_ERROR'; // Invalid keys
    if (statusCode === 400) {
      const detail = error.response?.data?.message || '';
      if (detail.includes('invalid_key')) return 'PAYSTACK_AUTH_ERROR';
      return 'INVALID_REQUEST';
    }
    if (statusCode === 403) return 'PAYSTACK_FORBIDDEN';
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * Determine if error is transient (can be retried)
   */
  private isTransientError(errorCode: string): boolean {
    const transientErrors = [
      'NETWORK_ERROR',
      'REQUEST_TIMEOUT',
      'RATE_LIMITED',
      'PAYSTACK_TIMEOUT',
      'PAYSTACK_UNAVAILABLE',
    ];
    return transientErrors.includes(errorCode);
  }

  async verifyPayment(request: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    if (!this.isConfigured() || !this.paystack) {
      throw new Error('Paystack is not configured');
    }

    try {
      // Add timeout for verification as well
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('PAYSTACK_TIMEOUT')), 10000); // 10 second timeout
      });

      const response = await Promise.race([
        this.paystack.transaction.verify(request.reference),
        timeoutPromise,
      ]);

      if ((response as any).status && (response as any).data) {
        const transaction: any = (response as any).data;
        const status = transaction.status === 'success' ? 'success' : 
          transaction.status === 'failed' ? 'failed' : 'pending';

        return {
          success: transaction.status === 'success',
          reference: transaction.reference,
          amount: transaction.amount / 100, // Convert from kobo/cents
          currency: transaction.currency,
          status,
          customer: {
            email: transaction.customer?.email || '',
            name: transaction.customer?.first_name && transaction.customer?.last_name
              ? `${transaction.customer.first_name} ${transaction.customer.last_name}`
              : undefined,
          },
          gateway: 'PAYSTACK',
          gatewayTransactionId: transaction.id?.toString(),
          metadata: transaction as Record<string, unknown>,
          paidAt: transaction.paid_at ? new Date(transaction.paid_at) : undefined,
        };
      }

      logger.error('Paystack verification returned unsuccessful response:', response);
      throw new Error('PAYSTACK_FAILED_RESPONSE');
    } catch (error: any) {
      const errorCode = this.classifyPaystackError(error);
      logger.error('Paystack payment verification error:', {
        errorCode,
        message: error.message,
        statusCode: error.response?.status,
        reference: request.reference,
      });
      const err = new Error(error.message);
      (err as any).code = errorCode;
      throw err;
    }
  }

  async refundPayment(request: RefundPaymentRequest): Promise<RefundPaymentResponse> {
    if (!this.isConfigured() || !this.paystack) {
      throw new Error('Paystack is not configured');
    }

    try {
      const refundData: any = {
        transaction: request.transactionReference,
      };

      if (request.amount) {
        refundData.amount = Math.round(request.amount * 100); // Convert to smallest unit
      }

      if (request.reason) {
        refundData.customer_note = request.reason;
      }

      const response = await this.paystack.refund.create(refundData);

      if ((response as any).status && (response as any).data) {
        const refund: any = (response as any).data;
        return {
          success: refund.status === 'success',
          refundId: refund.id?.toString() || '',
          amount: refund.amount ? refund.amount / 100 : 0,
          currency: refund.currency || 'NGN',
          status: refund.status === 'success' ? 'success' : 'pending',
          gateway: 'PAYSTACK',
          metadata: refund as any,
        };
      }

      throw new Error('Failed to process Paystack refund');
    } catch (error: any) {
      logger.error('Paystack refund error:', error);
      throw new Error(`Paystack refund failed: ${error.message}`);
    }
  }

  async handleWebhook(payload: unknown, _signature?: string): Promise<{
    event: string;
    data: Record<string, unknown>;
    reference?: string;
  }> {
    // Paystack webhook payload structure
    const webhookData = payload as any;

    if (webhookData.event && webhookData.data) {
      return {
        event: webhookData.event,
        data: webhookData.data,
        reference: webhookData.data.reference,
      };
    }

    throw new Error('Invalid Paystack webhook payload');
  }
}
