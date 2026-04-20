import { prisma } from '../config/database.js';
import { UserRole, UserStatus, SubscriptionTier } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { hashPassword } from './password.js';
import { logger } from './logger.js';

const SUPERVISOR_CREDENTIALS = {
  email: 'vistracraft@gmail.com',
  password: 'Somepass123!',
  firstName: 'Vistra',
  lastName: 'Craft',
  role: UserRole.SUPERADMIN,
};

/**
 * Ensure super admin user exists in the database
 * Called automatically on server startup
 */
export const ensureSuperAdmin = async (): Promise<void> => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: SUPERVISOR_CREDENTIALS.email },
    });

    if (existingUser) {
      if (existingUser.role !== UserRole.SUPERADMIN) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: UserRole.SUPERADMIN,
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
          },
        });
        logger.info('Super admin role updated');
      }
      return;
    }

    const hashedPassword = await hashPassword(SUPERVISOR_CREDENTIALS.password);
    await prisma.user.create({
      data: {
        email: SUPERVISOR_CREDENTIALS.email,
        password: hashedPassword,
        firstName: SUPERVISOR_CREDENTIALS.firstName,
        lastName: SUPERVISOR_CREDENTIALS.lastName,
        role: SUPERVISOR_CREDENTIALS.role,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    logger.info('Super admin created');
  } catch (error) {
    logger.error('Failed to ensure super admin:', error);
  }
};

/**
 * Ensure default subscription plans exist in the database
 * Called automatically on server startup
 */
export const ensureSubscriptionPlans = async (): Promise<void> => {
  try {
    const plans = [
      {
        tier: SubscriptionTier.BASIC,
        name: 'Basic',
        description: 'Free tier with aggregated data only. Perfect for getting started.',
        price: new Decimal(0),
        currency: 'USD',
        features: [] as string[],
      },
      {
        tier: SubscriptionTier.STANDARD,
        name: 'Standard',
        description: 'Free tier with basic attendee data and consent-based access.',
        price: new Decimal(0),
        currency: 'USD',
        features: ['attendee_list', 'export'],
      },
      {
        tier: SubscriptionTier.PREMIUM,
        name: 'Premium',
        description: 'Full access to advanced analytics, demographics, and data export.',
        price: new Decimal(10),
        currency: 'USD',
        features: ['attendee_list', 'export', 'demographics', 'analytics', 'advanced_export'],
      },
    ];

    for (const plan of plans) {
      await prisma.subscriptionPlan.upsert({
        where: { tier: plan.tier },
        create: plan,
        update: {
          name: plan.name,
          description: plan.description,
          price: plan.price,
          currency: plan.currency,
          features: plan.features,
        },
      });
    }

    logger.info('Subscription plans ready (BASIC, STANDARD, PREMIUM)');
  } catch (error) {
    logger.error('Failed to ensure subscription plans:', error);
  }
};
