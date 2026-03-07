import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { SubscriptionTier } from '@prisma/client';

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

    // PREMIUM tier requires billing email (for future payment processing)
    if (newTier === SubscriptionTier.PREMIUM && !billingEmail) {
      throw new ValidationError('Billing email is required for Premium subscription');
    }

    const updated = await prisma.organizerSubscription.update({
      where: { organizerId },
      data: {
        tier: newTier,
        // STANDARD tier: Clear billing email (not needed for free tier)
        // PREMIUM tier: Require and set billing email
        billingEmail: newTier === SubscriptionTier.PREMIUM 
          ? billingEmail 
          : null,
        isActive: true,
        canceledAt: null,
        // Only PREMIUM has subscription dates (paid subscription)
        expiresAt: newTier === SubscriptionTier.PREMIUM
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : null,
        nextBillingDate: newTier === SubscriptionTier.PREMIUM
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

    if (subscription.tier !== SubscriptionTier.PREMIUM) {
      throw new ValidationError('Only Premium subscriptions can be canceled');
    }

    // Downgrade to STANDARD when Premium expires
    const updated = await prisma.organizerSubscription.update({
      where: { organizerId },
      data: {
        isActive: false,
        canceledAt: new Date(),
        // Keep expiresAt - subscription remains active until expiry
      },
    });

    logger.info(`Premium subscription canceled for organizer ${organizerId}`);
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
}

