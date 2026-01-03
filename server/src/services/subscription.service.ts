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
   * Check if organizer has access to a feature based on tier
   */
  static async hasFeatureAccess(
    organizerId: string,
    feature: 'attendee_list' | 'export' | 'demographics' | 'analytics' | 'advanced_export',
  ): Promise<boolean> {
    const subscription = await this.getSubscription(organizerId);

    switch (feature) {
    case 'attendee_list':
      // STANDARD and PREMIUM have access
      return subscription.tier === SubscriptionTier.STANDARD || 
               subscription.tier === SubscriptionTier.PREMIUM;

    case 'export':
      // STANDARD and PREMIUM have access
      return subscription.tier === SubscriptionTier.STANDARD || 
               subscription.tier === SubscriptionTier.PREMIUM;

    case 'demographics':
    case 'analytics':
    case 'advanced_export':
      // Only PREMIUM has access
      return subscription.tier === SubscriptionTier.PREMIUM;

    default:
      return false;
    }
  }

  /**
   * Get subscription tier for organizer
   */
  static async getTier(organizerId: string): Promise<SubscriptionTier> {
    const subscription = await this.getSubscription(organizerId);
    return subscription.tier;
  }
}

