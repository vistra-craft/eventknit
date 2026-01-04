/**
 * M-Pesa Gateway Service
 *
 * Implements M-Pesa Lipa Na M-Pesa Online (STK Push) for Kenya
 * Supports both sandbox and production environments
 */

import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import {
  PaymentGateway,
  InitializePaymentRequest,
  InitializePaymentResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  RefundPaymentRequest,
  RefundPaymentResponse,
} from '../payment-gateway.interface.js';

interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortcode: string;
  environment: 'sandbox' | 'production';
  callbackUrl: string;
}

interface STKPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
  callbackUrl?: string;
}

interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

interface STKQueryResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

interface MpesaCallbackData {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

export class MpesaGateway implements PaymentGateway {
  private mpesaConfig: MpesaConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.mpesaConfig = {
      consumerKey: config.mpesa.consumerKey,
      consumerSecret: config.mpesa.consumerSecret,
      passkey: config.mpesa.passkey,
      shortcode: config.mpesa.shortcode,
      environment: config.mpesa.environment,
      callbackUrl: config.mpesa.callbackUrl,
    };
  }

  getName(): string {
    return 'MPESA';
  }

  isConfigured(): boolean {
    return !!(
      this.mpesaConfig.consumerKey &&
      this.mpesaConfig.consumerSecret &&
      this.mpesaConfig.passkey &&
      this.mpesaConfig.shortcode
    );
  }

