import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { SubscriptionTier, Prisma } from '@prisma/client';
import { getPaymentGatewayManager } from './payment-gateway-manager.js';

export interface CreateSubscriptionData {
  tier: SubscriptionTier;
  billingEmail?: string;
}

export interface UpdateSubscriptionData {
  tier?: SubscriptionTier;
  billingEmail?: string;
  isActive?: boolean;
}

export class SubscriptionService {
  /**
   * Get organizer subscription (or create default BASIC if doesn't exist)
   */
  static async getSubscription(organizerId: string) {
    let subscription = await prisma.organizerSubscription.findUnique({
      where: { organizerId },
    });

    // Create default BASIC subscription if doesn't exist
    if (!subscription) {
      subscription = await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.BASIC,
          isActive: true,
        },
      });
    }

    return subscription;
  }

  /**
   * Create or update subscription
   */
  static async upsertSubscription(
    organizerId: string,
    data: CreateSubscriptionData,
  ) {
    // Verify organizer exists
    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
    });

    if (!organizer) {
      throw new NotFoundError('Organizer not found');
    }

    // Check if subscription exists
    const existing = await prisma.organizerSubscription.findUnique({
      where: { organizerId },
    });

    if (existing) {
      // Update existing subscription
      const updated = await prisma.organizerSubscription.update({
        where: { organizerId },
        data: {
          tier: data.tier,
          billingEmail: data.billingEmail ?? existing.billingEmail,
          isActive: true,
          canceledAt: null,
          expiresAt: data.tier === SubscriptionTier.PREMIUM 
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            : null,
          nextBillingDate: data.tier === SubscriptionTier.PREMIUM
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            : null,
        },
      });

      logger.info(`Subscription updated for organizer ${organizerId} to tier ${data.tier}`);
      return updated;
    }

    // Create new subscription
    const subscription = await prisma.organizerSubscription.create({
      data: {
        organizerId,
        tier: data.tier,
        billingEmail: data.billingEmail,
        isActive: true,
        expiresAt: data.tier === SubscriptionTier.PREMIUM
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          : null,
        nextBillingDate: data.tier === SubscriptionTier.PREMIUM
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : null,
      },
    });

    logger.info(`Subscription created for organizer ${organizerId} with tier ${data.tier}`);
    return subscription;
  }

  /**
   * Upgrade subscription tier
   */
  static async upgradeSubscription(
    organizerId: string,
    newTier: SubscriptionTier,
    billingEmail?: string,
  ) {
    const subscription = await this.getSubscription(organizerId);

    // Check if upgrade is valid
    const tierOrder = {
      [SubscriptionTier.BASIC]: 0,
      [SubscriptionTier.STANDARD]: 1,
      [SubscriptionTier.PREMIUM]: 2,
    };

    if (tierOrder[newTier] <= tierOrder[subscription.tier]) {
      throw new ValidationError(`Cannot upgrade to ${newTier}. Current tier is ${subscription.tier}`);
    }

    // Check plan price to determine if this is a paid tier
    const plan = await prisma.subscriptionPlan.findUnique({ where: { tier: newTier } });
    const isPaid = plan ? Number(plan.price) > 0 : false;

    // Paid tiers require billing email
    if (isPaid && !billingEmail) {
      throw new ValidationError(`Billing email is required for ${newTier} subscription`);
    }

    const updated = await prisma.organizerSubscription.update({
      where: { organizerId },
      data: {
        tier: newTier,
        billingEmail: isPaid ? billingEmail : null,
        isActive: true,
        canceledAt: null,
        // Only paid tiers have subscription dates
        expiresAt: isPaid
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : null,
        nextBillingDate: isPaid
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : null,
      },
    });

    logger.info(`Subscription upgraded for organizer ${organizerId} from ${subscription.tier} to ${newTier}`);
    return updated;
  }

  /**
   * Downgrade subscription tier
   */
  static async downgradeSubscription(
    organizerId: string,
    newTier: SubscriptionTier,
  ) {
    const subscription = await this.getSubscription(organizerId);

    // Check if downgrade is valid
    const tierOrder = {
      [SubscriptionTier.BASIC]: 0,
      [SubscriptionTier.STANDARD]: 1,
      [SubscriptionTier.PREMIUM]: 2,
    };

    if (tierOrder[newTier] >= tierOrder[subscription.tier]) {
      throw new ValidationError(`Cannot downgrade to ${newTier}. Current tier is ${subscription.tier}`);
    }

    const updated = await prisma.organizerSubscription.update({
      where: { organizerId },
      data: {
        tier: newTier,
        isActive: newTier !== SubscriptionTier.PREMIUM ? true : subscription.isActive,
        expiresAt: newTier === SubscriptionTier.PREMIUM ? subscription.expiresAt : null,
        nextBillingDate: newTier === SubscriptionTier.PREMIUM ? subscription.nextBillingDate : null,
      },
    });

    logger.info(`Subscription downgraded for organizer ${organizerId} from ${subscription.tier} to ${newTier}`);
    return updated;
  }

  /**
   * Cancel Premium subscription
   */
  static async cancelSubscription(organizerId: string) {
    const subscription = await this.getSubscription(organizerId);

    // Check plan price — only paid subscriptions can be canceled
    const plan = await prisma.subscriptionPlan.findUnique({ where: { tier: subscription.tier } });
    const isPaid = plan ? Number(plan.price) > 0 : false;

    if (!isPaid) {
      throw new ValidationError('Only paid subscriptions can be canceled');
    }

    const updated = await prisma.organizerSubscription.update({
      where: { organizerId },
      data: {
        isActive: false,
        canceledAt: new Date(),
        // Keep expiresAt - subscription remains active until expiry
      },
    });

    logger.info(`Subscription canceled for organizer ${organizerId} (tier: ${subscription.tier})`);
    return updated;
  }

  /**
   * Get the effective tier for an organizer, considering active overrides.
   * Returns the higher of: organizer's subscription tier OR any active non-expired override tier.
   */
  static async getEffectiveTier(organizerId: string): Promise<SubscriptionTier> {
    const subscription = await this.getSubscription(organizerId);
    const baseTier = subscription.tier;

    const activeOverride = await prisma.subscriptionOverride.findFirst({
      where: {
        organizerId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeOverride) {
      return baseTier;
    }

    const tierOrder: Record<SubscriptionTier, number> = {
      [SubscriptionTier.BASIC]: 0,
      [SubscriptionTier.STANDARD]: 1,
      [SubscriptionTier.PREMIUM]: 2,
    };

    return tierOrder[activeOverride.tier] > tierOrder[baseTier]
      ? activeOverride.tier
      : baseTier;
  }

  /**
   * Check if organizer has access to a feature based on their effective tier.
   * Reads allowed features from the SubscriptionPlan table.
   */
  static async hasFeatureAccess(
    organizerId: string,
    feature: string,
  ): Promise<boolean> {
    const effectiveTier = await this.getEffectiveTier(organizerId);

    // Look up the plan from DB
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { tier: effectiveTier },
    });

    if (!plan) {
      // Fallback: no plan configured means no access
      logger.warn(`No SubscriptionPlan found for tier ${effectiveTier}`);
      return false;
    }

    return plan.features.includes(feature);
  }

  /**
   * Get subscription tier for organizer (base tier, no override)
   */
  static async getTier(organizerId: string): Promise<SubscriptionTier> {
    const subscription = await this.getSubscription(organizerId);
    return subscription.tier;
  }

  // ─── Plan management (admin) ──────────────────────────────────────────

  /**
   * Get all subscription plans
   */
  static async getPlans() {
    const [plans, subscriberCounts] = await Promise.all([
      prisma.subscriptionPlan.findMany({ orderBy: { tier: 'asc' } }),
      prisma.organizerSubscription.groupBy({
        by: ['tier'],
        where: { isActive: true },
        _count: { id: true },
      }),
    ]);

    const countByTier = Object.fromEntries(
      subscriberCounts.map(row => [row.tier, row._count.id]),
    );

    return plans.map(plan => ({
      ...plan,
      subscriberCount: countByTier[plan.tier] ?? 0,
    }));
  }

  /**
   * Update a subscription plan's pricing, description, or features
   */
  static async updatePlan(
    tier: SubscriptionTier,
    data: { price?: number; description?: string; features?: string[]; isActive?: boolean },
  ) {
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { tier },
    });

    if (!existing) {
      throw new NotFoundError(`Subscription plan for tier ${tier} not found`);
    }

    return prisma.subscriptionPlan.update({
      where: { tier },
      data: {
        ...(data.price !== undefined && { price: data.price }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.features !== undefined && { features: data.features }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  // ─── Override management (admin) ──────────────────────────────────────

  /**
   * Create a subscription override for an organizer
   */
  static async createOverride(
    organizerId: string,
    tier: SubscriptionTier,
    grantedBy: string,
    reason?: string,
    expiresAt?: Date,
  ) {
    // Verify organizer exists
    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
    });
    if (!organizer) {
      throw new NotFoundError('Organizer not found');
    }

    // Deactivate any existing active overrides for this organizer
    await prisma.subscriptionOverride.updateMany({
      where: { organizerId, isActive: true },
      data: { isActive: false },
    });

    const override = await prisma.subscriptionOverride.create({
      data: {
        organizerId,
        tier,
        reason,
        grantedBy,
        expiresAt: expiresAt ?? null,
        isActive: true,
      },
    });

    logger.info(`Subscription override created for organizer ${organizerId}: ${tier} by ${grantedBy}`);
    return override;
  }

  /**
   * Remove (deactivate) a subscription override
   */
  static async removeOverride(overrideId: string) {
    const override = await prisma.subscriptionOverride.findUnique({
      where: { id: overrideId },
    });

    if (!override) {
      throw new NotFoundError('Subscription override not found');
    }

    return prisma.subscriptionOverride.update({
      where: { id: overrideId },
      data: { isActive: false },
    });
  }

  /**
   * Get active overrides for an organizer
   */
  static async getOverridesForOrganizer(organizerId: string) {
    return prisma.subscriptionOverride.findMany({
      where: {
        organizerId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        grantedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a full subscription summary for an organizer (subscription + overrides + effective tier)
   */
  static async getOrganizerSubscriptionSummary(organizerId: string) {
    const subscription = await this.getSubscription(organizerId);
    const overrides = await this.getOverridesForOrganizer(organizerId);
    const effectiveTier = await this.getEffectiveTier(organizerId);

    return {
      subscription,
      overrides,
      effectiveTier,
    };
  }

  /**
   * Get only active subscription plans (for organizer-facing pages)
   */
  static async getActivePlans() {
    const [plans, subscriberCounts] = await Promise.all([
      prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { tier: 'asc' },
      }),
      prisma.organizerSubscription.groupBy({
        by: ['tier'],
        where: { isActive: true },
        _count: { id: true },
      }),
    ]);

    const countByTier = Object.fromEntries(
      subscriberCounts.map(row => [row.tier, row._count.id]),
    );

    return plans.map(plan => ({
      ...plan,
      subscriberCount: countByTier[plan.tier] ?? 0,
    }));
  }

  // ─── Subscription Payment ──────────────────────────────────────────────

  /**
   * Initialize a subscription payment via Paystack.
   * Creates a SubscriptionPayment record and returns the authorization URL.
   */
  static async initializeSubscriptionPayment(
    organizerId: string,
    tier: SubscriptionTier,
    billingEmail: string,
  ) {
    // Verify organizer exists
    const organizer = await prisma.user.findUnique({ where: { id: organizerId } });
    if (!organizer) throw new NotFoundError('Organizer not found');

    // Look up plan price from DB
    const plan = await prisma.subscriptionPlan.findUnique({ where: { tier } });
    if (!plan) throw new NotFoundError(`No subscription plan configured for tier ${tier}`);
    if (!plan.isActive) throw new ValidationError(`The ${tier} plan is not currently available`);

    const price = Number(plan.price);
    if (price <= 0) {
      throw new ValidationError(`${tier} is a free tier — no payment required`);
    }

    // Validate upgrade direction
    const subscription = await this.getSubscription(organizerId);
    const tierOrder: Record<SubscriptionTier, number> = {
      [SubscriptionTier.BASIC]: 0,
      [SubscriptionTier.STANDARD]: 1,
      [SubscriptionTier.PREMIUM]: 2,
    };
    if (tierOrder[tier] <= tierOrder[subscription.tier]) {
      throw new ValidationError(`Cannot upgrade to ${tier}. Current tier is ${subscription.tier}`);
    }

    // Generate unique reference with SUB- prefix for webhook routing
    const reference = `SUB-${organizerId.slice(0, 8)}-${Date.now()}`;
    const idempotencyKey = `sub-${organizerId}-${tier}-${Date.now()}`;

    // Create payment record
    const payment = await prisma.subscriptionPayment.create({
      data: {
        organizerId,
        tier,
        amount: new Prisma.Decimal(price),
        currency: plan.currency,
        gateway: 'PAYSTACK',
        gatewayReference: reference,
        status: 'PENDING',
        billingEmail,
        idempotencyKey,
      },
    });

    // Initialize with Paystack
    const gatewayManager = getPaymentGatewayManager();
    const gateway = gatewayManager.getDefaultGateway();

    const response = await gateway.initializePayment({
      amount: price,
      currency: plan.currency,
      email: billingEmail,
      reference,
      metadata: {
        type: 'subscription',
        organizerId,
        tier,
        paymentId: payment.id,
      },
      callbackUrl: `${config.frontend.url}/organizer/subscription?reference=${reference}`,
    });

    logger.info(`Subscription payment initialized: ${reference} for organizer ${organizerId}, tier ${tier}`);

    return {
      authorizationUrl: response.authorizationUrl,
      accessCode: response.accessCode,
      reference,
      paymentId: payment.id,
    };
  }

  /**
   * Handle successful subscription payment (called from webhook).
   * Upgrades the subscription and creates a PlatformIncome record.
   */
  static async handleSubscriptionPaymentSuccess(reference: string, gatewayTransactionId?: string) {
    const payment = await prisma.subscriptionPayment.findUnique({
      where: { gatewayReference: reference },
    });

    if (!payment) {
      logger.error(`Subscription payment not found for reference: ${reference}`);
      return;
    }

    if (payment.status === 'SUCCESS') {
      logger.warn(`Subscription payment already processed: ${reference}`);
      return;
    }

    const amount = Number(payment.amount);

    // Update payment record
    await prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS',
        gatewayTransactionId,
        paymentDate: new Date(),
      },
    });

    // Upgrade the organizer's subscription
    await prisma.organizerSubscription.upsert({
      where: { organizerId: payment.organizerId },
      update: {
        tier: payment.tier,
        billingEmail: payment.billingEmail,
        isActive: true,
        canceledAt: null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      create: {
        organizerId: payment.organizerId,
        tier: payment.tier,
        billingEmail: payment.billingEmail,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Auto-record as PlatformIncome so it shows on admin finance dashboard
    await prisma.platformIncome.create({
      data: {
        category: 'Subscription',
        description: `${payment.tier} subscription payment from organizer`,
        amount: new Prisma.Decimal(amount),
        currency: payment.currency,
        source: 'Subscription Payment',
        reference,
        paymentMethod: 'Paystack',
        incomeDate: new Date(),
        status: 'received',
      },
    });

    logger.info(`Subscription payment completed: ${reference}, tier ${payment.tier}, amount ${amount} ${payment.currency}`);
  }

  /**
   * Verify a subscription payment by reference (called from frontend callback).
   */
  static async verifySubscriptionPayment(reference: string) {
    const payment = await prisma.subscriptionPayment.findUnique({
      where: { gatewayReference: reference },
    });

    if (!payment) throw new NotFoundError('Subscription payment not found');

    // If already processed, return current state
    if (payment.status === 'SUCCESS') {
      const subscription = await this.getSubscription(payment.organizerId);
      return { status: 'SUCCESS', subscription };
    }

    // Verify with gateway
    const gatewayManager = getPaymentGatewayManager();
    const gateway = gatewayManager.getDefaultGateway();
    const verification = await gateway.verifyPayment({ reference });

    if (verification.success) {
      // Process the payment if webhook hasn't already
      await this.handleSubscriptionPaymentSuccess(reference, verification.gatewayTransactionId);
      const subscription = await this.getSubscription(payment.organizerId);
      return { status: 'SUCCESS', subscription };
    }

    // Payment failed
    await prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });

    return { status: 'FAILED', subscription: null };
  }
}

