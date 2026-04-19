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

  private getSupportedCurrencies(): string[] {
    const configured = process.env.PAYSTACK_SUPPORTED_CURRENCIES;
    if (configured && configured.trim().length > 0) {
      return configured
        .split(',')
        .map(c => c.trim().toUpperCase())
        .filter(Boolean);
    }

    // Commonly supported Paystack currencies by account/product setup.
    // Override via PAYSTACK_SUPPORTED_CURRENCIES env var if your account differs.
    return ['NGN', 'GHS', 'USD', 'ZAR'];
  }

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

    const requestedCurrency = (request.currency || '').toUpperCase();
    const supportedCurrencies = this.getSupportedCurrencies();
    if (requestedCurrency && !supportedCurrencies.includes(requestedCurrency)) {
      const apiError = new Error('PAYSTACK_API_REJECTED');
      (apiError as any).code = 'INVALID_REQUEST';
      (apiError as any).isTransient = false;
      (apiError as any).gatewayMessage =
        `Currency ${requestedCurrency} is not enabled for Paystack on this server. ` +
        `Use one of: ${supportedCurrencies.join(', ')} or switch this event to an M-Pesa checkout flow for KES.`;
      throw apiError;
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

      const initPayload: Record<string, unknown> = {
        email: request.email,
        amount: amountInSmallestUnit,
        currency: request.currency,
        reference: request.reference,
        metadata: request.metadata,
        callback_url: request.callbackUrl,
      };

      const response = await Promise.race([
        this.paystack.transaction.initialize(initPayload as any),
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

      const rejectedMessage = (response as any)?.message || 'Paystack rejected payment initialization';

      // Some Paystack accounts reject unsupported currencies. Retry once without currency
      // so Paystack can use the account default currency.
      if (
        typeof rejectedMessage === 'string' &&
        /currency/i.test(rejectedMessage) &&
        request.currency &&
        request.currency.toUpperCase() !== 'NGN'
      ) {
        logger.warn('Paystack rejected currency, retrying without currency override:', {
          requestedCurrency: request.currency,
          message: rejectedMessage,
        });

        const retryPayload: Record<string, unknown> = {
          email: request.email,
          amount: amountInSmallestUnit,
          reference: request.reference,
          metadata: request.metadata,
          callback_url: request.callbackUrl,
        };

        const retryResponse = await Promise.race([
          this.paystack.transaction.initialize(retryPayload as any),
          timeoutPromise,
        ]);

        if ((retryResponse as any).status && (retryResponse as any).data) {
          const retryData: any = (retryResponse as any).data;
          return {
            success: true,
            authorizationUrl: retryData.authorization_url,
            accessCode: retryData.access_code,
            reference: retryData.reference,
            gateway: 'PAYSTACK',
            metadata: retryData as Record<string, unknown>,
          };
        }
      }

      logger.error('Paystack returned unsuccessful response:', response);
      const apiError = new Error('PAYSTACK_API_REJECTED');
      (apiError as any).code = 'INVALID_REQUEST';
      (apiError as any).isTransient = false;
      (apiError as any).gatewayMessage = rejectedMessage;
      throw apiError;
    } catch (error: any) {
      const errorCode = error?.code || this.classifyPaystackError(error);
      logger.error('Paystack payment initialization error:', {
        errorCode,
        message: error.message,
        statusCode: error.response?.status,
        responseData: error.response?.data,
        gatewayMessage: error?.gatewayMessage,
        isTransient: this.isTransientError(errorCode),
        stack: error.stack,
      });
      // Rethrow with classified error code
      const err = new Error(error.message);
      (err as any).code = errorCode;
      (err as any).isTransient = typeof error?.isTransient === 'boolean'
        ? error.isTransient
        : this.isTransientError(errorCode);
      if (error?.gatewayMessage) {
        (err as any).gatewayMessage = error.gatewayMessage;
      }
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

  /**
   * Handle and validate Paystack webhook per official documentation
   * Paystack uses HMAC-SHA512 signature verification for webhook authenticity
   * @param payload The raw webhook payload
   * @param signature The x-paystack-signature header value
   * @returns Parsed webhook event data
   * @throws Error if signature is invalid or payload is malformed
   */
  async handleWebhook(payload: unknown, signature?: string): Promise<{
    event: string;
    data: Record<string, unknown>;
    reference?: string;
  }> {
    // Per Paystack docs: signature header contains HMAC-SHA512 hash of raw body
    // Verify signature before processing webhook
    if (signature) {
      const verified = this.verifyWebhookSignature(payload, signature);
      if (!verified) {
        logger.error('Paystack webhook signature verification failed');
        throw new Error('PAYSTACK_WEBHOOK_INVALID_SIGNATURE');
      }
      logger.debug('Paystack webhook signature verified');
    } else {
      logger.warn('Paystack webhook received without signature - skipping verification');
    }

    // Paystack webhook payload structure: { event, data: {...} }
    const webhookData = payload as any;

    if (!webhookData.event || !webhookData.data) {
      logger.error('Invalid Paystack webhook payload structure', { payload });
      throw new Error('Invalid Paystack webhook payload');
    }

    if (!webhookData.data.reference) {
      logger.error('Paystack webhook missing reference field', { event: webhookData.event });
      throw new Error('Paystack webhook missing payment reference');
    }

    return {
      event: webhookData.event,
      data: webhookData.data,
      reference: webhookData.data.reference,
    };
  }

  /**
   * Verify Paystack webhook signature (HMAC-SHA512)
   * Per Paystack documentation: https://paystack.com/docs/api/#verifying-webhooks
   * The signature is computed as: HMAC-SHA512(secret, body) and sent in x-paystack-signature header
   */
  private verifyWebhookSignature(payload: unknown, signature: string): boolean {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');

    if (!this.gatewayConfig.secretKey) {
      logger.error('Paystack webhook verification: secret key not configured');
      return false;
    }

    try {
      // Convert payload to string if needed (should be raw body as string)
      const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);

      // Compute expected signature: HMAC-SHA512(secret_key, body)
      const expectedSignature = crypto
        .createHmac('sha512', this.gatewayConfig.secretKey)
        .update(payloadStr)
        .digest('hex');

      // Compare using timing-safe comparison to prevent timing attacks
      const signatureBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      if (signatureBuffer.length !== expectedBuffer.length) {
        logger.warn('Paystack webhook signature length mismatch');
        return false;
      }

      const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
      logger.debug('Paystack webhook signature validation result:', { isValid });
      return isValid;
    } catch (error) {
      logger.error('Paystack webhook signature verification error:', error);
      return false;
    }
  }
}