  /**
   * Get base URL based on environment
   */
  private getBaseUrl(): string {
    return this.mpesaConfig.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = Buffer.from(
      `${this.mpesaConfig.consumerKey}:${this.mpesaConfig.consumerSecret}`
    ).toString('base64');

    try {
      const response = await fetch(
        `${this.getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
        {
          method: 'GET',
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.status}`);
      }

      const data = await response.json() as { access_token: string; expires_in: string };
      this.accessToken = data.access_token;
      // Token expires in 3599 seconds, we'll refresh 5 minutes before expiry
      this.tokenExpiry = new Date(Date.now() + (parseInt(data.expires_in) - 300) * 1000);

      return this.accessToken;
    } catch (error) {
      logger.error('Failed to get M-Pesa access token:', error);
      throw new Error('M-Pesa authentication failed');
    }
  }

  /**
   * Generate password for STK Push
   */
  private generatePassword(): { password: string; timestamp: string } {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.Z]/g, '')
      .slice(0, 14);
    const password = Buffer.from(
      `${this.mpesaConfig.shortcode}${this.mpesaConfig.passkey}${timestamp}`
    ).toString('base64');
    return { password, timestamp };
  }

  /**
   * Format phone number to M-Pesa format (254XXXXXXXXX)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');

    // Handle various formats
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.slice(1);
    } else if (cleaned.startsWith('+')) {
      cleaned = cleaned.slice(1);
    } else if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }

    return cleaned;
  }

  /**
   * Initiate STK Push payment
   */
  async initiateSTKPush(request: STKPushRequest): Promise<STKPushResponse> {
    if (!this.isConfigured()) {
      throw new Error('M-Pesa is not configured');
    }

    const token = await this.getAccessToken();
    const { password, timestamp } = this.generatePassword();
    const phoneNumber = this.formatPhoneNumber(request.phoneNumber);

    const payload = {
      BusinessShortCode: this.mpesaConfig.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(request.amount),
      PartyA: phoneNumber,
      PartyB: this.mpesaConfig.shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: request.callbackUrl || this.mpesaConfig.callbackUrl,
      AccountReference: request.accountReference.slice(0, 12), // Max 12 chars
      TransactionDesc: request.transactionDesc.slice(0, 13), // Max 13 chars
    };

    try {
      const response = await fetch(
        `${this.getBaseUrl()}/mpesa/stkpush/v1/processrequest`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json() as STKPushResponse;

      if (data.ResponseCode !== '0') {
        logger.error('M-Pesa STK Push failed:', data);
        throw new Error(data.ResponseDescription || 'STK Push failed');
      }

      logger.info(`M-Pesa STK Push initiated: ${data.CheckoutRequestID}`);
      return data;
    } catch (error) {
      logger.error('M-Pesa STK Push error:', error);
      throw error;
    }
  }

  /**
   * Query STK Push status
   */
  async querySTKPush(checkoutRequestId: string): Promise<STKQueryResponse> {
    if (!this.isConfigured()) {
      throw new Error('M-Pesa is not configured');
    }

    const token = await this.getAccessToken();
    const { password, timestamp } = this.generatePassword();

    const payload = {
      BusinessShortCode: this.mpesaConfig.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    try {
      const response = await fetch(
        `${this.getBaseUrl()}/mpesa/stkpushquery/v1/query`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json() as STKQueryResponse;
      return data;
    } catch (error) {
      logger.error('M-Pesa STK Query error:', error);
      throw error;
    }
  }

  /**
   * Initialize payment (implements PaymentGateway interface)
   * For M-Pesa, this initiates STK Push
   */
  async initializePayment(request: InitializePaymentRequest): Promise<InitializePaymentResponse> {
    if (!this.isConfigured()) {
      throw new Error('M-Pesa is not configured');
    }

    // M-Pesa requires phone number in metadata
    const phoneNumber = (request.metadata?.phoneNumber as string) || '';
    if (!phoneNumber) {
      throw new Error('Phone number is required for M-Pesa payment');
    }

    try {
      const stkResponse = await this.initiateSTKPush({
        phoneNumber,
        amount: request.amount,
        accountReference: request.reference || `EVT${Date.now()}`,
        transactionDesc: 'Event Registration',
        callbackUrl: request.callbackUrl,
      });

      return {
        success: true,
        reference: stkResponse.CheckoutRequestID,
        gateway: 'MPESA',
        metadata: {
          merchantRequestId: stkResponse.MerchantRequestID,
          checkoutRequestId: stkResponse.CheckoutRequestID,
          customerMessage: stkResponse.CustomerMessage,
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('M-Pesa initializePayment error:', error);
      throw new Error(`M-Pesa payment failed: ${errorMessage}`);
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(request: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    if (!this.isConfigured()) {
      throw new Error('M-Pesa is not configured');
    }

    try {
      const queryResponse = await this.querySTKPush(request.reference);

      const isSuccess = queryResponse.ResultCode === '0';
      let status: 'success' | 'failed' | 'pending' | 'cancelled' = 'pending';

      if (queryResponse.ResultCode === '0') {
        status = 'success';
      } else if (queryResponse.ResultCode === '1032') {
        status = 'cancelled'; // User cancelled
      } else if (queryResponse.ResultCode) {
        status = 'failed';
      }

      return {
        success: isSuccess,
        reference: request.reference,
        amount: 0, // Amount not returned in query, should be stored locally
        currency: 'KES',
        status,
        customer: {
          email: '', // M-Pesa doesn't provide email
        },
        gateway: 'MPESA',
        gatewayTransactionId: queryResponse.CheckoutRequestID,
        metadata: queryResponse as unknown as Record<string, unknown>,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('M-Pesa verifyPayment error:', error);
      throw new Error(`M-Pesa verification failed: ${errorMessage}`);
    }
  }

  /**
   * M-Pesa doesn't support direct refunds via API
   * Refunds must be processed manually or via B2C API
   */
  async refundPayment(_request: RefundPaymentRequest): Promise<RefundPaymentResponse> {
    throw new Error('M-Pesa refunds must be processed manually. Use B2C API for automated refunds.');
  }

  /**
   * Handle M-Pesa callback webhook
   */
  async handleWebhook(payload: unknown, _signature?: string): Promise<{
    event: string;
    data: Record<string, unknown>;
    reference?: string;
  }> {
    const callbackData = payload as MpesaCallbackData;

    if (!callbackData?.Body?.stkCallback) {
      throw new Error('Invalid M-Pesa callback payload');
    }

    const callback = callbackData.Body.stkCallback;
    const isSuccess = callback.ResultCode === 0;

    // Extract metadata if payment was successful
    let amount: number | undefined;
    let mpesaReceiptNumber: string | undefined;
    let phoneNumber: string | undefined;

    if (isSuccess && callback.CallbackMetadata?.Item) {
      for (const item of callback.CallbackMetadata.Item) {
        switch (item.Name) {
          case 'Amount':
            amount = item.Value as number;
            break;
          case 'MpesaReceiptNumber':
            mpesaReceiptNumber = item.Value as string;
            break;
          case 'PhoneNumber':
            phoneNumber = item.Value?.toString();
            break;
        }
      }
    }

    return {
      event: isSuccess ? 'payment.success' : 'payment.failed',
      data: {
        merchantRequestId: callback.MerchantRequestID,
        checkoutRequestId: callback.CheckoutRequestID,
        resultCode: callback.ResultCode,
        resultDesc: callback.ResultDesc,
        amount,
        mpesaReceiptNumber,
        phoneNumber,
      },
      reference: callback.CheckoutRequestID,
    };
  }

  /**
   * Parse callback and extract payment details
   */
  parseCallback(callbackData: MpesaCallbackData): {
    success: boolean;
    checkoutRequestId: string;
    merchantRequestId: string;
    resultCode: number;
    resultDesc: string;
    amount?: number;
    mpesaReceiptNumber?: string;
    phoneNumber?: string;
    transactionDate?: string;
  } {
    const callback = callbackData.Body.stkCallback;
    const isSuccess = callback.ResultCode === 0;

    const result: ReturnType<typeof this.parseCallback> = {
      success: isSuccess,
      checkoutRequestId: callback.CheckoutRequestID,
      merchantRequestId: callback.MerchantRequestID,
      resultCode: callback.ResultCode,
      resultDesc: callback.ResultDesc,
    };

    if (isSuccess && callback.CallbackMetadata?.Item) {
      for (const item of callback.CallbackMetadata.Item) {
        switch (item.Name) {
          case 'Amount':
            result.amount = item.Value as number;
            break;
          case 'MpesaReceiptNumber':
            result.mpesaReceiptNumber = item.Value as string;
            break;
          case 'PhoneNumber':
            result.phoneNumber = item.Value?.toString();
            break;
          case 'TransactionDate':
            result.transactionDate = item.Value?.toString();
            break;
        }
      }
    }

    return result;
  }
}

// Export singleton instance
export const mpesaGateway = new MpesaGateway();
