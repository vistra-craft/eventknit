import { PaymentGateway } from './payment-gateway.interface.js';
import { PaystackGateway } from './payment-gateways/paystack-gateway.js';
import { StripeGateway } from './payment-gateways/stripe-gateway.js';
import { logger } from '../utils/logger.js';

export type GatewayType = 'PAYSTACK' | 'STRIPE' | 'PAYPAL';

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
      PAYPAL: {
        available: false,
        configured: false,
      },
    };
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
