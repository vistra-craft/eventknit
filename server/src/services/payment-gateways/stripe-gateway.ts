import Stripe from 'stripe';
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

export class StripeGateway implements PaymentGateway {
  private stripe: Stripe | null = null;
  private gatewayConfig: PaymentGatewayConfig;

  constructor(gatewayConfig?: PaymentGatewayConfig) {
    this.gatewayConfig = gatewayConfig || {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      publicKey: process.env.STRIPE_PUBLIC_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      environment: (process.env.STRIPE_ENVIRONMENT as 'test' | 'live') || 'test',
    };

    if (this.gatewayConfig.secretKey) {
      this.stripe = new Stripe(this.gatewayConfig.secretKey, {
        apiVersion: '2025-02-24.acacia',
      });
    }
  }

  getName(): string {
    return 'STRIPE';
  }

  isConfigured(): boolean {
    return !!this.gatewayConfig.secretKey && !!this.stripe;
  }

  async initializePayment(request: InitializePaymentRequest): Promise<InitializePaymentResponse> {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured');
    }

    try {
      // Create a PaymentIntent for server-side payment
      // For client-side, we'll create a Checkout Session
      const session = await this.stripe!.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: request.currency.toLowerCase(),
              product_data: {
                name: 'Event Registration',
              },
              unit_amount: Math.round(request.amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer_email: request.email,
        success_url: request.returnUrl || `${config.frontend.url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: request.returnUrl || `${config.frontend.url}/payment/cancel`,
        metadata: request.metadata ? Object.fromEntries(
          Object.entries(request.metadata).map(([key, value]) => [
            key,
            typeof value === 'string' || typeof value === 'number' ? String(value) : String(value),
          ]),
        ) as Record<string, string> : {},
        client_reference_id: request.reference,
      });

      return {
        success: true,
        authorizationUrl: session.url || undefined,
        reference: request.reference || session.id,
        gateway: 'STRIPE',
        metadata: {
          sessionId: session.id,
          clientSecret: session.client_secret,
        },
      };
    } catch (error: any) {
      logger.error('Stripe payment initialization error:', error);
      throw new Error(`Stripe payment failed: ${error.message}`);
    }
  }

  async verifyPayment(request: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured');
    }

    try {
      // Check if it's a checkout session ID or payment intent ID
      let session: Stripe.Checkout.Session | null = null;
      let paymentIntent: Stripe.PaymentIntent | null = null;

      // Try as checkout session first
      try {
        session = await this.stripe!.checkout.sessions.retrieve(request.reference);
        if (session.payment_intent && typeof session.payment_intent === 'string') {
          paymentIntent = await this.stripe!.paymentIntents.retrieve(session.payment_intent);
        }
      } catch {
        // Try as payment intent
        try {
          paymentIntent = await this.stripe!.paymentIntents.retrieve(request.reference);
        } catch {
          throw new Error('Invalid Stripe reference');
        }
      }

      const intent = paymentIntent || (session?.payment_intent as Stripe.PaymentIntent);
      if (!intent) {
        throw new Error('Payment intent not found');
      }

      const status = intent.status === 'succeeded' ? 'success' :
        intent.status === 'canceled' ? 'cancelled' :
          intent.status === 'requires_payment_method' ? 'failed' : 'pending';

      return {
        success: intent.status === 'succeeded',
        reference: request.reference,
        amount: (intent.amount || 0) / 100, // Convert from cents
        currency: intent.currency.toUpperCase(),
        status,
        customer: {
          email: session?.customer_email || (intent.customer as string) || '',
          name: session?.customer_details?.name || undefined,
        },
        gateway: 'STRIPE',
        gatewayTransactionId: intent.id,
        metadata: {
          session: session?.id,
          paymentIntent: intent.id,
        },
        paidAt: intent.status === 'succeeded' ? new Date(intent.created * 1000) : undefined,
      };
    } catch (error: any) {
      logger.error('Stripe payment verification error:', error);
      throw new Error(`Stripe verification failed: ${error.message}`);
    }
  }

  async refundPayment(request: RefundPaymentRequest): Promise<RefundPaymentResponse> {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured');
    }

    try {
      // Get payment intent first
      let paymentIntentId: string;
      
      // Check if it's a checkout session
      try {
        const session = await this.stripe!.checkout.sessions.retrieve(request.transactionReference);
        if (session.payment_intent && typeof session.payment_intent === 'string') {
          paymentIntentId = session.payment_intent;
        } else {
          paymentIntentId = request.transactionReference;
        }
      } catch {
        paymentIntentId = request.transactionReference;
      }

      const refundData: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (request.amount) {
        refundData.amount = Math.round(request.amount * 100); // Convert to cents
      }

      if (request.reason) {
        refundData.reason = 'requested_by_customer';
        refundData.metadata = { reason: request.reason };
      }

      const refund = await this.stripe!.refunds.create(refundData);

      return {
        success: refund.status === 'succeeded',
        refundId: refund.id,
        amount: refund.amount ? refund.amount / 100 : 0,
        currency: refund.currency.toUpperCase(),
        status: refund.status === 'succeeded' ? 'success' : 'pending',
        gateway: 'STRIPE',
        metadata: refund as any,
      };
    } catch (error: any) {
      logger.error('Stripe refund error:', error);
      throw new Error(`Stripe refund failed: ${error.message}`);
    }
  }

  async handleWebhook(payload: unknown, signature?: string): Promise<{
    event: string;
    data: Record<string, unknown>;
    reference?: string;
  }> {
    if (!this.isConfigured() || !this.gatewayConfig.webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    try {
      // Verify webhook signature
      const event = this.stripe!.webhooks.constructEvent(
        JSON.stringify(payload),
        signature || '',
        this.gatewayConfig.webhookSecret,
      );

      // Extract reference from event data
      let reference: string | undefined;
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        reference = session.id;
      } else if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        reference = paymentIntent.id;
      }

      return {
        event: event.type,
        data: JSON.parse(JSON.stringify(event.data.object)) as Record<string, unknown>,
        reference,
      };
    } catch (error: any) {
      logger.error('Stripe webhook verification error:', error);
      throw new Error(`Stripe webhook verification failed: ${error.message}`);
    }
  }
}
