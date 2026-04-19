import { PaymentGateway } from './payment-gateway.interface.js';
import { PaystackGateway } from './payment-gateways/paystack-gateway.js';
import { StripeGateway } from './payment-gateways/stripe-gateway.js';
import { MpesaGateway } from './payment-gateways/mpesa-gateway.js';
import { logger } from '../utils/logger.js';

export type GatewayType = 'PAYSTACK' | 'STRIPE' | 'PAYPAL' | 'MPESA';

export class PaymentGatewayManager {
  private gateways: Map<GatewayType, PaymentGateway> = new Map();

  constructor() {
    this.initializeGateways();
  }

  private initializeGateways(): void {
    // Initialize Paystack
    try {
      const paystackGateway = new PaystackGateway();
      if (paystackGateway.isConfigured()) {
        this.gateways.set('PAYSTACK', paystackGateway);
        logger.info('Paystack gateway initialized');
      } else {
        logger.warn('Paystack gateway not configured');
      }
    } catch (error) {
      logger.error('Failed to initialize Paystack gateway:', error);
    }

    // Initialize Stripe
    try {
      const stripeGateway = new StripeGateway();
      if (stripeGateway.isConfigured()) {
        this.gateways.set('STRIPE', stripeGateway);
        logger.info('Stripe gateway initialized');
      } else {
        logger.warn('Stripe gateway not configured');
      }
    } catch (error) {
      logger.error('Failed to initialize Stripe gateway:', error);
    }

    // Initialize M-Pesa
    try {
      const mpesaGateway = new MpesaGateway();
      if (mpesaGateway.isConfigured()) {
        this.gateways.set('MPESA', mpesaGateway);
        logger.info('M-Pesa gateway initialized');
      } else {
        logger.warn('M-Pesa gateway not configured');
      }
    } catch (error) {
      logger.error('Failed to initialize M-Pesa gateway:', error);
    }

    // PayPal will be added later
  }

  /**
   * Get a payment gateway by type
   */
  getGateway(type: GatewayType): PaymentGateway {
    const gateway = this.gateways.get(type);
    if (!gateway) {
      throw new Error(`Payment gateway ${type} is not available or not configured`);
    }
    return gateway;
  }

  /**
   * Get the default gateway (Paystack if available, otherwise first available)
   */
  getDefaultGateway(): PaymentGateway {
    // Prefer Paystack as default
    if (this.gateways.has('PAYSTACK')) {
      return this.gateways.get('PAYSTACK')!;
    }

    // Otherwise return first available gateway
    const firstGateway = this.gateways.values().next().value;
    if (!firstGateway) {
      throw new Error('No payment gateway is configured');
    }
    return firstGateway;
  }

  /**
   * Get all available gateways
   */
  getAvailableGateways(): GatewayType[] {
    return Array.from(this.gateways.keys());
  }

  /**
   * Check if a gateway is available
   */
  isGatewayAvailable(type: GatewayType): boolean {
    return this.gateways.has(type);
  }

  /**
   * Get gateway configuration status
   */
  getGatewayStatus(): Record<GatewayType, { available: boolean; configured: boolean }> {
    return {
      PAYSTACK: {
        available: this.gateways.has('PAYSTACK'),
        configured: this.gateways.has('PAYSTACK') && this.gateways.get('PAYSTACK')!.isConfigured(),
      },
      STRIPE: {
        available: this.gateways.has('STRIPE'),
        configured: this.gateways.has('STRIPE') && this.gateways.get('STRIPE')!.isConfigured(),
      },
      MPESA: {
        available: this.gateways.has('MPESA'),
        configured: this.gateways.has('MPESA') && this.gateways.get('MPESA')!.isConfigured(),
      },
      PAYPAL: {
        available: false,
        configured: false,
      },
    };
  }

  /**
   * Get M-Pesa gateway specifically (for STK Push operations)
   */
  getMpesaGateway(): MpesaGateway | null {
    const gateway = this.gateways.get('MPESA');
    return gateway ? (gateway as MpesaGateway) : null;
  }

  private getConfiguredSupportedCurrencies(type: GatewayType): string[] {
    const defaults: Record<GatewayType, string[]> = {
      PAYSTACK: ['NGN', 'GHS', 'USD', 'ZAR'],
      STRIPE: ['*'],
      MPESA: ['KES'],
      PAYPAL: [],
    };

    const envMap: Record<GatewayType, string | undefined> = {
      PAYSTACK: process.env.PAYSTACK_SUPPORTED_CURRENCIES,
      STRIPE: process.env.STRIPE_SUPPORTED_CURRENCIES,
      MPESA: process.env.MPESA_SUPPORTED_CURRENCIES,
      PAYPAL: process.env.PAYPAL_SUPPORTED_CURRENCIES,
    };

    const configured = envMap[type];
    if (!configured || configured.trim().length === 0) {
      return defaults[type];
    }

    return configured
      .split(',')
      .map(c => c.trim().toUpperCase())
      .filter(Boolean);
  }

  supportsCurrency(type: GatewayType, currency: string): boolean {
    const normalizedCurrency = currency.toUpperCase();
    const supported = this.getConfiguredSupportedCurrencies(type);
    return supported.includes('*') || supported.includes(normalizedCurrency);
  }

  resolveGatewayForCurrency(
    currency: string,
    options?: {
      preferredGateway?: GatewayType;
      excludeGateways?: GatewayType[];
    },
  ): GatewayType {
    const normalizedCurrency = currency.toUpperCase();
    const excluded = new Set(options?.excludeGateways || []);

    const canUse = (type: GatewayType) =>
      !excluded.has(type) && this.isGatewayAvailable(type) && this.supportsCurrency(type, normalizedCurrency);

    if (options?.preferredGateway && canUse(options.preferredGateway)) {
      return options.preferredGateway;
    }

    const configuredPriority = (process.env.PAYMENT_GATEWAY_PRIORITY || 'PAYSTACK,STRIPE,MPESA')
      .split(',')
      .map(g => g.trim().toUpperCase() as GatewayType)
      .filter((g): g is GatewayType => ['PAYSTACK', 'STRIPE', 'MPESA', 'PAYPAL'].includes(g));

    const priority: GatewayType[] = configuredPriority.length > 0 ? configuredPriority : ['PAYSTACK', 'STRIPE', 'MPESA'];

    for (const gatewayType of priority) {
      if (canUse(gatewayType)) {
        return gatewayType;
      }
    }

    throw new Error(
      `No configured payment gateway supports currency ${normalizedCurrency}. ` +
      'Configure PAYSTACK_SUPPORTED_CURRENCIES/STRIPE_SUPPORTED_CURRENCIES/MPESA_SUPPORTED_CURRENCIES or enable a compatible gateway.',
    );
  }

  /**
   * Get mobile money gateway for a specific country/currency
   */
  getMobileMoneyGateway(currency: string): PaymentGateway | null {
    // M-Pesa for Kenya (KES)
    if (currency === 'KES' && this.gateways.has('MPESA')) {
      return this.gateways.get('MPESA')!;
    }
    // Paystack for Nigeria (NGN) mobile money
    if (currency === 'NGN' && this.gateways.has('PAYSTACK')) {
      return this.gateways.get('PAYSTACK')!;
    }
    return null;
  }
}

// Singleton instance
let gatewayManagerInstance: PaymentGatewayManager | null = null;

export function getPaymentGatewayManager(): PaymentGatewayManager {
  if (!gatewayManagerInstance) {
    gatewayManagerInstance = new PaymentGatewayManager();
  }
  return gatewayManagerInstance;
}
