import { prisma } from '../src/config/database.js';
import { SubscriptionService } from '../src/services/subscription.service.js';
import { UserRole, UserStatus, SubscriptionTier } from '@prisma/client';
import bcrypt from 'bcrypt';
import { cleanupTestData } from './test-helpers.js';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

describe('SubscriptionService', () => {
  let dbConnected = false;
  let organizerId: string;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch (_error) {
      console.warn('⚠️  Database not available. Tests will be skipped.');
      dbConnected = false;
    }
  });

  afterAll(async () => {
    if (dbConnected) {
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    if (!dbConnected) return;

    await prisma.$transaction(async (tx) => {
      await cleanupTestData(tx);
    });

    // Create organizer
    const organizerPassword = await hashPassword('Organizer123!@$');
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@subscription.test',
        password: organizerPassword,
        firstName: 'Event',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Test Events Inc',
      },
    });
    organizerId = organizer.id;
  });

  describe('getSubscription', () => {
    it('should create default BASIC subscription if does not exist', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const subscription = await SubscriptionService.getSubscription(organizerId);

      expect(subscription).toBeDefined();
      expect(subscription.tier).toBe(SubscriptionTier.BASIC);
      expect(subscription.isActive).toBe(true);
      expect(subscription.organizerId).toBe(organizerId);
    });

    it('should return existing subscription if it exists', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Create subscription first
      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.STANDARD,
          isActive: true,
        },
      });

      const subscription = await SubscriptionService.getSubscription(organizerId);

      expect(subscription.tier).toBe(SubscriptionTier.STANDARD);
    });
  });

  describe('upgradeSubscription', () => {
    it('should upgrade from BASIC to STANDARD (free)', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const subscription = await SubscriptionService.upgradeSubscription(
        organizerId,
        SubscriptionTier.STANDARD,
      );

      expect(subscription.tier).toBe(SubscriptionTier.STANDARD);
      expect(subscription.billingEmail).toBeNull();
      expect(subscription.expiresAt).toBeNull();
      expect(subscription.nextBillingDate).toBeNull();
    });

    it('should fail to upgrade to PREMIUM without billing email', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await expect(
        SubscriptionService.upgradeSubscription(
          organizerId,
          SubscriptionTier.PREMIUM,
        ),
      ).rejects.toThrow('Billing email is required for Premium subscription');
    });

    it('should fail if trying to downgrade', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Upgrade to STANDARD first
      await SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.STANDARD);

      // Try to "upgrade" to BASIC (should fail)
      await expect(
        SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.BASIC),
      ).rejects.toThrow('Cannot upgrade');
    });

    it('should fail if already at same or higher tier', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.STANDARD);

      // Try to upgrade to STANDARD again
      await expect(
        SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.STANDARD),
      ).rejects.toThrow('Cannot upgrade');
    });
  });

  describe('downgradeSubscription', () => {
    it('should downgrade from STANDARD to BASIC', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Upgrade to STANDARD first
      await SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.STANDARD);

      // Downgrade to BASIC
      const subscription = await SubscriptionService.downgradeSubscription(
        organizerId,
        SubscriptionTier.BASIC,
      );

      expect(subscription.tier).toBe(SubscriptionTier.BASIC);
    });

    it('should fail if trying to upgrade via downgrade', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await expect(
        SubscriptionService.downgradeSubscription(organizerId, SubscriptionTier.STANDARD),
      ).rejects.toThrow('Cannot downgrade');
    });
  });

  describe('cancelSubscription', () => {
    beforeEach(async () => {
      if (!dbConnected) return;
      // Create PREMIUM subscription
      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.PREMIUM,
          isActive: true,
          billingEmail: 'billing@test.com',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    });

    it('should cancel Premium subscription', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const subscription = await SubscriptionService.cancelSubscription(organizerId);

      expect(subscription.isActive).toBe(false);
      expect(subscription.canceledAt).toBeDefined();
      expect(subscription.expiresAt).toBeDefined(); // Should remain until expiry
    });

    it('should fail to cancel non-Premium subscription', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Set to STANDARD
      await prisma.organizerSubscription.update({
        where: { organizerId },
        data: { tier: SubscriptionTier.STANDARD },
      });

      await expect(
        SubscriptionService.cancelSubscription(organizerId),
      ).rejects.toThrow('Only Premium subscriptions can be canceled');
    });
  });

  describe('hasFeatureAccess', () => {
    it('should return false for attendee_list on BASIC tier', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const hasAccess = await SubscriptionService.hasFeatureAccess(organizerId, 'attendee_list');
      expect(hasAccess).toBe(false);
    });

    it('should return true for attendee_list on STANDARD tier', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.STANDARD);

      const hasAccess = await SubscriptionService.hasFeatureAccess(organizerId, 'attendee_list');
      expect(hasAccess).toBe(true);
    });

    it('should return false for demographics on STANDARD tier', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.STANDARD);

      const hasAccess = await SubscriptionService.hasFeatureAccess(organizerId, 'demographics');
      expect(hasAccess).toBe(false);
    });

    it('should return true for demographics on PREMIUM tier', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      // Create PREMIUM subscription directly (bypassing payment for test)
      await prisma.organizerSubscription.create({
        data: {
          organizerId,
          tier: SubscriptionTier.PREMIUM,
          isActive: true,
          billingEmail: 'billing@test.com',
        },
      });

      const hasAccess = await SubscriptionService.hasFeatureAccess(organizerId, 'demographics');
      expect(hasAccess).toBe(true);
    });
  });

  describe('getTier', () => {
    it('should return BASIC tier by default', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      const tier = await SubscriptionService.getTier(organizerId);
      expect(tier).toBe(SubscriptionTier.BASIC);
    });

    it('should return correct tier after upgrade', async () => {
      if (!dbConnected) {
        console.log('⏭️  Skipping test - database not connected');
        return;
      }

      await SubscriptionService.upgradeSubscription(organizerId, SubscriptionTier.STANDARD);

      const tier = await SubscriptionService.getTier(organizerId);
      expect(tier).toBe(SubscriptionTier.STANDARD);
    });
  });
});

